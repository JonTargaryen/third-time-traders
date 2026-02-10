// ============================================================
// Engine — World / Map Logic
// ============================================================
import type { Region, RegionId, Caravan, ScoutingMission, Personnel } from './types';
import { ALL_REGION_IDS } from './types';
import { REGIONS, getTravelCost } from '@/data/regions';

/**
 * Create a deep copy of the initial regions map.
 */
export function createInitialRegions(): Record<RegionId, Region> {
  const regions = {} as Record<RegionId, Region>;
  for (const id of ALL_REGION_IDS) {
    regions[id] = {
      ...REGIONS[id],
      position: { ...REGIONS[id].position },
      resources: { ...REGIONS[id].resources },
      gatherActions: REGIONS[id].gatherActions?.map((a) => ({ ...a, resourceReward: { ...a.resourceReward } })) || [],
      marketplace: REGIONS[id].marketplace?.map((m) => ({ ...m })) || [],
      discoveryRequirements: { ...REGIONS[id].discoveryRequirements },
    };
  }
  return regions;
}

/**
 * Create the starting caravan.
 */
export function createInitialCaravan(): Caravan {
  return {
    currentRegion: 'obsidian-citadel', // Start at the capital
    fuelCapacity: 150,
    cargoCapacity: 100,
    speed: 1,
  };
}

/**
 * Calculate fuel cost to travel from one region to another.
 * Returns -1 if regions are not adjacent.
 */
export function calculateTravelCost(
  regions: Record<RegionId, Region>,
  from: RegionId,
  to: RegionId,
  caravan: Caravan
): { fuel: number; turns: number } | null {
  const fromRegion = regions[from];
  const toRegion = regions[to];
  if (!fromRegion || !toRegion) return null;
  if (!fromRegion.adjacentRegions.includes(to)) return null;
  if (!toRegion.discovered) return null;

  const baseFuel = getTravelCost(from, to);
  const fuelCost = Math.ceil(baseFuel / caravan.speed);
  return { fuel: fuelCost, turns: 1 };
}

/**
 * Check if player can travel to a region.
 */
export function canTravel(
  regions: Record<RegionId, Region>,
  from: RegionId,
  to: RegionId,
  currentFuel: number,
  caravan: Caravan
): { canTravel: boolean; reason?: string; cost?: { fuel: number; turns: number } } {
  const cost = calculateTravelCost(regions, from, to, caravan);
  if (!cost) {
    const toRegion = regions[to];
    if (!toRegion?.discovered) {
      return { canTravel: false, reason: 'Region not yet discovered. Send a scout or buy a map!' };
    }
    return { canTravel: false, reason: 'Regions are not adjacent.' };
  }
  if (currentFuel < cost.fuel) {
    return { canTravel: false, reason: `Not enough fuel. Need ${cost.fuel}, have ${currentFuel}.` };
  }
  return { canTravel: true, cost };
}

/**
 * Check if a scouting mission can be started.
 */
export function canStartScoutingMission(
  regions: Record<RegionId, Region>,
  currentRegion: RegionId,
  targetRegion: RegionId,
  scouts: Personnel[],
  currentGold: number
): { canStart: boolean; reason?: string } {
  const target = regions[targetRegion];
  if (!target) return { canStart: false, reason: 'Invalid region.' };
  if (target.discovered) return { canStart: false, reason: 'Region already discovered.' };
  
  const current = regions[currentRegion];
  if (!current.adjacentRegions.includes(targetRegion)) {
    return { canStart: false, reason: 'Region is not adjacent to your current location.' };
  }

  const availableScouts = scouts.filter((s) => s.role === 'scout' && s.status === 'available');
  if (availableScouts.length === 0) {
    return { canStart: false, reason: 'No scouts available. Hire or wait for one to return.' };
  }

  const discovery = target.discoveryRequirements ?? REGIONS[targetRegion]?.discoveryRequirements;
  const minGold = discovery?.minimumGold ?? 50;

  if (currentGold < minGold) {
    return { canStart: false, reason: `Need at least ${minGold} gold to fund the expedition.` };
  }

  return { canStart: true };
}

