#!/usr/bin/env bun
import React, { useReducer } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { FontContext, getFont, FONT_NAMES, type FontName } from './fonts';
import { PaletteContext, getPalette, usePalette, type ColorScheme } from './palette';
import { labelOnTile, type Encoding } from './canvas';
import { Tile, TILE_WIDTH, TILE_HEIGHT } from './components/Tile';
import {
  INITIAL_SHOWCASE_STATE,
  SECTIONS,
  reduce,
  currentValue,
  currentFont,
  currentScheme,
  type ShowcaseState,
  type Action,
} from './showcase-state';

// ──────────────────────────────────────────────────────────────────
// Section copy — explanations shown alongside each view. The point of
// the showcase is pedagogical: you see the rendering AND why it exists.
// ──────────────────────────────────────────────────────────────────

const SECTION_TITLES: Record<(typeof SECTIONS)[number], string> = {
  tiles: '1 · Tile anatômico',
  fonts: '2 · Galeria de fontes',
  digits: '3 · Atlas de dígitos',
  palette: '4 · Rampa da paleta',
  encodings: '5 · Encoding: quadrant vs braille',
};

const SECTION_BLURBS: Record<(typeof SECTIONS)[number], string[]> = {
  tiles: [
    'O átomo do jogo. Cada tile é uma pilha de <Text> com background, 10×5 células.',
    '← → troca o valor · f cicla fonte · c cicla paleta · . pulse · x dim',
  ],
  fonts: [
    'As 5 tipografias renderizando o mesmo valor, lado a lado.',
    '← → troca o valor mostrado em todas as fontes.',
  ],
  digits: [
    'Todos os glifos (0-9) da fonte atual, cada um em seu próprio tile.',
    '← → cicla a fonte · c cicla a paleta de fundo.',
  ],
  palette: [
    'Rampa completa de cores: tile 2 → 8192. Mostra o degradê escolhido.',
    '← → troca entre os esquemas (ansi / truecolor).',
  ],
  encodings: [
    'Mesma tile renderizada com quadrant (2×2 sub-pixels) e braille (2×4).',
    '← → troca o valor · f cicla fonte — compare a legibilidade.',
  ],
};

// ──────────────────────────────────────────────────────────────────
// Direct renderer that respects a chosen encoding — needed for the
// encoding comparison section. `Tile` hard-codes quadrant (as it should
// for the game), so the showcase re-implements the line-stack here.
// ──────────────────────────────────────────────────────────────────

function EncodedTile({
  value,
  font,
  encoding,
}: {
  value: number;
  font: FontName;
  encoding: Encoding;
}) {
  const palette = usePalette();
  const style = palette.styleForValue(value);
  const label = value === 0 ? '' : String(value);
  const lines = labelOnTile(label, TILE_WIDTH, TILE_HEIGHT, getFont(font), encoding);
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text
          key={i}
          color={style.color}
          backgroundColor={style.backgroundColor}
          bold={style.bold}
        >
          {line}
        </Text>
      ))}
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────
// Each section re-wraps with the context values the user has chosen
// so the rendering reflects the current showcase state.
// ──────────────────────────────────────────────────────────────────

function Framed({
  scheme,
  font,
  children,
}: {
  scheme: ColorScheme;
  font: FontName;
  children: React.ReactNode;
}) {
  return (
    <PaletteContext.Provider value={getPalette(scheme)}>
      <FontContext.Provider value={getFont(font)}>
        {children}
      </FontContext.Provider>
    </PaletteContext.Provider>
  );
}

function TilesSection({ state }: { state: ShowcaseState }) {
  const value = currentValue(state);
  return (
    <Framed scheme={currentScheme(state)} font={currentFont(state)}>
      <Box flexDirection="row" gap={4}>
        <Tile value={value} pulse={state.pulse} dim={state.dim} />
        <Box flexDirection="column" gap={1}>
          <Text>
            <Text color="gray">valor:   </Text>
            <Text bold>{value === 0 ? '(empty)' : value}</Text>
          </Text>
          <Text>
            <Text color="gray">fonte:   </Text>
            <Text bold>{currentFont(state)}</Text>
          </Text>
          <Text>
            <Text color="gray">paleta:  </Text>
            <Text bold>{currentScheme(state)}</Text>
          </Text>
          <Text>
            <Text color="gray">pulse:   </Text>
            <Text bold color={state.pulse ? 'green' : 'gray'}>
              {state.pulse ? 'on' : 'off'}
            </Text>
          </Text>
          <Text>
            <Text color="gray">dim:     </Text>
            <Text bold color={state.dim ? 'green' : 'gray'}>
              {state.dim ? 'on' : 'off'}
            </Text>
          </Text>
        </Box>
      </Box>
    </Framed>
  );
}

