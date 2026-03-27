import React from 'react';
import type { Story } from '../../lib/story-types';

interface HeroSectionProps {
  featuredStory?: Story;
}

const fallbackStory: Story = {
  id: 'placeholder-story',
  title: '柔和的睡前循序',
  topic: '睡觉习惯',
  source: 'library',
  pages: [
    {
      pageNumber: 1,
      text: '柔软的夜晚，星光轻轻落在眉梢。',
      imagePrompt: 'gentle bedtime sky with soft stars',
      interactionHint: '和孩子一起深呼吸。',
    },
  ],
};

export function HeroSection({ featuredStory }: HeroSectionProps) {
  const story = featuredStory ?? fallbackStory;

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-twilight/95 via-twilight/80 to-night/80 px-6 py-8 shadow-[0_35px_80px_rgba(4,7,18,0.75)]">
      <p className="text-xs uppercase tracking-[0.4em] text-starlight/60">今晚听什么</p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-starlight sm:text-4xl">
        {story.title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-starlight/80">
        挑一段{story.topic}故事，搭配柔光与低饱和的声音，让孩子静静靠在你身边。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-starlight/80">
          {story.topic}
        </span>
        <span className="rounded-2xl border border-white/20 bg-night/60 px-4 py-2 text-xs uppercase tracking-[0.35em] text-starlight/60">
          约 8 分钟
        </span>
      </div>
    </section>
  );
}
