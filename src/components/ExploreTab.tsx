import React, { useState } from 'react';
import { ColonyPlanet, PlayerProfile, ResourceType, getUpgradeResourceCost, FleetMission, BuildingState } from '../types';
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
  ShieldAlert,
  Edit2,
  Check
} from 'lucide-react';

const UpgradeCostBar: React.FC<{ type: 'mine' | 'building'; upgradeKey: string; targetLevel: number }> = ({ type, upgradeKey, targetLevel }) => {
  const resourceTypes: ResourceType[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
  const infoMap = {
    water: { icon: Droplet, color: 'text-cyan-400' },
    plasma: { icon: Zap, color: 'text-purple-400' },
    fuel: { icon: Flame, color: 'text-amber-400' },
    food: { icon: Apple, color: 'text-emerald-405' },
    respirant: { icon: Wind, color: 'text-blue-400' }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {resourceTypes.map((rKey) => {
        const cost = getUpgradeResourceCost(type, upgradeKey, targetLevel, rKey);
        const { icon: Icon, color } = infoMap[rKey];
        return (
          <div key={rKey} className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] font-mono font-bold">
            <Icon size={11} className={color === 'text-emerald-405' ? 'text-emerald-400' : color} />
            <span className="text-slate-300">{cost.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
};

const RestoreCostBar: React.FC<{ 
  type: 'mine' | 'building'; 
  upgradeKey: string; 
  targetLevel: number; 
  health: number;
  planetResources: Record<ResourceType, number>;
}> = ({ type, upgradeKey, targetLevel, health, planetResources }) => {
  const resourceTypes: ResourceType[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
  const infoMap = {
    water: { icon: Droplet, color: 'text-cyan-400' },
    plasma: { icon: Zap, color: 'text-purple-400' },
    fuel: { icon: Flame, color: 'text-amber-400' },
    food: { icon: Apple, color: 'text-emerald-400' },
    respirant: { icon: Wind, color: 'text-blue-400' }
  };

  const fractionLost = (100 - health) / 100;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {resourceTypes.map((rKey) => {
        const fullCost = getUpgradeResourceCost(type, upgradeKey, targetLevel, rKey);
        const cost = Math.max(1, Math.round(fullCost * fractionLost));
        const { icon: Icon, color } = infoMap[rKey];
        const isShort = planetResources[rKey] < cost;
        return (
          <div 
            key={rKey} 
            className={`flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border rounded-lg text-[10px] font-mono font-bold ${isShort ? 'border-red-500/40 bg-red-950/10' : 'border-white/5'}`}
            title={isShort ? `Short of resources (Have ${planetResources[rKey].toLocaleString()}, need ${cost.toLocaleString()})` : `Requirements met`}
          >
            <Icon size={11} className={color} />
            <span className={isShort ? 'text-red-400 font-extrabold' : 'text-slate-300'}>{cost.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
};

interface ExploreTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  onUpgradeMine: (resType: ResourceType, mineIndex: number, queue?: boolean) => void;
  onUpgradeBuilding: (buildingKey: string, queue?: boolean) => void;
  serverTime: number;
  fleets: FleetMission[];
  onSettle?: (fleetId: string) => Promise<void>;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshState?: () => void;
  onViewPlayerProfile?: (playerId: string) => void;
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
  armyBase: { name: 'War Room', desc: 'Troop command space force. Recruit interceptors, assault drones, matter extractors, disrupters, missile tanks, and settlement ships.', icon: '🎖️' },
  repository: { name: 'Repository', desc: 'Secure vaults storing your resource mines. Max level 45, holds up to 5,000,000 of each fluid.', icon: '🗄️' },
  radar: { name: 'Radar Array', desc: 'Long-range sector radar scanners. Expands tactical awareness across coordinates.', icon: '🛰️' },
  supplyNexus: { name: 'Supply Nexus', desc: 'A quantum portal linking coordinates to core supplies. Max level 50, dispatches a total of 5,000,000 resources (1,000,000 of each type) directly to base storage when maxed.', icon: '🌌' }
};

export const ExploreTab: React.FC<ExploreTabProps> = ({ 
  player, 
  activePlanet, 
  onUpgradeMine, 
  onUpgradeBuilding,
  serverTime,
  fleets,
  onSettle,
  showToast,
  onRefreshState,
  onViewPlayerProfile
}) => {
  const [expandedCategory, setExpandedCategory] = useState<ResourceType | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [restoringKeys, setRestoringKeys] = useState<Record<string, boolean>>({});
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);

  // Check if any upgrade is active right now on this planet
  const isAnyUpgradeInProgress = 
    Object.values(activePlanet.buildings).some((b: any) => b.isUpgrading) ||
    Object.keys(activePlanet.mines).some(mKey => activePlanet.mines[mKey as ResourceType].some(m => m.isUpgrading));

  // Sections collapse states
  const [showRadar, setShowRadar] = useState(false);
  const [showExtractorsSec, setShowExtractorsSec] = useState(false);
  const [showStructures, setShowStructures] = useState(false);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  // Production Boost Modal State
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostTargetType, setBoostTargetType] = useState<string>("all");
  const [boostMineIndex, setBoostMineIndex] = useState<number>(-1);
  const [boostDuration, setBoostDuration] = useState<1 | 7 | 30>(1);
  const [isBoosting, setIsBoosting] = useState(false);

  const handleOpenBoostModal = (resType: string, mineIdx: number) => {
    setBoostTargetType(resType);
    setBoostMineIndex(mineIdx);
    setBoostDuration(1);
    setShowBoostModal(true);
  };

  const handleBoostExtractor = async () => {
    setIsBoosting(true);
    try {
      const res = await fetch('/api/extractor/boost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          resourceType: boostTargetType,
          mineIndex: boostMineIndex,
          durationDays: boostDuration
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast?.('Extractor Production Boost activated successfully!', 'success');
        setShowBoostModal(false);
        if (onRefreshState) onRefreshState();
      } else {
        showToast?.(data.error || 'Failed to activate boost.', 'error');
      }
    } catch (err) {
      showToast?.('Verify network connection with terminal gateway.', 'error');
    } finally {
      setIsBoosting(false);
    }
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(activePlanet.name);

  // Sync newNameInput when activePlanet changes
  React.useEffect(() => {
    setNewNameInput(activePlanet.name);
    setIsEditingName(false);
  }, [activePlanet.id, activePlanet.name]);

  const handleRenameActiveStation = async () => {
    if (!newNameInput.trim()) {
      showToast?.('Station name cannot be empty!', 'error');
      return;
    }
    if (newNameInput.trim().length > 30) {
      showToast?.('Station name must be 30 characters or less', 'error');
      return;
    }
    try {
      const res = await fetch('/api/planet/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: activePlanet.id, newName: newNameInput })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(`Station renamed to: ${newNameInput}`, 'success');
        setIsEditingName(false);
        onRefreshState?.();
      } else {
        showToast?.(data.error || 'Failed to rename station', 'error');
      }
    } catch (err) {
      showToast?.('Network error during renaming', 'error');
    }
  };

  const handleRestoreMine = async (resType: ResourceType, index: number) => {
    const key = `mine-${resType}-${index}`;
    if (restoringKeys[key]) return;
    setRestoringKeys(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/restore/mine", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": player.id
        },
        body: JSON.stringify({ planetId: activePlanet.id, resType, mineIndex: index })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || "Failed to restore mine", "error");
      } else {
        showToast?.("Extractor pump successfully restored to 100% health!", "success");
        onRefreshState?.();
      }
    } catch (err) {
      showToast?.("Failed to restore mine", "error");
    } finally {
      setRestoringKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRestoreBuilding = async (buildingKey: string) => {
    const key = `building-${buildingKey}`;
    if (restoringKeys[key]) return;
    setRestoringKeys(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/restore/building", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": player.id
        },
        body: JSON.stringify({ planetId: activePlanet.id, buildingKey })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || "Failed to restore building", "error");
      } else {
        showToast?.("Building successfully restored to 100% health!", "success");
        onRefreshState?.();
      }
    } catch (err) {
      showToast?.("Failed to restore building", "error");
    } finally {
      setRestoringKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const repositoryLimit = Math.round(10000 * Math.pow(500, (activePlanet.buildings.repository.level - 1) / 44));

  const activePlanetIndex = player.planets.findIndex(p => p.id === activePlanet.id);
  const maxExtractorLevel = activePlanetIndex === 0 ? 25 : activePlanetIndex === 1 ? 20 : 15;

  // Helper to format remaining duration strings
  const getTimerString = (endTimestamp: number | null) => {
    if (!endTimestamp) return '';
    const diff = Math.max(0, endTimestamp - serverTime);
    const secs = Math.floor(diff / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const hText = h === 1 ? 'hour' : 'hours';
    const mText = m === 1 ? 'minute' : 'minutes';
    const sText = s === 1 ? 'second' : 'seconds';
    return `${h} ${hText}, ${m} ${mText}, ${s} ${sText}`;
  };

  // Check if any resources are low
  const getResourceProduction = (resKey: 'water' | 'respirant' | 'food') => {
    const repositoryLimit = Math.round(10000 * Math.pow(500, (activePlanet.buildings.repository.level - 1) / 44));
    const isOtherMaxed = 
      activePlanet.resources.plasma >= repositoryLimit &&
      activePlanet.resources.fuel >= repositoryLimit &&
      activePlanet.resources.food >= repositoryLimit &&
      activePlanet.resources.respirant >= repositoryLimit;
      
    const mines = activePlanet.mines[resKey] || [];
    if (isOtherMaxed) {
      return resKey === 'water' ? 84000 : 42000;
    }
    return mines.reduce((sum, m) => {
      const isMineBoosted = m.boostedUntil && Number(m.boostedUntil) > serverTime;
      const baseOutput = Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
      const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;
      return sum + output;
    }, 0);
  };

  const waterHourlyTotal = getResourceProduction('water');
  const respirantHourlyTotal = getResourceProduction('respirant');
  const foodHourlyTotal = getResourceProduction('food');

  // Let's calculate total troop water consumption per hour
  const getWaterConsumption = () => {
    let tot = 0;
    const specCosts = { defender: 0.05, attacker: 0.1, tank: 0.2, looter: 0.15, drone: 0.02, settlementShip: 0.25 };
    Object.entries(activePlanet.troops).forEach(([tId, count]) => {
      tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
    });
    return tot;
  };

  const waterConsumption = getWaterConsumption();
  const respirantConsumption = waterConsumption * 0.4;
  const foodConsumption = waterConsumption * 0.15;

  const isWaterProductionNegative = waterHourlyTotal < waterConsumption;
  const isRespirantProductionNegative = respirantHourlyTotal < respirantConsumption;
  const isFoodProductionNegative = foodHourlyTotal < foodConsumption;

  const isAnyProductionNegative = isWaterProductionNegative || isRespirantProductionNegative || isFoodProductionNegative;
  const isDehydrated = activePlanet.resources.water < 0 || activePlanet.resources.respirant < 0 || activePlanet.resources.food < 0 || isAnyProductionNegative;

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
    alertsValue = `${movingForces.length} TROOPS ACTIVE`;
    pulseDot = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
  }

  return (
    <div className="space-y-8 pb-24">
      {/* TACTICAL METRIC FLIGHT RADAR - INCOMING AND OUTGOING FLEET OBSERVATIONS */}
      {(() => {
        const outgoingFleets = fleets.filter((f) => f.senderId === player.id);
        const incomingFleets = fleets.filter(
          (f) => f.targetId === player.id && f.senderId !== player.id
        );

        if (outgoingFleets.length === 0 && incomingFleets.length === 0) {
          return null;
        }

        return (
          <div className="border border-[#1E293B] bg-[#0A0F1D]/80 backdrop-blur-md rounded-xl overflow-hidden">
            {/* Accordion Trigger Header */}
            <button
              onClick={() => setShowRadar(!showRadar)}
              className="w-full p-5 flex items-center justify-between text-left transition hover:bg-white/[0.02]"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
                  Tactical Radar
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[10px] bg-[#05070A] text-slate-400 border border-[#1E293B] px-2.5 py-1 rounded-lg font-bold">
                  ACTIVE FLIGHTS: {outgoingFleets.length + incomingFleets.length}
                </span>
                {showRadar ? (
                  <ChevronUp size={16} className="text-red-500" />
                ) : (
                  <ChevronDown size={16} className="text-emerald-500" />
                )}
              </div>
            </button>

            {showRadar && (
              <div className="p-5 border-t border-[#1E293B] bg-black/20 space-y-5">
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
                                <span className={`font-black uppercase tracking-wide px-2 py-0.5 rounded text-[10px] ${fleet.missionType === 'attack' ? 'text-white bg-red-800' : 'text-slate-300 bg-white/5'}`}>
                                  INCOMING {fleet.missionType.toUpperCase()}
                                </span>
                                <span className="text-slate-400 font-bold block mt-2 text-[11px]">
                                  SENDER: {fleet.senderName}
                                </span>
                                <span className="text-slate-400 block mt-1">
                                  T-Route: [{fleet.senderCoords.x}, {fleet.senderCoords.y}] &rarr; [{fleet.targetCoords.x}, {fleet.targetCoords.y}]
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-red-400 font-black text-xs block">{getTimerString(fleet.arrivesAt)} remaining</span>
                                <span className="text-slate-500 text-[9px] block">
                                  ({Math.floor(secsRemaining / 3600)}h {Math.floor((secsRemaining % 3600) / 60)}m {secsRemaining % 60}s remaining)
                                </span>
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

                {/* OUTGOING TROOPS */}
                {outgoingFleets.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase font-mono">
                      Your Dispatched Troops ({outgoingFleets.length})
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
                                  }}`}>
                                    {fleet.isWaitingToSettle ? 'SETTLEMENT ATTAINED' : `${fleet.missionType.toUpperCase()} DEPLOYMENT`}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/5 border border-white/5 text-slate-350 uppercase">
                                    {fleet.isReturning ? 'Returning' : 'Outbound'}
                                  </span>
                                </div>
                                <span className="text-slate-400 block mt-2 text-[11px]">
                                  Target Coord: {fleet.targetName} [{fleet.targetCoords.x}, {fleet.targetCoords.y}]
                                </span>
                              </div>
                              <div className="text-right">
                                {fleet.isWaitingToSettle ? (
                                  <span className="text-emerald-400 font-extrabold text-xs block animate-bounce">SECURED &bull; READY</span>
                                ) : (
                                  <>
                                    <span className="text-cyan-400 font-bold text-xs block">{getTimerString(fleet.arrivesAt)} remaining</span>
                                    <span className="text-slate-500 text-[9px] block">
                                      ({Math.floor(secsRemaining / 3600)}h {Math.floor((secsRemaining % 3600) / 60)}m {secsRemaining % 60}s remaining)
                                    </span>
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

      {/* Action Centerpiece Header with Holographic Glow */}
      <div className="relative p-6 bg-gradient-to-b from-[#0F172A] to-black border border-white/5 rounded-xl overflow-hidden flex flex-col">
        {/* Holographic Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase font-mono">SECTOR COMMAND SITE</span>
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1 max-w-md">
                <input
                  type="text"
                  maxLength={30}
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="flex-1 px-3 py-1 bg-slate-950 border border-cyan-500/50 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none text-sm text-white font-mono rounded-lg transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameActiveStation();
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setNewNameInput(activePlanet.name);
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRenameActiveStation}
                  className="p-1.5 text-emerald-405 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                  title="Save Name"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setNewNameInput(activePlanet.name);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition cursor-pointer font-sans"
                  title="Cancel"
                >
                  <span className="text-sm font-semibold select-none">✕</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 group">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{activePlanet.name}</h2>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/80 border border-cyan-500/20 hover:border-cyan-500/50 font-bold uppercase rounded-lg transition opacity-60 group-hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  title="Rename Station Base"
                >
                  <Edit2 size={10} /> Rename
                </button>
              </div>
            )}
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className={`inline-block w-2 h-2 rounded-full ${pulseDot} animate-pulse`} />
              Commander: {player.username} &bull; {activePlanet.name} &bull; Sector Coord: [{activePlanet.sectorX}, {activePlanet.sectorY}]
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
          <div className="relative z-10 mt-4 p-3 border border-red-900/50 bg-red-950/30 text-red-400 rounded-xl flex items-start gap-2.5 text-xs animate-pulse" title="Critical Alert: High severity base warning">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce text-red-500" title="Shield warning indicator: Critical dehydration is occurring" />
            <div>
              <p className="font-bold uppercase tracking-widest text-[10px]">CRITICAL NEGATIVE PRODUCTION (ATTRITION PASSIVE)</p>
              <p className="text-red-300/80 leading-relaxed mt-0.5">Troops are suffering rapid attrition due to negative production! Upgrade resource extractors immediately built with deeper wells or dismiss excess troops.</p>
            </div>
          </div>
        )}

        {/* Interactive Construction Queue Dashboard */}
        {(() => {
          const queueList = activePlanet.upgradeQueue || [];
          const activeUpgrades: { type: 'mine' | 'building'; key: string; mineIndex?: number; upgradeEnd: number }[] = [];
          
          for (const rKey of Object.keys(activePlanet.mines)) {
            activePlanet.mines[rKey as ResourceType].forEach((m, idx) => {
              if (m.isUpgrading && m.upgradeEnd) {
                activeUpgrades.push({ type: 'mine', key: rKey, mineIndex: idx, upgradeEnd: m.upgradeEnd });
              }
            });
          }
          
          for (const bKey of Object.keys(activePlanet.buildings)) {
            const b = activePlanet.buildings[bKey as keyof typeof activePlanet.buildings] as BuildingState;
            if (b && b.isUpgrading && b.upgradeEnd) {
              activeUpgrades.push({ type: 'building', key: bKey, upgradeEnd: b.upgradeEnd });
            }
          }

          const totalActiveAndQueued = activeUpgrades.length + queueList.length;
          if (totalActiveAndQueued === 0) return null;

          return (
            <div className="relative z-10 mt-4 p-4 border border-cyan-500/25 bg-cyan-950/10 rounded-2xl font-mono text-xs text-slate-350 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-405 uppercase tracking-widest font-extrabold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    Station Construction Queue ({queueList.length}/25 queued)
                  </span>
                  {activeUpgrades.length > 0 && (
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded font-bold uppercase">
                      {activeUpgrades.length} Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 uppercase hidden sm:inline">Sequential Processing</span>
                  <button
                    onClick={() => setIsQueueMinimized(!isQueueMinimized)}
                    className="p-1 px-2.5 text-[9px] font-extrabold font-mono uppercase bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/25 hover:border-cyan-450 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 select-none"
                    title={isQueueMinimized ? "Maximize Queue" : "Minimize Queue"}
                    type="button"
                  >
                    {isQueueMinimized ? (
                      <>
                        <ChevronDown size={10} />
                        <span>Expand ({totalActiveAndQueued})</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp size={10} />
                        <span>Minimize</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {!isQueueMinimized && (
                <div className="space-y-2 mt-3">
                  {activeUpgrades.map((act, index) => {
                    const bName = act.type === 'mine' 
                      ? `${act.key.toUpperCase()} Extractor #${act.mineIndex! + 1}`
                      : act.key.toUpperCase();
                    return (
                      <div key={`act-${index}`} className="flex items-center justify-between bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/15 p-2 px-3 rounded-xl transition">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold select-none">[ACTIVE]</span>
                          <span className="text-white font-extrabold">
                            {act.type === 'mine' ? '⛏️' : '🏗️'} {bName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                          <Clock size={11} className="animate-spin" />
                          <span>{getTimerString(act.upgradeEnd)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {queueList.map((q, index) => {
                    const bName = q.type === 'mine'
                      ? `${q.key.toUpperCase()} Extractor #${q.mineIndex! + 1}`
                      : q.key.toUpperCase();
                    return (
                      <div key={`queued-${index}`} className="flex items-center justify-between bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 p-2 px-3 rounded-xl transition">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold select-none">#{index + 1} QUEUED (SG)</span>
                          <span className="text-slate-300 font-semibold">
                            {q.type === 'mine' ? '⛏️' : '🏗️'} {bName} &rarr; <span className="text-cyan-400 font-extrabold">Lv. {q.targetLevel}</span>
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded uppercase">Pending</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* resource mines category list */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#1E293B]/60 pb-3" id="extractors_header">
          <button
            onClick={() => setShowExtractorsSec(!showExtractorsSec)}
            className="flex-1 flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer"
            type="button"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
                Resource Extractors (Max Level: {maxExtractorLevel})
                {showExtractorsSec ? (
                  <ChevronUp size={14} className="text-red-500" />
                ) : (
                  <ChevronDown size={14} className="text-emerald-500" />
                )}
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Maximum extractors level: {maxExtractorLevel} for this station (Level 25 for Main ★, Level 20 for Secondary ★★, Level 15 for Colonies).</p>
            </div>
          </button>
          <button
            onClick={() => handleOpenBoostModal("all", -1)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] border border-amber-500/35 rounded-xl transition duration-150 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            type="button"
          >
            <Zap size={10} className="animate-pulse text-amber-400" /> Production Boost
          </button>
        </div>

        {showExtractorsSec && (
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
            
            const totalProd = isOtherMaxed
              ? (resKey === 'water' ? 84000 : 42000)
              : mines.reduce((sum, m) => {
                  const isMineBoosted = m.boostedUntil && Number(m.boostedUntil) > serverTime;
                  const baseOutput = Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
                  const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;
                  return sum + output;
                }, 0);
            
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
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption * 0.4).toLocaleString()}/hr troops)</span>
                        )}
                        {resKey === 'food' && waterConsumption > 0 && (
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption * 0.15).toLocaleString()}/hr troops)</span>
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
                    
                    {/* Category-Level Boost Option */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/15">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block flex items-center gap-1.5">
                          <Zap size={12} className="text-amber-400" /> {info.name} Extractor Array Boost
                        </span>
                        <p className="text-[10.5px] text-slate-400 leading-normal max-w-xl">
                          Authorize tactical production acceleration to boost ALL {mines.length} {info.name.toLowerCase()} pumps on <span className="text-slate-200 font-semibold">{activePlanet.name}</span> by <span className="text-amber-400 font-semibold">+14% hourly output</span>.
                        </p>
                      </div>
                      {(() => {
                        const isCategoryBoosted = mines.some(m => m.boostedUntil && Number(m.boostedUntil) > serverTime);
                        if (isCategoryBoosted) {
                          const maxBoostedTime = Math.max(...mines.map(m => m.boostedUntil ? Number(m.boostedUntil) : 0));
                          return (
                            <span className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse select-none shrink-0 self-start sm:self-auto uppercase tracking-wider">
                              <Zap size={11} className="text-amber-400 animate-bounce" /> ACTIVE: {getTimerString(maxBoostedTime)}
                            </span>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => handleOpenBoostModal(resKey, -1)}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-[10.5px] uppercase tracking-wider transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0 self-start sm:self-auto"
                              type="button"
                            >
                              ⚡ BOOST EXTRACTOR (🪙 45)
                            </button>
                          );
                        }
                      })()}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{info.desc}</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {mines.map((mine) => {
                        const targetLevel = mine.level + 1;
                        const cost = targetLevel * 100;
                        const isDamaged = mine.health !== undefined && mine.health < 100;
                        const isMineBoosted = mine.boostedUntil && Number(mine.boostedUntil) > serverTime;
                        const baseOutput = Math.round((mine.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
                        const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;

                        return (
                          <div 
                            key={mine.index}
                            className="p-4 rounded-xl border border-[#1E293B] bg-[#05070A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-150 hover:border-white/10"
                            id={`mine_${resKey}_${mine.index}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-bold text-sm text-slate-200">Extractor Pump #{mine.index + 1}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-[#1E293B]">
                                  Lv. {mine.level}
                                </span>
                                {isDamaged && (
                                  <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-[10px] font-mono font-bold animate-pulse">
                                    ⚠️ DAMAGED: {mine.health}% Health
                                  </span>
                                )}
                                {isMineBoosted && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse" title="Production boost active!">
                                    <Zap size={10} className="text-amber-400 animate-bounce" /> BOOST ACCELERATED
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                                <span>Hourly Output: <span className={isMineBoosted ? "text-amber-400 font-bold" : "text-slate-350"}>{output.toLocaleString()}/hr {isMineBoosted && "⚡ (1.14x)"}</span></span>
                                {mine.level < maxExtractorLevel && (
                                  <span className="text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-900/20 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1.5 select-none" title="Every mine upgrade increases your account population score by 10 points">
                                    🌾 Pop: +10
                                  </span>
                                )}
                              </div>
                              {mine.level < maxExtractorLevel && (
                                isDamaged ? (
                                  <RestoreCostBar type="mine" upgradeKey={resKey} targetLevel={targetLevel} health={mine.health!} planetResources={activePlanet.resources} />
                                ) : (
                                  <UpgradeCostBar type="mine" upgradeKey={resKey} targetLevel={targetLevel} />
                                )
                              )}
                            </div>

                            {/* Upgrade/Repair panel */}
                            <div className="font-mono text-xs self-end sm:self-auto">
                              {mine.isUpgrading ? (
                                <div className="flex flex-col sm:items-end gap-1.5">
                                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono" title="Undergoing deep flux compression. Countdown until completion.">
                                    <Clock size={12} className="animate-spin" title="Spinning dynamic timer indicator" />
                                    <span>Compressing Flux {getTimerString(mine.upgradeEnd)}</span>
                                  </div>
                                </div>
                              ) : mine.level >= maxExtractorLevel && !isDamaged ? (
                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase bg-slate-900 border border-slate-850 px-2 py-1 rounded">MAX CAP</span>
                              ) : isDamaged ? (
                                <button 
                                  onClick={() => handleRestoreMine(resKey, mine.index)}
                                  disabled={restoringKeys[`mine-${resKey}-${mine.index}`]}
                                  className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-[10px] uppercase font-bold border border-red-500/35 rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
                                >
                                  {restoringKeys[`mine-${resKey}-${mine.index}`] ? 'Repairing...' : '🛠️ Restore Extractor'}
                                </button>
                              ) : isAnyUpgradeInProgress ? (
                                <button 
                                  onClick={() => onUpgradeMine(resKey, mine.index, true)}
                                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/35 rounded-xl transition duration-150 cursor-pointer font-mono text-[10px] font-bold uppercase flex items-center gap-1.5"
                                >
                                  <span className="text-emerald-400">Queue Upgrade</span>
                                  <span className="text-amber-400 font-extrabold">(15 SG)</span>
                                </button>
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
        )}
      </div>

      {/* base buildings infrastructure */}
      <div>
        <button
          onClick={() => setShowStructures(!showStructures)}
          className="w-full flex items-center justify-between gap-3 mb-4 border-b border-[#1E293B]/60 pb-3 text-left hover:text-white transition duration-150 cursor-pointer"
          type="button"
        >
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5bc0be] font-mono flex items-center gap-2">
            Structures Commands
            {showStructures ? (
              <ChevronUp size={12} className="text-red-500 inline" />
            ) : (
              <ChevronDown size={12} className="text-emerald-500 inline" />
            )}
          </h3>
          <span className="text-[10.5px] text-slate-500 font-mono font-bold">({Object.keys(activePlanet.buildings).length} Facilities)</span>
        </button>
        {showStructures && (
          <div className="space-y-4">
            {Object.entries(activePlanet.buildings).map(([bKey, val]) => {
              const bState = val as any;
              const info = BUILDING_INFO[bKey];
              if (!info) return null;

              const targetLvl = bState.level + 1;
              const cost = targetLvl * 150;
              const upgradeTimeMins = targetLvl * 2;
              const isExpanded = expandedBuilding === bKey;

              return (
                <div 
                  key={bKey}
                  className="border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md overflow-hidden transition-all duration-200"
                  id={`building_${bKey}`}
                >
                  {/* Building Trigger Header Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedBuilding(isExpanded ? null : bKey)}
                    className="w-full p-4 flex items-center justify-between text-left transition hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-xl bg-[#05070A] border border-[#1E293B] text-2xl font-sans text-center shrink-0 shadow-lg select-none">
                        {info.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white text-base font-mono">{info.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-pink-400 border border-[#1E293B]">
                            Lv. {bState.level} / {bState.maxLevel}
                          </span>
                          {bState.health !== undefined && bState.health < 100 && (
                            <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-[10px] font-mono font-bold animate-pulse">
                              ⚠️ DAMAGED: {bState.health}% Health
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{info.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      {bState.isUpgrading && (
                        <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold animate-pulse">Upgrading {getTimerString(bState.upgradeEnd)}</span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-red-500 cursor-pointer" />
                      ) : (
                        <ChevronDown size={18} className="text-emerald-500 cursor-pointer" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Building Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-[#1E293B]/60 p-4 bg-slate-950/20 space-y-4 animate-fade-in">
                      {bState.level < bState.maxLevel && (
                        <div className="pt-0.5 select-none text-left">
                          <span className="text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-900/20 px-1.5 py-0.5 rounded text-[10px] font-mono inline-flex items-center gap-1.5" title="Every building upgrade increases your account population score by 30 points">
                            🌾 Pop: +30
                          </span>
                        </div>
                      )}
                      
                      {bKey === 'repository' && (
                        <div className="text-xs text-cyan-400 font-mono font-bold text-left">
                          Current Store Capacity Limit: <span className="text-white bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded font-bold">{(Math.round(10000 * Math.pow(500, (bState.level - 1) / 44))).toLocaleString()}</span> units per resource
                        </div>
                      )}

                      {bKey === 'supplyNexus' && (
                        <div className="space-y-3 text-xs text-left">
                          <div className="text-sky-400 font-mono font-bold flex items-center gap-1">
                            Current Shipment: <span className="text-white bg-sky-950/40 border border-sky-800/30 px-1.5 py-0.5 rounded font-bold">+{(bState.level * 20000).toLocaleString()}</span> units of <span className="text-emerald-400">each resource type</span> {(bState.level === bState.maxLevel) && <span className="text-amber-400 animate-pulse">(MAX DELIVER)</span>}
                          </div>
                          <div className="font-sans text-[11px] text-slate-400 bg-slate-950/60 p-2.5 border border-[#1E293B]/60 rounded-lg max-w-md">
                            🌌 <span className="font-bold text-slate-200">Quantum Dispatch System:</span> Summon planetary logistics cargo ships directly to this sector. At maximum level 50, a full shipment dispatches a total of <span className="font-bold text-amber-400">5,000,000 resources</span> (1,000,000 each of Water, Plasma, Fuel, Food, and Respirants)!
                          </div>
                          {bState.level > 0 && (
                            <div className="pt-1 flex items-center gap-3 flex-wrap">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/planet/claim-supply-nexus', {
                                      method: 'POST',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'x-user-id': player.id
                                      },
                                      body: JSON.stringify({ planetId: activePlanet.id })
                                    });
                                    const data = await response.json();
                                    if (!response.ok) {
                                      if (showToast) showToast(data.error || 'Failed to claim shipment', 'error');
                                    } else {
                                      if (showToast) {
                                        showToast(`Quantum shipment received! +${data.qtyPerResource.toLocaleString()} of all 5 resource types loaded (+${data.totalVolume.toLocaleString()} total resources)!`, 'success');
                                      }
                                      if (onRefreshState) onRefreshState();
                                    }
                                  } catch (err) {
                                    if (showToast) showToast('Network or quantum instability occurred.', 'error');
                                  }
                                }}
                                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                              >
                                🚀 REQUEST QUANTUM SHIPMENT
                              </button>
                              
                              {activePlanet.lastSupplyNexusClaim && (Date.now() - activePlanet.lastSupplyNexusClaim < 120000) ? (
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1 font-mono font-bold animate-pulse">
                                  Portal recharging...
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-1 font-mono font-bold">
                                  Stable & Charged
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {bState.level < bState.maxLevel && (
                        bState.health !== undefined && bState.health < 100 ? (
                          <RestoreCostBar type="building" upgradeKey={bKey} targetLevel={targetLvl} health={bState.health} planetResources={activePlanet.resources} />
                        ) : (
                          <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={targetLvl} />
                        )
                      )}

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Actions & Progress Control:</span>
                        {bState.isUpgrading ? (
                          <div className="flex flex-col items-end gap-1.5 font-mono">
                            <div className="flex items-center gap-1.5 text-xs text-amber-400" title="Building upgrade in progress. Countdown until build completion.">
                              <Clock size={12} className="animate-spin" title="Spinning build progress timer" />
                              <span>Upgrading {getTimerString(bState.upgradeEnd)}</span>
                            </div>
                          </div>
                        ) : bState.level >= bState.maxLevel && !(bState.health !== undefined && bState.health < 100) ? (
                          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono bg-slate-900 border border-slate-850 px-2 py-1 rounded">MAX CAP</span>
                        ) : bState.health !== undefined && bState.health < 100 ? (
                          <button 
                            onClick={() => handleRestoreBuilding(bKey)}
                            disabled={restoringKeys[`building-${bKey}`]}
                            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] border border-red-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span>{restoringKeys[`building-${bKey}`] ? 'Repairing...' : '🛠️ Restore Building'}</span>
                          </button>
                        ) : isAnyUpgradeInProgress ? (
                          <button 
                            onClick={() => onUpgradeBuilding(bKey, true)}
                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                            type="button"
                          >
                            <span className="text-emerald-400">Queue Upgrade</span>
                            <span className="text-amber-400 font-extrabold">(15 SG)</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => onUpgradeBuilding(bKey)}
                            className="px-4 py-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:shadow-[0_0_12px_rgba(236,72,153,0.25)] border border-pink-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span>Upgrade</span>
                            <span className="text-slate-500">({upgradeTimeMins}m)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                  <p className="text-[9px] text-slate-400 uppercase mt-0.5 font-bold">Space Station Command &bull; Coordinate Transit Scanner</p>
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
                  [!] HOSTILE INVASION TROOPS DETECTED
                </h4>

                {incomingAttacks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-3 py-2 bg-slate-950/20 border border-slate-900 rounded-lg">No incoming hostile troops detected. Sector perimeter secure.</p>
                ) : (
                  <div className="space-y-3">
                    {incomingAttacks.map((fleet) => {
                      const secondsLeft = Math.max(0, Math.floor((fleet.arrivesAt - serverTime) / 1000));
                      return (
                        <div key={fleet.id} className="p-4 border border-red-500/20 bg-red-950/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs w-full overflow-hidden break-words">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-bold text-red-400 uppercase tracking-wider">
                              Raider Sender:{" "}
                              <button
                                type="button"
                                onClick={() => onViewPlayerProfile && onViewPlayerProfile(fleet.senderId)}
                                className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer focus:outline-none"
                              >
                                {fleet.senderName}
                              </button>
                            </p>
                            <p className="text-slate-400 font-mono">Target Coordinates: <span className="text-white">[{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span></p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Troop Speeds: {Object.entries(fleet.troops).filter(([_, qty]) => (qty as number) > 0).map(([tId, qty]) => `${qty}x ${tId}`).join(', ')}
                            </p>
                          </div>
                          <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0 border-t border-red-950/40 sm:border-0 pt-2 sm:pt-0">
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
                  <p className="text-xs text-slate-500 italic px-3 py-2 bg-slate-950/20 border border-slate-900 rounded-lg">All active troops are currently safely locked in command ship hangar bays.</p>
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
                          className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition duration-150 w-full overflow-hidden break-words ${
                            isWaiting 
                              ? 'border-emerald-500/40 bg-emerald-950/25 cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                              : 'border-amber-500/10 bg-amber-950/10'
                          }`}
                        >
                          <div className="space-y-1 font-mono min-w-0 flex-1">
                            <p className="font-bold uppercase tracking-wider flex items-center flex-wrap gap-1.5 text-slate-150">
                              <span className={isWaiting ? 'text-emerald-400' : 'text-amber-400'}>
                                Mission: {isWaiting ? 'Settle (Arrived)' : (fleet.missionType === 'colonize' ? 'Settle' : fleet.missionType)} 
                              </span>
                              <span className={`text-[9.5px] px-1.5 py-0.2 border rounded-full font-bold uppercase shrink-0 ${
                                isWaiting ? 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40' :
                                isReturn ? 'border-amber-500/30 text-amber-300 bg-amber-950/40' : 
                                'border-blue-500/30 text-blue-300 bg-blue-950/40'
                              }`}>
                                {isWaiting ? 'Ready' : isReturn ? 'Returning' : 'Inbound'}
                              </span>
                            </p>
                            <p className="text-slate-400 leading-normal break-all">Target Sector: <span className="text-slate-200">{fleet.targetName} Coordinates [{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span></p>
                            {fleet.lootCarried && Object.values(fleet.lootCarried).some(v => (v as number) > 0) && (
                              <p className="text-[10px] text-amber-300 font-semibold bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40 inline-block mt-1 uppercase break-all">
                                Loot Stolen: {Object.entries(fleet.lootCarried).filter(([_, v]) => (v as number) > 0).map(([k, v]) => `${v} ${k}`).join(', ')}
                              </p>
                            )}
                            {isWaiting && (
                              <p className="text-[10px] text-emerald-300 font-extrabold bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded inline-block mt-1 animate-pulse uppercase">
                                ⚡ Click here to settle on planet
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0 border-t border-[#1E293B]/40 sm:border-0 pt-2 sm:pt-0">
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
                  <p>&bull; Active War Room Garrison: <span className="text-white">{Object.entries(activePlanet.troops).map(([k, v]) => `${v} ${k}`).join(', ')}</span>.</p>
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

      {/* 4. Production Boost Modal Backdrop & Panel */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="boost-modal-backdrop">
          <div className="bg-[#0A0F1D] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col" id="boost-modal">
            
            {/* Header */}
            <div className="p-4 border-b border-[#1E293B] bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-400 animate-pulse" size={14} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">Extractor Production Boost</h3>
              </div>
              <button 
                onClick={() => setShowBoostModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-mono"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl rounded-t-none text-xs leading-relaxed space-y-1">
                <p className="text-amber-400 font-bold font-mono text-[10.5px] uppercase tracking-wide">✦ Tactical Advantage Authorized</p>
                <p className="text-slate-300">
                  Boosting increases the hourly output of the target extractors by <span className="text-amber-400 font-bold uppercase">+14% (1.14x Total Output)</span> for the selected duration period.
                </p>
              </div>

              {/* Target Details */}
              <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Target Object</span>
                <span className="text-slate-200 font-mono font-bold block">
                  {boostTargetType === "all" ? (
                    <span className="text-amber-400 font-bold">ALL Extractors on {activePlanet.name}</span>
                  ) : (
                    <span>
                      {boostTargetType.toUpperCase()} Extractor Pump #{boostMineIndex + 1}
                    </span>
                  )}
                </span>
              </div>

              {/* Duration selection */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Select Boost Duration</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 1, label: "1 Day" },
                    { days: 7, label: "7 Days (1 Week)" },
                    { days: 30, label: "30 Days (1 Month)" }
                  ].map((opt) => {
                    const daysVal = opt.days as 1 | 7 | 30;
                    const isSel = boostDuration === daysVal;
                    // calculate cost
                    const optionCost = (boostTargetType === "all")
                      ? (daysVal === 1 ? 160 : daysVal === 7 ? 1049 : 3999)
                      : (daysVal === 1 ? 45 : daysVal === 7 ? 265 : 999);

                    return (
                      <button
                        key={daysVal}
                        type="button"
                        onClick={() => setBoostDuration(daysVal)}
                        className={`py-3 px-1 border text-center rounded-xl transition cursor-pointer flex flex-col justify-center items-center gap-1.5 ${
                          isSel
                            ? "border-amber-500 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(242,158,11,0.15)]"
                            : "border-[#1E293B] bg-slate-950/40 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className="text-[10px] font-mono font-bold flex items-center gap-0.5 text-amber-400 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/40">
                          🪙 {optionCost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Balance */}
              <div className="flex items-center justify-between border-t border-[#1E293B] pt-4 text-xs font-mono">
                <span className="text-slate-400">Your Space Gold:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  🪙 {player.credits?.toLocaleString() || 0} Space Gold
                </span>
              </div>

              {/* Required & Net balance */}
              {(() => {
                const reqCost = (boostTargetType === "all")
                  ? (boostDuration === 1 ? 160 : boostDuration === 7 ? 1049 : 3999)
                  : (boostDuration === 1 ? 45 : boostDuration === 7 ? 265 : 999);
                const hasEnough = (player.credits || 0) >= reqCost;

                return (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Required Gold:</span>
                      <span className={`font-bold ${hasEnough ? "text-emerald-400" : "text-red-400"}`}>
                        🪙 {reqCost} Gold
                      </span>
                    </div>

                    {!hasEnough && (
                      <p className="text-[10.5px] text-red-400 bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-center font-mono">
                        ⚠️ Insufficient Space Gold. Please purchase more or wait for free solar credit distributions.
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowBoostModal(false)}
                        className="flex-1 py-2.5 bg-slate-950 border border-[#1E293B] hover:border-slate-800 hover:bg-slate-900 text-slate-400 font-bold rounded-xl transition cursor-pointer text-xs font-mono uppercase tracking-wide"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBoostExtractor}
                        disabled={!hasEnough || isBoosting}
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 disabled:text-slate-500 cursor-pointer disabled:cursor-not-allowed font-extrabold rounded-xl transition hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] text-xs font-mono uppercase tracking-wide"
                      >
                        {isBoosting ? "Deploying..." : "Deploy Boost ⚡"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
