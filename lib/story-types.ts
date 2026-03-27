export type StoryTopic = '刷牙' | '分享' | '勇敢' | '睡觉习惯';
export type StorySource = 'library' | 'generated' | 'fallback';

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  interactionHint: string;
}

export interface Story {
  id: string;
  title: string;
  source: StorySource;
  topic: StoryTopic;
  pages: StoryPage[];
}
