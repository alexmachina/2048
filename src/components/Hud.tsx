import React from 'react';
import { Box, Text } from 'ink';

type Props = {
  score: number;
  best: number;
  gained?: number;
};

export function Hud({ score, best, gained }: Props) {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      width={42}
      alignSelf="flex-start"
    >
      <Box flexDirection="column">
        <Text bold color="#edc22e">
          2048
        </Text>
        <Text dimColor>junte os números até 2048</Text>
      </Box>
      <Box flexDirection="row" gap={1}>
        <ScoreCard label="SCORE" value={score} gained={gained} />
        <ScoreCard label="BEST" value={best} accent="#edc22e" />
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
  const bg = '#bbada0';
  const width = 10;
  const pad = (s: string) => {
    const rem = Math.max(0, width - s.length);
    const left = Math.floor(rem / 2);
    return ' '.repeat(left) + s + ' '.repeat(rem - left);
  };
  return (
    <Box flexDirection="column">
      <Text color="#eee4da" backgroundColor={bg} bold>
        {pad(label)}
      </Text>
      <Text color={accent ?? 'white'} backgroundColor={bg} bold>
        {pad(String(value) + (gained ? ' +' + gained : ''))}
      </Text>
    </Box>
  );
}

export function GameBanner({ won, over }: { won: boolean; over: boolean }) {
  if (over) {
    return (
      <Box
        justifyContent="center"
        borderStyle="round"
        borderColor="#f65e3b"
        paddingX={2}
      >
        <Text bold color="#f65e3b">
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
        borderColor="#edc22e"
        paddingX={2}
      >
        <Text bold color="#edc22e">
          ★ 2048 ALCANÇADO ★ — continue para bater o recorde
        </Text>
      </Box>
    );
  }
  return null;
}
