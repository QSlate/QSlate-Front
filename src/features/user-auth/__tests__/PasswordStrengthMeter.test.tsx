// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  evaluatePassword,
  PasswordStrengthMeter,
} from '../ui/PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  afterEach(() => {
    cleanup();
  });

  it('correctly evaluates password requirements', () => {
    // Too short (<12)
    const short = evaluatePassword('Pass1!');
    expect(short.criteria.min12).toBe(false);
    expect(short.label).toBe('Min 12 chars required');

    // Meets 12 chars, upper, lower, number, special
    const strong = evaluatePassword('Correct-Horse-Battery-Staple-2026!');
    expect(strong.criteria.min12).toBe(true);
    expect(strong.criteria.hasUpper).toBe(true);
    expect(strong.criteria.hasLower).toBe(true);
    expect(strong.criteria.hasNumber).toBe(true);
    expect(strong.criteria.hasSpecial).toBe(true);
    expect(strong.label).toBe('Institutional Grade');
  });

  it('renders strength meter and criteria in DOM', () => {
    render(<PasswordStrengthMeter password="superSecret123!" />);

    expect(screen.getByText(/Entropy & Strength/i)).toBeDefined();
    expect(
      screen.getByText(/At least 12 characters \(max 72\)/i)
    ).toBeDefined();
    expect(screen.getByText(/Uppercase letter/i)).toBeDefined();
  });
});
