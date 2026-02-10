// ============================================================
// Zustand Game Store — Central Game State
// ============================================================
import { create } from 'zustand';
import type {
  GameState,
  GameTab,
  RegionId,
  FactionId,
  Resources,
  Personnel,
  Mission,
  Achievement,
  ScoutingMission,
  TurnSummary,
  TurnSummaryItem,
  TravelEncounter,
  VictoryCondition,
  Region,
} from '@/engine/types';
import { getSeason } from '@/engine/types';
import { createStartingResources } from '@/engine/inventory';
import { createStartingReputation, changeReputation, changeMultipleReputations, getRelationshipStatus } from '@/engine/reputation';
import { FACTIONS as FACTIONS_DATA } from '@/data/factions';
import { createInitialRegions, discoverRegion, createInitialCaravan, canTravel, canStartScoutingMission, canBuyMap } from '@/engine/world';
import { INITIAL_TRADE_ROUTES } from '@/data/tradeRoutes';
import { REGIONS as REGIONS_DATA } from '@/data/regions';
import { MISSION_TEMPLATES, DEFAULT_ACHIEVEMENTS } from '@/data/missions';
import {
  establishRoute as engineEstablishRoute,
  dismantleRoute as engineDismantleRoute,
} from '@/engine/trade';
import {
  createPersonnel,
  assignToRoute as engineAssignToRoute,
  unassignFromRoute as engineUnassignFromRoute,
  getHireCost,
  injurePersonnel,
} from '@/engine/personnel';
import { addResources, removeResources } from '@/engine/inventory';
import { generateTurnEvents, pruneExpiredEvents, getRegionTradeMultiplier } from '@/engine/events';
import { createInitialFactionRelations, shiftRelation } from '@/engine/factionRelations';
import { createInitialMarket, applyMarketFluctuations, applyEventToMarket } from '@/engine/market';
import { createPlayerProfile } from '@/engine/leaderboard';
import { BASE_INCOME, CARAVAN_UPKEEP, PERSONNEL_UPKEEP_GOLD, VICTORY_CONDITIONS } from '@/lib/constants';
import { logAction } from '@/lib/persistence';
import { v4 as uuidv4 } from 'uuid';

export interface GameActions {
  // Game lifecycle
  newGame: (playerName?: string) => void;
  setPhase: (phase: GameState['phase']) => void;

  // Navigation
  setActiveTab: (tab: GameTab) => void;
  selectRegion: (regionId: RegionId | null) => void;

  // World
  discoverRegion: (regionId: RegionId) => void;

  // Travel (new!)
  travelTo: (regionId: RegionId) => { success: boolean; message: string };

  // Scouting (new!)
  sendScout: (targetRegion: RegionId) => { success: boolean; message: string };
  processScoutingMissions: () => void;

  // Marketplace (new!)
  buyResource: (regionId: RegionId, resourceType: keyof Resources, amount: number) => { success: boolean; message: string; cost?: number };
  sellResource: (regionId: RegionId, resourceType: keyof Resources, amount: number) => { success: boolean; message: string; earned?: number };
  buyMap: (targetRegion: RegionId) => { success: boolean; message: string };

  // Resources
  addResources: (resources: Partial<Resources>) => void;

  // Reputation
  changeReputation: (factionId: FactionId, delta: number) => void;

  // Trade routes
  establishRoute: (routeId: string) => boolean;
  dismantleRoute: (routeId: string) => boolean;

  // Personnel
  hirePersonnel: (role: Personnel['role']) => boolean;
  assignPersonnel: (personnelId: string, routeId: string) => boolean;
  unassignPersonnel: (personnelId: string) => boolean;

  // Events
  dismissEvent: (eventId: string) => void;
  dismissAllEvents: () => void;
  makeEventChoice: (eventId: string, choiceId: string) => void;

  // Gather actions
  performGatherAction: (regionId: RegionId, actionId: string) => { success: boolean; message: string };

  // Missions
  acceptMission: (missionId: string) => void;
  checkMissionProgress: () => void;
  generateNewMissions: () => void;

  // Turn
  advanceTurn: () => void;
  dismissTurnSummary: () => void;

  // Victory
  getVictoryConditions: () => VictoryCondition[];

  // Save/Load
  getSaveData: () => string;
  loadSaveData: (data: string) => boolean;
}

export type GameStore = GameState & GameActions;

