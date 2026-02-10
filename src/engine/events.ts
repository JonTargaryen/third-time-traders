// ============================================================
// Engine — Random Events System
// ============================================================
import type {
  GameEvent,
  EventCategory,
  EventSeverity,
  RegionId,
  FactionId,
  Resources,
} from './types';
import { ALL_REGION_IDS, ALL_FACTION_IDS } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// Event Templates
// ============================================================

interface EventTemplate {
  category: EventCategory;
  titles: string[];
  descriptions: string[];
  severity: EventSeverity;
  regionScoped: boolean; // true = affects 1-2 regions; false = global
  factionScoped: boolean;
  resourceDelta: () => Partial<Resources>;
  reputationDelta: (factions: FactionId[]) => Partial<Record<FactionId, number>>;
  tradeMultiplier: number; // applied to affected region profits
  duration: number; // turns
  weight: number; // relative probability
}

const EVENT_TEMPLATES: EventTemplate[] = [
  // --- NATURAL DISASTERS ---
  {
    category: 'natural-disaster',
    titles: ['Earthquake!', 'Volcanic Eruption!', 'Landslide!'],
    descriptions: [
      'A devastating earthquake has shaken the region, destroying stockpiles and blocking trade paths.',
      'A volcano erupts violently, raining ash across the land and destroying fuel reserves.',
      'Massive landslides have buried roads and supply depots in the area.',
    ],
    severity: 'major',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({ fuel: -randomInt(10, 30), gold: -randomInt(15, 40) }),
    reputationDelta: () => ({}),
    tradeMultiplier: 0.3,
    duration: 3,
    weight: 6,
  },
  {
    category: 'natural-disaster',
    titles: ['Severe Storm', 'Flash Flooding', 'Drought Warning'],
    descriptions: [
      'A ferocious storm lashes the coast, damaging ships and flooding warehouses.',
      'Sudden flash floods sweep through lowland settlements, destroying food stores.',
      'A prolonged drought dries up water sources, threatening crops and livestock.',
    ],
    severity: 'moderate',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({ water: -randomInt(8, 20), food: -randomInt(5, 15) }),
    reputationDelta: () => ({}),
    tradeMultiplier: 0.6,
    duration: 2,
    weight: 10,
  },
  {
    category: 'natural-disaster',
    titles: ['Minor Tremor', 'Hailstorm'],
    descriptions: [
      'A minor tremor rattles buildings but causes limited damage.',
      'A sudden hailstorm damages some exposed supplies.',
    ],
    severity: 'minor',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({ gold: -randomInt(3, 10) }),
    reputationDelta: () => ({}),
    tradeMultiplier: 0.85,
    duration: 1,
    weight: 15,
  },

  // --- MARKET SHIFTS ---
  {
    category: 'market-shift',
    titles: ['Gold Rush!', 'Resource Boom!', 'Supply Surplus'],
    descriptions: [
      'A new gold vein has been discovered! Prices surge and opportunity abounds.',
      'A bumper harvest has flooded the market with cheap goods. Buy low!',
      'An excess of supplies means lower prices — stock up while you can.',
    ],
    severity: 'moderate',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({ gold: randomInt(10, 40) }),
    reputationDelta: () => ({}),
    tradeMultiplier: 1.5,
    duration: 3,
    weight: 12,
  },
  {
    category: 'market-shift',
    titles: ['Famine!', 'Scarcity Crisis', 'Trade Embargo'],
    descriptions: [
      'Crops have failed across the region. Food prices skyrocket and hunger spreads.',
      'Critical resources are running dangerously low. Prices spike as panic sets in.',
      'A trade embargo chokes supply lines. Essential goods become extremely expensive.',
    ],
    severity: 'major',
    regionScoped: true,
    factionScoped: true,
    resourceDelta: () => ({ food: -randomInt(10, 25) }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = -randomInt(3, 8)));
      return delta;
    },
    tradeMultiplier: 0.4,
    duration: 4,
    weight: 7,
  },
  {
    category: 'market-shift',
    titles: ['Price Fluctuation', 'Market Correction'],
    descriptions: [
      'Market forces cause a minor shift in commodity prices.',
      'A brief correction rebalances regional trade values.',
    ],
    severity: 'minor',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({}),
    reputationDelta: () => ({}),
    tradeMultiplier: randomChoice([0.8, 1.2]),
    duration: 1,
    weight: 20,
  },

  // --- FACTION CONFLICTS ---
  {
    category: 'faction-conflict',
    titles: ['Border Skirmish!', 'Trade War Erupts!', 'Faction Clash!'],
    descriptions: [
      'Two factions clash over border territories. Trade routes between them are disrupted.',
      'An economic trade war breaks out between rival factions. Commerce suffers.',
      'Old grudges boil over into open conflict. Travelers beware.',
    ],
    severity: 'major',
    regionScoped: false,
    factionScoped: true,
    resourceDelta: () => ({ gold: -randomInt(5, 20) }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = -randomInt(3, 10)));
      return delta;
    },
    tradeMultiplier: 0.5,
    duration: 3,
    weight: 8,
  },
  {
    category: 'faction-conflict',
    titles: ['Tensions Rise', 'Diplomatic Incident'],
    descriptions: [
      'Tensions between factions are increasing. Expect difficulties.',
      'A diplomatic incident strains relations and disrupts local trade.',
    ],
    severity: 'moderate',
    regionScoped: false,
    factionScoped: true,
    resourceDelta: () => ({}),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = -randomInt(2, 5)));
      return delta;
    },
    tradeMultiplier: 0.75,
    duration: 2,
    weight: 12,
  },

  // --- FACTION ALLIANCES ---
  {
    category: 'faction-alliance',
    titles: ['Alliance Formed!', 'Peace Treaty Signed!', 'Diplomatic Triumph!'],
    descriptions: [
      'Two factions have forged a new alliance! Trade between them flourishes.',
      'A historic peace treaty brings stability and prosperity to the region.',
      'Diplomatic breakthroughs improve relations and open new opportunities.',
    ],
    severity: 'major',
    regionScoped: false,
    factionScoped: true,
    resourceDelta: () => ({ gold: randomInt(10, 30) }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = randomInt(5, 15)));
      return delta;
    },
    tradeMultiplier: 1.4,
    duration: 4,
    weight: 6,
  },
  {
    category: 'faction-alliance',
    titles: ['Goodwill Gesture', 'Cultural Exchange'],
    descriptions: [
      'A faction sends a goodwill gift, warming relations.',
      'A cultural exchange program improves mutual understanding.',
    ],
    severity: 'minor',
    regionScoped: false,
    factionScoped: true,
    resourceDelta: () => ({ gold: randomInt(3, 10) }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = randomInt(2, 6)));
      return delta;
    },
    tradeMultiplier: 1.1,
    duration: 1,
    weight: 10,
  },

  // --- PIRATE RAIDS ---
  {
    category: 'pirate-raid',
    titles: ['Pirate Attack!', 'Bandit Ambush!', 'Raiders Strike!'],
    descriptions: [
      'Pirates intercept a trade caravan, stealing goods and injuring personnel.',
      'Bandits ambush traders on a remote route, seizing valuable cargo.',
      'A well-organized raiding party hits supply depots under cover of darkness.',
    ],
    severity: 'major',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({
      gold: -randomInt(20, 50),
      contraband: randomInt(2, 8),
    }),
    reputationDelta: () => ({}),
    tradeMultiplier: 0.6,
    duration: 2,
    weight: 9,
  },
  {
    category: 'pirate-raid',
    titles: ['Petty Theft', 'Supply Pilferage'],
    descriptions: [
      'Petty thieves make off with a small quantity of supplies.',
      'Someone has been skimming from the supply trains.',
    ],
    severity: 'minor',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({ gold: -randomInt(3, 10) }),
    reputationDelta: () => ({}),
    tradeMultiplier: 0.9,
    duration: 1,
    weight: 15,
  },

  // --- PLAGUE / DISEASE ---
  {
    category: 'plague',
    titles: ['Plague Outbreak!', 'Epidemic Spreads!'],
    descriptions: [
      'A deadly plague sweeps through the region, devastating the population and crippling trade.',
      'An epidemic forces quarantine. Movement and commerce grind to a halt.',
    ],
    severity: 'catastrophic',
    regionScoped: true,
    factionScoped: true,
    resourceDelta: () => ({
      food: -randomInt(15, 30),
      water: -randomInt(10, 20),
      gold: -randomInt(20, 50),
    }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = -randomInt(5, 12)));
      return delta;
    },
    tradeMultiplier: 0.2,
    duration: 5,
    weight: 3,
  },
  {
    category: 'plague',
    titles: ['Illness Spreads', 'Sickness in the Ranks'],
    descriptions: [
      'A mild illness spreads through the camp. Some personnel are affected.',
      'A bout of sickness slows operations temporarily.',
    ],
    severity: 'minor',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({ food: -randomInt(3, 8) }),
    reputationDelta: () => ({}),
    tradeMultiplier: 0.9,
    duration: 1,
    weight: 12,
  },

  // --- FESTIVALS & PROSPERITY ---
  {
    category: 'festival',
    titles: ['Grand Festival!', 'Harvest Celebration!', 'Trade Fair!'],
    descriptions: [
      'A grand festival attracts merchants from across the land. Trade booms!',
      'The annual harvest celebration brings abundance and goodwill.',
      'A regional trade fair opens, boosting commerce and relations.',
    ],
    severity: 'moderate',
    regionScoped: true,
    factionScoped: true,
    resourceDelta: () => ({
      gold: randomInt(15, 35),
      food: randomInt(5, 15),
    }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = randomInt(3, 8)));
      return delta;
    },
    tradeMultiplier: 1.6,
    duration: 2,
    weight: 8,
  },

  // --- SMUGGLING ---
  {
    category: 'smuggling',
    titles: ['Smuggling Ring Discovered!', 'Black Market Surge!'],
    descriptions: [
      'Authorities crack down on smugglers — contraband prices spike.',
      'A surge in black market activity floods the underground with goods.',
    ],
    severity: 'moderate',
    regionScoped: true,
    factionScoped: true,
    resourceDelta: () => ({
      contraband: randomInt(5, 15),
      information: randomInt(3, 8),
    }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = randomChoice([-5, -3, 2, 5])));
      return delta;
    },
    tradeMultiplier: 1.0,
    duration: 2,
    weight: 7,
  },

  // --- DISCOVERY ---
  {
    category: 'discovery',
    titles: ['Ancient Ruin Found!', 'Hidden Cache Discovered!', 'Lost Caravan Located!'],
    descriptions: [
      'Explorers uncover an ancient ruin filled with valuable artifacts.',
      'A hidden cache of supplies is found in an abandoned outpost.',
      'A lost caravan is located — its cargo is salvageable!',
    ],
    severity: 'moderate',
    regionScoped: true,
    factionScoped: false,
    resourceDelta: () => ({
      gold: randomInt(15, 40),
      information: randomInt(5, 12),
    }),
    reputationDelta: () => ({}),
    tradeMultiplier: 1.0,
    duration: 0,
    weight: 8,
  },

  // --- DIPLOMATIC ---
  {
    category: 'diplomatic',
    titles: ['Diplomatic Envoy', 'Trade Delegation Arrives'],
    descriptions: [
      'A diplomatic envoy arrives with gifts and proposals for cooperation.',
      'A foreign trade delegation seeks to establish new commercial ties.',
    ],
    severity: 'minor',
    regionScoped: false,
    factionScoped: true,
    resourceDelta: () => ({ gold: randomInt(5, 15) }),
    reputationDelta: (factions) => {
      const delta: Partial<Record<FactionId, number>> = {};
      factions.forEach((f) => (delta[f] = randomInt(3, 8)));
      return delta;
    },
    tradeMultiplier: 1.1,
    duration: 1,
    weight: 10,
  },
];

