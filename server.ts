import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  GameState, 
  PlayerProfile, 
  ColonyPlanet, 
  MineState, 
  BuildingState, 
  ChatMessage, 
  FleetMission, 
  BattleReport, 
  NewsEvent, 
  Alliance,
  ResourceType,
  getUpgradeResourceCost
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent state file
const STATE_FILE = path.join(process.cwd(), "galaxy_state.json");

let state: GameState = {
  players: {},
  alliances: {},
  chatMessages: [],
  fleets: [],
  battleReports: [],
  newsEvents: []
};

// Default Troop Specifications
const TROOP_SPECS = {
  defender: { name: "Heavy Defender", defenceHp: 180, attackHp: 100, carry: 6000, speed: 30, waterConsumption: 0.5 },
  attacker: { name: "Strike Interceptor", defenceHp: 90, attackHp: 300, carry: 4000, speed: 50, waterConsumption: 1.0 },
  tank: { name: "Bomber Tank", defenceHp: 50, attackHp: 50, carry: 0, speed: 15, waterConsumption: 2.0 },
  looter: { name: "Rogue Looter", defenceHp: 40, attackHp: 40, carry: 10000, speed: 100, waterConsumption: 1.5 },
  drone: { name: "Scout Drone", defenceHp: 50, attackHp: 50, carry: 2000, speed: 75, waterConsumption: 0.2 },
  settlementShip: { name: "Settlement Ship", defenceHp: 500, attackHp: 0, carry: 50000, speed: 20, waterConsumption: 2.5 }
};

// Help helper for repository capacity
function getRepositoryCapacity(level: number): number {
  // Starts at 10,000 at lvl 1, goes up to 5,000,000 at lvl 45
  if (level <= 1) return 10000;
  if (level >= 45) return 5000000;
  return Math.round(10000 * Math.pow(5000000 / 10000, (level - 1) / 44));
}

// Help helper for mine hourly production
function getMineProductionPerHour(level: number, type: ResourceType): number {
  if (level <= 0) return 100; // Base baseline
  // Max at level 15: 25000 sum for non-water (3 mines -> 8333.33 each)
  // Max for water: 84000 sum (6 mines -> 14000 each)
  if (type === "water") {
    return Math.round((level / 15) * 14000);
  }
  const maxMineProduction = 8333.33;
  return Math.round((level / 15) * maxMineProduction);
}

// Save state helper
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save state", err);
  }
}

// Load state helper
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf8");
      state = JSON.parse(data);
      
      // Auto-migrate any outpost names to station names for loaded sectors
      if (state && state.players) {
        Object.values(state.players).forEach((p: any) => {
          if (p && Array.isArray(p.planets)) {
            p.planets.forEach((pl: any) => {
              if (pl && typeof pl.name === "string" && pl.name.includes("Outpost")) {
                pl.name = pl.name.replace(/Outpost/g, "Station");
              }
              if (pl && pl.troops) {
                if (pl.troops.settlementShip === undefined) {
                  pl.troops.settlementShip = 0;
                }
              }
            });
          }
        });
      }

      if (!state.habitablePlanets) {
        state.habitablePlanets = [
          { id: "hab_12_18", name: "Habitable Gaia Aurelia", coords: { x: 12, y: 18 }, isColonized: false },
          { id: "hab_34_72", name: "Habitable Station Kepler-Prime", coords: { x: 34, y: 72 }, isColonized: false },
          { id: "hab_45_19", name: "Habitable Outpost Gliese-91", coords: { x: 45, y: 19 }, isColonized: false },
          { id: "hab_67_82", name: "Habitable Station New Hope", coords: { x: 67, y: 82 }, isColonized: false },
          { id: "hab_15_55", name: "Habitable Planet Epsilon-D", coords: { x: 15, y: 55 }, isColonized: false },
          { id: "hab_85_44", name: "Habitable Station Zephyr-9", coords: { x: 85, y: 44 }, isColonized: false },
          { id: "hab_52_63", name: "Habitable Planet Arcadia", coords: { x: 52, y: 63 }, isColonized: false },
          { id: "hab_29_31", name: "Habitable Core Dome-A", coords: { x: 29, y: 31 }, isColonized: false },
          { id: "hab_73_25", name: "Habitable Station Oasis-1", coords: { x: 73, y: 25 }, isColonized: false },
          { id: "hab_91_85", name: "Habitable Planet Eden-X", coords: { x: 91, y: 85 }, isColonized: false },
          { id: "hab_8_92", name: "Habitable Outpost Genesis", coords: { x: 8, y: 92 }, isColonized: false },
          { id: "hab_40_40", name: "Habitable Station Midway", coords: { x: 40, y: 40 }, isColonized: false }
        ];
      }

      saveState(); // Persist migrated names back to file
      
      console.log("State loaded successfully. Players count:", Object.keys(state.players).length);
    } else {
      console.log("No existing state file found. Bootstrapping universe...");
      bootstrapUniverse();
    }
  } catch (err) {
    console.error("Failed to load state", err);
    bootstrapUniverse();
  }
}

// Create initial planet
function createInitialPlanet(name: string, sectorX: number, sectorY: number): ColonyPlanet {
  const createMines = (count: number): MineState[] => {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      level: 1,
      isUpgrading: false,
      upgradeEnd: null
    }));
  };

  return {
    id: `planet_${Math.random().toString(36).substr(2, 9)}`,
    name: name,
    sectorX,
    sectorY,
    skinId: "default",
    mines: {
      water: createMines(6),
      plasma: createMines(3),
      fuel: createMines(3),
      food: createMines(3),
      respirant: createMines(3)
    },
    buildings: {
      commsHub: { level: 1, maxLevel: 50, isUpgrading: false, upgradeEnd: null },
      researchCenter: { level: 1, maxLevel: 20, isUpgrading: false, upgradeEnd: null },
      armyBase: { level: 1, maxLevel: 30, isUpgrading: false, upgradeEnd: null },
      repository: { level: 1, maxLevel: 45, isUpgrading: false, upgradeEnd: null },
      radar: { level: 1, maxLevel: 15, isUpgrading: false, upgradeEnd: null }
    },
    resources: {
      water: 5000,
      plasma: 5000,
      fuel: 5000,
      food: 5000,
      respirant: 5000
    },
    troops: {
      defender: 10,
      attacker: 5,
      tank: 1,
      looter: 3,
      drone: 5,
      settlementShip: 0
    },
    trainingQueue: []
  };
}

