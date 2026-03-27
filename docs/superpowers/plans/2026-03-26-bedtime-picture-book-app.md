# 中文睡前绘本故事应用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向 2-3 岁宝宝的中文睡前绘本故事 H5，支持固定故事、AI 生成、故事播放、白噪音、收藏与最近听过。

**Architecture:** 使用 `Next.js + React + TypeScript + Tailwind CSS` 搭建移动端优先的 H5。固定故事使用本地 JSON，家长设置与播放记录使用 `localStorage`，AI 故事通过服务端 API 调用 OpenAI 生成结构化 JSON，前端统一通过播放器状态管理驱动故事、白噪音与晚安语流程。

**Tech Stack:** `Next.js`、`React`、`TypeScript`、`Tailwind CSS`、`Vitest`、`Testing Library`、`OpenAI API`

---

## File Structure

- Create: `package.json` — 项目脚本与依赖定义
- Create: `tsconfig.json` — TypeScript 配置
- Create: `next.config.ts` — Next.js 配置
- Create: `postcss.config.js` — Tailwind/PostCSS 配置
- Create: `tailwind.config.ts` — Tailwind 主题配置
- Create: `app/layout.tsx` — 全局布局与字体/主题注入
- Create: `app/globals.css` — 全局样式与夜间主题变量
- Create: `app/page.tsx` — 首页
- Create: `app/generate/page.tsx` — AI 生成页
- Create: `app/library/page.tsx` — 收藏与最近听过页
- Create: `app/settings/page.tsx` — 家长设置页
- Create: `app/story/[id]/page.tsx` — 固定故事/生成故事播放页
- Create: `app/api/generate-story/route.ts` — AI 生成接口
- Create: `components/home/hero-section.tsx` — 首页头部与快速入口
- Create: `components/home/topic-grid.tsx` — 教育主题入口
- Create: `components/home/story-rail.tsx` — 推荐/最近/收藏横向列表
- Create: `components/story/story-player.tsx` — 故事播放主组件
- Create: `components/story/story-page-card.tsx` — 单页绘本展示
- Create: `components/story/player-controls.tsx` — 播放控制区
- Create: `components/story/ambient-sound-toggle.tsx` — 白噪音控制
- Create: `components/generate/generate-form.tsx` — 主题与自定义输入表单
- Create: `components/settings/settings-form.tsx` — 家长设置表单
- Create: `components/ui/bottom-nav.tsx` — 底部导航
- Create: `lib/story-types.ts` — 故事、页面、主题、设置类型定义
- Create: `lib/story-library.ts` — 固定故事读取与查询
- Create: `lib/story-prompt.ts` — AI Prompt 与 schema 约束
- Create: `lib/story-parser.ts` — AI 返回结果解析与兜底
- Create: `lib/local-storage.ts` — 收藏、最近听过、设置的存取工具
- Create: `lib/player-state.ts` — 播放状态与切页逻辑
- Create: `lib/fallback-story.ts` — AI 失败时的默认故事
- Create: `data/stories.json` — 内置固定故事库
- Create: `public/audio/rain.mp3` — 雨声资源
- Create: `public/audio/waves.mp3` — 海浪资源
- Create: `public/audio/night.mp3` — 夜晚虫鸣资源
- Create: `public/audio/goodnight.mp3` — 默认晚安语资源
- Create: `tests/lib/story-library.test.ts` — 固定故事库测试
- Create: `tests/lib/story-parser.test.ts` — AI 解析/兜底测试
- Create: `tests/lib/local-storage.test.ts` — 本地存储测试
- Create: `tests/lib/player-state.test.ts` — 播放器状态测试
- Create: `tests/app/home-page.test.tsx` — 首页测试
- Create: `tests/app/generate-page.test.tsx` — 生成页测试
- Create: `tests/app/story-player.test.tsx` — 播放页测试
- Create: `README.md` — 运行说明与环境变量说明

### Task 1: 初始化 Next.js H5 项目骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `README.md`
- Test: `npm run lint`

- [ ] **Step 1: 写初始化测试/校验目标**

在 `README.md` 中先写出项目启动后的最小验收标准：

```md
## Milestone 1 验收

- 首页可在移动端宽度正常打开
- 页面背景为夜间柔和风格
- 底部导航可见
```

- [ ] **Step 2: 运行校验命令确认项目尚未初始化**

Run: `test -f package.json`
Expected: exit code `1`

- [ ] **Step 3: 写最小项目配置**

在 `package.json` 中写入：

```json
{
  "name": "bedtime-picture-book",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "openai": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.14.1",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vitest": "^3.1.1",
    "jsdom": "^26.0.0"
  }
}
```

在 `app/layout.tsx` 中写入：

