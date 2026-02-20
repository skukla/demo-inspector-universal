/**
 * EDS highlight type style definitions.
 */
const EDS_STYLES = {
  block: {
    border: '2px solid #6366f1',
    outline: '2px solid rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    labelBg: '#6366f1',
  },
  slot: {
    border: '2px dashed #22c55e',
    outline: '2px dashed rgba(34, 197, 94, 0.4)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    labelBg: '#22c55e',
  },
};

/**
 * DOM Highlighter + Floating Labels.
 * Highlights DOM elements with color-coded borders/backgrounds and creates floating labels.
 *
 * @returns {{ highlightMeshSource, clearMeshHighlights, highlightEdsItem, clearEdsHighlight, clearAll, destroy }}
 */
export function createHighlighter() {
  /** @type {Map<HTMLElement, object>} saved original styles for mesh highlights */
  let meshSavedStyles = new Map();
  /** @type {Map<string, { element: HTMLElement, border: string, outline: string, backgroundColor: string, position: string, zIndex: string }>} */
  let edsSavedStyles = new Map();
  /** @type {Map<string, HTMLElement>} label DOM elements keyed by itemId */
  let labelElements = new Map();
  /** @type {Map<string, { top: number, left: number, width: number, height: number }>} */
  let labelPositions = new Map();

  // ---------------------------------------------------------------------------
  // Color swatch helpers
  // ---------------------------------------------------------------------------

  function isColorSwatch(el) {
    return el.getAttribute('data-inspector-field') === 'color-swatch';
  }

  function getSwatchColor(el) {
    return el.getAttribute('data-inspector-value');
  }

  function restoreSwatchColor(el) {
    const color = getSwatchColor(el);
    if (color && color.startsWith('#')) {
      el.style.backgroundColor = color;
    }
  }

  // ---------------------------------------------------------------------------
  // Mesh-style highlights
  // ---------------------------------------------------------------------------

  /**
   * Filter out nested elements whose ancestor shares the same data-inspector-source.
   */
  function filterNestedSameSource(elements) {
    return elements.filter((el) => {
      const source = el.getAttribute('data-inspector-source');
      let parent = el.parentElement;
      while (parent) {
        if (parent.getAttribute('data-inspector-source') === source) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    });
  }

  /**
   * Determine if an element needs an inset shadow rather than a background tint.
   */
  function needsInsetShadow(el) {
    if (el.tagName === 'INPUT') {
      const type = el.type || '';
      return type !== 'checkbox' && type !== 'radio';
    }
    if (el.tagName === 'BUTTON' || el.tagName === 'SELECT') {
      return true;
    }
    if (el.querySelector('img') || el.querySelector('input')) {
      return true;
    }
    if (el.classList.contains('card') || el.classList.contains('product')) {
      return true;
    }
    const bg = el.style.backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      return true;
    }
    return false;
  }

  /**
   * Highlight elements with mesh-style colored borders/backgrounds.
   *
   * @param {HTMLElement[]} elements - DOM elements to highlight
   * @param {string} sourceColor - CSS color string (e.g. '#9333ea')
   */
  function highlightMeshSource(elements, sourceColor) {
    const filtered = filterNestedSameSource(elements);

    for (const el of filtered) {
      // Save original styles
      meshSavedStyles.set(el, {
        backgroundColor: el.style.backgroundColor,
        boxShadow: el.style.boxShadow,
        position: el.style.position,
        zIndex: el.style.zIndex,
        borderRadius: el.style.borderRadius,
      });

      // Get and apply computed border radius
      const computed = window.getComputedStyle(el);
      let borderRadius = computed.borderRadius || '0px';

      // Special handling for search-bar / sort-dropdown containers
      const elType = el.getAttribute('data-inspector-type');
      if (elType === 'search-bar') {
        const input = el.querySelector('input');
        if (input) {
          borderRadius = window.getComputedStyle(input).borderRadius || borderRadius;
        }
      } else if (elType === 'sort-dropdown') {
        const select = el.querySelector('select');
        if (select) {
          borderRadius = window.getComputedStyle(select).borderRadius || borderRadius;
        }
      }

      el.style.borderRadius = borderRadius;

      // Apply shadow styles
      const outerBorder = `0 0 0 3px ${sourceColor}`;

      if (isColorSwatch(el)) {
        // Color swatches keep their background, get only outer border
        el.style.boxShadow = outerBorder;
        el.style.position = 'relative';
        el.style.zIndex = '10';
        restoreSwatchColor(el);
        continue;
      }

      if (needsInsetShadow(el)) {
        el.style.boxShadow = `${outerBorder}, inset 0 0 0 1000px ${sourceColor}20`;

        // Also apply inset shadow to nested text/search inputs
        const nestedInput = el.querySelector(
          'input[type="text"], input[type="search"], input:not([type])'
        );
        if (nestedInput) {
          if (nestedInput.dataset.originalBoxShadow === undefined) {
            nestedInput.dataset.originalBoxShadow = nestedInput.style.boxShadow || '';
          }
          nestedInput.style.boxShadow = `inset 0 0 0 1000px ${sourceColor}20`;
        }
      } else {
        el.style.boxShadow = outerBorder;
        el.style.backgroundColor = `${sourceColor}10`;
      }

      el.style.position = 'relative';
      el.style.zIndex = '10';

      // Restore nested color swatches
      const nestedSwatches = el.querySelectorAll('[data-inspector-field="color-swatch"]');
      nestedSwatches.forEach((swatch) => restoreSwatchColor(swatch));
    }
  }

  /**
   * Remove all mesh-style highlights and restore original styles.
   */
  function clearMeshHighlights() {
    for (const [el, saved] of meshSavedStyles) {
      if (isColorSwatch(el)) {
        restoreSwatchColor(el);
      } else {
        el.style.backgroundColor = saved.backgroundColor;
      }
      el.style.boxShadow = saved.boxShadow;
      el.style.position = saved.position;
      el.style.zIndex = saved.zIndex;
      el.style.borderRadius = saved.borderRadius;

      // Restore nested inputs
      const nestedInput = el.querySelector(
        'input[type="text"], input[type="search"], input:not([type])'
      );
      if (nestedInput && nestedInput.dataset.originalBoxShadow !== undefined) {
        nestedInput.style.boxShadow = nestedInput.dataset.originalBoxShadow || '';
        delete nestedInput.dataset.originalBoxShadow;
      }

      // Restore nested color swatches
      const nestedSwatches = el.querySelectorAll('[data-inspector-field="color-swatch"]');
      nestedSwatches.forEach((swatch) => restoreSwatchColor(swatch));
    }
    meshSavedStyles.clear();
  }

  // ---------------------------------------------------------------------------
  // EDS-style highlights
  // ---------------------------------------------------------------------------

  /**
   * Highlight an EDS block or slot element.
   *
   * @param {HTMLElement} element - DOM element to highlight
   * @param {string} itemId - Unique identifier (e.g. 'block-0', 'slot-1')
   * @param {string} name - Display name for the floating label
   * @param {'block'|'slot'} type - Element type
   */
  function highlightEdsItem(element, itemId, name, type) {
    // Save original styles
    edsSavedStyles.set(itemId, {
      element,
      border: element.style.border,
      outline: element.style.outline,
      backgroundColor: element.style.backgroundColor,
      position: element.style.position,
      zIndex: element.style.zIndex,
    });

    // Apply highlight
    const styles = EDS_STYLES[type];
    element.style.border = styles.border;
    element.style.outline = styles.outline;
    element.style.backgroundColor = styles.backgroundColor;
    element.style.position = 'relative';
    element.style.zIndex = '10000';

    // Create floating label
    createLabel(itemId, element, name, type);
  }

  /**
   * Remove a single EDS highlight by itemId.
   *
   * @param {string} itemId
   */
  function clearEdsHighlight(itemId) {
    const saved = edsSavedStyles.get(itemId);
    if (saved) {
      const el = saved.element;
      el.style.border = saved.border;
      el.style.outline = saved.outline;
      el.style.backgroundColor = saved.backgroundColor;
      el.style.position = saved.position;
      el.style.zIndex = saved.zIndex;
      edsSavedStyles.delete(itemId);
    }

    const label = labelElements.get(itemId);
    if (label) {
      label.remove();
      labelElements.delete(itemId);
      labelPositions.delete(itemId);
    }
  }

  // ---------------------------------------------------------------------------
  // Floating label system
  // ---------------------------------------------------------------------------

  /**
   * Check if two rectangles overlap (AABB collision).
   */
  function rectsOverlap(rect1, rect2) {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  /**
   * Find the best non-overlapping position for a label near the target element.
   *
   * @param {HTMLElement} label - The label element (already in DOM for measurement)
   * @param {DOMRect} elementRect - Bounding rect of the highlighted element
   * @returns {{ top: number, left: number }}
   */
  function findBestLabelPosition(label, elementRect) {
    const labelWidth = label.offsetWidth || 60;
    const labelHeight = label.offsetHeight || 20;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const BUFFER = 4;
    const LABEL_BUFFER = 6;

    const elemTop = elementRect.top + scrollTop;
    const elemLeft = elementRect.left + scrollLeft;
    const elemRight = elementRect.right + scrollLeft;
    const elemBottom = elementRect.bottom + scrollTop;

    // Collect existing label rects with buffer
    const obstacles = [];
    labelPositions.forEach((pos) => {
      obstacles.push({
        top: pos.top - LABEL_BUFFER,
        left: pos.left - LABEL_BUFFER,
        right: pos.left + pos.width + LABEL_BUFFER,
        bottom: pos.top + pos.height + LABEL_BUFFER,
      });
    });

    function hasCollision(rect) {
      return obstacles.some((obs) => rectsOverlap(rect, obs));
    }

    const above = {
      top: elemTop - labelHeight - BUFFER,
      left: elemLeft,
      right: elemLeft + labelWidth,
      bottom: elemTop - BUFFER,
    };
    const below = {
      top: elemBottom + BUFFER,
      left: elemLeft,
      right: elemLeft + labelWidth,
      bottom: elemBottom + BUFFER + labelHeight,
    };
    const right = {
      top: elemTop,
      left: elemRight + BUFFER,
      right: elemRight + BUFFER + labelWidth,
      bottom: elemTop + labelHeight,
    };
    const left = {
      top: elemTop,
      left: elemLeft - labelWidth - BUFFER,
      right: elemLeft - BUFFER,
      bottom: elemTop + labelHeight,
    };

    // Try above first
    if (!hasCollision(above)) {
      return { top: above.top, left: above.left };
    }

    // Determine fallback order based on available space
    const viewportWidth = window.innerWidth;
    const spaceOnRight = viewportWidth - elementRect.right;
    const spaceOnLeft = elementRect.left;
    const minSpace = labelWidth + 20;

    let fallbacks;
    if (spaceOnRight >= minSpace) {
      fallbacks = [right, below, left];
    } else if (spaceOnLeft >= minSpace) {
      fallbacks = [below, left, right];
    } else {
      fallbacks = [below, right, left];
    }

    for (const pos of fallbacks) {
      if (!hasCollision(pos)) {
        return { top: pos.top, left: pos.left };
      }
    }

    // All positions collide -- default to below
    return { top: below.top, left: below.left };
  }

  /**
   * Create a floating label for an EDS item.
   *
   * @param {string} itemId
   * @param {HTMLElement} element
   * @param {string} text
   * @param {'block'|'slot'} type
   */
  function createLabel(itemId, element, text, type) {
    // Remove existing label if any
    const existing = labelElements.get(itemId);
    if (existing) {
      existing.remove();
    }

    const styles = EDS_STYLES[type];
    const label = document.createElement('div');

    Object.assign(label.style, {
      position: 'absolute',
      padding: '3px 8px',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: '600',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: styles.labelBg,
      color: 'white',
      whiteSpace: 'nowrap',
      zIndex: '999998',
      pointerEvents: 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    });

    label.textContent = text;
    document.body.appendChild(label);

    // Position label
    const rect = element.getBoundingClientRect();
    const pos = findBestLabelPosition(label, rect);

    pos.top = Math.max(
      (window.pageYOffset || document.documentElement.scrollTop) + 4,
      pos.top
    );
    pos.left = Math.max(4, pos.left);

    label.style.top = pos.top + 'px';
    label.style.left = pos.left + 'px';

    // Store for collision detection
    labelPositions.set(itemId, {
      top: pos.top,
      left: pos.left,
      width: label.offsetWidth || 60,
      height: label.offsetHeight || 20,
    });

    labelElements.set(itemId, label);
  }

  // ---------------------------------------------------------------------------
  // Shared
  // ---------------------------------------------------------------------------

  /**
   * Clear all highlights (mesh + EDS) and remove all labels.
   */
  function clearAll() {
    clearMeshHighlights();

    for (const itemId of [...edsSavedStyles.keys()]) {
      clearEdsHighlight(itemId);
    }

    // Safety: remove any remaining labels
    labelElements.forEach((label) => label.remove());
    labelElements.clear();
    labelPositions.clear();
  }

  /**
   * Destroy the highlighter instance, clearing all state.
   */
  function destroy() {
    clearAll();
    meshSavedStyles = null;
    edsSavedStyles = null;
    labelElements = null;
    labelPositions = null;
  }

  return {
    highlightMeshSource,
    clearMeshHighlights,
    highlightEdsItem,
    clearEdsHighlight,
    clearAll,
    destroy,
  };
}

