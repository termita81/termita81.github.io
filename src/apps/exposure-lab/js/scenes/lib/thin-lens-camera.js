import * as THREE from 'three';
import { SENSOR } from '../../camera/settings.js';
import { createCameraAim } from './camera-aim.js';

const NEAR = 0.05; // metres

/** Half the size of the sensor's image on the near plane. */
const nearPlaneHalfSize = (focal) => ({
  width: (NEAR * (SENSOR.width / 2)) / focal,
  height: (NEAR * (SENSOR.height / 2)) / focal,
});

/**
 * A thin-lens camera on a tripod. The projection matrix is built by hand for every sample, so
 * the eye can sit anywhere on the lens opening (depth of field) and be nudged by a fraction of a
 * pixel (anti-aliasing).
 *
 * Options:
 * - `renderer`, `scene`: what to render with, and what to render.
 * - `eye`, `target`: where the camera stands and what it first looks at.
 * - `far`: far clipping distance in metres.
 * - `setTime(seconds)`: move the scene to an instant (optional).
 * - `findFocusHit(raycaster)`: the surface autofocus should measure (optional).
 */
export function createThinLensCamera(options) {
  const { renderer, scene, eye, far, setTime = () => {} } = options;
  const firstHit = (raycaster) => raycaster.intersectObjects(scene.children, true)[0];
  const findFocusHit = options.findFocusHit ?? firstHit;
  const camera = new THREE.PerspectiveCamera();
  camera.position.copy(eye);
  camera.lookAt(options.target);
  const aim = createCameraAim(camera);
  const raycaster = new THREE.Raycaster();
  const forward = new THREE.Vector3();

  function project(half, shiftX, shiftY) {
    camera.projectionMatrix.makePerspective(
      -half.width + shiftX,
      half.width + shiftX,
      half.height + shiftY,
      -half.height + shiftY,
      NEAR,
      far,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }

  /** Distance along the view direction to whatever shows at `point` (0…1 image coordinates). */
  function measureDistance(point, focal, time) {
    aim.apply();
    setTime(time);
    camera.position.copy(eye);
    project(nearPlaneHalfSize(focal), 0, 0);
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(new THREE.Vector2(point.x * 2 - 1, 1 - point.y * 2), camera);
    const hit = findFocusHit(raycaster);
    camera.getWorldDirection(forward);
    return hit ? hit.point.clone().sub(eye).dot(forward) : Infinity;
  }

  /**
   * Render one sharp, instantaneous view. The eye moves to a point on the lens and the frustum
   * is sheared so the focus plane stays put: anything on that plane lands on the same pixel for
   * every lens point, everything else smears.
   */
  function renderSample(target, sample, focusDistance) {
    aim.apply();
    setTime(sample.time);
    const half = nearPlaneHalfSize(sample.focal);
    const shear = NEAR / focusDistance;
    const shiftX = (sample.jitterX * 2 * half.width) / sample.width - sample.lensX * shear;
    const shiftY = (sample.jitterY * 2 * half.height) / sample.height - sample.lensY * shear;
    project(half, shiftX, shiftY);
    camera.position
      .copy(eye)
      .addScaledVector(aim.right, sample.lensX)
      .addScaledVector(aim.up, sample.lensY);
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
  }

  return { rotateBy: aim.rotateBy, resetView: aim.resetView, measureDistance, renderSample };
}
