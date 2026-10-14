/** Golden-hour extras: a graded sky, the sun's disc and its reflection on the water. */
import * as THREE from 'three';
import { canvasTexture } from '../lib/textures.js';

const GLOW_SIZE = 256;
const STREAK_COUNT = 100;
const WATER_LEVEL = -0.045;

const SKY_VERTEX = /* glsl */ `
  varying vec3 direction;
  void main() {
    direction = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const SKY_FRAGMENT = /* glsl */ `
  varying vec3 direction;
  void main() {
    float altitude = max(normalize(direction).y, 0.0);
    vec3 horizon = vec3(0.84, 0.43, 0.22);
    vec3 upper = vec3(0.25, 0.34, 0.52);
    vec3 color = mix(horizon, upper, smoothstep(0.0, 0.45, altitude));
    gl_FragColor = vec4(color, 1.0);
  }`;

function addSkyDome(scene) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(11000, 32, 16), material);
  sky.renderOrder = -1;
  scene.add(sky);
}

function drawSunGlow(g) {
  const centre = GLOW_SIZE / 2;
  const glow = g.createRadialGradient(centre, centre, 0, centre, centre, centre);
  glow.addColorStop(0, '#fffbe0');
  glow.addColorStop(0.22, '#fff5ba');
  glow.addColorStop(0.27, '#ffdda0');
  glow.addColorStop(0.3, '#ffc77599');
  glow.addColorStop(0.6, '#ffa54b22');
  glow.addColorStop(1, '#ffa54b00');
  g.fillStyle = glow;
  g.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
}

function addSunDisc(scene) {
  const material = new THREE.SpriteMaterial({
    map: canvasTexture(GLOW_SIZE, GLOW_SIZE, drawSunGlow),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const sun = new THREE.Sprite(material);
  sun.position.set(1250, 950, -5000);
  sun.scale.set(250, 250, 1);
  scene.add(sun);
}

export function addGoldenHourSky(scene) {
  addSkyDome(scene);
  addSunDisc(scene);
}

/** Two triangles for one glint on the water; glints widen and spread out with distance. */
function streakTriangles(i) {
  const distance = 24 + i * i * 0.85;
  const center = distance * 0.25 + Math.sin(i * 2.4) * (0.3 + distance * 0.003);
  const halfWidth = (0.3 + distance * 0.012) * (0.45 + ((i * 37) % 17) / 17);
  const depth = 0.08 + distance * 0.0008;
  const left = center - halfWidth;
  const right = center + halfWidth;
  const near = 6 - distance;
  const far = near - depth;
  // prettier-ignore
  return [
    left, WATER_LEVEL, near,   right, WATER_LEVEL, near,   right, WATER_LEVEL, far,
    left, WATER_LEVEL, near,   right, WATER_LEVEL, far,    left, WATER_LEVEL, far,
  ];
}

export function addGoldenReflection(scene) {
  const amber = new THREE.Color('#ffd18c');
  const muted = new THREE.Color('#b98755');
  const vertices = [];
  const colors = [];
  for (let i = 0; i < STREAK_COUNT; i++) {
    vertices.push(...streakTriangles(i));
    const color = amber.clone().lerp(muted, (i % 5) / 7);
    for (let vertex = 0; vertex < 6; vertex++) colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  scene.add(new THREE.Mesh(geometry, material));
}
