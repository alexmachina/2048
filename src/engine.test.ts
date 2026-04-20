import { describe, it, expect } from 'bun:test';
import {
  BOARD_SIZE,
  createInitialState,
  move,
  gridFromTiles,
  canMove,
  type GameState,
  type Tile,
} from './engine';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function stateFromGrid(grid: (number | 0)[][]): GameState {
  const tiles: Tile[] = [];
  let id = 1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = grid[r][c];
      if (v) tiles.push({ id: id++, value: v, row: r, col: c });
    }
  }
  return {
    tiles,
    score: 0,
    best: 0,
    over: false,
    won: false,
    nextId: id,
  };
}

function valuesGrid(state: GameState): number[][] {
  const g: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );
  for (const t of state.tiles) g[t.row][t.col] = t.value;
  return g;
}

describe('engine — initial state', () => {
  it('starts with exactly 2 tiles of value 2 or 4', () => {
    const state = createInitialState(seededRng(1));
    expect(state.tiles.length).toBe(2);
    for (const t of state.tiles) {
      expect([2, 4]).toContain(t.value);
    }
  });

  it('assigns unique ids', () => {
    const state = createInitialState(seededRng(42));
    const ids = new Set(state.tiles.map((t) => t.id));
    expect(ids.size).toBe(state.tiles.length);
  });
});

describe('engine — slide left', () => {
  it('slides tiles to the left edge with no gaps', () => {
    const state = stateFromGrid([
      [0, 2, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // rng returns 0 → always the first empty cell, value 2
    const rng = () => 0;
    const after = move(state, 'left', rng);
    // Row 0 should have 2,4 at positions 0,1 + a newly spawned tile somewhere
    expect(after.tiles.find((t) => t.row === 0 && t.col === 0)?.value).toBe(2);
    expect(after.tiles.find((t) => t.row === 0 && t.col === 1)?.value).toBe(4);
  });

  it('merges adjacent equal tiles into one with doubled value', () => {
    const state = stateFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    const merged = after.tiles.find((t) => t.row === 0 && t.col === 0);
    expect(merged?.value).toBe(4);
    expect(merged?.mergedFrom).toBeDefined();
    expect(merged?.mergedFrom?.length).toBe(2);
  });

  it('merges only once per move (e.g. 2 2 2 2 → 4 4, not 8)', () => {
    const state = stateFromGrid([
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    const r0 = [0, 1, 2, 3].map(
      (c) => after.tiles.find((t) => t.row === 0 && t.col === c)?.value ?? 0
    );
    expect(r0[0]).toBe(4);
    expect(r0[1]).toBe(4);
  });

  it('awards score equal to the merged value', () => {
    const state = stateFromGrid([
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    expect(after.score).toBe(4 + 8);
  });

  it('records slidFrom metadata on moved tiles', () => {
    const state = stateFromGrid([
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    const t = after.tiles.find((t) => t.row === 0 && t.col === 0 && t.value === 2);
    expect(t?.slidFrom).toEqual([0, 3]);
  });
});

describe('engine — slide right / up / down', () => {
  it('slides right merging to the right edge', () => {
    const state = stateFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'right', () => 0);
    expect(after.tiles.find((t) => t.row === 0 && t.col === 3)?.value).toBe(4);
  });

  it('slides up merging columns', () => {
    const state = stateFromGrid([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'up', () => 0);
    expect(after.tiles.find((t) => t.row === 0 && t.col === 0)?.value).toBe(4);
  });

  it('slides down merging columns', () => {
    const state = stateFromGrid([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'down', () => 0);
    expect(after.tiles.find((t) => t.row === 3 && t.col === 0)?.value).toBe(4);
  });
});

describe('engine — spawn behaviour', () => {
  it('spawns a new tile after a valid move', () => {
    const state = stateFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    // original 2 tiles merged → 1. Plus 1 spawn = 2 tiles total.
    expect(after.tiles.length).toBe(2);
    const spawned = after.tiles.find((t) => t.isNew);
    expect(spawned).toBeDefined();
    expect([2, 4]).toContain(spawned!.value);
  });

  it('does NOT spawn when the move changes nothing (illegal)', () => {
    const state = stateFromGrid([
      [2, 4, 2, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    expect(after).toBe(state);
  });
});

describe('engine — end conditions', () => {
  it('reports game over when no moves are possible', () => {
    const state = stateFromGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(canMove(state)).toBe(false);
  });

  it('reports moves available when merges exist', () => {
    const state = stateFromGrid([
      [2, 2, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(canMove(state)).toBe(true);
  });

  it('marks won when reaching 2048', () => {
    const state = stateFromGrid([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const after = move(state, 'left', () => 0);
    expect(after.won).toBe(true);
  });
});

describe('engine — gridFromTiles', () => {
  it('maps tiles to a 4x4 grid', () => {
    const state = stateFromGrid([
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const grid = gridFromTiles(state.tiles);
    expect(grid[0][0]?.value).toBe(2);
    expect(grid[1][1]?.value).toBe(4);
    expect(grid[2][2]).toBeNull();
  });
});

describe('engine — values grid sanity', () => {
  it('round-trips a simple grid through move(no-op direction)', () => {
    // An impossible move leaves the state unchanged.
    const state = stateFromGrid([
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]);
    // No moves possible
    const after = move(state, 'left', () => 0);
    expect(valuesGrid(after)).toEqual(valuesGrid(state));
  });
});
