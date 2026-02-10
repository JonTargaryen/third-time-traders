// ============================================================
// Tests — Events System
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  generateTurnEvents,
  pruneExpiredEvents,
  getRegionTradeMultiplier,
  getEventsForRegion,
  getEventsForFaction,
  countEventsBySeverity,
  getSeverityColor,
  getCategoryIcon,
} from '@/engine/events';
import type { GameEvent, RegionId, EventSeverity, EventCategory } from '@/engine/types';

function createMockEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'test-event',
    category: 'market-shift',
    severity: 'moderate',
    title: 'Test Event',
    description: 'A test event',
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

describe('generateTurnEvents', () => {
  it('should generate events for a given turn', () => {
    const events = generateTurnEvents(5, ['forge-highlands', 'shattered-coast']);
    expect(Array.isArray(events)).toBe(true);
    // Events are random, so we just check they're valid
    for (const event of events) {
      expect(event.id).toBeDefined();
      expect(event.turn).toBe(5);
      expect(event.expiresOnTurn).toBeGreaterThan(5);
      expect(event.duration).toBeGreaterThan(0);
    }
  });

  it('should generate events even with no discovered regions', () => {
    const events = generateTurnEvents(1, []);
    expect(Array.isArray(events)).toBe(true);
  });

  it('should generate events with valid severity', () => {
    const validSeverities: EventSeverity[] = ['minor', 'moderate', 'major', 'catastrophic'];
    // Generate many events to get variety
    for (let i = 0; i < 20; i++) {
      const events = generateTurnEvents(i + 1, ['forge-highlands']);
      for (const event of events) {
        expect(validSeverities).toContain(event.severity);
      }
    }
  });

  it('should generate events with valid categories', () => {
    const validCategories: EventCategory[] = [
      'natural-disaster', 'market-shift', 'faction-conflict', 'faction-alliance',
      'pirate-raid', 'discovery', 'plague', 'festival', 'smuggling', 'diplomatic',
    ];
    for (let i = 0; i < 20; i++) {
      const events = generateTurnEvents(i + 1, ['forge-highlands', 'shattered-coast']);
      for (const event of events) {
        expect(validCategories).toContain(event.category);
      }
    }
  });
});

describe('pruneExpiredEvents', () => {
  it('should remove events that have expired', () => {
    const events = [
      createMockEvent({ id: 'e1', expiresOnTurn: 3, duration: 2 }),
      createMockEvent({ id: 'e2', expiresOnTurn: 5, duration: 3 }),
      createMockEvent({ id: 'e3', expiresOnTurn: 10, duration: 5 }),
    ];
    const pruned = pruneExpiredEvents(events, 5);
    expect(pruned.length).toBe(1);
    expect(pruned[0].id).toBe('e3');
  });

  it('should keep events that expire after current turn', () => {
    const events = [createMockEvent({ expiresOnTurn: 10, duration: 5 })];
    const pruned = pruneExpiredEvents(events, 5);
    expect(pruned.length).toBe(1);
  });

  it('should keep events with duration 0 (permanent)', () => {
    const events = [createMockEvent({ expiresOnTurn: 1, duration: 0 })];
    const pruned = pruneExpiredEvents(events, 100);
    expect(pruned.length).toBe(1);
  });

  it('should handle empty events array', () => {
    expect(pruneExpiredEvents([], 10)).toEqual([]);
  });
});

