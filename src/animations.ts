import type { GameState } from './engine';

export type AnimPhase = 'idle' | 'sliding' | 'merging' | 'spawning';

export const PHASE_MS: Record<Exclude<AnimPhase, 'idle'>, number> = {
  sliding: 45,
  merging: 90,
  spawning: 65,
};

export const MERGE_FRAMES = 2;
export const SPAWN_FRAMES = 2;

export type DisplayTile = {
  key: string;
  value: number;
  row: number;
  col: number;
  pulse?: boolean;
  dim?: boolean;
};

export type MoveAnimation = {
  phase: AnimPhase;
  frame: number;
  totalSlideFrames: number;
  postState: GameState;
};

type SlideAnim = {
  id: number;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  distance: number;
};

function computeSlides(state: GameState): SlideAnim[] {
  const out: SlideAnim[] = [];
  for (const t of state.tiles) {
    if (t.isNew) continue;
    if (t.mergedFrom) {
      for (const src of t.mergedFrom) {
        const dist =
          Math.abs(t.row - src.fromRow) + Math.abs(t.col - src.fromCol);
        out.push({
          id: src.id,
          value: src.value,
          fromRow: src.fromRow,
          fromCol: src.fromCol,
          toRow: t.row,
          toCol: t.col,
          distance: dist,
        });
      }
    } else if (t.slidFrom) {
      const [fr, fc] = t.slidFrom;
      const dist = Math.abs(t.row - fr) + Math.abs(t.col - fc);
      out.push({
        id: t.id,
        value: t.value,
        fromRow: fr,
        fromCol: fc,
        toRow: t.row,
        toCol: t.col,
        distance: dist,
      });
    } else {
      out.push({
        id: t.id,
        value: t.value,
        fromRow: t.row,
        fromCol: t.col,
        toRow: t.row,
        toCol: t.col,
        distance: 0,
      });
    }
  }
  return out;
}

export function planMove(postState: GameState): MoveAnimation {
  const slides = computeSlides(postState);
  const maxDist = Math.max(0, ...slides.map((s) => s.distance));
  return {
    phase: 'sliding',
    frame: 0,
    totalSlideFrames: Math.max(1, maxDist),
    postState,
  };
}

export function idleAnim(state: GameState): MoveAnimation {
  return { phase: 'idle', frame: 0, totalSlideFrames: 0, postState: state };
}

/**
 * Constant-speed interpolation: each tile advances exactly 1 cell per frame
 * in the direction of travel until it reaches its destination, then waits.
 * This keeps tiles from colliding mid-slide even when they travel different
 * distances toward the same target.
 */
export function renderFrame(anim: MoveAnimation): DisplayTile[] {
  const out: DisplayTile[] = [];
  const { phase, frame, postState } = anim;

  if (phase === 'idle') {
    for (const t of postState.tiles) {
      out.push({
        key: `tile-${t.id}`,
        value: t.value,
        row: t.row,
        col: t.col,
      });
    }
    return out;
  }

  if (phase === 'sliding') {
    const slides = computeSlides(postState);
    const stepsDone = frame + 1;
    for (const s of slides) {
      const advance = Math.min(stepsDone, s.distance);
      const dR = Math.sign(s.toRow - s.fromRow);
      const dC = Math.sign(s.toCol - s.fromCol);
      const row = s.fromRow + dR * advance;
      const col = s.fromCol + dC * advance;
      out.push({
        key: `slide-${s.id}`,
        value: s.value,
        row,
        col,
      });
    }
    return out;
  }

  if (phase === 'merging') {
    for (const t of postState.tiles) {
      if (t.isNew) continue;
      out.push({
        key: `tile-${t.id}`,
        value: t.value,
        row: t.row,
        col: t.col,
        pulse: !!t.mergedFrom && frame === 0,
      });
    }
    return out;
  }

  if (phase === 'spawning') {
    for (const t of postState.tiles) {
      out.push({
        key: `tile-${t.id}`,
        value: t.value,
        row: t.row,
        col: t.col,
        dim: !!t.isNew && frame === 0,
      });
    }
    return out;
  }

  return out;
}

export function nextPhase(anim: MoveAnimation): MoveAnimation | null {
  const { phase, frame, totalSlideFrames, postState } = anim;
  if (phase === 'idle') return null;

  const totalFrames =
    phase === 'sliding'
      ? totalSlideFrames
      : phase === 'merging'
        ? MERGE_FRAMES
        : phase === 'spawning'
          ? SPAWN_FRAMES
          : 0;

  if (frame < totalFrames - 1) {
    return { ...anim, frame: frame + 1 };
  }

  const order: AnimPhase[] = ['sliding', 'merging', 'spawning'];
  const idx = order.indexOf(phase);
  for (let i = idx + 1; i < order.length; i++) {
    const next = order[i];
    if (
      (next === 'merging' && postState.tiles.some((t) => t.mergedFrom)) ||
      (next === 'spawning' && postState.tiles.some((t) => t.isNew))
    ) {
      return { phase: next, frame: 0, totalSlideFrames, postState };
    }
  }
  return null;
}

export function frameDurationMs(anim: MoveAnimation): number {
  if (anim.phase === 'idle') return 0;
  return PHASE_MS[anim.phase];
}
