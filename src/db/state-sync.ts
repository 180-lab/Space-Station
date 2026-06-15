import { db } from "./index.ts";
import * as schema from "./schema.ts";
import { GameState, PlayerProfile, ColonyPlanet, Alliance, ChatMessage, FleetMission, BattleReport, NewsEvent, HabitablePlanet, SuggestionFeedback } from "../types.ts";

export async function loadStateFromDB(): Promise<GameState> {
  const loadedState: GameState = {
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
    // 1. Load players
    const dbPlayers = await db.select().from(schema.players);
    for (const p of dbPlayers) {
      const playerProfile: PlayerProfile = {
        id: p.id,
        username: p.username,
        faction: p.faction,
        factionColor: p.factionColor,
        allianceId: p.allianceId || null,
        allianceRole: p.allianceRole as any,
        planets: [],
        scores: p.scores as any,
        achievements: p.achievements as string[],
        skinId: p.skinId,
        bannerId: p.bannerId,
        lastDailyRewardClaim: p.lastDailyRewardClaim,
        credits: p.credits,
        googleEmail: p.googleEmail || undefined,
        password: p.password || undefined,
        lastActive: p.lastActive || undefined
      };
      loadedState.players[p.id] = playerProfile;
    }

    // 2. Load planets
    const dbPlanPlanets = await db.select().from(schema.planets);
    for (const pl of dbPlanPlanets) {
      const colony: ColonyPlanet = {
        id: pl.id,
        name: pl.name,
        sectorX: pl.sectorX,
        sectorY: pl.sectorY,
        skinId: pl.skinId,
        mines: pl.mines as any,
        buildings: pl.buildings as any,
        resources: pl.resources as any,
        troops: pl.troops as any,
        trainingQueue: pl.trainingQueue as any,
        lastSupplyNexusClaim: pl.lastSupplyNexusClaim || undefined,
        upgradeQueue: (pl.upgradeQueue as any) || undefined
      };
      if (loadedState.players[pl.playerId]) {
        loadedState.players[pl.playerId].planets.push(colony);
      }
    }

    // 3. Load alliances
    const dbAlliances = await db.select().from(schema.alliances);
    for (const a of dbAlliances) {
      const alliance: Alliance = {
        id: a.id,
        name: a.name,
        tag: a.tag,
        leaderId: a.leaderId,
        leaderName: a.leaderName,
        members: a.members as any,
        wars: a.wars as any,
        bannerColor: a.bannerColor,
        bannerSymbol: a.bannerSymbol,
        highlights: a.highlights || undefined
      };
      loadedState.alliances[a.id] = alliance;
    }

    // 4. Load chats
    const dbChats = await db.select().from(schema.chatMessages);
    loadedState.chatMessages = dbChats.map(c => ({
      id: c.id,
      channel: c.channel as any,
      senderId: c.senderId,
      senderName: c.senderName,
      senderFaction: c.senderFaction,
      senderFactionColor: c.senderFactionColor,
      allianceTag: c.allianceTag,
      receiverId: c.receiverId,
      content: c.content,
      timestamp: c.timestamp
    }));

    // 5. Load fleets
    const dbFleets = await db.select().from(schema.fleets);
    loadedState.fleets = dbFleets.map(f => ({
      id: f.id,
      senderId: f.senderId,
      senderName: f.senderName,
      senderCoords: f.senderCoords as any,
      targetId: f.targetId,
      targetName: f.targetName,
      targetCoords: f.targetCoords as any,
      missionType: f.missionType as any,
      troops: f.troops as any,
      startedAt: f.startedAt,
      arrivesAt: f.arrivesAt,
      isReturning: f.isReturning,
      isWaitingToSettle: f.isWaitingToSettle || undefined,
      targetBuilding: f.targetBuilding || undefined,
      lootCarried: (f.lootCarried as any) || undefined,
      troopSpeedLevel: f.troopSpeedLevel || undefined,
      defenseShieldsLevel: f.defenseShieldsLevel || undefined
    }));

    // 6. Load battle reports
    const dbReports = await db.select().from(schema.battleReports);
    loadedState.battleReports = dbReports.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      attackerId: r.attackerId,
      attackerName: r.attackerName,
      attackerAlliance: r.attackerAlliance || undefined,
      defenderId: r.defenderId,
      defenderName: r.defenderName,
      defenderAlliance: r.defenderAlliance || undefined,
      isRecon: r.isRecon || undefined,
      attackerCoords: r.attackerCoords as any,
      defenderCoords: r.defenderCoords as any,
      attackerInitialTroops: r.attackerInitialTroops as any,
      attackerLosses: r.attackerLosses as any,
      defenderInitialTroops: r.defenderInitialTroops as any,
      defenderLosses: r.defenderLosses as any,
      winner: r.winner as any,
      resourcesStolen: r.resourcesStolen as any,
      buildingDamage: (r.buildingDamage as any) || undefined,
      attackHpKilled: r.attackHpKilled,
      defenceHpKilled: r.defenceHpKilled,
      battleRounds: (r.battleRounds as any) || undefined,
      buildings: (r.buildings as any) || undefined,
      mines: (r.mines as any) || undefined,
      resources: (r.resources as any) || undefined
    }));

    // 7. Load news
    const dbNews = await db.select().from(schema.newsEvents);
    loadedState.newsEvents = dbNews.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type as any,
      timestamp: n.timestamp
    }));

    // 8. Load habitable planets
    const dbHabitable = await db.select().from(schema.habitablePlanets);
    loadedState.habitablePlanets = dbHabitable.map(h => ({
      id: h.id,
      name: h.name,
      coords: h.coords as any,
      isColonized: h.isColonized
    }));

    // 9. Load feedbacks
    const dbFeedbacks = await db.select().from(schema.feedbacks);
    loadedState.feedbacks = dbFeedbacks.map(f => ({
      id: f.id,
      senderId: f.senderId,
      senderName: f.senderName,
      senderEmail: f.senderEmail,
      content: f.content,
      category: f.category as any,
      timestamp: f.timestamp
    }));

  } catch (error) {
    console.error("Error loading state from Cloud SQL database:", error);
    throw error;
  }

  return loadedState;
}

