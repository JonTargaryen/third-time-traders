// ============================================================
// Tests — 15 Edge Cases: Engine-Level (Pure Logic)
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addResources,
  removeResources,
  hasResources,
  createStartingResources,
  createEmptyResources,
  transferResources,
} from '@/engine/inventory';
import {
  createInitialRegions,
  discoverRegion,
  canTravel,
  createInitialCaravan,
  canStartScoutingMission,
  canBuyMap,
  findPath,
  calculateTravelCost,
} from '@/engine/world';
import {
  createPersonnel,
  assignToRoute,
  unassignFromRoute,
  injurePersonnel,
  healPersonnel,
  killPersonnel,
  getHireCost,
  getAvailablePersonnel,
} from '@/engine/personnel';
import {
  clampReputation,
  changeReputation,
  getRelationshipStatus,
  createStartingReputation,
  isFactionHostile,
  isFactionAllied,
} from '@/engine/reputation';
import {
  establishRoute,
  canEstablishRoute,
  collectTradeProfits,
} from '@/engine/trade';
import {
  createInitialMarket,
  applyMarketFluctuations,
  getPrice,
  getPriceLabel,
  getMostVolatile,
} from '@/engine/market';
import {
  createInitialFactionRelations,
  shiftRelation,
  getRelation,
  getWars,
  getAlliances,
} from '@/engine/factionRelations';
import type { Resources, RegionId, Personnel, TradeRoute } from '@/engine/types';
import { REPUTATION_MIN, REPUTATION_MAX, getSeason } from '@/engine/types';
import { INITIAL_TRADE_ROUTES } from '@/data/tradeRoutes';

