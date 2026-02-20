/**
 * <demo-inspector> custom element.
 * Combines API Mesh source visualization and EDS block/slot detection
 * in a single frosted-glass panel with Shadow DOM isolation.
 */

import { createStore } from './state.js';
import { scanEds } from './scanner-eds.js';
import { DATA_SOURCES, scanMeshSources, formatQueryTime } from './scanner-mesh.js';
import { createHighlighter } from './highlighter.js';
import { PANEL_STYLES } from './styles.js';

// ---------------------------------------------------------------------------
// SVG Icons (from dropin-inspector)
// ---------------------------------------------------------------------------

const ICONS = {
  block: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"></path>
    <path d="M3 8l9 5 9-5"></path>
    <path d="M12 13v9"></path></svg>`,
  slot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706
    1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48
    -.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0
    1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706
    l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0
    1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568
    -1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.69c.218
    -.22.346-.549.276-.837-.07-.471-.48-.802-.925-.968a2.501 2.501 0 1 1 3.214-3.214
    c.166.446.497.855.968.925.288.07.617-.058.837-.276l1.61-1.611a2.404 2.404 0 0 1
    1.705-.706c.618 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074
    .84-.504 1.02-.969a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"></path>
    </svg>`,
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Default state shape
// ---------------------------------------------------------------------------

const DEFAULT_STATE = {
  enabled: true,
  panelCollapsed: false,
  panelPosition: 'right',
  activeMode: 'mesh',  // 'mesh' | 'eds'
  activeSources: [],
  allSourcesHighlighted: false,
  trackedQueries: [],
  cacheDisabled: false,
  activeItems: [],
  expandedNodes: [],
  showEmptySlots: false,
  isMinimized: false,
};

// ---------------------------------------------------------------------------
// Custom Element
// ---------------------------------------------------------------------------

class DemoInspectorElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.store = createStore({ ...DEFAULT_STATE }, 'demo-inspector-state');
    this.highlighter = createHighlighter();
    this._showQueries = false;
    this._showSettings = false;
    this._lastEdsScan = null;
  }

  connectedCallback() {
    this._enforceAvailableMode();
    this.render();
    this._unsubscribe = this.store.subscribe(() => this.render());
    this._setupKeyboardShortcuts();
  }

  /** Parse the `modes` attribute into an array of available mode IDs. */
  _getAvailableModes() {
    const attr = this.getAttribute('modes');
    if (!attr) return ['mesh', 'eds'];
    return attr.split(',').map((s) => s.trim()).filter(Boolean);
  }

  /** If persisted activeMode is not in the available set, reset to the first available. */
  _enforceAvailableMode() {
    const available = this._getAvailableModes();
    const state = this.store.getState();
    if (!available.includes(state.activeMode)) {
      this.store.setState({ activeMode: available[0] || 'mesh' });
    }
  }

  disconnectedCallback() {
    if (this._unsubscribe) this._unsubscribe();
    this.highlighter.destroy();
    this.store.destroy();
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  render() {
    const state = this.store.getState();
    const edsScan = this._scanEdsDom(state);
    this._lastEdsScan = edsScan;

    const meshActive = state.activeMode === 'mesh';
    const edsActive = state.activeMode === 'eds';

    if (!state.enabled) {
      this.shadowRoot.innerHTML = `<style>${PANEL_STYLES}</style>`;
      return;
    }

    if (state.isMinimized) {
      this.shadowRoot.innerHTML = `
        <style>${PANEL_STYLES}</style>
        <button class="toggle-btn" data-action="expand" aria-label="Open Demo Inspector">&#128269;</button>
      `;
      this._attachEventListeners(state);
      this._applyPosition(state);
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${PANEL_STYLES}</style>
      <div class="panel">
        ${this._renderHeader()}
        <div class="panel-body">
          ${this._showSettings
            ? this._renderSettingsOverlay(state)
            : `${meshActive ? this._renderMeshSection(state) : ''}
               ${edsActive ? this._renderEdsSection(state, edsScan) : ''}
               ${meshActive ? this._renderQuerySection(state) : ''}
               ${this._renderHelp()}`
          }
        </div>
      </div>
    `;

    this._attachEventListeners(state);
    this._applyPosition(state);
  }

  // -------------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------------

  _renderHeader() {
    return `
      <div class="header">
        <div class="header-title">
          <span>&#128269;</span>
          <span>Demo Inspector</span>
        </div>
        <div class="header-controls">
          <button class="header-btn" data-action="settings" title="Settings">&#9881;</button>
          <button class="header-btn" data-action="minimize" title="Minimize">&minus;</button>
          <button class="header-btn" data-action="close" title="Close">&times;</button>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // Settings (mode selector)
  // -------------------------------------------------------------------------

  _renderSettingsOverlay(state) {
    const available = this._getAvailableModes();
    const modes = [
      { id: 'mesh', icon: '&#127978;', title: 'API Mesh', desc: 'Data source highlights' },
      { id: 'eds', icon: '&#129521;', title: 'EDS Structure', desc: 'Blocks & dropin slots' },
    ];

    const cardsHtml = modes.map((mode) => {
      const isActive = state.activeMode === mode.id;
      const isDisabled = !available.includes(mode.id);
      const classes = ['mode-card', isActive && 'active', isDisabled && 'disabled'].filter(Boolean).join(' ');
      return `
        <button class="${classes}" data-mode="${mode.id}"${isDisabled ? ' disabled' : ''}>
          <span class="mode-card-icon">${mode.icon}</span>
          <div>
            <div class="mode-card-title">${escapeHtml(mode.title)}</div>
            <div class="mode-card-desc">${escapeHtml(mode.desc)}</div>
          </div>
        </button>
      `;
    }).join('');

    return `
      <div class="settings-overlay">
        <div class="section-label">INSPECTOR MODE</div>
        ${cardsHtml}
        <button class="settings-done-btn" data-action="settings-done">Done</button>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // Mesh section
  // -------------------------------------------------------------------------

  _renderMeshSection(state) {
    const buttonsHtml = DATA_SOURCES.map((source) => {
      const isActive = state.activeSources.includes(source.id);
      const bgStyle = isActive
        ? `background: linear-gradient(135deg, ${source.color}, ${source.color}cc)`
        : '';
      return `
        <button class="source-btn${isActive ? ' active' : ''}"
                data-source="${source.id}"
                style="${bgStyle}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center">
              <span class="source-icon">${source.icon}</span>
              <div>
                <div class="source-name">${escapeHtml(source.name)}</div>
                <div class="source-desc">${escapeHtml(source.description)}</div>
              </div>
            </div>
            ${isActive ? '<div class="pulse"></div>' : ''}
          </div>
        </button>
      `;
    }).join('');

    return `
      <div class="content-section">
        <div class="section-label">DATA SOURCES</div>
        ${buttonsHtml}
      </div>
      <div class="controls-section">
        <div class="toggle-row">
          <span class="toggle-label">Highlight All</span>
          <button class="toggle-track${state.allSourcesHighlighted ? ' active' : ''}"
                  data-toggle="highlight-all">
            <div class="toggle-knob"></div>
          </button>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Disable Cache</span>
          <button class="toggle-track${state.cacheDisabled ? ' active' : ''}"
                  data-toggle="disable-cache">
            <div class="toggle-knob"></div>
          </button>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // EDS section
  // -------------------------------------------------------------------------

  _renderEdsSection(state, edsScan) {
    const { blocks, counts } = edsScan;

    const treeHtml = blocks.length > 0
      ? `<div class="tree-section">${this._renderBlockTree(blocks, state)}</div>`
      : '<div class="empty-state"><div class="empty-icon">&#128466;</div>No EDS blocks detected</div>';

    const hasActiveItems = state.activeItems.length > 0;

    return `
      <div class="content-section">
        <div class="section-header">
          <div class="section-label">BLOCKS &amp; SLOTS</div>
          <button class="section-count" data-action="collapse-all"
                  title="Collapse all">${counts.blocks} blocks &middot; ${counts.slots} slots</button>
        </div>
        ${treeHtml}
      </div>
      <div class="controls-section">
        <div class="eds-actions">
          <button class="eds-btn eds-btn-secondary" data-action="refresh">Refresh</button>
          <button class="eds-btn eds-btn-primary" data-action="${hasActiveItems ? 'clear-all' : 'show-all'}">
            ${hasActiveItems ? 'Clear All' : 'Show All'}
          </button>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Show Empty</span>
          <button class="toggle-track${state.showEmptySlots ? ' active' : ''}"
                  data-toggle="show-empty">
            <div class="toggle-knob"></div>
          </button>
        </div>
      </div>
    `;
  }

  _renderBlockTree(blocks, state) {
    return blocks.map((block) => this._renderBlockNode(block, state)).join('');
  }

  _renderBlockNode(block, state) {
    const hasChildren = block.children.length > 0 || block.slots.length > 0;
    const isExpanded = state.expandedNodes.includes(block.id);
    const isActive = state.activeItems.includes(block.id);

    const arrowHtml = hasChildren
      ? `<span class="tree-arrow" data-expand="${block.id}">${isExpanded ? '&#9660;' : '&#9654;'}</span>`
      : '<span class="tree-arrow"></span>';

    const slotsCount = block.slots.length;
    const badgeHtml = slotsCount > 0
      ? `<span class="tree-badge">${slotsCount}</span>`
      : '';

    let childrenHtml = '';
    if (hasChildren) {
      const slotItems = block.slots.map((slot) =>
        this._renderSlotNode(slot, state)
      ).join('');
      const childBlocks = block.children.map((child) =>
        this._renderBlockNode(child, state)
      ).join('');
      childrenHtml = `
        <div class="tree-children${isExpanded ? ' visible' : ''}">
          ${slotItems}${childBlocks}
        </div>
      `;
    }

    return `
      <div class="tree-item${isActive ? ' active block' : ''}" data-id="${block.id}" data-type="block" data-name="${escapeHtml(block.name)}">
        ${arrowHtml}
        <span class="tree-icon block">${ICONS.block}</span>
        <span class="tree-name">${escapeHtml(block.name)}</span>
        ${badgeHtml}
      </div>
      ${childrenHtml}
    `;
  }

  _renderSlotNode(slot, state) {
    const hasChildren = (slot.childSlots && slot.childSlots.length > 0) ||
      (slot.children && slot.children.length > 0);
    const isExpanded = state.expandedNodes.includes(slot.id);
    const isActive = state.activeItems.includes(slot.id);

    const arrowHtml = hasChildren
      ? `<span class="tree-arrow" data-expand="${slot.id}">${isExpanded ? '&#9660;' : '&#9654;'}</span>`
      : '<span class="tree-arrow"></span>';

    let childrenHtml = '';
    if (hasChildren) {
      const childSlots = (slot.childSlots || []).map((cs) =>
        this._renderSlotNode(cs, state)
      ).join('');
      const nestedBlocks = (slot.children || []).map((b) =>
        this._renderBlockNode(b, state)
      ).join('');
      childrenHtml = `
        <div class="tree-children${isExpanded ? ' visible' : ''}">
          ${childSlots}${nestedBlocks}
        </div>
      `;
    }

    return `
      <div class="tree-item${isActive ? ' active slot' : ''}" data-id="${slot.id}" data-type="slot" data-name="${escapeHtml(slot.name)}">
        ${arrowHtml}
        <span class="tree-icon slot">${ICONS.slot}</span>
        <span class="tree-name">${escapeHtml(slot.name)}</span>
      </div>
      ${childrenHtml}
    `;
  }

  // -------------------------------------------------------------------------
  // Query tracker
  // -------------------------------------------------------------------------

  _renderQuerySection(state) {
    const queries = state.trackedQueries || [];
    const count = queries.length;

    let expandedHtml = '';
    if (this._showQueries) {
      const listContent = count === 0
        ? '<div class="query-empty">No queries tracked yet</div>'
        : `<div class="query-list-items">
            ${queries.slice(0, 10).map((q) => {
              const src = DATA_SOURCES.find((s) => s.id === q.source);
              const icon = src ? src.icon : '';
              return `
                <div class="query-item">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span>${icon}</span>
                    <span class="query-name">${escapeHtml(q.queryName || q.name || '')}</span>
                  </div>
                  <span class="query-time">${formatQueryTime(q.responseTime || 0)}</span>
                </div>
              `;
            }).join('')}
          </div>`;

      const clearBtn = count > 0
        ? '<button class="query-clear" data-action="clear-queries">Clear queries</button>'
        : '';

      expandedHtml = `
        <div class="query-list">${listContent}</div>
        ${clearBtn}
      `;
    }

    return `
      <div class="query-section">
        <div class="query-header" data-action="toggle-queries">
          <span>Recent Queries (${count})</span>
          <span>${this._showQueries ? '&#9660;' : '&#9654;'}</span>
        </div>
        ${expandedHtml}
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // Help
  // -------------------------------------------------------------------------

  _renderHelp() {
    return `
      <div class="help-section">
        <strong>Keyboard Shortcuts</strong><br>
        Cmd+Shift+D &mdash; Toggle Inspector<br>
        Cmd+Shift+E &mdash; Minimize/Expand<br>
        Cmd+Shift+Arrow &mdash; Move Panel
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // DOM scanning
  // -------------------------------------------------------------------------

  _scanEdsDom(state) {
    try {
      return scanEds(document.body, {
        showEmptySlots: state.showEmptySlots,
      });
    } catch {
      return { blocks: [], standaloneSlots: [], counts: { blocks: 0, slots: 0 } };
    }
  }

  // -------------------------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------------------------

  _attachEventListeners(state) {
    const shadow = this.shadowRoot;

    // Expand from minimized toggle button
    const expandBtn = shadow.querySelector('[data-action="expand"]');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        this.store.setState({ isMinimized: false });
      });
    }

    // Settings cog
    const settingsBtn = shadow.querySelector('[data-action="settings"]');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this._showSettings = !this._showSettings;
        this.render();
      });
    }

    // Settings Done button
    const settingsDoneBtn = shadow.querySelector('[data-action="settings-done"]');
    if (settingsDoneBtn) {
      settingsDoneBtn.addEventListener('click', () => {
        this._showSettings = false;
        this.render();
      });
    }

    // Minimize
    const minBtn = shadow.querySelector('[data-action="minimize"]');
    if (minBtn) {
      minBtn.addEventListener('click', () => {
        const s = this.store.getState();
        this.store.setState({ isMinimized: !s.isMinimized });
      });
    }

    // Close
    const closeBtn = shadow.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.store.setState({ enabled: false });
        this.highlighter.clearAll();
      });
    }

    // Mode cards (skip disabled)
    shadow.querySelectorAll('.mode-card[data-mode]:not([disabled])').forEach((card) => {
      card.addEventListener('click', () => {
        const modeId = card.getAttribute('data-mode');
        this._handleModeSwitch(modeId);
      });
    });

    // Source buttons
    shadow.querySelectorAll('.source-btn[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sourceId = btn.getAttribute('data-source');
        this._handleSourceToggle(sourceId);
      });
    });

    // Highlight All toggle
    const highlightAllToggle = shadow.querySelector('[data-toggle="highlight-all"]');
    if (highlightAllToggle) {
      highlightAllToggle.addEventListener('click', () => {
        const s = this.store.getState();
        const newVal = !s.allSourcesHighlighted;
        const newSources = newVal
          ? DATA_SOURCES.map((d) => d.id)
          : [];
        this.store.setState({
          allSourcesHighlighted: newVal,
          activeSources: newSources,
        });
        this._applyMeshHighlights();
      });
    }

    // Disable Cache toggle
    const cacheToggle = shadow.querySelector('[data-toggle="disable-cache"]');
    if (cacheToggle) {
      cacheToggle.addEventListener('click', () => {
        const s = this.store.getState();
        this.store.setState({ cacheDisabled: !s.cacheDisabled });
      });
    }

    // Tree item clicks
    shadow.querySelectorAll('.tree-item[data-id]').forEach((item) => {
      item.addEventListener('click', (e) => {
        // If clicking on the arrow, handle expand instead
        if (e.target.closest('.tree-arrow[data-expand]')) return;
        const itemId = item.getAttribute('data-id');
        const itemName = item.getAttribute('data-name');
        this._handleTreeItemToggle(itemId, itemName);
      });
    });

    // Tree arrows (expand/collapse)
    shadow.querySelectorAll('.tree-arrow[data-expand]').forEach((arrow) => {
      arrow.addEventListener('click', () => {
        const nodeId = arrow.getAttribute('data-expand');
        this._handleExpandToggle(nodeId);
      });
    });

    // Show All / Clear All
    const showAllBtn = shadow.querySelector('[data-action="show-all"]');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => this._handleShowAll());
    }
    const clearAllBtn = shadow.querySelector('[data-action="clear-all"]');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this._handleClearAll());
    }

    // Collapse all expanded nodes
    const collapseAllBtn = shadow.querySelector('[data-action="collapse-all"]');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        this.store.setState({ expandedNodes: [] });
      });
    }

    // Refresh
    const refreshBtn = shadow.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.render());
    }

    // Show Empty toggle
    const showEmptyToggle = shadow.querySelector('[data-toggle="show-empty"]');
    if (showEmptyToggle) {
      showEmptyToggle.addEventListener('click', () => {
        const s = this.store.getState();
        this.store.setState({ showEmptySlots: !s.showEmptySlots });
      });
    }

    // Query header toggle
    const queryHeader = shadow.querySelector('[data-action="toggle-queries"]');
    if (queryHeader) {
      queryHeader.addEventListener('click', () => {
        this._showQueries = !this._showQueries;
        this.render();
      });
    }

    // Clear queries
    const clearQueriesBtn = shadow.querySelector('[data-action="clear-queries"]');
    if (clearQueriesBtn) {
      clearQueriesBtn.addEventListener('click', () => {
        this.store.setState({ trackedQueries: [] });
      });
    }

  }

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  _handleModeSwitch(modeId) {
    this.highlighter.clearAll();
    this._showSettings = false;
    this.store.setState({ activeMode: modeId });
  }

  _handleSourceToggle(sourceId) {
    const state = this.store.getState();
    const active = [...state.activeSources];
    const idx = active.indexOf(sourceId);
    if (idx >= 0) {
      active.splice(idx, 1);
    } else {
      active.push(sourceId);
    }
    this.store.setState({ activeSources: active });
    this._applyMeshHighlights();
  }

  _handleExpandToggle(nodeId) {
    const state = this.store.getState();
    const expanded = [...state.expandedNodes];
    const idx = expanded.indexOf(nodeId);
    if (idx >= 0) {
      expanded.splice(idx, 1);
    } else {
      expanded.push(nodeId);
    }
    this.store.setState({ expandedNodes: expanded });
  }

  _handleTreeItemToggle(itemId, itemName) {
    const state = this.store.getState();
    const active = [...state.activeItems];
    const idx = active.indexOf(itemId);
    if (idx >= 0) {
      active.splice(idx, 1);
      this.highlighter.clearEdsHighlight(itemId);
    } else {
      active.push(itemId);
      const scan = this._lastEdsScan;
      if (scan) {
        const el = this._findElementById(itemId, scan.blocks);
        if (el) {
          const type = itemId.startsWith('block') ? 'block' : 'slot';
          this.highlighter.highlightEdsItem(el, itemId, itemName, type);
        }
      }
    }
    this.store.setState({ activeItems: active });
  }

  _handleShowAll() {
    const scan = this._lastEdsScan;
    if (!scan) return;
    const allIds = [];
    this._collectAllIds(scan.blocks, allIds);
    allIds.forEach((item) => {
      if (item.element) {
        this.highlighter.highlightEdsItem(
          item.element, item.id, item.name, item.type
        );
      }
    });
    this.store.setState({ activeItems: allIds.map((i) => i.id) });
  }

  _handleClearAll() {
    this.highlighter.clearAll();
    this.store.setState({ activeItems: [], activeSources: [] });
  }

  // -------------------------------------------------------------------------
  // Tree search helpers
  // -------------------------------------------------------------------------

  _findElementById(itemId, blocks) {
    for (const block of blocks) {
      if (block.id === itemId) return block.element;
      for (const slot of block.slots || []) {
        const found = this._findInSlot(itemId, slot);
        if (found) return found;
      }
      if (block.children) {
        const found = this._findElementById(itemId, block.children);
        if (found) return found;
      }
    }
    return null;
  }

  _findInSlot(itemId, slot) {
    if (slot.id === itemId) return slot.element;
    for (const cs of slot.childSlots || []) {
      const found = this._findInSlot(itemId, cs);
      if (found) return found;
    }
    for (const child of slot.children || []) {
      if (child.id === itemId) return child.element;
    }
    return null;
  }

  _collectAllIds(blocks, result) {
    for (const block of blocks) {
      result.push({ id: block.id, name: block.name, element: block.element, type: 'block' });
      for (const slot of block.slots || []) {
        this._collectSlotIds(slot, result);
      }
      if (block.children) {
        this._collectAllIds(block.children, result);
      }
    }
  }

  _collectSlotIds(slot, result) {
    result.push({ id: slot.id, name: slot.name, element: slot.element, type: 'slot' });
    for (const cs of slot.childSlots || []) {
      this._collectSlotIds(cs, result);
    }
    for (const child of slot.children || []) {
      result.push({ id: child.id, name: child.name, element: child.element, type: 'block' });
    }
  }

  // -------------------------------------------------------------------------
  // Mesh highlighting
  // -------------------------------------------------------------------------

  _applyMeshHighlights() {
    this.highlighter.clearMeshHighlights();
    const state = this.store.getState();
    if (state.activeMode !== 'mesh') return;

    const sourceMap = scanMeshSources(document);
    state.activeSources.forEach((sourceId) => {
      const source = DATA_SOURCES.find((s) => s.id === sourceId);
      const elements = sourceMap.get(sourceId) || [];
      if (source && elements.length > 0) {
        this.highlighter.highlightMeshSource(elements, source.color);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Panel positioning
  // -------------------------------------------------------------------------

  _applyPosition(state) {
    if (state.panelPosition === 'left') {
      this.style.left = '16px';
      this.style.right = 'auto';
    } else {
      this.style.left = '';
      this.style.right = '16px';
    }
  }

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  _setupKeyboardShortcuts() {
    this._keyHandler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === 'D' || e.key === 'd') {
          e.preventDefault();
          const state = this.store.getState();
          this.store.setState({ enabled: !state.enabled });
          if (state.enabled) this.highlighter.clearAll();
        }
        if (e.key === 'E' || e.key === 'e') {
          e.preventDefault();
          const state = this.store.getState();
          if (state.enabled) {
            this.store.setState({ isMinimized: !state.isMinimized });
          }
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.store.setState({ panelPosition: 'left' });
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.store.setState({ panelPosition: 'right' });
        }
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

if (!customElements.get('demo-inspector')) {
  customElements.define('demo-inspector', DemoInspectorElement);
}

export { DemoInspectorElement };
