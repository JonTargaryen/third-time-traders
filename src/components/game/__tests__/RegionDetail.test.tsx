/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Tests — RegionDetail Component
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegionDetail from '@/components/game/RegionDetail';
import { useGameStore } from '@/store/gameStore';

describe('RegionDetail', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render nothing when no region selected', () => {
    const { container } = render(<RegionDetail />);
    expect(container.innerHTML).toBe('');
  });

  it('should render region name when selected', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText('Forge Highlands')).toBeInTheDocument();
  });

  it('should render faction name', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText('The Iron Pact')).toBeInTheDocument();
  });

  it('should render region description', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText(/Volcanic mountains/)).toBeInTheDocument();
  });

  it('should show reputation status', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText(/neutral/i)).toBeInTheDocument();
  });

  it('should show available resources', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText(/fuel: 40/)).toBeInTheDocument();
  });

  it('should show trade routes count', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText(/Trade Routes/)).toBeInTheDocument();
  });

  it('should close when close button clicked', async () => {
    const user = userEvent.setup();
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    await user.click(screen.getByLabelText('Close'));
    expect(useGameStore.getState().selectedRegion).toBeNull();
  });

  it('should show discover buttons for adjacent undiscovered regions', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    // forge-highlands is adjacent to amber-wastes (undiscovered)
    expect(screen.getByText(/Discover Amber Wastes/)).toBeInTheDocument();
  });

  it('should discover region when discover button clicked', async () => {
    const user = userEvent.setup();
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    await user.click(screen.getByText(/Discover Amber Wastes/));
    expect(useGameStore.getState().regions['amber-wastes'].discovered).toBe(true);
  });

  it('should show route status for each route', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getAllByText('Not established').length).toBeGreaterThan(0);
  });

  it('should not show discover section when no adjacent undiscovered regions exist', () => {
    // Discover all regions adjacent to forge-highlands
    useGameStore.getState().discoverRegion('amber-wastes');
    // shattered-coast and obsidian-citadel are already discovered
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.queryByText(/^Explore$/)).not.toBeInTheDocument();
  });

  it('should show Active text for established routes', () => {
    useGameStore.getState().changeReputation('iron-pact', 15);
    useGameStore.getState().changeReputation('tidecallers', 15);
    useGameStore.getState().establishRoute('route-forge-coast');
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render nothing for invalid region', () => {
    useGameStore.setState({ selectedRegion: 'nonexistent' as any });
    const { container } = render(<RegionDetail />);
    expect(container.innerHTML).toBe('');
  });

  it('should not show resources section when region has no resources', () => {
    // Modify the region to have empty resources
    const state = useGameStore.getState();
    useGameStore.setState({
      regions: {
        ...state.regions,
        'forge-highlands': {
          ...state.regions['forge-highlands'],
          resources: {},
        },
      },
      selectedRegion: 'forge-highlands',
    });
    render(<RegionDetail />);
    expect(screen.queryByText('Available Resources')).not.toBeInTheDocument();
  });

  it('should fallback to region id when region name is not available for discover button', () => {
    // Set up a region with an adjacent ID that doesn't exist in the regions map
    const state = useGameStore.getState();
    useGameStore.setState({
      regions: {
        ...state.regions,
        'forge-highlands': {
          ...state.regions['forge-highlands'],
          adjacentRegions: ['amber-wastes', 'fake-region' as any],
        },
      },
      selectedRegion: 'forge-highlands',
    });
    render(<RegionDetail />);
    // fake-region doesn't exist in regions, so fallback to the id
    expect(screen.getByText(/Discover fake-region/)).toBeInTheDocument();
  });

  it('should fallback to region id in trade routes when other region is unknown', () => {
    // Add a fake trade route referencing an unknown region
    const state = useGameStore.getState();
    useGameStore.setState({
      tradeRoutes: [
        ...state.tradeRoutes,
        {
          id: 'route-fake',
          from: 'forge-highlands',
          to: 'unknown-region' as any,
          established: false,
          costToEstablish: { gold: 10 },
          requiredReputation: [],
          profitPerTurn: { gold: 1 },
        },
      ],
      selectedRegion: 'forge-highlands',
    });
    render(<RegionDetail />);
    // The "other region" is unknown-region, which isn't in regions map → fallback to id
    expect(screen.getByText(/unknown-region/)).toBeInTheDocument();
  });

  it('should display the other region name in trade route list using fallback', () => {
    // Test the otherRegion?.name || otherRegionId fallback (line 97-103 in RegionDetail)
    useGameStore.getState().selectRegion('forge-highlands');
    render(<RegionDetail />);
    // Should show route destinations
    expect(screen.getByText(/Shattered Coast/)).toBeInTheDocument();
  });
});