// Bootstrap AI players to make the world feel populated and active
function bootstrapUniverse() {
  state.players = {};
  state.alliances = {};
  state.chatMessages = [];
  state.fleets = [];
  state.battleReports = [];
  state.newsEvents = [
    {
      id: "news_0",
      title: "Galactic Server Active",
      content: "The seasonal space arena is open. Recruit commanders, fortify your moonbases, and seize dominion of the sector!",
      type: "system",
      timestamp: Date.now()
    }
  ];

  const factions = ["Solar Alliance", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];

  // Create 2 AI Alliances
  const voidAlliance: Alliance = {
    id: "alliance_void",
    name: "VOID SYNDICATE",
    tag: "VOID",
    leaderId: "ai_1",
    leaderName: "VoidLord",
    members: [
      { playerId: "ai_1", username: "VoidLord", role: "leader" },
      { playerId: "ai_2", username: "XenonHunter", role: "officer" },
      { playerId: "ai_3", username: "NebulaKnight", role: "member" }
    ],
    wars: [],
    bannerColor: "#FF007A",
    bannerSymbol: "▲"
  };

  const empireAlliance: Alliance = {
    id: "alliance_empire",
    name: "SOLAR EMPIRE",
    tag: "SOL",
    leaderId: "ai_4",
    leaderName: "Astraea",
    members: [
      { playerId: "ai_4", username: "Astraea", role: "leader" },
      { playerId: "ai_5", username: "TitanKing", role: "officer" },
      { playerId: "ai_6", username: "StarEclipse", role: "member" }
    ],
    wars: [],
    bannerColor: "#00F0FF",
    bannerSymbol: "◈"
  };

  state.alliances[voidAlliance.id] = voidAlliance;
  state.alliances[empireAlliance.id] = empireAlliance;

  const aiNames = [
    { name: "VoidLord", coords: { x: 12, y: 34 }, allianceId: "alliance_void", faction: factions[1], color: factionColors[1] },
    { name: "XenonHunter", coords: { x: 18, y: 40 }, allianceId: "alliance_void", faction: factions[1], color: factionColors[1] },
    { name: "NebulaKnight", coords: { x: 8, y: 22 }, allianceId: "alliance_void", faction: factions[1], color: factionColors[1] },
    { name: "Astraea", coords: { x: 55, y: 78 }, allianceId: "alliance_empire", faction: factions[0], color: factionColors[0] },
    { name: "TitanKing", coords: { x: 62, y: 82 }, allianceId: "alliance_empire", faction: factions[0], color: factionColors[0] },
    { name: "StarEclipse", coords: { x: 50, y: 70 }, allianceId: "alliance_empire", faction: factions[0], color: factionColors[0] },
    { name: "CosmoPirate", coords: { x: 88, y: 15 }, allianceId: null, faction: factions[2], color: factionColors[2] },
    { name: "NovaSlayer", coords: { x: 42, y: 45 }, allianceId: null, faction: factions[2], color: factionColors[2] },
    { name: "SolarWing", coords: { x: 30, y: 90 }, allianceId: null, faction: factions[0], color: factionColors[0] },
    { name: "Stardust", coords: { x: 75, y: 25 }, allianceId: null, faction: factions[1], color: factionColors[1] }
  ];

  aiNames.forEach((ai, idx) => {
    const id = `ai_${idx + 1}`;
    const planet = createInitialPlanet(`${ai.name}'s Station`, ai.coords.x, ai.coords.y);
    
    // Give AI slightly buffed mine levels so player can raid them
    const randomLvl = () => Math.floor(Math.random() * 8) + 2;
    for (const key of Object.keys(planet.mines)) {
      planet.mines[key as ResourceType].forEach(m => m.level = randomLvl());
    }
    planet.buildings.commsHub.level = Math.floor(Math.random() * 10) + 1;
    planet.buildings.researchCenter.level = Math.floor(Math.random() * 12) + 1;
    planet.buildings.radar.level = Math.floor(Math.random() * 8) + 1;
    planet.buildings.repository.level = Math.floor(Math.random() * 15) + 1;

    // Simulate different scores
    const player: PlayerProfile = {
      id,
      username: ai.name,
      faction: ai.faction,
      factionColor: ai.color,
      allianceId: ai.allianceId,
      allianceRole: ai.allianceId ? "member" : null,
      planets: [planet],
      scores: {
        population: Math.floor(Math.random() * 1000) + 200,
        attack: Math.floor(Math.random() * 8000),
        defence: Math.floor(Math.random() * 6000),
        raiders: Math.floor(Math.random() * 500000)
      },
      achievements: ["First Mine", "Fleet Commander"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now() - 86400000,
      credits: Math.floor(Math.random() * 4000) + 1500
    };

    if (id === voidAlliance.leaderId) player.allianceRole = "leader";
    if (id === empireAlliance.leaderId) player.allianceRole = "leader";

    state.players[id] = player;
  });

  // Make VOID & SOL declare war!
  voidAlliance.wars.push({
    targetAllianceId: empireAlliance.id,
    targetAllianceName: empireAlliance.name,
    declaredAt: Date.now() - 3600000
  });

  state.newsEvents.push({
    id: "news_war_bootstrap",
    title: "War Declared!",
    content: "The VOID SYNDICATE has officially declared war against the SOLAR EMPIRE! Alliance boundaries are now borders under siege.",
    type: "war",
    timestamp: Date.now() - 3600000
  });

  saveState();
}

// Update single player state - calculate resource collection, troop water consumption, finish upgrades
function tickPlayerState(playerId: string, now: number): boolean {
  const player = state.players[playerId];
  if (!player) return false;

  let changed = false;

  player.planets.forEach(planet => {
    // Determine elapsed hours for production
    const repositoryLvl = planet.buildings.repository.level;
    const storageLimit = getRepositoryCapacity(repositoryLvl);

    // Calculate total troop water consumption per hour
    let waterConsumptionPerHour = 0;
    Object.entries(planet.troops).forEach(([troopId, count]) => {
      const spec = TROOP_SPECS[troopId as keyof typeof TROOP_SPECS];
      if (spec) {
        waterConsumptionPerHour += count * spec.waterConsumption;
      }
    });

    // We can run a tick based on a fast-forward/real-time delta
    // Since we want reliable values, let's keep track of a "lastTick" or use a time comparison.
    // We will associate a _lastTick on the planet. If not present, default to now.
    const lastTick = (planet as any)._lastTick || now;
    (planet as any)._lastTick = now;

    const deltaMs = now - lastTick;
    if (deltaMs > 0) {
      const deltaHours = deltaMs / 3600000;

      // Mine upgrade handling
      for (const resKey of Object.keys(planet.mines)) {
        const mines = planet.mines[resKey as ResourceType];
        mines.forEach(mine => {
          if (mine.isUpgrading && mine.upgradeEnd && now >= mine.upgradeEnd) {
            mine.level += 1;
            mine.isUpgrading = false;
            mine.upgradeEnd = null;
            changed = true;
          }
          
          // Accumulate Resource
          const isOtherMaxed = 
            planet.resources.plasma >= storageLimit &&
            planet.resources.fuel >= storageLimit &&
            planet.resources.food >= storageLimit &&
            planet.resources.respirant >= storageLimit;
          
          const hourlyProd = isOtherMaxed ? (resKey === "water" ? 14000 : 42000) : getMineProductionPerHour(mine.level, resKey as ResourceType);
          const accumulated = hourlyProd * deltaHours;
          
          if (resKey === "water") {
            // Water production from mine
            planet.resources.water += accumulated;
          } else {
            planet.resources[resKey as ResourceType] = Math.min(
              storageLimit,
              planet.resources[resKey as ResourceType] + accumulated
            );
          }
        });
      }

      // Deduct consumption rates (Water, Respirant 4x, Food 1.5x)
      const waterConsumed = waterConsumptionPerHour * deltaHours;
      const respirantConsumed = waterConsumptionPerHour * 4 * deltaHours;
      const foodConsumed = waterConsumptionPerHour * 1.5 * deltaHours;

      planet.resources.water = planet.resources.water - waterConsumed;
      planet.resources.respirant = planet.resources.respirant - respirantConsumed;
      planet.resources.food = planet.resources.food - foodConsumed;

      let triggerAttrition = false;

      if (planet.resources.water < 0) {
        planet.resources.water = 0;
        triggerAttrition = true;
      } else {
        planet.resources.water = Math.min(storageLimit, planet.resources.water);
      }

      if (planet.resources.respirant < 0) {
        planet.resources.respirant = 0;
        triggerAttrition = true;
      } else {
        planet.resources.respirant = Math.min(storageLimit, planet.resources.respirant);
      }

      if (planet.resources.food < 0) {
        planet.resources.food = 0;
        triggerAttrition = true;
      } else {
        planet.resources.food = Math.min(storageLimit, planet.resources.food);
      }

      if (triggerAttrition) {
        // Essential resources exhausted! Troops start slowly dying of attrition (starvation/suffocation/dehydration)
        const attritionRate = 0.15; // 15% per hour
        if (deltaHours > 0) {
          const deathFactor = Math.exp(-attritionRate * deltaHours);
          Object.keys(planet.troops).forEach(tId => {
            const count = planet.troops[tId as keyof typeof planet.troops];
            if (count > 0) {
              const remaining = Math.max(0, Math.floor(count * deathFactor));
              if (remaining < count) {
                planet.troops[tId as keyof typeof planet.troops] = remaining;
                changed = true;
              }
            }
          });
        }
      }

      // Building upgrades handling
      for (const bKey of Object.keys(planet.buildings)) {
        const building = planet.buildings[bKey as keyof typeof planet.buildings] as BuildingState;
        if (building.isUpgrading && building.upgradeEnd && now >= building.upgradeEnd) {
          building.level += 1;
          building.isUpgrading = false;
          building.upgradeEnd = null;
          changed = true;
        }
      }

      // Troop training queue handling (Sequential Processing)
      if (planet.trainingQueue.length > 0) {
        const baseTimes = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
        
        let activeItem = planet.trainingQueue[0];
        while (activeItem && now >= activeItem.completedAt) {
          // This queue item is fully completed
          planet.troops[activeItem.troopId as keyof typeof planet.troops] += activeItem.count;
          changed = true;
          planet.trainingQueue.shift(); // Remove completed item
          
          const prevCompletionTime = activeItem.completedAt;
          activeItem = planet.trainingQueue[0];
          if (activeItem) {
            // Shift the new active item's timestamps to start from the end of the previous one
            const duration = activeItem.completedAt - activeItem.startedAt;
            activeItem.startedAt = prevCompletionTime;
            activeItem.completedAt = prevCompletionTime + duration;
          }
        }

        // Process fractional progress on the active item at index 0
        if (activeItem) {
          const bTime = baseTimes[activeItem.troopId as keyof typeof baseTimes] || 30;
          const rcLevel = planet.buildings.researchCenter.level;
          const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
          const unitDurationMs = Math.max(1000, Math.round(bTime * (1 - reductionFrac) * 1000));

          const timePassedSinceStart = now - activeItem.startedAt;
          const completedUnits = Math.floor(timePassedSinceStart / unitDurationMs);

          if (completedUnits > 0) {
            const actualCompleted = Math.min(activeItem.count, completedUnits);
            if (actualCompleted > 0) {
              planet.troops[activeItem.troopId as keyof typeof planet.troops] += actualCompleted;
              activeItem.count -= actualCompleted;
              activeItem.startedAt += actualCompleted * unitDurationMs;
              changed = true;
            }
          }

          if (activeItem.count <= 0) {
            planet.trainingQueue.shift();
            // Start next item if exists
            const nextItem = planet.trainingQueue[0];
            if (nextItem) {
              const duration = nextItem.completedAt - nextItem.startedAt;
              nextItem.startedAt = now;
              nextItem.completedAt = now + duration;
            }
          }
        }
      }
    }
  });

  // Calculate current Population Score
  let popScore = 0;
  player.planets.forEach(planet => {
    // Mines
    for (const resKey of Object.keys(planet.mines)) {
      planet.mines[resKey as ResourceType].forEach(m => {
        popScore += m.level * 10;
      });
    }
    // Buildings
    for (const bKey of Object.keys(planet.buildings)) {
      const b = planet.buildings[bKey as keyof typeof planet.buildings];
      popScore += b.level * 30;
    }
  });
  if (player.scores.population !== popScore) {
    player.scores.population = popScore;
    changed = true;
  }

  return changed;
}

interface BattleRound {
  round: number;
  logs: string[];
  attackerRemaining: Record<string, number>;
  defenderRemaining: Record<string, number>;
}

function simulateMoonbaseCombat(
  attackerName: string,
  defenderName: string,
  attTroops: Record<string, number>,
  defTroops: Record<string, number>
) {
  const attRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...attTroops };
  const defRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...defTroops };

  const attackerLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const defenderLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

  const rounds: BattleRound[] = [];
  let attackHpKilled = 0;
  let defenceHpKilled = 0;

  for (let r = 1; r <= 6; r++) {
    const roundLogs: string[] = [];
    const totalAtt = Object.values(attRemaining).reduce((s, v) => s + v, 0);
    const totalDef = Object.values(defRemaining).reduce((s, v) => s + v, 0);

    if (totalAtt === 0 || totalDef === 0) {
      break;
    }

    let attDamage = 0;
    Object.entries(attRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec) attDamage += count * spec.attackHp;
    });

    let defDamage = 0;
    Object.entries(defRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec) defDamage += count * spec.attackHp;
    });

    const activeAttTypes = (Object.keys(attRemaining) as (keyof typeof attRemaining)[]).filter(k => attRemaining[k] > 0);
    const activeDefTypes = (Object.keys(defRemaining) as (keyof typeof defRemaining)[]).filter(k => defRemaining[k] > 0);

    const roundAttLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    const roundDefLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

    roundLogs.push(`--- COMBAT CYCLE ${r} INITIATED ---`);
    roundLogs.push(`Attackers throw ${attDamage.toLocaleString()} megawatt laser channels into target coordinates.`);
    roundLogs.push(`Defenders respond with ${defDamage.toLocaleString()} railgun munitions and orbit guards.`);

    if (attDamage > 0 && activeDefTypes.length > 0) {
      const share = attDamage / activeDefTypes.length;
      activeDefTypes.forEach(tId => {
        const spec = TROOP_SPECS[tId];
        const unitHp = spec ? spec.defenceHp : 100;
        const currentCount = defRemaining[tId];
        const killed = Math.min(currentCount, Math.floor(share / unitHp));
        if (killed > 0) {
          roundDefLosses[tId] = killed;
          defenderLosses[tId] += killed;
          defRemaining[tId] -= killed;
          defenceHpKilled += killed * unitHp;
        }
      });
    }

    if (defDamage > 0 && activeAttTypes.length > 0) {
      const share = defDamage / activeAttTypes.length;
      activeAttTypes.forEach(tId => {
        const spec = TROOP_SPECS[tId];
        const unitHp = spec ? spec.defenceHp : 100;
        const currentCount = attRemaining[tId];
        const killed = Math.min(currentCount, Math.floor(share / unitHp));
        if (killed > 0) {
          roundAttLosses[tId] = killed;
          attackerLosses[tId] += killed;
          attRemaining[tId] -= killed;
          attackHpKilled += killed * unitHp;
        }
      });
    }

    const attKilledText = Object.entries(roundAttLosses)
      .filter(([_, qty]) => qty > 0)
      .map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.name || tId}`)
      .join(", ");
    const defKilledText = Object.entries(roundDefLosses)
      .filter(([_, qty]) => qty > 0)
      .map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.name || tId}`)
      .join(", ");

    if (attKilledText) {
      roundLogs.push(`Attacker casualties: ${attKilledText}.`);
    } else {
      roundLogs.push(`Attacker structural shields held perfectly.`);
    }

    if (defKilledText) {
      roundLogs.push(`Defender casualties: ${defKilledText}.`);
    } else {
      roundLogs.push(`Defender defense line remained impenetrable.`);
    }

    rounds.push({
      round: r,
      logs: roundLogs,
      attackerRemaining: { ...attRemaining },
      defenderRemaining: { ...defRemaining }
    });
  }

  const finalAttCount = Object.values(attRemaining).reduce((s, v) => s + v, 0);
  const finalDefCount = Object.values(defRemaining).reduce((s, v) => s + v, 0);
  let winner: "attacker" | "defender" = "defender";

  if (finalAttCount > 0 && finalDefCount === 0) {
    winner = "attacker";
  } else if (finalAttCount === 0 && finalDefCount > 0) {
    winner = "defender";
  } else {
    const finalAttHp = Object.entries(attRemaining).reduce((sum, [tId, qty]) => sum + qty * (TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.defenceHp || 100), 0);
    const finalDefHp = Object.entries(defRemaining).reduce((sum, [tId, qty]) => sum + qty * (TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.defenceHp || 100), 0);
    if (finalAttHp > finalDefHp) {
      winner = "attacker";
    } else {
      winner = "defender";
    }
  }

  return {
    winner,
    attackerLosses,
    defenderLosses,
    attackerRemaining: attRemaining,
    defenderRemaining: defRemaining,
    attackHpKilled,
    defenceHpKilled,
    rounds
  };
}

