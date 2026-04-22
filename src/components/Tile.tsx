import React from 'react';
import { Box, Text } from 'ink';
import { usePalette } from '../palette';
import { useFont } from '../fonts';
import { labelOnTile } from '../canvas';

// Tamanho total do tile. Canvas sub-pixel = TILE_WIDTH*2 × TILE_HEIGHT*2
// (quadrant). As 4 células de canto + 4 células adjacentes são
// sobrescritas com chars parciais pra criar rounding de 2 células. O
// dígito precisa caber deixando as 4 primeiras/últimas células (em cada
// eixo) livres nas linhas de canto — o que funciona com y-offset ≥ 2 e
// x-offset ≥ 2:
// - Label "8192" = 19 sub-cols: em 24 sub-cols, x-offset = 2 ✓
// - Digit 4×7: em 12 sub-rows, y-offset = 2 → digit em sub-rows 2-8 ✓
//   (cell row 0 e cell row 5 ficam livres)
export const TILE_WIDTH = 12;
export const TILE_HEIGHT = 6;

// Rounding de 2 células por canto usando quadrant blocks parciais.
// Cada linha de canto vira: corner-small + corner-half + <fill> + corner-half + corner-small.
// Resultado visual: taper gradual em 2 sub-rows — sub-row mais externa com
// 16 sub-cols preenchidos (de 24), sub-row interna com 22 sub-cols.
// Diferente do chanfro de 1 sub-pixel (quase invisível) e do arco `╭─╮`
// decorativo (bg extrapolava a curva).
//
//   ▗ = U+2597  lower-right quadrant      → top-left corner (1/4 filled)
//   ▖ = U+2596  lower-left quadrant       → top-right corner (mirror)
//   ▝ = U+259D  upper-right quadrant      → bottom-left corner
//   ▘ = U+2598  upper-left quadrant       → bottom-right corner
//   ▄ = U+2584  lower half block          → top edge taper (1/2 filled)
//   ▀ = U+2580  upper half block          → bottom edge taper (mirror)
const TOP_LEFT_CORNER = '\u2597'; // ▗
const TOP_LEFT_EDGE = '\u2584'; // ▄
const TOP_RIGHT_EDGE = '\u2584'; // ▄
const TOP_RIGHT_CORNER = '\u2596'; // ▖
const BOTTOM_LEFT_CORNER = '\u259D'; // ▝
const BOTTOM_LEFT_EDGE = '\u2580'; // ▀
const BOTTOM_RIGHT_EDGE = '\u2580'; // ▀
const BOTTOM_RIGHT_CORNER = '\u2598'; // ▘

type Props = {
  value: number;
  pulse?: boolean;
  dim?: boolean;
};

/**
 * Tile do tabuleiro. Silhueta = retângulo com cantos arredondados em duas
 * "camadas" — sub-row mais externo (topo do topo) tem cantos 1/4 filled +
 * lateral 1/2 filled, sub-row interior (logo abaixo) tem cantos 1/2 filled +
 * lateral full. Cria um taper visível que simula uma curva.
 *
 * Fill do bg para no limite da silhueta (nunca extrapola o desenho):
 * - Células de canto usam `color={bg}` SEM `backgroundColor` — apenas as
 *   sub-cells preenchidas do glyph mostram tile-bg; o resto mostra parent.
 * - Células internas usam `backgroundColor={bg}` — cell inteiro é tile-bg.
 *
 * Com TILE_WIDTH=12, as linhas de canto dividem-se em 5 segments:
 *   [▗][▄][ dígito-row do labelOnTile com bg fill, len 8 ][▄][▖]
 */
function TileImpl({ value, pulse, dim }: Props) {
  const palette = usePalette();
  const font = useFont();
  const style = palette.styleForValue(value);
  const label = value === 0 ? '' : String(value);
  const bg = pulse ? palette.pulseBg : style.backgroundColor;
  const fg = pulse ? style.backgroundColor : style.color;

  const lines = labelOnTile(label, TILE_WIDTH, TILE_HEIGHT, font);
  const lastIdx = lines.length - 1;

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        const isTop = i === 0;
        const isBot = i === lastIdx;
        const isCorner = isTop || isBot;

        // Linha interior: fill sólido full-width.
        if (!isCorner) {
          return (
            <Text
              key={i}
              color={fg}
              backgroundColor={bg}
              dimColor={dim}
              bold={style.bold}
            >
              {line}
            </Text>
          );
        }

        const L1 = isTop ? TOP_LEFT_CORNER : BOTTOM_LEFT_CORNER;
        const L2 = isTop ? TOP_LEFT_EDGE : BOTTOM_LEFT_EDGE;
        const R2 = isTop ? TOP_RIGHT_EDGE : BOTTOM_RIGHT_EDGE;
        const R1 = isTop ? TOP_RIGHT_CORNER : BOTTOM_RIGHT_CORNER;
        const middle = line.slice(2, -2); // cells 2..9 (len 8)

        return (
          <Text key={i}>
            <Text color={bg} dimColor={dim}>
              {L1}
              {L2}
            </Text>
            <Text
              color={fg}
              backgroundColor={bg}
              dimColor={dim}
              bold={style.bold}
            >
              {middle}
            </Text>
            <Text color={bg} dimColor={dim}>
              {R2}
              {R1}
            </Text>
          </Text>
        );
      })}
    </Box>
  );
}

// Memoização: tiles estacionários não reconciliam durante sliding. Com 16
// tiles × 6 linhas cada, cada frame economiza muitos <Text> nodes quando
// poucos tiles se movem de fato.
export const Tile = React.memo(TileImpl, (a, b) => {
  return a.value === b.value && a.pulse === b.pulse && a.dim === b.dim;
});
