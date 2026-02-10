// ============================================================
// Tests — Leaderboard & Player Scoring
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlayerProfile,
  calculateScore,
  createLeaderboardEntry,
  updateLeaderboard,
  getPlayerRank,
  formatTimeSince,
} from '@/engine/leaderboard';
import type { GameState, LeaderboardEntry } from '@/engine/types';
import { createStartingResources } from '@/engine/inventory';
import { createStartingReputation, changeReputation } from '@/engine/reputation';
import { createInitialRegions, createInitialCaravan } from '@/engine/world';
import { INITIAL_TRADE_ROUTES } from '@/data/tradeRoutes';
import { createInitialFactionRelations } from '@/engine/factionRelations';
import { createInitialMarket } from '@/engine/market';
import { DEFAULT_ACHIEVEMENTS } from '@/data/missions';

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    turn: 1,
    resources: createStartingResources(),
    reputation: createStartingReputation(),
    regions: createInitialRegions(),
    tradeRoutes: INITIAL_TRADE_ROUTES.map((r) => ({ ...r })),
    personnel: [],
    activeTab: 'world',
    selectedRegion: null,
    events: [],
    eventLog: [],
    factionRelations: createInitialFactionRelations(),
    market: createInitialMarket(),
    player: createPlayerProfile('TestPlayer'),
    pendingEventNotification: false,
    goldHistory: [],
    missions: [],
    completedMissions: [],
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
    gatherCooldowns: {},
    actionLog: [],
    caravan: createInitialCaravan(),
    scoutingMissions: [],
    ...overrides,
  };
}

describe('createPlayerProfile', () => {
  it('should create a player with the given name', () => {
    const player = createPlayerProfile('Alice');
    expect(player.name).toBe('Alice');
    expect(player.id).toBeDefined();
    expect(player.createdAt).toBeGreaterThan(0);
    expect(player.lastPlayedAt).toBeGreaterThan(0);
  });

  it('should generate unique IDs for different players', () => {
    const p1 = createPlayerProfile('Alice');
    const p2 = createPlayerProfile('Bob');
    expect(p1.id).not.toBe(p2.id);
  });
});

describe('calculateScore', () => {
  it('should calculate a score from game state', () => {
    const state = createMockGameState();
    const score = calculateScore(state);
    expect(score).toBeGreaterThan(0);
  });

  it('should give higher score for more resources', () => {
    const base = createMockGameState();
    const rich = createMockGameState({
      resources: { fuel: 500, water: 500, food: 500, gold: 5000, contraband: 100, information: 100 },
    });
    expect(calculateScore(rich)).toBeGreaterThan(calculateScore(base));
  });

  it('should give higher score for more turns survived', () => {
    const early = createMockGameState({ turn: 1 });
    const late = createMockGameState({ turn: 50 });
    expect(calculateScore(late)).toBeGreaterThan(calculateScore(early));
  });

  it('should give bonus for established trade routes', () => {
    const noRoutes = createMockGameState();
    const withRoutes = createMockGameState({
      tradeRoutes: INITIAL_TRADE_ROUTES.map((r, i) => ({ ...r, established: i < 3 })),
    });
    expect(calculateScore(withRoutes)).toBeGreaterThan(calculateScore(noRoutes));
  });

  it('should give bonus for discovered regions', () => {
    const base = createMockGameState();
    // All regions discovered
    const regions = createInitialRegions();
    for (const id of Object.keys(regions)) {
      (regions as Record<string, { discovered: boolean }>)[id].discovered = true;
    }
    const allDiscovered = createMockGameState({ regions });
    expect(calculateScore(allDiscovered)).toBeGreaterThan(calculateScore(base));
  });

  it('should give bonus for allied factions', () => {
    const base = createMockGameState();
    let rep = createStartingReputation();
    rep = changeReputation(rep, 'mughal-court', 100);
    rep = changeReputation(rep, 'east-india-company', 100);
    const allied = createMockGameState({ reputation: rep });
    expect(calculateScore(allied)).toBeGreaterThan(calculateScore(base));
  });

  it('should give bonus for alive personnel', () => {
    const base = createMockGameState();
    const withPersonnel = createMockGameState({
      personnel: [
        { id: '1', name: 'A', role: 'guard', skill: 5, assignedRoute: null, assignedMission: null, status: 'available' },
        { id: '2', name: 'B', role: 'scout', skill: 5, assignedRoute: null, assignedMission: null, status: 'available' },
      ],
    });
    expect(calculateScore(withPersonnel)).toBeGreaterThan(calculateScore(base));
  });

  it('should not count dead personnel', () => {
    const withDead = createMockGameState({
      personnel: [
        { id: '1', name: 'A', role: 'guard', skill: 5, assignedRoute: null, assignedMission: null, status: 'dead' },
      ],
    });
    const withAlive = createMockGameState({
      personnel: [
        { id: '1', name: 'A', role: 'guard', skill: 5, assignedRoute: null, assignedMission: null, status: 'available' },
      ],
    });
    expect(calculateScore(withAlive)).toBeGreaterThan(calculateScore(withDead));
  });
});

