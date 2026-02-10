// ============================================================
// Tests — Faction Relations System
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createInitialFactionRelations,
  shiftRelation,
  getRelation,
  getWars,
  getAlliances,
  getRelationColor,
  getRelationIcon,
} from '@/engine/factionRelations';
import type { FactionId, FactionRelation } from '@/engine/types';

describe('createInitialFactionRelations', () => {
  it('should create relations for all factions', () => {
    const relations = createInitialFactionRelations();
    const factions: FactionId[] = ['mughal-court', 'east-india-company', 'rajput-clans', 'brahmin-council', 'nightmarket-syndicate', 'nizams-court'];
    for (const a of factions) {
      for (const b of factions) {
        expect(relations[a][b]).toBeDefined();
      }
    }
  });

  it('should have self-relations as allied', () => {
    const relations = createInitialFactionRelations();
    expect(relations['mughal-court']['mughal-court']).toBe('allied');
    expect(relations['rajput-clans']['rajput-clans']).toBe('allied');
  });

  it('should have symmetric relations', () => {
    const relations = createInitialFactionRelations();
    expect(relations['mughal-court']['rajput-clans']).toBe(relations['rajput-clans']['mughal-court']);
    expect(relations['nightmarket-syndicate']['nizams-court']).toBe(relations['nizams-court']['nightmarket-syndicate']);
  });

  it('should set initial lore-based relations', () => {
    const relations = createInitialFactionRelations();
    expect(relations['mughal-court']['rajput-clans']).toBe('tense');
    expect(relations['brahmin-council']['nizams-court']).toBe('friendly');
    expect(relations['nightmarket-syndicate']['mughal-court']).toBe('hostile');
    expect(relations['brahmin-council']['east-india-company']).toBe('hostile');
    expect(relations['nightmarket-syndicate']['nizams-court']).toBe('friendly');
  });
});

describe('shiftRelation', () => {
  it('should improve a relation by one step', () => {
    let relations = createInitialFactionRelations();
    // mughal-court vs rajput-clans starts at 'tense'
    relations = shiftRelation(relations, 'mughal-court', 'rajput-clans', 'improve');
    expect(getRelation(relations, 'mughal-court', 'rajput-clans')).toBe('neutral');
  });

  it('should worsen a relation by one step', () => {
    let relations = createInitialFactionRelations();
    // brahmin-council vs nizams-court starts at 'friendly'
    relations = shiftRelation(relations, 'brahmin-council', 'nizams-court', 'worsen');
    expect(getRelation(relations, 'brahmin-council', 'nizams-court')).toBe('neutral');
  });

  it('should not go below war', () => {
    let relations = createInitialFactionRelations();
    for (let i = 0; i < 20; i++) {
      relations = shiftRelation(relations, 'mughal-court', 'east-india-company', 'worsen');
    }
    expect(getRelation(relations, 'mughal-court', 'east-india-company')).toBe('war');
  });

  it('should not go above allied', () => {
    let relations = createInitialFactionRelations();
    for (let i = 0; i < 20; i++) {
      relations = shiftRelation(relations, 'mughal-court', 'east-india-company', 'improve');
    }
    expect(getRelation(relations, 'mughal-court', 'east-india-company')).toBe('allied');
  });

  it('should keep symmetry after shift', () => {
    let relations = createInitialFactionRelations();
    relations = shiftRelation(relations, 'mughal-court', 'east-india-company', 'improve');
    expect(getRelation(relations, 'mughal-court', 'east-india-company')).toBe(
      getRelation(relations, 'east-india-company', 'mughal-court')
    );
  });

  it('should not change self-relation', () => {
    let relations = createInitialFactionRelations();
    relations = shiftRelation(relations, 'mughal-court', 'mughal-court', 'worsen');
    expect(getRelation(relations, 'mughal-court', 'mughal-court')).toBe('allied');
  });
});

describe('getWars', () => {
  it('should return no wars initially', () => {
    const relations = createInitialFactionRelations();
    expect(getWars(relations).length).toBe(0);
  });

  it('should detect wars after worsening relations', () => {
    let relations = createInitialFactionRelations();
    // nightmarket vs mughal-court starts hostile, worsen to war
    relations = shiftRelation(relations, 'nightmarket-syndicate', 'mughal-court', 'worsen');
    const wars = getWars(relations);
    expect(wars.length).toBe(1);
    expect(wars[0]).toContain('nightmarket-syndicate');
    expect(wars[0]).toContain('mughal-court');
  });

  it('should not double-count wars', () => {
    let relations = createInitialFactionRelations();
    relations = shiftRelation(relations, 'nightmarket-syndicate', 'mughal-court', 'worsen');
    const wars = getWars(relations);
    expect(wars.length).toBe(1);
  });
});

describe('getAlliances', () => {
  it('should not include self-alliances', () => {
    const relations = createInitialFactionRelations();
    const alliances = getAlliances(relations);
    for (const [a, b] of alliances) {
      expect(a).not.toBe(b);
    }
  });

  it('should detect new alliances', () => {
    let relations = createInitialFactionRelations();
    // Improve brahmin-council-nizams-court from friendly to allied
    relations = shiftRelation(relations, 'brahmin-council', 'nizams-court', 'improve');
    const alliances = getAlliances(relations);
    const found = alliances.some(
      ([a, b]) => (a === 'brahmin-council' && b === 'nizams-court') || (b === 'brahmin-council' && a === 'nizams-court')
    );
    expect(found).toBe(true);
  });
});

describe('getRelation', () => {
  it('should return neutral for undefined relations', () => {
    const relations = createInitialFactionRelations();
    expect(getRelation(relations, 'mughal-court', 'east-india-company')).toBeDefined();
  });
});

describe('getRelationColor', () => {
  it('should return colors for all relation types', () => {
    const types: FactionRelation[] = ['war', 'hostile', 'tense', 'neutral', 'friendly', 'allied'];
    for (const type of types) {
      expect(getRelationColor(type)).toBeDefined();
      expect(getRelationColor(type)).toContain('text-');
    }
  });
});

describe('getRelationIcon', () => {
  it('should return icons for all relation types', () => {
    const types: FactionRelation[] = ['war', 'hostile', 'tense', 'neutral', 'friendly', 'allied'];
    for (const type of types) {
      expect(getRelationIcon(type)).toBeDefined();
      expect(typeof getRelationIcon(type)).toBe('string');
    }
  });
});
