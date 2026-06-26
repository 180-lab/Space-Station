import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
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
  CommandMessage,
} from "./src/types";
import { getUpgradeResourceCost } from "./src/gameUtils";

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT ? parseInt(process.env.PORT) : 3000) : 3000;

// Auto-heal incoming proxy subpaths (e.g. /7/api/state -> /api/state) to prevent SPA fallback issues
app.use((req, res, next) => {
  const match = req.url.match(/\/api(\/|$)/);
  if (match && match.index !== undefined && match.index > 0) {
    const rewritten = req.url.substring(match.index);
    console.log(`[ROUTER AUTO-HEAL] Rewriting proxy subpath: ${req.url} -> ${rewritten}`);
    req.url = rewritten;
  }
  next();
});

// Set up permissive CORS headers for native Android Webviews and browser clients
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Content-Length, Authorization, X-Requested-With, x-user-id, X-User-Id");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, X-User-Id, accept, origin, *");
  
  // Handle preflight checks
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// Persistent state file
const STATE_FILE = path.join(process.cwd(), "galaxy_state.json");

let state: GameState = {
  players: {},
  alliances: {},
  chatMessages: [],
  fleets: [],
  battleReports: [],
  newsEvents: [],
  habitablePlanets: [
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
  ]
};

// Default Troop Specifications
const TROOP_SPECS = {
  defender: { name: "Interceptor", defenceHp: 18, attackHp: 10, carry: 600, speed: 7.0, waterConsumption: 1.0 },
  attacker: { name: "Assault Drone", defenceHp: 9, attackHp: 30, carry: 400, speed: 11.662, waterConsumption: 2.0 },
  tank: { name: "Disrupter", defenceHp: 5, attackHp: 5, carry: 0, speed: 3.5, waterConsumption: 4.0 },
  looter: { name: "Matter Extractor", defenceHp: 4, attackHp: 4, carry: 1000, speed: 23.331, waterConsumption: 3.0 },
  drone: { name: "Missile Launcher", defenceHp: 120, attackHp: 120, carry: 200, speed: 17.5, waterConsumption: 0.4 },
  settlementShip: { name: "Settlement Ship", defenceHp: 50, attackHp: 0, carry: 5000, speed: 4.662, waterConsumption: 5.0 }
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
  if (level <= 0) return 0; // Base baseline is 0 when unconstructed/level 0
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

// Normalize GameState to ensure all newly-added properties exist across legacy states
function normalizeState(s: GameState) {
  if (!s) return;
  ensureMinimumHabitablePlanets();
  if (!s.players) s.players = {};
  if (!s.alliances) s.alliances = {};
  if (!s.chatMessages) s.chatMessages = [];
  if (!s.fleets) s.fleets = [];
  if (!s.battleReports) s.battleReports = [];
  if (!s.newsEvents) s.newsEvents = [];
  if (!s.feedbacks) s.feedbacks = [];

  Object.values(s.players).forEach((p) => {
    if (!p) return;
    if (!p.scores) {
      p.scores = { population: 100, attack: 0, defence: 0, raiders: 0 };
    }
    if (!p.achievements) {
      p.achievements = [];
    }
    if (!p.commandMessages) {
      p.commandMessages = [];
    }
    if (!p.credits || p.credits < 10000) {
      p.credits = 10000;
    }
    if (!Array.isArray(p.planets)) {
      p.planets = [];
    }

    p.planets.forEach((pl: any, plIdx: number) => {
      if (!pl) return;
      if (pl.name && typeof pl.name === "string" && pl.name.includes("Outpost")) {
        pl.name = pl.name.replace(/Outpost/g, "Station");
      }
      
      const isFirst = plIdx === 0;

      // Ensure all troops are present
      if (!pl.troops) pl.troops = {};
      const troopDefaults: Record<string, number> = {
        defender: isFirst ? 12500 : 0,
        attacker: isFirst ? 28600 : 0,
        tank: isFirst ? 100 : 0,
        looter: isFirst ? 1000 : 0,
        drone: isFirst ? 100 : 0,
        settlementShip: 0
      };
      Object.keys(troopDefaults).forEach(tKey => {
        if (pl.troops[tKey] === undefined) {
          pl.troops[tKey] = troopDefaults[tKey];
        }
      });

      if (!pl.trainingQueue) {
        pl.trainingQueue = [];
      }
      if (!pl.upgradeQueue) {
        pl.upgradeQueue = [];
      }

      // Ensure all buildings are present and conform
      if (!pl.buildings) pl.buildings = {};
      
      const buildingDefaults: Record<string, { level: number, maxLevel: number }> = {
        fabricator: { level: isFirst ? 10 : 0, maxLevel: 10 },
        commsHub: { level: isFirst ? 5 : 0, maxLevel: 5 },
        researchCenter: { level: isFirst ? 20 : 0, maxLevel: 20 },
        armyBase: { level: isFirst ? 22 : 0, maxLevel: 22 },
        repository: { level: isFirst ? 45 : 0, maxLevel: 45 },
        radar: { level: isFirst ? 15 : 0, maxLevel: 15 },
        supplyNexus: { level: isFirst ? 50 : 0, maxLevel: 50 }
      };

      Object.entries(buildingDefaults).forEach(([bKey, bDef]) => {
        const defaultLvl = bDef.level;
        if (!pl.buildings[bKey]) {
          pl.buildings[bKey] = {
            level: defaultLvl,
            maxLevel: bDef.maxLevel,
            isUpgrading: false,
            upgradeEnd: null,
            health: 100
          };
        } else {
          // Force first planet to be maxed, subsequent to start from zero
          if (isFirst) {
            pl.buildings[bKey].level = bDef.maxLevel;
          } else if (pl.buildings[bKey].level === 1 && (bKey === "fabricator" || bKey === "commsHub" || bKey === "repository")) {
            pl.buildings[bKey].level = 0;
          }
          const bObj = pl.buildings[bKey];
          if (bObj.level === undefined) bObj.level = defaultLvl;
          bObj.maxLevel = bDef.maxLevel; // Enforce updated maxLevels like fabricator limit 10
          if (bObj.level > bDef.maxLevel) bObj.level = bDef.maxLevel; // Clamp level if it exceeds new limit
          if (bObj.isUpgrading === undefined) bObj.isUpgrading = false;
          if (bObj.upgradeEnd === undefined) bObj.upgradeEnd = null;
          if (bObj.health === undefined) bObj.health = 100;
        }
      });

      // Ensure all mines are present and conform
      if (!pl.mines) pl.mines = {};
      const mineKeys = ["water", "plasma", "fuel", "food", "respirant"];
      const mineCounts = { water: 6, plasma: 3, fuel: 3, food: 3, respirant: 3 };
      mineKeys.forEach((mKey) => {
        const count = mineCounts[mKey as keyof typeof mineCounts];
        if (!pl.mines[mKey]) {
          pl.mines[mKey] = Array.from({ length: count }, (_, i) => ({
            index: i,
            level: isFirst ? 25 : 0,
            isUpgrading: false,
            upgradeEnd: null,
            health: 100
          }));
        } else {
          pl.mines[mKey].forEach((mine: any) => {
            if (isFirst) {
              mine.level = 25;
            } else if (mine.level === undefined || mine.level === 1) {
              mine.level = 0;
            }
            if (mine.isUpgrading === undefined) mine.isUpgrading = false;
            if (mine.upgradeEnd === undefined) mine.upgradeEnd = null;
            if (mine.health === undefined) mine.health = 100;
          });
        }
      });

      // Ensure first planet has maxed resources
      if (isFirst) {
        if (pl.resources.water < 5000000) pl.resources.water = 5000000;
        if (pl.resources.plasma < 5000000) pl.resources.plasma = 5000000;
        if (pl.resources.fuel < 5000000) pl.resources.fuel = 5000000;
        if (pl.resources.food < 5000000) pl.resources.food = 5000000;
        if (pl.resources.respirant < 5000000) pl.resources.respirant = 5000000;
      }
    });
  });
}

// Load state helper
async function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf8");
      state = JSON.parse(data);
      if (!state.feedbacks) {
        state.feedbacks = [];
      }
      
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
                
                if (pl.troops.defender === undefined) pl.troops.defender = 0;
                if (pl.troops.attacker === undefined) pl.troops.attacker = 0;
                if (pl.troops.tank === undefined) pl.troops.tank = 0;
                if (pl.troops.looter === undefined) pl.troops.looter = 0;
                if (pl.troops.drone === undefined) pl.troops.drone = 0;
              }
              if (pl && !pl.trainingQueue) {
                pl.trainingQueue = [];
              }
              if (pl && pl.buildings) {
                if (!pl.buildings.supplyNexus) {
                  pl.buildings.supplyNexus = { level: 1, maxLevel: 50, isUpgrading: false, upgradeEnd: null };
                }
                if (!pl.buildings.fabricator) {
                  pl.buildings.fabricator = { level: 1, maxLevel: 10, isUpgrading: false, upgradeEnd: null, health: 100 };
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

      normalizeState(state);

      // Initial save to seed Cloud SQL
      saveState();
      
      console.log("backup state loaded successfully. Players count:", Object.keys(state.players).length);
    } else {
      console.log("No existing state file found. Bootstrapping universe...");
      bootstrapUniverse();
      normalizeState(state);
      saveState();
    }
  } catch (err) {
    console.error("Failed to load state", err);
    bootstrapUniverse();
    normalizeState(state);
    saveState();
  }
}

// Create initial planet
function createInitialPlanet(name: string, sectorX: number, sectorY: number, isFirstStation: boolean = false): ColonyPlanet {
  const createMines = (count: number): MineState[] => {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      level: isFirstStation ? 25 : 0,
      isUpgrading: false,
      upgradeEnd: null,
      health: 100
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
      fabricator: { level: isFirstStation ? 10 : 0, maxLevel: 10, isUpgrading: false, upgradeEnd: null, health: 100 },
      commsHub: { level: isFirstStation ? 5 : 0, maxLevel: 5, isUpgrading: false, upgradeEnd: null, health: 100 },
      researchCenter: { level: isFirstStation ? 20 : 0, maxLevel: 20, isUpgrading: false, upgradeEnd: null, health: 100 },
      armyBase: { level: isFirstStation ? 22 : 0, maxLevel: 22, isUpgrading: false, upgradeEnd: null, health: 100 },
      repository: { level: isFirstStation ? 45 : 0, maxLevel: 45, isUpgrading: false, upgradeEnd: null, health: 100 },
      radar: { level: isFirstStation ? 15 : 0, maxLevel: 15, isUpgrading: false, upgradeEnd: null, health: 100 },
      supplyNexus: { level: isFirstStation ? 50 : 0, maxLevel: 50, isUpgrading: false, upgradeEnd: null, health: 100 }
    },
    resources: {
      water: isFirstStation ? 5000000 : 5000,
      plasma: isFirstStation ? 5000000 : 5000,
      fuel: isFirstStation ? 5000000 : 5000,
      food: isFirstStation ? 5000000 : 5000,
      respirant: isFirstStation ? 5000000 : 5000
    },
    troops: {
      defender: isFirstStation ? 12500 : 0,
      attacker: isFirstStation ? 28600 : 0,
      tank: isFirstStation ? 100 : 0,
      looter: isFirstStation ? 1000 : 0,
      drone: isFirstStation ? 100 : 0,
      settlementShip: 0
    },
    trainingQueue: []
  };
}

// Apply bomber tank demolition damage
function applyBomberDamage(defPlanet: ColonyPlanet, numTanks: number, chosenTarget: string) {
  const buildingDamageReports: { buildingName: string; levelsDestroyed: number; previousLevel: number; newLevel: number }[] = [];
  if (numTanks <= 0 || !defPlanet) return buildingDamageReports;

  let target = chosenTarget || "random";
  let targetType: "mine" | "building" = "building";
  let mineType = "";
  
  if (target === "random") {
    const choices = ["commsHub", "researchCenter", "armyBase", "repository", "radar", "supplyNexus", "mines.water", "mines.plasma", "mines.fuel", "mines.food", "mines.respirant"];
    target = choices[Math.floor(Math.random() * choices.length)];
  }

  let finalName = target;
  let targetState: MineState | BuildingState | null = null;

  if (target.startsWith("mines.")) {
    targetType = "mine";
    mineType = target.split(".")[1];
    const mineList = defPlanet.mines[mineType as keyof typeof defPlanet.mines];
    if (mineList && mineList.length > 0) {
      let highestMine = mineList[0];
      for (const mine of mineList) {
        if (mine.level > highestMine.level) {
          highestMine = mine;
        }
      }
      targetState = highestMine;
      finalName = `${mineType} Mine #${highestMine.index + 1}`;
    }
  } else {
    targetState = defPlanet.buildings[target as keyof typeof defPlanet.buildings];
  }

  if (!targetState) {
    // Fallback: pick any building
    const destructibleBuildings = Object.keys(defPlanet.buildings) as (keyof typeof defPlanet.buildings)[];
    const bKey = destructibleBuildings[Math.floor(Math.random() * destructibleBuildings.length)];
    targetState = defPlanet.buildings[bKey];
    finalName = bKey;
  }

  if (targetState) {
    const prevLvl = targetState.level;
    const prevHealth = targetState.health !== undefined ? targetState.health : 100;
    const damage = numTanks; // 1% per tank
    const computedHealth = prevHealth - damage;

    if (computedHealth > 0) {
      targetState.health = computedHealth;
      buildingDamageReports.push({
        buildingName: finalName === "commsHub" ? "Communications Hub" : finalName === "researchCenter" ? "Research Center" : finalName === "armyBase" ? "War Room" : finalName === "repository" ? "Silo" : finalName === "radar" ? "Radar Array" : finalName === "supplyNexus" ? "Supply Nexus" : finalName === "fabricator" ? "Fabricator" : finalName,
        levelsDestroyed: 0,
        previousLevel: prevLvl,
        newLevel: prevLvl
      });
    } else {
      const excessDamage = Math.abs(computedHealth);
      const levelsDestroyed = 1 + Math.floor(excessDamage / 100);
      const remainingDamage = excessDamage % 100;
      const newLvl = Math.max(1, prevLvl - levelsDestroyed);
      const levelsLost = prevLvl - newLvl;
      
      targetState.level = newLvl;
      const newHealth = newLvl === 1 ? Math.max(0, 100 - remainingDamage) : (100 - remainingDamage);
      targetState.health = newHealth;

      buildingDamageReports.push({
        buildingName: finalName === "commsHub" ? "Communications Hub" : finalName === "researchCenter" ? "Research Center" : finalName === "armyBase" ? "War Room" : finalName === "repository" ? "Silo" : finalName === "radar" ? "Radar Array" : finalName === "supplyNexus" ? "Supply Nexus" : finalName === "fabricator" ? "Fabricator" : finalName,
        levelsDestroyed: levelsLost,
        previousLevel: prevLvl,
        newLevel: newLvl
      });
    }
  }

  return buildingDamageReports;
}

