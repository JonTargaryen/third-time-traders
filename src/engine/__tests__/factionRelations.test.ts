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
    const factions: FactionId[] = ['iron-pact', 'tidecallers', 'dustwalkers', 'verdant-commune', 'nightmarket-syndicate', 'ashen-throne'];
    for (const a of factions) {
      for (const b of factions) {
        expect(relations[a][b]).toBeDefined();
      }
    }
  });

  it('should have self-relations as allied', () => {
    const relations = createInitialFactionRelations();
    expect(relations['iron-pact']['iron-pact']).toBe('allied');
    expect(relations['tidecallers']['tidecallers']).toBe('allied');
  });

  it('should have symmetric relations', () => {
    const relations = createInitialFactionRelations();
    expect(relations['iron-pact']['ashen-throne']).toBe(relations['ashen-throne']['iron-pact']);
    expect(relations['nightmarket-syndicate']['dustwalkers']).toBe(relations['dustwalkers']['nightmarket-syndicate']);
  });

  it('should set initial lore-based relations', () => {
    const relations = createInitialFactionRelations();
    expect(relations['iron-pact']['ashen-throne']).toBe('tense');
    expect(relations['tidecallers']['verdant-commune']).toBe('friendly');
    expect(relations['nightmarket-syndicate']['ashen-throne']).toBe('hostile');
    expect(relations['verdant-commune']['iron-pact']).toBe('hostile');
    expect(relations['nightmarket-syndicate']['dustwalkers']).toBe('friendly');
  });
});

describe('shiftRelation', () => {
  it('should improve a relation by one step', () => {
    let relations = createInitialFactionRelations();
    // iron-pact vs ashen-throne starts at 'tense'
    relations = shiftRelation(relations, 'iron-pact', 'ashen-throne', 'improve');
    expect(getRelation(relations, 'iron-pact', 'ashen-throne')).toBe('neutral');
  });

  it('should worsen a relation by one step', () => {
    let relations = createInitialFactionRelations();
    // tidecallers vs verdant-commune starts at 'friendly'
    relations = shiftRelation(relations, 'tidecallers', 'verdant-commune', 'worsen');
    expect(getRelation(relations, 'tidecallers', 'verdant-commune')).toBe('neutral');
  });

  it('should not go below war', () => {
    let relations = createInitialFactionRelations();
    for (let i = 0; i < 20; i++) {
      relations = shiftRelation(relations, 'iron-pact', 'tidecallers', 'worsen');
    }
    expect(getRelation(relations, 'iron-pact', 'tidecallers')).toBe('war');
  });

  it('should not go above allied', () => {
    let relations = createInitialFactionRelations();
    for (let i = 0; i < 20; i++) {
      relations = shiftRelation(relations, 'iron-pact', 'tidecallers', 'improve');
    }
    expect(getRelation(relations, 'iron-pact', 'tidecallers')).toBe('allied');
  });

  it('should keep symmetry after shift', () => {
    let relations = createInitialFactionRelations();
    relations = shiftRelation(relations, 'iron-pact', 'tidecallers', 'improve');
    expect(getRelation(relations, 'iron-pact', 'tidecallers')).toBe(
      getRelation(relations, 'tidecallers', 'iron-pact')
    );
  });

  it('should not change self-relation', () => {
    let relations = createInitialFactionRelations();
    relations = shiftRelation(relations, 'iron-pact', 'iron-pact', 'worsen');
    expect(getRelation(relations, 'iron-pact', 'iron-pact')).toBe('allied');
  });
});

describe('getWars', () => {
  it('should return no wars initially', () => {
    const relations = createInitialFactionRelations();
    expect(getWars(relations).length).toBe(0);
  });

  it('should detect wars after worsening relations', () => {
    let relations = createInitialFactionRelations();
    // nightmarket vs ashen-throne starts hostile, worsen to war
    relations = shiftRelation(relations, 'nightmarket-syndicate', 'ashen-throne', 'worsen');
    const wars = getWars(relations);
    expect(wars.length).toBe(1);
    expect(wars[0]).toContain('nightmarket-syndicate');
    expect(wars[0]).toContain('ashen-throne');
  });

  it('should not double-count wars', () => {
    let relations = createInitialFactionRelations();
    relations = shiftRelation(relations, 'nightmarket-syndicate', 'ashen-throne', 'worsen');
    const wars = getWars(relations);
    expect(wars.length).toBe(1);
  });
});

describe('getAlliances', () => {
  it('should not include self-alliances', () => {
    const relations = createInitialFactionRelations();
    const alliances = getAlliances(relations);
    // Self-alliances (iron-pact with iron-pact) should NOT be included
    for (const [a, b] of alliances) {
      expect(a).not.toBe(b);
    }
  });

  it('should detect new alliances', () => {
    let relations = createInitialFactionRelations();
    // Improve tidecallers-verdant-commune from friendly to allied
    relations = shiftRelation(relations, 'tidecallers', 'verdant-commune', 'improve');
    const alliances = getAlliances(relations);
    const found = alliances.some(
      ([a, b]) => (a === 'tidecallers' && b === 'verdant-commune') || (b === 'tidecallers' && a === 'verdant-commune')
    );
    expect(found).toBe(true);
  });
});

describe('getRelation', () => {
  it('should return neutral for undefined relations', () => {
    const relations = createInitialFactionRelations();
    // getRelation has a fallback
    expect(getRelation(relations, 'iron-pact', 'tidecallers')).toBeDefined();
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
