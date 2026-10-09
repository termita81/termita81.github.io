import { createCameraAim } from "./camera-aim.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { cloneTemplate } from "./dom.js";
import { addGoldenHourSky, addGoldenReflection } from "./golden-hour.js";
import { createSeagull } from "./seagull.js";

export function beachScene(renderer, width, height, { goldenHour = false } = {}) {
  const scene = new THREE.Scene();
  const sky = new THREE.Color().setRGB(...(goldenHour ? [0.65, 0.34, 0.2] : [0.32, 0.57, 0.83]));
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 1600, 10000);
  scene.add(new THREE.HemisphereLight(goldenHour ? "#e9c6ae" : "#e0f2ff", goldenHour ? "#77533e" : "#b89c72", goldenHour ? 0.8 : 1.3));
  const sun = new THREE.DirectionalLight(goldenHour ? "#ffb668" : "#fff4df", goldenHour ? 1.6 : 2.2);
  sun.position.set(...(goldenHour ? [10, 7.6, -40] : [-12, 26, 12]));
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    near: 1,
    far: 100,
  });
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  if (goldenHour) {
    addGoldenHourSky(scene);
    sun.shadow.camera.far = 130;
    sun.shadow.camera.updateProjectionMatrix();
  }

  const material = (color, options = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...options });
  function mesh(geometry, skin, position, parent = scene) {
    const object = new THREE.Mesh(geometry, skin);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const box = (size, skin, position, parent) =>
    mesh(new THREE.BoxGeometry(...size), skin, position, parent);
  const cylinder = (top, bottom, length, skin, position, parent) =>
    mesh(
      new THREE.CylinderGeometry(top, bottom, length, 16),
      skin,
      position,
      parent,
    );
  function texture(draw, repeat) {
    const canvas = cloneTemplate("canvas-template");
    canvas.width = canvas.height = 256;
    draw(canvas.getContext("2d"));
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(...repeat);
    map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return map;
  }
  const sandMap = texture(
    (g) => {
      g.fillStyle = "#d9bf87";
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3500; i++) {
        g.fillStyle = i % 2 ? "#c2a76f" : "#ead5a4";
        g.fillRect((i * 73) % 257, (i * 113) % 251, 1, 1);
      }
    },
    [90, 30],
  );
  const sand = material("#ffffff", { map: sandMap });
  box([500, 0.2, 80], sand, [0, -0.13, 26]);
  box([500, 0.025, 3], material("#aa9875"), [0, -0.015, -12.5]);
  const waterMap = texture(
    (g) => {
      g.fillStyle = goldenHour ? "#536f7f" : "#238aaf";
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 130; i++) {
        g.fillStyle = goldenHour ? (i % 3 ? "#778f98" : "#b4aaa0") : (i % 3 ? "#359cba" : "#5cb9cd");
        g.fillRect((i * 79) % 239, (i * 47) % 256, 8 + (i % 19), 1);
      }
    },
    [1000, 500],
  );
  const sea = mesh(
    new THREE.PlaneGeometry(12000, 8000),
    material("#ffffff", { map: waterMap, roughness: goldenHour ? 0.7 : 0.38, metalness: goldenHour ? 0 : 0.15 }),
    [0, -0.06, -4014],
  );
  sea.rotation.x = -Math.PI / 2;
  sea.castShadow = false;
  sea.receiveShadow = false;
  if (goldenHour) addGoldenReflection(scene);
  for (let i = 0; i < 26; i++) {
    const foam = box([12 + (i % 7), 0.015, 0.08], material("#e8f9f3"), [
      -240 + i * 19,
      -0.025,
      -14.2 - (i % 3) * 0.3,
    ]);
    foam.castShadow = false;
  }

  // An irregular ridge across the water, with a 780 m summit about 5.5 km away.
  const profile = [
    [-2700, 0],
    [-2300, 160],
    [-1920, 240],
    [-1650, 190],
    [-1220, 410],
    [-950, 350],
    [-620, 640],
    [-290, 540],
    [100, 780],
    [380, 670],
    [690, 430],
    [940, 510],
    [1320, 280],
    [1640, 330],
    [2020, 130],
    [2700, 0],
  ];
  const ridge = new THREE.Shape();
  ridge.moveTo(...profile[0]);
  for (const point of profile.slice(1)) ridge.lineTo(...point);
  ridge.lineTo(2700, -20);
  ridge.lineTo(-2700, -20);
  ridge.closePath();
  const mountain = mesh(
    new THREE.ExtrudeGeometry(ridge, {
      depth: 500,
      bevelEnabled: false,
      steps: 1,
    }),
    material("#688da0", { roughness: 1 }),
    [0, 0, -6000],
  );
  mountain.castShadow = false;

  // Branching gullies follow the slopes and fade into the distant atmospheric haze.
  const gullies = [
    [
      [100, 770],
      [-20, 620],
      [40, 460],
      [-140, 250],
      [-250, 35],
    ],
    [
      [100, 770],
      [260, 590],
      [240, 400],
      [420, 200],
      [520, 25],
    ],
    [
      [40, 460],
      [-220, 370],
      [-410, 200],
      [-520, 30],
    ],
    [
      [260, 590],
      [440, 470],
      [580, 260],
      [790, 25],
    ],
    [
      [-620, 630],
      [-750, 480],
      [-720, 310],
      [-950, 35],
    ],
    [
      [-620, 630],
      [-480, 460],
      [-500, 330],
      [-350, 170],
      [-330, 30],
    ],
    [
      [-750, 480],
      [-930, 350],
      [-1100, 140],
      [-1230, 30],
    ],
    [
      [-1220, 400],
      [-1350, 270],
      [-1320, 140],
      [-1510, 25],
    ],
    [
      [940, 500],
      [900, 340],
      [1090, 180],
      [1170, 25],
    ],
    [
      [940, 500],
      [1100, 340],
      [1190, 210],
      [1410, 25],
    ],
    [
      [1640, 320],
      [1540, 220],
      [1630, 110],
      [1770, 20],
    ],
    [
      [-1920, 230],
      [-1830, 160],
      [-1910, 80],
      [-2070, 20],
    ],
  ];
  const mountainMap = texture(
    (g) => {
      g.fillStyle = goldenHour ? "#897785" : "#688da0";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = goldenHour ? "#675b6d" : "#486c80";
      g.globalAlpha = 0.65;
      g.lineWidth = 1.2;
      g.lineJoin = "round";
      for (const path of gullies) {
        g.beginPath();
        path.forEach(([x, y], i) => {
          const px = ((x + 2700) / 5400) * 256,
            py = (1 - y / 800) * 256;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        });
        g.stroke();
      }
    },
    [1 / 5400, 1 / 800],
  );
  mountainMap.offset.x = 0.5;
  mountain.material.map = mountainMap;
  mountain.material.color.set("#ffffff");
  mountain.material.needsUpdate = true;

  const towel = box(
    [1.65, 0.025, 2.2],
    material("#e96b4a"),
    [-2.15, 0.015, -3.4],
  );
  for (let i = 0; i < 7; i++)
    box([1.65, 0.012, 0.075], material("#ffe7bb"), [
      -2.15,
      0.034,
      -4.35 + i * 0.3,
    ]);
  towel.rotation.y = -0.08;
  const pole = material("#ece4d6");
  cylinder(0.035, 0.035, 2.45, pole, [-2.6, 1.21, -4.15]);
  const canopy = [
    material("#ef5948", { side: THREE.DoubleSide }),
    material("#fff0bf", { side: THREE.DoubleSide }),
  ];
  for (let i = 0; i < 8; i++) {
    mesh(
      new THREE.ConeGeometry(
        1.55,
        0.6,
        8,
        1,
        true,
        (i * Math.PI) / 4,
        Math.PI / 4,
      ),
      canopy[i % 2],
      [-2.6, 2.25, -4.15],
    );
  }
  cylinder(0.08, 0.08, 0.12, pole, [-2.6, 2.61, -4.15]);

  // The esky has an open top, ice, and two labelled beer bottles.
  const esky = new THREE.Group();
  esky.position.set(-0.8, 0, -3.7);
  esky.rotation.y = -0.18;
  scene.add(esky);
  const coolerBlue = material("#3194bd"),
    coolerWhite = material("#f5f4e9");
  box([0.9, 0.12, 0.65], coolerBlue, [0, 0.09, 0], esky);
  for (const x of [-0.42, 0.42])
    box([0.07, 0.42, 0.65], coolerBlue, [x, 0.3, 0], esky);
  for (const z of [-0.29, 0.29])
    box([0.78, 0.42, 0.07], coolerBlue, [0, 0.3, z], esky);
  box([0.75, 0.025, 0.5], material("#cbe4e7"), [0, 0.26, 0], esky);
  const lid = box([0.95, 0.065, 0.67], coolerWhite, [0, 0.78, -0.49], esky);
  lid.rotation.x = -1.1;
  for (let i = 0; i < 12; i++) {
    const ice = box(
      [0.1, 0.07, 0.09],
      material("#e2f8ff", { roughness: 0.25 }),
      [((i % 4) - 1.5) * 0.16, 0.3, (Math.floor(i / 4) - 1) * 0.15],
      esky,
    );
    ice.rotation.y = i * 0.7;
  }
  const amber = material("#7e4c19", { roughness: 0.25 });
  for (const x of [-0.17, 0.17]) {
    cylinder(0.06, 0.065, 0.24, amber, [x, 0.42, 0], esky);
    cylinder(0.025, 0.045, 0.12, amber, [x, 0.6, 0], esky);
    cylinder(0.026, 0.026, 0.025, material("#e0b848"), [x, 0.673, 0], esky);
    cylinder(0.061, 0.061, 0.09, material("#f3d68e"), [x, 0.44, 0], esky);
  }

  function castle(x, z, scale) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    scene.add(group);
    const skin = material("#c6a56b");
    box([0.7, 0.43, 0.65], skin, [0, 0.215, 0], group);
    for (const tx of [-0.35, 0.35])
      for (const tz of [-0.32, 0.32]) {
        cylinder(0.14, 0.18, 0.65, skin, [tx, 0.325, tz], group);
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          box(
            [0.075, 0.08, 0.075],
            skin,
            [tx + Math.cos(a) * 0.11, 0.68, tz + Math.sin(a) * 0.11],
            group,
          );
        }
      }
    box([0.14, 0.2, 0.02], material("#7a623f"), [0, 0.1, 0.336], group);
  }
  castle(goldenHour ? 3 : 1.3, goldenHour ? -5.2 : -3.1, 1);
  if (!goldenHour) castle(2.65, -4.8, 0.65);

  // A plate of fries sits beneath the gull's closest swoop, beside the golden-hour castle.
  const friesPlate = new THREE.Group();
  friesPlate.name = "fries-plate";
  friesPlate.position.set(0.83, 0, -1.65);
  friesPlate.scale.setScalar(1.5);
  if (goldenHour) scene.add(friesPlate);
  const ceramic = material("#f4f1e5", { roughness: 0.35 });
  cylinder(0.32, 0.29, 0.035, ceramic, [0, 0.025, 0], friesPlate);
  const rim = mesh(new THREE.TorusGeometry(0.31, 0.024, 10, 48), ceramic, [0, 0.046, 0], friesPlate);
  rim.rotation.x = Math.PI / 2;
  const fryColors = [material("#f4c35b"), material("#dfaa41"), material("#ecc075")];
  const fryCount = 48;
  // Keep the irregular heap identical across lens samples and captured photos.
  let frySeed = 731;
  const fryRandom = () => {
    frySeed = (Math.imul(frySeed, 1664525) + 1013904223) >>> 0;
    return frySeed / 4294967296;
  };
  const fryRotation = new THREE.Matrix4();
  for (let i = 0; i < fryCount; i++) {
    const angle = fryRandom() * Math.PI * 2;
    const radius = Math.sqrt(fryRandom()) * 0.235;
    const length = 0.21 + fryRandom() * 0.15;
    const width = 0.048 + fryRandom() * 0.02;
    const thickness = 0.038 + fryRandom() * 0.015;
    const centre = 1 - radius / 0.235;
    const tilt = (fryRandom() - 0.5) * (0.45 + centre * 1.6);
    const fry = box([width, thickness, length], fryColors[i % 3],
      [Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.75], friesPlate);
    fry.rotation.set(tilt, fryRandom() * Math.PI * 2, (fryRandom() - 0.5) * 0.6, 'YXZ');
    // Raise the centre into a loose mound, with flatter chips around its edges.
    fryRotation.makeRotationFromEuler(fry.rotation);
    const axes = fryRotation.elements;
    const halfHeight = (Math.abs(axes[1]) * width + Math.abs(axes[5]) * thickness + Math.abs(axes[9]) * length) / 2;
    fry.position.y = 0.058 + centre ** 1.3 * 0.11 + fryRandom() * 0.035 + halfHeight;
  }

  const skin = material("#d6a071"),
    dark = material("#253847");
  function person(parent, position, shirtColor) {
    const group = new THREE.Group();
    group.position.set(...position);
    parent.add(group);
    cylinder(0.14, 0.18, 0.48, material(shirtColor), [0, 0.52, 0], group);
    mesh(new THREE.SphereGeometry(0.13, 16, 12), skin, [0, 0.9, 0], group);
    for (const x of [-0.11, 0.11])
      box([0.12, 0.32, 0.15], dark, [x, 0.15, 0], group);
    for (const x of [-0.2, 0.2])
      cylinder(0.055, 0.055, 0.4, skin, [x, 0.51, 0], group).rotation.z =
        x > 0 ? -0.45 : 0.45;
    return group;
  }
  const boat = new THREE.Group();
  boat.position.set(12, 0.1, -94);
  boat.rotation.y = -0.4;
  scene.add(boat);
  const hull = mesh(
    new THREE.SphereGeometry(1, 24, 12),
    material("#f0e8cc"),
    [0, 0.1, 0],
    boat,
  );
  hull.scale.set(2.3, 0.45, 0.85);
  box([3.4, 0.08, 1.25], material("#9a7851"), [0, 0.38, 0], boat);
  box([0.4, 0.65, 0.35], dark, [-2, 0.25, 0], boat);
  const fisherman = person(boat, [0.5, 0.42, 0], "#dad3a7");
  cylinder(0.28, 0.28, 0.055, material("#cdb77c"), [0, 1.03, 0], fisherman);
  const rod = cylinder(0.013, 0.018, 2.3, dark, [1, 1.6, 0], boat);
  rod.rotation.z = -0.7;
  cylinder(0.003, 0.003, 1.7, material("#d7e1dd"), [1.75, 1.25, 0], boat);

  const jetski = new THREE.Group();
  if (!goldenHour) scene.add(jetski);
  const skiHull = mesh(
    new THREE.SphereGeometry(1, 24, 12),
    material("#f9c72c"),
    [0, 0.15, 0],
    jetski,
  );
  skiHull.scale.set(1.55, 0.25, 0.52);
  box([1.4, 0.18, 0.5], dark, [-0.2, 0.4, 0], jetski);
  box([0.4, 0.4, 0.45], material("#e95034"), [0.65, 0.55, 0], jetski);
  person(jetski, [-0.2, 0.48, 0], "#ff713e").rotation.z = -0.25;
  const wake = material("#e4f8f5", {
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  for (let i = 0; i < 18; i++) {
    const spray = mesh(
      new THREE.SphereGeometry(1, 8, 6),
      wake,
      [-1.7 - i * 0.32, 0.03, Math.sin(i * 2.4) * (0.15 + i * 0.055)],
      jetski,
    );
    spray.scale.set(0.45, 0.035 + (i % 3) * 0.035, 0.12 + i * 0.025);
    spray.castShadow = false;
  }
  const seagull = goldenHour ? createSeagull(scene) : null;
  function setTime(time) {
    seagull?.update(time);
    const phase = (time * 14) / 9;
    jetski.position.set(
      9 * Math.sin(phase),
      0.025 + 0.04 * Math.sin(time * 6),
      -30 + 3 * Math.cos(phase),
    );
    jetski.rotation.y = Math.atan2(3 * Math.sin(phase), 9 * Math.cos(phase));
    boat.position.y = 0.1 + 0.04 * Math.sin(time * 1.5);
    boat.rotation.z = 0.015 * Math.sin(time * 1.5);
  }

  const camera = new THREE.PerspectiveCamera();
  const eye = new THREE.Vector3(0, 1.65, 6);
  camera.position.copy(eye);
  camera.lookAt(0, 0.8, -35);
  const aim = createCameraAim(camera);
  const { right, up } = aim;
  const raycaster = new THREE.Raycaster(),
    forward = new THREE.Vector3();
  const near = 0.05,
    far = 12000;
  function project(focal, dx = 0, dy = 0) {
    const halfW = (near * 18) / focal,
      halfH = (near * 12) / focal;
    camera.projectionMatrix.makePerspective(
      -halfW + dx,
      halfW + dx,
      halfH + dy,
      -halfH + dy,
      near,
      far,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  return {
    ...aim.controls,
    id: goldenHour ? "sunset-beach" : "beach",
    name: goldenHour ? "Golden-hour beach" : "Sunny beach",
    ev: goldenHour ? 9 : 15,
    isStatic: false,
    thumbnailExposure: goldenHour ? { time: 13.58, shutter: 0.025, yaw: -0.07, pitch: -0.1 } : { time: 0, shutter: 0.2 },
    note: goldenHour ? "Golden afternoon light at EV 9, with the sun still above the sea roughly 1–1.5 hours before sundown. Warm sand, long shadows, rose-tinted mountains, and a golden reflection on the water. The seagull keeps circling: compare shutter speeds and focus between the beach and offshore subjects." : "Bright sun at EV 15: sandcastles, an umbrella and towel, and an open esky with two beers. A fisherman floats about 80 m offshore; a 780 m mountain rises across the water about 5.5 km away. A jetski passes at up to 14 m/s (50 km/h): compare 1/30 s with 1/250–1/500 s, and focus on the rider to isolate motion blur.",
    focusPoint: null,
    autofocusDistance: 10,
    focusAt(x, y, focal, time) {
      aim.apply();
      setTime(time);
      camera.position.copy(eye);
      project(focal);
      camera.updateMatrixWorld(true);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera);
      const hit = raycaster
        .intersectObjects(scene.children, true)
        .find((hit) => hit.object.material !== wake);
      camera.getWorldDirection(forward);
      this.autofocusDistance = hit
        ? hit.point.clone().sub(eye).dot(forward)
        : Infinity;
    },
    renderSample(target, s) {
      aim.apply();
      setTime(s.time);
      const k = near / (s.focusDistance ?? this.autofocusDistance);
      project(
        s.focal,
        (s.jitterX * near * 36) / s.focal / (s.width ?? width) - s.lensX * k,
        (s.jitterY * near * 24) / s.focal / (s.height ?? height) - s.lensY * k,
      );
      camera.position
        .copy(eye)
        .addScaledVector(right, s.lensX)
        .addScaledVector(up, s.lensY);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    },
  };
}