// Tick All Fleets and resolve arrivals
function tickFleets(now: number) {
  let stateChanged = false;
  const activeFleets = [...state.fleets];
  const remainingFleets: FleetMission[] = [];

  activeFleets.forEach(fleet => {
    if (fleet.isWaitingToSettle) {
      remainingFleets.push(fleet);
    } else if (now >= fleet.arrivesAt) {
      if (fleet.missionType === "colonize" && !fleet.isReturning) {
        fleet.isWaitingToSettle = true;
        stateChanged = true;
        remainingFleets.push(fleet);
      } else {
        // Fleet arrived! Resolve mission inside
        stateChanged = true;
        resolveFleetMission(fleet, now, remainingFleets);
      }
    } else {
      remainingFleets.push(fleet);
    }
  });

  state.fleets = remainingFleets;
  if (stateChanged) saveState();
}

// Resolve fleet combat/exploration/colonization
function resolveFleetMission(fleet: FleetMission, now: number, remainingFleets: FleetMission[]) {
  // If returning, fleet has arrived back home
  if (fleet.isReturning) {
    const sender = state.players[fleet.senderId];
    if (sender) {
      const homePlanet = sender.planets[0]; // Assumes first planet for simplicity
      if (homePlanet) {
        // Return surviving troops
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          homePlanet.troops[tId as keyof typeof homePlanet.troops] += count;
        });
        // Return stolen loot
        if (fleet.lootCarried) {
          const cap = getRepositoryCapacity(homePlanet.buildings.repository.level);
          Object.entries(fleet.lootCarried).forEach(([res, amt]) => {
            homePlanet.resources[res as ResourceType] = Math.min(
              cap,
              homePlanet.resources[res as ResourceType] + amt
            );
          });
        }
      }
    }
    return;
  }

  // Active missions
  const attacker = state.players[fleet.senderId];
  const defender = fleet.targetId ? state.players[fleet.targetId] : null;

  if (fleet.missionType === "recon") {
    // Recon generates a scout battle report / report
    const report: BattleReport = {
      id: `battle_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      attackerId: fleet.senderId,
      attackerName: fleet.senderName,
      defenderId: fleet.targetId || "unknown",
      defenderName: fleet.targetName,
      isRecon: true,
      attackerCoords: fleet.senderCoords,
      defenderCoords: fleet.targetCoords,
      attackerInitialTroops: fleet.troops,
      attackerLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      defenderInitialTroops: defender?.planets[0]?.troops || { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      defenderLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      winner: "attacker",
      resourcesStolen: { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 },
      attackHpKilled: 0,
      defenceHpKilled: 0
    };
    state.battleReports.unshift(report);

    // Fleet returns back immediately
    const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
    const speed = TROOP_SPECS.drone.speed;
    const travelTimeMs = Math.round((totalDist / speed) * 60000); // Minutes to ms

    remainingFleets.push({
      ...fleet,
      isReturning: true,
      startedAt: now,
      arrivesAt: now + travelTimeMs
    });
    return;
  }

  if (fleet.missionType === "colonize") {
    if (attacker) {
      // Check researchCenter level 20 requirements
      const hasLvl20 = attacker.planets.some(p => p.buildings.researchCenter.level >= 20);
      if (hasLvl20 && attacker.planets.length < 5) {
        // Create new planet
        const planetNum = attacker.planets.length + 1;
        const newPlanet = createInitialPlanet(`${attacker.username}'s Colony ${planetNum}`, fleet.targetCoords.x, fleet.targetCoords.y);
        
        // Put surviving colonizing troops into this planet
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          newPlanet.troops[tId as keyof typeof newPlanet.troops] = count;
        });

        attacker.planets.push(newPlanet);

        // Add news event
        state.newsEvents.unshift({
          id: `news_${Math.random().toString(36).substr(2, 9)}`,
          title: "Planet Colonized",
          content: `${attacker.username} has established a new base at sector [${fleet.targetCoords.x}, ${fleet.targetCoords.y}]!`,
          type: "discovery",
          timestamp: now
        });
      } else {
        // Failed colonize, sends squad back
        const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
        remainingFleets.push({
          ...fleet,
          isReturning: true,
          startedAt: now,
          arrivesAt: now + 10000
        });
      }
    }
    return;
  }

  if (fleet.missionType === "attack") {
    if (!attacker || !defender) {
      // Defender got deleted or not existing, return fleet
      remainingFleets.push({
        ...fleet,
        isReturning: true,
        startedAt: now,
        arrivesAt: now + 5000
      });
      return;
    }

    const defPlanet = defender.planets[0]; // Combat on main station for simpleness
    const attTroops = { ...fleet.troops };
    const defTroops = defPlanet ? { ...defPlanet.troops } : { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 };

    // Execute Moonbase combat simulation
    const combat = simulateMoonbaseCombat(
      fleet.senderName,
      fleet.targetName,
      attTroops,
      defTroops
    );

    // Apply casualties to defender
    if (defPlanet) {
      Object.entries(combat.defenderLosses).forEach(([tId, count]) => {
        defPlanet.troops[tId as keyof typeof defPlanet.troops] -= count;
      });
    }

    // Award scoring to the WINNER only
    if (combat.winner === "attacker") {
      attacker.scores.attack += combat.defenceHpKilled;
    } else {
      defender.scores.defence += combat.attackHpKilled;
    }

    // Loot calculations (only if attacker won and has loot space)
    const loot = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
    let totalLootCapacity = 0;
    
    Object.entries(combat.attackerRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec) totalLootCapacity += count * spec.carry;
    });

    if (combat.winner === "attacker" && totalLootCapacity > 0 && defPlanet) {
      // Steal equal proportion of each resource
      const items: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
      let defenseTotalResources = items.reduce((sum, item) => sum + defPlanet.resources[item], 0);

      if (defenseTotalResources > 0) {
        const stealAmount = Math.min(totalLootCapacity, defenseTotalResources);
        const stealFrac = stealAmount / defenseTotalResources;

        items.forEach(item => {
          const stolen = Math.floor(defPlanet.resources[item] * stealFrac);
          defPlanet.resources[item] -= stolen;
          loot[item] = stolen;
        });

        // Accumulate raiders score to attacker
        const totalStolen = Object.values(loot).reduce((sum, val) => sum + val, 0);
        attacker.scores.raiders += totalStolen;
      }
    }

    // Bomber tanks: destroying defender buildings if attacker won with surviving tanks
    const buildingDamageReports: { buildingName: string; levelsDestroyed: number; previousLevel: number; newLevel: number }[] = [];
    if (combat.winner === "attacker" && combat.attackerRemaining.tank > 0 && defPlanet) {
      // Every 3 surviving tanks destroys 1 level of a random building
      const destructionPower = Math.floor(combat.attackerRemaining.tank / 3);
      if (destructionPower > 0) {
        const destructibleBuildings = Object.keys(defPlanet.buildings) as (keyof typeof defPlanet.buildings)[];
        
        for (let i = 0; i < destructionPower; i++) {
          const bKey = destructibleBuildings[Math.floor(Math.random() * destructibleBuildings.length)];
          const bState = defPlanet.buildings[bKey];
          if (bState.level > 1) {
            const prevLvl = bState.level;
            bState.level -= 1;
            buildingDamageReports.push({
              buildingName: bKey,
              levelsDestroyed: 1,
              previousLevel: prevLvl,
              newLevel: bState.level
            });
          }
        }
      }
    }

    // Save Battle info
    const report: BattleReport = {
      id: `battle_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      attackerId: fleet.senderId,
      attackerName: fleet.senderName,
      attackerAlliance: attacker.allianceId ? state.alliances[attacker.allianceId]?.tag : undefined,
      defenderId: fleet.targetId!,
      defenderName: fleet.targetName,
      defenderAlliance: defender.allianceId ? state.alliances[defender.allianceId]?.tag : undefined,
      attackerCoords: fleet.senderCoords,
      defenderCoords: fleet.targetCoords,
      attackerInitialTroops: attTroops,
      attackerLosses: combat.attackerLosses,
      defenderInitialTroops: defTroops,
      defenderLosses: combat.defenderLosses,
      winner: combat.winner,
      resourcesStolen: loot,
      buildingDamage: buildingDamageReports.length > 0 ? buildingDamageReports : undefined,
      attackHpKilled: combat.attackHpKilled,
      defenceHpKilled: combat.defenceHpKilled,
      battleRounds: combat.rounds
    };

    state.battleReports.unshift(report);

    // Push central news feed
    const lootSum = Object.values(loot).reduce((s, v) => s + v, 0);
    const destructionDetails = buildingDamageReports.length > 0 
      ? ` damaging defenses by ${buildingDamageReports.length} levels.` 
      : ".";
    
    state.newsEvents.unshift({
      id: `news_${Math.random().toString(36).substr(2, 9)}`,
      title: combat.winner === "attacker" ? "Base Raided!" : "Raid Defended!",
      content: combat.winner === "attacker" 
        ? `${attacker.username} successfully raided ${defender.username} at [${fleet.targetCoords.x}, ${fleet.targetCoords.y}] taking ${lootSum.toLocaleString()} resources${destructionDetails}`
        : `${defender.username} repelled a brutal fleet raid sent by ${attacker.username}!`,
      type: "raid",
      timestamp: now
    });

    // Clean up news size
    if (state.newsEvents.length > 50) state.newsEvents = state.newsEvents.slice(0, 50);

    // Send fleet back with surviving troops & loot
    const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
    const slowestTroopSpeed = Object.entries(combat.attackerRemaining)
      .filter(([_, qty]) => qty > 0)
      .reduce((slowest, [tId, _]) => {
        const sp = TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.speed || 50;
        return sp < slowest ? sp : slowest;
      }, 100);

    // Travel time formula (seconds)
    const travelTimeMs = Math.round((totalDist / slowestTroopSpeed) * 60000);

    remainingFleets.push({
      ...fleet,
      isReturning: true,
      troops: combat.attackerRemaining,
      lootCarried: loot,
      startedAt: now,
      arrivesAt: now + Math.max(10000, travelTimeMs) // 10s floor to make it satisfying
    });
  }
}

// Generate background simulated active sandbox activities
function runAISimulatedActivity(now: number) {
  const players = Object.values(state.players).filter(p => p.id.startsWith("ai_"));
  if (players.length === 0) return;

  // Let 1-2 AI do randomized activities
  const luckyAI = players[Math.floor(Math.random() * players.length)];
  const actionType = Math.random();

  if (actionType < 0.25) {
    // 25% chance of sending a diplomatic banter in global chat!
    const banter = [
      "Securing boundaries in sector " + luckyAI.planets[0].sectorX + ", peace is a planetary illusion.",
      "Any active alliance looking for a strong merger? VOID is recruiting officers.",
      "Just upgraded my research center! The speed of light is no longer a restriction.",
      "Scouting for coordinates coordinates. Watch your back!",
      "Water consumption is getting tight, need to construct more water pumps!"
    ];

    const message: ChatMessage = {
      id: `chat_${Math.random().toString(36).substr(2, 9)}`,
      channel: "global",
      senderId: luckyAI.id,
      senderName: luckyAI.username,
      senderFaction: luckyAI.faction,
      senderFactionColor: luckyAI.factionColor,
      allianceTag: luckyAI.allianceId ? state.alliances[luckyAI.allianceId]?.tag : null,
      receiverId: null,
      content: banter[Math.floor(Math.random() * banter.length)],
      timestamp: now
    };
    state.chatMessages.push(message);
    if (state.chatMessages.length > 100) state.chatMessages.shift();

  } else if (actionType < 0.45) {
    // 20% chance of launching an AI fleet towards an inactive/other AI player
    const defender = players[Math.floor(Math.random() * players.length)];
    if (defender && defender.id !== luckyAI.id) {
      const p = luckyAI.planets[0];
      const targetP = defender.planets[0];

      const missionType = Math.random() > 0.4 ? "attack" : "recon";
      const totalDist = Math.hypot(targetP.sectorX - p.sectorX, targetP.sectorY - p.sectorY);
      const fleetSpeed = missionType === "recon" ? 75 : 40;
      const travelTimeMs = Math.round((totalDist / fleetSpeed) * 60000);

      const mission: FleetMission = {
        id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
        senderId: luckyAI.id,
        senderName: luckyAI.username,
        senderCoords: { x: p.sectorX, y: p.sectorY },
        targetId: defender.id,
        targetName: defender.username,
        targetCoords: { x: targetP.sectorX, y: targetP.sectorY },
        missionType,
        troops: {
          defender: missionType === "attack" ? 15 : 0,
          attacker: missionType === "attack" ? 25 : 0,
          tank: missionType === "attack" ? 3 : 0,
          looter: missionType === "attack" ? 10 : 0,
          drone: missionType === "recon" ? 5 : 1,
          settlementShip: 0
        },
        startedAt: now,
        arrivesAt: now + Math.max(15000, travelTimeMs), // 15s floor
        isReturning: false
      };
      state.fleets.push(mission);
    }
  } else if (actionType < 0.7) {
    // Upgrade own mines or buildings slightly to simulate progression
    const p = luckyAI.planets[0];
    const upgradeBuilding = Math.random() > 0.5;
    if (upgradeBuilding) {
      const bKeys = Object.keys(p.buildings) as (keyof typeof p.buildings)[];
      const targetB = bKeys[Math.floor(Math.random() * bKeys.length)];
      if (p.buildings[targetB].level < 15) {
        p.buildings[targetB].level += 1;
        luckyAI.scores.population += 30;
      }
    } else {
      const minesKeys = Object.keys(p.mines) as ResourceType[];
      const targetRes = minesKeys[Math.floor(Math.random() * minesKeys.length)];
      const mine = p.mines[targetRes][Math.floor(Math.random() * p.mines[targetRes].length)];
      if (mine.level < 15) {
        mine.level += 1;
        luckyAI.scores.population += 10;
      }
    }
  }
}

// Global loop logic
loadState();
setInterval(() => {
  const now = Date.now();
  
  // Tick active human and AI players
  Object.keys(state.players).forEach(pId => {
    tickPlayerState(pId, now);
  });

  // Tick moving fleets
  tickFleets(now);

  // Background sandbox stimulation (every ~45 seconds)
  if (Math.random() < 0.3) {
    runAISimulatedActivity(now);
  }

}, 4000);


// ----------------- EXPRESS API HANDLERS -----------------

// Helper to find player profile and verify token/session
function getLoggedPlayer(req: express.Request): PlayerProfile | null {
  const userId = req.headers["x-user-id"] as string;
  if (!userId || !state.players[userId]) return null;
  return state.players[userId];
}

// Authentication
app.post("/api/register", (req, res) => {
  const { username, faction } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Check if exists
  const exists = Object.values(state.players).some(p => p.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Commander username already registered" });
  }

  const factions = ["Solar Alliance", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const selectFaction = factions.includes(faction) ? faction : factions[0];
  const idx = factions.indexOf(selectFaction);
  const selectColor = factionColors[idx];

  const id = `user_${Math.random().toString(36).substr(2, 9)}`;
  const startX = Math.floor(Math.random() * 90) + 5;
  const startY = Math.floor(Math.random() * 90) + 5;

  const planet = createInitialPlanet(`${username}'s Station`, startX, startY);
  
  // Max out default user station buildings
  planet.buildings.commsHub.level = planet.buildings.commsHub.maxLevel;
  planet.buildings.researchCenter.level = planet.buildings.researchCenter.maxLevel;
  planet.buildings.armyBase.level = planet.buildings.armyBase.maxLevel;
  planet.buildings.repository.level = planet.buildings.repository.maxLevel;
  planet.buildings.radar.level = planet.buildings.radar.maxLevel;

  // Max out default user station mines to level 15
  for (const key of Object.keys(planet.mines)) {
    planet.mines[key as ResourceType].forEach(m => m.level = 15);
  }

  // Supply starting resources up to max capacity (5,000,000)
  const maxCap = getRepositoryCapacity(planet.buildings.repository.level);
  planet.resources.water = maxCap;
  planet.resources.plasma = maxCap;
  planet.resources.fuel = maxCap;
  planet.resources.food = maxCap;
  planet.resources.respirant = maxCap;

  // Supply exactly one settlement ship
  planet.troops.settlementShip = 1;
  
  const newPlayer: PlayerProfile = {
    id,
    username,
    faction: selectFaction,
    factionColor: selectColor,
    allianceId: null,
    allianceRole: null,
    planets: [planet],
    scores: {
      population: 7500, // Starting level 15 mine levels * 10 & building levels * 30
      attack: 0,
      defence: 0,
      raiders: 0
    },
    achievements: ["First Mine Started"],
    skinId: "default",
    bannerId: "default",
    lastDailyRewardClaim: Date.now(),
    credits: 1250
  };

  state.players[id] = newPlayer;

  // Add event
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "New Commander Active",
    content: `Commander ${username} has joined the ${selectFaction} and landed in Sector [${startX}, ${startY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });

  // Welcome message in global chat
  state.chatMessages.push({
    id: `chat_welcome_${Math.random().toString(36).substr(2, 9)}`,
    channel: "global",
    senderId: "system",
    senderName: "CENTRAL COMMAND",
    senderFaction: "System",
    senderFactionColor: "#7F8C8D",
    allianceTag: "SYS",
    receiverId: null,
    content: `Welcome Commander ${username} to active duty in sector [${startX}, ${startY}]! Ensure your water production exceeds consumption!`,
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: newPlayer });
});

app.post("/api/login", (req, res) => {
  const { username } = req.body;
  const player = Object.values(state.players).find(p => p.username.toLowerCase() === username.toLowerCase());
  
  if (!player) {
    return res.status(404).json({ error: "Commander not found" });
  }

  res.json({ player });
});

// Sync full state
app.get("/api/state", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const now = Date.now();
  tickPlayerState(p.id, now);
  tickFleets(now);

  res.json({
    player: p,
    alliances: state.alliances,
    chatMessages: state.chatMessages,
    fleets: state.fleets.filter(f => f.senderId === p.id || f.targetId === p.id), // Only show fleets relevant to me
    battleReports: state.battleReports.filter(r => r.attackerId === p.id || r.defenderId === p.id),
    newsEvents: state.newsEvents,
    serverTime: now
  });
});

// Upgrade Mine
app.post("/api/upgrade/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, resType, mineIndex } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const mines = planet.mines[resType as ResourceType];
  if (!mines || !mines[mineIndex]) return res.status(404).json({ error: "Mine not found" });

  const mine = mines[mineIndex];
  if (mine.isUpgrading) return res.status(400).json({ error: "Mine already upgrading" });
  if (mine.level >= 15) return res.status(400).json({ error: "Mine reaches max level (15)" });

  // Each upgrade costing 1 minute per level on each mine and it would cost 100 of each resource
  const targetLevel = mine.level + 1;
  
  // Verify resources
  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = getUpgradeResourceCost('mine', resType, targetLevel, k);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to upgrade extractor.` });
    }
  }

  // Deduct
  keys.forEach(k => {
    const cost = getUpgradeResourceCost('mine', resType, targetLevel, k);
    planet.resources[k] -= cost;
  });

  const durationMs = targetLevel * 60 * 1000; // 1 minute per level in ms
  mine.isUpgrading = true;
  mine.upgradeEnd = Date.now() + durationMs;

  saveState();
  res.json({ player: p, success: true });
});

