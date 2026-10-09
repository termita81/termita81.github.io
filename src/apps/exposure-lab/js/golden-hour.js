import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { cloneTemplate } from "./dom.js";

export function addGoldenHourSky(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(11000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 direction;
      void main() {
        float altitude = max(normalize(direction).y, 0.0);
        vec3 horizon = vec3(0.84, 0.43, 0.22);
        vec3 upper = vec3(0.25, 0.34, 0.52);
        vec3 color = mix(horizon, upper, smoothstep(0.0, 0.45, altitude));
        gl_FragColor = vec4(color, 1.0);
      }`,
  }));
  sky.renderOrder = -1;
  scene.add(sky);

  const canvas = cloneTemplate("canvas-template");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  glow.addColorStop(0, "#fffbe0");
  glow.addColorStop(0.22, "#fff5ba");
  glow.addColorStop(0.27, "#ffdda0");
  glow.addColorStop(0.3, "#ffc77599");
  glow.addColorStop(0.6, "#ffa54b22");
  glow.addColorStop(1, "#ffa54b00");
  context.fillStyle = glow;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
  sun.position.set(1250, 950, -5000);
  sun.scale.set(250, 250, 1);
  scene.add(sun);
}

export function addGoldenReflection(scene) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [], colors = [];
  const amber = new THREE.Color("#ffd18c");
  const muted = new THREE.Color("#b98755");
  for (let i = 0; i < 100; i++) {
    const distance = 24 + i * i * 0.85;
    const center = distance * 0.25 + Math.sin(i * 2.4) * (0.3 + distance * 0.003);
    const halfWidth = (0.3 + distance * 0.012) * (0.45 + (i * 37 % 17) / 17);
    const depth = 0.08 + distance * 0.0008;
    const z = 6 - distance;
    vertices.push(center - halfWidth, -0.045, z, center + halfWidth, -0.045, z,
      center + halfWidth, -0.045, z - depth, center - halfWidth, -0.045, z,
      center + halfWidth, -0.045, z - depth, center - halfWidth, -0.045, z - depth);
    const color = amber.clone().lerp(muted, (i % 5) / 7);
    for (let j = 0; j < 6; j++) colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const reflection = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.65, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  scene.add(reflection);
}
