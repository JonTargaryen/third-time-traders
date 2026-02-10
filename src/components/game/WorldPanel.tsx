// ============================================================
// Game Component — World Panel (consolidated Map + Trade + Gather + NPCs)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { useCallback, useRef, useEffect, useState } from 'react';
import type { RegionId, Region, TradeRoute, Caravan, ScoutingMission, Resources } from '@/engine/types';
import { FACTIONS } from '@/data/factions';
import { canEstablishRoute, getRoutesForRegion, getEstablishedRoutes, getTotalProfitPerTurn } from '@/engine/trade';
import { getRelationshipStatus } from '@/engine/reputation';
import { calculateTravelCost } from '@/engine/world';

import { motion, AnimatePresence } from 'framer-motion';
import { REGION_DANGER, FACTION_QUIPS, TRADE_ROUTE_NAMES, REGION_WEATHER, ARRIVAL_MESSAGES, HAGGLING_QUIPS, CARAVAN_STATUS_MESSAGES } from '@/lib/constants';
import { getSeason } from '@/engine/types';

// ============================================================
// Resource icons
// ============================================================

const RESOURCE_ICONS: Record<string, string> = {
  fuel: '⛽', water: '💧', food: '🍞', gold: '💰', contraband: '📦', information: '📜',
};

// ============================================================
// Map Canvas
// ============================================================

function drawMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  regions: Record<RegionId, Region>,
  tradeRoutes: TradeRoute[],
  selectedRegion: RegionId | null,
  caravan: Caravan,
  scoutingMissions: ScoutingMission[],
) {
  ctx.clearRect(0, 0, width, height);

  // Bright, colorful background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1a1a3e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 60; i++) {
    const sx = (Math.sin(i * 73.1) * 0.5 + 0.5) * width;
    const sy = (Math.cos(i * 47.3) * 0.5 + 0.5) * height;
    const sr = Math.sin(i * 11.7) * 1 + 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw grid (subtle)
  ctx.strokeStyle = 'rgba(100,149,237,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Draw trade routes
  const regionArr = Object.values(regions);
  for (const route of tradeRoutes) {
    const from = regionArr.find((r) => r.id === route.from);
    const to = regionArr.find((r) => r.id === route.to);
    if (!from || !to) continue;
    if (!from.discovered && !to.discovered) continue;

    const fx = from.position.x * width;
    const fy = from.position.y * height;
    const tx = to.position.x * width;
    const ty = to.position.y * height;

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);

    if (route.established) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else if (from.discovered && to.discovered) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw regions
  for (const region of regionArr) {
    const x = region.position.x * width;
    const y = region.position.y * height;
    const faction = FACTIONS[region.factionId];
    const isSelected = selectedRegion === region.id;
    const isCaravanHere = caravan.currentRegion === region.id;
    const radius = isSelected ? 26 : 20;

    if (!region.discovered) {
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2753', x, y);
      ctx.textBaseline = 'alphabetic';
      // Show faint name for undiscovered regions
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('???', x, y + 28);
      continue;
    }

    // Bright outer glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 14, 0, Math.PI * 2);
      const glowGrad = ctx.createRadialGradient(x, y, radius, x, y, radius + 14);
      glowGrad.addColorStop(0, (faction?.brightColor || '#fff') + '88');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fill();
    }

    // Node background with bright color
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const nodeGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    nodeGrad.addColorStop(0, faction?.brightColor || '#888');
    nodeGrad.addColorStop(1, faction?.color || '#555');
    ctx.fillStyle = nodeGrad;
    ctx.fill();

    // Border — gold if caravan is here
    if (isCaravanHere) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      // Extra outer ring
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251,191,36,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
    }

    // Region emoji
    ctx.font = (isSelected ? '24' : '20') + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(region.icon, x, y);
    ctx.textBaseline = 'alphabetic';

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = (isSelected ? 'bold ' : '') + '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(region.name, x, y + radius + 16);

    // Caravan indicator below label
    if (isCaravanHere) {
      ctx.font = '14px serif';
      ctx.fillText('\uD83D\uDE9A', x, y + radius + 30);
    }

    // Faction NPC indicator
    if (faction?.npc) {
      ctx.font = '12px serif';
      ctx.fillText(faction.npc.emoji, x + radius - 4, y - radius + 4);
    }
  }

  // Draw scouting missions (show scouts at target undiscovered regions)
  for (const mission of scoutingMissions) {
    if (mission.status !== 'in-progress') continue;
    const targetRegion = regions[mission.targetRegion];
    if (targetRegion) {
      const mx = targetRegion.position.x * width;
      const my = targetRegion.position.y * height;

      // Pulsing scout indicator
      ctx.beginPath();
      ctx.arc(mx, my + 22, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\uD83D\uDD2D', mx, my + 22);
      ctx.textBaseline = 'alphabetic';
    }
  }
}

