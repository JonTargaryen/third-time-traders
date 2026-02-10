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
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getByText('Delhi')).toBeInTheDocument();
  });

  it('should render faction name', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getByText('The Mughal Court')).toBeInTheDocument();
  });

  it('should render region description', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getByText(/seat of the Mughal Empire/)).toBeInTheDocument();
  });

  it('should show reputation status', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getByText(/neutral/i)).toBeInTheDocument();
  });

  it('should show available resources', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getByText(/gold: 50/)).toBeInTheDocument();
  });

  it('should show trade routes count', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getByText(/Trade Routes/)).toBeInTheDocument();
  });

  it('should close when close button clicked', async () => {
    const user = userEvent.setup();
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    await user.click(screen.getByLabelText('Close'));
    expect(useGameStore.getState().selectedRegion).toBeNull();
  });

  it('should show discover buttons for adjacent undiscovered regions', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    // delhi is adjacent to jaisalmer (undiscovered)
    expect(screen.getByText(/Discover Jaisalmer/)).toBeInTheDocument();
  });

  it('should discover region when discover button clicked', async () => {
    const user = userEvent.setup();
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    await user.click(screen.getByText(/Discover Jaisalmer/));
    expect(useGameStore.getState().regions['jaisalmer'].discovered).toBe(true);
  });

  it('should show route status for each route', () => {
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.getAllByText('Not established').length).toBeGreaterThan(0);
  });

  it('should not show discover section when no adjacent undiscovered regions exist', () => {
    // Discover all regions adjacent to delhi
    useGameStore.getState().discoverRegion('jaisalmer');
    useGameStore.getState().discoverRegion('varanasi');
    // kolkata and hyderabad are already discovered
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    expect(screen.queryByText(/^Explore$/)).not.toBeInTheDocument();
  });

  it('should show Active text for established routes', () => {
    useGameStore.getState().changeReputation('mughal-court', 15);
    useGameStore.getState().changeReputation('east-india-company', 15);
    useGameStore.getState().establishRoute('route-delhi-kolkata');
    useGameStore.getState().selectRegion('delhi');
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
        'delhi': {
          ...state.regions['delhi'],
          resources: {},
        },
      },
      selectedRegion: 'delhi',
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
        'delhi': {
          ...state.regions['delhi'],
          adjacentRegions: ['jaisalmer', 'fake-region' as any],
        },
      },
      selectedRegion: 'delhi',
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
          from: 'delhi',
          to: 'unknown-region' as any,
          established: false,
          costToEstablish: { gold: 10 },
          requiredReputation: [],
          profitPerTurn: { gold: 1 },
        },
      ],
      selectedRegion: 'delhi',
    });
    render(<RegionDetail />);
    // The "other region" is unknown-region, which isn't in regions map → fallback to id
    expect(screen.getByText(/unknown-region/)).toBeInTheDocument();
  });

  it('should display the other region name in trade route list using fallback', () => {
    // Test the otherRegion?.name || otherRegionId fallback (line 97-103 in RegionDetail)
    useGameStore.getState().selectRegion('delhi');
    render(<RegionDetail />);
    // Should show route destinations
    expect(screen.getByText(/Kolkata/)).toBeInTheDocument();
  });
});
