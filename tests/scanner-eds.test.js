import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scanEds, isElementVisible, hasVisibleContent } from '../src/scanner-eds.js';

// ---------------------------------------------------------------------------
// Helpers: jsdom has no layout engine, so we mock dimensions and styles.
// ---------------------------------------------------------------------------

/**
 * Make an element appear "visible" to the scanner by giving it real dimensions
 * and a default computed style.
 */
function makeVisible(el, overrides = {}) {
  const rect = { top: 0, left: 0, width: 100, height: 50, right: 100, bottom: 50, ...overrides };
  el.getBoundingClientRect = () => rect;
}

/**
 * Make an element appear invisible (zero dimensions).
 */
function makeInvisible(el) {
  el.getBoundingClientRect = () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 });
}

/**
 * Override getComputedStyle for a specific element by merging overrides
 * onto the real computed style.
 */
function mockComputedStyle(el, overrides) {
  const original = window.getComputedStyle;
  const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
    if (target === el) {
      const base = original.call(window, target);
      return new Proxy(base, {
        get(obj, prop) {
          if (prop in overrides) return overrides[prop];
          return obj[prop];
        },
      });
    }
    return original.call(window, target);
  });
  return spy;
}

/**
 * Build a simple DOM tree inside the provided root element.
 * Assigns visible dimensions to all created elements by default.
 */
function createBlock(root, name, content = '') {
  const el = document.createElement('div');
  el.setAttribute('data-block-name', name);
  if (content) el.textContent = content;
  makeVisible(el);
  root.appendChild(el);
  return el;
}