function ensureMinimumHabitablePlanets() {
  if (!state.habitablePlanets) {
    state.habitablePlanets = [];
  }
  
  const uncolonized = state.habitablePlanets.filter(p => !p.isColonized);
  if (uncolonized.length >= 20) return;

  const countNeeded = 20 - uncolonized.length;
  const namesPool = [
    "Gaia Aurelia", "Kepler-Prime", "Gliese-91", "New Hope", "Epsilon-D", 
    "Zephyr-9", "Arcadia", "Core Dome-A", "Oasis-1", "Eden-X", 
    "Genesis", "Midway", "Vanguard Outpost", "Nova Sol", "Horizon Delta",
    "Apex Hub", "Thera Prime", "Verdant Reach", "Seraphim V", "Titan Alpha",
    "Nexus Beta", "Elysium VI", "Hyperion", "Astraea", "Polaris Junction",
    "Chronos III", "Solaris Sector", "Sentinel Dome", "Obsidian Station", "Olympus Basin"
  ];

  for (let i = 0; i < countNeeded; i++) {
    let foundCoords = false;
    let targetX = 0;
    let targetY = 0;
    let attempts = 0;

    while (!foundCoords && attempts < 200) {
      attempts++;
      targetX = Math.floor(Math.random() * 90) + 5;
      targetY = Math.floor(Math.random() * 90) + 5;

      const overlapHabitable = state.habitablePlanets.some(hp => hp.coords.x === targetX && hp.coords.y === targetY);
      if (overlapHabitable) continue;

      let overlapPlayer = false;
      for (const player of Object.values(state.players)) {
        if (player.planets && player.planets.some(pl => pl.sectorX === targetX && pl.sectorY === targetY)) {
          overlapPlayer = true;
          break;
        }
      }
      if (overlapPlayer) continue;

      foundCoords = true;
    }

    const name = "Habitable " + namesPool[Math.floor(Math.random() * namesPool.length)];
    const id = `hab_${targetX}_${targetY}`;
    state.habitablePlanets.push({
      id,
      name,
      coords: { x: targetX, y: targetY },
      isColonized: false
    });
  }
}

