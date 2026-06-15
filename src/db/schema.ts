import { pgTable, text, timestamp, integer, boolean, bigint, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  faction: text('faction').notNull(),
  factionColor: text('faction_color').notNull(),
  allianceId: text('alliance_id'),
  allianceRole: text('alliance_role'),
  scores: jsonb('scores').notNull(),
  achievements: jsonb('achievements').notNull(),
  skinId: text('skin_id').notNull(),
  bannerId: text('banner_id').notNull(),
  lastDailyRewardClaim: bigint('last_daily_reward_claim', { mode: 'number' }).notNull(),
  credits: integer('credits').notNull(),
  googleEmail: text('google_email'),
  password: text('password'),
  lastActive: bigint('last_active', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const planets = pgTable('planets', {
  id: text('id').primaryKey(),
  playerId: text('player_id').references(() => players.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  sectorX: integer('sector_x').notNull(),
  sectorY: integer('sector_y').notNull(),
  skinId: text('skin_id').notNull(),
  mines: jsonb('mines').notNull(),
  buildings: jsonb('buildings').notNull(),
  resources: jsonb('resources').notNull(),
  troops: jsonb('troops').notNull(),
  trainingQueue: jsonb('training_queue').notNull(),
  lastSupplyNexusClaim: bigint('last_supply_nexus_claim', { mode: 'number' }),
  upgradeQueue: jsonb('upgrade_queue'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const alliances = pgTable('alliances', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tag: text('tag').notNull(),
  leaderId: text('leader_id').notNull(),
  leaderName: text('leader_name').notNull(),
  members: jsonb('members').notNull(),
  wars: jsonb('wars').notNull(),
  bannerColor: text('banner_color').notNull(),
  bannerSymbol: text('banner_symbol').notNull(),
  highlights: text('highlights'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  channel: text('channel').notNull(),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderFaction: text('sender_faction').notNull(),
  senderFactionColor: text('sender_faction_color').notNull(),
  allianceTag: text('alliance_tag'),
  receiverId: text('receiver_id'),
  content: text('content').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
});

export const fleets = pgTable('fleets', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderCoords: jsonb('sender_coords').notNull(),
  targetId: text('target_id'),
  targetName: text('target_name').notNull(),
  targetCoords: jsonb('target_coords').notNull(),
  missionType: text('mission_type').notNull(),
  troops: jsonb('troops').notNull(),
  startedAt: bigint('started_at', { mode: 'number' }).notNull(),
  arrivesAt: bigint('arrives_at', { mode: 'number' }).notNull(),
  isReturning: boolean('is_returning').notNull(),
  isWaitingToSettle: boolean('is_waiting_to_settle'),
  targetBuilding: text('target_building'),
  lootCarried: jsonb('loot_carried'),
  troopSpeedLevel: integer('troop_speed_level'),
  defenseShieldsLevel: integer('defense_shields_level'),
});

export const battleReports = pgTable('battle_reports', {
  id: text('id').primaryKey(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  attackerId: text('attacker_id').notNull(),
  attackerName: text('attacker_name').notNull(),
  attackerAlliance: text('attacker_alliance'),
  defenderId: text('defender_id').notNull(),
  defenderName: text('defender_name').notNull(),
  defenderAlliance: text('defender_alliance'),
  isRecon: boolean('is_recon'),
  attackerCoords: jsonb('attacker_coords').notNull(),
  defenderCoords: jsonb('defender_coords').notNull(),
  attackerInitialTroops: jsonb('attacker_initial_troops').notNull(),
  attackerLosses: jsonb('attacker_losses').notNull(),
  defenderInitialTroops: jsonb('defender_initial_troops').notNull(),
  defenderLosses: jsonb('defender_losses').notNull(),
  winner: text('winner').notNull(),
  resourcesStolen: jsonb('resources_stolen').notNull(),
  buildingDamage: jsonb('building_damage'),
  attackHpKilled: integer('attack_hp_killed').notNull(),
  defenceHpKilled: integer('defence_hp_killed').notNull(),
  battleRounds: jsonb('battle_rounds'),
  buildings: jsonb('buildings'),
  mines: jsonb('mines'),
  resources: jsonb('resources'),
});

export const newsEvents = pgTable('news_events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
});

export const habitablePlanets = pgTable('habitable_planets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  coords: jsonb('coords').notNull(),
  isColonized: boolean('is_colonized').notNull(),
});

export const feedbacks = pgTable('feedbacks', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
});

export const playersRelations = relations(players, ({ many }) => ({
  planets: many(planets),
}));

export const planetsRelations = relations(planets, ({ one }) => ({
  player: one(players, {
    fields: [planets.playerId],
    references: [players.id],
  }),
}));
