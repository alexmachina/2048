/**
 * Bitmap font primitives.
 *
 * Cada font expõe glifos como matrizes 0/1 (row-major). O canvas empurra os
 * pixels ligados para um buffer de sub-pixels, que vira quadrant/braille
 * depois. Ver `docs/sub-cell-rendering.md`.
 */

export type Bitmap = readonly (readonly number[])[];

export type FontName =
  | 'classic'
  | '7seg'
  | 'dotmatrix'
  | 'solari'
  | 'nixie';

export type Font = {
  /** Identificador canônico (para CLI + debug). */
  name: FontName;
  /** Largura do glifo em sub-pixels. Todos os dígitos devem ter exatamente essa largura. */
  width: number;
  /** Altura do glifo em sub-pixels. Todos os dígitos devem ter exatamente essa altura. */
  height: number;
  /** Espaçamento horizontal entre glifos adjacentes, em sub-pixels. */
  letterSpacing: number;
  /** Retorna o bitmap do caractere ou null se desconhecido. */
  glyph(ch: string): Bitmap | null;
  /**
   * Decoração opcional aplicada ao canvas do tile DEPOIS de `drawLabel`.
   * Split-flap (Solari) usa para pintar a costura horizontal que cruza todos
   * os dígitos. Fonts sem ornamento podem omitir.
   */
  decorateTile?(canvas: number[][]): void;
};
