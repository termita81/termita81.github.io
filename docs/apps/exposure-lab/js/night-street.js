import { createCameraAim } from "./camera-aim.js";
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export function nightStreetScene(renderer, width, height) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color().setRGB(0.002, 0.003, 0.008);
  scene.fog = new THREE.Fog(scene.background, 65, 180);
  scene.add(new THREE.HemisphereLight('#8a9abb', '#30251b', 0.22));
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const glow = (color, intensity) => new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: intensity });
  const box = (size, skin, position, parent = scene) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), skin);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };
  const road = material('#424247'), pavement = material('#77736d');
  box([8, 0.1, 200], road, [0, -0.05, -85]);
  for (const side of [-1, 1]) {
    box([3, 0.15, 200], pavement, [side * 5.5, 0, -85]);
    box([0.16, 0.2, 200], pavement, [side * 4.1, 0, -85]);
  }
  const marking = material('#ccc7b5');
  for (let z = 10; z > -180; z -= 8) box([0.12, 0.012, 3], marking, [0, 0.012, z]);
  const darkWindow = material('#111822');
  const windows = [glow('#ffdc9f', 0.35), glow('#d5e2ff', 0.25), darkWindow];
  const walls = ['#63574c', '#505768', '#695d51', '#575451'];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const z = 4 - i * 10, h = 10 + (i * 7 % 5) * 3;
      box([10, h, 9.8], material(walls[i % walls.length]), [side * 12, h / 2, z]);
      for (let y = 4; y < h - 1; y += 3) {
        for (let offset = -3; offset <= 3; offset += 3) {
          box([0.025, 1.4, 1.2], windows[(i + Math.round(y) + offset + (side > 0 ? 1 : 0) + 30) % 3], [side * 6.98, y, z + offset]);
        }
      }
      box([0.03, 2.3, 6], i % 3 ? darkWindow : windows[0], [side * 6.97, 1.6, z]);
    }
  }
  const metal = material('#35373c'), lamp = glow('#ffd195', 6);
  for (const side of [-1, 1]) {
    for (let z = -3; z > -140; z -= 18) {
      box([0.1, 5.6, 0.1], metal, [side * 4.8, 2.8, z]);
      box([1.2, 0.1, 0.1], metal, [side * 4.25, 5.5, z]);
      box([0.4, 0.12, 0.25], lamp, [side * 3.7, 5.4, z]);
      const light = new THREE.PointLight('#ffc788', 45, 25, 2);
      light.position.set(side * 3.7, 5.2, z);
      scene.add(light);
    }
  }
  function car(color, heading, lane) {
    const group = new THREE.Group();
    box([1.8, 0.7, 4.2], material(color), [0, 0.65, 0], group);
    box([1.6, 0.6, 2.1], material('#18222f'), [0, 1.3, 0.2], group);
    const tyre = material('#101010');
    for (const x of [-0.88, 0.88]) for (const z of [-1.3, 1.3]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16), tyre);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.33, z);
      group.add(wheel);
    }
    for (const x of [-0.6, 0.6]) {
      box([0.35, 0.16, 0.035], glow('#fff5e0', 12), [x, 0.8, 2.12], group);
      box([0.3, 0.14, 0.035], glow('#ff2818', 3), [x, 0.8, -2.12], group);
    }
    const beam = new THREE.SpotLight('#fff3dc', 100, 40, 0.5, 0.65, 2);
    beam.position.set(0, 0.7, 2.2);
    beam.target.position.set(0, 0, 16);
    group.add(beam, beam.target);
    group.rotation.y = heading;
    group.position.x = lane;
    scene.add(group);
    return group;
  }
  const oncoming = car('#61738b', 0, -2), departing = car('#8e2520', Math.PI, 2);
  function setTime(time) {
    oncoming.position.z = -22 + ((time * 9 + 100) % 140 + 140) % 140 - 100;
    departing.position.z = -32 - ((time * 9 + 20) % 140 + 140) % 140 + 20;
  }
  const camera = new THREE.PerspectiveCamera();
  const eye = new THREE.Vector3(0, 1.6, 0);
  camera.position.copy(eye);
  camera.lookAt(0, 2.2, -55);
  const aim = createCameraAim(camera);
  const { right, up } = aim;
  const raycaster = new THREE.Raycaster(), forward = new THREE.Vector3();
  const near = 0.05, far = 250;
  function project(focal, dx = 0, dy = 0) {
    const halfW = near * 18 / focal, halfH = near * 12 / focal;
    camera.projectionMatrix.makePerspective(-halfW + dx, halfW + dx, halfH + dy, -halfH + dy, near, far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  return {
    ...aim.controls,
    id: 'night', name: 'City street at night', ev: 5, isStatic: false,
    thumbnailExposure: { time: 0, shutter: 0.3 },
    note: 'A secondary city street at EV 5. White headlights approach; red taillights recede, with buildings and warm streetlights on both sides. Slow the shutter for light trails. Click in AF to focus on a car or a building.',
    focusPoint: null, autofocusDistance: 22,
    focusAt(x, y, focal, time) {
      aim.apply();
      setTime(time);
      camera.position.copy(eye);
      project(focal);
      camera.updateMatrixWorld(true);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera);
      const hit = raycaster.intersectObjects(scene.children, true)[0];
      camera.getWorldDirection(forward);
      this.autofocusDistance = hit ? hit.point.clone().sub(eye).dot(forward) : Infinity;
    },
    renderSample(target, s) {
      aim.apply();
      setTime(s.time);
      const k = near / (s.focusDistance ?? this.autofocusDistance);
      project(s.focal, s.jitterX * near * 36 / s.focal / (s.width ?? width) - s.lensX * k,
        s.jitterY * near * 24 / s.focal / (s.height ?? height) - s.lensY * k);
      camera.position.copy(eye).addScaledVector(right, s.lensX).addScaledVector(up, s.lensY);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    },
  };
}
