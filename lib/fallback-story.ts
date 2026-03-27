import type { Story } from './story-types';

export const fallbackStory: Story = {
  id: 'fallback-sleep-story',
  title: '软软的晚安',
  source: 'fallback',
  topic: '睡觉习惯',
  pages: [
    {
      pageNumber: 1,
      text: '小熊慢慢躺下，柔软的被子等着他。',
      imagePrompt: '小熊躺在温暖的床上，被子和枕头轻轻包裹着',
      interactionHint: '跟孩子一起深吸一口气，想像被子像云朵。',
    },
    {
      pageNumber: 2,
      text: '他听见妈妈轻声说：“晚安，我的小宝贝。”',
      imagePrompt: '妈妈在床边微笑，小熊微闭眼睛听着',
      interactionHint: '让孩子模仿小熊，轻轻闭眼张嘴说晚安。',
    },
    {
      pageNumber: 3,
      text: '床头的月光悄悄来拜访，小熊数着它的光。',
      imagePrompt: '月光从窗外洒进来，照亮睡觉的小熊',
      interactionHint: '和孩子一起数月光落下的次数。',
    },
    {
      pageNumber: 4,
      text: '他又说了一声晚安，眼睛慢慢睡着。',
      imagePrompt: '小熊安静地睡着，周围有小星星陪伴',
      interactionHint: '轻柔地拍宝宝的背，让他听见自己的呼吸。',
    },
  ],
};
