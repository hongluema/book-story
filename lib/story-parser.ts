import type { Story, StoryPage, StorySource, StoryTopic } from './story-types';
import { fallbackStory } from './fallback-story';

const storyTopics: StoryTopic[] = ['刷牙', '分享', '勇敢', '睡觉习惯'];
const JSON_CODE_FENCE_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/i;

export function parseGeneratedStory(payload: string): Story {
  const story = tryParseStory(payload);
  if (!story || story.pages.length < 4 || story.pages.length > 6) {
    return fallbackStory;
  }
  return story;
}

function tryParseStory(payload: string): Story | null {
  const candidate = extractJsonPayload(payload);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate);
    return buildStory(parsed);
  } catch {
    return null;
  }
}

function buildStory(value: unknown): Story | null {
  if (!isRecord(value)) {
    return null;
  }

  const pages = buildPages(value.pages);
  if (!pages || pages.length < 4 || pages.length > 6) {
    return null;
  }

  const id = getString(value.id);
  const title = getString(value.title);
  const source = getStorySource(value.source);
  const topic = getStoryTopic(value.topic);

  if (!id || !title || !source || !topic) {
    return null;
  }

  return {
    id,
    title,
    source,
    topic,
    pages,
  };
}

function buildPages(value: unknown): StoryPage[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const pages: StoryPage[] = [];
  for (const pageEntry of value) {
    const page = buildPage(pageEntry);
    if (!page) {
      return null;
    }
    if (page.pageNumber !== pages.length + 1) {
      return null;
    }
    pages.push(page);
  }
  return pages;
}

function buildPage(value: unknown): StoryPage | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawPageNumber = value.pageNumber;
  const pageNumber =
    typeof rawPageNumber === 'number' && Number.isFinite(rawPageNumber) && Number.isInteger(rawPageNumber)
      ? rawPageNumber
      : null;
  const text = getString(value.text);
  const imagePrompt = getString(value.imagePrompt);
  const interactionHint = getString(value.interactionHint);

  if (pageNumber === null || !text || !imagePrompt || !interactionHint) {
    return null;
  }

  return {
    pageNumber,
    text,
    imagePrompt,
    interactionHint,
  };
}

function extractJsonPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) {
    return null;
  }

  const fenceMatch = trimmed.match(JSON_CODE_FENCE_REGEX);
  if (fenceMatch?.[1]) {
    const candidate = fenceMatch[1].trim();
    if (candidate) {
      return candidate;
    }
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    return objectMatch[0].trim();
  }

  return trimmed;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getStorySource(value: unknown): StorySource | null {
  return value === 'generated' ? 'generated' : null;
}

function getStoryTopic(value: unknown): StoryTopic | null {
  if (typeof value !== 'string') {
    return null;
  }
  return storyTopics.includes(value as StoryTopic) ? (value as StoryTopic) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
