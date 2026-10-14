import { cameraView } from '../camera/camera-view.js';
import { CAPTURE_SAMPLES, JPEG_QUALITY, PHOTO_SIZE } from '../config.js';
import { jpegWithExif } from '../photos/exif/jpeg-exif.js';
import { createPhoto } from '../photos/photo.js';
import { canvasToJpeg, createCanvas } from '../rendering/canvas.js';

const randomSeed = () => Math.floor(Math.random() * 1e6);

/** Takes photos: a full-quality exposure of the selected scene, saved as a JPEG with EXIF. */
export function createCapture(options) {
  const { getState, getScene, clock, pipeline, library, onCaptured, onFailed } = options;
  let sequence = 0;

  /** The renderer's canvas is reused for the next frame, so keep a copy of this one. */
  function copyFrame() {
    const copy = createCanvas(PHOTO_SIZE.width, PHOTO_SIZE.height);
    copy.getContext('2d').drawImage(pipeline.canvas, 0, 0);
    return copy;
  }

  async function develop(frame, photo) {
    try {
      const jpeg = await canvasToJpeg(frame, JPEG_QUALITY);
      const tagged = await jpegWithExif(jpeg, photo, PHOTO_SIZE);
      library.publish(photo, URL.createObjectURL(tagged));
    } catch (error) {
      library.remove(photo.id);
      onFailed(error);
    }
  }

  function takePhoto() {
    const state = getState();
    const scene = getScene();
    const sampling = {
      time: clock.time(),
      samples: CAPTURE_SAMPLES,
      seed: randomSeed(),
      randomize: true,
    };
    pipeline.expose(scene, cameraView(state, scene, sampling), PHOTO_SIZE);
    const photo = createPhoto({ id: ++sequence, capturedAt: new Date(), state, scene });
    library.add(photo);
    develop(copyFrame(), photo);
    onCaptured(photo);
  }

  return { takePhoto };
}
