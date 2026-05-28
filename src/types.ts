export type ResourceType = 'water' | 'plasma' | 'fuel' | 'food' | 'respirant';

export interface MineState {
  index: number; // 0..2 for most, 0..5 for water
  level: number; // Max 15
  isUpgrading: boolean;
  upgradeEnd: number | null; // Timestamp
}

export interface BuildingState {
  level: number;
  maxLevel: number;
  isUpgrading: boolean;
  upgradeEnd: number | null; // Timestamp
}

export interface TroopState {
  id: string;      // 'defender', 'attacker', 'tank', 'looter', 'drone'
  name: string;
  count: number;
  defenceHp: number;
  attackHp: number;
  carry: number;
  speed: number;   // Higher is faster
  waterConsumption: number; // Water consumed per hour per troop
}

export interface TrainingQueueItem {
  troopId: string;
  count: number;
  startedAt: number;
  completedAt: number;
}

export interface ColonyPlanet {
  id: string;
  name: string;
  sectorX: number;
  sectorY: number;
  skinId: string; // Theme/Skin cosmetics
  mines: {
    water: MineState[];
    plasma: MineState[];
    fuel: MineState[];
    food: MineState[];
    respirant: MineState[];
  };
  buildings: {
    commsHub: BuildingState;     // Max undefined/50
    researchCenter: BuildingState; // Max 20
    armyBase: BuildingState;      // Displays troops
    repository: BuildingState;    // Max 45
    radar: BuildingState;         // Max 15
  };
  resources: {
    water: number;
    plasma: number;
    fuel: number;
    food: number;
    respirant: number;
  };
  troops: {
    defender: number;
    attacker: number;
    tank: number;
    looter: number;
    drone: number;
    settlementShip: number;
  };
  trainingQueue: TrainingQueueItem[];
}

export interface PlayerProfile {
  id: string;
  username: string;
  faction: string; // 'Alliance', 'Syndicate', 'Vanguard'
  factionColor: string; // HEX
  allianceId: string | null;
  allianceRole: 'leader' | 'officer' | 'member' | null;
  planets: ColonyPlanet[];
  scores: {
    population: number; // Mine levels * 10 + Building levels * 30
    attack: number;     // Killed defending HP (only to winning attacker)
    defence: number;    // Killed attacking HP (only to winning defender)
    raiders: number;    // Cumulative stolen resources
  };
  achievements: string[];
  skinId: string; // Theme skin
  bannerId: string; // Alliance/Player banner shape
  lastDailyRewardClaim: number;
  credits: number;
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  leaderName: string;
  members: {
    playerId: string;
    username: string;
    role: 'leader' | 'officer' | 'member';
  }[];
  wars: {
    targetAllianceId: string;
    targetAllianceName: string;
    declaredAt: number;
  }[];
  bannerColor: string;
  bannerSymbol: string;
}

export interface ChatMessage {
  id: string;
  channel: 'global' | 'alliance' | 'private';
  senderId: string;
  senderName: string;
  senderFaction: string;
  senderFactionColor: string;
  allianceTag: string | null;
  receiverId: string | null; // For private messages
  content: string;
  timestamp: number;
}

export interface FleetMission {
  id: string;
  senderId: string;
  senderName: string;
  senderCoords: { x: number; y: number };
  targetId: string | null; // Target player ID or Planet ID
  targetName: string;
  targetCoords: { x: number; y: number };
  missionType: 'attack' | 'colonize' | 'recon';
  troops: {
    defender: number;
    attacker: number;
    tank: number;
    looter: number;
    drone: number;
    settlementShip: number;
  };
  startedAt: number;
  arrivesAt: number;
  isReturning: boolean;
  isWaitingToSettle?: boolean;
  lootCarried?: {
    water: number;
    plasma: number;
    fuel: number;
    food: number;
    respirant: number;
  };
}

export interface BattleReport {
  id: string;
  timestamp: number;
  attackerId: string;
  attackerName: string;
  attackerAlliance?: string;
  defenderId: string;
  defenderName: string;
  defenderAlliance?: string;
  isRecon?: boolean;
  attackerCoords: { x: number; y: number };
  defenderCoords: { x: number; y: number };
  attackerInitialTroops: Record<string, number>;
  attackerLosses: Record<string, number>;
  defenderInitialTroops: Record<string, number>;
  defenderLosses: Record<string, number>;
  winner: 'attacker' | 'defender';
  resourcesStolen: {
    water: number;
    plasma: number;
    fuel: number;
    food: number;
    respirant: number;
  };
  buildingDamage?: {
    buildingName: string;
    levelsDestroyed: number;
    previousLevel: number;
    newLevel: number;
  }[];
  attackHpKilled: number;
  defenceHpKilled: number;
  battleRounds?: {
    round: number;
    logs: string[];
    attackerRemaining: Record<string, number>;
    defenderRemaining: Record<string, number>;
  }[];
}

export interface NewsEvent {
  id: string;
  title: string;
  content: string;
  type: 'war' | 'system' | 'raid' | 'discovery';
  timestamp: number;
}

export interface GameState {
  players: Record<string, PlayerProfile>;
  alliances: Record<string, Alliance>;
  chatMessages: ChatMessage[];
  fleets: FleetMission[];
  battleReports: BattleReport[];
  newsEvents: NewsEvent[];
  habitablePlanets?: HabitablePlanet[];
}

export interface HabitablePlanet {
  id: string;
  name: string;
  coords: { x: number; y: number };
  isColonized: boolean;
}

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