// Speed Up Mine Upgrade Using Convenience Credits
app.post("/api/upgrade/mine/complete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, resType, mineIndex } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  const mine = planet?.mines[resType as ResourceType]?.[mineIndex];

  if (!mine || !mine.isUpgrading) return res.status(400).json({ error: "Mine is not currently upgrading" });

  // Complete instantly
  mine.level += 1;
  mine.isUpgrading = false;
  mine.upgradeEnd = null;

  saveState();
  res.json({ player: p, success: true });
});

// Upgrade Building
app.post("/api/upgrade/building", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, buildingKey } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const building = planet.buildings[buildingKey as keyof typeof planet.buildings] as BuildingState;
  if (!building) return res.status(404).json({ error: "Building not found" });

  if (building.isUpgrading) return res.status(400).json({ error: "Building already upgrading" });
  if (building.level >= building.maxLevel) return res.status(400).json({ error: `Building reaches max level (${building.maxLevel})` });

  const targetLevel = building.level + 1;
  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];

  // Verify resources
  for (const k of keys) {
    const cost = getUpgradeResourceCost('building', buildingKey, targetLevel, k);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to upgrade ${buildingKey}.` });
    }
  }

  // Deduct
  keys.forEach(k => {
    const cost = getUpgradeResourceCost('building', buildingKey, targetLevel, k);
    planet.resources[k] -= cost;
  });

  const durationMs = targetLevel * 120 * 1000; // 2 minutes per level
  building.isUpgrading = true;
  building.upgradeEnd = Date.now() + durationMs;

  saveState();
  res.json({ player: p, success: true });
});

// Speed Up Building Upgrade Using Convenience Credits
app.post("/api/upgrade/building/complete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, buildingKey } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  const b = planet ? (planet.buildings[buildingKey as keyof typeof planet.buildings] as BuildingState) : null;

  if (!b || !b.isUpgrading) return res.status(400).json({ error: "Building is not upgrading" });

  b.level += 1;
  b.isUpgrading = false;
  b.upgradeEnd = null;

  saveState();
  res.json({ player: p, success: true });
});

// Train troops
app.post("/api/train/troop", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, troopId, quantity } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const specs = TROOP_SPECS[troopId as keyof typeof TROOP_SPECS];
  if (!specs) return res.status(404).json({ error: "Troop spec not found" });

  const count = parseInt(quantity, 10);
  if (isNaN(count) || count <= 0) return res.status(400).json({ error: "Invalid quantity" });

  // If training a Settlement Ship, enforce "you can only have one on each base"
  if (troopId === "settlementShip") {
    if (count > 1) {
      return res.status(400).json({ error: "You can only construct one Settlement Ship at a time!" });
    }
    const currentShipCount = planet.troops.settlementShip || 0;
    if (currentShipCount >= 1) {
      return res.status(400).json({ error: "You can only have one Settlement Ship on each base!" });
    }
    const isAlreadyTraining = planet.trainingQueue.some(item => item.troopId === "settlementShip");
    if (isAlreadyTraining) {
      return res.status(400).json({ error: "One Settlement Ship is already in the construction queue." });
    }
  }

  // Costs
  const troopCosts = {
    defender: { water: 150, plasma: 0, fuel: 0, food: 200, respirant: 100 },
    attacker: { water: 100, plasma: 150, fuel: 150, food: 100, respirant: 0 },
    tank: { water: 0, plasma: 200, fuel: 300, food: 0, respirant: 100 },
    looter: { water: 250, plasma: 0, fuel: 100, food: 200, respirant: 0 },
    drone: { water: 100, plasma: 100, fuel: 0, food: 0, respirant: 50 },
    settlementShip: { water: 1500, plasma: 1000, fuel: 2000, food: 1500, respirant: 1000 }
  };

  const costMultiplier = count;
  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
  const currentCosts = troopCosts[troopId as keyof typeof troopCosts];

  for (const k of keys) {
    const required = currentCosts[k] * costMultiplier;
    if (planet.resources[k] < required) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${required} to train ${count} troops.` });
    }
  }

  // Deduct
  keys.forEach(k => {
    planet.resources[k] -= currentCosts[k] * costMultiplier;
  });

  const baseTimes = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
  const baseSecs = baseTimes[troopId as keyof typeof baseTimes] * count;
  
  // researchCenter decreases training speed by up to 70% when lvl 20 (baseTime becomes 30%)
  const rcLevel = planet.buildings.researchCenter.level;
  const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
  const buildDurationMs = Math.round(baseSecs * (1 - reductionFrac) * 1000);

  // If there's an existing item for this troopId, add to it and shift later dependencies
  const existingIndex = planet.trainingQueue.findIndex(item => item.troopId === troopId);
  if (existingIndex !== -1) {
    const existingItem = planet.trainingQueue[existingIndex];
    existingItem.count += count;
    existingItem.completedAt += buildDurationMs;
    // Shift start and end times of any subsequent items in the queue
    for (let i = existingIndex + 1; i < planet.trainingQueue.length; i++) {
      planet.trainingQueue[i].startedAt += buildDurationMs;
      planet.trainingQueue[i].completedAt += buildDurationMs;
    }
  } else {
    // Determine start timestamp: after the last item completes, or right now if queue is empty
    let startTimestamp = Date.now();
    if (planet.trainingQueue.length > 0) {
      startTimestamp = planet.trainingQueue[planet.trainingQueue.length - 1].completedAt;
    }
    const endTimestamp = startTimestamp + buildDurationMs;

    planet.trainingQueue.push({
      troopId,
      count,
      startedAt: startTimestamp,
      completedAt: endTimestamp
    });
  }

  saveState();
  res.json({ player: p, success: true });
});

