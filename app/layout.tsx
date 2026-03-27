import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: '晚安绘本',
  description: '面向 2-3 岁宝宝的中文睡前绘本故事应用。'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-night text-starlight min-h-screen">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 px-6 py-10">
            {children}
          </main>
          <nav className="border-t border-white/10 bg-twilight px-6 py-4 text-sm">
            <ul className="flex justify-between text-starlight/80">
              <li>
                <a href="/stories" className="transition-colors hover:text-starlight">
                  睡前故事
                </a>
              </li>
              <li>
                <a href="/music" className="transition-colors hover:text-starlight">
                  星空配乐
                </a>
              </li>
              <li>
                <a href="/collection" className="transition-colors hover:text-starlight">
                  绘本收藏
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </body>
    </html>
  );
}