describe('createLeaderboardEntry', () => {
  it('should create a valid leaderboard entry', () => {
    const state = createMockGameState();
    const entry = createLeaderboardEntry(state);
    expect(entry.playerId).toBe(state.player.id);
    expect(entry.playerName).toBe(state.player.name);
    expect(entry.turn).toBe(1);
    expect(entry.gold).toBe(500);
    expect(entry.score).toBeGreaterThan(0);
    expect(entry.updatedAt).toBeGreaterThan(0);
  });
});

describe('updateLeaderboard', () => {
  const makeEntry = (playerId: string, score: number): LeaderboardEntry => ({
    playerId,
    playerName: playerId,
    turn: 1,
    gold: 100,
    totalResources: 100,
    routesEstablished: 0,
    regionsDiscovered: 3,
    alliedFactions: 0,
    score,
    updatedAt: Date.now(),
  });

  it('should add a new entry to empty leaderboard', () => {
    const entry = makeEntry('p1', 100);
    const board = updateLeaderboard([], entry);
    expect(board.length).toBe(1);
    expect(board[0].playerId).toBe('p1');
  });

  it('should sort by score descending', () => {
    let board: LeaderboardEntry[] = [];
    board = updateLeaderboard(board, makeEntry('p1', 100));
    board = updateLeaderboard(board, makeEntry('p2', 200));
    board = updateLeaderboard(board, makeEntry('p3', 50));
    expect(board[0].playerId).toBe('p2');
    expect(board[1].playerId).toBe('p1');
    expect(board[2].playerId).toBe('p3');
  });

  it('should update existing player with higher score', () => {
    let board: LeaderboardEntry[] = [];
    board = updateLeaderboard(board, makeEntry('p1', 100));
    board = updateLeaderboard(board, makeEntry('p1', 200));
    expect(board.length).toBe(1);
    expect(board[0].score).toBe(200);
  });

  it('should NOT update existing player with lower score', () => {
    let board: LeaderboardEntry[] = [];
    board = updateLeaderboard(board, makeEntry('p1', 200));
    board = updateLeaderboard(board, makeEntry('p1', 100));
    expect(board.length).toBe(1);
    expect(board[0].score).toBe(200);
  });

  it('should cap at maxEntries', () => {
    let board: LeaderboardEntry[] = [];
    for (let i = 0; i < 10; i++) {
      board = updateLeaderboard(board, makeEntry(`p${i}`, i * 10), 5);
    }
    expect(board.length).toBe(5);
    expect(board[0].score).toBe(90);
  });
});

describe('getPlayerRank', () => {
  const makeEntry = (playerId: string, score: number): LeaderboardEntry => ({
    playerId,
    playerName: playerId,
    turn: 1,
    gold: 100,
    totalResources: 100,
    routesEstablished: 0,
    regionsDiscovered: 3,
    alliedFactions: 0,
    score,
    updatedAt: Date.now(),
  });

  it('should return 1-based rank', () => {
    const board = [makeEntry('p1', 200), makeEntry('p2', 100), makeEntry('p3', 50)];
    expect(getPlayerRank(board, 'p1')).toBe(1);
    expect(getPlayerRank(board, 'p2')).toBe(2);
    expect(getPlayerRank(board, 'p3')).toBe(3);
  });

  it('should return null for non-existent player', () => {
    expect(getPlayerRank([], 'nobody')).toBeNull();
    expect(getPlayerRank([makeEntry('p1', 100)], 'nobody')).toBeNull();
  });
});

describe('formatTimeSince', () => {
  it('should return "just now" for very recent timestamps', () => {
    expect(formatTimeSince(Date.now() - 5000)).toBe('just now');
  });

  it('should return minutes format', () => {
    expect(formatTimeSince(Date.now() - 120000)).toBe('2m ago');
  });

  it('should return hours format', () => {
    expect(formatTimeSince(Date.now() - 7200000)).toBe('2h ago');
  });

  it('should return days format', () => {
    expect(formatTimeSince(Date.now() - 172800000)).toBe('2d ago');
  });
});
