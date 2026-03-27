import type { Story, StoryPage, StorySource, StoryTopic } from './story-types';
import storiesJson from '../data/stories.json';

const storyTopics: StoryTopic[] = ['刷牙', '分享', '勇敢', '睡觉习惯'];
const storySources: StorySource[] = ['library', 'generated', 'fallback'];

const stories = loadStories(storiesJson);

export function getFeaturedStories(): Story[] {
  return stories.map(cloneStory);
}

export function getStoryById(id: string): Story | undefined {
  const story = stories.find((entry) => entry.id === id);
  return story ? cloneStory(story) : undefined;
}

function cloneStory(story: Story): Story {
  return {
    ...story,
    pages: story.pages.map((page) => ({ ...page })),
  };
}

function loadStories(data: unknown): Story[] {
  if (!Array.isArray(data)) {
    throw new Error('stories.json must contain an array of stories');
  }

  return data.map((entry, index) => ensureStory(entry, index));
}

function ensureStory(value: unknown, index: number): Story {
  if (!isRecord(value)) {
    throw new Error(`stories[${index}] must be an object`);
  }

  return {
    id: assertString(value.id, `stories[${index}].id`),
    title: assertString(value.title, `stories[${index}].title`),
    source: assertStorySource(value.source, `stories[${index}].source`),
    topic: assertStoryTopic(value.topic, `stories[${index}].topic`),
    pages: ensurePages(value.pages, index),
  };
}

function ensurePages(value: unknown, storyIndex: number): StoryPage[] {
  if (!Array.isArray(value)) {
    throw new Error(`stories[${storyIndex}].pages must be an array`);
  }

  return value.map((page, pageIndex) => ensureStoryPage(page, storyIndex, pageIndex));
}

function ensureStoryPage(value: unknown, storyIndex: number, pageIndex: number): StoryPage {
  if (!isRecord(value)) {
    throw new Error(`stories[${storyIndex}].pages[${pageIndex}] must be an object`);
  }

  return {
    pageNumber: assertNumber(value.pageNumber, `stories[${storyIndex}].pages[${pageIndex}].pageNumber`),
    text: assertString(value.text, `stories[${storyIndex}].pages[${pageIndex}].text`),
    imagePrompt: assertString(value.imagePrompt, `stories[${storyIndex}].pages[${pageIndex}].imagePrompt`),
    interactionHint: assertString(
      value.interactionHint,
      `stories[${storyIndex}].pages[${pageIndex}].interactionHint`,
    ),
  };
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${path} must be a string`);
  }
  return value;
}

function assertNumber(value: unknown, path: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${path} must be a number`);
  }
  return value;
}

function assertStorySource(value: unknown, path: string): StorySource {
  if (typeof value !== 'string' || !storySources.includes(value as StorySource)) {
    throw new Error(`${path} must be one of ${storySources.join(', ')}`);
  }
  return value as StorySource;
}

function assertStoryTopic(value: unknown, path: string): StoryTopic {
  if (typeof value !== 'string' || !storyTopics.includes(value as StoryTopic)) {
    throw new Error(`${path} must be one of ${storyTopics.join(', ')}`);
  }
  return value as StoryTopic;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
