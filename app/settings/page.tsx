import React from 'react';
import SettingsForm from '../../components/settings/settings-form';

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-starlight">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">家长设置</h1>
          <p className="mt-2 text-sm text-starlight/70">
            通过以下开关可以控制睡前音频和晚安语的默认行为。
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <SettingsForm />
        </section>
      </div>
    </main>
  );
}