// Bootstrap AI players to make the world feel populated and active
function bootstrapUniverse() {
  state.players = {};
  state.alliances = {};
  state.chatMessages = [];
  state.fleets = [];
  state.battleReports = [];
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
  state.newsEvents = [
    {
      id: "news_0",
      title: "Galactic Server Active",
      content: "The seasonal space arena is open. Recruit commanders, fortify your moonbases, and seize dominion of the sector!",
      type: "system",
      timestamp: Date.now()
    }
  ];

  const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];

  const aiNames = [
    { name: "VoidLord", coords: { x: 12, y: 34 }, allianceId: null, faction: factions[1], color: factionColors[1] },
    { name: "XenonHunter", coords: { x: 18, y: 40 }, allianceId: null, faction: factions[1], color: factionColors[1] },
    { name: "NebulaKnight", coords: { x: 8, y: 22 }, allianceId: null, faction: factions[1], color: factionColors[1] },
    { name: "Astraea", coords: { x: 55, y: 78 }, allianceId: null, faction: factions[0], color: factionColors[0] },
    { name: "TitanKing", coords: { x: 62, y: 82 }, allianceId: null, faction: factions[0], color: factionColors[0] },
    { name: "StarEclipse", coords: { x: 50, y: 70 }, allianceId: null, faction: factions[0], color: factionColors[0] },
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
      allianceId: null,
      allianceRole: null,
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
      credits: 10000
    };

    state.players[id] = player;
  });

  ensureMinimumHabitablePlanets();
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

    let lastCompletedUpgradeTime = 0;

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
            lastCompletedUpgradeTime = Math.max(lastCompletedUpgradeTime, mine.upgradeEnd);
            mine.upgradeEnd = null;
            changed = true;
          }
          
          // Accumulate Resource
          const isOtherMaxed = 
            planet.resources.plasma >= storageLimit &&
            planet.resources.fuel >= storageLimit &&
            planet.resources.food >= storageLimit &&
            planet.resources.respirant >= storageLimit;
          
          const isMineBoosted = mine.boostedUntil && now < Number(mine.boostedUntil);
          let hourlyProd = isOtherMaxed ? (resKey === "water" ? 14000 : 42000) : getMineProductionPerHour(mine.level, resKey as ResourceType);
          if (isMineBoosted) {
            hourlyProd = hourlyProd * 1.14;
          }
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

      // Deduct consumption rates (Water, Respirant 0.28x, Food 0.18x)
      const waterConsumed = waterConsumptionPerHour * deltaHours;
      const respirantConsumed = waterConsumptionPerHour * 0.28 * deltaHours;
      const foodConsumed = waterConsumptionPerHour * 0.18 * deltaHours;

      planet.resources.water = planet.resources.water - waterConsumed;
      planet.resources.respirant = planet.resources.respirant - respirantConsumed;
      planet.resources.food = planet.resources.food - foodConsumed;

      // Calculate total hourly production from mines to see if production is negative
      const hourlyMinesProd = { water: 0, respirant: 0, food: 0 };
      for (const resKey of ["water", "respirant", "food"]) {
        const mines = planet.mines[resKey as ResourceType] || [];
        const isOtherMaxed = 
          planet.resources.plasma >= storageLimit &&
          planet.resources.fuel >= storageLimit &&
          planet.resources.food >= storageLimit &&
          planet.resources.respirant >= storageLimit;
        
        mines.forEach(mine => {
          const isMineBoosted = mine.boostedUntil && now < Number(mine.boostedUntil);
          let hourlyProd = isOtherMaxed ? (resKey === "water" ? 14000 : 42000) : getMineProductionPerHour(mine.level, resKey as ResourceType);
          if (isMineBoosted) {
            hourlyProd = hourlyProd * 1.14;
          }
          hourlyMinesProd[resKey as "water" | "respirant" | "food"] += hourlyProd;
        });
      }

      const netWaterProdHourly = hourlyMinesProd.water - waterConsumptionPerHour;
      const netRespirantProdHourly = hourlyMinesProd.respirant - (waterConsumptionPerHour * 0.28);
      const netFoodProdHourly = hourlyMinesProd.food - (waterConsumptionPerHour * 0.18);

      const isAnyProdNegative = (netWaterProdHourly < 0) || (netRespirantProdHourly < 0) || (netFoodProdHourly < 0);

      // Produce negatively: let them go negative if net rate is negative, otherwise clamp at 0
      if (netWaterProdHourly < 0) {
        planet.resources.water = Math.min(storageLimit, planet.resources.water);
      } else {
        planet.resources.water = Math.max(0, Math.min(storageLimit, planet.resources.water));
      }

      if (netRespirantProdHourly < 0) {
        planet.resources.respirant = Math.min(storageLimit, planet.resources.respirant);
      } else {
        planet.resources.respirant = Math.max(0, Math.min(storageLimit, planet.resources.respirant));
      }

      if (netFoodProdHourly < 0) {
        planet.resources.food = Math.min(storageLimit, planet.resources.food);
      } else {
        planet.resources.food = Math.max(0, Math.min(storageLimit, planet.resources.food));
      }

      const triggerAttrition = isAnyProdNegative || (planet.resources.water < 0) || (planet.resources.respirant < 0) || (planet.resources.food < 0);

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
          lastCompletedUpgradeTime = Math.max(lastCompletedUpgradeTime, building.upgradeEnd);
          building.upgradeEnd = null;
          changed = true;
        }
      }

      // Sequential Upgrade Queue processor
      if (!planet.upgradeQueue) {
        planet.upgradeQueue = [];
      }

      // Check if any upgrade is active right now
      let isUpgradeActive = false;
      for (const rKey of Object.keys(planet.mines)) {
        if (planet.mines[rKey as ResourceType].some(m => m.isUpgrading)) {
          isUpgradeActive = true;
          break;
        }
      }
      if (!isUpgradeActive) {
        if (Object.values(planet.buildings).some((b: any) => b.isUpgrading)) {
          isUpgradeActive = true;
        }
      }

      // If nothing is currently active, we start the queue sequentially!
      if (!isUpgradeActive && planet.upgradeQueue.length > 0) {
        let referenceTime = lastCompletedUpgradeTime > 0 ? lastCompletedUpgradeTime : now;
        while (planet.upgradeQueue.length > 0) {
          const nextUp = planet.upgradeQueue[0];
          let durationMs = 0;
          let targetObj: any = null;
          let targetLvl = 1;

          if (nextUp.type === 'mine') {
            targetObj = planet.mines[nextUp.key as ResourceType]?.[nextUp.mineIndex!];
            if (targetObj) {
              targetLvl = targetObj.level + 1;
              durationMs = targetLvl * 60 * 1000;
            }
          } else if (nextUp.type === 'building') {
            targetObj = planet.buildings[nextUp.key as keyof typeof planet.buildings];
            if (targetObj) {
              targetLvl = targetObj.level + 1;
              durationMs = targetLvl * 120 * 1000;
            }
          }

          if (targetObj) {
            const expectedEnd = referenceTime + durationMs;
            if (now >= expectedEnd) {
              // Finished immediately! Upgrade and continue to next item in queue
              targetObj.level = targetLvl;
              targetObj.isUpgrading = false;
              targetObj.upgradeEnd = null;
              planet.upgradeQueue.shift();
              referenceTime = expectedEnd;
              changed = true;
            } else {
              // Started, in progress. Set as active and exit queue loop
              targetObj.isUpgrading = true;
              targetObj.upgradeEnd = expectedEnd;
              planet.upgradeQueue.shift();
              changed = true;
              break;
            }
          } else {
            planet.upgradeQueue.shift(); // Invalid queue item
          }
        }
      }

      // Troop training queue handling (Parallel Processing: build different troop types at the same time)
      if (planet.trainingQueue && planet.trainingQueue.length > 0) {
        const baseTimes = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
        const remainingQueue: typeof planet.trainingQueue = [];

        planet.trainingQueue.forEach(item => {
          if (now >= item.completedAt) {
            // Fully completed
            planet.troops[item.troopId as keyof typeof planet.troops] += item.count;
            changed = true;
          } else {
            // Process fractional progress
            const bTime = baseTimes[item.troopId as keyof typeof baseTimes] || 30;
            const rcLevel = planet.buildings.researchCenter.level;
            const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
            const unitDurationMs = Math.max(1000, Math.round(bTime * (1 - reductionFrac) * 1000));

            const timePassedSinceStart = now - item.startedAt;
            const completedUnits = Math.floor(timePassedSinceStart / unitDurationMs);

            if (completedUnits > 0) {
              const actualCompleted = Math.min(item.count, completedUnits);
              if (actualCompleted > 0) {
                planet.troops[item.troopId as keyof typeof planet.troops] += actualCompleted;
                item.count -= actualCompleted;
                item.startedAt += actualCompleted * unitDurationMs;
                changed = true;
              }
            }

            if (item.count > 0) {
              remainingQueue.push(item);
            }
          }
        });

        planet.trainingQueue = remainingQueue;
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
  defTroops: Record<string, number>,
  attShieldLevel: number = 10,
  defShieldLevel: number = 10
) {
  const attRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...attTroops };
  const defRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...defTroops };

  const attackerLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const defenderLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

  const defenderSalvaged = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const attackerSalvaged = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

  const rounds: BattleRound[] = [];
  let attackHpKilled = 0;
  let defenceHpKilled = 0;

  const attMult = 1.0 + (Math.min(20, attShieldLevel) / 20) * 0.15;
  const defMult = 1.0 + (Math.min(20, defShieldLevel) / 20) * 0.15;

  let initialAttHp = 0;
  Object.entries(attTroops).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
    if (spec) initialAttHp += count * Math.round(spec.attackHp * attMult);
  });

  let initialDefHp = 0;
  Object.entries(defTroops).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
    if (spec) initialDefHp += count * Math.round(spec.defenceHp * defMult);
  });

  let attSurvivalFloor = 0;
  let defSurvivalFloor = 0;

  if (initialAttHp > 0 && initialDefHp > 0) {
    if (initialAttHp > initialDefHp) {
      // Attacker has more HP
      const diffPct = (initialAttHp - initialDefHp) / initialDefHp;
      attSurvivalFloor = Math.min(0.30, diffPct * 0.5);
    } else if (initialDefHp > initialAttHp) {
      // Defender has more HP
      const diffPct = (initialDefHp - initialAttHp) / initialAttHp;
      defSurvivalFloor = Math.min(0.30, diffPct * 0.5);
    }
  }

  // Targeting priority weights for Moonbase-style combat distribution
  // High weights mean targeted first (acting as screen), lower weights mean targeted later
  const TARGET_PRIORITIES = {
    defender: 2.0,       // Interceptor: Vanguard defense screen
    attacker: 2.0,       // Assault Drone: Aggressive frontline unit
    drone: 0.8,          // Missile Tank: Heavy siege, protected backline
    tank: 0.8,           // Disrupter: Armored bomber unit
    looter: 0.3,         // Matter Extractor: Fragile utility ship
    settlementShip: 0.2  // Settlement Ship: Extremely large, backline transport
  };

  const getActiveCombatShips = (troops: Record<string, number>) => {
    return (Object.keys(troops) as (keyof typeof troops)[]).filter(k => troops[k] > 0);
  };

  for (let r = 1; r <= 1; r++) {
    const roundLogs: string[] = [];
    const totalAtt = Object.values(attRemaining).reduce((s, v) => s + v, 0);
    const totalDef = Object.values(defRemaining).reduce((s, v) => s + v, 0);

    if (totalAtt === 0 || totalDef === 0) {
      break;
    }

    // Calculate base raw attack powers
    let baseAttDamage = 0;
    Object.entries(attRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec) baseAttDamage += count * spec.attackHp;
    });

    // As the defender being attacked, their offensive HP does not count under attack! Only their defense HP helps defend.
    let baseDefDamage = 0;
    Object.entries(defRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec) baseDefDamage += count * spec.defenceHp;
    });

    // MXIT Moonbase style combat randomness and variance (fuzzing of ±15%)
    const attVariance = 0.85 + Math.random() * 0.30;
    const defVariance = 0.85 + Math.random() * 0.30;

    let attDamage = Math.round(baseAttDamage * attVariance);
    let defDamage = Math.round(baseDefDamage * defVariance);

    const activeAttTypes = getActiveCombatShips(attRemaining);
    const activeDefTypes = getActiveCombatShips(defRemaining);

    const roundAttLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    const roundDefLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

    roundLogs.push(`--- COMBAT CYCLE ${r} INITIATED ---`);
    roundLogs.push(`Attackers throw ${attDamage.toLocaleString()} megawatt laser channels into target coordinates.`);
    roundLogs.push(`Defenders are being attacked under siege. Their offensive HP does not count; only their defense HP (${baseDefDamage.toLocaleString()} total DEF) is channeled into ${defDamage.toLocaleString()} retaliatory counter-firepower.`);

    // Distribute attacker damage onto defender troops
    if (attDamage > 0 && activeDefTypes.length > 0) {
      let damagePool = attDamage;
      let remainingTargets = [...activeDefTypes];

      // Keep distributing damage until pool is exhausted or all targets are destroyed
      while (damagePool > 0 && remainingTargets.length > 0) {
        // Calculate relative weights
        let totalWeight = 0;
        remainingTargets.forEach(tId => {
          const qty = defRemaining[tId];
          const prio = TARGET_PRIORITIES[tId as keyof typeof TARGET_PRIORITIES] || 1.0;
          totalWeight += qty * prio;
        });

        if (totalWeight === 0) break;

        let extraRedistributePool = 0;
        const damageToApply: Record<string, number> = {};

        // Calculate a targeted damage allocation
        remainingTargets.forEach(tId => {
          const qty = defRemaining[tId];
          const prio = TARGET_PRIORITIES[tId as keyof typeof TARGET_PRIORITIES] || 1.0;
          const share = (qty * prio) / totalWeight;
          damageToApply[tId] = damagePool * share;
        });

        damagePool = 0; // Temporarily zeroed, will accumulate overflow

        // Process actual casualties per troop type based on their unit defense stats
        remainingTargets.forEach(tId => {
          const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
          const unitHp = Math.round((spec ? spec.defenceHp : 100) * defMult);
          const currentCount = defRemaining[tId];
          const allocatedDmg = damageToApply[tId];

          // How many die directly
          let killed = Math.floor(allocatedDmg / unitHp);
          const fractionalDmg = allocatedDmg % unitHp;

          // Probabilistic spillover chance to kill one more unit
          if (fractionalDmg > 0 && killed < currentCount) {
            const killChance = fractionalDmg / unitHp;
            if (Math.random() < killChance) {
              killed++;
            }
          }

          killed = Math.min(currentCount, killed);

          if (killed > 0) {
            roundDefLosses[tId] += killed;
            defenderLosses[tId] += killed;
            defRemaining[tId] -= killed;
            defenceHpKilled += killed * unitHp;

            // If some damage was allocated but exceeded vital HP of all surviving units of this type,
            // feed the excess juice back into the pool for remaining targets!
            const usedDamage = killed * unitHp;
            if (allocatedDmg > usedDamage) {
              extraRedistributePool += (allocatedDmg - usedDamage);
            }
          }
        });

        // Any leftover damage and leftover targets get run in the next redistribution loop
        damagePool = extraRedistributePool;
        remainingTargets = getActiveCombatShips(defRemaining);
      }
    }

    // Distribute defender damage onto attacker troops
    if (defDamage > 0 && activeAttTypes.length > 0) {
      let damagePool = defDamage;
      let remainingTargets = [...activeAttTypes];

      while (damagePool > 0 && remainingTargets.length > 0) {
        let totalWeight = 0;
        remainingTargets.forEach(tId => {
          const qty = attRemaining[tId];
          const prio = TARGET_PRIORITIES[tId as keyof typeof TARGET_PRIORITIES] || 1.0;
          totalWeight += qty * prio;
        });

        if (totalWeight === 0) break;

        let extraRedistributePool = 0;
        const damageToApply: Record<string, number> = {};

        remainingTargets.forEach(tId => {
          const qty = attRemaining[tId];
          const prio = TARGET_PRIORITIES[tId as keyof typeof TARGET_PRIORITIES] || 1.0;
          const share = (qty * prio) / totalWeight;
          damageToApply[tId] = damagePool * share;
        });

        damagePool = 0;

        remainingTargets.forEach(tId => {
          const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
          const unitHp = Math.round((spec ? spec.defenceHp : 100) * attMult);
          const currentCount = attRemaining[tId];
          const allocatedDmg = damageToApply[tId];

          let killed = Math.floor(allocatedDmg / unitHp);
          const fractionalDmg = allocatedDmg % unitHp;

          if (fractionalDmg > 0 && killed < currentCount) {
            const killChance = fractionalDmg / unitHp;
            if (Math.random() < killChance) {
              killed++;
            }
          }

          killed = Math.min(currentCount, killed);

          if (killed > 0) {
            roundAttLosses[tId] += killed;
            attackerLosses[tId] += killed;
            attRemaining[tId] -= killed;
            attackHpKilled += killed * unitHp;

            const usedDamage = killed * unitHp;
            if (allocatedDmg > usedDamage) {
              extraRedistributePool += (allocatedDmg - usedDamage);
            }
          }
        });

        damagePool = extraRedistributePool;
        remainingTargets = getActiveCombatShips(attRemaining);
      }
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

  // Apply HP percentage survival protection floors
  const safetyLogs: string[] = [];
  if (attSurvivalFloor > 0) {
    let protectionTriggered = false;
    Object.entries(attTroops).forEach(([tId, initialCount]) => {
      if (initialCount > 0) {
        const minSurviving = Math.ceil(initialCount * attSurvivalFloor);
        if (attRemaining[tId] < minSurviving) {
          const shortage = minSurviving - attRemaining[tId];
          attRemaining[tId] = minSurviving;
          attackerLosses[tId] = Math.max(0, attackerLosses[tId] - shortage);
          const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
          const unitHp = spec ? Math.round(spec.defenceHp * attMult) : 10;
          attackHpKilled = Math.max(0, attackHpKilled - shortage * unitHp);
          protectionTriggered = true;
        }
      }
    });
    if (protectionTriggered) {
      safetyLogs.push(`🛡️ [Tactical Deflection Force] Attacker had ${(attSurvivalFloor * 100).toFixed(1)}% HP advantage! Survival security field guaranteed that at least ${(attSurvivalFloor * 100).toFixed(1)}% of original squads survive.`);
    }
  }

  if (defSurvivalFloor > 0) {
    let protectionTriggered = false;
    Object.entries(defTroops).forEach(([tId, initialCount]) => {
      if (initialCount > 0) {
        const minSurviving = Math.ceil(initialCount * defSurvivalFloor);
        if (defRemaining[tId] < minSurviving) {
          const shortage = minSurviving - defRemaining[tId];
          defRemaining[tId] = minSurviving;
          defenderLosses[tId] = Math.max(0, defenderLosses[tId] - shortage);
          const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
          const unitHp = spec ? Math.round(spec.defenceHp * defMult) : 10;
          defenceHpKilled = Math.max(0, defenceHpKilled - shortage * unitHp);
          protectionTriggered = true;
        }
      }
    });
    if (protectionTriggered) {
      safetyLogs.push(`🛡️ [Tactical Deflection Force] Defender had ${(defSurvivalFloor * 100).toFixed(1)}% HP advantage! Survival security field guaranteed that at least ${(defSurvivalFloor * 100).toFixed(1)}% of original squads survive.`);
    }
  }

  if (safetyLogs.length > 0 && rounds.length > 0) {
    rounds[rounds.length - 1].logs.push(...safetyLogs);
  }

  // MXIT Moonbase Salvage Field Recovery Protocol!
  // In classic Moonbase: Survivors are salvaged and patched back together from the wreckage.
  // Defender recovery rate: 20% (on-planet orbital repair systems).
  // Attacker recovery rate: 10% (on-board tactical salvage bays).
  const salvageLogs: string[] = [];

  Object.entries(defenderLosses).forEach(([tId, count]) => {
    if (count > 0) {
      // 20% chance to retrieve each destroyed ship
      let saved = 0;
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.20) saved++;
      }
      if (saved > 0) {
        defenderSalvaged[tId] = saved;
        // Re-add to surviving troops
        defRemaining[tId] += saved;
        // Subtract from overall recorded losses so they survive
        defenderLosses[tId] -= saved;
      }
    }
  });

  Object.entries(attackerLosses).forEach(([tId, count]) => {
    if (count > 0) {
      // 10% chance to retrieve each destroyed ship
      let saved = 0;
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.10) saved++;
      }
      if (saved > 0) {
        attackerSalvaged[tId] = saved;
        // Re-add to surviving troops
        attRemaining[tId] += saved;
        // Subtract from overall recorded losses so they survive
        attackerLosses[tId] -= saved;
      }
    }
  });

  // Generate beautiful salvage reporting messages to attach to the final round logs!
  const defSalvagedText = Object.entries(defenderSalvaged)
    .filter(([_, qty]) => qty > 0)
    .map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.name || tId}`)
    .join(", ");

  const attSalvagedText = Object.entries(attackerSalvaged)
    .filter(([_, qty]) => qty > 0)
    .map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.name || tId}`)
    .join(", ");

  if (defSalvagedText || attSalvagedText) {
    salvageLogs.push(`=== BATTLEFIELD ORBIT RECOVERY REPORT ===`);
    if (defSalvagedText) {
      salvageLogs.push(`[Nano-Salvage Array] Planetary defense rigs gathered scrap, reconstructing: ${defSalvagedText} for the Defender.`);
    }
    if (attSalvagedText) {
      salvageLogs.push(`[Tactical Medical Bay] Offside carrier teams salvaged and re-launched: ${attSalvagedText} for the Attacker.`);
    }
    // Append the combat salvage overview to the final round's logs
    if (rounds.length > 0) {
      rounds[rounds.length - 1].logs.push(...salvageLogs);
    }
  }

  // 150% involved HP complete annihilation overwhelm rule
  if (initialAttHp > 1.5 * initialDefHp && initialDefHp > 0) {
    // Defender losses set to initial counts, no survivors
    Object.entries(defTroops).forEach(([tId, count]) => {
      defRemaining[tId as keyof typeof defRemaining] = 0;
      defenderLosses[tId as keyof typeof defenderLosses] = count;
    });
    defenceHpKilled = initialDefHp;
    if (rounds.length > 0) {
      rounds[rounds.length - 1].logs.push(`💥 [TACTICAL OVERWHELM] Attacker's initial force HP of ${initialAttHp.toLocaleString()} exceeded 150% of the defender's total involved HP (${initialDefHp.toLocaleString()}). Absolute overwhelm triggered; all defender defending forces have been wiped out with ZERO survivors!`);
    }
  } else if (initialDefHp > 1.5 * initialAttHp && initialAttHp > 0) {
    // Attacker losses set to initial counts, no survivors
    Object.entries(attTroops).forEach(([tId, count]) => {
      attRemaining[tId as keyof typeof attRemaining] = 0;
      attackerLosses[tId as keyof typeof attackerLosses] = count;
    });
    attackHpKilled = initialAttHp;
    if (rounds.length > 0) {
      rounds[rounds.length - 1].logs.push(`💥 [TACTICAL OVERWHELM] Defender's initial force HP of ${initialDefHp.toLocaleString()} exceeded 150% of the attacker's total involved HP (${initialAttHp.toLocaleString()}). Absolute overwhelm triggered; all attacking squadron forces have been wiped out with ZERO survivors!`);
    }
  }

  const finalAttCount = Object.values(attRemaining).reduce((s, v) => s + v, 0);
  const finalDefCount = Object.values(defRemaining).reduce((s, v) => s + v, 0);

  const finalAttHp = Object.entries(attRemaining).reduce((sum, [tId, qty]) => {
    const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
    const totalUnitHP = spec ? spec.defenceHp : 0;
    return sum + qty * Math.round(totalUnitHP * attMult);
  }, 0);

  const finalDefHp = Object.entries(defRemaining).reduce((sum, [tId, qty]) => {
    const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
    const totalUnitHP = spec ? spec.defenceHp : 0;
    return sum + qty * Math.round(totalUnitHP * defMult);
  }, 0);

  let winner: "attacker" | "defender" = "defender";
  if (finalAttCount === 0 && finalDefCount > 0) {
    winner = "defender";
  } else if (finalDefCount === 0 && finalAttCount > 0) {
    winner = "attacker";
  } else if (finalAttCount === 0 && finalDefCount === 0) {
    // Both sides completely wiped out, defender holds the sector
    winner = "defender";
  } else {
    // Both sides have surviving forces, compare remaining HP
    if (finalAttHp > finalDefHp) {
      winner = "attacker";
    } else if (finalAttHp < finalDefHp) {
      winner = "defender";
    } else {
      winner = finalAttCount >= finalDefCount ? "attacker" : "defender";
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

  if (fleet.missionType === "move") {
    // Relocation / Move: Depositing troops permanently to the target planet owned by sender or alliance member
    if (attacker) {
      let targetPlanet = attacker.planets.find(pl => pl.sectorX === fleet.targetCoords.x && pl.sectorY === fleet.targetCoords.y);
      let targetOwner = attacker;

      if (!targetPlanet && attacker.allianceId) {
        for (const playerObj of Object.values(state.players)) {
          if (playerObj.allianceId === attacker.allianceId) {
            const pl = playerObj.planets.find(p => p.sectorX === fleet.targetCoords.x && p.sectorY === fleet.targetCoords.y);
            if (pl) {
              targetPlanet = pl;
              targetOwner = playerObj;
              break;
            }
          }
        }
      }

      if (targetPlanet) {
        // Transfer all troops to the destination planet
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          targetPlanet!.troops[tId as keyof typeof targetPlanet.troops] = (targetPlanet!.troops[tId as keyof typeof targetPlanet.troops] || 0) + count;
        });

        // Add relocation report/log
        const report: BattleReport = {
          id: `battle_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          attackerId: fleet.senderId,
          attackerName: fleet.senderName,
          defenderId: targetOwner.id,
          defenderName: targetPlanet.name,
          isRecon: false,
          attackerCoords: fleet.senderCoords,
          defenderCoords: fleet.targetCoords,
          attackerInitialTroops: { ...fleet.troops },
          attackerLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 },
          defenderInitialTroops: { ...targetPlanet.troops },
          defenderLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 },
          winner: "attacker",
          resourcesStolen: { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 },
          attackHpKilled: 0,
          defenceHpKilled: 0,
          battleRounds: [
            {
              round: 1,
              logs: [
                "--- SECURE FLEET TRANSIT RELOCATION ---",
                `All relocated squadrons have safely made orbital insertion at '${targetPlanet.name}'.`,
                "Troops have been successfully deployed and integrated into the local defense network.",
                `Arriving payload: ${Object.entries(fleet.troops).filter(([_, q]) => q > 0).map(([t, q]) => `${q} ${t}`).join(', ') || 'No spacecraft'}`
              ],
              attackerRemaining: { ...fleet.troops },
              defenderRemaining: { ...targetPlanet.troops }
            }
          ]
        };
        state.battleReports.unshift(report);
      } else {
        // If they don't own the target planet, return troops home
        const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
        const slowestTroopSpeed = Object.entries(fleet.troops)
          .filter(([_, qty]) => qty > 0)
          .reduce((slowest, [tId, _]) => {
            const sp = TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.speed || 5;
            return sp < slowest ? sp : slowest;
          }, 100);
        const travelTimeMs = Math.round((totalDist / slowestTroopSpeed) * 60000);
        
        remainingFleets.push({
          ...fleet,
          isReturning: true,
          startedAt: now,
          arrivesAt: now + travelTimeMs
        });
      }
    }
    return;
  }

  if (fleet.missionType === "recon") {
    // Recon generates a scout battle report / report
    const defTroops = defender?.planets[0]?.troops || { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    let defenderTotalHp = 0;
    Object.entries(defTroops).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec && (count as number) > 0) {
        defenderTotalHp += (count as number) * spec.defenceHp;
      }
    });

    let scoutingTotalAttack = 0;
    Object.entries(fleet.troops).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId as keyof typeof TROOP_SPECS];
      if (spec && (count as number) > 0) {
        scoutingTotalAttack += (count as number) * spec.attackHp;
      }
    });

    const dronesDiedCount = (defenderTotalHp > 0 && scoutingTotalAttack < defenderTotalHp) ? (fleet.troops.drone || 0) : 0;
    const didScoutsDie = dronesDiedCount > 0;

    const defPlanet = defender?.planets[0];
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
      attackerInitialTroops: { ...fleet.troops },
      attackerLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: dronesDiedCount },
      defenderInitialTroops: { ...defTroops },
      defenderLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 },
      winner: didScoutsDie ? "defender" : "attacker",
      resourcesStolen: { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 },
      attackHpKilled: 0,
      defenceHpKilled: 0,
      buildings: defPlanet ? {
        commsHub: defPlanet.buildings.commsHub?.level || 1,
        radar: defPlanet.buildings.radar?.level || 1,
        repository: defPlanet.buildings.repository?.level || 1,
        researchCenter: defPlanet.buildings.researchCenter?.level || 1,
        armyBase: defPlanet.buildings.armyBase?.level || 1,
        supplyNexus: defPlanet.buildings.supplyNexus?.level || 1
      } : undefined,
      mines: defPlanet ? {
        water: defPlanet.mines?.water?.map((m: any) => m.level) || [1],
        plasma: defPlanet.mines?.plasma?.map((m: any) => m.level) || [1],
        fuel: defPlanet.mines?.fuel?.map((m: any) => m.level) || [1],
        food: defPlanet.mines?.food?.map((m: any) => m.level) || [1],
        respirant: defPlanet.mines?.respirant?.map((m: any) => m.level) || [1]
      } : undefined,
      resources: defPlanet ? defPlanet.resources : undefined
    };

    const reportLogs: string[] = [];
    if (didScoutsDie) {
      reportLogs.push("--- SATELLITE INTERCEPT ENCOUNTER ---");
      reportLogs.push(`Hostile garrison detected: ${defenderTotalHp.toLocaleString()} defending HP.`);
      reportLogs.push(`Scout group attack rating: ${scoutingTotalAttack.toLocaleString()} attack HP.`);
      reportLogs.push("Orbit guards identified scout telemetry and initiated railguards.");
      reportLogs.push(`Our missile launcher group (${dronesDiedCount} unit(s)) was completely destroyed because our scouting attack power was less than hostiles' defending HP.`);
      reportLogs.push("Full tactical satellite telemetry was successfully beamed to moonbase before demolition.");
    } else {
      reportLogs.push("--- SECURE TELEMETRY SCAN ---");
      reportLogs.push(defenderTotalHp > 0 
        ? `Hostiles detected: ${defenderTotalHp} defending HP, but our fleet attack power (${scoutingTotalAttack}) is sufficient to cover reconnaissance safety.`
        : "No active orbit guards or garrison troops detected at target colony.");
      reportLogs.push("Complete layout telemetry logged with zero drone losses.");
    }

    report.battleRounds = [
      {
        round: 1,
        logs: reportLogs,
        attackerRemaining: { ...fleet.troops, drone: Math.max(0, (fleet.troops.drone || 0) - dronesDiedCount) },
        defenderRemaining: { ...defTroops }
      }
    ];

    state.battleReports.unshift(report);

    // Apply losses to fleet
    if (didScoutsDie) {
      fleet.troops.drone = Math.max(0, (fleet.troops.drone || 0) - dronesDiedCount);
    }

    // Fleet returns back immediately
    const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
    const speedLvl = fleet.troopSpeedLevel || 1;
    const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
    const multiplier = 1.0 + boostPct;
    const speed = TROOP_SPECS.drone.speed * multiplier;
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
    const attShieldLvl = fleet.defenseShieldsLevel || 10;
    let defShieldLvl = 10;
    if (defender) {
      const defRc = defender.planets[0]?.buildings.researchCenter;
      if (defRc) defShieldLvl = defRc.level;
    }

    const combat = simulateMoonbaseCombat(
      fleet.senderName,
      fleet.targetName,
      attTroops,
      defTroops,
      attShieldLvl,
      defShieldLvl
    );

    // Apply casualties to defender
    if (defPlanet) {
      Object.entries(combat.defenderLosses).forEach(([tId, count]) => {
        defPlanet.troops[tId as keyof typeof defPlanet.troops] -= count;
      });
    }

    // Award scoring for actual units destroyed on both sides
    attacker.scores.attack += combat.defenceHpKilled;
    defender.scores.defence += combat.attackHpKilled;

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
    const buildingDamageReports = (combat.winner === "attacker" && combat.attackerRemaining.tank > 0 && defPlanet)
      ? applyBomberDamage(defPlanet, combat.attackerRemaining.tank, fleet.targetBuilding || "random")
      : [];

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

    // Send fleet back with surviving troops & loot order (only if there are survivors)
    const survivingCount = Object.values(combat.attackerRemaining).reduce((s, v) => s + v, 0);
    if (survivingCount > 0) {
      const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
      const speedLvl = fleet.troopSpeedLevel || 1;
      const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
      const multiplier = 1.0 + boostPct;

      const slowestTroopSpeed = (Object.entries(combat.attackerRemaining)
        .filter(([_, qty]) => qty > 0)
        .reduce((slowest, [tId, _]) => {
          const sp = TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.speed || 50;
          return sp < slowest ? sp : slowest;
        }, 100)) * multiplier;

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
}

// Generate background simulated active sandbox activities
function runAISimulatedActivity(now: number) {
  const players = Object.values(state.players).filter(p => p.id.startsWith("ai_"));
  if (players.length === 0) return;

  // Let 1-2 AI do randomized activities
  const luckyAI = players[Math.floor(Math.random() * players.length)];
  const actionType = Math.random();

  if (actionType < 0.25) {
    // Bots do not talk on global chat anymore
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
loadState().then(() => {
  console.log("Game Engine database/file systems synced and initialized!");
}).catch(err => {
  console.error("Game Engine CRITICAL sync error on startup:", err);
});
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
  const p = state.players[userId];
  if ((p.credits || 0) < 10000) {
    p.credits = 10000;
  }
  return p;
}

// Authentication
app.post("/api/register", (req, res) => {
  const { username, faction, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Check if exists
  const exists = Object.values(state.players).some(p => p.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Commander username already registered" });
  }

  const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const selectFaction = factions.includes(faction) ? faction : factions[0];
  const idx = factions.indexOf(selectFaction);
  const selectColor = factionColors[idx];

  const id = `user_${Math.random().toString(36).substr(2, 9)}`;
  const startX = Math.floor(Math.random() * 90) + 5;
  const startY = Math.floor(Math.random() * 90) + 5;

  const planet = createInitialPlanet(`${username}'s Station`, startX, startY, true);
  
  // Set reasonable starting resources
  planet.resources.water = 5000000;
  planet.resources.plasma = 5000000;
  planet.resources.fuel = 5000000;
  planet.resources.food = 5000000;
  planet.resources.respirant = 5000000;
  
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
    credits: 10000,
    password: password || undefined
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
  const { username, password } = req.body;
  const player = Object.values(state.players).find(p => p.username.toLowerCase() === username.toLowerCase());
  
  if (!player) {
    return res.status(404).json({ error: "Commander not found" });
  }

  // Validate password if user has registered with one
  if (player.password && player.password !== password) {
    return res.status(401).json({ error: "Access denied. Point of entry rejected. Incorrect tactical passkey." });
  }

  res.json({ player });
});

// Google Authentication secure endpoint
app.post("/api/auth/google", (req, res) => {
  const { email, username, faction } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Google credentials authorization failed. Email is required." });
  }

  // Look up existing commander by registered Google email
  let player = Object.values(state.players).find(p => p.googleEmail?.toLowerCase() === email.toLowerCase());

  if (player) {
    return res.json({ player, isNew: false });
  }

  // Check if a player with this exact username already exists to link them
  if (username) {
    player = Object.values(state.players).find(p => p.username.toLowerCase() === username.toLowerCase());
    if (player) {
      player.googleEmail = email;
      if (!player.achievements.includes("Google Verified Commander")) {
        player.achievements.push("Google Verified Commander");
      }
      saveState();
      return res.json({ player, isNew: false, linked: true });
    }
  }

  // Create a brand new Google-secured Commander Profile
  const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const selectFaction = factions.includes(faction) ? faction : factions[0];
  const idx = factions.indexOf(selectFaction);
  const selectColor = factionColors[idx];

  const id = `google_${Math.random().toString(36).substr(2, 9)}`;
  const startX = Math.floor(Math.random() * 90) + 5;
  const startY = Math.floor(Math.random() * 90) + 5;

  const defaultUsername = username || email.split("@")[0];
  const planet = createInitialPlanet(`${defaultUsername}'s Station`, startX, startY, true);
  
  // Set reasonable starting resources
  planet.resources.water = 5000000;
  planet.resources.plasma = 5000000;
  planet.resources.fuel = 5000000;
  planet.resources.food = 5000000;
  planet.resources.respirant = 5000000;

  const newPlayer: PlayerProfile = {
    id,
    username: defaultUsername,
    faction: selectFaction,
    factionColor: selectColor,
    allianceId: null,
    allianceRole: null,
    planets: [planet],
    scores: {
      population: 7500,
      attack: 0,
      defence: 0,
      raiders: 0
    },
    achievements: ["First Mine Started", "Google Verified Commander"],
    skinId: "default",
    bannerId: "default",
    lastDailyRewardClaim: Date.now(),
    credits: 10000,
    googleEmail: email
  };

  state.players[id] = newPlayer;

  // Global news
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Google Commander Registered",
    content: `Commander ${defaultUsername} synced via Google keys and established command in Sector [${startX}, ${startY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });

  // Chat greeting
  state.chatMessages.push({
    id: `chat_welcome_${Math.random().toString(36).substr(2, 9)}`,
    channel: "global",
    senderId: "system",
    senderName: "CENTRAL COMMAND",
    senderFaction: "System",
    senderFactionColor: "#7F8C8D",
    allianceTag: "SYS",
    receiverId: null,
    content: `Google Secure sync approved. Welcome Commander ${defaultUsername} to active space duty!`,
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: newPlayer, isNew: true });
});

// Link Google Account endpoint for logged in commanders
app.post("/api/player/link-google", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Google email is required" });
  }

  // Ensure no other player profile is mapped to this email
  const existing = Object.values(state.players).find(other => other.googleEmail?.toLowerCase() === email.toLowerCase() && other.id !== p.id);
  if (existing) {
    return res.status(400).json({ error: "This Google email is already linked to another commander profile!" });
  }

  p.googleEmail = email;
  if (!p.achievements.includes("Google Verified Commander")) {
    p.achievements.push("Google Verified Commander");
  }

  saveState();
  res.json({ player: p, success: true });
});

// Developer tool: reset all game data on the server (restricted to admin Banele)
app.post("/api/dev/reset-universe", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.googleEmail || p.googleEmail.toLowerCase() !== 'banele180@gmail.com') {
    return res.status(403).json({ error: "Access Denied: Server reset is only permitted for the system administrator." });
  }

  bootstrapUniverse();
  saveState();
  res.json({ success: true, message: "Universe successfully reset to initial clean data!" });
});

// Heartbeat test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

// Sync full state
app.get("/api/state", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const now = Date.now();
  p.lastActive = now;
  tickPlayerState(p.id, now);
  tickFleets(now);
  saveState();

  const myAllianceId = p.allianceId;
  const allianceMemberIds = myAllianceId 
    ? (state.alliances[myAllianceId]?.members.map(m => m.playerId) || [])
    : [];

  const playersList = Object.values(state.players).map(pl => ({
    id: pl.id,
    username: pl.username,
    faction: pl.faction,
    factionColor: pl.factionColor,
    allianceId: pl.allianceId,
    allianceRole: pl.allianceRole,
    scores: pl.scores || { population: 0, attack: 0, defence: 0, raiders: 0 },
    achievements: pl.achievements || [],
    planetsCount: pl.planets?.length || 1,
    planets: (pl.planets || []).map(plt => ({ id: plt.id, name: plt.name, sectorX: plt.sectorX, sectorY: plt.sectorY })),
    lastActive: pl.lastActive || now - 600000
  }));

  const relevantFleets = state.fleets.filter(f => {
    if (f.senderId === p.id || f.targetId === p.id) return true;
    if (myAllianceId) {
      const isSenderMember = allianceMemberIds.includes(f.senderId);
      const isTargetMember = f.targetId ? allianceMemberIds.includes(f.targetId) : false;
      return isSenderMember || isTargetMember;
    }
    return false;
  });

  res.json({
    player: p,
    alliances: state.alliances,
    chatMessages: state.chatMessages,
    fleets: relevantFleets,
    battleReports: state.battleReports.filter(r => r.attackerId === p.id || r.defenderId === p.id),
    newsEvents: state.newsEvents,
    playersList,
    serverTime: now
  });
});

// Upgrade Mine
app.post("/api/upgrade/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, resType, mineIndex, queue: reqQueue } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  // Pre-requisite check: Fabricator must be level >= 1 to upgrade/construct extractors (mines)
  const fab = planet.buildings.fabricator;
  if (!fab || fab.level < 1) {
    return res.status(400).json({ error: "A Fabricator level 1 or higher is required to construct or upgrade resource extractors." });
  }

  const mines = planet.mines[resType as ResourceType];
  if (!mines || !mines[mineIndex]) return res.status(404).json({ error: "Mine not found" });

  const mine = mines[mineIndex];

  // Enforce 1 upgrade at a time (buildings or mines) limit per colony planet
  const isBuildingUpgrading = Object.values(planet.buildings).some((b: any) => b.isUpgrading);
  let isMineUpgrading = false;
  for (const rKey of Object.keys(planet.mines)) {
    if (planet.mines[rKey as ResourceType].some(m => m.isUpgrading)) {
      isMineUpgrading = true;
      break;
    }
  }

  const isAlreadyUpgrading = isBuildingUpgrading || isMineUpgrading;
  const shouldQueue = reqQueue && isAlreadyUpgrading;

  if (isAlreadyUpgrading && !reqQueue) {
    return res.status(400).json({ 
      error: "Another construction project or extractor upgrade is already actively in progress on this planet. Only one upgrade at a time is permitted!",
      canQueue: true 
    });
  }

  if (shouldQueue) {
    if (!planet.upgradeQueue) {
      planet.upgradeQueue = [];
    }
    if (planet.upgradeQueue.length >= 25) {
      return res.status(400).json({ error: "Upgrade queue is full (max 25 queued upgrades allowed)!" });
    }
    if ((p.credits || 0) < 15) {
      return res.status(400).json({ error: "Insufficient Space Gold credits available! Queuing an upgrade costs 15 Space Gold." });
    }
  }

  // Calculate targetLevel based on active + queue count for this specific mine
  let queuedCount = 0;
  if (mine.isUpgrading) queuedCount++;
  if (planet.upgradeQueue) {
    queuedCount += planet.upgradeQueue.filter(q => q.type === 'mine' && q.key === resType && q.mineIndex === mineIndex).length;
  }
  const targetLevel = mine.level + queuedCount + 1;

  const planetIndex = p.planets.findIndex(pl => pl.id === planetId);
  const maxExtractorLevel = planetIndex === 0 ? 25 : planetIndex === 1 ? 20 : 15;
  if (targetLevel > maxExtractorLevel) {
    return res.status(400).json({ error: `Mine reaches max level (${maxExtractorLevel}) for this station.` });
  }
  if (mine.health !== undefined && mine.health < 100) return res.status(400).json({ error: "Extractor is damaged. Restore it to 100% health first before upgrading." });

  // Verify resources
  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = getUpgradeResourceCost('mine', resType, targetLevel, k);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to upgrade extractor to level ${targetLevel}.` });
    }
  }

  // Deduct resources
  keys.forEach(k => {
    const cost = getUpgradeResourceCost('mine', resType, targetLevel, k);
    planet.resources[k] -= cost;
  });

  if (shouldQueue) {
    // Deduct Space Gold (credits) - FREE for test phase
    // p.credits = (p.credits || 0) - 15;
    planet.upgradeQueue!.push({
      type: 'mine',
      key: resType,
      mineIndex: mineIndex,
      targetLevel: targetLevel
    });

    saveState();
    return res.json({ player: p, success: true, queued: true });
  } else {
    // Start active immediately
    const durationMs = targetLevel * 60 * 1000; // 1 minute per level in ms
    mine.isUpgrading = true;
    mine.upgradeEnd = Date.now() + durationMs;

    saveState();
    return res.json({ player: p, success: true });
  }
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

// Production Boost Extractor(s) using Space Gold (player credits)
app.post("/api/extractor/boost", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const now = Date.now();
  tickPlayerState(p.id, now);

  const { planetId, resType, resourceType, mineIndex, durationDays, targetAll: reqTargetAll } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const finalResourceType = resourceType || resType;
  const targetAll = reqTargetAll || (finalResourceType === "all");

  const daysNum = parseInt(durationDays, 10);
  if (daysNum !== 1 && daysNum !== 7 && daysNum !== 30) {
    return res.status(400).json({ error: "Invalid duration select" });
  }

  // Calculate cost and configure boosted timestamp
  let cost = 0;
  const boostEndTime = Date.now() + (daysNum * 24 * 60 * 60 * 1000);

  if (targetAll) {
    cost = daysNum === 1 ? 160 : daysNum === 7 ? 1049 : 3999;
  } else {
    cost = daysNum === 1 ? 45 : daysNum === 7 ? 265 : 999;
  }

  if ((p.credits || 0) < cost) {
    return res.status(400).json({ error: "Insufficient Space Gold credits available!" });
  }

  // Deduct Credits - FREE for test phase
  // p.credits = (p.credits || 0) - cost;

  // Apply boost to the selected station (planet)
  if (targetAll) {
    // Boost all extractors on the planet!
    for (const rType of Object.keys(planet.mines) as ResourceType[]) {
      for (const m of planet.mines[rType]) {
        m.boostedUntil = boostEndTime;
      }
    }
  } else {
    // Boost a specific extractor category (all pumps for finalResourceType)
    const mines = planet.mines[finalResourceType as ResourceType];
    if (mines) {
      mines.forEach(m => {
        m.boostedUntil = boostEndTime;
      });
    }
  }

  saveState();
  res.json({ player: p, success: true });
});

// Upgrade Building
app.post("/api/upgrade/building", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, buildingKey, queue: reqQueue } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const building = planet.buildings[buildingKey as keyof typeof planet.buildings] as BuildingState;
  if (!building) return res.status(404).json({ error: "Building not found" });

  // Pre-requisite check: Fabricator must be level >= 1 to construct/upgrade other structures (except Fabricator, Comms Hub, Silo/Repository itself)
  if (buildingKey !== "fabricator" && buildingKey !== "commsHub" && buildingKey !== "repository") {
    const fab = planet.buildings.fabricator;
    if (!fab || fab.level < 1) {
      return res.status(400).json({ error: "A Fabricator level 1 or higher is required to construct or upgrade other modular structures." });
    }
  }

  // Check Fabricator level requirements for secondary bases when unlocking buildings
  const isSecondaryBase = p.planets[0]?.id !== planet.id;
  if (isSecondaryBase && building.level === 0) {
    const fabLevel = planet.buildings.fabricator?.level || 0;
    if (buildingKey === "radar" && fabLevel < 2) {
      return res.status(400).json({ error: "A Fabricator level 2 or higher is required to construct your Radar Array on this secondary station!" });
    }
    if (buildingKey === "researchCenter" && fabLevel < 4) {
      return res.status(400).json({ error: "A Fabricator level 4 or higher is required to construct your Research Center on this secondary station!" });
    }
    if (buildingKey === "armyBase" && fabLevel < 7) {
      return res.status(400).json({ error: "A Fabricator level 7 or higher is required to construct your War Room on this secondary station!" });
    }
    if (buildingKey === "supplyNexus" && fabLevel < 10) {
      return res.status(400).json({ error: "A Fabricator level 10 or higher is required to construct your Supply Nexus on this secondary station!" });
    }
  }

  // Enforce 1 upgrade at a time (buildings or mines) limit per colony planet
  const isBuildingUpgrading = Object.values(planet.buildings).some((b: any) => b.isUpgrading);
  let isMineUpgrading = false;
  for (const rKey of Object.keys(planet.mines)) {
    if (planet.mines[rKey as ResourceType].some(m => m.isUpgrading)) {
      isMineUpgrading = true;
      break;
    }
  }

  const isAlreadyUpgrading = isBuildingUpgrading || isMineUpgrading;
  const shouldQueue = reqQueue && isAlreadyUpgrading;

  if (isAlreadyUpgrading && !reqQueue) {
    return res.status(400).json({ 
      error: "Another construction project or extractor upgrade is already actively in progress on this planet. Only one upgrade at a time is permitted!",
      canQueue: true 
    });
  }

  if (shouldQueue) {
    if (!planet.upgradeQueue) {
      planet.upgradeQueue = [];
    }
    if (planet.upgradeQueue.length >= 25) {
      return res.status(400).json({ error: "Upgrade queue is full (max 25 queued upgrades allowed)!" });
    }
    if ((p.credits || 0) < 15) {
      return res.status(400).json({ error: "Insufficient Space Gold credits available! Queuing an upgrade costs 15 Space Gold." });
    }
  }

  // Calculate targetLevel based on active + queue count for this specific building
  let queuedCount = 0;
  if (building.isUpgrading) queuedCount++;
  if (planet.upgradeQueue) {
    queuedCount += planet.upgradeQueue.filter(q => q.type === 'building' && q.key === buildingKey).length;
  }
  const targetLevel = building.level + queuedCount + 1;

  if (targetLevel > building.maxLevel) return res.status(400).json({ error: `Building reaches max level (${building.maxLevel})` });
  if (building.health !== undefined && building.health < 100) return res.status(400).json({ error: "Building is damaged. Restore it to 100% health first before upgrading." });

  // Verify resources
  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = getUpgradeResourceCost('building', buildingKey, targetLevel, k);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to upgrade ${buildingKey} to level ${targetLevel}.` });
    }
  }

  // Deduct
  keys.forEach(k => {
    const cost = getUpgradeResourceCost('building', buildingKey, targetLevel, k);
    planet.resources[k] -= cost;
  });

  if (shouldQueue) {
    // Deduct Space Gold (credits) - FREE for test phase
    // p.credits = (p.credits || 0) - 15;
    planet.upgradeQueue!.push({
      type: 'building',
      key: buildingKey,
      targetLevel: targetLevel
    });

    saveState();
    return res.json({ player: p, success: true, queued: true });
  } else {
    // Start active immediately
    const durationMs = targetLevel * 120 * 1000; // 2 minutes per level
    building.isUpgrading = true;
    building.upgradeEnd = Date.now() + durationMs;

    saveState();
    return res.json({ player: p, success: true });
  }
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

// Restore Mine (damaged by bomber tanks)
app.post("/api/restore/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, resType, mineIndex } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const mines = planet.mines[resType as ResourceType];
  if (!mines || !mines[mineIndex]) return res.status(404).json({ error: "Mine not found" });

  const mine = mines[mineIndex];
  const currentHealth = mine.health !== undefined ? mine.health : 100;
  if (currentHealth >= 100) return res.status(400).json({ error: "Extractor is already at 100% health" });

  const targetLevel = mine.level + 1;
  const fractionLost = (100 - currentHealth) / 100;

  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
  // Check
  for (const k of keys) {
    const fullCost = getUpgradeResourceCost('mine', resType, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to restore extractor.` });
    }
  }

  // Deduct
  keys.forEach(k => {
    const fullCost = getUpgradeResourceCost('mine', resType, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    planet.resources[k] -= cost;
  });

  mine.health = 100;
  saveState();
  res.json({ player: p, success: true });
});

