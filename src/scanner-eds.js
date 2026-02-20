/**
 * EDS Block/Slot Scanner
 *
 * Detects and builds a hierarchical tree of EDS blocks ([data-block-name])
 * and Commerce dropin slots ([data-slot], [data-slot-key]).
 *
 * Ported from dropin-inspector-chrome-extension content.js (lines 290-611).
 */

const SLOT_SELECTOR = '[data-slot], [data-slot-key]';

// ---------------------------------------------------------------------------
// Visibility helpers (exported for direct testing)
// ---------------------------------------------------------------------------

/**
 * Check whether an element has meaningful visible content:
 * text, images, SVGs, videos, canvas, iframe, form elements, or
 * background images.
 */
export function hasVisibleContent(el) {
  const textContent = el.textContent?.trim();
  if (textContent && textContent.length > 0) return true;

  if (el.querySelector('img, svg, video, canvas, iframe')) return true;
  if (el.querySelector('input, button, select, textarea')) return true;

  const style = window.getComputedStyle(el);
  if (style.backgroundImage && style.backgroundImage !== 'none') return true;

  const children = el.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childRect = child.getBoundingClientRect();
    if (childRect.width > 0 && childRect.height > 0) {
      const childStyle = window.getComputedStyle(child);
      if (
        childStyle.display !== 'none' &&
        childStyle.visibility !== 'hidden' &&
        childStyle.opacity !== '0'
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check whether an element is visible.
 *
 * @param {HTMLElement} el - Element to check
 * @param {string|null} blockName - Block name (enables header/footer exception)
 * @param {boolean} showEmptySlots - When true, bypass all visibility checks
 * @returns {boolean}
 */
export function isElementVisible(el, blockName = null, showEmptySlots = false) {
  if (showEmptySlots) return true;

  const style = window.getComputedStyle(el);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (style.opacity === '0') return false;

  const rect = el.getBoundingClientRect();

  // Header/footer blocks are always shown if they have any dimension
  if (blockName) {
    const name = blockName.toLowerCase();
    if (
      name === 'header' || name === 'footer' ||
      name.includes('header') || name.includes('footer')
    ) {
      return rect.height > 0 || rect.width > 0;
    }
  }

  if (rect.height === 0) return false;
  if (rect.width === 0) return false;

  if (!hasVisibleContent(el)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/** Compare two elements by DOM order. Negative = a before b. */
function compareDomOrder(a, b) {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

/** Walk up DOM to find nearest ancestor with [data-block-name]. */
function getDirectParentBlock(el) {
  let parent = el.parentElement;
  while (parent) {
    if (parent.hasAttribute && parent.hasAttribute('data-block-name')) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/** Walk up DOM to find nearest slot ancestor within a given block boundary. */
function getDirectParentSlot(el, withinBlock) {
  let parent = el.parentElement;
  while (parent && parent !== withinBlock) {
    if (
      parent.hasAttribute &&
      (parent.hasAttribute('data-slot') || parent.hasAttribute('data-slot-key'))
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main scanner
// ---------------------------------------------------------------------------

/**
 * Scan a DOM subtree for EDS blocks and Commerce dropin slots.
 *
 * @param {HTMLElement} rootElement - Root element to scan within
 * @param {{ showEmptySlots?: boolean }} [options]
 * @returns {{ blocks: BlockNode[], standaloneSlots: SlotNode[], counts: { blocks: number, slots: number } }}
 */
export function scanEds(rootElement, options = {}) {
  const showEmptySlots = options.showEmptySlots ?? false;

  const allBlockElements = Array.from(
    rootElement.querySelectorAll('[data-block-name]')
  );
  const processedSlots = new Set();
  const processedBlocks = new Set();

  // -------------------------------------------------------------------
  // Slot tree builder (recursive)
  // -------------------------------------------------------------------
  function buildSlotTree(slotEl, blockEl) {
    if (processedSlots.has(slotEl)) return null;
    if (!isElementVisible(slotEl, null, showEmptySlots)) return null;

    processedSlots.add(slotEl);

    // Direct child slots (within the same block, not inside deeper nested slots/blocks)
    const childSlotEls = Array.from(slotEl.querySelectorAll(SLOT_SELECTOR))
      .filter((childEl) => {
        if (processedSlots.has(childEl)) return false;
        if (childEl === slotEl) return false;
        const parentSlot = getDirectParentSlot(childEl, blockEl);
        if (parentSlot !== slotEl) return false;
        const parentBlock = getDirectParentBlock(childEl);
        if (parentBlock && parentBlock !== blockEl) return false;
        return true;
      });
    childSlotEls.sort(compareDomOrder);

    const childSlots = childSlotEls
      .map((el) => buildSlotTree(el, blockEl))
      .filter((s) => s !== null);

    // Blocks nested inside this slot
    const blocksInSlot = [];
    allBlockElements.forEach((nestedBlockEl) => {
      if (processedBlocks.has(nestedBlockEl)) return;
      if (!slotEl.contains(nestedBlockEl)) return;
      const nestedParentBlock = getDirectParentBlock(nestedBlockEl);
      if (nestedParentBlock && nestedParentBlock !== blockEl) return;
      const nestedParentSlot = getDirectParentSlot(nestedBlockEl, blockEl);
      if (nestedParentSlot && nestedParentSlot !== slotEl) return;
      const nestedBlockName = nestedBlockEl.getAttribute('data-block-name');
      if (!isElementVisible(nestedBlockEl, nestedBlockName, showEmptySlots)) {
        processedBlocks.add(nestedBlockEl);
        return;
      }
      blocksInSlot.push(nestedBlockEl);
    });
    blocksInSlot.sort(compareDomOrder);
    const nestedBlocks = blocksInSlot.map((el) => buildBlockTree(el, 0));

    return {
      name:
        slotEl.getAttribute('data-slot') ||
        slotEl.getAttribute('data-slot-key') ||
        'Unnamed Slot',
      element: slotEl,
      childSlots,
      children: nestedBlocks,
    };
  }

  // -------------------------------------------------------------------
  // Direct slots for a block
  // -------------------------------------------------------------------
  function getDirectSlots(blockEl) {
    const slotsInBlock = Array.from(blockEl.querySelectorAll(SLOT_SELECTOR));
    slotsInBlock.sort(compareDomOrder);

    const slots = [];
    slotsInBlock.forEach((slotEl) => {
      if (processedSlots.has(slotEl)) return;
      const slotParentBlock = getDirectParentBlock(slotEl);
      if (slotParentBlock && slotParentBlock !== blockEl) return;
      const slotParentSlot = getDirectParentSlot(slotEl, blockEl);
      if (slotParentSlot) return; // Will be processed as a child of its parent slot
      const slotTree = buildSlotTree(slotEl, blockEl);
      if (slotTree) slots.push(slotTree);
    });

    return slots;
  }

  // -------------------------------------------------------------------
  // Direct child blocks of a parent block
  // -------------------------------------------------------------------
  function getDirectChildBlocks(parentEl) {
    const children = [];
    allBlockElements.forEach((blockEl) => {
      if (processedBlocks.has(blockEl)) return;
      const directParent = getDirectParentBlock(blockEl);
      if (directParent === parentEl) {
        const blockName = blockEl.getAttribute('data-block-name');
        if (!isElementVisible(blockEl, blockName, showEmptySlots)) {
          processedBlocks.add(blockEl);
          return;
        }
        children.push(blockEl);
      }
    });
    children.sort(compareDomOrder);
    return children;
  }

  // -------------------------------------------------------------------
  // Block tree builder (recursive)
  // -------------------------------------------------------------------
  function buildBlockTree(blockEl, depth = 0) {
    processedBlocks.add(blockEl);

    const block = {
      name: blockEl.getAttribute('data-block-name'),
      element: blockEl,
      slots: getDirectSlots(blockEl),
      children: [],
      depth,
    };

    const childBlockEls = getDirectChildBlocks(blockEl);
    childBlockEls.forEach((childEl) => {
      block.children.push(buildBlockTree(childEl, depth + 1));
    });

    return block;
  }

  // -------------------------------------------------------------------
  // Build top-level blocks
  // -------------------------------------------------------------------
  const topLevelBlocks = allBlockElements.filter((el) => {
    if (getDirectParentBlock(el)) return false;
    const blockName = el.getAttribute('data-block-name');
    return isElementVisible(el, blockName, showEmptySlots);
  });
  topLevelBlocks.sort(compareDomOrder);

  const blocks = topLevelBlocks.map((el) => buildBlockTree(el));

  // -------------------------------------------------------------------
  // Standalone slots (outside any block)
  // -------------------------------------------------------------------
  const allSlots = Array.from(rootElement.querySelectorAll(SLOT_SELECTOR));
  const standaloneSlots = [];

  allSlots.forEach((slotEl) => {
    if (processedSlots.has(slotEl)) return;
    const isInsideBlock = allBlockElements.some((block) =>
      block.contains(slotEl)
    );
    if (isInsideBlock) return;
    if (!isElementVisible(slotEl, null, showEmptySlots)) return;

    processedSlots.add(slotEl);
    standaloneSlots.push({
      name:
        slotEl.getAttribute('data-slot') ||
        slotEl.getAttribute('data-slot-key') ||
        'Unnamed Slot',
      element: slotEl,
    });
  });

  standaloneSlots.sort((a, b) => compareDomOrder(a.element, b.element));

  if (standaloneSlots.length > 0) {
    blocks.push({
      name: 'Standalone Slots',
      element: document.body,
      slots: standaloneSlots,
      children: [],
      depth: 0,
    });
  }

  // -------------------------------------------------------------------
  // Assign sequential IDs
  // -------------------------------------------------------------------
  let blockIndex = 0;
  let slotIndex = 0;
  let totalBlocks = 0;
  let totalSlots = 0;

  function assignSlotIds(slot) {
    slot.id = `slot-${slotIndex++}`;
    totalSlots++;
    if (slot.childSlots && slot.childSlots.length > 0) {
      slot.childSlots.forEach((childSlot) => assignSlotIds(childSlot));
    }
    if (slot.children && slot.children.length > 0) {
      assignIds(slot.children);
    }
  }

  function assignIds(blockList) {
    blockList.forEach((block) => {
      block.id = `block-${blockIndex++}`;
      totalBlocks++;
      block.slots.forEach((slot) => assignSlotIds(slot));
      if (block.children.length > 0) {
        assignIds(block.children);
      }
    });
  }

  assignIds(blocks);

  return {
    blocks,
    standaloneSlots,
    counts: { blocks: totalBlocks, slots: totalSlots },
  };
}
