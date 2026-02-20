import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DATA_SOURCES,
  detectSource,
  createQueryTracker,
  setupWindowGlobals,
  createGraphQLFetcherWithTracking,
  scanMeshSources,
  formatQueryTime,
} from '../src/scanner-mesh.js';

describe('detectSource', () => {
  it('should identify Commerce from categories response key', () => {
    expect(detectSource('SomeQuery', { categories: [] })).toBe('commerce');
  });

  it('should identify Catalog from Citisignal_productDetail key', () => {
    expect(detectSource('SomeQuery', { Citisignal_productDetail: {} })).toBe('catalog');
  });

  it('should identify Catalog from queryName GetProductDetail', () => {
    expect(detectSource('GetProductDetail', {})).toBe('catalog');
  });

  it('should identify Catalog from Citisignal_productCards key', () => {
    expect(detectSource('SomeQuery', { Citisignal_productCards: [] })).toBe('catalog');
  });

  it('should identify Catalog from products response key', () => {
    expect(detectSource('SomeQuery', { products: [] })).toBe('catalog');
  });

  it('should identify Catalog from queryName containing ProductCards', () => {
    expect(detectSource('GetProductCards', {})).toBe('catalog');
  });

  it('should identify Catalog from Citisignal_productPageData key', () => {
    expect(detectSource('SomeQuery', { Citisignal_productPageData: {} })).toBe('catalog');
  });

  it('should identify Catalog from queryName GetProductPageData', () => {
    expect(detectSource('GetProductPageData', {})).toBe('catalog');
  });

  it('should identify Search from facets response key', () => {
    expect(detectSource('SomeQuery', { facets: [] })).toBe('search');
  });

  it('should identify Search from Citisignal_productFacets key', () => {
    expect(detectSource('SomeQuery', { Citisignal_productFacets: {} })).toBe('search');
  });

  it('should identify Search from queryName containing Search', () => {
    expect(detectSource('GetSearchResults', {})).toBe('search');
  });

  it('should identify Search from queryName containing Facet', () => {
    expect(detectSource('GetFacetData', {})).toBe('search');
  });

  it('should identify Search from queryName containing Filter', () => {
    expect(detectSource('ApplyFilter', {})).toBe('search');
  });

  it('should identify Commerce from storeConfig key', () => {
    expect(detectSource('SomeQuery', { storeConfig: {} })).toBe('commerce');
  });

  it('should identify Commerce from navigation key', () => {
    expect(detectSource('SomeQuery', { navigation: [] })).toBe('commerce');
  });

  it('should identify Commerce from breadcrumbs key', () => {
    expect(detectSource('SomeQuery', { breadcrumbs: [] })).toBe('commerce');
  });

  it('should identify Commerce from queryName containing Navigation', () => {
    expect(detectSource('GetNavigation', {})).toBe('commerce');
  });

  it('should identify Commerce from queryName containing Breadcrumb', () => {
    expect(detectSource('GetBreadcrumbs', {})).toBe('commerce');
  });

  it('should return commerce as default for unknown data shapes', () => {
    expect(detectSource('UnknownQuery', { foo: 'bar' })).toBe('commerce');
  });
});

describe('createQueryTracker', () => {
  it('should store queries up to maxQueries with oldest dropped (FIFO)', () => {
    const tracker = createQueryTracker(3);

    tracker.trackQuery({ queryName: 'Q1', source: 'commerce', responseTime: 10, timestamp: 1 });
    tracker.trackQuery({ queryName: 'Q2', source: 'catalog', responseTime: 20, timestamp: 2 });
    tracker.trackQuery({ queryName: 'Q3', source: 'search', responseTime: 30, timestamp: 3 });
    tracker.trackQuery({ queryName: 'Q4', source: 'commerce', responseTime: 40, timestamp: 4 });

    const queries = tracker.getQueries(10);
    expect(queries).toHaveLength(3);
    expect(queries[0].queryName).toBe('Q4');
    expect(queries[2].queryName).toBe('Q2');
  });

  it('should return last N queries via getQueries with default limit of 10', () => {
    const tracker = createQueryTracker(50);

    for (let i = 0; i < 15; i++) {
      tracker.trackQuery({ queryName: `Q${i}`, source: 'commerce', responseTime: i, timestamp: i });
    }

    const queries = tracker.getQueries();
    expect(queries).toHaveLength(10);
    expect(queries[0].queryName).toBe('Q14');
  });

  it('should empty the list on clearQueries', () => {
    const tracker = createQueryTracker(50);

    tracker.trackQuery({ queryName: 'Q1', source: 'commerce', responseTime: 10, timestamp: 1 });
    tracker.trackQuery({ queryName: 'Q2', source: 'catalog', responseTime: 20, timestamp: 2 });

    tracker.clearQueries();

    expect(tracker.getQueries()).toHaveLength(0);
  });
});

