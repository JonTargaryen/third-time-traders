/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Tests — Trade Engine (95%+ coverage target)
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  canEstablishRoute,
  establishRoute,
  collectTradeProfits,
  getRoutesForRegion,
  getEstablishedRoutes,
  getTotalProfitPerTurn,
  dismantleRoute,
} from '@/engine/trade';
import { createStartingResources, createEmptyResources } from '@/engine/inventory';
import { createStartingReputation, changeReputation } from '@/engine/reputation';
import type { TradeRoute, Resources, ReputationMap } from '@/engine/types';

// A test route between two discovered regions
const testRoute: TradeRoute = {
  id: 'test-route',
  from: 'delhi', // discovered=true
  to: 'kolkata',   // discovered=true
  established: false,
  costToEstablish: { gold: 100, fuel: 20 },
  requiredReputation: [
    { factionId: 'mughal-court', minimum: 10 },
    { factionId: 'east-india-company', minimum: 10 },
  ],
  profitPerTurn: { gold: 15, food: 5 },
};

// A test route involving an undiscovered region
const undiscoveredRoute: TradeRoute = {
  id: 'undiscovered-route',
  from: 'delhi',
  to: 'jaisalmer', // discovered=false in default data
  established: false,
  costToEstablish: { gold: 50 },
  requiredReputation: [],
  profitPerTurn: { gold: 5 },
};

