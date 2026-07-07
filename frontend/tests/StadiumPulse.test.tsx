/**
 * Tests for StadiumPulse.
 * Verifies: renders, aria-hidden="true", does not cause axe violations.
 */
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { StadiumPulse } from '../src/components/StadiumPulse';

describe('StadiumPulse', () => {
  it('renders animated variant without crashing', () => {
    const { container } = render(<StadiumPulse variant="animated" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders static variant without crashing', () => {
    const { container } = render(<StadiumPulse variant="static" worstTier="critical" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('animated variant is aria-hidden (purely decorative)', () => {
    const { container } = render(<StadiumPulse variant="animated" />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el).not.toBeNull();
  });

  it('static variant is aria-hidden (purely decorative)', () => {
    const { container } = render(<StadiumPulse variant="static" />);
    const el = container.querySelector('[aria-hidden="true"]');
    expect(el).not.toBeNull();
  });

  it('passes axe — animated', async () => {
    const { container } = render(<StadiumPulse variant="animated" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe — static', async () => {
    const { container } = render(<StadiumPulse variant="static" worstTier="warning" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