// Speed up / Complete Training instantly with crystals
app.post("/api/train/troop/complete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, queueIndex } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const queueItem = planet.trainingQueue[queueIndex];
  if (!queueItem) return res.status(404).json({ error: "Queue item not found" });

  planet.troops[queueItem.troopId as keyof typeof planet.troops] += queueItem.count;
  planet.trainingQueue.splice(queueIndex, 1);

  saveState();
  res.json({ player: p, success: true });
});

// Galaxy Scan (Radar)
app.post("/api/galaxy/scan", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { centerX, centerY, planetId } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);

  // Scan radius depends on Radar Level
  const radarLvl = planet?.buildings.radar.level || 1;
  const scanRadius = radarLvl; // Level 1 is radius 1, Level 15 is radius 15

  // Collect all players' planets with their distance
  const allTargets: any[] = [];
  
  Object.values(state.players).forEach(player => {
    player.planets.forEach(pl => {
      const dist = Math.hypot(pl.sectorX - centerX, pl.sectorY - centerY);
      allTargets.push({
        id: player.id,
        username: player.username,
        faction: player.faction,
        factionColor: player.factionColor,
        allianceTag: player.allianceId ? state.alliances[player.allianceId]?.tag : null,
        planetId: pl.id,
        planetName: pl.name,
        coords: { x: pl.sectorX, y: pl.sectorY },
        scores: player.scores,
        dist // raw distance for sorting
      });
    });
  });

  // Inject uncharted habitable planets/stations currently visible
  if (state.habitablePlanets) {
    state.habitablePlanets.forEach(hp => {
      if (hp.isColonized) return; // Ignore if already colonized by a player
      const dist = Math.hypot(hp.coords.x - centerX, hp.coords.y - centerY);
      allTargets.push({
        id: "habitable",
        username: "Uncharted Sector",
        faction: "Habitable Zone",
        factionColor: "#10b981", // elegant emerald-green
        allianceTag: null,
        planetId: hp.id,
        planetName: hp.name,
        coords: hp.coords,
        scores: { population: 0, attack: 0, defence: 0, raiders: 0 },
        dist,
        isHabitable: true
      });
    });
  }

  // Sort targets by distance ascending
  allTargets.sort((a, b) => a.dist - b.dist);

  // Return targets that are within scanRadius * 10, or at least the top 5 closest targets in the universe
  const maxScanDist = scanRadius * 10;
  let targets = allTargets.filter(t => t.dist <= maxScanDist);
  
  if (targets.length < 5) {
    // If not enough targets within range, supplement up to 5 closest targets so scanner is never empty
    targets = allTargets.slice(0, 6);
  }

  res.json({ targets, scanRadius });
});

