// ============================================================
// Static Game Data — Trade Routes
// ============================================================
import type { TradeRoute } from '@/engine/types';

export const INITIAL_TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'route-forge-coast',
    from: 'forge-highlands',
    to: 'shattered-coast',
    established: false,
    costToEstablish: { gold: 100, fuel: 20 },
    requiredReputation: [
      { factionId: 'iron-pact', minimum: 10 },
      { factionId: 'tidecallers', minimum: 10 },
    ],
    profitPerTurn: { gold: 15, food: 5 },
  },
  {
    id: 'route-forge-wastes',
    from: 'forge-highlands',
    to: 'amber-wastes',
    established: false,
    costToEstablish: { gold: 150, water: 30 },
    requiredReputation: [
      { factionId: 'iron-pact', minimum: 5 },
      { factionId: 'dustwalkers', minimum: 20 },
    ],
    profitPerTurn: { fuel: 20, gold: 10 },
  },
  {
    id: 'route-forge-citadel',
    from: 'forge-highlands',
    to: 'obsidian-citadel',
    established: false,
    costToEstablish: { gold: 80, fuel: 10 },
    requiredReputation: [
      { factionId: 'iron-pact', minimum: 0 },
      { factionId: 'ashen-throne', minimum: 15 },
    ],
    profitPerTurn: { gold: 25 },
  },
  {
    id: 'route-coast-canopy',
    from: 'shattered-coast',
    to: 'emerald-canopy',
    established: false,
    costToEstablish: { gold: 120, food: 15 },
    requiredReputation: [
      { factionId: 'tidecallers', minimum: 15 },
      { factionId: 'verdant-commune', minimum: 25 },
    ],
    profitPerTurn: { food: 15, water: 10 },
  },
  {
    id: 'route-coast-undercity',
    from: 'shattered-coast',
    to: 'the-undercity',
    established: false,
    costToEstablish: { gold: 200, contraband: 10 },
    requiredReputation: [
      { factionId: 'tidecallers', minimum: 5 },
      { factionId: 'nightmarket-syndicate', minimum: 10 },
    ],
    profitPerTurn: { gold: 30, information: 5 },
  },
  {
    id: 'route-wastes-undercity',
    from: 'amber-wastes',
    to: 'the-undercity',
    established: false,
    costToEstablish: { gold: 180, fuel: 25 },
    requiredReputation: [
      { factionId: 'dustwalkers', minimum: 15 },
      { factionId: 'nightmarket-syndicate', minimum: 15 },
    ],
    profitPerTurn: { contraband: 10, fuel: 10 },
  },
  {
    id: 'route-wastes-citadel',
    from: 'amber-wastes',
    to: 'obsidian-citadel',
    established: false,
    costToEstablish: { gold: 160, water: 20, fuel: 15 },
    requiredReputation: [
      { factionId: 'dustwalkers', minimum: 10 },
      { factionId: 'ashen-throne', minimum: 20 },
    ],
    profitPerTurn: { gold: 20, fuel: 8 },
  },
  {
    id: 'route-canopy-undercity',
    from: 'emerald-canopy',
    to: 'the-undercity',
    established: false,
    costToEstablish: { gold: 250, food: 20 },
    requiredReputation: [
      { factionId: 'verdant-commune', minimum: 30 },
      { factionId: 'nightmarket-syndicate', minimum: 20 },
    ],
    profitPerTurn: { contraband: 15, food: 10 },
  },
  {
    id: 'route-canopy-citadel',
    from: 'emerald-canopy',
    to: 'obsidian-citadel',
    established: false,
    costToEstablish: { gold: 140, food: 25 },
    requiredReputation: [
      { factionId: 'verdant-commune', minimum: 20 },
      { factionId: 'ashen-throne', minimum: 10 },
    ],
    profitPerTurn: { food: 12, gold: 18 },
  },
];
