/**
 * The photos taken in this session, newest first. Knows nothing about the DOM; views subscribe
 * and re-render when it changes.
 */
export function createPhotoLibrary(revokeUrl = (url) => URL.revokeObjectURL(url)) {
  const photos = [];
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());

  return {
    /** The photos whose JPEG is ready to show. */
    ready: () => photos.filter((photo) => photo.url),

    /** Reserve a place for a photo whose JPEG is still being encoded. */
    add(photo) {
      photos.unshift(photo);
    },

    /** The photo's JPEG is ready at `url`. */
    publish(photo, url) {
      photo.url = url;
      notify();
    },

    remove(id) {
      const index = photos.findIndex((photo) => photo.id === id);
      if (index < 0) return;
      const [photo] = photos.splice(index, 1);
      if (photo.url) revokeUrl(photo.url);
      notify();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
