// ============================================================
// Lib — Game Constants
// ============================================================

/** Minimum touch target size per Apple HIG (44px) */
export const MIN_TOUCH_TARGET = 44;

/** Resource thresholds for warnings */
export const LOW_RESOURCE_THRESHOLD = 20;
export const CRITICAL_RESOURCE_THRESHOLD = 5;

/** Personnel costs multipliers */
export const HEAL_COST_GOLD = 30;

/** Discovery cost */
export const DISCOVERY_COST: Record<string, number> = {
  fuel: 10,
  gold: 25,
};

/** Turn income from base (even without trade routes) */
export const BASE_INCOME = {
  gold: 5,
  food: 2,
  fuel: 3,
  water: 2,
};

/** Per-turn upkeep costs (caravan crew needs feeding) */
export const CARAVAN_UPKEEP = {
  food: 3,
  water: 2,
};

/** Per-turn cost per hired personnel member */
export const PERSONNEL_UPKEEP_GOLD = 1;

/** Victory conditions — win by reaching ANY of these */
export const VICTORY_CONDITIONS = {
  goldTarget: 2000,
  alliedFactionsTarget: 3,
  allRoutesTarget: 7,       // total trade routes in game
  allRegionsDiscovered: 6,   // total regions
  turnsToSurvive: 50,
};

/** Maximum personnel roster size */
export const MAX_PERSONNEL = 20;

/** Save auto-save interval (in turns) */
export const AUTOSAVE_INTERVAL = 1;

// ============================================================
// Polish & Content — Extended Constants
// ============================================================

/** Seasonal resource modifiers (multiply production) */
export const SEASONAL_BONUSES: Record<string, Record<string, number>> = {
  spring: { food: 1.3, water: 1.2, gold: 1.0, fuel: 1.0 },
  summer: { food: 1.0, water: 0.7, gold: 1.0, fuel: 0.8 },
  autumn: { food: 1.5, water: 1.0, gold: 1.1, fuel: 1.0 },
  winter: { food: 0.6, water: 0.8, gold: 1.0, fuel: 1.4 },
};

/** Seasonal flavor text shown in turn summaries */
export const SEASONAL_FLAVOR: Record<string, string[]> = {
  spring: [
    '🌸 Wildflowers bloom across the trade roads.',
    '🐣 Baby animals frolic near your caravan.',
    '🌈 A rainbow arcs over the horizon — good fortune!',
    '🌱 New growth sprouts from the roadside.',
  ],
  summer: [
    '☀️ The sun beats down relentlessly on the plains.',
    '🏖️ Travelers seek shade along the dusty roads.',
    '🔥 Heat mirages shimmer on the horizon.',
    '🌅 Long golden evenings give extra time for trading.',
  ],
  autumn: [
    '🍂 Leaves swirl around your caravan in amber spirals.',
    '🎃 Harvest festivals light up nearby villages.',
    '🌾 Farmers bring overflowing wagons to market.',
    '🦉 Night comes early; owls hoot from the trees.',
  ],
  winter: [
    '❄️ Frost coats every surface in glittering crystal.',
    '🏔️ Snow blankets the mountain passes.',
    '🧣 Your crew huddles around the campfire for warmth.',
    '⛄ Children build snow figures near the trade posts.',
  ],
};

/** Resource descriptions for tooltips */
export const RESOURCE_DESCRIPTIONS: Record<string, string> = {
  fuel: 'Powers your caravan for travel between regions. Consumed by travel and upkeep.',
  water: 'Keeps your crew hydrated. Consumed each turn. Scarce in deserts.',
  food: 'Feeds your crew. Consumed each turn. Abundant near coasts and forests.',
  gold: 'Universal currency. Used for buying, hiring, and establishing trade routes.',
  contraband: 'Illegal goods with high trade value. Risky to carry but very profitable.',
  information: 'Market intel and secrets. Used to buy maps and unlock opportunities.',
};

