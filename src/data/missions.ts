// ============================================================
// Static Game Data — Missions (faction-based objectives)
// ============================================================
import type { Mission } from '@/engine/types';

/**
 * Mission templates that are generated and offered to the player.
 * Each faction has multiple missions at varying difficulties.
 */
export const MISSION_TEMPLATES: Omit<Mission, 'id' | 'status' | 'acceptedOnTurn'>[] = [
  // === MUGHAL COURT ===
  {
    factionId: 'mughal-court',
    type: 'gather',
    title: 'Pay Your Dues',
    description: 'Grand Vizier Mirza demands tribute. Accumulate enough gold to please the Peacock Throne.',
    emoji: '💰',
    objectives: [
      { id: 'obj-1', description: 'Have 300+ gold', type: 'gather-resource', target: 'gold', amount: 300, current: 0, completed: false },
    ],
    rewards: { resources: { information: 10 }, reputation: { 'mughal-court': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'mughal-court',
    type: 'trade',
    title: 'Imperial Commerce',
    description: 'Establish a trade route through Delhi to earn the Mughal Court\'s favor.',
    emoji: '🏰',
    objectives: [
      { id: 'obj-1', description: 'Establish a trade route from Delhi', type: 'establish-route', target: 'delhi', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 80, information: 10 }, reputation: { 'mughal-court': 22 } },
    turnLimit: 15,
    difficulty: 'medium',
  },
  {
    factionId: 'mughal-court',
    type: 'reputation',
    title: 'Friend of the Emperor',
    description: 'Earn allied status with the Mughal Court to unlock the imperial treasury.',
    emoji: '👑',
    objectives: [
      { id: 'obj-1', description: 'Reach 40+ reputation with Mughal Court', type: 'reach-reputation', target: 'mughal-court', amount: 40, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 120, information: 15 }, reputation: { 'mughal-court': 15 } },
    turnLimit: 25,
    difficulty: 'hard',
  },

  // === EAST INDIA COMPANY ===
  {
    factionId: 'east-india-company',
    type: 'gather',
    title: 'Supply the Fleet',
    description: 'Governor Whitfield\'s fleet needs food supplies. Gather food to feed the Company ships!',
    emoji: '🍞',
    objectives: [
      { id: 'obj-1', description: 'Have 70+ food', type: 'gather-resource', target: 'food', amount: 70, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 35, water: 15 }, reputation: { 'east-india-company': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'east-india-company',
    type: 'explore',
    title: 'Chart New Markets',
    description: 'The Company wants you to explore new territories connected to their trade network.',
    emoji: '🗺️',
    objectives: [
      { id: 'obj-1', description: 'Discover a new region adjacent to Kolkata', type: 'discover-region', target: 'kolkata', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 50, food: 20 }, reputation: { 'east-india-company': 18 } },
    turnLimit: 10,
    difficulty: 'medium',
  },
  {
    factionId: 'east-india-company',
    type: 'delivery',
    title: 'Water for the Presidencies',
    description: 'Deliver water to drought-stricken Company outposts across India.',
    emoji: '💧',
    objectives: [
      { id: 'obj-1', description: 'Have 100+ water', type: 'gather-resource', target: 'water', amount: 100, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 70 }, reputation: { 'east-india-company': 22 } },
    turnLimit: 15,
    difficulty: 'hard',
  },

  // === RAJPUT CLANS ===
  {
    factionId: 'rajput-clans',
    type: 'explore',
    title: 'Desert Discovery',
    description: 'Maharawal Singh wants to map new territories. Discover Jaisalmer!',
    emoji: '🏜️',
    objectives: [
      { id: 'obj-1', description: 'Discover Jaisalmer', type: 'discover-region', target: 'jaisalmer', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { fuel: 30, gold: 25 }, reputation: { 'rajput-clans': 15 } },
    turnLimit: 6,
    difficulty: 'easy',
  },
  {
    factionId: 'rajput-clans',
    type: 'gather',
    title: 'Oasis Resupply',
    description: 'The desert caravans need water desperately. Help the Rajputs find water sources.',
    emoji: '🌴',
    objectives: [
      { id: 'obj-1', description: 'Have 60+ water', type: 'gather-resource', target: 'water', amount: 60, current: 0, completed: false },
    ],
    rewards: { resources: { fuel: 25, gold: 40 }, reputation: { 'rajput-clans': 18 } },
    turnLimit: 10,
    difficulty: 'medium',
  },
  {
    factionId: 'rajput-clans',
    type: 'gather',
    title: 'Fuel the Caravans',
    description: 'Maharawal Singh needs fuel to keep the desert camel caravans moving. Gather fuel!',
    emoji: '⛽',
    objectives: [
      { id: 'obj-1', description: 'Have 80+ fuel', type: 'gather-resource', target: 'fuel', amount: 80, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 40 }, reputation: { 'rajput-clans': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },

  // === BRAHMIN COUNCIL ===
  {
    factionId: 'brahmin-council',
    type: 'gather',
    title: 'Temple Harvest',
    description: 'Pandit Devashri needs food gathered sustainably for the temple festivals.',
    emoji: '🌿',
    objectives: [
      { id: 'obj-1', description: 'Have 90+ food', type: 'gather-resource', target: 'food', amount: 90, current: 0, completed: false },
    ],
    rewards: { resources: { water: 25, gold: 30 }, reputation: { 'brahmin-council': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'brahmin-council',
    type: 'explore',
    title: 'Find the Sacred City',
    description: 'The Council wants allies who know the ancient ways. Discover Varanasi.',
    emoji: '🕉️',
    objectives: [
      { id: 'obj-1', description: 'Discover Varanasi', type: 'discover-region', target: 'varanasi', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { food: 30, water: 20 }, reputation: { 'brahmin-council': 20 } },
    turnLimit: 10,
    difficulty: 'medium',
  },

  // === NIGHTMARKET SYNDICATE ===
  {
    factionId: 'nightmarket-syndicate',
    type: 'gather',
    title: 'Intel Wanted',
    description: 'Dalal Sahib is buying information. Gather intel from any source!',
    emoji: '🕵️',
    objectives: [
      { id: 'obj-1', description: 'Have 20+ information', type: 'gather-resource', target: 'information', amount: 20, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 50, contraband: 10 }, reputation: { 'nightmarket-syndicate': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'nightmarket-syndicate',
    type: 'explore',
    title: 'Discover the Black Market',
    description: 'Find the entrance to Bombay\'s legendary underground markets.',
    emoji: '🌃',
    objectives: [
      { id: 'obj-1', description: 'Discover Bombay', type: 'discover-region', target: 'bombay', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { contraband: 15, gold: 40 }, reputation: { 'nightmarket-syndicate': 18 } },
    turnLimit: 10,
    difficulty: 'medium',
  },

  // === NIZAM'S COURT ===
  {
    factionId: 'nizams-court',
    type: 'trade',
    title: 'The Golconda Route',
    description: 'The Nizam wants a trade route through Hyderabad. Establish it to prove your worth!',
    emoji: '💎',
    objectives: [
      { id: 'obj-1', description: 'Establish a trade route from Hyderabad', type: 'establish-route', target: 'hyderabad', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 60, fuel: 20 }, reputation: { 'nizams-court': 20 } },
    turnLimit: 12,
    difficulty: 'medium',
  },
  {
    factionId: 'nizams-court',
    type: 'reputation',
    title: 'Earn the Nizam\'s Trust',
    description: 'Prove your loyalty to the Nizam by reaching friendly status with the court.',
    emoji: '🤝',
    objectives: [
      { id: 'obj-1', description: 'Reach 30+ reputation with Nizam\'s Court', type: 'reach-reputation', target: 'nizams-court', amount: 30, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 80, fuel: 30 }, reputation: { 'nizams-court': 10 } },
    turnLimit: 20,
    difficulty: 'hard',
  },
];

/**
 * Default achievements for new games.
 */
export const DEFAULT_ACHIEVEMENTS = [
  { id: 'first-trade', title: 'First Deal!', description: 'Establish your first trade route', emoji: '🏪', unlocked: false },
  { id: 'explorer', title: 'Explorer', description: 'Discover all 6 regions', emoji: '🗺️', unlocked: false },
  { id: 'rich-trader', title: 'Rich Trader', description: 'Accumulate 1000 gold', emoji: '💰', unlocked: false },
  { id: 'diplomat', title: 'Diplomat', description: 'Become allied with any faction', emoji: '🤝', unlocked: false },
  { id: 'gatherer', title: 'Gatherer', description: 'Successfully gather resources 10 times', emoji: '⛏️', unlocked: false },
  { id: 'survivor', title: 'Survivor', description: 'Survive 20 turns', emoji: '🏆', unlocked: false },
  { id: 'mission-complete', title: 'Mission Complete', description: 'Complete your first mission', emoji: '✅', unlocked: false },
  { id: 'five-missions', title: 'Veteran Trader', description: 'Complete 5 missions', emoji: '⭐', unlocked: false },
  { id: 'all-routes', title: 'Trade Empire', description: 'Establish 5 trade routes', emoji: '🌐', unlocked: false },
  { id: 'weather-master', title: 'Storm Rider', description: 'Survive a catastrophic event', emoji: '🌪️', unlocked: false },
  { id: 'full-resources', title: 'Stockpile', description: 'Have 100+ of fuel, water, food, and gold at once', emoji: '📦', unlocked: false },
  { id: 'npc-friend', title: 'NPC Friend', description: 'Reach friendly status with 3 factions', emoji: '😊', unlocked: false },
];
