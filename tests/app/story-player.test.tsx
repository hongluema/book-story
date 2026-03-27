import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StoryPage from '../../app/story/[id]/page';

describe('story player', () => {
  it('shows playback controls, ambient noise entry, and bedtime phrases', async () => {
    const page = await StoryPage({
      params: Promise.resolve({ id: 'missing-story' }),
    });

    render(page);
    expect(screen.getByRole('button', { name: '播放' })).toBeDefined();
    expect(screen.getByRole('button', { name: /白噪音/ })).toBeDefined();
    expect(screen.getByText('晚安语')).toBeDefined();
  });

  it('displays the fallback audio tip when ambient sound is unavailable', async () => {
    const page = await StoryPage({
      params: Promise.resolve({ id: 'missing-story' }),
    });

    render(page);
    expect(
      screen.getByText('如果音频没有播放，也可以继续轻轻翻页阅读'),
    ).toBeDefined();
  });

  it('loads generated story data from localStorage when provided', async () => {
    const generatedStory = {
      id: 'generated-story',
      title: '勇敢的小熊',
      source: 'generated',
      topic: '勇敢',
      pages: [
        { pageNumber: 1, text: '页一', imagePrompt: 'p1', interactionHint: 'h1' },
        { pageNumber: 2, text: '页二', imagePrompt: 'p2', interactionHint: 'h2' },
        { pageNumber: 3, text: '页三', imagePrompt: 'p3', interactionHint: 'h3' },
        { pageNumber: 4, text: '页四', imagePrompt: 'p4', interactionHint: 'h4' },
      ],
    } as const;

    const storage = {
      getItem(key: string) {
        return key === `generated:${generatedStory.id}`
          ? JSON.stringify(generatedStory)
          : null;
      },
      setItem() {},
      removeItem() {},
    } as Storage;

    const originalStorage = globalThis.localStorage;
    globalThis.localStorage = storage;

    try {
      const page = await StoryPage({
        params: Promise.resolve({ id: generatedStory.id }),
      });

      render(page);

      await waitFor(() => {
        expect(screen.getByText(generatedStory.title)).toBeDefined();
      });
    } finally {
      if (originalStorage) {
        globalThis.localStorage = originalStorage;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
      }
    }
  });
});
