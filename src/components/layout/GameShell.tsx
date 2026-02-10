// ============================================================
// Game Shell — Main game layout (bright, kid-friendly, polished)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import TabBar from '@/components/ui/TabBar';
import EventToast from '@/components/ui/EventToast';
import WorldPanel from '@/components/game/WorldPanel';
import ReputationPanel from '@/components/game/ReputationPanel';
import InventoryPanel from '@/components/game/InventoryPanel';
import EventsPanel from '@/components/game/EventsPanel';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { saveGame } from '@/lib/persistence';
import { AUTOSAVE_INTERVAL, GAME_TIPS, SEASONAL_FLAVOR, TURN_MILESTONES, ACHIEVEMENT_CELEBRATIONS, CARAVAN_STATUS_MESSAGES, RESOURCE_DESCRIPTIONS } from '@/lib/constants';
import { useEffect, useRef, useState, useMemo } from 'react';
import { getSeason, getSeasonIcon, getSeasonColor } from '@/engine/types';

const TAB_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function GameShell() {
  const activeTab = useGameStore((s) => s.activeTab);
  const turn = useGameStore((s) => s.turn);
  const phase = useGameStore((s) => s.phase);
  const resources = useGameStore((s) => s.resources);
  const advanceTurn = useGameStore((s) => s.advanceTurn);
  const getSaveData = useGameStore((s) => s.getSaveData);
  const newGame = useGameStore((s) => s.newGame);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const victoryReason = useGameStore((s) => s.victoryReason);
  const achievements = useGameStore((s) => s.achievements);
  const turnSummary = useGameStore((s) => s.turnSummary);
  const showTurnSummary = useGameStore((s) => s.showTurnSummary);
  const dismissTurnSummary = useGameStore((s) => s.dismissTurnSummary);
  const prevTurnRef = useRef(turn);
  const [turnFlash, setTurnFlash] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const prevResourcesRef = useRef(resources);
  const prevResources = prevResourcesRef.current;
  const [milestoneNotif, setMilestoneNotif] = useState<{ message: string; emoji: string } | null>(null);
  const [achievementToast, setAchievementToast] = useState<{ title: string; emoji: string; celebration: string } | null>(null);
  const prevAchievementCountRef = useRef(achievements.filter((a) => a.unlocked).length);
  const [resourceTooltip, setResourceTooltip] = useState<string | null>(null);

  const season = getSeason(turn);
  const seasonIcon = getSeasonIcon(season);
  const seasonColor = getSeasonColor(season);

  // Autosave every N turns
  useEffect(() => {
    if (turn > 0 && turn % AUTOSAVE_INTERVAL === 0 && turn !== prevTurnRef.current) {
      saveGame(getSaveData());
    }
    // Check for turn milestones
    if (turn !== prevTurnRef.current && TURN_MILESTONES[turn]) {
      setMilestoneNotif(TURN_MILESTONES[turn]);
      setTimeout(() => setMilestoneNotif(null), 4000);
    }
    prevTurnRef.current = turn;
  }, [turn, getSaveData]);

  // Detect new achievement unlocks
  useEffect(() => {
    const currentCount = achievements.filter((a) => a.unlocked).length;
    if (currentCount > prevAchievementCountRef.current) {
      const newlyUnlocked = achievements.find(
        (a) => a.unlocked && a.unlockedOnTurn === turn
      );
      if (newlyUnlocked) {
        setAchievementToast({
          title: newlyUnlocked.title,
          emoji: newlyUnlocked.emoji,
          celebration: ACHIEVEMENT_CELEBRATIONS[Math.floor(Math.random() * ACHIEVEMENT_CELEBRATIONS.length)],
        });
        setTimeout(() => setAchievementToast(null), 4000);
      }
    }
    prevAchievementCountRef.current = currentCount;
  }, [achievements, turn]);

  const handleNextTurn = () => {
    prevResourcesRef.current = { ...resources };
    setTurnFlash(true);
    advanceTurn();
    setTimeout(() => setTurnFlash(false), 600);
  };

  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  // Memoized flavor text for the turn summary (changes each turn, not each render)
  const seasonalFlavor = useMemo(() => {
    const flavors = SEASONAL_FLAVOR[season] || SEASONAL_FLAVOR.spring;
    return flavors[turn % flavors.length];
  }, [turn, season]);

  const randomTip = useMemo(() => {
    return GAME_TIPS[turn % GAME_TIPS.length];
  }, [turn]);

  // Game Over / Victory screen
  if (phase === 'gameover') {
    const isVictory = !!victoryReason;
    const tradeRoutes = useGameStore.getState().tradeRoutes;
    const regions = useGameStore.getState().regions;
    const reputation = useGameStore.getState().reputation;
    const establishedRoutes = tradeRoutes.filter(r => r.established).length;
    const discoveredRegions = Object.values(regions).filter(r => r.discovered).length;
    const alliedFactions = Object.entries(reputation).filter(([, v]) => v >= 60).length;
    const friendlyFactions = Object.entries(reputation).filter(([, v]) => v >= 30 && v < 60).length;

    // Calculate a fun score
    const score = resources.gold + (turn * 10) + (establishedRoutes * 100) + (discoveredRegions * 50) + (alliedFactions * 200) + (unlockedAchievements * 75);

    return (
      <div className={`flex h-[100dvh] flex-col items-center justify-center p-8 text-center ${
        isVictory
          ? 'bg-gradient-to-b from-amber-950 via-yellow-950 to-zinc-950'
          : 'bg-gradient-to-b from-indigo-950 to-zinc-950'
      }`}>
        {/* Floating confetti particles for victory */}
        {isVictory && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: `${Math.random() * 100}vw`,
                  y: -20,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: '110vh',
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: [1, 1, 0.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute text-lg"
                style={{ left: `${Math.random() * 100}%` }}
              >
                {['✨', '🌟', '⭐', '🎉', '🎊', '💫', '🏆', '🪙'][Math.floor(Math.random() * 8)]}
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10 flex max-w-md flex-col items-center gap-5"
        >
          <motion.span
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: [0, -5, 5, 0], scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className={`text-7xl ${isVictory ? 'animate-trophy-glow' : ''}`}
          >
            {isVictory ? '🏆' : '😵'}
          </motion.span>
          <h1 className="text-3xl font-bold text-zinc-100">
            {isVictory ? '🎉 Victory!' : 'Oh no! Game Over!'}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            {isVictory
              ? victoryReason
              : (gameOverReason || 'Your trading empire has fallen. But every great trader fails before they succeed!')}
          </p>

          {/* Detailed stats grid */}
          <div className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">📊 Final Report</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                <span>📅</span>
                <div>
                  <p className="text-zinc-400">Turns Survived</p>
                  <p className="text-sm font-bold text-zinc-100">{turn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                <span>💰</span>
                <div>
                  <p className="text-zinc-400">Final Gold</p>
                  <p className="text-sm font-bold text-amber-400">{resources.gold}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                <span>🌐</span>
                <div>
                  <p className="text-zinc-400">Trade Routes</p>
                  <p className="text-sm font-bold text-green-400">{establishedRoutes}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                <span>🗺️</span>
                <div>
                  <p className="text-zinc-400">Regions Found</p>
                  <p className="text-sm font-bold text-blue-400">{discoveredRegions}/6</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                <span>🤝</span>
                <div>
                  <p className="text-zinc-400">Allied Factions</p>
                  <p className="text-sm font-bold text-purple-400">{alliedFactions}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                <span>⭐</span>
                <div>
                  <p className="text-zinc-400">Achievements</p>
                  <p className="text-sm font-bold text-yellow-400">{unlockedAchievements}/{achievements.length}</p>
                </div>
              </div>
            </div>

            {/* Score */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 rounded-lg bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-3 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Final Score</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.7 }}
                className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300"
              >
                {score.toLocaleString()}
              </motion.p>
            </motion.div>
          </div>

          {/* Fun tip */}
          {!isVictory && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs italic text-zinc-500"
            >
              💡 {GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)]}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => newGame()}
            className={`mt-2 rounded-full px-8 py-3 text-sm font-bold text-white shadow-lg ${
              isVictory
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 shadow-amber-500/25'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25'
            }`}
          >
            🎮 {isVictory ? 'Play Again!' : 'Try Again!'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-gradient-to-b from-blue-50 via-white to-yellow-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      {/* Seasonal color stripe */}
      <div className={`h-0.5 ${
        season === 'spring' ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400'
        : season === 'summer' ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-red-400'
        : season === 'autumn' ? 'bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500'
        : 'bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400'
      }`} />

      {/* Top bar — bright & kid-friendly */}
      <header className="flex items-center justify-between border-b-2 border-yellow-200 bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 px-4 py-2.5 dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-extrabold tracking-tight text-indigo-800 dark:text-indigo-300">
            ⚖️ Third Time Traders
          </h1>
          <motion.span
            key={turn}
            initial={{ scale: 1.3, color: '#6366f1' }}
            animate={{ scale: 1, color: '#4338ca' }}
            transition={{ duration: 0.4 }}
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
              turnFlash
                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
            }`}
          >
            Turn {turn}
          </motion.span>
          <span className={`text-xs font-semibold ${seasonColor}`} title={`Season: ${season}`}>
            {seasonIcon} {season.charAt(0).toUpperCase() + season.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold sm:gap-2">
            <ResourcePill icon="💰" value={resources.gold} color="text-amber-700 dark:text-amber-400" prevValue={prevResources?.gold} resourceKey="gold" onTooltip={setResourceTooltip} />
            <ResourcePill icon="⛽" value={resources.fuel} color="text-orange-600 dark:text-orange-400" prevValue={prevResources?.fuel} resourceKey="fuel" onTooltip={setResourceTooltip} />
            <ResourcePill icon="💧" value={resources.water} color="text-blue-600 dark:text-blue-400" className="hidden sm:inline-flex" prevValue={prevResources?.water} resourceKey="water" onTooltip={setResourceTooltip} />
            <ResourcePill icon="🍞" value={resources.food} color="text-green-600 dark:text-green-400" className="hidden sm:inline-flex" prevValue={prevResources?.food} resourceKey="food" onTooltip={setResourceTooltip} />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { saveGame(getSaveData()); setSaveFlash(true); setTimeout(() => setSaveFlash(false), 1200); }}
            className={`hidden rounded-full px-2.5 py-1.5 text-[10px] font-bold transition sm:inline-flex ${
              saveFlash
                ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300'
                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
            }`}
            title="Save game"
          >
            {saveFlash ? '✅' : '💾'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleNextTurn}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-green-500/25 transition hover:shadow-lg animate-glow-pulse"
          >
            <span className="relative z-10">▶ Next Turn</span>
            {/* Subtle shimmer overlay on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.button>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'world' && (
            <motion.div
              key="world"
              {...TAB_VARIANTS}
              transition={{ duration: 0.2 }}
              id="panel-world"
              role="tabpanel"
              aria-labelledby="tab-world"
              className="h-full"
            >
              <WorldPanel />
            </motion.div>
          )}

          {activeTab === 'reputation' && (
            <motion.div
              key="reputation"
              {...TAB_VARIANTS}
              transition={{ duration: 0.2 }}
              id="panel-reputation"
              role="tabpanel"
              aria-labelledby="tab-reputation"
            >
              <ReputationPanel />
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              {...TAB_VARIANTS}
              transition={{ duration: 0.2 }}
              id="panel-inventory"
              role="tabpanel"
              aria-labelledby="tab-inventory"
            >
              <InventoryPanel />
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              {...TAB_VARIANTS}
              transition={{ duration: 0.2 }}
              id="panel-events"
              role="tabpanel"
              aria-labelledby="tab-events"
            >
              <EventsPanel />
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              {...TAB_VARIANTS}
              transition={{ duration: 0.2 }}
              id="panel-leaderboard"
              role="tabpanel"
              aria-labelledby="tab-leaderboard"
            >
              <LeaderboardPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event toast */}
        <EventToast />

        {/* Milestone notification */}
        <AnimatePresence>
          {milestoneNotif && (
            <motion.div
              key="milestone"
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="fixed left-1/2 top-16 z-50 -translate-x-1/2 animate-milestone-pop"
            >
              <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-300/50 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-3 shadow-xl dark:border-amber-700/50 dark:from-amber-900/80 dark:to-yellow-900/80">
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="text-3xl"
                >
                  {milestoneNotif.emoji}
                </motion.span>
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">🎯 Milestone!</p>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">{milestoneNotif.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievement unlock toast */}
        <AnimatePresence>
          {achievementToast && (
            <motion.div
              key="achievement"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed right-4 top-20 z-50"
            >
              <div className="flex items-center gap-3 rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 px-5 py-3 shadow-2xl dark:border-yellow-600 dark:from-yellow-900/90 dark:to-amber-900/90">
                <motion.span
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 360] }}
                  transition={{ duration: 1 }}
                  className="text-3xl animate-trophy-glow"
                >
                  {achievementToast.emoji}
                </motion.span>
                <div>
                  <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{achievementToast.celebration}</p>
                  <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{achievementToast.title}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resource tooltip */}
        <AnimatePresence>
          {resourceTooltip && (
            <motion.div
              key="resource-tooltip"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed left-1/2 top-14 z-40 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white/95 px-4 py-2 text-xs text-zinc-600 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300"
            >
              {resourceTooltip}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Turn Summary Modal */}
        <AnimatePresence>
          {showTurnSummary && turnSummary && (
            <motion.div
              key="turn-summary-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={dismissTurnSummary}
            >
              <motion.div
                key="turn-summary-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full max-w-sm rounded-2xl border-2 border-yellow-300/50 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-zinc-600/50 dark:bg-zinc-900/95"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with animated season icon */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="text-2xl"
                      animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    >
                      {turnSummary.season === 'spring' ? '🌱' : turnSummary.season === 'summer' ? '☀️' : turnSummary.season === 'autumn' ? '🍂' : '❄️'}
                    </motion.span>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Turn {turnSummary.turn} Summary</h3>
                      <p className="text-xs capitalize text-zinc-500">{turnSummary.season}</p>
                    </div>
                  </div>
                  <button
                    onClick={dismissTurnSummary}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400"
                  >
                    ✕
                  </button>
                </div>

                {/* Seasonal flavor text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2 text-xs italic text-indigo-600 dark:from-indigo-900/20 dark:to-purple-900/20 dark:text-indigo-400"
                >
                  {seasonalFlavor}
                </motion.p>

                {/* Summary Items */}
                <div className="mb-4 max-h-[35vh] space-y-1.5 overflow-auto scrollbar-hide">
                  {turnSummary.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                        item.type === 'upkeep' ? 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400' :
                        item.type === 'income' ? 'bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400' :
                        item.type === 'trade' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400' :
                        item.type === 'event' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400' :
                        item.type === 'encounter' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/10 dark:text-purple-400' :
                        item.type === 'season' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/10 dark:text-indigo-400' :
                        'bg-zinc-50 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-base leading-none mt-0.5">{item.icon}</span>
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Net Resource Changes */}
                {Object.keys(turnSummary.netResources).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
                  >
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Net Changes This Turn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(turnSummary.netResources).map(([key, val]) => (
                        <motion.span
                          key={key}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            (val ?? 0) >= 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {(val ?? 0) >= 0 ? '+' : ''}{val} {key}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Quick tip */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mb-3 text-[10px] text-zinc-400 text-center"
                >
                  💡 {randomTip}
                </motion.p>

                {/* Continue Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={dismissTurnSummary}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
                >
                  Continue ▶
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom tab bar */}
      <TabBar />
    </div>
  );
}

/** Animated resource pill with flash on change, delta indicator, and tooltip */
function ResourcePill({ icon, value, color, className = '', prevValue, resourceKey, onTooltip }: {
  icon: string;
  value: number;
  color: string;
  className?: string;
  prevValue?: number;
  resourceKey?: string;
  onTooltip?: (text: string | null) => void;
}) {
  const delta = prevValue !== undefined ? value - prevValue : 0;
  const showDelta = delta !== 0 && prevValue !== undefined;
  const isLow = value <= 15;

  const handleHover = () => {
    if (resourceKey && onTooltip && RESOURCE_DESCRIPTIONS[resourceKey]) {
      onTooltip(`${icon} ${resourceKey.charAt(0).toUpperCase() + resourceKey.slice(1)}: ${RESOURCE_DESCRIPTIONS[resourceKey]}`);
    }
  };

  return (
    <motion.span
      key={value}
      initial={{ scale: 1.15 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.35 }}
      className={`relative tabular-nums ${color} ${className} flex items-center gap-0.5 cursor-default ${
        isLow ? 'animate-countdown-pulse' : ''
      }`}
      onMouseEnter={handleHover}
      onMouseLeave={() => onTooltip?.(null)}
    >
      {icon} {value}
      <AnimatePresence>
        {showDelta && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -14 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className={`absolute -top-1 right-0 text-[9px] font-bold ${
              delta > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {delta > 0 ? '+' : ''}{delta}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}