/**
 * Check if a map can be purchased to discover a region.
 */
export function canBuyMap(
  regions: Record<RegionId, Region>,
  targetRegion: RegionId,
  resources: { gold: number; information: number }
): { canBuy: boolean; reason?: string; cost?: { gold: number; information: number } } {
  const target = regions[targetRegion];
  if (!target) return { canBuy: false, reason: 'Invalid region.' };
  if (target.discovered) return { canBuy: false, reason: 'Region already discovered.' };

  const discovery = target.discoveryRequirements ?? REGIONS[targetRegion]?.discoveryRequirements;
  const cost = discovery?.mapCost ?? { gold: 50 };
  const goldCost = cost.gold || 0;
  const infoCost = cost.information || 0;

  if (resources.gold < goldCost) {
    return { canBuy: false, reason: `Need ${goldCost} gold. Have ${resources.gold}.` };
  }
  if (resources.information < infoCost) {
    return { canBuy: false, reason: `Need ${infoCost} information. Have ${resources.information}.` };
  }

  return { canBuy: true, cost: { gold: goldCost, information: infoCost } };
}

/**
 * Discover a region. Returns updated regions map.
 */
export function discoverRegion(
  regions: Record<RegionId, Region>,
  regionId: RegionId
): Record<RegionId, Region> {
  if (!regions[regionId]) return regions;
  if (regions[regionId].discovered) return regions;
  return {
    ...regions,
    [regionId]: { ...regions[regionId], discovered: true },
  };
}

/**
 * Get all discovered regions.
 */
export function getDiscoveredRegions(regions: Record<RegionId, Region>): Region[] {
  return ALL_REGION_IDS.map((id) => regions[id]).filter((r) => r.discovered);
}

/**
 * Get all undiscovered regions.
 */
export function getUndiscoveredRegions(regions: Record<RegionId, Region>): Region[] {
  return ALL_REGION_IDS.map((id) => regions[id]).filter((r) => !r.discovered);
}

/**
 * Check if two regions are adjacent.
 */
export function areRegionsAdjacent(
  regions: Record<RegionId, Region>,
  a: RegionId,
  b: RegionId
): boolean {
  const regionA = regions[a];
  if (!regionA) return false;
  return regionA.adjacentRegions.includes(b);
}

/**
 * Get adjacent regions that are discovered.
 */
export function getDiscoveredAdjacentRegions(
  regions: Record<RegionId, Region>,
  regionId: RegionId
): Region[] {
  const region = regions[regionId];
  if (!region) return [];
  return region.adjacentRegions
    .filter((adjId) => regions[adjId]?.discovered)
    .map((adjId) => regions[adjId]);
}

/**
 * Get regions that can be discovered from currently discovered regions.
 * (Adjacent to any discovered region, but themselves undiscovered.)
 */
export function getDiscoverableRegions(regions: Record<RegionId, Region>): Region[] {
  const discoverable = new Set<RegionId>();
  for (const id of ALL_REGION_IDS) {
    if (!regions[id].discovered) continue;
    for (const adjId of regions[id].adjacentRegions) {
      if (!regions[adjId].discovered) {
        discoverable.add(adjId);
      }
    }
  }
  return Array.from(discoverable).map((id) => regions[id]);
}

/**
 * Find shortest path between two discovered regions using BFS.
 * Returns array of region IDs forming the path, or null if no path exists.
 */
export function findPath(
  regions: Record<RegionId, Region>,
  from: RegionId,
  to: RegionId,
  onlyDiscovered: boolean = true
): RegionId[] | null {
  if (from === to) return [from];

  const visited = new Set<RegionId>();
  const queue: { id: RegionId; path: RegionId[] }[] = [{ id: from, path: [from] }];
  visited.add(from);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const region = regions[current.id];
    if (!region) continue;

    for (const adjId of region.adjacentRegions) {
      if (visited.has(adjId)) continue;
      if (onlyDiscovered && !regions[adjId]?.discovered) continue;

      const newPath = [...current.path, adjId];
      if (adjId === to) return newPath;

      visited.add(adjId);
      queue.push({ id: adjId, path: newPath });
    }
  }

  return null; // no path found
}
