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
    '🌸 Gulmohar trees burst into flame-red blossoms along the trade roads.',
    '� Elephants bathe in the river as your caravan passes.',
    '🌈 A rainbow arcs over the Ganges — an auspicious sign!',
    '🌱 Fresh mangoes appear at every roadside stall.',
  ],
  summer: [
    '☀️ The loo wind scorches the plains relentlessly.',
    '🏖️ Travelers seek shade under banyan trees along dusty roads.',
    '🔥 Heat mirages shimmer above the Thar Desert sands.',
    '🌅 Long golden evenings by the ghats give extra time for trading.',
  ],
  autumn: [
    '🪔 Diwali lanterns and oil lamps light up every village bazaar.',
    '� Festival fireworks illuminate the sky above the forts.',
    '🌾 Farmers bring overflowing bullock carts to harvest markets.',
    '� Peacocks dance in the fields as the monsoon retreats.',
  ],
  winter: [
    '❄️ Morning fog blankets the Indo-Gangetic plain.',
    '🏔️ Snow glistens on the distant Himalayan peaks.',
    '🧣 Your crew huddles around the campfire, sipping chai.',
    '🌙 Clear winter nights reveal a sky full of stars over the Deccan.',
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
  'mughal-court': [
    '"The Emperor\'s seal opens every gate. Earn it."',
    '"Bring tribute, and you bring respect."',
    '"The Red Fort remembers those who serve it well."',
    '"We judge not by words, but by the weight of your coffers."',
  ],
  'east-india-company': [
    '"The ledger tells us much about you, trader."',
    '"Cast your nets wide and your competitors will drown."',
    '"Every rupee was once a risk — start boldly."',
    '"The Company favors the efficient, but rewards the loyal."',
  ],
  'rajput-clans': [
    '"The desert sands bury cowards and forge warriors."',
    '"Ride with honour; the dunes reveal their secrets to the brave."',
    '"We trade in steel and trust. Earn both blade by blade."',
    '"Every fortress was once someone\'s impossible dream."',
  ],
  'brahmin-council': [
    '"The Vedas remember wisdom for a thousand ages."',
    '"Seek only what you need; give back what you can."',
    '"Even the mightiest temple grew from a single prayer."',
    '"We rise together, or we fade into dust."',
  ],
  'nightmarket-syndicate': [
    '"In the dark, gold shines brightest."',
    '"Information is the truest currency."',
    '"Trust is expensive. Betrayal costs more."',
    '"Everyone has a price. What\'s yours?"',
  ],
  'nizams-court': [
    '"Power flows to those who know how to serve it."',
    '"The Nizam sees all who come bearing gifts."',
    '"Loyalty today buys diamonds tomorrow."',
    '"In the shadow of Golconda, even traders can rise."',
  ],
};

/** Trade route names for display (flavor) */
export const TRADE_ROUTE_NAMES: Record<string, string> = {
  'delhi-kolkata': 'The Grand Trunk Road',
  'delhi-jaisalmer': 'The Silk Desert Road',
  'delhi-hyderabad': 'The Deccan Highway',
  'kolkata-varanasi': 'The Sacred River Route',
  'kolkata-bombay': 'The Coastal Spice Lane',
  'jaisalmer-bombay': 'The Salt Caravan Trail',
  'jaisalmer-hyderabad': 'The Diamond Dust Path',
  'varanasi-hyderabad': 'The Pilgrim\'s Passage',
  'bombay-hyderabad': 'The Nightrunner\'s Route',
  'bombay-jaisalmer': 'The Western Frontier Road',
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
  'delhi': { level: 'Moderate', color: 'text-amber-500', emoji: '⚠️' },
  'kolkata': { level: 'Safe', color: 'text-green-500', emoji: '🟢' },
  'jaisalmer': { level: 'Dangerous', color: 'text-red-500', emoji: '🔴' },
  'varanasi': { level: 'Safe', color: 'text-green-500', emoji: '🟢' },
  'bombay': { level: 'Dangerous', color: 'text-red-500', emoji: '🔴' },
  'hyderabad': { level: 'Very Dangerous', color: 'text-red-600', emoji: '💀' },
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
  'delhi': {
    spring: '🌤️ Warm breezes carry the scent of jasmine through the Red Fort gardens.',
    summer: '🔥 The loo wind bakes the sandstone streets. Seek shade in the bazaar.',
    autumn: '🌫️ Morning mist settles over the Yamuna riverbanks.',
    winter: '🌨️ Crisp Delhi winter — perfect chai weather by the roadside.',
  },
  'kolkata': {
    spring: '🌊 Gentle tides lap at the Hooghly docks.',
    summer: '⛵ Humid monsoon air and warm breezes — tea ships arrive daily.',
    autumn: '🌧️ Durga Puja festivities light up the rain-soaked streets.',
    winter: '❄️ Cool fog rolls in from the river at dawn.',
  },
  'jaisalmer': {
    spring: '🌵 Desert wildflowers bloom after rare rains near the dunes.',
    summer: '🥵 The Thar sands are hot enough to fry a chapati.',
    autumn: '🌅 Golden sandstorms paint the sky amber over the fort.',
    winter: '🌙 Freezing desert nights under crystal-clear stars.',
  },
  'varanasi': {
    spring: '🌸 The ghats are carpeted with marigold blossoms and incense smoke.',
    summer: '🦜 The monsoon swells the Ganges; pilgrims still come in droves.',
    autumn: '🍄 Wet season herbs and medicinal plants flourish along the river.',
    winter: '🌿 The ancient temples shimmer in cool, clear morning light.',
  },
  'bombay': {
    spring: '💡 Lantern-lit alleys bustle with merchants after dark.',
    summer: '🦇 The monsoon rains drive traders into the covered bazaars.',
    autumn: '🕯️ Festival lights decorate the harbour-side warehouses.',
    winter: '🔥 Warm braziers line the narrow lanes of the old port quarter.',
  },
  'hyderabad': {
    spring: '⚡ Thunderstorms roll over the Charminar and Golconda Fort.',
    summer: '🏰 The Deccan plateau shimmers in the relentless heat.',
    autumn: '🌑 Dark monsoon clouds gather around the Nizam\'s palaces.',
    winter: '🥶 Cool winds sweep across the rocky Deccan highlands.',
  },
};

