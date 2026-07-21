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
var import_auth = require("firebase-admin/auth");

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
  const cost = Math.round(baseCost * weights[resKey]);
  if (type === "mine") {
    return Math.round(cost * 3.25);
  } else {
    return Math.round(cost * 5);
  }
}
function getTaskResourceCost(taskId) {
  const defaultCost = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
  switch (taskId) {
    case 1:
      return {
        water: getUpgradeResourceCost("building", "fabricator", 1, "water"),
        plasma: getUpgradeResourceCost("building", "fabricator", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "fabricator", 1, "fuel"),
        food: getUpgradeResourceCost("building", "fabricator", 1, "food"),
        respirant: getUpgradeResourceCost("building", "fabricator", 1, "respirant")
      };
    case 2:
      return {
        water: getUpgradeResourceCost("mine", "water", 1, "water"),
        plasma: getUpgradeResourceCost("mine", "plasma", 1, "plasma"),
        fuel: getUpgradeResourceCost("mine", "fuel", 1, "fuel"),
        food: getUpgradeResourceCost("mine", "food", 1, "food"),
        respirant: getUpgradeResourceCost("mine", "respirant", 1, "respirant")
      };
    case 3:
      return {
        water: getUpgradeResourceCost("building", "commsHub", 1, "water"),
        plasma: getUpgradeResourceCost("building", "commsHub", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "commsHub", 1, "fuel"),
        food: getUpgradeResourceCost("building", "commsHub", 1, "food"),
        respirant: getUpgradeResourceCost("building", "commsHub", 1, "respirant")
      };
    case 4:
      return {
        water: getUpgradeResourceCost("building", "repository", 1, "water"),
        plasma: getUpgradeResourceCost("building", "repository", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "repository", 1, "fuel"),
        food: getUpgradeResourceCost("building", "repository", 1, "food"),
        respirant: getUpgradeResourceCost("building", "repository", 1, "respirant")
      };
    case 5:
      return {
        water: getUpgradeResourceCost("building", "fabricator", 2, "water"),
        plasma: getUpgradeResourceCost("building", "fabricator", 2, "plasma"),
        fuel: getUpgradeResourceCost("building", "fabricator", 2, "fuel"),
        food: getUpgradeResourceCost("building", "fabricator", 2, "food"),
        respirant: getUpgradeResourceCost("building", "fabricator", 2, "respirant")
      };
    case 6:
      return {
        water: getUpgradeResourceCost("building", "radar", 1, "water"),
        plasma: getUpgradeResourceCost("building", "radar", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "radar", 1, "fuel"),
        food: getUpgradeResourceCost("building", "radar", 1, "food"),
        respirant: getUpgradeResourceCost("building", "radar", 1, "respirant")
      };
    case 7:
      return defaultCost;
    case 8:
      return {
        water: getUpgradeResourceCost("mine", "water", 2, "water") * 2,
        plasma: getUpgradeResourceCost("mine", "plasma", 2, "plasma") * 2,
        fuel: getUpgradeResourceCost("mine", "fuel", 2, "fuel") * 2,
        food: getUpgradeResourceCost("mine", "food", 2, "food") * 2,
        respirant: getUpgradeResourceCost("mine", "respirant", 2, "respirant") * 2
      };
    case 9:
      return {
        water: getUpgradeResourceCost("building", "fabricator", 4, "water"),
        plasma: getUpgradeResourceCost("building", "fabricator", 4, "plasma"),
        fuel: getUpgradeResourceCost("building", "fabricator", 4, "fuel"),
        food: getUpgradeResourceCost("building", "fabricator", 4, "food"),
        respirant: getUpgradeResourceCost("building", "fabricator", 4, "respirant")
      };
    case 10:
      return {
        water: getUpgradeResourceCost("building", "commsHub", 2, "water"),
        plasma: getUpgradeResourceCost("building", "commsHub", 2, "plasma"),
        fuel: getUpgradeResourceCost("building", "commsHub", 2, "fuel"),
        food: getUpgradeResourceCost("building", "commsHub", 2, "food"),
        respirant: getUpgradeResourceCost("building", "commsHub", 2, "respirant")
      };
    case 11:
      return {
        water: getUpgradeResourceCost("building", "researchCenter", 1, "water"),
        plasma: getUpgradeResourceCost("building", "researchCenter", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "researchCenter", 1, "fuel"),
        food: getUpgradeResourceCost("building", "researchCenter", 1, "food"),
        respirant: getUpgradeResourceCost("building", "researchCenter", 1, "respirant")
      };
    case 12:
      return { water: 3e3, plasma: 4e3, fuel: 5e3, food: 2e3, respirant: 2e3 };
    case 13:
      return { water: 3e3, plasma: 4e3, fuel: 5e3, food: 2e3, respirant: 2e3 };
    case 14:
      return {
        water: getUpgradeResourceCost("building", "researchCenter", 2, "water"),
        plasma: getUpgradeResourceCost("building", "researchCenter", 2, "plasma"),
        fuel: getUpgradeResourceCost("building", "researchCenter", 2, "fuel"),
        food: getUpgradeResourceCost("building", "researchCenter", 2, "food"),
        respirant: getUpgradeResourceCost("building", "researchCenter", 2, "respirant")
      };
    case 15:
      return { water: 4600, plasma: 9200, fuel: 11500, food: 2300, respirant: 5750 };
    case 16:
      return {
        water: getUpgradeResourceCost("mine", "water", 3, "water") * 2,
        plasma: getUpgradeResourceCost("mine", "plasma", 3, "plasma") * 2,
        fuel: getUpgradeResourceCost("mine", "fuel", 3, "fuel") * 2,
        food: getUpgradeResourceCost("mine", "food", 3, "food") * 2,
        respirant: getUpgradeResourceCost("mine", "respirant", 3, "respirant") * 2
      };
    case 17:
      return {
        water: getUpgradeResourceCost("building", "fabricator", 7, "water"),
        plasma: getUpgradeResourceCost("building", "fabricator", 7, "plasma"),
        fuel: getUpgradeResourceCost("building", "fabricator", 7, "fuel"),
        food: getUpgradeResourceCost("building", "fabricator", 7, "food"),
        respirant: getUpgradeResourceCost("building", "fabricator", 7, "respirant")
      };
    case 18:
      return {
        water: getUpgradeResourceCost("building", "commsHub", 3, "water"),
        plasma: getUpgradeResourceCost("building", "commsHub", 3, "plasma"),
        fuel: getUpgradeResourceCost("building", "commsHub", 3, "fuel"),
        food: getUpgradeResourceCost("building", "commsHub", 3, "food"),
        respirant: getUpgradeResourceCost("building", "commsHub", 3, "respirant")
      };
    case 19:
      return {
        water: getUpgradeResourceCost("building", "radar", 2, "water"),
        plasma: getUpgradeResourceCost("building", "radar", 2, "plasma"),
        fuel: getUpgradeResourceCost("building", "radar", 2, "fuel"),
        food: getUpgradeResourceCost("building", "radar", 2, "food"),
        respirant: getUpgradeResourceCost("building", "radar", 2, "respirant")
      };
    case 20:
      return {
        water: getUpgradeResourceCost("building", "armyBase", 1, "water"),
        plasma: getUpgradeResourceCost("building", "armyBase", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "armyBase", 1, "fuel"),
        food: getUpgradeResourceCost("building", "armyBase", 1, "food"),
        respirant: getUpgradeResourceCost("building", "armyBase", 1, "respirant")
      };
    case 21:
      return { water: 750, plasma: 0, fuel: 0, food: 1e3, respirant: 500 };
    case 22:
      return { water: 600, plasma: 900, fuel: 900, food: 600, respirant: 0 };
    case 23:
      return defaultCost;
    case 24:
      return defaultCost;
    case 25:
      return defaultCost;
    case 26:
      return {
        water: getUpgradeResourceCost("building", "repository", 5, "water"),
        plasma: getUpgradeResourceCost("building", "repository", 5, "plasma"),
        fuel: getUpgradeResourceCost("building", "repository", 5, "fuel"),
        food: getUpgradeResourceCost("building", "repository", 5, "food"),
        respirant: getUpgradeResourceCost("building", "repository", 5, "respirant")
      };
    case 27:
      return {
        water: getUpgradeResourceCost("building", "fabricator", 10, "water"),
        plasma: getUpgradeResourceCost("building", "fabricator", 10, "plasma"),
        fuel: getUpgradeResourceCost("building", "fabricator", 10, "fuel"),
        food: getUpgradeResourceCost("building", "fabricator", 10, "food"),
        respirant: getUpgradeResourceCost("building", "fabricator", 10, "respirant")
      };
    case 28:
      return {
        water: getUpgradeResourceCost("building", "armyBase", 2, "water"),
        plasma: getUpgradeResourceCost("building", "armyBase", 2, "plasma"),
        fuel: getUpgradeResourceCost("building", "armyBase", 2, "fuel"),
        food: getUpgradeResourceCost("building", "armyBase", 2, "food"),
        respirant: getUpgradeResourceCost("building", "armyBase", 2, "respirant")
      };
    case 29:
      return {
        water: getUpgradeResourceCost("building", "researchCenter", 3, "water"),
        plasma: getUpgradeResourceCost("building", "researchCenter", 3, "plasma"),
        fuel: getUpgradeResourceCost("building", "researchCenter", 3, "fuel"),
        food: getUpgradeResourceCost("building", "researchCenter", 3, "food"),
        respirant: getUpgradeResourceCost("building", "researchCenter", 3, "respirant")
      };
    case 30:
      return {
        water: getUpgradeResourceCost("building", "bunker", 1, "water"),
        plasma: getUpgradeResourceCost("building", "bunker", 1, "plasma"),
        fuel: getUpgradeResourceCost("building", "bunker", 1, "fuel"),
        food: getUpgradeResourceCost("building", "bunker", 1, "food"),
        respirant: getUpgradeResourceCost("building", "bunker", 1, "respirant")
      };
    case 31:
      return { water: 1500, plasma: 1e3, fuel: 1500, food: 1e3, respirant: 1e3 };
    case 32:
      return { water: 5e3, plasma: 5e3, fuel: 1e4, food: 5e3, respirant: 5e3 };
    default:
      return defaultCost;
  }
}
function getTaskResourceReward(taskId) {
  const nextTaskId = taskId + 1;
  const nextTaskCost = nextTaskId <= 32 ? getTaskResourceCost(nextTaskId) : { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
  return {
    water: nextTaskCost.water + 5e3,
    plasma: nextTaskCost.plasma + 5e3,
    fuel: nextTaskCost.fuel + 5e3,
    food: nextTaskCost.food + 5e3,
    respirant: nextTaskCost.respirant + 5e3
  };
}

// antiCheat.ts
var import_ioredis = __toESM(require("ioredis"), 1);
var localCache = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of localCache.entries()) {
    if (now - val > 15e3) {
      localCache.delete(key);
    }
  }
}, 3e4);
var isRedisHealthy = false;
var redis = new import_ioredis.default({
  host: "note-believe-rosegold-84519.db.redis.io",
  port: 14372,
  password: "i73aF6P0isDnIWJTBq4X9Rw1oANUV9Ie",
  lazyConnect: true,
  // Non-blocking lazy connection
  maxRetriesPerRequest: 1,
  // Fail fast on requests if connection drops
  connectTimeout: 1500,
  // Timeout connection after 1.5 seconds
  enableOfflineQueue: false,
  // DO NOT queue commands when connection is down - fail fast
  retryStrategy(times) {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 200, 1e3);
  }
});
redis.on("connect", () => {
  console.log("Connecting to Cloud Redis...");
});
redis.on("ready", () => {
  isRedisHealthy = true;
  console.log("Successfully connected and ready on Cloud Redis database.");
});
redis.on("error", (error) => {
  isRedisHealthy = false;
  console.warn("Cloud Redis is offline (using high-performance in-memory fallback):", error.message);
});
redis.on("close", () => {
  isRedisHealthy = false;
});
redis.on("end", () => {
  isRedisHealthy = false;
  console.log("Redis connection retry attempts exhausted. Operating permanently in-memory fallback mode.");
});
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Redis operation timeout after ${timeoutMs}ms`)), timeoutMs))
  ]);
}
async function checkSpeedHack(userId, actionPath, minIntervalMs = 150) {
  const redisKey = `anticheat:speed:${userId}:${actionPath}`;
  const now = Date.now();
  if (!isRedisHealthy || redis.status !== "ready") {
    const lastTime = localCache.get(redisKey);
    if (lastTime) {
      const diff = now - lastTime;
      if (diff < minIntervalMs) {
        console.warn(`[Anti-Speed-Hack] [Local Cache] Blocked rapid request from user ${userId} on ${actionPath} (Interval: ${diff}ms)`);
        return false;
      }
    }
    localCache.set(redisKey, now);
    return true;
  }
  try {
    const lastTimeStr = await withTimeout(redis.get(redisKey), 400);
    if (lastTimeStr) {
      const lastTime = parseInt(lastTimeStr, 10);
      const diff = now - lastTime;
      if (diff < minIntervalMs) {
        console.warn(`[Anti-Speed-Hack] Cloud Redis blocked rapid request from user ${userId} on ${actionPath} (Interval: ${diff}ms)`);
        return false;
      }
    }
    await withTimeout(redis.set(redisKey, now.toString(), "PX", 5e3), 400);
    localCache.set(redisKey, now);
    return true;
  } catch (err) {
    isRedisHealthy = false;
    const lastTime = localCache.get(redisKey);
    if (lastTime) {
      const diff = now - lastTime;
      if (diff < minIntervalMs) {
        return false;
      }
    }
    localCache.set(redisKey, now);
    return true;
  }
}

// server.ts
var import_google_auth_library = require("google-auth-library");
var app = (0, import_express.default)();
var PORT = 3e3;
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
app.use("/api", async (req, res, next) => {
  try {
    if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
      const apiPath = (req.path || "").toLowerCase();
      if (apiPath.includes("/login") || apiPath.includes("/register") || apiPath.includes("/auth/google") || apiPath.includes("/notifications/register-token")) {
        return next();
      }
      const userId = req.headers["x-user-id"];
      if (userId) {
        const isValid = await checkSpeedHack(userId, apiPath, 150);
        if (!isValid) {
          return res.status(429).json({
            error: "Quantum anti-speed-hack mechanism active: Request rate exceeds safety parameters. Action blocked.",
            success: false
          });
        }
      }
    }
    next();
  } catch (err) {
    console.error("Anti-cheat middleware validation failed, bypassing to ensure service availability:", err);
    next();
  }
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
    { id: "hab_34_22", name: "Habitable Station Kepler-Prime", coords: { x: 34, y: 22 }, isColonized: false },
    { id: "hab_25_19", name: "Habitable Outpost Gliese-91", coords: { x: 25, y: 19 }, isColonized: false },
    { id: "hab_17_32", name: "Habitable Station New Hope", coords: { x: 17, y: 32 }, isColonized: false },
    { id: "hab_15_25", name: "Habitable Planet Epsilon-D", coords: { x: 15, y: 25 }, isColonized: false },
    { id: "hab_35_14", name: "Habitable Station Zephyr-9", coords: { x: 35, y: 14 }, isColonized: false },
    { id: "hab_22_33", name: "Habitable Planet Arcadia", coords: { x: 22, y: 33 }, isColonized: false },
    { id: "hab_29_31", name: "Habitable Core Dome-A", coords: { x: 29, y: 31 }, isColonized: false },
    { id: "hab_13_25", name: "Habitable Station Oasis-1", coords: { x: 13, y: 25 }, isColonized: false },
    { id: "hab_31_35", name: "Habitable Planet Eden-X", coords: { x: 31, y: 35 }, isColonized: false },
    { id: "hab_8_32", name: "Habitable Outpost Genesis", coords: { x: 8, y: 32 }, isColonized: false },
    { id: "hab_35_35", name: "Habitable Station Midway", coords: { x: 35, y: 35 }, isColonized: false }
  ]
};
function initializeGalaxyConfig() {
  if (!state) return;
  if (!state.galaxyConfig) {
    state.galaxyConfig = {
      initialGalaxySize: 15,
      reservedCenterSector: { x: 7, y: 7 },
      initialColonizationZoneSize: 7,
      spawnDistance: 2,
      zoneGrowthOccupancyThreshold: 0.5,
      // default 50% occupancy to grow zone
      galaxyOccupancyThreshold: 0.7,
      // default 70% occupancy to expand map
      expansionIncrement: 5,
      currentGalaxySize: 15,
      currentColonizationZoneSize: 7
    };
  }
  if (!state.galaxyConfig.currentGalaxySize) {
    state.galaxyConfig.currentGalaxySize = state.galaxyConfig.initialGalaxySize || 15;
  }
  if (!state.galaxyConfig.currentColonizationZoneSize) {
    state.galaxyConfig.currentColonizationZoneSize = state.galaxyConfig.initialColonizationZoneSize || 7;
  }
  if (!state.galaxyConfig.reservedCenterSector) {
    const size = state.galaxyConfig.currentGalaxySize;
    state.galaxyConfig.reservedCenterSector = {
      x: Math.floor(size / 2),
      y: Math.floor(size / 2)
    };
  }
}
function checkAndExpandGalaxy() {
  initializeGalaxyConfig();
  const config = state.galaxyConfig;
  const currentMapSize = config.currentGalaxySize || 15;
  let zoneSize = config.currentColonizationZoneSize || config.initialColonizationZoneSize || 7;
  if (zoneSize < currentMapSize) {
    const cx = config.reservedCenterSector ? config.reservedCenterSector.x : Math.floor(currentMapSize / 2);
    const cy = config.reservedCenterSector ? config.reservedCenterSector.y : Math.floor(currentMapSize / 2);
    const halfSize = Math.floor(zoneSize / 2);
    const minX = Math.max(0, cx - halfSize);
    const maxX = Math.min(currentMapSize - 1, cx + halfSize);
    const minY = Math.max(0, cy - halfSize);
    const maxY = Math.min(currentMapSize - 1, cy + halfSize);
    let occupiedCount = 0;
    if (state.players) {
      for (const player of Object.values(state.players)) {
        if (player && player.planets) {
          for (const pl of player.planets) {
            if (pl.sectorX >= minX && pl.sectorX <= maxX && pl.sectorY >= minY && pl.sectorY <= maxY) {
              occupiedCount++;
            }
          }
        }
      }
    }
    const totalSectorsInZone = zoneSize * zoneSize - 1;
    const zoneOccupancy = totalSectorsInZone > 0 ? occupiedCount / totalSectorsInZone : 0;
    const zoneThreshold = config.zoneGrowthOccupancyThreshold !== void 0 ? config.zoneGrowthOccupancyThreshold : 0.5;
    if (zoneOccupancy >= zoneThreshold) {
      const nextZoneSize = zoneSize + 2;
      config.currentColonizationZoneSize = Math.min(nextZoneSize, currentMapSize);
      console.log(`[Colonization Zone grew] Size grew from ${zoneSize}x${zoneSize} to ${config.currentColonizationZoneSize}x${config.currentColonizationZoneSize} (Occupancy: ${(zoneOccupancy * 100).toFixed(1)}% >= ${(zoneThreshold * 100).toFixed(1)}%)`);
      saveState();
      zoneSize = config.currentColonizationZoneSize;
    }
  }
  let totalBases = 0;
  if (state.players) {
    for (const player of Object.values(state.players)) {
      totalBases += player.planets?.length || 0;
    }
  }
  const totalGalaxySectors = currentMapSize * currentMapSize - 1;
  const galaxyOccupancy = totalGalaxySectors > 0 ? totalBases / totalGalaxySectors : 0;
  const galaxyThreshold = config.galaxyOccupancyThreshold !== void 0 ? config.galaxyOccupancyThreshold : 0.7;
  if (galaxyOccupancy >= galaxyThreshold) {
    const increment = config.expansionIncrement || 5;
    const oldSize = currentMapSize;
    const newSize = currentMapSize + increment;
    config.currentGalaxySize = newSize;
    if (zoneSize >= oldSize) {
      config.currentColonizationZoneSize = newSize;
    }
    console.log(`[GALAXY EXPANSION] Universe expanded from ${oldSize}x${oldSize} to ${newSize}x${newSize}! Occupancy was ${(galaxyOccupancy * 100).toFixed(1)}% >= ${(galaxyThreshold * 100).toFixed(1)}%`);
    const BROADCAST_TEMPLATES = [
      "GALACTIC COMMAND\n\nLong-range sensor arrays have successfully mapped new regions beyond the known frontier. Navigation systems have been updated. Previously unreachable sectors are now open for exploration.",
      "GALACTIC COMMAND\n\nCenturies of research have culminated in a breakthrough in deep-space navigation. New sectors have been charted and are now available for colonization.",
      "GALACTIC COMMAND\n\nExploration fleets have returned with confirmed hyperspace routes beyond the current frontier. Galactic Command authorizes expansion into newly discovered space.",
      "GALACTIC COMMAND\n\nOur civilizations have reached another milestone in interstellar exploration. Additional sectors have been integrated into the Galactic Navigation Network.",
      "GALACTIC COMMAND\n\nAdvanced radar arrays have extended humanity's vision deeper into the galaxy. Frontier sectors are now accessible to all commanders."
    ];
    const randomMsg = BROADCAST_TEMPLATES[Math.floor(Math.random() * BROADCAST_TEMPLATES.length)];
    if (!state.chatMessages) {
      state.chatMessages = [];
    }
    state.chatMessages.push({
      id: `chat_expansion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      channel: "global",
      senderId: "system",
      senderName: "GALACTIC COMMAND",
      senderFaction: "System",
      senderFactionColor: "#F1C40F",
      allianceTag: "GAL",
      receiverId: null,
      content: randomMsg,
      timestamp: Date.now()
    });
    if (state.chatMessages.length > 200) {
      state.chatMessages.shift();
    }
    if (!state.newsEvents) {
      state.newsEvents = [];
    }
    state.newsEvents.push({
      id: `news_expansion_${Date.now()}`,
      title: "\u{1F30C} New Frontiers Charted!",
      content: `Galactic Command has expanded the known sector coordinates to ${newSize}x${newSize} space. High-resolution navigation channels are now online!`,
      type: "system",
      timestamp: Date.now()
    });
    saveState();
  }
}
function getCurrentMapLimits() {
  initializeGalaxyConfig();
  checkAndExpandGalaxy();
  const currentMapSize = state.galaxyConfig?.currentGalaxySize || 15;
  return currentMapSize - 1;
}
function getRandomCoordinates(maxCoord) {
  const margin = maxCoord <= 20 ? 1 : 5;
  const range = maxCoord - margin * 2;
  if (range <= 0) {
    return {
      x: Math.floor(Math.random() * maxCoord),
      y: Math.floor(Math.random() * maxCoord)
    };
  }
  const x = Math.floor(Math.random() * range) + margin;
  const y = Math.floor(Math.random() * range) + margin;
  return { x, y };
}
function getPlayerSpawnCoordinates(maxCoord) {
  initializeGalaxyConfig();
  const config = state.galaxyConfig;
  const currentMapSize = maxCoord + 1;
  const cx = config.reservedCenterSector ? config.reservedCenterSector.x : Math.floor(currentMapSize / 2);
  const cy = config.reservedCenterSector ? config.reservedCenterSector.y : Math.floor(currentMapSize / 2);
  const zoneSize = config.currentColonizationZoneSize || config.initialColonizationZoneSize || 7;
  const halfSize = Math.floor(zoneSize / 2);
  const minX = Math.max(0, cx - halfSize);
  const maxX = Math.min(maxCoord, cx + halfSize);
  const minY = Math.max(0, cy - halfSize);
  const maxY = Math.min(maxCoord, cy + halfSize);
  const rangeX = maxX - minX + 1;
  const rangeY = maxY - minY + 1;
  const x = Math.floor(Math.random() * rangeX) + minX;
  const y = Math.floor(Math.random() * rangeY) + minY;
  return { x, y };
}
function findClusterCoordinate(targetX, targetY) {
  const limit = getCurrentMapLimits();
  for (let d = 0; d < 100; d++) {
    for (let dx = -d; dx <= d; dx++) {
      const dy1 = d - Math.abs(dx);
      const dy2 = -dy1;
      const candidateYVals = dy1 === dy2 ? [dy1] : [dy1, dy2];
      for (const dy of candidateYVals) {
        const cx = targetX + dx;
        const cy = targetY + dy;
        if (cx < 0 || cx > limit || cy < 0 || cy > limit) {
          continue;
        }
        let overlapPlayer = false;
        if (state.players) {
          for (const player of Object.values(state.players)) {
            if (player.planets && player.planets.some((pl) => pl.sectorX === cx && pl.sectorY === cy)) {
              overlapPlayer = true;
              break;
            }
          }
        }
        if (overlapPlayer) continue;
        const overlapHabitable = state.habitablePlanets?.some((hp) => hp.coords.x === cx && hp.coords.y === cy);
        if (overlapHabitable) continue;
        return { x: cx, y: cy };
      }
    }
  }
  return null;
}
function getSafeRandomCoordinates(maxCoord) {
  initializeGalaxyConfig();
  const config = state.galaxyConfig;
  const currentMapSize = maxCoord + 1;
  const cx = config.reservedCenterSector ? config.reservedCenterSector.x : Math.floor(currentMapSize / 2);
  const cy = config.reservedCenterSector ? config.reservedCenterSector.y : Math.floor(currentMapSize / 2);
  const minDistance = config.spawnDistance !== void 0 ? config.spawnDistance : 2;
  let attempts = 0;
  while (attempts < 1e3) {
    attempts++;
    const coords = getPlayerSpawnCoordinates(maxCoord);
    if (coords.x === cx && coords.y === cy) {
      continue;
    }
    let overlap = false;
    if (state && state.players) {
      for (const player of Object.values(state.players)) {
        if (player && player.planets) {
          if (player.planets.some((pl) => pl.sectorX === coords.x && pl.sectorY === coords.y)) {
            overlap = true;
            break;
          }
        }
      }
    }
    if (overlap) continue;
    if (state && state.habitablePlanets) {
      const overlapHabitable = state.habitablePlanets.some((hp) => hp.coords.x === coords.x && hp.coords.y === coords.y);
      if (overlapHabitable) continue;
    }
    let tooClose = false;
    if (state && state.players) {
      for (const player of Object.values(state.players)) {
        if (player && player.planets) {
          for (const pl of player.planets) {
            const dist = Math.hypot(coords.x - pl.sectorX, coords.y - pl.sectorY);
            if (dist < minDistance) {
              tooClose = true;
              break;
            }
          }
        }
        if (tooClose) break;
      }
    }
    if (tooClose) continue;
    return coords;
  }
  attempts = 0;
  while (attempts < 500) {
    attempts++;
    const coords = getPlayerSpawnCoordinates(maxCoord);
    if (coords.x === cx && coords.y === cy) {
      continue;
    }
    let overlap = false;
    if (state && state.players) {
      for (const player of Object.values(state.players)) {
        if (player && player.planets) {
          if (player.planets.some((pl) => pl.sectorX === coords.x && pl.sectorY === coords.y)) {
            overlap = true;
            break;
          }
        }
      }
    }
    if (overlap) continue;
    if (state && state.habitablePlanets) {
      const overlapHabitable = state.habitablePlanets.some((hp) => hp.coords.x === coords.x && hp.coords.y === coords.y);
      if (overlapHabitable) continue;
    }
    return coords;
  }
  const clusterCoords = findClusterCoordinate(cx, cy);
  if (clusterCoords) return clusterCoords;
  return getRandomCoordinates(maxCoord);
}
var TROOP_SPECS = {
  defender: { name: "Interceptor", defenceHp: 18, attackHp: 10, carry: 600, speed: 75, waterConsumption: 1 },
  attacker: { name: "Assault Drone", defenceHp: 9, attackHp: 30, carry: 400, speed: 85, waterConsumption: 2 },
  tank: { name: "Disrupter", defenceHp: 5, attackHp: 5, carry: 0, speed: 40, waterConsumption: 4 },
  looter: { name: "Matter Extractor", defenceHp: 4, attackHp: 4, carry: 1e3, speed: 110, waterConsumption: 3 },
  drone: { name: "Missile Launcher", defenceHp: 120, attackHp: 120, carry: 200, speed: 80, waterConsumption: 0.4 },
  settlementShip: { name: "Settlement Ship", defenceHp: 50, attackHp: 0, carry: 5e3, speed: 25, waterConsumption: 5 }
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
function censorFoulLanguage(text) {
  if (!text || typeof text !== "string") return text;
  const regex = /\b(fucking|fucker|fuckers|fucked|fuck|fucks|shitting|shitted|shitty|shit|shits|bitch|bitches|bitching|asshole|assholes|cunt|cunts|dick|dicks|pussy|pussies|bastard|bastards|motherfucker|motherfuckers|cock|cocks|whore|whores|slut|sluts|crap|crappy)\b/gi;
  return text.replace(regex, "pottymouth");
}
function ensureAIsCount(count, s) {
  if (!s.players) s.players = {};
  const existingAIs = Object.values(s.players).filter((p) => p.id.startsWith("ai_"));
  const needToAdd = count - existingAIs.length;
  if (needToAdd <= 0) return;
  console.log(`Topping up AI players from ${existingAIs.length} to ${count}...`);
  const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const prefixes = ["Nebula", "Star", "Void", "Quantum", "Cosmo", "Solar", "Nova", "Titan", "Xenon", "Galaxy", "Eclipse", "Astro", "Alpha", "Omega", "Hyper", "Cyber", "Orion", "Shadow", "Vector", "Spectral", "Iron", "Steel", "Dark", "Light", "Proton"];
  const suffixes = ["Lord", "Hunter", "Knight", "Slayer", "Warden", "Reaper", "Vanguard", "Centurion", "Raider", "Specter", "Shade", "Emperor", "Gladiator", "Pilot", "Drifter", "Pioneer", "Enforcer", "Sentinel", "Cruiser", "Stalker", "Corsair", "Rebel", "Phantom", "Ranger", "Sovereign"];
  const usedNames = new Set(Object.values(s.players).map((p) => p.username.toLowerCase()));
  let added = 0;
  let idx = 1;
  while (added < needToAdd) {
    while (s.players[`ai_${idx}`]) {
      idx++;
    }
    const id = `ai_${idx}`;
    let name = "";
    let attempts = 0;
    do {
      const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
      name = `${pref}${suff}`;
      attempts++;
    } while (usedNames.has(name.toLowerCase()) && attempts < 100);
    if (attempts >= 100) {
      name = `AI_Commander_${idx}`;
    }
    usedNames.add(name.toLowerCase());
    const factionIdx = Math.floor(Math.random() * factions.length);
    const limit = getCurrentMapLimits();
    const coords = getSafeRandomCoordinates(limit);
    const x = coords.x;
    const y = coords.y;
    const planet = createInitialPlanet(`${name}'s Station`, x, y);
    const randomLvl = () => Math.floor(Math.random() * 11) + 15;
    for (const key of Object.keys(planet.mines)) {
      planet.mines[key].forEach((m) => m.level = randomLvl());
    }
    planet.buildings.commsHub.level = Math.floor(Math.random() * 10) + 10;
    planet.buildings.researchCenter.level = Math.floor(Math.random() * 12) + 15;
    planet.buildings.radar.level = Math.floor(Math.random() * 8) + 10;
    planet.buildings.repository.level = Math.floor(Math.random() * 11) + 30;
    for (const resKey of Object.keys(planet.resources)) {
      planet.resources[resKey] = Math.floor(Math.random() * 3e5) + 1e5;
    }
    const player = {
      id,
      username: name,
      faction: factions[factionIdx],
      factionColor: factionColors[factionIdx],
      allianceId: null,
      allianceRole: null,
      planets: [planet],
      scores: {
        population: Math.floor(Math.random() * 1e3) + 200,
        attack: Math.floor(Math.random() * 8e3),
        defence: Math.floor(Math.random() * 6e3),
        raiders: Math.floor(Math.random() * 500)
      },
      achievements: ["First Mine", "Fleet Commander"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now() - 864e5,
      credits: 1e4
    };
    s.players[id] = player;
    added++;
  }
}
function ensureAdminMaxed(p) {
  if (!p || !p.googleEmail) return;
  const email = p.googleEmail.toLowerCase();
  if (email !== "banele180@gmail.com" && email !== "banzz1918@gmail.com") return;
  p.credits = 1e6;
  if (!p.scores) {
    p.scores = { population: 21, attack: 1, defence: 0, raiders: 0 };
  } else {
    p.scores.population = 21;
  }
  if (!p.planets) p.planets = [];
  p.planets.forEach((pl, planetIndex) => {
    if (!pl) return;
    const buildingDefaults = {
      fabricator: { maxLevel: 10 },
      commsHub: { maxLevel: 5 },
      researchCenter: { maxLevel: 20 },
      armyBase: { maxLevel: 22 },
      repository: { maxLevel: 45 },
      radar: { maxLevel: 15 },
      supplyNexus: { maxLevel: 50 },
      bunker: { maxLevel: 25 },
      magneticShield: { maxLevel: 12 }
    };
    if (!pl.buildings) pl.buildings = {};
    Object.entries(buildingDefaults).forEach(([bKey, bDef]) => {
      pl.buildings[bKey] = {
        level: bDef.maxLevel,
        maxLevel: bDef.maxLevel,
        isUpgrading: false,
        upgradeEnd: null,
        health: 100
      };
    });
    const maxExtractorLevel = planetIndex === 0 ? 25 : planetIndex === 1 ? 20 : 15;
    if (!pl.mines) pl.mines = {};
    const resourceKeys = ["water", "plasma", "fuel", "food", "respirant"];
    resourceKeys.forEach((rKey) => {
      let mineCount = rKey === "water" ? 6 : 3;
      if (pl.mines[rKey] && pl.mines[rKey].length > 0) {
        mineCount = pl.mines[rKey].length;
      } else if (state && state.habitablePlanets) {
        const hp = state.habitablePlanets.find((item) => Number(item.coords.x) === Number(pl.sectorX) && Number(item.coords.y) === Number(pl.sectorY));
        if (hp && hp.extractors && hp.extractors[rKey] !== void 0) {
          mineCount = hp.extractors[rKey];
        }
      }
      pl.mines[rKey] = Array.from({ length: mineCount }, (_, i) => {
        const existing = pl.mines[rKey]?.[i];
        return {
          index: i,
          level: maxExtractorLevel,
          isUpgrading: existing ? existing.isUpgrading : false,
          upgradeEnd: existing ? existing.upgradeEnd : null,
          health: existing && existing.health !== void 0 ? existing.health : 100
        };
      });
    });
    pl.resources = {
      water: 99999999,
      plasma: 99999999,
      fuel: 99999999,
      food: 99999999,
      respirant: 99999999
    };
    if (!pl.troops) {
      pl.troops = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 1 };
    } else {
      if (pl.troops.settlementShip === void 0 || pl.troops.settlementShip < 1) {
        pl.troops.settlementShip = 1;
      }
    }
    if (!p.techLevels) p.techLevels = {};
    p.techLevels[pl.id] = {
      defense_shields: 1,
      manufacturing_speed: 1,
      troop_speed: 1
    };
  });
}
function getPlanetTechLevel(player, planetId, techId) {
  const planet = player.planets.find((pl) => pl.id === planetId);
  if (!planet) return 0;
  const rcLevel = planet.buildings.researchCenter?.level || 0;
  if (rcLevel === 0) return 0;
  const rawLvl = player.techLevels?.[planetId]?.[techId] ?? 0;
  return Math.min(rcLevel, rawLvl);
}
function normalizeState(s) {
  if (!s) return;
  initializeGalaxyConfig();
  const limit = getCurrentMapLimits();
  if (s.players) {
    Object.values(s.players).forEach((p) => {
      if (p && p.planets) {
        p.planets.forEach((pl) => {
          if (pl.sectorX > limit || pl.sectorY > limit) {
            const oldX = pl.sectorX;
            const oldY = pl.sectorY;
            const coords = getRandomCoordinates(limit);
            pl.sectorX = coords.x;
            pl.sectorY = coords.y;
            if (s.habitablePlanets) {
              const hp = s.habitablePlanets.find((item) => item.coords.x === oldX && item.coords.y === oldY);
              if (hp) {
                hp.coords.x = coords.x;
                hp.coords.y = coords.y;
                hp.id = `hab_${coords.x}_${coords.y}`;
              }
            }
          }
        });
      }
    });
  }
  if (s.habitablePlanets) {
    s.habitablePlanets = s.habitablePlanets.filter((hp) => {
      if (hp.isColonized) return true;
      return hp.coords.x <= limit && hp.coords.y <= limit;
    });
  }
  if (s.fleets) {
    s.fleets.forEach((f) => {
      if (f.targetCoords && (f.targetCoords.x > limit || f.targetCoords.y > limit)) {
        const coords = getRandomCoordinates(limit);
        f.targetCoords.x = coords.x;
        f.targetCoords.y = coords.y;
      }
      if (f.senderCoords && (f.senderCoords.x > limit || f.senderCoords.y > limit)) {
        const coords = getRandomCoordinates(limit);
        f.senderCoords.x = coords.x;
        f.senderCoords.y = coords.y;
      }
    });
  }
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
        defender: 0,
        attacker: 0,
        tank: 0,
        looter: 0,
        drone: 0,
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
      if (!pl.researchQueue) {
        pl.researchQueue = [];
      }
      if (!pl.buildings) pl.buildings = {};
      const buildingDefaults = {
        fabricator: { level: 0, maxLevel: 10 },
        commsHub: { level: 0, maxLevel: 5 },
        researchCenter: { level: 0, maxLevel: 20 },
        armyBase: { level: 0, maxLevel: 22 },
        repository: { level: 0, maxLevel: 45 },
        radar: { level: 0, maxLevel: 15 },
        supplyNexus: { level: 0, maxLevel: 50 },
        bunker: { level: 0, maxLevel: 25 },
        magneticShield: { level: 0, maxLevel: 12 }
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
            level: 0,
            isUpgrading: false,
            upgradeEnd: null,
            health: 100
          }));
        } else {
          pl.mines[mKey].forEach((mine) => {
            if (mine.level === void 0) {
              mine.level = 0;
            }
            if (mine.isUpgrading === void 0) mine.isUpgrading = false;
            if (mine.upgradeEnd === void 0) mine.upgradeEnd = null;
            if (mine.health === void 0) mine.health = 100;
          });
        }
      });
      ensureAdminMaxed(p);
    });
  });
  ensureAIsCount(50, s);
}
async function loadState() {
  try {
    if (import_fs.default.existsSync(STATE_FILE)) {
      const data = import_fs.default.readFileSync(STATE_FILE, "utf8");
      try {
        state = JSON.parse(data);
      } catch (parseErr) {
        console.warn("Warning: Failed to parse state file JSON, falling back to a fresh default state.", parseErr.message);
        state = { players: {} };
      }
      if (!state.feedbacks) {
        state.feedbacks = [];
      }
      if (!state.customTasks) {
        state.customTasks = {};
      }
      if (state && state.players) {
        Object.values(state.players).forEach((p) => {
          if (p) {
            if (p.username === "123345") {
              p.googleEmail = "banzz1918@gmail.com";
              console.log("MIGRATION: Successfully bound player 123345 to banzz1918@gmail.com");
            }
            if (!p.planets || !Array.isArray(p.planets) || p.planets.length === 0) {
              const limit = getCurrentMapLimits();
              const coords = getRandomCoordinates(limit);
              const startX = coords.x;
              const startY = coords.y;
              const planet = createInitialPlanet(`${p.username || "Commander"}'s Station`, startX, startY, true);
              planet.resources.water = 5e6;
              planet.resources.plasma = 5e6;
              planet.resources.fuel = 5e6;
              planet.resources.food = 5e6;
              planet.resources.respirant = 5e6;
              p.planets = [planet];
              if (!p.scores) {
                p.scores = { population: 10, attack: 0, defence: 0, raiders: 0 };
              } else if (p.scores.population <= 0) {
                p.scores.population = 10;
              }
            }
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
          { id: "hab_14_8", name: "Habitable Station Kepler-Prime", coords: { x: 14, y: 8 }, isColonized: false },
          { id: "hab_5_15", name: "Habitable Outpost Gliese-91", coords: { x: 5, y: 15 }, isColonized: false },
          { id: "hab_17_12", name: "Habitable Station New Hope", coords: { x: 17, y: 12 }, isColonized: false },
          { id: "hab_15_5", name: "Habitable Planet Epsilon-D", coords: { x: 15, y: 5 }, isColonized: false },
          { id: "hab_3_14", name: "Habitable Station Zephyr-9", coords: { x: 3, y: 14 }, isColonized: false },
          { id: "hab_8_3", name: "Habitable Planet Arcadia", coords: { x: 8, y: 3 }, isColonized: false },
          { id: "hab_9_9", name: "Habitable Core Dome-A", coords: { x: 9, y: 9 }, isColonized: false },
          { id: "hab_13_15", name: "Habitable Station Oasis-1", coords: { x: 13, y: 15 }, isColonized: false },
          { id: "hab_11_15", name: "Habitable Planet Eden-X", coords: { x: 11, y: 15 }, isColonized: false },
          { id: "hab_8_12", name: "Habitable Outpost Genesis", coords: { x: 8, y: 12 }, isColonized: false },
          { id: "hab_10_10", name: "Habitable Station Midway", coords: { x: 10, y: 10 }, isColonized: false }
        ];
      }
      normalizeState(state);
      if (state && state.habitablePlanets && state.players) {
        state.habitablePlanets.forEach((hp) => {
          if (hp.isColonized && hp.extractors) {
            for (const player of Object.values(state.players)) {
              if (player && player.planets) {
                const planet = player.planets.find((pl) => Number(pl.sectorX) === Number(hp.coords.x) && Number(pl.sectorY) === Number(hp.coords.y));
                if (planet && planet.mines) {
                  const currentWater = planet.mines.water?.length || 0;
                  const currentPlasma = planet.mines.plasma?.length || 0;
                  const targetWater = hp.extractors.water || 6;
                  const targetPlasma = hp.extractors.plasma || 3;
                  if (currentWater !== targetWater || currentPlasma !== targetPlasma) {
                    console.log(`[Auto-Heal Planet Extractors] Repairing ${planet.name} at [${planet.sectorX}, ${planet.sectorY}]. Water: ${currentWater} -> ${targetWater}, Plasma: ${currentPlasma} -> ${targetPlasma}`);
                    const createMines = (count, existingArray = []) => {
                      return Array.from({ length: count }, (_, i) => {
                        const existing = existingArray[i];
                        return {
                          index: i,
                          level: existing ? existing.level : 0,
                          isUpgrading: existing ? existing.isUpgrading : false,
                          upgradeEnd: existing ? existing.upgradeEnd : null,
                          health: existing && existing.health !== void 0 ? existing.health : 100
                        };
                      });
                    };
                    planet.mines = {
                      water: createMines(hp.extractors.water || 6, planet.mines.water),
                      plasma: createMines(hp.extractors.plasma || 3, planet.mines.plasma),
                      fuel: createMines(hp.extractors.fuel || 3, planet.mines.fuel),
                      food: createMines(hp.extractors.food || 3, planet.mines.food),
                      respirant: createMines(hp.extractors.respirant || 3, planet.mines.respirant)
                    };
                  }
                }
              }
            }
          }
        });
      }
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
function findNearestUnoccupiedCoordinate(targetX, targetY) {
  const limit = getCurrentMapLimits();
  for (let d = 0; d <= limit * 2; d++) {
    for (let dx = -d; dx <= d; dx++) {
      const dy1 = d - Math.abs(dx);
      const dy2 = -dy1;
      const candidateYVals = dy1 === dy2 ? [dy1] : [dy1, dy2];
      for (const dy of candidateYVals) {
        const cx = targetX + dx;
        const cy = targetY + dy;
        if (cx < 0 || cx > limit || cy < 0 || cy > limit) {
          continue;
        }
        let overlap = false;
        if (state && state.players) {
          for (const player of Object.values(state.players)) {
            if (player && player.planets) {
              if (player.planets.some((pl) => pl.sectorX === cx && pl.sectorY === cy)) {
                overlap = true;
                break;
              }
            }
          }
        }
        if (!overlap) {
          return { x: cx, y: cy };
        }
      }
    }
  }
  return { x: targetX, y: targetY };
}
function createInitialPlanet(name, sectorX, sectorY, isFirstStation = false, customMinesCount) {
  let finalX = sectorX;
  let finalY = sectorY;
  let occupied = false;
  if (state && state.players) {
    for (const player of Object.values(state.players)) {
      if (player && player.planets) {
        if (player.planets.some((pl) => pl.sectorX === sectorX && pl.sectorY === sectorY)) {
          occupied = true;
          break;
        }
      }
    }
  }
  if (occupied) {
    const nearest = findNearestUnoccupiedCoordinate(sectorX, sectorY);
    finalX = nearest.x;
    finalY = nearest.y;
    console.log(`[Collision Resolver] Coordinate [${sectorX}, ${sectorY}] is already occupied. Placing ${name} at nearest unoccupied coordinate [${finalX}, ${finalY}].`);
  }
  const createMines = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      level: 0,
      isUpgrading: false,
      upgradeEnd: null,
      health: 100
    }));
  };
  return {
    id: `planet_${Math.random().toString(36).substr(2, 9)}`,
    name,
    sectorX: finalX,
    sectorY: finalY,
    skinId: "default",
    mines: {
      water: createMines(customMinesCount ? customMinesCount.water : 6),
      plasma: createMines(customMinesCount ? customMinesCount.plasma : 3),
      fuel: createMines(customMinesCount ? customMinesCount.fuel : 3),
      food: createMines(customMinesCount ? customMinesCount.food : 3),
      respirant: createMines(customMinesCount ? customMinesCount.respirant : 3)
    },
    buildings: {
      fabricator: { level: 0, maxLevel: 10, isUpgrading: false, upgradeEnd: null, health: 100 },
      commsHub: { level: 0, maxLevel: 5, isUpgrading: false, upgradeEnd: null, health: 100 },
      researchCenter: { level: 0, maxLevel: 20, isUpgrading: false, upgradeEnd: null, health: 100 },
      armyBase: { level: 0, maxLevel: 22, isUpgrading: false, upgradeEnd: null, health: 100 },
      repository: { level: 0, maxLevel: 45, isUpgrading: false, upgradeEnd: null, health: 100 },
      radar: { level: 0, maxLevel: 15, isUpgrading: false, upgradeEnd: null, health: 100 },
      supplyNexus: { level: 0, maxLevel: 50, isUpgrading: false, upgradeEnd: null, health: 100 },
      bunker: { level: 0, maxLevel: 25, isUpgrading: false, upgradeEnd: null, health: 100 },
      magneticShield: { level: 0, maxLevel: 12, isUpgrading: false, upgradeEnd: null, health: 100 }
    },
    resources: {
      water: isFirstStation ? 5e6 : 5e3,
      plasma: isFirstStation ? 5e6 : 5e3,
      fuel: isFirstStation ? 5e6 : 5e3,
      food: isFirstStation ? 5e6 : 5e3,
      respirant: isFirstStation ? 5e6 : 5e3
    },
    troops: {
      defender: 0,
      attacker: 0,
      tank: 0,
      looter: 0,
      drone: 0,
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
    const choices = ["commsHub", "researchCenter", "armyBase", "repository", "radar", "supplyNexus", "bunker", "mines.water", "mines.plasma", "mines.fuel", "mines.food", "mines.respirant"];
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
    let damageReduction = 0;
    const magShieldLvl = defPlanet.buildings?.magneticShield?.level || 0;
    if (magShieldLvl > 0) {
      damageReduction = 0.3 * (Math.min(12, magShieldLvl) / 12);
    }
    const damage = numTanks * (1 - damageReduction);
    const computedHealth = prevHealth - damage;
    if (computedHealth > 0) {
      targetState.health = computedHealth;
      buildingDamageReports.push({
        buildingName: finalName === "commsHub" ? "Communications Hub" : finalName === "researchCenter" ? "Research Center" : finalName === "armyBase" ? "War Room" : finalName === "repository" ? "Silo" : finalName === "radar" ? "Radar Array" : finalName === "supplyNexus" ? "Supply Nexus" : finalName === "fabricator" ? "Fabricator" : finalName === "bunker" ? "Bunker" : finalName === "magneticShield" ? "Magnetic Shield" : finalName,
        levelsDestroyed: 0,
        previousLevel: prevLvl,
        newLevel: prevLvl,
        remainingPercentage: Math.max(0, Math.min(100, Math.round(computedHealth)))
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
        buildingName: finalName === "commsHub" ? "Communications Hub" : finalName === "researchCenter" ? "Research Center" : finalName === "armyBase" ? "War Room" : finalName === "repository" ? "Silo" : finalName === "radar" ? "Radar Array" : finalName === "supplyNexus" ? "Supply Nexus" : finalName === "fabricator" ? "Fabricator" : finalName === "bunker" ? "Bunker" : finalName === "magneticShield" ? "Magnetic Shield" : finalName,
        levelsDestroyed: levelsLost,
        previousLevel: prevLvl,
        newLevel: newLvl,
        remainingPercentage: Math.max(0, Math.min(100, Math.round(newHealth)))
      });
    }
  }
  return buildingDamageReports;
}
function getOrGenerateHabitableExtractors(hp, indexForProportion) {
  if (hp.extractors) return hp.extractors;
  let isOneThird = false;
  if (typeof indexForProportion === "number") {
    isOneThird = indexForProportion % 3 === 0;
  } else {
    isOneThird = Math.random() < 0.35;
  }
  if (isOneThird) {
    hp.extractors = {
      water: 14,
      plasma: 1,
      fuel: 1,
      food: 1,
      respirant: 1
    };
  } else {
    const counts = { water: 4, plasma: 1, fuel: 1, food: 1, respirant: 1 };
    let remaining = 10;
    const keys = ["water", "plasma", "fuel", "food", "respirant"];
    while (remaining > 0) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      counts[k]++;
      remaining--;
    }
    hp.extractors = counts;
  }
  return hp.extractors;
}
function ensureMinimumHabitablePlanets() {
  if (!state.habitablePlanets) {
    state.habitablePlanets = [];
  }
  const limit = getCurrentMapLimits();
  state.habitablePlanets = state.habitablePlanets.filter((p) => {
    if (p.isColonized) return true;
    if (p.coords.x > limit || p.coords.y > limit) return false;
    let overlap = false;
    if (state && state.players) {
      for (const player of Object.values(state.players)) {
        if (player && player.planets) {
          if (player.planets.some((pl) => pl.sectorX === p.coords.x && pl.sectorY === p.coords.y)) {
            overlap = true;
            break;
          }
        }
      }
    }
    return !overlap;
  });
  state.habitablePlanets.forEach((p, index) => {
    if (!p.isColonized && !p.extractors) {
      getOrGenerateHabitableExtractors(p, index);
    }
  });
  const uncolonized = state.habitablePlanets.filter((p) => !p.isColonized);
  if (uncolonized.length >= 50) return;
  const countNeeded = 50 - uncolonized.length;
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
      const limit2 = getCurrentMapLimits();
      const coords = getRandomCoordinates(limit2);
      targetX = coords.x;
      targetY = coords.y;
      const overlapHabitable = state.habitablePlanets.some((hp2) => hp2.coords.x === targetX && hp2.coords.y === targetY);
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
    const hp = {
      id,
      name,
      coords: { x: targetX, y: targetY },
      isColonized: false
    };
    getOrGenerateHabitableExtractors(hp, state.habitablePlanets.length);
    state.habitablePlanets.push(hp);
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
    { id: "hab_14_8", name: "Habitable Station Kepler-Prime", coords: { x: 14, y: 8 }, isColonized: false },
    { id: "hab_5_15", name: "Habitable Outpost Gliese-91", coords: { x: 5, y: 15 }, isColonized: false },
    { id: "hab_17_12", name: "Habitable Station New Hope", coords: { x: 17, y: 12 }, isColonized: false },
    { id: "hab_15_5", name: "Habitable Planet Epsilon-D", coords: { x: 15, y: 5 }, isColonized: false },
    { id: "hab_3_14", name: "Habitable Station Zephyr-9", coords: { x: 3, y: 14 }, isColonized: false },
    { id: "hab_8_3", name: "Habitable Planet Arcadia", coords: { x: 8, y: 3 }, isColonized: false },
    { id: "hab_9_9", name: "Habitable Core Dome-A", coords: { x: 9, y: 9 }, isColonized: false },
    { id: "hab_13_15", name: "Habitable Station Oasis-1", coords: { x: 13, y: 15 }, isColonized: false },
    { id: "hab_11_15", name: "Habitable Planet Eden-X", coords: { x: 11, y: 15 }, isColonized: false },
    { id: "hab_8_12", name: "Habitable Outpost Genesis", coords: { x: 8, y: 12 }, isColonized: false },
    { id: "hab_10_10", name: "Habitable Station Midway", coords: { x: 10, y: 10 }, isColonized: false }
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
  const prefixes = ["Nebula", "Star", "Void", "Quantum", "Cosmo", "Solar", "Nova", "Titan", "Xenon", "Galaxy", "Eclipse", "Astro", "Alpha", "Omega", "Hyper", "Cyber", "Orion", "Shadow", "Vector", "Spectral", "Iron", "Steel", "Dark", "Light", "Proton"];
  const suffixes = ["Lord", "Hunter", "Knight", "Slayer", "Warden", "Reaper", "Vanguard", "Centurion", "Raider", "Specter", "Shade", "Emperor", "Gladiator", "Pilot", "Drifter", "Pioneer", "Enforcer", "Sentinel", "Cruiser", "Stalker", "Corsair", "Rebel", "Phantom", "Ranger", "Sovereign"];
  const aiNames = [];
  const usedNames = /* @__PURE__ */ new Set();
  while (aiNames.length < 50) {
    const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${pref}${suff}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      const factionIdx = Math.floor(Math.random() * factions.length);
      const limit = getCurrentMapLimits();
      const coords = getRandomCoordinates(limit);
      const x = coords.x;
      const y = coords.y;
      aiNames.push({
        name,
        coords: { x, y },
        allianceId: null,
        faction: factions[factionIdx],
        color: factionColors[factionIdx]
      });
    }
  }
  aiNames.forEach((ai, idx) => {
    const id = `ai_${idx + 1}`;
    const planet = createInitialPlanet(`${ai.name}'s Station`, ai.coords.x, ai.coords.y);
    const randomLvl = () => Math.floor(Math.random() * 11) + 15;
    for (const key of Object.keys(planet.mines)) {
      planet.mines[key].forEach((m) => m.level = randomLvl());
    }
    planet.buildings.commsHub.level = Math.floor(Math.random() * 10) + 10;
    planet.buildings.researchCenter.level = Math.floor(Math.random() * 12) + 15;
    planet.buildings.radar.level = Math.floor(Math.random() * 8) + 10;
    planet.buildings.repository.level = Math.floor(Math.random() * 11) + 30;
    for (const resKey of Object.keys(planet.resources)) {
      planet.resources[resKey] = Math.floor(Math.random() * 3e5) + 1e5;
    }
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
        raiders: Math.floor(Math.random() * 500)
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
    const combinedTroops = { ...planet.troops };
    Object.values(state.players).forEach((otherPlayer) => {
      if (otherPlayer.createdFleets) {
        otherPlayer.createdFleets.forEach((fleet) => {
          const activeMission = state.fleets.find((m) => m.createdFleetId === fleet.id);
          if (activeMission) {
            if (activeMission.missionType === "attack") {
              if (fleet.planetId === planet.id) {
                Object.entries(fleet.troops).forEach(([troopId, count]) => {
                  const qty = Number(count) || 0;
                  combinedTroops[troopId] = (combinedTroops[troopId] || 0) + qty;
                });
              }
            } else if (activeMission.isReturning) {
              if (fleet.planetId === planet.id) {
                Object.entries(fleet.troops).forEach(([troopId, count]) => {
                  const qty = Number(count) || 0;
                  combinedTroops[troopId] = (combinedTroops[troopId] || 0) + qty;
                });
              }
            } else {
              const hasArrivedAtTarget = now >= activeMission.arrivesAt;
              if (hasArrivedAtTarget) {
                if (activeMission.targetCoords.x === planet.sectorX && activeMission.targetCoords.y === planet.sectorY) {
                  Object.entries(fleet.troops).forEach(([troopId, count]) => {
                    const qty = Number(count) || 0;
                    combinedTroops[troopId] = (combinedTroops[troopId] || 0) + qty;
                  });
                }
              } else {
                if (fleet.planetId === planet.id) {
                  Object.entries(fleet.troops).forEach(([troopId, count]) => {
                    const qty = Number(count) || 0;
                    combinedTroops[troopId] = (combinedTroops[troopId] || 0) + qty;
                  });
                }
              }
            }
          } else {
            if (fleet.planetId === planet.id) {
              Object.entries(fleet.troops).forEach(([troopId, count]) => {
                const qty = Number(count) || 0;
                combinedTroops[troopId] = (combinedTroops[troopId] || 0) + qty;
              });
            }
          }
        });
      }
    });
    state.fleets.forEach((mission) => {
      if (!mission.createdFleetId) {
        if (!mission.isReturning && now >= mission.arrivesAt && mission.missionType !== "attack") {
          if (mission.targetCoords.x === planet.sectorX && mission.targetCoords.y === planet.sectorY) {
            Object.entries(mission.troops).forEach(([troopId, count]) => {
              const qty = Number(count) || 0;
              combinedTroops[troopId] = (combinedTroops[troopId] || 0) + qty;
            });
          }
        }
      }
    });
    Object.entries(combinedTroops).forEach(([troopId, count]) => {
      const spec = TROOP_SPECS[troopId];
      if (spec) {
        waterConsumptionPerHour += count * spec.waterConsumption;
      }
    });
    if (!player.lastActive || typeof player.lastActive !== "number" || player.lastActive <= 0 || isNaN(player.lastActive)) {
      player.lastActive = now;
    }
    let lastTick = planet._lastTick || player.lastActive || now;
    if (!lastTick || typeof lastTick !== "number" || lastTick <= 0 || isNaN(lastTick)) {
      lastTick = now;
    }
    planet._lastTick = now;
    let lastCompletedUpgradeTime = 0;
    let deltaMs = now - lastTick;
    const MAX_CATCHUP_MS = 3600 * 1e3;
    if (deltaMs > MAX_CATCHUP_MS) {
      deltaMs = MAX_CATCHUP_MS;
    } else if (deltaMs < 0) {
      deltaMs = 0;
    }
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
            if (!planet.upgradeQueue || planet.upgradeQueue.length === 0) {
              const resNames = { water: "Water Extractor", plasma: "Plasma Extractor", fuel: "Fuel Extractor", food: "Food Extractor", respirant: "Respirant Extractor" };
              const name = resNames[resKey] || `${resKey} Mine`;
              sendNotificationWithFallback(
                player.id,
                mine.level === 1 ? "\u2699\uFE0F Extractor Construction Completed" : "\u2699\uFE0F Extractor Upgrade Completed",
                mine.level === 1 ? `${name} (Slot ${mine.index + 1}) has successfully completed construction on ${planet.name}!` : `${name} (Slot ${mine.index + 1}) has successfully completed upgrading to Level ${mine.level} on ${planet.name}!`,
                "construction"
              );
            }
          }
          const isOtherMaxed = planet.resources.plasma >= storageLimit && planet.resources.fuel >= storageLimit && planet.resources.food >= storageLimit && planet.resources.respirant >= storageLimit;
          const isMineBoosted = mine.boostedUntil && now < Number(mine.boostedUntil);
          let hourlyProd = isOtherMaxed ? 14e3 : getMineProductionPerHour(mine.level, resKey);
          if (isMineBoosted) {
            hourlyProd = hourlyProd * 1.14;
          }
          const accumulated = hourlyProd * deltaHours;
          planet.resources[resKey] += accumulated;
        });
      }
      const waterConsumed = waterConsumptionPerHour * deltaHours;
      const respirantConsumed = waterConsumptionPerHour * 0.28 * deltaHours;
      const foodConsumed = waterConsumptionPerHour * 0.18 * deltaHours;
      planet.resources.water = planet.resources.water - waterConsumed;
      planet.resources.respirant = planet.resources.respirant - respirantConsumed;
      planet.resources.food = planet.resources.food - foodConsumed;
      const hourlyMinesProd = { water: 0, plasma: 0, fuel: 0, respirant: 0, food: 0 };
      for (const resKey of ["water", "plasma", "fuel", "respirant", "food"]) {
        const mines = planet.mines[resKey] || [];
        const isOtherMaxed = planet.resources.plasma >= storageLimit && planet.resources.fuel >= storageLimit && planet.resources.food >= storageLimit && planet.resources.respirant >= storageLimit;
        mines.forEach((mine) => {
          const isMineBoosted = mine.boostedUntil && now < Number(mine.boostedUntil);
          let hourlyProd = isOtherMaxed ? 14e3 : getMineProductionPerHour(mine.level, resKey);
          if (isMineBoosted) {
            hourlyProd = hourlyProd * 1.14;
          }
          hourlyMinesProd[resKey] += hourlyProd;
        });
      }
      const netWaterProdHourly = hourlyMinesProd.water - waterConsumptionPerHour;
      const netRespirantProdHourly = hourlyMinesProd.respirant - waterConsumptionPerHour * 0.28;
      const netFoodProdHourly = hourlyMinesProd.food - waterConsumptionPerHour * 0.18;
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
      planet.resources.plasma = Math.max(0, Math.min(storageLimit, planet.resources.plasma));
      planet.resources.fuel = Math.max(0, Math.min(storageLimit, planet.resources.fuel));
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
          if (!planet.upgradeQueue || planet.upgradeQueue.length === 0) {
            const bNames = { commsHub: "Communications Hub", researchCenter: "Research Center", armyBase: "War Room", repository: "Silo", radar: "Radar Array", supplyNexus: "Supply Nexus", fabricator: "Fabricator", bunker: "Bunker", magneticShield: "Magnetic Shield" };
            const name = bNames[bKey] || bKey;
            sendNotificationWithFallback(
              player.id,
              "\u{1F3D7}\uFE0F Station Upgrade Completed",
              `${name} has successfully completed upgrading to Level ${building.level} on ${planet.name}!`,
              "construction"
            );
          }
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
        const rcLevel = planet.buildings.researchCenter?.level || 0;
        player.techLevels[planet.id][techId] = Math.min(rcLevel, targetLvl);
        lastCompletedUpgradeTime = Math.max(lastCompletedUpgradeTime, planet.activeResearch.endAt);
        planet.activeResearch = null;
        changed = true;
        if (!planet.researchQueue || planet.researchQueue.length === 0) {
          const techNames = { defense_shields: "Defense Shields", manufacturing_speed: "Manufacturing Speed", troop_speed: "Troop Speed" };
          const name = techNames[techId] || techId;
          sendNotificationWithFallback(
            player.id,
            "\u{1F52C} Research Project Completed",
            `${name} has successfully reached Level ${targetLvl} in the Research Center of ${planet.name}!`,
            "research"
          );
        }
      }
      if (!planet.upgradeQueue) {
        planet.upgradeQueue = [];
      }
      if (!planet.researchQueue) {
        planet.researchQueue = [];
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
      if (!isUpgradeActive && planet.upgradeQueue.length > 0) {
        let referenceTime = lastCompletedUpgradeTime > 0 ? lastCompletedUpgradeTime : now;
        while (planet.upgradeQueue.length > 0) {
          const nextUp = planet.upgradeQueue[0];
          let durationMs = 0;
          let targetObj = null;
          let targetLvl = 1;
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
              if (planet.upgradeQueue.length === 0) {
                const bNames = { commsHub: "Communications Hub", researchCenter: "Research Center", armyBase: "War Room", repository: "Silo", radar: "Radar Array", supplyNexus: "Supply Nexus", fabricator: "Fabricator", bunker: "Bunker", magneticShield: "Magnetic Shield" };
                const resNames = { water: "Water Extractor", plasma: "Plasma Extractor", fuel: "Fuel Extractor", food: "Food Extractor", respirant: "Respirant Extractor" };
                const name = nextUp.type === "mine" ? resNames[nextUp.key] || `${nextUp.key} Mine` : bNames[nextUp.key] || nextUp.key;
                sendNotificationWithFallback(
                  player.id,
                  "\u{1F3D7}\uFE0F Queue Upgrades Completed",
                  `Your construction queue has completed. Final item: '${name}' successfully reached Level ${targetLvl} on ${planet.name}!`,
                  "construction"
                );
              }
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
      if (!planet.activeResearch && planet.researchQueue.length > 0) {
        let referenceTime = lastCompletedUpgradeTime > 0 ? lastCompletedUpgradeTime : now;
        while (planet.researchQueue.length > 0) {
          const nextResearch = planet.researchQueue[0];
          const targetLvl = nextResearch.targetLevel;
          const durationMs = targetLvl * 60 * 1e3;
          const expectedEnd = referenceTime + durationMs;
          if (now >= expectedEnd) {
            if (!player.techLevels) {
              player.techLevels = {};
            }
            if (!player.techLevels[planet.id]) {
              player.techLevels[planet.id] = {};
            }
            const rcLevel = planet.buildings.researchCenter?.level || 0;
            player.techLevels[planet.id][nextResearch.key] = Math.min(rcLevel, targetLvl);
            planet.researchQueue.shift();
            referenceTime = expectedEnd;
            changed = true;
            if (planet.researchQueue.length === 0) {
              const techNames = { defense_shields: "Defense Shields", manufacturing_speed: "Manufacturing Speed", troop_speed: "Troop Speed" };
              const name = techNames[nextResearch.key] || nextResearch.key;
              sendNotificationWithFallback(
                player.id,
                "\u{1F52C} Research Queue Completed",
                `Your research queue has completed. Final item: '${name}' successfully reached Level ${targetLvl} in the Research Center of ${planet.name}!`,
                "research"
              );
            }
          } else {
            planet.activeResearch = {
              techId: nextResearch.key,
              targetLevel: targetLvl,
              endAt: expectedEnd
            };
            planet.researchQueue.shift();
            changed = true;
            break;
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
  const emailLower = (player.googleEmail || "").toLowerCase();
  const isAdmin = emailLower === "banele180@gmail.com" || emailLower === "banzz1918@gmail.com";
  if (isAdmin) {
    popScore = 21;
  } else {
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
  }
  if (player.scores.population !== popScore) {
    player.scores.population = popScore;
    changed = true;
  }
  return changed;
}
function simulateMoonbaseCombat(attackerName, defenderName, attTroops, defTroops, attShieldLevel = 10, defShieldLevel = 10, allianceTroops) {
  const attRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...attTroops };
  const defOwnRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...defTroops };
  const defAllianceRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...allianceTroops };
  const defRemaining = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  Object.keys(defRemaining).forEach((tId) => {
    defRemaining[tId] = (defOwnRemaining[tId] || 0) + (defAllianceRemaining[tId] || 0);
  });
  const attackerLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const defenderLosses = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
  const attMult = 1 + Math.min(20, attShieldLevel) / 20 * 0.15;
  const defMult = 1 + Math.min(20, defShieldLevel) / 20 * 0.15;
  let initialAttHp = 0;
  Object.entries(attTroops).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId];
    if (spec) initialAttHp += count * Math.round(spec.attackHp * attMult);
  });
  let initialDefHp = 0;
  Object.entries(defOwnRemaining).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId];
    if (spec) initialDefHp += count * Math.round(spec.defenceHp * defMult);
  });
  Object.entries(defAllianceRemaining).forEach(([tId, count]) => {
    const spec = TROOP_SPECS[tId];
    if (spec) initialDefHp += count * Math.round(spec.defenceHp * 1);
  });
  let winner = "defender";
  let attLossRate = 0;
  let defLossRate = 0;
  if (initialAttHp === 0 && initialDefHp === 0) {
    winner = "defender";
    attLossRate = 0;
    defLossRate = 0;
  } else if (initialAttHp === 0) {
    winner = "defender";
    attLossRate = 0;
    defLossRate = 0;
  } else if (initialDefHp === 0) {
    winner = "attacker";
    attLossRate = 0;
    defLossRate = 0;
  } else {
    const strongerHp = Math.max(initialAttHp, initialDefHp);
    const weakerHp = Math.min(initialAttHp, initialDefHp);
    const x = strongerHp / weakerHp;
    const lS = 0.015 + 0.485 / (1 + 1.7 * (x - 1) + 0.15 * Math.pow(x - 1, 2));
    const lW = 1 - 0.5 / Math.pow(x, 1.8);
    if (initialAttHp > initialDefHp) {
      winner = "attacker";
      attLossRate = lS;
      defLossRate = lW;
    } else if (initialDefHp > initialAttHp) {
      winner = "defender";
      attLossRate = lW;
      defLossRate = lS;
    } else {
      winner = "defender";
      attLossRate = 0.5;
      defLossRate = 0.5;
    }
  }
  const getLossCount = (count, rate) => {
    if (count <= 0 || rate <= 0) return 0;
    const rawLoss = count * rate;
    let losses = Math.floor(rawLoss);
    const fraction = rawLoss - losses;
    if (Math.random() < fraction) {
      losses++;
    }
    return Math.min(count, losses);
  };
  Object.keys(attackerLosses).forEach((tId) => {
    const initialCount = attTroops[tId] || 0;
    const killed = getLossCount(initialCount, attLossRate);
    attackerLosses[tId] = killed;
    attRemaining[tId] = Math.max(0, initialCount - killed);
  });
  Object.keys(defenderLosses).forEach((tId) => {
    const initialOwn = defTroops[tId] || 0;
    const initialAlliance = allianceTroops?.[tId] || 0;
    const totalDefCount = initialOwn + initialAlliance;
    const killed = getLossCount(totalDefCount, defLossRate);
    defenderLosses[tId] = killed;
    let ownKilled = 0;
    let allianceKilled = 0;
    if (totalDefCount > 0) {
      const ownShare = Math.round(initialOwn / totalDefCount * killed);
      ownKilled = Math.min(initialOwn, ownShare);
      allianceKilled = Math.min(initialAlliance, killed - ownKilled);
    }
    defOwnRemaining[tId] = Math.max(0, initialOwn - ownKilled);
    defAllianceRemaining[tId] = Math.max(0, initialAlliance - allianceKilled);
    defRemaining[tId] = Math.max(0, totalDefCount - killed);
  });
  let attackHpKilled = 0;
  Object.entries(attackerLosses).forEach(([tId, killed]) => {
    if (killed > 0) {
      const spec = TROOP_SPECS[tId];
      const unitHp = spec ? Math.round(spec.defenceHp * attMult) : 100;
      attackHpKilled += killed * unitHp;
    }
  });
  let defenceHpKilled = 0;
  Object.entries(defenderLosses).forEach(([tId, killed]) => {
    if (killed > 0) {
      const spec = TROOP_SPECS[tId];
      const initialOwn = defTroops[tId] || 0;
      const initialAlliance = allianceTroops?.[tId] || 0;
      const totalDefCount = initialOwn + initialAlliance;
      const effectiveMult = totalDefCount > 0 ? (initialOwn * defMult + initialAlliance * 1) / totalDefCount : defMult;
      const unitHp = spec ? Math.round(spec.defenceHp * effectiveMult) : 100;
      defenceHpKilled += killed * unitHp;
    }
  });
  const rounds = [];
  const roundLogs = [];
  roundLogs.push(`--- COMBAT CYCLE 1 INITIATED ---`);
  roundLogs.push(`Attackers throw Fleet Combat Strength of ${initialAttHp.toLocaleString()} into target coordinates.`);
  roundLogs.push(`Defenders respond with Planetary Defense Strength of ${initialDefHp.toLocaleString()} total DEF.`);
  if (initialAttHp > 0 && initialDefHp > 0) {
    const ratio = Math.max(initialAttHp, initialDefHp) / Math.min(initialAttHp, initialDefHp);
    roundLogs.push(`Combat Ratio: ${ratio.toFixed(2)}x advantage for the ${initialAttHp > initialDefHp ? "Attacker" : "Defender"}.`);
    roundLogs.push(`Mathematical casualty curves applied to distribute force attrition evenly across all units.`);
  }
  const attKilledText = Object.entries(attackerLosses).filter(([_, qty]) => qty > 0).map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId]?.name || tId}`).join(", ");
  const defKilledText = Object.entries(defenderLosses).filter(([_, qty]) => qty > 0).map(([tId, qty]) => `${qty} ${TROOP_SPECS[tId]?.name || tId}`).join(", ");
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
    round: 1,
    logs: roundLogs,
    attackerRemaining: { ...attRemaining },
    defenderRemaining: { ...defRemaining }
  });
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
      const homePlanet = sender.planets.find((p) => p.sectorX === fleet.senderCoords.x && p.sectorY === fleet.senderCoords.y) || sender.planets[0];
      if (homePlanet) {
        const autoUnload = sender.autoUnloadResources !== false;
        if (autoUnload) {
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
        } else {
          if (fleet.createdFleetId) {
            Object.entries(fleet.troops).forEach(([tId, count]) => {
              homePlanet.troops[tId] += count;
            });
            const cf = sender.createdFleets?.find((f) => f.id === fleet.createdFleetId);
            if (cf) {
              if (!cf.resources) {
                cf.resources = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
              }
              if (fleet.lootCarried) {
                Object.entries(fleet.lootCarried).forEach(([res, amt]) => {
                  cf.resources[res] = (cf.resources[res] || 0) + amt;
                });
              }
            }
          } else {
            const newFleetId = `fleet_${Math.random().toString(36).substr(2, 9)}`;
            const newFleet = {
              id: newFleetId,
              name: `Returned Fleet (${fleet.targetName})`,
              subsidiary: sender.faction,
              troops: { ...fleet.troops },
              planetId: homePlanet.id,
              activeMissionId: null,
              isTraveling: false,
              resources: fleet.lootCarried ? {
                water: fleet.lootCarried.water || 0,
                plasma: fleet.lootCarried.plasma || 0,
                fuel: fleet.lootCarried.fuel || 0,
                food: fleet.lootCarried.food || 0,
                respirant: fleet.lootCarried.respirant || 0
              } : { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 }
            };
            if (!sender.createdFleets) sender.createdFleets = [];
            sender.createdFleets.push(newFleet);
            fleet.troops = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
          }
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
        const cf = fleet.createdFleetId ? attacker.createdFleets?.find((f) => f.id === fleet.createdFleetId) : null;
        if (cf) {
          cf.planetId = targetPlanet.id;
          cf.isTraveling = false;
          cf.activeMissionId = null;
        } else {
          Object.entries(fleet.troops).forEach(([tId, count]) => {
            targetPlanet.troops[tId] = (targetPlanet.troops[tId] || 0) + count;
          });
        }
        const report = {
          id: `battle_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          attackerId: fleet.senderId,
          attackerName: fleet.senderName,
          defenderId: targetOwner.id,
          defenderName: targetPlanet.name,
          isRecon: false,
          isMove: true,
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
                cf ? "Reserve fleet container has docked locally, keeping all transport cargo resources and forces structured." : "Troops have been successfully deployed and integrated into the local defense network.",
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
          `Your relocation fleet has completed transit and safely landed at '${targetPlanet.name}'.`,
          "fleet"
        );
      } else {
        const totalDist = Math.hypot(fleet.targetCoords.x - fleet.senderCoords.x, fleet.targetCoords.y - fleet.senderCoords.y);
        const slowestTroopSpeed = Object.entries(fleet.troops).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
          const sp = TROOP_SPECS[tId]?.speed || 5;
          return sp < slowest ? sp : slowest;
        }, 100);
        const travelTimeMs = Math.round(totalDist / slowestTroopSpeed * 36e5);
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
      `Your recon drones have returned orbital scanner data of Commander ${report.defenderName || "Unknown"}'s station.`,
      "fleet"
    );
    if (report.defenderId) {
      sendNotificationWithFallback(
        report.defenderId,
        "\u26A0\uFE0F SENSORS ALERT: Scanner Detected",
        `Proximity alarms triggered: An unauthorized scouting drone sent by Commander ${report.attackerName} has completed a scan of your station!`,
        "military"
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
    const travelTimeMs = Math.round(totalDist / speed * 36e5);
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
      if (hasLvl20 && attacker.planets.length < 20) {
        let customExt = void 0;
        if (state.habitablePlanets) {
          const matchedHp = state.habitablePlanets.find((item) => Number(item.coords.x) === Number(fleet.targetCoords.x) && Number(item.coords.y) === Number(fleet.targetCoords.y));
          if (matchedHp) {
            customExt = getOrGenerateHabitableExtractors(matchedHp);
            matchedHp.isColonized = true;
          }
        }
        const planetNum = attacker.planets.length + 1;
        const newPlanet = createInitialPlanet(`${attacker.username}'s Colony ${planetNum}`, fleet.targetCoords.x, fleet.targetCoords.y, false, customExt);
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          newPlanet.troops[tId] = count;
        });
        const isAdminPlayer = attacker && attacker.googleEmail && (attacker.googleEmail.toLowerCase() === "banele180@gmail.com" || attacker.googleEmail.toLowerCase() === "banzz1918@gmail.com");
        if (!isAdminPlayer) {
          newPlanet.troops.settlementShip = 0;
        } else {
          newPlanet.troops.settlementShip = 1;
        }
        attacker.planets.push(newPlanet);
        ensureAdminMaxed(attacker);
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
    const defPlanet = defender.planets.find((pl) => pl.sectorX === fleet.targetCoords.x && pl.sectorY === fleet.targetCoords.y) || defender.planets[0];
    const attTroops = { ...fleet.troops };
    const dockingDefenderReserveFleets = (defender.createdFleets || []).filter(
      (cf) => cf.planetId === (defPlanet ? defPlanet.id : "") && (!cf.isTraveling || !cf.activeMissionId)
    );
    const defOwnTroops = defPlanet ? { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0, ...defPlanet.troops } : { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    dockingDefenderReserveFleets.forEach((cf) => {
      Object.entries(cf.troops).forEach(([tId, count]) => {
        const qty = Number(count) || 0;
        defOwnTroops[tId] = (defOwnTroops[tId] || 0) + qty;
      });
    });
    const defAllianceTroops = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    const allDockedDefenderFleets = [...dockingDefenderReserveFleets];
    Object.values(state.players).forEach((pObj) => {
      if (pObj.id !== defender.id && !!defender.allianceId && pObj.allianceId === defender.allianceId && pObj.createdFleets) {
        pObj.createdFleets.forEach((cf) => {
          if (cf.planetId === (defPlanet ? defPlanet.id : "") && (!cf.isTraveling || !cf.activeMissionId)) {
            allDockedDefenderFleets.push(cf);
            Object.entries(cf.troops).forEach(([tId, count]) => {
              const qty = Number(count) || 0;
              defAllianceTroops[tId] = (defAllianceTroops[tId] || 0) + qty;
            });
          }
        });
      }
    });
    const defTroops = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    Object.keys(defTroops).forEach((tId) => {
      defTroops[tId] = (defOwnTroops[tId] || 0) + (defAllianceTroops[tId] || 0);
    });
    const attShieldLvl = fleet.defenseShieldsLevel || 10;
    let defShieldLvl = 0;
    if (defender && defPlanet) {
      defShieldLvl = getPlanetTechLevel(defender, defPlanet.id, "defense_shields");
    }
    const combat = simulateMoonbaseCombat(
      fleet.senderName,
      fleet.targetName,
      attTroops,
      defOwnTroops,
      attShieldLvl,
      defShieldLvl,
      defAllianceTroops
    );
    if (defPlanet) {
      Object.entries(combat.defenderLosses).forEach(([tId, totalLoss]) => {
        if (totalLoss <= 0) return;
        const sources = [];
        const garrisonCount = defPlanet.troops[tId] || 0;
        if (garrisonCount > 0) {
          sources.push({
            name: "garrison",
            type: "garrison",
            currentCount: garrisonCount,
            deduct: (qty) => {
              defPlanet.troops[tId] = Math.max(0, defPlanet.troops[tId] - qty);
            }
          });
        }
        allDockedDefenderFleets.forEach((cf) => {
          const count = cf.troops[tId] || 0;
          if (count > 0) {
            sources.push({
              name: cf.id,
              type: "reserve",
              currentCount: count,
              deduct: (qty) => {
                cf.troops[tId] = Math.max(0, cf.troops[tId] - qty);
              }
            });
          }
        });
        const totalAvailable = sources.reduce((sum, s) => sum + s.currentCount, 0);
        if (totalAvailable <= 0) return;
        let lossesToDistribute = Math.min(totalLoss, totalAvailable);
        sources.forEach((source, index) => {
          if (lossesToDistribute <= 0) return;
          if (index === sources.length - 1) {
            source.deduct(lossesToDistribute);
          } else {
            const share = Math.round(source.currentCount / totalAvailable * totalLoss);
            const applied = Math.min(lossesToDistribute, share, source.currentCount);
            source.deduct(applied);
            lossesToDistribute -= applied;
          }
        });
      });
      Object.values(state.players).forEach((pObj) => {
        const isDefender = pObj.id === defender.id;
        const isAllianceMember = !!defender.allianceId && pObj.allianceId === defender.allianceId;
        if ((isDefender || isAllianceMember) && pObj.createdFleets) {
          pObj.createdFleets = pObj.createdFleets.filter((cf) => {
            const totalTroops = Object.values(cf.troops).reduce((sum, count) => sum + (Number(count) || 0), 0);
            return totalTroops > 0;
          });
        }
      });
    }
    attacker.scores.attack += combat.defenceHpKilled;
    defender.scores.defence += combat.attackHpKilled;
    const loot = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
    let totalLootCapacity = 0;
    Object.entries(combat.attackerRemaining).forEach(([tId, count]) => {
      const spec = TROOP_SPECS[tId];
      if (spec) totalLootCapacity += count * spec.carry;
    });
    if (combat.winner === "attacker" && totalLootCapacity > 0 && defPlanet) {
      const items = ["water", "plasma", "fuel", "food", "respirant"];
      const bunkerLevel = defPlanet.buildings && defPlanet.buildings.bunker ? defPlanet.buildings.bunker.level : 0;
      const protectedAmountPerType = Math.round(5e5 * (bunkerLevel / 25));
      const availableResources = items.reduce((acc, item) => {
        acc[item] = Math.max(0, defPlanet.resources[item] - protectedAmountPerType);
        return acc;
      }, {});
      let defenseTotalAvailableResources = items.reduce((sum, item) => sum + availableResources[item], 0);
      if (defenseTotalAvailableResources > 0) {
        const stealAmount = Math.min(totalLootCapacity, defenseTotalAvailableResources);
        const stealFrac = stealAmount / defenseTotalAvailableResources;
        items.forEach((item) => {
          const stolen = Math.min(
            availableResources[item],
            // Can't steal more than what is available (outside bunker)
            Math.floor(availableResources[item] * stealFrac)
          );
          defPlanet.resources[item] -= stolen;
          loot[item] = stolen;
        });
        const totalStolen = Object.values(loot).reduce((sum, val) => sum + val, 0);
        attacker.scores.raiders += totalStolen / 1e3;
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
      combat.winner === "attacker" ? `Your raid on Commander ${report.defenderName}'s station was successful! Plundered ${lootSumTotal.toLocaleString()} resources.` : `Your raiding fleet on Commander ${report.defenderName}'s station was defeated.`,
      "military"
    );
    if (report.defenderId) {
      sendNotificationWithFallback(
        report.defenderId,
        combat.winner === "attacker" ? "\u{1F6A8} STATION BREACH ALERT!" : "\u{1F6E1}\uFE0F Station Defended!",
        combat.winner === "attacker" ? `Commander ${report.attackerName} breached your defenses, plundering ${lootSumTotal.toLocaleString()} resources!` : `Your security systems successfully repelled a raid by Commander ${report.attackerName}!`,
        "attacks"
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
      const travelTimeMs = Math.round(totalDist / slowestTroopSpeed * 36e5);
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
      const travelTimeMs = Math.round(totalDist / fleetSpeed * 36e5);
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
  const projectId = process.env.FIREBASE_PROJECT_ID || "space-station-498022";
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
function sendNotificationWithFallback(userId, title, body, category = "events") {
  if (userId && userId.startsWith("ai_")) {
    return;
  }
  const player = state.players[userId];
  if (player && player.notificationPreferences) {
    const prefs = player.notificationPreferences;
    if (category === "attacks" && prefs.incomingAttacks === false) return;
    if (category === "construction" && prefs.construction === false) return;
    if (category === "research" && prefs.research === false) return;
    if (category === "fleet" && prefs.fleet === false) return;
    if (category === "events" && prefs.events === false) return;
    if (category === "economy" && prefs.economy === false) return;
  }
  const activeSse = activeSseClients.get(userId);
  if (activeSse) {
    console.log(`[Notifications] Active SSE client found for user ${userId}. Dispatching live event.`);
    try {
      activeSse.write(`data: ${JSON.stringify({ title, body, category, timestamp: Date.now() })}

`);
      return;
    } catch (err) {
      console.warn(`[Notifications] Failed to write to active SSE stream for ${userId}. Connection probably broke. Falling back to FCM.`, err);
      activeSseClients.delete(userId);
    }
  }
  console.log(`[Notifications] User ${userId} has no active real-time SSE stream. Executing FCM push notification fallback...`);
  if (player && player.fcmToken) {
    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const priorityVal = category === "attacks" || category === "military" || category === "fleet" ? "high" : "normal";
      const channelIdVal = category || "events";
      const soundVal = category === "attacks" ? "siren" : "default";
      const message = {
        token: player.fcmToken,
        notification: {
          title,
          body
        },
        android: {
          priority: priorityVal,
          notification: {
            channelId: channelIdVal,
            sound: soundVal
          }
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: category === "attacks" ? "siren.caf" : "default",
              badge: 1
            }
          }
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title,
          body,
          category: channelIdVal
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
function getUniqueUsername(baseName) {
  let name = baseName.trim();
  if (!name) name = "Commander";
  let uniqueName = name;
  let suffix = 1;
  const lowercaseNames = new Set(Object.values(state.players).map((p) => p.username.toLowerCase()));
  while (lowercaseNames.has(uniqueName.toLowerCase())) {
    uniqueName = `${name}_${suffix}`;
    suffix++;
  }
  return uniqueName;
}
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
  const limit = getCurrentMapLimits();
  const coords = getSafeRandomCoordinates(limit);
  const startX = coords.x;
  const startY = coords.y;
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
  if (!newPlayer.welcomeMessageSent) {
    newPlayer.welcomeMessageSent = true;
    state.chatMessages.push({
      id: `chat_welcome_${Math.random().toString(36).substr(2, 9)}`,
      channel: "global",
      senderId: "system",
      senderName: "CENTRAL COMMAND",
      senderFaction: "System",
      senderFactionColor: "#7F8C8D",
      allianceTag: "SYS",
      receiverId: null,
      content: `Welcome to the galaxy Beta Test, ${username}! The Galactic Federation welcomes you to Space Station, wishes you a great success in your journey, and appreciates to have you in our ranks. Remember, completing tasks inside your Commander Academy (Station Roadmap) is vital to stabilize the station, each task has claimable rewards with some Space Gold rewarded too! Also, please feel free to send us your thoughts and feedback via the Suggestion Station located in your Settings tab. Good luck, Commander!`,
      timestamp: Date.now()
    });
  }
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
app.all("/api/auth/check-email", (req, res) => {
  const email = req.body?.email || req.query?.email || "";
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const player = Object.values(state.players).find(
    (p) => p.googleEmail && p.googleEmail.toLowerCase() === email.toLowerCase()
  );
  if (player) {
    return res.json({ exists: true, username: player.username });
  } else {
    return res.json({ exists: false });
  }
});
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
}
app.post("/api/auth/google", async (req, res) => {
  const { idToken, email, username, faction } = req.body;
  if (!idToken) {
    if (!email) {
      return res.status(400).json({ error: "Google credentials authorization failed. ID Token or Email is required." });
    }
    try {
      let player = Object.values(state.players).find(
        (p) => p.googleEmail && p.googleEmail.toLowerCase() === email.toLowerCase()
      );
      if (!player) {
        player = Object.values(state.players).find(
          (p) => p.username && (p.username.toLowerCase() === email.toLowerCase() || p.username.toLowerCase() === (username || email.split("@")[0]).toLowerCase())
        );
        if (player) {
          player.googleEmail = email;
          console.log(`[Google Sim] Linked existing user ${player.username} to googleEmail ${email}`);
        }
      }
      if (player) {
        return res.json({ player, isNew: false });
      }
      const uid = `google_sim_${Math.random().toString(36).substring(2, 10)}`;
      const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
      const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
      const selectFaction = faction || factions[0];
      const selectColor = selectFaction === "Nexus Syndicate" ? factionColors[1] : selectFaction === "Eclipse Vanguard" ? factionColors[2] : factionColors[0];
      const defaultUsername = getUniqueUsername(username || email.split("@")[0]);
      const limit = getCurrentMapLimits();
      const coords = getSafeRandomCoordinates(limit);
      const startX = coords.x;
      const startY = coords.y;
      const planet = createInitialPlanet(`${defaultUsername}'s Station`, startX, startY, true);
      planet.resources.water = 5e6;
      planet.resources.plasma = 5e6;
      planet.resources.fuel = 5e6;
      planet.resources.food = 5e6;
      planet.resources.respirant = 5e6;
      const newPlayer = {
        id: uid,
        username: defaultUsername,
        faction: selectFaction,
        factionColor: selectColor,
        allianceId: null,
        allianceRole: null,
        planets: [planet],
        scores: {
          population: 10,
          attack: 0,
          defence: 0,
          raiders: 0
        },
        achievements: ["Google Verified Commander"],
        skinId: "default",
        bannerId: "default",
        lastDailyRewardClaim: Date.now(),
        credits: 1e4,
        googleEmail: email
      };
      state.players[uid] = newPlayer;
      ensureAdminMaxed(newPlayer);
      state.newsEvents.unshift({
        id: `news_${Math.random().toString(36).substr(2, 9)}`,
        title: "Google Commander Registered",
        content: `Commander ${defaultUsername} synced via secure quantum keys!`,
        type: "discovery",
        timestamp: Date.now()
      });
      if (!newPlayer.welcomeMessageSent) {
        newPlayer.welcomeMessageSent = true;
        state.chatMessages.push({
          id: `chat_welcome_${Math.random().toString(36).substr(2, 9)}`,
          channel: "global",
          senderId: "system",
          senderName: "CENTRAL COMMAND",
          senderFaction: "System",
          senderFactionColor: "#7F8C8D",
          allianceTag: "SYS",
          receiverId: null,
          content: `Welcome to the galaxy Beta Test, ${defaultUsername}! The Galactic Federation welcomes you to Space Station, wishes you a great success in your journey, and appreciates to have you in our ranks. Remember, completing tasks inside your Commander Academy (Station Roadmap) is vital to stabilize the station, each task has claimable rewards with some Space Gold rewarded too! Also, please feel free to send us your thoughts and feedback via the Suggestion Station located in your Settings tab. Good luck, Commander!`,
          timestamp: Date.now()
        });
      }
      saveState();
      return res.json({ player: newPlayer, isNew: true });
    } catch (e) {
      console.error("[Google Simulation Error]", e);
      return res.status(500).json({ error: "Failed to simulate Google Sign-in on active station." });
    }
  }
  let decodedToken;
  try {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) {
      throw new Error("Firebase Admin SDK could not be initialized.");
    }
    const admin = {
      auth: () => (0, import_auth.getAuth)(adminApp)
    };
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (verifyErr) {
    console.warn("[Google Auth] Full token signature validation failed, decoding JWT payload as sandbox fallback.", verifyErr);
    const decoded = decodeJwtPayload(idToken);
    if (!decoded) {
      return res.status(401).json({ error: "Google verification keys rejected. Format invalid." });
    }
    decodedToken = {
      uid: decoded.sub || `google_sim_${Math.random().toString(36).substring(2, 10)}`,
      email: decoded.email,
      name: decoded.name || decoded.email?.split("@")[0]
    };
  }
  try {
    const { uid, email: email2, name } = decodedToken;
    let player = state.players[uid];
    if (!player && email2) {
      player = Object.values(state.players).find(
        (p) => p.googleEmail && p.googleEmail.toLowerCase() === email2.toLowerCase()
      );
      if (!player) {
        const defaultName = username || name || email2.split("@")[0];
        player = Object.values(state.players).find(
          (p) => p.username && (p.username.toLowerCase() === email2.toLowerCase() || p.username.toLowerCase() === defaultName.toLowerCase())
        );
      }
      if (player) {
        player.googleEmail = email2;
        const oldId = player.id;
        if (oldId !== uid) {
          player.id = uid;
          state.players[uid] = player;
          delete state.players[oldId];
          console.log(`[Google Auth] Linked existing player ${player.username} (${oldId}) to Google UID: ${uid}`);
        }
      }
    }
    if (player) {
      return res.json({ player, isNew: false });
    }
    if (!username) {
      return res.json({ unregistered: true, email: email2, name, idToken });
    }
    const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
    const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
    const selectFaction = faction || factions[0];
    const selectColor = selectFaction === "Nexus Syndicate" ? factionColors[1] : selectFaction === "Eclipse Vanguard" ? factionColors[2] : factionColors[0];
    const defaultUsername = getUniqueUsername(username || name || (email2 ? email2.split("@")[0] : `Commander_${uid.substring(0, 5)}`));
    const limit = getCurrentMapLimits();
    const coords = getSafeRandomCoordinates(limit);
    const startX = coords.x;
    const startY = coords.y;
    const planet = createInitialPlanet(`${defaultUsername}'s Station`, startX, startY, true);
    planet.resources.water = 5e6;
    planet.resources.plasma = 5e6;
    planet.resources.fuel = 5e6;
    planet.resources.food = 5e6;
    planet.resources.respirant = 5e6;
    const newPlayer = {
      id: uid,
      username: defaultUsername,
      faction: selectFaction,
      factionColor: selectColor,
      allianceId: null,
      allianceRole: null,
      planets: [planet],
      scores: {
        population: 10,
        attack: 0,
        defence: 0,
        raiders: 0
      },
      achievements: ["Google Verified Commander"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now(),
      credits: 1e4,
      googleEmail: email2
    };
    state.players[uid] = newPlayer;
    state.newsEvents.unshift({
      id: `news_${Math.random().toString(36).substr(2, 9)}`,
      title: "Google Commander Registered",
      content: `Commander ${defaultUsername} synced via secure quantum keys!`,
      type: "discovery",
      timestamp: Date.now()
    });
    if (!newPlayer.welcomeMessageSent) {
      newPlayer.welcomeMessageSent = true;
      state.chatMessages.push({
        id: `chat_welcome_${Math.random().toString(36).substr(2, 9)}`,
        channel: "global",
        senderId: "system",
        senderName: "CENTRAL COMMAND",
        senderFaction: "System",
        senderFactionColor: "#7F8C8D",
        allianceTag: "SYS",
        receiverId: null,
        content: `Welcome to the galaxy Beta Test, ${defaultUsername}! The Galactic Federation welcomes you to Space Station, wishes you a great success in your journey, and appreciates to have you in our ranks. Remember, completing tasks inside your Commander Academy (Station Roadmap) is vital to stabilize the station, each task has claimable rewards with some Space Gold rewarded too! Also, please feel free to send us your thoughts and feedback via the Suggestion Station located in your Settings tab. Good luck, Commander!`,
        timestamp: Date.now()
      });
    }
    saveState();
    return res.json({ player: newPlayer, isNew: true });
  } catch (err) {
    console.error("[Google Auth Error]", err);
    return res.status(401).json({ error: `Google login verification failed: ${err.message}` });
  }
});
app.post("/api/auth/google-play", async (req, res) => {
  const { authCode, isSimulated, simulatedProfile } = req.body;
  if (!authCode) {
    return res.status(400).json({ error: "Google Play Games authorization code is required." });
  }
  try {
    let playerId = "";
    let displayName = "GPGS Commander";
    if (isSimulated && (process.env.NODE_ENV !== "production" || !process.env.GOOGLE_PLAY_CLIENT_ID)) {
      console.log("[GPGS Auth] Simulating Google Play Games sign-in for development...");
      playerId = simulatedProfile?.playerId || `gpay_${Math.random().toString(36).substring(2, 10)}`;
      displayName = simulatedProfile?.displayName || `Commander GPGS`;
    } else {
      const clientId = process.env.GOOGLE_PLAY_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_PLAY_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({
          error: "Google Play Games integration is not configured on the server. Please set GOOGLE_PLAY_CLIENT_ID and GOOGLE_PLAY_CLIENT_SECRET in your settings/environment."
        });
      }
      const oauth2Client = new import_google_auth_library.OAuth2Client({
        clientId,
        clientSecret,
        redirectUri: "postmessage"
        // Standard for server-side auth exchange from mobile clients
      });
      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);
      if (tokens.id_token) {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: clientId
        });
        const payload = ticket.getPayload();
        if (payload) {
          playerId = payload.sub;
          displayName = payload.name || `GPGS_${playerId.substring(0, 5)}`;
        }
      }
      if (!playerId && tokens.access_token) {
        const response = await fetch("https://www.googleapis.com/games/v1/players/me", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        });
        if (response.ok) {
          const profileData = await response.json();
          playerId = profileData.playerId || profileData.playerId;
          displayName = profileData.displayName || displayName;
        } else {
          throw new Error("Unable to fetch GPGS profile with access token.");
        }
      }
      if (!playerId) {
        throw new Error("Failed to verify Google Play Player ID.");
      }
    }
    let player = Object.values(state.players).find((p) => p.gpgsPlayerId === playerId);
    if (player) {
      console.log(`[GPGS Auth] Existing user found: ${player.username} (ID: ${player.id})`);
      return res.json({ player, isNew: false });
    }
    const factions = ["Solar Federation", "Nexus Syndicate", "Eclipse Vanguard"];
    const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
    const selectFaction = factions[0];
    const selectColor = factionColors[0];
    const rawUsername = displayName.replace(/[^a-zA-Z0-9_ ]/g, "").substring(0, 15) || `Commander_${playerId.substring(0, 5)}`;
    const cleanUsername = getUniqueUsername(rawUsername);
    const uid = `gpgs_${playerId}`;
    const limit = getCurrentMapLimits();
    const coords = getSafeRandomCoordinates(limit);
    const startX = coords.x;
    const startY = coords.y;
    const planet = createInitialPlanet(`${cleanUsername}'s Station`, startX, startY, true);
    planet.resources.water = 5e6;
    planet.resources.plasma = 5e6;
    planet.resources.fuel = 5e6;
    planet.resources.food = 5e6;
    planet.resources.respirant = 5e6;
    const newPlayer = {
      id: uid,
      username: cleanUsername,
      faction: selectFaction,
      factionColor: selectColor,
      allianceId: null,
      allianceRole: null,
      planets: [planet],
      scores: {
        population: 10,
        attack: 0,
        defence: 0,
        raiders: 0
      },
      achievements: ["GPGS Connected", "Google Verified Commander"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now(),
      credits: 1e4,
      gpgsPlayerId: playerId,
      gpgsDisplayName: displayName
    };
    state.players[uid] = newPlayer;
    state.newsEvents.unshift({
      id: `news_${Math.random().toString(36).substr(2, 9)}`,
      title: "GPGS Commander Joined",
      content: `Commander ${cleanUsername} authorized via Google Play Games!`,
      type: "discovery",
      timestamp: Date.now()
    });
    if (!newPlayer.welcomeMessageSent) {
      newPlayer.welcomeMessageSent = true;
      state.chatMessages.push({
        id: `chat_welcome_${Math.random().toString(36).substr(2, 9)}`,
        channel: "global",
        senderId: "system",
        senderName: "CENTRAL COMMAND",
        senderFaction: "System",
        senderFactionColor: "#7F8C8D",
        allianceTag: "SYS",
        receiverId: null,
        content: `Welcome to the galaxy Beta Test, ${cleanUsername}! The Galactic Federation welcomes you to Space Station, wishes you a great success in your journey, and appreciates to have you in our ranks. Remember, completing tasks inside your Commander Academy (Station Roadmap) is vital to stabilize the station, each task has claimable rewards with some Space Gold rewarded too! Also, please feel free to send us your thoughts and feedback via the Suggestion Station located in your Settings tab. Good luck, Commander!`,
        timestamp: Date.now()
      });
    }
    saveState();
    return res.json({ player: newPlayer, isNew: true });
  } catch (err) {
    console.error("[GPGS Auth Error]", err);
    return res.status(401).json({ error: `Google Play Games verification failed: ${err.message}` });
  }
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
  if (!p.googleEmail || p.googleEmail.toLowerCase() !== "banele180@gmail.com" && p.googleEmail.toLowerCase() !== "banzz1918@gmail.com") {
    return res.status(403).json({ error: "Access Denied: Server reset is only permitted for the system administrator." });
  }
  bootstrapUniverse();
  saveState();
  res.json({ success: true, message: "Universe successfully reset to initial clean data!" });
});
app.post("/api/dev/reset-my-player", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.googleEmail || p.googleEmail.toLowerCase() !== "banele180@gmail.com" && p.googleEmail.toLowerCase() !== "banzz1918@gmail.com") {
    return res.status(403).json({ error: "Access Denied: Player profile reset is restricted to administrator accounts only." });
  }
  delete state.players[p.id];
  saveState();
  res.json({ success: true, message: "Your player profile has been completely removed from the universe." });
});
app.post("/api/dev/run-chaos-simulation", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.googleEmail || p.googleEmail.toLowerCase() !== "banele180@gmail.com" && p.googleEmail.toLowerCase() !== "banzz1918@gmail.com") {
    return res.status(403).json({ error: "Access Denied: Simulation tools are restricted to system administrators." });
  }
  if (!p.planets || p.planets.length === 0) {
    const limit = getCurrentMapLimits();
    const coords = getSafeRandomCoordinates(limit);
    p.planets = [createInitialPlanet(`${p.username}'s Station`, coords.x, coords.y)];
  }
  const adminPlanet = p.planets[0];
  adminPlanet.troops = {
    defender: 4,
    attacker: 0,
    tank: 1e4,
    looter: 0,
    drone: 83333,
    settlementShip: 0
  };
  if (!p.scores) {
    p.scores = { population: 21, attack: 1e7, defence: 0, raiders: 0 };
  } else {
    p.scores.attack = 1e7;
  }
  if (p.allianceId) {
    const oldAlliance = state.alliances[p.allianceId];
    if (oldAlliance) {
      oldAlliance.members = oldAlliance.members.filter((m) => m.playerId !== p.id);
      if (oldAlliance.members.length === 0) {
        delete state.alliances[p.allianceId];
      } else if (oldAlliance.leaderId === p.id) {
        oldAlliance.leaderId = oldAlliance.members[0].playerId;
        oldAlliance.leaderName = oldAlliance.members[0].username;
      }
    }
    p.allianceId = null;
    p.allianceRole = null;
  }
  const allianceId = "alliance_chaos";
  const alliance = {
    id: allianceId,
    name: "Legends of Chaos Alliance",
    tag: "CHAOS",
    leaderId: "ai_legends_of_chaos",
    leaderName: "Legends of Chaos",
    members: [
      { playerId: "ai_legends_of_chaos", username: "Legends of Chaos", role: "leader" },
      { playerId: "member_closest", username: "Alpha Member", role: "member" },
      { playerId: "ai_chaos_member_3", username: "Chaos Guardian", role: "member" }
    ],
    wars: [],
    bannerColor: "#FF007A",
    bannerSymbol: "Shield",
    highlights: "Legends of Chaos AI simulation team."
  };
  state.alliances[allianceId] = alliance;
  const closestCoord = findClusterCoordinate(adminPlanet.sectorX, adminPlanet.sectorY) || { x: adminPlanet.sectorX + 1, y: adminPlanet.sectorY };
  const memberId = "member_closest";
  let memberPlayer = state.players[memberId];
  if (!memberPlayer) {
    const memberPlanet = createInitialPlanet("Fortress Vanguard", closestCoord.x, closestCoord.y);
    memberPlayer = {
      id: memberId,
      username: "Alpha Member",
      faction: p.faction || "Terran Order",
      factionColor: p.factionColor || "#00E5FF",
      allianceId,
      allianceRole: "member",
      planets: [memberPlanet],
      scores: { population: 100, attack: 0, defence: 25e5, raiders: 0 },
      achievements: ["Alliance Protector"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now(),
      credits: 5e3
    };
    state.players[memberId] = memberPlayer;
  } else {
    memberPlayer.allianceId = allianceId;
    memberPlayer.allianceRole = "member";
    if (memberPlayer.planets && memberPlayer.planets.length > 0) {
      memberPlayer.planets[0].sectorX = closestCoord.x;
      memberPlayer.planets[0].sectorY = closestCoord.y;
      memberPlayer.planets[0].name = "Fortress Vanguard";
    } else {
      memberPlayer.planets = [createInitialPlanet("Fortress Vanguard", closestCoord.x, closestCoord.y)];
    }
  }
  memberPlayer.planets[0].troops = {
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 10,
    drone: 20833,
    settlementShip: 0
  };
  const chaosCoord2 = findClusterCoordinate(closestCoord.x, closestCoord.y) || { x: closestCoord.x + 1, y: closestCoord.y + 1 };
  const aiId = "ai_legends_of_chaos";
  let aiPlayer = state.players[aiId];
  if (!aiPlayer) {
    const aiPlanet = createInitialPlanet("Chaos Citadel", chaosCoord2.x, chaosCoord2.y);
    aiPlayer = {
      id: aiId,
      username: "Legends of Chaos",
      faction: "Eclipse Vanguard",
      factionColor: "#FFC700",
      allianceId,
      allianceRole: "leader",
      planets: [aiPlanet],
      scores: { population: 500, attack: 0, defence: 25e5, raiders: 0 },
      achievements: ["Chaos Spawn"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now(),
      credits: 1e5
    };
    state.players[aiId] = aiPlayer;
  } else {
    aiPlayer.allianceId = allianceId;
    aiPlayer.allianceRole = "leader";
    if (aiPlayer.planets && aiPlayer.planets.length > 0) {
      aiPlayer.planets[0].sectorX = chaosCoord2.x;
      aiPlayer.planets[0].sectorY = chaosCoord2.y;
      aiPlayer.planets[0].name = "Chaos Citadel";
    } else {
      aiPlayer.planets = [createInitialPlanet("Chaos Citadel", chaosCoord2.x, chaosCoord2.y)];
    }
  }
  aiPlayer.planets[0].troops = {
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  };
  const chaosCoord3 = findClusterCoordinate(chaosCoord2.x, chaosCoord2.y) || { x: chaosCoord2.x - 1, y: chaosCoord2.y + 1 };
  const aiId3 = "ai_chaos_member_3";
  let aiPlayer3 = state.players[aiId3];
  if (!aiPlayer3) {
    const aiPlanet3 = createInitialPlanet("Chaos Bastion", chaosCoord3.x, chaosCoord3.y);
    aiPlayer3 = {
      id: aiId3,
      username: "Chaos Guardian",
      faction: "Eclipse Vanguard",
      factionColor: "#FFC700",
      allianceId,
      allianceRole: "member",
      planets: [aiPlanet3],
      scores: { population: 500, attack: 0, defence: 25e5, raiders: 0 },
      achievements: ["Chaos Spawn"],
      skinId: "default",
      bannerId: "default",
      lastDailyRewardClaim: Date.now(),
      credits: 1e5
    };
    state.players[aiId3] = aiPlayer3;
  } else {
    aiPlayer3.allianceId = allianceId;
    aiPlayer3.allianceRole = "member";
    if (aiPlayer3.planets && aiPlayer3.planets.length > 0) {
      aiPlayer3.planets[0].sectorX = chaosCoord3.x;
      aiPlayer3.planets[0].sectorY = chaosCoord3.y;
      aiPlayer3.planets[0].name = "Chaos Bastion";
    } else {
      aiPlayer3.planets = [createInitialPlanet("Chaos Bastion", chaosCoord3.x, chaosCoord3.y)];
    }
  }
  aiPlayer3.planets[0].troops = {
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  };
  aiPlayer.createdFleets = [
    {
      id: "fleet_chaos_reinforce_2",
      name: "Chaos Citadel Defense Division",
      subsidiary: "Legends of Chaos",
      troops: {
        defender: 0,
        attacker: 0,
        tank: 0,
        looter: 10,
        drone: 20833,
        settlementShip: 0
      },
      planetId: memberPlayer.planets[0].id,
      activeMissionId: null,
      isTraveling: false
    }
  ];
  aiPlayer3.createdFleets = [
    {
      id: "fleet_chaos_reinforce_3",
      name: "Chaos Bastion Shield Division",
      subsidiary: "Chaos Guardian",
      troops: {
        defender: 0,
        attacker: 0,
        tank: 0,
        looter: 10,
        drone: 20833,
        settlementShip: 0
      },
      planetId: memberPlayer.planets[0].id,
      activeMissionId: null,
      isTraveling: false
    }
  ];
  state.fleets = state.fleets.filter((f) => f.id !== "fleet_chaos_reinforce_2" && f.id !== "fleet_chaos_reinforce_3" && f.id !== "fleet_chaos_reinforce");
  saveState();
  res.json({
    success: true,
    message: "Legends of Chaos simulation successfully initialized! All alliance forces are stationed at Alpha Member's base.",
    details: {
      admin: {
        username: p.username,
        mainStation: adminPlanet.name,
        coords: { x: adminPlanet.sectorX, y: adminPlanet.sectorY },
        troops: adminPlanet.troops,
        attackHp: 1e7,
        alliance: "None"
      },
      allianceMember: {
        username: "Alpha Member",
        stationName: "Fortress Vanguard",
        coords: closestCoord,
        troops: memberPlayer.planets[0].troops,
        defenseHp: 25e5,
        relationToAdmin: "Closest coordinate to admin station"
      },
      dockedAllianceReserveFleets: [
        {
          owner: "Legends of Chaos",
          troops: aiPlayer.createdFleets[0].troops,
          defenseHp: 25e5
        },
        {
          owner: "Chaos Guardian",
          troops: aiPlayer3.createdFleets[0].troops,
          defenseHp: 25e5
        }
      ]
    }
  });
});
app.post("/api/dev/leave-chaos-simulation", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.googleEmail || p.googleEmail.toLowerCase() !== "banele180@gmail.com" && p.googleEmail.toLowerCase() !== "banzz1918@gmail.com") {
    return res.status(403).json({ error: "Access Denied: Simulation tools are restricted to system administrators." });
  }
  if (p.planets && p.planets.length > 0) {
    p.planets[0].troops = {
      defender: 10,
      attacker: 10,
      tank: 2,
      looter: 5,
      drone: 5,
      settlementShip: 0
    };
  }
  delete state.players["member_closest"];
  delete state.players["ai_legends_of_chaos"];
  delete state.players["ai_chaos_member_3"];
  delete state.alliances["alliance_chaos"];
  state.fleets = state.fleets.filter(
    (f) => f.id !== "fleet_chaos_reinforce_2" && f.id !== "fleet_chaos_reinforce_3" && f.id !== "fleet_chaos_reinforce"
  );
  saveState();
  res.json({
    success: true,
    message: "Left Legends of Chaos simulation successfully. Simulated units and alliance cleared."
  });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});
