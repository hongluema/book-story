import type { StoryTopic } from './story-types';

export interface StoryPromptInput {
  topic: StoryTopic;
  customPrompt?: string;
}

export function buildStoryPrompt({ topic, customPrompt }: StoryPromptInput): string {
  const instructions = [
    '请用中文、温柔的语气创作一个适合 2-3 岁宝宝睡前阅读的短篇故事。',
    '情节应当低刺激、节奏缓慢，并通过重复短句带来安全感。',
    '本体裁控制在 4-6 页，让讲述顺畅且有呼吸感。',
    `主题围绕“${topic}”，强调睡前建立良好习惯。`,
    '最终输出必须严格是 JSON，不要附加额外解释。',
    'JSON 构造为对象，字段包括 id、title、source、topic、pages。',
    'pages 字段是数组，且每页都提供 pageNumber、text、imagePrompt、interactionHint。',
    'source 固定写 "generated"，topic 保持与输入一致，interactionHint 指导孩子温柔互动或深呼吸。',
  ];

  const basePrompt = instructions.join(' ');
  return customPrompt ? `${basePrompt} ${customPrompt}` : basePrompt;
}
