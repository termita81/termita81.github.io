import { exifTags, imageTags } from './photo-tags.js';
import { encodeTiff } from './tiff.js';

const START_OF_IMAGE = [0xff, 0xd8];
const APP1_MARKER = [0xff, 0xe1];
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0, 0]; // "Exif\\0\\0"

/** A JPEG APP1 segment that carries a TIFF block. */
export function exifSegment(tiff) {
  const segment = new Uint8Array(10 + tiff.length);
  segment.set(APP1_MARKER);
  new DataView(segment.buffer).setUint16(2, segment.length - 2); // length excludes the marker
  segment.set(EXIF_HEADER, 4);
  segment.set(tiff, 10);
  return segment;
}

/** Embed standard TIFF/EXIF metadata in a canvas-produced JPEG without re-encoding it. */
export async function jpegWithExif(blob, photo, size) {
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  if (jpeg[0] !== START_OF_IMAGE[0] || jpeg[1] !== START_OF_IMAGE[1]) {
    throw new Error('Expected a JPEG capture.');
  }
  const segment = exifSegment(encodeTiff(imageTags(photo), exifTags(photo, size)));
  return new Blob([jpeg.subarray(0, 2), segment, jpeg.subarray(2)], { type: 'image/jpeg' });
}
