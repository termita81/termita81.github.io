/**
 * A minimal state container. `reduce(state, change)` returns the next state; subscribers are
 * told after every update.
 */
export function createStore(initialState, reduce = (state, change) => ({ ...state, ...change })) {
  let state = reduce(initialState, {});
  const listeners = new Set();

  return {
    getState: () => state,

    update(change) {
      state = reduce(state, change);
      listeners.forEach((listener) => listener(state));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