function createInitialState(playerName: string = 'Trader'): GameState {
  return {
    phase: 'title',
    turn: 0,
    resources: createStartingResources(),
    reputation: createStartingReputation(),
    regions: createInitialRegions(),
    tradeRoutes: INITIAL_TRADE_ROUTES.map((r) => ({ ...r })),
    personnel: [],
    activeTab: 'world',
    selectedRegion: null,
    events: [],
    eventLog: [],
    factionRelations: createInitialFactionRelations(),
    market: createInitialMarket(),
    player: createPlayerProfile(playerName),
    pendingEventNotification: false,
    goldHistory: [],
    missions: [],
    completedMissions: [],
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
    gatherCooldowns: {},
    actionLog: [],
    caravan: createInitialCaravan(),
    scoutingMissions: [],
    turnSummary: null,
    showTurnSummary: false,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  newGame: (playerName?: string) => {
    const state = createInitialState(playerName || 'Trader');
    set({ ...state, phase: 'playing', turn: 1 });
    // Generate initial missions
    setTimeout(() => get().generateNewMissions(), 0);
    logAction(1, 'new-game', `New game started by ${playerName || 'Trader'}`, 'system');
  },

  setPhase: (phase) => set({ phase }),

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    logAction(get().turn, 'tab-change', `Switched to ${tab}`, 'system');
  },

  selectRegion: (regionId) => {
    set({ selectedRegion: regionId });
    if (regionId) {
      logAction(get().turn, 'select-region', `Selected region: ${regionId}`, 'explore');
    }
  },

  discoverRegion: (regionId) => {
    const { regions, turn } = get();
    set({ regions: discoverRegion(regions, regionId) });
    logAction(turn, 'discover-region', `Discovered: ${regionId}`, 'explore');
    // Check mission progress after discovery
    setTimeout(() => get().checkMissionProgress(), 0);
  },

  // ============================================================
  // Travel System
  // ============================================================
  travelTo: (regionId) => {
    const { regions, resources, caravan, turn, reputation } = get();
    const result = canTravel(regions, caravan.currentRegion, regionId, resources.fuel, caravan);
    
    if (!result.canTravel) {
      return { success: false, message: result.reason || 'Cannot travel there.' };
    }

    // Reputation consequence: hostile factions add +50% fuel cost to travel through their territory
    const destRegion = regions[regionId];
    const destFactionStatus = getRelationshipStatus(reputation, destRegion.factionId);
    const baseFuelCost = result.cost!.fuel;
    const fuelCost = destFactionStatus === 'hostile'
      ? Math.ceil(baseFuelCost * 1.5)
      : baseFuelCost;

    if (resources.fuel < fuelCost) {
      return { success: false, message: `Not enough fuel! Hostile territory costs extra. Need ${fuelCost}, have ${resources.fuel}.` };
    }

    const newResources = { ...resources, fuel: resources.fuel - fuelCost };
    const newCaravan = { ...caravan, currentRegion: regionId };
    
    set({ resources: newResources, caravan: newCaravan });
    const hostileSurcharge = destFactionStatus === 'hostile' ? ' (⚠️ +50% hostile surcharge!)' : '';
    logAction(turn, 'travel', `Traveled to ${regionId} (cost: ${fuelCost} fuel${hostileSurcharge})`, 'explore');
    
    return { success: true, message: `Arrived at ${regions[regionId].name}! Used ${fuelCost} fuel.${hostileSurcharge}` };
  },

  // ============================================================
  // Scouting System
  // ============================================================
  sendScout: (targetRegion) => {
    const { regions, caravan, personnel, resources, turn, scoutingMissions } = get();
    const result = canStartScoutingMission(regions, caravan.currentRegion, targetRegion, personnel, resources.gold);
    
    if (!result.canStart) {
      return { success: false, message: result.reason || 'Cannot scout there.' };
    }

    const scout = personnel.find((p) => p.role === 'scout' && p.status === 'available');
    if (!scout) return { success: false, message: 'No available scouts.' };

    const target = regions[targetRegion];
    const discovery = target.discoveryRequirements ?? REGIONS_DATA[targetRegion]?.discoveryRequirements;
    const scoutCost = discovery?.scoutCost ?? { turns: 2, successChance: 0.7 };
    const minGold = discovery?.minimumGold ?? 50;
    const returnTurn = turn + scoutCost.turns;

    // Update scout status
    const updatedPersonnel = personnel.map((p) =>
      p.id === scout.id ? { ...p, status: 'scouting' as const, scoutingRegion: targetRegion, scoutingReturnTurn: returnTurn } : p
    );

    // Deduct gold for expedition
    const newResources = { ...resources, gold: resources.gold - minGold };

    // Add scouting mission
    const newMission: ScoutingMission = {
      id: uuidv4(),
      personnelId: scout.id,
      targetRegion,
      startTurn: turn,
      returnTurn,
      successChance: scoutCost.successChance + (scout.skill * 0.03), // skill bonus
      status: 'in-progress',
    };

    set({
      personnel: updatedPersonnel,
      resources: newResources,
      scoutingMissions: [...scoutingMissions, newMission],
    });

    logAction(turn, 'send-scout', `Sent ${scout.name} to scout ${targetRegion}`, 'explore');
    return { success: true, message: `${scout.name} is scouting ${target.name}. Returns in ${scoutCost.turns} turns.` };
  },

  processScoutingMissions: () => {
    const { scoutingMissions, personnel, regions, turn } = get();
    const completedMissions: ScoutingMission[] = [];
    const ongoingMissions: ScoutingMission[] = [];
    let updatedRegions = { ...regions };
    let updatedPersonnel = [...personnel];

    for (const mission of scoutingMissions) {
      if (mission.status !== 'in-progress') continue;
      
      if (turn >= mission.returnTurn) {
        // Mission complete — check success
        const success = Math.random() < mission.successChance;
        const completedMission = { ...mission, status: success ? 'succeeded' as const : 'failed' as const };
        completedMissions.push(completedMission);

        // Update scout
        updatedPersonnel = updatedPersonnel.map((p) =>
          p.id === mission.personnelId
            ? { ...p, status: 'available' as const, scoutingRegion: undefined, scoutingReturnTurn: undefined }
            : p
        );

        if (success) {
          // Discover the region!
          updatedRegions = discoverRegion(updatedRegions, mission.targetRegion);
          logAction(turn, 'scout-success', `Scout discovered ${mission.targetRegion}!`, 'explore');
        } else {
          logAction(turn, 'scout-fail', `Scout failed to map ${mission.targetRegion}`, 'explore');
        }
      } else {
        ongoingMissions.push(mission);
      }
    }

    set({
      scoutingMissions: ongoingMissions,
      personnel: updatedPersonnel,
      regions: updatedRegions,
    });
  },

  // ============================================================
  // Marketplace System
  // ============================================================
  buyResource: (regionId, resourceType, amount) => {
    const { regions, resources, caravan, turn, reputation } = get();
    
    if (caravan.currentRegion !== regionId) {
      return { success: false, message: 'You must be at this location to buy.' };
    }

    const region = regions[regionId];

    // Reputation consequence: hostile factions block marketplace
    const status = getRelationshipStatus(reputation, region.factionId);
    if (status === 'hostile') {
      return { success: false, message: `🚫 The ${FACTIONS_DATA[region.factionId]?.name || region.factionId} refuse to trade with you! Improve your reputation first.` };
    }

    const item = region.marketplace.find((m) => m.resourceType === resourceType && m.action === 'sell');
    if (!item) {
      return { success: false, message: `${resourceType} is not available for purchase here.` };
    }

    if (item.available !== -1 && amount > item.available) {
      return { success: false, message: `Only ${item.available} units available.` };
    }

    // Reputation-based price modifier
    const repPriceModifier = status === 'unfriendly' ? 1.25
      : status === 'allied' ? 0.85
      : 1.0;

    const unitPrice = Math.ceil(item.basePrice * item.priceModifier * repPriceModifier);
    const totalCost = unitPrice * amount;

    if (resources.gold < totalCost) {
      return { success: false, message: `Need ${totalCost} gold, have ${resources.gold}.` };
    }

    // Update resources — handle gold-for-gold case where spread would overwrite
    const newResources = { ...resources };
    newResources.gold = resources.gold - totalCost;
    newResources[resourceType] = newResources[resourceType] + amount;

    // Update marketplace availability
    const newMarketplace = region.marketplace.map((m) =>
      m === item && m.available !== -1 ? { ...m, available: m.available - amount } : m
    );
    const newRegions = {
      ...regions,
      [regionId]: { ...region, marketplace: newMarketplace },
    };

    set({ resources: newResources, regions: newRegions });
    logAction(turn, 'buy', `Bought ${amount} ${resourceType} for ${totalCost} gold`, 'trade');
    return { success: true, message: `Bought ${amount} ${resourceType} for ${totalCost} gold.`, cost: totalCost };
  },

  sellResource: (regionId, resourceType, amount) => {
    const { regions, resources, caravan, turn, reputation } = get();
    
    if (caravan.currentRegion !== regionId) {
      return { success: false, message: 'You must be at this location to sell.' };
    }

    const region = regions[regionId];

    // Reputation consequence: hostile factions block marketplace
    const status = getRelationshipStatus(reputation, region.factionId);
    if (status === 'hostile') {
      return { success: false, message: `🚫 The ${FACTIONS_DATA[region.factionId]?.name || region.factionId} refuse to trade with you! Improve your reputation first.` };
    }

    const item = region.marketplace.find((m) => m.resourceType === resourceType && m.action === 'buy');
    if (!item) {
      return { success: false, message: `This location doesn't buy ${resourceType}.` };
    }

    if (resources[resourceType] < amount) {
      return { success: false, message: `You only have ${resources[resourceType]} ${resourceType}.` };
    }

    // Negotiators give a bonus!
    const negotiators = get().personnel.filter((p) => p.role === 'negotiator' && p.status === 'available');
    const negotiatorBonus = negotiators.length > 0 ? 1 + (negotiators[0].skill * 0.05) : 1;

    // Reputation-based price modifier for selling
    const repPriceModifier = status === 'unfriendly' ? 0.75
      : status === 'allied' ? 1.15
      : 1.0;

    const unitPrice = Math.ceil(item.basePrice * item.priceModifier * negotiatorBonus * repPriceModifier);
    const totalEarned = unitPrice * amount;

    // Update resources — handle gold-for-gold case where spread would overwrite
    const newResources = { ...resources };
    newResources[resourceType] = newResources[resourceType] - amount;
    newResources.gold = newResources.gold + totalEarned;

    // Small reputation boost for trading
    const factionId = region.factionId;
    const newReputation = changeReputation(reputation, factionId, 1);

    set({ resources: newResources, reputation: newReputation });
    logAction(turn, 'sell', `Sold ${amount} ${resourceType} for ${totalEarned} gold`, 'trade');
    return { success: true, message: `Sold ${amount} ${resourceType} for ${totalEarned} gold.`, earned: totalEarned };
  },

  buyMap: (targetRegion) => {
    const { regions, resources, turn } = get();
    const result = canBuyMap(regions, targetRegion, { gold: resources.gold, information: resources.information });

    if (!result.canBuy) {
      return { success: false, message: result.reason || 'Cannot buy map.' };
    }

    const newResources = {
      ...resources,
      gold: resources.gold - (result.cost?.gold || 0),
      information: resources.information - (result.cost?.information || 0),
    };

    const newRegions = discoverRegion(regions, targetRegion);

    set({ resources: newResources, regions: newRegions });
    logAction(turn, 'buy-map', `Purchased map for ${targetRegion}`, 'explore');

    // Check mission progress
    setTimeout(() => get().checkMissionProgress(), 0);

    return { success: true, message: `Map purchased! ${regions[targetRegion].name} is now discovered.` };
  },

  addResources: (resources) => {
    set({ resources: addResources(get().resources, resources) });
  },

  changeReputation: (factionId, delta) => {
    set({ reputation: changeReputation(get().reputation, factionId, delta) });
    logAction(get().turn, 'reputation-change', `${factionId}: ${delta > 0 ? '+' : ''}${delta}`, 'reputation');
  },

  establishRoute: (routeId) => {
    const { tradeRoutes, resources, reputation, turn } = get();
    const routeIndex = tradeRoutes.findIndex((r) => r.id === routeId);
    if (routeIndex === -1) return false;

    const route = tradeRoutes[routeIndex];
    const result = engineEstablishRoute(route, resources, reputation);
    if (!result) return false;

    const newRoutes = [...tradeRoutes];
    newRoutes[routeIndex] = result.route;
    set({
      tradeRoutes: newRoutes,
      resources: result.resources,
      reputation: result.reputation,
    });
    logAction(turn, 'establish-route', `Established: ${routeId}`, 'trade');
    // Check mission progress
    setTimeout(() => get().checkMissionProgress(), 0);
    return true;
  },

  dismantleRoute: (routeId) => {
    const { tradeRoutes, resources, reputation, turn } = get();
    const routeIndex = tradeRoutes.findIndex((r) => r.id === routeId);
    if (routeIndex === -1) return false;

    const route = tradeRoutes[routeIndex];
    const result = engineDismantleRoute(route, resources, reputation);
    if (!result) return false;

    const newRoutes = [...tradeRoutes];
    newRoutes[routeIndex] = result.route;
    set({
      tradeRoutes: newRoutes,
      resources: result.resources,
      reputation: result.reputation,
    });
    logAction(turn, 'dismantle-route', `Dismantled: ${routeId}`, 'trade');
    return true;
  },

  hirePersonnel: (role) => {
    const { resources, personnel, turn } = get();
    const person = createPersonnel(role);
    const cost = getHireCost(role, person.skill);
    const newResources = removeResources(resources, { gold: cost });
    if (!newResources) return false;

    set({
      resources: newResources,
      personnel: [...personnel, person],
    });
    logAction(turn, 'hire-personnel', `Hired ${person.name} (${role})`, 'personnel');
    return true;
  },

  assignPersonnel: (personnelId, routeId) => {
    const { personnel } = get();
    const index = personnel.findIndex((p) => p.id === personnelId);
    if (index === -1) return false;

    const result = engineAssignToRoute(personnel[index], routeId);
    if (!result) return false;

    const newPersonnel = [...personnel];
    newPersonnel[index] = result;
    set({ personnel: newPersonnel });
    logAction(get().turn, 'assign-personnel', `Assigned ${result.name} to ${routeId}`, 'personnel');
    return true;
  },

  unassignPersonnel: (personnelId) => {
    const { personnel } = get();
    const index = personnel.findIndex((p) => p.id === personnelId);
    if (index === -1) return false;

    const result = engineUnassignFromRoute(personnel[index]);
    if (!result) return false;

    const newPersonnel = [...personnel];
    newPersonnel[index] = result;
    set({ personnel: newPersonnel });
    return true;
  },

  dismissEvent: (eventId) => {
    const { events } = get();
    const newEvents = events.map((e) => (e.id === eventId ? { ...e, dismissed: true } : e));
    set({
      events: newEvents,
      pendingEventNotification: newEvents.some((e) => !e.dismissed),
    });
    logAction(get().turn, 'dismiss-event', `Dismissed event: ${eventId}`, 'event');
  },

  dismissAllEvents: () => {
    const { events } = get();
    set({
      events: events.map((e) => ({ ...e, dismissed: true })),
      pendingEventNotification: false,
    });
  },

  makeEventChoice: (eventId, choiceId) => {
    const { events, resources, reputation, turn } = get();
    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return;
    const event = events[eventIndex];
    const choice = event.choices?.find((c) => c.id === choiceId);
    if (!choice) return;

    const afterCost = removeResources(resources, choice.resourceCost);
    if (!afterCost) return;

    const success = Math.random() < choice.successChance;
    let newResources = afterCost;
    let newReputation = reputation;

    if (success) {
      newResources = addResources(newResources, choice.resourceReward);
      if (Object.keys(choice.reputationDelta).length > 0) {
        newReputation = changeMultipleReputations(newReputation, choice.reputationDelta);
      }
    }

    const updatedEvents = [...events];
    updatedEvents[eventIndex] = {
      ...event,
      choiceMade: choiceId,
      outcomeText: success ? choice.successText : choice.failureText,
      dismissed: true,
    };

    set({
      events: updatedEvents,
      resources: newResources,
      reputation: newReputation,
    });
    logAction(turn, 'event-choice', `Choice "${choice.label}" on "${event.title}" — ${success ? 'Success' : 'Failed'}`, 'event');
  },

  performGatherAction: (regionId, actionId) => {
    const { regions, turn, gatherCooldowns, reputation, resources } = get();
    const region = regions[regionId];
    if (!region || !region.discovered) return { success: false, message: 'Region not accessible!' };

    // Reputation consequence: hostile factions lock gather actions
    const gatherStatus = getRelationshipStatus(reputation, region.factionId);
    if (gatherStatus === 'hostile') {
      return { success: false, message: `🔒 The ${FACTIONS_DATA[region.factionId]?.name || region.factionId} forbid you from gathering in their territory! Improve your reputation first.` };
    }

    const action = region.gatherActions?.find((a) => a.id === actionId);
    if (!action) return { success: false, message: 'Action not found!' };

    // Check cooldown
    const cooldownUntil = gatherCooldowns[actionId] || 0;
    if (turn < cooldownUntil) {
      return { success: false, message: `On cooldown! Available in ${cooldownUntil - turn} turn(s).` };
    }

    // Check reputation requirement
    if (action.requiredReputation) {
      const { factionId, minimum } = action.requiredReputation;
      if (reputation[factionId] < minimum) {
        return { success: false, message: `Need ${minimum} reputation with ${factionId}. You have ${reputation[factionId]}.` };
      }
    }

    // Roll for success — friendly/allied factions give a small chance bonus
    const roll = Math.random();
    const friendlyBonus = gatherStatus === 'allied' ? 0.10 : gatherStatus === 'friendly' ? 0.05 : 0;
    const success = roll < (action.successChance + friendlyBonus);

    // Set cooldown regardless
    const newCooldowns = { ...gatherCooldowns, [actionId]: turn + action.cooldownTurns };

    if (success) {
      // Allied factions give bonus gather rewards (+30%)
      const rewardMultiplier = gatherStatus === 'allied' ? 1.3 : 1.0;
      const boostedReward: Partial<Resources> = {};
      for (const [k, v] of Object.entries(action.resourceReward)) {
        if (v) boostedReward[k as keyof Resources] = Math.ceil(v * rewardMultiplier);
      }
      const newResources = addResources(resources, boostedReward);
      // Small reputation bonus for gathering in a faction's region
      const newReputation = changeReputation(get().reputation, region.factionId, 2);
      set({
        resources: newResources,
        reputation: newReputation,
        gatherCooldowns: newCooldowns,
      });
      logAction(turn, 'gather-success', `${action.name} in ${region.name} — Success!`, 'gather');
      // Check mission progress
      setTimeout(() => get().checkMissionProgress(), 0);
      const rewardText = Object.entries(boostedReward).map(([k, v]) => `+${v} ${k}`).join(', ');
      const allyBonusText = gatherStatus === 'allied' ? ' (🤝 ally bonus!)' : '';
      return { success: true, message: `${action.emoji} Success! Got ${rewardText}${allyBonusText}` };
    } else {
      set({ gatherCooldowns: newCooldowns });
      logAction(turn, 'gather-fail', `${action.name} in ${region.name} — Failed`, 'gather');
      return { success: false, message: `😅 Didn't work this time! Try again later.` };
    }
  },

  acceptMission: (missionId) => {
    const { missions, turn } = get();
    const idx = missions.findIndex((m) => m.id === missionId);
    if (idx === -1) return;

    const updated = [...missions];
    updated[idx] = { ...updated[idx], status: 'active', acceptedOnTurn: turn };
    set({ missions: updated });
    logAction(turn, 'accept-mission', `Accepted: ${updated[idx].title}`, 'mission');
  },

  checkMissionProgress: () => {
    const state = get();
    const { missions, resources, reputation, regions, tradeRoutes, turn, completedMissions } = state;
    let changed = false;
    const newMissions = missions.map((m) => {
      if (m.status !== 'active') return m;

      // Check if expired
      if (m.acceptedOnTurn && turn > m.acceptedOnTurn + m.turnLimit) {
        changed = true;
        logAction(turn, 'mission-expired', `Expired: ${m.title}`, 'mission');
        return { ...m, status: 'expired' as const };
      }

      // Check objective progress
      const updatedObjectives = m.objectives.map((obj) => {
        let current = obj.current;
        let completed = obj.completed;

        switch (obj.type) {
          case 'gather-resource':
            current = resources[obj.target as keyof Resources] || 0;
            completed = current >= obj.amount;
            break;
          case 'reach-reputation':
            current = reputation[obj.target as FactionId] || 0;
            completed = current >= obj.amount;
            break;
          case 'discover-region':
            // Check if any adjacent undiscovered region to target was discovered
            const targetRegion = regions[obj.target as RegionId];
            if (targetRegion) {
              const adjDiscovered = targetRegion.adjacentRegions.filter(
                (id) => regions[id]?.discovered
              ).length;
              current = adjDiscovered > 0 || regions[obj.target as RegionId]?.discovered ? 1 : 0;
              // Actually: just check if the target region itself is discovered
              current = regions[obj.target as RegionId]?.discovered ? 1 : 0;
            }
            completed = current >= obj.amount;
            break;
          case 'establish-route': {
            const routesForRegion = tradeRoutes.filter(
              (r) => (r.from === obj.target || r.to === obj.target) && r.established
            );
            current = routesForRegion.length;
            completed = current >= obj.amount;
            break;
          }
          case 'deliver-resource':
            current = resources[obj.target as keyof Resources] || 0;
            completed = current >= obj.amount;
            break;
        }

        return { ...obj, current, completed };
      });

      const allComplete = updatedObjectives.every((o) => o.completed);
      if (allComplete) {
        changed = true;
      }

      return { ...m, objectives: updatedObjectives };
    });

    // Process completions
    const newCompletedMissions = [...completedMissions];
    const finalMissions = newMissions.map((m) => {
      if (m.status === 'active' && m.objectives.every((o) => o.completed)) {
        // Award rewards
        const newRes = addResources(state.resources, m.rewards.resources);
        let newRep = state.reputation;
        if (m.rewards.reputation) {
          newRep = changeMultipleReputations(newRep, m.rewards.reputation);
        }
        set({ resources: newRes, reputation: newRep });
        newCompletedMissions.push(m.id);
        logAction(turn, 'mission-complete', `Completed: ${m.title}`, 'mission');
        changed = true;
        return { ...m, status: 'completed' as const };
      }
      return m;
    });

    if (changed) {
      // Check achievements
      const newAchievements = checkAchievements(state, finalMissions, newCompletedMissions);
      set({
        missions: finalMissions,
        completedMissions: newCompletedMissions,
        achievements: newAchievements,
      });
    }
  },

  generateNewMissions: () => {
    const { missions, completedMissions } = get();
    // Remove expired/completed missions; keep active ones
    const activeMissions = missions.filter((m) => m.status === 'active' || m.status === 'available');

    // Only generate if fewer than 3 available missions
    const available = activeMissions.filter((m) => m.status === 'available');
    if (available.length >= 3) return;

    const needed = 3 - available.length;
    const possibleTemplates = MISSION_TEMPLATES.filter(
      (t) => !completedMissions.includes(t.title) && !activeMissions.some((m) => m.title === t.title)
    );

    const shuffled = [...possibleTemplates].sort(() => Math.random() - 0.5);
    const newMissions: Mission[] = shuffled.slice(0, needed).map((template) => ({
      ...template,
      id: uuidv4(),
      status: 'available' as const,
      objectives: template.objectives.map((o) => ({ ...o, id: uuidv4() })),
    }));

    set({
      missions: [...activeMissions, ...newMissions],
    });
  },

  advanceTurn: () => {
    const state = get();
    const newTurn = state.turn + 1;
    const season = getSeason(newTurn);
    const summaryItems: TurnSummaryItem[] = [];

    // Seasonal multipliers
    const seasonMultipliers: Record<string, Partial<Record<string, number>>> = {
      spring: { food: 1.3, water: 1.2 },
      summer: { fuel: 0.8, water: 0.7 },
      autumn: { food: 1.5, gold: 1.1 },
      winter: { food: 0.6, fuel: 1.4, water: 0.8 },
    };
    const seasonMod = seasonMultipliers[season] || {};

    // Track net resource changes this turn
    const startResources = { ...state.resources };

    // 0. Base income (every turn)
    let newResources = addResources({ ...state.resources }, BASE_INCOME);
    summaryItems.push({
      icon: '💵',
      text: `Base income: +${BASE_INCOME.gold}g, +${BASE_INCOME.food} food, +${BASE_INCOME.fuel} fuel, +${BASE_INCOME.water} water`,
      type: 'income',
    });

    // 0b. CARAVAN UPKEEP — your crew needs food and water
    const upkeepFood = CARAVAN_UPKEEP.food;
    const upkeepWater = CARAVAN_UPKEEP.water;
    newResources = { ...newResources, food: Math.max(0, newResources.food - upkeepFood), water: Math.max(0, newResources.water - upkeepWater) };
    summaryItems.push({
      icon: '🍽️',
      text: `Caravan upkeep: -${upkeepFood} food, -${upkeepWater} water`,
      type: 'upkeep',
    });

    // 0c. PERSONNEL UPKEEP — each hired person costs gold
    const alivePersonnel = state.personnel.filter((p) => p.status !== 'dead');
    const personnelCost = alivePersonnel.length * PERSONNEL_UPKEEP_GOLD;
    if (personnelCost > 0) {
      newResources = { ...newResources, gold: Math.max(0, newResources.gold - personnelCost) };
      summaryItems.push({
        icon: '👥',
        text: `Personnel wages: -${personnelCost}g (${alivePersonnel.length} staff)`,
        type: 'upkeep',
      });
    }

    // Season info
    summaryItems.push({
      icon: season === 'spring' ? '🌱' : season === 'summer' ? '☀️' : season === 'autumn' ? '🍂' : '❄️',
      text: `Season: ${season.charAt(0).toUpperCase() + season.slice(1)} — ${
        season === 'spring' ? 'food & water production up!'
        : season === 'summer' ? 'fuel & water production down'
        : season === 'autumn' ? 'food & gold production up!'
        : 'food down, fuel demand up'
      }`,
      type: 'season',
    });

    // 1. Collect trade profits (with event multipliers, season & reputation)
    let totalTradeGold = 0;
    for (const route of state.tradeRoutes) {
      if (!route.established) continue;
      const multiplier = getRegionTradeMultiplier(state.events, route.from);

      // Reputation consequence: hostile factions halve trade route profits
      const fromFaction = state.regions[route.from]?.factionId;
      const toFaction = state.regions[route.to]?.factionId;
      const fromStatus = fromFaction ? getRelationshipStatus(state.reputation, fromFaction) : 'neutral';
      const toStatus = toFaction ? getRelationshipStatus(state.reputation, toFaction) : 'neutral';
      const repRouteMultiplier =
        (fromStatus === 'hostile' || toStatus === 'hostile') ? 0.5
        : (fromStatus === 'allied' || toStatus === 'allied') ? 1.2
        : 1.0;

      for (const [key, value] of Object.entries(route.profitPerTurn)) {
        if (value) {
          const sMod = (seasonMod[key] as number) ?? 1.0;
          const adjusted = Math.floor(value * multiplier * sMod * repRouteMultiplier);
          newResources[key as keyof Resources] = (newResources[key as keyof Resources] || 0) + adjusted;
          if (key === 'gold') totalTradeGold += adjusted;
        }
      }
    }
    const establishedCount = state.tradeRoutes.filter((r) => r.established).length;
    if (establishedCount > 0) {
      summaryItems.push({
        icon: '📊',
        text: `Trade route profits from ${establishedCount} route${establishedCount > 1 ? 's' : ''}: +${totalTradeGold}g`,
        type: 'trade',
      });
    }

    // 2. Generate new events
    const discoveredRegions = Object.values(state.regions)
      .filter((r) => r.discovered)
      .map((r) => r.id);
    const newEvents = generateTurnEvents(newTurn, discoveredRegions);

    // 3. Apply event effects
    let newReputation = state.reputation;
    for (const event of newEvents) {
      newResources = addResources(newResources, event.resourceDelta);
      if (Object.keys(event.reputationDelta).length > 0) {
        newReputation = changeMultipleReputations(newReputation, event.reputationDelta);
      }
    }
    if (newEvents.length > 0) {
      for (const event of newEvents) {
        summaryItems.push({
          icon: event.severity === 'catastrophic' ? '🔥' : event.severity === 'major' ? '⚡' : '📰',
          text: `${event.title} (${event.severity})`,
          type: 'event',
        });
      }
    }

    // 4. Personnel hazards
    let newPersonnel = [...state.personnel];
    for (const event of newEvents) {
      if (['pirate-raid', 'plague', 'natural-disaster'].includes(event.category) && event.severity !== 'minor') {
        const injuryChance = event.severity === 'catastrophic' ? 0.5 : event.severity === 'major' ? 0.25 : 0.1;
        newPersonnel = newPersonnel.map((p) => {
          if (p.status === 'assigned' && Math.random() < injuryChance) {
            return injurePersonnel(p);
          }
          return p;
        });
      }
    }

    // 4b. Auto-heal injured personnel (30% chance per turn)
    newPersonnel = newPersonnel.map((p) => {
      if (p.status === 'injured' && Math.random() < 0.3) {
        logAction(newTurn, 'heal-personnel', `${p.name} has recovered from injuries!`, 'personnel');
        return { ...p, status: 'available' as const, assignedRoute: null };
      }
      return p;
    });

    // 5. Prune expired events, add new ones
    const activeEvents = [
      ...pruneExpiredEvents(state.events, newTurn),
      ...newEvents,
    ];

    // 6. Update event log
    const newLog = [...newEvents, ...state.eventLog].slice(0, 50);

    // 7. Random faction relation shifts
    let newRelations = state.factionRelations;
    if (Math.random() < 0.25) {
      const factionIds = [...state.regions ? Object.values(state.regions) : []].map((r) => r.factionId);
      const a = factionIds[Math.floor(Math.random() * factionIds.length)];
      const b = factionIds[Math.floor(Math.random() * factionIds.length)];
      if (a && b && a !== b) {
        newRelations = shiftRelation(newRelations, a, b, Math.random() < 0.5 ? 'improve' : 'worsen');
      }
    }

    // 8. Faction relation cascading from events
    for (const event of newEvents) {
      if (event.category === 'faction-conflict' && event.affectedFactions.length >= 2) {
        newRelations = shiftRelation(newRelations, event.affectedFactions[0], event.affectedFactions[1], 'worsen');
      }
      if (event.category === 'faction-alliance' && event.affectedFactions.length >= 2) {
        newRelations = shiftRelation(newRelations, event.affectedFactions[0], event.affectedFactions[1], 'improve');
      }
    }

    // 9. Market fluctuations
    let newMarket = applyMarketFluctuations(state.market);
    for (const event of newEvents) {
      newMarket = applyEventToMarket(newMarket, event);
    }

    // 10. Update player profile
    const updatedPlayer = { ...state.player, lastPlayedAt: Date.now() };

    // 11. Gold history
    const goldHistory = [...state.goldHistory, newResources.gold].slice(-50);

    // 12. Game over check — now triggers if ANY TWO vital resources hit 0
    let gameOverReason: string | undefined;
    const vitalsAtZero = [newResources.gold <= 0, newResources.food <= 0, newResources.fuel <= 0, newResources.water <= 0].filter(Boolean).length;
    if (vitalsAtZero >= 2) {
      gameOverReason = 'Your caravan has run out of vital resources. Your crew is starving and stranded. Your trading empire has collapsed.';
    }

    // 12b. Travel encounter — random event when you've traveled recently
    const travelEncounter = generateTravelEncounter(state.caravan.currentRegion, state.regions, state.reputation);
    if (travelEncounter) {
      newResources = addResources(newResources, travelEncounter.resourceDelta);
      if (Object.keys(travelEncounter.reputationDelta).length > 0) {
        newReputation = changeMultipleReputations(newReputation, travelEncounter.reputationDelta);
      }
      summaryItems.push({
        icon: travelEncounter.emoji,
        text: travelEncounter.title + ' — ' + travelEncounter.description,
        type: 'encounter',
      });
    }

    // 13. Victory check
    let victoryReason: string | undefined;
    const alliedCount = Object.keys(newReputation).filter((id) => newReputation[id as FactionId] >= 60).length;
    const discoveredCount = Object.values(state.regions).filter((r) => r.discovered).length;
    const routeCount = state.tradeRoutes.filter((r) => r.established).length;

    if (newResources.gold >= VICTORY_CONDITIONS.goldTarget) {
      victoryReason = `💰 Wealth Victory! You amassed ${newResources.gold} gold — a true trading magnate!`;
    } else if (alliedCount >= VICTORY_CONDITIONS.alliedFactionsTarget) {
      victoryReason = `🤝 Diplomacy Victory! You allied with ${alliedCount} factions — a master diplomat!`;
    } else if (routeCount >= VICTORY_CONDITIONS.allRoutesTarget) {
      victoryReason = `🌐 Empire Victory! You established all ${routeCount} trade routes — an unstoppable empire!`;
    } else if (discoveredCount >= VICTORY_CONDITIONS.allRegionsDiscovered && routeCount >= 3 && alliedCount >= 1) {
      victoryReason = `🗺️ Explorer Victory! You explored the entire world and built a thriving network!`;
    }

    // Build net resources summary
    const netResources: Partial<Resources> = {};
    for (const key of ['gold', 'food', 'fuel', 'water', 'contraband', 'information'] as (keyof Resources)[]) {
      const diff = newResources[key] - startResources[key];
      if (diff !== 0) netResources[key] = diff;
    }

    const turnSummary: TurnSummary = {
      turn: newTurn,
      season,
      items: summaryItems,
      netResources,
    };

    set({
      turn: newTurn,
      resources: newResources,
      reputation: newReputation,
      events: activeEvents,
      eventLog: newLog,
      factionRelations: newRelations,
      market: newMarket,
      player: updatedPlayer,
      personnel: newPersonnel,
      pendingEventNotification: newEvents.length > 0,
      goldHistory,
      turnSummary,
      showTurnSummary: true,
      ...(gameOverReason ? { phase: 'gameover' as const, gameOverReason } : {}),
      ...(victoryReason ? { phase: 'gameover' as const, victoryReason } : {}),
    });

    logAction(newTurn, 'advance-turn', `Advanced to turn ${newTurn}`, 'system');

    // Process scouting missions
    get().processScoutingMissions();

    // Check mission progress & generate new missions periodically
    setTimeout(() => {
      get().checkMissionProgress();
      if (newTurn % 3 === 0) {
        get().generateNewMissions();
      }
    }, 0);
  },

  dismissTurnSummary: () => {
    set({ showTurnSummary: false });
  },

  getVictoryConditions: () => {
    const state = get();
    const alliedCount = Object.keys(state.reputation).filter((id) => state.reputation[id as FactionId] >= 60).length;
    const discoveredCount = Object.values(state.regions).filter((r) => r.discovered).length;
    const routeCount = state.tradeRoutes.filter((r) => r.established).length;

    return [
      {
        id: 'wealth' as const,
        title: 'Wealth',
        description: `Accumulate ${VICTORY_CONDITIONS.goldTarget} gold`,
        emoji: '💰',
        target: VICTORY_CONDITIONS.goldTarget,
        current: state.resources.gold,
        completed: state.resources.gold >= VICTORY_CONDITIONS.goldTarget,
      },
      {
        id: 'diplomacy' as const,
        title: 'Diplomacy',
        description: `Ally with ${VICTORY_CONDITIONS.alliedFactionsTarget} factions (60+ rep)`,
        emoji: '🤝',
        target: VICTORY_CONDITIONS.alliedFactionsTarget,
        current: alliedCount,
        completed: alliedCount >= VICTORY_CONDITIONS.alliedFactionsTarget,
      },
      {
        id: 'empire' as const,
        title: 'Trade Empire',
        description: `Establish all ${VICTORY_CONDITIONS.allRoutesTarget} trade routes`,
        emoji: '🌐',
        target: VICTORY_CONDITIONS.allRoutesTarget,
        current: routeCount,
        completed: routeCount >= VICTORY_CONDITIONS.allRoutesTarget,
      },
      {
        id: 'explorer' as const,
        title: 'Explorer',
        description: `Discover all ${VICTORY_CONDITIONS.allRegionsDiscovered} regions + 3 routes + 1 ally`,
        emoji: '🗺️',
        target: VICTORY_CONDITIONS.allRegionsDiscovered,
        current: discoveredCount,
        completed: discoveredCount >= VICTORY_CONDITIONS.allRegionsDiscovered && routeCount >= 3 && alliedCount >= 1,
      },
    ];
  },

  getSaveData: () => {
    const state = get();
    const saveData: Omit<GameState, 'activeTab' | 'selectedRegion' | 'pendingEventNotification' | 'turnSummary' | 'showTurnSummary'> = {
      phase: state.phase,
      turn: state.turn,
      resources: state.resources,
      reputation: state.reputation,
      regions: state.regions,
      tradeRoutes: state.tradeRoutes,
      personnel: state.personnel,
      events: state.events,
      eventLog: state.eventLog,
      factionRelations: state.factionRelations,
      market: state.market,
      player: state.player,
      goldHistory: state.goldHistory,
      missions: state.missions,
      completedMissions: state.completedMissions,
      achievements: state.achievements,
      gatherCooldowns: state.gatherCooldowns,
      actionLog: state.actionLog,
      caravan: state.caravan,
      scoutingMissions: state.scoutingMissions,
    };
    return JSON.stringify(saveData);
  },

  loadSaveData: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.phase || !parsed.resources || !parsed.reputation) return false;
      set({
        ...parsed,
        activeTab: 'world',
        selectedRegion: null,
        events: parsed.events || [],
        eventLog: parsed.eventLog || [],
        factionRelations: parsed.factionRelations || createInitialFactionRelations(),
        market: parsed.market || createInitialMarket(),
        player: parsed.player || createPlayerProfile('Trader'),
        pendingEventNotification: false,
        goldHistory: parsed.goldHistory || [],
        missions: parsed.missions || [],
        completedMissions: parsed.completedMissions || [],
        achievements: parsed.achievements || DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
        gatherCooldowns: parsed.gatherCooldowns || {},
        actionLog: parsed.actionLog || [],
        caravan: parsed.caravan || createInitialCaravan(),
        scoutingMissions: parsed.scoutingMissions || [],
        turnSummary: null,
        showTurnSummary: false,
      });
      return true;
    } catch {
      return false;
    }
  },
}));

