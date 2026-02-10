// ============================================================
// Game Component — Trade Panel (with animations & market prices)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { canEstablishRoute, getEstablishedRoutes, getTotalProfitPerTurn } from '@/engine/trade';
import { getPriceLabel, getMostVolatile } from '@/engine/market';
import type { TradeRoute, RegionId } from '@/engine/types';
import { REGIONS } from '@/data/regions';
import AdBanner from '@/components/ui/AdBanner';
import { motion } from 'framer-motion';

function RouteCard({ route }: { route: TradeRoute }) {
  const resources = useGameStore((s) => s.resources);
  const reputation = useGameStore((s) => s.reputation);
  const regions = useGameStore((s) => s.regions);
  const establishRoute = useGameStore((s) => s.establishRoute);
  const dismantleRoute = useGameStore((s) => s.dismantleRoute);

  const fromRegion = regions[route.from as RegionId];
  const toRegion = regions[route.to as RegionId];
  const check = canEstablishRoute(route, resources, reputation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        rounded-xl border p-4 transition-colors
        ${
          route.established
            ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
            : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50'
        }
      `}
    >
      {/* Route header */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {fromRegion?.name || route.from} ↔ {toRegion?.name || route.to}
        </h4>
        {route.established ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
          >
            Active
          </motion.span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700">
            Not established
          </span>
        )}
      </div>

      {/* Cost / Profit */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="mb-1 font-medium text-zinc-500">
            {route.established ? 'Established' : 'Cost to establish'}
          </p>
          {!route.established &&
            Object.entries(route.costToEstablish).map(([key, val]) => (
              <span
                key={key}
                className="mr-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              >
                {key}: {val}
              </span>
            ))}
        </div>
        <div>
          <p className="mb-1 font-medium text-zinc-500">Profit per turn</p>
          {Object.entries(route.profitPerTurn).map(([key, val]) => (
            <span
              key={key}
              className="mr-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              +{val} {key}
            </span>
          ))}
        </div>
      </div>

      {/* Requirements */}
      {!route.established && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-zinc-500">Reputation required</p>
          <div className="flex flex-wrap gap-1">
            {route.requiredReputation.map((req) => {
              const met = reputation[req.factionId] >= req.minimum;
              return (
                <span
                  key={req.factionId}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    met
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {req.factionId}: {reputation[req.factionId]}/{req.minimum} {met ? '✓' : '✗'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Failure reasons */}
      {!route.established && !check.canEstablish && (
        <div className="mb-3">
          {check.reasons.map((reason, i) => (
            <p key={i} className="text-xs text-red-500">⚠ {reason}</p>
          ))}
        </div>
      )}

      {/* Action button */}
      {route.established ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => dismantleRoute(route.id)}
          className="w-full rounded-lg bg-red-50 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
        >
          Dismantle Route (25% refund)
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => establishRoute(route.id)}
          disabled={!check.canEstablish}
          className={`
            w-full rounded-lg py-2 text-xs font-medium transition
            ${
              check.canEstablish
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-700'
            }
          `}
        >
          {check.canEstablish ? 'Establish Route' : 'Requirements not met'}
        </motion.button>
      )}
    </motion.div>
  );
}

export default function TradePanel() {
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const market = useGameStore((s) => s.market);
  const established = getEstablishedRoutes(tradeRoutes);
  const totalProfit = getTotalProfitPerTurn(tradeRoutes);
  const volatile = getMostVolatile(market, 6);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Trade Routes
        </h2>
        <p className="text-xs text-zinc-500">
          Establish trade routes between regions to earn resources each turn.
        </p>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
      >
        <p className="text-xs font-medium text-zinc-500">
          Active routes: {established.length} / {tradeRoutes.length}
        </p>
        {Object.keys(totalProfit).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="text-xs text-zinc-500">Earning per turn:</span>
            {Object.entries(totalProfit).map(([key, val]) => (
              <span
                key={key}
                className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                +{val} {key}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Market Ticker */}
      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          📊 Market Prices (Most Volatile)
        </h3>
        <div className="flex flex-wrap gap-2">
          {volatile.map((item, i) => {
            const regionName = REGIONS[item.region]?.name?.split(' ').pop() || item.region;
            const priceInfo = getPriceLabel(item.price);
            return (
              <motion.span
                key={`${item.region}-${item.resource}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg bg-zinc-50 px-2 py-1 text-xs dark:bg-zinc-800"
              >
                <span className="text-zinc-500">{regionName}</span>{' '}
                <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">{item.resource}</span>{' '}
                <span className={priceInfo.color}>
                  {priceInfo.icon} ×{item.price.toFixed(2)}
                </span>
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* Ad placement */}
      <AdBanner slot="top" />

      {/* Route list */}
      <div className="flex flex-col gap-3">
        {tradeRoutes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
}
