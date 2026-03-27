import { afterEach, describe, expect, it } from 'vitest';
import {
  getFavorites,
  getRecentStories,
  getSettings,
  saveFavorite,
  saveRecentStory,
  saveSettings,
} from '../../lib/local-storage';

type StorageMock = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const createStorageMock = (): StorageMock => {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
};

const withStorage = (storage: StorageMock, fn: () => void) => {
  const original = globalThis.localStorage;
  globalThis.localStorage = storage as Storage;
  try {
    fn();
  } finally {
    globalThis.localStorage = original;
  }
};

describe('local storage helper', () => {
  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('persists and reads favorites', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      saveFavorite('rabbit-brush-teeth');
      saveFavorite('bear-sings');
      const favorites = getFavorites();
      expect(favorites).toEqual(['rabbit-brush-teeth', 'bear-sings']);
    });
  });

  it('does not duplicate favorites when saving the same story twice', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      saveFavorite('bear-sings');
      saveFavorite('bear-sings');
      expect(getFavorites()).toEqual(['bear-sings']);
    });
  });

  it('returns empty list when favorites storage is missing', () => {
    expect(getFavorites()).toEqual([]);
  });

  it('returns empty favorites when stored data is invalid', () => {
    const storage = createStorageMock();
    storage.setItem('bedtime:favorites', 'not-json');
    withStorage(storage, () => {
      expect(getFavorites()).toEqual([]);
    });
  });

  it('returns empty favorites when stored data parses but is not a string array', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      ['{}', '"x"', '[1]'].forEach((value) => {
        storage.setItem('bedtime:favorites', value);
        expect(getFavorites()).toEqual([]);
      });
    });
  });

  it('records recent stories newest-first and dedupes', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      saveRecentStory('alpha');
      saveRecentStory('beta');
      saveRecentStory('alpha');
      expect(getRecentStories()).toEqual(['alpha', 'beta']);
    });
  });

  it('caps recent stories at 10 entries newest-first', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      Array.from({ length: 12 }, (_, index) => `story-${index}`).forEach(saveRecentStory);
      const recents = getRecentStories();
      expect(recents).toHaveLength(10);
      expect(recents[0]).toBe('story-11');
      expect(recents[9]).toBe('story-2');
    });
  });

  it('defaults to empty recent stories when storage invalid', () => {
    const storage = createStorageMock();
    storage.setItem('bedtime:recents', 'not-json');
    withStorage(storage, () => {
      expect(getRecentStories()).toEqual([]);
    });
  });

  it('returns empty recent stories when stored data parses but is not a string array', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      ['{}', '"x"', '[1]'].forEach((value) => {
        storage.setItem('bedtime:recents', value);
        expect(getRecentStories()).toEqual([]);
      });
    });
  });

  it('saves and loads settings with defaults', () => {
    const storage = createStorageMock();
    withStorage(storage, () => {
      saveSettings({ duration: 'medium', ambientSound: false, goodnightVoice: true });
      expect(getSettings()).toEqual({
        duration: 'medium',
        ambientSound: false,
        goodnightVoice: true,
      });
    });
  });

  it('falls back to default settings when storage missing or corrupt', () => {
    const storage = createStorageMock();
    storage.setItem('bedtime:settings', 'not-a-json');
    withStorage(storage, () => {
      expect(getSettings()).toEqual({
        duration: 'short',
        ambientSound: true,
        goodnightVoice: true,
      });
    });
  });

  it('merges partial settings with defaults when fields are missing', () => {
    const storage = createStorageMock();
    storage.setItem(
      'bedtime:settings',
      JSON.stringify({
        ambientSound: false,
      })
    );
    withStorage(storage, () => {
      expect(getSettings()).toEqual({
        duration: 'short',
        ambientSound: false,
        goodnightVoice: true,
      });
    });
  });

  it('validates and falls back when settings fields have wrong types', () => {
    const storage = createStorageMock();
    storage.setItem(
      'bedtime:settings',
      JSON.stringify({
        duration: 'long',
        ambientSound: 'nope',
        goodnightVoice: 0,
      })
    );
    withStorage(storage, () => {
      expect(getSettings()).toEqual({
        duration: 'short',
        ambientSound: true,
        goodnightVoice: true,
      });
    });
  });

  it('handles storage exceptions gracefully when reading favorites', () => {
    const storage: StorageMock = {
      getItem: () => {
        throw new Error('boom');
      },
      setItem: () => {
        throw new Error('boom');
      },
      removeItem: () => {},
    };
    withStorage(storage, () => {
      expect(getFavorites()).toEqual([]);
      expect(() => saveFavorite('alpha')).not.toThrow();
    });
  });

  it('handles storage exceptions gracefully when reading recent stories', () => {
    const storage: StorageMock = {
      getItem: () => {
        throw new Error('boom');
      },
      setItem: () => {
        throw new Error('boom');
      },
      removeItem: () => {},
    };
    withStorage(storage, () => {
      expect(getRecentStories()).toEqual([]);
      expect(() => saveRecentStory('alpha')).not.toThrow();
    });
  });

  it('handles storage exceptions gracefully for settings', () => {
    const storage: StorageMock = {
      getItem: () => {
        throw new Error('boom');
      },
      setItem: () => {
        throw new Error('boom');
      },
      removeItem: () => {},
    };
    withStorage(storage, () => {
      expect(getSettings()).toEqual({
        duration: 'short',
        ambientSound: true,
        goodnightVoice: true,
      });
      expect(() =>
        saveSettings({
          duration: 'medium',
          ambientSound: false,
          goodnightVoice: true,
        })
      ).not.toThrow();
    });
  });
});