describe('getRegionTradeMultiplier', () => {
  it('should return 1.0 with no events', () => {
    expect(getRegionTradeMultiplier([], 'forge-highlands')).toBe(1.0);
  });

  it('should apply event multiplier for affected region', () => {
    const events = [
      createMockEvent({ affectedRegions: ['forge-highlands'], tradeMultiplier: 0.5 }),
    ];
    expect(getRegionTradeMultiplier(events, 'forge-highlands')).toBe(0.5);
  });

  it('should apply global events (no affected regions) to all regions', () => {
    const events = [
      createMockEvent({ affectedRegions: [], tradeMultiplier: 1.5 }),
    ];
    expect(getRegionTradeMultiplier(events, 'forge-highlands')).toBe(1.5);
    expect(getRegionTradeMultiplier(events, 'shattered-coast')).toBe(1.5);
  });

  it('should multiply multiple event effects', () => {
    const events = [
      createMockEvent({ id: 'e1', affectedRegions: ['forge-highlands'], tradeMultiplier: 0.5 }),
      createMockEvent({ id: 'e2', affectedRegions: ['forge-highlands'], tradeMultiplier: 0.5 }),
    ];
    expect(getRegionTradeMultiplier(events, 'forge-highlands')).toBe(0.25);
  });

  it('should floor at 0.1', () => {
    const events = [
      createMockEvent({ id: 'e1', affectedRegions: [], tradeMultiplier: 0.01 }),
    ];
    expect(getRegionTradeMultiplier(events, 'forge-highlands')).toBe(0.1);
  });

  it('should not apply non-matching region events', () => {
    const events = [
      createMockEvent({ affectedRegions: ['shattered-coast'], tradeMultiplier: 0.1 }),
    ];
    expect(getRegionTradeMultiplier(events, 'forge-highlands')).toBe(1.0);
  });
});

describe('getEventsForRegion', () => {
  it('should return events affecting a specific region', () => {
    const events = [
      createMockEvent({ id: 'e1', affectedRegions: ['forge-highlands'] }),
      createMockEvent({ id: 'e2', affectedRegions: ['shattered-coast'] }),
      createMockEvent({ id: 'e3', affectedRegions: [] }), // global
    ];
    const result = getEventsForRegion(events, 'forge-highlands');
    expect(result.length).toBe(2); // e1 + global e3
    expect(result.map((e) => e.id)).toContain('e1');
    expect(result.map((e) => e.id)).toContain('e3');
  });
});

describe('getEventsForFaction', () => {
  it('should return events affecting a specific faction', () => {
    const events = [
      createMockEvent({ id: 'e1', affectedFactions: ['iron-pact'] }),
      createMockEvent({ id: 'e2', affectedFactions: ['tidecallers'] }),
      createMockEvent({ id: 'e3', affectedFactions: [] }), // global
    ];
    const result = getEventsForFaction(events, 'iron-pact');
    expect(result.length).toBe(2);
  });
});

describe('countEventsBySeverity', () => {
  it('should count events by severity', () => {
    const events = [
      createMockEvent({ severity: 'minor' }),
      createMockEvent({ severity: 'minor' }),
      createMockEvent({ severity: 'major' }),
      createMockEvent({ severity: 'catastrophic' }),
    ];
    const counts = countEventsBySeverity(events);
    expect(counts.minor).toBe(2);
    expect(counts.moderate).toBe(0);
    expect(counts.major).toBe(1);
    expect(counts.catastrophic).toBe(1);
  });

  it('should return all zeros for empty array', () => {
    const counts = countEventsBySeverity([]);
    expect(counts).toEqual({ minor: 0, moderate: 0, major: 0, catastrophic: 0 });
  });
});

describe('getSeverityColor', () => {
  it('should return correct colors for each severity', () => {
    expect(getSeverityColor('minor')).toBe('text-zinc-500');
    expect(getSeverityColor('moderate')).toBe('text-amber-500');
    expect(getSeverityColor('major')).toBe('text-orange-500');
    expect(getSeverityColor('catastrophic')).toBe('text-red-600');
  });
});

describe('getCategoryIcon', () => {
  it('should return icons for all categories', () => {
    const categories: EventCategory[] = [
      'natural-disaster', 'market-shift', 'faction-conflict', 'faction-alliance',
      'pirate-raid', 'discovery', 'plague', 'festival', 'smuggling', 'diplomatic',
    ];
    for (const cat of categories) {
      expect(getCategoryIcon(cat)).toBeDefined();
      expect(typeof getCategoryIcon(cat)).toBe('string');
    }
  });
});