// Coordinate Intelligence Report (Costs 50 Space Gold / credits)
app.post("/api/galaxy/intelligence", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { targetX, targetY } = req.body;
  const xVal = parseInt(String(targetX), 10);
  const yVal = parseInt(String(targetY), 10);

  if (isNaN(xVal) || isNaN(yVal)) {
    return res.status(400).json({ error: "Invalid target coordinates scanned." });
  }

  // Cost check: Space Gold (player.credits)
  if ((p.credits || 0) < 50) {
    return res.status(400).json({ error: "Insufficient Space Gold. Gathering intelligence report requires 50 Space Gold." });
  }

  // Deduct 50 Space Gold
  p.credits = Math.max(0, (p.credits || 0) - 50);

  let targetPlanet: any = null;
  let targetUser: any = null;

  Object.values(state.players).forEach(otherPlayer => {
    otherPlayer.planets.forEach(pl => {
      if (pl.sectorX === xVal && pl.sectorY === yVal) {
        targetPlanet = pl;
        targetUser = otherPlayer;
      }
    });
  });

  let report: any = null;

  if (targetPlanet && targetUser) {
    // Occupied Planet Report
    report = {
      type: "occupied",
      planetName: targetPlanet.name,
      commander: targetUser.username,
      faction: targetUser.faction,
      coords: { x: xVal, y: yVal },
      scores: targetUser.scores,
      buildings: {
        commsHub: targetPlanet.buildings.commsHub?.level || 1,
        radar: targetPlanet.buildings.radar?.level || 1,
        repository: targetPlanet.buildings.repository?.level || 1,
        researchCenter: targetPlanet.buildings.researchCenter?.level || 1,
        armyBase: targetPlanet.buildings.armyBase?.level || 1
      },
      troops: targetPlanet.troops,
      resources: targetPlanet.resources
    };
  } else {
    // Check if habitable uncharted sector
    const isHab = state.habitablePlanets?.find(hp => hp.coords.x === xVal && hp.coords.y === yVal);
    if (isHab) {
      report = {
        type: "habitable",
        planetName: isHab.name,
        coords: { x: xVal, y: yVal },
        description: "This is a pristine uncharted habitable planetary zone rich in basic elements. No planetary defense batteries or garrison troops detected. Clear for direct colony settlement ships."
      };
    } else {
      report = {
        type: "void",
        coords: { x: xVal, y: yVal },
        description: "Deep space coordinates. Absolute zero cold vacuum. Remote sensors indicate no industrial installations, troop radar footprints, or spacecraft energy signatures at these coordinates."
      };
    }
  }

  saveState();
  res.json({ player: p, report, success: true });
});

