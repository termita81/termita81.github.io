/**
 * A uniform surface: nothing to look around at or focus on. `fill(target, value)` paints a
 * render target with one linear gray value.
 */
export function createFlatScene({ reflectance, ...info }, fill) {
  return {
    ...info,
    isFlat: true,
    canLookAround: false,
    focusPoint: null,
    autofocusDistance: undefined,
    renderSample: (target) => fill(target, reflectance),
  };
}

export const grayCardScene = (fill) =>
  createFlatScene(
    {
      id: 'gray',
      name: 'Gray card',
      ev: 8,
      thumbnail: 'gray-card.jpg',
      note: 'Uniform 18% gray: only brightness and noise change here.',
      focusHint: 'The uniform gray card has no focus detail.',
      reflectance: 0.18,
    },
    fill,
  );
