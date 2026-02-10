// ============================================================
// Tests — Persistence (95%+ coverage target)
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateChecksum,
  saveGame,
  loadGame,
  deleteSave,
  hasSave,
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

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksums', () => {
      const data = '{"gold": 500}';
      expect(generateChecksum(data)).toBe(generateChecksum(data));
    });

    it('should generate different checksums for different data', () => {
      expect(generateChecksum('abc')).not.toBe(generateChecksum('xyz'));
    });

    it('should handle empty string', () => {
      expect(generateChecksum('')).toBe('0');
    });
  });

  describe('saveGame', () => {
    it('should save data and checksum', async () => {
      const result = await saveGame('{"test": true}');
      expect(result).toBe(true);
      expect(store['ttt-save']).toBe('{"test": true}');
      expect(store['ttt-checksum']).toBeDefined();
    });

    it('should return false when localStorage throws', async () => {
      const origSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => { throw new Error('Storage full'); };
      const result = await saveGame('{"test": true}');
      expect(result).toBe(false);
      localStorageMock.setItem = origSetItem;
    });
  });

  describe('loadGame', () => {
    it('should load saved data with valid checksum', async () => {
      await saveGame('{"test": true}');
      const result = loadGame();
      expect(result).not.toBeNull();
      expect(result!.data).toBe('{"test": true}');
      expect(result!.valid).toBe(true);
    });

    it('should detect tampered data', async () => {
      await saveGame('{"gold": 500}');
      store['ttt-save'] = '{"gold": 999999}'; // tamper
      const result = loadGame();
      expect(result).not.toBeNull();
      expect(result!.valid).toBe(false);
    });

    it('should return null when no save exists', () => {
      expect(loadGame()).toBeNull();
    });

    it('should return null when localStorage throws', () => {
      const origGetItem = localStorageMock.getItem;
      localStorageMock.getItem = () => { throw new Error('Access denied'); };
      const result = loadGame();
      expect(result).toBeNull();
      localStorageMock.getItem = origGetItem;
    });
  });

  describe('deleteSave', () => {
    it('should delete save data', async () => {
      await saveGame('test');
      await deleteSave();
      expect(store['ttt-save']).toBeUndefined();
      expect(store['ttt-checksum']).toBeUndefined();
    });
  });

  describe('hasSave', () => {
    it('should return true when save exists', async () => {
      await saveGame('test');
      expect(hasSave()).toBe(true);
    });

    it('should return false when no save exists', () => {
      expect(hasSave()).toBe(false);
    });
  });
});
