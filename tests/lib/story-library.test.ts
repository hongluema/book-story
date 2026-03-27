import { describe, expect, it } from 'vitest';
import { getFeaturedStories, getStoryById } from '../../lib/story-library';

describe('story library', () => {
  it('returns featured stories with required fields', () => {
    const featured = getFeaturedStories();
    expect(featured.length).toBeGreaterThanOrEqual(3);
    const first = featured[0];
    expect(first).toBeDefined();
    expect(first?.id).toBeDefined();
    expect(first?.title).toBeDefined();
    expect(first?.topic).toBeDefined();
  });

  it('provides the rabbit brush-teeth story with correct pages', () => {
    const story = getStoryById('rabbit-brush-teeth');
    expect(story).toBeDefined();
    expect(story?.title).toBe('小兔子刷牙去睡觉');
    expect(story?.pages).toHaveLength(4);
  });

  it('does not let featured results mutate the shared library', () => {
    const featured = getFeaturedStories();
    const first = featured[0];
    expect(first).toBeDefined();
    if (!first) return;

    const originalTitle = first.title;
    first.title = `${originalTitle}（已修改）`;
    first.pages[0].text = '变更了页面内容';

    const freshFeatured = getFeaturedStories();
    const freshFirst = freshFeatured[0];
    expect(freshFirst).toBeDefined();
    expect(freshFirst?.title).toBe(originalTitle);
    expect(freshFirst?.pages[0].text).not.toBe('变更了页面内容');
  });
});
