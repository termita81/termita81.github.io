import * as THREE from 'three';

/**
 * Shorthand for building a scene out of simple solids. Sizes and positions are arrays in
 * metres; every mesh is added to `parent`, or to the kit's default parent.
 */
export function createMeshKit(defaultParent, { roughness = 0.8, shadows = true } = {}) {
  const material = (color, options = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...options });

  function mesh(geometry, skin, position, parent = defaultParent) {
    const object = new THREE.Mesh(geometry, skin);
    object.position.set(...position);
    object.castShadow = shadows;
    object.receiveShadow = shadows;
    parent.add(object);
    return object;
  }

  const box = (size, skin, position, parent) =>
    mesh(new THREE.BoxGeometry(...size), skin, position, parent);

  const cylinder = ([topRadius, bottomRadius, length], skin, position, parent) =>
    mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, length, 16), skin, position, parent);

  return { material, mesh, box, cylinder };
}
