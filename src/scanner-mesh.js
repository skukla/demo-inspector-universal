/**
 * Mesh source scanner and GraphQL query tracker.
 * Detects API Mesh data sources, tracks queries, and provides
 * a higher-order function wrapper for instrumented fetching.
 */

export const DATA_SOURCES = [
  { id: 'commerce', name: 'Commerce Core', color: '#9333ea', icon: '\u{1F3EA}', description: 'Navigation, categories & store data' },
  { id: 'catalog', name: 'Catalog Service', color: '#2563eb', icon: '\u{1F4E6}', description: 'Product listings & inventory' },
  { id: 'search', name: 'Live Search', color: '#16a34a', icon: '\u{1F50D}', description: 'Search, facets & filtering' },
];

/**
 * Detects which API Mesh source a query result came from.
 *
 * @param {string} queryName - The GraphQL operation name
 * @param {object} data - The response data object
 * @returns {'commerce' | 'catalog' | 'search'}
 */
export function detectSource(queryName, data) {
  if (data.Citisignal_productDetail || queryName === 'GetProductDetail') {
    return 'catalog';
  }
  if (data.Citisignal_productCards || data.products || queryName.includes('ProductCards')) {
    return 'catalog';
  }
  if (data.Citisignal_productPageData || queryName === 'GetProductPageData') {
    return 'catalog';
  }
  if (
    data.Citisignal_productFacets ||
    data.facets ||
    queryName.includes('Facet') ||
    queryName.includes('Search') ||
    queryName.includes('Filter')
  ) {
    return 'search';
  }
  if (
    data.categories ||
    data.storeConfig ||
    data.navigation ||
    data.breadcrumbs ||
    queryName.includes('Navigation') ||
    queryName.includes('Breadcrumb')
  ) {
    return 'commerce';
  }
  return 'commerce';
}

/**
 * Creates a query tracker that stores recent GraphQL queries (FIFO).
 *
 * @param {number} [maxQueries=50] - Maximum number of queries to retain
 * @returns {{ trackQuery, getQueries, clearQueries }}
 */
export function createQueryTracker(maxQueries = 50) {
  let queries = [];

  function trackQuery(entry) {
    queries.unshift(entry);
    if (queries.length > maxQueries) {
      queries.length = maxQueries;
    }
  }

  function getQueries(limit = 10) {
    return queries.slice(0, limit);
  }

  function clearQueries() {
    queries = [];
  }

  return { trackQuery, getQueries, clearQueries };
}

/**
 * Sets up window globals for cross-component query tracking.
 *
 * @param {{ trackQuery: Function }} tracker - A query tracker instance
 */
export function setupWindowGlobals(tracker) {
  window.__demoInspectorTrackQuery = tracker.trackQuery;
  window.__demoInspectorStoreData = (data) => data;
}

/**
 * Higher-order function that wraps a GraphQL fetcher with tracking.
 * Measures response time, detects source, and calls window globals.
 *
 * @param {Function} baseFetcher - The original fetcher (query, variables, options) => Promise
 * @returns {Function} Wrapped fetcher with identical signature
 */
export function createGraphQLFetcherWithTracking(baseFetcher) {
  return async (query, variables, options) => {
    const nameMatch = query.match(/query\s+(\w+)/);
    const queryName = nameMatch ? nameMatch[1] : 'Anonymous';

    const start = performance.now();
    const result = await baseFetcher(query, variables, options);
    const responseTime = performance.now() - start;

    const source = detectSource(queryName, result);

    if (typeof window.__demoInspectorTrackQuery === 'function') {
      window.__demoInspectorTrackQuery({
        queryName,
        source,
        responseTime,
        timestamp: Date.now(),
      });
    }
    if (typeof window.__demoInspectorStoreData === 'function') {
      window.__demoInspectorStoreData(result);
    }

    return result;
  };
}

/**
 * Scans a root element for children with data-inspector-source attributes,
 * grouping them by source id.
 *
 * @param {HTMLElement} rootElement - The DOM element to scan
 * @returns {Map<string, HTMLElement[]>} Map of sourceId to element arrays
 */
export function scanMeshSources(rootElement) {
  const elements = rootElement.querySelectorAll('[data-inspector-source]');
  const result = new Map();

  for (const el of elements) {
    const sourceId = el.getAttribute('data-inspector-source');
    if (!result.has(sourceId)) {
      result.set(sourceId, []);
    }
    result.get(sourceId).push(el);
  }

  return result;
}

/**
 * Formats a response time in milliseconds to a human-readable string.
 *
 * @param {number} milliseconds - The time value to format
 * @returns {string} Formatted time string (e.g., '350ms' or '1.5s')
 */
export function formatQueryTime(milliseconds) {
  if (milliseconds >= 1000) {
    const seconds = (milliseconds / 1000).toFixed(1);
    return seconds.endsWith('.0')
      ? `${seconds.slice(0, -2)}s`
      : `${seconds}s`;
  }
  return `${milliseconds}ms`;
}
