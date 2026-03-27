import React from 'react';
import { render, screen } from '@testing-library/react';
import LibraryPage from '../../app/library/page';
import SettingsPage from '../../app/settings/page';

describe('library and settings pages', () => {
  it('renders 收藏 和 最近听过 sections', () => {
    render(<LibraryPage />);
    expect(screen.getByText('收藏')).toBeDefined();
    expect(screen.getByText('最近听过')).toBeDefined();
  });

  it('renders 白噪音默认开启 and 晚安语默认开启 toggles', () => {
    render(<SettingsPage />);
    expect(screen.getByText('白噪音默认开启')).toBeDefined();
    expect(screen.getByText('晚安语默认开启')).toBeDefined();
  });
});
