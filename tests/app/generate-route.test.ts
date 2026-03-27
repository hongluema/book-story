import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
const chatOpenAIMock = vi.fn(() => ({
  invoke: invokeMock,
}));
const verifyTurnstileTokenMock = vi.fn();
const limitStoryGenerationMock = vi.fn();

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: chatOpenAIMock,
}));

vi.mock('../../lib/turnstile', () => ({
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

vi.mock('../../lib/rate-limit', () => ({
  limitStoryGeneration: limitStoryGenerationMock,
}));

describe('generate story route', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.MODEL_NAME = 'custom-model';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://example-base.test/v1';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key';
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';

    chatOpenAIMock.mockClear();
    invokeMock.mockReset();
    verifyTurnstileTokenMock.mockReset();
    limitStoryGenerationMock.mockReset();

    verifyTurnstileTokenMock.mockResolvedValue({
      success: true,
      errorCodes: [],
    });
    limitStoryGenerationMock.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 600_000,
    });
    invokeMock.mockResolvedValue({
      content: JSON.stringify({
        id: 'generated-sleep-story',
        title: '小熊轻轻说晚安',
        source: 'generated',
        topic: '睡觉习惯',
        pages: [
          { pageNumber: 1, text: '一', imagePrompt: 'p1', interactionHint: 'h1' },
          { pageNumber: 2, text: '二', imagePrompt: 'p2', interactionHint: 'h2' },
          { pageNumber: 3, text: '三', imagePrompt: 'p3', interactionHint: 'h3' },
          { pageNumber: 4, text: '四', imagePrompt: 'p4', interactionHint: 'h4' },
        ],
      }),
    });
  });

  it('uses ChatOpenAI with configured model and base url', async () => {
    const { POST } = await import('../../app/api/generate-story/route');
    const response = await POST(
      new Request('http://127.0.0.1/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.23',
        },
        body: JSON.stringify({
          topic: '睡觉习惯',
          customPrompt: '关于小熊',
          turnstileToken: 'cf-token',
        }),
      }),
    );

    expect(verifyTurnstileTokenMock).toHaveBeenCalledWith('cf-token', '198.51.100.23');
    expect(limitStoryGenerationMock).toHaveBeenCalledWith('198.51.100.23');
    expect(chatOpenAIMock).toHaveBeenCalledWith({
      model: 'custom-model',
      temperature: 0,
      apiKey: 'test-key',
      configuration: {
        baseURL: 'https://example-base.test/v1',
      },
    });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.story.title).toBe('小熊轻轻说晚安');
  });

  it('returns 400 when turnstile token is missing', async () => {
    const { POST } = await import('../../app/api/generate-story/route');
    const response = await POST(
      new Request('http://127.0.0.1/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: '睡觉习惯' }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        type: 'bad_request',
        message: '提交内容不完整，请检查后重试。',
      },
    });
  });

  it('returns 403 when turnstile verification fails', async () => {
    verifyTurnstileTokenMock.mockResolvedValueOnce({
      success: false,
      errorCodes: ['timeout-or-duplicate'],
    });

    const { POST } = await import('../../app/api/generate-story/route');
    const response = await POST(
      new Request('http://127.0.0.1/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: '睡觉习惯', turnstileToken: 'cf-token' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        type: 'captcha_failed',
        message: '请先完成安全验证后再试。',
      },
    });
  });

  it('returns 429 when rate limit is exceeded', async () => {
    limitStoryGenerationMock.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 600_000,
    });

    const { POST } = await import('../../app/api/generate-story/route');
    const response = await POST(
      new Request('http://127.0.0.1/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: '睡觉习惯', turnstileToken: 'cf-token' }),
      }),
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: {
        type: 'rate_limited',
        message: '生成次数有点多了，请 10 分钟后再试。',
      },
    });
  });

  it('returns 502 when model invocation fails', async () => {
    invokeMock.mockRejectedValueOnce(new Error('provider timeout'));

    const { POST } = await import('../../app/api/generate-story/route');
    const response = await POST(
      new Request('http://127.0.0.1/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: '睡觉习惯', turnstileToken: 'cf-token' }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: {
        type: 'model_error',
        message: '故事生成暂时不可用，请稍后再试。',
      },
    });
  });

  it('returns 502 when model response cannot be parsed', async () => {
    invokeMock.mockResolvedValueOnce({
      content: JSON.stringify({
        id: 'broken-story',
        title: '坏掉的故事',
        source: 'generated',
        topic: '睡觉习惯',
        pages: [{ pageNumber: 2, text: '二', imagePrompt: 'p2', interactionHint: 'h2' }],
      }),
    });

    const { POST } = await import('../../app/api/generate-story/route');
    const response = await POST(
      new Request('http://127.0.0.1/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: '睡觉习惯', turnstileToken: 'cf-token' }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: {
        type: 'parse_failed',
        message: '这次故事没生成成功，请再试一次。',
      },
    });
  });
});
