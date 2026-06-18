export type ResourceType = 'water' | 'plasma' | 'fuel' | 'food' | 'respirant';

export interface MineState {
  index: number; // 0..2 for most, 0..5 for water
  level: number; // Max 15
  isUpgrading: boolean;
  upgradeEnd: number | null; // Timestamp
  health?: number; // 0 to 100
  boostedUntil?: number | null; // Timestamp
}

export interface BuildingState {
  level: number;
  maxLevel: number;
  isUpgrading: boolean;
  upgradeEnd: number | null; // Timestamp
  health?: number; // 0 to 100
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

export interface QueuedUpgrade {
  type: 'mine' | 'building';
  key: string;
  mineIndex?: number;
  targetLevel: number;
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
    supplyNexus: BuildingState;   // Max 50
    fabricator: BuildingState;    // Max 10
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
  lastSupplyNexusClaim?: number;
  upgradeQueue?: QueuedUpgrade[];
}

export interface PlayerProfile {
  id: string;
  username: string;
  faction: string; // 'Alliance', 'Syndicate', 'Vanguard'
  factionColor: string; // HEX
  allianceId: string | null;
  allianceRole: 'commander' | 'leader' | 'officer' | 'member' | 'recruit' | null;
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
  googleEmail?: string;
  password?: string;
  lastActive?: number;
  commandMessages?: CommandMessage[];
}

export interface CommandMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderFaction: string;
  senderFactionColor: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  isSaved?: boolean;
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
    role: 'commander' | 'leader' | 'officer' | 'member' | 'recruit';
  }[];
  wars: {
    targetAllianceId: string;
    targetAllianceName: string;
    declaredAt: number;
  }[];
  bannerColor: string;
  bannerSymbol: string;
  highlights?: string;
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
  missionType: 'attack' | 'colonize' | 'recon' | 'move';
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
  targetBuilding?: string;
  lootCarried?: {
    water: number;
    plasma: number;
    fuel: number;
    food: number;
    respirant: number;
  };
  troopSpeedLevel?: number;
  defenseShieldsLevel?: number;
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
  buildings?: Record<string, number>;
  mines?: Record<string, number[]>;
  resources?: {
    water: number;
    plasma: number;
    fuel: number;
    food: number;
    respirant: number;
  };
}

export interface NewsEvent {
  id: string;
  title: string;
  content: string;
  type: 'war' | 'system' | 'raid' | 'discovery';
  timestamp: number;
}

export interface SuggestionFeedback {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  category: 'gameplay' | 'visuals' | 'balancing' | 'bugs' | 'other';
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
  feedbacks?: SuggestionFeedback[];
}

export interface HabitablePlanet {
  id: string;
  name: string;
  coords: { x: number; y: number };
  isColonized: boolean;
}

export interface LeaderboardPlayer {
  id: string;
  username: string;
  faction: string;
  factionColor: string;
  allianceId: string | null;
  allianceRole: string | null;
  scores: {
    population: number;
    attack: number;
    defence: number;
    raiders: number;
  };
  achievements?: string[];
  planetsCount?: number;
  lastActive?: number;
}

export interface CreatedFleet {
  id: string;
  name: string;
  subsidiary: string;
  troops: {
    defender: number;
    attacker: number;
    tank: number;
    looter: number;
    drone: number;
    settlementShip: number;
  };
  planetId: string;
}

export { getUpgradeWeights, getUpgradeResourceCost } from './gameUtils';
