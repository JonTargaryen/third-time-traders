// ============================================================
// Engine — Leaderboard & Player Scoring
// ============================================================
import type {
  GameState,
  LeaderboardEntry,
  PlayerProfile,
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { totalResourceValue } from './inventory';
import { getAlliedFactions } from './reputation';

/**
 * Create a new player profile.
 */
export function createPlayerProfile(name: string): PlayerProfile {
  return {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

/**
 * Calculate a player's score from their game state.
 */
export function calculateScore(state: GameState): number {
  const resourceScore = totalResourceValue(state.resources) * 2;
  const turnBonus = state.turn * 10;
  const routeBonus = state.tradeRoutes.filter((r) => r.established).length * 100;
  const regionBonus = Object.values(state.regions).filter((r) => r.discovered).length * 50;
  const allyBonus = getAlliedFactions(state.reputation).length * 200;
  const personnelBonus = state.personnel.filter((p) => p.status !== 'dead').length * 25;

  return resourceScore + turnBonus + routeBonus + regionBonus + allyBonus + personnelBonus;
}

/**
 * Create a leaderboard entry from the current game state.
 */
export function createLeaderboardEntry(state: GameState): LeaderboardEntry {
  return {
    playerId: state.player.id,
    playerName: state.player.name,
    turn: state.turn,
    gold: state.resources.gold,
    totalResources: totalResourceValue(state.resources),
    routesEstablished: state.tradeRoutes.filter((r) => r.established).length,
    regionsDiscovered: Object.values(state.regions).filter((r) => r.discovered).length,
    alliedFactions: getAlliedFactions(state.reputation).length,
    score: calculateScore(state),
    updatedAt: Date.now(),
  };
}

/**
 * Merge a new entry into the leaderboard, keeping top N entries.
 * Updates existing entry for same player if score is higher.
 */
export function updateLeaderboard(
  board: LeaderboardEntry[],
  entry: LeaderboardEntry,
  maxEntries: number = 100
): LeaderboardEntry[] {
  const existingIndex = board.findIndex((e) => e.playerId === entry.playerId);
  let updated: LeaderboardEntry[];

  if (existingIndex >= 0) {
    // Update if new score is higher
    if (entry.score > board[existingIndex].score) {
      updated = [...board];
      updated[existingIndex] = entry;
    } else {
      // Update timestamp but keep higher score
      updated = [...board];
      updated[existingIndex] = { ...board[existingIndex], updatedAt: entry.updatedAt };
    }
  } else {
    updated = [...board, entry];
  }

  // Sort by score descending
  updated.sort((a, b) => b.score - a.score);

  return updated.slice(0, maxEntries);
}

/**
 * Get rank of a player on the leaderboard.
 */
export function getPlayerRank(board: LeaderboardEntry[], playerId: string): number | null {
  const index = board.findIndex((e) => e.playerId === playerId);
  return index >= 0 ? index + 1 : null;
}

/**
 * Format a leaderboard time display.
 */
export function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
