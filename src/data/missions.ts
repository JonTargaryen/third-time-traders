// ============================================================
// Static Game Data — Missions (faction-based objectives)
// ============================================================
import type { Mission } from '@/engine/types';

/**
 * Mission templates that are generated and offered to the player.
 * Each faction has multiple missions at varying difficulties.
 */
export const MISSION_TEMPLATES: Omit<Mission, 'id' | 'status' | 'acceptedOnTurn'>[] = [
  // === IRON PACT ===
  {
    factionId: 'iron-pact',
    type: 'gather',
    title: 'Fuel the Forges',
    description: 'Commander Forge needs fuel to keep the great forges burning. Gather fuel and deliver it!',
    emoji: '⛽',
    objectives: [
      { id: 'obj-1', description: 'Have 80+ fuel', type: 'gather-resource', target: 'fuel', amount: 80, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 40 }, reputation: { 'iron-pact': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'iron-pact',
    type: 'trade',
    title: 'Iron Highway',
    description: 'The Iron Pact wants a trade route through the highlands. Establish it to prove your worth!',
    emoji: '🛤️',
    objectives: [
      { id: 'obj-1', description: 'Establish a trade route from Forge Highlands', type: 'establish-route', target: 'forge-highlands', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 60, fuel: 20 }, reputation: { 'iron-pact': 20 } },
    turnLimit: 12,
    difficulty: 'medium',
  },
  {
    factionId: 'iron-pact',
    type: 'reputation',
    title: 'Earn the Pact\'s Trust',
    description: 'Prove your loyalty to the Iron Pact by reaching friendly status with them.',
    emoji: '🤝',
    objectives: [
      { id: 'obj-1', description: 'Reach 30+ reputation with Iron Pact', type: 'reach-reputation', target: 'iron-pact', amount: 30, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 80, fuel: 30 }, reputation: { 'iron-pact': 10 } },
    turnLimit: 20,
    difficulty: 'hard',
  },

  // === TIDECALLERS ===
  {
    factionId: 'tidecallers',
    type: 'gather',
    title: 'Feed the Fleet',
    description: 'Captain Coral\'s fleet needs food supplies. Gather food to feed the sailors!',
    emoji: '🍞',
    objectives: [
      { id: 'obj-1', description: 'Have 70+ food', type: 'gather-resource', target: 'food', amount: 70, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 35, water: 15 }, reputation: { 'tidecallers': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'tidecallers',
    type: 'explore',
    title: 'Chart the Waters',
    description: 'The Tidecallers want you to explore new territories connected to their waters.',
    emoji: '🗺️',
    objectives: [
      { id: 'obj-1', description: 'Discover a new region adjacent to Shattered Coast', type: 'discover-region', target: 'shattered-coast', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 50, food: 20 }, reputation: { 'tidecallers': 18 } },
    turnLimit: 10,
    difficulty: 'medium',
  },
  {
    factionId: 'tidecallers',
    type: 'delivery',
    title: 'Water for the World',
    description: 'Deliver water to drought-stricken regions to earn the Tidecallers\' respect.',
    emoji: '💧',
    objectives: [
      { id: 'obj-1', description: 'Have 100+ water', type: 'gather-resource', target: 'water', amount: 100, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 70 }, reputation: { 'tidecallers': 22 } },
    turnLimit: 15,
    difficulty: 'hard',
  },

  // === DUSTWALKERS ===
  {
    factionId: 'dustwalkers',
    type: 'explore',
    title: 'Desert Discovery',
    description: 'Elder Sandstep wants to map new territories. Discover the Amber Wastes!',
    emoji: '🏜️',
    objectives: [
      { id: 'obj-1', description: 'Discover the Amber Wastes', type: 'discover-region', target: 'amber-wastes', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { fuel: 30, gold: 25 }, reputation: { 'dustwalkers': 15 } },
    turnLimit: 6,
    difficulty: 'easy',
  },
  {
    factionId: 'dustwalkers',
    type: 'gather',
    title: 'Oasis Resupply',
    description: 'The desert caravans need water desperately. Help the Dustwalkers find water sources.',
    emoji: '🌴',
    objectives: [
      { id: 'obj-1', description: 'Have 60+ water', type: 'gather-resource', target: 'water', amount: 60, current: 0, completed: false },
    ],
    rewards: { resources: { fuel: 25, gold: 40 }, reputation: { 'dustwalkers': 18 } },
    turnLimit: 10,
    difficulty: 'medium',
  },

  // === VERDANT COMMUNE ===
  {
    factionId: 'verdant-commune',
    type: 'gather',
    title: 'Forest Harvest',
    description: 'Willow Bloom needs food gathered sustainably. Show you respect the forest!',
    emoji: '🌿',
    objectives: [
      { id: 'obj-1', description: 'Have 90+ food', type: 'gather-resource', target: 'food', amount: 90, current: 0, completed: false },
    ],
    rewards: { resources: { water: 25, gold: 30 }, reputation: { 'verdant-commune': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'verdant-commune',
    type: 'explore',
    title: 'Find the Canopy',
    description: 'The Commune wants allies who know the way. Discover the Emerald Canopy.',
    emoji: '🌳',
    objectives: [
      { id: 'obj-1', description: 'Discover the Emerald Canopy', type: 'discover-region', target: 'emerald-canopy', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { food: 30, water: 20 }, reputation: { 'verdant-commune': 20 } },
    turnLimit: 10,
    difficulty: 'medium',
  },

  // === NIGHTMARKET SYNDICATE ===
  {
    factionId: 'nightmarket-syndicate',
    type: 'gather',
    title: 'Intel Wanted',
    description: 'Shadow Whisper is buying information. Gather intel from any source!',
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
    title: 'Discover the Undercity',
    description: 'Find the entrance to the legendary Undercity black markets.',
    emoji: '🕳️',
    objectives: [
      { id: 'obj-1', description: 'Discover The Undercity', type: 'discover-region', target: 'the-undercity', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { contraband: 15, gold: 40 }, reputation: { 'nightmarket-syndicate': 18 } },
    turnLimit: 10,
    difficulty: 'medium',
  },

  // === ASHEN THRONE ===
  {
    factionId: 'ashen-throne',
    type: 'gather',
    title: 'Pay Your Dues',
    description: 'Magistrate Ashveil demands tribute. Accumulate enough gold to please the Throne.',
    emoji: '💰',
    objectives: [
      { id: 'obj-1', description: 'Have 300+ gold', type: 'gather-resource', target: 'gold', amount: 300, current: 0, completed: false },
    ],
    rewards: { resources: { information: 10 }, reputation: { 'ashen-throne': 15 } },
    turnLimit: 8,
    difficulty: 'easy',
  },
  {
    factionId: 'ashen-throne',
    type: 'trade',
    title: 'Imperial Commerce',
    description: 'Establish a trade route through the Obsidian Citadel to earn the Throne\'s favor.',
    emoji: '🏰',
    objectives: [
      { id: 'obj-1', description: 'Establish a route from Obsidian Citadel', type: 'establish-route', target: 'obsidian-citadel', amount: 1, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 80, information: 10 }, reputation: { 'ashen-throne': 22 } },
    turnLimit: 15,
    difficulty: 'medium',
  },
  {
    factionId: 'ashen-throne',
    type: 'reputation',
    title: 'Friend of the Crown',
    description: 'Earn allied status with the Ashen Throne to unlock their deepest vaults.',
    emoji: '👑',
    objectives: [
      { id: 'obj-1', description: 'Reach 40+ reputation with Ashen Throne', type: 'reach-reputation', target: 'ashen-throne', amount: 40, current: 0, completed: false },
    ],
    rewards: { resources: { gold: 120, information: 15 }, reputation: { 'ashen-throne': 15 } },
    turnLimit: 25,
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