// ============================================================
// Utility Helpers
// ============================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandom<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

// ============================================================
// Event Generation
// ============================================================

/**
 * Generate 0-3 random events for a given turn.
 * Higher turns have slightly higher chance of events.
 */
export function generateTurnEvents(turn: number, discoveredRegions: RegionId[]): GameEvent[] {
  const events: GameEvent[] = [];

  // Base chance of an event: 60%, rising to 90% at turn 50
  const eventChance = Math.min(0.9, 0.6 + turn * 0.006);

  // How many events this turn (0-3)
  let eventCount = 0;
  if (Math.random() < eventChance) eventCount++;
  if (Math.random() < eventChance * 0.4) eventCount++;
  if (Math.random() < eventChance * 0.1) eventCount++;

  for (let i = 0; i < eventCount; i++) {
    const template = weightedRandomTemplate();
    const event = instantiateEvent(template, turn, discoveredRegions);
    events.push(event);
  }

  return events;
}

/**
 * Weighted random selection of an event template.
 */
function weightedRandomTemplate(): EventTemplate {
  const totalWeight = EVENT_TEMPLATES.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const template of EVENT_TEMPLATES) {
    roll -= template.weight;
    if (roll <= 0) return template;
  }
  return EVENT_TEMPLATES[EVENT_TEMPLATES.length - 1];
}

