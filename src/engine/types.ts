// ============================================================
// Third Time Traders — Core Type Definitions
// ============================================================

export type ResourceType = 'fuel' | 'water' | 'food' | 'gold' | 'contraband' | 'information';

export interface Resources {
  fuel: number;
  water: number;
  food: number;
  gold: number;
  contraband: number;
  information: number;
}

export type FactionId =
  | 'iron-pact'
  | 'tidecallers'
  | 'dustwalkers'
  | 'verdant-commune'
  | 'nightmarket-syndicate'
  | 'ashen-throne';

export type RegionId =
  | 'forge-highlands'
  | 'shattered-coast'
  | 'amber-wastes'
  | 'emerald-canopy'
  | 'the-undercity'
  | 'obsidian-citadel';

export interface Faction {
  id: FactionId;
  name: string;
  description: string;
  regionId: RegionId;
  primaryResource: ResourceType;
  color: string;
  brightColor: string; // kid-friendly bright color
  hostilityThreshold: number;
  allyThreshold: number;
  npc: FactionNPC;
  reputationTips: string[]; // how to gain reputation
}

export interface FactionNPC {
  name: string;
  title: string;
  emoji: string;
  greeting: string;
  personality: string;
}

export interface Region {
  id: RegionId;
  name: string;
  description: string;
  lore: string; // extended world lore
  icon: string;
  factionId: FactionId;
  position: { x: number; y: number };
  resources: Partial<Resources>;
  discovered: boolean;
  adjacentRegions: RegionId[];
  gatherActions: GatherAction[];
  // New: Marketplace for buying/selling
  marketplace: MarketplaceItem[];
  // New: Discovery requirements
  discoveryRequirements: DiscoveryRequirement;
}

// New: How to discover a region
export interface DiscoveryRequirement {
  // Option 1: Send a scout (costs turns, can fail)
  scoutCost: { turns: number; successChance: number };
  // Option 2: Buy a map (costs gold/information)
  mapCost: Partial<Resources>;
  // Option 3: Reputation unlock (high rep with adjacent faction)
  reputationUnlock?: { factionId: FactionId; minimum: number };
  // Minimum gold to attempt any discovery
  minimumGold: number;
}

// New: Marketplace item for buying/selling at each region
export interface MarketplaceItem {
  resourceType: ResourceType;
  action: 'buy' | 'sell';
  basePrice: number; // gold cost/reward per unit
  available: number; // units available this turn (-1 for unlimited)
  priceModifier: number; // current modifier (events, supply/demand)
}

export interface GatherAction {
  id: string;
  name: string;
  emoji: string;
  description: string;
  resourceReward: Partial<Resources>;
  cooldownTurns: number;
  successChance: number; // 0-1
  requiredReputation?: { factionId: FactionId; minimum: number };
}

export interface TradeRoute {
  id: string;
  from: RegionId;
  to: RegionId;
  established: boolean;
  costToEstablish: Partial<Resources>;
  requiredReputation: { factionId: FactionId; minimum: number }[];
  profitPerTurn: Partial<Resources>;
}

export interface Personnel {
  id: string;
  name: string;
  role: 'guard' | 'negotiator' | 'scout';
  skill: number;
  assignedRoute: string | null;
  assignedMission: string | null; // New: scouts can be sent on discovery missions
  status: 'available' | 'assigned' | 'scouting' | 'injured' | 'dead';
  // New: For scouts on discovery missions
  scoutingRegion?: RegionId;
  scoutingReturnTurn?: number;
}

// ============================================================
// Missions System
// ============================================================

export type MissionType = 'delivery' | 'gather' | 'reputation' | 'explore' | 'trade';
export type MissionStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';

export interface Mission {
  id: string;
  factionId: FactionId;
  type: MissionType;
  title: string;
  description: string;
  emoji: string;
  objectives: MissionObjective[];
  rewards: {
    resources: Partial<Resources>;
    reputation: Partial<Record<FactionId, number>>;
  };
  turnLimit: number; // turns to complete
  acceptedOnTurn?: number;
  status: MissionStatus;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MissionObjective {
  id: string;
  description: string;
  type: 'gather-resource' | 'reach-reputation' | 'discover-region' | 'establish-route' | 'deliver-resource';
  target: string; // resource type, region id, faction id, etc.
  amount: number;
  current: number;
  completed: boolean;
}

// ============================================================
// Achievements
// ============================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedOnTurn?: number;
  unlocked: boolean;
}

// ============================================================
// Action Log (for IndexedDB persistence)
// ============================================================

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  turn: number;
  action: string;
  details: string;
  category: 'trade' | 'explore' | 'gather' | 'mission' | 'event' | 'reputation' | 'personnel' | 'system';
}

export type ReputationMap = Record<FactionId, number>;

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export const REPUTATION_MIN = -100;
export const REPUTATION_MAX = 100;
export const STARTING_GOLD = 500;
export const STARTING_FUEL = 100;
export const STARTING_WATER = 100;
export const STARTING_FOOD = 100;

export const ALL_RESOURCE_TYPES: ResourceType[] = [
  'fuel', 'water', 'food', 'gold', 'contraband', 'information',
];

export const ALL_FACTION_IDS: FactionId[] = [
  'iron-pact', 'tidecallers', 'dustwalkers',
  'verdant-commune', 'nightmarket-syndicate', 'ashen-throne',
];

