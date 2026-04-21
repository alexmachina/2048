import { describe, test, expect } from 'bun:test';
import {
  INITIAL_SHOWCASE_STATE,
  SECTIONS,
  VALUES,
  ENCODINGS,
  reduce,
  currentValue,
  currentFont,
  currentScheme,
  currentEncoding,
  type ShowcaseState,
} from './showcase-state';
import { FONT_NAMES } from './fonts';
import { COLOR_SCHEMES } from './palette';

describe('showcase-state — initial state', () => {
  test('starts on the first section (tiles)', () => {
    expect(INITIAL_SHOWCASE_STATE.section).toBe('tiles');
  });

  test('starts at value 2 (the first non-empty tile)', () => {
    expect(currentValue(INITIAL_SHOWCASE_STATE)).toBe(2);
  });

  test('starts with classic font and ansi scheme (matches game defaults)', () => {
    expect(currentFont(INITIAL_SHOWCASE_STATE)).toBe('classic');
    expect(currentScheme(INITIAL_SHOWCASE_STATE)).toBe('ansi');
  });

  test('starts with quadrant encoding, pulse off, dim off', () => {
    expect(currentEncoding(INITIAL_SHOWCASE_STATE)).toBe('quadrant');
    expect(INITIAL_SHOWCASE_STATE.pulse).toBe(false);
    expect(INITIAL_SHOWCASE_STATE.dim).toBe(false);
  });
});

describe('showcase-state — section navigation', () => {
  test('{type: nextSection} advances through sections cyclically', () => {
    let s: ShowcaseState = INITIAL_SHOWCASE_STATE;
    for (let i = 1; i < SECTIONS.length; i++) {
      s = reduce(s, { type: 'nextSection' });
      expect(s.section).toBe(SECTIONS[i]);
    }
    s = reduce(s, { type: 'nextSection' });
    expect(s.section).toBe(SECTIONS[0]); // wraps
  });

  test('{type: prevSection} goes backwards cyclically', () => {
    const s = reduce(INITIAL_SHOWCASE_STATE, { type: 'prevSection' });
    expect(s.section).toBe(SECTIONS[SECTIONS.length - 1]);
  });

  test('{type: gotoSection, section} jumps directly', () => {
    const s = reduce(INITIAL_SHOWCASE_STATE, {
      type: 'gotoSection',
      section: 'encodings',
    });
    expect(s.section).toBe('encodings');
  });

  test('gotoSection with unknown section is a no-op', () => {
    const s = reduce(INITIAL_SHOWCASE_STATE, {
      type: 'gotoSection',
      // @ts-expect-error — intentionally invalid section name
      section: 'bogus',
    });
    expect(s.section).toBe(INITIAL_SHOWCASE_STATE.section);
  });
});

describe('showcase-state — primary knob (next/prev) depends on section', () => {
  test('on tiles: next advances the value', () => {
    const s0 = INITIAL_SHOWCASE_STATE;
    const s1 = reduce(s0, { type: 'next' });
    expect(currentValue(s1)).toBe(VALUES[VALUES.indexOf(currentValue(s0)) + 1]);
  });

  test('on fonts: next also advances the value (shown across all fonts)', () => {
    const s0 = reduce(INITIAL_SHOWCASE_STATE, {
      type: 'gotoSection',
      section: 'fonts',
    });
    const s1 = reduce(s0, { type: 'next' });
    expect(currentValue(s1)).toBe(VALUES[VALUES.indexOf(currentValue(s0)) + 1]);
  });

  test('on digits: next advances the font instead', () => {
    const s0 = reduce(INITIAL_SHOWCASE_STATE, {
      type: 'gotoSection',
      section: 'digits',
    });
    const s1 = reduce(s0, { type: 'next' });
    expect(currentFont(s1)).toBe(
      FONT_NAMES[FONT_NAMES.indexOf(currentFont(s0)) + 1],
    );
    // value unchanged
    expect(currentValue(s1)).toBe(currentValue(s0));
  });

  test('on palette: next cycles the color scheme', () => {
    const s0 = reduce(INITIAL_SHOWCASE_STATE, {
      type: 'gotoSection',
      section: 'palette',
    });
    const s1 = reduce(s0, { type: 'next' });
    expect(currentScheme(s1)).toBe(
      COLOR_SCHEMES[COLOR_SCHEMES.indexOf(currentScheme(s0)) + 1],
    );
  });

  test('on encodings: next advances the value', () => {
    const s0 = reduce(INITIAL_SHOWCASE_STATE, {
      type: 'gotoSection',
      section: 'encodings',
    });
    const s1 = reduce(s0, { type: 'next' });
    expect(currentValue(s1)).toBe(VALUES[VALUES.indexOf(currentValue(s0)) + 1]);
  });

  test('next wraps at the end of VALUES', () => {
    let s = INITIAL_SHOWCASE_STATE;
    // seek to last value
    while (currentValue(s) !== VALUES[VALUES.length - 1]) {
      s = reduce(s, { type: 'next' });
    }
    const wrapped = reduce(s, { type: 'next' });
    expect(currentValue(wrapped)).toBe(VALUES[0]);
  });

  test('prev is the inverse of next', () => {
    const s0 = INITIAL_SHOWCASE_STATE;
    const roundtrip = reduce(reduce(s0, { type: 'next' }), { type: 'prev' });
    expect(currentValue(roundtrip)).toBe(currentValue(s0));
  });
});

