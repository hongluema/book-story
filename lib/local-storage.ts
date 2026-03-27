import type { Story, StoryPage, StorySource, StoryTopic } from './story-types';

type Duration = 'short' | 'medium';

export type StorySettings = {
  duration: Duration;
  ambientSound: boolean;
  goodnightVoice: boolean;
};

const STORAGE_KEYS = {
  favorites: 'bedtime:favorites',
  recentStories: 'bedtime:recents',
  settings: 'bedtime:settings',
} as const;

const MAX_RECENT_STORIES = 10;

const DEFAULT_SETTINGS: StorySettings = {
  duration: 'short',
  ambientSound: true,
  goodnightVoice: true,
};

const GENERATED_STORY_PREFIX = 'generated:';
const STORY_TOPICS: StoryTopic[] = ['刷牙', '分享', '勇敢', '睡觉习惯'];
const STORY_SOURCES: StorySource[] = ['library', 'generated', 'fallback'];

const getStorage = (): Storage | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  try {
    return 'localStorage' in globalThis ? (globalThis.localStorage as Storage) : undefined;
  } catch (error) {
    console.warn('Local storage unavailable', error);
    return undefined;
  }
};

const tryParseJson = (value: string | null): unknown => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const readStringArrayFromStorage = (storage: Storage, key: string): string[] => {
  const parsed = tryParseJson(safeGetItem(storage, key));
  return isStringArray(parsed) ? parsed : [];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDuration = (value: unknown): value is Duration => value === 'short' || value === 'medium';
const isStoryTopic = (value: unknown): value is StoryTopic =>
  typeof value === 'string' && STORY_TOPICS.includes(value as StoryTopic);
const isStorySource = (value: unknown): value is StorySource =>
  typeof value === 'string' && STORY_SOURCES.includes(value as StorySource);

const safeGetItem = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage`, error);
    return null;
  }
};

const safeSetItem = (storage: Storage, key: string, value: string) => {
  try {
    storage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage`, error);
  }
};

export const saveFavorite = (storyId: string) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const favorites = readStringArrayFromStorage(storage, STORAGE_KEYS.favorites);
  const next = favorites.includes(storyId) ? favorites : [...favorites, storyId];
  safeSetItem(storage, STORAGE_KEYS.favorites, JSON.stringify(next));
};

export const getFavorites = (): string[] => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  return readStringArrayFromStorage(storage, STORAGE_KEYS.favorites);
};

const collectRecentStories = (items: string[], nextStory: string): string[] => {
  const filtered = items.filter((item) => item !== nextStory);
  return [nextStory, ...filtered].slice(0, MAX_RECENT_STORIES);
};

export const saveRecentStory = (storyId: string) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const existing = readStringArrayFromStorage(storage, STORAGE_KEYS.recentStories);
  const updated = collectRecentStories(existing, storyId);
  safeSetItem(storage, STORAGE_KEYS.recentStories, JSON.stringify(updated));
};

export const getRecentStories = (): string[] => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  return readStringArrayFromStorage(storage, STORAGE_KEYS.recentStories);
};

export const saveSettings = (settings: StorySettings) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  safeSetItem(storage, STORAGE_KEYS.settings, JSON.stringify(settings));
};

export const getSettings = (): StorySettings => {
  const storage = getStorage();
  if (!storage) {
    return { ...DEFAULT_SETTINGS };
  }
  const parsed = tryParseJson(safeGetItem(storage, STORAGE_KEYS.settings));
  if (!isPlainObject(parsed)) {
    return { ...DEFAULT_SETTINGS };
  }
  const durationValue = parsed.duration;
  const ambientSoundValue = parsed.ambientSound;
  const goodnightVoiceValue = parsed.goodnightVoice;

  return {
    duration: isDuration(durationValue) ? durationValue : DEFAULT_SETTINGS.duration,
    ambientSound:
      typeof ambientSoundValue === 'boolean' ? ambientSoundValue : DEFAULT_SETTINGS.ambientSound,
    goodnightVoice:
      typeof goodnightVoiceValue === 'boolean'
        ? goodnightVoiceValue
        : DEFAULT_SETTINGS.goodnightVoice,
  };
};

export const saveGeneratedStory = (story: Story) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  safeSetItem(storage, `${GENERATED_STORY_PREFIX}${story.id}`, JSON.stringify(story));
};

export const getGeneratedStory = (storyId: string): Story | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const parsed = tryParseJson(safeGetItem(storage, `${GENERATED_STORY_PREFIX}${storyId}`));
  return isStory(parsed) ? parsed : null;
};

function isStory(value: unknown): value is Story {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    isStorySource(value.source) &&
    isStoryTopic(value.topic) &&
    Array.isArray(value.pages) &&
    value.pages.every(isStoryPage)
  );
}

function isStoryPage(value: unknown): value is StoryPage {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.pageNumber === 'number' &&
    Number.isInteger(value.pageNumber) &&
    typeof value.text === 'string' &&
    typeof value.imagePrompt === 'string' &&
    typeof value.interactionHint === 'string'
  );
}
