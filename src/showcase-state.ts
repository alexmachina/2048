import { FONT_NAMES, type FontName } from './fonts';
import { COLOR_SCHEMES, type ColorScheme } from './palette';
import type { Encoding } from './canvas';

export type Section = 'tiles' | 'fonts' | 'digits' | 'palette' | 'encodings';

export const SECTIONS: readonly Section[] = [
  'tiles',
  'fonts',
  'digits',
  'palette',
  'encodings',
];

// 0 is the empty-tile style; rest are the powers of 2 the game can reach.
export const VALUES: readonly number[] = [
  0, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192,
];

export const ENCODINGS: readonly Encoding[] = ['quadrant', 'braille'];

export type ShowcaseState = {
  readonly section: Section;
  readonly valueIdx: number;
  readonly fontIdx: number;
  readonly paletteIdx: number;
  readonly encodingIdx: number;
  readonly pulse: boolean;
  readonly dim: boolean;
};

export const INITIAL_SHOWCASE_STATE: ShowcaseState = {
  section: 'tiles',
  valueIdx: 1, // 2 — first non-empty tile
  fontIdx: 0, // classic
  paletteIdx: 0, // ansi
  encodingIdx: 0, // quadrant
  pulse: false,
  dim: false,
};

export type Action =
  | { type: 'nextSection' }
  | { type: 'prevSection' }
  | { type: 'gotoSection'; section: Section }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'cycleFont' }
  | { type: 'cyclePalette' }
  | { type: 'cycleEncoding' }
  | { type: 'togglePulse' }
  | { type: 'toggleDim' };

export function currentValue(s: ShowcaseState): number {
  return VALUES[s.valueIdx];
}
export function currentFont(s: ShowcaseState): FontName {
  return FONT_NAMES[s.fontIdx];
}
export function currentScheme(s: ShowcaseState): ColorScheme {
  return COLOR_SCHEMES[s.paletteIdx];
}
export function currentEncoding(s: ShowcaseState): Encoding {
  return ENCODINGS[s.encodingIdx];
}

function wrap(i: number, len: number, delta: 1 | -1): number {
  return (i + delta + len) % len;
}

/**
 * Each section has a different "primary" knob advanced by ← / →. This keeps
 * the UX intuitive — on the digits atlas, "next" naturally means "next font",
 * not "next value" which wouldn't change anything visible.
 */
function advance(s: ShowcaseState, delta: 1 | -1): ShowcaseState {
  switch (s.section) {
    case 'digits':
      return { ...s, fontIdx: wrap(s.fontIdx, FONT_NAMES.length, delta) };
    case 'palette':
      return {
        ...s,
        paletteIdx: wrap(s.paletteIdx, COLOR_SCHEMES.length, delta),
      };
    case 'tiles':
    case 'fonts':
    case 'encodings':
    default:
      return { ...s, valueIdx: wrap(s.valueIdx, VALUES.length, delta) };
  }
}

export function reduce(s: ShowcaseState, action: Action): ShowcaseState {
  switch (action.type) {
    case 'nextSection': {
      const i = SECTIONS.indexOf(s.section);
      return { ...s, section: SECTIONS[wrap(i, SECTIONS.length, 1)] };
    }
    case 'prevSection': {
      const i = SECTIONS.indexOf(s.section);
      return { ...s, section: SECTIONS[wrap(i, SECTIONS.length, -1)] };
    }
    case 'gotoSection':
      if (!SECTIONS.includes(action.section)) return s;
      return { ...s, section: action.section };
    case 'next':
      return advance(s, 1);
    case 'prev':
      return advance(s, -1);
    case 'cycleFont':
      return { ...s, fontIdx: wrap(s.fontIdx, FONT_NAMES.length, 1) };
    case 'cyclePalette':
      return { ...s, paletteIdx: wrap(s.paletteIdx, COLOR_SCHEMES.length, 1) };
    case 'cycleEncoding':
      return {
        ...s,
        encodingIdx: wrap(s.encodingIdx, ENCODINGS.length, 1),
      };
    case 'togglePulse':
      return { ...s, pulse: !s.pulse };
    case 'toggleDim':
      return { ...s, dim: !s.dim };
    default:
      return s;
  }
}
