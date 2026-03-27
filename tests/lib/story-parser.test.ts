import { describe, expect, it } from 'vitest';
import { fallbackStory } from '../../lib/fallback-story';
import { parseGeneratedStory } from '../../lib/story-parser';

const baseStory = {
  id: 'generated-sleep-story',
  title: '小熊轻轻说晚安',
  source: 'generated',
  topic: '睡觉习惯',
  pages: [
    {
      pageNumber: 1,
      text: '小熊在床边，轻轻拉过被角。',
      imagePrompt: '一个小熊在柔软的床上伸展双手',
      interactionHint: '让孩子跟着小熊伸伸手指。',
    },
    {
      pageNumber: 2,
      text: '他低声数星星，数到四就再眨眼。',
      imagePrompt: '星星在窗外闪烁，小熊望着窗户',
      interactionHint: '和孩子一起数星星。',
    },
    {
      pageNumber: 3,
      text: '小熊抱着玩具，听见妈妈轻声唱歌。',
      imagePrompt: '小熊抱着绵羊玩偶，妈妈在旁边唱歌',
      interactionHint: '跟着妈妈轻声哼唱。',
    },
    {
      pageNumber: 4,
      text: '他轻轻说晚安，眼睛慢慢闭上。',
      imagePrompt: '小熊闭眼躺下，月光温柔照亮房间',
      interactionHint: '模仿小熊闭眼，做个深呼吸。',
    },
  ],
};

const validPayload = JSON.stringify(baseStory);

const clonePages = () => baseStory.pages.map((page) => ({ ...page }));

const makeAdditionalPage = (pageNumber: number) => ({
  pageNumber,
  text: `第${pageNumber}页的小熊继续准备睡觉。`,
  imagePrompt: `第${pageNumber}页的柔和色调夜晚场景`,
  interactionHint: '和孩子一起想象这一天的最后一个冒险。',
});

describe('story parser', () => {
  it('parses a valid JSON payload into the generated story', () => {
    const story = parseGeneratedStory(validPayload);
    expect(story.title).toBe('小熊轻轻说晚安');
    expect(story.pages).toHaveLength(4);
  });

  it('parses JSON wrapped in a code fence even when there is noise around it', () => {
    const fencedPayload = ['AI 回复如下：', '```json', validPayload, '```', '谢谢合作。'].join('\n');
    const story = parseGeneratedStory(fencedPayload);
    expect(story.id).toBe('generated-sleep-story');
    expect(story.pages).toHaveLength(4);
  });

  it('returns the fallback story when the payload is invalid', () => {
    const story = parseGeneratedStory('not-json');
    expect(story.source).toBe('fallback');
    expect(story.pages).toHaveLength(4);
    expect(story).toEqual(fallbackStory);
  });

  it('returns the fallback story when there are fewer than four pages', () => {
    const fewPages = clonePages().slice(0, 3);
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, pages: fewPages }));
    expect(story).toEqual(fallbackStory);
  });

  it('returns fallback when a pageNumber is not a finite integer', () => {
    const malformedPages = clonePages();
    malformedPages[1].pageNumber = Infinity;
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, pages: malformedPages }));
    expect(story).toEqual(fallbackStory);
  });

  it('returns fallback when page numbers are not sequential', () => {
    const outOfOrderPages = clonePages();
    outOfOrderPages[2].pageNumber = 4;
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, pages: outOfOrderPages }));
    expect(story).toEqual(fallbackStory);
  });

  it('returns fallback when the topic is unknown', () => {
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, topic: '未知话题' }));
    expect(story).toEqual(fallbackStory);
  });

  it('returns fallback when the source is unknown', () => {
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, source: 'unexpected-source' }));
    expect(story).toEqual(fallbackStory);
  });

  it('returns fallback when there are more than six pages', () => {
    const extraPages = [5, 6, 7].map(makeAdditionalPage);
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, pages: [...clonePages(), ...extraPages] }));
    expect(story).toEqual(fallbackStory);
  });

  it('returns fallback when the source is not generated', () => {
    const story = parseGeneratedStory(JSON.stringify({ ...baseStory, source: 'library' }));
    expect(story).toEqual(fallbackStory);
  });
});
