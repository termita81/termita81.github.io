// Embed standard TIFF/EXIF metadata in a canvas-produced JPEG without re-encoding it.
export async function jpegWithExif(blob, shot, width, height) {
  const ascii = (text) => new TextEncoder().encode(`${text}\0`);
  const short = (tag, value) => ({ tag, type: 3, count: 1, value });
  const long = (tag, value) => ({ tag, type: 4, count: 1, value });
  const text = (tag, value) => ({ tag, type: 2, count: value.length, data: value });
  const rational = (tag, numerator, denominator = 1) => {
    const data = new Uint8Array(8);
    const view = new DataView(data.buffer);
    view.setUint32(0, numerator, true);
    view.setUint32(4, denominator, true);
    return { tag, type: 5, count: 1, data };
  };
  const date = shot.capturedAt.toISOString().slice(0, 19).replaceAll('-', ':').replace('T', ' ');
  const focus = shot.focusDistance === null ? 'not applicable'
    : Number.isFinite(shot.focusDistance) ? `${shot.focusDistance.toFixed(3)} m` : 'infinity';
  const description = `${shot.scene}; mode ${shot.mode ?? "M"}; ISO ${shot.iso}; aperture f/${shot.aperture}; shutter ${shot.shutter} s; focal length ${shot.focal} mm; ${shot.focusMode.toUpperCase()} focus ${focus}; scene EV ${shot.sceneEV}; settings EV ${shot.ev}; exposure difference ${shot.delta} stops. Simulated camera.`;
  const ifd0 = [
    text(0x010e, ascii(description)),
    short(0x0112, 1),
    text(0x0131, ascii('Exposure Lab')),
    text(0x0132, ascii(date)),
    long(0x8769, 0),
  ];
  const shutterParts = shot.shutter.split('/').map(Number);
  const exif = [
    rational(0x829a, shutterParts[0], shutterParts[1] ?? 1),
    rational(0x829d, Math.round(shot.aperture * 10), 10),
    short(0x8822, ({ M: 1, P: 2, A: 3, S: 4 })[shot.mode] ?? 1),
    short(0x8827, shot.iso),
    { tag: 0x9000, type: 7, count: 4, data: new TextEncoder().encode('0232') },
    text(0x9003, ascii(date)),
    text(0x9011, ascii('+00:00')),
    rational(0x920a, shot.focal),
    short(0xa001, 1), // sRGB.
    long(0xa002, width),
    long(0xa003, height),
    short(0xa402, shot.mode === 'M' || !shot.mode ? 1 : 0),
    short(0xa405, shot.focal), // 36 x 24 mm simulated sensor.
  ];
  // EXIF defines an all-ones numerator as infinity, and zero as unknown.
  exif.push(rational(0x9206, shot.focusDistance === null ? 0
    : Number.isFinite(shot.focusDistance) ? Math.round(shot.focusDistance * 1000) : 0xffffffff,
    shot.focusDistance !== null && Number.isFinite(shot.focusDistance) ? 1000 : 1));
  exif.sort((a, b) => a.tag - b.tag);
  const directorySize = (entries) => 2 + entries.length * 12 + 4;
  const exifOffset = 8 + directorySize(ifd0);
  ifd0.find((entry) => entry.tag === 0x8769).value = exifOffset;
  let dataOffset = exifOffset + directorySize(exif);
  const externalSize = [...ifd0, ...exif].reduce((size, entry) =>
    size + (entry.data?.length > 4 ? entry.data.length + entry.data.length % 2 : 0), 0);
  const tiff = new Uint8Array(dataOffset + externalSize);
  const view = new DataView(tiff.buffer);
  tiff.set([0x49, 0x49, 42, 0, 8, 0, 0, 0]);
  const writeDirectory = (entries, offset) => {
    view.setUint16(offset, entries.length, true);
    entries.forEach((entry, index) => {
      const position = offset + 2 + index * 12;
      view.setUint16(position, entry.tag, true);
      view.setUint16(position + 2, entry.type, true);
      view.setUint32(position + 4, entry.count, true);
      if (entry.data?.length > 4) {
        view.setUint32(position + 8, dataOffset, true);
        tiff.set(entry.data, dataOffset);
        dataOffset += entry.data.length + entry.data.length % 2;
      } else if (entry.data) {
        tiff.set(entry.data, position + 8);
      } else if (entry.type === 3) {
        view.setUint16(position + 8, entry.value, true);
      } else {
        view.setUint32(position + 8, entry.value, true);
      }
    });
  };
  writeDirectory(ifd0, 8);
  writeDirectory(exif, exifOffset);
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('Expected a JPEG capture.');
  const segment = new Uint8Array(10 + tiff.length);
  segment.set([0xff, 0xe1]);
  new DataView(segment.buffer).setUint16(2, segment.length - 2);
  segment.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4);
  segment.set(tiff, 10);
  return new Blob([jpeg.subarray(0, 2), segment, jpeg.subarray(2)], { type: 'image/jpeg' });
}
