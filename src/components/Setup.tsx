import React from 'react';
import { Box, Text } from 'ink';
import { FONT_NAMES, type FontName } from '../fonts';

type Props = {
  current: FontName;
  selectedIdx: number;
};

// Legenda visível de cada fonte — ajuda o jogador a escolher pelo estilo
// sem precisar decorar os nomes internos.
const FONT_LABEL: Record<FontName, string> = {
  classic: 'Classic      (3×5, default)',
  '7seg': '7-Segment    (LED calculator)',
  dotmatrix: 'Dot Matrix   (estádio / VCR)',
  solari: 'Solari       (split-flap)',
  nixie: 'Nixie Tube   (glow manuscrito)',
};

/**
 * Modal in-game pra trocar a fonte dos números. Stateless — o estado (qual
 * fonte, qual seleção) vive no App; este componente só pinta.
 *
 * Visual inspirado em menus de ROM: lista monospace, cursor `▸` na seleção.
 * Mostra qual fonte está ATIVA (✓) e qual está só em foco de navegação (▸).
 */
export function Setup({ current, selectedIdx }: Props) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Setup · Fonte dos números</Text>
      </Box>
      {FONT_NAMES.map((name, i) => {
        const isSelected = i === selectedIdx;
        const isActive = name === current;
        const cursor = isSelected ? '▸' : ' ';
        const mark = isActive ? '✓' : ' ';
        const color = isSelected ? 'cyan' : isActive ? 'green' : undefined;
        return (
          <Text key={name} color={color} bold={isSelected}>
            {cursor} {mark} {FONT_LABEL[name]}
          </Text>
        );
      })}
      <Box marginTop={1}>
        <Text color="gray">
          ↑↓ escolher · <Text color="white" bold>Enter</Text> aplica ·{' '}
          <Text color="white" bold>Esc</Text> cancela
        </Text>
      </Box>
    </Box>
  );
}
