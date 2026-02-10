// ============================================================
// Game Page — Rendered when playing
// ============================================================
'use client';

import GameShell from '@/components/layout/GameShell';
import { useGameStore } from '@/store/gameStore';
import { useEffect } from 'react';

export default function GamePage() {
  const phase = useGameStore((s) => s.phase);
  const newGame = useGameStore((s) => s.newGame);

  // Auto-start game when visiting /game
  useEffect(() => {
    if (phase === 'title') {
      newGame();
    }
  }, [phase, newGame]);

  if (phase === 'title') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return <GameShell />;
}
