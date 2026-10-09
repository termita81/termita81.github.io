// Program mode meters the initial EV 7 gallery at ISO 100 and 50 mm.
export const state = {
  mode: "P",
  iso: 0,
  aperture: 4,
  shutter: 8,
  focal: 3,
  selected: "gallery",
  focusMode: "af",
  focusDistance: 5,
  dragToMoveRoom: false,
};
export const settingsEV = () => state.aperture + state.shutter - state.iso;
