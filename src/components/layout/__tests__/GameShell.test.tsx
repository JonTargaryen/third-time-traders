// ============================================================
// Tests — GameShell Component
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameShell from '@/components/layout/GameShell';
import { useGameStore } from '@/store/gameStore';

describe('GameShell', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render the header with game title', () => {
    render(<GameShell />);
    expect(screen.getByText(/Third Time Traders/)).toBeInTheDocument();
  });

  it('should show the current turn', () => {
    render(<GameShell />);
    expect(screen.getByText(/Turn 1/)).toBeInTheDocument();
  });

  it('should render the Next Turn button', () => {
    render(<GameShell />);
    expect(screen.getByText(/Next Turn/)).toBeInTheDocument();
  });

  it('should advance turn when Next Turn is clicked', async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByText(/Next Turn/));
    expect(useGameStore.getState().turn).toBe(2);
  });

  it('should render the tab bar', () => {
    render(<GameShell />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should render the world panel by default', () => {
    render(<GameShell />);
    const panel = screen.getByRole('tabpanel');
    expect(panel.id).toBe('panel-world');
  });

  it('should switch to reputation panel', async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByText('Factions'));
    expect(useGameStore.getState().activeTab).toBe('reputation');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-reputation');
    });
  });

  it('should switch to inventory panel', async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByText('Items'));
    expect(useGameStore.getState().activeTab).toBe('inventory');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-inventory');
    });
  });

  it('should switch to events panel', async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByText('Events'));
    expect(useGameStore.getState().activeTab).toBe('events');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-events');
    });
  });
});
