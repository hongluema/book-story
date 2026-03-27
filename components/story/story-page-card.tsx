import React from 'react';
import type { StoryPage } from '../../lib/story-types';

interface StoryPageCardProps {
  page: StoryPage;
  pageIndex: number;
  totalPages: number;
  isActive?: boolean;
}

export function StoryPageCard({ page, pageIndex, totalPages, isActive = false }: StoryPageCardProps) {
  return (
    <article
      className={`space-y-4 rounded-2xl border p-6 text-starlight shadow-xl transition ${
        isActive ? 'border-starlight/80 bg-night/70' : 'border-white/10 bg-night/60'
      }`}
    >
      <div className="flex items-center justify-between text-sm uppercase tracking-[0.4em] text-starlight/70">
        <span>第 {page.pageNumber} 页</span>
        <span>{pageIndex + 1}/{totalPages}</span>
      </div>
      <p className="text-lg leading-relaxed text-starlight">{page.text}</p>
      <p className="text-sm text-starlight/60">{page.interactionHint}</p>
    </article>
  );
}
