// ============================================================
// Lib — Persistence (IndexedDB via Dexie + localStorage fallback)
// ============================================================
import Dexie, { type EntityTable } from 'dexie';

// ============================================================
// IndexedDB Database (Dexie)
// ============================================================

export interface ActionRecord {
  id?: number;
  timestamp: number;
  turn: number;
  action: string;
  details: string;
  category: string;
}

export interface SaveRecord {
  id?: number;
  slot: string;
  data: string;
  checksum: string;
  savedAt: number;
}

class GameDatabase extends Dexie {
  actions!: EntityTable<ActionRecord, 'id'>;
  saves!: EntityTable<SaveRecord, 'id'>;

  constructor() {
    super('ThirdTimeTraders');
    this.version(1).stores({
      actions: '++id, timestamp, turn, action, category',
      saves: '++id, slot, savedAt',
    });
  }
}

let db: GameDatabase | null = null;

function getDb(): GameDatabase {
  if (!db) {
    db = new GameDatabase();
  }
  return db;
}

// ============================================================
// Action Logging (every click/action saved to IndexedDB)
// ============================================================

export async function logAction(
  turn: number,
  action: string,
  details: string,
  category: string = 'system'
): Promise<void> {
  try {
    await getDb().actions.add({
      timestamp: Date.now(),
      turn,
      action,
      details,
      category,
    });
  } catch {
    // Silently fail — don't block gameplay
  }
}

export async function getActionLog(limit: number = 100): Promise<ActionRecord[]> {
  try {
    return await getDb().actions.orderBy('timestamp').reverse().limit(limit).toArray();
  } catch {
    return [];
  }
}

export async function clearActionLog(): Promise<void> {
  try {
    await getDb().actions.clear();
  } catch {
    // ignore
  }
}

// ============================================================
// Save/Load via IndexedDB
// ============================================================

const SAVE_KEY = 'ttt-save';
const CHECKSUM_KEY = 'ttt-checksum';

export function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Save game data to both IndexedDB and localStorage.
 */
export async function saveGame(data: string): Promise<boolean> {
  const checksum = generateChecksum(data);

  // Save to localStorage (fast, synchronous)
  let localSaved = false;
  try {
    localStorage.setItem(SAVE_KEY, data);
    localStorage.setItem(CHECKSUM_KEY, checksum);
    localSaved = true;
  } catch {
    // localStorage may be full
  }

  // Also save to IndexedDB (persistent, more space)
  try {
    const database = getDb();
    // Upsert: delete old autosave, add new
    await database.saves.where('slot').equals('autosave').delete();
    await database.saves.add({
      slot: 'autosave',
      data,
      checksum,
      savedAt: Date.now(),
    });

    // Log the save action
    await logAction(0, 'game-saved', 'Game auto-saved', 'system');
    return true;
  } catch {
    return localSaved; // Only true if localStorage save worked
  }
}

/**
 * Load game data, preferring IndexedDB, falling back to localStorage.
 */
export async function loadGameAsync(): Promise<{ data: string; valid: boolean } | null> {
  // Try IndexedDB first
  try {
    const database = getDb();
    const saves = await database.saves.where('slot').equals('autosave').toArray();
    if (saves.length > 0) {
      const save = saves[saves.length - 1];
      const valid = save.checksum === generateChecksum(save.data);
      return { data: save.data, valid };
    }
  } catch {
    // Fall through to localStorage
  }

  // Fallback: localStorage
  return loadGame();
}

/**
 * Load game data from localStorage (synchronous fallback).
 */
export function loadGame(): { data: string; valid: boolean } | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    const storedChecksum = localStorage.getItem(CHECKSUM_KEY);
    if (!data) return null;

    const expectedChecksum = generateChecksum(data);
    const valid = storedChecksum === expectedChecksum;

    return { data, valid };
  } catch {
    return null;
  }
}

/**
 * Delete saved game data from both stores.
 */
export async function deleteSave(): Promise<void> {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(CHECKSUM_KEY);
  try {
    await getDb().saves.where('slot').equals('autosave').delete();
  } catch {
    // ignore
  }
}

/**
 * Check if a save exists (synchronous, localStorage).
 */
export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}
