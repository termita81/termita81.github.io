import * as THREE from 'three';

const POLE_MARGIN = 0.05; // radians kept clear of looking straight up or down

/** Lets a camera be turned away from, and back to, the direction it was set up with. */
export function createCameraAim(camera) {
  camera.rotation.reorder('YXZ');
  const baseYaw = camera.rotation.y;
  const basePitch = camera.rotation.x;
  const rotation = { yaw: 0, pitch: 0 };
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  /** Point the camera and update its `right` and `up` axes. */
  function apply() {
    camera.rotation.set(basePitch + rotation.pitch, baseYaw + rotation.yaw, 0, 'YXZ');
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  }

  function rotateBy(yaw, pitch) {
    const { euclideanModulo, clamp } = THREE.MathUtils;
    const lowest = -Math.PI / 2 + POLE_MARGIN - basePitch;
    const highest = Math.PI / 2 - POLE_MARGIN - basePitch;
    rotation.yaw = euclideanModulo(rotation.yaw + yaw + Math.PI, Math.PI * 2) - Math.PI;
    rotation.pitch = clamp(rotation.pitch + pitch, lowest, highest);
    apply();
  }

  function resetView() {
    rotation.yaw = 0;
    rotation.pitch = 0;
    apply();
  }

  apply();
  return { right, up, apply, rotateBy, resetView };
}
