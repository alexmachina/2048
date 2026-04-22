import { describe, it, expect } from 'bun:test';
import {
  BOARD_SIZE,
  createInitialState,
  type GameState,
  type Tile,
} from './engine';
import { initHistory, pushMove, undo, canUndo, type History } from './undo';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Constrói um GameState de um grid simples 4×4 (0 = vazio) — sem animação
// markers. Útil pra ancorar expectativas em estados visíveis.
function stateFromGrid(grid: number[][]): GameState {
  const tiles: Tile[] = [];
  let id = 1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = grid[r][c];
      if (v) tiles.push({ id: id++, value: v, row: r, col: c });
    }
  }
  return { tiles, score: 0, best: 0, over: false, won: false, nextId: id };
}

describe('undo — estado inicial', () => {
  it('começa sem histórico — canUndo é false', () => {
    const h = initHistory();
    expect(canUndo(h)).toBe(false);
  });
});

describe('undo — pushMove registra o estado anterior', () => {
  it('depois de um move, canUndo vira true', () => {
    const s0 = stateFromGrid([
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const s1 = stateFromGrid([
      [0, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const h = pushMove(initHistory(), s0, s1);
    expect(canUndo(h)).toBe(true);
  });
});

describe('undo — aplica volta ao estado anterior', () => {
  it('undo restaura o pre-state e limpa o histórico', () => {
    const before = stateFromGrid([
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = stateFromGrid([
      [0, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const h = pushMove(initHistory(), before, after);

    const result = undo(h, after);
    expect(result).not.toBeNull();
    expect(result!.state).toBe(before); // mesma referência — restauração literal
    expect(canUndo(result!.history)).toBe(false); // consumido
  });

  it('undo em histórico vazio retorna null (no-op)', () => {
    const anyState = createInitialState(seededRng(1));
    const result = undo(initHistory(), anyState);
    expect(result).toBeNull();
  });
});

describe('undo — profundidade 1 apenas (regra do usuário)', () => {
  it('undo duas vezes seguidas: primeira ok, segunda falha', () => {
    const s0 = stateFromGrid([[2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const s1 = stateFromGrid([[0, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    let h = pushMove(initHistory(), s0, s1);

    const r1 = undo(h, s1);
    expect(r1).not.toBeNull();
    h = r1!.history;

    const r2 = undo(h, r1!.state);
    expect(r2).toBeNull(); // não pode desfazer duas vezes seguidas
  });

  it('pushMove sobrescreve o anterior (mantém só 1 nível)', () => {
    const a = stateFromGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const b = stateFromGrid([[0, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const c = stateFromGrid([[0, 0, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);

    // A → B → C  (dois moves consecutivos)
    let h: History = initHistory();
    h = pushMove(h, a, b); // histórico: pode voltar pra A
    h = pushMove(h, b, c); // histórico: agora só pode voltar pra B (A descartado)

    const r = undo(h, c);
    expect(r!.state).toBe(b); // voltou 1 passo, não 2
  });
});

describe('undo — cenário realista após sequência de jogadas', () => {
  it('depois de move, undo, move: histórico tem o novo pre-state', () => {
    const a = stateFromGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const b = stateFromGrid([[0, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const c = stateFromGrid([[0, 0, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);

    let h = pushMove(initHistory(), a, b);
    const undone = undo(h, b); // volta pra A, histórico vazio
    h = undone!.history;
    expect(canUndo(h)).toBe(false);

    // novo move A → C
    h = pushMove(h, undone!.state, c);
    expect(canUndo(h)).toBe(true);

    const r = undo(h, c);
    expect(r!.state).toBe(a); // undo volta pra A (o pre-state do último move)
  });
});
