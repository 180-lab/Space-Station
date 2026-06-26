import React, { useState } from 'react';
import { ColonyPlanet, PlayerProfile, ResourceType, getUpgradeResourceCost, FleetMission, BuildingState, ChatMessage } from '../types';
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
  Check,
  MessageSquare,
  Send,
  Radio
} from 'lucide-react';

const UpgradeCostBar: React.FC<{ 
  type: 'mine' | 'building'; 
  upgradeKey: string; 
  targetLevel: number; 
  planetResources: Record<ResourceType, number>;
}> = ({ type, upgradeKey, targetLevel, planetResources }) => {
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
        const isShort = planetResources[rKey] < cost;
        return (
          <div 
            key={rKey} 
            className={`flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border rounded-lg text-[10px] font-mono font-bold ${isShort ? 'border-red-500/40 bg-red-950/10' : 'border-white/5'}`}
            title={isShort ? `Short of resources (Have ${Math.round(planetResources[rKey]).toLocaleString()}, need ${cost.toLocaleString()})` : `Requirements met`}
          >
            <Icon size={11} className={color} />
            <span className={isShort ? 'text-red-400 font-extrabold animate-pulse' : 'text-slate-300'}>{cost.toLocaleString()}</span>
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
  populationRank?: number;
  onNavigateToLeaderboard?: () => void;
  chatMessages: ChatMessage[];
  onSendChat: (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => void;
  localResources?: Record<ResourceType, number>;
}

const RESOURCE_INFO: Record<ResourceType, { name: string; color: string; icon: any; desc: string }> = {
  water: { name: 'Water', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40', icon: Droplet, desc: 'Essential life fluid. Consumed continuously by troops.' },
  plasma: { name: 'Plasma', color: 'text-pink-500 bg-pink-950/40 border-pink-900/40', icon: Zap, desc: 'High-energy matter used to forge dreadnoughts and hyper-engines.' },
  fuel: { name: 'Fuel', color: 'text-amber-500 bg-amber-950/40 border-amber-900/40', icon: Flame, desc: 'Thermonuclear combustibles required for fleet traversal logistics.' },
  food: { name: 'Food', color: 'text-emerald-500 bg-emerald-950/40 border-emerald-900/40', icon: Apple, desc: 'Synthesized proteins to support base colonists and ground forces.' },
  respirant: { name: 'Respirant', color: 'text-purple-400 bg-purple-950/40 border-purple-900/40', icon: Wind, desc: 'Atmospheric gases key to orbital military ventilation systems.' },
};

const BUILDING_INFO: Record<string, { name: string; desc: string; icon: string }> = {
  fabricator: { name: 'Fabricator', desc: 'Core orbital printer. Crucial for manufacturing, constructing, and restoring modular structures on this station.', icon: '🏗️' },
  commsHub: { name: 'Communications Hub', desc: 'Secure interline network frequency to join alliances, manage roles, negotiate covenants, and deploy galaxy chat.', icon: '📡' },
  researchCenter: { name: 'Research Center', desc: 'Purity laboratory. Decreases travel or production speed of your troops by up to 70% at Lv.20. Crucial for colonization.', icon: '🧪' },
  armyBase: { name: 'War Room', desc: 'Troop command space force. Recruit interceptors, assault drones, matter extractors, disrupters, missile tanks, and settlement ships.', icon: '🎖️' },
  repository: { name: 'Silo', desc: 'Secure vaults storing your resource mines. Max level 45, holds up to 5,000,000 of each fluid.', icon: '🗄️' },
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
  onViewPlayerProfile,
  populationRank = 1,
  onNavigateToLeaderboard,
  chatMessages,
  onSendChat,
  localResources = activePlanet.resources
}) => {
  const [expandedCategory, setExpandedCategory] = useState<ResourceType | null>(null);
  const [restoringKeys, setRestoringKeys] = useState<Record<string, boolean>>({});
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(activePlanet.name);

  // Sync newNameInput when activePlanet changes
  React.useEffect(() => {
    setNewNameInput(activePlanet.name);
    setIsEditingName(false);
  }, [activePlanet.id, activePlanet.name]);

  // Resource sending form states
  const [showSendResources, setShowSendResources] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferCoords, setTransferCoords] = useState({ x: '', y: '' });
  const [useCoords, setUseCoords] = useState(false);
  const [transferResources, setTransferResources] = useState<Record<string, string>>({
    water: '0',
    plasma: '0',
    fuel: '0',
    food: '0',
    respirant: '0'
  });
  const [isTransmitting, setIsTransmitting] = useState(false);

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

  // Check if any upgrade is active right now on this planet
  const isAnyUpgradeInProgress = 
    Object.values(activePlanet.buildings).some((b: any) => b.isUpgrading) ||
    Object.keys(activePlanet.mines).some(mKey => activePlanet.mines[mKey as ResourceType].some(m => m.isUpgrading));

  // Sections collapse states
  const [showRadar, setShowRadar] = useState(false);
  const [showExtractorsSec, setShowExtractorsSec] = useState(false);
  const [showStructures, setShowStructures] = useState(false);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  const getRequiredFabricatorLevel = (key: string): number => {
    if (key === 'fabricator') return 0;
    if (key === 'radar') return 2;
    if (key === 'researchCenter') return 4;
    if (key === 'armyBase') return 7;
    if (key === 'supplyNexus') return 10;
    return 1;
  };

  const fabLevel = activePlanet.buildings.fabricator?.level || 0;

  const constructedBuildings = Object.entries(activePlanet.buildings).filter(([bKey, val]: [string, any]) => {
    const isQueued = activePlanet.upgradeQueue?.some((item: any) => item.type === 'building' && item.key === bKey);
    return val.level > 0 || val.isUpgrading || isQueued;
  });

  const unconstructedBuildings = Object.entries(activePlanet.buildings).filter(([bKey, val]: [string, any]) => {
    const isQueued = activePlanet.upgradeQueue?.some((item: any) => item.type === 'building' && item.key === bKey);
    return val.level === 0 && !val.isUpgrading && !isQueued;
  });

  const visibleBlueprints = unconstructedBuildings.filter(([bKey]) => {
    const reqLvl = getRequiredFabricatorLevel(bKey);
    return fabLevel >= reqLvl;
  });

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
        localStorage.setItem(`moonbase_boosted_${player.id}`, 'true');
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
    const specCosts = { defender: 1.0, attacker: 2.0, tank: 4.0, looter: 3.0, drone: 0.4, settlementShip: 5.0 };
    Object.entries(activePlanet.troops).forEach(([tId, count]) => {
      tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
    });
    return tot;
  };

  const waterConsumption = getWaterConsumption();
  const respirantConsumption = waterConsumption * 0.28;
  const foodConsumption = waterConsumption * 0.18;

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
    <div className="space-y-8 pb-24" id="explore-tab-view">
      {/* HUD Removed and Synced with App.tsx */}
      <div className="hidden">
      <div className="relative z-10 bg-[#0A0F1D]/60 backdrop-blur-sm border border-slate-800/65 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-7 p-5 justify-between">
        
        {/* Water Stat */}
        <div className="flex flex-col animate-fade-in text-left" title="Water (H2O): Essential life fluid. Consumed continuously by troops to maintain Space Force strength. Hover/long press for info.">
          <div className="flex items-center gap-2 mb-1">
            <Droplet size={12} className="text-cyan-400 animate-pulse" title="Water icon" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono">Water (H2O)</span>
          </div>
          <span className="text-base font-mono font-bold text-cyan-400">
            {Math.round(localResources.water).toLocaleString()}{" "}
            <span className="text-[10px] text-slate-500 font-normal">/ <span className="text-white font-bold">{(repositoryLimit/1000).toFixed(0)}k</span></span>
          </span>
          <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee] transition-all duration-300"
              style={{ width: `${Math.min(100, (localResources.water / repositoryLimit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Plasma Stat */}
        <div className="flex flex-col animate-fade-in text-left" title="Plasma: High-energy matter. Essential for building complex spaceship hull grades and hyper-engines. Hover/long press for info.">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={12} className="text-purple-400 animate-pulse" title="Plasma icon" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono">Plasma</span>
          </div>
          <span className="text-base font-mono font-bold text-purple-400">
            {Math.round(localResources.plasma).toLocaleString()}{" "}
            <span className="text-[10px] text-slate-500 font-normal">/ <span className="text-white font-bold">{(repositoryLimit/1000).toFixed(0)}k</span></span>
          </span>
          <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-purple-500 rounded-full shadow-[0_0_6px_#a855f7] transition-all duration-300"
              style={{ width: `${Math.min(100, (localResources.plasma / repositoryLimit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Fuel Stat */}
        <div className="flex flex-col animate-fade-in text-left" title="Fuel: Thermonuclear propulsion energy. Required for dispatching fleet traversals across global planetary sectors. Hover/long press for info.">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={12} className="text-amber-400 animate-pulse" title="Fuel icon" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono">Fuel</span>
          </div>
          <span className="text-base font-mono font-bold text-amber-400">
            {Math.round(localResources.fuel).toLocaleString()}{" "}
            <span className="text-[10px] text-slate-500 font-normal">/ <span className="text-white font-bold">{(repositoryLimit/1000).toFixed(0)}k</span></span>
          </span>
          <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-amber-500 rounded-full shadow-[0_0_6px_#fbbf24] transition-all duration-300"
              style={{ width: `${Math.min(100, (localResources.fuel / repositoryLimit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Food Stat */}
        <div className="flex flex-col animate-fade-in text-left" title="Food: Life support proteins. Vital to sustaining personnel during active colonist station operations. Hover/long press for info.">
          <div className="flex items-center gap-2 mb-1">
            <Apple size={12} className="text-emerald-400 animate-pulse" title="Food icon" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono">Food</span>
          </div>
          <span className="text-base font-mono font-bold text-emerald-400">
            {Math.round(localResources.food).toLocaleString()}{" "}
            <span className="text-[10px] text-slate-500 font-normal">/ <span className="text-white font-bold">{(repositoryLimit/1000).toFixed(0)}k</span></span>
          </span>
          <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981] transition-all duration-300"
              style={{ width: `${Math.min(100, (localResources.food / repositoryLimit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Respirant Stat */}
        <div className="flex flex-col col-span-2 md:col-span-1 animate-fade-in text-left" title="Respirant (O2): Atmospheric gases. Powering life ventilation systems for astronauts and pilots. Hover/long press for info.">
          <div className="flex items-center gap-2 mb-1">
            <Wind size={12} className="text-blue-400 animate-pulse" title="Respirant icon" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#64748b] font-mono">Respirant (O2)</span>
          </div>
          <span className="text-base font-mono font-bold text-blue-400">
            {Math.round(localResources.respirant).toLocaleString()}{" "}
            <span className="text-[10px] text-slate-500 font-normal">/ <span className="text-white font-bold">{(repositoryLimit/1000).toFixed(0)}k</span></span>
          </span>
          <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-blue-500 rounded-full shadow-[0_0_6px_#3b82f6] transition-all duration-300"
              style={{ width: `${Math.min(100, (localResources.respirant / repositoryLimit) * 100)}%` }}
            />
          </div>
        </div>

      </div>
      </div>

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

          // Calculate total duration remaining of active and queued items
          let totalTimeMs = 0;
          const nowMs = Date.now();
          
          activeUpgrades.forEach(act => {
            if (act.upgradeEnd > nowMs) {
              totalTimeMs += (act.upgradeEnd - nowMs);
            }
          });
          
          queueList.forEach(q => {
            const level = q.targetLevel || 1;
            if (q.type === 'building') {
              totalTimeMs += level * 120 * 1000;
            } else {
              totalTimeMs += level * 60 * 1000;
            }
          });

          const formatTotalTime = (ms: number) => {
            if (ms <= 0) return '0s';
            const totalSecs = Math.ceil(ms / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            
            const parts = [];
            if (hrs > 0) parts.push(`${hrs}h`);
            if (mins > 0) parts.push(`${mins}m`);
            if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
            return parts.join(' ');
          };

          return (
            <div className="relative z-10 mt-4 p-4 border border-cyan-500/25 bg-cyan-950/10 rounded-2xl font-mono text-xs text-slate-350 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/10 pb-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      Station Construction Queue ({queueList.length}/25 queued)
                    </span>
                    {activeUpgrades.length > 0 && (
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        {activeUpgrades.length} Active
                      </span>
                    )}
                  </div>
                  {/* Estimated total duration for all queues to be done */}
                  <span className="text-[10.5px] text-amber-400 font-extrabold flex items-center gap-1">
                    ⌛ TOTAL REMAINING TIME: {formatTotalTime(totalTimeMs)}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[9px] text-slate-500 uppercase hidden sm:inline">Sequential Processing</span>
                  <button
                    onClick={() => setIsQueueMinimized(!isQueueMinimized)}
                    className="p-1 px-2.5 text-[9px] font-extrabold font-mono uppercase bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/25 hover:border-cyan-400 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 select-none"
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
                          <span className="text-white font-extrabold font-sans">
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
                    // Each upgrade queue time (1 min per level for mines, 2 min per level for buildings)
                    const durationMins = q.targetLevel * (q.type === 'building' ? 2 : 1);
                    return (
                      <div key={`queued-${index}`} className="flex items-center justify-between bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800 p-2 px-3 rounded-xl transition">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold select-none">#{index + 1} QUEUED (SG)</span>
                          <span className="text-slate-300 font-semibold font-sans">
                            {q.type === 'mine' ? '⛏️' : '🏗️'} {bName} &rarr; <span className="text-cyan-400 font-extrabold font-mono">Lv. {q.targetLevel}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold font-mono">⏳ {durationMins}m</span>
                          <span className="text-[9px] text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded uppercase">Pending</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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

      {/* resource mines category list */}
      <div className="border border-cyan-500/35 bg-[#0C1425]/60 p-4 rounded-2xl mb-8 shadow-[0_0_20px_rgba(34,211,238,0.12)] ring-1 ring-cyan-500/10 hover:shadow-[0_0_25px_rgba(34,211,238,0.22)] transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-cyan-500/25 pb-3" id="extractors_header">
          <button
            onClick={() => setShowExtractorsSec(!showExtractorsSec)}
            className="flex-1 flex items-center justify-between text-left hover:brightness-110 transition duration-150 cursor-pointer group"
            type="button"
          >
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-300 font-mono flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/25 text-cyan-200 mr-1.5 animate-pulse border border-cyan-400/40 text-[9.5px]">⚡ COMMAND ACTIVE</span>
                Resource Extractors (Max Level: {maxExtractorLevel})
                {showExtractorsSec ? (
                  <ChevronUp size={14} className="text-cyan-400 group-hover:scale-110 transition" />
                ) : (
                  <ChevronDown size={14} className="text-cyan-400 group-hover:scale-110 transition" />
                )}
              </h3>
              <p className="text-[10px] text-cyan-400/70 font-sans mt-1 leading-relaxed">
                Maximum extractors level: <strong className="text-white">{maxExtractorLevel}</strong> for this station (Level 25 for Main ★, Level 20 for Secondary ★★, Level 15 for Colonies).
              </p>
            </div>
          </button>
          <button
            onClick={() => handleOpenBoostModal("all", -1)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.55)] border border-amber-400/40 rounded-xl transition duration-150 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer self-start sm:self-auto hover:scale-105"
            type="button"
          >
            <Zap size={11} className="animate-bounce" /> Production Boost
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
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption * 0.28).toLocaleString()}/hr troops)</span>
                        )}
                        {resKey === 'food' && waterConsumption > 0 && (
                          <span className="text-red-400 font-bold border-l border-[#1E293B] pl-2">(-{Math.round(waterConsumption * 0.18).toLocaleString()}/hr troops)</span>
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
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-mono font-black text-[10.5px] uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.55)] hover:scale-[1.03] shrink-0 self-start sm:self-auto"
                              type="button"
                            >
                              ⚡ OVERDRIVE BOOST EXTRACTOR (🪙 45)
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

                        const mineQueueCount = activePlanet.upgradeQueue?.filter((item: any) => item.type === 'mine' && item.key === resKey && item.mineIndex === mine.index).length || 0;
                        const activeUpgradeCount = mine.isUpgrading ? 1 : 0;
                        const currentTotalUpgrades = activeUpgradeCount + mineQueueCount;
                        const nextMineTargetLvl = mine.level + currentTotalUpgrades + 1;
                        const nextMineUpgradeTimeMins = nextMineTargetLvl * 1;

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
                                  <RestoreCostBar type="mine" upgradeKey={resKey} targetLevel={targetLevel} health={mine.health!} planetResources={localResources} />
                                ) : (
                                  <UpgradeCostBar type="mine" upgradeKey={resKey} targetLevel={nextMineTargetLvl} planetResources={localResources} />
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
                                  {nextMineTargetLvl <= maxExtractorLevel && (
                                    <button 
                                      onClick={() => onUpgradeMine(resKey, mine.index, true)}
                                      className="px-3 py-1.5 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-[#10b981]/35 rounded-xl transition duration-150 cursor-pointer font-mono text-[9px] font-bold uppercase flex items-center gap-1.5"
                                    >
                                      <span className="text-emerald-400">Queue Upgrade</span>
                                      <span className="text-amber-400 font-extrabold">(Lv. {nextMineTargetLvl}, {nextMineUpgradeTimeMins}m)</span>
                                    </button>
                                  )}
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
                                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-[#10b981]/35 rounded-xl transition duration-150 cursor-pointer font-mono text-[10px] font-bold uppercase flex items-center gap-1.5"
                                >
                                  <span className="text-emerald-400">Queue Upgrade</span>
                                  <span className="text-amber-400 font-extrabold">(Lv. {nextMineTargetLvl}, {nextMineUpgradeTimeMins}m)</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => onUpgradeMine(resKey, mine.index)}
                                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 border border-cyan-400 text-slate-950 font-mono font-black text-[10.5px] uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.55)] hover:scale-[1.03]"
                                >
                                  ⚡ UPGRADE EXTRACTOR <span className="text-slate-900 font-bold ml-1">({nextMineUpgradeTimeMins}m)</span>
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
      <div className="border border-indigo-500/35 bg-[#0C1425]/60 p-4 rounded-2xl mb-8 shadow-[0_0_20px_rgba(99,102,241,0.12)] ring-1 ring-indigo-500/10 hover:shadow-[0_0_25px_rgba(99,102,241,0.22)] transition duration-300">
        <button
          onClick={() => setShowStructures(!showStructures)}
          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-indigo-500/25 pb-3 text-left hover:brightness-110 transition duration-150 cursor-pointer group"
          type="button"
        >
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-350 font-mono flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-200 mr-1.5 animate-pulse border border-indigo-400/40 text-[9.5px]">🏯 INFRASTRUCTURE</span>
              Established Structures ({constructedBuildings.length})
              {showStructures ? (
                <ChevronUp size={14} className="text-indigo-400 group-hover:scale-110 transition inline" />
              ) : (
                <ChevronDown size={14} className="text-indigo-400 group-hover:scale-110 transition inline" />
              )}
            </h3>
            <p className="text-[10px] text-indigo-400/70 font-sans mt-1 leading-relaxed">
              Sovereign base facilities, resource repositories, and control command matrices constructed on this site.
            </p>
          </div>
          <span className="text-[10.5px] text-indigo-300 font-mono font-bold bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-xl shrink-0 self-start sm:self-auto">
            ({constructedBuildings.length} Facilities Built)
          </span>
        </button>
        {showStructures && (
          <div className="space-y-4">
            {constructedBuildings.map(([bKey, val]) => {
              const bState = val as any;
              const info = BUILDING_INFO[bKey];
              if (!info) return null;

              const buildingQueueCount = activePlanet.upgradeQueue?.filter((item: any) => item.type === 'building' && item.key === bKey).length || 0;
              const activeUpgradeCount = bState.isUpgrading ? 1 : 0;
              const currentTotalUpgrades = activeUpgradeCount + buildingQueueCount;
              const nextTargetLvl = bState.level + currentTotalUpgrades + 1;
              const nextUpgradeTimeMins = nextTargetLvl * 2;

              const targetLvl = bState.level + 1;
              const cost = targetLvl * 150;
              const upgradeTimeMins = targetLvl * 2;
              const isExpanded = expandedBuilding === bKey;
              const isFabricatorRequiredMissing = bKey !== 'fabricator' && bKey !== 'commsHub' && bKey !== 'repository' && (!activePlanet.buildings.fabricator || activePlanet.buildings.fabricator.level < 1);

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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            bState.level === 0 
                              ? 'bg-slate-950 text-slate-500 border-slate-800' 
                              : 'bg-slate-900 text-pink-400 border-[#1E293B]'
                          }`}>
                            Lv. {bState.level} / {bState.maxLevel} {bState.level === 0 && '(Unconstructed)'}
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
                        <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                          {bState.level === 0 ? 'Constructing' : 'Upgrading'} {getTimerString(bState.upgradeEnd)}
                        </span>
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
                      {isFabricatorRequiredMissing && (
                        <div className="p-3 border border-red-500/20 bg-red-950/40 rounded-xl text-red-400 text-xs font-mono text-left">
                          ⚠️ REQUIREMENT: A Fabricator at level 1 or higher is required to construct or upgrade this structure. Please construct/upgrade the Fabricator modular structure first!
                        </div>
                      )}

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
                        <div className="space-y-4 text-xs text-left">
                          <div className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                            Supply Nexus Status: <span className="text-white bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded font-bold">Trading Network Link Level {bState.level}</span>
                          </div>
                          <div className="font-sans text-[11px] text-slate-400 bg-slate-950/60 p-2.5 border border-[#1E293B]/60 rounded-lg max-w-md">
                            🌌 <span className="font-bold text-slate-200">Quantum Cargo Link:</span> Wire resources directly to other planets in the sector. Enter coordinates manually or select from your colonized space stations.
                          </div>

                          {bState.level > 0 && (
                            <div className="space-y-3 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowSendResources(!showSendResources)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                              >
                                📦 SEND RESOURCES
                              </button>

                              {showSendResources && (
                                <div className="p-3 bg-[#0a0f18] border border-[#1e293b] rounded-lg max-w-md space-y-3">
                                  {/* Target Selection Header */}
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { setUseCoords(false); setTransferTargetId(''); }}
                                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${!useCoords ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
                                    >
                                      MY STATIONS
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setUseCoords(true); setTransferTargetId(''); }}
                                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${useCoords ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
                                    >
                                      COORDINATES
                                    </button>
                                  </div>

                                  {/* Target inputs */}
                                  {!useCoords ? (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Select Target Space Station</label>
                                      <select
                                        value={transferTargetId}
                                        onChange={(e) => setTransferTargetId(e.target.value)}
                                        className="w-full bg-[#03070c] border border-[#1e293b] rounded p-1.5 text-xs text-slate-100"
                                      >
                                        <option value="">-- Choose target planet --</option>
                                        {player.planets.filter(pl => pl.id !== activePlanet.id).map(pl => (
                                          <option key={pl.id} value={pl.id}>
                                            {pl.name} [{pl.sectorX}, {pl.sectorY}]
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target sector coordinates</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="number"
                                          placeholder="Sector X"
                                          value={transferCoords.x}
                                          onChange={(e) => setTransferCoords(prev => ({ ...prev, x: e.target.value }))}
                                          className="w-1/2 bg-[#03070c] border border-[#1e293b] rounded p-1 text-slate-100 font-mono text-xs"
                                        />
                                        <input
                                          type="number"
                                          placeholder="Sector Y"
                                          value={transferCoords.y}
                                          onChange={(e) => setTransferCoords(prev => ({ ...prev, y: e.target.value }))}
                                          className="w-1/2 bg-[#03070c] border border-[#1e293b] rounded p-1 text-slate-100 font-mono text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Resource inputs */}
                                  <div className="space-y-2 border-t border-[#1e293b]/60 pt-2.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Specify Resource cargo load</span>
                                    {['water', 'plasma', 'fuel', 'food', 'respirant'].map((resKey) => {
                                      const label = resKey.charAt(0).toUpperCase() + resKey.slice(1);
                                      const maxVal = Math.floor(localResources[resKey as ResourceType] || 0);
                                      return (
                                        <div key={resKey} className="flex items-center justify-between gap-2 bg-[#03070c] p-1.5 rounded border border-[#1e293b]/30">
                                          <span className="text-slate-300 font-medium w-20">{label}</span>
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              max={maxVal}
                                              value={transferResources[resKey] || '0'}
                                              onChange={(e) => {
                                                const v = Math.min(maxVal, Math.max(0, parseInt(e.target.value, 10) || 0));
                                                setTransferResources(prev => ({ ...prev, [resKey]: String(v) }));
                                              }}
                                              className="bg-[#0a101d] border border-[#1e293b] rounded text-slate-100 text-right w-24 p-1 text-xs font-mono"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setTransferResources(prev => ({ ...prev, [resKey]: String(maxVal) }))}
                                              className="px-1.5 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase rounded"
                                            >
                                              MAX
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Submit button */}
                                  <button
                                    type="button"
                                    disabled={isTransmitting}
                                    onClick={async () => {
                                      if (!useCoords && !transferTargetId) {
                                        showToast?.('Please select a target space station!', 'error');
                                        return;
                                      }
                                      if (useCoords && (!transferCoords.x || !transferCoords.y)) {
                                        showToast?.('Please specify target sector coordinates!', 'error');
                                        return;
                                      }
                                      setIsTransmitting(true);
                                      try {
                                        const response = await fetch('/api/resources/send', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'x-user-id': player.id
                                          },
                                          body: JSON.stringify({
                                            targetId: useCoords ? undefined : transferTargetId,
                                            targetX: useCoords ? parseInt(transferCoords.x, 10) : undefined,
                                            targetY: useCoords ? parseInt(transferCoords.y, 10) : undefined,
                                            sourcePlanetId: activePlanet.id,
                                            resources: {
                                              water: parseInt(transferResources.water, 10) || 0,
                                              plasma: parseInt(transferResources.plasma, 10) || 0,
                                              fuel: parseInt(transferResources.fuel, 10) || 0,
                                              food: parseInt(transferResources.food, 10) || 0,
                                              respirant: parseInt(transferResources.respirant, 10) || 0
                                            }
                                          })
                                        });
                                        const data = await response.json();
                                        if (response.ok) {
                                          showToast?.(data.message || 'Resources transmitted successfully via Quantum Cargo link!', 'success');
                                          // Reset fields
                                          setTransferResources({ water: '0', plasma: '0', fuel: '0', food: '0', respirant: '0' });
                                          if (onRefreshState) onRefreshState();
                                        } else {
                                          showToast?.(data.error || 'Failed to transmit resource shipment.', 'error');
                                        }
                                      } catch (err) {
                                        showToast?.('Network transmission failed.', 'error');
                                      } finally {
                                        setIsTransmitting(false);
                                      }
                                    }}
                                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold uppercase font-mono tracking-wide rounded-md cursor-pointer text-center"
                                  >
                                    {isTransmitting ? 'TRANSMITTING LINK...' : 'DISPATCH CARGO SHIPS'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {bState.level < bState.maxLevel && (
                        bState.health !== undefined && bState.health < 100 ? (
                          <RestoreCostBar type="building" upgradeKey={bKey} targetLevel={nextTargetLvl} health={bState.health} planetResources={localResources} />
                        ) : (
                          <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={nextTargetLvl} planetResources={localResources} />
                        )
                      )}

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Actions & Progress Control:</span>
                        {bState.isUpgrading ? (
                          <div className="flex flex-col items-end gap-1.5 font-mono">
                            <div className="flex items-center gap-1.5 text-xs text-amber-400" title="Building progress in progress. Countdown until build completion.">
                              <Clock size={12} className="animate-spin" title="Spinning build progress timer" />
                              <span>{bState.level === 0 ? 'Constructing' : 'Upgrading'} {getTimerString(bState.upgradeEnd)}</span>
                            </div>
                            {nextTargetLvl <= bState.maxLevel && (
                              <button 
                                onClick={() => onUpgradeBuilding(bKey, true)}
                                className="px-3 py-1.5 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/35 rounded-xl transition duration-150 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                                type="button"
                              >
                                <span className="text-emerald-400">Queue Upgrade</span>
                                <span className="text-amber-400 font-extrabold">(Lv. {nextTargetLvl}, {nextUpgradeTimeMins}m)</span>
                              </button>
                            )}
                          </div>
                        ) : isFabricatorRequiredMissing ? (
                          <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 px-3 py-1.5 rounded" title="Fabricator modular structure at level 1 or higher is required.">
                            🔒 FABRICATOR REQUIRED
                          </span>
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
                            <span className="text-emerald-400">{bState.level === 0 ? 'Queue Construction' : 'Queue Upgrade'}</span>
                            <span className="text-amber-400 font-extrabold">(Lv. {nextTargetLvl}, {nextUpgradeTimeMins}m)</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => onUpgradeBuilding(bKey)}
                            className="px-4 py-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:shadow-[0_0_12px_rgba(236,72,153,0.25)] border border-pink-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span>{bState.level === 0 ? 'Construct' : 'Upgrade'}</span>
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

        {/* Unlocked blueprints section for structures not yet constructed */}
        {showStructures && visibleBlueprints.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#1E293B]/60 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5bc0be] font-mono flex items-center gap-2 mb-4">
              🏗️ Unlocked Construction Blueprints ({visibleBlueprints.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleBlueprints.map(([bKey, val]) => {
                const bState = val as any;
                const info = BUILDING_INFO[bKey];
                if (!info) return null;

                const targetLvl = bState.level + 1;
                const upgradeTimeMins = targetLvl * 2;
                const isExpanded = expandedBuilding === bKey;

                return (
                  <div 
                    key={bKey}
                    className="border border-dashed border-[#5bc0be]/30 rounded-xl bg-[#090D1A]/50 backdrop-blur-md overflow-hidden hover:border-[#5bc0be]/60 transition duration-150"
                    id={`blueprint_${bKey}`}
                  >
                    <div className="p-4 flex items-center justify-between text-left gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-[#05070A] border border-[#5bc0be]/25 text-xl font-sans text-center shrink-0 shadow-lg select-none">
                          {info.icon}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-sm font-mono block">{info.name}</span>
                          <p className="text-[10.5px] text-slate-400 leading-normal line-clamp-1">{info.desc}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setExpandedBuilding(isExpanded ? null : bKey)}
                        className="px-3 py-1.5 bg-[#5bc0be] hover:bg-[#5bc0be]/90 text-slate-950 font-bold font-mono text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>Blueprint</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#5bc0be]/20 p-4 bg-slate-950/40 space-y-3.5 text-left text-xs animate-fade-in">
                        <p className="text-slate-350 leading-relaxed font-sans">{info.desc}</p>
                        <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={1} planetResources={localResources} />
                        
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[9.5px] text-slate-500 font-mono font-bold tracking-wider">REQUISITE FABRICATOR: Lv. {getRequiredFabricatorLevel(bKey)}</span>
                          {isAnyUpgradeInProgress ? (
                            <button 
                              onClick={() => onUpgradeBuilding(bKey, true)}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 rounded-lg transition duration-150 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                              type="button"
                            >
                              <span className="text-emerald-400">Queue Construction</span>
                              <span className="text-amber-400 font-extrabold">(15 SG)</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => onUpgradeBuilding(bKey)}
                              className="px-4 py-2 bg-pink-500/15 text-pink-400 hover:bg-pink-500/25 border border-pink-500/35 rounded-lg transition duration-150 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                              type="button"
                            >
                              <span>Construct</span>
                              <span className="text-slate-450 text-[8px]">({upgradeTimeMins}m)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TACTICAL NETWORK TRANSCEIVER */}
      <div id="tactical-network-transceiver-box" className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl flex flex-col items-center justify-center text-center py-10 space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
          <Radio size={20} className="animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Tactical Network Transceiver</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed font-sans font-normal">
            Secure deep space transceiver wavelengths. Connect to the outer-rim sector communications grid to transmit or receive orbital signals.
          </p>
        </div>
        <div className="pt-2">
          <button 
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="px-6 py-3 bg-cyan-950/20 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <MessageSquare size={13} />
            Open Global System Chat
          </button>
        </div>
      </div>

      {/* GLOBAL CHAT MODAL OVERLAY */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-2xl bg-[#070B13] border border-cyan-500/30 rounded-2xl p-6 flex flex-col h-[550px] shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                  SECURE NET TRANSCEIVER WINDOW — GLOBAL SYSTEM
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white font-sans text-2xl cursor-pointer p-1"
                title="Disconnect channel link"
              >
                &times;
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-xs text-left">
              {!chatMessages || chatMessages.filter(msg => msg.channel === 'global').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10 space-y-2">
                  <MessageSquare size={32} className="opacity-30" />
                  <p className="text-xs">No active transmissions decoded on this wavelength.</p>
                </div>
              ) : (
                [...chatMessages]
                  .filter(msg => msg.channel === 'global')
                  .reverse()
                  .map((msg) => (
                    <div key={msg.id} className="p-3 border border-slate-900 rounded-xl bg-[#05070A]/60 hover:bg-[#05070A]/95 transition duration-150 leading-snug">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-600 text-[10px]">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                        {msg.allianceTag && (
                          <span className="text-yellow-400 font-bold">[{msg.allianceTag}]</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewPlayerProfile && onViewPlayerProfile(msg.senderId)}
                          className="font-bold underline text-cyan-400 hover:text-cyan-300 cursor-pointer focus:outline-none"
                        >
                          {msg.senderName}
                        </button>
                        <span className="text-slate-500 text-[10px]">:</span>
                      </div>
                      <p className="text-slate-355 mt-1 pl-2 border-l border-cyan-500/40 text-slate-300">{msg.content}</p>
                    </div>
                  ))
              )}
            </div>

            {/* Chat entry form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                onSendChat('global', chatInput.trim());
                setChatInput('');
              }} 
              className="mt-4 flex gap-2.5"
            >
              <input 
                type="text" 
                placeholder="Transmit across sector wavelengths..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-3 bg-[#05070A] border border-[#1E293B] text-white rounded-xl text-xs focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
              />
              <button 
                type="submit"
                className="px-5 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center transition cursor-pointer shrink-0"
                title="Send secure communication transmission"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}

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
