import type { Bitmap, Font } from './types';

/**
 * Solari di Udine split-flap — painéis de aeroporto/estação de trem.
 *
 * Glifos slab-serif, corpo cheio, 4×7 sub-pixels. A característica distintiva
 * é a **costura horizontal** que cruza *todos* os tiles no mesmo row do
 * canvas — simula a junção mecânica entre as duas metades que flipam.
 *
 * Os bitmaps do glifo cobrem o caractere inteiro (sem interrupção no meio);
 * a costura é pintada por `decorateTile` depois do `drawLabel`, então ela
 * apaga a linha central do dígito e continua pelas laterais do tile.
 */
const G: Record<string, Bitmap> = {
  '0': [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '1': [
    [0, 1, 1, 0],
    [1, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [1, 1, 1, 1],
  ],
  '2': [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [1, 1, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  '3': [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 0],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '4': [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  '5': [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '6': [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '7': [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ],
  '8': [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '9': [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
};

export const SOLARI_FONT: Font = {
  name: 'solari',
  width: 4,
  height: 7,
  letterSpacing: 1,
  glyph(ch) {
    return G[ch] ?? null;
  },
  /**
   * Costura = 2 sub-pixel rows no meio do tile (rows `mid` e `mid - 1` para
   * alinhar com a fronteira inferior de uma braille-cell row, deixando a
   * linha mais "sólida" quando renderizada).
   */
  decorateTile(canvas) {
    if (canvas.length === 0) return;
    const mid = Math.floor(canvas.length / 2);
    const rows = [mid - 1, mid];
    const w = canvas[0].length;
    for (const r of rows) {
      if (r < 0 || r >= canvas.length) continue;
      for (let c = 0; c < w; c++) canvas[r][c] = 1;
    }
  },
};
