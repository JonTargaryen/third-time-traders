// ============================================================
// Game Component — Inventory Panel (with animations, sparkline & upkeep forecast)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { ALL_RESOURCE_TYPES } from '@/engine/types';
import type { Resources } from '@/engine/types';
import { getLowResources } from '@/engine/inventory';
import { countByStatus, getHireCost } from '@/engine/personnel';
import { motion } from 'framer-motion';
import { BASE_INCOME, CARAVAN_UPKEEP, PERSONNEL_UPKEEP_GOLD, RESOURCE_DESCRIPTIONS } from '@/lib/constants';

const RESOURCE_ICONS: Record<string, string> = {
  fuel: '⛽',
  water: '💧',
  food: '🍞',
  gold: '💰',
  contraband: '📦',
  information: '📜',
};

const RESOURCE_COLORS: Record<string, string> = {
  fuel: 'from-amber-500 to-orange-600',
  water: 'from-cyan-400 to-blue-500',
  food: 'from-green-400 to-emerald-600',
  gold: 'from-yellow-400 to-amber-500',
  contraband: 'from-purple-400 to-violet-600',
  information: 'from-slate-400 to-zinc-500',
};

/** Tiny SVG sparkline for gold history */
function Sparkline({ data, color = '#3b82f6' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 120;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="inline-block" aria-label="Gold trend">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const staggerItem = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export default function InventoryPanel() {
  const resources = useGameStore((s) => s.resources);
  const personnel = useGameStore((s) => s.personnel);
  const hirePersonnel = useGameStore((s) => s.hirePersonnel);
  const goldHistory = useGameStore((s) => s.goldHistory);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);

  const lowResources = getLowResources(resources, 20);
  const personnelCounts = countByStatus(personnel);
  const alivePersonnel = personnel.filter((p) => p.status !== 'dead');

  // Calculate upkeep forecast
  const totalUpkeepGold = alivePersonnel.length * PERSONNEL_UPKEEP_GOLD;
  const establishedRoutes = tradeRoutes.filter((r) => r.established);
  const tradeIncome = establishedRoutes.reduce((sum, r) => sum + (r.profitPerTurn?.gold || 0), 0);
  const netGoldPerTurn = BASE_INCOME.gold + tradeIncome - totalUpkeepGold;
  const netFoodPerTurn = BASE_INCOME.food - CARAVAN_UPKEEP.food;
  const netWaterPerTurn = BASE_INCOME.water - CARAVAN_UPKEEP.water;
  const turnsUntilBroke = netGoldPerTurn < 0 ? Math.floor(resources.gold / Math.abs(netGoldPerTurn)) : null;
  const turnsUntilStarve = netFoodPerTurn < 0 ? Math.floor(resources.food / Math.abs(netFoodPerTurn)) : null;
  const turnsUntilDehydrate = netWaterPerTurn < 0 ? Math.floor(resources.water / Math.abs(netWaterPerTurn)) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Resources Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Inventory
          </h2>
          <p className="text-xs text-zinc-500">
            Manage your resources and personnel.
          </p>
        </div>
        {goldHistory.length >= 2 && (
          <div className="flex flex-col items-end">
            <span className="mb-0.5 text-[10px] text-zinc-400">Gold trend</span>
            <Sparkline data={goldHistory} />
          </div>
        )}
      </div>

      {/* Resource Grid */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {ALL_RESOURCE_TYPES.map((type) => {
          const isLow = lowResources.includes(type);
          return (
            <motion.div
              key={type}
              variants={staggerItem}
              transition={{ duration: 0.25 }}
              title={RESOURCE_DESCRIPTIONS[type] || ''}
              className={`
                rounded-xl p-3 transition-colors card-hover
                ${isLow ? 'ring-2 ring-red-400/50 animate-danger-pulse' : ''}
                bg-zinc-50 dark:bg-zinc-800/50
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{RESOURCE_ICONS[type]}</span>
                <div className="flex-1">
                  <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{type}</p>
                  <motion.p
                    key={resources[type]}
                    initial={{ scale: 1.15, color: '#3b82f6' }}
                    animate={{ scale: 1, color: 'inherit' }}
                    className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100"
                  >
                    {resources[type]}
                  </motion.p>
                </div>
                {/* Trend arrow based on net per-turn */}
                {type === 'gold' && (
                  <span className={`text-[10px] font-bold ${netGoldPerTurn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netGoldPerTurn >= 0 ? '▲' : '▼'} {Math.abs(netGoldPerTurn)}/t
                  </span>
                )}
                {type === 'food' && (
                  <span className={`text-[10px] font-bold ${netFoodPerTurn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netFoodPerTurn >= 0 ? '▲' : '▼'} {Math.abs(netFoodPerTurn)}/t
                  </span>
                )}
                {type === 'water' && (
                  <span className={`text-[10px] font-bold ${netWaterPerTurn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netWaterPerTurn >= 0 ? '▲' : '▼'} {Math.abs(netWaterPerTurn)}/t
                  </span>
                )}
              </div>
              {isLow && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-xs font-medium text-red-500"
                >
                  Low!
                </motion.p>
              )}
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (resources[type] / 200) * 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${RESOURCE_COLORS[type]}`}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Upkeep Forecast */}
      <div className="rounded-xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 dark:border-indigo-800/30 dark:from-indigo-900/10 dark:to-blue-900/10">
        <h3 className="mb-2 text-xs font-bold text-indigo-800 dark:text-indigo-400">📋 Per-Turn Forecast</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 dark:bg-zinc-800/40">
            <span className="text-[10px] text-zinc-500">💰 Gold</span>
            <span className={`font-bold ${netGoldPerTurn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netGoldPerTurn >= 0 ? '+' : ''}{netGoldPerTurn}/turn
            </span>
            {turnsUntilBroke !== null && turnsUntilBroke <= 10 && (
              <span className="mt-0.5 text-[9px] text-red-500 font-semibold">⚠️ {turnsUntilBroke} turns left</span>
            )}
          </div>
          <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 dark:bg-zinc-800/40">
            <span className="text-[10px] text-zinc-500">🍞 Food</span>
            <span className={`font-bold ${netFoodPerTurn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netFoodPerTurn >= 0 ? '+' : ''}{netFoodPerTurn}/turn
            </span>
            {turnsUntilStarve !== null && turnsUntilStarve <= 10 && (
              <span className="mt-0.5 text-[9px] text-red-500 font-semibold">⚠️ {turnsUntilStarve} turns left</span>
            )}
          </div>
          <div className="flex flex-col items-center rounded-lg bg-white/60 p-2 dark:bg-zinc-800/40">
            <span className="text-[10px] text-zinc-500">💧 Water</span>
            <span className={`font-bold ${netWaterPerTurn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netWaterPerTurn >= 0 ? '+' : ''}{netWaterPerTurn}/turn
            </span>
            {turnsUntilDehydrate !== null && turnsUntilDehydrate <= 10 && (
              <span className="mt-0.5 text-[9px] text-red-500 font-semibold">⚠️ {turnsUntilDehydrate} turns left</span>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-zinc-500">
          <span>📥 Base: +{BASE_INCOME.gold}g +{BASE_INCOME.food}f +{BASE_INCOME.water}w</span>
          <span>📤 Caravan: -{CARAVAN_UPKEEP.food}f -{CARAVAN_UPKEEP.water}w</span>
          {totalUpkeepGold > 0 && <span>👥 Wages: -{totalUpkeepGold}g</span>}
          {tradeIncome > 0 && <span>📊 Trade: +{tradeIncome}g</span>}
        </div>
      </div>

      {/* Personnel Section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Personnel ({personnel.length})
          </h3>
          <div className="flex gap-1">
            {(['guard', 'negotiator', 'scout'] as const).map((role) => {
              const avgCost = getHireCost(role, 5); // average skill
              return (
                <motion.button
                  key={role}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => hirePersonnel(role)}
                  className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                  title={`~${avgCost}g`}
                >
                  Hire {role} <span className="text-[9px] text-blue-400">~{avgCost}g</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Personnel summary */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            Available: {personnelCounts.available}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            Assigned: {personnelCounts.assigned}
          </span>
          {personnelCounts.scouting > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              🔭 Scouting: {personnelCounts.scouting}
            </span>
          )}
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            Injured: {personnelCounts.injured}
          </span>
        </div>

        {/* Personnel list */}
        {personnel.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-400">
            No personnel hired. Hire guards, negotiators, or scouts to protect your trade routes.
          </p>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
            className="flex flex-col gap-1"
          >
            {personnel
              .filter((p) => p.status !== 'dead')
              .map((p) => {
                const roleIcon = p.role === 'guard' ? '🛡️' : p.role === 'negotiator' ? '🗣️' : '🔭';
                const skillPercent = Math.min(100, (p.skill / 10) * 100);
                return (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50 card-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{roleIcon}</span>
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </span>
                      <span className="ml-2 text-xs capitalize text-zinc-500">{p.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400">Skill</span>
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                          style={{ width: `${skillPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">{p.skill}</span>
                    </div>
                    {p.status === 'scouting' && p.scoutingRegion && (
                      <span className="text-[10px] text-indigo-500 animate-fade-pulse">🔭 {p.scoutingRegion}</span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                        p.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : p.status === 'assigned'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : p.status === 'scouting'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </motion.div>
                );
              })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
