// ============================================================
// Engine — Personnel Management
// ============================================================
import type { Personnel } from './types';
import { v4 as uuidv4 } from 'uuid';

const GUARD_NAMES = ['Marcus', 'Elena', 'Dax', 'Sable', 'Grimshaw', 'Nyx', 'Theron', 'Vex'];
const NEGOTIATOR_NAMES = ['Silk', 'Callista', 'Renard', 'Mirela', 'Ashwin', 'Dove', 'Jin', 'Ophelia'];
const SCOUT_NAMES = ['Whisper', 'Crow', 'Fen', 'Lyra', 'Shade', 'Kael', 'Thistle', 'Ember'];

const NAME_POOLS: Record<Personnel['role'], string[]> = {
  guard: GUARD_NAMES,
  negotiator: NEGOTIATOR_NAMES,
  scout: SCOUT_NAMES,
};

/**
 * Create a new personnel member.
 */
export function createPersonnel(
  role: Personnel['role'],
  nameOverride?: string,
  skillOverride?: number
): Personnel {
  const names = NAME_POOLS[role];
  const name = nameOverride ?? names[Math.floor(Math.random() * names.length)];
  const skill = skillOverride ?? (Math.floor(Math.random() * 7) + 2); // 2-8

  return {
    id: uuidv4(),
    name,
    role,
    skill: Math.max(1, Math.min(10, skill)),
    assignedRoute: null,
    assignedMission: null,
    status: 'available',
  };
}

/**
 * Get the hire cost for a personnel based on role and skill.
 */
export function getHireCost(role: Personnel['role'], skill: number): number {
  const baseRates: Record<Personnel['role'], number> = {
    guard: 20,
    negotiator: 35,
    scout: 25,
  };
  return baseRates[role] * skill;
}

/**
 * Assign personnel to a route.
 */
export function assignToRoute(person: Personnel, routeId: string): Personnel | null {
  if (person.status !== 'available') return null;
  return { ...person, assignedRoute: routeId, status: 'assigned' };
}

/**
 * Unassign personnel from their route.
 */
export function unassignFromRoute(person: Personnel): Personnel | null {
  if (person.status !== 'assigned') return null;
  return { ...person, assignedRoute: null, status: 'available' };
}

/**
 * Mark personnel as injured.
 */
export function injurePersonnel(person: Personnel): Personnel {
  if (person.status === 'dead') return person;
  return { ...person, status: 'injured', assignedRoute: null };
}

/**
 * Heal injured personnel.
 */
export function healPersonnel(person: Personnel): Personnel | null {
  if (person.status !== 'injured') return null;
  return { ...person, status: 'available' };
}

/**
 * Kill personnel (permanent).
 */
export function killPersonnel(person: Personnel): Personnel {
  return { ...person, status: 'dead', assignedRoute: null };
}

/**
 * Get available personnel from a roster.
 */
export function getAvailablePersonnel(roster: Personnel[]): Personnel[] {
  return roster.filter((p) => p.status === 'available');
}

/**
 * Get personnel assigned to a specific route.
 */
export function getPersonnelOnRoute(roster: Personnel[], routeId: string): Personnel[] {
  return roster.filter((p) => p.assignedRoute === routeId);
}

/**
 * Get the total skill level of personnel on a route.
 */
export function getRouteSkillTotal(roster: Personnel[], routeId: string): number {
  return getPersonnelOnRoute(roster, routeId).reduce((sum, p) => sum + p.skill, 0);
}

/**
 * Count personnel by status.
 */
export function countByStatus(roster: Personnel[]): Record<Personnel['status'], number> {
  const counts: Record<Personnel['status'], number> = {
    available: 0,
    assigned: 0,
    scouting: 0,
    injured: 0,
    dead: 0,
  };
  for (const p of roster) {
    counts[p.status]++;
  }
  return counts;
}
