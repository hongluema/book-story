'use client';

import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Story, StoryTopic } from '../../lib/story-types';
import { saveGeneratedStory } from '../../lib/local-storage';
import { TurnstileWidget } from './turnstile-widget';

const themeOptions: StoryTopic[] = ['刷牙', '分享', '勇敢', '睡觉习惯'];

interface GenerateFormProps {
  defaultTopic?: StoryTopic;
}

type GenerateStoryResponse = {
  story?: Story;
  error?: {
    type?: string;
    message?: string;
  };
};

const getInitialTopic = (topic?: StoryTopic): StoryTopic =>
  topic && themeOptions.includes(topic) ? topic : '睡觉习惯';

export function GenerateForm({ defaultTopic }: GenerateFormProps) {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<StoryTopic>(() => getInitialTopic(defaultTopic));
  const [customPrompt, setCustomPrompt] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken) {
      setErrorMessage('请先完成安全验证后再试。');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        body: JSON.stringify({
          topic: selectedTopic,
          customPrompt,
          turnstileToken,
        }),
      });

      const data = (await response.json()) as GenerateStoryResponse;

      if (!response.ok) {
        setErrorMessage(data?.error?.message ?? '故事生成暂时不可用，请稍后再试。');
        setTurnstileToken(null);
        return;
      }

      const generatedStory = data.story;
      if (!generatedStory) {
        setErrorMessage('这次故事没生成成功，请再试一次。');
        setTurnstileToken(null);
        return;
      }

      saveGeneratedStory(generatedStory);
      void router.push(`/story/${generatedStory.id}`);
    } catch {
      setErrorMessage('故事生成暂时不可用，请稍后再试。');
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      aria-label="睡前故事生成表单"
      className="space-y-6 rounded-3xl border border-starlight/10 bg-starlight/5 p-6 shadow-[0_20px_45px_rgba(12,14,18,0.35)]"
      onSubmit={handleSubmit}
    >
      <input name="topic" type="hidden" value={selectedTopic} />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-starlight">
          <label htmlFor="storyPrompt">告诉我想听的故事</label>
          <span className="text-xs text-starlight/60">可选</span>
        </div>
        <textarea
          id="storyPrompt"
          name="customPrompt"
          rows={4}
          placeholder="比如：想听一个关于小熊刷牙睡觉的故事"
          value={customPrompt}
          onChange={(event) => setCustomPrompt(event.target.value)}
          className="w-full resize-none rounded-2xl border border-starlight/20 bg-white/10 px-4 py-3 text-sm text-starlight placeholder-starlight/60 focus:border-starlight/40 focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-medium text-starlight">
          <span>选择主题</span>
          <span className="text-xs text-starlight/60">1 个备选主题</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {themeOptions.map((theme) => (
            <button
              key={theme}
              type="button"
              aria-pressed={selectedTopic === theme}
              onClick={() => setSelectedTopic(theme)}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                selectedTopic === theme
                  ? 'border-starlight bg-starlight/20 text-starlight'
                  : 'border-starlight/20 text-starlight hover:border-starlight/40 hover:text-starlight'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-starlight/70">完成安全验证后才能生成故事</p>
        <TurnstileWidget
          onVerify={(token) => {
            setTurnstileToken(token);
            setErrorMessage('');
          }}
          onExpire={() => setTurnstileToken(null)}
          onError={() => {
            setTurnstileToken(null);
            setErrorMessage('安全验证加载失败，请刷新后重试。');
          }}
        />
      </div>

      {errorMessage ? <p className="text-sm text-amber-200">{errorMessage}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-starlight px-6 py-2 text-sm font-semibold text-white transition hover:bg-starlight/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-starlight"
        >
          {isSubmitting ? '生成中...' : '生成故事'}
        </button>
      </div>
    </form>
  );
}
