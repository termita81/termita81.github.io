import { setupViewfinder } from './viewfinder.js';
import { $ } from './dom.js';
import { setupSceneGallery } from './scene-gallery.js';
import { createControls } from './controls.js';
import { createLiveView } from './live-view.js';
import { createPhotoGallery } from './photo-gallery.js';
import { createLightbox } from './lightbox.js';
import { createCapture } from './capture.js';
import { setupKeyboard } from './keyboard.js';

const controls = createControls();
setupViewfinder({ refresh: controls.refresh });
const liveView = createLiveView({ syncFocusDistance: controls.syncFocusDistance });
const gallery = createPhotoGallery({
  showShot: id => lightbox.showShot(id),
  syncComparison: () => lightbox.syncComparison(),
});
const lightbox = createLightbox({ readyShots: gallery.readyShots, removeShot: gallery.removeShot });
const capture = createCapture({ ...gallery, resetTiming: liveView.resetTiming });
setupKeyboard({ fire: capture.fire, stepShot: lightbox.stepShot, toggleComparison: lightbox.toggleComparison });

setupSceneGallery({ refresh: controls.refresh });
controls.refresh();
gallery.syncRoll();
$('boot').hidden = true;
liveView.start();
