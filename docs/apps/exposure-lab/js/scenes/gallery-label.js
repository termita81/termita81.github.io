/** Draws the front of a gallery display: fine lines to focus on, and its distance in metres. */

const SIZE = 512;
const PAPER = '#f8ecd8';
const INK = '#302b28';
const DIGIT_PITCH = 62;
const DIGIT_TOP = 392;

/** Seven-segment strokes as [x1, y1, x2, y2] within a 42 × 72 cell. */
// prettier-ignore
const SEGMENTS = [
  [0, 0, 42, 0], [42, 0, 42, 36], [42, 36, 42, 72],
  [0, 72, 42, 72], [0, 36, 0, 72], [0, 0, 0, 36], [0, 36, 42, 36],
];

/** The segments that make up each digit, 0 to 9. */
// prettier-ignore
const DIGITS = [
  '012345', '12', '01463', '01263', '5612',
  '05623', '056432', '012', '0123456', '012356',
];

function drawFineLines(g, color) {
  g.fillStyle = color;
  g.fillRect(0, 0, SIZE, SIZE);
  g.strokeStyle = PAPER;
  g.lineWidth = 5;
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    g.moveTo(i * 32, 0);
    g.lineTo(i * 32, 340);
    g.stroke();
  }
}

function drawDigit(g, digit, left) {
  for (const segment of DIGITS[Number(digit)]) {
    const [x1, y1, x2, y2] = SEGMENTS[Number(segment)];
    g.beginPath();
    g.moveTo(left + x1, DIGIT_TOP + y1);
    g.lineTo(left + x2, DIGIT_TOP + y2);
    g.stroke();
  }
}

/** A small "m". */
function drawMetreSign(g, left) {
  g.beginPath();
  g.moveTo(left, 464);
  g.lineTo(left, 418);
  g.lineTo(left + 22, 418);
  g.lineTo(left + 22, 464);
  g.moveTo(left + 22, 418);
  g.lineTo(left + 44, 418);
  g.lineTo(left + 44, 464);
  g.stroke();
}

export function drawDistanceLabel(g, color, distance) {
  drawFineLines(g, color);
  g.fillStyle = PAPER;
  g.fillRect(12, 360, 488, 140);
  // Draw the distance as crisp engraved strokes, independent of font loading.
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.lineCap = 'round';
  const text = String(distance);
  const start = SIZE / 2 - (text.length * DIGIT_PITCH + 72) / 2;
  [...text].forEach((digit, index) => drawDigit(g, digit, start + index * DIGIT_PITCH));
  drawMetreSign(g, start + text.length * DIGIT_PITCH + 8);
}
