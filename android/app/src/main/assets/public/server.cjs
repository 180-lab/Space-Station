var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);

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

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = __toESM(require("pg"), 1);

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  alliances: () => alliances,
  battleReports: () => battleReports,
  chatMessages: () => chatMessages,
  feedbacks: () => feedbacks,
  fleets: () => fleets,
  habitablePlanets: () => habitablePlanets,
  newsEvents: () => newsEvents,
  planets: () => planets,
  planetsRelations: () => planetsRelations,
  players: () => players,
  playersRelations: () => playersRelations,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_orm = require("drizzle-orm");
var users = (0, import_pg_core.pgTable)("users", {
  uid: (0, import_pg_core.text)("uid").primaryKey(),
  email: (0, import_pg_core.text)("email").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var players = (0, import_pg_core.pgTable)("players", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  username: (0, import_pg_core.text)("username").notNull(),
  faction: (0, import_pg_core.text)("faction").notNull(),
  factionColor: (0, import_pg_core.text)("faction_color").notNull(),
  allianceId: (0, import_pg_core.text)("alliance_id"),
  allianceRole: (0, import_pg_core.text)("alliance_role"),
  scores: (0, import_pg_core.jsonb)("scores").notNull(),
  achievements: (0, import_pg_core.jsonb)("achievements").notNull(),
  skinId: (0, import_pg_core.text)("skin_id").notNull(),
  bannerId: (0, import_pg_core.text)("banner_id").notNull(),
  lastDailyRewardClaim: (0, import_pg_core.bigint)("last_daily_reward_claim", { mode: "number" }).notNull(),
  credits: (0, import_pg_core.integer)("credits").notNull(),
  googleEmail: (0, import_pg_core.text)("google_email"),
  password: (0, import_pg_core.text)("password"),
  lastActive: (0, import_pg_core.bigint)("last_active", { mode: "number" }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var planets = (0, import_pg_core.pgTable)("planets", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  playerId: (0, import_pg_core.text)("player_id").references(() => players.id, { onDelete: "cascade" }).notNull(),
  name: (0, import_pg_core.text)("name").notNull(),
  sectorX: (0, import_pg_core.integer)("sector_x").notNull(),
  sectorY: (0, import_pg_core.integer)("sector_y").notNull(),
  skinId: (0, import_pg_core.text)("skin_id").notNull(),
  mines: (0, import_pg_core.jsonb)("mines").notNull(),
  buildings: (0, import_pg_core.jsonb)("buildings").notNull(),
  resources: (0, import_pg_core.jsonb)("resources").notNull(),
  troops: (0, import_pg_core.jsonb)("troops").notNull(),
  trainingQueue: (0, import_pg_core.jsonb)("training_queue").notNull(),
  lastSupplyNexusClaim: (0, import_pg_core.bigint)("last_supply_nexus_claim", { mode: "number" }),
  upgradeQueue: (0, import_pg_core.jsonb)("upgrade_queue"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var alliances = (0, import_pg_core.pgTable)("alliances", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  tag: (0, import_pg_core.text)("tag").notNull(),
  leaderId: (0, import_pg_core.text)("leader_id").notNull(),
  leaderName: (0, import_pg_core.text)("leader_name").notNull(),
  members: (0, import_pg_core.jsonb)("members").notNull(),
  wars: (0, import_pg_core.jsonb)("wars").notNull(),
  bannerColor: (0, import_pg_core.text)("banner_color").notNull(),
  bannerSymbol: (0, import_pg_core.text)("banner_symbol").notNull(),
  highlights: (0, import_pg_core.text)("highlights"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var chatMessages = (0, import_pg_core.pgTable)("chat_messages", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  channel: (0, import_pg_core.text)("channel").notNull(),
  senderId: (0, import_pg_core.text)("sender_id").notNull(),
  senderName: (0, import_pg_core.text)("sender_name").notNull(),
  senderFaction: (0, import_pg_core.text)("sender_faction").notNull(),
  senderFactionColor: (0, import_pg_core.text)("sender_faction_color").notNull(),
  allianceTag: (0, import_pg_core.text)("alliance_tag"),
  receiverId: (0, import_pg_core.text)("receiver_id"),
  content: (0, import_pg_core.text)("content").notNull(),
  timestamp: (0, import_pg_core.bigint)("timestamp", { mode: "number" }).notNull()
});
var fleets = (0, import_pg_core.pgTable)("fleets", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  senderId: (0, import_pg_core.text)("sender_id").notNull(),
  senderName: (0, import_pg_core.text)("sender_name").notNull(),
  senderCoords: (0, import_pg_core.jsonb)("sender_coords").notNull(),
  targetId: (0, import_pg_core.text)("target_id"),
  targetName: (0, import_pg_core.text)("target_name").notNull(),
  targetCoords: (0, import_pg_core.jsonb)("target_coords").notNull(),
  missionType: (0, import_pg_core.text)("mission_type").notNull(),
  troops: (0, import_pg_core.jsonb)("troops").notNull(),
  startedAt: (0, import_pg_core.bigint)("started_at", { mode: "number" }).notNull(),
  arrivesAt: (0, import_pg_core.bigint)("arrives_at", { mode: "number" }).notNull(),
  isReturning: (0, import_pg_core.boolean)("is_returning").notNull(),
  isWaitingToSettle: (0, import_pg_core.boolean)("is_waiting_to_settle"),
  targetBuilding: (0, import_pg_core.text)("target_building"),
  lootCarried: (0, import_pg_core.jsonb)("loot_carried"),
  troopSpeedLevel: (0, import_pg_core.integer)("troop_speed_level"),
  defenseShieldsLevel: (0, import_pg_core.integer)("defense_shields_level")
});
var battleReports = (0, import_pg_core.pgTable)("battle_reports", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  timestamp: (0, import_pg_core.bigint)("timestamp", { mode: "number" }).notNull(),
  attackerId: (0, import_pg_core.text)("attacker_id").notNull(),
  attackerName: (0, import_pg_core.text)("attacker_name").notNull(),
  attackerAlliance: (0, import_pg_core.text)("attacker_alliance"),
  defenderId: (0, import_pg_core.text)("defender_id").notNull(),
  defenderName: (0, import_pg_core.text)("defender_name").notNull(),
  defenderAlliance: (0, import_pg_core.text)("defender_alliance"),
  isRecon: (0, import_pg_core.boolean)("is_recon"),
  attackerCoords: (0, import_pg_core.jsonb)("attacker_coords").notNull(),
  defenderCoords: (0, import_pg_core.jsonb)("defender_coords").notNull(),
  attackerInitialTroops: (0, import_pg_core.jsonb)("attacker_initial_troops").notNull(),
  attackerLosses: (0, import_pg_core.jsonb)("attacker_losses").notNull(),
  defenderInitialTroops: (0, import_pg_core.jsonb)("defender_initial_troops").notNull(),
  defenderLosses: (0, import_pg_core.jsonb)("defender_losses").notNull(),
  winner: (0, import_pg_core.text)("winner").notNull(),
  resourcesStolen: (0, import_pg_core.jsonb)("resources_stolen").notNull(),
  buildingDamage: (0, import_pg_core.jsonb)("building_damage"),
  attackHpKilled: (0, import_pg_core.integer)("attack_hp_killed").notNull(),
  defenceHpKilled: (0, import_pg_core.integer)("defence_hp_killed").notNull(),
  battleRounds: (0, import_pg_core.jsonb)("battle_rounds"),
  buildings: (0, import_pg_core.jsonb)("buildings"),
  mines: (0, import_pg_core.jsonb)("mines"),
  resources: (0, import_pg_core.jsonb)("resources")
});
var newsEvents = (0, import_pg_core.pgTable)("news_events", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  title: (0, import_pg_core.text)("title").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  type: (0, import_pg_core.text)("type").notNull(),
  timestamp: (0, import_pg_core.bigint)("timestamp", { mode: "number" }).notNull()
});
var habitablePlanets = (0, import_pg_core.pgTable)("habitable_planets", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  coords: (0, import_pg_core.jsonb)("coords").notNull(),
  isColonized: (0, import_pg_core.boolean)("is_colonized").notNull()
});
var feedbacks = (0, import_pg_core.pgTable)("feedbacks", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  senderId: (0, import_pg_core.text)("sender_id").notNull(),
  senderName: (0, import_pg_core.text)("sender_name").notNull(),
  senderEmail: (0, import_pg_core.text)("sender_email").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  category: (0, import_pg_core.text)("category").notNull(),
  timestamp: (0, import_pg_core.bigint)("timestamp", { mode: "number" }).notNull()
});
var playersRelations = (0, import_drizzle_orm.relations)(players, ({ many }) => ({
  planets: many(planets)
}));
var planetsRelations = (0, import_drizzle_orm.relations)(planets, ({ one }) => ({
  player: one(players, {
    fields: [planets.playerId],
    references: [players.id]
  })
}));

// src/db/index.ts
var { Pool } = import_pg.default;
var createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15e3
  });
};
var pool = createPool();
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// src/db/state-sync.ts
async function loadStateFromDB() {
  const loadedState = {
    players: {},
    alliances: {},
    chatMessages: [],
    fleets: [],
    battleReports: [],
    newsEvents: [],
    habitablePlanets: [],
    feedbacks: []
  };
  try {
    const dbPlayers = await db.select().from(players);
    for (const p of dbPlayers) {
      const playerProfile = {
        id: p.id,
        username: p.username,
        faction: p.faction,
        factionColor: p.factionColor,
        allianceId: p.allianceId || null,
        allianceRole: p.allianceRole,
        planets: [],
        scores: p.scores,
        achievements: p.achievements,
        skinId: p.skinId,
        bannerId: p.bannerId,
        lastDailyRewardClaim: p.lastDailyRewardClaim,
        credits: p.credits,
        googleEmail: p.googleEmail || void 0,
        password: p.password || void 0,
        lastActive: p.lastActive || void 0
      };
      loadedState.players[p.id] = playerProfile;
    }
    const dbPlanPlanets = await db.select().from(planets);
    for (const pl of dbPlanPlanets) {
      const colony = {
        id: pl.id,
        name: pl.name,
        sectorX: pl.sectorX,
        sectorY: pl.sectorY,
        skinId: pl.skinId,
        mines: pl.mines,
        buildings: pl.buildings,
        resources: pl.resources,
        troops: pl.troops,
        trainingQueue: pl.trainingQueue,
        lastSupplyNexusClaim: pl.lastSupplyNexusClaim || void 0,
        upgradeQueue: pl.upgradeQueue || void 0
      };
      if (loadedState.players[pl.playerId]) {
        loadedState.players[pl.playerId].planets.push(colony);
      }
    }
    const dbAlliances = await db.select().from(alliances);
    for (const a of dbAlliances) {
      const alliance = {
        id: a.id,
        name: a.name,
        tag: a.tag,
        leaderId: a.leaderId,
        leaderName: a.leaderName,
        members: a.members,
        wars: a.wars,
        bannerColor: a.bannerColor,
        bannerSymbol: a.bannerSymbol,
        highlights: a.highlights || void 0
      };
      loadedState.alliances[a.id] = alliance;
    }
    const dbChats = await db.select().from(chatMessages);
    loadedState.chatMessages = dbChats.map((c) => ({
      id: c.id,
      channel: c.channel,
      senderId: c.senderId,
      senderName: c.senderName,
      senderFaction: c.senderFaction,
      senderFactionColor: c.senderFactionColor,
      allianceTag: c.allianceTag,
      receiverId: c.receiverId,
      content: c.content,
      timestamp: c.timestamp
    }));
    const dbFleets = await db.select().from(fleets);
    loadedState.fleets = dbFleets.map((f) => ({
      id: f.id,
      senderId: f.senderId,
      senderName: f.senderName,
      senderCoords: f.senderCoords,
      targetId: f.targetId,
      targetName: f.targetName,
      targetCoords: f.targetCoords,
      missionType: f.missionType,
      troops: f.troops,
      startedAt: f.startedAt,
      arrivesAt: f.arrivesAt,
      isReturning: f.isReturning,
      isWaitingToSettle: f.isWaitingToSettle || void 0,
      targetBuilding: f.targetBuilding || void 0,
      lootCarried: f.lootCarried || void 0,
      troopSpeedLevel: f.troopSpeedLevel || void 0,
      defenseShieldsLevel: f.defenseShieldsLevel || void 0
    }));
    const dbReports = await db.select().from(battleReports);
    loadedState.battleReports = dbReports.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      attackerId: r.attackerId,
      attackerName: r.attackerName,
      attackerAlliance: r.attackerAlliance || void 0,
      defenderId: r.defenderId,
      defenderName: r.defenderName,
      defenderAlliance: r.defenderAlliance || void 0,
      isRecon: r.isRecon || void 0,
      attackerCoords: r.attackerCoords,
      defenderCoords: r.defenderCoords,
      attackerInitialTroops: r.attackerInitialTroops,
      attackerLosses: r.attackerLosses,
      defenderInitialTroops: r.defenderInitialTroops,
      defenderLosses: r.defenderLosses,
      winner: r.winner,
      resourcesStolen: r.resourcesStolen,
      buildingDamage: r.buildingDamage || void 0,
      attackHpKilled: r.attackHpKilled,
      defenceHpKilled: r.defenceHpKilled,
      battleRounds: r.battleRounds || void 0,
      buildings: r.buildings || void 0,
      mines: r.mines || void 0,
      resources: r.resources || void 0
    }));
    const dbNews = await db.select().from(newsEvents);
    loadedState.newsEvents = dbNews.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type,
      timestamp: n.timestamp
    }));
    const dbHabitable = await db.select().from(habitablePlanets);
    loadedState.habitablePlanets = dbHabitable.map((h) => ({
      id: h.id,
      name: h.name,
      coords: h.coords,
      isColonized: h.isColonized
    }));
    const dbFeedbacks = await db.select().from(feedbacks);
    loadedState.feedbacks = dbFeedbacks.map((f) => ({
      id: f.id,
      senderId: f.senderId,
      senderName: f.senderName,
      senderEmail: f.senderEmail,
      content: f.content,
      category: f.category,
      timestamp: f.timestamp
    }));
  } catch (error) {
    console.error("Error loading state from Cloud SQL database:", error);
    throw error;
  }
  return loadedState;
}
async function saveStateToDB(state2) {
  try {
    for (const a of Object.values(state2.alliances)) {
      await db.insert(alliances).values({
        id: a.id,
        name: a.name,
        tag: a.tag,
        leaderId: a.leaderId,
        leaderName: a.leaderName,
        members: a.members,
        wars: a.wars,
        bannerColor: a.bannerColor,
        bannerSymbol: a.bannerSymbol,
        highlights: a.highlights || null
      }).onConflictDoUpdate({
        target: alliances.id,
        set: {
          name: a.name,
          tag: a.tag,
          leaderId: a.leaderId,
          leaderName: a.leaderName,
          members: a.members,
          wars: a.wars,
          bannerColor: a.bannerColor,
          bannerSymbol: a.bannerSymbol,
          highlights: a.highlights || null
        }
      });
    }
    for (const p of Object.values(state2.players)) {
      await db.insert(players).values({
        id: p.id,
        username: p.username,
        faction: p.faction,
        factionColor: p.factionColor,
        allianceId: p.allianceId || null,
        allianceRole: p.allianceRole || null,
        scores: p.scores,
        achievements: p.achievements,
        skinId: p.skinId,
        bannerId: p.bannerId,
        lastDailyRewardClaim: p.lastDailyRewardClaim,
        credits: p.credits,
        googleEmail: p.googleEmail || null,
        password: p.password || null,
        lastActive: p.lastActive || null
      }).onConflictDoUpdate({
        target: players.id,
        set: {
          username: p.username,
          faction: p.faction,
          factionColor: p.factionColor,
          allianceId: p.allianceId || null,
          allianceRole: p.allianceRole || null,
          scores: p.scores,
          achievements: p.achievements,
          skinId: p.skinId,
          bannerId: p.bannerId,
          lastDailyRewardClaim: p.lastDailyRewardClaim,
          credits: p.credits,
          googleEmail: p.googleEmail || null,
          password: p.password || null,
          lastActive: p.lastActive || null
        }
      });
      if (p.planets) {
        for (const pl of p.planets) {
          await db.insert(planets).values({
            id: pl.id,
            playerId: p.id,
            name: pl.name,
            sectorX: pl.sectorX,
            sectorY: pl.sectorY,
            skinId: pl.skinId,
            mines: pl.mines,
            buildings: pl.buildings,
            resources: pl.resources,
            troops: pl.troops,
            trainingQueue: pl.trainingQueue,
            lastSupplyNexusClaim: pl.lastSupplyNexusClaim || null,
            upgradeQueue: pl.upgradeQueue || null
          }).onConflictDoUpdate({
            target: planets.id,
            set: {
              name: pl.name,
              sectorX: pl.sectorX,
              sectorY: pl.sectorY,
              skinId: pl.skinId,
              mines: pl.mines,
              buildings: pl.buildings,
              resources: pl.resources,
              troops: pl.troops,
              trainingQueue: pl.trainingQueue,
              lastSupplyNexusClaim: pl.lastSupplyNexusClaim || null,
              upgradeQueue: pl.upgradeQueue || null
            }
          });
        }
      }
    }
    for (const c of state2.chatMessages) {
      await db.insert(chatMessages).values({
        id: c.id,
        channel: c.channel,
        senderId: c.senderId,
        senderName: c.senderName,
        senderFaction: c.senderFaction,
        senderFactionColor: c.senderFactionColor,
        allianceTag: c.allianceTag || null,
        receiverId: c.receiverId || null,
        content: c.content,
        timestamp: c.timestamp
      }).onConflictDoNothing();
    }
    await db.delete(fleets);
    for (const f of state2.fleets) {
      await db.insert(fleets).values({
        id: f.id,
        senderId: f.senderId,
        senderName: f.senderName,
        senderCoords: f.senderCoords,
        targetId: f.targetId || null,
        targetName: f.targetName,
        targetCoords: f.targetCoords,
        missionType: f.missionType,
        troops: f.troops,
        startedAt: f.startedAt,
        arrivesAt: f.arrivesAt,
        isReturning: f.isReturning,
        isWaitingToSettle: f.isWaitingToSettle || false,
        targetBuilding: f.targetBuilding || null,
        lootCarried: f.lootCarried || null,
        troopSpeedLevel: f.troopSpeedLevel || null,
        defenseShieldsLevel: f.defenseShieldsLevel || null
      });
    }
    for (const r of state2.battleReports) {
      await db.insert(battleReports).values({
        id: r.id,
        timestamp: r.timestamp,
        attackerId: r.attackerId,
        attackerName: r.attackerName,
        attackerAlliance: r.attackerAlliance || null,
        defenderId: r.defenderId,
        defenderName: r.defenderName,
        defenderAlliance: r.defenderAlliance || null,
        isRecon: r.isRecon || false,
        attackerCoords: r.attackerCoords,
        defenderCoords: r.defenderCoords,
        attackerInitialTroops: r.attackerInitialTroops,
        attackerLosses: r.attackerLosses,
        defenderInitialTroops: r.defenderInitialTroops,
        defenderLosses: r.defenderLosses,
        winner: r.winner,
        resourcesStolen: r.resourcesStolen,
        buildingDamage: r.buildingDamage || null,
        attackHpKilled: r.attackHpKilled,
        defenceHpKilled: r.defenceHpKilled,
        battleRounds: r.battleRounds || null,
        buildings: r.buildings || null,
        mines: r.mines || null,
        resources: r.resources || null
      }).onConflictDoNothing();
    }
    for (const n of state2.newsEvents) {
      await db.insert(newsEvents).values({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
        timestamp: n.timestamp
      }).onConflictDoNothing();
    }
    if (state2.habitablePlanets) {
      for (const h of state2.habitablePlanets) {
        await db.insert(habitablePlanets).values({
          id: h.id,
          name: h.name,
          coords: h.coords,
          isColonized: h.isColonized
        }).onConflictDoUpdate({
          target: habitablePlanets.id,
          set: {
            name: h.name,
            coords: h.coords,
            isColonized: h.isColonized
          }
        });
      }
    }
    if (state2.feedbacks) {
      for (const f of state2.feedbacks) {
        await db.insert(feedbacks).values({
          id: f.id,
          senderId: f.senderId,
          senderName: f.senderName,
          senderEmail: f.senderEmail,
          content: f.content,
          category: f.category,
          timestamp: f.timestamp
        }).onConflictDoNothing();
      }
    }
  } catch (error) {
    console.error("Error saving state to Cloud SQL database (non-blocking fallback active):", error);
  }
}