// Restore Building (damaged by bomber tanks)
app.post("/api/restore/building", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, buildingKey } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const building = planet.buildings[buildingKey as keyof typeof planet.buildings] as BuildingState;
  if (!building) return res.status(404).json({ error: "Building not found" });

  const currentHealth = building.health !== undefined ? building.health : 100;
  if (currentHealth >= 100) return res.status(400).json({ error: "Building is already at 100% health" });

  const targetLevel = building.level + 1;
  const fractionLost = (100 - currentHealth) / 100;

  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];
  // Check
  for (const k of keys) {
    const fullCost = getUpgradeResourceCost('building', buildingKey, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to restore ${buildingKey}.` });
    }
  }

  // Deduct
  keys.forEach(k => {
    const fullCost = getUpgradeResourceCost('building', buildingKey, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    planet.resources[k] -= cost;
  });

  building.health = 100;
  saveState();
  res.json({ player: p, success: true });
});

// Train troops
app.post("/api/train/troop", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, troopId, quantity, manufacturingSpeedLevel } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  const specs = TROOP_SPECS[troopId as keyof typeof TROOP_SPECS];
  if (!specs) return res.status(404).json({ error: "Troop spec not found" });

  const count = parseInt(quantity, 10);
  if (isNaN(count) || count <= 0) return res.status(400).json({ error: "Invalid quantity" });

  // Enforce War Room level limits
  const armyBaseLevel = planet.buildings.armyBase?.level || 0;
  const troopLevelLocks: Record<string, number> = {
    defender: 3,       // Interceptor
    drone: 6,          // Missile Launcher
    attacker: 10,      // Assault Drone
    looter: 15,        // Matter Extractor
    tank: 19,          // Disrupter
    settlementShip: 1  // Settlement Ship
  };
  const requiredLevel = troopLevelLocks[troopId];
  if (requiredLevel !== undefined && armyBaseLevel < requiredLevel) {
    return res.status(400).json({ error: `Requires War Room Level ${requiredLevel} (Your Level: ${armyBaseLevel}) to produce ${specs.name}!` });
  }

  // If training a Settlement Ship, enforce "you can only have one on each base" and "this base's war room must be level 1"
  if (troopId === "settlementShip") {
    const allWarRoomsReached22 = p.planets.every(pl => (pl.buildings.armyBase?.level || 0) >= 22);
    if (!allWarRoomsReached22) {
      return res.status(400).json({ error: "To queue/train a Settlement Ship, ALL of your War Rooms (Army Bases) must be upgraded to Level 22 or higher!" });
    }

    const hasActiveBaseLevel1 = (planet.buildings.armyBase?.level || 0) >= 1;
    if (!hasActiveBaseLevel1) {
      return res.status(400).json({ error: "To build a Settlement Ship, this base's War Room (Army Base) must be upgraded to Level 1!" });
    }

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
    attacker: { water: 300, plasma: 450, fuel: 450, food: 300, respirant: 0 },
    tank: { water: 0, plasma: 800, fuel: 1200, food: 0, respirant: 400 },
    looter: { water: 500, plasma: 0, fuel: 200, food: 400, respirant: 0 },
    drone: { water: 1000, plasma: 1000, fuel: 1500, food: 0, respirant: 500 },
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

  // Base times are aligned with processing times to ensure duration matches tick completions exactly
  const baseTimes = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
  const baseSecs = baseTimes[troopId as keyof typeof baseTimes] * count;
  
  // researchCenter decreases training speed by up to 70% when lvl 20 (baseTime becomes 30%)
  const rcLevel = planet.buildings.researchCenter.level;
  const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
  let buildDurationMs = Math.round(baseSecs * (1 - reductionFrac) * 1000);

  // Manufacturing speed upgrade decreases training speed by up to an additional 35% when lvl 20
  const mfgLvl = parseInt(String(manufacturingSpeedLevel || 10), 10) || 10;
  const mfgReduction = Math.min(0.35, 0.35 * (mfgLvl / 20));
  buildDurationMs = Math.round(buildDurationMs * (1 - mfgReduction));

  // If there's an existing item for this troopId, combine them; otherwise start training immediately in parallel
  const existingIndex = planet.trainingQueue.findIndex(item => item.troopId === troopId);
  if (existingIndex !== -1) {
    const existingItem = planet.trainingQueue[existingIndex];
    existingItem.count += count;
    existingItem.completedAt += buildDurationMs;
  } else {
    const startTimestamp = Date.now();
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

  // Self-heal and ensure habitable planets list is fully populated at runtime
  ensureMinimumHabitablePlanets();
  saveState();

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

  const hasSettlementShip = p.planets.some(pl => (pl.troops?.settlementShip || 0) > 0) ||
                            state.fleets.some(f => f.senderId === p.id && (f.troops?.settlementShip || 0) > 0);

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

  const maxScanDist = scanRadius * 10;
  
  // Separate habitable targets and non-habitable targets
  const habTargets = allTargets.filter(t => t.isHabitable);
  const otherTargets = allTargets.filter(t => !t.isHabitable);

  // Filter non-habitable targets by range, keeping a fallback if empty
  const visibleOthers = otherTargets.filter(t => t.dist <= maxScanDist);

  // Always show all uncolonized habitable planets in the universe to make them visible and discoverable from the start
  const visibleHabs = habTargets;

  // Combine and sort by distance
  let targets = [...visibleOthers, ...visibleHabs];
  targets.sort((a, b) => a.dist - b.dist);
  
  if (targets.length < 5) {
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

  // Deduct 50 Space Gold - FREE for test phase
  // p.credits = Math.max(0, (p.credits || 0) - 50);

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

  const hasSettlementShip = p.planets.some(pl => (pl.troops?.settlementShip || 0) > 0) ||
                            state.fleets.some(f => f.senderId === p.id && (f.troops?.settlementShip || 0) > 0);

  let report: any = null;
  const now = Date.now();
  const reportId = `battle_intel_${Math.random().toString(36).substr(2, 9)}`;
  const isHab = state.habitablePlanets?.find(hp => hp.coords.x === xVal && hp.coords.y === yVal) || null;

  if (targetPlanet && targetUser) {
    // Occupied Planet Report
    report = {
      type: "occupied",
      planetName: targetPlanet.name,
      commander: targetUser.username,
      commanderId: targetUser.id,
      faction: targetUser.faction,
      coords: { x: xVal, y: yVal },
      scores: targetUser.scores,
      buildings: {
        commsHub: targetPlanet.buildings.commsHub?.level || 1,
        radar: targetPlanet.buildings.radar?.level || 1,
        repository: targetPlanet.buildings.repository?.level || 1,
        researchCenter: targetPlanet.buildings.researchCenter?.level || 1,
        armyBase: targetPlanet.buildings.armyBase?.level || 1,
        supplyNexus: targetPlanet.buildings.supplyNexus?.level || 1
      },
      mines: {
        water: targetPlanet.mines?.water?.map((m: any) => m.level) || [],
        plasma: targetPlanet.mines?.plasma?.map((m: any) => m.level) || [],
        fuel: targetPlanet.mines?.fuel?.map((m: any) => m.level) || [],
        food: targetPlanet.mines?.food?.map((m: any) => m.level) || [],
        respirant: targetPlanet.mines?.respirant?.map((m: any) => m.level) || []
      },
      troops: targetPlanet.troops,
      resources: targetPlanet.resources,
      lastActive: targetUser.lastActive || now - 600000
    };
  } else {
    // Check if habitable uncharted sector
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

  // Create corresponding persistent BattleReport so it's listed under the Intel tab
  const persistentReport: any = {
    id: reportId,
    timestamp: now,
    attackerId: p.id,
    attackerName: p.username,
    defenderId: targetUser ? targetUser.id : "unknown",
    defenderName: targetPlanet ? targetPlanet.name : (isHab ? isHab.name : "Deep Space Void"),
    defenderLastActive: targetUser ? targetUser.lastActive : undefined,
    isRecon: true,
    attackerCoords: p.planets[0] ? { x: p.planets[0].sectorX, y: p.planets[0].sectorY } : { x: 0, y: 0 },
    defenderCoords: { x: xVal, y: yVal },
    attackerInitialTroops: { drone: 1 },
    attackerLosses: { drone: 0 },
    defenderInitialTroops: targetPlanet ? { ...targetPlanet.troops } : { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 },
    defenderLosses: { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 },
    winner: "attacker",
    resourcesStolen: { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 },
    attackHpKilled: 0,
    defenceHpKilled: 0,
    buildings: targetPlanet ? {
      commsHub: targetPlanet.buildings.commsHub?.level || 1,
      radar: targetPlanet.buildings.radar?.level || 1,
      repository: targetPlanet.buildings.repository?.level || 1,
      researchCenter: targetPlanet.buildings.researchCenter?.level || 1,
      armyBase: targetPlanet.buildings.armyBase?.level || 1,
      supplyNexus: targetPlanet.buildings.supplyNexus?.level || 1
    } : undefined,
    mines: targetPlanet ? {
      water: targetPlanet.mines?.water?.map((m: any) => m.level) || [],
      plasma: targetPlanet.mines?.plasma?.map((m: any) => m.level) || [],
      fuel: targetPlanet.mines?.fuel?.map((m: any) => m.level) || [],
      food: targetPlanet.mines?.food?.map((m: any) => m.level) || [],
      respirant: targetPlanet.mines?.respirant?.map((m: any) => m.level) || []
    } : undefined,
    resources: targetPlanet ? targetPlanet.resources : undefined,
    battleRounds: [
      {
        round: 1,
        logs: targetPlanet 
          ? [
              "--- COORDINATE TELEMETRY DECRYPTION ---",
              `Sector [${xVal}, ${yVal}] analyzed successfully.`,
              `Detected station commander: ${targetUser.username}`,
              `Industrial building scans completed.`,
              `Combat garrison scanned successfully.`
            ]
          : [
              "--- COORDINATE TELEMETRY DECRYPTION ---",
              `Sector [${xVal}, ${yVal}] scanned.`,
              isHab ? "Habitable uncharted sector coordinates analyzed." : "Deep space coordinates analyzed."
            ],
        attackerRemaining: { drone: 1 },
        defenderRemaining: targetPlanet ? { ...targetPlanet.troops } : { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 }
      }
    ]
  };

  state.battleReports.unshift(persistentReport);

  saveState();
  res.json({ player: p, report, success: true });
});

// Send Fleet Mission
app.post("/api/fleet/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, missionType, troops, targetId, targetName, targetBuilding, createdFleetId } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  
  if (isNaN(targetX) || isNaN(targetY)) {
    return res.status(400).json({ error: "Invalid target coordinates. Directives must specify a numeric zone on the coordinate grid." });
  }

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

  if (missionType === "move") {
    // Validate target coordinates are owned by the sender or an alliance member
    const destPlanet = p.planets.find(pl => pl.sectorX === targetX && pl.sectorY === targetY);
    if (!destPlanet) {
      let isAllianceMemberPlanet = false;
      if (p.allianceId) {
        for (const playerObj of Object.values(state.players)) {
          if (playerObj.allianceId === p.allianceId) {
            const memberPlanet = playerObj.planets.find(pl => pl.sectorX === targetX && pl.sectorY === targetY);
            if (memberPlanet) {
              isAllianceMemberPlanet = true;
              break;
            }
          }
        }
      }
      
      if (!isAllianceMemberPlanet) {
        return res.status(400).json({ error: "Move relocation directives are only authorized to target your own colonized planets and moonbases or an Alliance member's coordinates!" });
      }
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

  const speedLvl = typeof req.body.troopSpeedLevel === "number" ? req.body.troopSpeedLevel : 1;
  const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
  const speedMultiplier = 1.0 + boostPct;

  const slowestTroopSpeed = (Object.entries(troopSend)
    .filter(([_, qty]) => qty > 0)
    .reduce((slowest, [tId, _]) => {
      const sp = TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.speed || 5;
      return sp < slowest ? sp : slowest;
    }, 100)) * speedMultiplier;

  const travelTimeMs = Math.round((dist / slowestTroopSpeed) * 60000);

  let resolvedTargetId = targetId || null;
  let resolvedTargetName = targetName || `Sector [${targetX}, ${targetY}]`;

  // Dynamically resolve target coordinates if targetId is missing/omitted
  if (!resolvedTargetId) {
    for (const playerObj of Object.values(state.players)) {
      const pl = playerObj.planets.find(p => p.sectorX === targetX && p.sectorY === targetY);
      if (pl) {
        resolvedTargetId = playerObj.id;
        resolvedTargetName = pl.name || `${playerObj.username}'s Station`;
        break;
      }
    }
  }

  // Also check if matches any habitable zone uncolonized
  if (!resolvedTargetId && state.habitablePlanets) {
    const hp = state.habitablePlanets.find(item => item.coords.x === targetX && item.coords.y === targetY);
    if (hp) {
      resolvedTargetId = "habitable";
      resolvedTargetName = hp.name;
    }
  }

  const mission: FleetMission = {
    id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
    senderId: p.id,
    senderName: p.username,
    senderCoords: { x: planet.sectorX, y: planet.sectorY },
    targetId: resolvedTargetId,
    targetName: resolvedTargetName,
    targetCoords: { x: targetX, y: targetY },
    missionType: missionType as "attack" | "recon" | "colonize" | "move",
    troops: troopSend,
    startedAt: now,
    arrivesAt: now + travelTimeMs,
    isReturning: false,
    isWaitingToSettle: false,
    targetBuilding: targetBuilding || undefined,
    troopSpeedLevel: speedLvl,
    createdFleetId: createdFleetId || undefined
  };

  state.fleets.push(mission);
  saveState();

  res.json({ player: p, success: true, fleets: state.fleets });
});

