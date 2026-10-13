'use client';

import { Component, type ReactNode } from 'react';

/** Keep the hero usable if the WebGL bundle or a model asset cannot load. */
export class DeviceSceneBoundary extends Component<
  {
    children: ReactNode;
    onError: () => void;
  },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
