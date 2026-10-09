import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

export function createCameraAim(camera) {
  camera.rotation.reorder("YXZ");
  const baseYaw = camera.rotation.y, basePitch = camera.rotation.x;
  const rotation = { yaw: 0, pitch: 0 };
  const right = new THREE.Vector3(), up = new THREE.Vector3();

  function apply() {
    camera.rotation.set(basePitch + rotation.pitch, baseYaw + rotation.yaw, 0, "YXZ");
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  }

  function rotateBy(yaw, pitch) {
    rotation.yaw = THREE.MathUtils.euclideanModulo(rotation.yaw + yaw + Math.PI, Math.PI * 2) - Math.PI;
    rotation.pitch = THREE.MathUtils.clamp(rotation.pitch + pitch,
      -Math.PI / 2 + 0.05 - basePitch, Math.PI / 2 - 0.05 - basePitch);
    apply();
  }

  function resetView() {
    rotation.yaw = rotation.pitch = 0;
    apply();
  }

  apply();
  return { right, up, apply, controls: { rotateBy, resetView, viewRotation: rotation } };
}
