import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

export function createSeagull(scene) {
  const gull = new THREE.Group();
  gull.name = "seagull";
  scene.add(gull);
  const white = new THREE.MeshStandardMaterial({ color: "#f4f4ed", roughness: 0.85, side: THREE.DoubleSide });
  const grey = new THREE.MeshStandardMaterial({ color: "#bec5ca", roughness: 0.85, side: THREE.DoubleSide });
  const black = new THREE.MeshStandardMaterial({ color: "#343a42", roughness: 0.9, side: THREE.DoubleSide });
  const yellow = new THREE.MeshStandardMaterial({ color: "#e6b545", roughness: 0.7 });

  function ellipsoid(radius, scale, position, material) {
    const part = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
    part.scale.set(...scale);
    part.position.set(...position);
    part.castShadow = true;
    gull.add(part);
    return part;
  }
  ellipsoid(1, [0.12, 0.11, 0.25], [0, 0, 0], white);
  ellipsoid(1, [0.09, 0.09, 0.1], [0, 0.08, 0.23], white);
  for (const side of [-1, 1]) ellipsoid(0.013, [1, 1, 1], [side * 0.077, 0.1, 0.27], black);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 12), yellow);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.07, 0.37);
  gull.add(beak);

  function feather(points, material, parent) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 1; i < points.length - 1; i++) vertices.push(...points[0], ...points[i], ...points[i + 1]);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    const part = new THREE.Mesh(geometry, material);
    part.castShadow = true;
    parent.add(part);
  }
  feather([[0, 0, -0.16], [-0.12, 0, -0.4], [0.12, 0, -0.4]], white, gull);
  const wings = [-1, 1].map(side => {
    const wing = new THREE.Group();
    wing.position.x = side * 0.09;
    gull.add(wing);
    feather([[0, 0, 0.08], [side * 0.3, 0, 0.02], [side * 0.58, 0, -0.16], [side * 0.35, 0, -0.24], [0, 0, -0.15]], grey, wing);
    feather([[side * 0.45, 0.002, -0.07], [side * 0.72, 0.002, -0.3], [side * 0.5, 0.002, -0.26], [side * 0.35, 0.002, -0.24]], black, wing);
    return wing;
  });

  // A closed flight circuit starts high on the right, visits the boat, and swoops in front of the castle.
  const path = new THREE.CatmullRomCurve3([
    [25, 18, -94], [10, 14, -100], [-12, 10, -85], [-10, 7, -45],
    [-3, 3, -12], [1, 0.65, -1.8], [3.5, 2, -8], [14, 7, -38], [27, 13, -75],
  ].map(point => new THREE.Vector3(...point)), true, "centripetal");
  const direction = new THREE.Vector3(), forward = new THREE.Vector3(0, 0, 1);
  const turn = new THREE.Vector3();
  const period = 24;

  function update(time) {
    const phase = ((time % period) + period) % period / period;
    gull.position.copy(path.getPointAt(phase));
    direction.copy(path.getTangentAt(phase));
    gull.quaternion.setFromUnitVectors(forward, direction);
    turn.copy(path.getTangentAt((phase + 0.008) % 1));
    const bank = THREE.MathUtils.clamp(direction.x * turn.z - direction.z * turn.x, -0.15, 0.15);
    gull.rotateZ(bank * 3);
    const flap = 0.12 + Math.sin(time * Math.PI * 4.4) * 0.4;
    wings[0].rotation.z = -flap;
    wings[1].rotation.z = flap;
  }

  update(0);
  return { update };
}