function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const regions = useGameStore((s) => s.regions);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const selectedRegion = useGameStore((s) => s.selectedRegion);
  const selectRegion = useGameStore((s) => s.selectRegion);
  const caravan = useGameStore((s) => s.caravan);
  const scoutingMissions = useGameStore((s) => s.scoutingMissions);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: Math.max(280, rect.height) });
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    drawMap(ctx, dimensions.width, dimensions.height, regions, tradeRoutes, selectedRegion, caravan, scoutingMissions);
  }, [regions, tradeRoutes, selectedRegion, dimensions, caravan, scoutingMissions]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const regionArr = Object.values(regions);
      for (const region of regionArr) {
        if (!region.discovered) continue;
        const rx = region.position.x * dimensions.width;
        const ry = region.position.y * dimensions.height;
        const dist = Math.sqrt((clickX - rx) ** 2 + (clickY - ry) ** 2);
        if (dist < 28) {
          selectRegion(selectedRegion === region.id ? null : region.id);
          return;
        }
      }
      selectRegion(null);
    },
    [regions, selectRegion, selectedRegion, dimensions]
  );

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden rounded-xl">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="h-full w-full cursor-pointer"
        style={{ width: dimensions.width, height: dimensions.height }}
        aria-label="World map"
        role="img"
      />
    </div>
  );
}

// ============================================================
// Caravan Status Bar
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  hostile: 'text-red-500',
  unfriendly: 'text-orange-400',
  neutral: 'text-zinc-500',
  friendly: 'text-emerald-500',
  allied: 'text-blue-500',
};