// ============================================================
// Achievement Checker
// ============================================================
function checkAchievements(
  state: GameState,
  missions: Mission[],
  completedMissions: string[]
): Achievement[] {
  const achievements = [...state.achievements];
  const unlock = (id: string) => {
    const idx = achievements.findIndex((a) => a.id === id);
    if (idx !== -1 && !achievements[idx].unlocked) {
      achievements[idx] = { ...achievements[idx], unlocked: true, unlockedOnTurn: state.turn };
      logAction(state.turn, 'achievement-unlocked', `🏆 ${achievements[idx].title}`, 'system');
    }
  };

  // First trade route
  if (state.tradeRoutes.some((r) => r.established)) unlock('first-trade');
  // All regions discovered
  if (Object.values(state.regions).every((r) => r.discovered)) unlock('explorer');
  // Rich trader
  if (state.resources.gold >= 1000) unlock('rich-trader');
  // Diplomat (any faction allied)
  const allFactionIds = Object.keys(state.reputation);
  if (allFactionIds.some((id) => state.reputation[id as FactionId] >= 60)) unlock('diplomat');
  // Survivor
  if (state.turn >= 20) unlock('survivor');
  // Mission complete
  if (completedMissions.length >= 1) unlock('mission-complete');
  // Five missions
  if (completedMissions.length >= 5) unlock('five-missions');
  // All routes
  if (state.tradeRoutes.filter((r) => r.established).length >= 5) unlock('all-routes');
  // Weather master — catastrophic event survived (just living past one)
  if (state.events.some((e) => e.severity === 'catastrophic')) unlock('weather-master');
  // Full resources
  if (state.resources.fuel >= 100 && state.resources.water >= 100 && state.resources.food >= 100 && state.resources.gold >= 100) unlock('full-resources');
  // NPC friend — 3 factions friendly
  const friendlyCount = allFactionIds.filter((id) => state.reputation[id as FactionId] >= 30).length;
  if (friendlyCount >= 3) unlock('npc-friend');

  return achievements;
}

