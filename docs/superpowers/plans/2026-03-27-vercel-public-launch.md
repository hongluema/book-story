# Vercel 公开上线配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让当前中文睡前绘本应用可以安全部署到 Vercel，并默认对外开放生成能力，同时具备 Turnstile 人机校验、Upstash IP 限流、明确错误提示和完整环境变量说明。

**Architecture:** 继续使用现有 `Next.js 14 + App Router + Route Handler` 架构，不额外引入独立后端。前端在提交生成请求前完成 Turnstile 校验，服务端先校验 token、再做 Upstash 滑动窗口限流、最后才调用模型；接口失败时返回结构化错误，不再通过 fallback story 假装成功。

**Tech Stack:** `Next.js`、`React`、`TypeScript`、`Vitest`、`Testing Library`、`@langchain/openai`、`Cloudflare Turnstile`、`@upstash/ratelimit`、`@upstash/redis`

---

## File Structure

- Modify: `package.json` — 增加 Upstash 依赖
- Modify: `pnpm-lock.yaml` — 锁定新增依赖版本
- Create: `.env.example` — 本地与 Vercel 所需环境变量模板
- Modify: `README.md` — Vercel 部署步骤、Turnstile/Upstash 配置说明
- Create: `lib/turnstile.ts` — 服务端 Turnstile 校验封装
- Create: `lib/rate-limit.ts` — Upstash 限流封装
- Create: `components/generate/turnstile-widget.tsx` — Turnstile 前端组件
- Modify: `components/generate/generate-form.tsx` — 提交流程、校验状态、错误提示
- Modify: `app/api/generate-story/route.ts` — Node runtime、错误协议、人机校验、限流
- Modify: `tests/app/generate-route.test.ts` — 路由安全与错误协议测试
- Modify: `tests/app/generate-page.test.tsx` — 表单提交流程与错误提示测试

### Task 1: 补齐依赖和部署环境契约

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: 先确认当前工程还没有公开上线所需依赖**

Run: `pnpm ls @upstash/ratelimit @upstash/redis`
Expected: 输出中不包含已安装的 `@upstash/ratelimit` / `@upstash/redis`

- [ ] **Step 2: 安装服务端限流依赖**

Run: `pnpm add @upstash/ratelimit @upstash/redis`
Expected: `dependencies` 中新增两个包，`pnpm-lock.yaml` 更新

- [ ] **Step 3: 写环境变量模板**

在 `.env.example` 中写入：

```bash
# LLM provider
OPENAI_API_KEY=your_provider_key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-plus

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

- [ ] **Step 4: 更新 README 的部署部分**

在 `README.md` 中补充：

```md
## Vercel 部署

1. 在 Vercel 导入项目
2. 在 Cloudflare Turnstile 创建站点，拿到 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`
3. 在 Upstash 创建 Redis，拿到 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`
4. 在 Vercel Project Settings -> Environment Variables 中配置：
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `MODEL_NAME`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. 触发一次重新部署
```

- [ ] **Step 5: 运行快速校验**

Run: `rg -n "TURNSTILE|UPSTASH|MODEL_NAME|OPENAI_BASE_URL" .env.example README.md package.json`
Expected: `.env.example` 和 `README.md` 中都能看到新增配置项，`package.json` 中存在 Upstash 依赖

- [ ] **Step 6: 提交**

```bash
git add package.json pnpm-lock.yaml .env.example README.md
git commit -m "chore: add deployment env contract for vercel launch"
```

### Task 2: 先把路由安全行为写成失败测试

**Files:**
- Modify: `tests/app/generate-route.test.ts`
- Test: `tests/app/generate-route.test.ts`

- [ ] **Step 1: 为 Turnstile 和限流 helper 建立 mock**

在 `tests/app/generate-route.test.ts` 顶部增加：

```ts
const verifyTurnstileTokenMock = vi.fn();
const limitStoryGenerationMock = vi.fn();