/** Faction personality quips for NPC interactions (shown randomly) */
export const FACTION_QUIPS: Record<string, string[]> = {
  'iron-pact': [
    '"Steel does not lie. Neither should a trader."',
    '"Bring fuel, and you bring respect."',
    '"The forge remembers those who feed it."',
    '"We judge not by words, but by the weight of your wagon."',
  ],
  'tidecallers': [
    '"The tides tell us much about you, trader."',
    '"Cast your nets wide and your worries will drown."',
    '"Every wave was once a raindrop — start small."',
    '"The sea favors the bold, but spares the wise."',
  ],
  'dustwalkers': [
    '"The sand buries fools and polishes diamonds."',
    '"Walk with patience; the desert reveals its secrets slowly."',
    '"We trade in trust. Earn it drop by drop."',
    '"Every oasis was once someone\'s impossible dream."',
  ],
  'verdant-commune': [
    '"The forest remembers kindness for a thousand seasons."',
    '"Take only what you need; give back what you can."',
    '"Even the mightiest oak grew from a gentle seed."',
    '"We grow together, or we wither alone."',
  ],
  'nightmarket-syndicate': [
    '"In the dark, gold shines brightest."',
    '"Information is the truest currency."',
    '"Trust is expensive. Betrayal costs more."',
    '"Everyone has a price. What\'s yours?"',
  ],
  'ashen-throne': [
    '"Power flows to those who know how to serve it."',
    '"The Throne sees all who come bearing gifts."',
    '"Loyalty today buys influence tomorrow."',
    '"In the shadow of greatness, even traders can rise."',
  ],
};

/** Trade route names for display (flavor) */
export const TRADE_ROUTE_NAMES: Record<string, string> = {
  'forge-highlands-shattered-coast': 'The Iron Tide Route',
  'forge-highlands-amber-wastes': 'The Ember Road',
  'forge-highlands-obsidian-citadel': 'The Throne\'s Highway',
  'shattered-coast-emerald-canopy': 'The Green Current',
  'shattered-coast-the-undercity': 'The Shadow Harbor',
  'amber-wastes-emerald-canopy': 'The Oasis Trail',
  'amber-wastes-the-undercity': 'The Dust Tunnel',
  'emerald-canopy-the-undercity': 'The Root Passage',
  'the-undercity-obsidian-citadel': 'The Dark Ascent',
  'obsidian-citadel-amber-wastes': 'The Ash Wind Path',
};

/** Milestone messages — shown when player hits certain thresholds */
export const MILESTONES: { threshold: number; resource: string; message: string; emoji: string }[] = [
  { threshold: 100, resource: 'gold', message: 'Your first hundred gold! A humble beginning.', emoji: '🪙' },
  { threshold: 500, resource: 'gold', message: 'Five hundred gold! You\'re becoming a real trader.', emoji: '💰' },
  { threshold: 1000, resource: 'gold', message: 'A thousand gold! Merchants whisper your name.', emoji: '🤑' },
  { threshold: 1500, resource: 'gold', message: 'Fifteen hundred gold! Empires are built on less.', emoji: '👑' },
];

/** Tips shown on the title screen and during loading */
export const GAME_TIPS: string[] = [
  '💡 Buy resources where they\'re cheap, sell where they\'re expensive.',
  '🤝 Allied factions give you discounts and bonus gather rewards.',
  '⚠️ Hostile factions will block your marketplace access!',
  '🔭 Hire scouts to discover new regions safely.',
  '📊 Establish trade routes for passive income every turn.',
  '🌱 Spring and autumn are great for food production.',
  '❄️ Stock up on fuel before winter — demand increases!',
  '🗺️ Buy maps for instant region discovery if you have enough gold.',
  '👥 Personnel cost gold each turn — only hire when needed.',
  '🎯 Complete missions for big reputation and resource rewards.',
  '🏘️ Travel to allied regions for the best encounters.',
  '📦 Contraband is risky but extremely profitable.',
  '🐫 Your caravan always needs food and water — plan ahead!',
  '🏆 There are four ways to win — pick the one that suits your style!',
];

/** Difficulty tiers (for potential future use) */
export const DIFFICULTY_SETTINGS = {
  easy: {
    upkeepMultiplier: 0.5,
    incomeMultiplier: 1.5,
    encounterNegativeChance: 0.2,
    victoryMultiplier: 0.75,
  },
  normal: {
    upkeepMultiplier: 1.0,
    incomeMultiplier: 1.0,
    encounterNegativeChance: 0.35,
    victoryMultiplier: 1.0,
  },
  hard: {
    upkeepMultiplier: 1.5,
    incomeMultiplier: 0.75,
    encounterNegativeChance: 0.5,
    victoryMultiplier: 1.5,
  },
};

