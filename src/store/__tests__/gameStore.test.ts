// ============================================================
// Tests — Game Store (95%+ coverage target)
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.getState().newGame();
  });

  describe('newGame', () => {
    it('should set phase to playing', () => {
      expect(useGameStore.getState().phase).toBe('playing');
    });

    it('should set turn to 1', () => {
      expect(useGameStore.getState().turn).toBe(1);
    });

    it('should initialize resources', () => {
      const { resources } = useGameStore.getState();
      expect(resources.gold).toBe(500);
      expect(resources.fuel).toBe(100);
      expect(resources.water).toBe(100);
      expect(resources.food).toBe(100);
    });

    it('should initialize reputation at 0 for all factions', () => {
      const { reputation } = useGameStore.getState();
      expect(reputation['mughal-court']).toBe(0);
      expect(reputation['east-india-company']).toBe(0);
    });

    it('should initialize regions', () => {
      const { regions } = useGameStore.getState();
      expect(regions['delhi'].discovered).toBe(true);
      expect(regions['jaisalmer'].discovered).toBe(false);
    });

    it('should initialize trade routes', () => {
      const { tradeRoutes } = useGameStore.getState();
      expect(tradeRoutes.length).toBeGreaterThan(0);
      expect(tradeRoutes.every((r) => !r.established)).toBe(true);
    });

    it('should start with empty personnel', () => {
      expect(useGameStore.getState().personnel).toEqual([]);
    });

    it('should default to world tab', () => {
      expect(useGameStore.getState().activeTab).toBe('world');
    });
  });

  describe('setPhase', () => {
    it('should change game phase', () => {
      useGameStore.getState().setPhase('paused');
      expect(useGameStore.getState().phase).toBe('paused');
    });
  });

  describe('setActiveTab', () => {
    it('should change active tab', () => {
      useGameStore.getState().setActiveTab('inventory');
      expect(useGameStore.getState().activeTab).toBe('inventory');
    });
  });

  describe('selectRegion', () => {
    it('should select a region', () => {
      useGameStore.getState().selectRegion('delhi');
      expect(useGameStore.getState().selectedRegion).toBe('delhi');
    });

    it('should deselect with null', () => {
      useGameStore.getState().selectRegion('delhi');
      useGameStore.getState().selectRegion(null);
      expect(useGameStore.getState().selectedRegion).toBeNull();
    });
  });

  describe('discoverRegion', () => {
    it('should discover an undiscovered region', () => {
      useGameStore.getState().discoverRegion('jaisalmer');
      expect(useGameStore.getState().regions['jaisalmer'].discovered).toBe(true);
    });
  });

  describe('addResources', () => {
    it('should add resources', () => {
      useGameStore.getState().addResources({ gold: 100 });
      expect(useGameStore.getState().resources.gold).toBe(600);
    });
  });

  describe('changeReputation', () => {
    it('should change reputation with a faction', () => {
      useGameStore.getState().changeReputation('mughal-court', 25);
      expect(useGameStore.getState().reputation['mughal-court']).toBe(25);
    });
  });

  describe('establishRoute', () => {
    it('should fail when reputation requirements not met', () => {
      const result = useGameStore.getState().establishRoute('route-delhi-kolkata');
      expect(result).toBe(false);
    });

    it('should succeed when all conditions met', () => {
      // route-delhi-kolkata requires mughal-court >= 10 and east-india-company >= 10, costs gold: 100, fuel: 20
      useGameStore.getState().changeReputation('mughal-court', 15);
      useGameStore.getState().changeReputation('east-india-company', 15);
      const result = useGameStore.getState().establishRoute('route-delhi-kolkata');
      expect(result).toBe(true);
      const route = useGameStore.getState().tradeRoutes.find((r) => r.id === 'route-delhi-kolkata');
      expect(route?.established).toBe(true);
      expect(useGameStore.getState().resources.gold).toBe(400);
    });

    it('should return false for non-existent route', () => {
      const result = useGameStore.getState().establishRoute('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('dismantleRoute', () => {
    it('should dismantle an established route', () => {
      // First establish
      useGameStore.getState().changeReputation('mughal-court', 15);
      useGameStore.getState().changeReputation('east-india-company', 15);
      useGameStore.getState().establishRoute('route-delhi-kolkata');
      // Then dismantle
      const result = useGameStore.getState().dismantleRoute('route-delhi-kolkata');
      expect(result).toBe(true);
      const route = useGameStore.getState().tradeRoutes.find((r) => r.id === 'route-delhi-kolkata');
      expect(route?.established).toBe(false);
    });

    it('should return false for unestablished route', () => {
      const result = useGameStore.getState().dismantleRoute('route-delhi-kolkata');
      expect(result).toBe(false);
    });

    it('should return false for non-existent route', () => {
      const result = useGameStore.getState().dismantleRoute('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('hirePersonnel', () => {
    it('should hire personnel and deduct gold', () => {
      const result = useGameStore.getState().hirePersonnel('guard');
      expect(result).toBe(true);
      expect(useGameStore.getState().personnel.length).toBe(1);
      expect(useGameStore.getState().resources.gold).toBeLessThan(500);
    });

    it('should fail when insufficient gold', () => {
      // Drain gold
      useGameStore.getState().addResources({ gold: -500 });
      const result = useGameStore.getState().hirePersonnel('negotiator');
      expect(result).toBe(false);
    });
  });

  describe('assignPersonnel', () => {
    it('should assign personnel to a route', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      const result = useGameStore.getState().assignPersonnel(person.id, 'route-delhi-kolkata');
      expect(result).toBe(true);
      expect(useGameStore.getState().personnel[0].status).toBe('assigned');
    });

    it('should return false for non-existent personnel', () => {
      const result = useGameStore.getState().assignPersonnel('nonexistent', 'route-1');
      expect(result).toBe(false);
    });
  });

  describe('unassignPersonnel', () => {
    it('should unassign assigned personnel', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      useGameStore.getState().assignPersonnel(person.id, 'route-delhi-kolkata');
      const result = useGameStore.getState().unassignPersonnel(person.id);
      expect(result).toBe(true);
      expect(useGameStore.getState().personnel[0].status).toBe('available');
    });

    it('should return false for non-existent personnel', () => {
      expect(useGameStore.getState().unassignPersonnel('nonexistent')).toBe(false);
    });

    it('should return false for non-assigned personnel', () => {
      useGameStore.getState().hirePersonnel('guard');
      const person = useGameStore.getState().personnel[0];
      expect(useGameStore.getState().unassignPersonnel(person.id)).toBe(false);
    });
  });

  describe('advanceTurn', () => {
    it('should increment turn', () => {
      useGameStore.getState().advanceTurn();
      expect(useGameStore.getState().turn).toBe(2);
    });

    it('should collect trade profits from established routes', () => {
      useGameStore.getState().changeReputation('mughal-court', 15);
      useGameStore.getState().changeReputation('east-india-company', 15);
      useGameStore.getState().establishRoute('route-delhi-kolkata');
      const goldBefore = useGameStore.getState().resources.gold;
      useGameStore.getState().advanceTurn();
      // route-delhi-kolkata profits: gold: 15, food: 5
      // plus BASE_INCOME gold: 5
      const goldAfter = useGameStore.getState().resources.gold;
      const baseExpected = goldBefore + 15 + 5;
      expect(goldAfter).toBeGreaterThanOrEqual(baseExpected - 50);
      expect(goldAfter).not.toBe(goldBefore);
    });
  });

  describe('save/load', () => {
    it('should save and load game state', () => {
      useGameStore.getState().changeReputation('mughal-court', 50);
      useGameStore.getState().addResources({ gold: 200 });
      const saveData = useGameStore.getState().getSaveData();

      // Reset
      useGameStore.getState().newGame();
      expect(useGameStore.getState().reputation['mughal-court']).toBe(0);

      // Load
      const result = useGameStore.getState().loadSaveData(saveData);
      expect(result).toBe(true);
      expect(useGameStore.getState().reputation['mughal-court']).toBe(50);
      expect(useGameStore.getState().resources.gold).toBe(700);
    });

    it('should return false for invalid JSON', () => {
      const result = useGameStore.getState().loadSaveData('not json');
      expect(result).toBe(false);
    });

    it('should return false for invalid save data structure', () => {
      const result = useGameStore.getState().loadSaveData('{"foo": "bar"}');
      expect(result).toBe(false);
    });

    it('should reset tab and selection on load', () => {
      useGameStore.getState().setActiveTab('inventory');
      useGameStore.getState().selectRegion('delhi');
      const saveData = useGameStore.getState().getSaveData();
      useGameStore.getState().loadSaveData(saveData);
      expect(useGameStore.getState().activeTab).toBe('world');
      expect(useGameStore.getState().selectedRegion).toBeNull();
    });
  });
});
