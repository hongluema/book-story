'use client';

import React, { useState } from 'react';

type AmbientKey = 'rain' | 'waves' | 'insects';

const AMBIENT_SOUNDS: { key: AmbientKey; label: string; description: string }[] = [
  {
    key: 'rain',
    label: '雨声',
    description: '窗外倾听细雨轻吻屋檐',
  },
  {
    key: 'waves',
    label: '海浪',
    description: '远处海潮轻拍沙岸',
  },
  {
    key: 'insects',
    label: '虫鸣',
    description: '夏夜虫吟如星点闪烁',
  },
];

export function AmbientSoundToggle() {
  const [selectedSound, setSelectedSound] = useState<AmbientKey | null>(null);

  const handleToggleEnable = () => {
    setSelectedSound((prev) => (prev ? null : AMBIENT_SOUNDS[0].key));
  };

  const isEnabled = Boolean(selectedSound);

  return (
    <div className="rounded-2xl border border-white/10 bg-night/40 p-4 text-sm font-semibold text-starlight">
      <button
        type="button"
        onClick={handleToggleEnable}
        className="flex w-full items-center justify-between text-xs uppercase tracking-[0.3em] text-starlight/60 transition hover:text-starlight"
      >
        <span>白噪音</span>
        <span>{isEnabled ? '开启' : '关闭'}</span>
      </button>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {AMBIENT_SOUNDS.map((sound) => {
          const isActive = selectedSound === sound.key;
          return (
            <button
              key={sound.key}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                setSelectedSound((prev) => (prev === sound.key ? null : sound.key))
              }
              className={`flex h-12 flex-col justify-center rounded-2xl border px-3 transition ${
                isActive
                  ? 'border-starlight bg-starlight/10 text-starlight'
                  : 'border-white/20 bg-transparent text-starlight/80 hover:border-starlight/60'
              }`}
            >
              <span className="text-base font-semibold leading-tight">{sound.label}</span>
              <span className="text-[0.55rem] text-starlight/60">{sound.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
