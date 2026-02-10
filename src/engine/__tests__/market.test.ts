// ============================================================
// Tests — Market / Dynamic Pricing System
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createInitialMarket,
  applyMarketFluctuations,
  applyEventToMarket,
  getPrice,
  getPriceLabel,
  getMostVolatile,
} from '@/engine/market';
import type { GameEvent, RegionId, ResourceType } from '@/engine/types';
import { ALL_REGION_IDS, ALL_RESOURCE_TYPES } from '@/engine/types';

function createMockEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'test-event',
    category: 'market-shift',
    severity: 'moderate',
    title: 'Test',
    description: 'Test',
    turn: 1,
    affectedRegions: [],
    affectedFactions: [],
    resourceDelta: {},
    reputationDelta: {},
    tradeMultiplier: 1.0,
    duration: 2,
    expiresOnTurn: 3,
    dismissed: false,
    ...overrides,
  };
}

describe('createInitialMarket', () => {
  it('should create prices for all regions and resources', () => {
    const market = createInitialMarket();
    for (const regionId of ALL_REGION_IDS) {
      for (const resource of ALL_RESOURCE_TYPES) {
        expect(market.prices[regionId][resource]).toBe(1.0);
      }
    }
  });
});

describe('applyMarketFluctuations', () => {
  it('should change at least some prices', () => {
    const market = createInitialMarket();
    const fluctuated = applyMarketFluctuations(market);
    let changed = false;
    for (const regionId of ALL_REGION_IDS) {
      for (const resource of ALL_RESOURCE_TYPES) {
        if (fluctuated.prices[regionId][resource] !== market.prices[regionId][resource]) {
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    expect(changed).toBe(true);
  });

  it('should keep prices within bounds [0.3, 3.0]', () => {
    let market = createInitialMarket();
    for (let i = 0; i < 50; i++) {
      market = applyMarketFluctuations(market);
    }
    for (const regionId of ALL_REGION_IDS) {
      for (const resource of ALL_RESOURCE_TYPES) {
        const price = market.prices[regionId][resource]!;
        expect(price).toBeGreaterThanOrEqual(0.3);
        expect(price).toBeLessThanOrEqual(3.0);
      }
    }
  });

  it('should not mutate the original market', () => {
    const market = createInitialMarket();
    const original = JSON.stringify(market);
    applyMarketFluctuations(market);
    expect(JSON.stringify(market)).toBe(original);
  });
});

describe('applyEventToMarket', () => {
  it('should apply tradeMultiplier to affected regions', () => {
    const market = createInitialMarket();
    const event = createMockEvent({
      affectedRegions: ['delhi'],
      tradeMultiplier: 2.0,
    });
    const result = applyEventToMarket(market, event);
    expect(result.prices['delhi']['fuel']).toBe(2.0);
    // Non-affected regions should remain at 1.0
    expect(result.prices['kolkata']['fuel']).toBe(1.0);
  });

  it('should apply to all regions when no specific regions listed', () => {
    const market = createInitialMarket();
    const event = createMockEvent({
      affectedRegions: [],
      tradeMultiplier: 0.5,
    });
    const result = applyEventToMarket(market, event);
    for (const regionId of ALL_REGION_IDS) {
      expect(result.prices[regionId]['fuel']).toBe(0.5);
    }
  });

  it('should clamp prices within bounds', () => {
    const market = createInitialMarket();
    const event = createMockEvent({
      affectedRegions: [],
      tradeMultiplier: 10.0,
    });
    const result = applyEventToMarket(market, event);
    for (const regionId of ALL_REGION_IDS) {
      for (const resource of ALL_RESOURCE_TYPES) {
        expect(result.prices[regionId][resource]!).toBeLessThanOrEqual(3.0);
      }
    }
  });

  it('should not go below 0.3', () => {
    const market = createInitialMarket();
    const event = createMockEvent({
      affectedRegions: [],
      tradeMultiplier: 0.01,
    });
    const result = applyEventToMarket(market, event);
    for (const regionId of ALL_REGION_IDS) {
      for (const resource of ALL_RESOURCE_TYPES) {
        expect(result.prices[regionId][resource]!).toBeGreaterThanOrEqual(0.3);
      }
    }
  });
});

describe('getPrice', () => {
  it('should return 1.0 for initial market', () => {
    const market = createInitialMarket();
    expect(getPrice(market, 'delhi', 'fuel')).toBe(1.0);
  });

  it('should return 1.0 for missing entries', () => {
    const market = createInitialMarket();
    // Even for valid region/resource, should return 1.0 via fallback
    expect(getPrice(market, 'delhi', 'gold')).toBe(1.0);
  });
});

describe('getPriceLabel', () => {
  it('should return Surging for >= 1.5', () => {
    const result = getPriceLabel(1.5);
    expect(result.label).toBe('Surging');
  });

  it('should return Rising for >= 1.15', () => {
    const result = getPriceLabel(1.2);
    expect(result.label).toBe('Rising');
  });

  it('should return Stable for >= 0.85', () => {
    const result = getPriceLabel(1.0);
    expect(result.label).toBe('Stable');
  });

  it('should return Falling for >= 0.5', () => {
    const result = getPriceLabel(0.7);
    expect(result.label).toBe('Falling');
  });

  it('should return Crashing for < 0.5', () => {
    const result = getPriceLabel(0.3);
    expect(result.label).toBe('Crashing');
  });

  it('should include color and icon properties', () => {
    const result = getPriceLabel(1.0);
    expect(result.color).toBeDefined();
    expect(result.icon).toBeDefined();
  });
});

describe('getMostVolatile', () => {
  it('should return the requested count', () => {
    const market = createInitialMarket();
    const result = getMostVolatile(market, 3);
    expect(result.length).toBe(3);
  });

  it('should return entries with region, resource, price', () => {
    let market = createInitialMarket();
    market = applyMarketFluctuations(market);
    const result = getMostVolatile(market, 5);
    for (const entry of result) {
      expect(entry.region).toBeDefined();
      expect(entry.resource).toBeDefined();
      expect(typeof entry.price).toBe('number');
    }
  });

  it('should sort by deviation from 1.0 (most volatile first)', () => {
    let market = createInitialMarket();
    // Manually set extreme prices
    market.prices['delhi']['fuel'] = 2.5; // deviation 1.5
    market.prices['kolkata']['food'] = 0.3; // deviation 0.7
    const result = getMostVolatile(market, 2);
    expect(result[0].region).toBe('delhi');
    expect(result[0].resource).toBe('fuel');
  });
});
