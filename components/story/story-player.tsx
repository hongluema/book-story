'use client';

import React, { useEffect, useState } from 'react';
import type { Story } from '../../lib/story-types';
import { getGeneratedStory } from '../../lib/local-storage';
import { createPlayerState, nextPage, previousPage, PlayerState } from '../../lib/player-state';
import { AmbientSoundToggle } from './ambient-sound-toggle';
import { PlayerControls } from './player-controls';
import { StoryPageCard } from './story-page-card';

interface StoryPlayerProps {
  story: Story;
  requestedStoryId: string;
}

export default function StoryPlayer({ story, requestedStoryId }: StoryPlayerProps) {
  const [currentStory, setCurrentStory] = useState<Story>(story);
  const [playerState, setPlayerState] = useState<PlayerState>(() =>
    createPlayerState(Math.max(1, story.pages.length)),
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const storedStory = getGeneratedStory(requestedStoryId);
    if (storedStory) {
      setCurrentStory(storedStory);
      return;
    }
    setCurrentStory(story);
  }, [requestedStoryId, story]);

  useEffect(() => {
    setPlayerState(createPlayerState(Math.max(1, currentStory.pages.length)));
    setIsPlaying(false);
  }, [currentStory.pages.length]);

  const pages = currentStory.pages.length > 0 ? currentStory.pages : [];

  const currentPage = pages[playerState.currentPage] ?? pages[pages.length - 1];

  const handlePrevious = () => {
    setPlayerState((prev) => previousPage(prev));
  };

  const handleNext = () => {
    setPlayerState((prev) => {
      const next = nextPage(prev);
      if (next.finished) {
        setIsPlaying(false);
      }
      return next;
    });
  };

  const handlePlayToggle = () => {
    setPlayerState((prev) => {
      if (prev.finished) {
        return createPlayerState(Math.max(1, pages.length));
      }
      return prev;
    });
    setIsPlaying((prev) => !prev);
  };

  const bedtimePhrase = currentPage?.interactionHint ?? '让自己慢慢漂入梦乡吧。';

  return (
    <section className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-12 text-starlight">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.6em] text-starlight/50">播放</p>
        <h1 className="text-3xl font-semibold leading-tight">{currentStory.title}</h1>
        <div className="flex items-center justify-between">
          <AmbientSoundToggle />
          <span className="text-sm text-starlight/60">第 {playerState.currentPage + 1} 页 · 共 {pages.length} 页</span>
        </div>
      </header>

      {currentPage && (
        <StoryPageCard
          page={currentPage}
          pageIndex={playerState.currentPage}
          totalPages={pages.length}
          isActive
        />
      )}

      <div className="space-y-4">
        <PlayerControls
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPlayToggle={handlePlayToggle}
          isPlaying={isPlaying}
          disablePrevious={playerState.currentPage === 0}
          disableNext={playerState.finished}
        />
        <p className="text-center text-sm text-starlight/60">
          如果音频没有播放，也可以继续轻轻翻页阅读
        </p>
        <audio src="/audio/goodnight.mp3" preload="none" aria-hidden />
        <div className="rounded-2xl border border-white/10 bg-night/60 p-5">
          <p className="text-xs uppercase tracking-[0.4em] text-starlight/60">晚安语</p>
          <p className="mt-2 text-base leading-relaxed text-starlight">{bedtimePhrase}</p>
        </div>
      </div>
    </section>
  );
}
