import React from 'react';
import { Box, Text } from 'ink';
import { styleForValue, PULSE_BG } from '../palette';

export const TILE_WIDTH = 8;
export const TILE_HEIGHT = 3;

type Props = {
  value: number;
  pulse?: boolean;
  dim?: boolean;
};

function pad(label: string, width: number): string {
  const rem = Math.max(0, width - label.length);
  const left = Math.floor(rem / 2);
  const right = rem - left;
  return ' '.repeat(left) + label + ' '.repeat(right);
}

export function Tile({ value, pulse, dim }: Props) {
  const style = styleForValue(value);
  const label = value === 0 ? '' : String(value);
  const bg = pulse ? PULSE_BG : style.backgroundColor;
  const fg = pulse ? style.backgroundColor : style.color;
  const blank = ' '.repeat(TILE_WIDTH);
  const labelLine = pad(label, TILE_WIDTH);

  return (
    <Box flexDirection="column">
      <Text color={fg} backgroundColor={bg}>
        {blank}
      </Text>
      <Text
        color={fg}
        backgroundColor={bg}
        bold={!!style.bold || !!pulse}
        dimColor={dim}
      >
        {labelLine}
      </Text>
      <Text color={fg} backgroundColor={bg}>
        {blank}
      </Text>
    </Box>
  );
}