// server.ts
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Content-Length, Authorization, X-Requested-With, x-user-id");
  const requestHeaders = req.header("access-control-request-headers");
  if (requestHeaders) {
    res.setHeader("Access-Control-Allow-Headers", requestHeaders);
  } else {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(import_express.default.json());
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
  defender: { name: "Interceptor", defenceHp: 18, attackHp: 10, carry: 600, speed: 7, waterConsumption: 0.05 },
  attacker: { name: "Assault Drone", defenceHp: 9, attackHp: 30, carry: 400, speed: 11.662, waterConsumption: 0.1 },
  tank: { name: "Disrupter", defenceHp: 5, attackHp: 5, carry: 0, speed: 3.5, waterConsumption: 0.2 },
  looter: { name: "Matter Extractor", defenceHp: 4, attackHp: 4, carry: 1e3, speed: 23.331, waterConsumption: 0.15 },
  drone: { name: "Missile Launcher", defenceHp: 120, attackHp: 120, carry: 200, speed: 17.5, waterConsumption: 0.02 },
  settlementShip: { name: "Settlement Ship", defenceHp: 50, attackHp: 0, carry: 5e3, speed: 4.662, waterConsumption: 0.25 }
};
function getRepositoryCapacity(level) {
  if (level <= 1) return 1e4;
  if (level >= 45) return 5e6;
  return Math.round(1e4 * Math.pow(5e6 / 1e4, (level - 1) / 44));
}
function getMineProductionPerHour(level, type) {
  if (level <= 0) return 100;
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
  saveStateToDB(state).catch((err) => {
    console.error("Failed async Cloud SQL save session:", err);
  });
}
async function loadState() {
  try {
    console.log("Attempting to restore active state from Cloud SQL...");
    const dbState = await loadStateFromDB();
    if (dbState && Object.keys(dbState.players).length > 0) {
      state = dbState;
      console.log("Successfully restored active state from Cloud SQL! Players count:", Object.keys(state.players).length);
      return;
    }
    console.log("Cloud SQL database is empty. Fallback seeding...");
  } catch (err) {
    console.error("Cloud SQL load failed, preparing backup files restore...", err);
  }
  try {
    if (import_fs.default.existsSync(STATE_FILE)) {
      const data = import_fs.default.readFileSync(STATE_FILE, "utf8");
      state = JSON.parse(data);
      if (!state.feedbacks) {
        state.feedbacks = [];
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
                pl.troops.defender = 12500;
                pl.troops.attacker = 28600;
                pl.troops.tank = 100;
                pl.troops.looter = 1e3;
                pl.troops.drone = 100;
              }
              if (pl && !pl.trainingQueue) {
                pl.trainingQueue = [];
              }
              if (pl && pl.buildings) {
                if (!pl.buildings.supplyNexus) {
                  pl.buildings.supplyNexus = { level: 1, maxLevel: 50, isUpgrading: false, upgradeEnd: null };
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
      saveState();
      console.log("backup state loaded successfully. Players count:", Object.keys(state.players).length);
    } else {
      console.log("No existing state file found. Bootstrapping universe...");
      bootstrapUniverse();
      saveState();
    }
  } catch (err) {
    console.error("Failed to load state", err);
    bootstrapUniverse();
    saveState();
  }
}
function createInitialPlanet(name, sectorX, sectorY) {
  const createMines = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      level: 1,
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
      commsHub: { level: 1, maxLevel: 50, isUpgrading: false, upgradeEnd: null, health: 100 },
      researchCenter: { level: 1, maxLevel: 20, isUpgrading: false, upgradeEnd: null, health: 100 },
      armyBase: { level: 1, maxLevel: 30, isUpgrading: false, upgradeEnd: null, health: 100 },
      repository: { level: 1, maxLevel: 45, isUpgrading: false, upgradeEnd: null, health: 100 },
      radar: { level: 1, maxLevel: 15, isUpgrading: false, upgradeEnd: null, health: 100 },
      supplyNexus: { level: 1, maxLevel: 50, isUpgrading: false, upgradeEnd: null, health: 100 }
    },
    resources: {
      water: 5e3,
      plasma: 5e3,
      fuel: 5e3,
      food: 5e3,
      respirant: 5e3
    },
    troops: {
      defender: 12500,
      attacker: 28600,
      tank: 100,
      looter: 1e3,
      drone: 100,
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
        buildingName: finalName === "commsHub" ? "Communications Hub" : finalName === "researchCenter" ? "Research Center" : finalName === "armyBase" ? "War Room" : finalName === "repository" ? "Repository" : finalName === "radar" ? "Radar Array" : finalName === "supplyNexus" ? "Supply Nexus" : finalName,
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
        buildingName: finalName === "commsHub" ? "Communications Hub" : finalName === "researchCenter" ? "Research Center" : finalName === "armyBase" ? "War Room" : finalName === "repository" ? "Repository" : finalName === "radar" ? "Radar Array" : finalName === "supplyNexus" ? "Supply Nexus" : finalName,
        levelsDestroyed: levelsLost,
        previousLevel: prevLvl,
        newLevel: newLvl
      });
    }
  }
  return buildingDamageReports;
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
  const factions = ["Solar Alliance", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const voidAlliance = {
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
    bannerSymbol: "\u25B2"
  };
  const empireAlliance = {
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
    bannerSymbol: "\u25C8"
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
      allianceId: ai.allianceId,
      allianceRole: ai.allianceId ? "member" : null,
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
    if (id === voidAlliance.leaderId) player.allianceRole = "leader";
    if (id === empireAlliance.leaderId) player.allianceRole = "leader";
    state.players[id] = player;
  });
  voidAlliance.wars.push({
    targetAllianceId: empireAlliance.id,
    targetAllianceName: empireAlliance.name,
    declaredAt: Date.now() - 36e5
  });
  state.newsEvents.push({
    id: "news_war_bootstrap",
    title: "War Declared!",
    content: "The VOID SYNDICATE has officially declared war against the SOLAR EMPIRE! Alliance boundaries are now borders under attack.",
    type: "war",
    timestamp: Date.now() - 36e5
  });
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
      const respirantConsumed = waterConsumptionPerHour * 0.4 * deltaHours;
      const foodConsumed = waterConsumptionPerHour * 0.15 * deltaHours;
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
      const netRespirantProdHourly = hourlyMinesProd.respirant - waterConsumptionPerHour * 0.4;
      const netFoodProdHourly = hourlyMinesProd.food - waterConsumptionPerHour * 0.15;
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
      const triggerAttrition = isAnyProdNegative || planet.resources.water < 0 || planet.resources.respirant < 0 || planet.resources.food < 0;
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
    if (initialAttHp > initialDefHp) {
      const diffPct = (initialAttHp - initialDefHp) / initialDefHp;
      attSurvivalFloor = Math.min(0.3, diffPct * 0.5);
    } else if (initialDefHp > initialAttHp) {
      const diffPct = (initialDefHp - initialAttHp) / initialAttHp;
      defSurvivalFloor = Math.min(0.3, diffPct * 0.5);
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
  if (finalAttHp > finalDefHp) {
    winner = "attacker";
  } else if (finalAttHp < finalDefHp) {
    winner = "defender";
  } else {
    winner = finalAttCount >= finalDefCount ? "attacker" : "defender";
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
      const targetPlanet = attacker.planets.find((pl) => pl.sectorX === fleet.targetCoords.x && pl.sectorY === fleet.targetCoords.y);
      if (targetPlanet) {
        Object.entries(fleet.troops).forEach(([tId, count]) => {
          targetPlanet.troops[tId] = (targetPlanet.troops[tId] || 0) + count;
        });
        const report = {
          id: `battle_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          attackerId: fleet.senderId,
          attackerName: fleet.senderName,
          defenderId: fleet.senderId,
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
      if (hasLvl20 && attacker.planets.length < 5) {
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
  const players2 = Object.values(state.players).filter((p) => p.id.startsWith("ai_"));
  if (players2.length === 0) return;
  const luckyAI = players2[Math.floor(Math.random() * players2.length)];
  const actionType = Math.random();
  if (actionType < 0.25) {
    const banter = [
      "Securing boundaries in sector " + luckyAI.planets[0].sectorX + ", peace is a planetary illusion.",
      "Any active alliance looking for a strong merger? VOID is recruiting officers.",
      "Just upgraded my research center! The speed of light is no longer a restriction.",
      "Scouting for coordinates coordinates. Watch your back!",
      "Water consumption is getting tight, need to construct more water pumps!"
    ];
    const message = {
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
    const defender = players2[Math.floor(Math.random() * players2.length)];
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
  const factions = ["Solar Alliance", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const selectFaction = factions.includes(faction) ? faction : factions[0];
  const idx = factions.indexOf(selectFaction);
  const selectColor = factionColors[idx];
  const id = `user_${Math.random().toString(36).substr(2, 9)}`;
  const startX = Math.floor(Math.random() * 90) + 5;
  const startY = Math.floor(Math.random() * 90) + 5;
  const planet = createInitialPlanet(`${username}'s Station`, startX, startY);
  planet.buildings.commsHub.level = planet.buildings.commsHub.maxLevel;
  planet.buildings.researchCenter.level = planet.buildings.researchCenter.maxLevel;
  planet.buildings.armyBase.level = planet.buildings.armyBase.maxLevel;
  planet.buildings.repository.level = planet.buildings.repository.maxLevel;
  planet.buildings.radar.level = planet.buildings.radar.maxLevel;
  planet.buildings.supplyNexus.level = planet.buildings.supplyNexus.maxLevel;
  for (const key of Object.keys(planet.mines)) {
    planet.mines[key].forEach((m) => m.level = 25);
  }
  const maxCap = getRepositoryCapacity(planet.buildings.repository.level);
  planet.resources.water = maxCap;
  planet.resources.plasma = maxCap;
  planet.resources.fuel = maxCap;
  planet.resources.food = maxCap;
  planet.resources.respirant = maxCap;
  planet.troops.settlementShip = 1;
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
  const factions = ["Solar Alliance", "Nexus Syndicate", "Eclipse Vanguard"];
  const factionColors = ["#00F0FF", "#FF007A", "#FFC700"];
  const selectFaction = factions.includes(faction) ? faction : factions[0];
  const idx = factions.indexOf(selectFaction);
  const selectColor = factionColors[idx];
  const id = `google_${Math.random().toString(36).substr(2, 9)}`;
  const startX = Math.floor(Math.random() * 90) + 5;
  const startY = Math.floor(Math.random() * 90) + 5;
  const defaultUsername = username || email.split("@")[0];
  const planet = createInitialPlanet(`${defaultUsername}'s Station`, startX, startY);
  planet.buildings.commsHub.level = planet.buildings.commsHub.maxLevel;
  planet.buildings.researchCenter.level = planet.buildings.researchCenter.maxLevel;
  planet.buildings.armyBase.level = planet.buildings.armyBase.maxLevel;
  planet.buildings.repository.level = planet.buildings.repository.maxLevel;
  planet.buildings.radar.level = planet.buildings.radar.maxLevel;
  planet.buildings.supplyNexus.level = planet.buildings.supplyNexus.maxLevel;
  for (const key of Object.keys(planet.mines)) {
    planet.mines[key].forEach((m) => m.level = 25);
  }
  const maxCap = getRepositoryCapacity(planet.buildings.repository.level);
  planet.resources.water = maxCap;
  planet.resources.plasma = maxCap;
  planet.resources.fuel = maxCap;
  planet.resources.food = maxCap;
  planet.resources.respirant = maxCap;
  planet.troops.settlementShip = 1;
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
    serverTime: now
  });
});
app.post("/api/upgrade/mine", (req, res) => {
  const p = getLoggedPlayer(req);
  if (!p) return res.status(401).json({ error: "Unauthenticated" });
  const { planetId, resType, mineIndex, queue: reqQueue } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
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
    planet.upgradeQueue.push({
      type: "mine",
      key: resType,
      mineIndex,
      targetLevel
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
    planet.upgradeQueue.push({
      type: "building",
      key: buildingKey,
      targetLevel
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
  const { planetId, troopId, quantity, manufacturingSpeedLevel } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  if (!planet) return res.status(404).json({ error: "Planet not found" });
  const specs = TROOP_SPECS[troopId];
  if (!specs) return res.status(404).json({ error: "Troop spec not found" });
  const count = parseInt(quantity, 10);
  if (isNaN(count) || count <= 0) return res.status(400).json({ error: "Invalid quantity" });
  if (troopId === "settlementShip") {
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
  const { centerX, centerY, planetId } = req.body;
  const planet = p.planets.find((pl) => pl.id === planetId);
  const radarLvl = planet?.buildings.radar.level || 1;
  const scanRadius = radarLvl;
  const allTargets = [];
  Object.values(state.players).forEach((player) => {
    player.planets.forEach((pl) => {
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
        dist
        // raw distance for sorting
      });
    });
  });
  if (state.habitablePlanets) {
    state.habitablePlanets.forEach((hp) => {
      if (hp.isColonized) return;
      const dist = Math.hypot(hp.coords.x - centerX, hp.coords.y - centerY);
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
  let targets = allTargets.filter((t) => t.dist <= maxScanDist);
  if (targets.length < 5) {
    targets = allTargets.slice(0, 6);
  }
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
  let report = null;
  const now = Date.now();
  const reportId = `battle_intel_${Math.random().toString(36).substr(2, 9)}`;
  const isHab = state.habitablePlanets?.find((hp) => hp.coords.x === xVal && hp.coords.y === yVal);
  if (targetPlanet && targetUser) {
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
      resources: targetPlanet.resources
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
          `Detected station commander: ${targetUser.username} (${targetUser.faction})`,
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
  const { planetId, missionType, troops, targetId, targetName, targetBuilding } = req.body;
  const targetX = parseInt(String(req.body.targetX), 10);
  const targetY = parseInt(String(req.body.targetY), 10);
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
    if (p.planets.length >= 5) {
      return res.status(400).json({ error: "Command limits reached. Max 5 colonized colony planets." });
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
      return res.status(400).json({ error: "Move relocation directives are only authorized to target your own colonized planets and moonbases!" });
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
  const mission = {
    id: `fleet_${Math.random().toString(36).substr(2, 9)}`,
    senderId: p.id,
    senderName: p.username,
    senderCoords: { x: planet.sectorX, y: planet.sectorY },
    targetId: targetId || null,
    targetName: targetName || `Sector [${targetX}, ${targetY}]`,
    targetCoords: { x: targetX, y: targetY },
    missionType,
    troops: troopSend,
    startedAt: now,
    arrivesAt: now + travelTimeMs,
    isReturning: false,
    isWaitingToSettle: false,
    targetBuilding: targetBuilding || void 0,
    troopSpeedLevel: speedLvl
  };
  state.fleets.push(mission);
  saveState();
  res.json({ player: p, success: true, fleets: state.fleets });
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
  if (p.planets.length >= 5) {
    return res.status(400).json({ error: "Command limits reached. Max 5 colony planets." });
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
    content: `${p.username} has launched a new military faction: [${tag.toUpperCase()}] ${name.toUpperCase()}!`,
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
  const { targetId, resources } = req.body;
  if (p.id === targetId) {
    return res.status(400).json({ error: "You cannot transmit resources to your own coordinates!" });
  }
  const targetPlayer = state.players[targetId] || Object.values(state.players).find((u) => u.id === targetId);
  if (!targetPlayer) {
    return res.status(404).json({ error: "Recipient commander coordinates not found" });
  }
  const senderPlanet = p.planets[0];
  const targetPlanet = targetPlayer.planets[0];
  if (!senderPlanet) {
    return res.status(400).json({ error: "Sender starbase planet configuration mismatch." });
  }
  if (!targetPlanet) {
    return res.status(400).json({ error: "Recipient starbase planet configuration mismatch." });
  }
  const keys = ["water", "plasma", "fuel", "food", "respirant"];
  for (const k of keys) {
    const qty = Math.max(0, parseInt(resources[k], 10) || 0);
    if (qty > 0) {
      if ((senderPlanet.resources[k] || 0) < qty) {
        return res.status(400).json({ error: `Not enough ${k} on your active moonbase planetary reserves.` });
      }
    }
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
    content: `Commander ${p.username} successfully transmitted a massive payload cargo shipment to Commander ${targetPlayer.username}!`,
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
  if (p.credits === void 0) {
    p.credits = 1250;
  }
  p.credits += amount;
  state.newsEvents.unshift({
    id: `credit_${Math.random().toString(36).substr(2, 9)}`,
    title: "Galactic Funding Secured",
    content: `Commander ${p.username} authorized security transmission of +${amount.toLocaleString()} Galactic Credits under [${tierLabel || "Premium Gateway"}].`,
    type: "discovery",
    timestamp: Date.now()
  });
  saveState();
  res.json({ player: p, success: true });
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
startServer();
//# sourceMappingURL=server.cjs.map
