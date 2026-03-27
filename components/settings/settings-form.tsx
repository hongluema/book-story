'use client';

import React, { useState } from 'react';

type SettingKey = 'whiteNoise' | 'bedtimePhrase';

const settingControls: { id: string; key: SettingKey; label: string; description: string }[] = [
  {
    id: 'white-noise-default',
    key: 'whiteNoise',
    label: '白噪音默认开启',
    description: '进入故事或音乐播放页时自动附带柔和白噪音。'
  },
  {
    id: 'bedtime-phrase-default',
    key: 'bedtimePhrase',
    label: '晚安语默认开启',
    description: '在结束播放时为孩子播报晚安语句。'
  }
];

export default function SettingsForm() {
  const [toggles, setToggles] = useState<Record<SettingKey, boolean>>({
    whiteNoise: true,
    bedtimePhrase: true
  });

  const toggle = (key: SettingKey) => {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <form className="space-y-5">
      <fieldset className="space-y-4" aria-label="家长设置开关">
        {settingControls.map((setting) => (
          <label
            key={setting.id}
            htmlFor={setting.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-night/30 px-4 py-3"
          >
            <div className="space-y-1 text-sm">
              <span className="font-semibold">{setting.label}</span>
              <p className="text-xs text-starlight/60">{setting.description}</p>
            </div>
            <input
              type="checkbox"
              id={setting.id}
              checked={toggles[setting.key]}
              onChange={() => toggle(setting.key)}
              className="h-6 w-11 cursor-pointer appearance-none rounded-full border border-white/10 bg-white/10 transition-[background] checked:bg-emerald-400"
            />
          </label>
        ))}
      </fieldset>
    </form>
  );
}