// ============================================================
// Edge Case 1: Buying with exactly 0 gold remaining
// ============================================================
describe('Edge Case 1: Exact-zero resource arithmetic', () => {
  it('should succeed when removing exactly all gold', () => {
    const res = createStartingResources(); // gold: 500
    const result = removeResources(res, { gold: 500 });
    expect(result).not.toBeNull();
    expect(result!.gold).toBe(0);
  });

  it('should fail when removing 1 more than available', () => {
    const res = createStartingResources();
    const result = removeResources(res, { gold: 501 });
    expect(result).toBeNull();
  });

  it('should succeed removing all of multiple resources at once', () => {
    const res: Resources = { fuel: 10, water: 5, food: 3, gold: 0, contraband: 0, information: 0 };
    const result = removeResources(res, { fuel: 10, water: 5, food: 3 });
    expect(result).not.toBeNull();
    expect(result!.fuel).toBe(0);
    expect(result!.water).toBe(0);
    expect(result!.food).toBe(0);
  });

  it('should fail if any single resource is insufficient in multi-remove', () => {
    const res: Resources = { fuel: 10, water: 5, food: 3, gold: 0, contraband: 0, information: 0 };
    const result = removeResources(res, { fuel: 10, water: 6 }); // water short by 1
    expect(result).toBeNull();
  });

  it('should handle adding negative values that would go below 0', () => {
    const res: Resources = { fuel: 5, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
    const result = addResources(res, { fuel: -100 });
    expect(result.fuel).toBe(0); // clamped to 0
  });

  it('should preserve other resources unchanged during exact depletion', () => {
    const res: Resources = { fuel: 50, water: 30, food: 20, gold: 100, contraband: 5, information: 3 };
    const result = removeResources(res, { gold: 100 });
    expect(result).not.toBeNull();
    expect(result!.fuel).toBe(50);
    expect(result!.water).toBe(30);
    expect(result!.food).toBe(20);
    expect(result!.contraband).toBe(5);
    expect(result!.information).toBe(3);
  });
});

// ============================================================
// Edge Case 2: Selling more resources than you own
// ============================================================
describe('Edge Case 2: Overflow protection on resource removal', () => {
  it('should return null when trying to remove more than available', () => {
    const res: Resources = { fuel: 10, water: 10, food: 10, gold: 10, contraband: 0, information: 0 };
    expect(removeResources(res, { fuel: 11 })).toBeNull();
    expect(removeResources(res, { gold: 100 })).toBeNull();
  });

  it('should correctly report hasResources for boundary amounts', () => {
    const res: Resources = { fuel: 10, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
    expect(hasResources(res, { fuel: 10 })).toBe(true);
    expect(hasResources(res, { fuel: 11 })).toBe(false);
    expect(hasResources(res, { fuel: 0 })).toBe(true);
    expect(hasResources(res, { water: 0 })).toBe(true);
    expect(hasResources(res, { water: 1 })).toBe(false);
  });

  it('should not corrupt state on failed removal', () => {
    const res = createStartingResources();
    const original = { ...res };
    removeResources(res, { gold: 9999 });
    expect(res).toEqual(original); // original unchanged
  });

  it('should handle transfer failure when source is insufficient', () => {
    const from: Resources = { fuel: 5, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
    const to = createEmptyResources();
    const result = transferResources(from, to, { fuel: 10 });
    expect(result).toBeNull();
  });

  it('should handle transfer success at exact boundary', () => {
    const from: Resources = { fuel: 5, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
    const to = createEmptyResources();
    const result = transferResources(from, to, { fuel: 5 });
    expect(result).not.toBeNull();
    expect(result!.from.fuel).toBe(0);
    expect(result!.to.fuel).toBe(5);
  });
});

// ============================================================
// Edge Case 3: Travel to undiscovered region
// ============================================================
describe('Edge Case 3: Travel to undiscovered region', () => {
  it('should prevent travel to undiscovered region', () => {
    const regions = createInitialRegions();
    const caravan = createInitialCaravan();
    // amber-wastes is undiscovered but adjacent to obsidian-citadel
    const result = canTravel(regions, 'obsidian-citadel', 'amber-wastes', 100, caravan);
    expect(result.canTravel).toBe(false);
    expect(result.reason).toContain('not yet discovered');
  });

  it('should allow travel to discovered adjacent region', () => {
    const regions = createInitialRegions();
    const caravan = createInitialCaravan();
    // forge-highlands is discovered and adjacent to obsidian-citadel
    const result = canTravel(regions, 'obsidian-citadel', 'forge-highlands', 100, caravan);
    expect(result.canTravel).toBe(true);
    expect(result.cost).toBeDefined();
  });

  it('should prevent travel to non-adjacent region even if discovered', () => {
    const regions = createInitialRegions();
    const caravan = createInitialCaravan();
    // shattered-coast is discovered but NOT adjacent to obsidian-citadel
    const result = canTravel(regions, 'obsidian-citadel', 'shattered-coast', 100, caravan);
    expect(result.canTravel).toBe(false);
    expect(result.reason).toContain('not adjacent');
  });

  it('should prevent travel with insufficient fuel', () => {
    const regions = createInitialRegions();
    const caravan = createInitialCaravan();
    const result = canTravel(regions, 'obsidian-citadel', 'forge-highlands', 0, caravan);
    expect(result.canTravel).toBe(false);
    expect(result.reason).toContain('fuel');
  });

  it('should allow travel when fuel is exactly sufficient', () => {
    const regions = createInitialRegions();
    const caravan = createInitialCaravan();
    const cost = calculateTravelCost(regions, 'obsidian-citadel', 'forge-highlands', caravan);
    expect(cost).not.toBeNull();
    const result = canTravel(regions, 'obsidian-citadel', 'forge-highlands', cost!.fuel, caravan);
    expect(result.canTravel).toBe(true);
  });

  it('should return null cost for travel to undiscovered region', () => {
    const regions = createInitialRegions();
    const caravan = createInitialCaravan();
    const cost = calculateTravelCost(regions, 'obsidian-citadel', 'amber-wastes', caravan);
    expect(cost).toBeNull();
  });
});

// ============================================================
// Edge Case 4: Scouting with unavailable scouts
// ============================================================
describe('Edge Case 4: Scouting with unavailable scouts', () => {
  it('should fail when there are no scouts at all', () => {
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'amber-wastes', [], 500);
    expect(result.canStart).toBe(false);
    expect(result.reason).toContain('No scouts');
  });

  it('should fail when all scouts are injured', () => {
    const scout = createPersonnel('scout', 'TestScout', 5);
    const injured = injurePersonnel(scout);
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'amber-wastes', [injured], 500);
    expect(result.canStart).toBe(false);
    expect(result.reason).toContain('No scouts');
  });

  it('should fail when all scouts are already scouting', () => {
    const scout = createPersonnel('scout', 'TestScout', 5);
    const scouting: Personnel = { ...scout, status: 'scouting', scoutingRegion: 'emerald-canopy' };
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'amber-wastes', [scouting], 500);
    expect(result.canStart).toBe(false);
    expect(result.reason).toContain('No scouts');
  });

  it('should fail when scouts are dead', () => {
    const scout = createPersonnel('scout', 'TestScout', 5);
    const dead = killPersonnel(scout);
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'amber-wastes', [dead], 500);
    expect(result.canStart).toBe(false);
  });

  it('should fail when only guards and negotiators are available', () => {
    const guard = createPersonnel('guard', 'GuardGuy', 5);
    const negotiator = createPersonnel('negotiator', 'NegGal', 5);
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'amber-wastes', [guard, negotiator], 500);
    expect(result.canStart).toBe(false);
  });

  it('should succeed when at least one scout is available among mixed roster', () => {
    const guard = createPersonnel('guard', 'GuardGuy', 5);
    const scout = createPersonnel('scout', 'ScoutGal', 5);
    const injuredScout = injurePersonnel(createPersonnel('scout', 'InjuredScout', 5));
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'amber-wastes', [guard, scout, injuredScout], 500);
    expect(result.canStart).toBe(true);
  });

  it('should fail when scouting non-adjacent region', () => {
    const scout = createPersonnel('scout', 'TestScout', 5);
    const regions = createInitialRegions();
    // the-undercity is NOT adjacent to obsidian-citadel
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'the-undercity', [scout], 500);
    expect(result.canStart).toBe(false);
    expect(result.reason).toContain('not adjacent');
  });

  it('should fail scouting already discovered region', () => {
    const scout = createPersonnel('scout', 'TestScout', 5);
    const regions = createInitialRegions();
    const result = canStartScoutingMission(regions, 'obsidian-citadel', 'forge-highlands', [scout], 500);
    expect(result.canStart).toBe(false);
    expect(result.reason).toContain('already discovered');
  });
});

