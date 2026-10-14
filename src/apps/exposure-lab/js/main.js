/**
 * Composition root: creates every part of the app and wires the parts together. No other module
 * reaches outside its own layer.
 */
import { createAnimationClock } from './app/animation-clock.js';
import { createCapture } from './app/capture.js';
import { createLiveView } from './app/live-view.js';
import { VIEW_SIZE } from './config.js';
import { createPhotoLibrary } from './photos/photo-library.js';
import { photoAltText } from './photos/photo-text.js';
import { createExposurePipeline } from './rendering/exposure-pipeline.js';
import { createRenderer, UnsupportedDeviceError } from './rendering/renderer.js';
import { createScenes } from './scenes/index.js';
import { createCameraReducer, INITIAL_STATE } from './state/camera-state.js';
import { createStore } from './state/store.js';
import { announce } from './ui/announcer.js';
import { hideBootStatus, showBootFailure } from './ui/boot-status.js';
import { $ } from './ui/dom.js';
import { createExposureMeter } from './ui/exposure-meter.js';
import { createFocusPanel } from './ui/focus-panel.js';
import { setupKeyboard } from './ui/keyboard.js';
import { createLightbox } from './ui/lightbox/lightbox.js';
import { bindModeSelector } from './ui/mode-selector.js';
import { createPhotoRoll } from './ui/photo-roll.js';
import { createPhoneScreen } from './ui/phone-screen.js';
import { createSceneGallery } from './ui/scene-gallery.js';
import { createSettingSliders } from './ui/setting-sliders.js';
import { setupViewfinderGestures } from './ui/viewfinder-gestures.js';
import { createViewfinder } from './ui/viewfinder.js';
import { createViewfinderFullscreen } from './ui/viewfinder-fullscreen.js';

const isWelcomeOpen = () => $('welcome').open;

/** The simulated camera: renderer, scenes and the state the user controls. */
function createCamera() {
  const renderer = createRenderer(VIEW_SIZE);
  const pipeline = createExposurePipeline(renderer, VIEW_SIZE);
  const scenes = createScenes(renderer, pipeline.fill);
  const findScene = (id) => scenes.find((scene) => scene.id === id);
  const store = createStore(INITIAL_STATE, createCameraReducer(findScene));
  const currentScene = () => findScene(store.getState().sceneId);
  return { pipeline, scenes, store, currentScene };
}

/** The views that show the camera state, and a `render` that redraws all of them. */
function createCameraViews({ scenes, store, currentScene }) {
  const viewfinder = createViewfinder(VIEW_SIZE);
  const fullscreen = createViewfinderFullscreen();
  const focusPanel = createFocusPanel(store);
  bindModeSelector(store);
  const views = [
    createSettingSliders(store),
    createExposureMeter(),
    focusPanel,
    createSceneGallery({
      scenes,
      onSelect: (sceneId) => store.update({ sceneId }),
    }),
    viewfinder,
  ];
  const phoneScreen = createPhoneScreen({
    store,
    onLayoutChange: fullscreen.exit,
  });
  views.push(phoneScreen);
  const render = () => {
    const state = store.getState();
    const scene = currentScene();
    views.forEach((view) => view.render(state, scene));
  };
  store.subscribe(render);
  return { viewfinder, focusPanel, phoneScreen, fullscreen, render };
}

/** The photo roll and the lightbox, kept in step with the photo library. */
function createPhotoViews(library) {
  const lightbox = createLightbox({ library });
  const roll = createPhotoRoll({
    library,
    onOpen: lightbox.show,
    onCleared: () => $('shutter').focus(),
  });
  library.subscribe(() => {
    roll.render(library.ready());
    if (lightbox.isOpen()) lightbox.sync();
  });
  return { lightbox, roll };
}

function start() {
  const camera = createCamera();
  const { pipeline, store, currentScene } = camera;
  const library = createPhotoLibrary();
  const { viewfinder, focusPanel, phoneScreen, fullscreen, render } = createCameraViews(camera);
  const { lightbox, roll } = createPhotoViews(library);

  // Scene movement pauses while the lightbox is open.
  const clock = createAnimationClock(lightbox.isOpen);
  lightbox.onOpenChange(clock.sync);

  setupViewfinderGestures({
    size: VIEW_SIZE,
    store,
    getScene: currentScene,
    clock,
    onViewChange: render,
    onDoubleTap: fullscreen.toggle,
  });

  const liveView = createLiveView({
    scenes: camera.scenes,
    getState: store.getState,
    clock,
    pipeline,
    viewfinder,
    isPaused: lightbox.isOpen,
    onAutofocus: () => {
      const state = store.getState();
      const scene = currentScene();
      focusPanel.renderDistance(state, scene);
      phoneScreen.renderFocus(state, scene);
      viewfinder.renderFocus(state, scene);
    },
  });

  const capture = createCapture({
    getState: store.getState,
    getScene: currentScene,
    clock,
    pipeline,
    library,
    onCaptured(photo) {
      viewfinder.blink();
      announce(`Photo taken. ${photoAltText(photo)}.`);
      // Do not let the capture count as a slow preview frame.
      liveView.resetTiming();
    },
    onFailed(error) {
      announce('Could not save the JPEG photo.');
      console.error(error);
    },
  });

  const takePhoto = () => {
    if (!lightbox.isOpen() && !isWelcomeOpen() && !$('phone-scene-picker').open)
      capture.takePhoto();
  };
  $('shutter').addEventListener('click', takePhoto);
  $('viewfinder-shutter').addEventListener('click', takePhoto);
  setupKeyboard({ lightbox, isWelcomeOpen, takePhoto });

  render();
  roll.render(library.ready());
  hideBootStatus();
  liveView.start();
}

try {
  start();
} catch (error) {
  // Any other failure gets the generic message from boot.js.
  if (error instanceof UnsupportedDeviceError) showBootFailure(error.message);
  throw error;
}
