/** A minimal little-endian TIFF writer: just enough to carry a photo's EXIF metadata. */

const TYPE = { ASCII: 2, SHORT: 3, LONG: 4, RATIONAL: 5, UNDEFINED: 7 };
const HEADER_SIZE = 8;
const ENTRY_SIZE = 12;
const INLINE_BYTES = 4; // values up to this size are stored inside the directory entry
const EXIF_IFD_POINTER = 0x8769;

const encoder = new TextEncoder();

/* ---------- Directory entries ---------- */

export function ascii(tag, text) {
  const data = encoder.encode(`${text}\\0`);
  return { tag, type: TYPE.ASCII, count: data.length, data };
}

export function undefinedBytes(tag, text) {
  const data = encoder.encode(text);
  return { tag, type: TYPE.UNDEFINED, count: data.length, data };
}

export const short = (tag, value) => ({ tag, type: TYPE.SHORT, count: 1, value });

export const long = (tag, value) => ({ tag, type: TYPE.LONG, count: 1, value });

export function rational(tag, numerator, denominator = 1) {
  const data = new Uint8Array(8);
  const view = new DataView(data.buffer);
  view.setUint32(0, numerator, true);
  view.setUint32(4, denominator, true);
  return { tag, type: TYPE.RATIONAL, count: 1, data };
}

/* ---------- Encoding ---------- */

const directorySize = (entryCount) => 2 + entryCount * ENTRY_SIZE + 4;
const isExternal = (entry) => entry.data?.length > INLINE_BYTES;
const paddedLength = (data) => data.length + (data.length % 2);
const byTag = (a, b) => a.tag - b.tag;

/** Write an entry's value (or a pointer to it). Returns where the next external value goes. */
function writeValue(out, entry, position, dataOffset) {
  if (isExternal(entry)) {
    out.view.setUint32(position, dataOffset, true);
    out.bytes.set(entry.data, dataOffset);
    return dataOffset + paddedLength(entry.data);
  }
  if (entry.data) out.bytes.set(entry.data, position);
  else if (entry.type === TYPE.SHORT) out.view.setUint16(position, entry.value, true);
  else out.view.setUint32(position, entry.value, true);
  return dataOffset;
}

/** Write one directory. Returns where the next directory's external values go. */
function writeDirectory(out, entries, offset, firstDataOffset) {
  let dataOffset = firstDataOffset;
  out.view.setUint16(offset, entries.length, true);
  entries.forEach((entry, index) => {
    const position = offset + 2 + index * ENTRY_SIZE;
    out.view.setUint16(position, entry.tag, true);
    out.view.setUint16(position + 2, entry.type, true);
    out.view.setUint32(position + 4, entry.count, true);
    dataOffset = writeValue(out, entry, position + 8, dataOffset);
  });
  return dataOffset;
}

/** Encode a TIFF block: an image directory (IFD0) that points to an EXIF directory. */
export function encodeTiff(imageEntries, exifEntries) {
  const exifOffset = HEADER_SIZE + directorySize(imageEntries.length + 1);
  const image = [...imageEntries, long(EXIF_IFD_POINTER, exifOffset)].sort(byTag);
  const exif = [...exifEntries].sort(byTag);
  const dataStart = exifOffset + directorySize(exif.length);
  const externalSize = [...image, ...exif]
    .filter(isExternal)
    .reduce((size, entry) => size + paddedLength(entry.data), 0);

  const bytes = new Uint8Array(dataStart + externalSize);
  const out = { bytes, view: new DataView(bytes.buffer) };
  bytes.set([0x49, 0x49, 42, 0, HEADER_SIZE, 0, 0, 0]); // "II", 42, offset of IFD0
  const exifDataStart = writeDirectory(out, image, HEADER_SIZE, dataStart);
  writeDirectory(out, exif, exifOffset, exifDataStart);
  return bytes;
}
