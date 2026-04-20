export type TileStyle = {
  backgroundColor: string;
  color: string;
  bold?: boolean;
};

const EMPTY: TileStyle = { backgroundColor: '#3a3a3a', color: '#3a3a3a' };

const PALETTE: Record<number, TileStyle> = {
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

const HIGH_FALLBACK: TileStyle = {
  backgroundColor: '#1d1c17',
  color: '#edc22e',
  bold: true,
};

export function styleForValue(value: number): TileStyle {
  if (value === 0) return EMPTY;
  return PALETTE[value] ?? HIGH_FALLBACK;
}

export const PULSE_BG = '#ffffff';
export const BOARD_BORDER = '#bbada0';
export const BOARD_BG = '#bbada0';
