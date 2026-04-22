import React from 'react';
import { Box } from 'ink';
import { BOARD_SIZE } from '../engine';
import { Tile } from './Tile';
import { usePalette } from '../palette';
import type { DisplayTile } from '../animations';

type Props = {
  displayTiles: DisplayTile[];
};

export function Board({ displayTiles }: Props) {
  const palette = usePalette();
  const cells: (DisplayTile | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  );

  for (const t of displayTiles) {
    if (t.row < 0 || t.row >= BOARD_SIZE) continue;
    if (t.col < 0 || t.col >= BOARD_SIZE) continue;
    const existing = cells[t.row][t.col];
    if (!existing) {
      cells[t.row][t.col] = t;
    } else if (!existing.pulse && t.pulse) {
      cells[t.row][t.col] = t;
    }
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={palette.boardBorder}
      paddingX={1}
      paddingY={0}
      alignSelf="flex-start"
    >
      {Array.from({ length: BOARD_SIZE }).map((_, r) => (
        <Box key={`r${r}`} flexDirection="row" marginTop={r === 0 ? 0 : 1}>
          {Array.from({ length: BOARD_SIZE }).map((_, c) => {
            const cell = cells[r][c];
            // Gap 1 cell em ambos os eixos. Mesmo com aspect ratio do
            // terminal (~1:2), 1 row vertical é pouco (não dobra nem triplica
            // o visual) e 1 col horizontal evita `╯╭` colado — o breathing
            // room necessário pra tiles se lerem como elementos distintos.
            return (
              <Box key={`c${c}`} marginLeft={c === 0 ? 0 : 1}>
                <Tile
                  value={cell?.value ?? 0}
                  pulse={cell?.pulse}
                  dim={cell?.dim}
                />
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
