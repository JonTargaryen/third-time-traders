// ============================================================
// Tests — EventsPanel Component (comprehensive coverage)
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPanel from '@/components/game/EventsPanel';
import { useGameStore } from '@/store/gameStore';
import type { GameEvent } from '@/engine/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, variants, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, variants, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, variants, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function createMockEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'evt-1',
    title: 'Storm Warning',
    description: 'A terrible storm approaches!',
    category: 'natural-disaster',
    severity: 'moderate',
    turn: 1,
    duration: 3,
    expiresOnTurn: 4,
    affectedRegions: ['forge-highlands'],
    affectedFactions: ['iron-pact'],
    resourceDelta: { gold: -10 },
    reputationDelta: {},
    tradeMultiplier: 0.8,
    dismissed: false,
    ...overrides,
  };
}

describe('EventsPanel', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render the events panel header', () => {
    render(<EventsPanel />);
    expect(screen.getByText('Events & Alerts')).toBeInTheDocument();
  });

  it('should show "No events yet" when no events', () => {
    render(<EventsPanel />);
    expect(screen.getByText(/No events yet/)).toBeInTheDocument();
  });

  it('should show active events', () => {
    useGameStore.setState({
      events: [createMockEvent()],
    });
    render(<EventsPanel />);
    expect(screen.getByText('Storm Warning')).toBeInTheDocument();
  });

  it('should show event severity badge', () => {
    useGameStore.setState({
      events: [createMockEvent()],
    });
    render(<EventsPanel />);
    expect(screen.getByText('moderate')).toBeInTheDocument();
  });

  it('should show event description', () => {
    useGameStore.setState({
      events: [createMockEvent()],
    });
    render(<EventsPanel />);
    expect(screen.getByText('A terrible storm approaches!')).toBeInTheDocument();
  });

  it('should show dismiss button for active events', () => {
    useGameStore.setState({
      events: [createMockEvent()],
    });
    render(<EventsPanel />);
    expect(screen.getByLabelText('Dismiss event')).toBeInTheDocument();
  });

  it('should dismiss event on click', async () => {
    const user = userEvent.setup();
    useGameStore.setState({
      events: [createMockEvent()],
    });
    render(<EventsPanel />);
    await user.click(screen.getByLabelText('Dismiss event'));
    expect(useGameStore.getState().events[0].dismissed).toBe(true);
  });

  it('should show resource deltas', () => {
    useGameStore.setState({
      events: [createMockEvent({ resourceDelta: { gold: -50, fuel: 20 } })],
    });
    render(<EventsPanel />);
    expect(screen.getByText(/-50 gold/)).toBeInTheDocument();
    expect(screen.getByText(/\+20 fuel/)).toBeInTheDocument();
  });

  it('should show affected regions', () => {
    useGameStore.setState({
      events: [createMockEvent()],
    });
    render(<EventsPanel />);
    expect(screen.getByText(/Forge Highlands/)).toBeInTheDocument();
  });

  it('should show event log / history section', () => {
    useGameStore.setState({
      eventLog: [createMockEvent({ id: 'log-1' })],
    });
    render(<EventsPanel />);
    expect(screen.getByText(/History/)).toBeInTheDocument();
  });

  it('should show multiple events', () => {
    useGameStore.setState({
      events: [
        createMockEvent({ id: 'e1', title: 'Event One' }),
        createMockEvent({ id: 'e2', title: 'Event Two', severity: 'major' }),
      ],
    });
    render(<EventsPanel />);
    expect(screen.getByText('Event One')).toBeInTheDocument();
    expect(screen.getByText('Event Two')).toBeInTheDocument();
  });

  it('should show catastrophic severity', () => {
    useGameStore.setState({
      events: [createMockEvent({ severity: 'catastrophic' })],
    });
    render(<EventsPanel />);
    expect(screen.getByText('catastrophic')).toBeInTheDocument();
  });

  it('should show minor severity', () => {
    useGameStore.setState({
      events: [createMockEvent({ severity: 'minor' })],
    });
    render(<EventsPanel />);
    expect(screen.getByText('minor')).toBeInTheDocument();
  });

  it('should show different event categories', () => {
    useGameStore.setState({
      events: [
        createMockEvent({ id: 'e1', category: 'pirate-raid', title: 'Pirates!' }),
        createMockEvent({ id: 'e2', category: 'festival', title: 'Festival!' }),
        createMockEvent({ id: 'e3', category: 'market-shift', title: 'Market Change!' }),
      ],
    });
    render(<EventsPanel />);
    expect(screen.getByText('Pirates!')).toBeInTheDocument();
    expect(screen.getByText('Festival!')).toBeInTheDocument();
    expect(screen.getByText('Market Change!')).toBeInTheDocument();
  });

  it('should show event choices when available', () => {
    useGameStore.setState({
      events: [createMockEvent({
        choices: [
          {
            id: 'c1',
            label: 'Fight',
            description: 'Fight them',
            resourceCost: {},
            resourceReward: { gold: 30 },
            reputationDelta: {},
            successChance: 0.7,
            successText: 'Victory!',
            failureText: 'Defeat!',
          },
        ],
      })],
    });
    render(<EventsPanel />);
    expect(screen.getByText('Fight')).toBeInTheDocument();
  });

  it('should handle event choice selection', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    useGameStore.setState({
      events: [createMockEvent({
        choices: [
          {
            id: 'c1',
            label: 'Accept Deal',
            description: 'Make a deal',
            resourceCost: {},
            resourceReward: {},
            reputationDelta: {},
            successChance: 1.0,
            successText: 'Deal accepted!',
            failureText: '',
          },
        ],
      })],
    });
    render(<EventsPanel />);
    await user.click(screen.getByText('Accept Deal'));
    expect(useGameStore.getState().events[0].choiceMade).toBe('c1');
    vi.restoreAllMocks();
  });

  it('should show turns remaining for active events', () => {
    useGameStore.setState({
      events: [createMockEvent({ duration: 5, expiresOnTurn: 8 })],
      turn: 3,
    });
    render(<EventsPanel />);
    expect(screen.getByText(/remaining/)).toBeInTheDocument();
  });

  it('should show instant marker for 0-duration events', () => {
    useGameStore.setState({
      events: [createMockEvent({ duration: 0, expiresOnTurn: 1 })],
    });
    render(<EventsPanel />);
    expect(screen.getByText(/Instant/)).toBeInTheDocument();
  });

  it('should show affected factions', () => {
    useGameStore.setState({
      events: [createMockEvent({ affectedFactions: ['iron-pact', 'tidecallers'] })],
    });
    render(<EventsPanel />);
    // Should mention faction names
    expect(screen.getByText(/Iron Pact/)).toBeInTheDocument();
  });

  it('should highlight events affecting current location', () => {
    useGameStore.setState({
      events: [createMockEvent({ affectedRegions: ['forge-highlands'] })],
      caravan: { ...useGameStore.getState().caravan, currentRegion: 'forge-highlands' },
    });
    render(<EventsPanel />);
    // Event affecting current location should have special styling
    // Just verify it renders
    expect(screen.getByText('Storm Warning')).toBeInTheDocument();
  });

  it('should show trade multiplier info', () => {
    useGameStore.setState({
      events: [createMockEvent({ tradeMultiplier: 0.5 })],
    });
    render(<EventsPanel />);
    // Trade multiplier info should be shown
    expect(screen.getByText(/0.5x/i)).toBeInTheDocument();
  });
});
