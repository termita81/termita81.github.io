/**
 * Deterministic pseudo-random numbers in [0, 1): the same seed always gives the same sequence,
 * so "random" arrangements look identical in every sample and every photo.
 */
export function createSeededRandom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
