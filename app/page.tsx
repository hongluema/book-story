import React from 'react';
import { getFeaturedStories } from '../lib/story-library';
import { HeroSection } from '../components/home/hero-section';
import { StoryRail } from '../components/home/story-rail';
import { TopicGrid } from '../components/home/topic-grid';
import { BottomNav } from '../components/ui/bottom-nav';
import type { StoryTopic } from '../lib/story-types';

const topicLinks: Array<{ topic: StoryTopic; href: string }> = [
  { topic: '刷牙', href: '/generate?topic=%E5%88%B7%E7%89%99' },
  { topic: '分享', href: '/generate?topic=%E5%88%86%E4%BA%AB' },
  { topic: '勇敢', href: '/generate?topic=%E5%8B%87%E6%95%A2' },
  { topic: '睡觉习惯', href: '/generate?topic=%E7%9D%A1%E8%A7%89%E4%B9%A0%E6%83%AF' },
];

export default function HomePage() {
  const featuredStories = getFeaturedStories();
  const heroStory = featuredStories[0];

  return (
    <div className="min-h-screen bg-night text-starlight">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pb-28 pt-12 sm:px-6">
        <HeroSection featuredStory={heroStory} />
        <TopicGrid topics={topicLinks} />
        <StoryRail stories={featuredStories} />
      </main>
      <BottomNav />
    </div>
  );
}
