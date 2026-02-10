// ============================================================
// Tests — ReputationPanel Component
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReputationPanel from '@/components/game/ReputationPanel';
import { useGameStore } from '@/store/gameStore';

describe('ReputationPanel', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render the header', () => {
    render(<ReputationPanel />);
    expect(screen.getByText('Faction Reputation')).toBeInTheDocument();
  });

  it('should render all 6 factions', () => {
    render(<ReputationPanel />);
    expect(screen.getAllByText(/The Iron Pact/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Tidecallers/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Dustwalkers/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/The Verdant Commune/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Nightmarket Syndicate/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/The Ashen Throne/).length).toBeGreaterThanOrEqual(1);
  });

  it('should show neutral status for all factions initially', () => {
    render(<ReputationPanel />);
    const neutralBadges = screen.getAllByText(/neutral/i);
    expect(neutralBadges.length).toBe(6);
  });

  it('should render reputation tips', () => {
    render(<ReputationPanel />);
    expect(screen.getAllByText(/How to gain reputation/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should show progress bars', () => {
    render(<ReputationPanel />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBe(6);
  });

  it('should reflect reputation changes', () => {
    useGameStore.getState().changeReputation('iron-pact', 60);
    render(<ReputationPanel />);
    expect(screen.getByText(/allied/i)).toBeInTheDocument();
  });

  it('should show hostile status for negative reputation', () => {
    useGameStore.getState().changeReputation('iron-pact', -50);
    render(<ReputationPanel />);
    expect(screen.getByText(/hostile/i)).toBeInTheDocument();
  });
});
