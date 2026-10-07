import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from '../components/Sparkline';

describe('Sparkline', () => {
  it('renders an svg polyline for valid data', () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5, 4]} />);
    expect(container.querySelector('polyline')).toBeTruthy();
  });

  it('renders empty div for insufficient data', () => {
    const { container } = render(<Sparkline data={[1]} />);
    expect(container.querySelector('polyline')).toBeNull();
  });
});
