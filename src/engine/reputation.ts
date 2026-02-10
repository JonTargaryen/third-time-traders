// ============================================================
// Engine — Reputation System
// ============================================================
import type { FactionId, ReputationMap } from './types';
import { ALL_FACTION_IDS, REPUTATION_MIN, REPUTATION_MAX } from './types';
import { FACTIONS } from '@/data/factions';

export function createStartingReputation(): ReputationMap {
  const rep = {} as ReputationMap;
  for (const id of ALL_FACTION_IDS) {
    rep[id] = 0;
  }
  return rep;
}

/**
 * Clamp a reputation value to the valid range.
 */
export function clampReputation(value: number): number {
  return Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, value));
}

/**
 * Change reputation with a faction. Returns new reputation map.
 */
export function changeReputation(
  current: ReputationMap,
  factionId: FactionId,
  delta: number
): ReputationMap {
  const result = { ...current };
  result[factionId] = clampReputation(result[factionId] + delta);
  return result;
}

/**
 * Change reputation with multiple factions at once.
 */
export function changeMultipleReputations(
  current: ReputationMap,
  changes: Partial<Record<FactionId, number>>
): ReputationMap {
  let result = { ...current };
  for (const [factionId, delta] of Object.entries(changes)) {
    if (delta !== undefined) {
      result = changeReputation(result, factionId as FactionId, delta);
    }
  }
  return result;
}

/**
 * Check if a faction is hostile toward the player.
 */
export function isFactionHostile(reputation: ReputationMap, factionId: FactionId): boolean {
  const faction = FACTIONS[factionId];
  if (!faction) return false;
  return reputation[factionId] < faction.hostilityThreshold;
}

/**
 * Check if a faction considers the player an ally.
 */
export function isFactionAllied(reputation: ReputationMap, factionId: FactionId): boolean {
  const faction = FACTIONS[factionId];
  if (!faction) return false;
  return reputation[factionId] >= faction.allyThreshold;
}

/**
 * Get the relationship status label for display.
 */
export type RelationshipStatus = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';

export function getRelationshipStatus(reputation: ReputationMap, factionId: FactionId): RelationshipStatus {
  if (isFactionHostile(reputation, factionId)) return 'hostile';
  if (isFactionAllied(reputation, factionId)) return 'allied';

  const rep = reputation[factionId];
  if (rep < -10) return 'unfriendly';
  if (rep >= 30) return 'friendly';
  return 'neutral';
}

/**
 * Get all hostile factions.
 */
export function getHostileFactions(reputation: ReputationMap): FactionId[] {
  return ALL_FACTION_IDS.filter((id) => isFactionHostile(reputation, id));
}

/**
 * Get all allied factions.
 */
export function getAlliedFactions(reputation: ReputationMap): FactionId[] {
  return ALL_FACTION_IDS.filter((id) => isFactionAllied(reputation, id));
}

/**
 * Check if player meets reputation requirements (e.g., for trade routes).
 */
export function meetsReputationRequirements(
  reputation: ReputationMap,
  requirements: { factionId: FactionId; minimum: number }[]
): boolean {
  return requirements.every((req) => reputation[req.factionId] >= req.minimum);
}
