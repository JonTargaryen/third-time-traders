/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Tests — TradePanel Component
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TradePanel from '@/components/game/TradePanel';
import { useGameStore } from '@/store/gameStore';

describe('TradePanel', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render the header', () => {
    render(<TradePanel />);
    expect(screen.getByText('Trade Routes')).toBeInTheDocument();
  });

  it('should show route count summary', () => {
    render(<TradePanel />);
    const routes = useGameStore.getState().tradeRoutes;
    expect(screen.getByText(`Active routes: 0 / ${routes.length}`)).toBeInTheDocument();
  });

  it('should render all trade routes', () => {
    render(<TradePanel />);
    expect(screen.getByText(/Delhi ↔ Kolkata/)).toBeInTheDocument();
  });

  it('should show route costs', () => {
    render(<TradePanel />);
    // route-forge-coast costs gold: 100, fuel: 20
    expect(screen.getAllByText(/gold: 100/).length).toBeGreaterThan(0);
  });

  it('should show requirements not met button when conditions not met', () => {
    render(<TradePanel />);
    const buttons = screen.getAllByText('Requirements not met');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should enable establish button when conditions are met', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    render(<TradePanel />);
    expect(screen.getByText('Establish Route')).toBeInTheDocument();
  });

  it('should establish route when clicked', async () => {
    const user = userEvent.setup();
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    render(<TradePanel />);
    await user.click(screen.getByText('Establish Route'));
    const route = useGameStore.getState().tradeRoutes.find((r) => r.id === 'route-delhi-kolkata');
    expect(route?.established).toBe(true);
  });

  it('should show dismantle button for established routes', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    useGameStore.getState().establishRoute('route-delhi-kolkata');
    render(<TradePanel />);
    expect(screen.getByText(/Dismantle Route/)).toBeInTheDocument();
  });

  it('should show Active badge for established routes', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    useGameStore.getState().establishRoute('route-delhi-kolkata');
    render(<TradePanel />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render ad banner', () => {
    render(<TradePanel />);
    expect(screen.getByText('Ad Space — top')).toBeInTheDocument();
  });

  it('should show profit per turn when routes established', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    useGameStore.getState().establishRoute('route-delhi-kolkata');
    render(<TradePanel />);
    expect(screen.getByText(/Earning per turn/)).toBeInTheDocument();
  });

  it('should show reputation check marks', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    render(<TradePanel />);
    expect(screen.getAllByText(/✓/).length).toBeGreaterThan(0);
  });

  it('should show reputation cross marks for unmet requirements', () => {
    render(<TradePanel />);
    expect(screen.getAllByText(/✗/).length).toBeGreaterThan(0);
  });

  it('should show warning reasons', () => {
    render(<TradePanel />);
    expect(screen.getAllByText(/⚠/).length).toBeGreaterThan(0);
  });

  it('should dismantle an established route when dismantle button clicked', async () => {
    const user = userEvent.setup();
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    useGameStore.getState().establishRoute('route-delhi-kolkata');
    render(<TradePanel />);
    await user.click(screen.getByText(/Dismantle Route/));
    const route = useGameStore.getState().tradeRoutes.find((r) => r.id === 'route-delhi-kolkata');
    expect(route?.established).toBe(false);
  });

  it('should show cost to establish for unestablished routes', () => {
    render(<TradePanel />);
    expect(screen.getAllByText(/Cost to establish/).length).toBeGreaterThan(0);
  });

  it('should show "Established" label for established route cost section', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    useGameStore.getState().establishRoute('route-delhi-kolkata');
    render(<TradePanel />);
    expect(screen.getByText('Established')).toBeInTheDocument();
  });

  it('should show region name fallback for routes with unknown regions', () => {
    // Add a fake route with unknown region IDs
    const state = useGameStore.getState();
    useGameStore.setState({
      tradeRoutes: [
        ...state.tradeRoutes,
        {
          id: 'fake-route',
          from: 'unknown-from' as any,
          to: 'unknown-to' as any,
          established: false,
          costToEstablish: { gold: 10 },
          requiredReputation: [],
          profitPerTurn: { gold: 1 },
        },
      ],
    });
    render(<TradePanel />);
    expect(screen.getByText(/unknown-from ↔ unknown-to/)).toBeInTheDocument();
  });
});
