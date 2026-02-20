/**
 * Demo Inspector Universal — Entry Point
 *
 * Registers the <demo-inspector> custom element, sets up
 * MutationObserver for dynamic content, SPA navigation watcher,
 * and window globals for script-tag consumers.
 */

import { DemoInspectorElement } from './panel.js';
import { createQueryTracker, setupWindowGlobals, createGraphQLFetcherWithTracking } from './scanner-mesh.js';

// Set up global query tracker and window bridge
const tracker = createQueryTracker(50);
setupWindowGlobals(tracker);

// Connect tracker to the inspector element's store
function connectTrackerToInspector() {
  const inspector = document.querySelector('demo-inspector');
  if (!inspector || !inspector.store) return;

  const originalTrack = window.__demoInspectorTrackQuery;
  window.__demoInspectorTrackQuery = (entry) => {
    if (originalTrack) originalTrack(entry);
    const state = inspector.store.getState();
    const queries = [entry, ...state.trackedQueries].slice(0, 50);
    inspector.store.setState({ trackedQueries: queries });
  };
}

// Wait for inspector element to be ready, then connect
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', connectTrackerToInspector);
} else {
  // Use microtask to let custom element connectedCallback run first
  queueMicrotask(connectTrackerToInspector);
}

// SPA navigation watcher (URL polling + popstate)
let currentUrl = location.href;

function checkNavigation() {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    const inspector = document.querySelector('demo-inspector');
    if (inspector) inspector.render();
  }
}

setInterval(checkNavigation, 500);
window.addEventListener('popstate', () => setTimeout(checkNavigation, 500));

// MutationObserver for dynamic content (debounced re-scan)
let debounceTimer = null;

const observer = new MutationObserver((mutations) => {
  const hasRelevant = mutations.some((m) => {
    if (m.type !== 'childList') return false;
    for (const node of m.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {HTMLElement} */ (node);
      if (
        el.matches?.('[data-block-name], [data-slot], [data-slot-key], [data-inspector-source]') ||
        el.querySelector?.('[data-block-name], [data-slot], [data-slot-key], [data-inspector-source]')
      ) {
        return true;
      }
    }
    return false;
  });

  if (hasRelevant) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const inspector = document.querySelector('demo-inspector');
      if (inspector) inspector.render();
    }, 300);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Export for ES module consumers
export { createGraphQLFetcherWithTracking, DemoInspectorElement };
