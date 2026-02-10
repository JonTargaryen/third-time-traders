// ============================================================
// Engine — Trade Route System
// ============================================================
import type { TradeRoute, Resources, ReputationMap, RegionId } from './types';
import { hasResources, removeResources, addResources } from './inventory';
import { meetsReputationRequirements, changeReputation } from './reputation';
import { REGIONS } from '@/data/regions';

/**
 * Check if a trade route can be established.
 */
export function canEstablishRoute(
  route: TradeRoute,
  resources: Resources,
  reputation: ReputationMap
): { canEstablish: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (route.established) {
    reasons.push('Route is already established');
  }

  if (!hasResources(resources, route.costToEstablish)) {
    reasons.push('Insufficient resources');
  }

  if (!meetsReputationRequirements(reputation, route.requiredReputation)) {
    reasons.push('Insufficient reputation with required factions');
  }

  // Both regions must be discovered
  const fromRegion = REGIONS[route.from];
  const toRegion = REGIONS[route.to];
  if (fromRegion && !fromRegion.discovered) {
    reasons.push(`Region ${fromRegion.name} is not yet discovered`);
  }
  if (toRegion && !toRegion.discovered) {
    reasons.push(`Region ${toRegion.name} is not yet discovered`);
  }

  return { canEstablish: reasons.length === 0, reasons };
}

/**
 * Establish a trade route. Returns updated resources, reputation, and route.
 * Returns null if requirements not met.
 */
export function establishRoute(
  route: TradeRoute,
  resources: Resources,
  reputation: ReputationMap
): { resources: Resources; reputation: ReputationMap; route: TradeRoute } | null {
  const check = canEstablishRoute(route, resources, reputation);
  if (!check.canEstablish) return null;

  const newResources = removeResources(resources, route.costToEstablish);
  if (!newResources) return null;

  // Gain reputation with both factions for establishing trade
  let newReputation = reputation;
  for (const req of route.requiredReputation) {
    newReputation = changeReputation(newReputation, req.factionId, 5);
  }

  const newRoute: TradeRoute = { ...route, established: true };

  return { resources: newResources, reputation: newReputation, route: newRoute };
}

/**
 * Collect profits from all established trade routes.
 */
export function collectTradeProfits(
  routes: TradeRoute[],
  currentResources: Resources
): Resources {
  let result = { ...currentResources };
  for (const route of routes) {
    if (route.established) {
      result = addResources(result, route.profitPerTurn);
    }
  }
  return result;
}

/**
 * Get all routes connected to a region.
 */
export function getRoutesForRegion(routes: TradeRoute[], regionId: RegionId): TradeRoute[] {
  return routes.filter((r) => r.from === regionId || r.to === regionId);
}

/**
 * Get all established routes.
 */
export function getEstablishedRoutes(routes: TradeRoute[]): TradeRoute[] {
  return routes.filter((r) => r.established);
}

/**
 * Get the total profit per turn from all established routes.
 */
export function getTotalProfitPerTurn(routes: TradeRoute[]): Partial<Resources> {
  const profit: Partial<Resources> = {};
  for (const route of routes) {
    if (!route.established) continue;
    for (const [key, value] of Object.entries(route.profitPerTurn)) {
      const k = key as keyof Resources;
      profit[k] = (profit[k] || 0) + (value || 0);
    }
  }
  return profit;
}

/**
 * Dismantle a trade route, returning some resources.
 */
export function dismantleRoute(
  route: TradeRoute,
  resources: Resources,
  reputation: ReputationMap
): { resources: Resources; reputation: ReputationMap; route: TradeRoute } | null {
  if (!route.established) return null;

  // Refund 25% of establishment cost
  const refund: Partial<Resources> = {};
  for (const [key, value] of Object.entries(route.costToEstablish)) {
    if (value) {
      refund[key as keyof Resources] = Math.floor(value * 0.25);
    }
  }

  const newResources = addResources(resources, refund);

  // Lose reputation with involved factions
  let newReputation = reputation;
  for (const req of route.requiredReputation) {
    newReputation = changeReputation(newReputation, req.factionId, -10);
  }

  const newRoute: TradeRoute = { ...route, established: false };

  return { resources: newResources, reputation: newReputation, route: newRoute };
}