/**
 * Instantiate a concrete event from a template.
 */
function instantiateEvent(
  template: EventTemplate,
  turn: number,
  discoveredRegions: RegionId[]
): GameEvent {
  const regions = template.regionScoped
    ? pickRandom(discoveredRegions.length > 0 ? discoveredRegions : ALL_REGION_IDS, randomInt(1, 2))
    : [];

  const factions = template.factionScoped
    ? pickRandom(ALL_FACTION_IDS, randomInt(1, 2))
    : [];

  // Generate choices for major/catastrophic events
  const choices = generateEventChoices(template, factions);

  return {
    id: uuidv4(),
    category: template.category,
    severity: template.severity,
    title: randomChoice(template.titles),
    description: randomChoice(template.descriptions),
    turn,
    affectedRegions: regions,
    affectedFactions: factions,
    resourceDelta: template.resourceDelta(),
    reputationDelta: template.reputationDelta(factions),
    tradeMultiplier: template.tradeMultiplier,
    duration: template.duration,
    expiresOnTurn: turn + template.duration,
    dismissed: false,
    choices: choices.length > 0 ? choices : undefined,
  };
}

/**
 * Generate interactive choices for certain events.
 */
function generateEventChoices(
  template: EventTemplate,
  factions: FactionId[]
): import('./types').EventChoice[] {
  // Only generate choices for major/catastrophic severity
  if (template.severity !== 'major' && template.severity !== 'catastrophic') return [];

  const choices: import('./types').EventChoice[] = [];

  switch (template.category) {
    case 'pirate-raid':
      choices.push(
        {
          id: 'fight-back',
          label: '⚔️ Fight Back',
          description: 'Rally your guards to fight off the raiders.',
          resourceCost: { gold: 15 },
          resourceReward: { gold: randomInt(20, 50), contraband: randomInt(2, 6) },
          reputationDelta: {},
          successChance: 0.55,
          successText: 'Your guards repelled the raiders and recovered stolen goods!',
          failureText: 'The raiders were too strong. You lost gold and gained nothing.',
        },
        {
          id: 'pay-off',
          label: '💰 Pay Them Off',
          description: 'Bribe the raiders to leave you alone.',
          resourceCost: { gold: 30 },
          resourceReward: {},
          reputationDelta: {},
          successChance: 0.9,
          successText: 'The raiders took your gold and left peacefully.',
          failureText: 'They took your gold AND raided your supplies anyway!',
        }
      );
      break;

    case 'plague':
      choices.push(
        {
          id: 'quarantine',
          label: '🏥 Quarantine',
          description: 'Lock down operations to contain the spread.',
          resourceCost: { food: 10, water: 10 },
          resourceReward: {},
          reputationDelta: factions.length > 0 ? { [factions[0]]: 5 } : {},
          successChance: 0.75,
          successText: 'The quarantine contained the outbreak! Locals are grateful.',
          failureText: 'Despite your efforts, the plague spread further.',
        },
        {
          id: 'flee',
          label: '🏃 Evacuate',
          description: 'Move your operations out of the affected area.',
          resourceCost: { fuel: 15 },
          resourceReward: {},
          reputationDelta: factions.length > 0 ? { [factions[0]]: -3 } : {},
          successChance: 0.95,
          successText: 'You evacuated safely, avoiding the worst of the plague.',
          failureText: 'Some of your personnel got sick during the evacuation.',
        }
      );
      break;

    case 'faction-conflict':
      choices.push(
        {
          id: 'mediate',
          label: '🕊️ Mediate',
          description: 'Try to broker peace between the factions.',
          resourceCost: { gold: 20, information: 5 },
          resourceReward: { gold: 30 },
          reputationDelta: factions.reduce((acc, f) => ({ ...acc, [f]: 8 }), {} as Partial<Record<FactionId, number>>),
          successChance: 0.45,
          successText: 'Your mediation worked! Both sides appreciate your diplomacy.',
          failureText: 'Your peace efforts failed — both sides distrust you now.',
        },
        {
          id: 'profit',
          label: '💰 Profit from Chaos',
          description: 'Sell supplies to both sides at marked-up prices.',
          resourceCost: { food: 5, fuel: 5 },
          resourceReward: { gold: randomInt(30, 60) },
          reputationDelta: factions.reduce((acc, f) => ({ ...acc, [f]: -3 }), {} as Partial<Record<FactionId, number>>),
          successChance: 0.7,
          successText: 'You made a fortune selling to both sides of the conflict!',
          failureText: 'You were caught playing both sides. Neither trusts you.',
        }
      );
      break;

    case 'natural-disaster':
      choices.push(
        {
          id: 'help-rebuild',
          label: '🔨 Help Rebuild',
          description: 'Contribute resources to help the affected region recover.',
          resourceCost: { gold: 25, food: 10 },
          resourceReward: { information: 5 },
          reputationDelta: factions.length > 0 ? { [factions[0]]: 10 } : {},
          successChance: 0.85,
          successText: 'Your generosity earned you great respect in the region!',
          failureText: 'Your efforts were appreciated but the damage was too great.',
        },
        {
          id: 'scavenge',
          label: '🔍 Scavenge the Ruins',
          description: 'Search the debris for valuable resources.',
          resourceCost: {},
          resourceReward: { gold: randomInt(10, 30), fuel: randomInt(5, 15) },
          reputationDelta: factions.length > 0 ? { [factions[0]]: -5 } : {},
          successChance: 0.6,
          successText: 'You found valuable salvage in the wreckage!',
          failureText: 'Nothing of value was found, and locals are angry at your scavenging.',
        }
      );
      break;

    default:
      break;
  }

  return choices;
}

