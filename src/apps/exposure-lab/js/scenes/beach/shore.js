/** The beach landscape: sand, sea, foam and the mountain across the water. */
import * as THREE from 'three';
import { repeatTexture } from '../lib/textures.js';

const TEXTURE_SIZE = 256;
const RIDGE_HALF_WIDTH = 2700; // metres
const RIDGE_TEXTURE_HEIGHT = 800; // metres of mountainside covered by the texture

/** An irregular ridge with a 780 m summit, about 5.5 km away: [x, height] in metres. */
// prettier-ignore
const RIDGE_PROFILE = [
  [-2700, 0], [-2300, 160], [-1920, 240], [-1650, 190], [-1220, 410], [-950, 350],
  [-620, 640], [-290, 540], [100, 780], [380, 670], [690, 430], [940, 510],
  [1320, 280], [1640, 330], [2020, 130], [2700, 0],
];

/** Branching gullies that follow the slopes: paths of [x, height] in metres. */
// prettier-ignore
const GULLIES = [
  [[100, 770], [-20, 620], [40, 460], [-140, 250], [-250, 35]],
  [[100, 770], [260, 590], [240, 400], [420, 200], [520, 25]],
  [[40, 460], [-220, 370], [-410, 200], [-520, 30]],
  [[260, 590], [440, 470], [580, 260], [790, 25]],
  [[-620, 630], [-750, 480], [-720, 310], [-950, 35]],
  [[-620, 630], [-480, 460], [-500, 330], [-350, 170], [-330, 30]],
  [[-750, 480], [-930, 350], [-1100, 140], [-1230, 30]],
  [[-1220, 400], [-1350, 270], [-1320, 140], [-1510, 25]],
  [[940, 500], [900, 340], [1090, 180], [1170, 25]],
  [[940, 500], [1100, 340], [1190, 210], [1410, 25]],
  [[1640, 320], [1540, 220], [1630, 110], [1770, 20]],
  [[-1920, 230], [-1830, 160], [-1910, 80], [-2070, 20]],
];

function drawSand(g) {
  g.fillStyle = '#d9bf87';
  g.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < 3500; i++) {
    g.fillStyle = i % 2 ? '#c2a76f' : '#ead5a4';
    g.fillRect((i * 73) % 257, (i * 113) % 251, 1, 1);
  }
}

export function addSand(kit, paint) {
  const sandMap = repeatTexture(paint(TEXTURE_SIZE, TEXTURE_SIZE, drawSand), 90, 30);
  kit.box([500, 0.2, 80], kit.material('#ffffff', { map: sandMap }), [0, -0.13, 26]);
  kit.box([500, 0.025, 3], kit.material('#aa9875'), [0, -0.015, -12.5]); // wet sand
}

function drawWater(g, water) {
  g.fillStyle = water.base;
  g.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < 130; i++) {
    g.fillStyle = i % 3 ? water.ripple : water.highlight;
    g.fillRect((i * 79) % 239, (i * 47) % 256, 8 + (i % 19), 1);
  }
}

export function addSea(kit, paint, water) {
  const draw = (g) => drawWater(g, water);
  const waterMap = repeatTexture(paint(TEXTURE_SIZE, TEXTURE_SIZE, draw), 1000, 500);
  const surface = kit.material('#ffffff', {
    map: waterMap,
    roughness: water.roughness,
    metalness: water.metalness,
  });
  const sea = kit.mesh(new THREE.PlaneGeometry(12000, 8000), surface, [0, -0.06, -4014]);
  sea.rotation.x = -Math.PI / 2;
  sea.castShadow = false;
  sea.receiveShadow = false;
}

export function addFoam(kit) {
  const foam = kit.material('#e8f9f3');
  for (let i = 0; i < 26; i++) {
    const position = [-240 + i * 19, -0.025, -14.2 - (i % 3) * 0.3];
    kit.box([12 + (i % 7), 0.015, 0.08], foam, position).castShadow = false;
  }
}

function ridgeShape() {
  const ridge = new THREE.Shape();
  ridge.moveTo(...RIDGE_PROFILE[0]);
  for (const point of RIDGE_PROFILE.slice(1)) ridge.lineTo(...point);
  ridge.lineTo(RIDGE_HALF_WIDTH, -20);
  ridge.lineTo(-RIDGE_HALF_WIDTH, -20);
  ridge.closePath();
  return ridge;
}

/** Metres on the mountainside → pixels on its texture. */
const toTexel = ([x, y]) => [
  ((x + RIDGE_HALF_WIDTH) / (2 * RIDGE_HALF_WIDTH)) * TEXTURE_SIZE,
  (1 - y / RIDGE_TEXTURE_HEIGHT) * TEXTURE_SIZE,
];

function drawMountainside(g, colors) {
  g.fillStyle = colors.rock;
  g.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  g.strokeStyle = colors.gullies;
  g.globalAlpha = 0.65; // the gullies fade into the distant atmospheric haze
  g.lineWidth = 1.2;
  g.lineJoin = 'round';
  for (const path of GULLIES) {
    const [first, ...rest] = path.map(toTexel);
    g.beginPath();
    g.moveTo(...first);
    for (const point of rest) g.lineTo(...point);
    g.stroke();
  }
}

export function addMountain(kit, paint, colors) {
  const draw = (g) => drawMountainside(g, colors);
  const face = paint(TEXTURE_SIZE, TEXTURE_SIZE, draw);
  // The extruded shape's texture coordinates are in metres.
  repeatTexture(face, 1 / (2 * RIDGE_HALF_WIDTH), 1 / RIDGE_TEXTURE_HEIGHT);
  face.offset.x = 0.5;
  const shape = { depth: 500, bevelEnabled: false, steps: 1 };
  const geometry = new THREE.ExtrudeGeometry(ridgeShape(), shape);
  const rock = kit.material('#ffffff', { roughness: 1, map: face });
  kit.mesh(geometry, rock, [0, 0, -6000]).castShadow = false;
}
