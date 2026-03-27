import React from 'react';

const favoriteStories = [
  { title: '星空音乐故事集', note: '自 3 月 5 日起收藏' },
  { title: '雨声陪伴入眠', note: '收藏于 2 月 21 日' },
  { title: '轻柔梦境篇', note: '收藏于 1 月 30 日' }
];

const recentListens = [
  { title: '兔兔刷牙冒险', note: '刚刚播放' },
  { title: '晚安小火车', note: '昨天 21:10' },
  { title: '月亮守护者', note: '3 天前' }
];

export default function LibraryPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-starlight">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">收藏与最近听过</h1>
          <p className="mt-2 text-sm text-starlight/70">
            在这里可以快速找回孩子最爱的故事和刚刚播放过的内容。
          </p>
        </div>

        <section aria-labelledby="favorites-title" className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 id="favorites-title" className="text-2xl font-semibold">
              收藏
            </h2>
            <span className="text-xs text-starlight/60">共 {favoriteStories.length} 个故事</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {favoriteStories.map((story) => (
              <article
                key={story.title}
                className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-5"
              >
                <strong className="text-lg">{story.title}</strong>
                <p className="text-xs text-starlight/60">{story.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-listens-title" className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 id="recent-listens-title" className="text-2xl font-semibold">
              最近听过
            </h2>
            <span className="text-xs text-starlight/60">更新于 10 分钟内</span>
          </div>
          <div className="space-y-3">
            {recentListens.map((story) => (
              <article
                key={story.title}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-night/50 px-4 py-3"
              >
                <div>
                  <strong className="text-base">{story.title}</strong>
                  <p className="text-xs text-starlight/60">{story.note}</p>
                </div>
                <span className="text-xs text-starlight/60">播放中</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