vi.mock('../../lib/turnstile', () => ({
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

vi.mock('../../lib/rate-limit', () => ({
  limitStoryGeneration: limitStoryGenerationMock,
}));
```

并在 `beforeEach` 里补默认行为：

```ts
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
```

- [ ] **Step 2: 先写“缺少 turnstileToken 返回 400”的失败测试**

在 `tests/app/generate-route.test.ts` 增加：

```ts
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
```

- [ ] **Step 3: 再写 403、429、502 的失败测试**

继续增加：

```ts
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
```

- [ ] **Step 4: 运行路由测试确认它们先失败**

Run: `pnpm vitest tests/app/generate-route.test.ts --run`
Expected: 新增用例失败，失败原因是当前路由仍然返回 fallback/debug 响应，而不是正式错误协议

- [ ] **Step 5: 提交测试**

```bash
git add tests/app/generate-route.test.ts
git commit -m "test: cover generate route security and error states"
```

### Task 3: 实现 Turnstile 校验、限流和正式错误协议

**Files:**
- Create: `lib/turnstile.ts`
- Create: `lib/rate-limit.ts`
- Modify: `app/api/generate-story/route.ts`
- Test: `tests/app/generate-route.test.ts`

- [ ] **Step 1: 写最小 Turnstile 服务端封装**

在 `lib/turnstile.ts` 中写入：

```ts
type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export async function verifyTurnstileToken(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error('TURNSTILE_SECRET_KEY is not configured');
  }

  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);

  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const json = (await response.json()) as TurnstileResponse;
  return {
    success: Boolean(json.success),
    errorCodes: json['error-codes'] ?? [],
  };
}
```

- [ ] **Step 2: 写最小 Upstash 限流封装**

在 `lib/rate-limit.ts` 中写入：

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'book-story:generate-story',
});

export async function limitStoryGeneration(identifier: string) {
  return ratelimit.limit(identifier);
}
```

- [ ] **Step 3: 把路由改成正式生产协议**

将 `app/api/generate-story/route.ts` 调整为：

```ts
import { ChatOpenAI } from '@langchain/openai';
import { parseGeneratedStory } from '../../../lib/story-parser';
import { buildStoryPrompt } from '../../../lib/story-prompt';
import type { StoryTopic } from '../../../lib/story-types';
import { limitStoryGeneration } from '../../../lib/rate-limit';
import { verifyTurnstileToken } from '../../../lib/turnstile';

export const runtime = 'nodejs';

type GenerateStoryRequest = {
  topic: StoryTopic;
  customPrompt?: string;
  turnstileToken?: string;
};

type ErrorBody = {
  error: {
    type: 'bad_request' | 'captcha_failed' | 'rate_limited' | 'model_error' | 'parse_failed';
    message: string;
  };
};
```

并按以下顺序处理：

```ts
const payload = (await request.json()) as Partial<GenerateStoryRequest>;
const topic = getStoryTopic(payload.topic);
const turnstileToken =
  typeof payload.turnstileToken === 'string' && payload.turnstileToken.trim()
    ? payload.turnstileToken
    : null;

if (!topic || !turnstileToken) {
  return jsonError(400, 'bad_request', '提交内容不完整，请检查后重试。');
}

const clientIp = getClientIp(request);
const captchaResult = await verifyTurnstileToken(turnstileToken, clientIp);
if (!captchaResult.success) {
  return jsonError(403, 'captcha_failed', '请先完成安全验证后再试。');
}

const limitResult = await limitStoryGeneration(clientIp);
if (!limitResult.success) {
  return jsonError(429, 'rate_limited', '生成次数有点多了，请 10 分钟后再试。');
}

try {
  const model = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  });

  const response = await model.invoke(buildStoryPrompt({ topic, customPrompt }));
  const story = parseGeneratedStory(extractContent(response.content));

  if (story.source === 'fallback') {
    return jsonError(502, 'parse_failed', '这次故事没生成成功，请再试一次。');
  }

  return Response.json({ story }, { status: 200 });
} catch (error) {
  console.error('[generate-story] model invocation failed', {
    topic,
    clientIp,
    message: error instanceof Error ? error.message : 'Unknown error',
  });
  return jsonError(502, 'model_error', '故事生成暂时不可用，请稍后再试。');
}
```

同时增加两个 helper：

```ts
function jsonError(status: number, type: ErrorBody['error']['type'], message: string) {
  return Response.json({ error: { type, message } } satisfies ErrorBody, { status });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}
```

- [ ] **Step 4: 运行路由测试确认转绿**

Run: `pnpm vitest tests/app/generate-route.test.ts --run`
Expected: 路由测试全部通过，成功路径仍返回 `story`，失败路径改为正式错误响应

- [ ] **Step 5: 提交**

```bash
git add lib/turnstile.ts lib/rate-limit.ts app/api/generate-story/route.ts tests/app/generate-route.test.ts
git commit -m "feat: secure generate route for public launch"
```

### Task 4: 先写生成页的失败测试

**Files:**
- Modify: `tests/app/generate-page.test.tsx`
- Test: `tests/app/generate-page.test.tsx`

- [ ] **Step 1: mock 掉真实 Turnstile 组件，专注表单逻辑**

在 `tests/app/generate-page.test.tsx` 顶部增加：

```ts
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
```

- [ ] **Step 2: 先写“未验证不能提交”的失败测试**

新增：

```ts
it('shows validation error when submitting without turnstile token', async () => {
  render(<GeneratePage />);

  fireEvent.click(screen.getByRole('button', { name: '生成故事' }));

  await waitFor(() =>
    expect(screen.getByText('请先完成安全验证后再试。')).toBeDefined(),
  );
});
```

- [ ] **Step 3: 再写“成功提交会带 token”和“接口错误会提示”的失败测试**

继续增加：

```ts
it('includes turnstile token in the request payload', async () => {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        story: {
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
        },
      }),
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
    globalThis.fetch = originalFetch;
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
    globalThis.fetch = originalFetch;
  }
});
```

- [ ] **Step 4: 运行生成页测试确认先失败**

Run: `pnpm vitest tests/app/generate-page.test.tsx --run`
Expected: 新测试失败，失败原因是当前表单没有 Turnstile token、没有错误展示、请求体也不包含 `turnstileToken`

- [ ] **Step 5: 提交测试**

```bash
git add tests/app/generate-page.test.tsx
git commit -m "test: cover generate form security flow"
```

### Task 5: 实现 Turnstile 前端组件和表单交互

**Files:**
- Create: `components/generate/turnstile-widget.tsx`
- Modify: `components/generate/generate-form.tsx`
- Modify: `tests/app/generate-page.test.tsx`
- Test: `tests/app/generate-page.test.tsx`

- [ ] **Step 1: 新建 Turnstile 组件**

在 `components/generate/turnstile-widget.tsx` 中写入：

```tsx
'use client';

import Script from 'next/script';
import { useEffect, useId, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
};

export function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerId = useId().replace(/:/g, '-');
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onError,
    });
  }, [containerId, onError, onExpire, onVerify, siteKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div id={containerId} className="min-h-[65px]" />
    </>
  );
}
```

- [ ] **Step 2: 把生成表单改成正式上线提交流程**

在 `components/generate/generate-form.tsx` 中：

```tsx
import { TurnstileWidget } from './turnstile-widget';
```

新增状态：

```tsx
const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
const [errorMessage, setErrorMessage] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
```

在表单中加入组件：

```tsx
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
```

把 `handleSubmit` 改成：

```tsx
if (!turnstileToken) {
  setErrorMessage('请先完成安全验证后再试。');
  return;
}

setIsSubmitting(true);
setErrorMessage('');

const response = await fetch('/api/generate-story', {
  method: 'POST',
  body: JSON.stringify({
    topic: selectedTopic,
    customPrompt,
    turnstileToken,
  }),
});

const data = (await response.json()) as
  | { story?: Story }
  | { error?: { type?: string; message?: string } };

if (!response.ok) {
  setErrorMessage(data?.error?.message ?? '故事生成暂时不可用，请稍后再试。');
  setTurnstileToken(null);
  return;
}

const generatedStory = 'story' in data ? data.story : undefined;
if (!generatedStory) {
  setErrorMessage('这次故事没生成成功，请再试一次。');
  setTurnstileToken(null);
  return;
}

saveGeneratedStory(generatedStory);
void router.push(`/story/${generatedStory.id}`);
```

并补充展示：

```tsx
{errorMessage ? <p className="text-sm text-amber-200">{errorMessage}</p> : null}

<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? '生成中...' : '生成故事'}
</button>
```

在 `finally` 中恢复：

```tsx
setIsSubmitting(false);
```

- [ ] **Step 3: 运行生成页测试确认转绿**

Run: `pnpm vitest tests/app/generate-page.test.tsx --run`
Expected: 生成页测试全部通过，提交前需要验证，失败时会显示错误，成功请求体包含 `turnstileToken`

- [ ] **Step 4: 运行完整验证**

Run: `pnpm vitest --run`
Expected: 全部测试通过

Run: `pnpm build`
Expected: Next.js 生产构建成功

- [ ] **Step 5: 提交**

```bash
git add components/generate/turnstile-widget.tsx components/generate/generate-form.tsx tests/app/generate-page.test.tsx
git commit -m "feat: add turnstile verification to generate form"
```

### Task 6: 收尾文档与上线核对

**Files:**
- Modify: `README.md`
- Create: `.env.example`
- Test: `pnpm build`

- [ ] **Step 1: 在 README 中补“上线前检查清单”**

追加：

```md
## 上线前检查清单

- 已在 Cloudflare Turnstile 为生产域名配置 widget hostname
- 已在 Vercel 配置所有环境变量
- 已在 Upstash 创建 Redis 并写入 Vercel 环境变量
- `/api/generate-story` 在 Preview 环境能成功返回生成故事
- 限流命中时页面能看到中文错误提示
```

- [ ] **Step 2: 手工验证 Preview / Production**

在 Vercel Preview 环境手工验证：

```text
1. 打开 /generate
2. 完成人机校验
3. 提交一次成功生成
4. 连续触发多次生成直到命中限流
5. 确认页面出现“生成次数有点多了，请 10 分钟后再试。”
```

- [ ] **Step 3: 最终验证**

Run: `pnpm vitest --run`
Expected: 所有测试通过

Run: `pnpm build`
Expected: 构建通过，无类型错误

- [ ] **Step 4: 提交**

```bash
git add README.md .env.example
git commit -m "docs: document vercel public launch setup"
```
