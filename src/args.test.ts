import { describe, test, expect } from 'bun:test';
import { parseCliArgs } from './args';

describe('parseCliArgs — sem argumentos', () => {
  test('usa os defaults (ansi + classic)', () => {
    expect(parseCliArgs([])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
      font: 'classic',
    });
  });
});

describe('parseCliArgs — --colors', () => {
  test('--colors=truecolor', () => {
    expect(parseCliArgs(['--colors=truecolor'])).toEqual({
      kind: 'ok',
      scheme: 'truecolor',
      font: 'classic',
    });
  });

  test('--colors ansi (duas tokens)', () => {
    expect(parseCliArgs(['--colors', 'ansi'])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
      font: 'classic',
    });
  });

  test('-c truecolor', () => {
    expect(parseCliArgs(['-c', 'truecolor'])).toEqual({
      kind: 'ok',
      scheme: 'truecolor',
      font: 'classic',
    });
  });

  test('esquema desconhecido vira erro', () => {
    const r = parseCliArgs(['--colors=mono']);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.message).toContain('mono');
  });
});

describe('parseCliArgs — --font', () => {
  test('--font=7seg', () => {
    expect(parseCliArgs(['--font=7seg'])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
      font: '7seg',
    });
  });

  test('--font solari (duas tokens)', () => {
    expect(parseCliArgs(['--font', 'solari'])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
      font: 'solari',
    });
  });

  test('-f nixie', () => {
    expect(parseCliArgs(['-f', 'nixie'])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
      font: 'nixie',
    });
  });

  test('aceita aliases (seven-segment → 7seg)', () => {
    expect(parseCliArgs(['--font', 'seven-segment'])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
      font: '7seg',
    });
  });

  test('font desconhecida vira erro', () => {
    const r = parseCliArgs(['--font=comic-sans']);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.message).toContain('comic-sans');
  });
});

describe('parseCliArgs — combinadas', () => {
  test('--colors truecolor --font nixie', () => {
    expect(parseCliArgs(['--colors', 'truecolor', '--font', 'nixie'])).toEqual({
      kind: 'ok',
      scheme: 'truecolor',
      font: 'nixie',
    });
  });

  test('ordem dos flags não importa', () => {
    expect(parseCliArgs(['-f', 'solari', '-c', 'truecolor'])).toEqual({
      kind: 'ok',
      scheme: 'truecolor',
      font: 'solari',
    });
  });
});

describe('parseCliArgs — ajuda e erros gerais', () => {
  test('--help e -h', () => {
    expect(parseCliArgs(['--help'])).toEqual({ kind: 'help' });
    expect(parseCliArgs(['-h'])).toEqual({ kind: 'help' });
  });

  test('--colors sem valor vira erro', () => {
    expect(parseCliArgs(['--colors']).kind).toBe('error');
  });

  test('--font sem valor vira erro', () => {
    expect(parseCliArgs(['--font']).kind).toBe('error');
  });

  test('flag desconhecida vira erro', () => {
    const r = parseCliArgs(['--foo']);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.message).toContain('--foo');
  });
});
