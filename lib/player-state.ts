export interface PlayerState {
  currentPage: number;
  totalPages: number;
  finished: boolean;
}

export function createPlayerState(totalPages: number): PlayerState {
  return {
    currentPage: 0,
    totalPages,
    finished: false,
  };
}

export function nextPage(state: PlayerState): PlayerState {
  if (state.finished) {
    return state;
  }

  if (state.currentPage + 1 >= state.totalPages) {
    return {
      ...state,
      finished: true,
    };
  }

  return {
    ...state,
    currentPage: state.currentPage + 1,
  };
}

export function previousPage(state: PlayerState): PlayerState {
  if (state.currentPage === 0) {
    return {
      ...state,
      finished: false,
    };
  }

  return {
    ...state,
    currentPage: state.currentPage - 1,
    finished: false,
  };
}

export function finishStory(state: PlayerState): PlayerState {
  if (state.finished) {
    return state;
  }

  return {
    ...state,
    finished: true,
  };
}
