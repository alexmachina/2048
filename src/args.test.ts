import { describe, test, expect } from 'bun:test';
import { parseCliArgs } from './args';

describe('parseCliArgs', () => {
  test('sem argumentos usa o esquema padrão (ansi)', () => {
    const r = parseCliArgs([]);
    expect(r).toEqual({ kind: 'ok', scheme: 'ansi' });
  });

  test('--colors=truecolor', () => {
    expect(parseCliArgs(['--colors=truecolor'])).toEqual({
      kind: 'ok',
      scheme: 'truecolor',
    });
  });

  test('--colors ansi (duas tokens)', () => {
    expect(parseCliArgs(['--colors', 'ansi'])).toEqual({
      kind: 'ok',
      scheme: 'ansi',
    });
  });

  test('-c truecolor', () => {
    expect(parseCliArgs(['-c', 'truecolor'])).toEqual({
      kind: 'ok',
      scheme: 'truecolor',
    });
  });

  test('--help e -h', () => {
    expect(parseCliArgs(['--help'])).toEqual({ kind: 'help' });
    expect(parseCliArgs(['-h'])).toEqual({ kind: 'help' });
  });

  test('esquema desconhecido vira erro', () => {
    const r = parseCliArgs(['--colors=mono']);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') {
      expect(r.message).toContain('mono');
    }
  });

  test('--colors sem valor vira erro', () => {
    const r = parseCliArgs(['--colors']);
    expect(r.kind).toBe('error');
  });

  test('flag desconhecida vira erro', () => {
    const r = parseCliArgs(['--foo']);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') {
      expect(r.message).toContain('--foo');
    }
  });
});
