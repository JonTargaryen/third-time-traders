// ============================================================
// UI Component — Event Toast Notification (with choices)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { getCategoryIcon, getSeverityColor } from '@/engine/events';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventToast() {
  const events = useGameStore((s) => s.events);
  const pendingNotification = useGameStore((s) => s.pendingEventNotification);
  const dismissEvent = useGameStore((s) => s.dismissEvent);
  const dismissAllEvents = useGameStore((s) => s.dismissAllEvents);
  const makeEventChoice = useGameStore((s) => s.makeEventChoice);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  const undismissed = events.filter((e) => !e.dismissed);

  if (!pendingNotification || undismissed.length === 0) return null;

  const latest = undismissed[undismissed.length - 1];
  const hasChoices = latest.choices && latest.choices.length > 0 && !latest.choiceMade;

  const handleDismissOne = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dismissEvent(latest.id);
  };

  const handleDismissAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dismissAllEvents();
  };

  const handleViewEvents = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveTab('events');
    dismissAllEvents();
  };

  return (
    <AnimatePresence>
      <motion.div
        key={latest.id}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-20 left-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2"
      >
        <div className={`rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/95 ${
          latest.severity === 'catastrophic'
            ? 'border-red-400/60 bg-red-50/95 dark:border-red-500/40 animate-danger-pulse'
            : latest.severity === 'major'
            ? 'border-orange-300/60 bg-orange-50/95 dark:border-orange-500/30'
            : 'border-yellow-300/50 bg-white/95 dark:border-yellow-500/30'
        }`}>
          {/* Close X button at top-right */}
          <button
            onClick={handleDismissOne}
            className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg transition hover:bg-red-600 hover:scale-110 active:scale-95"
            aria-label="Dismiss notification"
            type="button"
          >
            ✕
          </button>

          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ rotate: -20 }}
                animate={{ rotate: 0 }}
                className="text-xl"
              >
                {getCategoryIcon(latest.category)}
              </motion.span>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {latest.title}
                </h4>
                <span className={`text-xs font-medium capitalize ${getSeverityColor(latest.severity)}`}>
                  {latest.severity}
                </span>
              </div>
            </div>
            {undismissed.length > 1 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400"
              >
                +{undismissed.length - 1} more
              </motion.span>
            )}
          </div>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            {latest.outcomeText || latest.description}
          </p>

          {/* Event choices */}
          {hasChoices && (
            <div className="mb-3 flex flex-col gap-1.5">
              {latest.choices!.map((choice) => (
                <motion.button
                  key={choice.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => makeEventChoice(latest.id, choice.id)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  type="button"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{choice.label}</span>
                  <p className="mt-0.5 text-zinc-500">{choice.description}</p>
                  {Object.keys(choice.resourceCost).length > 0 && (
                    <span className="mt-0.5 text-red-400">
                      Cost: {Object.entries(choice.resourceCost).map(([k, v]) => `${v} ${k}`).join(', ')}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleViewEvents}
              type="button"
              className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              View Events
            </button>
            <button
              onClick={handleDismissAll}
              type="button"
              className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Dismiss All
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
