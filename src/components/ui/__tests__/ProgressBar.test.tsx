// ============================================================
// Tests — ProgressBar Component
// ============================================================
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '@/components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('should render label', () => {
    render(<ProgressBar value={50} max={100} label="Health" />);
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('should render value when showValue is true', () => {
    render(<ProgressBar value={50} max={100} label="Health" showValue />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should hide value when showValue is false', () => {
    render(<ProgressBar value={50} max={100} label="Health" showValue={false} />);
    expect(screen.queryByText('50')).not.toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<ProgressBar value={50} max={100} min={-100} label="Rep" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '-100');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should handle zero range', () => {
    render(<ProgressBar value={0} max={0} min={0} label="Empty" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should clamp percentage to 0-100', () => {
    render(<ProgressBar value={200} max={100} label="Over" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle negative values with min', () => {
    render(<ProgressBar value={-50} max={100} min={-100} label="Neg" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
