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
  return Math.round(baseCost * weights[resKey]);
}
