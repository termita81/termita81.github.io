import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { createCameraAim } from './camera-aim.js';
import { cloneTemplate } from './dom.js';

export function galleryScene(renderer, width, height) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#343039');
  scene.add(new THREE.HemisphereLight('#fff1dc', '#75695e', 1.2));
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const box = (size, skin, position) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), skin);
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const texture = draw => {
    const canvas = cloneTemplate('canvas-template');
    canvas.width = canvas.height = 512;
    draw(canvas.getContext('2d'));
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return map;
  };
  const tiles = texture(g => {
    g.fillStyle = '#938777'; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = '#5c554e'; g.lineWidth = 5; g.strokeRect(0, 0, 512, 512);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = i % 2 ? '#a89a87' : '#817668';
      g.fillRect((i * 137) % 512, (i * 73) % 512, 2, 3);
    }
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  tiles.repeat.set(18, 26);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 26), new THREE.MeshStandardMaterial({ map: tiles }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -11;
  floor.receiveShadow = true;
  scene.add(floor);
  const wall = material('#b6aa99');
  box([0.2, 8, 26], wall, [-9, 4, -11]);
  box([0.2, 8, 26], wall, [9, 4, -11]);
  box([18, 8, 0.2], wall, [0, 4, -24]);
  box([18, 0.15, 26], material('#ddd4c4'), [0, 8, -11]);
  const key = new THREE.DirectionalLight('#ffe3bb', 2);
  key.position.set(-3, 7, 2);
  key.target.position.set(0, 1, -10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 15, bottom: -15, near: 0.5, far: 45 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  for (const z of [-2, -9, -16, -22]) {
    box([3, 0.05, 0.8], new THREE.MeshStandardMaterial({ color: '#fff1dc', emissive: '#fff1dc', emissiveIntensity: 0.7 }), [0, 7.85, z]);
  }
  const distances = [1, 2, 3, 5, 8, 12, 16, 20];
  const colors = ['#b86446', '#4d789b', '#688257', '#c49c42', '#a4778c', '#558c87', '#a97f50', '#7183a5'];
  distances.forEach((distance, i) => {
    const nearby = i < 4;
    // Offset the rear displays into the gaps and lift their labels above the front ornaments.
    const columns = nearby ? [-0.27, -0.09, 0.09, 0.27] : [-0.22, -0.035, 0.15, 0.285];
    const elevation = nearby ? -0.125 : [0.107, 0.112, 0.105, 0.11][i - 4];
    const x = columns[i % 4] * distance;
    const y = 1.6 + elevation * distance;
    // Slightly smaller rear displays leave room for taller pedestals within the initial view.
    const size = distance * (nearby ? 0.12 : 0.105);
    const bottom = y - size * 0.65;
    box([size * 0.85, bottom, size * 0.85], material('#d8caba'), [x, bottom / 2, -distance - size * 0.6]);
    const skin = new THREE.MeshStandardMaterial({ map: texture(g => {
      g.fillStyle = colors[i]; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = '#f8ecd8'; g.lineWidth = 5;
      for (let line = 0; line < 16; line++) {
        g.beginPath(); g.moveTo(line * 32, 0); g.lineTo(line * 32, 340); g.stroke();
      }
      g.fillStyle = '#f8ecd8'; g.fillRect(12, 360, 488, 140);
      // Draw the distance as crisp engraved strokes, independent of font loading.
      g.strokeStyle = '#302b28'; g.lineWidth = 9; g.lineCap = 'round';
      const segments = [
        [0, 0, 42, 0], [42, 0, 42, 36], [42, 36, 42, 72],
        [0, 72, 42, 72], [0, 36, 0, 72], [0, 0, 0, 36], [0, 36, 42, 36],
      ];
      const digits = ['012345', '12', '01463', '01263', '5612', '05623', '056432', '012', '0123456', '012356'];
      const text = String(distance);
      const start = 256 - (text.length * 62 + 72) / 2;
      [...text].forEach((digit, index) => {
        for (const segment of digits[Number(digit)]) {
          const [x1, y1, x2, y2] = segments[Number(segment)];
          g.beginPath(); g.moveTo(start + index * 62 + x1, 392 + y1);
          g.lineTo(start + index * 62 + x2, 392 + y2); g.stroke();
        }
      });
      const mx = start + text.length * 62 + 8;
      g.beginPath(); g.moveTo(mx, 464); g.lineTo(mx, 418); g.lineTo(mx + 22, 418);
      g.lineTo(mx + 22, 464); g.moveTo(mx + 22, 418); g.lineTo(mx + 44, 418);
      g.lineTo(mx + 44, 464); g.stroke();
    }) });
    // The labelled front face lies exactly at the marked optical depth.
    box([size, size * 1.3, size * 0.35], skin, [x, y, -distance - size * 0.175]);
    const ornamentSkin = material(colors[i]);
    let geometry;
    if (i % 4 === 0) geometry = new THREE.TorusGeometry(size * 0.22, size * 0.065, 16, 48);
    if (i % 4 === 1) geometry = new THREE.BoxGeometry(size * 0.38, size * 0.48, size * 0.2);
    if (i % 4 === 2) geometry = new THREE.IcosahedronGeometry(size * 0.26, 0);
    if (i % 4 === 3) geometry = new THREE.ConeGeometry(size * 0.23, size * 0.5, 24);
    const ornament = new THREE.Mesh(geometry, ornamentSkin);
    ornament.position.set(x, y + size * (nearby ? 0.95 : 0.9), -distance - size * 0.4);
    ornament.castShadow = true;
    scene.add(ornament);
  });
  const camera = new THREE.PerspectiveCamera();
  const eye = new THREE.Vector3(0, 1.6, 0);
  camera.position.copy(eye);
  camera.lookAt(0, 1.6, -10);
  const aim = createCameraAim(camera);
  const raycaster = new THREE.Raycaster(), forward = new THREE.Vector3();
  const near = 0.05, far = 100;
  function project(focal, dx = 0, dy = 0) {
    const halfW = near * 18 / focal, halfH = near * 12 / focal;
    camera.projectionMatrix.makePerspective(-halfW + dx, halfW + dx, halfH + dy, -halfH + dy, near, far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  return {
    ...aim.controls,
    id: 'gallery', name: 'Focus gallery', ev: 7,
    // Stationary geometry still needs multiple lens samples for depth of field.
    isStatic: false,
    note: 'A still, warmly lit gallery at EV 7. Labelled front surfaces are 1, 2, 3, 5, 8, 12, 16 and 20 m from the starting camera. Focus on their fine lines, then change aperture to explore depth of field. Nothing moves here.',
    autofocusDistance: 5, focusPoint: null,
    focusAt(x, y, focal) {
      aim.apply();
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
      const k = near / (s.focusDistance ?? this.autofocusDistance);
      project(s.focal, s.jitterX * near * 36 / s.focal / (s.width ?? width) - s.lensX * k,
        s.jitterY * near * 24 / s.focal / (s.height ?? height) - s.lensY * k);
      camera.position.copy(eye).addScaledVector(aim.right, s.lensX).addScaledVector(aim.up, s.lensY);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    },
  };
}
