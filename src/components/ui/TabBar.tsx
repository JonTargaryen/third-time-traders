// ============================================================
// UI Component — Tab Bar (bright, kid-friendly, consolidated)
// ============================================================
'use client';

import type { GameTab } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

const TABS: { id: GameTab; label: string; icon: string }[] = [
  { id: 'world', label: 'World', icon: '🌍' },
  { id: 'reputation', label: 'Factions', icon: '⚔️' },
  { id: 'inventory', label: 'Items', icon: '🎒' },
  { id: 'events', label: 'Events', icon: '📰' },
  { id: 'leaderboard', label: 'Ranks', icon: '🏆' },
];

export default function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const events = useGameStore((s) => s.events);
  const missions = useGameStore((s) => s.missions);
  const resources = useGameStore((s) => s.resources);

  const undismissedCount = events.filter((e) => !e.dismissed).length;
  const activeMissionCount = missions.filter((m) => m.status === 'active').length;
  const hasUrgentResource = resources.food <= 10 || resources.water <= 10 || resources.fuel <= 10;

  return (
    <nav
      role="tablist"
      aria-label="Game navigation"
      className="flex w-full border-t-2 border-yellow-300/30 bg-gradient-to-t from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-950"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const badgeCount = tab.id === 'events' ? undismissedCount : tab.id === 'reputation' ? activeMissionCount : 0;
        const isUrgent = (tab.id === 'inventory' && hasUrgentResource) || (tab.id === 'events' && undismissedCount >= 3);
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-all
              ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : isUrgent
                  ? 'text-red-500 dark:text-red-400 animate-countdown-pulse'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute -top-0.5 left-2 right-2 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative text-xl leading-none" aria-hidden="true">
              {tab.icon}
              {badgeCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </motion.span>
              )}
            </span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
