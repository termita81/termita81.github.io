/**
 * Where an image of `imageSize` sits inside a box when shown with `object-fit: contain`:
 * scaled to fit, and centred.
 */
export function containedBox(boxWidth, boxHeight, imageSize) {
  const scale = Math.min(boxWidth / imageSize.width, boxHeight / imageSize.height);
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  return { left: (boxWidth - width) / 2, top: (boxHeight - height) / 2, width, height };
}
