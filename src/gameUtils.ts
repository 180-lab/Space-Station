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
    case 1: // Upgrade Fabricator to Level 1
      return {
        water: getUpgradeResourceCost('building', 'fabricator', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'fabricator', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'fabricator', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'fabricator', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'fabricator', 1, 'respirant'),
      };
    case 2: // Construct all resource types (level 1 mines)
      return {
        water: getUpgradeResourceCost('mine', 'water', 1, 'water'),
        plasma: getUpgradeResourceCost('mine', 'plasma', 1, 'plasma'),
        fuel: getUpgradeResourceCost('mine', 'fuel', 1, 'fuel'),
        food: getUpgradeResourceCost('mine', 'food', 1, 'food'),
        respirant: getUpgradeResourceCost('mine', 'respirant', 1, 'respirant'),
      };
    case 3: // Construct Communications Hub Level 1
      return {
        water: getUpgradeResourceCost('building', 'commsHub', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'commsHub', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'commsHub', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'commsHub', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'commsHub', 1, 'respirant'),
      };
    case 4: // Construct Repository (Silo) Level 1
      return {
        water: getUpgradeResourceCost('building', 'repository', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'repository', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'repository', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'repository', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'repository', 1, 'respirant'),
      };
    case 5: // Upgrade Fabricator to Level 2
      return {
        water: getUpgradeResourceCost('building', 'fabricator', 2, 'water'),
        plasma: getUpgradeResourceCost('building', 'fabricator', 2, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'fabricator', 2, 'fuel'),
        food: getUpgradeResourceCost('building', 'fabricator', 2, 'food'),
        respirant: getUpgradeResourceCost('building', 'fabricator', 2, 'respirant'),
      };
    case 6: // Construct Radar Array Level 1
      return {
        water: getUpgradeResourceCost('building', 'radar', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'radar', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'radar', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'radar', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'radar', 1, 'respirant'),
      };
    case 7: // Execute Galaxy Radar Scan
      return defaultCost;
    case 8: // Upgrade all 5 resource extractors to Level 2
      return {
        water: getUpgradeResourceCost('mine', 'water', 2, 'water') * 2,
        plasma: getUpgradeResourceCost('mine', 'plasma', 2, 'plasma') * 2,
        fuel: getUpgradeResourceCost('mine', 'fuel', 2, 'fuel') * 2,
        food: getUpgradeResourceCost('mine', 'food', 2, 'food') * 2,
        respirant: getUpgradeResourceCost('mine', 'respirant', 2, 'respirant') * 2,
      };
    case 9: // Upgrade Fabricator to Level 4
      return {
        water: getUpgradeResourceCost('building', 'fabricator', 4, 'water'),
        plasma: getUpgradeResourceCost('building', 'fabricator', 4, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'fabricator', 4, 'fuel'),
        food: getUpgradeResourceCost('building', 'fabricator', 4, 'food'),
        respirant: getUpgradeResourceCost('building', 'fabricator', 4, 'respirant'),
      };
    case 10: // Upgrade Communications Hub to Level 2
      return {
        water: getUpgradeResourceCost('building', 'commsHub', 2, 'water'),
        plasma: getUpgradeResourceCost('building', 'commsHub', 2, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'commsHub', 2, 'fuel'),
        food: getUpgradeResourceCost('building', 'commsHub', 2, 'food'),
        respirant: getUpgradeResourceCost('building', 'commsHub', 2, 'respirant'),
      };
    case 11: // Construct Research Center Level 1
      return {
        water: getUpgradeResourceCost('building', 'researchCenter', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'researchCenter', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'researchCenter', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'researchCenter', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'researchCenter', 1, 'respirant'),
      };
    case 12: // Start research project
      return { water: 3000, plasma: 4000, fuel: 5000, food: 2000, respirant: 2000 };
    case 13: // Upgrade Research: Warp Thrusters Level 1
      return { water: 3000, plasma: 4000, fuel: 5000, food: 2000, respirant: 2000 };
    case 14: // Upgrade Research Center to Level 2
      return {
        water: getUpgradeResourceCost('building', 'researchCenter', 2, 'water'),
        plasma: getUpgradeResourceCost('building', 'researchCenter', 2, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'researchCenter', 2, 'fuel'),
        food: getUpgradeResourceCost('building', 'researchCenter', 2, 'food'),
        respirant: getUpgradeResourceCost('building', 'researchCenter', 2, 'respirant'),
      };
    case 15: // Upgrade Research: Shields/Armor Level 2
      return { water: 4600, plasma: 9200, fuel: 11500, food: 2300, respirant: 5750 };
    case 16: // Upgrade all 5 resource extractors to Level 3
      return {
        water: getUpgradeResourceCost('mine', 'water', 3, 'water') * 2,
        plasma: getUpgradeResourceCost('mine', 'plasma', 3, 'plasma') * 2,
        fuel: getUpgradeResourceCost('mine', 'fuel', 3, 'fuel') * 2,
        food: getUpgradeResourceCost('mine', 'food', 3, 'food') * 2,
        respirant: getUpgradeResourceCost('mine', 'respirant', 3, 'respirant') * 2,
      };
    case 17: // Upgrade Fabricator to Level 7
      return {
        water: getUpgradeResourceCost('building', 'fabricator', 7, 'water'),
        plasma: getUpgradeResourceCost('building', 'fabricator', 7, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'fabricator', 7, 'fuel'),
        food: getUpgradeResourceCost('building', 'fabricator', 7, 'food'),
        respirant: getUpgradeResourceCost('building', 'fabricator', 7, 'respirant'),
      };
    case 18: // Upgrade Communications Hub to Level 3
      return {
        water: getUpgradeResourceCost('building', 'commsHub', 3, 'water'),
        plasma: getUpgradeResourceCost('building', 'commsHub', 3, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'commsHub', 3, 'fuel'),
        food: getUpgradeResourceCost('building', 'commsHub', 3, 'food'),
        respirant: getUpgradeResourceCost('building', 'commsHub', 3, 'respirant'),
      };
    case 19: // Upgrade Radar Array to Level 2
      return {
        water: getUpgradeResourceCost('building', 'radar', 2, 'water'),
        plasma: getUpgradeResourceCost('building', 'radar', 2, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'radar', 2, 'fuel'),
        food: getUpgradeResourceCost('building', 'radar', 2, 'food'),
        respirant: getUpgradeResourceCost('building', 'radar', 2, 'respirant'),
      };
    case 20: // Construct War Room (Army Base) Level 1
      return {
        water: getUpgradeResourceCost('building', 'armyBase', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'armyBase', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'armyBase', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'armyBase', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'armyBase', 1, 'respirant'),
      };
    case 21: // Recruit Interceptors (10)
      return { water: 750, plasma: 0, fuel: 0, food: 1000, respirant: 500 };
    case 22: // Recruit Assault Drones (10)
      return { water: 600, plasma: 900, fuel: 900, food: 600, respirant: 0 };
    case 23: // Join or Create an Alliance
      return defaultCost;
    case 24: // Broadcast in Public Holo-Chat
      return defaultCost;
    case 25: // Send a Private Message
      return defaultCost;
    case 26: // Upgrade Silo (Repository) to Level 5
      return {
        water: getUpgradeResourceCost('building', 'repository', 5, 'water'),
        plasma: getUpgradeResourceCost('building', 'repository', 5, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'repository', 5, 'fuel'),
        food: getUpgradeResourceCost('building', 'repository', 5, 'food'),
        respirant: getUpgradeResourceCost('building', 'repository', 5, 'respirant'),
      };
    case 27: // Upgrade Fabricator to Level 10 (MAX)
      return {
        water: getUpgradeResourceCost('building', 'fabricator', 10, 'water'),
        plasma: getUpgradeResourceCost('building', 'fabricator', 10, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'fabricator', 10, 'fuel'),
        food: getUpgradeResourceCost('building', 'fabricator', 10, 'food'),
        respirant: getUpgradeResourceCost('building', 'fabricator', 10, 'respirant'),
      };
    case 28: // Upgrade War Room (Army Base) to Level 2
      return {
        water: getUpgradeResourceCost('building', 'armyBase', 2, 'water'),
        plasma: getUpgradeResourceCost('building', 'armyBase', 2, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'armyBase', 2, 'fuel'),
        food: getUpgradeResourceCost('building', 'armyBase', 2, 'food'),
        respirant: getUpgradeResourceCost('building', 'armyBase', 2, 'respirant'),
      };
    case 29: // Upgrade Research Center to Level 3
      return {
        water: getUpgradeResourceCost('building', 'researchCenter', 3, 'water'),
        plasma: getUpgradeResourceCost('building', 'researchCenter', 3, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'researchCenter', 3, 'fuel'),
        food: getUpgradeResourceCost('building', 'researchCenter', 3, 'food'),
        respirant: getUpgradeResourceCost('building', 'researchCenter', 3, 'respirant'),
      };
    case 30: // Construct Bunker Level 1
      return {
        water: getUpgradeResourceCost('building', 'bunker', 1, 'water'),
        plasma: getUpgradeResourceCost('building', 'bunker', 1, 'plasma'),
        fuel: getUpgradeResourceCost('building', 'bunker', 1, 'fuel'),
        food: getUpgradeResourceCost('building', 'bunker', 1, 'food'),
        respirant: getUpgradeResourceCost('building', 'bunker', 1, 'respirant'),
      };
    case 31: // Launch a Strike Fleet Attack
      return { water: 1500, plasma: 1000, fuel: 1500, food: 1000, respirant: 1000 };
    case 32: // Settle 2nd Colony
      return { water: 5000, plasma: 5000, fuel: 10000, food: 5000, respirant: 5000 };
    default:
      return defaultCost;
  }
}

export function getTaskResourceReward(taskId: number): Record<ResourceType, number> {
  const nextTaskId = taskId + 1;
  const nextTaskCost = nextTaskId <= 32 ? getTaskResourceCost(nextTaskId) : { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
  
  return {
    water: nextTaskCost.water + 5000,
    plasma: nextTaskCost.plasma + 5000,
    fuel: nextTaskCost.fuel + 5000,
    food: nextTaskCost.food + 5000,
    respirant: nextTaskCost.respirant + 5000,
  };
}
