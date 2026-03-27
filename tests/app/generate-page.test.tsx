import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GeneratePage from '../../app/generate/page';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../../components/generate/turnstile-widget', () => ({
  TurnstileWidget: ({
    onVerify,
  }: {
    onVerify: (token: string) => void;
  }) => (
    <button type="button" onClick={() => onVerify('cf-token')}>
      通过安全验证
    </button>
  ),
}));

describe('generate page', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('renders instructions and form inputs', () => {
    render(<GeneratePage />);

    expect(screen.getByText('一键生成睡前故事')).toBeDefined();
    expect(screen.getByRole('form', { name: '睡前故事生成表单' })).toBeDefined();
    expect(screen.getByLabelText('告诉我想听的故事')).toBeDefined();
    expect(
      screen.getByPlaceholderText('比如：想听一个关于小熊刷牙睡觉的故事'),
    ).toBeDefined();
    expect(screen.getAllByRole('button', { name: /刷牙|分享|勇敢|睡觉习惯/ })).toHaveLength(4);
    expect(screen.getByRole('button', { name: '生成故事' })).toBeDefined();
    expect(screen.getByRole('button', { name: '通过安全验证' })).toBeDefined();
  });

  it('updates selected topic state when a theme button is clicked', () => {
    render(<GeneratePage />);

    const braveButton = screen.getByRole('button', { name: '勇敢' });
    fireEvent.click(braveButton);

    expect(braveButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByDisplayValue('勇敢')).toBeDefined();
  });

  it('shows validation error when submitting without turnstile token', async () => {
    render(<GeneratePage />);

    fireEvent.click(screen.getByRole('button', { name: '生成故事' }));

    await waitFor(() =>
      expect(screen.getByText('请先完成安全验证后再试。')).toBeDefined(),
    );
  });

  it('includes turnstile token in the request payload', async () => {
    const generatedStory = {
      id: 'generated-story',
      title: '勇敢的小熊',
      source: 'generated',
      topic: '勇敢',
      pages: [
        { pageNumber: 1, text: '一', imagePrompt: 'p1', interactionHint: 'h1' },
        { pageNumber: 2, text: '二', imagePrompt: 'p2', interactionHint: 'h2' },
        { pageNumber: 3, text: '三', imagePrompt: 'p3', interactionHint: 'h3' },
        { pageNumber: 4, text: '四', imagePrompt: 'p4', interactionHint: 'h4' },
      ],
    } as const;

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ story: generatedStory }),
      }),
    );
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      render(<GeneratePage />);

      fireEvent.click(screen.getByRole('button', { name: '通过安全验证' }));
      fireEvent.click(screen.getByRole('button', { name: '勇敢' }));
      fireEvent.change(screen.getByLabelText('告诉我想听的故事'), {
        target: { value: '测试说明' },
      });
      fireEvent.click(screen.getByRole('button', { name: '生成故事' }));

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(fetchMock).toHaveBeenCalledWith('/api/generate-story', {
        method: 'POST',
        body: JSON.stringify({
          topic: '勇敢',
          customPrompt: '测试说明',
          turnstileToken: 'cf-token',
        }),
      });
    } finally {
      if (originalFetch) {
        globalThis.fetch = originalFetch;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch;
      }
    }
  });

  it('shows api error message when generation fails', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({
          error: {
            type: 'rate_limited',
            message: '生成次数有点多了，请 10 分钟后再试。',
          },
        }),
      }),
    );
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      render(<GeneratePage />);

      fireEvent.click(screen.getByRole('button', { name: '通过安全验证' }));
      fireEvent.click(screen.getByRole('button', { name: '生成故事' }));

      await waitFor(() =>
        expect(screen.getByText('生成次数有点多了，请 10 分钟后再试。')).toBeDefined(),
      );
    } finally {
      if (originalFetch) {
        globalThis.fetch = originalFetch;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch;
      }
    }
  });
});