// ============================================================
// Travel Encounter Generator (random mini-events)
// ============================================================
function generateTravelEncounter(
  currentRegion: RegionId,
  regions: Record<RegionId, Region>,
  reputation: Record<FactionId, number>
): TravelEncounter | null {
  // 25% chance of a travel encounter each turn
  if (Math.random() > 0.25) return null;

  const region = regions[currentRegion];
  if (!region) return null;

  const factionId: FactionId = region.factionId;
  const rep = reputation[factionId] ?? 0;
  const status = getRelationshipStatus(reputation, factionId);

  // Base encounters (always available)
  const encounters: TravelEncounter[] = [
    {
      id: 'merchant-caravan',
      title: '🐫 Wandering Merchant',
      description: 'A friendly trader shared some supplies with you.',
      emoji: '🐫',
      resourceDelta: { gold: 8, food: 5 },
      reputationDelta: {},
    },
    {
      id: 'bandits',
      title: '🏴‍☠️ Bandit Ambush!',
      description: 'Bandits attacked your caravan and stole some gold.',
      emoji: '🏴‍☠️',
      resourceDelta: { gold: -15 },
      reputationDelta: {},
    },
    {
      id: 'lost-supplies',
      title: '📦 Lost Supplies Found',
      description: 'You found an abandoned cache of supplies on the road.',
      emoji: '📦',
      resourceDelta: { fuel: 8, water: 6 },
      reputationDelta: {},
    },
    {
      id: 'toll-gate',
      title: '🚧 Toll Gate',
      description: 'A local faction demanded a toll for passage through their territory.',
      emoji: '🚧',
      resourceDelta: { gold: -10 },
      reputationDelta: { [factionId]: 3 },
    },
    {
      id: 'friendly-locals',
      title: '🏘️ Helpful Villagers',
      description: 'Friendly villagers offered food and directions.',
      emoji: '🏘️',
      resourceDelta: { food: 8, water: 4 },
      reputationDelta: { [factionId]: 2 },
    },
    {
      id: 'intel-rumor',
      title: '🗣️ Tavern Rumors',
      description: 'You overheard valuable trade intelligence at a roadside tavern.',
      emoji: '🗣️',
      resourceDelta: { information: 5 },
      reputationDelta: {},
    },
    {
      id: 'broken-wheel',
      title: '🔧 Broken Wheel',
      description: 'Your caravan hit a pothole. Repairs cost fuel and time.',
      emoji: '🔧',
      resourceDelta: { fuel: -6 },
      reputationDelta: {},
    },
    // New encounters for more variety
    {
      id: 'wild-animals',
      title: '🐺 Wild Animals',
      description: 'A pack of animals startled your caravan. Some food was lost in the panic.',
      emoji: '🐺',
      resourceDelta: { food: -5 },
      reputationDelta: {},
    },
    {
      id: 'hidden-spring',
      title: '💦 Hidden Spring',
      description: 'Your scouts found a hidden freshwater spring! Everyone drinks well tonight.',
      emoji: '💦',
      resourceDelta: { water: 10 },
      reputationDelta: {},
    },
    {
      id: 'abandoned-camp',
      title: '⛺ Abandoned Camp',
      description: 'You found an abandoned traveler\'s camp with useful supplies.',
      emoji: '⛺',
      resourceDelta: { food: 4, fuel: 4, gold: 5 },
      reputationDelta: {},
    },
    {
      id: 'trade-convoy',
      title: '🚛 Trade Convoy',
      description: 'You traveled alongside a trade convoy. They shared market intelligence and supplies.',
      emoji: '🚛',
      resourceDelta: { information: 3, gold: 6 },
      reputationDelta: {},
    },
    {
      id: 'sandstorm',
      title: '🌪️ Dust Storm',
      description: 'A sudden dust storm forced you to shelter. Some supplies were ruined.',
      emoji: '🌪️',
      resourceDelta: { food: -3, water: -2, fuel: -2 },
      reputationDelta: {},
    },
    {
      id: 'wandering-healer',
      title: '💊 Wandering Healer',
      description: 'A traveling healer tended to your crew. Morale is high!',
      emoji: '💊',
      resourceDelta: { gold: -5 },
      reputationDelta: { [factionId]: 1 },
    },
  ];

  // Faction-specific encounters (based on the current region's faction)
  const factionEncounters: Record<string, TravelEncounter[]> = {
    'iron-pact': [
      {
        id: 'forge-gift',
        title: '⚒️ Pact Smiths',
        description: 'Iron Pact smiths repaired your caravan and shared fuel from their foundries.',
        emoji: '⚒️',
        resourceDelta: { fuel: 12 },
        reputationDelta: { 'iron-pact': 3 },
      },
      {
        id: 'pact-drill',
        title: '🛡️ Military Patrol',
        description: 'A Pact patrol tested your mettle. You passed their inspection and earned respect.',
        emoji: '🛡️',
        resourceDelta: { gold: -5 },
        reputationDelta: { 'iron-pact': 5 },
      },
    ],
    'tidecallers': [
      {
        id: 'fishing-bounty',
        title: '🐟 Bountiful Catch',
        description: 'Tidecaller fishers shared their catch. Your food stores overflow!',
        emoji: '🐟',
        resourceDelta: { food: 15 },
        reputationDelta: { 'tidecallers': 2 },
      },
      {
        id: 'tide-blessing',
        title: '🌊 Tide Blessing',
        description: 'A Tide-Speaker blessed your journey. Water seems to last longer.',
        emoji: '🌊',
        resourceDelta: { water: 10 },
        reputationDelta: { 'tidecallers': 3 },
      },
    ],
    'dustwalkers': [
      {
        id: 'oasis-discovery',
        title: '🏝️ Hidden Oasis',
        description: 'Dustwalker guides led you to a hidden oasis. Water and rest for all!',
        emoji: '🏝️',
        resourceDelta: { water: 12, food: 5 },
        reputationDelta: { 'dustwalkers': 3 },
      },
      {
        id: 'desert-cache',
        title: '🪙 Desert Cache',
        description: 'You helped Dustwalkers unearth an ancient fuel depot. They shared the find.',
        emoji: '🪙',
        resourceDelta: { fuel: 10, gold: 5 },
        reputationDelta: { 'dustwalkers': 2 },
      },
    ],
    'verdant-commune': [
      {
        id: 'forest-feast',
        title: '🌿 Forest Feast',
        description: 'The Commune invited you to a harvest celebration. Amazing food!',
        emoji: '🌿',
        resourceDelta: { food: 12, water: 5 },
        reputationDelta: { 'verdant-commune': 4 },
      },
      {
        id: 'herb-gift',
        title: '🌸 Herbal Medicine',
        description: 'Commune healers gifted you rare medicinal herbs worth a fortune.',
        emoji: '🌸',
        resourceDelta: { gold: 12 },
        reputationDelta: { 'verdant-commune': 2 },
      },
    ],
    'nightmarket-syndicate': [
      {
        id: 'black-market-deal',
        title: '🌑 Black Market Deal',
        description: 'A Syndicate fixer offered you contraband at a bargain price.',
        emoji: '🌑',
        resourceDelta: { contraband: 8, gold: -10 },
        reputationDelta: { 'nightmarket-syndicate': 3 },
      },
      {
        id: 'syndicate-tip',
        title: '🕵️ Insider Information',
        description: 'A Syndicate informant whispered valuable market secrets.',
        emoji: '🕵️',
        resourceDelta: { information: 8 },
        reputationDelta: { 'nightmarket-syndicate': 2 },
      },
    ],
    'ashen-throne': [
      {
        id: 'throne-tax',
        title: '👑 Royal Tax Collector',
        description: 'The Ashen Throne collected a "voluntary" tax. Best to comply.',
        emoji: '👑',
        resourceDelta: { gold: -15 },
        reputationDelta: { 'ashen-throne': 4 },
      },
      {
        id: 'throne-favor',
        title: '🏰 Royal Favor',
        description: 'A courtier noticed your loyalty. A gift from the Throne arrived.',
        emoji: '🏰',
        resourceDelta: { gold: 20, information: 3 },
        reputationDelta: { 'ashen-throne': 2 },
      },
    ],
  };

  // Hostile-only encounters (when rep is very low)
  const hostileEncounters: TravelEncounter[] = [
    {
      id: 'hostile-blockade',
      title: '🚫 Faction Blockade',
      description: `${FACTIONS_DATA[factionId]?.name || 'Local forces'} set up a blockade! They confiscated goods.`,
      emoji: '🚫',
      resourceDelta: { gold: -20, food: -5 },
      reputationDelta: { [factionId]: -2 },
    },
    {
      id: 'hostile-ambush',
      title: '⚔️ Faction Ambush',
      description: `${FACTIONS_DATA[factionId]?.name || 'Hostile forces'} attacked your caravan! Supplies were lost.`,
      emoji: '⚔️',
      resourceDelta: { gold: -12, fuel: -5, water: -3 },
      reputationDelta: { [factionId]: -3 },
    },
  ];

  // Build encounter pool based on reputation status
  let pool: TravelEncounter[] = [...encounters];

  // Add faction-specific encounters if available and not hostile
  if (status !== 'hostile' && factionEncounters[factionId]) {
    pool.push(...factionEncounters[factionId]);
  }

  if (status === 'hostile') {
    // Hostile: mostly negative encounters
    pool = pool.filter((e) =>
      !['friendly-locals', 'merchant-caravan', 'trade-convoy', 'wandering-healer', 'hidden-spring', 'abandoned-camp'].includes(e.id)
    );
    pool.push(...hostileEncounters);
  } else if (status === 'unfriendly') {
    // Unfriendly: remove best positive encounters
    pool = pool.filter((e) =>
      !['friendly-locals', 'merchant-caravan', 'trade-convoy'].includes(e.id)
    );
  } else if (status === 'allied') {
    // Allied: remove negative encounters, keep faction bonuses
    pool = pool.filter((e) =>
      !['bandits', 'toll-gate', 'broken-wheel', 'wild-animals', 'sandstorm'].includes(e.id)
    );
  } else if (rep >= 30) {
    // Friendly: remove harsh negatives
    pool = pool.filter((e) =>
      !['bandits', 'toll-gate', 'broken-wheel'].includes(e.id)
    );
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
