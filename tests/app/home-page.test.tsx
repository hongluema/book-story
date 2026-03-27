import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../../app/page';

describe('home page', () => {
  it('renders the hero copy, topics, and featured stories', () => {
    render(<HomePage />);
    const links = screen.getAllByRole('link');

    expect(screen.getByText('今晚听什么')).toBeDefined();
    const brushingTopics = screen.getAllByText('刷牙');
    expect(brushingTopics.length).toBeGreaterThan(0);
    expect(screen.getByText('最近听过')).toBeDefined();

    expect(
      links.some((link) => link.getAttribute('href') === '/generate?topic=%E5%88%B7%E7%89%99'),
    ).toBe(true);
    expect(
      links.some((link) => link.getAttribute('href') === '/' && link.textContent?.includes('首页')),
    ).toBe(true);
    expect(
      links.some((link) => link.getAttribute('href') === '/library' && link.textContent === '全部'),
    ).toBe(true);
    expect(
      links.some((link) => link.getAttribute('href') === '/story/rabbit-brush-teeth'),
    ).toBe(true);
  });
});
