// ============================================================
// Game Component — Events Panel (Event Log + Active Events)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { getSeverityColor, getCategoryIcon } from '@/engine/events';
import { FACTIONS } from '@/data/factions';
import { REGIONS } from '@/data/regions';
import type { GameEvent } from '@/engine/types';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_BG: Record<string, string> = {
  minor: 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50',
  moderate: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
  major: 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20',
  catastrophic: 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30',
};

function EventCard({ event, isActive }: { event: GameEvent; isActive: boolean }) {
  const turn = useGameStore((s) => s.turn);
  const dismissEvent = useGameStore((s) => s.dismissEvent);
  const makeEventChoice = useGameStore((s) => s.makeEventChoice);
  const resources = useGameStore((s) => s.resources);
  const caravan = useGameStore((s) => s.caravan);
  const turnsRemaining = Math.max(0, event.expiresOnTurn - turn);

  // Check if this event affects the player's current location
  const affectsCurrentLocation = event.affectedRegions.includes(caravan.currentRegion);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-xl border p-4 transition-colors ${SEVERITY_BG[event.severity]} ${
        affectsCurrentLocation ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-amber-500' : ''
      }`}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(event.category)}</span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {event.title}
            </h4>
            <p className="text-xs text-zinc-500">
              Turn {event.turn}
              {isActive && turnsRemaining > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  · {turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''} remaining
                </span>
              )}
              {event.duration === 0 && <span className="ml-1 text-zinc-400">· Instant</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getSeverityColor(event.severity)}`}>
            {event.severity}
          </span>
          {isActive && !event.dismissed && (
            <button
              onClick={() => dismissEvent(event.id)}
              className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              aria-label="Dismiss event"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Alert if affects current location */}
      {affectsCurrentLocation && (
        <div className="mb-2 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          ⚠️ This event affects your current location!
        </div>
      )}

      {/* Description */}
      <p className="mb-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {event.description}
      </p>

      {/* Affected Locations with Faction Info */}
      {event.affectedRegions.length > 0 && (
        <div className="mb-2 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Affected Locations</p>
          <div className="flex flex-wrap gap-1.5">
            {event.affectedRegions.map((regionId) => {
              const region = REGIONS[regionId];
              const faction = region ? FACTIONS[region.factionId] : null;
              return (
                <div
                  key={regionId}
                  className="flex items-center gap-1 rounded bg-white px-2 py-1 shadow-sm dark:bg-zinc-700"
                >
                  <span className="text-sm">{region?.icon || '📍'}</span>
                  <div>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {region?.name || regionId}
                    </span>
                    {faction && (
                      <span className="ml-1 text-[10px] text-zinc-500">
                        ({faction.name})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Impact on Trader */}
      <div className="mb-2 rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Impact on Your Trading
        </p>
        <div className="flex flex-wrap gap-1">
          {/* Resource changes */}
          {Object.entries(event.resourceDelta).map(([key, val]) => (
            <span
              key={key}
              className={`rounded px-1.5 py-0.5 text-xs ${
                (val ?? 0) >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {(val ?? 0) >= 0 ? '+' : ''}{val} {key}
            </span>
          ))}

          {/* Trade multiplier */}
          {event.tradeMultiplier !== 1.0 && (
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                event.tradeMultiplier > 1
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {event.tradeMultiplier > 1 ? '📈' : '📉'} Trade profits ×{event.tradeMultiplier.toFixed(1)}
            </span>
          )}

          {Object.keys(event.resourceDelta).length === 0 && event.tradeMultiplier === 1.0 && (
            <span className="text-xs text-zinc-500">No direct resource impact</span>
          )}
        </div>
      </div>

      {/* Faction Relations */}
      {Object.keys(event.reputationDelta).length > 0 && (
        <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
            Faction Reputation Changes
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(event.reputationDelta).map(([factionId, val]) => {
              const faction = FACTIONS[factionId as keyof typeof FACTIONS];
              return (
                <span
                  key={factionId}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    (val ?? 0) >= 0
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}
                >
                  {(val ?? 0) >= 0 ? '👍' : '👎'} {(val ?? 0) >= 0 ? '+' : ''}{val} {faction?.name || factionId}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Choices */}
      {isActive && event.choices && event.choices.length > 0 && !event.choiceMade && (
        <div className="mt-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            🎯 Choose Your Response
          </p>
          <div className="space-y-2">
            {event.choices.map((choice) => {
              const canAfford = Object.entries(choice.resourceCost).every(
                ([key, val]) => resources[key as keyof typeof resources] >= (val ?? 0)
              );
              return (
                <motion.button
                  key={choice.id}
                  whileTap={canAfford ? { scale: 0.97 } : undefined}
                  onClick={() => canAfford && makeEventChoice(event.id, choice.id)}
                  disabled={!canAfford}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    canAfford
                      ? 'border-indigo-300 bg-white hover:bg-indigo-50 dark:border-indigo-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                      : 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50'
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{choice.label}</span>
                  <p className="mt-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">{choice.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(choice.resourceCost).map(([key, val]) => (
                      <span key={key} className="rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        -{val} {key}
                      </span>
                    ))}
                    <span className="text-[10px] text-zinc-400">
                      {Math.round(choice.successChance * 100)}% success
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Choice outcome */}
      {event.choiceMade && event.outcomeText && (
        <div className="mt-2 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            📋 {event.outcomeText}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function EventsPanel() {
  const events = useGameStore((s) => s.events);
  const eventLog = useGameStore((s) => s.eventLog);
  const turn = useGameStore((s) => s.turn);
  const dismissAllEvents = useGameStore((s) => s.dismissAllEvents);

  const activeEvents = events.filter((e) => e.expiresOnTurn > turn || e.duration === 0);
  const undismissed = events.filter((e) => !e.dismissed);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            World Events
          </h2>
          <p className="text-xs text-zinc-500">
            Natural disasters, market shifts, faction conflicts, and more shape the world each turn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Event severity summary */}
          {activeEvents.length > 0 && (
            <div className="flex gap-1">
              {activeEvents.some((e) => e.severity === 'catastrophic') && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white animate-danger-pulse">💀 Critical</span>
              )}
              {activeEvents.some((e) => e.severity === 'major') && (
                <span className="rounded-full bg-orange-400 px-1.5 py-0.5 text-[9px] font-bold text-white">⚠️ Major</span>
              )}
            </div>
          )}
          {undismissed.length > 0 && (
            <button
              onClick={dismissAllEvents}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Active Events ({activeEvents.length})
          </h3>
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} isActive={true} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* No events message */}
      {activeEvents.length === 0 && eventLog.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <motion.span
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-2 block text-4xl"
          >
            🌤️
          </motion.span>
          <p className="text-xs text-zinc-400">
            All is calm in the world. End your turn to see what happens next!
          </p>
          <p className="mt-1 text-[10px] text-zinc-400/60">
            Events can bring fortune or disaster — stay prepared!
          </p>
        </motion.div>
      )}

      {/* Event Log with count */}
      {eventLog.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Event History ({eventLog.length})</span>
            <span className="text-[10px] normal-case font-normal text-zinc-400">Showing last 20</span>
          </h3>
          <div className="flex flex-col gap-2">
            {eventLog.slice(0, 20).map((event) => (
              <EventCard key={event.id} event={event} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
