import * as THREE from 'three';
import { createCameraScene } from './lib/camera-scene.js';
import { createMeshKit } from './lib/mesh-kit.js';
import { createTexturePainter, repeatTexture } from './lib/textures.js';
import { createThinLensCamera } from './lib/thin-lens-camera.js';

const INFO = {
  id: 'shapes',
  name: 'Floating shapes',
  ev: 12,
  thumbnail: 'floating-shapes.jpg', // rendered at time 0.15 s with a 0.1 s shutter
  note:
    'The ring spins fast, the green ball bobs slowly. Click the viewfinder in AF to choose a ' +
    'focus point, or use MF to choose a distance.',
};

const CUBE_SIZE = 0.34;

const material = (options) =>
  new THREE.MeshStandardMaterial({ metalness: 0, roughness: 0.5, ...options });

function addLighting(scene) {
  // Soft, even light: a white surface facing up reflects about 1.0, so 18% gray lands on mid gray.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-2.5, 5, 2.4);
  sun.target.position.set(0, 0.4, -2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const bounds = { left: -3.4, right: 3.4, top: 3.4, bottom: -3.4, near: 1, far: 16 };
  Object.assign(sun.shadow.camera, bounds);
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
}

/** Textures that keep their edges crisp when zoomed in. */
function createCrispPainter(renderer) {
  const paint = createTexturePainter(renderer);
  return (width, height, draw) => {
    const texture = paint(width, height, draw);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  };
}

function drawChecker(g, w, h) {
  g.fillStyle = '#8c8c8c';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#585858';
  g.fillRect(0, 0, w / 2, h / 2);
  g.fillRect(w / 2, h / 2, w / 2, h / 2);
}

function drawCubeFace(g, w) {
  g.fillStyle = '#b4532f';
  g.fillRect(0, 0, w, w);
  g.strokeStyle = '#d9c89d';
  g.lineWidth = 8;
  for (let i = 1; i < 4; i++) {
    const p = (i * w) / 4;
    g.beginPath();
    g.moveTo(p, 0);
    g.lineTo(p, w);
    g.moveTo(0, p);
    g.lineTo(w, p);
    g.stroke();
  }
  g.lineWidth = 28;
  g.strokeRect(14, 14, w - 28, w - 28);
  g.beginPath();
  g.arc(w / 2, w / 2, w * 0.17, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 12;
  g.stroke();
}

function drawBands(g, w, h) {
  for (let i = 0; i < 10; i++) {
    g.fillStyle = i % 2 ? '#c69a2c' : '#cfc9b6';
    g.fillRect(0, (i * h) / 10, w, h / 10 + 1);
  }
}

/** Ground: 25 cm checks that average out to mid gray. */
function addGround(scene, paint) {
  const checker = repeatTexture(paint(512, 512, drawChecker), 600, 600);
  const skin = new THREE.MeshLambertMaterial({ map: checker });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), skin);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

function addShapes(kit, paint) {
  const cubeSkin = material({ map: paint(512, 512, drawCubeFace), roughness: 0.6 });
  const bandSkin = material({ map: paint(16, 512, drawBands), roughness: 0.7 });
  const blue = material({ color: 0x2b6cb0, roughness: 0.3 });
  const green = material({ color: 0x2f9e78, roughness: 0.3 });

  const cubeShape = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const shapes = {
    // The subject, in focus.
    cube: kit.mesh(cubeShape, cubeSkin, [0, 0.5, -2]),
    // Beside the cube; spins fast.
    ring: kit.mesh(new THREE.TorusGeometry(0.13, 0.05, 32, 96), blue, [0.47, 0.52, -1.95]),
    // Foreground; bobs slowly.
    ball: kit.mesh(new THREE.SphereGeometry(0.09, 48, 32), green, [-0.33, 0.55, -1.25]),
    // Background; does not move.
    farBall: kit.mesh(new THREE.SphereGeometry(0.35, 64, 48), bandSkin, [-1, 0.75, -5]),
  };
  shapes.farBall.rotation.z = 0.35;
  return shapes;
}

function animate({ cube, ring, ball }, time) {
  cube.rotation.y = 0.5 + time * 0.21; // 12 degrees per second
  ring.rotation.set(0.45, time * 7.85, 0); // 1.25 turns per second
  ball.position.y = 0.55 + 0.06 * Math.sin(time * 3.77); // 0.6 bobs per second
}

export function shapesScene(renderer) {
  const scene = new THREE.Scene();
  const sky = new THREE.Color().setRGB(0.42, 0.56, 0.76); // linear values
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 10, 60);
  addLighting(scene);
  const paint = createCrispPainter(renderer);
  const ground = addGround(scene, paint);
  const shapes = addShapes(createMeshKit(scene), paint);
  const focusTargets = [...Object.values(shapes), ground];

  const eye = new THREE.Vector3(0, 0.85, 0);
  const rig = createThinLensCamera({
    renderer,
    scene,
    eye,
    target: shapes.cube.position,
    far: 400,
    setTime: (time) => animate(shapes, time),
    findFocusHit: (raycaster) => raycaster.intersectObjects(focusTargets, false)[0],
  });
  // Start focused on the front face of the cube.
  return createCameraScene(INFO, rig, eye.distanceTo(shapes.cube.position) - CUBE_SIZE / 2);
}