function FontsSection({ state }: { state: ShowcaseState }) {
  const value = currentValue(state);
  return (
    <PaletteContext.Provider value={getPalette(currentScheme(state))}>
      <Box flexDirection="row" gap={2}>
        {FONT_NAMES.map((name) => (
          <Box key={name} flexDirection="column" alignItems="center" gap={0}>
            <FontContext.Provider value={getFont(name)}>
              <Tile value={value} />
            </FontContext.Provider>
            <Text color={name === currentFont(state) ? 'yellowBright' : 'gray'}>
              {name === currentFont(state) ? `▸ ${name}` : `  ${name}`}
            </Text>
          </Box>
        ))}
      </Box>
    </PaletteContext.Provider>
  );
}

function DigitsSection({ state }: { state: ShowcaseState }) {
  // 10 tiles (0-9) in two rows of 5 for a compact atlas.
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const rows = [digits.slice(0, 5), digits.slice(5)];
  return (
    <Framed scheme={currentScheme(state)} font={currentFont(state)}>
      <Box flexDirection="column" gap={1}>
        <Text color="gray">
          fonte:{' '}
          <Text bold color="yellowBright">
            {currentFont(state)}
          </Text>
          {'   '}paleta:{' '}
          <Text bold>{currentScheme(state)}</Text>
        </Text>
        {rows.map((row, ri) => (
          <Box key={ri} flexDirection="row" gap={1}>
            {row.map((d) => (
              // Use value = 2^d only for display purposes — but we really
              // want to show the digit character, not a power. Use a fake
              // non-zero value so the tile isn't the empty style, then
              // override the label via value=d * 100 trick? No — simpler:
              // render at value=2 (any non-empty tile style) but pass the
              // digit as the label via a mini component.
              <DigitTile key={d} digit={d} />
            ))}
          </Box>
        ))}
      </Box>
    </Framed>
  );
}

function DigitTile({ digit }: { digit: number }) {
  // A digit atlas tile: uses value=2 styling (a neutral non-empty tile)
  // but overrides the label with the raw digit character so we see the
  // glyph itself regardless of whether the game ever reaches that value.
  const palette = usePalette();
  const style = palette.styleForValue(2);
  const font = React.useContext(FontContext);
  const lines = labelOnTile(String(digit), TILE_WIDTH, TILE_HEIGHT, font);
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text
          key={i}
          color={style.color}
          backgroundColor={style.backgroundColor}
          bold={style.bold}
        >
          {line}
        </Text>
      ))}
    </Box>
  );
}

function PaletteSection({ state }: { state: ShowcaseState }) {
  const ramp = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
  // Two rows of 7/6 to fit in a reasonable terminal width.
  const rows = [ramp.slice(0, 7), ramp.slice(7)];
  return (
    <Framed scheme={currentScheme(state)} font={currentFont(state)}>
      <Box flexDirection="column" gap={1}>
        <Text color="gray">
          esquema:{' '}
          <Text bold color="yellowBright">
            {currentScheme(state)}
          </Text>
          {'   '}fonte: <Text bold>{currentFont(state)}</Text>
        </Text>
        {rows.map((row, ri) => (
          <Box key={ri} flexDirection="row" gap={1}>
            {row.map((v) => (
              <Tile key={v} value={v} />
            ))}
          </Box>
        ))}
      </Box>
    </Framed>
  );
}