function CaravanStatusBar() {
  const caravan = useGameStore((s) => s.caravan);
  const regions = useGameStore((s) => s.regions);
  const resources = useGameStore((s) => s.resources);
  const scoutingMissions = useGameStore((s) => s.scoutingMissions);
  const turn = useGameStore((s) => s.turn);

  const currentRegion = regions[caravan.currentRegion];
  const activeMissions = scoutingMissions.filter((m) => m.status === 'in-progress');

  const fuelLow = resources.fuel <= 15;

  // Determine caravan mood message
  const season = getSeason(turn);
  const weather = REGION_WEATHER[caravan.currentRegion]?.[season];
  const statusKey = resources.food <= 10 ? 'low_food'
    : resources.water <= 10 ? 'low_water'
    : resources.fuel <= 15 ? 'low_fuel'
    : resources.gold >= 1000 ? 'rich'
    : 'healthy';
  const statusMessages = CARAVAN_STATUS_MESSAGES[statusKey] || CARAVAN_STATUS_MESSAGES.healthy;
  const statusMsg = statusMessages[turn % statusMessages.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 p-3 shadow-md ${
        fuelLow
          ? 'border-red-400/60 bg-gradient-to-r from-red-50 to-orange-50 dark:border-red-700/60 dark:from-red-900/20 dark:to-orange-900/20'
          : 'border-amber-300/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-700/50 dark:from-amber-900/20 dark:to-orange-900/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-2xl animate-gentle-bob"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {'\uD83D\uDE9A'}
          </motion.span>
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Your Caravan</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {'\uD83D\uDCCD'} {currentRegion?.name || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-amber-600 dark:text-amber-400">Fuel</p>
            <p className={`text-sm font-bold ${fuelLow ? 'text-red-600 dark:text-red-400 animate-countdown-pulse' : 'text-amber-900 dark:text-amber-200'}`}>
              {'\u26FD'} {resources.fuel} {fuelLow ? '⚠️' : ''}
            </p>
          </div>
          {activeMissions.length > 0 && (
            <div className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white animate-fade-pulse">
              {'\uD83D\uDD2D'} {activeMissions.length} Scout{activeMissions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      {/* Ambient info: weather + status message */}
      <div className="mt-2 flex items-center gap-2 text-[10px]">
        {weather && (
          <span className="text-amber-500 dark:text-amber-400/70">{weather}</span>
        )}
      </div>
      <p className="mt-1 text-[10px] italic text-amber-500/80 dark:text-amber-400/50">{statusMsg}</p>
    </motion.div>
  );
}

// ============================================================
// Marketplace Panel (buy/sell at caravan's current region)
// ============================================================

function MarketplaceSection({ regionId }: { regionId: RegionId }) {
  const regions = useGameStore((s) => s.regions);
  const resources = useGameStore((s) => s.resources);
  const reputation = useGameStore((s) => s.reputation);
  const buyResource = useGameStore((s) => s.buyResource);
  const sellResource = useGameStore((s) => s.sellResource);
  const caravan = useGameStore((s) => s.caravan);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [haggleQuip, setHaggleQuip] = useState<string | null>(null);

  const region = regions[regionId];
  if (!region?.marketplace || region.marketplace.length === 0) return null;

  const isHere = caravan.currentRegion === regionId;
  if (!isHere) return null;

  const status = getRelationshipStatus(reputation, region.factionId);

  // Hostile factions block marketplace entirely
  if (status === 'hostile') {
    const faction = FACTIONS[region.factionId];
    return (
      <div className="mb-3 rounded-lg border-2 border-red-300/50 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-900/20">
        <h4 className="mb-1 text-xs font-bold text-red-700 dark:text-red-400">🚫 Marketplace Blocked!</h4>
        <p className="text-[10px] text-red-600 dark:text-red-400">
          The {faction?.name || 'local faction'} refuse to trade with you. Improve your reputation to regain access.
        </p>
      </div>
    );
  }

  // Price modifier text based on reputation
  const repPriceNote =
    status === 'unfriendly' ? { text: '📉 Unfriendly prices: +25% buy / -25% sell', color: 'text-orange-600 dark:text-orange-400' }
    : status === 'allied' ? { text: '🤝 Allied discount: -15% buy / +15% sell!', color: 'text-blue-600 dark:text-blue-400' }
    : null;

  const handleBuy = (resourceType: keyof Resources, amount: number) => {
    const result = buyResource(regionId, resourceType, amount);
    setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) {
      setHaggleQuip(HAGGLING_QUIPS[Math.floor(Math.random() * HAGGLING_QUIPS.length)]);
      setTimeout(() => setHaggleQuip(null), 3000);
    }
    setTimeout(() => setMsg(null), 2500);
  };

  const handleSell = (resourceType: keyof Resources, amount: number) => {
    const result = sellResource(regionId, resourceType, amount);
    setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) {
      setHaggleQuip(HAGGLING_QUIPS[Math.floor(Math.random() * HAGGLING_QUIPS.length)]);
      setTimeout(() => setHaggleQuip(null), 3000);
    }
    setTimeout(() => setMsg(null), 2500);
  };

  // action === 'sell' means the REGION sells → player can BUY
  // action === 'buy'  means the REGION buys  → player can SELL
  const buyItems = region.marketplace.filter((i) => i.action === 'sell');
  const sellItems = region.marketplace.filter((i) => i.action === 'buy');

  return (
    <div className="mb-3">
      <h4 className="mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">{'\uD83C\uDFEA'} Marketplace</h4>

      {/* Reputation price modifier banner */}
      {repPriceNote && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mb-2 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${repPriceNote.color}`}
        >
          {repPriceNote.text}
        </motion.div>
      )}

      {msg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mb-2 rounded-lg px-2 py-1 text-[10px] font-semibold ${
            msg.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {msg.text}
        </motion.div>
      )}

      {/* Haggling quip from the merchant */}
      <AnimatePresence>
        {haggleQuip && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 rounded-lg bg-amber-50/60 px-2.5 py-1.5 text-[10px] italic text-amber-600 dark:bg-amber-900/15 dark:text-amber-400"
          >
            🗣️ {haggleQuip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy section */}
      {buyItems.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Buy from traders</p>
          <div className="space-y-1">
            {buyItems.map((item) => {
              const effectivePrice = Math.round(item.basePrice * item.priceModifier);
              const canAfford = resources.gold >= effectivePrice;
              return (
                <div key={`buy-${item.resourceType}`} className="flex items-center justify-between rounded-lg bg-emerald-50/50 px-2 py-1.5 dark:bg-emerald-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{RESOURCE_ICONS[item.resourceType] || '\uD83D\uDCE6'}</span>
                    <span className="text-xs capitalize text-zinc-700 dark:text-zinc-300">{item.resourceType}</span>
                    <span className="text-[10px] text-zinc-400">({effectivePrice}g each)</span>
                    {item.available >= 0 && (
                      <span className="text-[10px] text-zinc-400">{item.available} left</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      whileTap={canAfford ? { scale: 0.9 } : undefined}
                      onClick={() => handleBuy(item.resourceType, 1)}
                      disabled={!canAfford || item.available === 0}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                        canAfford && item.available !== 0
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
                      }`}
                    >
                      +1
                    </motion.button>
                    <motion.button
                      whileTap={resources.gold >= effectivePrice * 5 ? { scale: 0.9 } : undefined}
                      onClick={() => handleBuy(item.resourceType, 5)}
                      disabled={resources.gold < effectivePrice * 5 || (item.available >= 0 && item.available < 5)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                        resources.gold >= effectivePrice * 5 && (item.available < 0 || item.available >= 5)
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
                      }`}
                    >
                      +5
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sell section */}
      {sellItems.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400">Sell to traders</p>
          <div className="space-y-1">
            {sellItems.map((item) => {
              const effectivePrice = Math.round(item.basePrice * item.priceModifier);
              const hasResource = resources[item.resourceType] > 0;
              return (
                <div key={`sell-${item.resourceType}`} className="flex items-center justify-between rounded-lg bg-orange-50/50 px-2 py-1.5 dark:bg-orange-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{RESOURCE_ICONS[item.resourceType] || '\uD83D\uDCE6'}</span>
                    <span className="text-xs capitalize text-zinc-700 dark:text-zinc-300">{item.resourceType}</span>
                    <span className="text-[10px] text-zinc-400">(+{effectivePrice}g each)</span>
                    <span className="text-[10px] text-zinc-500">You have: {resources[item.resourceType]}</span>
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      whileTap={hasResource ? { scale: 0.9 } : undefined}
                      onClick={() => handleSell(item.resourceType, 1)}
                      disabled={!hasResource}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                        hasResource
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
                      }`}
                    >
                      -1
                    </motion.button>
                    <motion.button
                      whileTap={resources[item.resourceType] >= 5 ? { scale: 0.9 } : undefined}
                      onClick={() => handleSell(item.resourceType, 5)}
                      disabled={resources[item.resourceType] < 5}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                        resources[item.resourceType] >= 5
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
                      }`}
                    >
                      -5
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Region Detail Panel (with NPC, lore, gather, marketplace, travel, scouting)
// ============================================================

function RegionDetailPanel() {
  const selectedRegion = useGameStore((s) => s.selectedRegion);
  const regions = useGameStore((s) => s.regions);
  const reputation = useGameStore((s) => s.reputation);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const selectRegion = useGameStore((s) => s.selectRegion);
  const discoverRegion = useGameStore((s) => s.discoverRegion);
  const performGatherAction = useGameStore((s) => s.performGatherAction);
  const gatherCooldowns = useGameStore((s) => s.gatherCooldowns);
  const turn = useGameStore((s) => s.turn);
  const establishRoute = useGameStore((s) => s.establishRoute);
  const resources = useGameStore((s) => s.resources);
  const caravan = useGameStore((s) => s.caravan);
  const travelTo = useGameStore((s) => s.travelTo);
  const sendScout = useGameStore((s) => s.sendScout);
  const buyMap = useGameStore((s) => s.buyMap);
  const personnel = useGameStore((s) => s.personnel);
  const scoutingMissions = useGameStore((s) => s.scoutingMissions);

  const [gatherMessage, setGatherMessage] = useState<string | null>(null);
  const [showLore, setShowLore] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!selectedRegion) return null;
  const region = regions[selectedRegion];
  if (!region) return null;

  const faction = FACTIONS[region.factionId];
  const status = getRelationshipStatus(reputation, region.factionId);
  const routes = getRoutesForRegion(tradeRoutes, selectedRegion);
  const adjacentUndiscovered = region.adjacentRegions.filter((id) => !regions[id]?.discovered);

  const isCaravanHere = caravan.currentRegion === selectedRegion;
  const travelCost = !isCaravanHere ? calculateTravelCost(regions, caravan.currentRegion, selectedRegion, caravan) : null;
  const canAffordTravel = travelCost ? resources.fuel >= travelCost.fuel : false;

  const availableScouts = personnel.filter((p) => p.role === 'scout' && p.status === 'available');

  const showMessage = (result: { success: boolean; message: string }) => {
    setActionMessage({ type: result.success ? 'success' : 'error', text: result.message });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleGather = (actionId: string) => {
    const result = performGatherAction(selectedRegion, actionId);
    setGatherMessage(result.message);
    setTimeout(() => setGatherMessage(null), 3000);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={selectedRegion}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="rounded-2xl border-2 border-yellow-200/50 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-zinc-600/50 dark:bg-zinc-900/95"
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{region.icon}</span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{region.name}</h3>
              <p className="text-xs font-semibold" style={{ color: faction?.brightColor }}>{faction?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCaravanHere && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {'\uD83D\uDE9A'} You are here
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => selectRegion(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              aria-label="Close"
            >
              {'\u2715'}
            </motion.button>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${
              actionMessage.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {actionMessage.text}
          </motion.div>
        )}

        {/* Travel Button (if not at this region) */}
        {!isCaravanHere && travelCost && (
          <div className="mb-3 rounded-lg border-2 border-blue-200/50 bg-blue-50/50 p-3 dark:border-blue-800/50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">{'\uD83D\uDE9A'} Travel Here</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">
                    Cost: {'\u26FD'} {travelCost.fuel} fuel
                  </p>
                  {REGION_DANGER[selectedRegion] && (
                    <span className={`text-[10px] font-semibold ${REGION_DANGER[selectedRegion].color}`}>
                      {REGION_DANGER[selectedRegion].emoji} {REGION_DANGER[selectedRegion].level}
                    </span>
                  )}
                </div>
                {status === 'hostile' && (
                  <p className="mt-0.5 text-[10px] text-red-500 font-semibold">⚠️ Hostile territory — +50% fuel cost!</p>
                )}
              </div>
              <motion.button
                whileTap={canAffordTravel ? { scale: 0.95 } : undefined}
                onClick={() => showMessage(travelTo(selectedRegion))}
                disabled={!canAffordTravel}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  canAffordTravel
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
                }`}
              >
                {canAffordTravel ? 'Travel' : 'Need ' + travelCost.fuel + ' fuel'}
              </motion.button>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="mb-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{region.description}</p>

        {/* Weather / Ambient */}
        {(() => {
          const season = getSeason(turn);
          const weather = REGION_WEATHER[selectedRegion]?.[season];
          return weather ? (
            <motion.p
              key={`weather-${turn}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-2 rounded-lg bg-sky-50/60 px-2.5 py-1.5 text-[10px] text-sky-600 dark:bg-sky-900/15 dark:text-sky-400"
            >
              {weather}
            </motion.p>
          ) : null;
        })()}

        {/* Lore toggle */}
        {region.lore && (
          <button
            onClick={() => setShowLore(!showLore)}
            className="mb-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            {showLore ? '\uD83D\uDCD6 Hide Story' : '\uD83D\uDCD6 Read the Story...'}
          </button>
        )}
        {showLore && region.lore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-3 rounded-lg bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-300"
          >
            {region.lore}
          </motion.div>
        )}

        {/* NPC Section */}
        {faction?.npc && (
          <div className="mb-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20 card-hover">
            <div className="flex items-center gap-2 mb-1">
              <motion.span
                className="text-xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {faction.npc.emoji}
              </motion.span>
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{faction.npc.name}</span>
                <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">{'\u2014'} {faction.npc.title}</span>
              </div>
            </div>
            <p className="text-xs italic text-amber-700 dark:text-amber-400">&ldquo;{faction.npc.greeting}&rdquo;</p>
            <p className="mt-1 text-[10px] text-amber-500">{faction.npc.personality}</p>
            {/* Random faction quip */}
            {FACTION_QUIPS[region.factionId] && (
              <motion.p
                key={turn}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 rounded-md bg-amber-100/60 px-2 py-1 text-[10px] italic text-amber-600 dark:bg-amber-800/20 dark:text-amber-400"
              >
                {FACTION_QUIPS[region.factionId][turn % FACTION_QUIPS[region.factionId].length]}
              </motion.p>
            )}
          </div>
        )}

        {/* Reputation */}
        <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
          <span className="text-xs text-zinc-500">Your Reputation</span>
          <motion.span
            key={reputation[region.factionId]}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={'text-xs font-bold capitalize ' + STATUS_COLORS[status]}
          >
            {status} ({reputation[region.factionId]})
          </motion.span>
        </div>

        {/* Marketplace */}
        <MarketplaceSection regionId={selectedRegion} />

        {/* Gather Message */}
        {gatherMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400"
          >
            {gatherMessage}
          </motion.div>
        )}

        {/* Gather Actions */}
        {region.gatherActions && region.gatherActions.length > 0 && (
          <div className="mb-3">
            <h4 className="mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">{'\u26CF\uFE0F'} Gather Resources</h4>
            <div className="flex flex-col gap-1.5">
              {region.gatherActions.map((action) => {
                const cooldownUntil = gatherCooldowns[action.id] || 0;
                const onCooldown = turn < cooldownUntil;
                const needsRep = action.requiredReputation && reputation[action.requiredReputation.factionId] < action.requiredReputation.minimum;
                const disabled = onCooldown || !!needsRep;

                return (
                  <motion.button
                    key={action.id}
                    whileTap={!disabled ? { scale: 0.95 } : undefined}
                    onClick={() => !disabled && handleGather(action.id)}
                    disabled={disabled}
                    className={'rounded-lg border px-3 py-2 text-left text-xs transition ' +
                      (disabled
                        ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'
                        : 'border-green-200 bg-green-50 text-zinc-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-zinc-300 dark:hover:bg-green-900/30')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{action.emoji} {action.name}</span>
                      <span className="text-[10px] text-zinc-400">{Math.round(action.successChance * 100)}% chance</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-zinc-500">{action.description}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(action.resourceReward).map(([k, v]) => (
                        <span key={k} className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          +{v} {k}
                        </span>
                      ))}
                    </div>
                    {onCooldown && (
                      <span className="mt-1 text-[10px] text-amber-500">{'\u23F3'} Available in {cooldownUntil - turn} turn(s)</span>
                    )}
                    {needsRep && action.requiredReputation && (
                      <span className="mt-1 text-[10px] text-red-400">{'\uD83D\uDD12'} Need {action.requiredReputation.minimum} rep with {FACTIONS[action.requiredReputation.factionId]?.name}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Trade Routes for this region */}
        {routes.length > 0 && (
          <div className="mb-3">
            <h4 className="mb-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">{'\uD83C\uDFEA'} Trade Routes</h4>
            {routes.map((route) => {
              const otherRegionId = route.from === selectedRegion ? route.to : route.from;
              const otherRegion = regions[otherRegionId as RegionId];
              const check = canEstablishRoute(route, resources, reputation);
              const routeKey = [route.from, route.to].sort().join('-');
              const routeName = TRADE_ROUTE_NAMES[routeKey];
              return (
                <div key={route.id} className="mb-1 flex items-center justify-between rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-800 card-hover">
                  <div>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {'\u2192'} {otherRegion?.name || otherRegionId}
                    </span>
                    {routeName && (
                      <p className="text-[9px] italic text-zinc-400">{routeName}</p>
                    )}
                    {route.established && route.profitPerTurn && (
                      <div className="flex gap-1 mt-0.5">
                        {Object.entries(route.profitPerTurn).map(([k, v]) => (
                          <span key={k} className="text-[9px] text-green-600 dark:text-green-400">+{v} {k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {route.established ? (
                    <span className="text-xs font-semibold text-green-500">{'\u2705'} Active</span>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => establishRoute(route.id)}
                      disabled={!check.canEstablish}
                      className={'rounded-full px-2 py-0.5 text-[10px] font-semibold transition ' +
                        (check.canEstablish
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700')
                      }
                    >
                      {check.canEstablish ? 'Establish' : 'Locked'}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Discover New Regions — only when caravan is here */}
        {isCaravanHere && adjacentUndiscovered.length > 0 && (
          <div className="mb-2">
            <h4 className="mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">{'\uD83E\uDDED'} Discover New Regions</h4>
            <div className="space-y-2">
              {adjacentUndiscovered.map((id) => {
                const targetRegion = regions[id];
                const discovery = targetRegion?.discoveryRequirements;
                const isBeingScouted = scoutingMissions.some(
                  (m) => m.targetRegion === id && m.status === 'in-progress'
                );
                const hasScouts = availableScouts.length > 0;
                const mapGoldCost = discovery?.mapCost?.gold || 50;
                const canAffordMap = resources.gold >= mapGoldCost;
                const meetsReputation = discovery?.reputationUnlock
                  ? reputation[discovery.reputationUnlock.factionId] >= discovery.reputationUnlock.minimum
                  : false;

                return (
                  <div
                    key={id}
                    className="rounded-lg border border-purple-200/50 bg-purple-50/50 p-2 dark:border-purple-800/50 dark:bg-purple-900/20"
                  >
                    <p className="mb-1.5 text-xs font-bold text-purple-900 dark:text-purple-200">
                      {'\u2753'} {targetRegion?.name || id}
                    </p>

                    {isBeingScouted ? (
                      <p className="text-[10px] text-blue-600 dark:text-blue-400">
                        {'\uD83D\uDD2D'} Scout mission in progress...
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {/* Send Scout */}
                        <motion.button
                          whileTap={hasScouts ? { scale: 0.95 } : undefined}
                          onClick={() => showMessage(sendScout(id))}
                          disabled={!hasScouts}
                          className={'rounded-full px-2 py-1 text-[10px] font-semibold transition ' +
                            (hasScouts
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700')
                          }
                        >
                          {'\uD83D\uDD2D'} Send Scout ({availableScouts.length})
                        </motion.button>

                        {/* Buy Map */}
                        <motion.button
                          whileTap={canAffordMap ? { scale: 0.95 } : undefined}
                          onClick={() => showMessage(buyMap(id))}
                          disabled={!canAffordMap}
                          className={'rounded-full px-2 py-1 text-[10px] font-semibold transition ' +
                            (canAffordMap
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700')
                          }
                        >
                          {'\uD83D\uDDFA\uFE0F'} Buy Map ({mapGoldCost}g)
                        </motion.button>

                        {/* Reputation unlock */}
                        {discovery?.reputationUnlock && meetsReputation && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => discoverRegion(id)}
                            className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-600"
                          >
                            {'\u2705'} Known to Allies
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Requirements hint */}
                    {discovery?.reputationUnlock && !meetsReputation && (
                      <p className="mt-1 text-[10px] text-purple-500">
                        {'\uD83D\uDD12'} Need {discovery.reputationUnlock.minimum} rep with{' '}
                        {FACTIONS[discovery.reputationUnlock.factionId]?.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Trade Summary
// ============================================================

function TradeSummary() {
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const established = getEstablishedRoutes(tradeRoutes);
  const totalProfit = getTotalProfitPerTurn(tradeRoutes);

  if (established.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-green-200/50 bg-green-50/50 p-3 dark:border-green-800/30 dark:bg-green-900/10">
      <h4 className="mb-1 text-xs font-bold text-green-800 dark:text-green-400">
        {'\uD83D\uDCCA'} Active Trade Routes: {established.length}
      </h4>
      {Object.keys(totalProfit).length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-green-600 dark:text-green-400">Earning per turn:</span>
          {Object.entries(totalProfit).map(([key, val]) => (
            <span key={key} className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              +{val} {key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Victory Progress Panel
// ============================================================

function VictoryProgress() {
  const getVictoryConditions = useGameStore((s) => s.getVictoryConditions);
  const conditions = getVictoryConditions();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border-2 border-amber-200/50 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 dark:border-amber-800/30 dark:from-amber-900/10 dark:to-yellow-900/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">
          🏆 Victory Goals
        </h4>
        <div className="flex items-center gap-2">
          {/* Quick completion indicator */}
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
            {conditions.filter(c => c.completed).length}/{conditions.length} complete
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            {expanded ? '▲ Hide' : '▼ Show'}
          </span>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-2 space-y-2"
        >
          <p className="text-[10px] text-amber-600 dark:text-amber-400/70">
            Win by completing any one of these goals!
          </p>
          {conditions.map((cond) => {
            const pct = Math.min(100, Math.round((cond.current / cond.target) * 100));
            return (
              <div key={cond.id} className="rounded-lg bg-white/60 p-2 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {cond.emoji} {cond.title}
                  </span>
                  <span className={`text-[10px] font-bold ${cond.completed ? 'text-green-600' : 'text-zinc-400'}`}>
                    {cond.current}/{cond.target} {cond.completed ? '✅' : `(${pct}%)`}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mb-1">{cond.description}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${cond.completed ? 'bg-green-500' : 'bg-amber-400'}`}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Suggested Actions Panel
// ============================================================

function SuggestedActions() {
  const resources = useGameStore((s) => s.resources);
  const regions = useGameStore((s) => s.regions);
  const caravan = useGameStore((s) => s.caravan);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const personnel = useGameStore((s) => s.personnel);
  const reputation = useGameStore((s) => s.reputation);
  const selectRegion = useGameStore((s) => s.selectRegion);
  const turn = useGameStore((s) => s.turn);

  const suggestions: { icon: string; text: string; priority: 'high' | 'medium' | 'low'; action?: () => void }[] = [];

  // Low resources warnings with actionable advice
  const currentRegion = regions[caravan.currentRegion];

  if (resources.food <= 10) {
    const foodRegion = Object.values(regions).find(
      (r) => r.discovered && r.marketplace.some((m) => m.action === 'sell' && m.resourceType === 'food')
    );
    suggestions.push({
      icon: '🍞',
      text: foodRegion
        ? `⚠️ Food critical! ${foodRegion.name} sells food.`
        : 'Food is critically low! Gather food immediately!',
      priority: 'high',
      action: foodRegion ? () => selectRegion(foodRegion.id) : undefined,
    });
  } else if (resources.food <= 20) {
    suggestions.push({
      icon: '🍞',
      text: 'Food is getting low. Consider buying or gathering soon.',
      priority: 'medium',
    });
  }

  if (resources.water <= 8) {
    suggestions.push({
      icon: '💧',
      text: '⚠️ Water critical! Your crew needs water each turn.',
      priority: 'high',
    });
  } else if (resources.water <= 15) {
    suggestions.push({
      icon: '💧',
      text: 'Water running low. Buy water or travel to a coastal region.',
      priority: 'medium',
    });
  }

  if (resources.fuel <= 10) {
    suggestions.push({
      icon: '⛽',
      text: '⚠️ Fuel critical! You\'re nearly stranded. Buy fuel NOW!',
      priority: 'high',
    });
  } else if (resources.fuel <= 20) {
    suggestions.push({
      icon: '⛽',
      text: 'Fuel getting low. Stock up before traveling far.',
      priority: 'medium',
    });
  }

  // No trade routes established
  if (tradeRoutes.every((r) => !r.established)) {
    suggestions.push({
      icon: '📊',
      text: 'No trade routes! Establish one for steady income each turn.',
      priority: 'medium',
    });
  }

  // Hostile faction warning
  const hostileFactions = Object.entries(reputation).filter(([, v]) => v <= -30);
  if (hostileFactions.length > 0) {
    suggestions.push({
      icon: '😡',
      text: `You're hostile with ${hostileFactions.length} faction(s). Complete missions or trade to improve relations.`,
      priority: 'medium',
    });
  }

  // No scouts hired
  if (personnel.filter((p) => p.role === 'scout').length === 0) {
    const undiscovered = Object.values(regions).filter((r) => !r.discovered);
    if (undiscovered.length > 0) {
      suggestions.push({
        icon: '🔭',
        text: `${undiscovered.length} regions undiscovered. Hire a scout or buy maps to explore!`,
        priority: 'low',
      });
    }
  }

  // Almost at a victory condition
  if (resources.gold >= 1500) {
    suggestions.push({
      icon: '👑',
      text: `You're at ${resources.gold}/2000 gold! Wealth Victory is within reach!`,
      priority: 'low',
    });
  }

  const alliedCount = Object.entries(reputation).filter(([, v]) => v >= 60).length;
  if (alliedCount === 2) {
    suggestions.push({
      icon: '🤝',
      text: 'Two factions allied! One more ally unlocks Diplomacy Victory!',
      priority: 'low',
    });
  }

  // Price comparison hint
  if (currentRegion) {
    const sellItems = currentRegion.marketplace.filter((m) => m.action === 'buy');
    const bestSell = sellItems.reduce<{ type: string; price: number } | null>((best, item) => {
      const price = Math.round(item.basePrice * item.priceModifier);
      if (!best || price > best.price) return { type: item.resourceType, price };
      return best;
    }, null);
    if (bestSell && resources[bestSell.type as keyof typeof resources] > 10) {
      suggestions.push({
        icon: '💡',
        text: `Tip: ${currentRegion.name} buys ${bestSell.type} at ${bestSell.price}g each. You have ${resources[bestSell.type as keyof typeof resources]}!`,
        priority: 'low',
      });
    }
  }

  // Seasonal tips
  const season = turn > 0 ? (['spring', 'summer', 'autumn', 'winter'] as const)[Math.floor(((turn - 1) / 8) % 4)] : 'spring';
  if (season === 'winter' && resources.fuel < 30) {
    suggestions.push({
      icon: '❄️',
      text: 'Winter increases fuel demand! Stock up to avoid shortages.',
      priority: 'medium',
    });
  }
  if (season === 'autumn' && resources.food > 50) {
    suggestions.push({
      icon: '🍂',
      text: 'Autumn boosts food prices! Great time to sell excess food.',
      priority: 'low',
    });
  }

  if (suggestions.length === 0) return null;

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="rounded-xl border-2 border-blue-200/50 bg-blue-50/50 p-3 dark:border-blue-800/30 dark:bg-blue-900/10">
      <h4 className="mb-2 text-xs font-bold text-blue-800 dark:text-blue-400">
        💡 Suggested Actions
      </h4>
      <div className="space-y-1.5">
        {suggestions.slice(0, 5).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
              s.priority === 'high'
                ? 'bg-red-50 border border-red-200/50 dark:bg-red-900/10 dark:border-red-800/30'
                : s.action ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20' : ''
            }`}
            onClick={s.action}
          >
            <span className="text-sm">{s.icon}</span>
            <span className={`${
              s.priority === 'high' ? 'text-red-700 font-semibold dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
            }`}>
              {s.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main World Panel
// ============================================================

export default function WorldPanel() {
  const selectedRegion = useGameStore((s) => s.selectedRegion);

  return (
    <div className="flex h-full flex-col">
      {/* Map */}
      <div className="relative flex-1">
        <MapCanvas />
      </div>

      {/* Bottom section */}
      <div className="max-h-[50vh] overflow-auto p-3 space-y-3">
        <CaravanStatusBar />
        {selectedRegion ? (
          <RegionDetailPanel />
        ) : (
          <div className="space-y-3">
            <TradeSummary />
            <VictoryProgress />
            <SuggestedActions />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4 text-center dark:from-indigo-900/20 dark:to-purple-900/20"
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1], y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-1 block text-3xl"
              >
                🗺️
              </motion.span>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Tap a region on the map to explore!</p>
              <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400/70">
                Travel with your caravan, trade at marketplaces, and discover new lands.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
