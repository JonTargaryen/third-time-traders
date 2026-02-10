// ============================================================
// Tests — AdBanner Component
// ============================================================
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdBanner from '@/components/ui/AdBanner';

describe('AdBanner', () => {
  it('should render with slot label', () => {
    render(<AdBanner slot="top" />);
    expect(screen.getByText('Ad Space — top')).toBeInTheDocument();
  });

  it('should render bottom slot', () => {
    render(<AdBanner slot="bottom" />);
    expect(screen.getByText('Ad Space — bottom')).toBeInTheDocument();
  });

  it('should render interstitial slot', () => {
    render(<AdBanner slot="interstitial" />);
    expect(screen.getByText('Ad Space — interstitial')).toBeInTheDocument();
  });

  it('should have data-ad-slot attribute', () => {
    const { container } = render(<AdBanner slot="top" />);
    const el = container.querySelector('[data-ad-slot="top"]');
    expect(el).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<AdBanner slot="top" className="custom-class" />);
    const el = container.querySelector('[data-ad-slot="top"]');
    expect(el?.className).toContain('custom-class');
  });
});
