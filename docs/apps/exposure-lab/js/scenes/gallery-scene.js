import * as THREE from 'three';
import { drawDistanceLabel } from './gallery-label.js';
import { createCameraScene } from './lib/camera-scene.js';
import { createMeshKit } from './lib/mesh-kit.js';
import { createTexturePainter, repeatTexture } from './lib/textures.js';
import { createThinLensCamera } from './lib/thin-lens-camera.js';

const INFO = {
  id: 'gallery',
  name: 'Focus gallery',
  ev: 7,
  thumbnail: 'focus-gallery.jpg',
  note:
    'A still, warmly lit gallery at EV 7. Labelled front surfaces are 1, 2, 3, 5, 8, 12, 16 ' +
    'and 20 m from the starting camera. Focus on their fine lines, then change aperture to ' +
    'explore depth of field. Nothing moves here.',
};

const EYE_HEIGHT = 1.6;
const TEXTURE_SIZE = 512;

/** Metres from the starting camera to each display's labelled front face. */
const DISTANCES = [1, 2, 3, 5, 8, 12, 16, 20];

// prettier-ignore
const COLORS = [
  '#b86446', '#4d789b', '#688257', '#c49c42',
  '#a4778c', '#558c87', '#a97f50', '#7183a5',
];

// Positions are in proportion to distance, so every display looks about the same size. The rear
// row is offset into the gaps of the front row and lifted so its labels clear the front
// ornaments; it is slightly smaller to leave room for taller pedestals within the initial view.
const FRONT_ROW = {
  columns: [-0.27, -0.09, 0.09, 0.27],
  elevations: [-0.125, -0.125, -0.125, -0.125],
  scale: 0.12,
  ornamentLift: 0.95,
};
const REAR_ROW = {
  columns: [-0.22, -0.035, 0.15, 0.285],
  elevations: [0.107, 0.112, 0.105, 0.11],
  scale: 0.105,
  ornamentLift: 0.9,
};

/** One ornament shape per column. */
const ORNAMENTS = [
  (size) => new THREE.TorusGeometry(size * 0.22, size * 0.065, 16, 48),
  (size) => new THREE.BoxGeometry(size * 0.38, size * 0.48, size * 0.2),
  (size) => new THREE.IcosahedronGeometry(size * 0.26, 0),
  (size) => new THREE.ConeGeometry(size * 0.23, size * 0.5, 24),
];

/** Where display `index` stands and how big it is. */
export function displayLayout(index) {
  const distance = DISTANCES[index];
  const row = index < 4 ? FRONT_ROW : REAR_ROW;
  const column = index % 4;
  return {
    distance,
    size: distance * row.scale,
    x: row.columns[column] * distance,
    y: EYE_HEIGHT + row.elevations[column] * distance,
    ornamentLift: row.ornamentLift,
  };
}

function drawFloorTile(g) {
  g.fillStyle = '#938777';
  g.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  g.strokeStyle = '#5c554e';
  g.lineWidth = 5;
  g.strokeRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = i % 2 ? '#a89a87' : '#817668';
    g.fillRect((i * 137) % TEXTURE_SIZE, (i * 73) % TEXTURE_SIZE, 2, 3);
  }
}

function addFloor(scene, paint) {
  const tiles = repeatTexture(paint(TEXTURE_SIZE, TEXTURE_SIZE, drawFloorTile), 18, 26);
  const material = new THREE.MeshStandardMaterial({ map: tiles });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 26), material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -11;
  floor.receiveShadow = true;
  scene.add(floor);
}

function addWalls(kit) {
  const wall = kit.material('#b6aa99');
  kit.box([0.2, 8, 26], wall, [-9, 4, -11]);
  kit.box([0.2, 8, 26], wall, [9, 4, -11]);
  kit.box([18, 8, 0.2], wall, [0, 4, -24]);
  kit.box([18, 0.15, 26], kit.material('#ddd4c4'), [0, 8, -11]); // ceiling
}

function addLighting(scene, kit) {
  const key = new THREE.DirectionalLight('#ffe3bb', 2);
  key.position.set(-3, 7, 2);
  key.target.position.set(0, 1, -10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const bounds = { left: -10, right: 10, top: 15, bottom: -15, near: 0.5, far: 45 };
  Object.assign(key.shadow.camera, bounds);
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = 0.015;
  scene.add(key, key.target);

  const panel = new THREE.MeshStandardMaterial({
    color: '#fff1dc',
    emissive: '#fff1dc',
    emissiveIntensity: 0.7,
  });
  for (const z of [-2, -9, -16, -22]) kit.box([3, 0.05, 0.8], panel, [0, 7.85, z]);
}

/** A pedestal carrying a labelled block with an ornament on top. */
function addDisplay(kit, paint, index) {
  const { distance, size, x, y, ornamentLift } = displayLayout(index);
  const color = COLORS[index];
  const pedestalHeight = y - size * 0.65;
  const pedestal = [size * 0.85, pedestalHeight, size * 0.85];
  kit.box(pedestal, kit.material('#d8caba'), [x, pedestalHeight / 2, -distance - size * 0.6]);

  // The labelled front face lies exactly at the marked optical depth.
  const label = paint(TEXTURE_SIZE, TEXTURE_SIZE, (g) => drawDistanceLabel(g, color, distance));
  const labelled = new THREE.MeshStandardMaterial({ map: label });
  kit.box([size, size * 1.3, size * 0.35], labelled, [x, y, -distance - size * 0.175]);

  const position = [x, y + size * ornamentLift, -distance - size * 0.4];
  const ornament = kit.mesh(ORNAMENTS[index % 4](size), kit.material(color), position);
  ornament.receiveShadow = false;
}

export function galleryScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#343039');
  scene.add(new THREE.HemisphereLight('#fff1dc', '#75695e', 1.2));
  const kit = createMeshKit(scene);
  const paint = createTexturePainter(renderer);
  addFloor(scene, paint);
  addWalls(kit);
  addLighting(scene, kit);
  DISTANCES.forEach((_, index) => addDisplay(kit, paint, index));

  const rig = createThinLensCamera({
    renderer,
    scene,
    eye: new THREE.Vector3(0, EYE_HEIGHT, 0),
    target: new THREE.Vector3(0, EYE_HEIGHT, -10),
    far: 100,
  });
  // Nothing moves, but depth of field still needs many lens samples, so this is not a flat scene.
  return createCameraScene(INFO, rig, 5);
}
