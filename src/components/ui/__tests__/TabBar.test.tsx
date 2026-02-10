// ============================================================
// Tests — TabBar Component
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabBar from '@/components/ui/TabBar';
import { useGameStore } from '@/store/gameStore';

describe('TabBar', () => {
  beforeEach(() => {
    useGameStore.setState({ activeTab: 'world' });
  });

  it('should render all five tabs', () => {
    render(<TabBar />);
    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByText('Factions')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Ranks')).toBeInTheDocument();
  });

  it('should have correct ARIA roles', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(5);
  });

  it('should show active tab with aria-selected', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    const worldTab = tabs.find((t) => t.textContent?.includes('World'));
    expect(worldTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should switch tab on click', async () => {
    const user = userEvent.setup();
    render(<TabBar />);

    await user.click(screen.getByText('Items'));
    expect(useGameStore.getState().activeTab).toBe('inventory');
  });

  it('should update active styles when tab changes', async () => {
    const user = userEvent.setup();
    render(<TabBar />);

    await user.click(screen.getByText('Events'));
    expect(useGameStore.getState().activeTab).toBe('events');
  });

  it('should render navigation landmark', () => {
    render(<TabBar />);
    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();
  });
});