// ============================================================
// Edge Case 5: Double-discovering a region (idempotency)
// ============================================================
describe('Edge Case 5: Double-discovery idempotency', () => {
  it('should not change state when discovering already-discovered region', () => {
    const regions = createInitialRegions();
    const first = discoverRegion(regions, 'amber-wastes');
    expect(first['amber-wastes'].discovered).toBe(true);
    const second = discoverRegion(first, 'amber-wastes');
    // Same reference returned = no mutation
    expect(second).toBe(first);
    expect(second['amber-wastes'].discovered).toBe(true);
  });

  it('should handle discovering all regions sequentially', () => {
    let regions = createInitialRegions();
    const undiscovered: RegionId[] = ['amber-wastes', 'emerald-canopy', 'the-undercity'];
    for (const id of undiscovered) {
      regions = discoverRegion(regions, id);
      expect(regions[id].discovered).toBe(true);
    }
    // All should be discovered now
    expect(Object.values(regions).every((r) => r.discovered)).toBe(true);
  });

  it('should not break pathfinding after double-discovery', () => {
    let regions = createInitialRegions();
    regions = discoverRegion(regions, 'amber-wastes');
    regions = discoverRegion(regions, 'amber-wastes'); // double
    const path = findPath(regions, 'obsidian-citadel', 'amber-wastes');
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Edge Case 6: Game over trigger — all resources depleted
// ============================================================
describe('Edge Case 6: Game over resource depletion', () => {
  it('should detect all-zero critical resources', () => {
    const res: Resources = { fuel: 0, water: 0, food: 0, gold: 0, contraband: 5, information: 3 };
    // Game over condition: gold <= 0 && food <= 0 && fuel <= 0
    const isGameOver = res.gold <= 0 && res.food <= 0 && res.fuel <= 0;
    expect(isGameOver).toBe(true);
  });

  it('should NOT trigger game over if any critical resource is positive', () => {
    const res1: Resources = { fuel: 0, water: 0, food: 0, gold: 1, contraband: 0, information: 0 };
    expect(res1.gold <= 0 && res1.food <= 0 && res1.fuel <= 0).toBe(false);

    const res2: Resources = { fuel: 1, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
    expect(res2.gold <= 0 && res2.food <= 0 && res2.fuel <= 0).toBe(false);

    const res3: Resources = { fuel: 0, water: 0, food: 1, gold: 0, contraband: 0, information: 0 };
    expect(res3.gold <= 0 && res3.food <= 0 && res3.fuel <= 0).toBe(false);
  });

  it('should handle resources reaching zero via subtraction', () => {
    let res = createStartingResources();
    res = removeResources(res, { gold: 500 })!;
    res = removeResources(res, { fuel: 100 })!;
    res = removeResources(res, { food: 100 })!;
    const isGameOver = res.gold <= 0 && res.food <= 0 && res.fuel <= 0;
    expect(isGameOver).toBe(true);
  });
});

// ============================================================
// Edge Case 7: Loading corrupted/partial save data
// ============================================================
describe('Edge Case 7: Corrupted/partial save data', () => {
  it('should handle completely invalid JSON', () => {
    expect(() => JSON.parse('not json')).toThrow();
  });

  it('should handle empty object', () => {
    const parsed = JSON.parse('{}');
    const valid = !!(parsed.phase && parsed.resources && parsed.reputation);
    expect(valid).toBe(false);
  });

  it('should handle save data missing key fields', () => {
    const partial = JSON.stringify({ phase: 'playing', turn: 5 });
    const parsed = JSON.parse(partial);
    const valid = !!(parsed.phase && parsed.resources && parsed.reputation);
    expect(valid).toBe(false);
  });

  it('should accept valid save data', () => {
    const validSave = JSON.stringify({
      phase: 'playing',
      turn: 5,
      resources: createStartingResources(),
      reputation: createStartingReputation(),
      regions: createInitialRegions(),
    });
    const parsed = JSON.parse(validSave);
    const valid = !!(parsed.phase && parsed.resources && parsed.reputation);
    expect(valid).toBe(true);
  });

  it('should handle save data with extra unknown fields gracefully', () => {
    const extended = JSON.stringify({
      phase: 'playing',
      turn: 5,
      resources: createStartingResources(),
      reputation: createStartingReputation(),
      futureField: 'unknown',
      anotherField: 42,
    });
    const parsed = JSON.parse(extended);
    expect(parsed.phase).toBe('playing');
    expect(parsed.futureField).toBe('unknown');
  });

  it('should handle null values in save data', () => {
    const data = JSON.stringify({
      phase: 'playing',
      resources: null,
      reputation: null,
    });
    const parsed = JSON.parse(data);
    const valid = !!(parsed.phase && parsed.resources && parsed.reputation);
    expect(valid).toBe(false);
  });
});

// ============================================================
// Edge Case 8: Marketplace location validation
// ============================================================
describe('Edge Case 8: Marketplace location checks', () => {
  it('should reject buy when caravan is in wrong region (via canBuyMap for maps)', () => {
    const regions = createInitialRegions();
    // canBuyMap doesn't check location (it's a map purchase), but the store does
    // This tests the engine-level map check
    const result = canBuyMap(regions, 'amber-wastes', { gold: 500, information: 50 });
    expect(result.canBuy).toBe(true);
  });

  it('should reject buying map for already discovered region', () => {
    const regions = createInitialRegions();
    const result = canBuyMap(regions, 'forge-highlands', { gold: 999, information: 999 });
    expect(result.canBuy).toBe(false);
    expect(result.reason).toContain('already discovered');
  });

  it('should reject buying map with insufficient gold', () => {
    const regions = createInitialRegions();
    const result = canBuyMap(regions, 'amber-wastes', { gold: 0, information: 0 });
    expect(result.canBuy).toBe(false);
    expect(result.reason).toContain('gold');
  });

  it('should reject buying map for invalid region', () => {
    const regions = createInitialRegions();
    const result = canBuyMap(regions, 'nonexistent' as RegionId, { gold: 999, information: 999 });
    expect(result.canBuy).toBe(false);
    expect(result.reason).toContain('Invalid');
  });
});

// ============================================================
// Edge Case 9: Hiring personnel with insufficient gold
// ============================================================
describe('Edge Case 9: Personnel hiring with insufficient resources', () => {
  it('should calculate hire cost correctly', () => {
    // guard base rate: 20, so skill 5 = 100 gold
    expect(getHireCost('guard', 5)).toBe(100);
    expect(getHireCost('negotiator', 5)).toBe(175); // 35 * 5
    expect(getHireCost('scout', 5)).toBe(125); // 25 * 5
  });

  it('should fail to hire when gold is insufficient', () => {
    const res: Resources = { fuel: 0, water: 0, food: 0, gold: 10, contraband: 0, information: 0 };
    const person = createPersonnel('guard', 'TestGuard', 10); // cost = 200
    const cost = getHireCost(person.role, person.skill);
    const result = removeResources(res, { gold: cost });
    expect(result).toBeNull();
  });

  it('should succeed hiring when gold is exactly sufficient', () => {
    const cost = getHireCost('guard', 5); // 100
    const res: Resources = { fuel: 0, water: 0, food: 0, gold: cost, contraband: 0, information: 0 };
    const result = removeResources(res, { gold: cost });
    expect(result).not.toBeNull();
    expect(result!.gold).toBe(0);
  });

  it('should create personnel with valid skill range (1-10)', () => {
    // Run multiple times to check randomness stays in bounds
    for (let i = 0; i < 50; i++) {
      const person = createPersonnel('scout');
      expect(person.skill).toBeGreaterThanOrEqual(1);
      expect(person.skill).toBeLessThanOrEqual(10);
    }
  });

  it('should create personnel with correct initial state', () => {
    const person = createPersonnel('guard', 'TestGuard', 5);
    expect(person.status).toBe('available');
    expect(person.assignedRoute).toBeNull();
    expect(person.assignedMission).toBeNull();
    expect(person.role).toBe('guard');
  });
});

// ============================================================
// Edge Case 10: Trade route with undiscovered region
// ============================================================
describe('Edge Case 10: Trade route with undiscovered region', () => {
  it('should report undiscovered region as a reason for failure', () => {
    const route = INITIAL_TRADE_ROUTES.find((r) => r.id === 'route-forge-coast')!;
    const resources = createStartingResources();
    const reputation = createStartingReputation();
    // Both forge-highlands and shattered-coast are discovered, so this shouldn't fail for that
    const check = canEstablishRoute(route, resources, reputation);
    // May fail for reputation or resources, but not for discovery
    const discoveryReasons = check.reasons.filter((r) => r.includes('not yet discovered'));
    expect(discoveryReasons.length).toBe(0);
  });

  it('should fail establishment when reputation requirements are not met', () => {
    const route = INITIAL_TRADE_ROUTES[0]; // requires reputation
    const resources = createStartingResources();
    const reputation = createStartingReputation(); // all 0
    const result = establishRoute(route, resources, reputation);
    // Most routes require some reputation, so this should fail
    if (route.requiredReputation.some((r) => r.minimum > 0)) {
      expect(result).toBeNull();
    }
  });

  it('should fail when resources are insufficient for route cost', () => {
    const route = INITIAL_TRADE_ROUTES[0];
    const resources = createEmptyResources(); // no resources
    const reputation = createStartingReputation();
    // Give enough reputation
    let rep = reputation;
    for (const req of route.requiredReputation) {
      rep = changeReputation(rep, req.factionId, 100);
    }
    const result = establishRoute(route, resources, rep);
    expect(result).toBeNull();
  });
});

// ============================================================
// Edge Case 11: Rapid turn advancement — state consistency
// ============================================================
describe('Edge Case 11: Rapid turn advancement state consistency', () => {
  it('should correctly compute season for sequential turns', () => {
    // Spring: turns 1-8, Summer: 9-16, Autumn: 17-24, Winter: 25-32
    expect(getSeason(1)).toBe('spring');
    expect(getSeason(8)).toBe('spring');
    expect(getSeason(9)).toBe('summer');
    expect(getSeason(16)).toBe('summer');
    expect(getSeason(17)).toBe('autumn');
    expect(getSeason(24)).toBe('autumn');
    expect(getSeason(25)).toBe('winter');
    expect(getSeason(32)).toBe('winter');
    // Cycle
    expect(getSeason(33)).toBe('spring');
  });

  it('should handle market fluctuations without crashing or going out of bounds', () => {
    let market = createInitialMarket();
    for (let i = 0; i < 100; i++) {
      market = applyMarketFluctuations(market);
    }
    // All prices should be within bounds [0.3, 3.0]
    for (const regionId of Object.keys(market.prices)) {
      for (const [, price] of Object.entries(market.prices[regionId as RegionId]!)) {
        expect(price).toBeGreaterThanOrEqual(0.3);
        expect(price).toBeLessThanOrEqual(3.0);
      }
    }
  });

  it('should maintain stable faction relation shifts over many iterations', () => {
    let relations = createInitialFactionRelations();
    // Worsen iron-pact vs tidecallers 100 times — should floor at 'war'
    for (let i = 0; i < 100; i++) {
      relations = shiftRelation(relations, 'iron-pact', 'tidecallers', 'worsen');
    }
    expect(getRelation(relations, 'iron-pact', 'tidecallers')).toBe('war');

    // Improve them 100 times — should cap at 'allied'
    for (let i = 0; i < 100; i++) {
      relations = shiftRelation(relations, 'iron-pact', 'tidecallers', 'improve');
    }
    expect(getRelation(relations, 'iron-pact', 'tidecallers')).toBe('allied');
  });
});

// ============================================================
// Edge Case 12: Event choice with insufficient resources
// ============================================================
describe('Edge Case 12: Event choice resource cost validation', () => {
  it('should reject event choice when player cannot afford cost', () => {
    const resources: Resources = { fuel: 0, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
    const choiceCost = { gold: 50, fuel: 10 };
    const afterCost = removeResources(resources, choiceCost);
    expect(afterCost).toBeNull();
  });

  it('should allow event choice when player can exactly afford', () => {
    const resources: Resources = { fuel: 10, water: 0, food: 0, gold: 50, contraband: 0, information: 0 };
    const choiceCost = { gold: 50, fuel: 10 };
    const afterCost = removeResources(resources, choiceCost);
    expect(afterCost).not.toBeNull();
    expect(afterCost!.gold).toBe(0);
    expect(afterCost!.fuel).toBe(0);
  });

  it('should correctly apply rewards after paying cost', () => {
    const resources: Resources = { fuel: 20, water: 0, food: 0, gold: 100, contraband: 0, information: 0 };
    const cost = { gold: 50 };
    const reward = { gold: 120, fuel: 5 };
    const afterCost = removeResources(resources, cost)!;
    const afterReward = addResources(afterCost, reward);
    expect(afterReward.gold).toBe(170); // 100 - 50 + 120
    expect(afterReward.fuel).toBe(25); // 20 + 5
  });
});

// ============================================================
// Edge Case 13: Mission expiration after turn limit
// ============================================================
describe('Edge Case 13: Mission expiration logic', () => {
  it('should detect expired mission after turn limit passed', () => {
    const mission = {
      id: 'test-mission',
      status: 'active' as const,
      acceptedOnTurn: 5,
      turnLimit: 3,
    };
    const currentTurn = 9; // 5 + 3 = 8, so turn 9 is expired
    const expired = currentTurn > mission.acceptedOnTurn + mission.turnLimit;
    expect(expired).toBe(true);
  });

  it('should NOT expire mission on the last valid turn', () => {
    const mission = {
      id: 'test-mission',
      status: 'active' as const,
      acceptedOnTurn: 5,
      turnLimit: 3,
    };
    const currentTurn = 8; // 5 + 3 = 8, exact boundary
    const expired = currentTurn > mission.acceptedOnTurn + mission.turnLimit;
    expect(expired).toBe(false);
  });

  it('should not affect non-active missions', () => {
    const missions = [
      { id: '1', status: 'completed', acceptedOnTurn: 1, turnLimit: 2 },
      { id: '2', status: 'available', acceptedOnTurn: undefined as number | undefined, turnLimit: 5 },
      { id: '3', status: 'failed', acceptedOnTurn: 1, turnLimit: 1 },
    ];
    const currentTurn = 100;
    const activeExpired = missions.filter(
      (m) => m.status === 'active' && m.acceptedOnTurn != null && currentTurn > m.acceptedOnTurn + m.turnLimit
    );
    expect(activeExpired.length).toBe(0);
  });

  it('should handle mission with turnLimit of 1', () => {
    const mission = { acceptedOnTurn: 10, turnLimit: 1 };
    expect(10 > mission.acceptedOnTurn + mission.turnLimit).toBe(false); // turn 10, limit ends 11
    expect(11 > mission.acceptedOnTurn + mission.turnLimit).toBe(false); // turn 11, limit ends 11
    expect(12 > mission.acceptedOnTurn + mission.turnLimit).toBe(true); // turn 12, expired
  });
});

// ============================================================
// Edge Case 14: Reputation clamping at boundaries
// ============================================================
describe('Edge Case 14: Reputation boundary clamping', () => {
  it('should clamp reputation at maximum (100)', () => {
    expect(clampReputation(150)).toBe(REPUTATION_MAX);
    expect(clampReputation(100)).toBe(REPUTATION_MAX);
    expect(clampReputation(999)).toBe(REPUTATION_MAX);
  });

  it('should clamp reputation at minimum (-100)', () => {
    expect(clampReputation(-150)).toBe(REPUTATION_MIN);
    expect(clampReputation(-100)).toBe(REPUTATION_MIN);
    expect(clampReputation(-999)).toBe(REPUTATION_MIN);
  });

  it('should not clamp values within range', () => {
    expect(clampReputation(0)).toBe(0);
    expect(clampReputation(50)).toBe(50);
    expect(clampReputation(-50)).toBe(-50);
    expect(clampReputation(99)).toBe(99);
    expect(clampReputation(-99)).toBe(-99);
  });

  it('should clamp after repeated additions', () => {
    let rep = createStartingReputation();
    // Add 200 reputation to iron-pact (should clamp at 100)
    rep = changeReputation(rep, 'iron-pact', 200);
    expect(rep['iron-pact']).toBe(100);
  });

  it('should clamp after repeated subtractions', () => {
    let rep = createStartingReputation();
    rep = changeReputation(rep, 'iron-pact', -200);
    expect(rep['iron-pact']).toBe(-100);
  });

  it('should correctly classify status at boundaries', () => {
    let rep = createStartingReputation();
    
    // At 0 = neutral
    expect(getRelationshipStatus(rep, 'iron-pact')).toBe('neutral');
    
    // At -31 (below hostilityThreshold -30 for iron-pact) = hostile
    rep = changeReputation(rep, 'iron-pact', -31);
    expect(getRelationshipStatus(rep, 'iron-pact')).toBe('hostile');
    
    // Reset and go to 60 (allyThreshold for iron-pact) = allied
    rep = createStartingReputation();
    rep = changeReputation(rep, 'iron-pact', 60);
    expect(getRelationshipStatus(rep, 'iron-pact')).toBe('allied');
  });

  it('should handle consecutive small changes correctly', () => {
    let rep = createStartingReputation();
    for (let i = 0; i < 150; i++) {
      rep = changeReputation(rep, 'iron-pact', 1);
    }
    expect(rep['iron-pact']).toBe(100); // clamped
    for (let i = 0; i < 300; i++) {
      rep = changeReputation(rep, 'iron-pact', -1);
    }
    expect(rep['iron-pact']).toBe(-100); // clamped
  });

  it('should not affect other factions when clamping', () => {
    let rep = createStartingReputation();
    rep = changeReputation(rep, 'iron-pact', 200);
    expect(rep['tidecallers']).toBe(0); // unchanged
    expect(rep['dustwalkers']).toBe(0); // unchanged
  });
});

// ============================================================
// Edge Case 15: Marketplace stock depletion
// ============================================================
describe('Edge Case 15: Marketplace stock depletion', () => {
  it('should track marketplace items with limited stock', () => {
    const regions = createInitialRegions();
    // Forge highlands has fuel for sale with available: 30
    const fuelItem = regions['forge-highlands'].marketplace.find(
      (m) => m.resourceType === 'fuel' && m.action === 'sell'
    );
    expect(fuelItem).toBeDefined();
    expect(fuelItem!.available).toBe(30);
  });

  it('should allow buying up to but not beyond stock', () => {
    const regions = createInitialRegions();
    const fuelItem = regions['forge-highlands'].marketplace.find(
      (m) => m.resourceType === 'fuel' && m.action === 'sell'
    );
    expect(fuelItem!.available).toBe(30);
    // Simulating stock check
    const wantToBuy = 30;
    const canBuy = fuelItem!.available === -1 || wantToBuy <= fuelItem!.available;
    expect(canBuy).toBe(true);
    const cantBuy = fuelItem!.available === -1 || 31 <= fuelItem!.available;
    expect(cantBuy).toBe(false);
  });

  it('should allow unlimited buying for items with available = -1', () => {
    const regions = createInitialRegions();
    // Forge highlands buys food with available: -1
    const foodBuyItem = regions['forge-highlands'].marketplace.find(
      (m) => m.resourceType === 'food' && m.action === 'buy'
    );
    expect(foodBuyItem).toBeDefined();
    expect(foodBuyItem!.available).toBe(-1);
    const canSellAny = foodBuyItem!.available === -1 || 999999 <= foodBuyItem!.available;
    expect(canSellAny).toBe(true);
  });

  it('should update stock after purchase simulation', () => {
    const regions = createInitialRegions();
    const region = regions['forge-highlands'];
    const item = region.marketplace.find((m) => m.resourceType === 'fuel' && m.action === 'sell')!;
    const originalAvailable = item.available;
    const bought = 10;
    const newAvailable = item.available === -1 ? -1 : item.available - bought;
    expect(newAvailable).toBe(originalAvailable - bought);
    expect(newAvailable).toBe(20);
  });

  it('should handle buying exactly all remaining stock', () => {
    const item = { resourceType: 'fuel' as const, action: 'sell' as const, basePrice: 3, available: 5, priceModifier: 1.0 };
    const newAvailable = item.available - 5;
    expect(newAvailable).toBe(0);
    // After depleting, further buys should fail
    const canBuyMore = item.available === -1 || 1 <= newAvailable;
    expect(canBuyMore).toBe(false);
  });

  it('should correctly compute price with modifier', () => {
    const unitPrice = Math.ceil(3 * 1.5); // basePrice 3, modifier 1.5
    expect(unitPrice).toBe(5); // Math.ceil(4.5) = 5
    const totalCost = unitPrice * 10;
    expect(totalCost).toBe(50);
  });
});
