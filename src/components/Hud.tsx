import React from 'react';
import { Box, Text } from 'ink';
import { usePalette } from '../palette';

type Props = {
  score: number;
  best: number;
  gained?: number;
};

export function Hud({ score, best, gained }: Props) {
  const palette = usePalette();
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      width={42}
      alignSelf="flex-start"
    >
      <Box flexDirection="column">
        <Text bold color={palette.accent}>
          2048
        </Text>
        <Text dimColor>junte os números até 2048</Text>
      </Box>
      <Box flexDirection="row" gap={1}>
        <ScoreCard label="SCORE" value={score} gained={gained} />
        <ScoreCard label="BEST" value={best} accent={palette.accent} />
      </Box>
    </Box>
  );
}

function ScoreCard({
  label,
  value,
  accent,
  gained,
}: {
  label: string;
  value: number;
  accent?: string;
  gained?: number;
}) {
  const palette = usePalette();
  const bg = palette.scoreBg;
  const width = 10;
  const pad = (s: string) => {
    const rem = Math.max(0, width - s.length);
    const left = Math.floor(rem / 2);
    return ' '.repeat(left) + s + ' '.repeat(rem - left);
  };
  return (
    <Box flexDirection="column">
      <Text color={palette.scoreLabelFg} backgroundColor={bg} bold>
        {pad(label)}
      </Text>
      <Text color={accent ?? 'white'} backgroundColor={bg} bold>
        {pad(String(value) + (gained ? ' +' + gained : ''))}
      </Text>
    </Box>
  );
}

export function GameBanner({ won, over }: { won: boolean; over: boolean }) {
  const palette = usePalette();
  if (over) {
    return (
      <Box
        justifyContent="center"
        borderStyle="round"
        borderColor={palette.danger}
        paddingX={2}
      >
        <Text bold color={palette.danger}>
          GAME OVER — pressione r para reiniciar
        </Text>
      </Box>
    );
  }
  if (won) {
    return (
      <Box
        justifyContent="center"
        borderStyle="round"
        borderColor={palette.accent}
        paddingX={2}
      >
        <Text bold color={palette.accent}>
          ★ 2048 ALCANÇADO ★ — continue para bater o recorde
        </Text>
      </Box>
    );
  }
  return null;
}
