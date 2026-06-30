var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_child_process = require("child_process");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_app = require("firebase-admin/app");
var import_messaging = require("firebase-admin/messaging");

// src/gameUtils.ts
function getUpgradeWeights(type, key) {
  if (type === "mine") {
    const weights = {
      water: 0.9,
      plasma: 0.9,
      fuel: 0.9,
      food: 0.9,
      respirant: 0.9
    };
    if (key in weights) {
      weights[key] = 1.4;
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
function getUpgradeResourceCost(type, key, targetLevel, resKey) {
  const baseCost = type === "mine" ? targetLevel * 100 : targetLevel * 150;
  const weights = getUpgradeWeights(type, key);
  return Math.round(baseCost * weights[resKey]);
}

// server.ts
var app = (0, import_express.default)();
var PORT = process.env.NODE_ENV === "production" ? process.env.PORT ? parseInt(process.env.PORT) : 3e3 : 3e3;
app.use((req, res, next) => {
  const match = req.url.match(/\/api(\/|$)/);
  if (match && match.index !== void 0 && match.index > 0) {
    const rewritten = req.url.substring(match.index);
    console.log(`[ROUTER AUTO-HEAL] Rewriting proxy subpath: ${req.url} -> ${rewritten}`);
    req.url = rewritten;
  }
  next();
});
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Content-Length, Authorization, X-Requested-With, x-user-id, X-User-Id");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, X-User-Id, accept, origin, *");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(import_express.default.json());
var lastRequestTime = {};
app.use("/api", (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const path2 = req.path.toLowerCase();
    if (path2.includes("/login") || path2.includes("/register") || path2.includes("/auth/google") || path2.includes("/notifications/register-token")) {
      return next();
    }
    const userId = req.headers["x-user-id"];
    if (userId) {
      const now = Date.now();
      const key = `${userId}:${path2}`;
      const lastTime = lastRequestTime[key] || 0;
      if (now - lastTime < 150) {
        console.warn(`[Anti-Speed-Hack] Blocking rapid request from user ${userId} on ${path2} (${now - lastTime}ms interval)`);
        return res.status(429).json({
          error: "Quantum anti-speed-hack mechanism active: Request rate exceeds safety parameters. Action blocked.",
          success: false
        });
      }
      lastRequestTime[key] = now;
    }
  }
  next();
});
var STATE_FILE = import_path.default.join(process.cwd(), "galaxy_state.json");
var state = {
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
var TROOP_SPECS = {
  defender: { name: "Interceptor", defenceHp: 18, attackHp: 10, carry: 600, speed: 7, waterConsumption: 1 },
  attacker: { name: "Assault Drone", defenceHp: 9, attackHp: 30, carry: 400, speed: 11.662, waterConsumption: 2 },
  tank: { name: "Disrupter", defenceHp: 5, attackHp: 5, carry: 0, speed: 3.5, waterConsumption: 4 },
  looter: { name: "Matter Extractor", defenceHp: 4, attackHp: 4, carry: 1e3, speed: 23.331, waterConsumption: 3 },
  drone: { name: "Missile Launcher", defenceHp: 120, attackHp: 120, carry: 200, speed: 17.5, waterConsumption: 0.4 },
  settlementShip: { name: "Settlement Ship", defenceHp: 50, attackHp: 0, carry: 5e3, speed: 4.662, waterConsumption: 5 }
};
function getRepositoryCapacity(level) {
  if (level <= 1) return 1e4;
  if (level >= 45) return 5e6;
  return Math.round(1e4 * Math.pow(5e6 / 1e4, (level - 1) / 44));
}
function getMineProductionPerHour(level, type) {
  if (level <= 0) return 0;
  if (type === "water") {
    return Math.round(level / 15 * 14e3);
  }
  const maxMineProduction = 8333.33;
  return Math.round(level / 15 * maxMineProduction);
}
function saveState() {
  try {
    import_fs.default.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save state", err);
  }
}
function normalizeState(s) {
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
    if (!p.credits || p.credits < 1e4) {
      p.credits = 1e4;
    }
    if (!Array.isArray(p.planets)) {
      p.planets = [];
    }
    p.planets.forEach((pl, plIdx) => {
      if (!pl) return;
      if (pl.name && typeof pl.name === "string" && pl.name.includes("Outpost")) {
        pl.name = pl.name.replace(/Outpost/g, "Station");
      }
      const isFirst = plIdx === 0;
      if (!pl.troops) pl.troops = {};
      const troopDefaults = {
        defender: isFirst ? 12500 : 0,
        attacker: isFirst ? 28600 : 0,
        tank: isFirst ? 100 : 0,
        looter: isFirst ? 1e3 : 0,
        drone: isFirst ? 100 : 0,
        settlementShip: 0
      };
      Object.keys(troopDefaults).forEach((tKey) => {
        if (pl.troops[tKey] === void 0) {
          pl.troops[tKey] = troopDefaults[tKey];
        }
      });
      if (!pl.trainingQueue) {
        pl.trainingQueue = [];
      }
      if (!pl.upgradeQueue) {
        pl.upgradeQueue = [];
      }
      if (!pl.buildings) pl.buildings = {};
      const buildingDefaults = {
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
          if (isFirst) {
            pl.buildings[bKey].level = bDef.maxLevel;
          } else if (pl.buildings[bKey].level === 1 && (bKey === "fabricator" || bKey === "commsHub" || bKey === "repository")) {
            pl.buildings[bKey].level = 0;
          }
          const bObj = pl.buildings[bKey];
          if (bObj.level === void 0) bObj.level = defaultLvl;
          bObj.maxLevel = bDef.maxLevel;
          if (bObj.level > bDef.maxLevel) bObj.level = bDef.maxLevel;
          if (bObj.isUpgrading === void 0) bObj.isUpgrading = false;
          if (bObj.upgradeEnd === void 0) bObj.upgradeEnd = null;
          if (bObj.health === void 0) bObj.health = 100;
        }
      });
      if (!pl.mines) pl.mines = {};
      const mineKeys = ["water", "plasma", "fuel", "food", "respirant"];
      const mineCounts = { water: 6, plasma: 3, fuel: 3, food: 3, respirant: 3 };
      mineKeys.forEach((mKey) => {
        const count = mineCounts[mKey];
        if (!pl.mines[mKey]) {
          pl.mines[mKey] = Array.from({ length: count }, (_, i) => ({
            index: i,
            level: isFirst ? 25 : 0,
            isUpgrading: false,
            upgradeEnd: null,
            health: 100
          }));
        } else {
          pl.mines[mKey].forEach((mine) => {
            if (isFirst) {
              mine.level = 25;
            } else if (mine.level === void 0 || mine.level === 1) {
              mine.level = 0;
            }
            if (mine.isUpgrading === void 0) mine.isUpgrading = false;
            if (mine.upgradeEnd === void 0) mine.upgradeEnd = null;
            if (mine.health === void 0) mine.health = 100;
          });
        }
      });
      if (isFirst) {
        if (pl.resources.water < 5e6) pl.resources.water = 5e6;
        if (pl.resources.plasma < 5e6) pl.resources.plasma = 5e6;
        if (pl.resources.fuel < 5e6) pl.resources.fuel = 5e6;
        if (pl.resources.food < 5e6) pl.resources.food = 5e6;
        if (pl.resources.respirant < 5e6) pl.resources.respirant = 5e6;
      }
    });
  });
}
async function loadState() {
  try {
    if (import_fs.default.existsSync(STATE_FILE)) {
      const data = import_fs.default.readFileSync(STATE_FILE, "utf8");
      state = JSON.parse(data);
      if (!state.feedbacks) {
        state.feedbacks = [];
      }
      if (!state.customTasks) {
        state.customTasks = {};
      }
      if (state && state.players) {
        Object.values(state.players).forEach((p) => {
          if (p && Array.isArray(p.planets)) {
            p.planets.forEach((pl) => {
              if (pl && typeof pl.name === "string" && pl.name.includes("Outpost")) {
                pl.name = pl.name.replace(/Outpost/g, "Station");
              }
              if (pl && pl.troops) {
                if (pl.troops.settlementShip === void 0) {
                  pl.troops.settlementShip = 0;
                }
                if (pl.troops.defender === void 0) pl.troops.defender = 0;
                if (pl.troops.attacker === void 0) pl.troops.attacker = 0;
                if (pl.troops.tank === void 0) pl.troops.tank = 0;
                if (pl.troops.looter === void 0) pl.troops.looter = 0;
                if (pl.troops.drone === void 0) pl.troops.drone = 0;
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
function createInitialPlanet(name, sectorX, sectorY, isFirstStation = false) {
  const createMines = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      level: isFirstStation ? 25 : 1,
      isUpgrading: false,
      upgradeEnd: null,
      health: 100
    }));
  };
  return {
    id: `planet_${Math.random().toString(36).substr(2, 9)}`,
    name,
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
      water: isFirstStation ? 5e6 : 5e3,
      plasma: isFirstStation ? 5e6 : 5e3,
      fuel: isFirstStation ? 5e6 : 5e3,
      food: isFirstStation ? 5e6 : 5e3,
      respirant: isFirstStation ? 5e6 : 5e3
    },
    troops: {
      defender: isFirstStation ? 12500 : 0,
      attacker: isFirstStation ? 28600 : 0,
      tank: isFirstStation ? 100 : 0,
      looter: isFirstStation ? 1e3 : 0,
      drone: isFirstStation ? 100 : 0,
      settlementShip: 0
    },
    trainingQueue: []
  };
}
function applyBomberDamage(defPlanet, numTanks, chosenTarget) {
  const buildingDamageReports = [];
  if (numTanks <= 0 || !defPlanet) return buildingDamageReports;
  let target = chosenTarget || "random";
  let targetType = "building";
  let mineType = "";
  if (target === "random") {
    const choices = ["commsHub", "researchCenter", "armyBase", "repository", "radar", "supplyNexus", "mines.water", "mines.plasma", "mines.fuel", "mines.food", "mines.respirant"];
    target = choices[Math.floor(Math.random() * choices.length)];
  }
  let finalName = target;
  let targetState = null;
  if (target.startsWith("mines.")) {
    targetType = "mine";
    mineType = target.split(".")[1];
    const mineList = defPlanet.mines[mineType];
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
    targetState = defPlanet.buildings[target];
  }
  if (!targetState) {
    const destructibleBuildings = Object.keys(defPlanet.buildings);
    const bKey = destructibleBuildings[Math.floor(Math.random() * destructibleBuildings.length)];
    targetState = defPlanet.buildings[bKey];
    finalName = bKey;
  }
  if (targetState) {
    const prevLvl = targetState.level;
    const prevHealth = targetState.health !== void 0 ? targetState.health : 100;
    const damage = numTanks;
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
      const newHealth = newLvl === 1 ? Math.max(0, 100 - remainingDamage) : 100 - remainingDamage;
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
  const uncolonized = state.habitablePlanets.filter((p) => !p.isColonized);
  if (uncolonized.length >= 20) return;
  const countNeeded = 20 - uncolonized.length;
  const namesPool = [
    "Gaia Aurelia",
    "Kepler-Prime",
    "Gliese-91",
    "New Hope",
    "Epsilon-D",
    "Zephyr-9",
    "Arcadia",
    "Core Dome-A",
    "Oasis-1",
    "Eden-X",
    "Genesis",
    "Midway",
    "Vanguard Outpost",
    "Nova Sol",
    "Horizon Delta",
    "Apex Hub",
    "Thera Prime",
    "Verdant Reach",
    "Seraphim V",
    "Titan Alpha",
    "Nexus Beta",
    "Elysium VI",
    "Hyperion",
    "Astraea",
    "Polaris Junction",
    "Chronos III",
    "Solaris Sector",
    "Sentinel Dome",
    "Obsidian Station",
    "Olympus Basin"
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
      const overlapHabitable = state.habitablePlanets.some((hp) => hp.coords.x === targetX && hp.coords.y === targetY);
      if (overlapHabitable) continue;
      let overlapPlayer = false;
      for (const player of Object.values(state.players)) {
        if (player.planets && player.planets.some((pl) => pl.sectorX === targetX && pl.sectorY === targetY)) {
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
    const randomLvl = () => Math.floor(Math.random() * 8) + 2;
    for (const key of Object.keys(planet.mines)) {
      planet.mines[key].forEach((m) => m.level = randomLvl());
    }
    planet.buildings.commsHub.level = Math.floor(Math.random() * 10) + 1;
    planet.buildings.researchCenter.level = Math.floor(Math.random() * 12) + 1;
    planet.buildings.radar.level = Math.floor(Math.random() * 8) + 1;
    planet.buildings.repository.level = Math.floor(Math.random() * 15) + 1;
    const player = {
      id,
      username: ai.name,
      faction: ai.faction,
      factionColor: ai.color,
      allianceId: null,
      allianceRole: null,
      planets: [planet],
      scores: {
        population: Math.floor(Math.random() * 1e3) + 200,
        attack: Math.floor(Math.random() * 8e3),
        defence: Math.floor(Math.random() * 6e3),
        raiders: Math.floor(Math.random() * 5e5)
      },
      achievements: ["First Mine", "Fleet Commander"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now() - 864e5,
      credits: 1e4
    };
    state.players[id] = player;
  });
  ensureMinimumHabitablePlanets();
  saveState();
}
function tickPlayerState(playerId, now) {
  const player = state.players[playerId];
  if (!player) return false;
  let changed = false;
  player.planets.forEach((planet) => {
    const repositoryLvl = planet.buildings.repository.level;
    const storageLimit = getRepositoryCapacity(repositoryLvl);
    let waterConsumptionPerHour = 0;
    Object.entries(planet.troops).forEach(([troopId, count]) => {
      const spec = TROOP_SPECS[troopId];
      if (spec) {
        waterConsumptionPerHour += count * spec.waterConsumption;
      }
    });
    const lastTick = planet._lastTick || now;
    planet._lastTick = now;
    let lastCompletedUpgradeTime = 0;
    const deltaMs = now - lastTick;
    if (deltaMs > 0) {
      const deltaHours = deltaMs / 36e5;
      for (const resKey of Object.keys(planet.mines)) {
        const mines = planet.mines[resKey];
        mines.forEach((mine) => {
          if (mine.isUpgrading && mine.upgradeEnd && now >= mine.upgradeEnd) {
            mine.level += 1;
            mine.isUpgrading = false;
            lastCompletedUpgradeTime = Math.max(lastCompletedUpgradeTime, mine.upgradeEnd);
            mine.upgradeEnd = null;
            changed = true;
          }
          const isOtherMaxed = planet.resources.plasma >= storageLimit && planet.resources.fuel >= storageLimit && planet.resources.food >= storageLimit && planet.resources.respirant >= storageLimit;
          const isMineBoosted = mine.boostedUntil && now < Number(mine.boostedUntil);
          let hourlyProd = isOtherMaxed ? resKey === "water" ? 14e3 : 42e3 : getMineProductionPerHour(mine.level, resKey);
          if (isMineBoosted) {
            hourlyProd = hourlyProd * 1.14;
          }
          const accumulated = hourlyProd * deltaHours;
          if (resKey === "water") {
            planet.resources.water += accumulated;
          } else {
            planet.resources[resKey] = Math.min(
              storageLimit,
              planet.resources[resKey] + accumulated
            );
          }
        });
      }
      const waterConsumed = waterConsumptionPerHour * deltaHours;
      const respirantConsumed = waterConsumptionPerHour * 0.28 * deltaHours;
      const foodConsumed = waterConsumptionPerHour * 0.18 * deltaHours;
      planet.resources.water = planet.resources.water - waterConsumed;
      planet.resources.respirant = planet.resources.respirant - respirantConsumed;
      planet.resources.food = planet.resources.food - foodConsumed;
      const hourlyMinesProd = { water: 0, respirant: 0, food: 0 };
      for (const resKey of ["water", "respirant", "food"]) {
        const mines = planet.mines[resKey] || [];
        const isOtherMaxed = planet.resources.plasma >= storageLimit && planet.resources.fuel >= storageLimit && planet.resources.food >= storageLimit && planet.resources.respirant >= storageLimit;
        mines.forEach((mine) => {
          const isMineBoosted = mine.boostedUntil && now < Number(mine.boostedUntil);
          let hourlyProd = isOtherMaxed ? resKey === "water" ? 14e3 : 42e3 : getMineProductionPerHour(mine.level, resKey);
          if (isMineBoosted) {
            hourlyProd = hourlyProd * 1.14;
          }
          hourlyMinesProd[resKey] += hourlyProd;
        });
      }
      const netWaterProdHourly = hourlyMinesProd.water - waterConsumptionPerHour;
      const netRespirantProdHourly = hourlyMinesProd.respirant - waterConsumptionPerHour * 0.28;
      const netFoodProdHourly = hourlyMinesProd.food - waterConsumptionPerHour * 0.18;
      const isAnyProdNegative = netWaterProdHourly < 0 || netRespirantProdHourly < 0 || netFoodProdHourly < 0;
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
      const triggerAttrition = planet.resources.water < 0 || planet.resources.respirant < 0 || planet.resources.food < 0;
      if (triggerAttrition) {
        const attritionRate = 0.15;
        if (deltaHours > 0) {
          const deathFactor = Math.exp(-attritionRate * deltaHours);
          Object.keys(planet.troops).forEach((tId) => {
            const count = planet.troops[tId];
            if (count > 0) {
              const remaining = Math.max(0, Math.floor(count * deathFactor));
              if (remaining < count) {
                planet.troops[tId] = remaining;
                changed = true;
              }
            }
          });
        }
      }
      for (const bKey of Object.keys(planet.buildings)) {
        const building = planet.buildings[bKey];
        if (building.isUpgrading && building.upgradeEnd && now >= building.upgradeEnd) {
          building.level += 1;
          building.isUpgrading = false;
          lastCompletedUpgradeTime = Math.max(lastCompletedUpgradeTime, building.upgradeEnd);
          building.upgradeEnd = null;
          changed = true;
        }
      }
      if (planet.activeResearch && planet.activeResearch.endAt && now >= planet.activeResearch.endAt) {
        const techId = planet.activeResearch.techId;
        const targetLvl = planet.activeResearch.targetLevel;
        if (!player.techLevels) {
          player.techLevels = {};
        }
        if (!player.techLevels[planet.id]) {
          player.techLevels[planet.id] = {};
        }
        player.techLevels[planet.id][techId] = targetLvl;
        lastCompletedUpgradeTime = Math.max(lastCompletedUpgradeTime, planet.activeResearch.endAt);
        planet.activeResearch = null;
        changed = true;
      }
      if (!planet.upgradeQueue) {
        planet.upgradeQueue = [];
      }
      let isUpgradeActive = false;
      for (const rKey of Object.keys(planet.mines)) {
        if (planet.mines[rKey].some((m) => m.isUpgrading)) {
          isUpgradeActive = true;
          break;
        }
      }
      if (!isUpgradeActive) {
        if (Object.values(planet.buildings).some((b) => b.isUpgrading)) {
          isUpgradeActive = true;
        }
      }
      if (!isUpgradeActive && planet.activeResearch) {
        isUpgradeActive = true;
      }
      if (!isUpgradeActive && planet.upgradeQueue.length > 0) {
        let referenceTime = lastCompletedUpgradeTime > 0 ? lastCompletedUpgradeTime : now;
        while (planet.upgradeQueue.length > 0) {
          const nextUp = planet.upgradeQueue[0];
          let durationMs = 0;
          let targetObj = null;
          let targetLvl = 1;
          if (nextUp.type === "research") {
            targetLvl = nextUp.targetLevel;
            durationMs = targetLvl * 60 * 1e3;
            const expectedEnd = referenceTime + durationMs;
            if (now >= expectedEnd) {
              if (!player.techLevels) {
                player.techLevels = {};
              }
              if (!player.techLevels[planet.id]) {
                player.techLevels[planet.id] = {};
              }
              player.techLevels[planet.id][nextUp.key] = targetLvl;
              planet.upgradeQueue.shift();
              referenceTime = expectedEnd;
              changed = true;
            } else {
              planet.activeResearch = {
                techId: nextUp.key,
                targetLevel: targetLvl,
                endAt: expectedEnd
              };
              planet.upgradeQueue.shift();
              changed = true;
              break;
            }
          } else {
            if (nextUp.type === "mine") {
              targetObj = planet.mines[nextUp.key]?.[nextUp.mineIndex];
              if (targetObj) {
                targetLvl = targetObj.level + 1;
                durationMs = targetLvl * 60 * 1e3;
              }
            } else if (nextUp.type === "building") {
              targetObj = planet.buildings[nextUp.key];
              if (targetObj) {
                targetLvl = targetObj.level + 1;
                durationMs = targetLvl * 120 * 1e3;
              }
            }
            if (targetObj) {
              const expectedEnd = referenceTime + durationMs;
              if (now >= expectedEnd) {
                targetObj.level = targetLvl;
                targetObj.isUpgrading = false;
                targetObj.upgradeEnd = null;
                planet.upgradeQueue.shift();
                referenceTime = expectedEnd;
                changed = true;
              } else {
                targetObj.isUpgrading = true;
                targetObj.upgradeEnd = expectedEnd;
                planet.upgradeQueue.shift();
                changed = true;
                break;
              }
            } else {
              planet.upgradeQueue.shift();
            }
          }
        }
      }
      if (planet.trainingQueue && planet.trainingQueue.length > 0) {
        const baseTimes = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
        const remainingQueue = [];
        planet.trainingQueue.forEach((item) => {
          if (now >= item.completedAt) {
            planet.troops[item.troopId] += item.count;
            changed = true;
          } else {
            const bTime = baseTimes[item.troopId] || 30;
            const rcLevel = planet.buildings.researchCenter.level;
            const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
            const unitDurationMs = Math.max(1e3, Math.round(bTime * (1 - reductionFrac) * 1e3));
            const timePassedSinceStart = now - item.startedAt;
            const completedUnits = Math.floor(timePassedSinceStart / unitDurationMs);
            if (completedUnits > 0) {
              const actualCompleted = Math.min(item.count, completedUnits);
              if (actualCompleted > 0) {
                planet.troops[item.troopId] += actualCompleted;
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
  let popScore = 0;
  player.planets.forEach((planet) => {
    for (const resKey of Object.keys(planet.mines)) {
      planet.mines[resKey].forEach((m) => {
        popScore += m.level * 10;
      });
    }
    for (const bKey of Object.keys(planet.buildings)) {
      const b = planet.buildings[bKey];
      popScore += b.level * 30;
    }
  });
  if (player.scores.population !== popScore) {
    player.scores.population = popScore;
    changed = true;
  }
  return changed;
}
function simulateMoonbaseCombat(attackerName, defenderName, attTroops, defTroops, attShieldLevel = 10, defShieldLevel = 10) {
  const attRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...attTroops };
  const defRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...defTroops };
  const attackerLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const defenderLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const defenderSalvaged = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const attackerSalvaged = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const rounds = [];
  let attackHpKilled = 0;
  let defenceHpKilled = 0;
  const attMult = 1 + Math.min(20, attShieldLevel) / 20 * 0.15;
  const defMult = 1 + Math.min(20, defShieldLevel) / 20 * 0.15;
  let initialAttHp = 0;
  Object.entries(attTroops).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId];
    if (spec) initialAttHp += count * Math.round(spec.attackHp * attMult);
  });
  let initialDefHp = 0;
  Object.entries(defTroops).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId];
    if (spec) initialDefHp += count * Math.round(spec.defenceHp * defMult);
  });
  let attSurvivalFloor = 0;
  let defSurvivalFloor = 0;
  if (initialAttHp > 0 && initialDefHp > 0) {
    const defToAttRatio = initialDefHp / initialAttHp;
    if (defToAttRatio <= 2.5) {
      attSurvivalFloor = Math.max(0.1, 0.4 * (2.5 - defToAttRatio) / 1.5);
    }
    const attToDefRatio = initialAttHp / initialDefHp;
    if (attToDefRatio <= 2.5) {
      defSurvivalFloor = Math.max(0.1, 0.4 * (2.5 - attToDefRatio) / 1.5);
    }
  }
  const TARGET_PRIORITIES = {
    defender: 2,
    // Interceptor: Vanguard defense screen
    attacker: 2,
    // Assault Drone: Aggressive frontline unit
    drone: 0.8,
    // Missile Tank: Heavy siege, protected backline
    tank: 0.8,
    // Disrupter: Armored bomber unit
    looter: 0.3,
    // Matter Extractor: Fragile utility ship
    settlementShip: 0.2
    // Settlement Ship: Extremely large, backline transport
  };
  const getActiveCombatShips = (troops) => {
    return Object.keys(troops).filter((k) => troops[k] > 0);
  };
  for (let r = 1; r <= 1; r++) {
    const roundLogs = [];
    const totalAtt = Object.values(attRemaining).reduce((s, v) => s + v, 0);
    const totalDef = Object.values(defRemaining).reduce((s, v) => s + v, 0);
    if (totalAtt === 0 || totalDef === 0) {
      break;
    }
    let baseAttDamage = 0;
    Object.entries(attRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId];
      if (spec) baseAttDamage += count * spec.attackHp;
    });
    let baseDefDamage = 0;
    Object.entries(defRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId];
      if (spec) baseDefDamage += count * spec.defenceHp;
    });
    const attVariance = 0.85 + Math.random() * 0.3;
    const defVariance = 0.85 + Math.random() * 0.3;
    let attDamage = Math.round(baseAttDamage * attVariance);
    let defDamage = Math.round(baseDefDamage * defVariance);
    const activeAttTypes = getActiveCombatShips(attRemaining);
    const activeDefTypes = getActiveCombatShips(defRemaining);
    const roundAttLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    const roundDefLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    roundLogs.push(`--- COMBAT CYCLE ${r} INITIATED ---`);
    roundLogs.push(`Attackers throw ${attDamage.toLocaleString()} megawatt laser channels into target coordinates.`);
    roundLogs.push(`Defenders are being attacked under siege. Their offensive HP does not count; only their defense HP (${baseDefDamage.toLocaleString()} total DEF) is channeled into ${defDamage.toLocaleString()} retaliatory counter-firepower.`);
    if (attDamage > 0 && activeDefTypes.length > 0) {
      let damagePool = attDamage;
      let remainingTargets = [...activeDefTypes];
      while (damagePool > 0 && remainingTargets.length > 0) {
        let totalWeight = 0;
        remainingTargets.forEach((tId) => {
          const qty = defRemaining[tId];
          const prio = TARGET_PRIORITIES[tId] || 1;
          totalWeight += qty * prio;
        });
        if (totalWeight === 0) break;
        let extraRedistributePool = 0;
        const damageToApply = {};
        remainingTargets.forEach((tId) => {
          const qty = defRemaining[tId];
          const prio = TARGET_PRIORITIES[tId] || 1;
          const share = qty * prio / totalWeight;
          damageToApply[tId] = damagePool * share;
        });
        damagePool = 0;
        remainingTargets.forEach((tId) => {
          const spec = TROOP_SPECS[tId];
          const unitHp = Math.round((spec ? spec.defenceHp : 100) * defMult);
          const currentCount = defRemaining[tId];
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
            roundDefLosses[tId] += killed;
            defenderLosses[tId] += killed;
            defRemaining[tId] -= killed;
            defenceHpKilled += killed * unitHp;
            const usedDamage = killed * unitHp;
            if (allocatedDmg > usedDamage) {
              extraRedistributePool += allocatedDmg - usedDamage;
            }
          }
        });
        damagePool = extraRedistributePool;
        remainingTargets = getActiveCombatShips(defRemaining);
      }
    }
    if (defDamage > 0 && activeAttTypes.length > 0) {
      let damagePool = defDamage;
      let remainingTargets = [...activeAttTypes];
      while (damagePool > 0 && remainingTargets.length > 0) {
        let totalWeight = 0;
        remainingTargets.forEach((tId) => {
          const qty = attRemaining[tId];
          const prio = TARGET_PRIORITIES[tId] || 1;
          totalWeight += qty * prio;
        });
        if (totalWeight === 0) break;
        let extraRedistributePool = 0;
        const damageToApply = {};
        remainingTargets.forEach((tId) => {
          const qty = attRemaining[tId];
          const prio = TARGET_PRIORITIES[tId] || 1;
          const share = qty * prio / totalWeight;
          damageToApply[tId] = damagePool * share;
        });
        damagePool = 0;
        remainingTargets.forEach((tId) => {
          const spec = TROOP_SPECS[tId];
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
              extraRedistributePool += allocatedDmg - usedDamage;
            }
          }
        });
        damagePool = extraRedistributePool;
        remainingTargets = getActiveCombatShips(attRemaining);
      }
    }
    const attKilledText = Object.entries(roundAttLosses).filter(([_, qty]) => qty > 0).map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId]?.name || tId}`).join(", ");
    const defKilledText = Object.entries(roundDefLosses).filter(([_, qty]) => qty > 0).map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId]?.name || tId}`).join(", ");
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
  const safetyLogs = [];
  if (attSurvivalFloor > 0) {
    let protectionTriggered = false;
    Object.entries(attTroops).forEach(([tId, initialCount]) => {
      if (initialCount > 0) {
        const minSurviving = Math.ceil(initialCount * attSurvivalFloor);
        if (attRemaining[tId] < minSurviving) {
          const shortage = minSurviving - attRemaining[tId];
          attRemaining[tId] = minSurviving;
          attackerLosses[tId] = Math.max(0, attackerLosses[tId] - shortage);
          const spec = TROOP_SPECS[tId];
          const unitHp = spec ? Math.round(spec.defenceHp * attMult) : 10;
          attackHpKilled = Math.max(0, attackHpKilled - shortage * unitHp);
          protectionTriggered = true;
        }
      }
    });
    if (protectionTriggered) {
      safetyLogs.push(`\u{1F6E1}\uFE0F [Tactical Deflection Force] Attacker had ${(attSurvivalFloor * 100).toFixed(1)}% HP advantage! Survival security field guaranteed that at least ${(attSurvivalFloor * 100).toFixed(1)}% of original squads survive.`);
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
          const spec = TROOP_SPECS[tId];
          const unitHp = spec ? Math.round(spec.defenceHp * defMult) : 10;
          defenceHpKilled = Math.max(0, defenceHpKilled - shortage * unitHp);
          protectionTriggered = true;
        }
      }
    });
    if (protectionTriggered) {
      safetyLogs.push(`\u{1F6E1}\uFE0F [Tactical Deflection Force] Defender had ${(defSurvivalFloor * 100).toFixed(1)}% HP advantage! Survival security field guaranteed that at least ${(defSurvivalFloor * 100).toFixed(1)}% of original squads survive.`);
    }
  }
  if (safetyLogs.length > 0 && rounds.length > 0) {
    rounds[rounds.length - 1].logs.push(...safetyLogs);
  }
  const salvageLogs = [];
  Object.entries(defenderLosses).forEach(([tId, count]) => {
    if (count > 0) {
      let saved = 0;
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.2) saved++;
      }
      if (saved > 0) {
        defenderSalvaged[tId] = saved;
        defRemaining[tId] += saved;
        defenderLosses[tId] -= saved;
      }
    }
  });
  Object.entries(attackerLosses).forEach(([tId, count]) => {
    if (count > 0) {
      let saved = 0;
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.1) saved++;
      }
      if (saved > 0) {
        attackerSalvaged[tId] = saved;
        attRemaining[tId] += saved;
        attackerLosses[tId] -= saved;
      }
    }
  });
  const defSalvagedText = Object.entries(defenderSalvaged).filter(([_, qty]) => qty > 0).map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId]?.name || tId}`).join(", ");
  const attSalvagedText = Object.entries(attackerSalvaged).filter(([_, qty]) => qty > 0).map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId]?.name || tId}`).join(", ");
  if (defSalvagedText || attSalvagedText) {
    salvageLogs.push(`=== BATTLEFIELD ORBIT RECOVERY REPORT ===`);
    if (defSalvagedText) {
      salvageLogs.push(`[Nano-Salvage Array] Planetary defense rigs gathered scrap, reconstructing: ${defSalvagedText} for the Defender.`);
    }
    if (attSalvagedText) {
      salvageLogs.push(`[Tactical Medical Bay] Offside carrier teams salvaged and re-launched: ${attSalvagedText} for the Attacker.`);
    }
    if (rounds.length > 0) {
      rounds[rounds.length - 1].logs.push(...salvageLogs);
    }
  }
  if (initialAttHp > 2.5 * initialDefHp && initialDefHp > 0) {
    Object.entries(defTroops).forEach(([tId, count]) => {
      defRemaining[tId] = 0;
      defenderLosses[tId] = count;
    });
    defenceHpKilled = initialDefHp;
    if (rounds.length > 0) {
      rounds[rounds.length - 1].logs.push(`\u{1F4A5} [TACTICAL OVERWHELM] Attacker's initial force HP of ${initialAttHp.toLocaleString()} exceeded 150% more than the defender's total involved HP (${initialDefHp.toLocaleString()}). Absolute overwhelm triggered; all defender defending forces have been wiped out with ZERO survivors!`);
    }
  } else if (initialDefHp > 2.5 * initialAttHp && initialAttHp > 0) {
    Object.entries(attTroops).forEach(([tId, count]) => {
      attRemaining[tId] = 0;
      attackerLosses[tId] = count;
    });
    attackHpKilled = initialAttHp;
    if (rounds.length > 0) {
      rounds[rounds.length - 1].logs.push(`\u{1F4A5} [TACTICAL OVERWHELM] Defender's initial force HP of ${initialDefHp.toLocaleString()} exceeded 150% more than the attacker's total involved HP (${initialAttHp.toLocaleString()}). Absolute overwhelm triggered; all attacking squadron forces have been wiped out with ZERO survivors!`);
    }
  } else {
    if (initialAttHp > 0 && initialDefHp > 0) {
      const finalAttCountTemp = Object.values(attRemaining).reduce((s, v) => s + v, 0);
      const finalDefCountTemp = Object.values(defRemaining).reduce((s, v) => s + v, 0);
      if (finalDefCountTemp === 0) {
        Object.entries(defTroops).forEach(([tId, count]) => {
          if (count > 0) {
            const minQty = Math.max(1, Math.ceil(count * 0.1));
            defRemaining[tId] = minQty;
            defenderLosses[tId] = Math.max(0, count - minQty);
          }
        });
        if (rounds.length > 0) {
          rounds[rounds.length - 1].logs.push(`\u{1F6E1}\uFE0F [MINIMUM SAFETY SECURITY] Because the attacker did not have >150% more relevant HP involved, defender was saved from total annihilation by local garrison shields!`);
        }
      }
      if (finalAttCountTemp === 0) {
        Object.entries(attTroops).forEach(([tId, count]) => {
          if (count > 0) {
            const minQty = Math.max(1, Math.ceil(count * 0.1));
            attRemaining[tId] = minQty;
            attackerLosses[tId] = Math.max(0, count - minQty);
          }
        });
        if (rounds.length > 0) {
          rounds[rounds.length - 1].logs.push(`\u{1F6E1}\uFE0F [MINIMUM SAFETY SECURITY] Because the defender did not have >150% more relevant HP involved, attacker was saved from total annihilation by tactical jump shields!`);
        }
      }
    }
  }
  const finalAttCount = Object.values(attRemaining).reduce((s, v) => s + v, 0);
  const finalDefCount = Object.values(defRemaining).reduce((s, v) => s + v, 0);
  const finalAttHp = Object.entries(attRemaining).reduce((sum, [tId, qty]) => {
    const spec = TROOP_SPECS[tId];
    const totalUnitHP = spec ? spec.defenceHp : 0;
    return sum + qty * Math.round(totalUnitHP * attMult);
  }, 0);
  const finalDefHp = Object.entries(defRemaining).reduce((sum, [tId, qty]) => {
    const spec = TROOP_SPECS[tId];
    const totalUnitHP = spec ? spec.defenceHp : 0;
    return sum + qty * Math.round(totalUnitHP * defMult);
  }, 0);
  let winner = "defender";
  if (finalAttCount === 0 && finalDefCount > 0) {
    winner = "defender";
  } else if (finalDefCount === 0 && finalAttCount > 0) {
    winner = "attacker";
  } else if (finalAttCount === 0 && finalDefCount === 0) {
    winner = "defender";
  } else {
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
function tickFleets(now) {
  let stateChanged = false;
  const activeFleets = [...state.fleets];
  const remainingFleets = [];
  activeFleets.forEach((fleet) => {
    if (fleet.isWaitingToSettle) {
      remainingFleets.push(fleet);
    } else if (now >= fleet.arrivesAt) {
      if (fleet.missionType === "colonize" && !fleet.isReturning) {
        fleet.isWaitingToSettle = true;
        stateChanged = true;
        remainingFleets.push(fleet);
      } else {
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
function resolveFleetMission(fleet, now, remainingFleets) {
  if (fleet.isReturning) {
    const sender = state.players[fleet.senderId];
    if (sender) {
      const homePlanet = sender.planets[0];
      if (homePlanet) {
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          homePlanet.troops[tId] += count;
        });
        if (fleet.lootCarried) {
          const cap = getRepositoryCapacity(homePlanet.buildings.repository.level);
          Object.entries(fleet.lootCarried).forEach(([res, amt]) => {
            homePlanet.resources[res] = Math.min(
              cap,
              homePlanet.resources[res] + amt
            );
          });
        }
      }
    }
    return;
  }
  const attacker = state.players[fleet.senderId];
  const defender = fleet.targetId ? state.players[fleet.targetId] : null;
  if (fleet.missionType === "move") {
    if (attacker) {
      let targetPlanet = attacker.planets.find((pl) => pl.sectorX === fleet.targetCoords.x && pl.sectorY === fleet.targetCoords.y);
      let targetOwner = attacker;
      if (!targetPlanet && attacker.allianceId) {
        for (const playerObj of Object.values(state.players)) {
          if (playerObj.allianceId === attacker.allianceId) {
            const pl = playerObj.planets.find((p) => p.sectorX === fleet.targetCoords.x && p.sectorY === fleet.targetCoords.y);
            if (pl) {
              targetPlanet = pl;
              targetOwner = playerObj;
              break;
            }
          }
        }
      }
      if (targetPlanet) {
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          targetPlanet.troops[tId] = (targetPlanet.troops[tId] || 0) + count;
        });
        const report = {
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
                `Arriving payload: ${Object.entries(fleet.troops).filter(([_, q]) => q > 0).map(([t, q]) => `${q} ${t}`).join(", ") || "No spacecraft"}`
              ],
              attackerRemaining: { ...fleet.troops },
              defenderRemaining: { ...targetPlanet.troops }
            }
          ]
        };
        state.battleReports.unshift(report);
        sendNotificationWithFallback(
          fleet.senderId,
          "\u{1F680} Fleet Relocation Completed",
          `Your relocation fleet has completed transit and safely landed at '${targetPlanet.name}'.`
        );
      } else {
        const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
        const slowestTroopSpeed = Object.entries(fleet.troops).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
          const sp = TROOP_SPECS[tId]?.speed || 5;
          return sp < slowest ? sp : slowest;
        }, 100);
        const travelTimeMs = Math.round(totalDist / slowestTroopSpeed * 6e4);
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
    const defTroops = defender?.planets[0]?.troops || { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    let defenderTotalHp = 0;
    Object.entries(defTroops).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId];
      if (spec && count > 0) {
        defenderTotalHp += count * spec.defenceHp;
      }
    });
    let scoutingTotalAttack = 0;
    Object.entries(fleet.troops).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId];
      if (spec && count > 0) {
        scoutingTotalAttack += count * spec.attackHp;
      }
    });
    const dronesDiedCount = defenderTotalHp > 0 && scoutingTotalAttack < defenderTotalHp ? fleet.troops.drone || 0 : 0;
    const didScoutsDie = dronesDiedCount > 0;
    const defPlanet = defender?.planets[0];
    const report = {
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
      } : void 0,
      mines: defPlanet ? {
        water: defPlanet.mines?.water?.map((m) => m.level) || [1],
        plasma: defPlanet.mines?.plasma?.map((m) => m.level) || [1],
        fuel: defPlanet.mines?.fuel?.map((m) => m.level) || [1],
        food: defPlanet.mines?.food?.map((m) => m.level) || [1],
        respirant: defPlanet.mines?.respirant?.map((m) => m.level) || [1]
      } : void 0,
      resources: defPlanet ? defPlanet.resources : void 0
    };
    const reportLogs = [];
    if (didScoutsDie) {
      reportLogs.push("--- SATELLITE INTERCEPT ENCOUNTER ---");
      reportLogs.push(`Hostile garrison detected: ${defenderTotalHp.toLocaleString()} defending HP.`);
      reportLogs.push(`Scout group attack rating: ${scoutingTotalAttack.toLocaleString()} attack HP.`);
      reportLogs.push("Orbit guards identified scout telemetry and initiated railguards.");
      reportLogs.push(`Our missile launcher group (${dronesDiedCount} unit(s)) was completely destroyed because our scouting attack power was less than hostiles' defending HP.`);
      reportLogs.push("Full tactical satellite telemetry was successfully beamed to moonbase before demolition.");
    } else {
      reportLogs.push("--- SECURE TELEMETRY SCAN ---");
      reportLogs.push(defenderTotalHp > 0 ? `Hostiles detected: ${defenderTotalHp} defending HP, but our fleet attack power (${scoutingTotalAttack}) is sufficient to cover reconnaissance safety.` : "No active orbit guards or garrison troops detected at target colony.");
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
    sendNotificationWithFallback(
      report.attackerId,
      "\u{1F4E1} Intelligence Sweep Complete",
      `Your recon drones have returned orbital scanner data of Commander ${report.defenderName || "Unknown"}'s station.`
    );
    if (report.defenderId) {
      sendNotificationWithFallback(
        report.defenderId,
        "\u26A0\uFE0F SENSORS ALERT: Scanner Detected",
        `Proximity alarms triggered: An unauthorized scouting drone sent by Commander ${report.attackerName} has completed a scan of your station!`
      );
    }
    if (didScoutsDie) {
      fleet.troops.drone = Math.max(0, (fleet.troops.drone || 0) - dronesDiedCount);
    }
    const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
    const speedLvl = fleet.troopSpeedLevel || 1;
    const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
    const multiplier = 1 + boostPct;
    const speed = TROOP_SPECS.drone.speed * multiplier;
    const travelTimeMs = Math.round(totalDist / speed * 6e4);
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
      const hasLvl20 = attacker.planets.some((p) => p.buildings.researchCenter.level >= 20);
      if (hasLvl20 && attacker.planets.length < 10) {
        const planetNum = attacker.planets.length + 1;
        const newPlanet = createInitialPlanet(`${attacker.username}'s Colony ${planetNum}`, fleet.targetCoords.x, fleet.targetCoords.y);
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          newPlanet.troops[tId] = count;
        });
        attacker.planets.push(newPlanet);
        state.newsEvents.unshift({
          id: `news_${Math.random().toString(36).substr(2, 9)}`,
          title: "Planet Colonized",
          content: `${attacker.username} has established a new base at sector [${fleet.targetCoords.x}, ${fleet.targetCoords.y}]!`,
          type: "discovery",
          timestamp: now
        });
      } else {
        const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
        remainingFleets.push({
          ...fleet,
          isReturning: true,
          startedAt: now,
          arrivesAt: now + 1e4
        });
      }
    }
    return;
  }
  if (fleet.missionType === "attack") {
    if (!attacker || !defender) {
      remainingFleets.push({
        ...fleet,
        isReturning: true,
        startedAt: now,
        arrivesAt: now + 5e3
      });
      return;
    }
    const defPlanet = defender.planets[0];
    const attTroops = { ...fleet.troops };
    const defTroops = defPlanet ? { ...defPlanet.troops } : { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0 };
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
    if (defPlanet) {
      Object.entries(combat.defenderLosses).forEach(([tId, count]) => {
        defPlanet.troops[tId] -= count;
      });
    }
    if (combat.winner === "attacker") {
      attacker.scores.attack += combat.defenceHpKilled;
    }
    if (combat.winner === "defender") {
      defender.scores.defence += combat.attackHpKilled;
    }
    const loot = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
    let totalLootCapacity = 0;
    Object.entries(combat.attackerRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId];
      if (spec) totalLootCapacity += count * spec.carry;
    });
    if (combat.winner === "attacker" && totalLootCapacity > 0 && defPlanet) {
      const items = ["water", "plasma", "fuel", "food", "respirant"];
      let defenseTotalResources = items.reduce((sum, item) => sum + defPlanet.resources[item], 0);
      if (defenseTotalResources > 0) {
        const stealAmount = Math.min(totalLootCapacity, defenseTotalResources);
        const stealFrac = stealAmount / defenseTotalResources;
        items.forEach((item) => {
          const stolen = Math.floor(defPlanet.resources[item] * stealFrac);
          defPlanet.resources[item] -= stolen;
          loot[item] = stolen;
        });
        const totalStolen = Object.values(loot).reduce((sum, val) => sum + val, 0);
        attacker.scores.raiders += totalStolen;
      }
    }
    const buildingDamageReports = combat.winner === "attacker" && combat.attackerRemaining.tank > 0 && defPlanet ? applyBomberDamage(defPlanet, combat.attackerRemaining.tank, fleet.targetBuilding || "random") : [];
    const report = {
      id: `battle_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      attackerId: fleet.senderId,
      attackerName: fleet.senderName,
      attackerAlliance: attacker.allianceId ? state.alliances[attacker.allianceId]?.tag : void 0,
      defenderId: fleet.targetId,
      defenderName: fleet.targetName,
      defenderAlliance: defender.allianceId ? state.alliances[defender.allianceId]?.tag : void 0,
      attackerCoords: fleet.senderCoords,
      defenderCoords: fleet.targetCoords,
      attackerInitialTroops: attTroops,
      attackerLosses: combat.attackerLosses,
      defenderInitialTroops: defTroops,
      defenderLosses: combat.defenderLosses,
      winner: combat.winner,
      resourcesStolen: loot,
      buildingDamage: buildingDamageReports.length > 0 ? buildingDamageReports : void 0,
      attackHpKilled: combat.attackHpKilled,
      defenceHpKilled: combat.defenceHpKilled,
      battleRounds: combat.rounds
    };
    state.battleReports.unshift(report);
    const lootSumTotal = Object.values(loot).reduce((s, v) => s + v, 0);
    sendNotificationWithFallback(
      report.attackerId,
      combat.winner === "attacker" ? "\u{1F3C6} Raid Victory!" : "\u274C Raid Repelled",
      combat.winner === "attacker" ? `Your raid on Commander ${report.defenderName}'s station was successful! Plundered ${lootSumTotal.toLocaleString()} resources.` : `Your raiding fleet on Commander ${report.defenderName}'s station was defeated.`
    );
    if (report.defenderId) {
      sendNotificationWithFallback(
        report.defenderId,
        combat.winner === "attacker" ? "\u{1F6A8} STATION BREACH ALERT!" : "\u{1F6E1}\uFE0F Station Defended!",
        combat.winner === "attacker" ? `Commander ${report.attackerName} breached your defenses, plundering ${lootSumTotal.toLocaleString()} resources!` : `Your security systems successfully repelled a raid by Commander ${report.attackerName}!`
      );
    }
    const lootSum = Object.values(loot).reduce((s, v) => s + v, 0);
    const destructionDetails = buildingDamageReports.length > 0 ? ` damaging defenses by ${buildingDamageReports.length} levels.` : ".";
    state.newsEvents.unshift({
      id: `news_${Math.random().toString(36).substr(2, 9)}`,
      title: combat.winner === "attacker" ? "Base Raided!" : "Raid Defended!",
      content: combat.winner === "attacker" ? `${attacker.username} successfully raided ${defender.username} at [${fleet.targetCoords.x}, ${fleet.targetCoords.y}] taking ${lootSum.toLocaleString()} resources${destructionDetails}` : `${defender.username} repelled a brutal fleet raid sent by ${attacker.username}!`,
      type: "raid",
      timestamp: now
    });
    if (state.newsEvents.length > 50) state.newsEvents = state.newsEvents.slice(0, 50);
    const survivingCount = Object.values(combat.attackerRemaining).reduce((s, v) => s + v, 0);
    if (survivingCount > 0) {
      const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
      const speedLvl = fleet.troopSpeedLevel || 1;
      const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
      const multiplier = 1 + boostPct;
      const slowestTroopSpeed = Object.entries(combat.attackerRemaining).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
        const sp = TROOP_SPECS[tId]?.speed || 50;
        return sp < slowest ? sp : slowest;
      }, 100) * multiplier;
      const travelTimeMs = Math.round(totalDist / slowestTroopSpeed * 6e4);
      remainingFleets.push({
        ...fleet,
        isReturning: true,
        troops: combat.attackerRemaining,
        lootCarried: loot,
        startedAt: now,
        arrivesAt: now + Math.max(1e4, travelTimeMs)
        // 10s floor to make it satisfying
      });
    }
  }
}
function runAISimulatedActivity(now) {
  const players = Object.values(state.players).filter((p) => p.id.startsWith("ai_"));
  if (players.length === 0) return;
  const luckyAI = players[Math.floor(Math.random() * players.length)];
  const actionType = Math.random();
  if (actionType < 0.25) {
  } else if (actionType < 0.45) {
    const defender = players[Math.floor(Math.random() * players.length)];
    if (defender && defender.id !== luckyAI.id) {
      const p = luckyAI.planets[0];
      const targetP = defender.planets[0];
      const missionType = Math.random() > 0.4 ? "attack" : "recon";
      const totalDist = Math.hypot(targetP.sectorX - p.sectorX, targetP.sectorY - p.sectorY);
      const fleetSpeed = missionType === "recon" ? 75 : 40;
      const travelTimeMs = Math.round(totalDist / fleetSpeed * 6e4);
      const mission = {
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
        arrivesAt: now + Math.max(15e3, travelTimeMs),
        // 15s floor
        isReturning: false
      };
      state.fleets.push(mission);
    }
  } else if (actionType < 0.7) {
    const p = luckyAI.planets[0];
    const upgradeBuilding = Math.random() > 0.5;
    if (upgradeBuilding) {
      const bKeys = Object.keys(p.buildings);
      const targetB = bKeys[Math.floor(Math.random() * bKeys.length)];
      if (p.buildings[targetB].level < 15) {
        p.buildings[targetB].level += 1;
        luckyAI.scores.population += 30;
      }
    } else {
      const minesKeys = Object.keys(p.mines);
      const targetRes = minesKeys[Math.floor(Math.random() * minesKeys.length)];
      const mine = p.mines[targetRes][Math.floor(Math.random() * p.mines[targetRes].length)];
      if (mine.level < 15) {
        mine.level += 1;
        luckyAI.scores.population += 10;
      }
    }
  }
}
loadState().then(() => {
  console.log("Game Engine database/file systems synced and initialized!");
}).catch((err) => {
  console.error("Game Engine CRITICAL sync error on startup:", err);
});
setInterval(() => {
  const now = Date.now();
  Object.keys(state.players).forEach((pId) => {
    tickPlayerState(pId, now);
  });
  tickFleets(now);
  if (Math.random() < 0.3) {
    runAISimulatedActivity(now);
  }
}, 4e3);
var activeSseClients = /* @__PURE__ */ new Map();
var firebaseAdminApp = null;
function getFirebaseAdmin() {
  if (firebaseAdminApp) return firebaseAdminApp;
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  try {
    const apps = (0, import_app.getApps)();
    if (apps.length > 0) {
      firebaseAdminApp = apps[0];
      return firebaseAdminApp;
    }
    if (serviceAccountVar) {
      const serviceAccount = JSON.parse(serviceAccountVar);
      firebaseAdminApp = (0, import_app.initializeApp)({
        credential: (0, import_app.cert)(serviceAccount)
      });
      console.log("[Firebase Admin] Initialized with Service Account cert.");
    } else if (projectId) {
      firebaseAdminApp = (0, import_app.initializeApp)({
        projectId
      });
      console.log(`[Firebase Admin] Initialized with Project ID: ${projectId}`);
    } else {
      console.warn("[Firebase Admin] Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID in environment. FCM notifications will be simulated / logged in development.");
    }
  } catch (err) {
    console.error("[Firebase Admin] Error initializing Firebase Admin SDK:", err);
  }
  return firebaseAdminApp;
}
function sendNotificationWithFallback(userId, title, body) {
  const activeSse = activeSseClients.get(userId);
  if (activeSse) {
    console.log(`[Notifications] Active SSE client found for user ${userId}. Dispatching live event.`);
    try {
      activeSse.write(`data: ${JSON.stringify({ title, body, timestamp: Date.now() })}

`);
      return;
    } catch (err) {
      console.warn(`[Notifications] Failed to write to active SSE stream for ${userId}. Connection probably broke. Falling back to FCM.`, err);
      activeSseClients.delete(userId);
    }
  }
  console.log(`[Notifications] User ${userId} has no active real-time SSE stream. Executing FCM push notification fallback...`);
  const player = state.players[userId];
  if (player && player.fcmToken) {
    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const message = {
        token: player.fcmToken,
        notification: {
          title,
          body
        },
        android: {
          priority: "high"
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: "default"
            }
          }
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title,
          body
        }
      };
      const messaging = (0, import_messaging.getMessaging)(adminApp);
      messaging.send(message).then((response) => {
        console.log(`[Notifications] Successfully sent system-level fallback FCM push notification to ${userId}:`, response);
      }).catch((error) => {
        console.error(`[Notifications] FCM delivery failure to ${userId}:`, error);
        if (error.code === "messaging/invalid-registration-token" || error.code === "messaging/registration-token-not-registered") {
          console.log(`[Notifications] Removing invalid FCM registration token for ${userId}`);
          player.fcmToken = void 0;
          saveState();
        }
      });
    } else {
      console.warn(`[Notifications] Push Notification fallback triggered for ${userId}, but firebase-admin is not authenticated. Message text: "${title}: ${body}"`);
    }
  } else {
    console.log(`[Notifications] No registered native FCM Token found for user ${userId}. Fallback push notification cannot be delivered.`);
  }
}
app.post("/api/notifications/register-token", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) {
    return res.status(401).json({ error: "Unauthenticated" });
  }
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Registration token is required" });
  }
  p.fcmToken = token;
  saveState();
  console.log(`[Notifications] Registered native FCM Token for player ${p.username} (${p.id}): ${token.substring(0, 15)}...`);
  res.json({ success: true, message: "Native FCM Registration token stored successfully." });
});
app.get("/api/notifications/stream", (req, res) => {
  const userId = req.query.userId;
  if (!userId || !state.players[userId]) {
    res.status(400).end("Invalid or missing userId query parameter");
    return;
  }
  const p = state.players[userId];
  console.log(`[Notifications] Established active SSE real-time stream for player ${p.username} (${userId})`);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.write(":\n\n");
  activeSseClients.set(userId, res);
  req.on("close", () => {
    console.log(`[Notifications] Active SSE session closed for player ${p.username} (${userId})`);
    activeSseClients.delete(userId);
  });
});
function getLoggedPlayer(req) {
  const userId = req.headers["x-user-id"];
  if (!userId || !state.players[userId]) return null;
  const p = state.players[userId];
  if ((p.credits || 0) < 1e4) {
    p.credits = 1e4;
  }
  return p;
}
app.post("/api/register", (req, res) => {
  const { username, faction, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  const exists = Object.values(state.players).some((p) => p.username.toLowerCase() === username.toLowerCase());
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
  planet.resources.water = 5e6;
  planet.resources.plasma = 5e6;
  planet.resources.fuel = 5e6;
  planet.resources.food = 5e6;
  planet.resources.respirant = 5e6;
  const newPlayer = {
    id,
    username,
    faction: selectFaction,
    factionColor: selectColor,
    allianceId: null,
    allianceRole: null,
    planets: [planet],
    scores: {
      population: 7500,
      // Starting level 15 mine levels * 10 & building levels * 30
      attack: 0,
      defence: 0,
      raiders: 0
    },
    achievements: ["First Mine Started"],
    skinId: "default",
    bannerId: "default",
    lastDailyRewardClaim: Date.now(),
    credits: 1e4,
    password: password || void 0
  };
  state.players[id] = newPlayer;
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "New Commander Active",
    content: `Commander ${username} has joined the ${selectFaction} and landed in Sector [${startX}, ${startY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });
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
  const player = Object.values(state.players).find((p) => p.username.toLowerCase() === username.toLowerCase());
  if (!player) {
    return res.status(404).json({ error: "Commander not found" });
  }
  if (player.password && player.password !== password) {
    return res.status(401).json({ error: "Access denied. Point of entry rejected. Incorrect tactical passkey." });
  }
  res.json({ player });
});
app.post("/api/auth/google", (req, res) => {
  const { email, username, faction } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Google credentials authorization failed. Email is required." });
  }
  let player = Object.values(state.players).find((p) => p.googleEmail?.toLowerCase() === email.toLowerCase());
  if (player) {
    return res.json({ player, isNew: false });
  }
  if (username) {
    player = Object.values(state.players).find((p) => p.username.toLowerCase() === username.toLowerCase());
    if (player) {
      player.googleEmail = email;
      if (!player.achievements.includes("Google Verified Commander")) {
        player.achievements.push("Google Verified Commander");
      }
      saveState();
      return res.json({ player, isNew: false, linked: true });
    }
  }
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
  planet.resources.water = 5e6;
  planet.resources.plasma = 5e6;
  planet.resources.fuel = 5e6;
  planet.resources.food = 5e6;
  planet.resources.respirant = 5e6;
  const newPlayer = {
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
    credits: 1e4,
    googleEmail: email
  };
  state.players[id] = newPlayer;
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Google Commander Registered",
    content: `Commander ${defaultUsername} synced via Google keys and established command in Sector [${startX}, ${startY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });
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
app.post("/api/player/link-google", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Google email is required" });
  }
  const existing = Object.values(state.players).find((other) => other.googleEmail?.toLowerCase() === email.toLowerCase() && other.id !== p.id);
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
app.post("/api/dev/reset-universe", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.googleEmail || p.googleEmail.toLowerCase() !== "banele180@gmail.com") {
    return res.status(403).json({ error: "Access Denied: Server reset is only permitted for the system administrator." });
  }
  bootstrapUniverse();
  saveState();
  res.json({ success: true, message: "Universe successfully reset to initial clean data!" });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});
app.get("/api/state", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const now = Date.now();
  p.lastActive = now;
  tickPlayerState(p.id, now);
  tickFleets(now);
  saveState();
  const myAllianceId = p.allianceId;
  const allianceMemberIds = myAllianceId ? state.alliances[myAllianceId]?.members.map((m) => m.playerId) || [] : [];
  const playersList = Object.values(state.players).map((pl) => ({
    id: pl.id,
    username: pl.username,
    faction: pl.faction,
    factionColor: pl.factionColor,
    allianceId: pl.allianceId,
    allianceRole: pl.allianceRole,
    scores: pl.scores || { population: 0, attack: 0, defence: 0, raiders: 0 },
    achievements: pl.achievements || [],
    planetsCount: pl.planets?.length || 1,
    planets: (pl.planets || []).map((plt) => ({ id: plt.id, name: plt.name, sectorX: plt.sectorX, sectorY: plt.sectorY })),
    lastActive: pl.lastActive || now - 6e5
  }));
  const relevantFleets = state.fleets.filter((f) => {
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
    battleReports: state.battleReports.filter((r) => r.attackerId === p.id || r.defenderId === p.id),
    newsEvents: state.newsEvents,
    playersList,
    serverTime: now,
    customTasks: state.customTasks || {}
  });
});
app.post("/api/upgrade/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, resType, mineIndex, queue: reqQueue } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const fab = planet.buildings.fabricator;
  if (!fab || fab.level < 1) {
    return res.status(400).json({ error: "A Fabricator level 1 or higher is required to construct or upgrade resource extractors." });
  }
  const mines = planet.mines[resType];
  if (!mines || !mines[mineIndex]) return res.status(404).json({ error: "Mine not found" });
  const mine = mines[mineIndex];
  const isBuildingUpgrading = Object.values(planet.buildings).some((b) => b.isUpgrading);
  let isMineUpgrading = false;
  for (const rKey of Object.keys(planet.mines)) {
    if (planet.mines[rKey].some((m) => m.isUpgrading)) {
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
  let queuedCount = 0;
  if (mine.isUpgrading) queuedCount++;
  if (planet.upgradeQueue) {
    queuedCount += planet.upgradeQueue.filter((q) => q.type === "mine" && q.key === resType && q.mineIndex === mineIndex).length;
  }
  const targetLevel = mine.level + queuedCount + 1;
  const planetIndex = p.planets.findIndex((pl) => pl.id === planetId);
  const maxExtractorLevel = planetIndex === 0 ? 25 : planetIndex === 1 ? 20 : 15;
  if (targetLevel > maxExtractorLevel) {
    return res.status(400).json({ error: `Mine reaches max level (${maxExtractorLevel}) for this station.` });
  }
  if (mine.health !== void 0 && mine.health < 100) return res.status(400).json({ error: "Extractor is damaged. Restore it to 100% health first before upgrading." });
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = getUpgradeResourceCost("mine", resType, targetLevel, k);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to upgrade extractor to level ${targetLevel}.` });
    }
  }
  keys.forEach((k) => {
    const cost = getUpgradeResourceCost("mine", resType, targetLevel, k);
    planet.resources[k] -= cost;
  });
  if (shouldQueue) {
    p.credits = Math.max(0, (p.credits || 0) - 15);
    planet.upgradeQueue.push({
      type: "mine",
      key: resType,
      mineIndex,
      targetLevel,
      spaceGoldCost: 15
    });
    saveState();
    return res.json({ player: p, success: true, queued: true });
  } else {
    const durationMs = targetLevel * 60 * 1e3;
    mine.isUpgrading = true;
    mine.upgradeEnd = Date.now() + durationMs;
    saveState();
    return res.json({ player: p, success: true });
  }
});
app.post("/api/upgrade/mine/complete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, resType, mineIndex } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  const mine = planet?.mines[resType]?.[mineIndex];
  if (!mine || !mine.isUpgrading) return res.status(400).json({ error: "Mine is not currently upgrading" });
  mine.level += 1;
  mine.isUpgrading = false;
  mine.upgradeEnd = null;
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/extractor/boost", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const now = Date.now();
  tickPlayerState(p.id, now);
  const { planetId, resType, resourceType, mineIndex, durationDays, targetAll: reqTargetAll } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const finalResourceType = resourceType || resType;
  const targetAll = reqTargetAll || finalResourceType === "all";
  const daysNum = parseInt(durationDays, 10);
  if (daysNum !== 1 && daysNum !== 7 && daysNum !== 30) {
    return res.status(400).json({ error: "Invalid duration select" });
  }
  let cost = 0;
  const boostEndTime = Date.now() + daysNum * 24 * 60 * 60 * 1e3;
  if (targetAll) {
    cost = daysNum === 1 ? 160 : daysNum === 7 ? 1049 : 3999;
  } else {
    cost = daysNum === 1 ? 45 : daysNum === 7 ? 265 : 999;
  }
  if ((p.credits || 0) < cost) {
    return res.status(400).json({ error: "Insufficient Space Gold credits available!" });
  }
  if (targetAll) {
    for (const rType of Object.keys(planet.mines)) {
      for (const m of planet.mines[rType]) {
        m.boostedUntil = boostEndTime;
      }
    }
  } else {
    const mines = planet.mines[finalResourceType];
    if (mines) {
      mines.forEach((m) => {
        m.boostedUntil = boostEndTime;
      });
    }
  }
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/upgrade/building", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, buildingKey, queue: reqQueue } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const building = planet.buildings[buildingKey];
  if (!building) return res.status(404).json({ error: "Building not found" });
  if (buildingKey !== "fabricator" && buildingKey !== "commsHub" && buildingKey !== "repository") {
    const fab = planet.buildings.fabricator;
    if (!fab || fab.level < 1) {
      return res.status(400).json({ error: "A Fabricator level 1 or higher is required to construct or upgrade other modular structures." });
    }
  }
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
  const isBuildingUpgrading = Object.values(planet.buildings).some((b) => b.isUpgrading);
  let isMineUpgrading = false;
  for (const rKey of Object.keys(planet.mines)) {
    if (planet.mines[rKey].some((m) => m.isUpgrading)) {
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
  let queuedCount = 0;
  if (building.isUpgrading) queuedCount++;
  if (planet.upgradeQueue) {
    queuedCount += planet.upgradeQueue.filter((q) => q.type === "building" && q.key === buildingKey).length;
  }
  const targetLevel = building.level + queuedCount + 1;
  if (targetLevel > building.maxLevel) return res.status(400).json({ error: `Building reaches max level (${building.maxLevel})` });
  if (building.health !== void 0 && building.health < 100) return res.status(400).json({ error: "Building is damaged. Restore it to 100% health first before upgrading." });
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = getUpgradeResourceCost("building", buildingKey, targetLevel, k);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to upgrade ${buildingKey} to level ${targetLevel}.` });
    }
  }
  keys.forEach((k) => {
    const cost = getUpgradeResourceCost("building", buildingKey, targetLevel, k);
    planet.resources[k] -= cost;
  });
  if (shouldQueue) {
    p.credits = Math.max(0, (p.credits || 0) - 15);
    planet.upgradeQueue.push({
      type: "building",
      key: buildingKey,
      targetLevel,
      spaceGoldCost: 15
    });
    saveState();
    return res.json({ player: p, success: true, queued: true });
  } else {
    const durationMs = targetLevel * 120 * 1e3;
    building.isUpgrading = true;
    building.upgradeEnd = Date.now() + durationMs;
    saveState();
    return res.json({ player: p, success: true });
  }
});
app.post("/api/upgrade/building/complete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, buildingKey } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  const b = planet ? planet.buildings[buildingKey] : null;
  if (!b || !b.isUpgrading) return res.status(400).json({ error: "Building is not upgrading" });
  b.level += 1;
  b.isUpgrading = false;
  b.upgradeEnd = null;
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/upgrade/research/start", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, techId } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const rc = planet.buildings.researchCenter;
  if (!rc || rc.level < 1) {
    return res.status(400).json({ error: "A Research Center level 1 or higher is required to start research projects." });
  }
  const isBuildingUpgrading = Object.values(planet.buildings).some((b) => b.isUpgrading);
  let isMineUpgrading = false;
  for (const rKey of Object.keys(planet.mines)) {
    if (planet.mines[rKey].some((m) => m.isUpgrading)) {
      isMineUpgrading = true;
      break;
    }
  }
  const isAlreadyUpgrading = isBuildingUpgrading || isMineUpgrading || !!planet.activeResearch;
  if (isAlreadyUpgrading) {
    return res.status(400).json({ error: "Another construction project, extractor upgrade, or research project is already actively in progress on this planet." });
  }
  const currentLvl = Number(req.body.currentLevel) || 0;
  const targetLevel = currentLvl + 1;
  if (targetLevel > 20) {
    return res.status(400).json({ error: "Technology reaches max level (20)." });
  }
  const TECH_BASE_COSTS = {
    defense_shields: { water: 8e3, plasma: 15e3, fuel: 6e3, food: 4e3, respirant: 12e3 },
    manufacturing_speed: { water: 4e3, plasma: 8e3, fuel: 1e4, food: 2e3, respirant: 5e3 },
    troop_speed: { water: 3e3, plasma: 4e3, fuel: 5e3, food: 2e3, respirant: 2e3 }
  };
  const baseCost = TECH_BASE_COSTS[techId];
  if (!baseCost) return res.status(404).json({ error: "Tech not found" });
  const scaleFactor = 1.15;
  const multiplier = Math.pow(scaleFactor, targetLevel - 1);
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = Math.round((baseCost[k] || 0) * multiplier);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to start research.` });
    }
  }
  keys.forEach((k) => {
    const cost = Math.round((baseCost[k] || 0) * multiplier);
    planet.resources[k] -= cost;
  });
  const durationMs = targetLevel * 60 * 1e3;
  planet.activeResearch = {
    techId,
    targetLevel,
    endAt: Date.now() + durationMs
  };
  saveState();
  return res.json({ player: p, success: true });
});
app.post("/api/upgrade/research/queue", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, techId } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const rc = planet.buildings.researchCenter;
  if (!rc || rc.level < 1) {
    return res.status(400).json({ error: "A Research Center level 1 or higher is required to queue research projects." });
  }
  if (!planet.upgradeQueue) {
    planet.upgradeQueue = [];
  }
  if (planet.upgradeQueue.length >= 25) {
    return res.status(400).json({ error: "Upgrade queue is full (max 25 queued upgrades allowed)!" });
  }
  if ((p.credits || 0) < 25) {
    return res.status(400).json({ error: "Insufficient Space Gold credits available! Queuing a research upgrade costs 25 Space Gold." });
  }
  const currentLvl = Number(req.body.currentLevel) || 0;
  let queuedCount = 0;
  if (planet.activeResearch && planet.activeResearch.techId === techId) {
    queuedCount++;
  }
  queuedCount += planet.upgradeQueue.filter((q) => q.type === "research" && q.key === techId).length;
  const targetLevel = currentLvl + queuedCount + 1;
  if (targetLevel > 20) {
    return res.status(400).json({ error: "Technology reaches max level (20)." });
  }
  const TECH_BASE_COSTS = {
    defense_shields: { water: 8e3, plasma: 15e3, fuel: 6e3, food: 4e3, respirant: 12e3 },
    manufacturing_speed: { water: 4e3, plasma: 8e3, fuel: 1e4, food: 2e3, respirant: 5e3 },
    troop_speed: { water: 3e3, plasma: 4e3, fuel: 5e3, food: 2e3, respirant: 2e3 }
  };
  const baseCost = TECH_BASE_COSTS[techId];
  if (!baseCost) return res.status(404).json({ error: "Tech not found" });
  const scaleFactor = 1.15;
  const multiplier = Math.pow(scaleFactor, targetLevel - 1);
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const cost = Math.round((baseCost[k] || 0) * multiplier);
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to queue research upgrade to level ${targetLevel}.` });
    }
  }
  keys.forEach((k) => {
    const cost = Math.round((baseCost[k] || 0) * multiplier);
    planet.resources[k] -= cost;
  });
  p.credits = Math.max(0, (p.credits || 0) - 25);
  planet.upgradeQueue.push({
    type: "research",
    key: techId,
    targetLevel,
    spaceGoldCost: 25
  });
  saveState();
  return res.json({ player: p, success: true });
});
app.post("/api/upgrade/queue/cancel", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, queueIndex } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  if (!planet.upgradeQueue || queueIndex === void 0 || queueIndex < 0 || queueIndex >= planet.upgradeQueue.length) {
    return res.status(400).json({ error: "Invalid queue item index." });
  }
  const [cancelledItem] = planet.upgradeQueue.splice(queueIndex, 1);
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  const repositoryLvl = planet.buildings.repository.level;
  const storageLimit = getRepositoryCapacity(repositoryLvl);
  if (cancelledItem.type === "mine") {
    keys.forEach((k) => {
      const cost = getUpgradeResourceCost("mine", cancelledItem.key, cancelledItem.targetLevel, k);
      planet.resources[k] = Math.min(storageLimit, planet.resources[k] + cost);
    });
  } else if (cancelledItem.type === "building") {
    keys.forEach((k) => {
      const cost = getUpgradeResourceCost("building", cancelledItem.key, cancelledItem.targetLevel, k);
      planet.resources[k] = Math.min(storageLimit, planet.resources[k] + cost);
    });
  } else if (cancelledItem.type === "research") {
    const TECH_BASE_COSTS = {
      defense_shields: { water: 8e3, plasma: 15e3, fuel: 6e3, food: 4e3, respirant: 12e3 },
      manufacturing_speed: { water: 4e3, plasma: 8e3, fuel: 1e4, food: 2e3, respirant: 5e3 },
      troop_speed: { water: 3e3, plasma: 4e3, fuel: 5e3, food: 2e3, respirant: 2e3 }
    };
    const baseCost = TECH_BASE_COSTS[cancelledItem.key];
    if (baseCost) {
      const scaleFactor = 1.15;
      const multiplier = Math.pow(scaleFactor, cancelledItem.targetLevel - 1);
      keys.forEach((k) => {
        const cost = Math.round((baseCost[k] || 0) * multiplier);
        planet.resources[k] = Math.min(storageLimit, planet.resources[k] + cost);
      });
    }
  }
  const goldCost = cancelledItem.spaceGoldCost !== void 0 ? cancelledItem.spaceGoldCost : cancelledItem.type === "research" ? 25 : 15;
  const refundAmount = Math.round(goldCost * 0.6);
  p.credits = (p.credits || 0) + refundAmount;
  state.newsEvents.unshift({
    id: `cancel_${Math.random().toString(36).substring(2, 11)}`,
    title: "Project De-authorization",
    content: `Commander ${p.username} cancelled queued ${cancelledItem.type} upgrade for ${cancelledItem.key} (Lv. ${cancelledItem.targetLevel}). Resources restored. Refunded ${refundAmount} Space Gold.`,
    type: "discovery",
    timestamp: Date.now()
  });
  saveState();
  return res.json({ player: p, success: true });
});
app.post("/api/restore/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, resType, mineIndex } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const mines = planet.mines[resType];
  if (!mines || !mines[mineIndex]) return res.status(404).json({ error: "Mine not found" });
  const mine = mines[mineIndex];
  const currentHealth = mine.health !== void 0 ? mine.health : 100;
  if (currentHealth >= 100) return res.status(400).json({ error: "Extractor is already at 100% health" });
  const targetLevel = mine.level + 1;
  const fractionLost = (100 - currentHealth) / 100;
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const fullCost = getUpgradeResourceCost("mine", resType, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to restore extractor.` });
    }
  }
  keys.forEach((k) => {
    const fullCost = getUpgradeResourceCost("mine", resType, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    planet.resources[k] -= cost;
  });
  mine.health = 100;
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/restore/building", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, buildingKey } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const building = planet.buildings[buildingKey];
  if (!building) return res.status(404).json({ error: "Building not found" });
  const currentHealth = building.health !== void 0 ? building.health : 100;
  if (currentHealth >= 100) return res.status(400).json({ error: "Building is already at 100% health" });
  const targetLevel = building.level + 1;
  const fractionLost = (100 - currentHealth) / 100;
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const fullCost = getUpgradeResourceCost("building", buildingKey, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    if (planet.resources[k] < cost) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${cost} ${k} to restore ${buildingKey}.` });
    }
  }
  keys.forEach((k) => {
    const fullCost = getUpgradeResourceCost("building", buildingKey, targetLevel, k);
    const cost = Math.max(1, Math.round(fullCost * fractionLost));
    planet.resources[k] -= cost;
  });
  building.health = 100;
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/train/troop", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, troopId, manufacturingSpeedLevel } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const specs = TROOP_SPECS[troopId];
  if (!specs) return res.status(404).json({ error: "Troop spec not found" });
  const rawQuantity = req.body.count !== void 0 ? req.body.count : req.body.quantity;
  const count = Math.floor(Number(rawQuantity));
  if (isNaN(count) || count <= 0 || count > 1e3) {
    return res.status(400).json({ error: "Invalid training quantity. Quantity must be a valid number between 1 and 1000." });
  }
  if ((p.credits || 0) < 0) {
    return res.status(400).json({ error: "Insufficient credits. Your commander keys report a negative balance!" });
  }
  const troopCosts = {
    defender: { water: 150, plasma: 0, fuel: 0, food: 200, respirant: 100 },
    attacker: { water: 300, plasma: 450, fuel: 450, food: 300, respirant: 0 },
    tank: { water: 0, plasma: 800, fuel: 1200, food: 0, respirant: 400 },
    looter: { water: 500, plasma: 0, fuel: 200, food: 400, respirant: 0 },
    drone: { water: 1e3, plasma: 1e3, fuel: 1500, food: 0, respirant: 500 },
    settlementShip: { water: 1500, plasma: 1e3, fuel: 2e3, food: 1500, respirant: 1e3 }
  };
  const costMultiplier = count;
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  const currentCosts = troopCosts[troopId];
  for (const k of keys) {
    const required = currentCosts[k] * costMultiplier;
    if (planet.resources[k] < required) {
      return res.status(400).json({ error: `Insufficient ${k}. Need ${required} to train ${count} troops.` });
    }
  }
  const armyBaseLevel = planet.buildings.armyBase?.level || 0;
  const troopLevelLocks = {
    defender: 3,
    // Interceptor
    drone: 6,
    // Missile Launcher
    attacker: 10,
    // Assault Drone
    looter: 15,
    // Matter Extractor
    tank: 19,
    // Disrupter
    settlementShip: 1
    // Settlement Ship
  };
  const requiredLevel = troopLevelLocks[troopId];
  if (requiredLevel !== void 0 && armyBaseLevel < requiredLevel) {
    return res.status(400).json({ error: `Requires War Room Level ${requiredLevel} (Your Level: ${armyBaseLevel}) to produce ${specs.name}!` });
  }
  if (troopId === "settlementShip") {
    const allWarRoomsReached22 = p.planets.every((pl) => (pl.buildings.armyBase?.level || 0) >= 22);
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
    const isAlreadyTraining = planet.trainingQueue.some((item) => item.troopId === "settlementShip");
    if (isAlreadyTraining) {
      return res.status(400).json({ error: "One Settlement Ship is already in the construction queue." });
    }
  }
  keys.forEach((k) => {
    planet.resources[k] -= currentCosts[k] * costMultiplier;
  });
  const baseTimes = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
  const baseSecs = baseTimes[troopId] * count;
  const rcLevel = planet.buildings.researchCenter.level;
  const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
  let buildDurationMs = Math.round(baseSecs * (1 - reductionFrac) * 1e3);
  const mfgLvl = parseInt(String(manufacturingSpeedLevel || 10), 10) || 10;
  const mfgReduction = Math.min(0.35, 0.35 * (mfgLvl / 20));
  buildDurationMs = Math.round(buildDurationMs * (1 - mfgReduction));
  const existingIndex = planet.trainingQueue.findIndex((item) => item.troopId === troopId);
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
app.post("/api/train/troop/complete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, queueIndex } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const queueItem = planet.trainingQueue[queueIndex];
  if (!queueItem) return res.status(404).json({ error: "Queue item not found" });
  planet.troops[queueItem.troopId] += queueItem.count;
  planet.trainingQueue.splice(queueIndex, 1);
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/galaxy/scan", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  ensureMinimumHabitablePlanets();
  saveState();
  const { centerX, centerY, planetId } = req.body;
  const cx = parseInt(String(centerX || 0), 10);
  const cy = parseInt(String(centerY || 0), 10);
  const planet = p.planets.find((pl) => pl.id === planetId);
  const radarLvl = planet?.buildings.radar.level || 1;
  const scanRadius = radarLvl;
  const allTargets = [];
  Object.values(state.players).forEach((player) => {
    player.planets.forEach((pl) => {
      const dist = Math.hypot(pl.sectorX - cx, pl.sectorY - cy);
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
        dist
        // raw distance for sorting
      });
    });
  });
  const hasSettlementShip = p.planets.some((pl) => (pl.troops?.settlementShip || 0) > 0) || state.fleets.some((f) => f.senderId === p.id && (f.troops?.settlementShip || 0) > 0);
  if (state.habitablePlanets) {
    state.habitablePlanets.forEach((hp) => {
      if (hp.isColonized) return;
      const dist = Math.hypot(hp.coords.x - cx, hp.coords.y - cy);
      allTargets.push({
        id: "habitable",
        username: "Uncharted Sector",
        faction: "Habitable Zone",
        factionColor: "#10b981",
        // elegant emerald-green
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
  allTargets.sort((a, b) => a.dist - b.dist);
  const maxScanDist = scanRadius * 10;
  const habTargets = allTargets.filter((t) => t.isHabitable);
  const otherTargets = allTargets.filter((t) => !t.isHabitable);
  let visibleOthers = otherTargets.filter((t) => t.dist <= maxScanDist);
  if (visibleOthers.length < 12) {
    const remainingOthers = otherTargets.filter((t) => !visibleOthers.some((vo) => vo.planetId === t.planetId));
    visibleOthers = [...visibleOthers, ...remainingOthers].slice(0, 15);
  }
  const visibleHabs = habTargets;
  let targets = [...visibleOthers, ...visibleHabs];
  targets.sort((a, b) => a.dist - b.dist);
  res.json({ targets, scanRadius });
});
app.post("/api/galaxy/intelligence", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { targetX, targetY } = req.body;
  const xVal = parseInt(String(targetX), 10);
  const yVal = parseInt(String(targetY), 10);
  if (isNaN(xVal) || isNaN(yVal)) {
    return res.status(400).json({ error: "Invalid target coordinates scanned." });
  }
  if ((p.credits || 0) < 50) {
    return res.status(400).json({ error: "Insufficient Space Gold. Gathering intelligence report requires 50 Space Gold." });
  }
  let targetPlanet = null;
  let targetUser = null;
  Object.values(state.players).forEach((otherPlayer) => {
    otherPlayer.planets.forEach((pl) => {
      if (pl.sectorX === xVal && pl.sectorY === yVal) {
        targetPlanet = pl;
        targetUser = otherPlayer;
      }
    });
  });
  const hasSettlementShip = p.planets.some((pl) => (pl.troops?.settlementShip || 0) > 0) || state.fleets.some((f) => f.senderId === p.id && (f.troops?.settlementShip || 0) > 0);
  let report = null;
  const now = Date.now();
  const reportId = `battle_intel_${Math.random().toString(36).substr(2, 9)}`;
  const isHab = state.habitablePlanets?.find((hp) => hp.coords.x === xVal && hp.coords.y === yVal) || null;
  if (targetPlanet && targetUser) {
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
        water: targetPlanet.mines?.water?.map((m) => m.level) || [],
        plasma: targetPlanet.mines?.plasma?.map((m) => m.level) || [],
        fuel: targetPlanet.mines?.fuel?.map((m) => m.level) || [],
        food: targetPlanet.mines?.food?.map((m) => m.level) || [],
        respirant: targetPlanet.mines?.respirant?.map((m) => m.level) || []
      },
      troops: targetPlanet.troops,
      resources: targetPlanet.resources,
      lastActive: targetUser.lastActive || now - 6e5
    };
  } else {
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
  const persistentReport = {
    id: reportId,
    timestamp: now,
    attackerId: p.id,
    attackerName: p.username,
    defenderId: targetUser ? targetUser.id : "unknown",
    defenderName: targetPlanet ? targetPlanet.name : isHab ? isHab.name : "Deep Space Void",
    defenderLastActive: targetUser ? targetUser.lastActive : void 0,
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
    } : void 0,
    mines: targetPlanet ? {
      water: targetPlanet.mines?.water?.map((m) => m.level) || [],
      plasma: targetPlanet.mines?.plasma?.map((m) => m.level) || [],
      fuel: targetPlanet.mines?.fuel?.map((m) => m.level) || [],
      food: targetPlanet.mines?.food?.map((m) => m.level) || [],
      respirant: targetPlanet.mines?.respirant?.map((m) => m.level) || []
    } : void 0,
    resources: targetPlanet ? targetPlanet.resources : void 0,
    battleRounds: [
      {
        round: 1,
        logs: targetPlanet ? [
          "--- COORDINATE TELEMETRY DECRYPTION ---",
          `Sector [${xVal}, ${yVal}] analyzed successfully.`,
          `Detected station commander: ${targetUser.username}`,
          `Industrial building scans completed.`,
          `Combat garrison scanned successfully.`
        ] : [
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
app.post("/api/fleet/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, missionType, troops, targetId, targetName, targetBuilding, createdFleetId } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  if (isNaN(targetX) || isNaN(targetY)) {
    return res.status(400).json({ error: "Invalid target coordinates. Directives must specify a numeric zone on the coordinate grid." });
  }
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const troopSend = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  let hasTroops = false;
  for (const [tId, countVal] of Object.entries(troops)) {
    const qty = parseInt(countVal, 10) || 0;
    if (qty > 0) {
      if (planet.troops[tId] < qty) {
        return res.status(400).json({ error: `Not enough ${tId} on the Space Station!` });
      }
      troopSend[tId] = qty;
      hasTroops = true;
    }
  }
  if (!hasTroops) return res.status(400).json({ error: "Must dispatch at least 1 troop to launch space fleet." });
  if (missionType === "colonize") {
    if (troopSend.settlementShip !== 1) {
      return res.status(400).json({ error: "You must deploy exactly 1 Settlement Ship to colonize a new planet!" });
    }
    if (p.planets.length >= 10) {
      return res.status(400).json({ error: "Command limits reached. Max 10 colonized colony planets." });
    }
    const targetHabitable = state.habitablePlanets?.find((hp) => hp.coords.x === targetX && hp.coords.y === targetY);
    if (!targetHabitable) {
      return res.status(400).json({ error: "No habitable station or planet detected at these coordinates! Check your radar scanning array." });
    }
    if (targetHabitable.isColonized) {
      return res.status(400).json({ error: "These coordinates have already been colonized by another commander!" });
    }
    const dist2 = Math.hypot(targetX - planet.sectorX, targetY - planet.sectorY);
    const radarLvl = planet.buildings.radar.level;
    const scanRadius = radarLvl * 10;
    if (dist2 > scanRadius) {
      return res.status(400).json({ error: `Habitable planet is outside your active radar scanning radius (Distance: ${dist2.toFixed(1)}, Radius: ${scanRadius})!` });
    }
  }
  if (missionType === "move") {
    const destPlanet = p.planets.find((pl) => pl.sectorX === targetX && pl.sectorY === targetY);
    if (!destPlanet) {
      let isAllianceMemberPlanet = false;
      if (p.allianceId) {
        for (const playerObj of Object.values(state.players)) {
          if (playerObj.allianceId === p.allianceId) {
            const memberPlanet = playerObj.planets.find((pl) => pl.sectorX === targetX && pl.sectorY === targetY);
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
  for (const [tId, qty] of Object.entries(troopSend)) {
    planet.troops[tId] -= qty;
  }
  const dx = targetX - planet.sectorX;
  const dy = targetY - planet.sectorY;
  const dist = Math.hypot(dx, dy);
  const now = Date.now();
  const speedLvl = typeof req.body.troopSpeedLevel === "number" ? req.body.troopSpeedLevel : 1;
  const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
  const speedMultiplier = 1 + boostPct;
  const slowestTroopSpeed = Object.entries(troopSend).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
    const sp = TROOP_SPECS[tId]?.speed || 5;
    return sp < slowest ? sp : slowest;
  }, 100) * speedMultiplier;
  const travelTimeMs = Math.round(dist / slowestTroopSpeed * 6e4);
  let resolvedTargetId = targetId || null;
  let resolvedTargetName = targetName || `Sector [${targetX}, ${targetY}]`;
  if (!resolvedTargetId) {
    for (const playerObj of Object.values(state.players)) {
      const pl = playerObj.planets.find((p2) => p2.sectorX === targetX && p2.sectorY === targetY);
      if (pl) {
        resolvedTargetId = playerObj.id;
        resolvedTargetName = pl.name || `${playerObj.username}'s Station`;
        break;
      }
    }
  }
  if (!resolvedTargetId && state.habitablePlanets) {
    const hp = state.habitablePlanets.find((item) => item.coords.x === targetX && item.coords.y === targetY);
    if (hp) {
      resolvedTargetId = "habitable";
      resolvedTargetName = hp.name;
    }
  }
  const mission = {
    id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
    senderId: p.id,
    senderName: p.username,
    senderCoords: { x: planet.sectorX, y: planet.sectorY },
    targetId: resolvedTargetId,
    targetName: resolvedTargetName,
    targetCoords: { x: targetX, y: targetY },
    missionType,
    troops: troopSend,
    startedAt: now,
    arrivesAt: now + travelTimeMs,
    isReturning: false,
    isWaitingToSettle: false,
    targetBuilding: targetBuilding || void 0,
    troopSpeedLevel: speedLvl,
    createdFleetId: createdFleetId || void 0
  };
  state.fleets.push(mission);
  saveState();
  res.json({ player: p, success: true, fleets: state.fleets });
});
app.post("/api/troops/adjust", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, troopChanges } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  if (!troopChanges || typeof troopChanges !== "object") {
    return res.status(400).json({ error: "Invalid troop changes payload" });
  }
  for (const [tId, change] of Object.entries(troopChanges)) {
    const changeVal = parseInt(String(change), 10) || 0;
    const current = planet.troops[tId] || 0;
    if (current + changeVal < 0) {
      return res.status(400).json({ error: `Not enough ${tId} on the station to fulfill this adjustment!` });
    }
  }
  for (const [tId, change] of Object.entries(troopChanges)) {
    const changeVal = parseInt(String(change), 10) || 0;
    planet.troops[tId] = (planet.troops[tId] || 0) + changeVal;
  }
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/fleet/settle", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { fleetId, customName } = req.body;
  if (!customName || typeof customName !== "string" || !customName.trim()) {
    return res.status(400).json({ error: "A custom colony/station name is required!" });
  }
  const planetName = customName.trim();
  if (planetName.length > 30) {
    return res.status(400).json({ error: "Colony station designation cannot exceed 30 characters" });
  }
  const fleetIndex = state.fleets.findIndex((f) => f.id === fleetId && f.senderId === p.id);
  if (fleetIndex === -1) {
    return res.status(404).json({ error: "Fleet troops not found or not owned by you!" });
  }
  const fleet = state.fleets[fleetIndex];
  if (!fleet.isWaitingToSettle) {
    return res.status(400).json({ error: "This fleet has not arrived at its destination yet!" });
  }
  if (p.planets.length >= 10) {
    return res.status(400).json({ error: "Command limits reached. Max 10 colony planets." });
  }
  const targetX = fleet.targetCoords.x;
  const targetY = fleet.targetCoords.y;
  if (state.habitablePlanets) {
    const hp = state.habitablePlanets.find((item) => item.coords.x === targetX && item.coords.y === targetY);
    if (hp) {
      if (hp.isColonized) {
        const alreadyMine = p.planets.some((pl) => pl.sectorX === targetX && pl.sectorY === targetY);
        if (!alreadyMine) {
          return res.status(400).json({ error: "These coordinates have already been colonized by another commander!" });
        }
      }
      hp.isColonized = true;
    }
  }
  const newPlanet = createInitialPlanet(planetName, targetX, targetY);
  Object.entries(fleet.troops).forEach(([tId, count]) => {
    newPlanet.troops[tId] = count;
  });
  p.planets.push(newPlanet);
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Planet Settled",
    content: `${p.username} has established a new settled research colony at sector [${targetX}, ${targetY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });
  state.fleets.splice(fleetIndex, 1);
  ensureMinimumHabitablePlanets();
  saveState();
  return res.json({ player: p, success: true, fleets: state.fleets });
});
app.post("/api/fleet/reroute", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { fleetId, missionType } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  if (isNaN(targetX) || isNaN(targetY) || targetX < 0 || targetX > 100 || targetY < 0 || targetY > 100) {
    return res.status(400).json({ error: "Invalid target grid coordinates (0-100 allowed)" });
  }
  const fleet = state.fleets.find((f) => f.id === fleetId && f.senderId === p.id);
  if (!fleet) {
    return res.status(404).json({ error: "Active mission fleet not found or not owned by you" });
  }
  let targetId = null;
  let targetName = `Sector [${targetX}, ${targetY}]`;
  let foundTarget = false;
  for (const playerObj of Object.values(state.players)) {
    const pl = playerObj.planets.find((item) => item.sectorX === targetX && item.sectorY === targetY);
    if (pl) {
      targetId = playerObj.id;
      targetName = pl.name || `${playerObj.username}'s Station`;
      foundTarget = true;
      break;
    }
  }
  if (!foundTarget && state.habitablePlanets) {
    const hp = state.habitablePlanets.find((item) => item.coords.x === targetX && item.coords.y === targetY);
    if (hp) {
      targetName = hp.name || `Habitable Sector [${targetX}, ${targetY}]`;
    }
  }
  const dx = targetX - fleet.senderCoords.x;
  const dy = targetY - fleet.senderCoords.y;
  const dist = Math.hypot(dx, dy);
  const speedLvl = fleet.troopSpeedLevel || 1;
  const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
  const speedMultiplier = 1 + boostPct;
  const slowestTroopSpeed = Object.entries(fleet.troops).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
    const sp = TROOP_SPECS[tId]?.speed || 5;
    return sp < slowest ? sp : slowest;
  }, 100) * speedMultiplier;
  const travelTimeMs = Math.round(dist / slowestTroopSpeed * 6e4);
  const now = Date.now();
  fleet.targetId = targetId;
  fleet.targetName = targetName;
  fleet.targetCoords = { x: targetX, y: targetY };
  fleet.isReturning = false;
  fleet.isWaitingToSettle = false;
  if (missionType) {
    fleet.missionType = missionType;
  } else {
    if (fleet.troops.settlementShip > 0) {
      fleet.missionType = "colonize";
    } else if (fleet.troops.drone > 0 && Object.entries(fleet.troops).filter(([tId, q]) => tId !== "drone" && q > 0).length === 0) {
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
  const exists = Object.values(state.players).some(
    (player) => player.id !== p.id && player.username.toLowerCase() === desiredName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "That commander name is already registered in the database!" });
  }
  p.username = desiredName;
  state.players[p.id].username = desiredName;
  if (p.allianceId && state.alliances[p.allianceId]) {
    const alliance = state.alliances[p.allianceId];
    const member = alliance.members.find((m) => m.playerId === p.id);
    if (member) member.username = desiredName;
    if (alliance.leaderId === p.id) alliance.leaderName = desiredName;
  }
  saveState();
  res.json({ player: p, success: true });
});
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
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) {
    return res.status(404).json({ error: "Base planet colony not found" });
  }
  planet.name = targetName;
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/chat/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { channel, content, receiverId } = req.body;
  if (!content) return res.status(400).json({ error: "Message content required" });
  const message = {
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
app.post("/api/alliance/create", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (p.allianceId) return res.status(400).json({ error: "Already member of an Alliance" });
  const maxCommsHubLvl = Math.max(...p.planets.map((pl) => pl.buildings.commsHub?.level || 0));
  if (maxCommsHubLvl < 5) {
    return res.status(400).json({ error: "Creating an Alliance requires Communications Hub Level 5 or higher." });
  }
  const { name, tag, bannerColor, bannerSymbol } = req.body;
  if (!name || !tag) return res.status(400).json({ error: "Alliance Name and Tag required" });
  const exists = Object.values(state.alliances).some((a) => a.name.toLowerCase() === name.toLowerCase() || a.tag.toUpperCase() === tag.toUpperCase());
  if (exists) return res.status(400).json({ error: "Alliance Name or Tag already active." });
  const allianceId = `alliance_${Math.random().toString(36).substr(2, 9)}`;
  const newAlliance = {
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
    bannerSymbol: bannerSymbol || "\u25B2"
  };
  state.alliances[allianceId] = newAlliance;
  p.allianceId = allianceId;
  p.allianceRole = "leader";
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
app.post("/api/alliance/join", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (p.allianceId) return res.status(400).json({ error: "Already registered in an Alliance." });
  const maxCommsHubLvl = Math.max(...p.planets.map((pl) => pl.buildings.commsHub?.level || 0));
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
app.post("/api/alliance/apply", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (p.allianceId) return res.status(400).json({ error: "Already registered in an Alliance." });
  const maxCommsHubLvl = Math.max(...p.planets.map((pl) => pl.buildings.commsHub?.level || 0));
  if (maxCommsHubLvl < 4) {
    return res.status(400).json({ error: "Applying to an Alliance requires Communications Hub Level 4 or higher." });
  }
  const { allianceId } = req.body;
  const alliance = state.alliances[allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });
  if (!alliance.applications) {
    alliance.applications = [];
  }
  const alreadyApplied = alliance.applications.some((app2) => app2.playerId === p.id);
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
  const appIndex = alliance.applications.findIndex((app2) => app2.playerId === targetPlayerId);
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
  alliance.members.push({
    playerId: targetPlayer.id,
    username: targetPlayer.username,
    role: "member"
  });
  targetPlayer.allianceId = alliance.id;
  targetPlayer.allianceRole = "member";
  alliance.applications.splice(appIndex, 1);
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
  const appIndex = alliance.applications.findIndex((app2) => app2.playerId === targetPlayerId);
  if (appIndex !== -1) {
    alliance.applications.splice(appIndex, 1);
  }
  saveState();
  res.json({ player: p, success: true, alliance });
});
app.post("/api/alliance/leave", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });
  const allianceId = p.allianceId;
  const alliance = state.alliances[allianceId];
  if (alliance) {
    if (p.allianceRole === "leader") {
      const otherMembers = alliance.members.filter((m) => m.playerId !== p.id);
      if (otherMembers.length > 0) {
        otherMembers[0].role = "leader";
        alliance.leaderId = otherMembers[0].playerId;
        alliance.leaderName = otherMembers[0].username;
        const nextLeader = state.players[otherMembers[0].playerId];
        if (nextLeader) nextLeader.allianceRole = "leader";
        alliance.members = otherMembers;
      } else {
        delete state.alliances[allianceId];
        Object.values(state.alliances).forEach((a) => {
          a.wars = a.wars.filter((w) => w.targetAllianceId !== allianceId);
        });
      }
    } else {
      alliance.members = alliance.members.filter((m) => m.playerId !== p.id);
    }
  }
  p.allianceId = null;
  p.allianceRole = null;
  saveState();
  res.json({ player: p, success: true });
});
var getRankValue = (role) => {
  if (role === "recruit") return 0;
  if (role === "member") return 1;
  if (role === "officer") return 2;
  if (role === "commander" || role === "leader") return 3;
  return 1;
};
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
  let nextRole = "member";
  if (targetRank === 0) {
    nextRole = "member";
  } else if (targetRank === 1) {
    nextRole = "officer";
  } else if (targetRank === 2 && callerRank === 3) {
    nextRole = "commander";
    p.allianceRole = "officer";
    const callerMember = alliance.members.find((m) => m.playerId === p.id);
    if (callerMember) callerMember.role = "officer";
    alliance.leaderId = targetPlayer.id;
    alliance.leaderName = targetPlayer.username;
  } else {
    return res.status(400).json({ error: "Target cannot be promoted further." });
  }
  targetPlayer.allianceRole = nextRole;
  const targetMember = alliance.members.find((m) => m.playerId === targetPlayerId);
  if (targetMember) targetMember.role = nextRole;
  saveState();
  res.json({ success: true, player: p });
});
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
  let nextRole = "recruit";
  if (targetRank === 2) {
    nextRole = "member";
  } else if (targetRank === 1) {
    nextRole = "recruit";
  }
  targetPlayer.allianceRole = nextRole;
  const targetMember = alliance.members.find((m) => m.playerId === targetPlayerId);
  if (targetMember) targetMember.role = nextRole;
  saveState();
  res.json({ success: true, player: p });
});
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
  targetPlayer.allianceId = null;
  targetPlayer.allianceRole = null;
  alliance.members = alliance.members.filter((m) => m.playerId !== targetPlayerId);
  saveState();
  res.json({ success: true, player: p });
});
app.post("/api/alliance/highlights", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });
  const { highlights } = req.body;
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });
  alliance.highlights = highlights;
  saveState();
  res.json({ success: true, alliance });
});
app.get("/api/alliance/member-reports", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) return res.status(400).json({ error: "Not in an Alliance" });
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });
  const reports = alliance.members.map((mbr) => {
    const pl = state.players[mbr.playerId];
    if (!pl) {
      return {
        playerId: mbr.playerId,
        username: mbr.username,
        role: mbr.role,
        lastActive: Date.now() - 36e5,
        scores: { population: 0, attack: 0, defence: 0, raiders: 0 },
        planets: []
      };
    }
    return {
      playerId: pl.id,
      username: pl.username,
      role: mbr.role,
      lastActive: pl.lastActive || Date.now() - 6e5,
      scores: pl.scores || { population: 0, attack: 0, defence: 0, raiders: 0 },
      achievements: pl.achievements || [],
      planets: pl.planets.map((planet) => ({
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
app.post("/api/resources/send", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { targetId, resources, sourcePlanetId } = req.body;
  const targetX = parseInt(req.body.targetX, 10);
  const targetY = parseInt(req.body.targetY, 10);
  const senderPlanet = p.planets.find((pl) => pl.id === sourcePlanetId) || p.planets[0];
  if (!senderPlanet) {
    return res.status(400).json({ error: "Sender starbase planet configuration mismatch." });
  }
  let targetPlanet = null;
  let targetPlayer = null;
  if (targetId) {
    for (const player of Object.values(state.players)) {
      const pl = player.planets.find((item) => item.id === targetId || player.id === targetId);
      if (pl) {
        targetPlanet = pl;
        targetPlayer = player;
        break;
      }
    }
  } else if (!isNaN(targetX) && !isNaN(targetY)) {
    for (const player of Object.values(state.players)) {
      const pl = player.planets.find((item) => item.sectorX === targetX && item.sectorY === targetY);
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
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  let hasItems = false;
  for (const k of keys) {
    const qty = Math.max(0, parseInt(resources[k], 10) || 0);
    if (qty > 0) {
      if ((senderPlanet.resources[k] || 0) < qty) {
        return res.status(400).json({ error: `Not enough ${k} on your active planetary reserves.` });
      }
      hasItems = true;
    }
  }
  if (!hasItems) {
    return res.status(400).json({ error: "You must specify at least one resource quantity to transmit." });
  }
  keys.forEach((k) => {
    const qty = Math.max(0, parseInt(resources[k], 10) || 0);
    if (qty > 0) {
      senderPlanet.resources[k] -= qty;
      targetPlanet.resources[k] = (targetPlanet.resources[k] || 0) + qty;
    }
  });
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
  const alreadyAtWar = alliance.wars.some((w) => w.targetAllianceId === targetAllianceId);
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
app.post("/api/daily-reward/claim", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const now = Date.now();
  const cooldown = 3600 * 1e3;
  const lastClaim = p.lastDailyRewardClaim || 0;
  if (now - lastClaim < cooldown) {
    const nextClaimTimeStr = new Date(lastClaim + cooldown).toLocaleTimeString();
    return res.status(400).json({ error: `Hourly Supply crates are still on cooldown. Next available at ${nextClaimTimeStr}.` });
  }
  const planet = p.planets[0];
  if (planet) {
    const amount = 8e3;
    const keys = ["water", "plasma", "fuel", "food", "respirant"];
    const cap = getRepositoryCapacity(planet.buildings.repository.level);
    keys.forEach((k) => {
      planet.resources[k] = Math.min(cap, planet.resources[k] + amount);
    });
  }
  p.lastDailyRewardClaim = now;
  saveState();
  res.json({ player: p, s_amount: 8e3, success: true });
});
app.post("/api/tutorial/claim", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { taskId, planetId, allowOverflow } = req.body;
  if (taskId === void 0 || !planetId) {
    return res.status(400).json({ error: "Invalid parameters" });
  }
  const planet = p.planets.find((pl) => pl.id === planetId) || p.planets[0];
  if (!planet) {
    return res.status(404).json({ error: "Colony planet not found" });
  }
  const rewards = {
    1: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 15e3 },
    // Colonize 2nd planet
    2: { water: 10280, plasma: 10180, fuel: 10180, food: 10180, respirant: 10180, credits: 3e3 },
    // Rename Outpost
    3: { water: 10180, plasma: 10180, fuel: 10180, food: 10180, respirant: 10280, credits: 5e3 },
    // Hydrothermal pump Lvl 2
    4: { water: 10180, plasma: 10180, fuel: 10180, food: 10280, respirant: 10180, credits: 4e3 },
    // Air Scrubber Lvl 2
    5: { water: 10180, plasma: 10280, fuel: 10180, food: 10180, respirant: 10180, credits: 4e3 },
    // Food bio-synth Lvl 2
    6: { water: 10150, plasma: 1e4, fuel: 1e4, food: 10200, respirant: 10100, credits: 4e3 },
    // Plasma refinery Lvl 2
    7: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5e3 },
    // Comms Hub Activation
    8: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 6e3 },
    // Expand Repository
    9: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5e3 },
    // Send Resources
    10: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5e3 },
    // Recon fleet
    11: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 7500 },
    // Attack Fleet
    12: { water: 10291, plasma: 10302, fuel: 10302, food: 10302, respirant: 10302, credits: 5e3 },
    // Production boost
    13: { water: 11e3, plasma: 11e3, fuel: 11e3, food: 11e3, respirant: 11e3, credits: 6e3 },
    // Dual boost overdrive
    14: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151, credits: 6e3 },
    // Fabricator Lvl 2
    15: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5005 },
    // Radar Array Lvl 1
    16: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151, credits: 4e3 },
    // Sector scan
    17: { water: 13e3, plasma: 14e3, fuel: 15e3, food: 12e3, respirant: 12e3, credits: 8e3 },
    // Research Center Lvl 1
    18: { water: 12e3, plasma: 12e3, fuel: 12e3, food: 12e3, respirant: 12e3, credits: 6e3 },
    // Metallurgy level 2
    19: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151, credits: 5e3 },
    // Scientific tech research
    20: { water: 12250, plasma: 1e4, fuel: 1e4, food: 13e3, respirant: 11500, credits: 6e3 },
    // War room level 1
    21: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5e3 },
    // Train 15 troops
    22: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5e3 },
    // 5 Interceptors
    23: { water: 12e3, plasma: 12e3, fuel: 12e3, food: 12e3, respirant: 12e3, credits: 6e3 },
    // 2 Bombers
    24: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 3e3 },
    // Private text PM
    25: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 5e3 },
    // Nexus claim
    26: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 7e3 },
    // Star Alliance
    27: { water: 13e3, plasma: 14e3, fuel: 15e3, food: 12e3, respirant: 12e3, credits: 3e3 },
    // Chat broadcast
    28: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 8e3 },
    // Warp thruster research
    29: { water: 11500, plasma: 11e3, fuel: 12e3, food: 11500, respirant: 11e3, credits: 4e3 },
    // Leaderboard payroll audit
    30: { water: 1e4, plasma: 1e4, fuel: 1e4, food: 1e4, respirant: 1e4, credits: 3e4 }
    // Settle 3rd Planet outpost!
  };
  let rawId = taskId;
  if (rawId && typeof rawId === "object") {
    rawId = rawId.id || rawId.taskId || rawId.task || JSON.stringify(rawId);
  }
  let idNum = parseInt(String(rawId), 10);
  if (isNaN(idNum) || !rewards[idNum]) {
    const digits = String(rawId).match(/\d+/);
    if (digits) {
      idNum = parseInt(digits[0], 10);
    }
  }
  console.log(`[Tutorial Claim] Raw taskId:`, taskId, `Parsed idNum:`, idNum);
  if (isNaN(idNum) || !rewards[idNum]) {
    const completed = p.completedTutorialTasks || [];
    for (let i = 1; i <= 30; i++) {
      if (!completed.includes(i)) {
        idNum = i;
        break;
      }
    }
  }
  if (isNaN(idNum) || !rewards[idNum]) {
    idNum = 30;
  }
  const reward = rewards[idNum];
  if (!reward) {
    return res.status(400).json({ error: "Invalid tutorial task ID" });
  }
  if (!p.completedTutorialTasks) {
    p.completedTutorialTasks = [];
  }
  if (p.completedTutorialTasks.includes(idNum)) {
    return res.json({
      success: true,
      player: p,
      message: `Academy reward already claimed on ${planet.name}! Received custom resource crates and Speed Credits.`
    });
  }
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
  p.credits = (p.credits || 0) + reward.credits;
  p.completedTutorialTasks.push(idNum);
  saveState();
  res.json({
    success: true,
    player: p,
    message: `Academy reward claimed on ${planet.name}! Received custom resource crates and +${reward.credits.toLocaleString()} Speed Credits.`
  });
});
app.post("/api/planet/claim-supply-nexus", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
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
  const cooldown = 120 * 1e3;
  const lastClaim = planet.lastSupplyNexusClaim || 0;
  if (now - lastClaim < cooldown) {
    const remainingSeconds = Math.ceil((cooldown - (now - lastClaim)) / 1e3);
    return res.status(400).json({
      error: `Quantum Supply Nexus is recharging. Portal stabilization completes in ${remainingSeconds} seconds.`
    });
  }
  const qtyPerResource = level * 2e4;
  const totalVolume = qtyPerResource * 5;
  const storageLimit = getRepositoryCapacity(planet.buildings.repository.level);
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  keys.forEach((k) => {
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
  const validTiers = [
    { amount: 1500, label: "Bronze Cargo Carrier" },
    { amount: 6e3, label: "Commander's Tactical Cache" },
    { amount: 25e3, label: "Supreme Emperor's Core Vault" }
  ];
  const matchedTier = validTiers.find((t) => t.amount === amount && t.label === tierLabel);
  if (!matchedTier) {
    console.warn(`[Security Blocked] Unverified credit tier purchase attempted by user ${p.id}: amount=${amount}, label=${tierLabel}`);
    return res.status(400).json({ error: "Purchase verification failed: unauthorized credit tier allocation attempt blocked." });
  }
  if (p.credits === void 0) {
    p.credits = 1250;
  }
  p.credits += matchedTier.amount;
  state.newsEvents.unshift({
    id: `credit_${Math.random().toString(36).substr(2, 9)}`,
    title: "Galactic Funding Secured",
    content: `Commander ${p.username} authorized security transmission of +${matchedTier.amount.toLocaleString()} Galactic Credits under [${matchedTier.label}].`,
    type: "discovery",
    timestamp: Date.now()
  });
  saveState();
  res.json({ player: p, success: true });
});
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
  const newMessage = {
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
  if (!p.commandMessages) {
    p.commandMessages = [];
  }
  const sentCopy = {
    ...newMessage,
    isSent: true,
    isRead: true
    // Sender has already read their own sent message
  };
  p.commandMessages.push(sentCopy);
  sendNotificationWithFallback(
    receiver.id,
    "\u{1F4EC} New Secure Message",
    `Commander ${p.username} sent you a message: ${content.trim().substring(0, 60)}${content.trim().length > 60 ? "..." : ""}`
  );
  saveState();
  res.json({ success: true, message: "Holographic command transmission dispatched!" });
});
app.post("/api/messages/mark-read", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { messageId, isRead } = req.body;
  if (!messageId) return res.status(400).json({ error: "Transmission ID required" });
  if (!p.commandMessages) p.commandMessages = [];
  const msg = p.commandMessages.find((m) => m.id === messageId);
  if (msg) {
    msg.isRead = isRead !== void 0 ? isRead : true;
    saveState();
  }
  res.json({ success: true, player: p });
});
app.post("/api/messages/save", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { messageId, isSaved } = req.body;
  if (!messageId) return res.status(400).json({ error: "Transmission ID required" });
  if (!p.commandMessages) p.commandMessages = [];
  const msg = p.commandMessages.find((m) => m.id === messageId);
  if (msg) {
    msg.isSaved = isSaved !== void 0 ? isSaved : true;
    saveState();
  }
  res.json({ success: true, player: p });
});
app.post("/api/messages/delete", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { messageId } = req.body;
  if (!messageId) return res.status(400).json({ error: "Transmission ID required" });
  if (!p.commandMessages) p.commandMessages = [];
  p.commandMessages = p.commandMessages.filter((m) => m.id !== messageId);
  saveState();
  res.json({ success: true, player: p });
});
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
    senderEmail: p && p.googleEmail ? p.googleEmail : p ? "Local Account" : "Anonymous",
    content: content.trim(),
    category: category || "other",
    timestamp: Date.now()
  };
  state.feedbacks.push(newFeedback);
  saveState();
  res.json({ success: true, message: "Holographic telemetry transmission received by Segment Headquarters." });
});
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
app.get("/api/admin/tasks", (req, res) => {
  if (!state.customTasks) {
    state.customTasks = {};
  }
  res.json({ success: true, customTasks: state.customTasks });
});
app.post("/api/admin/update-task", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && p.googleEmail.toLowerCase() === "banele180@gmail.com";
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  const { taskId, title, shortDesc, requirementHtml, hint, howToGetThere, commanderTip, congratsMessage, encouragementQuote } = req.body;
  if (!taskId) {
    return res.status(400).json({ error: "Task ID is required." });
  }
  if (!state.customTasks) {
    state.customTasks = {};
  }
  state.customTasks[taskId] = {
    title,
    shortDesc,
    requirementHtml,
    hint,
    howToGetThere,
    commanderTip,
    congratsMessage,
    encouragementQuote
  };
  saveState();
  res.json({ success: true, message: `Task ${taskId} text successfully updated for the whole game!`, customTasks: state.customTasks });
});
app.post("/api/admin/pm2-flush", (req, res) => {
  const p = getLoggedPlayer(req);
  const bodyEmail = req.body?.email || req.query?.email || req.headers["x-admin-email"];
  const isEmailOwner = p && p.googleEmail && p.googleEmail.toLowerCase() === "banele180@gmail.com" || typeof bodyEmail === "string" && bodyEmail.toLowerCase() === "banele180@gmail.com";
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  console.log("[PM2 EMERGENCY RELOAD] Received command from authorized admin. Executing 'pm2 restart all --update-env'...");
  (0, import_child_process.exec)("pm2 restart all --update-env", (error, stdout, stderr) => {
    if (error) {
      console.error(`[PM2 EMERGENCY RELOAD ERROR] ${error.message}`);
      return res.status(500).json({
        success: false,
        error: "PM2 execution failed",
        details: error.message,
        stderr
      });
    }
    console.log(`[PM2 EMERGENCY RELOAD SUCCESS] stdout: ${stdout}`);
    res.json({
      success: true,
      message: "Emergency programmatic reload completed. All PM2 processes restarted with updated environment variables.",
      stdout,
      stderr
    });
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Universe active. Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("CRITICAL: Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