describe('showcase-state — independent cycles (work in any section)', () => {
  test('cycleFont advances font cyclically', () => {
    let s = INITIAL_SHOWCASE_STATE;
    for (let i = 1; i < FONT_NAMES.length; i++) {
      s = reduce(s, { type: 'cycleFont' });
      expect(currentFont(s)).toBe(FONT_NAMES[i]);
    }
    s = reduce(s, { type: 'cycleFont' });
    expect(currentFont(s)).toBe(FONT_NAMES[0]);
  });

  test('cyclePalette toggles between ansi and truecolor', () => {
    const s1 = reduce(INITIAL_SHOWCASE_STATE, { type: 'cyclePalette' });
    expect(currentScheme(s1)).toBe('truecolor');
    const s2 = reduce(s1, { type: 'cyclePalette' });
    expect(currentScheme(s2)).toBe('ansi');
  });

  test('cycleEncoding toggles between quadrant and braille', () => {
    const s1 = reduce(INITIAL_SHOWCASE_STATE, { type: 'cycleEncoding' });
    expect(currentEncoding(s1)).toBe('braille');
    const s2 = reduce(s1, { type: 'cycleEncoding' });
    expect(currentEncoding(s2)).toBe('quadrant');
  });
});

describe('showcase-state — flag toggles', () => {
  test('togglePulse flips pulse', () => {
    const s1 = reduce(INITIAL_SHOWCASE_STATE, { type: 'togglePulse' });
    expect(s1.pulse).toBe(true);
    const s2 = reduce(s1, { type: 'togglePulse' });
    expect(s2.pulse).toBe(false);
  });

  test('toggleDim flips dim', () => {
    const s1 = reduce(INITIAL_SHOWCASE_STATE, { type: 'toggleDim' });
    expect(s1.dim).toBe(true);
  });
});

describe('showcase-state — invariants', () => {
  test('reduce is pure — never mutates the input state', () => {
    const s0 = INITIAL_SHOWCASE_STATE;
    const snapshot = JSON.stringify(s0);
    reduce(s0, { type: 'next' });
    reduce(s0, { type: 'nextSection' });
    reduce(s0, { type: 'cycleFont' });
    reduce(s0, { type: 'togglePulse' });
    expect(JSON.stringify(s0)).toBe(snapshot);
  });

  test('ENCODINGS is the full set (quadrant, braille)', () => {
    expect([...ENCODINGS].sort()).toEqual(['braille', 'quadrant']);
  });

  test('SECTIONS has the 5 expected sections in canonical order', () => {
    expect(SECTIONS).toEqual([
      'tiles',
      'fonts',
      'digits',
      'palette',
      'encodings',
    ]);
  });

  test('VALUES starts at 0 (empty) and goes up to 8192 by powers of 2', () => {
    expect(VALUES[0]).toBe(0);
    expect(VALUES[VALUES.length - 1]).toBe(8192);
    for (let i = 2; i < VALUES.length; i++) {
      expect(VALUES[i]).toBe(VALUES[i - 1] * 2);
    }
  });
});
