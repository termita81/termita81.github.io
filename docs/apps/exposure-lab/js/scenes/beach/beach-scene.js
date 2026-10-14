import * as THREE from 'three';
import { createCameraScene } from '../lib/camera-scene.js';
import { createMeshKit } from '../lib/mesh-kit.js';
import { createTexturePainter } from '../lib/textures.js';
import { createThinLensCamera } from '../lib/thin-lens-camera.js';
import { addGoldenHourSky, addGoldenReflection } from './golden-hour.js';
import { addEsky, addFriesPlate, addSandcastle, addTowel, addUmbrella } from './picnic.js';
import { createSeagull } from './seagull.js';
import { addFoam, addMountain, addSand, addSea } from './shore.js';
import { createFishingBoat, createJetski } from './watercraft.js';

function addSunlight(scene, { ambient, sun: sunlight }) {
  scene.add(new THREE.HemisphereLight(ambient.sky, ambient.ground, ambient.intensity));
  const sun = new THREE.DirectionalLight(sunlight.color, sunlight.intensity);
  sun.position.set(...sunlight.position);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  // NOTE: these bounds only take effect once updateProjectionMatrix() is called, which happens
  // for the golden-hour variant alone (see extendShadows). The sunny variant therefore renders
  // with three.js' default ±5 m shadow frustum. Left as is to keep its picture unchanged.
  const bounds = { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 100 };
  Object.assign(sun.shadow.camera, bounds);
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  return sun;
}

/** The low golden-hour sun is far away, so its shadow camera has to reach further. */
function extendShadows(sun) {
  sun.shadow.camera.far = 130;
  sun.shadow.camera.updateProjectionMatrix();
}

function addLandscape(scene, kit, variant) {
  const paint = createTexturePainter(kit.renderer);
  addSand(kit, paint);
  addSea(kit, paint, variant.water);
  if (variant.goldenHour) addGoldenReflection(scene);
  addFoam(kit);
  addMountain(kit, paint, variant.mountain);
}

function addPicnic(scene, kit, variant) {
  addTowel(kit);
  addUmbrella(kit);
  addEsky(scene, kit);
  for (const castle of variant.castles) addSandcastle(scene, kit, castle);
  // The fries sit beneath the gull's closest swoop, beside the golden-hour castle.
  if (variant.goldenHour) addFriesPlate(scene, kit);
}

/** Everything that moves. Returns `update(time)` and the jetski's `wake` material. */
function addActors(scene, kit, goldenHour) {
  const palette = { skin: kit.material('#d6a071'), dark: kit.material('#253847') };
  const boat = createFishingBoat(scene, kit, palette);
  const jetski = goldenHour ? null : createJetski(scene, kit, palette);
  const seagull = goldenHour ? createSeagull(scene) : null;
  return {
    wake: jetski?.wake,
    update(time) {
      seagull?.update(time);
      jetski?.update(time);
      boat.update(time);
    },
  };
}

export function beachScene(renderer, variant) {
  const scene = new THREE.Scene();
  const sky = new THREE.Color().setRGB(...variant.sky);
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 1600, 10000);
  const sun = addSunlight(scene, variant);
  if (variant.goldenHour) {
    addGoldenHourSky(scene);
    extendShadows(sun);
  }

  const kit = { ...createMeshKit(scene), renderer };
  addLandscape(scene, kit, variant);
  addPicnic(scene, kit, variant);
  const actors = addActors(scene, kit, variant.goldenHour);

  // Autofocus looks through the jetski's translucent spray.
  const findFocusHit = (raycaster) =>
    raycaster
      .intersectObjects(scene.children, true)
      .find((hit) => hit.object.material !== actors.wake);

  const rig = createThinLensCamera({
    renderer,
    scene,
    eye: new THREE.Vector3(0, 1.65, 6),
    target: new THREE.Vector3(0, 0.8, -35),
    far: 12000,
    setTime: actors.update,
    findFocusHit,
  });
  return createCameraScene(variant.info, rig, 10);
}
