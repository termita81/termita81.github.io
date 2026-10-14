/** The two times of day at the beach. Everything that differs between them is listed here. */

export const SUNNY_BEACH = {
  info: {
    id: 'beach',
    name: 'Sunny beach',
    ev: 15,
    thumbnail: 'sunny-beach.jpg', // rendered at time 0 with a 0.2 s shutter
    note:
      'Bright sun at EV 15: sandcastles, an umbrella and towel, and an open esky with two ' +
      'beers. A fisherman floats about 80 m offshore; a 780 m mountain rises across the water ' +
      'about 5.5 km away. A jetski passes at up to 14 m/s (50 km/h): compare 1/30 s with ' +
      '1/250–1/500 s, and focus on the rider to isolate motion blur.',
  },
  goldenHour: false,
  sky: [0.32, 0.57, 0.83], // linear RGB
  ambient: { sky: '#e0f2ff', ground: '#b89c72', intensity: 1.3 },
  sun: { color: '#fff4df', intensity: 2.2, position: [-12, 26, 12] },
  water: {
    base: '#238aaf',
    ripple: '#359cba',
    highlight: '#5cb9cd',
    roughness: 0.38,
    metalness: 0.15,
  },
  mountain: { rock: '#688da0', gullies: '#486c80' },
  castles: [
    { x: 1.3, z: -3.1, scale: 1 },
    { x: 2.65, z: -4.8, scale: 0.65 },
  ],
};

export const GOLDEN_HOUR_BEACH = {
  info: {
    id: 'sunset-beach',
    name: 'Golden-hour beach',
    ev: 9,
    // Rendered at time 13.58 s with a 0.025 s shutter, turned by yaw −0.07 and pitch −0.1.
    thumbnail: 'golden-hour-beach.jpg',
    note:
      'Golden afternoon light at EV 9, with the sun still above the sea roughly 1–1.5 hours ' +
      'before sundown. Warm sand, long shadows, rose-tinted mountains, and a golden reflection ' +
      'on the water. The seagull completes one circuit every 24 seconds: compare shutter ' +
      'speeds and focus between the beach and offshore subjects.',
  },
  goldenHour: true,
  sky: [0.65, 0.34, 0.2],
  ambient: { sky: '#e9c6ae', ground: '#77533e', intensity: 0.8 },
  sun: { color: '#ffb668', intensity: 1.6, position: [10, 7.6, -40] },
  water: {
    base: '#536f7f',
    ripple: '#778f98',
    highlight: '#b4aaa0',
    roughness: 0.7,
    metalness: 0,
  },
  mountain: { rock: '#897785', gullies: '#675b6d' },
  castles: [{ x: 3, z: -5.2, scale: 1 }],
};
