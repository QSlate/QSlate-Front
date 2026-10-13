// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeviceShowcase } from '../DeviceShowcase';

const scene = vi.hoisted(() => ({
  callbacks: {} as { onReady: () => void; onUnavailable: () => void },
}));

vi.mock('next/dynamic', () => ({
  default: () => (props: typeof scene.callbacks) => {
    scene.callbacks = props;
    return null;
  },
}));

afterEach(cleanup);

const intro = createElement('h1', null, 'Research with QSlate');
const showcase = () => createElement(DeviceShowcase, { intro, theme: 'dark' });

describe('DeviceShowcase loading', () => {
  it('server-renders the title, placeholder and full scroll space before the 3D bundle loads', () => {
    const html = renderToString(showcase());
    expect(html).toContain('Research with QSlate');
    expect(html).toContain('Loading device preview');
    expect(html).toContain('h-[190svh]');
    expect(html).not.toContain('QSlate dashboard preview');
  });

  it('keeps the same section and heading when the scene becomes ready', () => {
    const { container } = render(showcase());
    const section = container.firstElementChild;
    const heading = screen.getByRole('heading');
    expect(screen.queryByRole('status')).not.toBeNull();

    act(() => scene.callbacks.onReady());

    expect(screen.queryByRole('status')).toBeNull();
    expect(container.firstElementChild).toBe(section);
    expect(section?.className).toContain('h-[190svh]');
    expect(screen.getByRole('heading')).toBe(heading);
  });

  it('replaces the placeholder with an image without replacing the section when 3D is unavailable', () => {
    const { container } = render(showcase());
    const section = container.firstElementChild;

    act(() => scene.callbacks.onUnavailable());

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByAltText('QSlate dashboard preview')).not.toBeNull();
    expect(screen.getByRole('heading').textContent).toBe(
      'Research with QSlate'
    );
    expect(container.firstElementChild).toBe(section);
  });
});
