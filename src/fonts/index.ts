import React from 'react';
import { CLASSIC_FONT } from './classic';
import { SEVEN_SEGMENT_FONT } from './seven-segment';
import { DOT_MATRIX_FONT } from './dot-matrix';
import { SOLARI_FONT } from './solari';
import { NIXIE_FONT } from './nixie';
import type { Font, FontName } from './types';

export type { Bitmap, Font, FontName } from './types';

export const FONTS: Record<FontName, Font> = {
  classic: CLASSIC_FONT,
  '7seg': SEVEN_SEGMENT_FONT,
  dotmatrix: DOT_MATRIX_FONT,
  solari: SOLARI_FONT,
  nixie: NIXIE_FONT,
};

export const FONT_NAMES: readonly FontName[] = [
  'classic',
  '7seg',
  'dotmatrix',
  'solari',
  'nixie',
];

export const DEFAULT_FONT: FontName = 'classic';

export function getFont(name: FontName): Font {
  return FONTS[name];
}

export function parseFontName(value: string): FontName | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  // aceita aliases comuns
  if (v === 'classic' || v === 'original' || v === 'default') {
    return 'classic';
  }
  if (v === '7seg' || v === '7-seg' || v === '7-segment' || v === 'seven-segment') {
    return '7seg';
  }
  if (v === 'dotmatrix' || v === 'dot-matrix' || v === 'matrix') {
    return 'dotmatrix';
  }
  if (v === 'solari' || v === 'split-flap' || v === 'splitflap') {
    return 'solari';
  }
  if (v === 'nixie' || v === 'tube') {
    return 'nixie';
  }
  return null;
}

export const FontContext = React.createContext<Font>(getFont(DEFAULT_FONT));

export function useFont(): Font {
  return React.useContext(FontContext);
}