// Adjust troops for local/reserve fleets creation/disbanding
app.post("/api/troops/adjust", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, troopChanges } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });

  if (!troopChanges || typeof troopChanges !== "object") {
    return res.status(400).json({ error: "Invalid troop changes payload" });
  }

  // Validate that the changes do not result in negative troops
  for (const [tId, change] of Object.entries(troopChanges)) {
    const changeVal = parseInt(String(change), 10) || 0;
    const current = planet.troops[tId as keyof typeof planet.troops] || 0;
    if (current + changeVal < 0) {
      return res.status(400).json({ error: `Not enough ${tId} on the station to fulfill this adjustment!` });
    }
  }

  // Apply changes
  for (const [tId, change] of Object.entries(troopChanges)) {
    const changeVal = parseInt(String(change), 10) || 0;
    planet.troops[tId as keyof typeof planet.troops] = (planet.troops[tId as keyof typeof planet.troops] || 0) + changeVal;
  }

  saveState();
  res.json({ player: p, success: true });
});

// Settle coordinates once fleet arrives
app.post("/api/fleet/settle", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { fleetId, customName } = req.body;
  if (!customName || typeof customName !== 'string' || !customName.trim()) {
    return res.status(400).json({ error: "A custom colony/station name is required!" });
  }

  const planetName = customName.trim();
  if (planetName.length > 30) {
    return res.status(400).json({ error: "Colony station designation cannot exceed 30 characters" });
  }

  const fleetIndex = state.fleets.findIndex(f => f.id === fleetId && f.senderId === p.id);
  if (fleetIndex === -1) {
    return res.status(404).json({ error: "Fleet troops not found or not owned by you!" });
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

  ensureMinimumHabitablePlanets();
  saveState();
  return res.json({ player: p, success: true, fleets: state.fleets });
});


