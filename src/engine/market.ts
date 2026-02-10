// ============================================================
// Engine — Dynamic Market / Price Volatility
// ============================================================
import type { MarketPrices, RegionId, ResourceType, GameEvent } from './types';
import { ALL_REGION_IDS, ALL_RESOURCE_TYPES } from './types';

/**
 * Create initial market with all prices at 1.0 (baseline).
 */
export function createInitialMarket(): MarketPrices {
  const prices = {} as MarketPrices['prices'];
  for (const regionId of ALL_REGION_IDS) {
    prices[regionId] = {};
    for (const resource of ALL_RESOURCE_TYPES) {
      prices[regionId][resource] = 1.0;
    }
  }
  return { prices };
}

/**
 * Apply random market fluctuations each turn.
 * Each resource in each region shifts by ±5-15%.
 */
export function applyMarketFluctuations(market: MarketPrices): MarketPrices {
  const newPrices = deepCopyPrices(market);
  for (const regionId of ALL_REGION_IDS) {
    for (const resource of ALL_RESOURCE_TYPES) {
      const current = newPrices.prices[regionId][resource] ?? 1.0;
      // Random walk: -15% to +15%
      const change = 1 + (Math.random() * 0.3 - 0.15);
      // Mean reversion: pull toward 1.0
      const reverted = current * 0.85 + 1.0 * 0.15;
      const newPrice = Math.max(0.3, Math.min(3.0, reverted * change));
      newPrices.prices[regionId][resource] = Math.round(newPrice * 100) / 100;
    }
  }
  return newPrices;
}

/**
 * Apply event-driven price shocks to the market.
 */
export function applyEventToMarket(market: MarketPrices, event: GameEvent): MarketPrices {
  const newPrices = deepCopyPrices(market);
  const regions = event.affectedRegions.length > 0 ? event.affectedRegions : ALL_REGION_IDS;

  for (const regionId of regions) {
    for (const resource of ALL_RESOURCE_TYPES) {
      const current = newPrices.prices[regionId][resource] ?? 1.0;
      newPrices.prices[regionId][resource] = Math.max(
        0.3,
        Math.min(3.0, Math.round(current * event.tradeMultiplier * 100) / 100)
      );
    }
  }
  return newPrices;
}

/**
 * Get the price of a resource in a region.
 */
export function getPrice(market: MarketPrices, regionId: RegionId, resource: ResourceType): number {
  return market.prices[regionId]?.[resource] ?? 1.0;
}

/**
 * Get a formatted price label with direction indicator.
 */
export function getPriceLabel(multiplier: number): { label: string; color: string; icon: string } {
  if (multiplier >= 1.5) return { label: 'Surging', color: 'text-red-500', icon: '🔺' };
  if (multiplier >= 1.15) return { label: 'Rising', color: 'text-orange-400', icon: '▲' };
  if (multiplier >= 0.85) return { label: 'Stable', color: 'text-zinc-400', icon: '▬' };
  if (multiplier >= 0.5) return { label: 'Falling', color: 'text-emerald-400', icon: '▼' };
  return { label: 'Crashing', color: 'text-emerald-600', icon: '🔻' };
}

/**
 * Get the most volatile resources across all regions.
 */
export function getMostVolatile(market: MarketPrices, count: number): { region: RegionId; resource: ResourceType; price: number }[] {
  const entries: { region: RegionId; resource: ResourceType; price: number; deviation: number }[] = [];
  for (const regionId of ALL_REGION_IDS) {
    for (const resource of ALL_RESOURCE_TYPES) {
      const price = market.prices[regionId]?.[resource] ?? 1.0;
      entries.push({ region: regionId, resource, price, deviation: Math.abs(price - 1.0) });
    }
  }
  entries.sort((a, b) => b.deviation - a.deviation);
  return entries.slice(0, count).map(({ region, resource, price }) => ({ region, resource, price }));
}

function deepCopyPrices(market: MarketPrices): MarketPrices {
  const prices = {} as MarketPrices['prices'];
  for (const regionId of ALL_REGION_IDS) {
    prices[regionId] = { ...market.prices[regionId] };
  }
  return { prices };
}
