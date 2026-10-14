/**
 * What the lightbox shows, worked out from its selection:
 * { currentId, comparisonId, comparing }. Pure functions.
 */

/** The photos involved in a comparison. Comparing needs a second photo to compare with. */
export function resolveComparison(photos, selection) {
  const primary = photos.find((photo) => photo.id === selection.currentId);
  const others = photos.filter((photo) => photo.id !== selection.currentId);
  const secondary = others.find((photo) => photo.id === selection.comparisonId) ?? others[0];
  return { primary, others, secondary, comparing: selection.comparing && Boolean(secondary) };
}

/** The part a photo plays in the thumbnail strip. */
export function stripRole(photoId, selection) {
  const isMain = photoId === selection.currentId;
  const isSelected = selection.comparing ? photoId === selection.comparisonId : isMain;
  if (isMain) return { isMain, isSelected, label: selection.comparing ? 'Main' : 'Selected' };
  return { isMain, isSelected, label: isSelected ? 'Comparison' : '' };
}

/** The photo `direction` steps away from the current one, wrapping around; null if none. */
export function neighbour(photos, currentId, direction) {
  const index = photos.findIndex((photo) => photo.id === currentId);
  if (index < 0 || photos.length < 2) return null;
  return photos[(index + direction + photos.length) % photos.length];
}

/** The index to show after the photo at `index` was removed, leaving `length` photos. */
export const indexAfterRemoval = (index, length) => Math.min(Math.max(index, 0), length - 1);
