import React from 'react';
import StoryPlayer from '../../../components/story/story-player';
import { getStoryById } from '../../../lib/story-library';
import { fallbackStory } from '../../../lib/fallback-story';

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = getStoryById(id) ?? fallbackStory;

  return <StoryPlayer story={story} requestedStoryId={id} />;
}