// Send Fleet Mission
app.post("/api/fleet/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, missionType, troops, targetId, targetName } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  // Validate troops
  const troopSend = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  let hasTroops = false;
  
  for (const [tId, countVal] of Object.entries(troops)) {
    const qty = parseInt(countVal as string, 10) || 0;
    if (qty > 0) {
      if (planet.troops[tId as keyof typeof planet.troops] < qty) {
        return res.status(400).json({ error: `Not enough ${tId} on the Space Station!` });
      }
      troopSend[tId as keyof typeof troopSend] = qty;
      hasTroops = true;
    }
  }

  if (!hasTroops) return res.status(400).json({ error: "Must dispatch at least 1 troop to launch space fleet." });

  // Colonization needs lab level 20, maximum 5 planets limit, and exactly ONE Settlement Ship
  if (missionType === "colonize") {
    // 1. Must deploy exactly 1 Settlement Ship
    if (troopSend.settlementShip !== 1) {
      return res.status(400).json({ error: "You must deploy exactly 1 Settlement Ship to colonize a new planet!" });
    }
    // 2. Must be within max planet count
    if (p.planets.length >= 5) {
      return res.status(400).json({ error: "Command limits reached. Max 5 colonized colony planets." });
    }
    // 3. Must be a habitable planet in the database on those coordinates that is NOT yet colonized!
    const targetHabitable = state.habitablePlanets?.find(hp => hp.coords.x === targetX && hp.coords.y === targetY);
    if (!targetHabitable) {
      return res.status(400).json({ error: "No habitable station or planet detected at these coordinates! Check your radar scanning array." });
    }
    if (targetHabitable.isColonized) {
      return res.status(400).json({ error: "These coordinates have already been colonized by another commander!" });
    }
    // 4. Must be within radar range of the sending planet
    const dist = Math.hypot(targetX - planet.sectorX, targetY - planet.sectorY);
    const radarLvl = planet.buildings.radar.level;
    const scanRadius = radarLvl * 10; // Level 1 is radius 10, Level 15 is 150
    if (dist > scanRadius) {
      return res.status(400).json({ error: `Habitable planet is outside your active radar scanning radius (Distance: ${dist.toFixed(1)}, Radius: ${scanRadius})!` });
    }
  }

  // Deduct troops from planet base immediately
  for (const [tId, qty] of Object.entries(troopSend)) {
    planet.troops[tId as keyof typeof planet.troops] -= qty;
  }

  // Calculate coordinates distance
  const dx = targetX - planet.sectorX;
  const dy = targetY - planet.sectorY;
  const dist = Math.hypot(dx, dy);

  const now = Date.now();
  const returnDelayMs = 15000; // Surviving forces transit home in 15s (creates Orange returning transit alert!)

  if (missionType === "attack") {
    const defender = targetId ? state.players[targetId] : null;

    if (defender) {
      const defPlanet = defender.planets[0];
      const defTroops = defPlanet ? { ...defPlanet.troops } : { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 };

      // Instant combat execution using Moonbase engine
      const combat = simulateMoonbaseCombat(
        p.username,
        defender.username,
        troopSend,
        defTroops
      );

      // Apply losses to defender
      if (defPlanet) {
        Object.entries(combat.defenderLosses).forEach(([tId, count]) => {
          defPlanet.troops[tId as keyof typeof defPlanet.troops] = Math.max(0, defPlanet.troops[tId as keyof typeof defPlanet.troops] - count);
        });
      }

      // Award match rating scores
      if (combat.winner === "attacker") {
        p.scores.attack += combat.defenceHpKilled;
      } else {
        defender.scores.defence += combat.attackHpKilled;
      }

      // Resource stealing loot calculations
      const loot = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
      let totalLootCapacity = 0;
      Object.entries(combat.attackerRemaining).forEach(([tId, count]) => {
        const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
        if (spec) totalLootCapacity += count * spec.carry;
      });

      if (combat.winner === "attacker" && totalLootCapacity > 0 && defPlanet) {
        const items: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
        let defenseTotalResources = items.reduce((sum, item) => sum + defPlanet.resources[item], 0);

        if (defenseTotalResources > 0) {
          const stealAmount = Math.min(totalLootCapacity, defenseTotalResources);
          const stealFrac = stealAmount / defenseTotalResources;

          items.forEach(item => {
            const stolen = Math.floor(defPlanet.resources[item] * stealFrac);
            defPlanet.resources[item] -= stolen;
            loot[item] = stolen;
          });

          const totalStolen = Object.values(loot).reduce((sum, val) => sum + val, 0);
          p.scores.raiders += totalStolen;
        }
      }

      // Bombers collateral demolition
      const buildingDamageReports: { buildingName: string; levelsDestroyed: number; previousLevel: number; newLevel: number }[] = [];
      if (combat.winner === "attacker" && combat.attackerRemaining.tank > 0 && defPlanet) {
        const destructionPower = Math.floor(combat.attackerRemaining.tank / 3);
        if (destructionPower > 0) {
          const destructibleBuildings = Object.keys(defPlanet.buildings) as (keyof typeof defPlanet.buildings)[];
          for (let i = 0; i < destructionPower; i++) {
            const bKey = destructibleBuildings[Math.floor(Math.random() * destructibleBuildings.length)];
            const bState = defPlanet.buildings[bKey];
            if (bState.level > 1) {
              const prevLvl = bState.level;
              bState.level -= 1;
              buildingDamageReports.push({
                buildingName: bKey,
                levelsDestroyed: 1,
                previousLevel: prevLvl,
                newLevel: bState.level
              });
            }
          }
        }
      }

      // Create BattleReport and News
      const report: BattleReport = {
        id: `battle_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        attackerId: p.id,
        attackerName: p.username,
        attackerAlliance: p.allianceId ? state.alliances[p.allianceId]?.tag : undefined,
        defenderId: defender.id,
        defenderName: defender.username,
        defenderAlliance: defender.allianceId ? state.alliances[defender.allianceId]?.tag : undefined,
        attackerCoords: { x: planet.sectorX, y: planet.sectorY },
        defenderCoords: { x: targetX, y: targetY },
        attackerInitialTroops: troopSend,
        attackerLosses: combat.attackerLosses,
        defenderInitialTroops: defTroops,
        defenderLosses: combat.defenderLosses,
        winner: combat.winner,
        resourcesStolen: loot,
        buildingDamage: buildingDamageReports.length > 0 ? buildingDamageReports : undefined,
        attackHpKilled: combat.attackHpKilled,
        defenceHpKilled: combat.defenceHpKilled,
        battleRounds: combat.rounds
      };

      state.battleReports.unshift(report);

      const lootSum = Object.values(loot).reduce((s, v) => s + v, 0);
      const destructionDetails = buildingDamageReports.length > 0
        ? ` causing collateral building collapse of ${buildingDamageReports.length} levels.`
        : ".";

      state.newsEvents.unshift({
        id: `news_${Math.random().toString(36).substr(2, 9)}`,
        title: combat.winner === "attacker" ? "Base Raided!" : "Raid Defended!",
        content: combat.winner === "attacker"
          ? `${p.username} successfully raided ${defender.username} at [${targetX}, ${targetY}] taking ${lootSum.toLocaleString()} resources${destructionDetails}`
          : `${defender.username} successfully repelled attackers fleet sent by ${p.username}!`,
        type: "raid",
        timestamp: now
      });

      // Dispatch 15s returning transit fleet (orange alert!)
      const returnMission: FleetMission = {
        id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
        senderId: p.id,
        senderName: p.username,
        senderCoords: { x: planet.sectorX, y: planet.sectorY },
        targetId: defender.id,
        targetName: defender.username,
        targetCoords: { x: targetX, y: targetY },
        missionType: "attack",
        troops: combat.attackerRemaining,
        startedAt: now,
        arrivesAt: now + returnDelayMs,
        isReturning: true,
        lootCarried: loot
      };

      state.fleets.push(returnMission);
    } else {
      // Empty coordinate strike
      const returnMission: FleetMission = {
        id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
        senderId: p.id,
        senderName: p.username,
        senderCoords: { x: planet.sectorX, y: planet.sectorY },
        targetId: null,
        targetName: `Sector [${targetX}, ${targetY}]`,
        targetCoords: { x: targetX, y: targetY },
        missionType: "attack",
        troops: troopSend,
        startedAt: now,
        arrivesAt: now + returnDelayMs,
        isReturning: true
      };
      state.fleets.push(returnMission);
    }

    saveState();
    return res.json({ player: p, success: true, instantCombat: true });
  }

  if (missionType === "recon") {
    const defender = targetId ? state.players[targetId] : null;
    const report: BattleReport = {
      id: `battle_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      attackerId: p.id,
      attackerName: p.username,
      defenderId: targetId || "void",
      defenderName: targetName || `Empty Sector [${targetX}, ${targetY}]`,
      attackerCoords: { x: planet.sectorX, y: planet.sectorY },
      defenderCoords: { x: targetX, y: targetY },
      attackerInitialTroops: troopSend,
      attackerLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      defenderInitialTroops: defender?.planets[0]?.troops || { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      defenderLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      winner: "attacker",
      resourcesStolen: { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 },
      attackHpKilled: 0,
      defenceHpKilled: 0
    };

    state.battleReports.unshift(report);

    // Drones return in 15 seconds
    const returnMission: FleetMission = {
      id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
      senderId: p.id,
      senderName: p.username,
      senderCoords: { x: planet.sectorX, y: planet.sectorY },
      targetId: targetId || null,
      targetName: targetName || `Sector [${targetX}, ${targetY}]`,
      targetCoords: { x: targetX, y: targetY },
      missionType: "recon",
      troops: troopSend,
      startedAt: now,
      arrivesAt: now + returnDelayMs,
      isReturning: true
    };

    state.fleets.push(returnMission);
    saveState();
    return res.json({ player: p, success: true, instantRecon: true });
  }

  if (missionType === "colonize") {
    // We launch a traveling fleet instead of colonizing instantly! Reaches in exactly 10 seconds.
    const travelTimeMs = 10000;

    const colonizeMission: FleetMission = {
      id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
      senderId: p.id,
      senderName: p.username,
      senderCoords: { x: planet.sectorX, y: planet.sectorY },
      targetId: targetId || null,
      targetName: targetName || `Sector [${targetX}, ${targetY}]`,
      targetCoords: { x: targetX, y: targetY },
      missionType: "colonize",
      troops: troopSend,
      startedAt: now,
      arrivesAt: now + travelTimeMs,
      isReturning: false,
      isWaitingToSettle: false
    };

    state.fleets.push(colonizeMission);
    saveState();
    return res.json({ player: p, success: true, launchedColonize: true, fleets: state.fleets });
  }

  res.json({ player: p, success: true });
});

// Settle coordinates once fleet arrives
app.post("/api/fleet/settle", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { fleetId } = req.body;
  const fleetIndex = state.fleets.findIndex(f => f.id === fleetId && f.senderId === p.id);
  if (fleetIndex === -1) {
    return res.status(404).json({ error: "Fleet squadron not found or not owned by you!" });
  }

  const fleet = state.fleets[fleetIndex];
  if (!fleet.isWaitingToSettle) {
    return res.status(400).json({ error: "This fleet has not arrived at its destination yet!" });
  }

  if (p.planets.length >= 5) {
    return res.status(400).json({ error: "Command limits reached. Max 5 colony planets." });
  }

  // Mark the habitable planet as colonized!
  const targetX = fleet.targetCoords.x;
  const targetY = fleet.targetCoords.y;

  if (state.habitablePlanets) {
    const hp = state.habitablePlanets.find(item => item.coords.x === targetX && item.coords.y === targetY);
    if (hp) {
      if (hp.isColonized) {
        const alreadyMine = p.planets.some(pl => pl.sectorX === targetX && pl.sectorY === targetY);
        if (!alreadyMine) {
          return res.status(400).json({ error: "These coordinates have already been colonized by another commander!" });
        }
      }
      hp.isColonized = true;
    }
  }

  const planetNum = p.planets.length + 1;
  const targetHabitable = state.habitablePlanets?.find(hp => hp.coords.x === targetX && hp.coords.y === targetY);
  const planetName = targetHabitable 
    ? `${p.username}'s ${targetHabitable.name.replace("Habitable ", "")}` 
    : `${p.username}'s Colony ${planetNum}`;

  const newPlanet = createInitialPlanet(planetName, targetX, targetY);
  
  // Put surviving/colonizing troops into this planet
  Object.entries(fleet.troops).forEach(([tId, count]) => {
    newPlanet.troops[tId as keyof typeof newPlanet.troops] = count;
  });

  p.planets.push(newPlanet);

  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Planet Settled",
    content: `${p.username} has established a new settled research colony at sector [${targetX}, ${targetY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });

  // Remove fleet from active fleets
  state.fleets.splice(fleetIndex, 1);

  saveState();
  return res.json({ player: p, success: true, fleets: state.fleets });
});

// Chat Send
app.post("/api/chat/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { channel, content, receiverId } = req.body;
  if (!content) return res.status(400).json({ error: "Message content required" });

  const message: ChatMessage = {
    id: `chat_${Math.random().toString(36).substr(2, 9)}`,
    channel,
    senderId: p.id,
    senderName: p.username,
    senderFaction: p.faction,
    senderFactionColor: p.factionColor,
    allianceTag: p.allianceId ? state.alliances[p.allianceId]?.tag : null,
    receiverId: receiverId || null,
    content,
    timestamp: Date.now()
  };

  state.chatMessages.push(message);
  if (state.chatMessages.length > 200) state.chatMessages.shift();

  res.json({ success: true });
});

// Alliances Creation
app.post("/api/alliance/create", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (p.allianceId) return res.status(400).json({ error: "Already member of an Alliance" });

  const { name, tag, bannerColor, bannerSymbol } = req.body;
  if (!name || !tag) return res.status(400).json({ error: "Alliance Name and Tag required" });

  const exists = Object.values(state.alliances).some(a => a.name.toLowerCase() === name.toLowerCase() || a.tag.toUpperCase() === tag.toUpperCase());
  if (exists) return res.status(400).json({ error: "Alliance Name or Tag already active." });

  const allianceId = `alliance_${Math.random().toString(36).substr(2, 9)}`;

  const newAlliance: Alliance = {
    id: allianceId,
    name: name.toUpperCase(),
    tag: tag.toUpperCase(),
    leaderId: p.id,
    leaderName: p.username,
    members: [
      { playerId: p.id, username: p.username, role: "leader" }
    ],
    wars: [],
    bannerColor: bannerColor || p.factionColor,
    bannerSymbol: bannerSymbol || "▲"
  };

  state.alliances[allianceId] = newAlliance;
  p.allianceId = allianceId;
  p.allianceRole = "leader";

  // System broadcast news
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "New Alliance Formed",
    content: `${p.username} has launched a new military faction: [${tag.toUpperCase()}] ${name.toUpperCase()}!`,
    type: "system",
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: p, success: true, alliance: newAlliance });
});

// Alliance joining
app.post("/api/alliance/join", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (p.allianceId) return res.status(400).json({ error: "Already registered in an Alliance." });

  const { allianceId } = req.body;
  const alliance = state.alliances[allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  alliance.members.push({
    playerId: p.id,
    username: p.username,
    role: "member"
  });

  p.allianceId = allianceId;
  p.allianceRole = "member";

  // System news alert
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Member Joined Alliance",
    content: `${p.username} has been enlisted into ${alliance.name} [${alliance.tag}]!`,
    type: "system",
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: p, success: true, alliance });
});

// Alliance leaving
app.post("/api/alliance/leave", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });

  const allianceId = p.allianceId;
  const alliance = state.alliances[allianceId];

  if (alliance) {
    if (p.allianceRole === "leader") {
      // If leader leaves, dissolve alliance or assign new leader
      const otherMembers = alliance.members.filter(m => m.playerId !== p.id);
      if (otherMembers.length > 0) {
        // Appoint next
        otherMembers[0].role = "leader";
        alliance.leaderId = otherMembers[0].playerId;
        alliance.leaderName = otherMembers[0].username;
        
        const nextLeader = state.players[otherMembers[0].playerId];
        if (nextLeader) nextLeader.allianceRole = "leader";
        
        alliance.members = otherMembers;
      } else {
        // Dissolve
        delete state.alliances[allianceId];
        // Clean up wars from other alliances pointing to this dissolved one
        Object.values(state.alliances).forEach(a => {
          a.wars = a.wars.filter(w => w.targetAllianceId !== allianceId);
        });
      }
    } else {
      alliance.members = alliance.members.filter(m => m.playerId !== p.id);
    }
  }

  p.allianceId = null;
  p.allianceRole = null;

  saveState();
  res.json({ player: p, success: true });
});

app.post("/api/alliance/declare-war", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (!p.allianceId || p.allianceRole !== "leader") {
    return res.status(403).json({ error: "Only Alliance Leaders can declare war!" });
  }

  const { targetAllianceId } = req.body;
  const alliance = state.alliances[p.allianceId];
  const targetAlliance = state.alliances[targetAllianceId];

  if (!alliance || !targetAlliance) {
    return res.status(404).json({ error: "Alliance structure mismatch." });
  }

  // Already at war?
  const alreadyAtWar = alliance.wars.some(w => w.targetAllianceId === targetAllianceId);
  if (alreadyAtWar) return res.status(400).json({ error: "Alliance is already in actively declared war." });

  alliance.wars.push({
    targetAllianceId,
    targetAllianceName: targetAlliance.name,
    declaredAt: Date.now()
  });

  state.newsEvents.unshift({
    id: `war_${Math.random().toString(36).substr(2, 9)}`,
    title: "War Declared!",
    content: `[${alliance.tag}] ${alliance.name} has declared official WAR upon [${targetAlliance.tag}] ${targetAlliance.name}! Battle lines are drawn!`,
    type: "war",
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: p, success: true, alliance });
});

// Claim Daily Rewards (Gives free credits + resources)
app.post("/api/daily-reward/claim", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const now = Date.now();
  // We can let them claim hourly or daily reward (e.g. 1 hour cooldown for testing in Sandbox!)
  const cooldown = 3600 * 1000; // 1 hour for high playability testing!
  const lastClaim = p.lastDailyRewardClaim || 0;

  if (now - lastClaim < cooldown) {
    const nextClaimTimeStr = new Date(lastClaim + cooldown).toLocaleTimeString();
    return res.status(400).json({ error: `Hourly Supply crates are still on cooldown. Next available at ${nextClaimTimeStr}.` });
  }

  // Grant resources
  const planet = p.planets[0];
  if (planet) {
    const amount = 8000;
    const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
    const cap = getRepositoryCapacity(planet.buildings.repository.level);
    
    keys.forEach(k => {
      planet.resources[k] = Math.min(cap, planet.resources[k] + amount);
    });
  }

  p.lastDailyRewardClaim = now;
  saveState();
  res.json({ player: p, s_amount: 8000, success: true });
});

app.post("/api/buy-credits", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { amount, tierLabel } = req.body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid credit request amount." });
  }

  if (p.credits === undefined) {
    p.credits = 1250;
  }

  p.credits += amount;

  // Add customized news feed entry for immersion
  state.newsEvents.unshift({
    id: `credit_${Math.random().toString(36).substr(2, 9)}`,
    title: "Galactic Funding Secured",
    content: `Commander ${p.username} authorized security transmission of +${amount.toLocaleString()} Galactic Credits under [${tierLabel || 'Premium Gateway'}].`,
    type: "discovery",
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: p, success: true });
});


// Serve Static Assets & SPA Router
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Universe active. Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
