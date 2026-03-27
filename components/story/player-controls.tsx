import React from 'react';

interface PlayerControlsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onPlayToggle?: () => void;
  isPlaying?: boolean;
  disablePrevious?: boolean;
  disableNext?: boolean;
}

export function PlayerControls({
  onPrevious,
  onNext,
  onPlayToggle,
  isPlaying = false,
  disablePrevious = false,
  disableNext = false,
}: PlayerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 text-starlight">
      <button
        type="button"
        onClick={onPrevious}
        disabled={disablePrevious}
        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold uppercase tracking-wider disabled:opacity-40"
      >
        上一页
      </button>
      <button
        type="button"
        onClick={onPlayToggle}
        className="flex min-w-[140px] items-center justify-center rounded-full border border-starlight px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-starlight/10"
      >
        {isPlaying ? '暂停' : '播放'}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disableNext}
        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold uppercase tracking-wider disabled:opacity-40"
      >
        下一页
      </button>
    </div>
  );
}
