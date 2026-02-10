// ============================================================
// Game Component — Reputation Panel (Faction Diplomacy + Missions + Tips)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { FACTIONS } from '@/data/factions';
import { getRelationshipStatus } from '@/engine/reputation';
import { ALL_FACTION_IDS } from '@/engine/types';
import type { FactionId, Mission } from '@/engine/types';
import { getRelation, getWars, getAlliances } from '@/engine/factionRelations';
import ProgressBar from '@/components/ui/ProgressBar';
import { REPUTATION_MIN, REPUTATION_MAX } from '@/engine/types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FACTION_QUIPS } from '@/lib/constants';

const STATUS_COLORS: Record<string, string> = {
  hostile: 'bg-red-500',
  unfriendly: 'bg-orange-400',
  neutral: 'bg-zinc-400',
  friendly: 'bg-emerald-400',
  allied: 'bg-blue-500',
};

const STATUS_BG: Record<string, string> = {
  hostile: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
  unfriendly: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
  neutral: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700',
  friendly: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  allied: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
};

const STATUS_EMOJI: Record<string, string> = {
  hostile: '😡',
  unfriendly: '😠',
  neutral: '😐',
  friendly: '😊',
  allied: '🤝',
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

// ============================================================
// Mission Card
// ============================================================
function MissionCard({ mission }: { mission: Mission }) {
  const acceptMission = useGameStore((s) => s.acceptMission);
  const turn = useGameStore((s) => s.turn);
  const faction = FACTIONS[mission.factionId];

  const turnsLeft = mission.acceptedOnTurn
    ? Math.max(0, mission.acceptedOnTurn + mission.turnLimit - turn)
    : mission.turnLimit;

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusColors: Record<string, string> = {
    available: 'border-blue-200 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20',
    active: 'border-amber-200 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20',
    completed: 'border-green-200 bg-green-50/50 dark:border-green-800/30 dark:bg-green-950/20',
    failed: 'border-red-200 bg-red-50/50 dark:border-red-800/30 dark:bg-red-950/20',
    expired: 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 p-3 ${statusColors[mission.status]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{mission.emoji}</span>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{mission.title}</h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold" style={{ color: faction?.brightColor }}>
                {faction?.name}
              </span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${difficultyColors[mission.difficulty]}`}>
                {mission.difficulty}
              </span>
            </div>
          </div>
        </div>
        {mission.status === 'active' && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            ⏱ {turnsLeft} turns left
          </span>
        )}
        {mission.status === 'completed' && (
          <span className="text-lg">✅</span>
        )}
        {(mission.status === 'failed' || mission.status === 'expired') && (
          <span className="text-lg">❌</span>
        )}
      </div>

      <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">{mission.description}</p>

      {/* Objectives */}
      <div className="mb-2 space-y-1">
        {mission.objectives.map((obj) => (
          <div key={obj.id} className="flex items-center gap-2">
            <span className={`text-xs ${obj.completed ? 'text-green-500' : 'text-zinc-400'}`}>
              {obj.completed ? '✅' : '⬜'}
            </span>
            <span className={`text-xs ${obj.completed ? 'text-green-700 line-through dark:text-green-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
              {obj.description}
            </span>
            <span className="ml-auto text-[10px] text-zinc-400">
              {obj.current}/{obj.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Rewards */}
      <div className="mb-2 flex flex-wrap gap-1">
        <span className="text-[10px] font-semibold text-zinc-500">Rewards:</span>
        {Object.entries(mission.rewards.resources).map(([k, v]) => (
          <span key={k} className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            +{v} {k}
          </span>
        ))}
        {mission.rewards.reputation && Object.entries(mission.rewards.reputation).map(([fId, v]) => (
          <span key={fId} className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            +{v} rep ({FACTIONS[fId as FactionId]?.name.split(' ').pop()})
          </span>
        ))}
      </div>

      {/* Accept button */}
      {mission.status === 'available' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => acceptMission(mission.id)}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
        >
          🎯 Accept Mission
        </motion.button>
      )}
    </motion.div>
  );
}

// ============================================================
// Faction Diplomacy Visual
// ============================================================
function FactionDiplomacyPanel() {
  const factionRelations = useGameStore((s) => s.factionRelations);
  const wars = getWars(factionRelations);
  const alliances = getAlliances(factionRelations);

  const RELATION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    war: { label: 'At War', emoji: '⚔️', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
    hostile: { label: 'Hostile', emoji: '😡', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
    tense: { label: 'Tense', emoji: '😠', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
    neutral: { label: 'Neutral', emoji: '😐', color: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800' },
    friendly: { label: 'Friendly', emoji: '😊', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    allied: { label: 'Allied', emoji: '🤝', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  };

  // Group relations by type for easy reading
  const pairsSeen = new Set<string>();
  const relationGroups: { a: FactionId; b: FactionId; rel: string }[] = [];
  for (const a of ALL_FACTION_IDS) {
    for (const b of ALL_FACTION_IDS) {
      if (a >= b) continue;
      const key = `${a}-${b}`;
      if (pairsSeen.has(key)) continue;
      pairsSeen.add(key);
      const rel = getRelation(factionRelations, a, b);
      if (rel !== 'neutral') {
        relationGroups.push({ a, b, rel });
      }
    }
  }

  // Sort: wars first, then hostile, tense, friendly, allied
  const order = ['war', 'hostile', 'tense', 'friendly', 'allied'];
  relationGroups.sort((x, y) => order.indexOf(x.rel) - order.indexOf(y.rel));

  return (
    <div className="rounded-xl border-2 border-purple-200/50 bg-purple-50/30 p-4 dark:border-purple-800/30 dark:bg-purple-900/10">
      <h3 className="mb-3 text-sm font-bold text-purple-800 dark:text-purple-300">
        🌐 Faction Diplomacy
      </h3>
      <p className="mb-3 text-xs text-purple-600 dark:text-purple-400">
        See how factions feel about each other. This affects trade, events, and opportunities!
      </p>

      {/* Quick summary */}
      {wars.length > 0 && (
        <div className="mb-2 rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
          <span className="text-xs font-bold text-red-700 dark:text-red-400">⚔️ Active Conflicts:</span>
          {wars.map(([a, b], i) => (
            <span key={i} className="ml-2 text-xs text-red-600 dark:text-red-400">
              {FACTIONS[a]?.name} vs {FACTIONS[b]?.name}
            </span>
          ))}
        </div>
      )}

      {alliances.length > 0 && (
        <div className="mb-2 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">🤝 Alliances:</span>
          {alliances.map(([a, b], i) => (
            <span key={i} className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              {FACTIONS[a]?.name} & {FACTIONS[b]?.name}
            </span>
          ))}
        </div>
      )}

      {/* All non-neutral relationships */}
      <div className="space-y-1.5 mt-2">
        {relationGroups.map(({ a, b, rel }) => {
          const info = RELATION_LABELS[rel] || RELATION_LABELS.neutral;
          return (
            <div key={`${a}-${b}`} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${info.color}`}>
              <span className="text-xs font-medium">
                <span style={{ color: FACTIONS[a]?.brightColor }}>{FACTIONS[a]?.name}</span>
                {' '}↔{' '}
                <span style={{ color: FACTIONS[b]?.brightColor }}>{FACTIONS[b]?.name}</span>
              </span>
              <span className="text-xs font-bold">
                {info.emoji} {info.label}
              </span>
            </div>
          );
        })}
      </div>

      {relationGroups.length === 0 && (
        <p className="text-center text-xs text-zinc-400">All factions are neutral with each other.</p>
      )}
    </div>
  );
}

// ============================================================
// Main Reputation Panel
// ============================================================
export default function ReputationPanel() {
  const reputation = useGameStore((s) => s.reputation);
  const missions = useGameStore((s) => s.missions);
  const achievements = useGameStore((s) => s.achievements);
  const [showSection, setShowSection] = useState<'factions' | 'missions' | 'achievements' | 'diplomacy'>('factions');

  const activeMissions = missions.filter((m) => m.status === 'active');
  const availableMissions = missions.filter((m) => m.status === 'available');
  const completedMissions = missions.filter((m) => m.status === 'completed');
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Section switcher */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {[
          { id: 'factions', label: '⚔️ Factions', count: ALL_FACTION_IDS.length },
          { id: 'missions', label: '🎯 Missions', count: activeMissions.length + availableMissions.length },
          { id: 'achievements', label: '🏆 Awards', count: `${unlockedAchievements.length}/${achievements.length}` },
          { id: 'diplomacy', label: '🌐 Diplomacy', count: null },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setShowSection(sec.id as typeof showSection)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${
              showSection === sec.id
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-700 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            {sec.label}
            {sec.count !== null && (
              <span className="ml-1 text-[10px] opacity-70">({sec.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* FACTIONS SECTION */}
      {showSection === 'factions' && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="flex flex-col gap-3"
        >
          <div className="mb-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Faction Reputation</h2>
            <p className="text-xs text-zinc-500">
              Build relationships to unlock trade, missions, and gather actions!
            </p>
          </div>

          {ALL_FACTION_IDS.map((id) => {
            const faction = FACTIONS[id];
            const status = getRelationshipStatus(reputation, id);
            return (
              <motion.div
                key={id}
                variants={staggerItem}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`rounded-xl border-2 p-4 transition-colors card-hover ${STATUS_BG[status]}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{faction.npc.emoji}</span>
                    <div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{faction.name}</span>
                      <span className="ml-2 text-xs text-zinc-500">({faction.npc.name})</span>
                    </div>
                  </div>
                  <motion.span
                    key={status}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize text-white ${STATUS_COLORS[status]}`}
                  >
                    {STATUS_EMOJI[status]} {status}
                  </motion.span>
                </div>

                <ProgressBar
                  value={reputation[id]}
                  min={REPUTATION_MIN}
                  max={REPUTATION_MAX}
                  label={`${faction.name} reputation`}
                  color={STATUS_COLORS[status]}
                />

                {/* Reputation Tips — how to gain rep */}
                <div className="mt-2 rounded-lg bg-white/50 p-2 dark:bg-zinc-800/50">
                  {/* NPC mood quote */}
                  {FACTION_QUIPS[id] && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-2 text-[10px] italic text-zinc-500 dark:text-zinc-400"
                    >
                      {faction.npc.emoji} {FACTION_QUIPS[id][reputation[id] > 0
                        ? Math.abs(reputation[id]) % FACTION_QUIPS[id].length
                        : 0]}
                    </motion.p>
                  )}
                  <h5 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    💡 How to gain reputation:
                  </h5>
                  <ul className="space-y-0.5">
                    {faction.reputationTips.map((tip, i) => (
                      <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400">{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Consequences banner */}
                {status === 'hostile' && (
                  <div className="mt-2 rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">⚠️ Hostile! Consequences:</p>
                    <ul className="mt-1 space-y-0.5 text-[10px] text-red-600 dark:text-red-400">
                      <li>🚫 Marketplace access blocked in their region</li>
                      <li>💸 Travel costs +50% through their territory</li>
                      <li>🔒 Gather actions locked</li>
                      <li>📈 Trade route profits halved</li>
                    </ul>
                  </div>
                )}
                {status === 'unfriendly' && (
                  <div className="mt-2 rounded-lg bg-orange-100 p-2 dark:bg-orange-900/20">
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-400">⚠️ Unfriendly — limited access:</p>
                    <ul className="mt-1 space-y-0.5 text-[10px] text-orange-600 dark:text-orange-400">
                      <li>💸 Buy prices +25% in their region</li>
                      <li>📉 Sell prices -25% in their region</li>
                    </ul>
                  </div>
                )}
                {status === 'allied' && (
                  <div className="mt-2 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400">🤝 Allied — special benefits:</p>
                    <ul className="mt-1 space-y-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                      <li>💰 Buy prices -15% in their region</li>
                      <li>📈 Sell prices +15% in their region</li>
                      <li>🎁 Extra gather rewards</li>
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* MISSIONS SECTION */}
      {showSection === 'missions' && (
        <div className="flex flex-col gap-3">
          <div className="mb-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">🎯 Missions & Objectives</h2>
            <p className="text-xs text-zinc-500">
              Complete missions to earn rewards and boost your reputation with factions!
            </p>
          </div>

          {activeMissions.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                ⏳ Active Missions ({activeMissions.length})
              </h3>
              <div className="space-y-2">
                {activeMissions.map((m) => <MissionCard key={m.id} mission={m} />)}
              </div>
            </div>
          )}

          {availableMissions.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                📋 Available Missions ({availableMissions.length})
              </h3>
              <div className="space-y-2">
                {availableMissions.map((m) => <MissionCard key={m.id} mission={m} />)}
              </div>
            </div>
          )}

          {completedMissions.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                ✅ Completed ({completedMissions.length})
              </h3>
              <div className="space-y-2">
                {completedMissions.map((m) => <MissionCard key={m.id} mission={m} />)}
              </div>
            </div>
          )}

          {missions.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400">
              No missions yet! Advance a few turns and missions will appear.
            </div>
          )}
        </div>
      )}

      {/* ACHIEVEMENTS SECTION */}
      {showSection === 'achievements' && (
        <div className="flex flex-col gap-3">
          <div className="mb-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">🏆 Achievements</h2>
            <p className="text-xs text-zinc-500">
              {unlockedAchievements.length}/{achievements.length} unlocked — keep playing to earn them all!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={a.unlocked ? { scale: 1.03 } : undefined}
                className={`rounded-xl border-2 p-3 text-center transition card-hover ${
                  a.unlocked
                    ? 'border-yellow-300 bg-gradient-to-b from-yellow-50 to-amber-50 dark:border-yellow-700 dark:from-yellow-900/20 dark:to-amber-900/20'
                    : 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <motion.span
                  className="text-2xl"
                  animate={a.unlocked ? { rotate: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  {a.unlocked ? a.emoji : '🔒'}
                </motion.span>
                <p className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">{a.title}</p>
                <p className="text-[10px] text-zinc-500">{a.description}</p>
                {a.unlocked && a.unlockedOnTurn && (
                  <p className="mt-1 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">⭐ Turn {a.unlockedOnTurn}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* DIPLOMACY SECTION */}
      {showSection === 'diplomacy' && (
        <FactionDiplomacyPanel />
      )}
    </div>
  );
}
