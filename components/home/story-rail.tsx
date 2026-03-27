import React from 'react';
import Link from 'next/link';
import type { Story } from '../../lib/story-types';

interface StoryRailProps {
  stories: Story[];
}

export function StoryRail({ stories }: StoryRailProps) {
  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" id="stories">
      <div className="flex items-end justify-between">
        <h2 className="text-lg font-semibold uppercase tracking-[0.4em] text-starlight/80">最近听过</h2>
        <Link className="text-[0.65rem] uppercase tracking-[0.5em] text-starlight/50" href="/library">
          全部
        </Link>
      </div>
      <div className="space-y-4">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/story/${story.id}`}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_35px_rgba(4,6,18,0.55)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-starlight">{story.title}</h3>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.4em] text-starlight/70">
                {story.topic}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-starlight/70">
              {story.pages[0]?.interactionHint ?? '轻柔陪伴的开始'}
            </p>
            <div className="mt-4 flex items-center justify-between text-[0.7rem] uppercase tracking-[0.4em] text-starlight/50">
              <span>{story.source}</span>
              <span>第 {story.pages[0]?.pageNumber ?? 1} 页</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
