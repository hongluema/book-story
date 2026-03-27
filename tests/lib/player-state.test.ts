import { describe, expect, it } from 'vitest';
import { createPlayerState, nextPage, previousPage, finishStory } from '../../lib/player-state';

describe('player state', () => {
  it('starts at the first page and unfinished when created', () => {
    const state = createPlayerState(4);
    expect(state.currentPage).toBe(0);
    expect(state.finished).toBe(false);
  });

  it('marks finished true once advancing past the last page', () => {
    let state = createPlayerState(4);
    for (let i = 0; i < 3; i += 1) {
      state = nextPage(state);
      expect(state.finished).toBe(false);
    }
    state = nextPage(state);
    expect(state.currentPage).toBe(3);
    expect(state.finished).toBe(true);
  });

  it('never lets previousPage go below zero', () => {
    let state = createPlayerState(3);
    state = previousPage(state);
    expect(state.currentPage).toBe(0);
    expect(state.finished).toBe(false);
  });

  it('clears finished when moving back from the end', () => {
    let state = createPlayerState(2);
    state = nextPage(state);
    state = nextPage(state);
    expect(state.finished).toBe(true);

    state = previousPage(state);
    expect(state.currentPage).toBe(0);
    expect(state.finished).toBe(false);
  });

  it('finishStory marks the player as finished', () => {
    const state = finishStory(createPlayerState(2));
    expect(state.finished).toBe(true);
  });
});
