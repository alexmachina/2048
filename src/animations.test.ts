import { describe, it, expect } from 'bun:test';
import {
  planMove,
  nextPhase,
  renderFrame,
  idleAnim,
  frameDurationMs,
  MERGE_FRAMES,
  SPAWN_FRAMES,
} from './animations';
import type { GameState } from './engine';

function stateWithSlideAndMerge(): GameState {
  // A state simulating a post-move from [_, _, 2, 2] moving left:
  // Expected: merged tile at col 0, sources from cols 2 and 3.
  return {
    tiles: [
      {
        id: 10,
        value: 4,
        row: 0,
        col: 0,
        mergedFrom: [
          { id: 1, fromRow: 0, fromCol: 2, value: 2 },
          { id: 2, fromRow: 0, fromCol: 3, value: 2 },
        ],
      },
      {
        id: 11,
        value: 2,
        row: 2,
        col: 2,
        isNew: true,
      },
    ],
    score: 4,
    best: 4,
    over: false,
    won: false,
    nextId: 12,
  };
}

describe('animations — planMove', () => {
  it('starts in sliding phase with max distance as totalSlideFrames', () => {
    const anim = planMove(stateWithSlideAndMerge());
    expect(anim.phase).toBe('sliding');
    expect(anim.frame).toBe(0);
    // Farthest source distance: col 3 → col 0 = 3
    expect(anim.totalSlideFrames).toBe(3);
  });
});

describe('animations — renderFrame sliding', () => {
  it('moves each source one cell per frame toward destination', () => {
    const state = stateWithSlideAndMerge();
    const a0 = planMove(state);
    const f0 = renderFrame(a0);
    // Source at col 2 → col 1 after 1 step; source at col 3 → col 2
    const cols = f0.filter((t) => t.value === 2).map((t) => t.col).sort();
    expect(cols).toEqual([1, 2]);
    // New tile not yet visible
    expect(f0.find((t) => t.key === 'tile-11')).toBeUndefined();
  });

  it('parks each tile at destination after its distance is consumed', () => {
    const state = stateWithSlideAndMerge();
    let anim = planMove(state);
    // Advance to last sliding frame
    while (anim.phase === 'sliding') {
      const n = nextPhase(anim);
      if (!n || n.phase !== 'sliding') break;
      anim = n;
    }
    // At frame 2 (last sliding frame, index = totalSlideFrames - 1),
    // both sources should be at col 0.
    const f = renderFrame(anim);
    const cols = f.filter((t) => t.value === 2).map((t) => t.col);
    expect(cols.every((c) => c === 0)).toBe(true);
  });
});

describe('animations — nextPhase transitions', () => {
  it('transitions sliding → merging → spawning → null', () => {
    const state = stateWithSlideAndMerge();
    let a = planMove(state);
    for (let i = 0; i < a.totalSlideFrames; i++) {
      const n = nextPhase(a);
      expect(n).not.toBeNull();
      a = n!;
    }
    expect(a.phase).toBe('merging');
    expect(a.frame).toBe(0);

    for (let i = 0; i < MERGE_FRAMES; i++) {
      const n = nextPhase(a);
      expect(n).not.toBeNull();
      a = n!;
    }
    expect(a.phase).toBe('spawning');

    for (let i = 0; i < SPAWN_FRAMES; i++) {
      const n = nextPhase(a);
      if (!n) {
        a = { ...a, phase: 'idle' };
        break;
      }
      a = n;
    }
    // After spawning, we expect null (end)
    const end = nextPhase(a);
    expect(end).toBeNull();
  });

  it('skips merging if no merges happened', () => {
    const state: GameState = {
      tiles: [
        {
          id: 1,
          value: 2,
          row: 0,
          col: 0,
          slidFrom: [0, 3],
        },
        { id: 2, value: 4, row: 2, col: 2, isNew: true },
      ],
      score: 0,
      best: 0,
      over: false,
      won: false,
      nextId: 3,
    };
    let a = planMove(state);
    // Consume slide
    for (let i = 0; i < a.totalSlideFrames; i++) {
      const n = nextPhase(a);
      expect(n).not.toBeNull();
      a = n!;
    }
    // Should go directly to spawning (no merges)
    expect(a.phase).toBe('spawning');
  });
});

describe('animations — merge pulse & spawn dim', () => {
  it('renders merged tile with pulse=true on first merging frame', () => {
    const state = stateWithSlideAndMerge();
    const anim = {
      phase: 'merging' as const,
      frame: 0,
      totalSlideFrames: 3,
      postState: state,
    };
    const f = renderFrame(anim);
    const merged = f.find((t) => t.value === 4);
    expect(merged?.pulse).toBe(true);
  });

  it('renders new tile with dim=true on first spawning frame', () => {
    const state = stateWithSlideAndMerge();
    const anim = {
      phase: 'spawning' as const,
      frame: 0,
      totalSlideFrames: 3,
      postState: state,
    };
    const f = renderFrame(anim);
    const spawn = f.find((t) => t.key === 'tile-11');
    expect(spawn?.dim).toBe(true);
  });
});

describe('animations — idle', () => {
  it('renders all tiles without modifiers when idle', () => {
    const state = stateWithSlideAndMerge();
    const a = idleAnim(state);
    const f = renderFrame(a);
    expect(f.length).toBe(state.tiles.length);
    expect(f.every((t) => !t.pulse && !t.dim)).toBe(true);
  });

  it('returns 0 frame duration for idle', () => {
    const a = idleAnim(stateWithSlideAndMerge());
    expect(frameDurationMs(a)).toBe(0);
  });
});