/** Region danger levels for travel tooltip */
export const REGION_DANGER: Record<string, { level: string; color: string; emoji: string }> = {
  'forge-highlands': { level: 'Moderate', color: 'text-amber-500', emoji: '⚠️' },
  'shattered-coast': { level: 'Safe', color: 'text-green-500', emoji: '🟢' },
  'amber-wastes': { level: 'Dangerous', color: 'text-red-500', emoji: '🔴' },
  'emerald-canopy': { level: 'Safe', color: 'text-green-500', emoji: '🟢' },
  'the-undercity': { level: 'Dangerous', color: 'text-red-500', emoji: '🔴' },
  'obsidian-citadel': { level: 'Very Dangerous', color: 'text-red-600', emoji: '💀' },
};

/** How many turns between auto-mission generation */
export const MISSION_GENERATION_INTERVAL = 3;

/** Max active events displayed */
export const MAX_VISIBLE_EVENTS = 10;

/** Negotiator sell bonus per skill point */
export const NEGOTIATOR_SKILL_BONUS = 0.05;

/** Allied faction gather reward multiplier */
export const ALLIED_GATHER_MULTIPLIER = 1.3;

/** Friendly faction success chance bonus */
export const FRIENDLY_GATHER_BONUS = 0.05;
export const ALLIED_GATHER_SUCCESS_BONUS = 0.10;

/** Travel encounter chance per turn */
export const TRAVEL_ENCOUNTER_CHANCE = 0.25;

// ============================================================
// Additional Polish — Weather, Quotes, Celebrations
// ============================================================

/** Weather descriptions per region+season (ambient flavor in region detail) */
export const REGION_WEATHER: Record<string, Record<string, string>> = {
  'forge-highlands': {
    spring: '🌤️ Warm updrafts carry ash from the dormant forges.',
    summer: '🔥 Heat waves shimmer above the lava flows.',
    autumn: '🌫️ Fog rolls through the mountain passes.',
    winter: '🌨️ Snow melts on contact with the warm volcanic stone.',
  },
  'shattered-coast': {
    spring: '🌊 Gentle tides lap at the rebuilt harbors.',
    summer: '⛵ Calm seas and warm breezes — perfect sailing weather.',
    autumn: '🌧️ Squalls blow in from the open ocean.',
    winter: '❄️ Ice forms on the tide pools at dawn.',
  },
  'amber-wastes': {
    spring: '🌵 Desert wildflowers bloom after rare rains.',
    summer: '🥵 The sand is hot enough to cook on.',
    autumn: '🌅 Golden dust storms paint the sky amber.',
    winter: '🌙 Freezing desert nights under crystal-clear stars.',
  },
  'emerald-canopy': {
    spring: '🌸 The canopy explodes with blossoms and birdsong.',
    summer: '🦜 Lush green everywhere — the jungle thrives.',
    autumn: '🍄 Mushrooms and fungi carpet the forest floor.',
    winter: '🌿 The evergreen canopy shields from the cold.',
  },
  'the-undercity': {
    spring: '💡 Lanterns flicker in the perpetually dim tunnels.',
    summer: '🦇 The underground stays cool while the world above swelters.',
    autumn: '🕯️ Festival lights decorate the market caverns.',
    winter: '🔥 Warm braziers line every corridor and alcove.',
  },
  'obsidian-citadel': {
    spring: '⚡ Lightning dances between the obsidian spires.',
    summer: '🏰 The citadel gleams like black glass in the sun.',
    autumn: '🌑 Dark clouds gather around the fortress.',
    winter: '🥶 Bitter winds howl through the battlements.',
  },
};

/** Loading/title screen rotating quotes from NPCs */
export const TITLE_SCREEN_QUOTES: { text: string; author: string; emoji: string }[] = [
  { text: 'The world gave us a first chance, and we stumbled. It gave us a second, and we fell. But we rose.', author: 'Silk, Master Negotiator', emoji: '⚖️' },
  { text: 'Steel does not lie. Neither should a trader.', author: 'Commander Forge', emoji: '⚒️' },
  { text: 'The tides tell us much about you, trader.', author: 'Captain Coral', emoji: '🧜' },
  { text: 'The sand buries fools and polishes diamonds.', author: 'Elder Sandstep', emoji: '🏜️' },
  { text: 'Even the mightiest oak grew from a gentle seed.', author: 'Willow Bloom', emoji: '🌿' },
  { text: 'In the dark, gold shines brightest.', author: 'Shadow Whisper', emoji: '🕵️' },
  { text: 'Power flows to those who know how to serve it.', author: 'Magistrate Ashveil', emoji: '👑' },
  { text: 'Every trade route begins with a single footstep.', author: 'Old Trader Proverb', emoji: '🐫' },
  { text: 'Fortune favors the persistent, not merely the bold.', author: 'The Merchant\'s Codex', emoji: '📜' },
  { text: 'A wise trader knows when to hold and when to fold.', author: 'Shadow Whisper', emoji: '🃏' },
];