describe('createGraphQLFetcherWithTracking', () => {
  let originalPerformanceNow;

  beforeEach(() => {
    window.__demoInspectorTrackQuery = undefined;
    window.__demoInspectorStoreData = undefined;
    originalPerformanceNow = performance.now;
  });

  afterEach(() => {
    performance.now = originalPerformanceNow;
    delete window.__demoInspectorTrackQuery;
    delete window.__demoInspectorStoreData;
  });

  it('should wrap fetcher, measure time, detect source, and track query', async () => {
    let callCount = 0;
    performance.now = vi.fn(() => {
      callCount++;
      return callCount === 1 ? 100 : 250;
    });

    const trackFn = vi.fn();
    const storeFn = vi.fn();
    window.__demoInspectorTrackQuery = trackFn;
    window.__demoInspectorStoreData = storeFn;

    const baseFetcher = vi.fn().mockResolvedValue({ categories: [] });
    const wrappedFetcher = createGraphQLFetcherWithTracking(baseFetcher);

    const result = await wrappedFetcher('query GetNavigation { nav }', {});

    expect(result).toEqual({ categories: [] });
    expect(baseFetcher).toHaveBeenCalledWith('query GetNavigation { nav }', {}, undefined);
    expect(trackFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryName: 'GetNavigation',
        source: 'commerce',
        responseTime: 150,
      })
    );
    expect(storeFn).toHaveBeenCalled();
  });

  it('should default queryName to Anonymous when no match', async () => {
    let callCount = 0;
    performance.now = vi.fn(() => {
      callCount++;
      return callCount === 1 ? 0 : 50;
    });

    const trackFn = vi.fn();
    window.__demoInspectorTrackQuery = trackFn;
    window.__demoInspectorStoreData = vi.fn();

    const baseFetcher = vi.fn().mockResolvedValue({});
    const wrappedFetcher = createGraphQLFetcherWithTracking(baseFetcher);

    await wrappedFetcher('{ someField }', {});

    expect(trackFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryName: 'Anonymous' })
    );
  });

  it('should not throw when window globals are not set', async () => {
    let callCount = 0;
    performance.now = vi.fn(() => {
      callCount++;
      return callCount === 1 ? 0 : 10;
    });

    const baseFetcher = vi.fn().mockResolvedValue({ products: [] });
    const wrappedFetcher = createGraphQLFetcherWithTracking(baseFetcher);

    const result = await wrappedFetcher('query GetProductCards { items }', {});

    expect(result).toEqual({ products: [] });
  });
});

describe('scanMeshSources', () => {
  it('should group elements by data-inspector-source attribute', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-inspector-source="commerce">Store</div>
      <div data-inspector-source="catalog">Product A</div>
      <div data-inspector-source="commerce">Nav</div>
      <div data-inspector-source="search">Search Box</div>
      <div data-inspector-source="catalog">Product B</div>
    `;

    const result = scanMeshSources(root);

    expect(result).toBeInstanceOf(Map);
    expect(result.get('commerce')).toHaveLength(2);
    expect(result.get('catalog')).toHaveLength(2);
    expect(result.get('search')).toHaveLength(1);
  });

  it('should return empty Map when no matching elements exist', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div>No sources</div>';

    const result = scanMeshSources(root);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });
});

describe('formatQueryTime', () => {
  it('should format milliseconds below 1000 as Nms', () => {
    expect(formatQueryTime(350)).toBe('350ms');
    expect(formatQueryTime(0)).toBe('0ms');
    expect(formatQueryTime(999)).toBe('999ms');
  });

  it('should format milliseconds at or above 1000 as seconds with 1 decimal', () => {
    expect(formatQueryTime(1500)).toBe('1.5s');
    expect(formatQueryTime(1000)).toBe('1s');
    expect(formatQueryTime(2000)).toBe('2s');
    expect(formatQueryTime(2345)).toBe('2.3s');
  });
});

describe('DATA_SOURCES', () => {
  it('should export three data sources with expected ids', () => {
    expect(DATA_SOURCES).toHaveLength(3);
    const ids = DATA_SOURCES.map((s) => s.id);
    expect(ids).toEqual(['commerce', 'catalog', 'search']);
  });

  it('should include name, color, icon, and description for each source', () => {
    for (const source of DATA_SOURCES) {
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('color');
      expect(source).toHaveProperty('icon');
      expect(source).toHaveProperty('description');
    }
  });
});

describe('setupWindowGlobals', () => {
  afterEach(() => {
    delete window.__demoInspectorTrackQuery;
    delete window.__demoInspectorStoreData;
  });

  it('should set window globals from tracker', () => {
    const tracker = createQueryTracker(10);
    setupWindowGlobals(tracker);

    expect(typeof window.__demoInspectorTrackQuery).toBe('function');
    expect(typeof window.__demoInspectorStoreData).toBe('function');
  });
});
