// ============================================================
// Static Game Data — Trade Routes
// ============================================================
import type { TradeRoute } from '@/engine/types';

export const INITIAL_TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'route-delhi-kolkata',
    from: 'delhi',
    to: 'kolkata',
    established: false,
    costToEstablish: { gold: 100, fuel: 20 },
    requiredReputation: [
      { factionId: 'mughal-court', minimum: 10 },
      { factionId: 'east-india-company', minimum: 10 },
    ],
    profitPerTurn: { gold: 15, food: 5 },
  },
  {
    id: 'route-delhi-jaisalmer',
    from: 'delhi',
    to: 'jaisalmer',
    established: false,
    costToEstablish: { gold: 150, water: 30 },
    requiredReputation: [
      { factionId: 'mughal-court', minimum: 5 },
      { factionId: 'rajput-clans', minimum: 20 },
    ],
    profitPerTurn: { fuel: 20, gold: 10 },
  },
  {
    id: 'route-delhi-hyderabad',
    from: 'delhi',
    to: 'hyderabad',
    established: false,
    costToEstablish: { gold: 80, fuel: 10 },
    requiredReputation: [
      { factionId: 'mughal-court', minimum: 0 },
      { factionId: 'nizams-court', minimum: 15 },
    ],
    profitPerTurn: { gold: 25 },
  },
  {
    id: 'route-kolkata-varanasi',
    from: 'kolkata',
    to: 'varanasi',
    established: false,
    costToEstablish: { gold: 120, food: 15 },
    requiredReputation: [
      { factionId: 'east-india-company', minimum: 15 },
      { factionId: 'brahmin-council', minimum: 25 },
    ],
    profitPerTurn: { food: 15, water: 10 },
  },
  {
    id: 'route-kolkata-bombay',
    from: 'kolkata',
    to: 'bombay',
    established: false,
    costToEstablish: { gold: 200, contraband: 10 },
    requiredReputation: [
      { factionId: 'east-india-company', minimum: 5 },
      { factionId: 'nightmarket-syndicate', minimum: 10 },
    ],
    profitPerTurn: { gold: 30, information: 5 },
  },
  {
    id: 'route-jaisalmer-bombay',
    from: 'jaisalmer',
    to: 'bombay',
    established: false,
    costToEstablish: { gold: 180, fuel: 25 },
    requiredReputation: [
      { factionId: 'rajput-clans', minimum: 15 },
      { factionId: 'nightmarket-syndicate', minimum: 15 },
    ],
    profitPerTurn: { contraband: 10, fuel: 10 },
  },
  {
    id: 'route-jaisalmer-hyderabad',
    from: 'jaisalmer',
    to: 'hyderabad',
    established: false,
    costToEstablish: { gold: 160, water: 20, fuel: 15 },
    requiredReputation: [
      { factionId: 'rajput-clans', minimum: 10 },
      { factionId: 'nizams-court', minimum: 20 },
    ],
    profitPerTurn: { gold: 20, fuel: 8 },
  },
  {
    id: 'route-varanasi-bombay',
    from: 'varanasi',
    to: 'bombay',
    established: false,
    costToEstablish: { gold: 250, food: 20 },
    requiredReputation: [
      { factionId: 'brahmin-council', minimum: 30 },
      { factionId: 'nightmarket-syndicate', minimum: 20 },
    ],
    profitPerTurn: { contraband: 15, food: 10 },
  },
  {
    id: 'route-varanasi-hyderabad',
    from: 'varanasi',
    to: 'hyderabad',
    established: false,
    costToEstablish: { gold: 140, food: 25 },
    requiredReputation: [
      { factionId: 'brahmin-council', minimum: 20 },
      { factionId: 'nizams-court', minimum: 10 },
    ],
    profitPerTurn: { food: 12, gold: 18 },
  },
];
