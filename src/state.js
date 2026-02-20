/**
 * Reactive state store with pub/sub and localStorage persistence.
 *
 * @param {object} initialState - Default state shape
 * @param {string} storageKey - localStorage key for persistence
 * @returns {{ getState, setState, subscribe, destroy }}
 */
export function createStore(initialState, storageKey) {
  let state = loadState(initialState, storageKey);
  let listeners = new Set();

  function loadState(defaults, key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return { ...defaults, ...JSON.parse(raw) };
      }
    } catch {
      // Corrupted data — fall back to defaults
    }
    return { ...defaults };
  }

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function hasChanged(partial) {
    for (const key of Object.keys(partial)) {
      if (state[key] !== partial[key]) {
        return true;
      }
    }
    return false;
  }

  function getState() {
    return shallowCopy(state);
  }

  function setState(partial) {
    if (Object.keys(partial).length === 0 || !hasChanged(partial)) {
      return;
    }
    state = { ...state, ...partial };
    persist();
    for (const listener of listeners) {
      listener(getState());
    }
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function destroy() {
    listeners.clear();
  }

  return { getState, setState, subscribe, destroy };
}

/**
 * Returns a shallow copy of obj, also copying top-level arrays
 * so callers cannot mutate store internals.
 */
function shallowCopy(obj) {
  const copy = {};
  for (const [key, value] of Object.entries(obj)) {
    copy[key] = Array.isArray(value) ? [...value] : value;
  }
  return copy;
}
