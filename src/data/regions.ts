// ============================================================
// Static Game Data — Regions (with extended lore, gather actions, marketplace & discovery)
// ============================================================
import type { Region, RegionId, MarketplaceItem, DiscoveryRequirement } from '@/engine/types';

// Helper to create marketplace items
function marketplace(items: Omit<MarketplaceItem, 'priceModifier'>[]): MarketplaceItem[] {
  return items.map((item) => ({ ...item, priceModifier: 1.0 }));
}

// Default discovery requirements
const EASY_DISCOVERY: DiscoveryRequirement = {
  scoutCost: { turns: 1, successChance: 0.9 },
  mapCost: { gold: 30 },
  minimumGold: 20,
};

const MEDIUM_DISCOVERY: DiscoveryRequirement = {
  scoutCost: { turns: 2, successChance: 0.7 },
  mapCost: { gold: 75, information: 5 },
  minimumGold: 50,
};

const HARD_DISCOVERY: DiscoveryRequirement = {
  scoutCost: { turns: 3, successChance: 0.5 },
  mapCost: { gold: 150, information: 15 },
  reputationUnlock: { factionId: 'ashen-throne', minimum: 25 },
  minimumGold: 100,
};

export const REGIONS: Record<RegionId, Region> = {
  'forge-highlands': {
    id: 'forge-highlands',
    name: 'Forge Highlands',
    description: 'Volcanic mountains riddled with forges and mines. The air tastes of iron and smoke.',
    lore: 'Long ago, the first smiths discovered veins of starfire iron flowing like rivers beneath the volcanoes. They built their forges atop the lava vents, harnessing geothermal heat to craft weapons and tools of extraordinary power. Commander Forge, the current War-Smith, won leadership by forging a blade that split a boulder in two. Every year, the Iron Pact holds the Festival of Sparks, where young apprentices showcase their finest creations.',
    icon: '🌋',
    factionId: 'iron-pact',
    position: { x: 0.25, y: 0.15 },
    resources: { fuel: 40, gold: 20 },
    discovered: true,
    adjacentRegions: ['shattered-coast', 'amber-wastes', 'obsidian-citadel'],
    gatherActions: [
      {
        id: 'mine-iron',
        name: 'Mine Iron Ore',
        emoji: '⛏️',
        description: 'Dig into the volcanic rock to extract precious fuel and metal.',
        resourceReward: { fuel: 12, gold: 5 },
        cooldownTurns: 2,
        successChance: 0.8,
      },
      {
        id: 'collect-lava-crystals',
        name: 'Collect Lava Crystals',
        emoji: '💎',
        description: 'Brave the heat to gather glowing lava crystals worth a fortune.',
        resourceReward: { gold: 18 },
        cooldownTurns: 3,
        successChance: 0.6,
        requiredReputation: { factionId: 'iron-pact', minimum: 10 },
      },
      {
        id: 'forge-trade-goods',
        name: 'Forge Trade Goods',
        emoji: '🔨',
        description: 'Use the forges to craft items that can be traded for great profit.',
        resourceReward: { gold: 25, information: 3 },
        cooldownTurns: 4,
        successChance: 0.7,
        requiredReputation: { factionId: 'iron-pact', minimum: 20 },
      },
    ],
    // Forge Highlands Marketplace — sells fuel & contraband; buys food & water
    marketplace: marketplace([
      { resourceType: 'fuel', action: 'sell', basePrice: 3, available: 30 },
      { resourceType: 'contraband', action: 'sell', basePrice: 8, available: 5 },
      { resourceType: 'food', action: 'buy', basePrice: 4, available: -1 },
      { resourceType: 'water', action: 'buy', basePrice: 3, available: -1 },
      { resourceType: 'gold', action: 'buy', basePrice: 1, available: -1 },
    ]),
    discoveryRequirements: EASY_DISCOVERY, // Starting region
  },
  'shattered-coast': {
    id: 'shattered-coast',
    name: 'Shattered Coast',
    description: 'A treacherous coastline of broken cliffs and hidden harbors. The Tidecallers navigate it by starlight.',
    lore: "Centuries ago, a massive earthquake shattered the continent's eastern edge, creating thousands of islands, sea stacks, and hidden coves. The Tidecallers claim the ocean chose them to guard these waters. Captain Coral, the Tide-Speaker, can allegedly predict storms three days in advance by listening to the barnacles on her ship's hull. The coast is rich with fish, pearls, and freshwater springs that flow from underground rivers into the sea.",
    icon: '🌊',
    factionId: 'tidecallers',
    position: { x: 0.75, y: 0.1 },
    resources: { food: 35, water: 30 },
    discovered: true,
    adjacentRegions: ['forge-highlands', 'emerald-canopy', 'the-undercity'],
    gatherActions: [
      {
        id: 'go-fishing',
        name: 'Go Fishing',
        emoji: '🎣',
        description: 'Cast your nets in the rich coastal waters for a bountiful catch.',
        resourceReward: { food: 15, water: 5 },
        cooldownTurns: 1,
        successChance: 0.85,
      },
      {
        id: 'collect-freshwater',
        name: 'Collect Spring Water',
        emoji: '💧',
        description: 'Fill barrels from the coastal freshwater springs.',
        resourceReward: { water: 20 },
        cooldownTurns: 2,
        successChance: 0.9,
      },
      {
        id: 'dive-for-pearls',
        name: 'Dive for Pearls',
        emoji: '🤿',
        description: 'Dive deep into the crystal-clear waters to find valuable pearls.',
        resourceReward: { gold: 20, information: 2 },
        cooldownTurns: 3,
        successChance: 0.55,
        requiredReputation: { factionId: 'tidecallers', minimum: 15 },
      },
    ],
    // Shattered Coast Marketplace — sells food & water; buys fuel & gold
    marketplace: marketplace([
      { resourceType: 'food', action: 'sell', basePrice: 3, available: 40 },
      { resourceType: 'water', action: 'sell', basePrice: 2, available: 50 },
      { resourceType: 'fuel', action: 'buy', basePrice: 5, available: -1 },
      { resourceType: 'gold', action: 'buy', basePrice: 1, available: -1 },
      { resourceType: 'information', action: 'sell', basePrice: 6, available: 10 },
    ]),
    discoveryRequirements: EASY_DISCOVERY, // Starting region
  },
  'amber-wastes': {
    id: 'amber-wastes',
    name: 'Amber Wastes',
    description: 'An endless desert of golden sand hiding ancient mineral veins and fuel deposits beneath the dunes.',
    lore: 'The Amber Wastes were once a lush savannah, but a great magical catastrophe turned it to desert overnight. The Dustwalkers discovered that the catastrophe also compressed ancient organic material into incredible fuel deposits just below the sand. Elder Sandstep leads the caravan cities — mobile settlements that follow the underground fuel rivers. At night, the desert glows amber from the fuel seeping through cracks in the sand, giving the wastes their name.',
    icon: '🏜️',
    factionId: 'dustwalkers',
    position: { x: 0.15, y: 0.55 },
    resources: { fuel: 50, information: 10 },
    discovered: false,
    adjacentRegions: ['forge-highlands', 'the-undercity', 'obsidian-citadel'],
    gatherActions: [
      {
        id: 'drill-fuel',
        name: 'Drill for Fuel',
        emoji: '🛢️',
        description: 'Tap into the underground fuel rivers hidden beneath the dunes.',
        resourceReward: { fuel: 20 },
        cooldownTurns: 2,
        successChance: 0.75,
      },
      {
        id: 'find-oasis',
        name: 'Find Hidden Oasis',
        emoji: '🌴',
        description: 'Follow ancient Dustwalker maps to find a secret oasis with fresh water.',
        resourceReward: { water: 15, food: 8 },
        cooldownTurns: 3,
        successChance: 0.6,
        requiredReputation: { factionId: 'dustwalkers', minimum: 10 },
      },
      {
        id: 'excavate-ruins',
        name: 'Excavate Ancient Ruins',
        emoji: '🏺',
        description: 'Dig up relics from the civilization that lived here before the catastrophe.',
        resourceReward: { information: 12, gold: 15 },
        cooldownTurns: 4,
        successChance: 0.5,
        requiredReputation: { factionId: 'dustwalkers', minimum: 25 },
      },
    ],
    // Amber Wastes Marketplace — sells fuel & information; buys water & food
    marketplace: marketplace([
      { resourceType: 'fuel', action: 'sell', basePrice: 2, available: 60 },
      { resourceType: 'information', action: 'sell', basePrice: 5, available: 15 },
      { resourceType: 'water', action: 'buy', basePrice: 6, available: -1 },
      { resourceType: 'food', action: 'buy', basePrice: 5, available: -1 },
      { resourceType: 'contraband', action: 'sell', basePrice: 7, available: 8 },
    ]),
    discoveryRequirements: {
      ...MEDIUM_DISCOVERY,
      reputationUnlock: { factionId: 'dustwalkers', minimum: 15 },
    },
  },
  'emerald-canopy': {
    id: 'emerald-canopy',
    name: 'Emerald Canopy',
    description: 'A dense, ancient forest where the trees grow tall enough to blot out the sun. The Commune lives among the branches.',
    lore: 'The Emerald Canopy is home to trees over 1,000 years old, some growing so tall that entire villages are built in their branches. The Verdant Commune believes the forest is alive — a single organism that thinks and dreams. Willow Bloom, Voice of the Canopy, claims to hear the forest whisper its needs. The forest produces extraordinary medicines, the juiciest fruits, and the purest water filtered through miles of ancient root systems.',
    icon: '🌳',
    factionId: 'verdant-commune',
    position: { x: 0.8, y: 0.45 },
    resources: { food: 60, water: 40 },
    discovered: false,
    adjacentRegions: ['shattered-coast', 'the-undercity', 'obsidian-citadel'],
    gatherActions: [
      {
        id: 'forage-herbs',
        name: 'Forage for Herbs',
        emoji: '🌿',
        description: 'Gather medicinal herbs and edible plants from the forest floor.',
        resourceReward: { food: 18, water: 5 },
        cooldownTurns: 1,
        successChance: 0.9,
      },
      {
        id: 'collect-rainwater',
        name: 'Collect Rainwater',
        emoji: '🌧️',
        description: 'Set up collectors in the canopy to catch pure rainwater.',
        resourceReward: { water: 22 },
        cooldownTurns: 2,
        successChance: 0.85,
      },
      {
        id: 'harvest-rare-fruits',
        name: 'Harvest Rare Fruits',
        emoji: '🍇',
        description: 'Climb to the highest branches to pick rare, valuable fruits.',
        resourceReward: { food: 25, gold: 10 },
        cooldownTurns: 3,
        successChance: 0.65,
        requiredReputation: { factionId: 'verdant-commune', minimum: 20 },
      },
    ],
    // Emerald Canopy Marketplace — sells food & water; buys fuel & contraband
    marketplace: marketplace([
      { resourceType: 'food', action: 'sell', basePrice: 2, available: 50 },
      { resourceType: 'water', action: 'sell', basePrice: 2, available: 45 },
      { resourceType: 'fuel', action: 'buy', basePrice: 6, available: -1 },
      { resourceType: 'contraband', action: 'buy', basePrice: 10, available: -1 },
      { resourceType: 'gold', action: 'buy', basePrice: 1, available: -1 },
    ]),
    discoveryRequirements: {
      ...MEDIUM_DISCOVERY,
      reputationUnlock: { factionId: 'verdant-commune', minimum: 20 },
    },
  },
  'the-undercity': {
    id: 'the-undercity',
    name: 'The Undercity',
    description: 'A sprawling underground network of tunnels, markets, and hideouts beneath the surface. Everything is for sale.',
    lore: "The Undercity started as abandoned mining tunnels but grew into a vast underground metropolis. Bioluminescent fungi light the tunnels in eerie blue and purple hues. Shadow Whisper, the Broker of Secrets, runs the information trade from a hidden office that moves location every day. The black markets here sell everything — contraband, secrets, rare artifacts, and even maps to places that don't officially exist.",
    icon: '🕳️',
    factionId: 'nightmarket-syndicate',
    position: { x: 0.5, y: 0.75 },
    resources: { contraband: 30, information: 25, gold: 15 },
    discovered: false,
    adjacentRegions: ['shattered-coast', 'amber-wastes', 'emerald-canopy'],
    gatherActions: [
      {
        id: 'eavesdrop',
        name: 'Eavesdrop on Traders',
        emoji: '👂',
        description: 'Listen in on conversations in the black market for valuable intel.',
        resourceReward: { information: 10 },
        cooldownTurns: 1,
        successChance: 0.8,
      },
      {
        id: 'scavenge-tunnels',
        name: 'Scavenge the Tunnels',
        emoji: '🔦',
        description: 'Explore abandoned tunnels for forgotten goods and contraband.',
        resourceReward: { contraband: 8, gold: 8 },
        cooldownTurns: 2,
        successChance: 0.7,
      },
      {
        id: 'trade-secrets',
        name: 'Trade Secrets',
        emoji: '🗝️',
        description: 'Exchange favors with the Syndicate for high-value information.',
        resourceReward: { information: 18, contraband: 10 },
        cooldownTurns: 3,
        successChance: 0.55,
        requiredReputation: { factionId: 'nightmarket-syndicate', minimum: 15 },
      },
    ],
    // Undercity Marketplace — sells contraband, information & maps; buys everything
    marketplace: marketplace([
      { resourceType: 'contraband', action: 'sell', basePrice: 5, available: 25 },
      { resourceType: 'information', action: 'sell', basePrice: 4, available: 30 },
      { resourceType: 'gold', action: 'sell', basePrice: 1, available: 20 },
      { resourceType: 'food', action: 'buy', basePrice: 3, available: -1 },
      { resourceType: 'water', action: 'buy', basePrice: 3, available: -1 },
      { resourceType: 'fuel', action: 'buy', basePrice: 4, available: -1 },
    ]),
    discoveryRequirements: {
      ...HARD_DISCOVERY,
      reputationUnlock: { factionId: 'nightmarket-syndicate', minimum: 10 },
    },
  },
  'obsidian-citadel': {
    id: 'obsidian-citadel',
    name: 'Obsidian Citadel',
    description: 'The seat of the old empire, a fortress of black glass. Its bureaucracy controls gold minting and governance across the land.',
    lore: "Built from a single enormous block of volcanic glass, the Obsidian Citadel gleams like a dark mirror. Magistrate Ashveil manages the empire's crumbling tax system from its highest tower. Despite the empire's decline, the Citadel still controls the only official gold mint, and its stamps and seals are required for any legal trade. The vaults beneath the Citadel are said to contain enough gold to buy every other faction twice over — if anyone could break through the seven locked doors.",
    icon: '🏰',
    factionId: 'ashen-throne',
    position: { x: 0.45, y: 0.35 },
    resources: { gold: 50, information: 15 },
    discovered: true,
    adjacentRegions: ['forge-highlands', 'amber-wastes', 'emerald-canopy'],
    gatherActions: [
      {
        id: 'collect-taxes',
        name: 'Collect Tax Rebates',
        emoji: '📜',
        description: 'Navigate the bureaucracy to claim your rightful tax rebates.',
        resourceReward: { gold: 15 },
        cooldownTurns: 2,
        successChance: 0.75,
      },
      {
        id: 'research-archives',
        name: 'Research the Archives',
        emoji: '📚',
        description: "Study the empire's vast library for valuable intelligence.",
        resourceReward: { information: 12, gold: 5 },
        cooldownTurns: 2,
        successChance: 0.8,
      },
      {
        id: 'petition-throne',
        name: 'Petition the Throne',
        emoji: '👑',
        description: 'Formally petition the magistrate for a gold grant.',
        resourceReward: { gold: 35 },
        cooldownTurns: 5,
        successChance: 0.45,
        requiredReputation: { factionId: 'ashen-throne', minimum: 30 },
      },
    ],
    // Obsidian Citadel Marketplace — the gold hub; sells gold & info; buys all
    marketplace: marketplace([
      { resourceType: 'gold', action: 'sell', basePrice: 1, available: 100 },
      { resourceType: 'information', action: 'sell', basePrice: 5, available: 20 },
      { resourceType: 'fuel', action: 'buy', basePrice: 4, available: -1 },
      { resourceType: 'food', action: 'buy', basePrice: 4, available: -1 },
      { resourceType: 'water', action: 'buy', basePrice: 3, available: -1 },
      { resourceType: 'contraband', action: 'buy', basePrice: 12, available: -1 },
    ]),
    discoveryRequirements: EASY_DISCOVERY, // Starting region
  },
};

// Travel costs between adjacent regions (fuel consumption)
export const TRAVEL_COSTS: Record<string, number> = {
  default: 10, // Default fuel cost to travel between adjacent regions
  'forge-highlands→shattered-coast': 15, // Longer route
  'forge-highlands→amber-wastes': 12,
  'forge-highlands→obsidian-citadel': 8,
  'shattered-coast→emerald-canopy': 10,
  'shattered-coast→the-undercity': 18, // Sea + underground
  'amber-wastes→the-undercity': 15,
  'amber-wastes→obsidian-citadel': 10,
  'emerald-canopy→the-undercity': 12,
  'emerald-canopy→obsidian-citadel': 14,
};

export function getTravelCost(from: RegionId, to: RegionId): number {
  const key1 = `${from}→${to}`;
  const key2 = `${to}→${from}`;
  return TRAVEL_COSTS[key1] ?? TRAVEL_COSTS[key2] ?? TRAVEL_COSTS.default;
}