/** Loading/title screen rotating quotes from NPCs */
export const TITLE_SCREEN_QUOTES: { text: string; author: string; emoji: string }[] = [
  { text: 'Hindustan gave us a first chance, and we stumbled. It gave us a second, and we fell. But we rose.', author: 'Silk, Master Negotiator', emoji: '⚖️' },
  { text: 'The Emperor\'s seal opens every gate. Earn it.', author: 'Grand Vizier Mirza', emoji: '👑' },
  { text: 'The ledger tells us much about you, trader.', author: 'Governor Whitfield', emoji: '📒' },
  { text: 'The desert sands bury cowards and forge warriors.', author: 'Thakur Bhairav Singh', emoji: '🏜️' },
  { text: 'Even the mightiest temple grew from a single prayer.', author: 'Pandit Devdas', emoji: '🙏' },
  { text: 'In the dark, gold shines brightest.', author: 'Shadow Whisper', emoji: '🕵️' },
  { text: 'Power flows to those who know how to serve it.', author: 'Diwan Quli Khan', emoji: '�' },
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
  'delhi': [
    'The scent of rosewater and sandalwood fills the air as you approach Chandni Chowk.',
    'Red sandstone walls of the great fort loom above the bustling bazaars.',
    'The rhythmic chanting of prayers echoes from the Jama Masjid.',
  ],
  'kolkata': [
    'Salt spray and the cry of river birds greet your caravan at the Hooghly docks.',
    'East India Company warehouses line the waterfront as you arrive.',
    'The clatter of tea crates and the bustle of longshoremen welcome you.',
  ],
  'jaisalmer': [
    'An endless sea of golden sand stretches before you, the fort rising like a mirage.',
    'The desert sun beats down as your camels trudge along the ancient caravan route.',
    'Carved havelis and sandstone walls mark the Golden City of the Rajputs.',
  ],
  'varanasi': [
    'Incense smoke and marigold garlands drift through the ancient ghats.',
    'The sacred Ganges glimmers in the light as temple bells ring.',
    'Pilgrims and scholars crowd the narrow stone lanes of the holy city.',
  ],
  'bombay': [
    'Flickering oil lamps guide you into the crowded harbour-side bazaars.',
    'The humid salt air and the clink of coins fill the narrow lanes.',
    'Whispers of contraband deals and rare spices echo from every alley.',
  ],
  'hyderabad': [
    'The massive gates of Golconda Fort creak open before your caravan.',
    'The Nizam\'s banners flutter from the minarets of the Charminar.',
    'Guards in jeweled turbans watch your every move.',
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
  30: { message: 'Thirty turns! Even the Nizam\'s Court respects you now.', emoji: '🏆' },
  40: { message: 'Forty turns! Master Trader status achieved!', emoji: '🎖️' },
  50: { message: 'Fifty turns! Victory is within your grasp!', emoji: '🏅' },
};