/** Achievement celebration messages (shown on unlock) */
export const ACHIEVEMENT_CELEBRATIONS: string[] = [
  '🎉 Achievement Unlocked!',
  '⭐ You earned a new award!',
  '🏅 Another milestone reached!',
  '✨ Well done, trader!',
  '🎊 Congratulations!',
  '💫 Outstanding work!',
];

/** Caravan status flavor messages (shown in caravan bar based on context) */
export const CARAVAN_STATUS_MESSAGES: Record<string, string[]> = {
  low_fuel: [
    '⛽ Your oxen are getting tired...',
    '⛽ Fuel reserves running low!',
    '⛽ Better find a fuel depot soon.',
  ],
  low_food: [
    '🍞 Stomachs are rumbling in the caravan.',
    '🍞 The crew is getting hungry!',
    '🍞 Food supplies are running thin.',
  ],
  low_water: [
    '💧 Canteens are nearly empty.',
    '💧 The crew is getting thirsty!',
    '💧 Water is dangerously low.',
  ],
  healthy: [
    '🟢 Caravan in good shape! Ready for adventure.',
    '🟢 All supplies stocked. Where to next?',
    '🟢 The crew is in high spirits!',
  ],
  rich: [
    '💰 Your gold pouches are getting heavy!',
    '💰 Merchants eye your overflowing coffers.',
    '💰 Time to invest that fortune wisely!',
  ],
};

/** Region arrival flavor messages (shown briefly when traveling to a new region) */
export const ARRIVAL_MESSAGES: Record<string, string[]> = {
  'forge-highlands': [
    'The smell of molten iron fills the air as you approach the forges.',
    'Sparks fly from the great furnaces visible on the mountainside.',
    'The ground trembles with the rhythm of a thousand hammers.',
  ],
  'shattered-coast': [
    'Salt spray and seabird calls greet your caravan.',
    'Colorful fishing boats bob in the harbor as you arrive.',
    'The crash of waves against the breakwater welcomes you.',
  ],
  'amber-wastes': [
    'An endless sea of golden sand stretches before you.',
    'The desert sun beats down as mirages dance on the horizon.',
    'Ancient carved stones mark the desert trade routes.',
  ],
  'emerald-canopy': [
    'Sunlight filters through the enormous canopy above.',
    'The scent of flowers and rich earth fills your lungs.',
    'Vines and bridges connect the treehouse settlements.',
  ],
  'the-undercity': [
    'Flickering lanterns guide you into the underground markets.',
    'The cool, echoing tunnels swallow you whole.',
    'Whispers and the clink of coins fill the shadowy corridors.',
  ],
  'obsidian-citadel': [
    'The massive obsidian gates creak open before your caravan.',
    'Imperial banners flutter from the dark glass towers.',
    'Guards in black armor watch your every move.',
  ],
};

/** Marketplace haggling quips (shown randomly in buy/sell interactions) */
export const HAGGLING_QUIPS: string[] = [
  '"A fine choice! You have an eye for quality."',
  '"You drive a hard bargain, trader!"',
  '"At this price, I\'m practically giving it away!"',
  '"Pleasure doing business with you."',
  '"Come back anytime — I\'ll remember you!"',
  '"You won\'t find a better deal anywhere else!"',
  '"My grandmother would weep at these prices..."',
  '"I see you know your way around a marketplace."',
];

/** Turn milestone messages (special messages at round numbers) */
export const TURN_MILESTONES: Record<number, { message: string; emoji: string }> = {
  5: { message: 'Five turns in! You\'re getting the hang of this.', emoji: '🎯' },
  10: { message: 'Ten turns survived! A seasoned trader in the making.', emoji: '📊' },
  15: { message: 'Fifteen turns! The trade routes know your name.', emoji: '🗺️' },
  20: { message: 'Twenty turns! You\'re a legend in the making.', emoji: '⭐' },
  25: { message: 'Quarter century of turns! The world trembles at your arrival.', emoji: '👑' },
  30: { message: 'Thirty turns! Even the Ashen Throne respects you now.', emoji: '🏆' },
  40: { message: 'Forty turns! Master Trader status achieved!', emoji: '🎖️' },
  50: { message: 'Fifty turns! Victory is within your grasp!', emoji: '🏅' },
};
