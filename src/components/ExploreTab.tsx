import React, { useState } from 'react';
import { ColonyPlanet, PlayerProfile, ResourceType, getUpgradeResourceCost, FleetMission } from '../types';
import { 
  Droplet, 
  Flame, 
  Zap, 
  Apple, 
  Wind, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Clock, 
  Building2, 
  RotateCw,
  ShieldAlert
} from 'lucide-react';

const UpgradeCostBar: React.FC<{ type: 'mine' | 'building'; upgradeKey: string; targetLevel: number }> = ({ type, upgradeKey, targetLevel }) => {
  const resourceTypes: ResourceType[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
  const infoMap = {
    water: { icon: Droplet, color: 'text-cyan-400' },
    plasma: { icon: Zap, color: 'text-purple-400' },
    fuel: { icon: Flame, color: 'text-amber-400' },
    food: { icon: Apple, color: 'text-emerald-400' },
    respirant: { icon: Wind, color: 'text-blue-400' }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {resourceTypes.map((rKey) => {
        const cost = getUpgradeResourceCost(type, upgradeKey, targetLevel, rKey);
        const { icon: Icon, color } = infoMap[rKey];
        return (
          <div key={rKey} className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] font-mono font-bold">
            <Icon size={11} className={color} />
            <span className="text-slate-300">{cost.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
};

interface ExploreTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  onUpgradeMine: (resType: ResourceType, mineIndex: number) => void;
  onUpgradeBuilding: (buildingKey: string) => void;
  serverTime: number;
  fleets: FleetMission[];
  onSettle?: (fleetId: string) => Promise<void>;
}

const RESOURCE_INFO: Record<ResourceType, { name: string; color: string; icon: any; desc: string }> = {
  water: { name: 'Water', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40', icon: Droplet, desc: 'Essential life fluid. Consumed continuously by troops.' },
  plasma: { name: 'Plasma', color: 'text-pink-500 bg-pink-950/40 border-pink-900/40', icon: Zap, desc: 'High-energy matter used to forge dreadnoughts and hyper-engines.' },
  fuel: { name: 'Fuel', color: 'text-amber-500 bg-amber-950/40 border-amber-900/40', icon: Flame, desc: 'Thermonuclear combustibles required for fleet traversal logistics.' },
  food: { name: 'Food', color: 'text-emerald-500 bg-emerald-950/40 border-emerald-900/40', icon: Apple, desc: 'Synthesized proteins to support base colonists and ground forces.' },
  respirant: { name: 'Respirant', color: 'text-purple-400 bg-purple-950/40 border-purple-900/40', icon: Wind, desc: 'Atmospheric gases key to orbital military ventilation systems.' },
};

const BUILDING_INFO: Record<string, { name: string; desc: string; icon: string }> = {
  commsHub: { name: 'Communications Hub', desc: 'Secure interline network frequency to join alliances, manage roles, negotiate covenants, and deploy galaxy chat.', icon: '📡' },
  researchCenter: { name: 'Research Center', desc: 'Purity laboratory. Decreases travel or production speed of your troops by up to 70% at Lv.20. Crucial for colonization.', icon: '🧪' },
  armyBase: { name: 'Command Center', desc: 'Troop command space force. Recruit defenders, strike interceptors, looters, and orbital tanks.', icon: '🎖️' },
  repository: { name: 'Repository', desc: 'Secure vaults storing your resource mines. Max level 45, holds up to 5,000,000 of each fluid.', icon: '🗄️' },
  radar: { name: 'Radar Array', desc: 'Long-range sector radar scanners. Expands tactical awareness across coordinates.', icon: '🛰️' }
};

export const ExploreTab: React.FC<ExploreTabProps> = ({ 
  player, 
  activePlanet, 
  onUpgradeMine, 
  onUpgradeBuilding,
  serverTime,
  fleets,
  onSettle
}) => {
  const [expandedCategory, setExpandedCategory] = useState<ResourceType | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const repositoryLimit = Math.round(10000 * Math.pow(500, (activePlanet.buildings.repository.level - 1) / 44));

  // Helper to format remaining duration strings
  const getTimerString = (endTimestamp: number | null) => {
    if (!endTimestamp) return '';
    const diff = Math.max(0, endTimestamp - serverTime);
    const secs = Math.floor(diff / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Check if any resources are low
  const isDehydrated = activePlanet.resources.water <= 0;

  // Let's calculate total troop water consumption per hour
  const getWaterConsumption = () => {
    let tot = 0;
    const specCosts = { defender: 0.5, attacker: 1.0, tank: 2.0, looter: 1.5, drone: 0.2, settlementShip: 2.5 };
    Object.entries(activePlanet.troops).forEach(([tId, count]) => {
      tot += (count as number) * (specCosts[tId as keyof typeof specCosts] || 0);
    });
    return tot;
  };

  const waterConsumption = getWaterConsumption();

  // Active Fleets scanning for Alerts indicator color schemas
  const incomingAttacks = fleets.filter(
    f => f.targetId === player.id &&
         f.missionType === 'attack' &&
         !f.isReturning &&
         serverTime < f.arrivesAt
  );

  const movingForces = fleets.filter(
    f => f.senderId === player.id &&
         (serverTime < f.arrivesAt || f.isWaitingToSettle)
  );

  let alertsColor = 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20';
  let alertsLabel = 'SECURE';
  let alertsValue = 'OPTIMAL NO ACTIONS';
  let pulseDot = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';

  if (incomingAttacks.length > 0) {
    alertsColor = 'border-red-500 text-red-500 bg-red-950/40 border-2 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]';
    alertsLabel = 'RED ALERT';
    alertsValue = `${incomingAttacks.length} HOSTILE ACTIONS`;
    pulseDot = 'bg-red-500 shadow-[0_0_10px_#ef4444]';
  } else if (movingForces.length > 0) {
    alertsColor = 'border-amber-500 text-amber-500 bg-amber-950/30 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.2)]';
    alertsLabel = 'ORANGE TRANSIT';
    alertsValue = `${movingForces.length} SQUADRONS ACTIVE`;
    pulseDot = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Action Centerpiece Header with Holographic Glow */}
      <div className="relative p-6 bg-gradient-to-b from-[#0F172A] to-black border border-white/5 rounded-xl overflow-hidden flex flex-col">
        {/* Holographic Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase font-mono">SECTOR COMMAND SITE</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">{activePlanet.name}</h2>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className={`inline-block w-2 h-2 rounded-full ${pulseDot} animate-pulse`} />
              Sovereignty: {player.username} Station &bull; Sector Coord: [{activePlanet.sectorX}, {activePlanet.sectorY}]
            </div>
          </div>

          {/* Active Sector Alerts indicator block (Replaces Repository Limit) */}
          <button
            id="alerts-hud-trigger"
            onClick={() => setIsAlertsOpen(true)}
            className={`p-3 border rounded-lg text-left font-mono min-w-[170px] self-start md:self-auto cursor-pointer transition duration-150 hover:brightness-110 active:scale-95 flex flex-col justify-center ${alertsColor}`}
          >
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-75">{alertsLabel}</span>
            <span className="text-[11px] font-black uppercase mt-1 tracking-tight flex items-center gap-1.5 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
              {alertsValue}
            </span>
          </button>
        </div>

        {isDehydrated && (
          <div className="relative z-10 mt-4 p-3 border border-red-900/50 bg-red-950/30 text-red-400 rounded-xl flex items-start gap-2.5 text-xs" title="Critical Alert: High severity base warning">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce" title="Shield warning indicator: Critical dehydration is occurring" />
            <div>
              <p className="font-bold uppercase tracking-widest text-[10px]">CRITICAL WATER DEPLETION</p>
              <p className="text-red-300/80 leading-relaxed mt-0.5">Troops are suffering rapid attrition due to extreme dehydration! Upgrade water mines immediately built with deep wells.</p>
            </div>
          </div>
        )}
      </div>

      {/* resource mines category list */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Resource Extractors (Level Limit: 15)</h3>
          <span className="text-xs text-cyan-400 font-mono">Click to Upgrade</span>
        </div>

        <div className="space-y-4">
          {(Object.keys(RESOURCE_INFO) as ResourceType[]).map((resKey) => {
            const info = RESOURCE_INFO[resKey];
            const mines = activePlanet.mines[resKey];
            const isExpanded = expandedCategory === resKey;
            
            // Calc total production
            const repositoryLimit = Math.round(10000 * Math.pow(500, (activePlanet.buildings.repository.level - 1) / 44));
            const isOtherMaxed = 
              activePlanet.resources.plasma >= repositoryLimit &&
              activePlanet.resources.fuel >= repositoryLimit &&
              activePlanet.resources.food >= repositoryLimit &&
              activePlanet.resources.respirant >= repositoryLimit;
            
            const totalProd = isOtherMaxed ? (resKey === 'water' ? 84000 : 42000) : mines.reduce((sum, m) => sum + Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33)), 0);
            
            return (
              <div 
                key={resKey}
                className="border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md overflow-hidden transition-all duration-200"
                id={`mining_cat_${resKey}`}
              >
                {/* Accordion Trigger */}
                <button 
                  onClick={() => setExpandedCategory(isExpanded ? null : resKey)}
                  className="w-full p-4 flex items-center justify-between text-left transition hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl border ${info.color} shadow-inner`} title={`${info.name}: ${info.desc}. Click/long-press to open sector pumps list.`}>
                      <info.icon size={18} title={`${info.name}: ${info.desc}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base font-mono">{info.name} Extractors</span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">({mines.length} Pumps)</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                        <TrendingUp size={12} className="text-slate-500" title="Hourly production delta indicator" />
                        <span className="font-bold text-emerald-400">+{totalProd.toLocaleString()}/hr</span>
                        {resKey === 'water' && waterConsumption > 0 && (
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption).toLocaleString()}/hr troops)</span>
                        )}
                        {resKey === 'respirant' && waterConsumption > 0 && (
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption * 4).toLocaleString()}/hr troops)</span>
                        )}
                        {resKey === 'food' && waterConsumption > 0 && (
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption * 1.5).toLocaleString()}/hr troops)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-red-500" title="Click or long press to hide detail parameters" />
                    ) : (
                      <ChevronDown size={18} className="text-emerald-500" title="Click or long press to show detail parameters" />
                    )}
                  </div>
                </button>

                {/* Mines Panel */}
                {isExpanded && (
                  <div className="p-4 border-t border-[#1E293B] bg-black/20 space-y-3.5">
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{info.desc}</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {mines.map((mine) => {
                        const targetLevel = mine.level + 1;
                        const cost = targetLevel * 100;

                        return (
                          <div 
                            key={mine.index}
                            className="p-4 rounded-xl border border-[#1E293B] bg-[#05070A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-150 hover:border-white/10"
                            id={`mine_${resKey}_${mine.index}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-sm text-slate-200">Extractor Pump #{mine.index + 1}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-[#1E293B]">
                                  Lv. {mine.level}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                Hourly Output: <span className="text-slate-350">{Math.round((mine.level / 15) * (resKey === 'water' ? 14000 : 8333.33)).toLocaleString()}/hr</span>
                              </div>
                              {mine.level < 15 && (
                                <UpgradeCostBar type="mine" upgradeKey={resKey} targetLevel={targetLevel} />
                              )}
                            </div>

                            {/* Upgrade panel */}
                            <div className="font-mono text-xs self-end sm:self-auto">
                              {mine.isUpgrading ? (
                                <div className="flex flex-col sm:items-end gap-1.5">
                                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono" title="Undergoing deep flux compression. Countdown until completion.">
                                    <Clock size={12} className="animate-spin" title="Spinning dynamic timer indicator" />
                                    <span>Compressing Flux {getTimerString(mine.upgradeEnd)}</span>
                                  </div>
                                </div>
                              ) : mine.level >= 15 ? (
                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase bg-slate-900 border border-slate-850 px-2 py-1 rounded">MAX CAP</span>
                              ) : (
                                <button 
                                  onClick={() => onUpgradeMine(resKey, mine.index)}
                                  className="px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] text-[10px] uppercase font-bold border border-cyan-500/35 rounded-xl transition duration-150 cursor-pointer"
                                >
                                  Upgrade <span className="text-slate-500">(1min)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* TACTICAL METRIC FLIGHT RADAR - INCOMING AND OUTGOING FLEET OBSERVATIONS */}
      {(() => {
        const outgoingFleets = fleets.filter((f) => f.senderId === player.id);
        const incomingFleets = fleets.filter(
          (f) => f.targetId === player.id && f.senderId !== player.id
        );

        return (
          <div className="p-5 border border-[#1E293B] bg-[#0A0F1D]/80 backdrop-blur-md rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 font-mono">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                Tactical Starport Radar
              </h3>
              <span className="text-[10px] bg-[#05070A] text-slate-400 border border-[#1E293B] px-2.5 py-1 rounded-lg font-mono font-bold">
                ACTIVE FLIGHTS: {outgoingFleets.length + incomingFleets.length}
              </span>
            </div>

            {outgoingFleets.length === 0 && incomingFleets.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-5050 text-slate-500 font-mono">No active fleet transits detected in your world quadrant.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* INCOMING RADAR FLARES/ATTACKS */}
                {incomingFleets.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase font-mono flex items-center gap-1.5 animate-pulse">
                      <ShieldAlert size={12} className="text-red-450 text-red-400" />
                      Warning: Incoming Military Signatures ({incomingFleets.length})
                    </span>
                    <div className="space-y-3 font-mono text-xs">
                      {incomingFleets.map((fleet) => {
                        const totalDuration = fleet.arrivesAt - fleet.startedAt;
                        const elapsed = Math.max(0, serverTime - fleet.startedAt);
                        const progressPercent = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
                        const secsRemaining = Math.max(0, Math.ceil((fleet.arrivesAt - serverTime) / 1000));

                        return (
                          <div key={fleet.id} className="p-4 border border-red-900/35 bg-red-950/10 rounded-xl space-y-3">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <span className={`font-black uppercase tracking-wide px-2 py-0.5 rounded text-[10px] ${fleet.missionType === 'attack' ? 'text-white bg-red-550 bg-red-800' : 'text-slate-300 bg-white/5'}`}>
                                  INCOMING {fleet.missionType.toUpperCase()}
                                </span>
                                <span className="text-slate-5050 text-slate-400 font-bold block mt-2 text-[11px]">
                                  SENDER: {fleet.senderName}
                                </span>
                                <span className="text-slate-500 text-[10px] block mt-1">
                                  T-Route: [{fleet.senderCoords.x}, {fleet.senderCoords.y}] &rarr; [{fleet.targetCoords.x}, {fleet.targetCoords.y}]
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-red-400 font-black text-xs block">{getTimerString(fleet.arrivesAt)}</span>
                                <span className="text-slate-500 text-[9px] block">({secsRemaining}s remaining)</span>
                              </div>
                            </div>

                            {/* Troops inside this fleet */}
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                              {Object.entries(fleet.troops).map(([tId, count]) => {
                                if (!count) return null;
                                return (
                                  <span key={tId} className="bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded uppercase font-bold text-red-300">
                                    {tId}: {count}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Visual Flight Bar */}
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 relative">
                              <div 
                                className="bg-red-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* OUTGOING SQUADRONS */}
                {outgoingFleets.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase font-mono">
                      Your Dispatched Squadrons ({outgoingFleets.length})
                    </span>
                    <div className="space-y-3 font-mono text-xs">
                      {outgoingFleets.map((fleet) => {
                        const totalDuration = fleet.arrivesAt - fleet.startedAt;
                        const elapsed = Math.max(0, serverTime - fleet.startedAt);
                        const progressPercent = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
                        const secsRemaining = Math.max(0, Math.ceil((fleet.arrivesAt - serverTime) / 1000));

                        return (
                          <div 
                            key={fleet.id} 
                            style={{ cursor: fleet.isWaitingToSettle ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (fleet.isWaitingToSettle && onSettle) {
                                onSettle(fleet.id);
                              }
                            }}
                            className={`p-4 border rounded-xl space-y-3 transition duration-150 ${
                              fleet.isWaitingToSettle 
                                ? 'border-emerald-500 bg-emerald-950/25 hover:border-emerald-400 hover:bg-emerald-950/35 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'border-[#1E293B] bg-[#05070A]/85'
                            }`}
                          >
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-black uppercase tracking-wide px-2 py-0.5 rounded text-[10px] ${
                                    fleet.isWaitingToSettle ? 'text-black bg-emerald-400' :
                                    fleet.missionType === 'attack' ? 'text-red-400 bg-red-950/25' : 
                                    fleet.missionType === 'colonize' ? 'text-amber-400 bg-amber-950/25' : 'text-blue-400 bg-blue-950/25'
                                  }`}>
                                    {fleet.isWaitingToSettle ? 'SETTLEMENT ATTAINED' : `${fleet.missionType.toUpperCase()} DEPLOYMENT`}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/5 border border-white/5 text-slate-350 uppercase">
                                    {fleet.isReturning ? 'Returning' : 'Outbound'}
                                  </span>
                                </div>
                                <span className="text-slate-450 block mt-2 text-[11px]">
                                  Target Coord: {fleet.targetName} [{fleet.targetCoords.x}, {fleet.targetCoords.y}]
                                </span>
                              </div>
                              <div className="text-right">
                                {fleet.isWaitingToSettle ? (
                                  <span className="text-emerald-400 font-extrabold text-xs block animate-bounce">SECURED &bull; READY</span>
                                ) : (
                                  <>
                                    <span className="text-cyan-400 font-bold text-xs block">{getTimerString(fleet.arrivesAt)}</span>
                                    <span className="text-slate-500 text-[9px] block">({secsRemaining}s remaining)</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Troops inside this fleet */}
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                              {Object.entries(fleet.troops).map(([tId, count]) => {
                                if (!count) return null;
                                return (
                                  <span key={tId} className="bg-[#0A0F1D] border border-[#1E293B] px-1.5 py-0.5 rounded uppercase font-bold text-slate-350">
                                    {tId}: {count}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Flight Bar */}
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 relative">
                              <div 
                                className={`h-full rounded-full transition-all duration-350 ${
                                  fleet.isWaitingToSettle ? 'bg-emerald-500' :
                                  fleet.isReturning ? 'bg-yellow-500' :
                                  fleet.missionType === 'attack' ? 'bg-red-500' :
                                  fleet.missionType === 'colonize' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            {fleet.isWaitingToSettle && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSettle) onSettle(fleet.id);
                                  }}
                                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] transition text-black font-extrabold uppercase tracking-wider text-[11px] rounded-lg animate-pulse"
                                >
                                  ⚡ CLICK HERE TO SETTLE ON PLANET
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* base buildings infrastructure */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono mb-4">Structures Commands</h3>
        <div className="space-y-4">
          {Object.entries(activePlanet.buildings).map(([bKey, val]) => {
            const bState = val as any;
            const info = BUILDING_INFO[bKey];
            if (!info) return null;

            const targetLvl = bState.level + 1;
            const cost = targetLvl * 150;
            const upgradeTimeMins = targetLvl * 2;

            return (
              <div 
                key={bKey}
                className="p-5 border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition duration-150 hover:border-white/10"
                id={`building_${bKey}`}
              >
                <div className="flex items-start gap-4 max-w-2xl">
                  <div className="p-3.5 rounded-xl bg-[#05070A] border border-[#1E293B] text-2xl font-sans text-center shrink-0 shadow-lg select-none">
                    {info.icon}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-white text-base font-mono">{info.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-pink-400 border border-[#1E293B]">
                        Lv. {bState.level} / {bState.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{info.desc}</p>
                    {bKey === 'repository' && (
                      <div className="text-xs text-cyan-400 font-mono mt-1.5 font-bold">
                        Current Store Capacity Limit: <span className="text-white bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded font-bold">{(Math.round(10000 * Math.pow(500, (bState.level - 1) / 44))).toLocaleString()}</span> units per resource
                      </div>
                    )}
                    {bState.level < bState.maxLevel && (
                      <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={targetLvl} />
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col items-end gap-2 justify-between">
                  <span className="text-xs text-slate-500 font-mono md:hidden">Actions:</span>
                  {bState.isUpgrading ? (
                    <div className="flex flex-col items-end gap-1.5 font-mono">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400" title="Building upgrade in progress. Countdown until build completion.">
                        <Clock size={12} className="animate-spin" title="Spinning build progress timer" />
                        <span>Upgrading {getTimerString(bState.upgradeEnd)}</span>
                      </div>
                    </div>
                  ) : bState.level >= bState.maxLevel ? (
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono bg-slate-900 border border-slate-850 px-2 py-1 rounded">MAX CAP</span>
                  ) : (
                    <button 
                      onClick={() => onUpgradeBuilding(bKey)}
                      className="px-4 py-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:shadow-[0_0_12px_rgba(236,72,153,0.25)] border border-pink-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <span>Upgrade</span>
                      <span className="text-slate-500">({upgradeTimeMins}m)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tactical Alerts Modal Overlay */}
      {isAlertsOpen && (
        <div id="alerts-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#090D1A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Holographic scanner top overlay */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500"></div>

            {/* Header */}
            <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3 font-mono">
                <div className={`w-3.5 h-3.5 rounded-full ${pulseDot} animate-pulse`} />
                <div>
                  <h3 className="text-sm font-black text-white tracking-widest uppercase">TACTICAL OPERATIONS ALERTS HUD</h3>
                  <p className="text-[9px] text-slate-400 uppercase mt-0.5 font-bold">Orbital Space Command &bull; Coordinate Transit Scanner</p>
                </div>
              </div>
              <button
                id="close-alerts-top"
                onClick={() => setIsAlertsOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-xs uppercase tracking-widest cursor-pointer border border-[#1E293B] px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.05]"
              >
                Close HUD
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[250px] font-mono">
              
              {/* 1. Red Section: Incoming Attack Alerts */}
              <div>
                <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-red-950 pb-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  [!] HOSTILE INVASION SQUADRONS DETECTED
                </h4>

                {incomingAttacks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-3 py-2 bg-slate-950/20 border border-slate-900 rounded-lg">No incoming hostile squadrons detected. Sector perimeter secure.</p>
                ) : (
                  <div className="space-y-3">
                    {incomingAttacks.map((fleet) => {
                      const secondsLeft = Math.max(0, Math.floor((fleet.arrivesAt - serverTime) / 1000));
                      return (
                        <div key={fleet.id} className="p-4 border border-red-500/20 bg-red-950/10 rounded-xl flex items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-red-400 uppercase tracking-wider">Raider Sender: {fleet.senderName}</p>
                            <p className="text-slate-400 font-mono">Target Coordinates: <span className="text-white">[{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span></p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Troop Speeds: {Object.entries(fleet.troops).filter(([_, qty]) => (qty as number) > 0).map(([tId, qty]) => `${qty}x ${tId}`).join(', ')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-red-500 font-bold block tracking-widest text-sm animate-pulse">{secondsLeft}s</span>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">Until Strike</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Orange Section: Moving Fleets */}
              <div>
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-amber-950 pb-1.5">
                  <span className="inline-block w-2 h-1.5 rounded bg-amber-500 animate-pulse" />
                  [~] ACTIVE SENDER OPERATIONS TRANSIT
                </h4>

                {movingForces.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-3 py-2 bg-slate-950/20 border border-slate-900 rounded-lg">All active squadrons are currently safely locked in command ship hangar bays.</p>
                ) : (
                  <div className="space-y-3">
                    {movingForces.map((fleet) => {
                      const secondsLeft = Math.max(0, Math.floor((fleet.arrivesAt - serverTime) / 1000));
                      const isReturn = fleet.isReturning;
                      const isWaiting = fleet.isWaitingToSettle;
                      return (
                        <div 
                          key={fleet.id} 
                          onClick={() => {
                            if (isWaiting && onSettle) {
                              onSettle(fleet.id);
                            }
                          }}
                          className={`p-4 border rounded-xl flex items-center justify-between gap-4 text-xs transition duration-150 ${
                            isWaiting 
                              ? 'border-emerald-500/40 bg-emerald-950/25 cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                              : 'border-amber-500/10 bg-amber-950/10'
                          }`}
                        >
                          <div className="space-y-1 font-mono">
                            <p className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${isWaiting ? 'text-emerald-400' : 'text-amber-400'}`}>
                              Mission: {isWaiting ? 'Settle (Arrived)' : (fleet.missionType === 'colonize' ? 'Settle' : fleet.missionType)} 
                              <span className={`text-[9px] px-1.5 py-0.2 border rounded-full font-bold uppercase ${
                                isWaiting ? 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40' :
                                isReturn ? 'border-amber-500/30 text-amber-300 bg-amber-950/40' : 
                                'border-blue-500/30 text-blue-300 bg-blue-950/40'
                              }`}>
                                {isWaiting ? 'Ready to Settle' : isReturn ? 'Returning Home' : 'Outgoing flight'}
                              </span>
                            </p>
                            <p className="text-slate-400">Target Sector: <span className="text-slate-200">{fleet.targetName} Coordinates [{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span></p>
                            {fleet.lootCarried && Object.values(fleet.lootCarried).some(v => (v as number) > 0) && (
                              <p className="text-[10px] text-amber-300 font-semibold bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40 inline-block mt-1 uppercase">
                                Loot Stolen: {Object.entries(fleet.lootCarried).filter(([_, v]) => (v as number) > 0).map(([k, v]) => `${v} ${k}`).join(', ')}
                              </p>
                            )}
                            {isWaiting && (
                              <p className="text-[10px] text-emerald-300 font-extrabold bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded inline-block mt-1 animate-bounce uppercase">
                                ⚡ Click here to settle on planet
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {isWaiting ? (
                              <>
                                <span className="text-emerald-400 font-extrabold block text-sm">SETTLE</span>
                                <span className="text-[9px] text-[#A5B4FC] font-bold block mt-0.5">READY</span>
                              </>
                            ) : (
                              <>
                                <span className="text-amber-500 font-bold block text-sm">{secondsLeft}s</span>
                                <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">In Transit</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Green Base Status Summary */}
              <div>
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-emerald-950 pb-1.5">
                  [*] COMMAND LEVEL STABILITY COUNTER
                </h4>
                <div className="p-3 bg-emerald-950/10 border border-emerald-500/15 rounded-xl text-xs space-y-1.5 leading-relaxed text-slate-300 font-mono">
                  <p>&bull; Global Satellite Defense Grid: <span className="text-emerald-400 font-bold">ONLINE</span>.</p>
                  <p>&bull; Hangar Fleet Bays: <span className="text-emerald-400 font-bold">SEALED SECURE</span>.</p>
                  <p>&bull; Active Command Center Garrison: <span className="text-white">{Object.entries(activePlanet.troops).map(([k, v]) => `${v} ${k}`).join(', ')}</span>.</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1E293B] bg-black/40 text-center">
              <button
                id="close-alerts-modal-btn"
                onClick={() => setIsAlertsOpen(false)}
                className="w-full px-5 py-3 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500/35 rounded-xl transition duration-150 font-mono text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                DISMISS HUD DATA CHANNEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