// Reroute active fleet to a different station or attack coordinate
app.post("/api/fleet/reroute", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { fleetId, missionType } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);

  if (isNaN(targetX) || isNaN(targetY) || targetX < 0 || targetX > 100 || targetY < 0 || targetY > 100) {
    return res.status(400).json({ error: "Invalid target grid coordinates (0-100 allowed)" });
  }

  const fleet = state.fleets.find(f => f.id === fleetId && f.senderId === p.id);
  if (!fleet) {
    return res.status(404).json({ error: "Active mission fleet not found or not owned by you" });
  }

  // Find target details
  let targetId: string | null = null;
  let targetName = `Sector [${targetX}, ${targetY}]`;

  // Check if target coordinates match a player's planet/station
  let foundTarget = false;
  for (const playerObj of Object.values(state.players)) {
    const pl = playerObj.planets.find(item => item.sectorX === targetX && item.sectorY === targetY);
    if (pl) {
      targetId = playerObj.id;
      targetName = pl.name || `${playerObj.username}'s Station`;
      foundTarget = true;
      break;
    }
  }

  if (!foundTarget && state.habitablePlanets) {
    const hp = state.habitablePlanets.find(item => item.coords.x === targetX && item.coords.y === targetY);
    if (hp) {
      targetName = hp.name || `Habitable Sector [${targetX}, ${targetY}]`;
    }
  }

  // Calculate coordinates distance
  const dx = targetX - fleet.senderCoords.x;
  const dy = targetY - fleet.senderCoords.y;
  const dist = Math.hypot(dx, dy);

  const speedLvl = fleet.troopSpeedLevel || 1;
  const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
  const speedMultiplier = 1.0 + boostPct;

  const slowestTroopSpeed = (Object.entries(fleet.troops)
    .filter(([_, qty]) => (qty as number) > 0)
    .reduce((slowest, [tId, _]) => {
      const sp = TROOP_SPECS[tId as keyof typeof TROOP_SPECS]?.speed || 5;
      return sp < slowest ? sp : slowest;
    }, 100)) * speedMultiplier;

  const travelTimeMs = Math.round((dist / slowestTroopSpeed) * 60000);
  const now = Date.now();

  // Update fleet state
  fleet.targetId = targetId;
  fleet.targetName = targetName;
  fleet.targetCoords = { x: targetX, y: targetY };
  fleet.isReturning = false;
  fleet.isWaitingToSettle = false;
  
  // Set logical mission type
  if (missionType) {
    fleet.missionType = missionType as any;
  } else {
    // Determine based on troops
    if (fleet.troops.settlementShip > 0) {
      fleet.missionType = "colonize";
    } else if (fleet.troops.drone > 0 && Object.entries(fleet.troops).filter(([tId, q]) => tId !== 'drone' && (q as number) > 0).length === 0) {
      fleet.missionType = "recon";
    } else {
      fleet.missionType = "attack";
    }
  }

  fleet.startedAt = now;
  fleet.arrivesAt = now + travelTimeMs;

  saveState();
  res.json({ player: p, success: true, fleets: state.fleets });
});

