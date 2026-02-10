// ============================================================
// Tests — Constants (ensure all constants are valid)
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  MIN_TOUCH_TARGET,
  LOW_RESOURCE_THRESHOLD,
  CRITICAL_RESOURCE_THRESHOLD,
  HEAL_COST_GOLD,
  DISCOVERY_COST,
  BASE_INCOME,
  MAX_PERSONNEL,
  AUTOSAVE_INTERVAL,
} from '@/lib/constants';

describe('Game Constants', () => {
  it('should have valid touch target minimum', () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });

  it('should have low threshold greater than critical', () => {
    expect(LOW_RESOURCE_THRESHOLD).toBeGreaterThan(CRITICAL_RESOURCE_THRESHOLD);
  });

  it('should have positive heal cost', () => {
    expect(HEAL_COST_GOLD).toBeGreaterThan(0);
  });

  it('should have discovery costs', () => {
    expect(DISCOVERY_COST.fuel).toBeGreaterThan(0);
    expect(DISCOVERY_COST.gold).toBeGreaterThan(0);
  });

  it('should have base income', () => {
    expect(BASE_INCOME.gold).toBeGreaterThan(0);
    expect(BASE_INCOME.food).toBeGreaterThan(0);
  });

  it('should have reasonable max personnel', () => {
    expect(MAX_PERSONNEL).toBeGreaterThanOrEqual(10);
    expect(MAX_PERSONNEL).toBeLessThanOrEqual(100);
  });

  it('should have autosave interval', () => {
    expect(AUTOSAVE_INTERVAL).toBeGreaterThan(0);
  });
});
