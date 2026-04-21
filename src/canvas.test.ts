import { describe, it, expect } from 'bun:test';
import {
  canvasToBraille,
  canvasToQuadrant,
  createCanvas,
  drawLabel,
  labelOnTile,
  labelWidth,
} from './canvas';
import { getFont } from './fonts';

// Tests usam o 7seg como font de referência (4×7, previsível).
const FONT = getFont('7seg');

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
    expect(labelWidth('', FONT)).toBe(0);
  });
  it('returns font.width for a single digit', () => {
    expect(labelWidth('7', FONT)).toBe(FONT.width);
  });
  it('returns N*width + (N-1)*letterSpacing for N digits', () => {
    const w = FONT.width;
    const s = FONT.letterSpacing;
    expect(labelWidth('42', FONT)).toBe(2 * w + s);
    expect(labelWidth('128', FONT)).toBe(3 * w + 2 * s);
    expect(labelWidth('2048', FONT)).toBe(4 * w + 3 * s);
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
  it('paints the corners of 0 bitmap at the given offset', () => {
    // 7-seg '0' é um retângulo fechado — todos os 4 cantos acesos.
    const c = createCanvas(FONT.width, FONT.height);
    drawLabel(c, '0', 0, 0, FONT);
    expect(c[0][0]).toBe(1);
    expect(c[0][FONT.width - 1]).toBe(1);
    expect(c[FONT.height - 1][0]).toBe(1);
    expect(c[FONT.height - 1][FONT.width - 1]).toBe(1);
    // middle row do 7-seg '0' é vazio (sem segmento g)
    const mid = Math.floor(FONT.height / 2);
    expect(c[mid].every((v) => v === 0)).toBe(true);
  });

  it('ignores unknown characters silently', () => {
    const c = createCanvas(FONT.width, FONT.height);
    drawLabel(c, '?', 0, 0, FONT);
    expect(c.flat().every((v) => v === 0)).toBe(true);
  });

  it('respects letter spacing between digits', () => {
    const w = FONT.width;
    const s = FONT.letterSpacing;
    const c = createCanvas(2 * w + s, FONT.height);
    drawLabel(c, '88', 0, 0, FONT);
    // 7-seg '8' tem col 0 e col (w-1) ligadas na row 0
    expect(c[0][0]).toBe(1);
    expect(c[0][w - 1]).toBe(1);
    // segundo '8' começa em x = w + s
    expect(c[0][w + s]).toBe(1);
    expect(c[0][2 * w + s - 1]).toBe(1);
  });
});

describe('canvas — canvasToQuadrant', () => {
  it('encodes empty canvas as spaces', () => {
    const c = createCanvas(4, 2);
    const lines = canvasToQuadrant(c);
    expect(lines).toEqual(['  ']);
  });

  it('encodes a full 2×2 block as U+2588 (full block)', () => {
    const c = createCanvas(2, 2);
    for (let r = 0; r < 2; r++) for (let col = 0; col < 2; col++) c[r][col] = 1;
    expect(canvasToQuadrant(c)[0]).toBe('\u2588');
  });

  it('encodes upper half as U+2580 and lower half as U+2584', () => {
    const upper = createCanvas(2, 2);
    upper[0][0] = 1;
    upper[0][1] = 1;
    expect(canvasToQuadrant(upper)[0]).toBe('\u2580');

    const lower = createCanvas(2, 2);
    lower[1][0] = 1;
    lower[1][1] = 1;
    expect(canvasToQuadrant(lower)[0]).toBe('\u2584');
  });

  it('emits one line per 2 rows of canvas (half of braille)', () => {
    const c = createCanvas(2, 6);
    expect(canvasToQuadrant(c).length).toBe(3);
    expect(canvasToBraille(c).length).toBe(2);
  });
});

describe('canvas — labelOnTile', () => {
  it('default é quadrant — emite cellsTall linhas com espaços em tile vazio', () => {
    const lines = labelOnTile('', 10, 5, FONT);
    expect(lines.length).toBe(5);
    expect([...lines[0]].length).toBe(10);
    expect([...lines[0]].every((ch) => ch === ' ')).toBe(true);
  });

  it('permite override para braille encoding', () => {
    const lines = labelOnTile('', 10, 5, FONT, 'braille');
    expect(lines.length).toBe(5);
    expect([...lines[0]].every((ch) => ch === '\u2800')).toBe(true);
  });

  it('pinta um label de 1 dígito em algum lugar do tile (quadrant)', () => {
    const lines = labelOnTile('2', 10, 5, FONT);
    expect(lines.some((l) => [...l].some((ch) => ch !== ' '))).toBe(true);
  });

  it('label de 4 dígitos cabe em tile 10×5', () => {
    const lines = labelOnTile('2048', 10, 5, FONT);
    expect(lines.every((l) => [...l].length === 10)).toBe(true);
  });

  it('aplica font.decorateTile se presente — costura do solari em quadrant', () => {
    const solari = getFont('solari');
    const lines = labelOnTile('', 10, 5, solari);
    // Costura é em sub-rows mid-1 e mid do canvas 10-tall (quadrant) → rows
    // 4 e 5, que caem inteiramente na quadrant cell-row 2 (sub-rows 4-5),
    // preenchendo os 4 quadrants → cada cell vira bloco completo '█' (U+2588).
    const midCellRow = 2;
    const cells = [...lines[midCellRow]];
    for (const ch of cells) {
      expect(ch).toBe('\u2588');
    }
  });

  it('aplica font.decorateTile também em encoding braille', () => {
    const solari = getFont('solari');
    const lines = labelOnTile('', 10, 5, solari, 'braille');
    // Em braille, canvas é 20-tall, mid=10, rows 9 e 10 ficam na braille cell-
    // row 2 (sub-rows 8-11), bits 0x02+0x10+0x04+0x20 = 0x36 → codepoint 0x2836 '⠶'.
    const midCellRow = 2;
    const cells = [...lines[midCellRow]];
    for (const ch of cells) {
      expect(ch).toBe('\u2836');
    }
  });
});