app.all("/api/state", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (req.method === "POST" && req.body && Array.isArray(req.body.createdFleets)) {
    p.createdFleets = req.body.createdFleets;
  }
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
    lastActive: pl.lastActive || now - 6e5,
    isChatBlocked: pl.isChatBlocked || false,
    blockedPlayers: pl.blockedPlayers || []
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
    chatMessages: state.chatMessages.map((msg) => {
      const senderPlayer = state.players[msg.senderId];
      if (senderPlayer && senderPlayer.googleEmail) {
        const email = senderPlayer.googleEmail.toLowerCase();
        if (email === "banele180@gmail.com" || email === "banzz1918@gmail.com") {
          return {
            ...msg,
            senderName: "Galactic Federation",
            senderFaction: "System"
          };
        }
      }
      return msg;
    }),
    fleets: relevantFleets,
    battleReports: state.battleReports.filter((r) => r.attackerId === p.id || r.defenderId === p.id),
    newsEvents: state.newsEvents,
    playersList,
    serverTime: now,
    customTasks: state.customTasks || {},
    maxCoord: getCurrentMapLimits(),
    galaxyConfig: state.galaxyConfig || null
  });
});
app.post("/api/upgrade/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, resType, mineIndex, queue: reqQueue } = req.body;
  const now = Date.now();
  tickPlayerState(p.id, now);
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const mineIndexNum = parseInt(String(mineIndex), 10);
  if (isNaN(mineIndexNum)) return res.status(400).json({ error: "Invalid mine index" });
  const fab = planet.buildings.fabricator;
  if (!fab || fab.level < 1) {
    return res.status(400).json({ error: "A Fabricator level 1 or higher is required to construct or upgrade resource extractors." });
  }
  const mines = planet.mines[resType];
  if (!mines || !mines[mineIndexNum]) return res.status(404).json({ error: "Mine not found" });
  const mine = mines[mineIndexNum];
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
    queuedCount += planet.upgradeQueue.filter((q) => q.type === "mine" && q.key === resType && Number(q.mineIndex) === mineIndexNum).length;
  }
  const targetLevel = mine.level + queuedCount + 1;
  if (targetLevel >= 2) {
    const resourceKeys = ["water", "plasma", "fuel", "food", "respirant"];
    const hasAllExtractorsConstructed = resourceKeys.every((rKey) => {
      const list = planet.mines[rKey];
      if (!list || list.length === 0) return false;
      return list.every((m) => m.level >= 1);
    });
    if (!hasAllExtractorsConstructed) {
      return res.status(400).json({ error: "\u{1F512} Advanced extractor upgrade locked: All 5 resource extractor pump types must be operational (Level 1 or higher) before any extractor can be upgraded to Level 2 or higher!" });
    }
  }
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
      mineIndex: mineIndexNum,
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
  const now = Date.now();
  tickPlayerState(p.id, now);
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
  if (building.level === 0) {
    const fabLevel = planet.buildings.fabricator?.level || 0;
    if (buildingKey === "radar" && fabLevel < 2) {
      return res.status(400).json({ error: "A Fabricator level 2 or higher is required to construct your Radar Array." });
    }
    if (buildingKey === "researchCenter" && fabLevel < 4) {
      return res.status(400).json({ error: "A Fabricator level 4 or higher is required to construct your Research Center." });
    }
    if (buildingKey === "magneticShield" && fabLevel < 10) {
      return res.status(400).json({ error: "A Fabricator level 10 or higher is required to construct your Magnetic Shield." });
    }
    if (buildingKey === "armyBase" && fabLevel < 7) {
      return res.status(400).json({ error: "A Fabricator level 7 or higher is required to construct your War Room/Army Base." });
    }
    if (buildingKey === "supplyNexus" && fabLevel < 10) {
      return res.status(400).json({ error: "A Fabricator level 10 or higher is required to construct your Supply Nexus." });
    }
    if (buildingKey === "bunker" && fabLevel < 10) {
      return res.status(400).json({ error: "A Fabricator level 10 or higher is required to construct your Bunker." });
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
  if (targetLevel >= 2 || buildingKey !== "fabricator") {
    const resourceKeys = ["water", "plasma", "fuel", "food", "respirant"];
    const hasAllExtractorsConstructed = resourceKeys.every((rKey) => {
      const list = planet.mines[rKey];
      if (!list || list.length === 0) return false;
      return list.every((mine) => mine.level >= 1);
    });
    if (!hasAllExtractorsConstructed) {
      if (targetLevel === 1) {
        return res.status(400).json({ error: "\u{1F512} Facility construction locked: All 5 resource extractor pump types must be operational (Level 1 or higher) before any facility other than the Fabricator can be constructed!" });
      } else {
        return res.status(400).json({ error: "\u{1F512} Advanced construction/upgrade locked: All 5 resource extractor pump types must be operational (Level 1 or higher) before any facility can be upgraded to Level 2 or higher!" });
      }
    }
  }
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
  const now = Date.now();
  tickPlayerState(p.id, now);
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const rc = planet.buildings.researchCenter;
  if (!rc || rc.level < 1) {
    return res.status(400).json({ error: "A Research Center level 1 or higher is required to start research projects." });
  }
  if (planet.activeResearch) {
    return res.status(400).json({ error: "Another research project is already actively in progress on this planet." });
  }
  const currentLvl = Number(req.body.currentLevel) || 0;
  const targetLevel = currentLvl + 1;
  const rcLevel = rc.level;
  if (targetLevel > rcLevel) {
    return res.status(400).json({ error: `\u{1F512} Research technology level cannot exceed your Research Center level of ${rcLevel}! Upgrade your Research Center first.` });
  }
  if (targetLevel >= 2) {
    const resourceKeys = ["water", "plasma", "fuel", "food", "respirant"];
    const hasAllExtractorsConstructed = resourceKeys.every((rKey) => {
      const list = planet.mines[rKey];
      if (!list || list.length === 0) return false;
      return list.every((m) => m.level >= 1);
    });
    if (!hasAllExtractorsConstructed) {
      return res.status(400).json({ error: "\u{1F512} Advanced research locked: All 5 resource extractor pump types must be operational (Level 1 or higher) before any technology can be upgraded to Level 2 or higher!" });
    }
  }
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
  const now = Date.now();
  tickPlayerState(p.id, now);
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const rc = planet.buildings.researchCenter;
  if (!rc || rc.level < 1) {
    return res.status(400).json({ error: "A Research Center level 1 or higher is required to queue research projects." });
  }
  if (!planet.researchQueue) {
    planet.researchQueue = [];
  }
  if (planet.researchQueue.length >= 25) {
    return res.status(400).json({ error: "Research queue is full (max 25 queued research projects allowed)!" });
  }
  if ((p.credits || 0) < 25) {
    return res.status(400).json({ error: "Insufficient Space Gold credits available! Queuing a research upgrade costs 25 Space Gold." });
  }
  const currentLvl = Number(req.body.currentLevel) || 0;
  let queuedCount = 0;
  if (planet.activeResearch && planet.activeResearch.techId === techId) {
    queuedCount++;
  }
  queuedCount += planet.researchQueue.filter((q) => q.key === techId).length;
  const targetLevel = currentLvl + queuedCount + 1;
  const rcLevel = rc.level;
  if (targetLevel > rcLevel) {
    return res.status(400).json({ error: `\u{1F512} Research technology level cannot exceed your Research Center level of ${rcLevel}! Upgrade your Research Center first.` });
  }
  if (targetLevel >= 2) {
    const resourceKeys = ["water", "plasma", "fuel", "food", "respirant"];
    const hasAllExtractorsConstructed = resourceKeys.every((rKey) => {
      const list = planet.mines[rKey];
      if (!list || list.length === 0) return false;
      return list.every((m) => m.level >= 1);
    });
    if (!hasAllExtractorsConstructed) {
      return res.status(400).json({ error: "\u{1F512} Advanced research locked: All 5 resource extractor pump types must be operational (Level 1 or higher) before any technology can be upgraded to Level 2 or higher!" });
    }
  }
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
  planet.researchQueue.push({
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
  const { planetId, queueIndex, queueType } = req.body;
  const now = Date.now();
  tickPlayerState(p.id, now);
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const isResearch = queueType === "research";
  const queue = isResearch ? planet.researchQueue : planet.upgradeQueue;
  if (!queue || queueIndex === void 0 || queueIndex < 0 || queueIndex >= queue.length) {
    return res.status(400).json({ error: "Invalid queue item index." });
  }
  const [cancelledItem] = queue.splice(queueIndex, 1);
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
  const now = Date.now();
  tickPlayerState(p.id, now);
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const resourceKeys = ["water", "plasma", "fuel", "food", "respirant"];
  const hasAllExtractorsConstructed = resourceKeys.every((rKey) => {
    const list = planet.mines[rKey];
    if (!list || list.length === 0) return false;
    return list.every((mine) => mine.level >= 1);
  });
  if (!hasAllExtractorsConstructed) {
    return res.status(400).json({ error: "\u{1F512} Fabrication locked: All resource extractor pumps on this base must be constructed (Level 1 or higher) before you can fabricate tactical forces!" });
  }
  const specs = TROOP_SPECS[troopId];
  if (!specs) return res.status(404).json({ error: "Troop spec not found" });
  const rawQuantity = req.body.count !== void 0 ? req.body.count : req.body.quantity;
  const count = Math.floor(Number(rawQuantity));
  if (isNaN(count) || count <= 0 || count > 1e6) {
    return res.status(400).json({ error: "Invalid training quantity. Quantity must be a valid number between 1 and 1,000,000." });
  }
  if ((p.credits || 0) < 0) {
    return res.status(400).json({ error: "Insufficient credits. Your commander keys report a negative balance!" });
  }
  const troopCosts = {
    defender: { water: 750, plasma: 0, fuel: 0, food: 1e3, respirant: 500 },
    attacker: { water: 1500, plasma: 2250, fuel: 2250, food: 1500, respirant: 0 },
    tank: { water: 0, plasma: 4e3, fuel: 6e3, food: 0, respirant: 2e3 },
    looter: { water: 2500, plasma: 0, fuel: 1e3, food: 2e3, respirant: 0 },
    drone: { water: 5e3, plasma: 5e3, fuel: 7500, food: 0, respirant: 2500 },
    settlementShip: { water: 7500, plasma: 5e3, fuel: 1e4, food: 7500, respirant: 5e3 }
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
      return res.status(400).json({ error: "To queue/train a Settlement Ship, ALL of your War Rooms must be upgraded to Level 22 or higher!" });
    }
    const hasActiveBaseLevel1 = (planet.buildings.armyBase?.level || 0) >= 1;
    if (!hasActiveBaseLevel1) {
      return res.status(400).json({ error: "To build a Settlement Ship, this base's War Room must be upgraded to Level 1!" });
    }
    if (count > 1) {
      return res.status(400).json({ error: "You can only construct one Settlement Ship at a time!" });
    }
    const isAdminPlayer = p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
    if (!isAdminPlayer) {
      const totalBasesShipCount = p.planets.reduce((acc, pl) => acc + (pl.troops?.settlementShip || 0), 0);
      const totalFleetsShipCount = state.fleets.filter((f) => f.senderId === p.id).reduce((acc, f) => acc + (f.troops?.settlementShip || 0), 0);
      const totalTrainingShipCount = p.planets.reduce((acc, pl) => {
        const trainingShips = pl.trainingQueue?.filter((item) => item.troopId === "settlementShip").reduce((sum, item) => sum + item.count, 0) || 0;
        return acc + trainingShips;
      }, 0);
      const totalSettlementShips = totalBasesShipCount + totalFleetsShipCount + totalTrainingShipCount;
      if (totalSettlementShips >= 1) {
        return res.status(400).json({ error: "You cannot have more than 1 Settlement Ship in total across all bases, fleets, and construction queues!" });
      }
    } else {
      const currentShipCount = planet.troops.settlementShip || 0;
      if (currentShipCount >= 1) {
        return res.status(400).json({ error: "You can only have one Settlement Ship on each base!" });
      }
      const isAlreadyTraining = planet.trainingQueue.some((item) => item.troopId === "settlementShip");
      if (isAlreadyTraining) {
        return res.status(400).json({ error: "One Settlement Ship is already in the construction queue." });
      }
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
  const mfgLvl = getPlanetTechLevel(p, planet.id, "manufacturing_speed");
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
  const now = Date.now();
  tickPlayerState(p.id, now);
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
        allianceId: player.allianceId || null,
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
  const hasSettlementShipInStation = planet && (planet.troops?.settlementShip || 0) > 0;
  if (hasSettlementShipInStation) {
    const limit = getCurrentMapLimits();
    const occupiedCoords = /* @__PURE__ */ new Set();
    Object.values(state.players).forEach((player) => {
      if (player.planets) {
        player.planets.forEach((pl) => {
          occupiedCoords.add(`${pl.sectorX}_${pl.sectorY}`);
        });
      }
    });
    if (state.habitablePlanets) {
      state.habitablePlanets.forEach((hp) => {
        occupiedCoords.add(`${hp.coords.x}_${hp.coords.y}`);
      });
    }
    for (let x = 0; x <= limit; x++) {
      for (let y = 0; y <= limit; y++) {
        const coordKey = `${x}_${y}`;
        if (!occupiedCoords.has(coordKey)) {
          const dist = Math.hypot(x - cx, y - cy);
          allTargets.push({
            id: "unsettled",
            username: "Uncharted Space",
            faction: "Unsettled Grid Space",
            factionColor: "#64748b",
            // slate gray
            allianceTag: null,
            planetId: `unsettled_${x}_${y}`,
            planetName: "Unsettled Coordinate",
            coords: { x, y },
            scores: { population: 0, attack: 0, defence: 0, raiders: 0 },
            dist,
            isUnsettled: true,
            isHabitable: false
          });
        }
      }
    }
  }
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
        isHabitable: true,
        extractors: getOrGenerateHabitableExtractors(hp)
      });
    });
  }
  allTargets.sort((a, b) => a.dist - b.dist);
  const maxScanDist = scanRadius * 10;
  const habTargets = allTargets.filter((t) => t.isHabitable);
  const unsettledTargets = allTargets.filter((t) => t.isUnsettled);
  const otherTargets = allTargets.filter((t) => !t.isHabitable && !t.isUnsettled);
  let visibleOthers = otherTargets.filter((t) => t.dist <= maxScanDist);
  if (visibleOthers.length < 12) {
    const remainingOthers = otherTargets.filter((t) => !visibleOthers.some((vo) => vo.planetId === t.planetId));
    visibleOthers = [...visibleOthers, ...remainingOthers].slice(0, 15);
  }
  const visibleHabs = habTargets;
  const visibleUnsettled = unsettledTargets.slice(0, 50);
  let targets = [...visibleOthers, ...visibleHabs, ...visibleUnsettled];
  targets.sort((a, b) => a.dist - b.dist);
  saveState();
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
      commanderAllianceId: targetUser.allianceId,
      commanderAllianceName: targetUser.allianceId ? state.alliances[targetUser.allianceId]?.name || "" : void 0,
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
      dockedReserveFleets: (() => {
        const fleetsList = [];
        Object.values(state.players).forEach((pObj) => {
          if (pObj.createdFleets) {
            pObj.createdFleets.forEach((cf) => {
              if (cf.planetId === targetPlanet.id && (!cf.isTraveling || !cf.activeMissionId)) {
                fleetsList.push({
                  id: cf.id,
                  name: cf.name,
                  ownerId: pObj.id,
                  ownerName: pObj.username,
                  allianceId: pObj.allianceId,
                  troops: cf.troops
                });
              }
            });
          }
        });
        return fleetsList;
      })(),
      resources: targetPlanet.resources,
      lastActive: targetUser.lastActive || now - 6e5,
      timestamp: now
    };
  } else {
    if (isHab) {
      report = {
        type: "habitable",
        planetName: isHab.name,
        coords: { x: xVal, y: yVal },
        description: "This is a pristine uncharted habitable planetary zone rich in basic elements. No planetary defense batteries or garrison troops detected. Clear for direct colony settlement ships.",
        extractors: getOrGenerateHabitableExtractors(isHab),
        timestamp: now
      };
    } else {
      report = {
        type: "void",
        coords: { x: xVal, y: yVal },
        description: "Deep space coordinates. Absolute zero cold vacuum. Remote sensors indicate no industrial installations, troop radar footprints, or spacecraft energy signatures at these coordinates.",
        timestamp: now
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
    dockedReserveFleets: targetPlanet ? (() => {
      const fleetsList = [];
      Object.values(state.players).forEach((pObj) => {
        if (pObj.createdFleets) {
          pObj.createdFleets.forEach((cf) => {
            if (cf.planetId === targetPlanet.id && (!cf.isTraveling || !cf.activeMissionId)) {
              fleetsList.push({
                id: cf.id,
                name: cf.name,
                ownerId: pObj.id,
                ownerName: pObj.username,
                allianceId: pObj.allianceId,
                troops: cf.troops
              });
            }
          });
        }
      });
      return fleetsList;
    })() : void 0,
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
  const { planetId, missionType, troops, targetId, targetName, targetBuilding, createdFleetId, landingTime } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  const limit = getCurrentMapLimits();
  if (isNaN(targetX) || isNaN(targetY) || targetX < 0 || targetX > limit || targetY < 0 || targetY > limit) {
    return res.status(400).json({ error: `Invalid target coordinates. Targeted sector must be within universe boundaries (0-${limit} allowed)` });
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
    if (p.planets.length >= 20) {
      return res.status(400).json({ error: "Command limits reached. Max 20 colonized colony planets." });
    }
    let targetHabitable = state.habitablePlanets?.find((hp) => hp.coords.x === targetX && hp.coords.y === targetY);
    if (!targetHabitable) {
      let occupied = false;
      for (const playerObj of Object.values(state.players)) {
        if (playerObj.planets && playerObj.planets.some((pl) => pl.sectorX === targetX && pl.sectorY === targetY)) {
          occupied = true;
          break;
        }
      }
      if (occupied) {
        return res.status(400).json({ error: "These coordinates have already been colonized by another commander!" });
      }
      if (!state.habitablePlanets) {
        state.habitablePlanets = [];
      }
      const namesPool = ["New Terra", "Genesis Prime", "Nova Aura", "Verdant Outpost", "Apex Junction"];
      const randomName = namesPool[Math.floor(Math.random() * namesPool.length)] + ` [${targetX}, ${targetY}]`;
      const newHab = {
        id: `hab_${targetX}_${targetY}`,
        name: randomName,
        coords: { x: targetX, y: targetY },
        isColonized: false,
        extractors: { water: 1, plasma: 1, fuel: 1, food: 1, respirant: 1 }
      };
      state.habitablePlanets.push(newHab);
      targetHabitable = newHab;
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
  if (missionType === "attack") {
    const destPlanet = p.planets.find((pl) => pl.sectorX === targetX && pl.sectorY === targetY);
    if (destPlanet) {
      return res.status(400).json({ error: "Friendly fire protocols active: You are strictly prohibited from attacking your own stations or colony bases!" });
    }
    if (p.allianceId) {
      for (const playerObj of Object.values(state.players)) {
        if (playerObj.id !== p.id && playerObj.allianceId === p.allianceId) {
          const memberPlanet = playerObj.planets.find((pl) => pl.sectorX === targetX && pl.sectorY === targetY);
          if (memberPlanet) {
            return res.status(400).json({ error: `Alliance mutual non-aggression pact active: You cannot attack stations belonging to your own alliance member ${playerObj.username}!` });
          }
        }
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
  const speedLvl = getPlanetTechLevel(p, planet.id, "troop_speed");
  const shieldsLvl = getPlanetTechLevel(p, planet.id, "defense_shields");
  const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
  const speedMultiplier = 1 + boostPct;
  const slowestTroopSpeed = Object.entries(troopSend).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
    const sp = TROOP_SPECS[tId]?.speed || 5;
    return sp < slowest ? sp : slowest;
  }, 100) * speedMultiplier;
  const travelTimeMs = Math.round(dist / slowestTroopSpeed * 36e5);
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
  let resolvedArrivesAt = now + travelTimeMs;
  let isTimed = false;
  if (landingTime) {
    const requestedLandingTimeMs = parseInt(String(landingTime), 10);
    if (!isNaN(requestedLandingTimeMs)) {
      const minLandingTime = now + travelTimeMs - 15e3;
      const maxLandingTime = now + 24 * 3600 * 1e3 + 6e4;
      if (requestedLandingTimeMs < minLandingTime) {
        return res.status(400).json({ error: "The coordinate landing time cannot be earlier than standard flight travel duration!" });
      }
      if (requestedLandingTimeMs > maxLandingTime) {
        return res.status(400).json({ error: "The coordinate landing time cannot exceed the maximum 24 hour flight window!" });
      }
      resolvedArrivesAt = requestedLandingTimeMs;
      isTimed = true;
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
    arrivesAt: resolvedArrivesAt,
    isReturning: false,
    isWaitingToSettle: false,
    targetBuilding: targetBuilding || void 0,
    troopSpeedLevel: speedLvl,
    defenseShieldsLevel: shieldsLvl,
    createdFleetId: createdFleetId || void 0,
    isTimed
  };
  state.fleets.push(mission);
  saveState();
  if (missionType === "attack" && resolvedTargetId && resolvedTargetId !== "habitable") {
    sendNotificationWithFallback(
      resolvedTargetId,
      "\u{1F6A8} IMMEDIATE ALERT: INCOMING HOSTILE FLEET DETECTION!",
      `Warning: Commander ${p.username} has launched a hostile attack fleet targeting your station! Proximity trackers estimate zero-hour impact in ${Math.round(travelTimeMs / 1e3 / 60)} minutes. Activate magnetic shields immediately!`,
      "attacks"
    );
  }
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
  if (p.planets.length >= 20) {
    return res.status(400).json({ error: "Command limits reached. Max 20 colony planets." });
  }
  const targetX = fleet.targetCoords.x;
  const targetY = fleet.targetCoords.y;
  let customExt = void 0;
  if (state.habitablePlanets) {
    const matchedHp = state.habitablePlanets.find((item) => Number(item.coords.x) === Number(targetX) && Number(item.coords.y) === Number(targetY));
    if (matchedHp) {
      customExt = getOrGenerateHabitableExtractors(matchedHp);
      matchedHp.isColonized = true;
    }
  }
  const newPlanet = createInitialPlanet(planetName, targetX, targetY, false, customExt);
  const finalX = newPlanet.sectorX;
  const finalY = newPlanet.sectorY;
  if (state.habitablePlanets) {
    const hp = state.habitablePlanets.find((item) => Number(item.coords.x) === Number(finalX) && Number(item.coords.y) === Number(finalY));
    if (hp) {
      hp.isColonized = true;
    }
  }
  Object.entries(fleet.troops).forEach(([tId, count]) => {
    newPlanet.troops[tId] = count;
  });
  const isAdminPlayer = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  if (!isAdminPlayer) {
    newPlanet.troops.settlementShip = 0;
  } else {
    newPlanet.troops.settlementShip = 1;
  }
  p.planets.push(newPlanet);
  ensureAdminMaxed(p);
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Planet Settled",
    content: `${p.username} has established a new settled research colony at sector [${finalX}, ${finalY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });
  state.fleets.splice(fleetIndex, 1);
  ensureMinimumHabitablePlanets();
  saveState();
  return res.json({ player: p, success: true, fleets: state.fleets });
});
app.post("/api/colonize", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  const limit = getCurrentMapLimits();
  if (isNaN(targetX) || isNaN(targetY) || targetX < 0 || targetX > limit || targetY < 0 || targetY > limit) {
    return res.status(400).json({ error: `Invalid coordinates. Targeted sector must be within universe boundaries (0-${limit} allowed)` });
  }
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) {
    return res.status(404).json({ error: "Sending planet or space station not found!" });
  }
  if ((planet.buildings.armyBase?.level || 0) < 22) {
    return res.status(400).json({ error: "Colonization command requires a Level 22 War Room!" });
  }
  if ((planet.troops.settlementShip || 0) < 1) {
    return res.status(400).json({ error: "You need at least 1 Settlement Ship in your station's army base to colonize!" });
  }
  if (p.planets.length >= 20) {
    return res.status(400).json({ error: "Command limits reached. Max 20 colonized planets allowed." });
  }
  let isVacant = true;
  for (const playerObj of Object.values(state.players)) {
    if (playerObj.planets && playerObj.planets.some((pl) => pl.sectorX === targetX && pl.sectorY === targetY)) {
      isVacant = false;
      break;
    }
  }
  if (isVacant) {
    const isHabitableOccupied = state.habitablePlanets?.some((hp2) => hp2.coords.x === targetX && hp2.coords.y === targetY && hp2.isColonized);
    if (isHabitableOccupied) {
      isVacant = false;
    }
  }
  let finalX = targetX;
  let finalY = targetY;
  if (!isVacant) {
    const vacantCoords = findClusterCoordinate(targetX, targetY);
    if (!vacantCoords) {
      return res.status(400).json({ error: "All nearby coordinates in the star system cluster are fully colonized!" });
    }
    finalX = vacantCoords.x;
    finalY = vacantCoords.y;
  }
  planet.troops.settlementShip -= 1;
  let hp = state.habitablePlanets?.find((item) => Number(item.coords.x) === Number(targetX) && Number(item.coords.y) === Number(targetY));
  if (!hp) {
    hp = state.habitablePlanets?.find((item) => Number(item.coords.x) === Number(finalX) && Number(item.coords.y) === Number(finalY));
  }
  if (hp) {
    hp.isColonized = true;
  }
  const newColonyName = hp ? hp.name : `${p.username}'s Colony [${finalX}, ${finalY}]`;
  let customExt = void 0;
  if (hp) {
    customExt = getOrGenerateHabitableExtractors(hp);
  }
  const newPlanet = createInitialPlanet(newColonyName, finalX, finalY, false, customExt);
  p.planets.push(newPlanet);
  ensureAdminMaxed(p);
  state.newsEvents.unshift({
    id: `news_${Math.random().toString(36).substr(2, 9)}`,
    title: "Quantum Colony Established",
    content: `${p.username} has established a new settled research colony at sector [${finalX}, ${finalY}]!`,
    type: "discovery",
    timestamp: Date.now()
  });
  ensureMinimumHabitablePlanets();
  saveState();
  return res.json({
    success: true,
    planet: newPlanet,
    player: p,
    message: isVacant ? `Successfully colonized sector [${finalX}, ${finalY}]!` : `Target sector was occupied. Auto-rerouted and colonized vacant sector [${finalX}, ${finalY}]!`
  });
});
app.post("/api/fleet/reroute", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { fleetId, missionType } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
  const limit = getCurrentMapLimits();
  if (isNaN(targetX) || isNaN(targetY) || targetX < 0 || targetX > limit || targetY < 0 || targetY > limit) {
    return res.status(400).json({ error: `Invalid target grid coordinates (0-${limit} allowed)` });
  }
  const fleet = state.fleets.find((f) => f.id === fleetId && f.senderId === p.id);
  if (!fleet) {
    return res.status(404).json({ error: "Active mission fleet not found or not owned by you" });
  }
  if (fleet.missionType === "attack" && !fleet.isWaitingToSettle && !fleet.isReturning) {
    const totalDuration = fleet.arrivesAt - fleet.startedAt;
    const elapsed = Date.now() - fleet.startedAt;
    const progressPercent = totalDuration > 0 ? elapsed / totalDuration * 100 : 0;
    if (progressPercent > 45) {
      return res.status(400).json({
        error: `Reroute denied! Attack fleet has completed ${Math.round(progressPercent)}% of its journey (maximum 45% allowed for cancel or reroute).`
      });
    }
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
  const isLanded = !!fleet.isWaitingToSettle;
  const originX = isLanded ? fleet.targetCoords.x : fleet.senderCoords.x;
  const originY = isLanded ? fleet.targetCoords.y : fleet.senderCoords.y;
  const dx = targetX - originX;
  const dy = targetY - originY;
  const dist = Math.hypot(dx, dy);
  const speedLvl = fleet.troopSpeedLevel || 1;
  const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
  const speedMultiplier = 1 + boostPct;
  const slowestTroopSpeed = Object.entries(fleet.troops).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
    const sp = TROOP_SPECS[tId]?.speed || 5;
    return sp < slowest ? sp : slowest;
  }, 100) * speedMultiplier;
  const travelTimeMs = Math.round(dist / slowestTroopSpeed * 36e5);
  const now = Date.now();
  if (isLanded) {
    fleet.senderCoords = { x: originX, y: originY };
  }
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
app.post("/api/fleet/cancel", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { fleetId } = req.body;
  const fleet = state.fleets.find((f) => f.id === fleetId && f.senderId === p.id);
  if (!fleet) {
    return res.status(404).json({ error: "Active mission fleet not found or not owned by you" });
  }
  if (fleet.isReturning) {
    return res.status(400).json({ error: "This fleet is already returning to its home coordinates!" });
  }
  const now = Date.now();
  if (fleet.missionType === "attack" && !fleet.isWaitingToSettle) {
    const totalDuration = fleet.arrivesAt - fleet.startedAt;
    const elapsed = now - fleet.startedAt;
    const progressPercent = totalDuration > 0 ? elapsed / totalDuration * 100 : 0;
    if (progressPercent > 45) {
      return res.status(400).json({
        error: `Recall denied! Attack fleet has completed ${Math.round(progressPercent)}% of its journey (maximum 45% allowed for cancel/recall).`
      });
    }
  }
  if (fleet.isWaitingToSettle) {
    const dx = fleet.senderCoords.x - fleet.targetCoords.x;
    const dy = fleet.senderCoords.y - fleet.targetCoords.y;
    const dist = Math.hypot(dx, dy);
    const speedLvl = fleet.troopSpeedLevel || 1;
    const boostPct = Math.max(0, Math.min(35, (speedLvl - 1) * (35 / 19))) / 100;
    const speedMultiplier = 1 + boostPct;
    const slowestTroopSpeed = Object.entries(fleet.troops).filter(([_, qty]) => qty > 0).reduce((slowest, [tId, _]) => {
      const sp = TROOP_SPECS[tId]?.speed || 5;
      return sp < slowest ? sp : slowest;
    }, 100) * speedMultiplier;
    const travelTimeMs = Math.round(dist / slowestTroopSpeed * 36e5);
    fleet.isReturning = true;
    fleet.isWaitingToSettle = false;
    fleet.startedAt = now;
    fleet.arrivesAt = now + travelTimeMs;
  } else {
    const elapsed = now - fleet.startedAt;
    const returnDuration = Math.max(0, elapsed);
    fleet.isReturning = true;
    fleet.startedAt = now;
    fleet.arrivesAt = now + returnDuration;
  }
  saveState();
  res.json({ player: p, success: true, fleets: state.fleets });
});
app.post("/api/player/settings", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { autoUnloadResources } = req.body;
  p.autoUnloadResources = !!autoUnloadResources;
  state.players[p.id].autoUnloadResources = !!autoUnloadResources;
  saveState();
  res.json({ player: p, success: true });
});
app.get("/api/player/notification-preferences", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.notificationPreferences) {
    p.notificationPreferences = {
      incomingAttacks: true,
      construction: true,
      research: true,
      fleet: true,
      events: true,
      economy: true
    };
  }
  res.json({ success: true, preferences: p.notificationPreferences });
});
app.post("/api/player/notification-preferences", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== "object") {
    return res.status(400).json({ error: "Invalid preferences payload" });
  }
  p.notificationPreferences = {
    incomingAttacks: preferences.incomingAttacks !== false,
    construction: preferences.construction !== false,
    research: preferences.research !== false,
    fleet: preferences.fleet !== false,
    events: preferences.events !== false,
    economy: preferences.economy !== false
  };
  saveState();
  res.json({ success: true, preferences: p.notificationPreferences });
});
app.post("/api/fleet/unload", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { fleetId, createdFleets } = req.body;
  if (Array.isArray(createdFleets)) {
    p.createdFleets = createdFleets;
  }
  if (!p.createdFleets) p.createdFleets = [];
  const fleet = p.createdFleets.find((f) => f.id === fleetId);
  if (!fleet) return res.status(404).json({ error: "Reserve fleet not found" });
  if (fleet.isTraveling) {
    return res.status(400).json({ error: "Cannot unload resources from a traveling fleet!" });
  }
  let planet = p.planets.find((pl) => pl.id === fleet.planetId);
  let recipientPlayer = p;
  if (!planet && p.allianceId) {
    for (const otherPlayer of Object.values(state.players)) {
      if (otherPlayer.allianceId === p.allianceId) {
        const foundPlanet = otherPlayer.planets.find((pl) => pl.id === fleet.planetId);
        if (foundPlanet) {
          const senderHasLvl8Nexus = p.planets.some((pl) => (pl.buildings.supplyNexus?.level || 0) >= 8);
          if (!senderHasLvl8Nexus) {
            return res.status(400).json({ error: "You must upgrade your Supply Nexus to Level 8 or higher on your station to drop/unload resources at alliance members!" });
          }
          planet = foundPlanet;
          recipientPlayer = otherPlayer;
          break;
        }
      }
    }
  }
  if (!planet) return res.status(404).json({ error: "Destination station not found or not in your alliance!" });
  const cap = getRepositoryCapacity(planet.buildings.repository.level);
  if (fleet.resources) {
    Object.entries(fleet.resources).forEach(([resName, amt]) => {
      const amount = Number(amt) || 0;
      if (amount > 0) {
        const current = planet.resources[resName] || 0;
        const addable = Math.min(cap - current, amount);
        planet.resources[resName] = current + addable;
        fleet.resources[resName] = amount - addable;
      }
    });
  }
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/fleet/transfer-resources", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { fleetId, transfers, createdFleets } = req.body;
  if (Array.isArray(createdFleets)) {
    p.createdFleets = createdFleets;
  }
  if (!p.createdFleets) p.createdFleets = [];
  const fleet = p.createdFleets.find((f) => f.id === fleetId);
  if (!fleet) return res.status(404).json({ error: "Reserve fleet not found" });
  if (fleet.isTraveling) {
    return res.status(400).json({ error: "Cannot transfer resources with a traveling fleet!" });
  }
  const planet = p.planets.find((pl) => pl.id === fleet.planetId);
  if (!planet) return res.status(404).json({ error: "Home station not found" });
  const supplyNexusLvl = planet.buildings.supplyNexus?.level || 0;
  if (supplyNexusLvl < 5) {
    return res.status(400).json({ error: "You must upgrade your Supply Nexus to Level 5 or higher to load/carry cargo on fleets!" });
  }
  const cap = getRepositoryCapacity(planet.buildings.repository.level);
  if (!fleet.resources) {
    fleet.resources = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
  }
  let fleetCapacity = 0;
  Object.entries(fleet.troops).forEach(([tId, qty]) => {
    const spec = TROOP_SPECS[tId];
    if (spec) {
      fleetCapacity += (Number(qty) || 0) * spec.carry;
    }
  });
  let currentTotalFleetResources = Object.values(fleet.resources).reduce((sum, v) => sum + (Number(v) || 0), 0);
  for (const [resName, value] of Object.entries(transfers || {})) {
    const val = parseInt(String(value), 10) || 0;
    if (val === 0) continue;
    const key = resName;
    if (planet.resources[key] === void 0) continue;
    const currentPlanetAmt = planet.resources[key] || 0;
    const currentFleetAmt = fleet.resources[key] || 0;
    if (val > 0) {
      const spaceLeft = Math.max(0, fleetCapacity - currentTotalFleetResources);
      const toTransfer = Math.min(val, currentPlanetAmt, spaceLeft);
      planet.resources[key] = currentPlanetAmt - toTransfer;
      fleet.resources[key] = currentFleetAmt + toTransfer;
      currentTotalFleetResources += toTransfer;
    } else {
      const toTransfer = Math.min(Math.abs(val), currentFleetAmt);
      const planetSpace = Math.max(0, cap - currentPlanetAmt);
      const actualTransfer = Math.min(toTransfer, planetSpace);
      planet.resources[key] = currentPlanetAmt + actualTransfer;
      fleet.resources[key] = currentFleetAmt - actualTransfer;
      currentTotalFleetResources -= actualTransfer;
    }
  }
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/fleet/disassemble-all", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, createdFleets } = req.body;
  if (Array.isArray(createdFleets)) {
    p.createdFleets = createdFleets;
  }
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  if (!p.createdFleets) p.createdFleets = [];
  const dockedFleets = p.createdFleets.filter((f) => f.planetId === planetId && !f.isTraveling);
  if (dockedFleets.length === 0) {
    return res.status(400).json({ error: "No docked fleets to disassemble on this station." });
  }
  const cap = getRepositoryCapacity(planet.buildings.repository.level);
  dockedFleets.forEach((fleet) => {
    for (const [tId, qty] of Object.entries(fleet.troops)) {
      const q = Number(qty) || 0;
      if (q > 0) {
        planet.troops[tId] = (planet.troops[tId] || 0) + q;
      }
    }
    if (fleet.resources) {
      Object.entries(fleet.resources).forEach(([resName, amt]) => {
        const amount = Number(amt) || 0;
        if (amount > 0) {
          const current = planet.resources[resName] || 0;
          const addable = Math.min(Math.max(0, cap - current), amount);
          planet.resources[resName] = current + addable;
        }
      });
    }
  });
  p.createdFleets = p.createdFleets.filter((f) => !(f.planetId === planetId && !f.isTraveling));
  saveState();
  res.json({ player: p, success: true });
});
app.post("/api/player/rename", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { newUsername } = req.body;
  if (!newUsername || !newUsername.trim()) {
    return res.status(400).json({ error: "Commander name is required" });
  }
  const desiredName = censorFoulLanguage(newUsername.trim());
  if (desiredName.length > 25) {
    return res.status(400).json({ error: "Commander name must be 25 characters or less" });
  }
  const exists = Object.values(state.players).some(
    (player) => player.id !== p.id && player.username.toLowerCase() === desiredName.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "That commander name is already registered in the database!" });
  }
  const currentCount = p.renameCount || 0;
  let chargeAmount = 0;
  if (currentCount >= 2) {
    chargeAmount = 1e3;
    if ((p.credits || 0) < chargeAmount) {
      return res.status(400).json({ error: `Insufficient Space gold. Renaming costs 1,000 Space gold (Current: ${p.credits || 0}).` });
    }
  }
  if (chargeAmount > 0) {
    p.credits = (p.credits || 0) - chargeAmount;
  }
  p.renameCount = currentCount + 1;
  p.username = desiredName;
  state.players[p.id].username = desiredName;
  state.players[p.id].renameCount = p.renameCount;
  state.players[p.id].credits = p.credits;
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
  const targetName = censorFoulLanguage(newName.trim());
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
  if (p.isChatBlocked) {
    return res.status(403).json({ error: "Your access to chat wavelengths is currently restricted by Galactic Federation Command." });
  }
  const { channel, content, receiverId } = req.body;
  if (!content) return res.status(400).json({ error: "Message content required" });
  const email = (p.googleEmail || "").toLowerCase();
  const isAdmin = email === "banele180@gmail.com" || email === "banzz1918@gmail.com";
  const cleanedContent = censorFoulLanguage(content);
  const message = {
    id: `chat_${Math.random().toString(36).substr(2, 9)}`,
    channel,
    senderId: p.id,
    senderName: isAdmin ? "Galactic Federation" : p.username,
    senderFaction: p.faction,
    senderFactionColor: p.factionColor,
    allianceTag: p.allianceId ? state.alliances[p.allianceId]?.tag : null,
    receiverId: receiverId || null,
    content: cleanedContent,
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
  if (maxCommsHubLvl < 2) {
    return res.status(400).json({ error: "Joining an Alliance requires Communications Hub Level 2 or higher." });
  }
  const { allianceId } = req.body;
  const alliance = state.alliances[allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });
  if (alliance.members && alliance.members.length >= 10) {
    return res.status(400).json({ error: "Alliance registry is full. Maximum capacity is 10 commanders!" });
  }
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
  if (maxCommsHubLvl < 2) {
    return res.status(400).json({ error: "Applying to an Alliance requires Communications Hub Level 2 or higher." });
  }
  const { allianceId } = req.body;
  const alliance = state.alliances[allianceId];
  if (!alliance) return res.status(404).json({ error: "Alliance not found" });
  if (alliance.members && alliance.members.length >= 10) {
    return res.status(400).json({ error: "Cannot apply: This Alliance has already reached its maximum capacity of 10 commanders!" });
  }
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
app.post("/api/alliance/invite", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  if (!p.allianceId) {
    return res.status(400).json({ error: "You must be in an Alliance to invite players." });
  }
  const alliance = state.alliances[p.allianceId];
  if (!alliance) return res.status(404).json({ error: "Your Alliance was not found." });
  if (p.allianceRole !== "leader" && p.allianceRole !== "officer") {
    return res.status(403).json({ error: "Only Alliance Leaders or Officers can invite players." });
  }
  const { targetPlayerId } = req.body;
  if (!targetPlayerId) {
    return res.status(400).json({ error: "Target player ID is required." });
  }
  const receiver = state.players[targetPlayerId];
  if (!receiver) {
    return res.status(404).json({ error: "Target player not found." });
  }
  if (receiver.id === p.id) {
    return res.status(400).json({ error: "You cannot invite yourself." });
  }
  if (receiver.allianceId) {
    return res.status(400).json({ error: "Target player is already in an Alliance." });
  }
  if (alliance.members && alliance.members.length >= 10) {
    return res.status(400).json({ error: "Your Alliance is full. Maximum capacity is 10 commanders!" });
  }
  if (!receiver.commandMessages) {
    receiver.commandMessages = [];
  }
  const existingInvite = receiver.commandMessages.some((m) => m.isAllianceInvite && m.allianceId === alliance.id && m.inviteStatus === "pending");
  if (existingInvite) {
    return res.status(400).json({ error: "A pending invitation from your Alliance has already been dispatched to this commander." });
  }
  const inviteMsgId = `msg_invite_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  const inviteMessage = {
    id: inviteMsgId,
    senderId: p.id,
    senderName: p.username,
    senderFaction: p.faction,
    senderFactionColor: p.factionColor,
    receiverId: receiver.id,
    receiverName: receiver.username,
    content: `ALLIANCE ENLISTMENT OFFER: Commander ${p.username} has invited you to join their elite Alliance: [${alliance.tag}] ${alliance.name}! Use the response terminal buttons below to accept or decline.`,
    timestamp: Date.now(),
    isRead: false,
    isSaved: false,
    isAllianceInvite: true,
    allianceId: alliance.id,
    allianceName: alliance.name,
    allianceTag: alliance.tag,
    inviteStatus: "pending"
  };
  receiver.commandMessages.push(inviteMessage);
  if (!p.commandMessages) {
    p.commandMessages = [];
  }
  const senderMessage = { ...inviteMessage, isSent: true };
  p.commandMessages.push(senderMessage);
  saveState();
  res.json({ success: true, message: `Alliance invitation successfully transmitted to Commander ${receiver.username}!` });
});
app.post("/api/alliance/invite/respond", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { messageId, action } = req.body;
  if (!messageId || !action) {
    return res.status(400).json({ error: "Message ID and response action are required." });
  }
  if (!p.commandMessages) {
    p.commandMessages = [];
  }
  const msgIndex = p.commandMessages.findIndex((m) => m.id === messageId);
  if (msgIndex === -1) {
    return res.status(404).json({ error: "Invitation transmission not found in your log records." });
  }
  const msg = p.commandMessages[msgIndex];
  if (!msg.isAllianceInvite) {
    return res.status(400).json({ error: "Target transmission is not an alliance invitation." });
  }
  if (msg.inviteStatus !== "pending") {
    return res.status(400).json({ error: `This invitation has already been ${msg.inviteStatus}.` });
  }
  const allianceId = msg.allianceId;
  const alliance = state.alliances[allianceId];
  if (action === "accept") {
    if (p.allianceId) {
      return res.status(400).json({ error: "You are already a member of an Alliance. You must leave your current Alliance first." });
    }
    if (!alliance) {
      msg.inviteStatus = "declined";
      msg.content += " [ALLIANCE NO LONGER EXISTS]";
      saveState();
      return res.status(404).json({ error: "The inviting Alliance no longer exists." });
    }
    if (alliance.members && alliance.members.length >= 10) {
      return res.status(400).json({ error: "The Alliance has already reached its maximum capacity of 10 commanders!" });
    }
    alliance.members.push({
      playerId: p.id,
      username: p.username,
      role: "member"
    });
    p.allianceId = alliance.id;
    p.allianceRole = "member";
    msg.inviteStatus = "accepted";
    msg.content += " [ACCEPTED]";
    Object.values(state.alliances).forEach((all) => {
      if (all.applications) {
        all.applications = all.applications.filter((app2) => app2.playerId !== p.id);
      }
    });
    state.newsEvents.unshift({
      id: `news_${Math.random().toString(36).substr(2, 9)}`,
      title: "Member Joined Alliance",
      content: `${p.username} has joined ${alliance.name} [${alliance.tag}] via invitation!`,
      type: "system",
      timestamp: Date.now()
    });
    const sender = state.players[msg.senderId];
    if (sender && sender.commandMessages) {
      const senderMsg = sender.commandMessages.find((m) => m.id === messageId);
      if (senderMsg) {
        senderMsg.inviteStatus = "accepted";
        senderMsg.content += " [ACCEPTED]";
      }
    }
  } else if (action === "decline") {
    msg.inviteStatus = "declined";
    msg.content += " [DECLINED]";
    const sender = state.players[msg.senderId];
    if (sender && sender.commandMessages) {
      const senderMsg = sender.commandMessages.find((m) => m.id === messageId);
      if (senderMsg) {
        senderMsg.inviteStatus = "declined";
        senderMsg.content += " [DECLINED]";
      }
    }
  } else {
    return res.status(400).json({ error: "Invalid response action directive." });
  }
  saveState();
  res.json({ success: true, player: p, message: `Successfully responded: ${action.toUpperCase()}` });
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
  if (alliance.members && alliance.members.length >= 10) {
    return res.status(400).json({ error: "Cannot approve: This Alliance has already reached its maximum capacity of 10 commanders!" });
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
  const allianceMemberIds = alliance.members.map((mbr) => mbr.playerId);
  const relevantBattleReports = (state.battleReports || []).filter(
    (report) => allianceMemberIds.includes(report.attackerId) || allianceMemberIds.includes(report.defenderId)
  );
  res.json({ success: true, members: reports, battleReports: relevantBattleReports });
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
  const rewards = {};
  for (let i = 1; i <= 32; i++) {
    const taskReward = getTaskResourceReward(i);
    rewards[i] = {
      water: taskReward.water,
      plasma: taskReward.plasma,
      fuel: taskReward.fuel,
      food: taskReward.food,
      respirant: taskReward.respirant,
      credits: i === 32 ? 1500 : 50
    };
  }
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
    for (let i = 1; i <= 32; i++) {
      if (!completed.includes(i)) {
        idNum = i;
        break;
      }
    }
  }
  if (isNaN(idNum) || !rewards[idNum]) {
    idNum = 32;
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
  if (receiver.blockedPlayers && receiver.blockedPlayers.includes(p.id)) {
    return res.status(403).json({ error: "Your transmission frequency has been locked/muted by the recipient station." });
  }
  if (p.blockedPlayers && p.blockedPlayers.includes(receiverId)) {
    return res.status(403).json({ error: "You have locked/muted transmissions with this station. Unblock them first to transmit." });
  }
  if (!receiver.commandMessages) {
    receiver.commandMessages = [];
  }
  const cleanedContent = censorFoulLanguage(content.trim());
  const newMessage = {
    id: `msg_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    senderId: p.id,
    senderName: p.username,
    senderFaction: p.faction,
    senderFactionColor: p.factionColor,
    receiverId: receiver.id,
    receiverName: receiver.username,
    content: cleanedContent,
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
    `Commander ${p.username} sent you a message: ${cleanedContent.substring(0, 60)}${cleanedContent.length > 60 ? "..." : ""}`,
    "events"
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
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  const isValidPass = adminKey === "991807" || adminKey === "banele-admin-secret" || isEmailOwner;
  if (!isValidPass) {
    return res.status(403).json({ error: "Access Denied. Holographic decryption key incorrect." });
  }
  if (!state.feedbacks) {
    state.feedbacks = [];
  }
  res.json({ success: true, feedbacks: state.feedbacks });
});
app.get("/api/admin/galaxy-config", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  initializeGalaxyConfig();
  res.json({ success: true, galaxyConfig: state.galaxyConfig });
});
app.post("/api/admin/galaxy-config", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  initializeGalaxyConfig();
  const config = state.galaxyConfig;
  const {
    initialGalaxySize,
    reservedCenterSector,
    initialColonizationZoneSize,
    spawnDistance,
    zoneGrowthOccupancyThreshold,
    galaxyOccupancyThreshold,
    expansionIncrement,
    currentGalaxySize,
    currentColonizationZoneSize
  } = req.body;
  if (initialGalaxySize !== void 0) config.initialGalaxySize = Number(initialGalaxySize);
  if (reservedCenterSector !== void 0) config.reservedCenterSector = { x: Number(reservedCenterSector.x), y: Number(reservedCenterSector.y) };
  if (initialColonizationZoneSize !== void 0) config.initialColonizationZoneSize = Number(initialColonizationZoneSize);
  if (spawnDistance !== void 0) config.spawnDistance = Number(spawnDistance);
  if (zoneGrowthOccupancyThreshold !== void 0) config.zoneGrowthOccupancyThreshold = Number(zoneGrowthOccupancyThreshold);
  if (galaxyOccupancyThreshold !== void 0) config.galaxyOccupancyThreshold = Number(galaxyOccupancyThreshold);
  if (expansionIncrement !== void 0) config.expansionIncrement = Number(expansionIncrement);
  if (currentGalaxySize !== void 0) config.currentGalaxySize = Number(currentGalaxySize);
  if (currentColonizationZoneSize !== void 0) config.currentColonizationZoneSize = Number(currentColonizationZoneSize);
  saveState();
  res.json({ success: true, message: "Galaxy Configuration successfully updated!", galaxyConfig: config });
});
app.post("/api/admin/galaxy-config/trigger", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  initializeGalaxyConfig();
  const config = state.galaxyConfig;
  const { action } = req.body;
  if (action === "grow-zone") {
    const prevSize = config.currentColonizationZoneSize || config.initialColonizationZoneSize || 7;
    const currentMapSize = config.currentGalaxySize || 15;
    const nextSize = prevSize + 2;
    config.currentColonizationZoneSize = Math.min(nextSize, currentMapSize);
    saveState();
    return res.json({ success: true, message: `Manually grew colonization zone from ${prevSize} to ${config.currentColonizationZoneSize}` });
  } else if (action === "expand-galaxy") {
    const oldSize = config.currentGalaxySize || 15;
    const increment = config.expansionIncrement || 5;
    const newSize = oldSize + increment;
    config.currentGalaxySize = newSize;
    if (config.currentColonizationZoneSize >= oldSize) {
      config.currentColonizationZoneSize = newSize;
    }
    const BROADCAST_TEMPLATES = [
      "GALACTIC COMMAND\n\nLong-range sensor arrays have successfully mapped new regions beyond the known frontier. Navigation systems have been updated. Previously unreachable sectors are now open for exploration.",
      "GALACTIC COMMAND\n\nCenturies of research have culminated in a breakthrough in deep-space navigation. New sectors have been charted and are now available for colonization.",
      "GALACTIC COMMAND\n\nExploration fleets have returned with confirmed hyperspace routes beyond the current frontier. Galactic Command authorizes expansion into newly discovered space.",
      "GALACTIC COMMAND\n\nOur civilizations have reached another milestone in interstellar exploration. Additional sectors have been integrated into the Galactic Navigation Network.",
      "GALACTIC COMMAND\n\nAdvanced radar arrays have extended humanity's vision deeper into the galaxy. Frontier sectors are now accessible to all commanders."
    ];
    const randomMsg = BROADCAST_TEMPLATES[Math.floor(Math.random() * BROADCAST_TEMPLATES.length)];
    if (!state.chatMessages) state.chatMessages = [];
    state.chatMessages.push({
      id: `chat_expansion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      channel: "global",
      senderId: "system",
      senderName: "GALACTIC COMMAND",
      senderFaction: "System",
      senderFactionColor: "#F1C40F",
      allianceTag: "GAL",
      receiverId: null,
      content: randomMsg,
      timestamp: Date.now()
    });
    if (state.chatMessages.length > 200) state.chatMessages.shift();
    if (!state.newsEvents) state.newsEvents = [];
    state.newsEvents.push({
      id: `news_expansion_${Date.now()}`,
      title: "\u{1F30C} New Frontiers Charted!",
      content: `Galactic Command has expanded the known sector coordinates to ${newSize}x${newSize} space. High-resolution navigation channels are now online!`,
      type: "system",
      timestamp: Date.now()
    });
    saveState();
    return res.json({ success: true, message: `Manually expanded galaxy from ${oldSize} to ${newSize}` });
  } else {
    return res.status(400).json({ error: "Invalid action. Choose 'grow-zone' or 'expand-galaxy'." });
  }
});
app.get("/api/admin/tasks", (req, res) => {
  if (!state.customTasks) {
    state.customTasks = {};
  }
  res.json({ success: true, customTasks: state.customTasks });
});
app.post("/api/admin/update-task", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
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
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com") || typeof bodyEmail === "string" && (bodyEmail.toLowerCase() === "banele180@gmail.com" || bodyEmail.toLowerCase() === "banzz1918@gmail.com");
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
app.post("/api/admin/chat-block", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  const { playerId } = req.body;
  if (!playerId || !state.players[playerId]) {
    return res.status(404).json({ error: "Player profile not found." });
  }
  state.players[playerId].isChatBlocked = true;
  saveState();
  res.json({ success: true, message: `Commander ${state.players[playerId].username} is now blocked from global communications.` });
});
app.post("/api/admin/chat-unblock", (req, res) => {
  const p = getLoggedPlayer(req);
  const isEmailOwner = p && p.googleEmail && (p.googleEmail.toLowerCase() === "banele180@gmail.com" || p.googleEmail.toLowerCase() === "banzz1918@gmail.com");
  if (!isEmailOwner) {
    return res.status(403).json({ error: "Access Denied. Admin privilege required." });
  }
  const { playerId } = req.body;
  if (!playerId || !state.players[playerId]) {
    return res.status(404).json({ error: "Player profile not found." });
  }
  state.players[playerId].isChatBlocked = false;
  saveState();
  res.json({ success: true, message: `Commander ${state.players[playerId].username} is unblocked from global communications.` });
});
app.post("/api/messages/block-user", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { targetId } = req.body;
  if (!targetId || !state.players[targetId]) {
    return res.status(404).json({ error: "Target transmitter station not found." });
  }
  if (targetId === p.id) {
    return res.status(400).json({ error: "You cannot block yourself." });
  }
  if (!p.blockedPlayers) {
    p.blockedPlayers = [];
  }
  if (!p.blockedPlayers.includes(targetId)) {
    p.blockedPlayers.push(targetId);
  }
  saveState();
  res.json({ success: true, message: `Transmissions from ${state.players[targetId].username} have been locked/blocked.` });
});
app.post("/api/messages/unblock-user", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { targetId } = req.body;
  if (!targetId) {
    return res.status(400).json({ error: "Target transmitter ID required." });
  }
  if (p.blockedPlayers) {
    p.blockedPlayers = p.blockedPlayers.filter((id) => id !== targetId);
  }
  saveState();
  res.json({ success: true, message: `Transmissions unblocked.` });
});
app.post("/api/players/report", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { targetId, reason } = req.body;
  if (!targetId || !reason || typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({ error: "Target player ID and report statement are required." });
  }
  const targetPlayer = state.players[targetId];
  if (!targetPlayer) {
    return res.status(404).json({ error: "Target player not found." });
  }
  const adminPlayers = Object.values(state.players).filter(
    (ap) => ap.googleEmail && (ap.googleEmail.toLowerCase() === "banele180@gmail.com" || ap.googleEmail.toLowerCase() === "banzz1918@gmail.com")
  );
  const reportMessageContent = `[INCIDENT REPORT] Reporter: "${p.username}" (ID: ${p.id}). Reported Target: "${targetPlayer.username}" (ID: ${targetPlayer.id}). Statement: "${reason.trim()}"`;
  adminPlayers.forEach((admin) => {
    if (!admin.commandMessages) {
      admin.commandMessages = [];
    }
    const reportMessage = {
      id: `report_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
      senderId: "system",
      senderName: "Galactic Security Office",
      senderFaction: "System Security",
      senderFactionColor: "#EF4444",
      receiverId: admin.id,
      receiverName: admin.username,
      content: reportMessageContent,
      timestamp: Date.now(),
      isRead: false,
      isSaved: false
    };
    admin.commandMessages.push(reportMessage);
    sendNotificationWithFallback(
      admin.id,
      "\u{1F6A8} Incident Report Submitted",
      `Reported: ${targetPlayer.username} by ${p.username}. Statement: ${reason.trim().substring(0, 30)}...`,
      "events"
    );
  });
  saveState();
  res.json({ success: true, message: "Incident report transmitted securely to Galactic Federation command authority." });
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
