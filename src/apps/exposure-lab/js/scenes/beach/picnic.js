/** The things on the sand: towel, umbrella, esky, sandcastles and a plate of fries. */
import * as THREE from 'three';
import { createSeededRandom } from '../lib/random.js';

const FRY_COUNT = 48;
const FRY_HEAP_RADIUS = 0.235;
const FRY_SEED = 731;

export function addTowel(kit) {
  const towel = kit.box([1.65, 0.025, 2.2], kit.material('#e96b4a'), [-2.15, 0.015, -3.4]);
  towel.rotation.y = -0.08;
  const stripe = kit.material('#ffe7bb');
  for (let i = 0; i < 7; i++) {
    kit.box([1.65, 0.012, 0.075], stripe, [-2.15, 0.034, -4.35 + i * 0.3]);
  }
}

export function addUmbrella(kit) {
  const pole = kit.material('#ece4d6');
  const canopy = [
    kit.material('#ef5948', { side: THREE.DoubleSide }),
    kit.material('#fff0bf', { side: THREE.DoubleSide }),
  ];
  kit.cylinder([0.035, 0.035, 2.45], pole, [-2.6, 1.21, -4.15]);
  for (let i = 0; i < 8; i++) {
    const start = (i * Math.PI) / 4;
    const panel = new THREE.ConeGeometry(1.55, 0.6, 8, 1, true, start, Math.PI / 4);
    kit.mesh(panel, canopy[i % 2], [-2.6, 2.25, -4.15]);
  }
  kit.cylinder([0.08, 0.08, 0.12], pole, [-2.6, 2.61, -4.15]); // cap
}

/* ---------- Esky: an open cooler with ice and two labelled beer bottles ---------- */

function addEskyShell(kit, esky) {
  const blue = kit.material('#3194bd');
  kit.box([0.9, 0.12, 0.65], blue, [0, 0.09, 0], esky);
  for (const x of [-0.42, 0.42]) kit.box([0.07, 0.42, 0.65], blue, [x, 0.3, 0], esky);
  for (const z of [-0.29, 0.29]) kit.box([0.78, 0.42, 0.07], blue, [0, 0.3, z], esky);
  kit.box([0.75, 0.025, 0.5], kit.material('#cbe4e7'), [0, 0.26, 0], esky); // meltwater
  const lid = kit.box([0.95, 0.065, 0.67], kit.material('#f5f4e9'), [0, 0.78, -0.49], esky);
  lid.rotation.x = -1.1;
}

function addIce(kit, esky) {
  const ice = kit.material('#e2f8ff', { roughness: 0.25 });
  for (let i = 0; i < 12; i++) {
    const position = [((i % 4) - 1.5) * 0.16, 0.3, (Math.floor(i / 4) - 1) * 0.15];
    kit.box([0.1, 0.07, 0.09], ice, position, esky).rotation.y = i * 0.7;
  }
}

function addBeerBottles(kit, esky) {
  const glass = kit.material('#7e4c19', { roughness: 0.25 });
  const cap = kit.material('#e0b848');
  const label = kit.material('#f3d68e');
  for (const x of [-0.17, 0.17]) {
    kit.cylinder([0.06, 0.065, 0.24], glass, [x, 0.42, 0], esky);
    kit.cylinder([0.025, 0.045, 0.12], glass, [x, 0.6, 0], esky);
    kit.cylinder([0.026, 0.026, 0.025], cap, [x, 0.673, 0], esky);
    kit.cylinder([0.061, 0.061, 0.09], label, [x, 0.44, 0], esky);
  }
}

export function addEsky(scene, kit) {
  const esky = new THREE.Group();
  esky.position.set(-0.8, 0, -3.7);
  esky.rotation.y = -0.18;
  scene.add(esky);
  addEskyShell(kit, esky);
  addIce(kit, esky);
  addBeerBottles(kit, esky);
}

/* ---------- Sandcastle ---------- */

function addTower(kit, castle, sand, [x, z]) {
  kit.cylinder([0.14, 0.18, 0.65], sand, [x, 0.325, z], castle);
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const position = [x + Math.cos(angle) * 0.11, 0.68, z + Math.sin(angle) * 0.11];
    kit.box([0.075, 0.08, 0.075], sand, position, castle);
  }
}

export function addSandcastle(scene, kit, { x, z, scale }) {
  const castle = new THREE.Group();
  castle.position.set(x, 0, z);
  castle.scale.setScalar(scale);
  scene.add(castle);
  const sand = kit.material('#c6a56b');
  kit.box([0.7, 0.43, 0.65], sand, [0, 0.215, 0], castle);
  for (const towerX of [-0.35, 0.35]) {
    for (const towerZ of [-0.32, 0.32]) addTower(kit, castle, sand, [towerX, towerZ]);
  }
  kit.box([0.14, 0.2, 0.02], kit.material('#7a623f'), [0, 0.1, 0.336], castle); // door
}

/* ---------- Plate of fries ---------- */

/** One fry of the heap. The order of the `random()` calls fixes the heap's look. */
function randomFry(random) {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * FRY_HEAP_RADIUS;
  const length = 0.21 + random() * 0.15;
  const width = 0.048 + random() * 0.02;
  const thickness = 0.038 + random() * 0.015;
  const centre = 1 - radius / FRY_HEAP_RADIUS; // 1 in the middle of the heap, 0 at its edge
  const tilt = (random() - 0.5) * (0.45 + centre * 1.6);
  const yaw = random() * Math.PI * 2;
  const roll = (random() - 0.5) * 0.6;
  const lift = random() * 0.035;
  return { angle, radius, centre, lift, size: [width, thickness, length], turn: [tilt, yaw, roll] };
}

const fryRotation = new THREE.Matrix4();

/** Half the height a rotated fry takes up. */
function halfHeight(fry, [width, thickness, length]) {
  const axes = fryRotation.makeRotationFromEuler(fry.rotation).elements;
  const height =
    Math.abs(axes[1]) * width + Math.abs(axes[5]) * thickness + Math.abs(axes[9]) * length;
  return height / 2;
}

function addFry(kit, plate, skin, shape) {
  const { angle, radius, centre, lift, size } = shape;
  const position = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.75];
  const fry = kit.box(size, skin, position, plate);
  fry.rotation.set(...shape.turn, 'YXZ');
  // Raise the centre into a loose mound, with flatter chips around its edges.
  fry.position.y = 0.058 + centre ** 1.3 * 0.11 + lift + halfHeight(fry, size);
}

export function addFriesPlate(scene, kit) {
  const plate = new THREE.Group();
  plate.name = 'fries-plate';
  plate.position.set(0.83, 0, -1.65);
  plate.scale.setScalar(1.5);
  scene.add(plate);

  const ceramic = kit.material('#f4f1e5', { roughness: 0.35 });
  kit.cylinder([0.32, 0.29, 0.035], ceramic, [0, 0.025, 0], plate);
  const rim = kit.mesh(new THREE.TorusGeometry(0.31, 0.024, 10, 48), ceramic, [0, 0.046, 0], plate);
  rim.rotation.x = Math.PI / 2;

  const skins = ['#f4c35b', '#dfaa41', '#ecc075'].map((color) => kit.material(color));
  // Seeded, so the irregular heap is identical across lens samples and captured photos.
  const random = createSeededRandom(FRY_SEED);
  for (let i = 0; i < FRY_COUNT; i++) addFry(kit, plate, skins[i % 3], randomFry(random));
}