function createSlot(parent, name, { useKey = false } = {}) {
  const el = document.createElement('div');
  if (useKey) {
    el.setAttribute('data-slot-key', name);
  } else {
    el.setAttribute('data-slot', name);
  }
  el.textContent = name; // Give it content so hasVisibleContent passes
  makeVisible(el);
  parent.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('scanEds', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'test-root';
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Detects blocks by [data-block-name] attribute
  // -----------------------------------------------------------------------
  it('should detect blocks by data-block-name attribute', () => {
    createBlock(root, 'hero', 'Hero content');
    createBlock(root, 'cards', 'Cards content');

    const result = scanEds(root);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].name).toBe('hero');
    expect(result.blocks[1].name).toBe('cards');
    expect(result.counts.blocks).toBe(2);
  });

  // -----------------------------------------------------------------------
  // 2. Detects slots by [data-slot] attribute
  // -----------------------------------------------------------------------
  it('should detect slots by data-slot attribute', () => {
    const block = createBlock(root, 'hero', '');
    createSlot(block, 'Main');

    const result = scanEds(root);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].slots).toHaveLength(1);
    expect(result.blocks[0].slots[0].name).toBe('Main');
    expect(result.counts.slots).toBe(1);
  });

  // -----------------------------------------------------------------------
  // 3. Detects slots by [data-slot-key] attribute
  // -----------------------------------------------------------------------
  it('should detect slots by data-slot-key attribute', () => {
    const block = createBlock(root, 'hero');
    createSlot(block, 'ProductTitle', { useKey: true });

    const result = scanEds(root);

    expect(result.blocks[0].slots).toHaveLength(1);
    expect(result.blocks[0].slots[0].name).toBe('ProductTitle');
  });

  // -----------------------------------------------------------------------
  // 4. Builds hierarchical tree (block -> slot -> nested slot)
  // -----------------------------------------------------------------------
  it('should build hierarchical tree with nested slots', () => {
    const block = createBlock(root, 'product-details');
    const outerSlot = createSlot(block, 'Content');
    const innerSlot = createSlot(outerSlot, 'Description');

    const result = scanEds(root);

    expect(result.blocks).toHaveLength(1);
    const blockNode = result.blocks[0];
    expect(blockNode.slots).toHaveLength(1);
    expect(blockNode.slots[0].name).toBe('Content');
    expect(blockNode.slots[0].childSlots).toHaveLength(1);
    expect(blockNode.slots[0].childSlots[0].name).toBe('Description');
  });

  // -----------------------------------------------------------------------
  // 5. Handles blocks nested inside slots
  // -----------------------------------------------------------------------
  it('should handle blocks nested inside slots', () => {
    const outerBlock = createBlock(root, 'layout');
    const slot = createSlot(outerBlock, 'Main');
    const innerBlock = createBlock(slot, 'hero', 'Nested hero');

    const result = scanEds(root);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].name).toBe('layout');
    expect(result.blocks[0].slots).toHaveLength(1);
    expect(result.blocks[0].slots[0].children).toHaveLength(1);
    expect(result.blocks[0].slots[0].children[0].name).toBe('hero');
  });

  // -----------------------------------------------------------------------
  // 6. Groups standalone slots under synthetic container
  // -----------------------------------------------------------------------
  it('should group standalone slots under synthetic container block', () => {
    // Standalone slot (outside any block)
    createSlot(root, 'OrphanSlot');

    const result = scanEds(root);

    // Should have one synthetic "Standalone Slots" block
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].name).toBe('Standalone Slots');
    expect(result.blocks[0].slots).toHaveLength(1);
    expect(result.blocks[0].slots[0].name).toBe('OrphanSlot');
  });

  // -----------------------------------------------------------------------
  // 7. Filters invisible elements (display:none)
  // -----------------------------------------------------------------------
  it('should filter out elements with display:none', () => {
    const visibleBlock = createBlock(root, 'visible', 'I am visible');
    const hiddenBlock = createBlock(root, 'hidden', 'I am hidden');

    // Mock getComputedStyle to return display:none for the hidden block
    const originalGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const base = originalGetComputedStyle.call(window, el);
      if (el === hiddenBlock) {
        return new Proxy(base, {
          get(obj, prop) {
            if (prop === 'display') return 'none';
            return obj[prop];
          },
        });
      }
      return base;
    });

    const result = scanEds(root);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].name).toBe('visible');
  });

  // -----------------------------------------------------------------------
  // 8. Filters zero-dimension elements
  // -----------------------------------------------------------------------
  it('should filter out elements with zero dimensions', () => {
    const visibleBlock = createBlock(root, 'visible', 'Content');
    const zeroDimBlock = createBlock(root, 'zero-dim', 'But zero size');
    makeInvisible(zeroDimBlock);

    const result = scanEds(root);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].name).toBe('visible');
  });

  // -----------------------------------------------------------------------
  // 9. Shows empty slots when showEmptySlots=true
  // -----------------------------------------------------------------------
  it('should show all elements when showEmptySlots is true', () => {
    const visibleBlock = createBlock(root, 'visible', 'Content');
    const hiddenBlock = createBlock(root, 'hidden');
    makeInvisible(hiddenBlock);

    const result = scanEds(root, { showEmptySlots: true });

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks.map(b => b.name)).toContain('visible');
    expect(result.blocks.map(b => b.name)).toContain('hidden');
  });

  // -----------------------------------------------------------------------
  // 10. Always shows header/footer blocks with dimensions
  // -----------------------------------------------------------------------
  it('should always show header/footer blocks if they have any dimension', () => {
    // Header with dimensions but no visible content
    const header = createBlock(root, 'header');
    header.textContent = ''; // No text content
    makeVisible(header, { width: 100, height: 10 });

    // A regular block with no content and dimensions - should be filtered
    const emptyBlock = createBlock(root, 'empty-block');
    emptyBlock.textContent = '';
    makeVisible(emptyBlock, { width: 100, height: 10 });

    const result = scanEds(root);

    const blockNames = result.blocks.map(b => b.name);
    expect(blockNames).toContain('header');
    // empty-block has no visible content, so it should be filtered
    expect(blockNames).not.toContain('empty-block');
  });

  // -----------------------------------------------------------------------
  // 11. Preserves DOM order
  // -----------------------------------------------------------------------
  it('should preserve DOM order for blocks and slots', () => {
    createBlock(root, 'alpha', 'First');
    createBlock(root, 'beta', 'Second');
    createBlock(root, 'gamma', 'Third');

    const result = scanEds(root);

    expect(result.blocks[0].name).toBe('alpha');
    expect(result.blocks[1].name).toBe('beta');
    expect(result.blocks[2].name).toBe('gamma');
  });

  // -----------------------------------------------------------------------
  // 12. Assigns sequential IDs correctly
  // -----------------------------------------------------------------------
  it('should assign sequential IDs to blocks and slots', () => {
    const block1 = createBlock(root, 'hero', 'Hero');
    createSlot(block1, 'HeroSlot');
    const block2 = createBlock(root, 'cards', 'Cards');
    createSlot(block2, 'CardsSlot');

    const result = scanEds(root);

    expect(result.blocks[0].id).toBe('block-0');
    expect(result.blocks[0].slots[0].id).toBe('slot-0');
    expect(result.blocks[1].id).toBe('block-1');
    expect(result.blocks[1].slots[0].id).toBe('slot-1');
  });

  // -----------------------------------------------------------------------
  // 13. Handles empty page (no blocks/slots)
  // -----------------------------------------------------------------------
  it('should handle empty page with no blocks or slots', () => {
    const result = scanEds(root);

    expect(result.blocks).toHaveLength(0);
    expect(result.standaloneSlots).toHaveLength(0);
    expect(result.counts.blocks).toBe(0);
    expect(result.counts.slots).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isElementVisible
// ---------------------------------------------------------------------------

describe('isElementVisible', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
    vi.restoreAllMocks();
  });

  it('should return true for visible element with content', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello';
    makeVisible(el);
    root.appendChild(el);

    expect(isElementVisible(el)).toBe(true);
  });

  it('should return false for visibility:hidden element', () => {
    const el = document.createElement('div');
    el.textContent = 'Hidden';
    makeVisible(el);
    root.appendChild(el);

    const originalGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
      const base = originalGetComputedStyle.call(window, target);
      if (target === el) {
        return new Proxy(base, {
          get(obj, prop) {
            if (prop === 'visibility') return 'hidden';
            return obj[prop];
          },
        });
      }
      return base;
    });

    expect(isElementVisible(el)).toBe(false);
  });

  it('should return false for opacity:0 element', () => {
    const el = document.createElement('div');
    el.textContent = 'Transparent';
    makeVisible(el);
    root.appendChild(el);

    const originalGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
      const base = originalGetComputedStyle.call(window, target);
      if (target === el) {
        return new Proxy(base, {
          get(obj, prop) {
            if (prop === 'opacity') return '0';
            return obj[prop];
          },
        });
      }
      return base;
    });

    expect(isElementVisible(el)).toBe(false);
  });

  it('should return true for header block with dimensions but no content', () => {
    const el = document.createElement('div');
    makeVisible(el, { width: 200, height: 30 });
    root.appendChild(el);

    expect(isElementVisible(el, 'header')).toBe(true);
  });

  it('should bypass all checks when showEmptySlots is true', () => {
    const el = document.createElement('div');
    makeInvisible(el);
    root.appendChild(el);

    expect(isElementVisible(el, null, true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasVisibleContent
// ---------------------------------------------------------------------------

describe('hasVisibleContent', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
    vi.restoreAllMocks();
  });

  it('should return true for element with text content', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello world';
    root.appendChild(el);

    expect(hasVisibleContent(el)).toBe(true);
  });

  it('should return true for element with img child', () => {
    const el = document.createElement('div');
    const img = document.createElement('img');
    img.src = 'test.jpg';
    el.appendChild(img);
    root.appendChild(el);

    expect(hasVisibleContent(el)).toBe(true);
  });

  it('should return true for element with form elements', () => {
    const el = document.createElement('div');
    const input = document.createElement('input');
    el.appendChild(input);
    root.appendChild(el);

    expect(hasVisibleContent(el)).toBe(true);
  });

  it('should return false for empty element with no content', () => {
    const el = document.createElement('div');
    root.appendChild(el);

    expect(hasVisibleContent(el)).toBe(false);
  });
});
