import * as THREE from 'three';
import { createCanvas } from '../../rendering/canvas.js';

/** Paint a texture with the 2D canvas API. `draw` receives (context, width, height). */
export function canvasTexture(width, height, draw) {
  const canvas = createCanvas(width, height);
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Like `canvasTexture`, with the sharpest filtering the GPU offers at glancing angles. */
export function createTexturePainter(renderer) {
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  return (width, height, draw) => {
    const texture = canvasTexture(width, height, draw);
    texture.anisotropy = anisotropy;
    return texture;
  };
}

export function repeatTexture(texture, repeatX, repeatY) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}
