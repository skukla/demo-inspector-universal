import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../src/state.js';

const DEFAULT_STATE = {
  enabled: true,
  panelCollapsed: false,
  panelPosition: 'right',
  panelDragPosition: null,
  activeModules: ['mesh', 'eds-blocks', 'eds-slots'],
  activeSources: [],
  allSourcesHighlighted: false,
  trackedQueries: [],
  cacheDisabled: false,
  activeItems: [],
  expandedNodes: [],
  showEmptySlots: false,
  isMinimized: false,
};

const STORAGE_KEY = 'test-inspector-state';

describe('createStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create store with default state', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);

    expect(store.getState()).toEqual(DEFAULT_STATE);
    store.destroy();
  });

  it('should merge partial updates without replacing unrelated keys', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);

    store.setState({ enabled: false });

    const state = store.getState();
    expect(state.enabled).toBe(false);
    expect(state.panelPosition).toBe('right');
    expect(state.activeModules).toEqual(['mesh', 'eds-blocks', 'eds-slots']);
    store.destroy();
  });

  it('should fire subscriber on state change with new state', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({ panelCollapsed: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ panelCollapsed: true })
    );
    store.destroy();
  });

  it('should stop notifications after unsubscribe', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setState({ enabled: false });

    expect(listener).not.toHaveBeenCalled();
    store.destroy();
  });

  it('should persist state to localStorage on setState', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);

    store.setState({ cacheDisabled: true });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.cacheDisabled).toBe(true);
    expect(stored.enabled).toBe(true);
    store.destroy();
  });

  it('should restore state from localStorage on creation', () => {
    const saved = { ...DEFAULT_STATE, panelPosition: 'left' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const store = createStore(DEFAULT_STATE, STORAGE_KEY);

    expect(store.getState().panelPosition).toBe('left');
    store.destroy();
  });

  it('should fall back to defaults when localStorage is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json!!!');

    const store = createStore(DEFAULT_STATE, STORAGE_KEY);

    expect(store.getState()).toEqual(DEFAULT_STATE);
    store.destroy();
  });

  it('should notify multiple subscribers on state change', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    store.subscribe(listener1);
    store.subscribe(listener2);
    store.setState({ isMinimized: true });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    store.destroy();
  });

  it('should not notify subscribers when setState receives identical values', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({ enabled: true, panelCollapsed: false });

    expect(listener).not.toHaveBeenCalled();
    store.destroy();
  });

  it('should not notify subscribers after destroy', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);
    const listener = vi.fn();

    store.subscribe(listener);
    store.destroy();
    store.setState({ enabled: false });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should return a copy from getState so mutations do not affect store', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);

    const copy = store.getState();
    copy.enabled = false;
    copy.activeModules.push('custom');

    const actual = store.getState();
    expect(actual.enabled).toBe(true);
    expect(actual.activeModules).toEqual(['mesh', 'eds-blocks', 'eds-slots']);
    store.destroy();
  });

  it('should not notify subscribers when setState receives empty object', () => {
    const store = createStore(DEFAULT_STATE, STORAGE_KEY);
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({});

    expect(listener).not.toHaveBeenCalled();
    store.destroy();
  });
});
