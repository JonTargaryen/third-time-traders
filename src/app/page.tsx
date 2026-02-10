// ============================================================
// Landing Page — Title Screen
// ============================================================
'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TITLE_SCREEN_QUOTES, GAME_TIPS } from '@/lib/constants';

export default function Home() {
  const loadSaveData = useGameStore((s) => s.loadSaveData);
  const newGame = useGameStore((s) => s.newGame);
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Check for save data only on the client after mount
  useEffect(() => {
    setHasSave(!!localStorage.getItem('ttt-save'));
  }, []);

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % TITLE_SCREEN_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = TITLE_SCREEN_QUOTES[quoteIndex];
  const currentTip = useMemo(() => GAME_TIPS[quoteIndex % GAME_TIPS.length], [quoteIndex]);

  const handleContinue = () => {
    const data = localStorage.getItem('ttt-save');
    if (data) {
      loadSaveData(data);
      router.push('/game');
    }
  };

  const handleNewGame = () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }
    newGame(playerName.trim() || 'Trader');
    router.push('/game');
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-center">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-blue-900/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-3xl"
        />
        <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] rounded-full bg-amber-900/10 blur-3xl" />
        {/* Floating trade particles (deterministic positions to avoid hydration mismatch) */}
        {[
          { left: 12, top: 65, dur: 7, delay: 0.5, dy: -150, dx: 20 },
          { left: 85, top: 72, dur: 8, delay: 1.2, dy: -200, dx: -30 },
          { left: 30, top: 80, dur: 6, delay: 2.0, dy: -180, dx: 15 },
          { left: 55, top: 68, dur: 9, delay: 0.8, dy: -220, dx: -20 },
          { left: 70, top: 75, dur: 7, delay: 3.0, dy: -160, dx: 35 },
          { left: 20, top: 85, dur: 8, delay: 1.5, dy: -190, dx: -10 },
          { left: 45, top: 62, dur: 6, delay: 4.0, dy: -170, dx: 25 },
          { left: 90, top: 78, dur: 9, delay: 2.5, dy: -140, dx: -40 },
          { left: 38, top: 70, dur: 7, delay: 0.3, dy: -210, dx: 10 },
          { left: 62, top: 82, dur: 8, delay: 3.5, dy: -130, dx: -25 },
          { left: 15, top: 88, dur: 6, delay: 1.8, dy: -250, dx: 30 },
          { left: 78, top: 66, dur: 9, delay: 4.5, dy: -160, dx: -15 },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              y: [0, p.dy],
              x: [0, p.dx],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute text-sm"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
          >
            {['✨', '⭐', '💫', '🪙', '📦', '⚖️', '🗺️', '🧭', '💎', '🌟', '🔮', '🏺'][i]}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-lg shadow-blue-500/20"
          >
            ⚖️
          </motion.div>
          <h1 className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Third Time
          </h1>
          <h1 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Traders
          </h1>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          Negotiate. Trade. Survive. Build your empire across ancient India
          where every deal could be your last — or your making.
        </motion.p>

        {/* Rotating NPC quotes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-xs italic leading-relaxed text-zinc-400">
                <span className="mr-1 text-sm">{currentQuote.emoji}</span>
                &quot;{currentQuote.text}&quot;
              </p>
              <p className="mt-2 text-xs text-zinc-600">— {currentQuote.author}</p>
            </motion.div>
          </AnimatePresence>
          {/* Quote dots indicator */}
          <div className="mt-3 flex justify-center gap-1">
            {TITLE_SCREEN_QUOTES.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === quoteIndex % 5 ? 'w-4 bg-blue-500' : 'w-1 bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Player name input */}
        {showNameInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full max-w-xs"
          >
            <input
              type="text"
              placeholder="Enter your trader name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewGame()}
              autoFocus
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              maxLength={20}
            />
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={handleNewGame}
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/30"
          >
            {showNameInput ? 'Start Trading' : 'New Game'}
          </motion.button>
          {hasSave && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={handleContinue}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-8 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Continue
            </motion.button>
          )}
        </motion.div>

        {/* Faction preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-4 flex gap-3"
        >
          {[
            { name: 'Mughal Court', color: '#C41E3A' },
            { name: 'East India Co.', color: '#1E3A5F' },
            { name: 'Rajput Clans', color: '#DAA520' },
            { name: 'Brahmin Council', color: '#FF6600' },
            { name: 'Nightmarket', color: '#4B0082' },
            { name: 'Nizam\'s Court', color: '#228B22' },
          ].map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="group flex flex-col items-center gap-1"
              title={f.name}
            >
              <div
                className="h-4 w-4 rounded-full border border-zinc-700 transition group-hover:scale-125"
                style={{ backgroundColor: f.color }}
              />
              <span className="text-[10px] text-zinc-600 opacity-0 transition group-hover:opacity-100">
                {f.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Rotating game tip */}
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-xs text-center text-[11px] text-zinc-600"
          >
            {currentTip}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
