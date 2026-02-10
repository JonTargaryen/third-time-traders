// ============================================================
// Engine — Inventory Management
// ============================================================
import type { Resources, ResourceType } from './types';
import { ALL_RESOURCE_TYPES } from './types';

export function createEmptyResources(): Resources {
  return { fuel: 0, water: 0, food: 0, gold: 0, contraband: 0, information: 0 };
}

export function createStartingResources(): Resources {
  return { fuel: 100, water: 100, food: 100, gold: 500, contraband: 0, information: 0 };
}

/**
 * Add resources to an inventory. All values are clamped to >= 0.
 */
export function addResources(current: Resources, toAdd: Partial<Resources>): Resources {
  const result = { ...current };
  for (const key of ALL_RESOURCE_TYPES) {
    if (toAdd[key] !== undefined) {
      result[key] = Math.max(0, result[key] + toAdd[key]);
    }
  }
  return result;
}

/**
 * Remove resources from an inventory. Returns null if insufficient resources.
 */
export function removeResources(current: Resources, toRemove: Partial<Resources>): Resources | null {
  const result = { ...current };
  for (const key of ALL_RESOURCE_TYPES) {
    if (toRemove[key] !== undefined) {
      const newVal = result[key] - toRemove[key]!;
      if (newVal < 0) return null; // insufficient
      result[key] = newVal;
    }
  }
  return result;
}

/**
 * Check if inventory has at least the specified amounts.
 */
export function hasResources(current: Resources, required: Partial<Resources>): boolean {
  for (const key of ALL_RESOURCE_TYPES) {
    if (required[key] !== undefined && current[key] < required[key]!) {
      return false;
    }
  }
  return true;
}

/**
 * Get total value of all resources (for scoring/display).
 */
export function totalResourceValue(resources: Resources): number {
  return ALL_RESOURCE_TYPES.reduce((sum, key) => sum + resources[key], 0);
}

/**
 * Get resources that are below a warning threshold.
 */
export function getLowResources(resources: Resources, threshold: number): ResourceType[] {
  return ALL_RESOURCE_TYPES.filter(
    (key) => key !== 'contraband' && key !== 'information' && resources[key] < threshold
  );
}

/**
 * Transfer resources from one inventory to another.
 * Returns null if source has insufficient resources.
 */
export function transferResources(
  from: Resources,
  to: Resources,
  amount: Partial<Resources>
): { from: Resources; to: Resources } | null {
  const newFrom = removeResources(from, amount);
  if (newFrom === null) return null;
  const newTo = addResources(to, amount);
  return { from: newFrom, to: newTo };
}
