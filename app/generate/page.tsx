import React from 'react';
import type { StoryTopic } from '../../lib/story-types';
import { GenerateForm } from '../../components/generate/generate-form';

const AVAILABLE_TOPICS: StoryTopic[] = ['刷牙', '分享', '勇敢', '睡觉习惯'];

const getDefaultTopic = (value?: string | string[] | undefined): StoryTopic | undefined => {
  if (!value) {
    return undefined;
  }
  const rawTopic = Array.isArray(value) ? value[0] : value;
  if (typeof rawTopic !== 'string') {
    return undefined;
  }
  const normalized = rawTopic.trim();
  return AVAILABLE_TOPICS.includes(normalized as StoryTopic) ? (normalized as StoryTopic) : undefined;
};

type GeneratePageProps = {
  searchParams?: {
    topic?: string | string[] | undefined;
  };
};

export default function GeneratePage({ searchParams = {} }: GeneratePageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-starlight">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">一键生成睡前故事</h1>
          <p className="mt-2 text-sm text-starlight/70">
            选择主题并补充想听的细节，生成适合睡前阅读的温柔短故事。
          </p>
        </div>

        <GenerateForm defaultTopic={getDefaultTopic(searchParams.topic)} />
      </section>
    </main>
  );
}