// ============================================================
// Event Processing
// ============================================================

/**
 * Prune expired events from the active list.
 */
export function pruneExpiredEvents(events: GameEvent[], currentTurn: number): GameEvent[] {
  return events.filter((e) => e.expiresOnTurn > currentTurn || e.duration === 0);
}

/**
 * Get the aggregate trade multiplier for a region from all active events.
 */
export function getRegionTradeMultiplier(events: GameEvent[], regionId: RegionId): number {
  let multiplier = 1.0;
  for (const event of events) {
    if (event.affectedRegions.length === 0 || event.affectedRegions.includes(regionId)) {
      multiplier *= event.tradeMultiplier;
    }
  }
  return Math.max(0.1, multiplier); // floor at 10%
}

/**
 * Get active events affecting a specific region.
 */
export function getEventsForRegion(events: GameEvent[], regionId: RegionId): GameEvent[] {
  return events.filter(
    (e) => e.affectedRegions.length === 0 || e.affectedRegions.includes(regionId)
  );
}

/**
 * Get active events involving a specific faction.
 */
export function getEventsForFaction(events: GameEvent[], factionId: FactionId): GameEvent[] {
  return events.filter(
    (e) => e.affectedFactions.length === 0 || e.affectedFactions.includes(factionId)
  );
}

/**
 * Count events by severity.
 */
export function countEventsBySeverity(events: GameEvent[]): Record<EventSeverity, number> {
  const counts: Record<EventSeverity, number> = { minor: 0, moderate: 0, major: 0, catastrophic: 0 };
  for (const e of events) {
    counts[e.severity]++;
  }
  return counts;
}

/**
 * Get severity display color.
 */
export function getSeverityColor(severity: EventSeverity): string {
  switch (severity) {
    case 'minor': return 'text-zinc-500';
    case 'moderate': return 'text-amber-500';
    case 'major': return 'text-orange-500';
    case 'catastrophic': return 'text-red-600';
  }
}

/**
 * Get category icon.
 */
export function getCategoryIcon(category: EventCategory): string {
  const icons: Record<EventCategory, string> = {
    'natural-disaster': '🌋',
    'market-shift': '📈',
    'faction-conflict': '⚔️',
    'faction-alliance': '🤝',
    'pirate-raid': '🏴‍☠️',
    'discovery': '🔍',
    'plague': '☠️',
    'festival': '🎉',
    'smuggling': '🕵️',
    'diplomatic': '🕊️',
  };
  return icons[category] || '📌';
}
