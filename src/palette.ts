import React from 'react';

export type TileStyle = {
  backgroundColor: string;
  color: string;
  bold?: boolean;
};

export type ColorScheme = 'ansi' | 'truecolor';

export type Palette = {
  styleForValue: (value: number) => TileStyle;
  pulseBg: string;
  boardBorder: string;
  boardBg: string;
  accent: string;
  scoreBg: string;
  scoreLabelFg: string;
  danger: string;
};

export const DEFAULT_COLOR_SCHEME: ColorScheme = 'ansi';

export const COLOR_SCHEMES: readonly ColorScheme[] = ['ansi', 'truecolor'];

const TRUECOLOR_EMPTY: TileStyle = {
  backgroundColor: '#3a3a3a',
  color: '#3a3a3a',
};

const TRUECOLOR_TILES: Record<number, TileStyle> = {
  2: { backgroundColor: '#eee4da', color: '#776e65', bold: true },
  4: { backgroundColor: '#ede0c8', color: '#776e65', bold: true },
  8: { backgroundColor: '#f2b179', color: '#f9f6f2', bold: true },
  16: { backgroundColor: '#f59563', color: '#f9f6f2', bold: true },
  32: { backgroundColor: '#f67c5f', color: '#f9f6f2', bold: true },
  64: { backgroundColor: '#f65e3b', color: '#f9f6f2', bold: true },
  128: { backgroundColor: '#edcf72', color: '#f9f6f2', bold: true },
  256: { backgroundColor: '#edcc61', color: '#f9f6f2', bold: true },
  512: { backgroundColor: '#edc850', color: '#f9f6f2', bold: true },
  1024: { backgroundColor: '#edc53f', color: '#f9f6f2', bold: true },
  2048: { backgroundColor: '#edc22e', color: '#f9f6f2', bold: true },
  4096: { backgroundColor: '#3c3a32', color: '#f9f6f2', bold: true },
  8192: { backgroundColor: '#1d1c17', color: '#edc22e', bold: true },
};

const TRUECOLOR_HIGH: TileStyle = {
  backgroundColor: '#1d1c17',
  color: '#edc22e',
  bold: true,
};

const TRUECOLOR_PALETTE: Palette = {
  styleForValue(value) {
    if (value === 0) return TRUECOLOR_EMPTY;
    return TRUECOLOR_TILES[value] ?? TRUECOLOR_HIGH;
  },
  pulseBg: '#ffffff',
  boardBorder: '#bbada0',
  boardBg: '#bbada0',
  accent: '#edc22e',
  scoreBg: '#bbada0',
  scoreLabelFg: '#eee4da',
  danger: '#f65e3b',
};

// ANSI — usa nomes de cor do Ink (black, red, yellow, …, *Bright) para
// respeitar o tema do terminal do usuário em vez de fixar em hex.
const ANSI_EMPTY: TileStyle = { backgroundColor: 'gray', color: 'gray' };

const ANSI_TILES: Record<number, TileStyle> = {
  2: { backgroundColor: 'white', color: 'black', bold: true },
  4: { backgroundColor: 'whiteBright', color: 'black', bold: true },
  8: { backgroundColor: 'yellow', color: 'black', bold: true },
  16: { backgroundColor: 'yellowBright', color: 'black', bold: true },
  32: { backgroundColor: 'magenta', color: 'whiteBright', bold: true },
  64: { backgroundColor: 'red', color: 'whiteBright', bold: true },
  128: { backgroundColor: 'redBright', color: 'whiteBright', bold: true },
  256: { backgroundColor: 'cyan', color: 'black', bold: true },
  512: { backgroundColor: 'cyanBright', color: 'black', bold: true },
  1024: { backgroundColor: 'blue', color: 'whiteBright', bold: true },
  2048: { backgroundColor: 'green', color: 'whiteBright', bold: true },
  4096: { backgroundColor: 'greenBright', color: 'black', bold: true },
  8192: { backgroundColor: 'magentaBright', color: 'black', bold: true },
};

const ANSI_HIGH: TileStyle = {
  backgroundColor: 'black',
  color: 'yellowBright',
  bold: true,
};

const ANSI_PALETTE: Palette = {
  styleForValue(value) {
    if (value === 0) return ANSI_EMPTY;
    return ANSI_TILES[value] ?? ANSI_HIGH;
  },
  pulseBg: 'whiteBright',
  boardBorder: 'gray',
  boardBg: 'gray',
  accent: 'yellowBright',
  scoreBg: 'gray',
  scoreLabelFg: 'whiteBright',
  danger: 'redBright',
};

export function getPalette(scheme: ColorScheme): Palette {
  switch (scheme) {
    case 'truecolor':
      return TRUECOLOR_PALETTE;
    case 'ansi':
    default:
      return ANSI_PALETTE;
  }
}

export function parseColorScheme(value: string): ColorScheme | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'ansi') return 'ansi';
  if (v === 'truecolor') return 'truecolor';
  return null;
}

export const PaletteContext = React.createContext<Palette>(
  getPalette(DEFAULT_COLOR_SCHEME),
);

export function usePalette(): Palette {
  return React.useContext(PaletteContext);
}
