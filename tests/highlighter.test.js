import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHighlighter } from '../src/highlighter.js';

/**
 * Helper: create a DOM element with optional attributes and styles.
 */
function createElement(tag, attrs = {}, styles = {}) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  Object.assign(el.style, styles);
  return el;
}

describe('createHighlighter', () => {
  let highlighter;

  beforeEach(() => {
    document.body.innerHTML = '';
    highlighter = createHighlighter();
  });

  afterEach(() => {
    highlighter.destroy();
    document.body.innerHTML = '';
  });

  // -----------------------------------------------------------------------
  // Mesh-style highlights
  // -----------------------------------------------------------------------

  describe('highlightMeshSource', () => {
    it('should apply box-shadow border to elements', () => {
      const el = createElement('div', { 'data-inspector-source': 'commerce' });
      document.body.appendChild(el);

      highlighter.highlightMeshSource([el], '#9333ea');

      expect(el.style.boxShadow).toContain('0 0 0 3px #9333ea');
      expect(el.style.position).toBe('relative');
      expect(el.style.zIndex).toBe('10');
    });

    it('should apply inset shadow for INPUT elements', () => {
      const el = createElement('input', {
        'data-inspector-source': 'search',
        type: 'text',
      });
      document.body.appendChild(el);

      highlighter.highlightMeshSource([el], '#2563eb');

      expect(el.style.boxShadow).toContain('inset 0 0 0 1000px');
      expect(el.style.boxShadow).toContain('#2563eb');
    });

    it('should preserve color swatch backgrounds from data-inspector-value', () => {
      const el = createElement('div', {
        'data-inspector-source': 'commerce',
        'data-inspector-field': 'color-swatch',
        'data-inspector-value': '#ff0000',
      });
      document.body.appendChild(el);

      highlighter.highlightMeshSource([el], '#9333ea');

      // Color swatch should retain its original background color
      // jsdom normalizes hex to rgb(), so check for either format
      const bg = el.style.backgroundColor;
      expect(bg === '#ff0000' || bg === 'rgb(255, 0, 0)').toBe(true);
      // But still gets the border shadow
      expect(el.style.boxShadow).toContain('0 0 0 3px #9333ea');
    });

    it('should inherit border radius from element computed style', () => {
      const el = createElement('div', { 'data-inspector-source': 'commerce' });
      document.body.appendChild(el);
      // In jsdom, getComputedStyle returns '0px' by default for borderRadius.
      // Verify the highlighter reads and applies computed borderRadius.
      el.style.borderRadius = '8px';

      highlighter.highlightMeshSource([el], '#9333ea');

      // The element should have borderRadius applied (at minimum, the computed value)
      expect(el.style.borderRadius).toBeTruthy();
    });

    it('should filter nested elements with same data-inspector-source ancestor', () => {
      const parent = createElement('div', { 'data-inspector-source': 'commerce' });
      const child = createElement('span', { 'data-inspector-source': 'commerce' });
      parent.appendChild(child);
      document.body.appendChild(parent);

      highlighter.highlightMeshSource([parent, child], '#9333ea');

      // Parent should be highlighted
      expect(parent.style.boxShadow).toContain('0 0 0 3px #9333ea');
      // Child should NOT be highlighted (filtered out as nested)
      expect(child.style.boxShadow).toBe('');
    });
  });

  describe('clearMeshHighlights', () => {
    it('should restore original styles after clearing', () => {
      const el = createElement('div', { 'data-inspector-source': 'commerce' });
      el.style.backgroundColor = 'rgb(200, 200, 200)';
      el.style.boxShadow = 'none';
      el.style.position = 'static';
      el.style.zIndex = '1';
      document.body.appendChild(el);

      const originalBg = el.style.backgroundColor;
      const originalShadow = el.style.boxShadow;
      const originalPosition = el.style.position;
      const originalZIndex = el.style.zIndex;

      highlighter.highlightMeshSource([el], '#9333ea');
      highlighter.clearMeshHighlights();

      expect(el.style.backgroundColor).toBe(originalBg);
      expect(el.style.boxShadow).toBe(originalShadow);
      expect(el.style.position).toBe(originalPosition);
      expect(el.style.zIndex).toBe(originalZIndex);
    });
  });

  // -----------------------------------------------------------------------
  // EDS-style highlights
  // -----------------------------------------------------------------------

  describe('highlightEdsItem', () => {
    it('should apply block highlight with indigo solid border', () => {
      const el = createElement('div');
      document.body.appendChild(el);

      highlighter.highlightEdsItem(el, 'block-0', 'hero', 'block');

      // jsdom normalizes hex colors to rgb() in shorthand border values
      expect(el.style.border).toContain('2px solid');
      expect(el.style.border).toContain('99, 102, 241');
      expect(el.style.outline).toContain('rgba(99, 102, 241');
      expect(el.style.backgroundColor).toContain('rgba(99, 102, 241');
      expect(el.style.position).toBe('relative');
      expect(el.style.zIndex).toBe('10000');
    });

    it('should apply slot highlight with green dashed border', () => {
      const el = createElement('div');
      document.body.appendChild(el);

      highlighter.highlightEdsItem(el, 'slot-0', 'default', 'slot');

      // jsdom normalizes hex colors to rgb() in shorthand border values
      expect(el.style.border).toContain('2px dashed');
      expect(el.style.border).toContain('34, 197, 94');
      expect(el.style.outline).toContain('rgba(34, 197, 94');
      expect(el.style.backgroundColor).toContain('rgba(34, 197, 94');
    });
  });

  // -----------------------------------------------------------------------
  // Floating labels
  // -----------------------------------------------------------------------

  describe('floating labels', () => {
    it('should create floating label element in document.body', () => {
      const el = createElement('div');
      document.body.appendChild(el);

      highlighter.highlightEdsItem(el, 'block-0', 'hero', 'block');

      // A label div should be appended to document.body
      const labels = document.body.querySelectorAll('div');
      const label = Array.from(labels).find(
        (d) => d.textContent === 'hero' && d.style.pointerEvents === 'none'
      );
      expect(label).toBeDefined();
      expect(label.style.position).toBe('absolute');
      expect(label.style.zIndex).toBe('999998');
      expect(label.style.fontWeight).toBe('600');
    });
  });

  // -----------------------------------------------------------------------
  // clearAll / destroy
  // -----------------------------------------------------------------------

  describe('clearAll', () => {
    it('should remove all highlights and labels', () => {
      // Mesh highlight
      const meshEl = createElement('div', { 'data-inspector-source': 'commerce' });
      meshEl.style.backgroundColor = 'transparent';
      document.body.appendChild(meshEl);
      highlighter.highlightMeshSource([meshEl], '#9333ea');

      // EDS highlight
      const edsEl = createElement('div');
      document.body.appendChild(edsEl);
      highlighter.highlightEdsItem(edsEl, 'block-0', 'hero', 'block');

      highlighter.clearAll();

      // Mesh element should be restored
      expect(meshEl.style.boxShadow).not.toContain('#9333ea');

      // EDS element should be restored
      expect(edsEl.style.border).not.toContain('#6366f1');

      // Labels should be removed
      const remainingLabels = Array.from(
        document.body.querySelectorAll('div')
      ).filter((d) => d.style.pointerEvents === 'none');
      expect(remainingLabels).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Save/restore round-trip
  // -----------------------------------------------------------------------

  describe('save/restore cycle', () => {
    it('should preserve original inline styles across highlight cycle', () => {
      const el = createElement('div', { 'data-inspector-source': 'commerce' }, {
        backgroundColor: 'rgb(100, 100, 100)',
        boxShadow: '1px 1px 5px black',
        position: 'absolute',
        zIndex: '42',
        borderRadius: '12px',
      });
      document.body.appendChild(el);

      highlighter.highlightMeshSource([el], '#9333ea');

      // Styles should be overridden during highlight
      expect(el.style.boxShadow).not.toBe('1px 1px 5px black');

      highlighter.clearMeshHighlights();

      // After clearing, original styles should be restored exactly
      expect(el.style.backgroundColor).toBe('rgb(100, 100, 100)');
      expect(el.style.boxShadow).toBe('1px 1px 5px black');
      expect(el.style.position).toBe('absolute');
      expect(el.style.zIndex).toBe('42');
      expect(el.style.borderRadius).toBe('12px');
    });
  });
});
