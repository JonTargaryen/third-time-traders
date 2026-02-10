// ============================================================
// Tests — EventToast Component (comprehensive coverage)
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventToast from '@/components/ui/EventToast';
import { useGameStore } from '@/store/gameStore';
import type { GameEvent } from '@/engine/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, variants, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, variants, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, variants, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function createMockEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'event-1',
    title: 'Test Event',
    description: 'A test event occurred!',
    category: 'natural-disaster',
    severity: 'moderate',
    turn: 1,
    duration: 3,
    expiresOnTurn: 4,
    affectedRegions: ['forge-highlands'],
    affectedFactions: ['iron-pact'],
    resourceDelta: { gold: -10 },
    reputationDelta: {},
    tradeMultiplier: 1.0,
    dismissed: false,
    ...overrides,
  };
}

describe('EventToast', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render nothing when no pending notification', () => {
    const { container } = render(<EventToast />);
    expect(container.innerHTML).toBe('');
  });

  it('should render nothing when no undismissed events', () => {
    useGameStore.setState({ pendingEventNotification: true, events: [] });
    const { container } = render(<EventToast />);
    expect(container.innerHTML).toBe('');
  });

  it('should render nothing when all events are dismissed', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent({ dismissed: true })],
    });
    const { container } = render(<EventToast />);
    expect(container.innerHTML).toBe('');
  });

  it('should show toast for undismissed event with pending notification', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('should show event description', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    expect(screen.getByText('A test event occurred!')).toBeInTheDocument();
  });

  it('should show event severity', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    expect(screen.getByText('moderate')).toBeInTheDocument();
  });

  it('should show dismiss button', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
  });

  it('should dismiss event when X button clicked', async () => {
    const user = userEvent.setup();
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    await user.click(screen.getByLabelText('Dismiss notification'));
    expect(useGameStore.getState().events[0].dismissed).toBe(true);
  });

  it('should show View Events and Dismiss All buttons', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    expect(screen.getByText('View Events')).toBeInTheDocument();
    expect(screen.getByText('Dismiss All')).toBeInTheDocument();
  });

  it('should dismiss all events when Dismiss All clicked', async () => {
    const user = userEvent.setup();
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent(), createMockEvent({ id: 'event-2', title: 'Event 2' })],
    });
    render(<EventToast />);
    await user.click(screen.getByText('Dismiss All'));
    expect(useGameStore.getState().events.every((e) => e.dismissed)).toBe(true);
    expect(useGameStore.getState().pendingEventNotification).toBe(false);
  });

  it('should switch to events tab when View Events clicked', async () => {
    const user = userEvent.setup();
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent()],
    });
    render(<EventToast />);
    await user.click(screen.getByText('View Events'));
    expect(useGameStore.getState().activeTab).toBe('events');
  });

  it('should show "+X more" badge when multiple undismissed events', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [
        createMockEvent({ id: 'e1' }),
        createMockEvent({ id: 'e2', title: 'Second Event' }),
        createMockEvent({ id: 'e3', title: 'Third Event' }),
      ],
    });
    render(<EventToast />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should show outcome text if available', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent({ outcomeText: 'The outcome was great!' })],
    });
    render(<EventToast />);
    expect(screen.getByText('The outcome was great!')).toBeInTheDocument();
  });

  it('should show event choices when available', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent({
        choices: [
          {
            id: 'choice-1',
            label: 'Fight Back',
            description: 'Stand and fight',
            resourceCost: { gold: 10 },
            resourceReward: { gold: 50 },
            reputationDelta: { 'iron-pact': 5 },
            successChance: 0.7,
            successText: 'You won!',
            failureText: 'You lost!',
          },
          {
            id: 'choice-2',
            label: 'Run Away',
            description: 'Flee to safety',
            resourceCost: {},
            resourceReward: {},
            reputationDelta: {},
            successChance: 1.0,
            successText: 'You escaped!',
            failureText: '',
          },
        ],
      })],
    });
    render(<EventToast />);
    expect(screen.getByText('Fight Back')).toBeInTheDocument();
    expect(screen.getByText('Run Away')).toBeInTheDocument();
    expect(screen.getByText('Stand and fight')).toBeInTheDocument();
    expect(screen.getByText('Flee to safety')).toBeInTheDocument();
  });

  it('should show resource cost for choices', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent({
        choices: [
          {
            id: 'choice-1',
            label: 'Pay Tribute',
            description: 'Pay them off',
            resourceCost: { gold: 25 },
            resourceReward: {},
            reputationDelta: {},
            successChance: 1.0,
            successText: 'They accepted.',
            failureText: '',
          },
        ],
      })],
    });
    render(<EventToast />);
    expect(screen.getByText(/25 gold/)).toBeInTheDocument();
  });

  it('should make choice when choice button clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // ensure success
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent({
        choices: [
          {
            id: 'choice-1',
            label: 'Accept',
            description: 'Accept the offer',
            resourceCost: {},
            resourceReward: { gold: 100 },
            reputationDelta: {},
            successChance: 1.0,
            successText: 'Great success!',
            failureText: '',
          },
        ],
      })],
    });
    render(<EventToast />);
    await user.click(screen.getByText('Accept'));
    // Choice should be made
    expect(useGameStore.getState().events[0].choiceMade).toBe('choice-1');
    vi.restoreAllMocks();
  });

  it('should not show choices when choice already made', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [createMockEvent({
        choiceMade: 'choice-1',
        choices: [
          {
            id: 'choice-1',
            label: 'Accept',
            description: 'Accept the offer',
            resourceCost: {},
            resourceReward: {},
            reputationDelta: {},
            successChance: 1.0,
            successText: 'OK',
            failureText: '',
          },
        ],
      })],
    });
    render(<EventToast />);
    // Choices should not be shown because choiceMade is truthy
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
  });

  it('should show the latest undismissed event', () => {
    useGameStore.setState({
      pendingEventNotification: true,
      events: [
        createMockEvent({ id: 'e1', title: 'First Event' }),
        createMockEvent({ id: 'e2', title: 'Second Event' }),
      ],
    });
    render(<EventToast />);
    // Latest = last in array
    expect(screen.getByText('Second Event')).toBeInTheDocument();
  });
});
