// ============================================================
// Game Component — Leaderboard Panel
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { useMemo } from 'react';
import type { LeaderboardEntry, GameState } from '@/engine/types';
import { createLeaderboardEntry, updateLeaderboard, getPlayerRank, formatTimeSince } from '@/engine/leaderboard';
import { motion } from 'framer-motion';

const LEADERBOARD_KEY = 'ttt-leaderboard';

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(board: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
  } catch {
    /* ignore */
  }
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPanel() {
  const turn = useGameStore((s) => s.turn);
  const resources = useGameStore((s) => s.resources);
  const reputation = useGameStore((s) => s.reputation);
  const regions = useGameStore((s) => s.regions);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const personnel = useGameStore((s) => s.personnel);
  const player = useGameStore((s) => s.player);

  const board = useMemo(() => {
    const existing = loadLeaderboard();
    const stateForEntry: GameState = {
      turn, resources, reputation, regions, tradeRoutes, personnel, player,
    } as GameState;
    const entry = createLeaderboardEntry(stateForEntry);
    const updated = updateLeaderboard(existing, entry);
    saveLeaderboard(updated);
    return updated;
  }, [turn, resources, reputation, regions, tradeRoutes, personnel, player]);

  const myRank = getPlayerRank(board, player.id);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Leaderboard
        </h2>
        <p className="text-xs text-zinc-500">
          Compete with other players. Your score is tracked across sessions.
        </p>
      </div>

      {/* Your rank */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Your Rank</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">#{myRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {player.name}
              </p>
              <p className="text-xs text-zinc-500">
                Turn {turn} · Score {board.find((e) => e.playerId === player.id)?.score ?? 0}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard table */}
      {board.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-3 block text-5xl"
          >
            🏆
          </motion.span>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">No leaderboard entries yet!</p>
          <p className="mt-1 text-xs text-zinc-400">Play the game and your score will appear here.</p>
        </motion.div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-1 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50">
            <span className="col-span-1">#</span>
            <span className="col-span-3">Player</span>
            <span className="col-span-2 text-right">Score</span>
            <span className="col-span-1 text-right">Turn</span>
            <span className="col-span-1 text-right">💰</span>
            <span className="col-span-1 text-right">🗺️</span>
            <span className="col-span-1 text-right">🏪</span>
            <span className="col-span-2 text-right">Updated</span>
          </div>

          {/* Rows */}
          {board.slice(0, 50).map((entry, index) => {
            const isMe = entry.playerId === player.id;
            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`grid grid-cols-12 gap-1 border-b border-zinc-100 px-3 py-2 text-xs last:border-b-0 dark:border-zinc-800 ${
                  isMe
                    ? 'bg-blue-50/50 font-semibold dark:bg-blue-950/10'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                }`}
              >
                <span className="col-span-1 text-zinc-600 dark:text-zinc-400">
                  {index < 3 ? MEDAL_ICONS[index] : index + 1}
                </span>
                <span className="col-span-3 truncate text-zinc-900 dark:text-zinc-100">
                  {entry.playerName}
                  {isMe && <span className="ml-1 text-blue-500">(you)</span>}
                </span>
                <span className="col-span-2 text-right font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {entry.score.toLocaleString()}
                </span>
                <span className="col-span-1 text-right tabular-nums text-zinc-500">{entry.turn}</span>
                <span className="col-span-1 text-right tabular-nums text-amber-600">{entry.gold}</span>
                <span className="col-span-1 text-right tabular-nums text-zinc-500">{entry.regionsDiscovered}</span>
                <span className="col-span-1 text-right tabular-nums text-zinc-500">{entry.routesEstablished}</span>
                <span className="col-span-2 text-right text-zinc-400">{formatTimeSince(entry.updatedAt)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
