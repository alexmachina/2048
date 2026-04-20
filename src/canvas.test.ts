import { describe, it, expect } from 'bun:test';
import {
  canvasToBraille,
  createCanvas,
  drawLabel,
  labelOnTile,
  labelWidth,
} from './canvas';

describe('canvas — createCanvas', () => {
  it('creates a zero-filled 2d array of the given size', () => {
    const c = createCanvas(4, 3);
    expect(c.length).toBe(3);
    expect(c[0].length).toBe(4);
    expect(c.flat().every((v) => v === 0)).toBe(true);
  });
});

describe('canvas — labelWidth', () => {
  it('returns 0 for empty string', () => {
    expect(labelWidth('')).toBe(0);
  });
  it('returns 3 for a single digit (3 wide)', () => {
    expect(labelWidth('7')).toBe(3);
  });
  it('returns N*3 + (N-1) for N digits with 1-pixel spacing', () => {
    expect(labelWidth('42')).toBe(7);
    expect(labelWidth('128')).toBe(11);
    expect(labelWidth('2048')).toBe(15);
  });
});

describe('canvas — canvasToBraille', () => {
  it('encodes empty canvas as all-blank braille chars (U+2800)', () => {
    const c = createCanvas(4, 4);
    const lines = canvasToBraille(c);
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('\u2800\u2800');
  });

  it('encodes top-left dot as U+2801', () => {
    const c = createCanvas(2, 4);
    c[0][0] = 1;
    expect(canvasToBraille(c)[0]).toBe('\u2801');
  });

  it('encodes bottom-right (row 3 col 1) as U+2880', () => {
    const c = createCanvas(2, 4);
    c[3][1] = 1;
    expect(canvasToBraille(c)[0]).toBe('\u2880');
  });

  it('encodes a full cell (all 8 dots) as U+28FF', () => {
    const c = createCanvas(2, 4);
    for (let r = 0; r < 4; r++)
      for (let col = 0; col < 2; col++) c[r][col] = 1;
    expect(canvasToBraille(c)[0]).toBe('\u28FF');
  });

  it('emits one line per 4 rows of canvas', () => {
    const c = createCanvas(2, 8);
    expect(canvasToBraille(c).length).toBe(2);
  });
});

describe('canvas — drawLabel', () => {
  it('paints the pixels of a digit at the requested offset', () => {
    const c = createCanvas(3, 5);
    drawLabel(c, '0', 0, 0);
    // Digit '0' bitmap: outline, so corners should be lit.
    expect(c[0][0]).toBe(1);
    expect(c[0][2]).toBe(1);
    expect(c[4][0]).toBe(1);
    expect(c[4][2]).toBe(1);
    // Center pixel (1,1) is empty for '0'.
    expect(c[1][1]).toBe(0);
    expect(c[2][1]).toBe(0);
    expect(c[3][1]).toBe(0);
  });

  it('ignores unknown characters silently', () => {
    const c = createCanvas(3, 5);
    drawLabel(c, '?', 0, 0);
    expect(c.flat().every((v) => v === 0)).toBe(true);
  });

  it('respects letter spacing between digits', () => {
    const c = createCanvas(7, 5);
    drawLabel(c, '11', 0, 0);
    // digit '1' pattern has column 1 always lit at row 4 ("1 1 1" on the bottom),
    // and its spine on column 1 of the 3-wide digit → x=1 for first, x=5 for second
    expect(c[4][1]).toBe(1); // first '1' bottom row, col 1
    expect(c[4][5]).toBe(1); // second '1' bottom row, col 1 (after 3+1 spacing)
  });
});

describe('canvas — labelOnTile', () => {
  it('produces cellsTall lines of braille for a labelless tile', () => {
    const lines = labelOnTile('', 8, 3);
    expect(lines.length).toBe(3);
    expect(lines[0].length).toBe(8);
    expect(lines.every((l) => [...l].every((ch) => ch === '\u2800'))).toBe(
      true
    );
  });

  it('paints a single-digit label with near-center placement', () => {
    const lines = labelOnTile('2', 8, 3);
    expect(lines.length).toBe(3);
    // At least one cell in the tile has dots
    expect(lines.some((l) => [...l].some((ch) => ch !== '\u2800'))).toBe(true);
  });

  it('fits a 4-digit label within the canvas without overflow', () => {
    const lines = labelOnTile('2048', 8, 3);
    // No line is longer than 8 cells
    expect(lines.every((l) => [...l].length === 8)).toBe(true);
  });
});