// Rename Commander / Player Profile Username
app.post("/api/player/rename", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { newUsername } = req.body;
  if (!newUsername || !newUsername.trim()) {
    return res.status(400).json({ error: "Commander name is required" });
  }

  const desiredName = newUsername.trim();
  if (desiredName.length > 25) {
    return res.status(400).json({ error: "Commander name must be 25 characters or less" });
  }

  // Check if someone else already has this username
  const exists = Object.values(state.players).some(
    player => player.id !== p.id && player.username.toLowerCase() === desiredName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "That commander name is already registered in the database!" });
  }

  // Update name in player profile state
  p.username = desiredName;
  state.players[p.id].username = desiredName;

  // Sync alliance members and chat sender records dynamically
  if (p.allianceId && state.alliances[p.allianceId]) {
    const alliance = state.alliances[p.allianceId];
    const member = alliance.members.find(m => m.playerId === p.id);
    if (member) member.username = desiredName;
    if (alliance.leaderId === p.id) alliance.leaderName = desiredName;
  }

  saveState();
  res.json({ player: p, success: true });
});

// Rename Space Colony Base/Station
app.post("/api/planet/rename", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId, newName } = req.body;
  if (!planetId || !newName || !newName.trim()) {
    return res.status(400).json({ error: "Base name is required" });
  }

  const targetName = newName.trim();
  if (targetName.length > 30) {
    return res.status(400).json({ error: "Colony base name must be 30 characters or less" });
  }

  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) {
    return res.status(404).json({ error: "Base planet colony not found" });
  }

  planet.name = targetName;
  saveState();
  res.json({ player: p, success: true });
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

  const maxCommsHubLvl = Math.max(...p.planets.map(pl => pl.buildings.commsHub?.level || 0));
  if (maxCommsHubLvl < 5) {
    return res.status(400).json({ error: "Creating an Alliance requires Communications Hub Level 5 or higher." });
  }

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
    content: `${p.username} has launched a new military Alliance: [${tag.toUpperCase()}] ${name.toUpperCase()}!`,
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

  const maxCommsHubLvl = Math.max(...p.planets.map(pl => pl.buildings.commsHub?.level || 0));
  if (maxCommsHubLvl < 4) {
    return res.status(400).json({ error: "Joining an Alliance requires Communications Hub Level 4 or higher." });
  }

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

// Alliance applying
app.post("/api/alliance/apply", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (p.allianceId) return res.status(400).json({ error: "Already registered in an Alliance." });

  const maxCommsHubLvl = Math.max(...p.planets.map(pl => pl.buildings.commsHub?.level || 0));
  if (maxCommsHubLvl < 4) {
    return res.status(400).json({ error: "Applying to an Alliance requires Communications Hub Level 4 or higher." });
  }

  const { allianceId } = req.body;
  const alliance = state.alliances[allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  if (!alliance.applications) {
    alliance.applications = [];
  }

  // Check if already applied
  const alreadyApplied = alliance.applications.some(app => app.playerId === p.id);
  if (alreadyApplied) {
    return res.status(400).json({ error: "Pending application already exists for this alliance." });
  }

  alliance.applications.push({
    playerId: p.id,
    username: p.username,
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: p, success: true, alliance });
});

// Alliance approve
app.post("/api/alliance/approve", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance." });
  if (p.allianceRole !== "leader" && p.allianceRole !== "officer") {
    return res.status(403).json({ error: "Only the Alliance Founder (leader) or Officer can approve application requests." });
  }

  const { targetPlayerId } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  if (!alliance.applications) {
    alliance.applications = [];
  }

  const appIndex = alliance.applications.findIndex(app => app.playerId === targetPlayerId);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Application request not found." });
  }

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer) {
    alliance.applications.splice(appIndex, 1);
    saveState();
    return res.status(404).json({ error: "Target player profile not found." });
  }

  if (targetPlayer.allianceId) {
    alliance.applications.splice(appIndex, 1);
    saveState();
    return res.status(400).json({ error: "Player has already joined another alliance." });
  }

  // Approve!
  alliance.members.push({
    playerId: targetPlayer.id,
    username: targetPlayer.username,
    role: "member"
  });

  targetPlayer.allianceId = alliance.id;
  targetPlayer.allianceRole = "member";

  // Remove application
  alliance.applications.splice(appIndex, 1);

  // System news alert
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Application Approved",
    content: `${targetPlayer.username}'s application was approved to join ${alliance.name} [${alliance.tag}]!`,
    type: "system",
    timestamp: Date.now()
  });

  saveState();
  res.json({ player: p, success: true, alliance });
});

// Alliance decline
app.post("/api/alliance/decline", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance." });
  if (p.allianceRole !== "leader" && p.allianceRole !== "officer") {
    return res.status(403).json({ error: "Only the Alliance Founder or Officer can decline requests." });
  }

  const { targetPlayerId } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  if (!alliance.applications) {
    alliance.applications = [];
  }

  const appIndex = alliance.applications.findIndex(app => app.playerId === targetPlayerId);
  if (appIndex !== -1) {
    alliance.applications.splice(appIndex, 1);
  }

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

const getRankValue = (role: string | null | undefined): number => {
  if (role === 'recruit') return 0;
  if (role === 'member') return 1;
  if (role === 'officer') return 2;
  if (role === 'commander' || role === 'leader') return 3;
  return 1;
};

// Alliance member promotion
app.post("/api/alliance/promote", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });

  const { targetPlayerId } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer || targetPlayer.allianceId !== p.allianceId) {
    return res.status(400).json({ error: "Target player is not inside your alliance roster" });
  }

  const callerRank = getRankValue(p.allianceRole);
  const targetRank = getRankValue(targetPlayer.allianceRole);

  if (callerRank < 2 || callerRank <= targetRank) {
    return res.status(403).json({ error: "Insufficient rank clearance level to promote this member." });
  }

  let nextRole: "recruit" | "member" | "officer" | "commander" | "leader" = "member";
  if (targetRank === 0) {
    nextRole = "member";
  } else if (targetRank === 1) {
    nextRole = "officer";
  } else if (targetRank === 2 && callerRank === 3) {
    // Leadership transfer
    nextRole = "commander";
    
    // Demote current leader/commander to officer
    p.allianceRole = "officer";
    const callerMember = alliance.members.find(m => m.playerId === p.id);
    if (callerMember) callerMember.role = "officer";
    
    alliance.leaderId = targetPlayer.id;
    alliance.leaderName = targetPlayer.username;
  } else {
    return res.status(400).json({ error: "Target cannot be promoted further." });
  }

  targetPlayer.allianceRole = nextRole;
  const targetMember = alliance.members.find(m => m.playerId === targetPlayerId);
  if (targetMember) targetMember.role = nextRole;

  saveState();
  res.json({ success: true, player: p });
});

// Alliance member demotion
app.post("/api/alliance/demote", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });

  const { targetPlayerId } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer || targetPlayer.allianceId !== p.allianceId) {
    return res.status(400).json({ error: "Target player is not inside your alliance roster" });
  }

  const callerRank = getRankValue(p.allianceRole);
  const targetRank = getRankValue(targetPlayer.allianceRole);

  if (callerRank < 2 || callerRank <= targetRank) {
    return res.status(403).json({ error: "Insufficient rank clearance level to demote this member." });
  }

  if (targetRank === 0) {
    return res.status(400).json({ error: "Target cannot be demoted further than Recruit" });
  }

  let nextRole: "recruit" | "member" | "officer" | "commander" | "leader" = "recruit";
  if (targetRank === 2) {
    nextRole = "member";
  } else if (targetRank === 1) {
    nextRole = "recruit";
  }

  targetPlayer.allianceRole = nextRole;
  const targetMember = alliance.members.find(m => m.playerId === targetPlayerId);
  if (targetMember) targetMember.role = nextRole;

  saveState();
  res.json({ success: true, player: p });
});

// Dismiss member from alliance
app.post("/api/alliance/kick", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });

  const { targetPlayerId } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer || targetPlayer.allianceId !== p.allianceId) {
    return res.status(400).json({ error: "Target player is not inside your alliance roster" });
  }

  const callerRank = getRankValue(p.allianceRole);
  const targetRank = getRankValue(targetPlayer.allianceRole);

  if (callerRank < 2 || callerRank <= targetRank) {
    return res.status(403).json({ error: "Insufficient rank clearance level to dismiss this member." });
  }

  // Remove target player from the alliance
  targetPlayer.allianceId = null;
  targetPlayer.allianceRole = null;
  alliance.members = alliance.members.filter(m => m.playerId !== targetPlayerId);

  saveState();
  res.json({ success: true, player: p });
});

// Update alliance highlights notes
app.post("/api/alliance/highlights", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });

  const { highlights } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  // Update notes
  alliance.highlights = highlights;
  saveState();
  res.json({ success: true, alliance });
});

// Get comprehensive alliance member reports (troops, planet-by-planet, last activity status)
app.get("/api/alliance/member-reports", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });

  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });

  const reports = alliance.members.map(mbr => {
    const pl = state.players[mbr.playerId];
    if (!pl) {
      return {
        playerId: mbr.playerId,
        username: mbr.username,
        role: mbr.role,
        lastActive: Date.now() - 3600000,
        scores: { population: 0, attack: 0, defence: 0, raiders: 0 },
        planets: []
      };
    }

    return {
      playerId: pl.id,
      username: pl.username,
      role: mbr.role,
      lastActive: pl.lastActive || Date.now() - 600000,
      scores: pl.scores || { population: 0, attack: 0, defence: 0, raiders: 0 },
      achievements: pl.achievements || [],
      planets: pl.planets.map(planet => ({
        id: planet.id,
        name: planet.name,
        sectorX: planet.sectorX,
        sectorY: planet.sectorY,
        troops: planet.troops || { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 },
        resources: planet.resources || { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 }
      }))
    };
  });

  res.json({ success: true, members: reports });
});