describe('Trade Engine', () => {
  let resources: Resources;
  let reputation: ReputationMap;

  beforeEach(() => {
    resources = createStartingResources();
    reputation = createStartingReputation();
  });

  describe('canEstablishRoute', () => {
    it('should allow establishment when all conditions met', () => {
      let rep = changeReputation(reputation, 'mughal-court', 15);
      rep = changeReputation(rep, 'east-india-company', 15);
      const result = canEstablishRoute(testRoute, resources, rep);
      expect(result.canEstablish).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it('should fail when already established', () => {
      const established = { ...testRoute, established: true };
      let rep = changeReputation(reputation, 'mughal-court', 15);
      rep = changeReputation(rep, 'east-india-company', 15);
      const result = canEstablishRoute(established, resources, rep);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons).toContain('Route is already established');
    });

    it('should fail when insufficient resources', () => {
      const poorResources = createEmptyResources();
      let rep = changeReputation(reputation, 'mughal-court', 15);
      rep = changeReputation(rep, 'east-india-company', 15);
      const result = canEstablishRoute(testRoute, poorResources, rep);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons).toContain('Insufficient resources');
    });

    it('should fail when insufficient reputation', () => {
      const result = canEstablishRoute(testRoute, resources, reputation);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons).toContain('Insufficient reputation with required factions');
    });

    it('should fail when destination region is undiscovered', () => {
      const result = canEstablishRoute(undiscoveredRoute, resources, reputation);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons.some((r) => r.includes('not yet discovered'))).toBe(true);
    });

    it('should accumulate multiple failure reasons', () => {
      const poorResources = createEmptyResources();
      const result = canEstablishRoute(testRoute, poorResources, reputation);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail when source (from) region is undiscovered', () => {
      // jaisalmer is undiscovered by default, use it as 'from'
      const sourceUndiscoveredRoute: TradeRoute = {
        id: 'src-undiscovered',
        from: 'jaisalmer', // undiscovered
        to: 'delhi', // discovered
        established: false,
        costToEstablish: { gold: 50 },
        requiredReputation: [],
        profitPerTurn: { gold: 5 },
      };
      const result = canEstablishRoute(sourceUndiscoveredRoute, resources, reputation);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons.some((r) => r.includes('Jaisalmer'))).toBe(true);
    });

    it('should fail when both regions are undiscovered', () => {
      const bothUndiscoveredRoute: TradeRoute = {
        id: 'both-undiscovered',
        from: 'jaisalmer',
        to: 'varanasi',
        established: false,
        costToEstablish: { gold: 50 },
        requiredReputation: [],
        profitPerTurn: { gold: 5 },
      };
      const result = canEstablishRoute(bothUndiscoveredRoute, resources, reputation);
      expect(result.canEstablish).toBe(false);
      expect(result.reasons.filter((r) => r.includes('not yet discovered')).length).toBe(2);
    });

    it('should pass region check when route refers to non-existent region IDs', () => {
      const fakeRegionRoute: TradeRoute = {
        id: 'fake-region',
        from: 'nonexistent-a' as any,
        to: 'nonexistent-b' as any,
        established: false,
        costToEstablish: { gold: 10 },
        requiredReputation: [],
        profitPerTurn: { gold: 1 },
      };
      // When fromRegion/toRegion are undefined, the if-checks are skipped
      const result = canEstablishRoute(fakeRegionRoute, resources, reputation);
      // It may still pass region checks (regions not in REGIONS map)
      expect(result.reasons.every((r) => !r.includes('not yet discovered'))).toBe(true);
    });
  });

  describe('establishRoute', () => {
    it('should establish route, deduct resources, and gain reputation', () => {
      let rep = changeReputation(reputation, 'mughal-court', 15);
      rep = changeReputation(rep, 'east-india-company', 15);
      const result = establishRoute(testRoute, resources, rep);
      expect(result).not.toBeNull();
      expect(result!.route.established).toBe(true);
      expect(result!.resources.gold).toBe(400); // 500 - 100
      expect(result!.resources.fuel).toBe(80);  // 100 - 20
      // +5 rep to each involved faction
      expect(result!.reputation['mughal-court']).toBe(20); // 15 + 5
      expect(result!.reputation['east-india-company']).toBe(20); // 15 + 5
    });

    it('should return null when conditions not met', () => {
      const result = establishRoute(testRoute, resources, reputation);
      expect(result).toBeNull();
    });

    it('should not mutate inputs', () => {
      let rep = changeReputation(reputation, 'mughal-court', 15);
      rep = changeReputation(rep, 'east-india-company', 15);
      const origGold = resources.gold;
      establishRoute(testRoute, resources, rep);
      expect(resources.gold).toBe(origGold);
    });
  });

  describe('collectTradeProfits', () => {
    it('should add profits from established routes', () => {
      const established: TradeRoute[] = [
        { ...testRoute, established: true },
      ];
      const result = collectTradeProfits(established, resources);
      expect(result.gold).toBe(515); // 500 + 15
      expect(result.food).toBe(105); // 100 + 5
    });

    it('should skip unestablished routes', () => {
      const routes: TradeRoute[] = [testRoute]; // not established
      const result = collectTradeProfits(routes, resources);
      expect(result.gold).toBe(500); // unchanged
    });

    it('should handle multiple established routes', () => {
      const route2: TradeRoute = {
        ...testRoute,
        id: 'test-2',
        established: true,
        profitPerTurn: { gold: 10 },
      };
      const routes = [{ ...testRoute, established: true }, route2];
      const result = collectTradeProfits(routes, resources);
      expect(result.gold).toBe(525); // 500 + 15 + 10
    });

    it('should handle empty routes array', () => {
      const result = collectTradeProfits([], resources);
      expect(result).toEqual(resources);
    });
  });

  describe('getRoutesForRegion', () => {
    it('should return routes connected to a region', () => {
      const routes = [testRoute, undiscoveredRoute];
      const result = getRoutesForRegion(routes, 'delhi');
      expect(result.length).toBe(2);
    });

    it('should return routes where region is destination', () => {
      const routes = [testRoute];
      const result = getRoutesForRegion(routes, 'kolkata');
      expect(result.length).toBe(1);
    });

    it('should return empty for unconnected region', () => {
      const routes = [testRoute];
      const result = getRoutesForRegion(routes, 'varanasi');
      expect(result.length).toBe(0);
    });
  });

  describe('getEstablishedRoutes', () => {
    it('should return only established routes', () => {
      const routes = [
        { ...testRoute, established: true },
        { ...undiscoveredRoute, established: false },
      ];
      const result = getEstablishedRoutes(routes);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('test-route');
    });

    it('should return empty when none established', () => {
      expect(getEstablishedRoutes([testRoute])).toEqual([]);
    });
  });

  describe('getTotalProfitPerTurn', () => {
    it('should sum profits from established routes', () => {
      const routes = [
        { ...testRoute, established: true, profitPerTurn: { gold: 15, food: 5 } },
        { ...testRoute, id: 'r2', established: true, profitPerTurn: { gold: 10, fuel: 3 } },
      ];
      const profit = getTotalProfitPerTurn(routes);
      expect(profit.gold).toBe(25);
      expect(profit.food).toBe(5);
      expect(profit.fuel).toBe(3);
    });

    it('should ignore unestablished routes', () => {
      const profit = getTotalProfitPerTurn([testRoute]);
      expect(profit).toEqual({});
    });
  });

  describe('dismantleRoute', () => {
    it('should dismantle, refund 25%, and lose reputation', () => {
      let rep = changeReputation(reputation, 'mughal-court', 30);
      rep = changeReputation(rep, 'east-india-company', 30);
      const established = { ...testRoute, established: true };
      const result = dismantleRoute(established, resources, rep);
      expect(result).not.toBeNull();
      expect(result!.route.established).toBe(false);
      // Refund 25%: gold: floor(100*0.25)=25, fuel: floor(20*0.25)=5
      expect(result!.resources.gold).toBe(525);
      expect(result!.resources.fuel).toBe(105);
      // -10 rep each
      expect(result!.reputation['mughal-court']).toBe(20);
      expect(result!.reputation['east-india-company']).toBe(20);
    });

    it('should return null for unestablished route', () => {
      const result = dismantleRoute(testRoute, resources, reputation);
      expect(result).toBeNull();
    });

    it('should handle route with zero-value cost entries', () => {
      const routeWithZeroCost: TradeRoute = {
        ...testRoute,
        established: true,
        costToEstablish: { gold: 0 },
      };
      const result = dismantleRoute(routeWithZeroCost, resources, reputation);
      expect(result).not.toBeNull();
      expect(result!.route.established).toBe(false);
    });

    it('should handle route with undefined-value cost entries in refund calculation', () => {
      // costToEstablish with keys that might have undefined/falsy values
      const routeWithPartialCost: TradeRoute = {
        ...testRoute,
        established: true,
        costToEstablish: { gold: 100, fuel: 0, water: 0 } as any,
      };
      const result = dismantleRoute(routeWithPartialCost, resources, reputation);
      expect(result).not.toBeNull();
      expect(result!.route.established).toBe(false);
      // 25% of gold 100 = 25
      expect(result!.resources.gold).toBe(525);
    });
  });
});
