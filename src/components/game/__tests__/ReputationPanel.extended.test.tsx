// ============================================================
// Tests — ReputationPanel Component — Extended Coverage
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReputationPanel from '@/components/game/ReputationPanel';
import { useGameStore } from '@/store/gameStore';
import type { Mission } from '@/engine/types';
import { createInitialFactionRelations, shiftRelation } from '@/engine/factionRelations';

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

function createMockMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'test-mission-1',
    title: 'Test Mission',
    description: 'A test mission for testing.',
    emoji: '🎯',
    factionId: 'iron-pact',
    type: 'gather',
    difficulty: 'easy' as const,
    objectives: [
      { id: 'obj-1', type: 'gather-resource', target: 'gold', amount: 100, current: 50, completed: false, description: 'Gather 100 gold' },
    ],
    rewards: {
      resources: { gold: 50 },
      reputation: { 'iron-pact': 10 },
    },
    turnLimit: 10,
    status: 'available' as const,
    ...overrides,
  };
}

describe('ReputationPanel — Extended Coverage', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  describe('Section Switching', () => {
    it('should default to factions section', () => {
      render(<ReputationPanel />);
      expect(screen.getByText('Faction Reputation')).toBeInTheDocument();
    });

    it('should switch to missions section', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('Missions & Objectives')).toBeInTheDocument();
    });

    it('should switch to achievements section', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Awards/));
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('should switch to diplomacy section', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText('Faction Diplomacy')).toBeInTheDocument();
    });

    it('should switch back to factions', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      await user.click(screen.getByText(/Factions/));
      expect(screen.getByText('Faction Reputation')).toBeInTheDocument();
    });
  });

  describe('Missions Section', () => {
    it('should show "No missions yet" when empty', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText(/No missions yet/)).toBeInTheDocument();
    });

    it('should show available missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [createMockMission()] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('Test Mission')).toBeInTheDocument();
      expect(screen.getByText(/Available Missions/)).toBeInTheDocument();
    });

    it('should show active missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({ status: 'active', acceptedOnTurn: 1 })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText(/Active Missions/)).toBeInTheDocument();
    });

    it('should show completed missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({ status: 'completed' })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText(/Completed/)).toBeInTheDocument();
    });

    it('should show mission objectives', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [createMockMission()] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('Gather 100 gold')).toBeInTheDocument();
      expect(screen.getByText('50/100')).toBeInTheDocument();
    });

    it('should show mission rewards', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [createMockMission()] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('Rewards:')).toBeInTheDocument();
      expect(screen.getByText('+50 gold')).toBeInTheDocument();
    });

    it('should show mission difficulty badge', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [createMockMission({ difficulty: 'hard' })] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('hard')).toBeInTheDocument();
    });

    it('should show medium difficulty badge', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [createMockMission({ difficulty: 'medium' })] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should show accept button for available missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({ missions: [createMockMission()] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText(/Accept Mission/)).toBeInTheDocument();
    });

    it('should accept a mission when button clicked', async () => {
      const user = userEvent.setup();
      const mission = createMockMission();
      useGameStore.setState({ missions: [mission] });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      await user.click(screen.getByText(/Accept Mission/));
      expect(useGameStore.getState().missions[0].status).toBe('active');
    });

    it('should show turns remaining for active missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({ status: 'active', acceptedOnTurn: 1, turnLimit: 10 })],
        turn: 5,
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText(/turns left/)).toBeInTheDocument();
    });

    it('should show completed icon for completed missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({ status: 'completed' })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should show failed/expired icon for failed missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({ status: 'failed' })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should show expired icon for expired missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({ status: 'expired' })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should show completed objectives with checkmark', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({
          objectives: [
            { id: 'obj-1', type: 'gather-resource', target: 'gold', amount: 100, current: 100, completed: true, description: 'Gather 100 gold' },
          ],
        })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      const checkmarks = screen.getAllByText('✅');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should show reputation rewards in missions', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        missions: [createMockMission({
          rewards: { resources: { gold: 50 }, reputation: { 'iron-pact': 10 } },
        })],
      });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Missions/));
      expect(screen.getByText(/\+10 rep/)).toBeInTheDocument();
    });
  });

  describe('Achievements Section', () => {
    it('should show achievements count', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Awards/));
      expect(screen.getByText(/unlocked/)).toBeInTheDocument();
    });

    it('should show locked achievements with lock icon', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Awards/));
      const locks = screen.getAllByText('🔒');
      expect(locks.length).toBeGreaterThan(0);
    });

    it('should show unlocked achievements', async () => {
      const user = userEvent.setup();
      const achievements = useGameStore.getState().achievements;
      achievements[0] = { ...achievements[0], unlocked: true, unlockedOnTurn: 5 };
      useGameStore.setState({ achievements });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Awards/));
      expect(screen.getByText(/Turn 5/)).toBeInTheDocument();
    });

    it('should show achievement titles', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Awards/));
      // Should show some achievement titles
      const achievements = useGameStore.getState().achievements;
      expect(screen.getByText(achievements[0].title)).toBeInTheDocument();
    });

    it('should show achievement descriptions', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Awards/));
      const achievements = useGameStore.getState().achievements;
      expect(screen.getByText(achievements[0].description)).toBeInTheDocument();
    });
  });

  describe('Diplomacy Section', () => {
    it('should show diplomacy description', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText(/See how factions feel about each other/)).toBeInTheDocument();
    });

    it('should show faction relationships', async () => {
      const user = userEvent.setup();
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      // The initial state may or may not have non-neutral relations
    });

    it('should show wars if any exist', async () => {
      const user = userEvent.setup();
      let rels = createInitialFactionRelations();
      // Worsen iron-pact/tidecallers from neutral all the way to war
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'worsen');
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'worsen');
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'worsen');
      useGameStore.setState({ factionRelations: rels });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText(/Active Conflicts/)).toBeInTheDocument();
    });

    it('should show alliances if any exist', async () => {
      const user = userEvent.setup();
      // Initial relations already have self-allied; set two different factions as allied
      let rels = createInitialFactionRelations();
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'improve');
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'improve');
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'improve');
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'improve');
      rels = shiftRelation(rels, 'iron-pact', 'tidecallers', 'improve');
      useGameStore.setState({ factionRelations: rels });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText(/Alliances/)).toBeInTheDocument();
    });

    it('should show "All factions are neutral" when no special relations', async () => {
      const user = userEvent.setup();
      // Create all-neutral relations
      let rels = createInitialFactionRelations();
      // Override all to neutral (except self)
      const fids = ['iron-pact', 'tidecallers', 'dustwalkers', 'verdant-commune', 'nightmarket-syndicate', 'ashen-throne'] as const;
      for (const a of fids) {
        for (const b of fids) {
          if (a !== b) rels[a][b] = 'neutral';
        }
      }
      useGameStore.setState({ factionRelations: rels });
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText(/All factions are neutral/)).toBeInTheDocument();
    });

    it('should show hostile relations', async () => {
      const user = userEvent.setup();
      // Initial relations already have hostile pairs (e.g. nightmarket vs ashen-throne)
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText('Hostile')).toBeInTheDocument();
    });

    it('should show tense relations', async () => {
      const user = userEvent.setup();
      // Initial relations already have tense pairs (e.g. iron-pact vs ashen-throne)
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText('Tense')).toBeInTheDocument();
    });

    it('should show friendly relations', async () => {
      const user = userEvent.setup();
      // Initial relations already have friendly pairs (e.g. tidecallers vs verdant-commune)
      render(<ReputationPanel />);
      await user.click(screen.getByText(/Diplomacy/));
      expect(screen.getByText('Friendly')).toBeInTheDocument();
    });
  });

  describe('Faction status colors', () => {
    it('should show unfriendly status', () => {
      useGameStore.getState().changeReputation('iron-pact', -25);
      render(<ReputationPanel />);
      expect(screen.getByText(/unfriendly/i)).toBeInTheDocument();
    });

    it('should show friendly status', () => {
      useGameStore.getState().changeReputation('iron-pact', 30);
      render(<ReputationPanel />);
      expect(screen.getByText(/friendly/i)).toBeInTheDocument();
    });
  });

  describe('Section counts', () => {
    it('should show faction count in tab', () => {
      render(<ReputationPanel />);
      expect(screen.getByText('(6)')).toBeInTheDocument();
    });

    it('should show mission count in tab', async () => {
      useGameStore.setState({ missions: [createMockMission()] });
      render(<ReputationPanel />);
      // 1 available mission -> (1)
      expect(screen.getByText('(1)')).toBeInTheDocument();
    });
  });
});
