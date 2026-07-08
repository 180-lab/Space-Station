import { ResourceType } from './types';

export function getUpgradeWeights(type: 'mine' | 'building', key: string): Record<ResourceType, number> {
  if (type === 'mine') {
    const weights: Record<ResourceType, number> = {
      water: 0.9,
      plasma: 0.9,
      fuel: 0.9,
      food: 0.9,
      respirant: 0.9
    };
    if (key in weights) {
      weights[key as ResourceType] = 1.4;
    }
    return weights;
  } else {
    return {
      water: 0.96929032,
      plasma: 1.00767742,
      fuel: 1.00767742,
      food: 1.00767742,
      respirant: 1.00767742
    };
  }
}

export function getUpgradeResourceCost(type: 'mine' | 'building', key: string, targetLevel: number, resKey: ResourceType): number {
  const baseCost = type === 'mine' ? targetLevel * 100 : targetLevel * 150;
  const weights = getUpgradeWeights(type, key);
  const cost = Math.round(baseCost * weights[resKey]);
  if (type === 'mine') {
    return Math.round(cost * 3.25);
  } else {
    return Math.round(cost * 5);
  }
}

export function getTaskResourceCost(taskId: number): Record<ResourceType, number> {
  const defaultCost: Record<ResourceType, number> = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
  
  switch (taskId) {
    case 1: // Settle 2nd Colony
      return { water: 1500, plasma: 1000, fuel: 2000, food: 1500, respirant: 1000 };
    case 2: // Construct all resource types (level 1 mines)
      return {
        water: getUpgradeResourceCost('mine', 'water', 1, 'water'),
        plasma: getUpgradeResourceCost('mine', 'plasma', 1, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'fuel', 1, 'fuel'),
        food: getUpgradeResourceCost('mine', 'food', 1, 'food'),
        respirant: getUpgradeResourceCost('mine', 'respirant', 1, 'respirant'),
      };
    case 3: // Water pump level 2
      return {
        water: getUpgradeResourceCost('mine', 'water', 2, 'water'),
        plasma: getUpgradeResourceCost('mine', 'water', 2, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'water', 2, 'fuel'),
        food: getUpgradeResourceCost('mine', 'water', 2, 'food'),
        respirant: getUpgradeResourceCost('mine', 'water', 2, 'respirant'),
      };
    case 4: // Respirant level 2
      return {
        water: getUpgradeResourceCost('mine', 'respirant', 2, 'water'),
        plasma: getUpgradeResourceCost('mine', 'respirant', 2, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'respirant', 2, 'fuel'),
        food: getUpgradeResourceCost('mine', 'respirant', 2, 'food'),
        respirant: getUpgradeResourceCost('mine', 'respirant', 2, 'respirant'),
      };
    case 5: // Food level 2
      return {
        water: getUpgradeResourceCost('mine', 'food', 2, 'water'),
        plasma: getUpgradeResourceCost('mine', 'food', 2, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'food', 2, 'fuel'),
        food: getUpgradeResourceCost('mine', 'food', 2, 'food'),
        respirant: getUpgradeResourceCost('mine', 'food', 2, 'respirant'),
      };
    case 6: // Plasma level 2
      return {
        water: getUpgradeResourceCost('mine', 'plasma', 2, 'water'),
        plasma: getUpgradeResourceCost('mine', 'plasma', 2, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'plasma', 2, 'fuel'),
        food: getUpgradeResourceCost('mine', 'plasma', 2, 'food'),
        respirant: getUpgradeResourceCost('mine', 'plasma', 2, 'respirant'),
      };
    case 7: // Comms Hub Level 1
      return {
        water: getUpgradeResourceCost('building', 'commsHub', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'commsHub', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'commsHub', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'commsHub', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'commsHub', 1, 'respirant'),
      };
    case 8: // Silo Level 10
      return {
        water: getUpgradeResourceCost('building', 'repository', 10, 'water'),
        plasma: getUpgradeResourceCost('building', 'repository', 10, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'repository', 10, 'fuel'),
        food: getUpgradeResourceCost('building', 'repository', 10, 'food'),
        respirant: getUpgradeResourceCost('building', 'repository', 10, 'respirant'),
      };
    case 9: // Dispatch Interstellar Resources
      return defaultCost;
    case 10: // Queue Extractor Upgrade
      return {
        water: getUpgradeResourceCost('mine', 'water', 3, 'water'),
        plasma: getUpgradeResourceCost('mine', 'water', 3, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'water', 3, 'fuel'),
        food: getUpgradeResourceCost('mine', 'water', 3, 'food'),
        respirant: getUpgradeResourceCost('mine', 'water', 3, 'respirant'),
      };
    case 11: // Launch Strike Fleet Attack
      return { water: 150, plasma: 0, fuel: 0, food: 200, respirant: 100 };
    case 12: // Extractor Overdrive
      return defaultCost;
    case 13: // Dual Overdrive
      return defaultCost;
    case 14: // Fabricator Level 2
      return {
        water: getUpgradeResourceCost('building', 'fabricator', 2, 'water'),
        plasma: getUpgradeResourceCost('building', 'fabricator', 2, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'fabricator', 2, 'fuel'),
        food: getUpgradeResourceCost('building', 'fabricator', 2, 'food'),
        respirant: getUpgradeResourceCost('building', 'fabricator', 2, 'respirant'),
      };
    case 15: // Radar Array Level 1
      return {
        water: getUpgradeResourceCost('building', 'radar', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'radar', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'radar', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'radar', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'radar', 1, 'respirant'),
      };
    case 16: // Radar Scan
      return defaultCost;
    case 17: // Research Center Level 1
      return {
        water: getUpgradeResourceCost('building', 'researchCenter', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'researchCenter', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'researchCenter', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'researchCenter', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'researchCenter', 1, 'respirant'),
      };
    case 18: // Science Research Level 2
      return { water: 4600, plasma: 9200, fuel: 11500, food: 2300, respirant: 5750 };
    case 19: // Start Research Project
      return { water: 3000, plasma: 4000, fuel: 5000, food: 2000, respirant: 2000 };
    case 20: // War Room Level 1
      return {
        water: getUpgradeResourceCost('building', 'armyBase', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'armyBase', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'armyBase', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'armyBase', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'armyBase', 1, 'respirant'),
      };
    case 21: // Mobilize 15 Combat Troops
      return { water: 2250, plasma: 0, fuel: 0, food: 3000, respirant: 1500 };
    case 22: // Recruit Interceptors
      return { water: 750, plasma: 0, fuel: 0, food: 1000, respirant: 500 };
    case 23: // Recruit Assault Drones
      return { water: 600, plasma: 900, fuel: 900, food: 600, respirant: 0 };
    case 24: // Private transmission
      return defaultCost;
    case 25: // Claim Daily
      return defaultCost;
    case 26: // Join Alliance
      return defaultCost;
    case 27: // Public Broadcast
      return defaultCost;
    case 28: // Warp Thrusters speed tech
      return { water: 3000, plasma: 4000, fuel: 5000, food: 2000, respirant: 2000 };
    case 29: // Review Standing Stats
      return defaultCost;
    case 30: // Settle 3rd Colony
      return { water: 1500, plasma: 1000, fuel: 2000, food: 1500, respirant: 1000 };
    default:
      return defaultCost;
  }
}

export function getTaskResourceReward(taskId: number): Record<ResourceType, number> {
  const nextTaskId = taskId + 1;
  const nextTaskCost = nextTaskId <= 30 ? getTaskResourceCost(nextTaskId) : { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 };
  
  return {
    water: nextTaskCost.water + 6000,
    plasma: nextTaskCost.plasma + 6000,
    fuel: nextTaskCost.fuel + 6000,
    food: nextTaskCost.food + 6000,
    respirant: nextTaskCost.respirant + 6000,
  };
}
