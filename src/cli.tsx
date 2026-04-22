#!/usr/bin/env bun
import React, { useEffect, useRef, useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import {
  createInitialState,
  move,
  type GameState,
  type Direction,
} from './engine';
import {
  frameDurationMs,
  idleAnim,
  nextPhase,
  planMove,
  renderFrame,
  type MoveAnimation,
} from './animations';
import { Board } from './components/Board';
import { Hud, GameBanner } from './components/Hud';
import { PaletteContext, getPalette } from './palette';
import { FontContext, getFont } from './fonts';
import { parseCliArgs, USAGE } from './args';
import { enableSyncOutput } from './sync-output';
import {
  canUndo,
  initHistory,
  pushMove,
  undo as applyUndo,
  type History,
} from './undo';

function App() {
  const { exit } = useApp();
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [anim, setAnim] = useState<MoveAnimation>(() => idleAnim(state));
  const [lastGained, setLastGained] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<History>(() => initHistory());
  const animRef = useRef(anim);
  animRef.current = anim;

  useInput((input, key) => {
    if (input === 'q' || key.escape || (key.ctrl && input === 'c')) {
      exit();
      return;
    }
    if (input === 'r') {
      const fresh = createInitialState();
      setState(fresh);
      setAnim(idleAnim(fresh));
      setLastGained(undefined);
      setHistory(initHistory());
      return;
    }
    if (input === 'u') {
      // Undo — só durante idle, e só se tiver histórico.
      if (animRef.current.phase !== 'idle') return;
      const result = applyUndo(history, state);
      if (result === null) return;
      setState(result.state);
      setAnim(idleAnim(result.state));
      setHistory(result.history);
      setLastGained(undefined);
      return;
    }

    if (animRef.current.phase !== 'idle') return;
    if (state.over) return;

    let dir: Direction | null = null;
    if (key.leftArrow || input === 'a' || input === 'h') dir = 'left';
    else if (key.rightArrow || input === 'd' || input === 'l') dir = 'right';
    else if (key.upArrow || input === 'w' || input === 'k') dir = 'up';
    else if (key.downArrow || input === 's' || input === 'j') dir = 'down';
    if (!dir) return;

    const next = move(state, dir, Math.random);
    if (next === state) return; // move sem efeito — não registra no histórico

    const gained = next.score - state.score;
    setLastGained(gained > 0 ? gained : undefined);
    setHistory((h) => pushMove(h, state, next));
    setState(next);
    setAnim(planMove(next));
  });

  useEffect(() => {
    if (anim.phase === 'idle') return;
    const ms = frameDurationMs(anim);
    const timeout = setTimeout(() => {
      const n = nextPhase(anim);
      if (n === null) {
        setAnim(idleAnim(state));
      } else {
        setAnim(n);
      }
    }, ms);
    return () => clearTimeout(timeout);
  }, [anim, state]);

  useEffect(() => {
    if (anim.phase !== 'idle' || lastGained === undefined) return;
    const t = setTimeout(() => setLastGained(undefined), 600);
    return () => clearTimeout(t);
  }, [anim.phase, lastGained]);

  const displayTiles = renderFrame(anim);
  const undoAvailable = canUndo(history);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Hud score={state.score} best={state.best} gained={lastGained} />
      <Box height={1} />
      <Board displayTiles={displayTiles} />
      <Box height={1} />
      <GameBanner won={state.won} over={state.over} />
      <Box height={state.won || state.over ? 1 : 0} />
      <Text color="gray">
        ↑ ↓ ← → ou <Text color="white" bold>w a s d</Text> move ·{' '}
        <Text color={undoAvailable ? 'white' : 'gray'} bold={undoAvailable}>
          u
        </Text>{' '}
        desfaz · <Text color="white" bold>r</Text> reinicia ·{' '}
        <Text color="white" bold>q</Text> sai
      </Text>
    </Box>
  );
}

const parsed = parseCliArgs(process.argv.slice(2));
if (parsed.kind === 'help') {
  process.stdout.write(USAGE);
  process.exit(0);
}
if (parsed.kind === 'error') {
  process.stderr.write(`${parsed.message}\n\n${USAGE}`);
  process.exit(2);
}

// Antes do render: ativa synchronized output mode (DECSET 2026) pra eliminar
// flicker em terminais GPU-accelerated tipo Alacritty. No-op em Terminal.app.
enableSyncOutput();

render(
  <PaletteContext.Provider value={getPalette(parsed.scheme)}>
    <FontContext.Provider value={getFont(parsed.font)}>
      <App />
    </FontContext.Provider>
  </PaletteContext.Provider>,
);
