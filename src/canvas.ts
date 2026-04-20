import { DIGIT_H, DIGIT_W, bitmapFor } from './digit-font';

export type Canvas = number[][];
export type Encoding = 'braille' | 'quadrant';

export function createCanvas(width: number, height: number): Canvas {
  return Array.from({ length: height }, () => Array<number>(width).fill(0));
}

export const LETTER_SPACING = 1;

export function labelWidth(label: string): number {
  if (label.length === 0) return 0;
  return label.length * DIGIT_W + (label.length - 1) * LETTER_SPACING;
}

export function drawLabel(
  canvas: Canvas,
  label: string,
  x: number,
  y: number
): void {
  let cx = x;
  for (const ch of label) {
    const bitmap = bitmapFor(ch);
    if (bitmap) {
      for (let r = 0; r < bitmap.length; r++) {
        for (let c = 0; c < bitmap[r].length; c++) {
          if (!bitmap[r][c]) continue;
          const px = cx + c;
          const py = y + r;
          if (py < 0 || py >= canvas.length) continue;
          if (px < 0 || px >= canvas[py].length) continue;
          canvas[py][px] = 1;
        }
      }
    }
    cx += DIGIT_W + LETTER_SPACING;
  }
}

/**
 * Braille encoding: 2×4 sub-pixels per terminal cell. Dot-to-bit layout:
 *     col0   col1
 *     0x01   0x08    row 0
 *     0x02   0x10    row 1
 *     0x04   0x20    row 2
 *     0x40   0x80    row 3
 * Codepoint: U+2800 + byte.
 */
export function canvasToBraille(canvas: Canvas): string[] {
  if (canvas.length === 0) return [];
  const height = canvas.length;
  const width = canvas[0].length;
  const cellCols = Math.ceil(width / 2);
  const cellRows = Math.ceil(height / 4);
  const lines: string[] = [];

  for (let R = 0; R < cellRows; R++) {
    let line = '';
    for (let C = 0; C < cellCols; C++) {
      const r0 = R * 4;
      const c0 = C * 2;
      let byte = 0;
      if (canvas[r0]?.[c0]) byte |= 0x01;
      if (canvas[r0 + 1]?.[c0]) byte |= 0x02;
      if (canvas[r0 + 2]?.[c0]) byte |= 0x04;
      if (canvas[r0]?.[c0 + 1]) byte |= 0x08;
      if (canvas[r0 + 1]?.[c0 + 1]) byte |= 0x10;
      if (canvas[r0 + 2]?.[c0 + 1]) byte |= 0x20;
      if (canvas[r0 + 3]?.[c0]) byte |= 0x40;
      if (canvas[r0 + 3]?.[c0 + 1]) byte |= 0x80;
      line += String.fromCodePoint(0x2800 + byte);
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Quadrant encoding: 2×2 sub-pixels per terminal cell. Bit layout:
 *     col0  col1
 *     0x1   0x2    row 0
 *     0x4   0x8    row 1
 * Each of 16 combinations maps to a codepoint in U+2580..U+259F.
 * The empty cell uses a regular space (U+0020) instead of any block char,
 * so background color shows through cleanly.
 */
const QUADRANT_TABLE: readonly string[] = [
  ' ', //       0000
  '\u2598', // ▘ 0001 upper-left
  '\u259D', // ▝ 0010 upper-right
  '\u2580', // ▀ 0011 upper half
  '\u2596', // ▖ 0100 lower-left
  '\u258C', // ▌ 0101 left half
  '\u259E', // ▞ 0110 / diagonal
  '\u259B', // ▛ 0111 all but lower-right
  '\u2597', // ▗ 1000 lower-right
  '\u259A', // ▚ 1001 \ diagonal
  '\u2590', // ▐ 1010 right half
  '\u259C', // ▜ 1011 all but lower-left
  '\u2584', // ▄ 1100 lower half
  '\u2599', // ▙ 1101 all but upper-right
  '\u259F', // ▟ 1110 all but upper-left
  '\u2588', // █ 1111 full
];

export function canvasToQuadrant(canvas: Canvas): string[] {
  if (canvas.length === 0) return [];
  const height = canvas.length;
  const width = canvas[0].length;
  const cellCols = Math.ceil(width / 2);
  const cellRows = Math.ceil(height / 2);
  const lines: string[] = [];

  for (let R = 0; R < cellRows; R++) {
    let line = '';
    for (let C = 0; C < cellCols; C++) {
      const r0 = R * 2;
      const c0 = C * 2;
      let byte = 0;
      if (canvas[r0]?.[c0]) byte |= 0x1;
      if (canvas[r0]?.[c0 + 1]) byte |= 0x2;
      if (canvas[r0 + 1]?.[c0]) byte |= 0x4;
      if (canvas[r0 + 1]?.[c0 + 1]) byte |= 0x8;
      line += QUADRANT_TABLE[byte];
    }
    lines.push(line);
  }
  return lines;
}

const SUBPIXELS_PER_CELL: Record<Encoding, { w: number; h: number }> = {
  braille: { w: 2, h: 4 },
  quadrant: { w: 2, h: 2 },
};

/**
 * Paints `label` centered on a fresh canvas sized for a tile of
 * `cellsWide × cellsTall` terminal cells, then serializes via `encoding`.
 *
 * Quadrant is the default because its chunkier pixels read better as a
 * solid tile stamped with a number. See docs/sub-cell-rendering.md.
 */
export function labelOnTile(
  label: string,
  cellsWide: number,
  cellsTall: number,
  encoding: Encoding = 'quadrant'
): string[] {
  const { w: sw, h: sh } = SUBPIXELS_PER_CELL[encoding];
  const w = cellsWide * sw;
  const h = cellsTall * sh;
  const canvas = createCanvas(w, h);
  if (label.length > 0) {
    const lw = labelWidth(label);
    const x = Math.max(0, Math.floor((w - lw) / 2));
    const y = Math.max(0, Math.floor((h - DIGIT_H) / 2));
    drawLabel(canvas, label, x, y);
  }
  return encoding === 'braille'
    ? canvasToBraille(canvas)
    : canvasToQuadrant(canvas);
}
