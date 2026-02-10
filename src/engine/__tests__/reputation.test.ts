// ============================================================
// Tests — Reputation Engine (95%+ coverage target)
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createStartingReputation,
  clampReputation,
  changeReputation,
  changeMultipleReputations,
  isFactionHostile,
  isFactionAllied,
  getRelationshipStatus,
  getHostileFactions,
  getAlliedFactions,
  meetsReputationRequirements,
} from '@/engine/reputation';
import type { ReputationMap, FactionId } from '@/engine/types';
import { REPUTATION_MIN, REPUTATION_MAX, ALL_FACTION_IDS } from '@/engine/types';

describe('Reputation Engine', () => {
  describe('createStartingReputation', () => {
    it('should initialize all factions at 0', () => {
      const rep = createStartingReputation();
      for (const id of ALL_FACTION_IDS) {
        expect(rep[id]).toBe(0);
      }
    });

    it('should have an entry for every faction', () => {
      const rep = createStartingReputation();
      expect(Object.keys(rep).length).toBe(ALL_FACTION_IDS.length);
    });
  });

  describe('clampReputation', () => {
    it('should clamp values above maximum', () => {
      expect(clampReputation(150)).toBe(REPUTATION_MAX);
    });

    it('should clamp values below minimum', () => {
      expect(clampReputation(-150)).toBe(REPUTATION_MIN);
    });

    it('should not clamp values in range', () => {
      expect(clampReputation(50)).toBe(50);
      expect(clampReputation(-50)).toBe(-50);
      expect(clampReputation(0)).toBe(0);
    });

    it('should handle boundary values', () => {
      expect(clampReputation(REPUTATION_MAX)).toBe(REPUTATION_MAX);
      expect(clampReputation(REPUTATION_MIN)).toBe(REPUTATION_MIN);
    });
  });

  describe('changeReputation', () => {
    it('should increase reputation', () => {
      const rep = createStartingReputation();
      const result = changeReputation(rep, 'mughal-court', 25);
      expect(result['mughal-court']).toBe(25);
    });

    it('should decrease reputation', () => {
      const rep = createStartingReputation();
      const result = changeReputation(rep, 'mughal-court', -15);
      expect(result['mughal-court']).toBe(-15);
    });

    it('should clamp at max', () => {
      const rep = createStartingReputation();
      const result = changeReputation(rep, 'mughal-court', 200);
      expect(result['mughal-court']).toBe(REPUTATION_MAX);
    });

    it('should clamp at min', () => {
      const rep = createStartingReputation();
      const result = changeReputation(rep, 'mughal-court', -200);
      expect(result['mughal-court']).toBe(REPUTATION_MIN);
    });

    it('should not mutate original', () => {
      const rep = createStartingReputation();
      changeReputation(rep, 'mughal-court', 50);
      expect(rep['mughal-court']).toBe(0);
    });

    it('should only change the specified faction', () => {
      const rep = createStartingReputation();
      const result = changeReputation(rep, 'mughal-court', 50);
      expect(result['east-india-company']).toBe(0);
      expect(result['rajput-clans']).toBe(0);
    });
  });

  describe('changeMultipleReputations', () => {
    it('should change multiple factions at once', () => {
      const rep = createStartingReputation();
      const result = changeMultipleReputations(rep, {
        'mughal-court': 20,
        'east-india-company': -10,
      });
      expect(result['mughal-court']).toBe(20);
      expect(result['east-india-company']).toBe(-10);
      expect(result['rajput-clans']).toBe(0);
    });

    it('should handle empty changes', () => {
      const rep = createStartingReputation();
      const result = changeMultipleReputations(rep, {});
      expect(result).toEqual(rep);
    });

    it('should skip entries with undefined delta values', () => {
      const rep = createStartingReputation();
      const changes: Partial<Record<FactionId, number>> = {
        'mughal-court': 20,
        'east-india-company': undefined,
      };
      const result = changeMultipleReputations(rep, changes);
      expect(result['mughal-court']).toBe(20);
      expect(result['east-india-company']).toBe(0); // unchanged
    });
  });

  describe('isFactionHostile', () => {
    it('should return true when below hostility threshold', () => {
      // Mughal Court threshold is -30
      const rep = createStartingReputation();
      const hostile = changeReputation(rep, 'mughal-court', -50);
      expect(isFactionHostile(hostile, 'mughal-court')).toBe(true);
    });

    it('should return false when at threshold', () => {
      const rep = createStartingReputation();
      const atThreshold = changeReputation(rep, 'mughal-court', -30);
      expect(isFactionHostile(atThreshold, 'mughal-court')).toBe(false);
    });

    it('should return false when above threshold', () => {
      const rep = createStartingReputation();
      expect(isFactionHostile(rep, 'mughal-court')).toBe(false);
    });

    it('should return false for unknown faction', () => {
      const rep = createStartingReputation();
      expect(isFactionHostile(rep, 'nonexistent' as FactionId)).toBe(false);
    });
  });

  describe('isFactionAllied', () => {
    it('should return true when at or above ally threshold', () => {
      // Mughal Court ally threshold is 65
      const rep = createStartingReputation();
      const allied = changeReputation(rep, 'mughal-court', 65);
      expect(isFactionAllied(allied, 'mughal-court')).toBe(true);
    });

    it('should return false when below ally threshold', () => {
      const rep = createStartingReputation();
      const notAllied = changeReputation(rep, 'mughal-court', 64);
      expect(isFactionAllied(notAllied, 'mughal-court')).toBe(false);
    });

    it('should return false for unknown faction', () => {
      const rep = createStartingReputation();
      expect(isFactionAllied(rep, 'nonexistent' as FactionId)).toBe(false);
    });
  });

  describe('getRelationshipStatus', () => {
    let rep: ReputationMap;
    beforeEach(() => { rep = createStartingReputation(); });

    it('should return hostile when below hostility threshold', () => {
      const r = changeReputation(rep, 'mughal-court', -50);
      expect(getRelationshipStatus(r, 'mughal-court')).toBe('hostile');
    });

    it('should return allied when at or above ally threshold', () => {
      const r = changeReputation(rep, 'mughal-court', 65);
      expect(getRelationshipStatus(r, 'mughal-court')).toBe('allied');
    });

    it('should return unfriendly when below -10 but not hostile', () => {
      const r = changeReputation(rep, 'mughal-court', -15);
      expect(getRelationshipStatus(r, 'mughal-court')).toBe('unfriendly');
    });

    it('should return friendly when >= 30 but not allied', () => {
      const r = changeReputation(rep, 'mughal-court', 40);
      expect(getRelationshipStatus(r, 'mughal-court')).toBe('friendly');
    });

    it('should return neutral for values between -10 and 30', () => {
      expect(getRelationshipStatus(rep, 'mughal-court')).toBe('neutral');
      const r = changeReputation(rep, 'mughal-court', 15);
      expect(getRelationshipStatus(r, 'mughal-court')).toBe('neutral');
    });
  });

  describe('getHostileFactions', () => {
    it('should return empty array when no factions are hostile', () => {
      const rep = createStartingReputation();
      expect(getHostileFactions(rep)).toEqual([]);
    });

    it('should return hostile factions', () => {
      let rep = createStartingReputation();
      rep = changeReputation(rep, 'mughal-court', -50);
      rep = changeReputation(rep, 'rajput-clans', -50);
      const hostile = getHostileFactions(rep);
      expect(hostile).toContain('mughal-court');
      expect(hostile).toContain('rajput-clans');
      expect(hostile.length).toBe(2);
    });
  });

  describe('getAlliedFactions', () => {
    it('should return empty array when no factions are allied', () => {
      const rep = createStartingReputation();
      expect(getAlliedFactions(rep)).toEqual([]);
    });

    it('should return allied factions', () => {
      let rep = createStartingReputation();
      rep = changeReputation(rep, 'nightmarket-syndicate', 50); // threshold 45
      const allied = getAlliedFactions(rep);
      expect(allied).toContain('nightmarket-syndicate');
    });
  });

  describe('meetsReputationRequirements', () => {
    it('should return true when all requirements are met', () => {
      let rep = createStartingReputation();
      rep = changeReputation(rep, 'mughal-court', 20);
      rep = changeReputation(rep, 'east-india-company', 15);
      expect(meetsReputationRequirements(rep, [
        { factionId: 'mughal-court', minimum: 10 },
        { factionId: 'east-india-company', minimum: 10 },
      ])).toBe(true);
    });

    it('should return false when any requirement is not met', () => {
      const rep = createStartingReputation();
      expect(meetsReputationRequirements(rep, [
        { factionId: 'mughal-court', minimum: 10 },
      ])).toBe(false);
    });

    it('should return true for empty requirements', () => {
      const rep = createStartingReputation();
      expect(meetsReputationRequirements(rep, [])).toBe(true);
    });

    it('should handle exact threshold', () => {
      let rep = createStartingReputation();
      rep = changeReputation(rep, 'mughal-court', 10);
      expect(meetsReputationRequirements(rep, [
        { factionId: 'mughal-court', minimum: 10 },
      ])).toBe(true);
    });
  });
});
