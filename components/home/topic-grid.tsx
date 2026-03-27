import React from 'react';
import Link from 'next/link';
import type { StoryTopic } from '../../lib/story-types';

export interface TopicGridItem {
  href: string;
  topic: StoryTopic;
}

export function TopicGrid({ topics }: { topics: TopicGridItem[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.4em] text-starlight/60">探索主题</p>
        <Link className="text-[0.65rem] uppercase tracking-[0.5em] text-starlight/50" href="/generate">
          更多
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((item) => (
          <Link
            key={item.topic}
            href={item.href}
            className="flex min-h-[96px] flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-5 text-left text-sm text-starlight transition hover:border-starlight/30 hover:bg-white/10"
          >
            <span className="text-lg font-semibold leading-tight text-starlight">{item.topic}</span>
            <span className="mt-2 text-[0.7rem] uppercase tracking-[0.4em] text-starlight/60">温柔计划</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
