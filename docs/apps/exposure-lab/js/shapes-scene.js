import { createCameraAim } from "./camera-aim.js";
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { W, H, SENSOR_W, SENSOR_H } from './constants.js';
import { renderer } from './renderer.js';
import { cloneTemplate } from './dom.js';

export function shapesScene({ id, name, note, ev }) {
  const scene = new THREE.Scene();
  const sky = new THREE.Color().setRGB(0.42, 0.56, 0.76);        // linear values
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 10, 60);

  // Soft, even light: a white surface facing up reflects about 1.0, so 18% gray lands on mid gray.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-2.5, 5.0, 2.4);
  sun.target.position.set(0, 0.4, -2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3.4, right: 3.4, top: 3.4, bottom: -3.4, near: 1, far: 16 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const makeTexture = (w, h, draw) => {
    const canvas = cloneTemplate('canvas-template');
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.magFilter = THREE.NearestFilter;                     // keep edges crisp when zoomed in
    return texture;
  };

  // Ground: 25 cm checks that average out to mid gray.
  const checker = makeTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#8c8c8c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#585858'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
  });
  checker.wrapS = checker.wrapT = THREE.RepeatWrapping;
  checker.repeat.set(600, 600);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ map: checker }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const cubeSkin = makeTexture(512, 512, (g, w) => {
    g.fillStyle = '#b4532f'; g.fillRect(0, 0, w, w);
    g.strokeStyle = '#d9c89d'; g.lineWidth = 8;
    for (let i = 1; i < 4; i++) {
      const p = (i * w) / 4;
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, w); g.moveTo(0, p); g.lineTo(w, p); g.stroke();
    }
    g.lineWidth = 28; g.strokeRect(14, 14, w - 28, w - 28);
    g.beginPath(); g.arc(w / 2, w / 2, w * 0.17, 0, Math.PI * 2); g.fill();
    g.lineWidth = 12; g.stroke();
  });
  const bands = makeTexture(16, 512, (g, w, h) => {
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? '#c69a2c' : '#cfc9b6';
      g.fillRect(0, (i * h) / 10, w, h / 10 + 1);
    }
  });

  const material = (options) => new THREE.MeshStandardMaterial({ metalness: 0, roughness: 0.5, ...options });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), material({ map: cubeSkin, roughness: 0.6 }));
  cube.position.set(0, 0.5, -2.0);                               // the subject, in focus
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 32, 96), material({ color: 0x2b6cb0, roughness: 0.3 }));
  ring.position.set(0.47, 0.52, -1.95);                          // beside the cube, spins fast
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 48, 32), material({ color: 0x2f9e78, roughness: 0.3 }));
  ball.position.set(-0.33, 0.55, -1.25);                         // foreground, bobs slowly
  const farBall = new THREE.Mesh(new THREE.SphereGeometry(0.35, 64, 48), material({ map: bands, roughness: 0.7 }));
  farBall.position.set(-1.0, 0.75, -5.0);                        // background, does not move
  farBall.rotation.z = 0.35;
  for (const mesh of [cube, ring, ball, farBall]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function setTime(t) {
    cube.rotation.y = 0.5 + t * 0.21;                            // 12 degrees per second
    ring.rotation.set(0.45, t * 7.85, 0);                        // 1.25 turns per second
    ball.position.y = 0.55 + 0.06 * Math.sin(t * 3.77);          // 0.6 bobs per second
  }

  // Thin-lens camera. The projection matrix is built by hand for every sample.
  const NEAR = 0.05, FAR = 400;
  const camera = new THREE.PerspectiveCamera();
  const eye = new THREE.Vector3(0, 0.85, 0);
  camera.position.copy(eye);
  camera.lookAt(cube.position);
  const aim = createCameraAim(camera);
  const { right, up } = aim;
  const focusDistance = eye.distanceTo(cube.position) - 0.17;    // front face of the cube

  const raycaster = new THREE.Raycaster();
  const forward = new THREE.Vector3();
  return {
    ...aim.controls,
    id, name, note, ev, isStatic: false,
    thumbnailExposure: { time: 0.15, shutter: 0.1 },
    focusPoint: null,
    autofocusDistance: focusDistance,
    focusAt(x, y, focal, time) {
      aim.apply();
      setTime(time);
      const halfW = NEAR * (SENSOR_W / 2) / focal;
      const halfH = NEAR * (SENSOR_H / 2) / focal;
      camera.position.copy(eye);
      camera.projectionMatrix.makePerspective(-halfW, halfW, halfH, -halfH, NEAR, FAR);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      camera.updateMatrixWorld(true);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera);
      const hit = raycaster.intersectObjects([cube, ring, ball, farBall, ground], false)[0];
      camera.getWorldDirection(forward);
      this.autofocusDistance = hit ? hit.point.clone().sub(eye).dot(forward) : Infinity;
    },
    renderSample(target, s) {
      aim.apply();
      setTime(s.time);
      const halfW = NEAR * (SENSOR_W / 2) / s.focal;
      const halfH = NEAR * (SENSOR_H / 2) / s.focal;
      // Move the eye to a point on the lens and shear the frustum so the focus plane stays put:
      // anything on that plane lands on the same pixel for every lens point, everything else smears.
      const k = NEAR / (s.focusDistance ?? focusDistance);
      const dx = s.jitterX * 2 * halfW / (s.width ?? W) - s.lensX * k;
      const dy = s.jitterY * 2 * halfH / (s.height ?? H) - s.lensY * k;
      camera.projectionMatrix.makePerspective(-halfW + dx, halfW + dx, halfH + dy, -halfH + dy, NEAR, FAR);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      camera.position.copy(eye).addScaledVector(right, s.lensX).addScaledVector(up, s.lensY);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    },
  };
}
