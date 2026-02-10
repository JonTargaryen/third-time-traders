// ============================================================
// Tests — Persistence Extended (IndexedDB functions via Dexie mocks)
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateChecksum,
  saveGame,
  loadGame,
  loadGameAsync,
  deleteSave,
  hasSave,
  logAction,
  getActionLog,
  clearActionLog,
} from '@/lib/persistence';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  length: 0,
  key: () => null,
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('Persistence — Extended Coverage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('generateChecksum', () => {
    it('should handle single character', () => {
      const cs = generateChecksum('a');
      expect(typeof cs).toBe('string');
      expect(cs.length).toBeGreaterThan(0);
    });

    it('should handle very long strings', () => {
      const longStr = 'x'.repeat(10000);
      const cs = generateChecksum(longStr);
      expect(typeof cs).toBe('string');
    });

    it('should handle special characters', () => {
      const cs = generateChecksum('{"key": "value with 特殊字符"}');
      expect(typeof cs).toBe('string');
    });

    it('should be deterministic across calls', () => {
      const data = '{"complex": [1,2,3], "nested": {"a": true}}';
      const cs1 = generateChecksum(data);
      const cs2 = generateChecksum(data);
      const cs3 = generateChecksum(data);
      expect(cs1).toBe(cs2);
      expect(cs2).toBe(cs3);
    });
  });

  describe('saveGame / loadGame roundtrip', () => {
    it('should handle large data', async () => {
      const bigData = JSON.stringify({ items: Array(1000).fill({ key: 'value', nested: { deep: true } }) });
      const result = await saveGame(bigData);
      expect(result).toBe(true);
      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.data).toBe(bigData);
      expect(loaded!.valid).toBe(true);
    });

    it('should overwrite previous save', async () => {
      await saveGame('first-save');
      await saveGame('second-save');
      const loaded = loadGame();
      expect(loaded!.data).toBe('second-save');
    });
  });

  describe('loadGameAsync', () => {
    it('should fall back to localStorage when IndexedDB fails', async () => {
      await saveGame('local-data');
      // loadGameAsync tries IndexedDB first (which will fail in test env),
      // then falls back to localStorage
      const result = await loadGameAsync();
      expect(result).not.toBeNull();
      expect(result!.data).toBe('local-data');
      expect(result!.valid).toBe(true);
    });

    it('should return null when no save exists', async () => {
      // In test env, IndexedDB may throw, but localStorage has nothing
      const result = await loadGameAsync();
      expect(result).toBeNull();
    });

    it('should detect tampered data via localStorage fallback', async () => {
      await saveGame('original-data');
      store['ttt-save'] = 'tampered-data';
      const result = await loadGameAsync();
      expect(result).not.toBeNull();
      expect(result!.valid).toBe(false);
    });
  });

  describe('logAction', () => {
    it('should not throw even if IndexedDB is unavailable', async () => {
      // In test environment, Dexie may not work, but logAction should not throw
      await expect(logAction(1, 'test-action', 'Test details', 'test')).resolves.not.toThrow();
    });

    it('should not throw with default category', async () => {
      await expect(logAction(1, 'test-action', 'Test details')).resolves.not.toThrow();
    });
  });

  describe('getActionLog', () => {
    it('should return empty array when IndexedDB is unavailable', async () => {
      const log = await getActionLog();
      // In test env, this returns [] since Dexie isn't truly available
      expect(Array.isArray(log)).toBe(true);
    });

    it('should accept limit parameter', async () => {
      const log = await getActionLog(10);
      expect(Array.isArray(log)).toBe(true);
    });
  });

  describe('clearActionLog', () => {
    it('should not throw when IndexedDB is unavailable', async () => {
      await expect(clearActionLog()).resolves.not.toThrow();
    });
  });

  describe('deleteSave', () => {
    it('should remove both save and checksum from localStorage', async () => {
      await saveGame('test-data');
      expect(store['ttt-save']).toBeDefined();
      expect(store['ttt-checksum']).toBeDefined();
      await deleteSave();
      expect(store['ttt-save']).toBeUndefined();
      expect(store['ttt-checksum']).toBeUndefined();
    });

    it('should not throw when no save exists', async () => {
      await expect(deleteSave()).resolves.not.toThrow();
    });
  });

  describe('hasSave', () => {
    it('should return true immediately after saving', async () => {
      await saveGame('data');
      expect(hasSave()).toBe(true);
    });

    it('should return false after deleting', async () => {
      await saveGame('data');
      await deleteSave();
      expect(hasSave()).toBe(false);
    });
  });

  describe('loadGame edge cases', () => {
    it('should handle data with no checksum stored', () => {
      store['ttt-save'] = 'some-data';
      // No checksum stored
      const result = loadGame();
      expect(result).not.toBeNull();
      expect(result!.valid).toBe(false); // no stored checksum means mismatch
    });

    it('should handle matching checksum manually set', () => {
      const data = 'test-data';
      store['ttt-save'] = data;
      store['ttt-checksum'] = generateChecksum(data);
      const result = loadGame();
      expect(result).not.toBeNull();
      expect(result!.valid).toBe(true);
    });
  });
});
