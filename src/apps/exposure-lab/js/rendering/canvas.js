/** Off-screen 2D canvases. */

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    const settle = (blob) => (blob ? resolve(blob) : reject(new Error('JPEG capture failed.')));
    canvas.toBlob(settle, 'image/jpeg', quality);
  });
}