// Quantum target send resources
app.post("/api/resources/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { targetId, resources, sourcePlanetId } = req.body;
  const targetX = parseInt(req.body.targetX, 10);
  const targetY = parseInt(req.body.targetY, 10);

  const senderPlanet = p.planets.find(pl => pl.id === sourcePlanetId) || p.planets[0];
  if (!senderPlanet) {
    return res.status(400).json({ error: "Sender starbase planet configuration mismatch." });
  }

  let targetPlanet: any = null;
  let targetPlayer: any = null;

  if (targetId) {
    for (const player of Object.values(state.players)) {
      const pl = player.planets.find(item => item.id === targetId || player.id === targetId);
      if (pl) {
        targetPlanet = pl;
        targetPlayer = player;
        break;
      }
    }
  } else if (!isNaN(targetX) && !isNaN(targetY)) {
    for (const player of Object.values(state.players)) {
      const pl = player.planets.find(item => item.sectorX === targetX && item.sectorY === targetY);
      if (pl) {
        targetPlanet = pl;
        targetPlayer = player;
        break;
      }
    }
  }

  if (!targetPlanet || !targetPlayer) {
    return res.status(404).json({ error: "Recipient coordinates or target Space Station not detected! Double check coordinates scanner." });
  }

  if (senderPlanet.id === targetPlanet.id) {
    return res.status(400).json({ error: "You cannot transmit resources to the same space station!" });
  }

  // Validate quantities
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  let hasItems = false;
  for (const k of keys) {
    const qty = Math.max(0, parseInt(resources[k], 10) || 0);
    if (qty > 0) {
      if ((senderPlanet.resources[k as ResourceType] || 0) < qty) {
        return res.status(400).json({ error: `Not enough ${k} on your active planetary reserves.` });
      }
      hasItems = true;
    }
  }

  if (!hasItems) {
    return res.status(400).json({ error: "You must specify at least one resource quantity to transmit." });
  }

  // Subtract & Add
  keys.forEach(k => {
    const qty = Math.max(0, parseInt(resources[k], 10) || 0);
    if (qty > 0) {
      senderPlanet.resources[k as ResourceType] -= qty;
      targetPlanet.resources[k as ResourceType] = (targetPlanet.resources[k as ResourceType] || 0) + qty;
    }
  });

  // Log global news alert of trade portal activation
  state.newsEvents.push({
    id: `news_trade_${Date.now()}`,
    title: "Quantum Trade Portal Activated!",
    content: `Commander ${p.username} successfully transmitted resources from ${senderPlanet.name} to ${targetPlayer.username}'s ${targetPlanet.name}!`,
    type: "system",
    timestamp: Date.now()
  });

  saveState();
  res.json({ success: true, player: p });
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

// Claim Academy Task Rewards
app.post("/api/tutorial/claim", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { taskId, planetId, allowOverflow } = req.body;
  if (taskId === undefined || !planetId) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const planet = p.planets.find(pl => pl.id === planetId) || p.planets[0];
  if (!planet) {
    return res.status(404).json({ error: "Colony planet not found" });
  }

  const rewards: Record<number, { water: number; plasma: number; fuel: number; food: number; respirant: number; credits: number }> = {
    1: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 15000 },  // Colonize 2nd planet
    2: { water: 10280, plasma: 10180, fuel: 10180, food: 10180, respirant: 10180, credits: 3000 },   // Rename Outpost
    3: { water: 10180, plasma: 10180, fuel: 10180, food: 10180, respirant: 10280, credits: 5000 },   // Hydrothermal pump Lvl 2
    4: { water: 10180, plasma: 10180, fuel: 10180, food: 10280, respirant: 10180, credits: 4000 },   // Air Scrubber Lvl 2
    5: { water: 10180, plasma: 10280, fuel: 10180, food: 10180, respirant: 10180, credits: 4000 },   // Food bio-synth Lvl 2
    6: { water: 10150, plasma: 10000, fuel: 10000, food: 10200, respirant: 10100, credits: 4000 },   // Plasma refinery Lvl 2
    7: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5000 },   // Comms Hub Activation
    8: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 6000 },   // Expand Repository
    9: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5000 },   // Send Resources
    10: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5000 },  // Recon fleet
    11: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 7500 },  // Attack Fleet
    12: { water: 10291, plasma: 10302, fuel: 10302, food: 10302, respirant: 10302, credits: 5000 },  // Production boost
    13: { water: 11000, plasma: 11000, fuel: 11000, food: 11000, respirant: 11000, credits: 6000 },  // Dual boost overdrive
    14: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151, credits: 6000 },  // Fabricator Lvl 2
    15: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5005 },  // Radar Array Lvl 1
    16: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151, credits: 4000 },  // Sector scan
    17: { water: 13000, plasma: 14000, fuel: 15000, food: 12000, respirant: 12000, credits: 8000 },  // Research Center Lvl 1
    18: { water: 12000, plasma: 12000, fuel: 12000, food: 12000, respirant: 12000, credits: 6000 },  // Metallurgy level 2
    19: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151, credits: 5000 },  // Scientific tech research
    20: { water: 12250, plasma: 10000, fuel: 10000, food: 13000, respirant: 11500, credits: 6000 },  // War room level 1
    21: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5000 },  // Train 15 troops
    22: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5000 },  // 5 Interceptors
    23: { water: 12000, plasma: 12000, fuel: 12000, food: 12000, respirant: 12000, credits: 6000 },  // 2 Bombers
    24: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 3000 },  // Private text PM
    25: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 5000 },  // Nexus claim
    26: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 7000 },  // Star Alliance
    27: { water: 13000, plasma: 14000, fuel: 15000, food: 12000, respirant: 12000, credits: 3000 },  // Chat broadcast
    28: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 8000 },  // Warp thruster research
    29: { water: 11500, plasma: 11000, fuel: 12000, food: 11500, respirant: 11000, credits: 4000 },  // Leaderboard payroll audit
    30: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000, credits: 30000 }, // Settle 3rd Planet outpost!
  };

  let idNum = parseInt(taskId);
  if (isNaN(idNum) || !rewards[idNum]) {
    const digits = String(taskId).match(/\d+/);
    if (digits) {
      idNum = parseInt(digits[0], 10);
    }
  }

  // Fallback to first incomplete task to guarantee claimability and prevent invalid ID blockers
  if (isNaN(idNum) || !rewards[idNum]) {
    const completed = p.completedTutorialTasks || [];
    for (let i = 1; i <= 30; i++) {
      if (!completed.includes(i)) {
        idNum = i;
        break;
      }
    }
  }

  const reward = rewards[idNum];
  if (!reward) {
    return res.status(400).json({ error: "Invalid tutorial task ID" });
  }

  if (!p.completedTutorialTasks) {
    p.completedTutorialTasks = [];
  }

  if (p.completedTutorialTasks.includes(idNum)) {
    return res.status(400).json({ error: "Reward for this task has already been claimed." });
  }

  // Add resources (with optional overflow bypass)
  const repositoryLvl = planet.buildings.repository ? planet.buildings.repository.level : 1;
  const cap = getRepositoryCapacity(repositoryLvl);

  if (allowOverflow === true) {
    planet.resources.water = planet.resources.water + reward.water;
    planet.resources.plasma = planet.resources.plasma + reward.plasma;
    planet.resources.fuel = planet.resources.fuel + reward.fuel;
    planet.resources.food = planet.resources.food + reward.food;
    planet.resources.respirant = planet.resources.respirant + reward.respirant;
  } else {
    planet.resources.water = Math.min(cap, planet.resources.water + reward.water);
    planet.resources.plasma = Math.min(cap, planet.resources.plasma + reward.plasma);
    planet.resources.fuel = Math.min(cap, planet.resources.fuel + reward.fuel);
    planet.resources.food = Math.min(cap, planet.resources.food + reward.food);
    planet.resources.respirant = Math.min(cap, planet.resources.respirant + reward.respirant);
  }

  // Add credits
  p.credits = (p.credits || 0) + reward.credits;

  // Add to completed list
  p.completedTutorialTasks.push(idNum);

  saveState();

  res.json({
    success: true,
    player: p,
    message: `Academy reward claimed on ${planet.name}! Received custom resource crates and +${reward.credits.toLocaleString()} Speed Credits.`
  });
});

// Claim Supply Nexus Cargo Shipments
app.post("/api/planet/claim-supply-nexus", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { planetId } = req.body;
  const planet = p.planets.find(pl => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Colony planet not found" });

  const supplyNexus = planet.buildings.supplyNexus;
  if (!supplyNexus) {
    return res.status(400).json({ error: "Supply Nexus building has not been commissioned on this planet." });
  }

  const level = supplyNexus.level;
  if (level <= 0) {
    return res.status(400).json({ error: "Supply Nexus level is 0. Upgrade it to level 1+ to dispatch shipments." });
  }

  const now = Date.now();
  const cooldown = 120 * 1000; // 2 minutes cooldown for fast Sandbox testing
  const lastClaim = planet.lastSupplyNexusClaim || 0;

  if (now - lastClaim < cooldown) {
    const remainingSeconds = Math.ceil((cooldown - (now - lastClaim)) / 1000);
    return res.status(400).json({ 
      error: `Quantum Supply Nexus is recharging. Portal stabilization completes in ${remainingSeconds} seconds.` 
    });
  }

  // Calculate resources: sends a total of 5 000 000 resources when maxed (level 50)
  // 5,000,000 total / 5 resource types = 1,000,000 per type at Lvl 50.
  // This means level * 20,000 of each resource type.
  const qtyPerResource = level * 20000;
  const totalVolume = qtyPerResource * 5;

  const storageLimit = getRepositoryCapacity(planet.buildings.repository.level);
  const keys: ResourceType[] = ["water", "plasma", "fuel", "food", "respirant"];

  keys.forEach(k => {
    planet.resources[k] = Math.min(storageLimit, planet.resources[k] + qtyPerResource);
  });

  planet.lastSupplyNexusClaim = now;
  saveState();

  res.json({ 
    player: p, 
    qtyPerResource, 
    totalVolume, 
    success: true 
  });
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

// Send Private Command Message
app.post("/api/messages/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { receiverId, content } = req.body;
  if (!receiverId || !content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Invalid receiver or empty transmission content." });
  }

  const receiver = state.players[receiverId];
  if (!receiver) {
    return res.status(404).json({ error: "Target transmitter station not found." });
  }

  if (!receiver.commandMessages) {
    receiver.commandMessages = [];
  }

  const newMessage: CommandMessage = {
    id: `msg_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    senderId: p.id,
    senderName: p.username,
    senderFaction: p.faction,
    senderFactionColor: p.factionColor,
    receiverId: receiver.id,
    receiverName: receiver.username,
    content: content.trim(),
    timestamp: Date.now(),
    isRead: false,
    isSaved: false
  };

  receiver.commandMessages.push(newMessage);

  // Keep a copy in the sender's outbox list
  if (!p.commandMessages) {
    p.commandMessages = [];
  }
  const sentCopy: CommandMessage = {
    ...newMessage,
    isSent: true,
    isRead: true // Sender has already read their own sent message
  };
  p.commandMessages.push(sentCopy);

  saveState();
  res.json({ success: true, message: "Holographic command transmission dispatched!" });
});

// Toggle Command Message Read/Unread State
app.post("/api/messages/mark-read", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { messageId, isRead } = req.body;
  if (!messageId) return res.status(400).json({ error: "Transmission ID required" });

  if (!p.commandMessages) p.commandMessages = [];
  const msg = p.commandMessages.find(m => m.id === messageId);
  if (msg) {
    msg.isRead = isRead !== undefined ? isRead : true;
    saveState();
  }
  res.json({ success: true, player: p });
});

// Saved Command Message Toggle
app.post("/api/messages/save", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { messageId, isSaved } = req.body;
  if (!messageId) return res.status(400).json({ error: "Transmission ID required" });

  if (!p.commandMessages) p.commandMessages = [];
  const msg = p.commandMessages.find(m => m.id === messageId);
  if (msg) {
    msg.isSaved = isSaved !== undefined ? isSaved : true;
    saveState();
  }
  res.json({ success: true, player: p });
});

// Delete Received Command Message
app.post("/api/messages/delete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });

  const { messageId } = req.body;
  if (!messageId) return res.status(400).json({ error: "Transmission ID required" });

  if (!p.commandMessages) p.commandMessages = [];
  p.commandMessages = p.commandMessages.filter(m => m.id !== messageId);
  saveState();
  res.json({ success: true, player: p });
});

// Submit Suggestion/Feedback
app.post("/api/feedback/send", (req, res) => {
  const p = getLoggedPlayer(req);
  const { content, category } = req.body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Suggestion content cannot be empty." });
  }
  if (!state.feedbacks) {
    state.feedbacks = [];
  }
  const newFeedback = {
    id: `feedback_${Math.random().toString(36).substr(2, 9)}`,
    senderId: p ? p.id : "anonymous",
    senderName: p ? p.username : "Anonymous Commander",
    senderEmail: (p && p.googleEmail) ? p.googleEmail : (p ? "Local Account" : "Anonymous"),
    content: content.trim(),
    category: category || "other",
    timestamp: Date.now()
  };
  state.feedbacks.push(newFeedback);
  saveState();
  res.json({ success: true, message: "Holographic telemetry transmission received by Segment Headquarters." });
});

// View feedback list privately (restricted strictly to banele180@gmail.com)
app.post("/api/feedback/private-list", (req, res) => {
  const p = getLoggedPlayer(req);
  const { adminKey } = req.body;
  
  const isEmailOwner = p && p.googleEmail && p.googleEmail.toLowerCase() === "banele180@gmail.com";
  const isValidPass = adminKey === "991807" || adminKey === "banele-admin-secret" || isEmailOwner;

  if (!isValidPass) {
    return res.status(403).json({ error: "Access Denied. Holographic decryption key incorrect." });
  }

  if (!state.feedbacks) {
    state.feedbacks = [];
  }
  res.json({ success: true, feedbacks: state.feedbacks });
});


// Serve Static Assets & SPA Router
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
