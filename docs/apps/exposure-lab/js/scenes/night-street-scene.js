import * as THREE from 'three';
import { createCameraScene } from './lib/camera-scene.js';
import { createMeshKit } from './lib/mesh-kit.js';
import { createThinLensCamera } from './lib/thin-lens-camera.js';

const INFO = {
  id: 'night',
  name: 'City street at night',
  ev: 5,
  thumbnail: 'city-street-at-night.jpg', // rendered at time 0 with a 0.3 s shutter
  note:
    'A secondary city street at EV 5. White headlights approach; red taillights recede, with ' +
    'buildings and warm streetlights on both sides. Slow the shutter for light trails. Click ' +
    'in AF to focus on a car or a building.',
};

const SIDES = [-1, 1];
const WALL_COLORS = ['#63574c', '#505768', '#695d51', '#575451'];
const CAR_SPEED = 9; // metres per second
const LOOP_LENGTH = 140; // metres a car travels before it reappears

const glow = (color, intensity) =>
  new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: color,
    emissiveIntensity: intensity,
  });

function addStreet(kit) {
  const road = kit.material('#424247');
  const pavement = kit.material('#77736d');
  const marking = kit.material('#ccc7b5');
  kit.box([8, 0.1, 200], road, [0, -0.05, -85]);
  for (const side of SIDES) {
    kit.box([3, 0.15, 200], pavement, [side * 5.5, 0, -85]);
    kit.box([0.16, 0.2, 200], pavement, [side * 4.1, 0, -85]); // kerb
  }
  for (let z = 10; z > -180; z -= 8) kit.box([0.12, 0.012, 3], marking, [0, 0.012, z]);
}

function addBuilding(kit, windows, side, index) {
  const z = 4 - index * 10;
  const height = 10 + ((index * 7) % 5) * 3;
  const wall = kit.material(WALL_COLORS[index % WALL_COLORS.length]);
  kit.box([10, height, 9.8], wall, [side * 12, height / 2, z]);
  for (let y = 4; y < height - 1; y += 3) {
    for (let offset = -3; offset <= 3; offset += 3) {
      const pattern = (index + Math.round(y) + offset + (side > 0 ? 1 : 0) + 30) % 3;
      kit.box([0.025, 1.4, 1.2], windows.upper[pattern], [side * 6.98, y, z + offset]);
    }
  }
  const shopfront = index % 3 ? windows.dark : windows.upper[0];
  kit.box([0.03, 2.3, 6], shopfront, [side * 6.97, 1.6, z]);
}

function addBuildings(kit) {
  const dark = kit.material('#111822');
  const windows = { dark, upper: [glow('#ffdc9f', 0.35), glow('#d5e2ff', 0.25), dark] };
  for (const side of SIDES) {
    for (let index = 0; index < 16; index++) addBuilding(kit, windows, side, index);
  }
}

function addStreetlights(scene, kit) {
  const metal = kit.material('#35373c');
  const lamp = glow('#ffd195', 6);
  for (const side of SIDES) {
    for (let z = -3; z > -140; z -= 18) {
      kit.box([0.1, 5.6, 0.1], metal, [side * 4.8, 2.8, z]); // post
      kit.box([1.2, 0.1, 0.1], metal, [side * 4.25, 5.5, z]); // arm
      kit.box([0.4, 0.12, 0.25], lamp, [side * 3.7, 5.4, z]);
      const light = new THREE.PointLight('#ffc788', 45, 25, 2);
      light.position.set(side * 3.7, 5.2, z);
      scene.add(light);
    }
  }
}

function addWheels(kit, car) {
  const tyre = kit.material('#101010');
  for (const x of [-0.88, 0.88]) {
    for (const z of [-1.3, 1.3]) {
      kit.cylinder([0.33, 0.33, 0.22], tyre, [x, 0.33, z], car).rotation.z = Math.PI / 2;
    }
  }
}

function addLamps(kit, car) {
  for (const x of [-0.6, 0.6]) {
    kit.box([0.35, 0.16, 0.035], glow('#fff5e0', 12), [x, 0.8, 2.12], car); // headlight
    kit.box([0.3, 0.14, 0.035], glow('#ff2818', 3), [x, 0.8, -2.12], car); // taillight
  }
  const beam = new THREE.SpotLight('#fff3dc', 100, 40, 0.5, 0.65, 2);
  beam.position.set(0, 0.7, 2.2);
  beam.target.position.set(0, 0, 16);
  car.add(beam, beam.target);
}

function addCar(scene, kit, { color, heading, lane }) {
  const car = new THREE.Group();
  kit.box([1.8, 0.7, 4.2], kit.material(color), [0, 0.65, 0], car); // body
  kit.box([1.6, 0.6, 2.1], kit.material('#18222f'), [0, 1.3, 0.2], car); // cabin
  addWheels(kit, car);
  addLamps(kit, car);
  car.rotation.y = heading;
  car.position.x = lane;
  scene.add(car);
  return car;
}

/** Wraps a distance into 0…LOOP_LENGTH, for negative times too. */
const loop = (distance) => ((distance % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;

function driveCars({ oncoming, departing }, time) {
  oncoming.position.z = -22 + loop(time * CAR_SPEED + 100) - 100;
  departing.position.z = -32 - loop(time * CAR_SPEED + 20) + 20;
}

export function nightStreetScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color().setRGB(0.002, 0.003, 0.008);
  scene.fog = new THREE.Fog(scene.background, 65, 180);
  scene.add(new THREE.HemisphereLight('#8a9abb', '#30251b', 0.22));
  const kit = createMeshKit(scene, { roughness: 0.85, shadows: false });
  addStreet(kit);
  addBuildings(kit);
  addStreetlights(scene, kit);
  const cars = {
    oncoming: addCar(scene, kit, { color: '#61738b', heading: 0, lane: -2 }),
    departing: addCar(scene, kit, { color: '#8e2520', heading: Math.PI, lane: 2 }),
  };

  const rig = createThinLensCamera({
    renderer,
    scene,
    eye: new THREE.Vector3(0, 1.6, 0),
    target: new THREE.Vector3(0, 2.2, -55),
    far: 250,
    setTime: (time) => driveCars(cars, time),
  });
  return createCameraScene(INFO, rig, 22);
}
