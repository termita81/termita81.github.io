import { $ } from "./dom.js";
import { state } from "./state.js";
import { scenes } from "./scenes.js";
import { W, H, FOCAL, SENSOR_W, SENSOR_H } from "./constants.js";
import { animationTime } from "./animation-clock.js";

export function setupViewfinder({ refresh }) {
  const canvas = $("viewfinder-canvas");
  let gesture = null;
  const currentScene = () => scenes.find(scene => scene.id === state.selected);
  const dragToMoveRoom = $("drag-to-move-room");
  dragToMoveRoom.checked = state.dragToMoveRoom;
  dragToMoveRoom.addEventListener("change", () => {
    state.dragToMoveRoom = dragToMoveRoom.checked;
  });

  function imagePoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / W, rect.height / H);
    const width = W * scale, height = H * scale;
    return {
      x: (event.clientX - rect.left - (rect.width - width) / 2) / width,
      y: (event.clientY - rect.top - (rect.height - height) / 2) / height,
      width, height,
    };
  }

  function rotate(scene, dx, dy, width, height) {
    const focal = FOCAL[state.focal];
    scene.rotateBy(-dx / width * 2 * Math.atan(SENSOR_W / (2 * focal)),
      -dy / height * 2 * Math.atan(SENSOR_H / (2 * focal)));
    scene.focusPoint = null;
    refresh();
  }

  canvas.addEventListener("pointerdown", event => {
    const scene = currentScene();
    if (!scene.rotateBy || event.button !== 0 || !event.isPrimary || gesture) return;
    const point = imagePoint(event);
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    gesture = { scene, pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastY: event.clientY, dragging: false };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
  });

  canvas.addEventListener("pointermove", event => {
    if (!gesture || event.pointerId !== gesture.pointer || currentScene() !== gesture.scene) return;
    if (!gesture.dragging && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 5) return;
    gesture.dragging = true;
    canvas.classList.add("rotating");
    const { width, height } = imagePoint(event);
    const direction = dragToMoveRoom.checked ? -1 : 1;
    rotate(gesture.scene, (event.clientX - gesture.lastX) * direction,
      (event.clientY - gesture.lastY) * direction, width, height);
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
  });

  function finish(event) {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    const finished = gesture;
    gesture = null;
    canvas.classList.remove("rotating");
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (event.type !== "pointerup" || finished.dragging || state.focusMode !== "af" || currentScene() !== finished.scene) return;
    const point = imagePoint(event);
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    finished.scene.focusPoint = { x: point.x, y: point.y };
    finished.scene.focusAt(point.x, point.y, FOCAL[state.focal], animationTime());
    refresh();
  }
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(type, finish);

  function reset() {
    const scene = currentScene();
    scene.resetView?.();
    scene.focusPoint = null;
    refresh();
  }
  $("reset-view").addEventListener("click", reset);
  canvas.addEventListener("keydown", event => {
    if (!currentScene().rotateBy || event.ctrlKey || event.metaKey || event.altKey) return;
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (event.key === "Home") { event.preventDefault(); reset(); }
    if (moves[event.key]) {
      event.preventDefault();
      const [x, y] = moves[event.key];
      rotate(currentScene(), x, y, 10, 10);
    }
  });
}
