// ============================================================
// Tests — Personnel Engine (95%+ coverage target)
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createPersonnel,
  getHireCost,
  assignToRoute,
  unassignFromRoute,
  injurePersonnel,
  healPersonnel,
  killPersonnel,
  getAvailablePersonnel,
  getPersonnelOnRoute,
  getRouteSkillTotal,
  countByStatus,
} from '@/engine/personnel';
import type { Personnel } from '@/engine/types';

describe('Personnel Engine', () => {
  describe('createPersonnel', () => {
    it('should create a guard with valid fields', () => {
      const p = createPersonnel('guard', 'TestGuard', 5);
      expect(p.name).toBe('TestGuard');
      expect(p.role).toBe('guard');
      expect(p.skill).toBe(5);
      expect(p.status).toBe('available');
      expect(p.assignedRoute).toBeNull();
      expect(p.id).toBeDefined();
    });

    it('should create a negotiator', () => {
      const p = createPersonnel('negotiator', 'TestNeg', 7);
      expect(p.role).toBe('negotiator');
    });

    it('should create a scout', () => {
      const p = createPersonnel('scout', 'TestScout', 3);
      expect(p.role).toBe('scout');
    });

    it('should generate a random name when not provided', () => {
      const p = createPersonnel('guard');
      expect(p.name).toBeTruthy();
      expect(typeof p.name).toBe('string');
    });

    it('should generate a random skill when not provided', () => {
      const p = createPersonnel('guard', 'Test');
      expect(p.skill).toBeGreaterThanOrEqual(1);
      expect(p.skill).toBeLessThanOrEqual(10);
    });

    it('should clamp skill to 1-10 range', () => {
      const low = createPersonnel('guard', 'Low', 0);
      expect(low.skill).toBe(1);
      const high = createPersonnel('guard', 'High', 15);
      expect(high.skill).toBe(10);
    });

    it('should generate unique IDs', () => {
      const p1 = createPersonnel('guard', 'A', 5);
      const p2 = createPersonnel('guard', 'B', 5);
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('getHireCost', () => {
    it('should calculate guard cost', () => {
      expect(getHireCost('guard', 5)).toBe(100); // 20 * 5
    });

    it('should calculate negotiator cost', () => {
      expect(getHireCost('negotiator', 5)).toBe(175); // 35 * 5
    });

    it('should calculate scout cost', () => {
      expect(getHireCost('scout', 5)).toBe(125); // 25 * 5
    });

    it('should scale with skill', () => {
      expect(getHireCost('guard', 10)).toBe(200);
      expect(getHireCost('guard', 1)).toBe(20);
    });
  });

  describe('assignToRoute', () => {
    it('should assign available personnel to a route', () => {
      const p = createPersonnel('guard', 'Test', 5);
      const assigned = assignToRoute(p, 'route-1');
      expect(assigned).not.toBeNull();
      expect(assigned!.assignedRoute).toBe('route-1');
      expect(assigned!.status).toBe('assigned');
    });

    it('should return null for non-available personnel', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'injured' };
      expect(assignToRoute(p, 'route-1')).toBeNull();
    });

    it('should return null for dead personnel', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'dead' };
      expect(assignToRoute(p, 'route-1')).toBeNull();
    });

    it('should return null for already assigned personnel', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'assigned', assignedRoute: 'route-0' };
      expect(assignToRoute(p, 'route-1')).toBeNull();
    });

    it('should not mutate original', () => {
      const p = createPersonnel('guard', 'Test', 5);
      assignToRoute(p, 'route-1');
      expect(p.status).toBe('available');
      expect(p.assignedRoute).toBeNull();
    });
  });

  describe('unassignFromRoute', () => {
    it('should unassign assigned personnel', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'assigned', assignedRoute: 'route-1' };
      const result = unassignFromRoute(p);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('available');
      expect(result!.assignedRoute).toBeNull();
    });

    it('should return null for non-assigned personnel', () => {
      const p = createPersonnel('guard', 'Test', 5);
      expect(unassignFromRoute(p)).toBeNull();
    });
  });

  describe('injurePersonnel', () => {
    it('should injure available personnel', () => {
      const p = createPersonnel('guard', 'Test', 5);
      const injured = injurePersonnel(p);
      expect(injured.status).toBe('injured');
      expect(injured.assignedRoute).toBeNull();
    });

    it('should injure assigned personnel and unassign', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'assigned', assignedRoute: 'route-1' };
      const injured = injurePersonnel(p);
      expect(injured.status).toBe('injured');
      expect(injured.assignedRoute).toBeNull();
    });

    it('should not change dead personnel', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'dead' };
      const result = injurePersonnel(p);
      expect(result.status).toBe('dead');
    });
  });

  describe('healPersonnel', () => {
    it('should heal injured personnel', () => {
      const p: Personnel = { ...createPersonnel('guard', 'Test', 5), status: 'injured' };
      const healed = healPersonnel(p);
      expect(healed).not.toBeNull();
      expect(healed!.status).toBe('available');
    });

    it('should return null for non-injured personnel', () => {
      const p = createPersonnel('guard', 'Test', 5);
      expect(healPersonnel(p)).toBeNull();
    });
  });

  describe('killPersonnel', () => {
    it('should kill personnel', () => {
      const p = createPersonnel('guard', 'Test', 5);
      const dead = killPersonnel(p);
      expect(dead.status).toBe('dead');
      expect(dead.assignedRoute).toBeNull();
    });
  });

  describe('getAvailablePersonnel', () => {
    it('should return only available personnel', () => {
      const roster: Personnel[] = [
        createPersonnel('guard', 'A', 5),
        { ...createPersonnel('guard', 'B', 5), status: 'injured' },
        createPersonnel('scout', 'C', 3),
      ];
      const available = getAvailablePersonnel(roster);
      expect(available.length).toBe(2);
    });

    it('should return empty for no available', () => {
      const roster: Personnel[] = [
        { ...createPersonnel('guard', 'A', 5), status: 'dead' },
      ];
      expect(getAvailablePersonnel(roster)).toEqual([]);
    });
  });

  describe('getPersonnelOnRoute', () => {
    it('should return personnel on a specific route', () => {
      const roster: Personnel[] = [
        { ...createPersonnel('guard', 'A', 5), status: 'assigned', assignedRoute: 'route-1' },
        { ...createPersonnel('guard', 'B', 5), status: 'assigned', assignedRoute: 'route-2' },
        { ...createPersonnel('scout', 'C', 3), status: 'assigned', assignedRoute: 'route-1' },
      ];
      const onRoute = getPersonnelOnRoute(roster, 'route-1');
      expect(onRoute.length).toBe(2);
    });
  });

  describe('getRouteSkillTotal', () => {
    it('should sum skills of personnel on route', () => {
      const roster: Personnel[] = [
        { ...createPersonnel('guard', 'A', 5), status: 'assigned', assignedRoute: 'route-1' },
        { ...createPersonnel('scout', 'C', 3), status: 'assigned', assignedRoute: 'route-1' },
      ];
      expect(getRouteSkillTotal(roster, 'route-1')).toBe(8);
    });

    it('should return 0 for no personnel on route', () => {
      expect(getRouteSkillTotal([], 'route-1')).toBe(0);
    });
  });

  describe('countByStatus', () => {
    it('should count personnel by status', () => {
      const roster: Personnel[] = [
        createPersonnel('guard', 'A', 5),
        createPersonnel('guard', 'B', 5),
        { ...createPersonnel('guard', 'C', 5), status: 'injured' },
        { ...createPersonnel('guard', 'D', 5), status: 'dead' },
        { ...createPersonnel('guard', 'E', 5), status: 'assigned', assignedRoute: 'r1' },
      ];
      const counts = countByStatus(roster);
      expect(counts.available).toBe(2);
      expect(counts.injured).toBe(1);
      expect(counts.dead).toBe(1);
      expect(counts.assigned).toBe(1);
    });

    it('should return all zeros for empty roster', () => {
      const counts = countByStatus([]);
      expect(counts.available).toBe(0);
      expect(counts.injured).toBe(0);
      expect(counts.dead).toBe(0);
      expect(counts.assigned).toBe(0);
    });
  });
});
