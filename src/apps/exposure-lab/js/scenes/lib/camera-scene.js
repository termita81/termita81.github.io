/**
 * A scene viewed through a thin-lens camera: it can be looked around in and focused.
 *
 * `info` is the scene's description (id, name, ev, note, thumbnail), `rig` comes from
 * createThinLensCamera(), and `focusDistance` is where autofocus starts, in metres.
 */
export function createCameraScene(info, rig, focusDistance) {
  const scene = {
    ...info,
    isFlat: false,
    canLookAround: true,
    focusPoint: null,
    autofocusDistance: focusDistance,
    rotateBy: rig.rotateBy,
    resetView: rig.resetView,

    /** Autofocus on whatever shows at `point` (0…1 image coordinates). */
    focusAt(point, focal, time) {
      scene.autofocusDistance = rig.measureDistance(point, focal, time);
    },

    renderSample(target, sample) {
      rig.renderSample(target, sample, sample.focusDistance ?? scene.autofocusDistance);
    },
  };
  return scene;
}