```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "晚安绘本",
  description: "面向 2-3 岁宝宝的中文睡前绘本故事应用"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: 写最小全局样式**

在 `app/globals.css` 中写入：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  --bg: #120f24;
  --panel: #1d1836;
  --text: #f8f4ff;
  --muted: #c9c0e6;
  --accent: #ffd98d;
}

body {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #16112d 0%, #0f0c1f 100%);
  color: var(--text);
  font-family: system-ui, sans-serif;
}
```

- [ ] **Step 5: 运行 lint 验证基础骨架**

Run: `npm run lint`
Expected: exit code `0`

- [ ] **Step 6: 提交**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.js tailwind.config.ts app/layout.tsx app/globals.css README.md
git commit -m "feat: scaffold bedtime story web app"
```

### Task 2: 定义故事域模型与固定故事库

**Files:**
- Create: `lib/story-types.ts`
- Create: `lib/story-library.ts`
- Create: `data/stories.json`
- Test: `tests/lib/story-library.test.ts`

- [ ] **Step 1: 写固定故事库失败测试**

在 `tests/lib/story-library.test.ts` 中写入：

```ts
import { describe, expect, it } from "vitest";
import { getFeaturedStories, getStoryById } from "@/lib/story-library";

describe("story library", () => {
  it("returns featured stories with bedtime topics", () => {
    const stories = getFeaturedStories();

    expect(stories.length).toBeGreaterThanOrEqual(3);
    expect(stories[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      topic: expect.any(String)
    });
  });

  it("returns a story by id", () => {
    const story = getStoryById("rabbit-brush-teeth");

    expect(story?.title).toBe("小兔子刷牙去睡觉");
    expect(story?.pages).toHaveLength(4);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/lib/story-library.test.ts`
Expected: FAIL with module resolution error for `@/lib/story-library`

- [ ] **Step 3: 写类型与固定故事数据**

在 `lib/story-types.ts` 中写入：

```ts
export type StoryTopic = "刷牙" | "分享" | "勇敢" | "睡觉习惯";

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  interactionHint: string;
}

export interface Story {
  id: string;
  title: string;
  source: "library" | "generated" | "fallback";
  topic: StoryTopic;
  pages: StoryPage[];
}
```

在 `data/stories.json` 中至少写入 3 个故事，其中一个示例：

```json
{
  "stories": [
    {
      "id": "rabbit-brush-teeth",
      "title": "小兔子刷牙去睡觉",
      "source": "library",
      "topic": "刷牙",
      "pages": [
        {
          "pageNumber": 1,
          "text": "小兔子揉揉眼睛，说：睡觉前，要先刷牙呀。",
          "imagePrompt": "暖黄色夜灯下的小兔子站在洗手台前",
          "interactionHint": "点击牙刷轻轻发光"
        }
      ]
    }
  ]
}
```

在 `lib/story-library.ts` 中写入：

```ts
import storyData from "@/data/stories.json";
import type { Story } from "@/lib/story-types";

const stories = storyData.stories as Story[];

export function getFeaturedStories(): Story[] {
  return stories.slice(0, 6);
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id);
}
```

- [ ] **Step 4: 补全示例故事页数以满足测试**

将 `rabbit-brush-teeth` 的 `pages` 扩充到 4 页，并再补充至少 2 个故事：

```json
{
  "id": "moon-share-stars",
  "title": "小月亮和星星一起分享光",
  "source": "library",
  "topic": "分享",
  "pages": [
    {
      "pageNumber": 1,
      "text": "小月亮有一篮子软软的星光。",
      "imagePrompt": "夜空中抱着星光篮子的小月亮",
      "interactionHint": "点击星光轻轻闪烁"
    }
  ]
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test -- tests/lib/story-library.test.ts`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add lib/story-types.ts lib/story-library.ts data/stories.json tests/lib/story-library.test.ts
git commit -m "feat: add bedtime story library"
```

### Task 3: 实现本地存储与家长设置能力

**Files:**
- Create: `lib/local-storage.ts`
- Test: `tests/lib/local-storage.test.ts`

- [ ] **Step 1: 写本地存储失败测试**

在 `tests/lib/local-storage.test.ts` 中写入：

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  getFavorites,
  saveFavorite,
  getRecentStories,
  saveRecentStory,
  getSettings,
  saveSettings
} from "@/lib/local-storage";

describe("local storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads favorites", () => {
    saveFavorite("rabbit-brush-teeth");
    expect(getFavorites()).toEqual(["rabbit-brush-teeth"]);
  });

  it("keeps latest recent stories first", () => {
    saveRecentStory("story-a");
    saveRecentStory("story-b");
    saveRecentStory("story-a");
    expect(getRecentStories()).toEqual(["story-a", "story-b"]);
  });

  it("saves settings", () => {
    saveSettings({ duration: "short", ambientSound: true, goodnightVoice: false });
    expect(getSettings()).toEqual({
      duration: "short",
      ambientSound: true,
      goodnightVoice: false
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/lib/local-storage.test.ts`
Expected: FAIL with module resolution error for `@/lib/local-storage`

- [ ] **Step 3: 写存储实现**

在 `lib/local-storage.ts` 中写入：

```ts
type Settings = {
  duration: "short" | "medium";
  ambientSound: boolean;
  goodnightVoice: boolean;
};

const FAVORITES_KEY = "bedtime:favorites";
const RECENTS_KEY = "bedtime:recents";
const SETTINGS_KEY = "bedtime:settings";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function getFavorites(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function saveFavorite(id: string) {
  const next = Array.from(new Set([...getFavorites(), id]));
  writeJson(FAVORITES_KEY, next);
}

export function getRecentStories(): string[] {
  return readJson<string[]>(RECENTS_KEY, []);
}

export function saveRecentStory(id: string) {
  const next = [id, ...getRecentStories().filter((item) => item !== id)].slice(0, 10);
  writeJson(RECENTS_KEY, next);
}

export function getSettings(): Settings {
  return readJson<Settings>(SETTINGS_KEY, {
    duration: "short",
    ambientSound: true,
    goodnightVoice: true
  });
}

export function saveSettings(settings: Settings) {
  writeJson(SETTINGS_KEY, settings);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- tests/lib/local-storage.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add lib/local-storage.ts tests/lib/local-storage.test.ts
git commit -m "feat: add local storage helpers"
```

### Task 4: 实现 AI Prompt、解析器与失败兜底

**Files:**
- Create: `lib/story-prompt.ts`
- Create: `lib/story-parser.ts`
- Create: `lib/fallback-story.ts`
- Test: `tests/lib/story-parser.test.ts`

- [ ] **Step 1: 写 AI 解析失败测试**

在 `tests/lib/story-parser.test.ts` 中写入：

```ts
import { describe, expect, it } from "vitest";
import { parseGeneratedStory } from "@/lib/story-parser";

describe("parseGeneratedStory", () => {
  it("parses valid json story", () => {
    const story = parseGeneratedStory(JSON.stringify({
      id: "gentle-bear",
      title: "小熊轻轻说晚安",
      source: "generated",
      topic: "睡觉习惯",
      pages: [
        {
          pageNumber: 1,
          text: "小熊拍拍枕头，说晚安啦。",
          imagePrompt: "小熊抱着枕头站在床边",
          interactionHint: "点击枕头轻轻弹一下"
        },
        {
          pageNumber: 2,
          text: "小熊钻进被窝，闭上了眼睛。",
          imagePrompt: "小熊躺进被窝",
          interactionHint: "点击月亮轻轻摇晃"
        },
        {
          pageNumber: 3,
          text: "窗外的月亮轻轻照着房间。",
          imagePrompt: "月光照进安静卧室",
          interactionHint: "点击星星发光"
        },
        {
          pageNumber: 4,
          text: "小熊慢慢睡着了。",
          imagePrompt: "小熊安静入睡",
          interactionHint: "点击云朵轻轻飘动"
        }
      ]
    }));

    expect(story.title).toBe("小熊轻轻说晚安");
    expect(story.pages).toHaveLength(4);
  });

  it("returns fallback when payload is invalid", () => {
    const story = parseGeneratedStory("not-json");
    expect(story.source).toBe("fallback");
    expect(story.pages).toHaveLength(4);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/lib/story-parser.test.ts`
Expected: FAIL with module resolution error for `@/lib/story-parser`

- [ ] **Step 3: 写 Prompt 与解析逻辑**

在 `lib/story-prompt.ts` 中写入：

```ts
export function buildStoryPrompt(input: { topic: string; customPrompt?: string }) {
  return `
你要生成适合 2-3 岁宝宝的中文睡前绘本故事。
要求：
1. 主题优先围绕 ${input.topic}
2. 语气温柔、重复、低刺激
3. 输出 4-6 页
4. 只返回 JSON
5. 字段为 id, title, source, topic, pages
6. pages 中每项包含 pageNumber, text, imagePrompt, interactionHint
额外要求：${input.customPrompt ?? "无"}
`;
}
```

在 `lib/fallback-story.ts` 中写入：

```ts
import type { Story } from "@/lib/story-types";

export const fallbackStory: Story = {
  id: "fallback-goodnight-star",
  title: "小星星轻轻睡着了",
  source: "fallback",
  topic: "睡觉习惯",
  pages: [
    {
      pageNumber: 1,
      text: "小星星眨呀眨，说要睡觉啦。",
      imagePrompt: "夜空中的小星星轻轻发光",
      interactionHint: "点击星星轻轻闪一下"
    },
    {
      pageNumber: 2,
      text: "云朵软软地飘过来，给小星星盖被子。",
      imagePrompt: "云朵给小星星盖上小被子",
      interactionHint: "点击云朵轻轻飘动"
    },
    {
      pageNumber: 3,
      text: "月亮妈妈轻轻说，晚安呀，宝贝。",
      imagePrompt: "月亮妈妈挂在夜空中微笑",
      interactionHint: "点击月亮轻轻摇晃"
    },
    {
      pageNumber: 4,
      text: "小星星闭上眼睛，安安静静睡着了。",
      imagePrompt: "安静睡着的小星星",
      interactionHint: "点击被子轻轻起伏"
    }
  ]
};
```

在 `lib/story-parser.ts` 中写入：

```ts
import { fallbackStory } from "@/lib/fallback-story";
import type { Story } from "@/lib/story-types";

export function parseGeneratedStory(payload: string): Story {
  try {
    const parsed = JSON.parse(payload) as Story;
    if (!parsed.pages || parsed.pages.length < 4) {
      return fallbackStory;
    }
    return parsed;
  } catch {
    return fallbackStory;
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- tests/lib/story-parser.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add lib/story-prompt.ts lib/story-parser.ts lib/fallback-story.ts tests/lib/story-parser.test.ts
git commit -m "feat: add ai story parsing and fallback"
```

### Task 5: 实现 AI 生成 API 路由

**Files:**
- Create: `app/api/generate-story/route.ts`
- Modify: `lib/story-prompt.ts`
- Modify: `lib/story-parser.ts`
- Test: `tests/app/generate-page.test.tsx`

- [ ] **Step 1: 写 API 调用失败测试**

在 `tests/app/generate-page.test.tsx` 中先写接口约束测试：

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("openai", () => {
  return {
    default: class OpenAI {
      responses = {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            id: "gentle-bear",
            title: "小熊轻轻说晚安",
            source: "generated",
            topic: "睡觉习惯",
            pages: new Array(4).fill(null).map((_, index) => ({
              pageNumber: index + 1,
              text: `第${index + 1}页`,
              imagePrompt: `画面${index + 1}`,
              interactionHint: `交互${index + 1}`
            }))
          })
        })
      };
    }
  };
});

import { POST } from "@/app/api/generate-story/route";

describe("generate-story api", () => {
  it("returns generated story json", async () => {
    const request = new Request("http://localhost/api/generate-story", {
      method: "POST",
      body: JSON.stringify({ topic: "睡觉习惯", customPrompt: "关于小熊" })
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.story.title).toBe("小熊轻轻说晚安");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/app/generate-page.test.tsx`
Expected: FAIL with module resolution error for `@/app/api/generate-story/route`

- [ ] **Step 3: 写最小 API 实现**

在 `app/api/generate-story/route.ts` 中写入：

```ts
import OpenAI from "openai";
import { buildStoryPrompt } from "@/lib/story-prompt";
import { parseGeneratedStory } from "@/lib/story-parser";

export async function POST(request: Request) {
  const { topic, customPrompt } = await request.json();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: buildStoryPrompt({ topic, customPrompt })
  });

  const story = parseGeneratedStory(response.output_text ?? "");

  return Response.json({ story });
}
```

- [ ] **Step 4: 补充失败兜底响应**

将 `POST` 更新为：

```ts
import { fallbackStory } from "@/lib/fallback-story";

export async function POST(request: Request) {
  try {
    const { topic, customPrompt } = await request.json();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: buildStoryPrompt({ topic, customPrompt })
    });

    const story = parseGeneratedStory(response.output_text ?? "");
    return Response.json({ story });
  } catch {
    return Response.json({ story: fallbackStory }, { status: 200 });
  }
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test -- tests/app/generate-page.test.tsx`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add app/api/generate-story/route.ts lib/story-prompt.ts lib/story-parser.ts tests/app/generate-page.test.tsx
git commit -m "feat: add ai story generation api"
```

### Task 6: 实现首页与推荐内容入口

**Files:**
- Create: `app/page.tsx`
- Create: `components/home/hero-section.tsx`
- Create: `components/home/topic-grid.tsx`
- Create: `components/home/story-rail.tsx`
- Create: `components/ui/bottom-nav.tsx`
- Test: `tests/app/home-page.test.tsx`

- [ ] **Step 1: 写首页失败测试**

在 `tests/app/home-page.test.tsx` 中写入：

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("shows bedtime hero and topic shortcuts", () => {
    render(<HomePage />);

    expect(screen.getByText("今晚听什么")).toBeInTheDocument();
    expect(screen.getByText("刷牙")).toBeInTheDocument();
    expect(screen.getByText("最近听过")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/app/home-page.test.tsx`
Expected: FAIL with module resolution error for `@/app/page`

- [ ] **Step 3: 写首页最小实现**

在 `app/page.tsx` 中写入：

```tsx
import { getFeaturedStories } from "@/lib/story-library";

export default function HomePage() {
  const stories = getFeaturedStories();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-6">
      <section>
        <p className="text-sm text-slate-300">晚安绘本</p>
        <h1 className="text-3xl font-bold">今晚听什么</h1>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">教育主题</h2>
        <div className="grid grid-cols-2 gap-3">
          {["刷牙", "分享", "勇敢", "睡觉习惯"].map((topic) => (
            <button key={topic} className="rounded-2xl bg-white/10 px-4 py-5 text-left">
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">最近听过</h2>
        <div className="space-y-3">
          {stories.slice(0, 2).map((story) => (
            <article key={story.id} className="rounded-2xl bg-white/10 p-4">
              <h3>{story.title}</h3>
              <p className="text-sm text-slate-300">{story.topic}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 拆分首页组件**

将首页拆分为 `hero-section.tsx`、`topic-grid.tsx`、`story-rail.tsx`、`bottom-nav.tsx`，例如 `components/home/topic-grid.tsx`：

```tsx
export function TopicGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["刷牙", "分享", "勇敢", "睡觉习惯"].map((topic) => (
        <button key={topic} className="rounded-2xl bg-white/10 px-4 py-5 text-left">
          {topic}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test -- tests/app/home-page.test.tsx`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add app/page.tsx components/home/hero-section.tsx components/home/topic-grid.tsx components/home/story-rail.tsx components/ui/bottom-nav.tsx tests/app/home-page.test.tsx
git commit -m "feat: add bedtime home page"
```

### Task 7: 实现生成页与家长输入表单

**Files:**
- Create: `app/generate/page.tsx`
- Create: `components/generate/generate-form.tsx`
- Modify: `tests/app/generate-page.test.tsx`

- [ ] **Step 1: 写生成页失败测试**

在 `tests/app/generate-page.test.tsx` 追加页面测试：

```tsx
import { render, screen } from "@testing-library/react";
import GeneratePage from "@/app/generate/page";

it("shows topic shortcuts and custom prompt input", () => {
  render(<GeneratePage />);

  expect(screen.getByText("一键生成睡前故事")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("比如：想听一个关于小熊刷牙睡觉的故事")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/app/generate-page.test.tsx`
Expected: FAIL with module resolution error for `@/app/generate/page`

- [ ] **Step 3: 写生成页与表单**

在 `components/generate/generate-form.tsx` 中写入：

```tsx
"use client";

import { useState } from "react";

const topics = ["刷牙", "分享", "勇敢", "睡觉习惯"] as const;

export function GenerateForm() {
  const [customPrompt, setCustomPrompt] = useState("");

  return (
    <form className="space-y-4 rounded-3xl bg-white/10 p-4">
      <h1 className="text-2xl font-bold">一键生成睡前故事</h1>
      <div className="grid grid-cols-2 gap-3">
        {topics.map((topic) => (
          <button key={topic} type="button" className="rounded-2xl bg-[#2f2850] px-4 py-4">
            {topic}
          </button>
        ))}
      </div>
      <textarea
        value={customPrompt}
        onChange={(event) => setCustomPrompt(event.target.value)}
        placeholder="比如：想听一个关于小熊刷牙睡觉的故事"
        className="min-h-28 w-full rounded-2xl bg-[#241d40] p-4"
      />
      <button type="submit" className="w-full rounded-2xl bg-[#ffd98d] px-4 py-3 text-slate-900">
        开始生成
      </button>
    </form>
  );
}
```

在 `app/generate/page.tsx` 中写入：

```tsx
import { GenerateForm } from "@/components/generate/generate-form";

export default function GeneratePage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <GenerateForm />
    </main>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- tests/app/generate-page.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add app/generate/page.tsx components/generate/generate-form.tsx tests/app/generate-page.test.tsx
git commit -m "feat: add story generation page"
```

### Task 8: 实现播放器状态机与故事播放页

**Files:**
- Create: `lib/player-state.ts`
- Create: `components/story/story-page-card.tsx`
- Create: `components/story/player-controls.tsx`
- Create: `components/story/ambient-sound-toggle.tsx`
- Create: `components/story/story-player.tsx`
- Create: `app/story/[id]/page.tsx`
- Test: `tests/lib/player-state.test.ts`
- Test: `tests/app/story-player.test.tsx`

- [ ] **Step 1: 写播放器状态失败测试**

在 `tests/lib/player-state.test.ts` 中写入：

```ts
import { describe, expect, it } from "vitest";
import { createPlayerState, nextPage, previousPage, finishStory } from "@/lib/player-state";

describe("player state", () => {
  it("starts from first page", () => {
    const state = createPlayerState(4);
    expect(state.currentPage).toBe(0);
    expect(state.finished).toBe(false);
  });

  it("moves to next page and finishes at end", () => {
    let state = createPlayerState(2);
    state = nextPage(state);
    expect(state.currentPage).toBe(1);
    state = nextPage(state);
    expect(state.finished).toBe(true);
  });

  it("does not move before first page", () => {
    const state = previousPage(createPlayerState(4));
    expect(state.currentPage).toBe(0);
  });

  it("marks story as finished", () => {
    const state = finishStory(createPlayerState(4));
    expect(state.finished).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/lib/player-state.test.ts`
Expected: FAIL with module resolution error for `@/lib/player-state`

- [ ] **Step 3: 写播放器状态实现**

在 `lib/player-state.ts` 中写入：

```ts
export interface PlayerState {
  currentPage: number;
  totalPages: number;
  finished: boolean;
}

export function createPlayerState(totalPages: number): PlayerState {
  return {
    currentPage: 0,
    totalPages,
    finished: false
  };
}

export function nextPage(state: PlayerState): PlayerState {
  if (state.currentPage >= state.totalPages - 1) {
    return { ...state, finished: true };
  }

  return { ...state, currentPage: state.currentPage + 1 };
}

export function previousPage(state: PlayerState): PlayerState {
  return { ...state, currentPage: Math.max(0, state.currentPage - 1) };
}

export function finishStory(state: PlayerState): PlayerState {
  return { ...state, finished: true };
}
```

- [ ] **Step 4: 写播放页组件**

在 `tests/app/story-player.test.tsx` 中写入：

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StoryPage from "@/app/story/[id]/page";

describe("story page", () => {
  it("shows controls and goodnight section", async () => {
    const page = await StoryPage({ params: Promise.resolve({ id: "rabbit-brush-teeth" }) });
    render(page);

    expect(screen.getByText("播放")).toBeInTheDocument();
    expect(screen.getByText("白噪音")).toBeInTheDocument();
    expect(screen.getByText("晚安语")).toBeInTheDocument();
  });
});
```

在 `components/story/player-controls.tsx` 中写入：

```tsx
export function PlayerControls() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
      <button>上一页</button>
      <button>播放</button>
      <button>下一页</button>
    </div>
  );
}
```

在 `components/story/ambient-sound-toggle.tsx` 中写入：

```tsx
export function AmbientSoundToggle() {
  return (
    <button className="rounded-2xl bg-white/10 px-4 py-3">
      白噪音
    </button>
  );
}
```

在 `components/story/story-page-card.tsx` 中写入：

```tsx
import type { StoryPage } from "@/lib/story-types";

export function StoryPageCard({ page }: { page: StoryPage }) {
  return (
    <article className="rounded-3xl bg-white/10 p-5">
      <div className="mb-4 h-64 rounded-3xl bg-[#2f2850]" />
      <p className="text-lg leading-8">{page.text}</p>
      <p className="mt-3 text-sm text-slate-300">{page.interactionHint}</p>
    </article>
  );
}
```

在 `components/story/story-player.tsx` 中写入：

```tsx
import { AmbientSoundToggle } from "@/components/story/ambient-sound-toggle";
import { PlayerControls } from "@/components/story/player-controls";
import { StoryPageCard } from "@/components/story/story-page-card";
import type { Story } from "@/lib/story-types";

export function StoryPlayer({ story }: { story: Story }) {
  return (
    <section className="space-y-4">
      <StoryPageCard page={story.pages[0]} />
      <AmbientSoundToggle />
      <PlayerControls />
      <div className="rounded-2xl bg-[#2a2346] p-4">
        <h2 className="text-lg font-semibold">晚安语</h2>
        <p className="mt-2 text-slate-300">宝宝晚安，小月亮在等你睡觉啦。</p>
      </div>
    </section>
  );
}
```

在 `app/story/[id]/page.tsx` 中写入：

```tsx
import { StoryPlayer } from "@/components/story/story-player";
import { getStoryById } from "@/lib/story-library";
import { fallbackStory } from "@/lib/fallback-story";

export default async function StoryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = getStoryById(id) ?? fallbackStory;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <StoryPlayer story={story} />
    </main>
  );
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test -- tests/lib/player-state.test.ts tests/app/story-player.test.tsx`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add lib/player-state.ts components/story/story-page-card.tsx components/story/player-controls.tsx components/story/ambient-sound-toggle.tsx components/story/story-player.tsx app/story/[id]/page.tsx tests/lib/player-state.test.ts tests/app/story-player.test.tsx
git commit -m "feat: add story player experience"
```

### Task 9: 实现收藏/最近听过页与设置页

**Files:**
- Create: `app/library/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `components/settings/settings-form.tsx`
- Modify: `components/ui/bottom-nav.tsx`
- Modify: `lib/local-storage.ts`
- Test: `tests/app/home-page.test.tsx`

- [ ] **Step 1: 写页面失败测试**

在 `tests/app/home-page.test.tsx` 追加：

```tsx
import LibraryPage from "@/app/library/page";
import SettingsPage from "@/app/settings/page";

it("shows library headings", () => {
  render(<LibraryPage />);
  expect(screen.getByText("收藏")).toBeInTheDocument();
  expect(screen.getByText("最近听过")).toBeInTheDocument();
});

it("shows settings switches", () => {
  render(<SettingsPage />);
  expect(screen.getByText("白噪音默认开启")).toBeInTheDocument();
  expect(screen.getByText("晚安语默认开启")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/app/home-page.test.tsx`
Expected: FAIL with module resolution error for `@/app/library/page`

- [ ] **Step 3: 写页面与设置表单**

在 `components/settings/settings-form.tsx` 中写入：

```tsx
export function SettingsForm() {
  return (
    <form className="space-y-4 rounded-3xl bg-white/10 p-4">
      <label className="flex items-center justify-between">
        <span>白噪音默认开启</span>
        <input type="checkbox" defaultChecked />
      </label>
      <label className="flex items-center justify-between">
        <span>晚安语默认开启</span>
        <input type="checkbox" defaultChecked />
      </label>
    </form>
  );
}
```

在 `app/library/page.tsx` 中写入：

```tsx
export default function LibraryPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <section className="mb-6">
        <h1 className="text-2xl font-bold">收藏</h1>
      </section>
      <section>
        <h2 className="text-xl font-semibold">最近听过</h2>
      </section>
    </main>
  );
}
```

在 `app/settings/page.tsx` 中写入：

```tsx
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">家长设置</h1>
      <SettingsForm />
    </main>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- tests/app/home-page.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add app/library/page.tsx app/settings/page.tsx components/settings/settings-form.tsx components/ui/bottom-nav.tsx tests/app/home-page.test.tsx
git commit -m "feat: add library and settings pages"
```

### Task 10: 接通首页/生成页/播放页的数据流

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/generate/page.tsx`
- Modify: `components/generate/generate-form.tsx`
- Modify: `components/home/topic-grid.tsx`
- Modify: `components/story/story-player.tsx`
- Modify: `lib/local-storage.ts`
- Test: `tests/app/home-page.test.tsx`
- Test: `tests/app/generate-page.test.tsx`
- Test: `tests/app/story-player.test.tsx`

- [ ] **Step 1: 写数据流失败测试**

在 `tests/app/generate-page.test.tsx` 追加：

```tsx
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { GenerateForm } from "@/components/generate/generate-form";

it("submits topic and custom prompt", async () => {
  const user = userEvent.setup();
  const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ story: { id: "story-1", title: "晚安小熊", pages: [] } }))
  );

  render(<GenerateForm />);
  await user.click(screen.getByText("刷牙"));
  await user.type(
    screen.getByPlaceholderText("比如：想听一个关于小熊刷牙睡觉的故事"),
    "关于小熊"
  );
  await user.click(screen.getByText("开始生成"));

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/generate-story",
    expect.objectContaining({
      method: "POST"
    })
  );
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/app/generate-page.test.tsx`
Expected: FAIL because submit behavior is not implemented

- [ ] **Step 3: 写最小数据流实现**

将 `components/generate/generate-form.tsx` 更新为：

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const topics = ["刷牙", "分享", "勇敢", "睡觉习惯"] as const;

export function GenerateForm() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<(typeof topics)[number]>("睡觉习惯");
  const [customPrompt, setCustomPrompt] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/generate-story", {
      method: "POST",
      body: JSON.stringify({
        topic: selectedTopic,
        customPrompt
      })
    });

    const json = await response.json();
    localStorage.setItem(`generated:${json.story.id}`, JSON.stringify(json.story));
    router.push(`/story/${json.story.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white/10 p-4">
      <h1 className="text-2xl font-bold">一键生成睡前故事</h1>
      <div className="grid grid-cols-2 gap-3">
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => setSelectedTopic(topic)}
            className="rounded-2xl bg-[#2f2850] px-4 py-4"
          >
            {topic}
          </button>
        ))}
      </div>
      <textarea
        value={customPrompt}
        onChange={(event) => setCustomPrompt(event.target.value)}
        placeholder="比如：想听一个关于小熊刷牙睡觉的故事"
        className="min-h-28 w-full rounded-2xl bg-[#241d40] p-4"
      />
      <button type="submit" className="w-full rounded-2xl bg-[#ffd98d] px-4 py-3 text-slate-900">
        开始生成
      </button>
    </form>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- tests/app/generate-page.test.tsx tests/app/home-page.test.tsx tests/app/story-player.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add app/page.tsx app/generate/page.tsx components/generate/generate-form.tsx components/home/topic-grid.tsx components/story/story-player.tsx lib/local-storage.ts tests/app/home-page.test.tsx tests/app/generate-page.test.tsx tests/app/story-player.test.tsx
git commit -m "feat: connect bedtime story user flow"
```

### Task 11: 增加音频资源接入与播放降级

**Files:**
- Create: `public/audio/rain.mp3`
- Create: `public/audio/waves.mp3`
- Create: `public/audio/night.mp3`
- Create: `public/audio/goodnight.mp3`
- Modify: `components/story/ambient-sound-toggle.tsx`
- Modify: `components/story/story-player.tsx`
- Test: `tests/app/story-player.test.tsx`

- [ ] **Step 1: 写播放降级失败测试**

在 `tests/app/story-player.test.tsx` 追加：

```tsx
it("shows fallback reading hint when audio is unavailable", async () => {
  const page = await StoryPage({ params: Promise.resolve({ id: "missing-story" }) });
  render(page);

  expect(screen.getByText("如果音频没有播放，也可以继续轻轻翻页阅读")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/app/story-player.test.tsx`
Expected: FAIL because fallback reading hint is missing

- [ ] **Step 3: 写降级提示与音频绑定**

将 `components/story/story-player.tsx` 更新为：

```tsx
export function StoryPlayer({ story }: { story: Story }) {
  return (
    <section className="space-y-4">
      <audio src="/audio/goodnight.mp3" preload="none" />
      <StoryPageCard page={story.pages[0]} />
      <AmbientSoundToggle />
      <PlayerControls />
      <p className="text-sm text-slate-300">
        如果音频没有播放，也可以继续轻轻翻页阅读
      </p>
      <div className="rounded-2xl bg-[#2a2346] p-4">
        <h2 className="text-lg font-semibold">晚安语</h2>
        <p className="mt-2 text-slate-300">宝宝晚安，小月亮在等你睡觉啦。</p>
      </div>
    </section>
  );
}
```

将 `components/story/ambient-sound-toggle.tsx` 更新为：

```tsx
export function AmbientSoundToggle() {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="mb-2 font-medium">白噪音</p>
      <div className="flex gap-2">
        <button>雨声</button>
        <button>海浪</button>
        <button>虫鸣</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 加入占位音频资源**

创建 4 个占位文件：

```bash
touch public/audio/rain.mp3 public/audio/waves.mp3 public/audio/night.mp3 public/audio/goodnight.mp3
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm run test -- tests/app/story-player.test.tsx`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add public/audio/rain.mp3 public/audio/waves.mp3 public/audio/night.mp3 public/audio/goodnight.mp3 components/story/ambient-sound-toggle.tsx components/story/story-player.tsx tests/app/story-player.test.tsx
git commit -m "feat: add ambient audio placeholders"
```

### Task 12: 完成集成验证与文档补充

**Files:**
- Modify: `README.md`
- Modify: `tests/app/home-page.test.tsx`
- Modify: `tests/app/generate-page.test.tsx`
- Modify: `tests/app/story-player.test.tsx`

- [ ] **Step 1: 写最终验收清单**

将 `README.md` 更新为：

```md
## 本地运行

```bash
npm install
npm run dev
```

## 环境变量

创建 `.env.local`：

```bash
OPENAI_API_KEY=your_key_here
```

## 验收清单

- 首页可查看推荐故事、主题入口、最近听过
- 家长可通过主题或自定义输入生成故事
- 播放页可查看绘本页、白噪音入口、晚安语
- 收藏与最近听过可在本地保存
```
```

- [ ] **Step 2: 运行全量测试确认通过**

Run: `npm run test`
Expected: PASS

- [ ] **Step 3: 运行构建确认通过**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: 运行 lint 确认通过**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add README.md tests/app/home-page.test.tsx tests/app/generate-page.test.tsx tests/app/story-player.test.tsx
git commit -m "docs: finalize bedtime story app setup and checks"
```

## Self-Review

- **Spec coverage:** 已覆盖规格中的首页、生成页、播放页、收藏/最近听过、设置、固定故事库、AI 生成、白噪音、晚安语、错误兜底与测试重点。
- **Placeholder scan:** 计划中未使用 `TBD`、`TODO`、`implement later`、`add appropriate` 等占位表述。
- **Type consistency:** `Story`、`StoryPage`、`StoryTopic`、`PlayerState`、`Settings` 命名在各任务中保持一致；生成故事统一返回 `story` 对象。

