import { describe, test, expect } from 'bun:test';
import {
  getPalette,
  parseColorScheme,
  DEFAULT_COLOR_SCHEME,
  type ColorScheme,
} from './palette';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

describe('parseColorScheme', () => {
  test('aceita ansi e truecolor', () => {
    expect(parseColorScheme('ansi')).toBe('ansi');
    expect(parseColorScheme('truecolor')).toBe('truecolor');
  });

  test('é case-insensitive e ignora espaços', () => {
    expect(parseColorScheme('ANSI')).toBe('ansi');
    expect(parseColorScheme(' TrueColor ')).toBe('truecolor');
  });

  test('devolve null para valores desconhecidos', () => {
    expect(parseColorScheme('mono')).toBeNull();
    expect(parseColorScheme('')).toBeNull();
    // @ts-expect-error — validando entrada não-string
    expect(parseColorScheme(undefined)).toBeNull();
  });
});

describe('DEFAULT_COLOR_SCHEME', () => {
  test('default é ansi', () => {
    expect(DEFAULT_COLOR_SCHEME).toBe<ColorScheme>('ansi');
  });
});

describe('getPalette truecolor', () => {
  const p = getPalette('truecolor');

  test('preserva as cores hex clássicas do 2048', () => {
    expect(p.styleForValue(2).backgroundColor).toBe('#eee4da');
    expect(p.styleForValue(2048).backgroundColor).toBe('#edc22e');
  });

  test('tiles acima de 8192 caem no high fallback', () => {
    const high = p.styleForValue(16384);
    expect(high.backgroundColor).toBe('#1d1c17');
    expect(high.color).toBe('#edc22e');
  });

  test('valor 0 retorna o estilo de célula vazia', () => {
    const empty = p.styleForValue(0);
    expect(empty.backgroundColor).toBe(empty.color);
  });

  test('todas as cores expostas são hex', () => {
    expect(p.pulseBg).toMatch(HEX_RE);
    expect(p.boardBorder).toMatch(HEX_RE);
    expect(p.boardBg).toMatch(HEX_RE);
    expect(p.accent).toMatch(HEX_RE);
    expect(p.scoreBg).toMatch(HEX_RE);
    expect(p.scoreLabelFg).toMatch(HEX_RE);
    expect(p.danger).toMatch(HEX_RE);
  });
});

describe('getPalette ansi', () => {
  const p = getPalette('ansi');

  test('não usa cores hex — só nomes ANSI', () => {
    const collected = [
      p.pulseBg,
      p.boardBorder,
      p.boardBg,
      p.accent,
      p.scoreBg,
      p.scoreLabelFg,
      p.danger,
      ...[2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192].flatMap(
        (v) => {
          const s = p.styleForValue(v);
          return [s.backgroundColor, s.color];
        },
      ),
    ];
    for (const c of collected) {
      expect(c).not.toMatch(HEX_RE);
    }
  });

  test('cobre todos os valores padrão do 2048 com estilos distintos', () => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    const seen = new Set<string>();
    for (const v of values) {
      const s = p.styleForValue(v);
      expect(typeof s.backgroundColor).toBe('string');
      expect(typeof s.color).toBe('string');
      seen.add(`${s.backgroundColor}|${s.color}|${s.bold ?? false}`);
    }
    // pelo menos metade dos valores tem estilo único — evita paleta monocromática
    expect(seen.size).toBeGreaterThanOrEqual(Math.ceil(values.length / 2));
  });

  test('valor 0 retorna célula vazia (bg === fg)', () => {
    const empty = p.styleForValue(0);
    expect(empty.backgroundColor).toBe(empty.color);
  });

  test('tiles acima de 8192 caem no high fallback', () => {
    const high = p.styleForValue(65536);
    expect(typeof high.backgroundColor).toBe('string');
    expect(typeof high.color).toBe('string');
  });
});