export const ALL_REGION_IDS: RegionId[] = [
  'forge-highlands', 'shattered-coast', 'amber-wastes',
  'emerald-canopy', 'the-undercity', 'obsidian-citadel',
];

// ============================================================
// Seasonal Cycle
// ============================================================

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const TURNS_PER_SEASON = 8;

export function getSeason(turn: number): Season {
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
  return seasons[Math.floor(((turn - 1) / TURNS_PER_SEASON) % 4)];
}

export function getSeasonIcon(season: Season): string {
  const icons: Record<Season, string> = {
    spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️',
  };
  return icons[season];
}

export function getSeasonColor(season: Season): string {
  const colors: Record<Season, string> = {
    spring: 'text-emerald-500', summer: 'text-amber-500', autumn: 'text-orange-500', winter: 'text-blue-400',
  };
  return colors[season];
}

// ============================================================
// Events System
// ============================================================

export type EventCategory =
  | 'natural-disaster'
  | 'market-shift'
  | 'faction-conflict'
  | 'faction-alliance'
  | 'pirate-raid'
  | 'discovery'
  | 'plague'
  | 'festival'
  | 'smuggling'
  | 'diplomatic';

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  resourceCost: Partial<Resources>;
  resourceReward: Partial<Resources>;
  reputationDelta: Partial<Record<FactionId, number>>;
  successChance: number;
  successText: string;
  failureText: string;
}

export interface GameEvent {
  id: string;
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  description: string;
  turn: number;
  affectedRegions: RegionId[];
  affectedFactions: FactionId[];
  resourceDelta: Partial<Resources>;
  reputationDelta: Partial<Record<FactionId, number>>;
  tradeMultiplier: number;
  duration: number;
  expiresOnTurn: number;
  dismissed: boolean;
  choices?: EventChoice[];
  choiceMade?: string | null;
  outcomeText?: string;
}

// ============================================================
// Faction Relations (faction-to-faction)
// ============================================================

export type FactionRelation = 'war' | 'hostile' | 'tense' | 'neutral' | 'friendly' | 'allied';

export type FactionRelationMap = Record<FactionId, Record<FactionId, FactionRelation>>;

// ============================================================
// Market Prices (dynamic pricing per region)
// ============================================================

export interface MarketPrices {
  prices: Record<RegionId, Partial<Record<ResourceType, number>>>;
}

// ============================================================
// Player Profile & Leaderboard
// ============================================================

export interface PlayerProfile {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  turn: number;
  gold: number;
  totalResources: number;
  routesEstablished: number;
  regionsDiscovered: number;
  alliedFactions: number;
  score: number;
  updatedAt: number;
}

// ============================================================
// Extended Game State
// ============================================================

export type GameTab = 'world' | 'reputation' | 'inventory' | 'events' | 'leaderboard';

export interface GameState {
  phase: GamePhase;
  turn: number;
  resources: Resources;
  reputation: ReputationMap;
  regions: Record<RegionId, Region>;
  tradeRoutes: TradeRoute[];
  personnel: Personnel[];
  activeTab: GameTab;
  selectedRegion: RegionId | null;
  events: GameEvent[];
  eventLog: GameEvent[];
  factionRelations: FactionRelationMap;
  market: MarketPrices;
  player: PlayerProfile;
  pendingEventNotification: boolean;
  goldHistory: number[];
  gameOverReason?: string;
  victoryReason?: string;
  missions: Mission[];
  completedMissions: string[];
  achievements: Achievement[];
  gatherCooldowns: Record<string, number>; // actionId → turn when available
  actionLog: ActionLogEntry[];
  // Caravan/travel state
  caravan: Caravan;
  // Regions being scouted
  scoutingMissions: ScoutingMission[];
  // Turn summary (shown after advancing)
  turnSummary: TurnSummary | null;
  // Show turn summary modal
  showTurnSummary: boolean;
}

// New: Caravan state (player's position and travel)
export interface Caravan {
  currentRegion: RegionId;
  fuelCapacity: number;
  cargoCapacity: number;
  speed: number; // affects fuel consumption
}

// New: Travel cost between regions
export interface TravelCost {
  fuel: number;
  turns: number;
  dangerLevel: 'safe' | 'risky' | 'dangerous';
}

// New: Scouting mission state
export interface ScoutingMission {
  id: string;
  personnelId: string;
  targetRegion: RegionId;
  startTurn: number;
  returnTurn: number;
  successChance: number;
  status: 'in-progress' | 'succeeded' | 'failed';
}

// ============================================================
// Turn Summary (shown after each turn)
// ============================================================

export interface TurnSummaryItem {
  icon: string;
  text: string;
  type: 'income' | 'upkeep' | 'trade' | 'event' | 'mission' | 'scout' | 'encounter' | 'season';
}

export interface TurnSummary {
  turn: number;
  season: Season;
  items: TurnSummaryItem[];
  netResources: Partial<Resources>;
}

// ============================================================
// Victory System
// ============================================================

export type VictoryType = 'wealth' | 'diplomacy' | 'empire' | 'explorer' | 'survivor';

export interface VictoryCondition {
  id: VictoryType;
  title: string;
  description: string;
  emoji: string;
  target: number;
  current: number;
  completed: boolean;
}

// ============================================================
// Travel Encounters
// ============================================================

export interface TravelEncounter {
  id: string;
  title: string;
  description: string;
  emoji: string;
  resourceDelta: Partial<Resources>;
  reputationDelta: Partial<Record<FactionId, number>>;
}
