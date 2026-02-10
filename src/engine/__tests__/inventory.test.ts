// ============================================================
// Tests — Inventory Engine (95%+ coverage target)
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createEmptyResources,
  createStartingResources,
  addResources,
  removeResources,
  hasResources,
  totalResourceValue,
  getLowResources,
  transferResources,
} from '@/engine/inventory';
import type { Resources } from '@/engine/types';

describe('Inventory Engine', () => {
  describe('createEmptyResources', () => {
    it('should return all resources at 0', () => {
      const res = createEmptyResources();
      expect(res).toEqual({ fuel: 0, water: 0, food: 0, gold: 0, contraband: 0, information: 0 });
    });
  });

  describe('createStartingResources', () => {
    it('should return correct starting values', () => {
      const res = createStartingResources();
      expect(res.fuel).toBe(100);
      expect(res.water).toBe(100);
      expect(res.food).toBe(100);
      expect(res.gold).toBe(500);
      expect(res.contraband).toBe(0);
      expect(res.information).toBe(0);
    });
  });

  describe('addResources', () => {
    it('should add partial resources to current', () => {
      const current = createEmptyResources();
      const result = addResources(current, { gold: 100, fuel: 50 });
      expect(result.gold).toBe(100);
      expect(result.fuel).toBe(50);
      expect(result.water).toBe(0); // unchanged
    });

    it('should not mutate the original', () => {
      const current = createEmptyResources();
      addResources(current, { gold: 100 });
      expect(current.gold).toBe(0);
    });

    it('should clamp negative results to 0 when adding negative values', () => {
      const current: Resources = { fuel: 5, water: 10, food: 10, gold: 10, contraband: 0, information: 0 };
      const result = addResources(current, { fuel: -20 });
      expect(result.fuel).toBe(0);
    });

    it('should handle adding zero', () => {
      const current = createStartingResources();
      const result = addResources(current, { gold: 0 });
      expect(result.gold).toBe(500);
    });

    it('should handle empty partial', () => {
      const current = createStartingResources();
      const result = addResources(current, {});
      expect(result).toEqual(current);
    });
  });

  describe('removeResources', () => {
    it('should remove resources and return new inventory', () => {
      const current = createStartingResources();
      const result = removeResources(current, { gold: 100 });
      expect(result).not.toBeNull();
      expect(result!.gold).toBe(400);
    });

    it('should return null if insufficient resources', () => {
      const current = createStartingResources();
      const result = removeResources(current, { gold: 1000 });
      expect(result).toBeNull();
    });

    it('should not mutate the original', () => {
      const current = createStartingResources();
      removeResources(current, { gold: 100 });
      expect(current.gold).toBe(500);
    });

    it('should remove exactly to zero', () => {
      const current = createStartingResources();
      const result = removeResources(current, { gold: 500 });
      expect(result).not.toBeNull();
      expect(result!.gold).toBe(0);
    });

    it('should handle multiple resources', () => {
      const current = createStartingResources();
      const result = removeResources(current, { gold: 50, fuel: 30, water: 20 });
      expect(result).not.toBeNull();
      expect(result!.gold).toBe(450);
      expect(result!.fuel).toBe(70);
      expect(result!.water).toBe(80);
    });

    it('should return null if any single resource is insufficient', () => {
      const current = createStartingResources();
      const result = removeResources(current, { gold: 50, fuel: 200 });
      expect(result).toBeNull();
    });

    it('should handle empty partial', () => {
      const current = createStartingResources();
      const result = removeResources(current, {});
      expect(result).toEqual(current);
    });
  });

  describe('hasResources', () => {
    it('should return true when all required resources are available', () => {
      const current = createStartingResources();
      expect(hasResources(current, { gold: 100, fuel: 50 })).toBe(true);
    });

    it('should return false when a resource is insufficient', () => {
      const current = createStartingResources();
      expect(hasResources(current, { gold: 1000 })).toBe(false);
    });

    it('should return true for exact amounts', () => {
      const current = createStartingResources();
      expect(hasResources(current, { gold: 500 })).toBe(true);
    });

    it('should return true for empty requirement', () => {
      const current = createStartingResources();
      expect(hasResources(current, {})).toBe(true);
    });

    it('should return false when one of many resources is missing', () => {
      const current = createStartingResources();
      expect(hasResources(current, { gold: 100, contraband: 5 })).toBe(false);
    });
  });

  describe('totalResourceValue', () => {
    it('should sum all resource values', () => {
      const res = createStartingResources();
      expect(totalResourceValue(res)).toBe(800); // 100+100+100+500+0+0
    });

    it('should return 0 for empty resources', () => {
      expect(totalResourceValue(createEmptyResources())).toBe(0);
    });
  });

  describe('getLowResources', () => {
    it('should return resources below threshold (excluding contraband and information)', () => {
      const res: Resources = { fuel: 5, water: 50, food: 3, gold: 100, contraband: 0, information: 0 };
      const low = getLowResources(res, 10);
      expect(low).toContain('fuel');
      expect(low).toContain('food');
      expect(low).not.toContain('water');
      expect(low).not.toContain('gold');
      expect(low).not.toContain('contraband');
      expect(low).not.toContain('information');
    });

    it('should return empty array when all are above threshold', () => {
      const res = createStartingResources();
      expect(getLowResources(res, 10)).toEqual([]);
    });

    it('should treat threshold boundary as not low', () => {
      const res: Resources = { fuel: 10, water: 10, food: 10, gold: 10, contraband: 0, information: 0 };
      expect(getLowResources(res, 10)).toEqual([]);
    });
  });

  describe('transferResources', () => {
    it('should transfer resources between inventories', () => {
      const from = createStartingResources();
      const to = createEmptyResources();
      const result = transferResources(from, to, { gold: 200 });
      expect(result).not.toBeNull();
      expect(result!.from.gold).toBe(300);
      expect(result!.to.gold).toBe(200);
    });

    it('should return null if source has insufficient resources', () => {
      const from = createEmptyResources();
      const to = createEmptyResources();
      const result = transferResources(from, to, { gold: 100 });
      expect(result).toBeNull();
    });

    it('should not mutate originals', () => {
      const from = createStartingResources();
      const to = createEmptyResources();
      transferResources(from, to, { gold: 200 });
      expect(from.gold).toBe(500);
      expect(to.gold).toBe(0);
    });
  });
});
