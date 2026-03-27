import React from 'react';
import Link from 'next/link';

const navLinks = [
  { label: '首页', href: '/', detail: '晚安' },
  { label: '生成', href: '/generate', detail: '主题' },
  { label: '收藏', href: '/library', detail: '故事' },
  { label: '设置', href: '/settings', detail: '家长' },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-night/90 px-4 py-3 backdrop-blur md:px-6"
      aria-label="底部导航"
    >
      <ul className="mx-auto flex max-w-3xl items-center justify-between">
        {navLinks.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="flex flex-col items-center text-center text-[0.65rem] uppercase tracking-[0.35em] text-starlight/70 transition hover:text-starlight"
            >
              <span className="text-sm font-semibold">{link.label}</span>
              <span className="text-[0.55rem] uppercase tracking-[0.25em] text-starlight/40">{link.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