function EncodingsSection({ state }: { state: ShowcaseState }) {
  const value = currentValue(state);
  return (
    <PaletteContext.Provider value={getPalette(currentScheme(state))}>
      <Box flexDirection="row" gap={4}>
        <Box flexDirection="column" alignItems="center">
          <EncodedTile value={value} font={currentFont(state)} encoding="quadrant" />
          <Text color="gray">quadrant · 2×2</Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <EncodedTile value={value} font={currentFont(state)} encoding="braille" />
          <Text color="gray">braille · 2×4</Text>
        </Box>
        <Box flexDirection="column" gap={1} paddingLeft={2}>
          <Text>
            <Text color="gray">valor:   </Text>
            <Text bold>{value === 0 ? '(empty)' : value}</Text>
          </Text>
          <Text>
            <Text color="gray">fonte:   </Text>
            <Text bold>{currentFont(state)}</Text>
          </Text>
          <Text color="gray">Default do jogo é quadrant:</Text>
          <Text color="gray">braille perde muita legibilidade</Text>
          <Text color="gray">sobre tiles coloridos.</Text>
        </Box>
      </Box>
    </PaletteContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────────
// Root component: hotkey router + section switch.
// ──────────────────────────────────────────────────────────────────

function keyToAction(input: string, key: { leftArrow?: boolean; rightArrow?: boolean; tab?: boolean; shift?: boolean }): Action | null {
  if (key.leftArrow) return { type: 'prev' };
  if (key.rightArrow) return { type: 'next' };
  if (input === 'n' || (key.tab && !key.shift)) return { type: 'nextSection' };
  if (input === 'p' || (key.tab && key.shift)) return { type: 'prevSection' };
  if (input >= '1' && input <= String(SECTIONS.length)) {
    return { type: 'gotoSection', section: SECTIONS[Number(input) - 1] };
  }
  if (input === 'f') return { type: 'cycleFont' };
  if (input === 'c') return { type: 'cyclePalette' };
  if (input === 'e') return { type: 'cycleEncoding' };
  if (input === '.') return { type: 'togglePulse' };
  if (input === 'x') return { type: 'toggleDim' };
  return null;
}

function App() {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(reduce, INITIAL_SHOWCASE_STATE);

  useInput((input, key) => {
    if (input === 'q' || key.escape || (key.ctrl && input === 'c')) {
      exit();
      return;
    }
    const action = keyToAction(input, key);
    if (action) dispatch(action);
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color="yellowBright" bold>
        2048 — Design System Showcase
      </Text>
      <Text color="gray">
        um storybook interativo dos tiles, fontes, paletas e encodings.
      </Text>
      <Box height={1} />

      <SectionTabs current={state.section} />
      <Box height={1} />
      <Text bold>{SECTION_TITLES[state.section]}</Text>
      {SECTION_BLURBS[state.section].map((line, i) => (
        <Text key={i} color="gray">
          {line}
        </Text>
      ))}
      <Box height={1} />

      {state.section === 'tiles' && <TilesSection state={state} />}
      {state.section === 'fonts' && <FontsSection state={state} />}
      {state.section === 'digits' && <DigitsSection state={state} />}
      {state.section === 'palette' && <PaletteSection state={state} />}
      {state.section === 'encodings' && <EncodingsSection state={state} />}

      <Box height={1} />
      <Footer />
    </Box>
  );
}

function SectionTabs({ current }: { current: (typeof SECTIONS)[number] }) {
  return (
    <Box flexDirection="row" gap={1}>
      {SECTIONS.map((s, i) => {
        const active = s === current;
        return (
          <Text key={s} color={active ? 'black' : 'gray'} backgroundColor={active ? 'yellowBright' : undefined} bold={active}>
            {` ${i + 1} ${s} `}
          </Text>
        );
      })}
    </Box>
  );
}

function Footer() {
  return (
    <Box flexDirection="column">
      <Text color="gray">
        <Text bold color="white">1-5</Text> ir para seção ·{' '}
        <Text bold color="white">n/p</Text> próxima/anterior ·{' '}
        <Text bold color="white">← →</Text> mudar valor/fonte/paleta
      </Text>
      <Text color="gray">
        <Text bold color="white">f</Text> fonte ·{' '}
        <Text bold color="white">c</Text> paleta ·{' '}
        <Text bold color="white">e</Text> encoding ·{' '}
        <Text bold color="white">.</Text> pulse ·{' '}
        <Text bold color="white">x</Text> dim ·{' '}
        <Text bold color="white">q</Text> sai
      </Text>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────

render(<App />);
