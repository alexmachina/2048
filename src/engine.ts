export const BOARD_SIZE = 4;

export type Direction = 'up' | 'down' | 'left' | 'right';

export type MergeSource = {
  id: number;
  fromRow: number;
  fromCol: number;
  value: number;
};

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  slidFrom?: [row: number, col: number];
  mergedFrom?: [MergeSource, MergeSource];
  isNew?: boolean;
};

export type GameState = {
  tiles: Tile[];
  score: number;
  best: number;
  over: boolean;
  won: boolean;
  nextId: number;
};

export function emptyState(): GameState {
  return {
    tiles: [],
    score: 0,
    best: 0,
    over: false,
    won: false,
    nextId: 1,
  };
}

export function createInitialState(rng: () => number = Math.random): GameState {
  let state = emptyState();
  state = spawnTile(state, rng);
  state = spawnTile(state, rng);
  return state;
}

export function gridFromTiles(tiles: Tile[]): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  );
  for (const t of tiles) {
    if (t.row >= 0 && t.row < BOARD_SIZE && t.col >= 0 && t.col < BOARD_SIZE) {
      grid[t.row][t.col] = t;
    }
  }
  return grid;
}

function emptyCells(tiles: Tile[]): Array<[number, number]> {
  const grid = gridFromTiles(tiles);
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] === null) cells.push([r, c]);
    }
  }
  return cells;
}

export function spawnTile(state: GameState, rng: () => number): GameState {
  const empties = emptyCells(state.tiles);
  if (empties.length === 0) return state;
  const [r, c] = empties[Math.floor(rng() * empties.length)];
  const value = rng() < 0.9 ? 2 : 4;
  const tile: Tile = { id: state.nextId, value, row: r, col: c, isNew: true };
  return {
    ...state,
    tiles: [...state.tiles, tile],
    nextId: state.nextId + 1,
  };
}

function clearAnimMarkers(tiles: Tile[]): Tile[] {
  return tiles.map((t) => ({
    id: t.id,
    value: t.value,
    row: t.row,
    col: t.col,
  }));
}

export function canMove(state: GameState): boolean {
  const grid = gridFromTiles(state.tiles);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = grid[r][c];
      if (cell === null) return true;
      const right = c + 1 < BOARD_SIZE ? grid[r][c + 1] : null;
      const down = r + 1 < BOARD_SIZE ? grid[r + 1][c] : null;
      if (right && right.value === cell.value) return true;
      if (down && down.value === cell.value) return true;
    }
  }
  return false;
}

export function move(
  state: GameState,
  dir: Direction,
  rng: () => number
): GameState {
  const fresh = clearAnimMarkers(state.tiles);
  const isHorizontal = dir === 'left' || dir === 'right';
  const reversed = dir === 'right' || dir === 'down';

  const newTiles: Tile[] = [];
  let scoreGained = 0;
  let anyMoved = false;
  let nextId = state.nextId;

  for (let laneIdx = 0; laneIdx < BOARD_SIZE; laneIdx++) {
    const laneTiles = fresh.filter((t) =>
      isHorizontal ? t.row === laneIdx : t.col === laneIdx
    );
    laneTiles.sort((a, b) => {
      const aPos = isHorizontal ? a.col : a.row;
      const bPos = isHorizontal ? b.col : b.row;
      return reversed ? bPos - aPos : aPos - bPos;
    });

    let cursor = reversed ? BOARD_SIZE - 1 : 0;
    const step = reversed ? -1 : 1;
    let i = 0;

    while (i < laneTiles.length) {
      const cur = laneTiles[i];
      const next = laneTiles[i + 1];

      if (next && next.value === cur.value) {
        const mergedValue = cur.value * 2;
        const destRow = isHorizontal ? laneIdx : cursor;
        const destCol = isHorizontal ? cursor : laneIdx;

        const sourceA: MergeSource = {
          id: cur.id,
          fromRow: cur.row,
          fromCol: cur.col,
          value: cur.value,
        };
        const sourceB: MergeSource = {
          id: next.id,
          fromRow: next.row,
          fromCol: next.col,
          value: next.value,
        };

        newTiles.push({
          id: nextId++,
          value: mergedValue,
          row: destRow,
          col: destCol,
          mergedFrom: [sourceA, sourceB],
        });

        scoreGained += mergedValue;
        anyMoved = true;
        i += 2;
      } else {
        const destRow = isHorizontal ? laneIdx : cursor;
        const destCol = isHorizontal ? cursor : laneIdx;
        const didMove = cur.row !== destRow || cur.col !== destCol;
        if (didMove) anyMoved = true;

        newTiles.push({
          id: cur.id,
          value: cur.value,
          row: destRow,
          col: destCol,
          slidFrom: didMove ? [cur.row, cur.col] : undefined,
        });
        i += 1;
      }
      cursor += step;
    }
  }

  if (!anyMoved) return state;

  const newScore = state.score + scoreGained;
  let afterMove: GameState = {
    ...state,
    tiles: newTiles,
    score: newScore,
    best: Math.max(state.best, newScore),
    nextId,
  };

  afterMove = spawnTile(afterMove, rng);

  const reached2048 = afterMove.tiles.some((t) => t.value >= 2048);
  const stillMovable = canMove(afterMove);

  return {
    ...afterMove,
    won: state.won || reached2048,
    over: !stillMovable,
  };
}
