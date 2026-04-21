import { describe, test, expect } from 'bun:test';
import {
  DEFAULT_FONT,
  FONTS,
  FONT_NAMES,
  getFont,
  parseFontName,
  type FontName,
} from './index';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Dimensões esperadas por font (não são todas 4×7 — `classic` é 3×5). */
const EXPECTED_DIMS: Record<FontName, { width: number; height: number }> = {
  classic: { width: 3, height: 5 },
  '7seg': { width: 4, height: 7 },
  dotmatrix: { width: 4, height: 7 },
  solari: { width: 4, height: 7 },
  nixie: { width: 4, height: 7 },
};

describe('parseFontName', () => {
  test('aceita todos os nomes canônicos', () => {
    expect(parseFontName('classic')).toBe('classic');
    expect(parseFontName('7seg')).toBe('7seg');
    expect(parseFontName('dotmatrix')).toBe('dotmatrix');
    expect(parseFontName('solari')).toBe('solari');
    expect(parseFontName('nixie')).toBe('nixie');
  });

  test('é case-insensitive e ignora espaços', () => {
    expect(parseFontName('  7SEG ')).toBe('7seg');
    expect(parseFontName('DotMatrix')).toBe('dotmatrix');
    expect(parseFontName('NIXIE')).toBe('nixie');
    expect(parseFontName('Classic')).toBe('classic');
  });

  test('aceita aliases comuns', () => {
    expect(parseFontName('original')).toBe('classic');
    expect(parseFontName('default')).toBe('classic');
    expect(parseFontName('seven-segment')).toBe('7seg');
    expect(parseFontName('7-segment')).toBe('7seg');
    expect(parseFontName('dot-matrix')).toBe('dotmatrix');
    expect(parseFontName('matrix')).toBe('dotmatrix');
    expect(parseFontName('split-flap')).toBe('solari');
    expect(parseFontName('splitflap')).toBe('solari');
    expect(parseFontName('tube')).toBe('nixie');
  });

  test('devolve null para desconhecido ou não-string', () => {
    expect(parseFontName('comic-sans')).toBeNull();
    expect(parseFontName('')).toBeNull();
    // @ts-expect-error — validando entrada não-string
    expect(parseFontName(undefined)).toBeNull();
  });
});

describe('DEFAULT_FONT e FONT_NAMES', () => {
  test('DEFAULT_FONT é classic (font original, mais legível)', () => {
    expect(DEFAULT_FONT).toBe<FontName>('classic');
  });

  test('DEFAULT_FONT está entre os nomes conhecidos', () => {
    expect(FONT_NAMES).toContain(DEFAULT_FONT);
  });

  test('cada nome de FONT_NAMES resolve para um Font válido', () => {
    for (const name of FONT_NAMES) {
      const f = getFont(name);
      expect(f.name).toBe(name);
    }
  });

  test('FONTS tem exatamente 5 entradas (classic + 4 estilos)', () => {
    expect(Object.keys(FONTS)).toHaveLength(5);
  });
});

describe.each<FontName>(['classic', '7seg', 'dotmatrix', 'solari', 'nixie'])(
  'font %s',
  (name) => {
    const font = getFont(name);
    const dims = EXPECTED_DIMS[name];

    test('declara dimensões esperadas', () => {
      expect(font.width).toBe(dims.width);
      expect(font.height).toBe(dims.height);
      expect(font.letterSpacing).toBeGreaterThanOrEqual(0);
    });

    test('cobre todos os 10 dígitos 0-9', () => {
      for (const d of DIGITS) {
        const bmp = font.glyph(d);
        expect(bmp).not.toBeNull();
      }
    });

    test('todo glifo tem exatamente font.height linhas × font.width colunas', () => {
      for (const d of DIGITS) {
        const bmp = font.glyph(d)!;
        expect(bmp.length).toBe(font.height);
        for (const row of bmp) {
          expect(row.length).toBe(font.width);
          for (const cell of row) {
            // bitmap é 0/1
            expect(cell === 0 || cell === 1).toBe(true);
          }
        }
      }
    });

    test('glifo desconhecido retorna null', () => {
      expect(font.glyph('?')).toBeNull();
      expect(font.glyph('A')).toBeNull();
      expect(font.glyph('')).toBeNull();
    });

    test('cada dígito tem pelo menos 1 pixel ligado (não é tudo vazio)', () => {
      for (const d of DIGITS) {
        const lit = font.glyph(d)!.flat().reduce((s, v) => s + v, 0);
        expect(lit).toBeGreaterThan(0);
      }
    });

    test('dígitos são visualmente distintos entre si', () => {
      const seen = new Set<string>();
      for (const d of DIGITS) {
        const sig = JSON.stringify(font.glyph(d));
        expect(seen.has(sig)).toBe(false);
        seen.add(sig);
      }
    });
  },
);

describe('Nixie — detalhes distintivos', () => {
  const f = getFont('nixie');
  // '4' aberto-topo: não há barra horizontal contínua na linha 0.
  test("'4' tem topo aberto (linhas esquerda e direita separadas)", () => {
    const four = f.glyph('4')!;
    // Linha 0 deve ter pixels apenas nas extremidades, gap no meio
    expect(four[0]).toEqual([1, 0, 0, 1]);
  });

  test("'1' tem flag diagonal à esquerda (col 0 ligada na linha 1)", () => {
    const one = f.glyph('1')!;
    expect(one[1][0]).toBe(1);
  });
});

describe('Solari — costura', () => {
  const f = getFont('solari');

  test('decorateTile existe e é uma função', () => {
    expect(typeof f.decorateTile).toBe('function');
  });

  test('decorateTile pinta duas linhas horizontais no meio do canvas', () => {
    const canvas: number[][] = Array.from({ length: 20 }, () =>
      Array<number>(20).fill(0),
    );
    f.decorateTile!(canvas);

    // linhas centrais (mid-1 e mid) devem estar todas ligadas
    const mid = Math.floor(canvas.length / 2);
    expect(canvas[mid].every((v) => v === 1)).toBe(true);
    expect(canvas[mid - 1].every((v) => v === 1)).toBe(true);
    // outras linhas continuam zeradas
    expect(canvas[0].every((v) => v === 0)).toBe(true);
    expect(canvas[canvas.length - 1].every((v) => v === 0)).toBe(true);
  });

  test('decorateTile em canvas vazio não explode', () => {
    expect(() => f.decorateTile!([])).not.toThrow();
  });

  test("classic / 7seg / dotmatrix / nixie NÃO têm decorateTile", () => {
    expect(getFont('classic').decorateTile).toBeUndefined();
    expect(getFont('7seg').decorateTile).toBeUndefined();
    expect(getFont('dotmatrix').decorateTile).toBeUndefined();
    expect(getFont('nixie').decorateTile).toBeUndefined();
  });
});
