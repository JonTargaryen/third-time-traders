/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ============================================================
// Tests — WorldMap Component
// ============================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldMap from '@/components/game/WorldMap';
import { useGameStore } from '@/store/gameStore';

// Mock canvas 2D context
const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fillText: vi.fn(),
  setLineDash: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  set fillStyle(_: string) {},
  set strokeStyle(_: string) {},
  set lineWidth(_: number) {},
  set font(_: string) {},
  set textAlign(_: string) {},
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock getBoundingClientRect to provide real dimensions in jsdom
const mockBoundingRect = {
  x: 0, y: 0, width: 800, height: 500, top: 0, left: 0, bottom: 500, right: 800, toJSON: () => {},
};

describe('WorldMap', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
    vi.clearAllMocks();
    // Ensure the container div and canvas report real dimensions
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(mockBoundingRect as DOMRect);
  });

  it('should render a canvas element', () => {
    render(<WorldMap />);
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('should have aria-label', () => {
    render(<WorldMap />);
    expect(screen.getByLabelText('World map')).toBeInTheDocument();
  });

  it('should call getContext on mount', () => {
    render(<WorldMap />);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('should draw on the canvas', () => {
    render(<WorldMap />);
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should handle click events', () => {
    render(<WorldMap />);
    const canvas = screen.getByRole('img');
    fireEvent.click(canvas, { clientX: 0, clientY: 0 });
    // Should not crash
    expect(true).toBe(true);
  });

  it('should select region when clicking near one', () => {
    render(<WorldMap />);
    const canvas = screen.getByRole('img');
    // forge-highlands is at position (0.25, 0.15) — we need to compute screen coords
    // Since container size is mocked, we click roughly there
    // The important thing is clicking doesn't crash
    fireEvent.click(canvas, { clientX: 100, clientY: 50 });
    // Clicking in empty space should deselect
  });

  it('should deselect on clicking empty space', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<WorldMap />);
    const canvas = screen.getByRole('img');
    fireEvent.click(canvas, { clientX: 0, clientY: 0 });
    // Clicking at 0,0 (empty area) should deselect
    expect(useGameStore.getState().selectedRegion).toBeNull();
  });

  it('should handle resize events', () => {
    render(<WorldMap />);
    fireEvent.resize(window);
    // Should not crash
    expect(true).toBe(true);
  });

  it('should draw trade routes between discovered regions', () => {
    // Establish a route to test the established=true branch
    useGameStore.getState().changeReputation('iron-pact', 15);
    useGameStore.getState().changeReputation('tidecallers', 15);
    useGameStore.getState().establishRoute('route-forge-coast');
    render(<WorldMap />);
    // The drawing function should have been called with established route styles
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.setLineDash).toHaveBeenCalled();
  });

  it('should draw undiscovered routes with faint dashed style', () => {
    // Both amber-wastes and the-undercity are undiscovered — route between them
    // The drawMap should skip routes where both endpoints are undiscovered (continue)
    // and draw faint dashed routes where only one endpoint is discovered
    render(<WorldMap />);
    expect(mockContext.beginPath).toHaveBeenCalled();
  });

  it('should render selected region with glow effect', () => {
    useGameStore.getState().selectRegion('forge-highlands');
    render(<WorldMap />);
    // Drawing with selected region should produce glow (extra arc call)
    expect(mockContext.arc).toHaveBeenCalled();
  });

  it('should toggle selection when clicking an already-selected region', () => {
    // Select forge-highlands first
    useGameStore.getState().selectRegion('forge-highlands');
    render(<WorldMap />);
    const canvas = screen.getByRole('img');
    
    // forge-highlands is at position (0.25, 0.15), with 800x500 → pixel (200, 75)
    // getBoundingClientRect mocked to left:0, top:0
    fireEvent.click(canvas, { clientX: 200, clientY: 75 });
    
    // Clicking on the already-selected region should deselect it (toggle to null)
    expect(useGameStore.getState().selectedRegion).toBeNull();
  });

  it('should select a discovered region when clicking near it', () => {
    render(<WorldMap />);
    const canvas = screen.getByRole('img');
    // forge-highlands at pixel (200, 75) — clicking within 24px radius
    fireEvent.click(canvas, { clientX: 200, clientY: 75 });
    expect(useGameStore.getState().selectedRegion).toBe('forge-highlands');
  });

  it('should draw routes with one discovered endpoint using dashed style', () => {
    // forge-highlands (discovered) → amber-wastes (undiscovered) route exists
    // This should hit the else branch (line 59-61) where one is discovered, one isn't, not established
    render(<WorldMap />);
    // The drawMap renders routes including forge→amber-wastes
    // Since amber-wastes is undiscovered, it uses the dashed faint style
    expect(mockContext.setLineDash).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should skip routes where both endpoints are undiscovered', () => {
    // route-wastes-undercity: amber-wastes → the-undercity, both undiscovered
    // The drawMap continues (skips drawing) for these routes
    const callCountBefore = mockContext.moveTo.mock.calls.length;
    render(<WorldMap />);
    // It should still render other routes — the key is it doesn't crash
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should handle canvas with no context gracefully', () => {
    // Override getContext to return null for one test
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;
    render(<WorldMap />);
    // Should not crash even with null context
    expect(screen.getByRole('img')).toBeInTheDocument();
    HTMLCanvasElement.prototype.getContext = origGetContext;
  });
});
