import * as THREE from 'three';

const CIRCUIT_SECONDS = 24;
const SIDES = [-1, 1];

/**
 * A closed flight circuit: it starts high on the right, visits the boat, and swoops in front of
 * the castle.
 */
// prettier-ignore
const FLIGHT_PATH = [
  [25, 18, -94], [10, 14, -100], [-12, 10, -85], [-10, 7, -45], [-3, 3, -12],
  [1, 0.65, -1.8], [3.5, 2, -8], [14, 7, -38], [27, 13, -75],
];

const feathers = (color, roughness) =>
  new THREE.MeshStandardMaterial({ color, roughness, side: THREE.DoubleSide });

/** A flat fan of triangles through `points`. */
function addFeather(parent, material, points) {
  const vertices = [];
  for (let i = 1; i < points.length - 1; i++) {
    vertices.push(...points[0], ...points[i], ...points[i + 1]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const feather = new THREE.Mesh(geometry, material);
  feather.castShadow = true;
  parent.add(feather);
}

function addEllipsoid(gull, material, { radius = 1, scale = [1, 1, 1], position }) {
  const part = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  part.scale.set(...scale);
  part.position.set(...position);
  part.castShadow = true;
  gull.add(part);
}

function addBody(gull, colors) {
  addEllipsoid(gull, colors.white, { scale: [0.12, 0.11, 0.25], position: [0, 0, 0] });
  addEllipsoid(gull, colors.white, { scale: [0.09, 0.09, 0.1], position: [0, 0.08, 0.23] }); // head
  for (const side of SIDES) {
    addEllipsoid(gull, colors.black, { radius: 0.013, position: [side * 0.077, 0.1, 0.27] }); // eye
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 12), colors.yellow);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.07, 0.37);
  gull.add(beak);
  // prettier-ignore
  addFeather(gull, colors.white, [[0, 0, -0.16], [-0.12, 0, -0.4], [0.12, 0, -0.4]]); // tail
}

function addWing(gull, colors, side) {
  const wing = new THREE.Group();
  wing.position.x = side * 0.09;
  gull.add(wing);
  // prettier-ignore
  addFeather(wing, colors.grey, [
    [0, 0, 0.08], [side * 0.3, 0, 0.02], [side * 0.58, 0, -0.16],
    [side * 0.35, 0, -0.24], [0, 0, -0.15],
  ]);
  // prettier-ignore
  addFeather(wing, colors.black, [
    [side * 0.45, 0.002, -0.07], [side * 0.72, 0.002, -0.3],
    [side * 0.5, 0.002, -0.26], [side * 0.35, 0.002, -0.24],
  ]); // wing tip
  return wing;
}

function createFlightPath() {
  const points = FLIGHT_PATH.map((point) => new THREE.Vector3(...point));
  return new THREE.CatmullRomCurve3(points, true, 'centripetal');
}

/** A gull that flies a circuit over the beach. Returns `update(time)`. */
export function createSeagull(scene) {
  const gull = new THREE.Group();
  gull.name = 'seagull';
  scene.add(gull);
  const colors = {
    white: feathers('#f4f4ed', 0.85),
    grey: feathers('#bec5ca', 0.85),
    black: feathers('#343a42', 0.9),
    yellow: new THREE.MeshStandardMaterial({ color: '#e6b545', roughness: 0.7 }),
  };
  addBody(gull, colors);
  const [leftWing, rightWing] = SIDES.map((side) => addWing(gull, colors, side));

  const path = createFlightPath();
  const forward = new THREE.Vector3(0, 0, 1);
  const direction = new THREE.Vector3();
  const ahead = new THREE.Vector3();

  function update(time) {
    const phase = (((time % CIRCUIT_SECONDS) + CIRCUIT_SECONDS) % CIRCUIT_SECONDS) / CIRCUIT_SECONDS;
    gull.position.copy(path.getPointAt(phase));
    direction.copy(path.getTangentAt(phase));
    gull.quaternion.setFromUnitVectors(forward, direction);
    // Bank into the turn: compare the heading now with the heading a little further on.
    ahead.copy(path.getTangentAt((phase + 0.008) % 1));
    const turn = direction.x * ahead.z - direction.z * ahead.x;
    gull.rotateZ(THREE.MathUtils.clamp(turn, -0.15, 0.15) * 3);
    const flap = 0.12 + Math.sin(time * Math.PI * 4.4) * 0.4;
    leftWing.rotation.z = -flap;
    rightWing.rotation.z = flap;
  }

  update(0);
  return { update };
}
