// ============================================================
// Game Component — Region Detail Panel (with animations & market info)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { FACTIONS } from '@/data/factions';
import { getRelationshipStatus } from '@/engine/reputation';
import { getRoutesForRegion } from '@/engine/trade';
import { getEventsForRegion } from '@/engine/events';
import { getPrice, getPriceLabel } from '@/engine/market';
import type { RegionId } from '@/engine/types';
import { ALL_RESOURCE_TYPES } from '@/engine/types';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = {
  hostile: 'text-red-500',
  unfriendly: 'text-orange-400',
  neutral: 'text-zinc-400',
  friendly: 'text-emerald-400',
  allied: 'text-blue-400',
};

export default function RegionDetail() {
  const selectedRegion = useGameStore((s) => s.selectedRegion);
  const regions = useGameStore((s) => s.regions);
  const reputation = useGameStore((s) => s.reputation);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const selectRegion = useGameStore((s) => s.selectRegion);
  const discoverRegion = useGameStore((s) => s.discoverRegion);
  const events = useGameStore((s) => s.events);
  const market = useGameStore((s) => s.market);

  if (!selectedRegion) return null;

  const region = regions[selectedRegion];
  if (!region) return null;

  const faction = FACTIONS[region.factionId];
  const status = getRelationshipStatus(reputation, region.factionId);
  const routes = getRoutesForRegion(tradeRoutes, selectedRegion);
  const regionEvents = getEventsForRegion(events, selectedRegion);
  const adjacentUndiscovered = region.adjacentRegions.filter(
    (id) => !regions[id]?.discovered
  );

  // Get market prices for this region
  const prices = ALL_RESOURCE_TYPES.map((r) => ({
    resource: r,
    price: getPrice(market, selectedRegion, r),
  })).filter((p) => p.price !== 1.0 || Object.keys(region.resources).includes(p.resource));

  return (
    <AnimatePresence>
      <motion.div
        key={selectedRegion}
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute right-3 top-3 z-10 w-72 rounded-2xl border border-zinc-200/50 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/90"
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{region.icon}</span>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {region.name}
              </h3>
              <p className="text-xs text-zinc-500" style={{ color: faction?.color }}>
                {faction?.name}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => selectRegion(null)}
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            ✕
          </motion.button>
        </div>

        {/* Description */}
        <p className="mb-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {region.description}
        </p>

        {/* Reputation */}
        <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
          <span className="text-xs text-zinc-500">Reputation</span>
          <motion.span
            key={reputation[region.factionId]}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-xs font-semibold capitalize ${STATUS_COLORS[status]}`}
          >
            {status} ({reputation[region.factionId]})
          </motion.span>
        </div>

        {/* Resources */}
        {Object.keys(region.resources).length > 0 && (
          <div className="mb-3">
            <h4 className="mb-1 text-xs font-medium text-zinc-500">Available Resources</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(region.resources).map(([key, val]) => (
                <span
                  key={key}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {key}: {val}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Market Prices */}
        {prices.length > 0 && (
          <div className="mb-3">
            <h4 className="mb-1 text-xs font-medium text-zinc-500">Market Prices</h4>
            <div className="flex flex-wrap gap-1">
              {prices.slice(0, 4).map(({ resource, price }) => {
                const info = getPriceLabel(price);
                return (
                  <span
                    key={resource}
                    className={`rounded px-1.5 py-0.5 text-xs ${info.color}`}
                  >
                    {resource}: {info.icon} ×{price.toFixed(2)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Events */}
        {regionEvents.length > 0 && (
          <div className="mb-3">
            <h4 className="mb-1 text-xs font-medium text-zinc-500">Active Events</h4>
            {regionEvents.slice(0, 2).map((e) => (
              <p key={e.id} className="text-xs text-amber-600 dark:text-amber-400">
                ⚡ {e.title}
              </p>
            ))}
          </div>
        )}

        {/* Trade Routes */}
        <div className="mb-3">
          <h4 className="mb-1 text-xs font-medium text-zinc-500">Trade Routes ({routes.length})</h4>
          {routes.map((route) => {
            const otherRegionId = route.from === selectedRegion ? route.to : route.from;
            const otherRegion = regions[otherRegionId as RegionId];
            return (
              <div
                key={route.id}
                className="flex items-center justify-between rounded-lg px-2 py-1 text-xs"
              >
                <span className="text-zinc-600 dark:text-zinc-400">
                  → {otherRegion?.name || otherRegionId}
                </span>
                <span
                  className={
                    route.established
                      ? 'font-medium text-emerald-500'
                      : 'text-zinc-400'
                  }
                >
                  {route.established ? 'Active' : 'Not established'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Discover adjacent */}
        {adjacentUndiscovered.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-medium text-zinc-500">Explore</h4>
            <div className="flex flex-wrap gap-1">
              {adjacentUndiscovered.map((id) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => discoverRegion(id)}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  Discover {regions[id]?.name || id}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
