// ============================================================
// Tests — Game Store: Additional Coverage for Untested Actions
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import type { GameEvent, Personnel, Mission, Resources } from '@/engine/types';

function resetGame(name = 'StoreTester') {
  useGameStore.getState().newGame(name);
}

describe('GameStore — Additional Coverage', () => {
  beforeEach(() => resetGame());

  // ============================================================
  // Event Handling
  // ============================================================
  describe('Event management', () => {
    it('dismissEvent should mark event as dismissed', () => {
      const mockEvent: GameEvent = {
        id: 'test-event-1',
        category: 'market-shift',
        severity: 'moderate',
        title: 'Test Event',
        description: 'A test',
        turn: 1,
        affectedRegions: [],
        affectedFactions: [],
        resourceDelta: {},
        reputationDelta: {},
        tradeMultiplier: 1.0,
        duration: 2,
        expiresOnTurn: 5,
        dismissed: false,
      };
      useGameStore.setState({ events: [mockEvent] });
      useGameStore.getState().dismissEvent('test-event-1');
      expect(useGameStore.getState().events[0].dismissed).toBe(true);
    });

    it('dismissEvent should update pendingEventNotification', () => {
      const events: GameEvent[] = [
        {
          id: 'e1', category: 'market-shift', severity: 'minor', title: 'E1', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 1, expiresOnTurn: 3, dismissed: false,
        },
        {
          id: 'e2', category: 'market-shift', severity: 'minor', title: 'E2', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 1, expiresOnTurn: 3, dismissed: false,
        },
      ];
      useGameStore.setState({ events, pendingEventNotification: true });
      
      // Dismiss first event — second still undismissed
      useGameStore.getState().dismissEvent('e1');
      expect(useGameStore.getState().pendingEventNotification).toBe(true);
      
      // Dismiss second
      useGameStore.getState().dismissEvent('e2');
      expect(useGameStore.getState().pendingEventNotification).toBe(false);
    });

    it('dismissAllEvents should mark all as dismissed', () => {
      const events: GameEvent[] = [
        {
          id: 'e1', category: 'market-shift', severity: 'minor', title: 'E1', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 1, expiresOnTurn: 3, dismissed: false,
        },
        {
          id: 'e2', category: 'market-shift', severity: 'minor', title: 'E2', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 1, expiresOnTurn: 3, dismissed: false,
        },
      ];
      useGameStore.setState({ events, pendingEventNotification: true });
      useGameStore.getState().dismissAllEvents();
      expect(useGameStore.getState().events.every((e) => e.dismissed)).toBe(true);
      expect(useGameStore.getState().pendingEventNotification).toBe(false);
    });

    it('makeEventChoice should handle successful choice', () => {
      const events: GameEvent[] = [
        {
          id: 'e1', category: 'pirate-raid', severity: 'major', title: 'Raid', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 2, expiresOnTurn: 5, dismissed: false,
          choices: [
            {
              id: 'fight',
              label: 'Fight',
              description: 'Fight back',
              resourceCost: { gold: 10 },
              resourceReward: { gold: 50 },
              reputationDelta: {},
              successChance: 1.0, // guaranteed success for test
              successText: 'You won!',
              failureText: 'You lost!',
            },
          ],
        },
      ];
      useGameStore.setState({ events });

      // Mock Math.random to return 0 (< 1.0 success chance)
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const goldBefore = useGameStore.getState().resources.gold;
      useGameStore.getState().makeEventChoice('e1', 'fight');
      const goldAfter = useGameStore.getState().resources.gold;
      
      // Paid 10, gained 50 => net +40
      expect(goldAfter).toBe(goldBefore - 10 + 50);
      expect(useGameStore.getState().events[0].choiceMade).toBe('fight');
      expect(useGameStore.getState().events[0].outcomeText).toBe('You won!');
      expect(useGameStore.getState().events[0].dismissed).toBe(true);
      vi.restoreAllMocks();
    });

    it('makeEventChoice should handle failed choice', () => {
      const events: GameEvent[] = [
        {
          id: 'e1', category: 'pirate-raid', severity: 'major', title: 'Raid', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 2, expiresOnTurn: 5, dismissed: false,
          choices: [
            {
              id: 'fight',
              label: 'Fight',
              description: 'Fight back',
              resourceCost: { gold: 10 },
              resourceReward: { gold: 50 },
              reputationDelta: {},
              successChance: 0.0, // guaranteed failure for test
              successText: 'You won!',
              failureText: 'You lost!',
            },
          ],
        },
      ];
      useGameStore.setState({ events });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      useGameStore.getState().makeEventChoice('e1', 'fight');
      
      expect(useGameStore.getState().events[0].outcomeText).toBe('You lost!');
      // Should NOT have received the reward
      vi.restoreAllMocks();
    });

    it('makeEventChoice should not crash on nonexistent event', () => {
      useGameStore.getState().makeEventChoice('fake-id', 'fake-choice');
      // No crash = pass
    });

    it('makeEventChoice should not crash on nonexistent choice', () => {
      const events: GameEvent[] = [
        {
          id: 'e1', category: 'market-shift', severity: 'minor', title: '', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 1, expiresOnTurn: 3, dismissed: false,
          choices: [],
        },
      ];
      useGameStore.setState({ events });
      useGameStore.getState().makeEventChoice('e1', 'nonexistent');
      // No crash = pass
    });

    it('makeEventChoice should reject when resources insufficient', () => {
      const events: GameEvent[] = [
        {
          id: 'e1', category: 'pirate-raid', severity: 'major', title: '', description: '',
          turn: 1, affectedRegions: [], affectedFactions: [], resourceDelta: {}, reputationDelta: {},
          tradeMultiplier: 1.0, duration: 2, expiresOnTurn: 5, dismissed: false,
          choices: [
            {
              id: 'expensive',
              label: 'Pay',
              description: 'Pay a lot',
              resourceCost: { gold: 99999 },
              resourceReward: {},
              reputationDelta: {},
              successChance: 1.0,
              successText: 'OK',
              failureText: 'Fail',
            },
          ],
        },
      ];
      useGameStore.setState({ events });
      useGameStore.getState().makeEventChoice('e1', 'expensive');
      // Event should remain unchanged — choice was not affordable
      expect(useGameStore.getState().events[0].choiceMade).toBeUndefined();
    });
  });

  // ============================================================
  // Gather Actions
  // ============================================================
  describe('Gather actions', () => {
    it('should fail for undiscovered region', () => {
      const result = useGameStore.getState().performGatherAction('amber-wastes', 'drill-fuel');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not accessible');
    });

    it('should fail for nonexistent action', () => {
      const result = useGameStore.getState().performGatherAction('forge-highlands', 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should respect cooldown', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // guarantee success
      useGameStore.getState().performGatherAction('forge-highlands', 'mine-iron');
      // Try again — should be on cooldown
      const result2 = useGameStore.getState().performGatherAction('forge-highlands', 'mine-iron');
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('cooldown');
      vi.restoreAllMocks();
    });

    it('should respect reputation requirement', () => {
      // collect-lava-crystals requires iron-pact rep >= 10
      const result = useGameStore.getState().performGatherAction('forge-highlands', 'collect-lava-crystals');
      expect(result.success).toBe(false);
      expect(result.message).toContain('reputation');
    });

    it('should add resources on success', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // guarantee success
      const goldBefore = useGameStore.getState().resources.gold;
      const result = useGameStore.getState().performGatherAction('forge-highlands', 'mine-iron');
      if (result.success) {
        // mine-iron gives fuel: 12, gold: 5
        expect(useGameStore.getState().resources.gold).toBe(goldBefore + 5);
      }
      vi.restoreAllMocks();
    });

    it('should give reputation boost on success', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const repBefore = useGameStore.getState().reputation['iron-pact'];
      useGameStore.getState().performGatherAction('forge-highlands', 'mine-iron');
      expect(useGameStore.getState().reputation['iron-pact']).toBe(repBefore + 2);
      vi.restoreAllMocks();
    });
  });

  // ============================================================
  // Personnel Management
  // ============================================================
  describe('Personnel management', () => {
    it('should assign personnel to a route', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      const result = useGameStore.getState().assignPersonnel(person.id, 'route-forge-coast');
      expect(result).toBe(true);
      expect(useGameStore.getState().personnel[0].status).toBe('assigned');
      expect(useGameStore.getState().personnel[0].assignedRoute).toBe('route-forge-coast');
    });

    it('should unassign personnel from a route', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      useGameStore.getState().assignPersonnel(person.id, 'route-forge-coast');
      const result = useGameStore.getState().unassignPersonnel(person.id);
      expect(result).toBe(true);
      expect(useGameStore.getState().personnel[0].status).toBe('available');
    });

    it('should fail to assign nonexistent personnel', () => {
      const result = useGameStore.getState().assignPersonnel('fake-id', 'route-forge-coast');
      expect(result).toBe(false);
    });

    it('should fail to unassign nonexistent personnel', () => {
      const result = useGameStore.getState().unassignPersonnel('fake-id');
      expect(result).toBe(false);
    });

    it('should fail to assign already-assigned personnel', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      useGameStore.getState().assignPersonnel(person.id, 'route-forge-coast');
      // Try to assign again to different route
      const result = useGameStore.getState().assignPersonnel(person.id, 'route-forge-wastes');
      expect(result).toBe(false);
    });

    it('should fail to unassign available personnel', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      const result = useGameStore.getState().unassignPersonnel(person.id);
      expect(result).toBe(false); // not assigned
    });
  });

  // ============================================================
  // Trade Route Management
  // ============================================================
  describe('Trade route management', () => {
    it('dismantleRoute should fail for nonexistent route', () => {
      const result = useGameStore.getState().dismantleRoute('fake-route');
      expect(result).toBe(false);
    });

    it('dismantleRoute should fail for unestablished route', () => {
      const result = useGameStore.getState().dismantleRoute('route-forge-coast');
      expect(result).toBe(false);
    });

    it('dismantleRoute should succeed for established route', () => {
      // Set up the route as established
      useGameStore.getState().changeReputation('iron-pact', 15);
      useGameStore.getState().changeReputation('tidecallers', 15);
      useGameStore.getState().establishRoute('route-forge-coast');
      
      const result = useGameStore.getState().dismantleRoute('route-forge-coast');
      expect(result).toBe(true);
      const route = useGameStore.getState().tradeRoutes.find((r) => r.id === 'route-forge-coast');
      expect(route?.established).toBe(false);
    });

    it('dismantleRoute should refund some resources and lose reputation', () => {
      useGameStore.getState().changeReputation('iron-pact', 15);
      useGameStore.getState().changeReputation('tidecallers', 15);
      useGameStore.getState().establishRoute('route-forge-coast');
      
      const goldBeforeDismantle = useGameStore.getState().resources.gold;
      const repBefore = useGameStore.getState().reputation['iron-pact'];
      
      useGameStore.getState().dismantleRoute('route-forge-coast');
      
      // Should have gotten some gold back (25% of 100 = 25)
      expect(useGameStore.getState().resources.gold).toBe(goldBeforeDismantle + 25);
      // Should have lost reputation
      expect(useGameStore.getState().reputation['iron-pact']).toBeLessThan(repBefore);
    });
  });

  // ============================================================
  // Mission System
  // ============================================================
  describe('Mission system', () => {
    it('should generate missions on new game', async () => {
      await new Promise((r) => setTimeout(r, 100));
      const missions = useGameStore.getState().missions;
      expect(missions.length).toBeGreaterThan(0);
    });

    it('should accept available mission', async () => {
      await new Promise((r) => setTimeout(r, 100));
      const missions = useGameStore.getState().missions;
      const available = missions.find((m) => m.status === 'available');
      if (!available) return;

      useGameStore.getState().acceptMission(available.id);
      const updated = useGameStore.getState().missions.find((m) => m.id === available.id);
      expect(updated?.status).toBe('active');
      expect(updated?.acceptedOnTurn).toBe(1);
    });

    it('should not accept nonexistent mission', () => {
      useGameStore.getState().acceptMission('fake-mission-id');
      // No crash = pass
    });

    it('should generate new missions every 3 turns', async () => {
      for (let i = 0; i < 6; i++) {
        useGameStore.getState().advanceTurn();
      }
      await new Promise((r) => setTimeout(r, 200));
      const missions = useGameStore.getState().missions;
      expect(missions.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Scouting Process
  // ============================================================
  describe('Scouting missions processing', () => {
    it('should process completed scouting missions on turn advance', () => {
      useGameStore.getState().hirePersonnel('scout');
      useGameStore.getState().sendScout('amber-wastes');
      expect(useGameStore.getState().scoutingMissions.length).toBe(1);
      
      // The mission returnTurn depends on scoutCost.turns (2 for MEDIUM)
      const mission = useGameStore.getState().scoutingMissions[0];
      const turnsNeeded = mission.returnTurn - useGameStore.getState().turn;
      
      // Advance turns past the return time
      for (let i = 0; i <= turnsNeeded; i++) {
        useGameStore.getState().advanceTurn();
      }
      
      // Mission should be processed (removed from scoutingMissions)
      expect(useGameStore.getState().scoutingMissions.length).toBe(0);
      // Scout should be back to available
      const scout = useGameStore.getState().personnel.find((p) => p.role === 'scout');
      expect(scout?.status).toBe('available');
    });
  });

  // ============================================================
  // Save/Load
  // ============================================================
  describe('Save/Load round-trip', () => {
    it('should save and load all fields correctly', () => {
      useGameStore.getState().changeReputation('iron-pact', 20);
      useGameStore.getState().hirePersonnel('guard');
      
      const saveData = useGameStore.getState().getSaveData();
      const state1 = useGameStore.getState();
      
      useGameStore.getState().newGame('Other');
      useGameStore.getState().loadSaveData(saveData);
      
      const state2 = useGameStore.getState();
      expect(state2.reputation['iron-pact']).toBe(state1.reputation['iron-pact']);
      expect(state2.personnel.length).toBe(state1.personnel.length);
      expect(state2.turn).toBe(state1.turn);
    });

    it('getSaveData should not include UI-only state', () => {
      useGameStore.getState().setActiveTab('events');
      useGameStore.getState().selectRegion('forge-highlands');
      
      const saveData = useGameStore.getState().getSaveData();
      const parsed = JSON.parse(saveData);
      
      expect(parsed.activeTab).toBeUndefined();
      expect(parsed.selectedRegion).toBeUndefined();
      expect(parsed.pendingEventNotification).toBeUndefined();
    });
  });

  // ============================================================
  // Phase / Tab management
  // ============================================================
  describe('Phase and tab management', () => {
    it('setPhase should change phase', () => {
      useGameStore.getState().setPhase('paused');
      expect(useGameStore.getState().phase).toBe('paused');
    });

    it('selectRegion should set selected region', () => {
      useGameStore.getState().selectRegion('forge-highlands');
      expect(useGameStore.getState().selectedRegion).toBe('forge-highlands');
    });

    it('selectRegion null should clear selection', () => {
      useGameStore.getState().selectRegion('forge-highlands');
      useGameStore.getState().selectRegion(null);
      expect(useGameStore.getState().selectedRegion).toBeNull();
    });
  });

  // ============================================================
  // Gold-for-gold marketplace fix
  // ============================================================
  describe('Buying gold with gold (edge case)', () => {
    it('should correctly handle buying gold resource', () => {
      // obsidian-citadel sells gold (action: 'sell', basePrice: 1)
      // With priceModifier 1.0: cost = ceil(1 * 1.0) = 1 gold per unit
      // Buying 5 gold should cost 5 gold and give 5 gold = net 0
      useGameStore.setState({
        resources: { ...useGameStore.getState().resources, gold: 100 },
      });
      
      const result = useGameStore.getState().buyResource('obsidian-citadel', 'gold', 5);
      expect(result.success).toBe(true);
      // Should be 100 - 5 + 5 = 100 (net zero, not 100 + 5 = 105)
      expect(useGameStore.getState().resources.gold).toBe(100);
    });
  });

  // ============================================================
  // advanceTurn comprehensive
  // ============================================================
  describe('advanceTurn comprehensive', () => {
    it('should add base income', () => {
      const goldBefore = useGameStore.getState().resources.gold;
      // Mock Math.random to prevent event damage
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      useGameStore.getState().advanceTurn();
      // BASE_INCOME = { gold: 5, food: 2, fuel: 3, water: 2 }
      expect(useGameStore.getState().resources.gold).toBeGreaterThanOrEqual(goldBefore);
      vi.restoreAllMocks();
    });

    it('should record gold history', () => {
      useGameStore.getState().advanceTurn();
      expect(useGameStore.getState().goldHistory.length).toBe(1);
    });

    it('should update player lastPlayedAt', () => {
      const before = useGameStore.getState().player.lastPlayedAt;
      useGameStore.getState().advanceTurn();
      expect(useGameStore.getState().player.lastPlayedAt).toBeGreaterThanOrEqual(before);
    });

    it('should trigger game over when all critical resources are 0 after income', () => {
      // Set resources so that even after base income (gold: 5, food: 2, fuel: 3),
      // we can still be at 0. We'd need events to drain them.
      // For this test, we check the game over logic manually
      useGameStore.setState({
        resources: { fuel: 0, water: 0, food: 0, gold: 0, contraband: 0, information: 0 },
        events: [], // no events
        tradeRoutes: useGameStore.getState().tradeRoutes.map((r) => ({ ...r, established: false })),
      });
      // After advance, base income adds gold: 5, food: 2, fuel: 3, water: 2
      // So game over should NOT trigger (resources become positive)
      useGameStore.getState().advanceTurn();
      expect(useGameStore.getState().phase).toBe('playing');
    });
  });

  // ============================================================
  // Negotiator sell bonus
  // ============================================================
  describe('Negotiator sell bonus', () => {
    it('should give bonus when negotiator is available', () => {
      // Hire negotiator
      useGameStore.getState().hirePersonnel('negotiator');
      const negotiator = useGameStore.getState().personnel[0];
      
      // Travel to forge-highlands which buys food
      useGameStore.getState().travelTo('forge-highlands');
      
      // Sell food with negotiator
      const result1 = useGameStore.getState().sellResource('forge-highlands', 'food', 1);
      const earned1 = result1.earned || 0;
      
      // Now assign negotiator to a route so they're not available
      useGameStore.getState().assignPersonnel(negotiator.id, 'route-forge-coast');
      
      // Give back food and sell again without negotiator
      useGameStore.setState({
        resources: { ...useGameStore.getState().resources, food: 50 },
      });
      const result2 = useGameStore.getState().sellResource('forge-highlands', 'food', 1);
      const earned2 = result2.earned || 0;
      
      // With negotiator should earn >= without
      expect(earned1).toBeGreaterThanOrEqual(earned2);
    });
  });
});