export async function saveStateToDB(state: GameState): Promise<void> {
  try {
    // 1. Save Alliances
    for (const a of Object.values(state.alliances)) {
      await db.insert(schema.alliances)
        .values({
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
        })
        .onConflictDoUpdate({
          target: schema.alliances.id,
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

    // 2. Save Players and Planets
    for (const p of Object.values(state.players)) {
      await db.insert(schema.players)
        .values({
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
        })
        .onConflictDoUpdate({
          target: schema.players.id,
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

      // Save user planets
      if (p.planets) {
        for (const pl of p.planets) {
          await db.insert(schema.planets)
            .values({
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
            })
            .onConflictDoUpdate({
              target: schema.planets.id,
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

    // 3. Save Chat Messages (keep last 100 or all)
    for (const c of state.chatMessages) {
      await db.insert(schema.chatMessages)
        .values({
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
        })
        .onConflictDoNothing();
    }

    // 4. Save Fleets
    await db.delete(schema.fleets);
    for (const f of state.fleets) {
      await db.insert(schema.fleets)
        .values({
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

    // 5. Save Battle Reports
    for (const r of state.battleReports) {
      await db.insert(schema.battleReports)
        .values({
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
        })
        .onConflictDoNothing();
    }

    // 6. Save News Events
    for (const n of state.newsEvents) {
      await db.insert(schema.newsEvents)
        .values({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type,
          timestamp: n.timestamp
        })
        .onConflictDoNothing();
    }

    // 7. Save Habitable Planets
    if (state.habitablePlanets) {
      for (const h of state.habitablePlanets) {
        await db.insert(schema.habitablePlanets)
          .values({
            id: h.id,
            name: h.name,
            coords: h.coords,
            isColonized: h.isColonized
          })
          .onConflictDoUpdate({
            target: schema.habitablePlanets.id,
            set: {
              name: h.name,
              coords: h.coords,
              isColonized: h.isColonized
            }
          });
      }
    }

    // 8. Save Feedback
    if (state.feedbacks) {
      for (const f of state.feedbacks) {
        await db.insert(schema.feedbacks)
          .values({
            id: f.id,
            senderId: f.senderId,
            senderName: f.senderName,
            senderEmail: f.senderEmail,
            content: f.content,
            category: f.category,
            timestamp: f.timestamp
          })
          .onConflictDoNothing();
      }
    }

  } catch (error) {
    console.error("Error saving state to Cloud SQL database (non-blocking fallback active):", error);
  }
}
