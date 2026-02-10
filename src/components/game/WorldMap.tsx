// ============================================================
// Game Component — World Map (Canvas-based, MVP)
// ============================================================
'use client';

import { useGameStore } from '@/store/gameStore';
import { useCallback, useRef, useEffect, useState } from 'react';
import type { RegionId, Region, TradeRoute } from '@/engine/types';
import { FACTIONS } from '@/data/factions';

// For MVP, we use a canvas-based map instead of Pixi.js
// This keeps the bundle small and the map functional

function drawMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  regions: Record<RegionId, Region>,
  tradeRoutes: TradeRoute[],
  selectedRegion: RegionId | null,
) {
  ctx.clearRect(0, 0, width, height);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0c1222');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Draw grid (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
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
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // blue
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else if (from.discovered && to.discovered) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
    const radius = isSelected ? 24 : 18;

    if (!region.discovered) {
      // Undiscovered: faint circle with question mark
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❓', x, y);
      ctx.textBaseline = 'alphabetic';
      continue;
    }

    // Glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = `${faction?.color || '#fff'}33`;
      ctx.fill();
    }

    // Node background
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = faction?.color || '#666';
    ctx.fill();

    // Border
    ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.stroke();

    // Region emoji inside the node
    ctx.font = `${isSelected ? '22' : '18'}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(region.icon, x, y);
    ctx.textBaseline = 'alphabetic';

    // Label below node
    ctx.fillStyle = '#fff';
    ctx.font = `${isSelected ? 'bold ' : ''}11px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(region.name, x, y + radius + 16);
  }
}

export default function WorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const regions = useGameStore((s) => s.regions);
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const selectedRegion = useGameStore((s) => s.selectedRegion);
  const selectRegion = useGameStore((s) => s.selectRegion);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: Math.max(300, rect.height) });
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

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    drawMap(ctx, dimensions.width, dimensions.height, regions, tradeRoutes, selectedRegion);
  }, [regions, tradeRoutes, selectedRegion, dimensions]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find clicked region
      const regionArr = Object.values(regions);
      for (const region of regionArr) {
        if (!region.discovered) continue;
        const rx = region.position.x * dimensions.width;
        const ry = region.position.y * dimensions.height;
        const dist = Math.sqrt((clickX - rx) ** 2 + (clickY - ry) ** 2);
        if (dist < 24) {
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
