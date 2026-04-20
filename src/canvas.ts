import { DIGIT_H, DIGIT_W, bitmapFor } from './digit-font';

export type Canvas = number[][];

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
 * Canvas is a (width × height) grid of 0/1 sub-pixels. A terminal cell
 * holds a 2×4 block of sub-pixels, so we tile the canvas into cells and
 * emit one braille codepoint per cell.
 *
 * Braille dot → bit layout (Unicode UAX #44):
 *     ┌─────┬─────┐
 *     │ 0x01│ 0x08│    row 0
 *     ├─────┼─────┤
 *     │ 0x02│ 0x10│    row 1
 *     ├─────┼─────┤
 *     │ 0x04│ 0x20│    row 2
 *     ├─────┼─────┤
 *     │ 0x40│ 0x80│    row 3
 *     └─────┴─────┘
 *       col 0 col 1
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
 * Paints `label` centered on a fresh canvas sized for a tile
 * of `cellsWide × cellsTall` terminal cells (2×4 sub-pixels each).
 */
export function labelOnTile(
  label: string,
  cellsWide: number,
  cellsTall: number
): string[] {
  const w = cellsWide * 2;
  const h = cellsTall * 4;
  const canvas = createCanvas(w, h);
  if (label.length > 0) {
    const lw = labelWidth(label);
    const x = Math.max(0, Math.floor((w - lw) / 2));
    const y = Math.max(0, Math.floor((h - DIGIT_H) / 2));
    drawLabel(canvas, label, x, y);
  }
  return canvasToBraille(canvas);
}
