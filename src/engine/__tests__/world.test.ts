// ============================================================
// Tests — World Engine (95%+ coverage target)
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createInitialRegions,
  discoverRegion,
  getDiscoveredRegions,
  getUndiscoveredRegions,
  areRegionsAdjacent,
  getDiscoveredAdjacentRegions,
  getDiscoverableRegions,
  findPath,
} from '@/engine/world';
import type { RegionId } from '@/engine/types';

describe('World Engine', () => {
  describe('createInitialRegions', () => {
    it('should create regions for all region IDs', () => {
      const regions = createInitialRegions();
      expect(Object.keys(regions).length).toBe(6);
    });

    it('should have correct initial discovery states', () => {
      const regions = createInitialRegions();
      // delhi, kolkata, hyderabad are discovered
      expect(regions['delhi'].discovered).toBe(true);
      expect(regions['kolkata'].discovered).toBe(true);
      expect(regions['hyderabad'].discovered).toBe(true);
      // jaisalmer, varanasi, bombay are undiscovered
      expect(regions['jaisalmer'].discovered).toBe(false);
      expect(regions['varanasi'].discovered).toBe(false);
      expect(regions['bombay'].discovered).toBe(false);
    });

    it('should create deep copies (not share references)', () => {
      const r1 = createInitialRegions();
      const r2 = createInitialRegions();
      r1['delhi'].discovered = false;
      expect(r2['delhi'].discovered).toBe(true);
    });
  });

  describe('discoverRegion', () => {
    it('should discover an undiscovered region', () => {
      const regions = createInitialRegions();
      const result = discoverRegion(regions, 'jaisalmer');
      expect(result['jaisalmer'].discovered).toBe(true);
    });

    it('should not modify already discovered region', () => {
      const regions = createInitialRegions();
      const result = discoverRegion(regions, 'delhi');
      expect(result).toBe(regions); // same reference = no change
    });

    it('should not mutate original', () => {
      const regions = createInitialRegions();
      discoverRegion(regions, 'jaisalmer');
      expect(regions['jaisalmer'].discovered).toBe(false);
    });

    it('should handle invalid region ID', () => {
      const regions = createInitialRegions();
      const result = discoverRegion(regions, 'nonexistent' as RegionId);
      expect(result).toBe(regions);
    });
  });

  describe('getDiscoveredRegions', () => {
    it('should return only discovered regions', () => {
      const regions = createInitialRegions();
      const discovered = getDiscoveredRegions(regions);
      expect(discovered.length).toBe(3);
      expect(discovered.every((r) => r.discovered)).toBe(true);
    });

    it('should reflect changes after discovery', () => {
      const regions = createInitialRegions();
      const updated = discoverRegion(regions, 'jaisalmer');
      const discovered = getDiscoveredRegions(updated);
      expect(discovered.length).toBe(4);
    });
  });

  describe('getUndiscoveredRegions', () => {
    it('should return only undiscovered regions', () => {
      const regions = createInitialRegions();
      const undiscovered = getUndiscoveredRegions(regions);
      expect(undiscovered.length).toBe(3);
      expect(undiscovered.every((r) => !r.discovered)).toBe(true);
    });
  });

  describe('areRegionsAdjacent', () => {
    it('should return true for adjacent regions', () => {
      const regions = createInitialRegions();
      expect(areRegionsAdjacent(regions, 'delhi', 'kolkata')).toBe(true);
    });

    it('should return false for non-adjacent regions', () => {
      const regions = createInitialRegions();
      expect(areRegionsAdjacent(regions, 'delhi', 'bombay')).toBe(false);
    });

    it('should return false for invalid region', () => {
      const regions = createInitialRegions();
      expect(areRegionsAdjacent(regions, 'nonexistent' as RegionId, 'delhi')).toBe(false);
    });
  });

  describe('getDiscoveredAdjacentRegions', () => {
    it('should return discovered adjacent regions', () => {
      const regions = createInitialRegions();
      // delhi is adjacent to kolkata (discovered), jaisalmer (not), hyderabad (discovered)
      const adj = getDiscoveredAdjacentRegions(regions, 'delhi');
      expect(adj.length).toBe(2);
      expect(adj.map((r) => r.id)).toContain('kolkata');
      expect(adj.map((r) => r.id)).toContain('hyderabad');
    });

    it('should return empty for invalid region', () => {
      const regions = createInitialRegions();
      expect(getDiscoveredAdjacentRegions(regions, 'nonexistent' as RegionId)).toEqual([]);
    });
  });

  describe('getDiscoverableRegions', () => {
    it('should return undiscovered regions adjacent to discovered ones', () => {
      const regions = createInitialRegions();
      const discoverable = getDiscoverableRegions(regions);
      const ids = discoverable.map((r) => r.id);
      // jaisalmer is adj to delhi (discovered)
      expect(ids).toContain('jaisalmer');
      // varanasi is adj to kolkata (discovered)
      expect(ids).toContain('varanasi');
      // bombay is adj to kolkata (discovered)
      expect(ids).toContain('bombay');
    });

    it('should not include already discovered regions', () => {
      const regions = createInitialRegions();
      const discoverable = getDiscoverableRegions(regions);
      expect(discoverable.every((r) => !r.discovered)).toBe(true);
    });

    it('should not have duplicates', () => {
      const regions = createInitialRegions();
      const discoverable = getDiscoverableRegions(regions);
      const ids = discoverable.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('findPath', () => {
    it('should find path between directly adjacent discovered regions', () => {
      const regions = createInitialRegions();
      const path = findPath(regions, 'delhi', 'kolkata');
      expect(path).toEqual(['delhi', 'kolkata']);
    });

    it('should find path through intermediate regions', () => {
      const regions = createInitialRegions();
      // delhi → hyderabad → (only path via discovered)
      const path = findPath(regions, 'delhi', 'hyderabad');
      expect(path).not.toBeNull();
      expect(path![0]).toBe('delhi');
      expect(path![path!.length - 1]).toBe('hyderabad');
    });

    it('should return [from] when from === to', () => {
      const regions = createInitialRegions();
      const path = findPath(regions, 'delhi', 'delhi');
      expect(path).toEqual(['delhi']);
    });

    it('should return null when no path exists through discovered regions', () => {
      const regions = createInitialRegions();
      // bombay is undiscovered, so can't path through it
      // varanasi is also undiscovered
      // From delhi, kolkata is adj. From kolkata, varanasi and bombay are adj but undiscovered
      // So delhi → varanasi should have no path through discovered only
      const path = findPath(regions, 'delhi', 'varanasi', true);
      expect(path).toBeNull();
    });

    it('should find path through all regions when onlyDiscovered is false', () => {
      const regions = createInitialRegions();
      const path = findPath(regions, 'delhi', 'varanasi', false);
      expect(path).not.toBeNull();
      expect(path![0]).toBe('delhi');
      expect(path![path!.length - 1]).toBe('varanasi');
    });

    it('should handle region with invalid adjacent reference gracefully', () => {
      const regions = createInitialRegions();
      // Add a fake adjacent region that doesn't exist in the map
      regions['delhi'] = {
        ...regions['delhi'],
        adjacentRegions: [...regions['delhi'].adjacentRegions, 'nonexistent' as RegionId],
      };
      // Should still find the path without crashing, skipping missing region
      const path = findPath(regions, 'delhi', 'kolkata', false);
      expect(path).not.toBeNull();
      expect(path).toEqual(['delhi', 'kolkata']);
    });
  });
});
