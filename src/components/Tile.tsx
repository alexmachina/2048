import React from 'react';
import { Box, Text } from 'ink';
import { usePalette } from '../palette';
import { labelOnTile } from '../canvas';

export const TILE_WIDTH = 10;
export const TILE_HEIGHT = 5;

type Props = {
  value: number;
  pulse?: boolean;
  dim?: boolean;
};

export function Tile({ value, pulse, dim }: Props) {
  const palette = usePalette();
  const style = palette.styleForValue(value);
  const label = value === 0 ? '' : String(value);
  const bg = pulse ? palette.pulseBg : style.backgroundColor;
  const fg = pulse ? style.backgroundColor : style.color;

  const lines = labelOnTile(label, TILE_WIDTH, TILE_HEIGHT);

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text key={i} color={fg} backgroundColor={bg} dimColor={dim}>
          {line}
        </Text>
      ))}
    </Box>
  );
}
