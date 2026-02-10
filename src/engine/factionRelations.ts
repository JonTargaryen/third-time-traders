// ============================================================
// Engine — Faction Relations (faction-to-faction dynamics)
// ============================================================
import type { FactionId, FactionRelation, FactionRelationMap } from './types';
import { ALL_FACTION_IDS } from './types';

/**
 * Create initial faction-to-faction relations.
 * Each faction starts with a defined relationship to every other.
 */
export function createInitialFactionRelations(): FactionRelationMap {
  const relations = {} as FactionRelationMap;

  for (const a of ALL_FACTION_IDS) {
    relations[a] = {} as Record<FactionId, FactionRelation>;
    for (const b of ALL_FACTION_IDS) {
      relations[a][b] = a === b ? 'allied' : 'neutral';
    }
  }

  // Lore-based starting relations
  // Iron Pact & Ashen Throne: tense (competing for power)
  setRelation(relations, 'iron-pact', 'ashen-throne', 'tense');
  // Tidecallers & Verdant Commune: friendly (nature-aligned)
  setRelation(relations, 'tidecallers', 'verdant-commune', 'friendly');
  // Nightmarket & Ashen Throne: hostile (crime vs law)
  setRelation(relations, 'nightmarket-syndicate', 'ashen-throne', 'hostile');
  // Dustwalkers & Tidecallers: tense (desert vs sea)
  setRelation(relations, 'dustwalkers', 'tidecallers', 'tense');
  // Verdant Commune & Iron Pact: hostile (nature vs industry)
  setRelation(relations, 'verdant-commune', 'iron-pact', 'hostile');
  // Nightmarket & Dustwalkers: friendly (trade partners)
  setRelation(relations, 'nightmarket-syndicate', 'dustwalkers', 'friendly');

  return relations;
}

function setRelation(map: FactionRelationMap, a: FactionId, b: FactionId, rel: FactionRelation) {
  map[a][b] = rel;
  map[b][a] = rel; // symmetric
}

/**
 * Shift a faction relation up or down.
 */
const RELATION_ORDER: FactionRelation[] = ['war', 'hostile', 'tense', 'neutral', 'friendly', 'allied'];

export function shiftRelation(
  relations: FactionRelationMap,
  a: FactionId,
  b: FactionId,
  direction: 'improve' | 'worsen'
): FactionRelationMap {
  if (a === b) return relations;
  const currentIndex = RELATION_ORDER.indexOf(relations[a][b]);
  const newIndex = direction === 'improve'
    ? Math.min(currentIndex + 1, RELATION_ORDER.length - 1)
    : Math.max(currentIndex - 1, 0);

  const newRelation = RELATION_ORDER[newIndex];
  const updated = deepCopyRelations(relations);
  updated[a][b] = newRelation;
  updated[b][a] = newRelation;
  return updated;
}

/**
 * Get all factions at war.
 */
export function getWars(relations: FactionRelationMap): [FactionId, FactionId][] {
  const wars: [FactionId, FactionId][] = [];
  const seen = new Set<string>();
  for (const a of ALL_FACTION_IDS) {
    for (const b of ALL_FACTION_IDS) {
      if (a !== b && relations[a][b] === 'war') {
        const key = [a, b].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          wars.push([a, b]);
        }
      }
    }
  }
  return wars;
}

/**
 * Get all alliances.
 */
export function getAlliances(relations: FactionRelationMap): [FactionId, FactionId][] {
  const alliances: [FactionId, FactionId][] = [];
  const seen = new Set<string>();
  for (const a of ALL_FACTION_IDS) {
    for (const b of ALL_FACTION_IDS) {
      if (a !== b && relations[a][b] === 'allied') {
        const key = [a, b].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          alliances.push([a, b]);
        }
      }
    }
  }
  return alliances;
}

/**
 * Get the relation between two factions.
 */
export function getRelation(relations: FactionRelationMap, a: FactionId, b: FactionId): FactionRelation {
  return relations[a]?.[b] ?? 'neutral';
}

/**
 * Get the display color for a relation.
 */
export function getRelationColor(relation: FactionRelation): string {
  const colors: Record<FactionRelation, string> = {
    war: 'text-red-600',
    hostile: 'text-red-400',
    tense: 'text-orange-400',
    neutral: 'text-zinc-400',
    friendly: 'text-emerald-400',
    allied: 'text-blue-400',
  };
  return colors[relation];
}

/**
 * Get the display icon for a relation.
 */
export function getRelationIcon(relation: FactionRelation): string {
  const icons: Record<FactionRelation, string> = {
    war: '⚔️',
    hostile: '😡',
    tense: '😠',
    neutral: '😐',
    friendly: '😊',
    allied: '🤝',
  };
  return icons[relation];
}

function deepCopyRelations(relations: FactionRelationMap): FactionRelationMap {
  const copy = {} as FactionRelationMap;
  for (const a of ALL_FACTION_IDS) {
    copy[a] = { ...relations[a] };
  }
  return copy;
}
