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
      // forge-highlands, shattered-coast, obsidian-citadel are discovered
      expect(regions['forge-highlands'].discovered).toBe(true);
      expect(regions['shattered-coast'].discovered).toBe(true);
      expect(regions['obsidian-citadel'].discovered).toBe(true);
      // amber-wastes, emerald-canopy, the-undercity are undiscovered
      expect(regions['amber-wastes'].discovered).toBe(false);
      expect(regions['emerald-canopy'].discovered).toBe(false);
      expect(regions['the-undercity'].discovered).toBe(false);
    });

    it('should create deep copies (not share references)', () => {
      const r1 = createInitialRegions();
      const r2 = createInitialRegions();
      r1['forge-highlands'].discovered = false;
      expect(r2['forge-highlands'].discovered).toBe(true);
    });
  });

  describe('discoverRegion', () => {
    it('should discover an undiscovered region', () => {
      const regions = createInitialRegions();
      const result = discoverRegion(regions, 'amber-wastes');
      expect(result['amber-wastes'].discovered).toBe(true);
    });

    it('should not modify already discovered region', () => {
      const regions = createInitialRegions();
      const result = discoverRegion(regions, 'forge-highlands');
      expect(result).toBe(regions); // same reference = no change
    });

    it('should not mutate original', () => {
      const regions = createInitialRegions();
      discoverRegion(regions, 'amber-wastes');
      expect(regions['amber-wastes'].discovered).toBe(false);
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
      const updated = discoverRegion(regions, 'amber-wastes');
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
      expect(areRegionsAdjacent(regions, 'forge-highlands', 'shattered-coast')).toBe(true);
    });

    it('should return false for non-adjacent regions', () => {
      const regions = createInitialRegions();
      expect(areRegionsAdjacent(regions, 'forge-highlands', 'emerald-canopy')).toBe(false);
    });

    it('should return false for invalid region', () => {
      const regions = createInitialRegions();
      expect(areRegionsAdjacent(regions, 'nonexistent' as RegionId, 'forge-highlands')).toBe(false);
    });
  });

  describe('getDiscoveredAdjacentRegions', () => {
    it('should return discovered adjacent regions', () => {
      const regions = createInitialRegions();
      // forge-highlands is adjacent to shattered-coast (discovered), amber-wastes (not), obsidian-citadel (discovered)
      const adj = getDiscoveredAdjacentRegions(regions, 'forge-highlands');
      expect(adj.length).toBe(2);
      expect(adj.map((r) => r.id)).toContain('shattered-coast');
      expect(adj.map((r) => r.id)).toContain('obsidian-citadel');
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
      // amber-wastes is adj to forge-highlands (discovered)
      expect(ids).toContain('amber-wastes');
      // emerald-canopy is adj to shattered-coast (discovered)
      expect(ids).toContain('emerald-canopy');
      // the-undercity is adj to shattered-coast (discovered)
      expect(ids).toContain('the-undercity');
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
      const path = findPath(regions, 'forge-highlands', 'shattered-coast');
      expect(path).toEqual(['forge-highlands', 'shattered-coast']);
    });

    it('should find path through intermediate regions', () => {
      const regions = createInitialRegions();
      // forge-highlands → obsidian-citadel → (only path via discovered)
      const path = findPath(regions, 'forge-highlands', 'obsidian-citadel');
      expect(path).not.toBeNull();
      expect(path![0]).toBe('forge-highlands');
      expect(path![path!.length - 1]).toBe('obsidian-citadel');
    });

    it('should return [from] when from === to', () => {
      const regions = createInitialRegions();
      const path = findPath(regions, 'forge-highlands', 'forge-highlands');
      expect(path).toEqual(['forge-highlands']);
    });

    it('should return null when no path exists through discovered regions', () => {
      const regions = createInitialRegions();
      // the-undercity is undiscovered, so can't path through it
      // emerald-canopy is also undiscovered
      // From forge-highlands, shattered-coast is adj. From shattered-coast, emerald-canopy and the-undercity are adj but undiscovered
      // So forge-highlands → emerald-canopy should have no path through discovered only
      const path = findPath(regions, 'forge-highlands', 'emerald-canopy', true);
      expect(path).toBeNull();
    });

    it('should find path through all regions when onlyDiscovered is false', () => {
      const regions = createInitialRegions();
      const path = findPath(regions, 'forge-highlands', 'emerald-canopy', false);
      expect(path).not.toBeNull();
      expect(path![0]).toBe('forge-highlands');
      expect(path![path!.length - 1]).toBe('emerald-canopy');
    });

    it('should handle region with invalid adjacent reference gracefully', () => {
      const regions = createInitialRegions();
      // Add a fake adjacent region that doesn't exist in the map
      regions['forge-highlands'] = {
        ...regions['forge-highlands'],
        adjacentRegions: [...regions['forge-highlands'].adjacentRegions, 'nonexistent' as RegionId],
      };
      // Should still find the path without crashing, skipping missing region
      const path = findPath(regions, 'forge-highlands', 'shattered-coast', false);
      expect(path).not.toBeNull();
      expect(path).toEqual(['forge-highlands', 'shattered-coast']);
    });
  });
});
