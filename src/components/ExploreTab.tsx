import React, { useState } from 'react';
import { ColonyPlanet, PlayerProfile, ResourceType, getUpgradeResourceCost, FleetMission, BuildingState, ChatMessage, Alliance } from '../types';
import { CommanderTutorial } from './CommanderTutorial';
import { CommunicationsHubDetail } from './CommunicationsHubDetail';
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
  Radio,
  AlertTriangle
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
  setActiveTab: (tab: any) => void;
  showStationsTop?: boolean;
  setSelectedPlanetId?: (planetId: string) => void;
  customTasks?: Record<string, any>;
  isUpgrading?: boolean;
  onCancelFleet?: (fleetId: string) => Promise<void>;
  onRerouteFleet?: (fleetId: string, targetX: number, targetY: number, missionType?: string) => Promise<void>;
  maxCoord?: number;
  alliances?: Record<string, Alliance>;
  playersList?: PlayerProfile[];
  onCreateAlliance?: (name: string, tag: string, bannerColor: string, bannerSymbol: string) => Promise<void>;
  onJoinAlliance?: (allianceId: string) => Promise<void>;
  onLeaveAlliance?: () => Promise<void>;
  onDeclareWar?: (targetAllianceId: string) => Promise<void>;
  onNavigateToGalaxySubTab?: (subTab: 'scanner' | 'ranking' | 'comms' | 'news' | 'fleets') => void;
  onOpenCommsHub?: () => void;
  layoutMode?: 'classic' | 'datasaving';
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
  supplyNexus: { name: 'Supply Nexus', desc: 'A quantum portal linking coordinates to core supplies. Max level 50, dispatches a total of 5,000,000 resources (1,000,000 of each type) directly to base storage when maxed.', icon: '🌌' },
  bunker: { name: 'Bunker', desc: 'Secure reinforced deep underground bunker. Ends at level 25. Protects and saves up to 500,000 resources of each type from raids when maxed.', icon: '🛡️' },
  magneticShield: { name: 'Magnetic Shield', desc: 'Active polarized deflection shield. Ends at level 12. Decreases the damage that a disruptor can do to your structures by up to 30% when maxed.', icon: '🧲' }
};

const getRepositoryCapacity = (level: number): number => {
  if (level <= 1) return 10000;
  if (level >= 45) return 5000000;
  return Math.round(10000 * Math.pow(500, (level - 1) / 44));
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
  localResources = activePlanet.resources,
  setActiveTab,
  showStationsTop,
  setSelectedPlanetId,
  customTasks,
  isUpgrading = false,
  onCancelFleet,
  onRerouteFleet,
  maxCoord = 100,
  alliances,
  playersList,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onDeclareWar,
  onNavigateToGalaxySubTab,
  onOpenCommsHub,
  layoutMode = 'classic'
}) => {
  const [expandedCategory, setExpandedCategory] = useState<ResourceType | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [restoringKeys, setRestoringKeys] = useState<Record<string, boolean>>({});
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);
  const [isRadarTransitsMinimized, setIsRadarTransitsMinimized] = useState(false);
  const [isRadarIncomingMinimized, setIsRadarIncomingMinimized] = useState(false);
  const [isRadarOutgoingMinimized, setIsRadarOutgoingMinimized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatPage, setChatPage] = useState(0);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAlertsHUDMinimized, setIsAlertsHUDMinimized] = useState(false);
  const [minimizeAlertsIncoming, setMinimizeAlertsIncoming] = useState(false);
  const [minimizeAlertsMoving, setMinimizeAlertsMoving] = useState(false);
  
  // Collapsible states for data saving mode
  const [expandedMines, setExpandedMines] = useState<Record<string, boolean>>({});
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(activePlanet.name);

  // Rerouting inputs state
  const [reroutingFleetId, setReroutingFleetId] = useState<string | null>(null);
  const [rerouteX, setRerouteX] = useState<string>('');
  const [rerouteY, setRerouteY] = useState<string>('');

  // Sync newNameInput when activePlanet changes
  React.useEffect(() => {
    setNewNameInput(activePlanet.name);
    setIsEditingName(false);
  }, [activePlanet.id, activePlanet.name]);

  const allExtractorsLevelOneOrMore = (() => {
    const resourceKeys: ('water' | 'plasma' | 'fuel' | 'food' | 'respirant')[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
    return resourceKeys.every(rKey => {
      const list = activePlanet.mines[rKey];
      if (!list || list.length === 0) return false;
      return list.every(mine => mine.level >= 1);
    });
  })();

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
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [showStructures, setShowStructures] = useState(true);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);
  const [hasClickedRadar, setHasClickedRadar] = useState(() => {
    return localStorage.getItem(`moonbase_radar_clicked_${player.id}`) === 'true';
  });

  const formatLimit = (limit: number): string => {
    if (limit >= 1000000) {
      return `${(limit / 1000000).toFixed(0)}M`;
    }
    return `${(limit / 1000).toFixed(0)}k`;
  };

  const getRequiredFabricatorLevel = (key: string): number => {
    if (key === 'fabricator') return 0;
    if (key === 'radar') return 2;
    if (key === 'researchCenter') return 4;
    if (key === 'magneticShield') return 10;
    if (key === 'armyBase') return 7;
    if (key === 'supplyNexus') return 10;
    if (key === 'bunker') return 10;
    return 1;
  };

  const fabLevel = activePlanet.buildings.fabricator?.level || 0;

  const BUILDING_SORT_ORDER = [
    'fabricator',
    'commsHub',
    'radar',
    'armyBase',
    'researchCenter',
    'supplyNexus',
    'repository',
    'bunker',
    'magneticShield'
  ];

  const sortBuildings = (a: [string, any], b: [string, any]) => {
    const indexA = BUILDING_SORT_ORDER.indexOf(a[0]);
    const indexB = BUILDING_SORT_ORDER.indexOf(b[0]);
    const valA = indexA === -1 ? 999 : indexA;
    const valB = indexB === -1 ? 999 : indexB;
    return valA - valB;
  };

  const constructedBuildings = Object.entries(activePlanet.buildings)
    .filter(([bKey, val]: [string, any]) => {
      const isQueued = activePlanet.upgradeQueue?.some((item: any) => item.type === 'building' && item.key === bKey);
      return val.level > 0 || val.isUpgrading || isQueued;
    })
    .sort(sortBuildings);

  const unconstructedBuildings = Object.entries(activePlanet.buildings)
    .filter(([bKey, val]: [string, any]) => {
      const isQueued = activePlanet.upgradeQueue?.some((item: any) => item.type === 'building' && item.key === bKey);
      return val.level === 0 && !val.isUpgrading && !isQueued;
    })
    .sort(sortBuildings);

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
    const cost = (boostTargetType === "all")
      ? (boostDuration === 1 ? 160 : boostDuration === 7 ? 1049 : 3999)
      : (boostDuration === 1 ? 45 : boostDuration === 7 ? 265 : 999);

    setConfirmModal({
      title: 'CONFIRM SPACE GOLD TRANSACTION',
      message: `Are you sure you want to spend ${cost} Space Gold to deploy this extractor production boost? (Please note: this is a beta version of the transaction.)`,
      onConfirm: async () => {
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
      }
    });
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

  const repositoryLimit = getRepositoryCapacity(activePlanet.buildings.repository.level);

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
    const repositoryLimit = getRepositoryCapacity(activePlanet.buildings.repository.level);
    const isOtherMaxed = 
      activePlanet.resources.plasma >= repositoryLimit &&
      activePlanet.resources.fuel >= repositoryLimit &&
      activePlanet.resources.food >= repositoryLimit &&
      activePlanet.resources.respirant >= repositoryLimit;
      
    const mines = activePlanet.mines[resKey] || [];
    return mines.reduce((sum, m) => {
      const isMineBoosted = m.boostedUntil && Number(m.boostedUntil) > serverTime;
      const baseOutput = isOtherMaxed 
        ? 14000 
        : Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
      const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;
      return sum + output;
    }, 0);
  };

  const waterHourlyTotal = getResourceProduction('water');
  const respirantHourlyTotal = getResourceProduction('respirant');
  const foodHourlyTotal = getResourceProduction('food');

  // Let's calculate total troop water consumption per hour (including docking reserve fleets and visiting fleets)
  const getWaterConsumption = () => {
    let tot = 0;
    const specCosts = { defender: 1.0, attacker: 2.0, tank: 4.0, looter: 3.0, drone: 0.4, settlementShip: 5.0 };
    
    // 1. Stationed troops directly on this planet
    Object.entries(activePlanet.troops).forEach(([tId, count]) => {
      tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
    });

    // 2. Reserve fleets belonging to the player
    if (player.createdFleets) {
      player.createdFleets.forEach(fleet => {
        // Find if there is an active mission associated with this created reserve fleet
        const activeMission = fleets.find(m => m.createdFleetId === fleet.id);

        if (activeMission) {
          if (activeMission.missionType === "attack") {
            // Attack missions always consume the home/origin base, never the target
            if (fleet.planetId === activePlanet.id) {
              Object.entries(fleet.troops).forEach(([tId, count]) => {
                tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
              });
            }
          } else if (activeMission.isReturning) {
            // Returning back to home base
            if (fleet.planetId === activePlanet.id) {
              Object.entries(fleet.troops).forEach(([tId, count]) => {
                tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
              });
            }
          } else {
            // Going towards target (non-attack mission)
            const hasArrivedAtTarget = serverTime >= activeMission.arrivesAt;
            if (hasArrivedAtTarget) {
              // Reached target. Does it match this planet's coordinates?
              if (activeMission.targetCoords.x === activePlanet.sectorX && activeMission.targetCoords.y === activePlanet.sectorY) {
                Object.entries(fleet.troops).forEach(([tId, count]) => {
                  tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
                });
              }
            } else {
              // Still traveling, so it is still docking at origin (until they arrive on a different planet)
              if (fleet.planetId === activePlanet.id) {
                Object.entries(fleet.troops).forEach(([tId, count]) => {
                  tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
                });
              }
            }
          }
        } else {
          // Not traveling, so it is docked at its home planet
          if (fleet.planetId === activePlanet.id) {
            Object.entries(fleet.troops).forEach(([tId, count]) => {
              tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
            });
          }
        }
      });
    }

    // 3. Inspect regular active fleets that do not have a createdFleetId, and visiting reserve fleets from other players
    fleets.forEach(mission => {
      // Avoid double counting our own reserve fleets since we handled them above
      if (mission.createdFleetId && mission.senderId === player.id) {
        return;
      }

      // If the fleet has reached this planet and is not returning
      if (!mission.isReturning && serverTime >= mission.arrivesAt && mission.missionType !== "attack") {
        if (mission.targetCoords.x === activePlanet.sectorX && mission.targetCoords.y === activePlanet.sectorY) {
          Object.entries(mission.troops).forEach(([tId, count]) => {
            tot += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
          });
        }
      }
    });

    return tot;
  };

  const waterConsumption = getWaterConsumption();
  const respirantConsumption = waterConsumption * 0.28;
  const foodConsumption = waterConsumption * 0.18;

  const isWaterProductionNegative = waterHourlyTotal < waterConsumption;
  const isRespirantProductionNegative = respirantHourlyTotal < respirantConsumption;
  const isFoodProductionNegative = foodHourlyTotal < foodConsumption;

  const netWaterProdHourly = waterHourlyTotal - waterConsumption;
  const netRespirantProdHourly = respirantHourlyTotal - respirantConsumption;
  const netFoodProdHourly = foodHourlyTotal - foodConsumption;

  const isRedAlertActive = activePlanet.resources.water < 0 || activePlanet.resources.respirant < 0 || activePlanet.resources.food < 0;

  const hoursToNegativeWater = (netWaterProdHourly < 0 && activePlanet.resources.water >= 0) 
    ? (activePlanet.resources.water / Math.abs(netWaterProdHourly)) 
    : Infinity;

  const hoursToNegativeRespirant = (netRespirantProdHourly < 0 && activePlanet.resources.respirant >= 0) 
    ? (activePlanet.resources.respirant / Math.abs(netRespirantProdHourly)) 
    : Infinity;

  const hoursToNegativeFood = (netFoodProdHourly < 0 && activePlanet.resources.food >= 0) 
    ? (activePlanet.resources.food / Math.abs(netFoodProdHourly)) 
    : Infinity;

  const minHoursToNegative = Math.min(hoursToNegativeWater, hoursToNegativeRespirant, hoursToNegativeFood);

  const isOrangeAlertActive = !isRedAlertActive && minHoursToNegative <= 3;

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

  const renderDataSavingLayout = () => {
    const resKeys: ResourceType[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];

    return (
      <div className="space-y-4 pb-24" id="explore-tab-datasaving-view">
        {/* Alerts HUD / Status header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#070c19]/90 border border-slate-800 rounded-xl text-left">
          <div className="text-left flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee] shrink-0" />
            <p className="text-xs text-slate-400 font-sans">
              Active Outpost: <span className="text-cyan-400 font-bold font-mono">{activePlanet.name} ({activePlanet.sectorX}, {activePlanet.sectorY})</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRedAlertActive && (
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-500/30 rounded-lg animate-pulse">
                ⚠️ Attrition Active
              </span>
            )}
            {!allExtractorsLevelOneOrMore && (
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-950/40 text-amber-500 border border-amber-500/30 rounded-lg">
                🔒 ADVANCED UPGRADES LOCKED
              </span>
            )}
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-mono">
              ⚡ Rank #{populationRank}
            </span>
          </div>
        </div>

        {/* Construction Queue */}
        {(() => {
          const queueList = (activePlanet.upgradeQueue || []).filter((item: any) => item.type !== 'research');
          const activeUpgrades: any[] = [];
          
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

          if (activeUpgrades.length === 0 && queueList.length === 0) return null;

          return (
            <div className="p-3 bg-cyan-950/10 border border-cyan-500/25 rounded-xl font-mono text-[10px] text-slate-350 text-left">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 mb-2">
                <span className="text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  Construction Queue ({activeUpgrades.length} active, {queueList.length} queued)
                </span>
              </div>
              <div className="space-y-1.5">
                {activeUpgrades.map((act, index) => {
                  const bName = act.type === 'mine' 
                    ? `${act.key.toUpperCase()} Pump #${act.mineIndex + 1}`
                    : act.key.toUpperCase();
                  return (
                    <div key={`act-ds-${index}`} className="flex items-center justify-between bg-cyan-500/5 p-1.5 px-2.5 border border-cyan-500/10 rounded-lg">
                      <span className="text-cyan-300 font-bold">[ACTIVE] {bName}</span>
                      <span className="text-amber-400 font-bold">⏳ {getTimerString(act.upgradeEnd)}</span>
                    </div>
                  );
                })}
                {queueList.map((q, index) => {
                  const bName = q.type === 'mine'
                    ? `${q.key.toUpperCase()} Pump #${(q.mineIndex || 0) + 1}`
                    : q.key.toUpperCase();
                  return (
                    <div key={`queue-ds-${index}`} className="flex items-center justify-between bg-slate-900/30 p-1.5 px-2.5 border border-slate-800 rounded-lg">
                      <span className="text-slate-400">#{index + 1} QUEUED: {bName} &rarr; Lv. {q.targetLevel}</span>
                      <span className="text-slate-500">⏳ {q.targetLevel * (q.type === 'building' ? 2 : 1)}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Real-time alerts / Incoming or Outgoing fleets */}
        {(() => {
          const outgoing = fleets.filter((f) => f.senderId === player.id);
          const incoming = fleets.filter((f) => f.targetId === player.id && f.senderId !== player.id);
          if (outgoing.length === 0 && incoming.length === 0) return null;

          const isAttackIncoming = incoming.length > 0;
          const containerBg = isAttackIncoming 
            ? "bg-red-950/20 border-red-500/30 text-red-400" 
            : "bg-blue-950/20 border-blue-500/30 text-blue-400";
          const headerColor = isAttackIncoming ? "text-red-400 border-red-500/10" : "text-blue-400 border-blue-500/10";
          const pingDot = isAttackIncoming ? "bg-red-500 animate-ping" : "bg-blue-500 animate-pulse";

          return (
            <div className={`p-3 border rounded-xl text-left font-mono text-[10.5px] ${containerBg}`}>
              <div className={`font-black tracking-widest uppercase border-b pb-1.5 mb-1.5 flex items-center gap-1.5 ${headerColor}`}>
                <span className={`w-2 h-2 rounded-full ${pingDot}`} />
                TACTICAL RADAR TRANSITS ({incoming.length} hostile, {outgoing.length} friendly)
              </div>
              <div className="space-y-1">
                {incoming.map((f, idx) => (
                  <div key={`inc-ds-${idx}`} className="p-1.5 bg-red-950/10 border border-red-900/20 rounded-md flex items-center justify-between">
                    <span className="text-red-400 font-bold">INCOMING ATTACK from {f.senderName}</span>
                    <span className="text-amber-400 font-bold">⏳ {getTimerString(f.arrivesAt)}</span>
                  </div>
                ))}
                {outgoing.map((f, idx) => (
                  <div key={`out-ds-${idx}`} className="p-1.5 bg-blue-950/10 border border-blue-900/20 rounded-md flex items-center justify-between">
                    <span className="text-blue-300">Outgoing {f.missionType.toUpperCase()} to ({f.targetCoords.x}, {f.targetCoords.y})</span>
                    <span className="text-amber-400 font-bold">⏳ {getTimerString(f.arrivesAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tasks / Commander Tutorial */}
        <CommanderTutorial 
          player={player}
          activePlanet={activePlanet}
          fleets={fleets}
          onRefreshState={onRefreshState || (() => {})}
          showToast={showToast}
          setActiveTab={setActiveTab}
          chatMessages={chatMessages}
          customTasks={customTasks}
        />

        {/* 1. RESOURCE OUTPOSTS SECTION */}
        <div className="border border-cyan-500/20 bg-[#060913]/90 p-3 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-500/10 pb-2 mb-2 text-left">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 font-mono">
                ⛏️ RESOURCE EXTRACTOR PUMPS
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                Monitor and upgrade modular fluid extraction pumps. Expand silo storage capacity.
              </p>
            </div>
            <button
              onClick={() => handleOpenBoostModal("all", -1)}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 text-amber-400 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg transition"
            >
              ⚡ OVERDRIVE OVERALL BOOST (🪙 45)
            </button>
          </div>

          <div className="space-y-1.5">
            {resKeys.map((resKey) => {
              const info = RESOURCE_INFO[resKey];
              const config = [
                { key: 'water', label: 'Water (H2O)', icon: Droplet, textColor: 'text-cyan-400' },
                { key: 'plasma', label: 'Plasma', icon: Zap, textColor: 'text-purple-400' },
                { key: 'fuel', label: 'Fuel', icon: Flame, textColor: 'text-amber-400' },
                { key: 'food', label: 'Food', icon: Apple, textColor: 'text-emerald-400' },
                { key: 'respirant', label: 'Respirant (O2)', icon: Wind, textColor: 'text-blue-400' }
              ].find(c => c.key === resKey)!;

              const mines = activePlanet.mines[resKey] || [];
              const isOtherMaxed = 
                activePlanet.resources.plasma >= repositoryLimit &&
                activePlanet.resources.fuel >= repositoryLimit &&
                activePlanet.resources.food >= repositoryLimit &&
                activePlanet.resources.respirant >= repositoryLimit;

              const totalProd = mines.reduce((sum, m) => {
                const isMineBoosted = m.boostedUntil && Number(m.boostedUntil) > serverTime;
                const baseOutput = isOtherMaxed
                  ? 14000
                  : Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
                const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;
                return sum + output;
              }, 0);

              let consumption = 0;
              if (resKey === 'water') {
                consumption = waterConsumption;
              } else if (resKey === 'respirant') {
                consumption = waterConsumption * 0.28;
              } else if (resKey === 'food') {
                consumption = waterConsumption * 0.18;
              }
              const netOutput = totalProd - consumption;

              const isResourceExpanded = !!expandedResources[resKey];

              if (!isResourceExpanded) {
                return (
                  <div 
                    key={resKey} 
                    onClick={() => setExpandedResources(prev => ({ ...prev, [resKey]: true }))}
                    className="py-1.5 px-3 bg-[#03060c]/65 hover:bg-[#060b14]/90 border border-slate-800 hover:border-slate-700/80 rounded-lg text-left cursor-pointer transition duration-150 select-none group flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <config.icon size={13} className={`${config.textColor} group-hover:scale-110 transition-transform`} />
                      <span className={`text-[11px] font-black uppercase tracking-wider ${config.textColor}`}>{config.label}</span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(localResources[resKey]).toLocaleString()} / {formatLimit(repositoryLimit)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-[10px] w-full sm:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Hourly Rate:</span>
                        <span className={netOutput >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold animate-pulse"}>
                          {netOutput >= 0 ? "+" : ""}{Math.round(netOutput).toLocaleString()}/hr
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition" />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={resKey} className="p-2 bg-[#03060c]/65 border border-cyan-500/25 rounded-lg text-left shadow-[0_0_12px_rgba(34,211,238,0.03)]">
                  {/* Row Resource Headers */}
                  <div 
                    onClick={() => setExpandedResources(prev => ({ ...prev, [resKey]: false }))}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-900 pb-1.5 mb-1.5 cursor-pointer hover:opacity-85 select-none transition group"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <config.icon size={13} className={config.textColor} />
                      <span className={`text-[11px] font-black uppercase tracking-wider ${config.textColor} group-hover:text-cyan-400 transition`}>{config.label}</span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(localResources[resKey]).toLocaleString()} / {formatLimit(repositoryLimit)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-[10px] w-full sm:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Hourly Rate:</span>
                        <span className={netOutput >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold animate-pulse"}>
                          {netOutput >= 0 ? "+" : ""}{Math.round(netOutput).toLocaleString()}/hr
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBoostModal(resKey, -1);
                          }}
                          className="text-[9px] font-bold text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                        >
                          ⚡ Boost
                        </button>
                        <ChevronUp size={14} className="text-cyan-500 group-hover:scale-110 transition animate-pulse shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Pumps Cards inside the row (Always maximized inside expanded resource) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-1">
                    {mines.map((mine) => {
                      const isMineBoosted = mine.boostedUntil && Number(mine.boostedUntil) > serverTime;
                      const mineBaseOutput = Math.round((mine.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
                      const mineOutput = isMineBoosted ? Math.round(mineBaseOutput * 1.14) : mineBaseOutput;
                      const mineQueueCount = (activePlanet.upgradeQueue || []).filter(
                        (item: any) => item.type === 'mine' && item.key === resKey && item.mineIndex === mine.index
                      ).length;
                      const activeMineUpgradeCount = mine.isUpgrading ? 1 : 0;
                      const currentTotalMineUpgrades = activeMineUpgradeCount + mineQueueCount;
                      const nextMineTargetLvl = mine.level + currentTotalMineUpgrades + 1;
                      const nextMineUpgradeTimeMins = nextMineTargetLvl * 1;
                      const isDamaged = mine.health !== undefined && mine.health < 100;
                      const targetLevel = mine.level + currentTotalMineUpgrades + 1;

                      return (
                        <div key={mine.index} className="p-1.5 bg-black/60 border border-cyan-500/30 rounded-md flex flex-col justify-between gap-1 text-xs font-mono text-left relative shadow-[0_0_10px_rgba(34,211,238,0.05)]">
                          <div className="flex items-center justify-between border-b border-slate-950 pb-1">
                            <span className="text-[10px] font-bold text-cyan-400">Pump #{mine.index + 1}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9.5px] text-cyan-450 font-bold">
                                {mine.level === 0 ? 'Not Built' : mine.level >= maxExtractorLevel ? 'Max Cap' : `Lv. ${mine.level}`}
                              </span>
                            </div>
                          </div>

                          {/* Pump status elements */}
                          <div className="space-y-1 text-[10px] text-slate-400 text-left">
                            {isDamaged && (
                              <div className="text-red-400 font-bold animate-pulse">⚠️ Health {mine.health}%</div>
                            )}
                            {mine.isUpgrading && (
                              <div className="text-amber-400 font-bold">⏳ Upgrading...</div>
                            )}
                            {isMineBoosted && (
                              <div className="text-amber-300 font-extrabold flex items-center gap-0.5">⚡ Boosted</div>
                            )}
                            <div className="text-slate-500 text-[9px]">Rate: +{mineOutput.toLocaleString()}/h</div>
                          </div>

                          {/* Pump Cost and action button */}
                          <div className="pt-1.5 border-t border-slate-950 text-left">
                            {mine.level < maxExtractorLevel && (
                              <div className="mb-1.5 scale-90 origin-left">
                                {isDamaged ? (
                                  <RestoreCostBar type="mine" upgradeKey={resKey} targetLevel={targetLevel} health={mine.health!} planetResources={localResources} />
                                ) : (
                                  <UpgradeCostBar type="mine" upgradeKey={resKey} targetLevel={nextMineTargetLvl} planetResources={localResources} />
                                )
                                }
                              </div>
                            )}

                            {mine.isUpgrading ? (
                              <div className="flex flex-col gap-1">
                                {nextMineTargetLvl <= maxExtractorLevel && (nextMineTargetLvl < 2 || allExtractorsLevelOneOrMore) && (
                                  <button 
                                    onClick={() => onUpgradeMine(resKey, mine.index, true)}
                                    disabled={isUpgrading}
                                    className="w-full text-center py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10b981] border border-emerald-500/20 text-[9px] font-bold uppercase rounded cursor-pointer"
                                  >
                                    Queue Lv.{nextMineTargetLvl}
                                  </button>
                                )}
                                {nextMineTargetLvl <= maxExtractorLevel && nextMineTargetLvl >= 2 && !allExtractorsLevelOneOrMore && (
                                  <span className="text-[8px] font-bold text-red-400 block text-center uppercase">🔒 Extractors Req</span>
                                )}
                              </div>
                            ) : mine.level >= maxExtractorLevel && !isDamaged ? (
                              <span className="text-[9px] text-slate-500 font-bold block text-center bg-slate-900 py-0.5 rounded border border-slate-800">Max Cap</span>
                            ) : isDamaged ? (
                              <button 
                                onClick={() => handleRestoreMine(resKey, mine.index)}
                                className="w-full py-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border border-red-500 text-white font-black text-[9px] uppercase tracking-wider rounded cursor-pointer transition"
                              >
                                🔧 Repair
                              </button>
                            ) : nextMineTargetLvl >= 2 && !allExtractorsLevelOneOrMore ? (
                              <span className="text-[8.5px] font-bold text-red-400 block text-center bg-red-950/20 border border-red-500/20 py-0.5 rounded" title="All 5 resource extractor pumps must be at least Level 1.">
                                🔒 LOCKED
                              </span>
                            ) : isAnyUpgradeInProgress ? (
                              <button 
                                onClick={() => onUpgradeMine(resKey, mine.index, true)}
                                disabled={isUpgrading}
                                className="w-full py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[#10b981] font-bold text-[9px] uppercase tracking-wider rounded cursor-pointer transition flex items-center justify-center gap-1"
                              >
                                <span>Queue Lv.{nextMineTargetLvl}</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => onUpgradeMine(resKey, mine.index)}
                                disabled={isUpgrading}
                                className={`w-full py-1 font-black text-[9.5px] uppercase tracking-wider rounded transition duration-150 cursor-pointer ${
                                  mine.level === 0
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                                }`}
                              >
                                {mine.level === 0 ? `Build (${nextMineUpgradeTimeMins}m)` : `Lv.${nextMineTargetLvl} (${nextMineUpgradeTimeMins}m)`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. BASE INFRASTRUCTURE & FACILITIES */}
        <div className="border border-cyan-500/20 bg-[#060913]/90 p-3 rounded-xl shadow-lg">
          <div className="border-b border-cyan-500/10 pb-2 mb-2 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 font-mono">
              🏯 ESTABLISHED FACILITIES & PLANS
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              Construct strategic command and production grids on this outpost.
            </p>
          </div>

          <div className="space-y-1">
            {/* Table of facilities */}
            <div className="hidden md:grid grid-cols-12 gap-1 px-3 py-1.5 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-500 font-mono text-[9px] uppercase tracking-widest text-left">
              <div className="col-span-3">Facility Name</div>
              <div className="col-span-2">Level status</div>
              <div className="col-span-4">Requirements & Costs</div>
              <div className="col-span-3 text-right">Operational Actions</div>
            </div>

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
              const isFabricatorRequiredMissing = bKey !== 'fabricator' && bKey !== 'commsHub' && bKey !== 'repository' && (!activePlanet.buildings.fabricator || activePlanet.buildings.fabricator.level < 1);
              const isUpgradingThis = bState.isUpgrading;
              const isDamaged = bState.health !== undefined && bState.health < 100;

              const isExpanded = !!expandedBuildings[bKey];

              if (!isExpanded) {
                return (
                  <div 
                    key={bKey} 
                    onClick={() => setExpandedBuildings(prev => ({ ...prev, [bKey]: true }))}
                    className="py-1 px-3 bg-black/45 hover:bg-slate-900/45 border border-slate-900 hover:border-slate-800 rounded-lg transition duration-150 text-left flex items-center justify-between gap-2.5 cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg select-none shrink-0">{info.icon}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 text-xs font-mono block group-hover:text-cyan-400 transition truncate">{info.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-cyan-400 font-bold">
                        {bState.level >= bState.maxLevel ? "Max Cap" : `Lv. ${bState.level}`}
                      </span>
                      {isUpgradingThis && (
                        <span className="text-[9px] text-amber-500 font-bold animate-pulse">⏳ Upgrading</span>
                      )}
                      {isDamaged && (
                        <span className="text-[9px] text-red-500 font-bold animate-pulse">⚠️ {bState.health}% Health</span>
                      )}
                      <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition" />
                    </div>
                  </div>
                );
              }

              return (
                <div key={bKey} className="p-2 bg-black/60 border border-cyan-500/20 rounded-lg text-left flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-2 relative shadow-[0_0_12px_rgba(34,211,238,0.03)]">
                  {/* Clickable Header to collapse */}
                  <div 
                    onClick={() => setExpandedBuildings(prev => ({ ...prev, [bKey]: false }))}
                    className="col-span-3 flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition select-none w-full"
                  >
                    <span className="text-lg select-none shrink-0">{info.icon}</span>
                    <div className="min-w-0 flex-1 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-cyan-400 text-xs font-mono block truncate">{info.name}</span>
                        <p className="text-[9.5px] text-slate-450 line-clamp-1 font-sans">{info.desc}</p>
                      </div>
                      <ChevronUp size={14} className="text-cyan-500 md:hidden ml-2 shrink-0 animate-pulse" />
                    </div>
                  </div>

                  {/* Level and status */}
                  <div 
                    onClick={() => setExpandedBuildings(prev => ({ ...prev, [bKey]: false }))}
                    className="col-span-2 font-mono text-xs flex items-center justify-between md:justify-start gap-1.5 text-left w-full cursor-pointer hover:opacity-80 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-cyan-400 font-bold">
                        {bState.level >= bState.maxLevel ? "Max Cap" : `Lv. ${bState.level}`}
                      </span>
                      {isUpgradingThis && (
                        <span className="text-[9px] text-amber-500 font-bold animate-pulse">⏳ Upgrading</span>
                      )}
                      {isDamaged && (
                        <span className="text-[9px] text-red-500 font-bold animate-pulse">⚠️ {bState.health}% Health</span>
                      )}
                    </div>
                    <ChevronUp size={14} className="text-cyan-500 hidden md:inline ml-auto shrink-0 animate-pulse" />
                  </div>

                  {/* Upgrade Costs */}
                  <div className="col-span-4 scale-95 origin-left text-left">
                    {isDamaged ? (
                      <RestoreCostBar type="building" upgradeKey={bKey} targetLevel={nextTargetLvl} health={bState.health} planetResources={localResources} />
                    ) : (
                      <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={nextTargetLvl} planetResources={localResources} />
                    )}
                  </div>

                  {/* Action Grid */}
                  <div className="col-span-3 w-full flex flex-wrap md:justify-end gap-1.5 font-mono text-xs">
                    {/* Navigation shortcut */}
                    {(bKey === 'radar' || bKey === 'researchCenter' || bKey === 'armyBase' || bKey === 'commsHub') && (
                      <button
                        onClick={() => {
                          if (bKey === 'radar') {
                            localStorage.setItem(`moonbase_radar_clicked_${player.id}`, 'true');
                            setHasClickedRadar(true);
                            if (onNavigateToGalaxySubTab) {
                              onNavigateToGalaxySubTab('scanner');
                            } else {
                              setActiveTab('galaxy');
                            }
                          } else if (bKey === 'researchCenter') {
                            setActiveTab('research');
                          } else if (bKey === 'armyBase') {
                            setActiveTab('army');
                          } else if (bKey === 'commsHub') {
                            onOpenCommsHub ? onOpenCommsHub() : showToast?.('Communications hub details loaded.', 'info');
                          }
                        }}
                        className="px-2 py-1 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/20 text-cyan-400 text-[10px] font-bold rounded cursor-pointer transition flex items-center gap-1 uppercase"
                      >
                        ⚡ Open
                      </button>
                    )}

                    {isDamaged ? (
                      <button
                        onClick={() => handleRestoreBuilding(bKey)}
                        className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-500 text-[10px] font-bold uppercase rounded cursor-pointer transition"
                      >
                        🔧 Repair
                      </button>
                    ) : bState.level >= bState.maxLevel ? (
                      <span className="px-2.5 py-1 bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-bold uppercase rounded block text-center">
                        Max Cap
                      </span>
                    ) : isFabricatorRequiredMissing ? (
                      <span className="text-[8px] font-bold text-red-400 uppercase py-1 px-2 bg-red-950/20 border border-red-500/20 rounded" title="Fabricator modular structure at level 1 or higher is required.">
                        🔒 REQ FABRICATOR
                      </span>
                    ) : !((bState.level === 0 && bKey === 'fabricator') || allExtractorsLevelOneOrMore) ? (
                      <span className="text-[8px] font-bold text-red-400 uppercase py-1 px-2 bg-red-950/20 border border-red-500/20 rounded" title="All 5 resource extractor pumps must be at least Level 1.">
                        🔒 EXTRACTORS REQUISITE
                      </span>
                    ) : isAnyUpgradeInProgress ? (
                      <button
                        onClick={() => onUpgradeBuilding(bKey, true)}
                        disabled={isUpgrading}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[#10b981] text-[10px] font-bold uppercase rounded cursor-pointer transition"
                      >
                        Queue Lv.{nextTargetLvl}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpgradeBuilding(bKey)}
                        disabled={isUpgrading}
                        className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 text-slate-950 text-[10px] font-black uppercase rounded cursor-pointer transition flex items-center gap-1 shadow-[0_0_6px_rgba(34,211,238,0.2)]"
                      >
                        <span>Upgrade ({nextUpgradeTimeMins}m)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Blueprints in the same unified list */}
            {visibleBlueprints.length > 0 && (
              <>
                <div className="pt-4 border-t border-slate-900 text-left mt-4 mb-2">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#5bc0be] font-mono">
                    🏗️ Available Construction Blueprints
                  </h4>
                </div>

                {visibleBlueprints.map(([bKey, val]) => {
                  const bState = val as any;
                  const info = BUILDING_INFO[bKey];
                  if (!info) return null;

                  const targetLvl = bState.level + 1;
                  const upgradeTimeMins = targetLvl * 2;
                  const isFabricatorRequiredMissing = bKey !== 'fabricator' && bKey !== 'commsHub' && bKey !== 'repository' && (!activePlanet.buildings.fabricator || activePlanet.buildings.fabricator.level < 1);

                  const isExpanded = !!expandedBuildings[bKey];

                  if (!isExpanded) {
                    return (
                      <div 
                        key={bKey} 
                        onClick={() => setExpandedBuildings(prev => ({ ...prev, [bKey]: true }))}
                        className="py-1 px-3 bg-black/30 hover:bg-slate-900/30 border border-dashed border-slate-800 hover:border-slate-700 rounded-lg transition duration-150 text-left flex items-center justify-between gap-2.5 cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg select-none shrink-0 opacity-60">{info.icon}</span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-400 text-xs font-mono block group-hover:text-cyan-400 transition truncate">{info.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-slate-500">
                          <span>Not Built</span>
                          <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400 transition" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={bKey} className="p-2 bg-black/45 border border-dashed border-cyan-500/10 rounded-lg text-left flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-2 relative">
                      {/* Clickable Header to collapse */}
                      <div 
                        onClick={() => setExpandedBuildings(prev => ({ ...prev, [bKey]: false }))}
                        className="col-span-3 flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition select-none w-full"
                      >
                        <span className="text-lg select-none shrink-0 opacity-60">{info.icon}</span>
                        <div className="min-w-0 flex-1 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-400 text-xs font-mono block truncate">{info.name}</span>
                            <p className="text-[9.5px] text-slate-600 line-clamp-1 font-sans">{info.desc}</p>
                          </div>
                          <ChevronUp size={14} className="text-cyan-500 md:hidden ml-2 shrink-0 animate-pulse" />
                        </div>
                      </div>

                      {/* Level and status */}
                      <div 
                        onClick={() => setExpandedBuildings(prev => ({ ...prev, [bKey]: false }))}
                        className="col-span-2 font-mono text-xs flex items-center justify-between md:justify-start gap-1.5 text-slate-500 text-left w-full cursor-pointer hover:opacity-80 transition select-none"
                      >
                        <span>Not Built</span>
                        <ChevronUp size={14} className="text-cyan-500 hidden md:inline ml-auto shrink-0 animate-pulse" />
                      </div>

                      {/* Upgrade Costs */}
                      <div className="col-span-4 scale-95 origin-left opacity-80 text-left">
                        <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={1} planetResources={localResources} />
                      </div>

                      {/* Action Grid */}
                      <div className="col-span-3 w-full flex flex-wrap md:justify-end gap-1.5 font-mono text-xs">
                        {isFabricatorRequiredMissing ? (
                          <span className="text-[8px] font-bold text-red-400 uppercase py-1 px-2 bg-red-950/20 border border-red-500/20 rounded">
                            🔒 REQ FABRICATOR
                          </span>
                        ) : bKey !== 'fabricator' && !allExtractorsLevelOneOrMore ? (
                          <span className="text-[8px] font-bold text-red-400 uppercase py-1 px-2 bg-red-950/20 border border-red-500/20 rounded">
                            🔒 EXTRACTORS REQUISITE
                          </span>
                        ) : isAnyUpgradeInProgress ? (
                          <button
                            onClick={() => onUpgradeBuilding(bKey, true)}
                            disabled={isUpgrading}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[#10b981] text-[10px] font-bold uppercase rounded cursor-pointer transition"
                          >
                            Queue Const.
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpgradeBuilding(bKey)}
                            disabled={isUpgrading}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 border border-amber-400 text-slate-950 text-[10px] font-black uppercase rounded cursor-pointer transition flex items-center gap-1"
                          >
                            <span>Construct (2m)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (layoutMode === 'datasaving') {
    return renderDataSavingLayout();
  }

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
    <div className="space-y-1.5 pb-24" id="explore-tab-view">
      {/* Your Resource Count */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {[
          {
            key: 'water' as ResourceType,
            label: 'Water (H2O)',
            icon: Droplet,
            textColor: 'text-cyan-400',
            progressColor: 'bg-cyan-400',
            progressShadow: 'shadow-[0_0_6px_#22d3ee]',
            selectClass: 'bg-cyan-500/10 border-cyan-400 shadow-[inset_0_0_12px_rgba(34,211,238,0.15)]',
            tooltip: 'Water (H2O): Essential life fluid. Click to view and upgrade extractors.'
          },
          {
            key: 'plasma' as ResourceType,
            label: 'Plasma',
            icon: Zap,
            textColor: 'text-purple-400',
            progressColor: 'bg-purple-500',
            progressShadow: 'shadow-[0_0_6px_#a855f7]',
            selectClass: 'bg-purple-500/10 border-purple-500 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]',
            tooltip: 'Plasma: High-energy matter. Click to view and upgrade extractors.'
          },
          {
            key: 'fuel' as ResourceType,
            label: 'Fuel',
            icon: Flame,
            textColor: 'text-amber-400',
            progressColor: 'bg-amber-500',
            progressShadow: 'shadow-[0_0_6px_#fbbf24]',
            selectClass: 'bg-amber-500/10 border-amber-500 shadow-[inset_0_0_12px_rgba(251,191,36,0.15)]',
            tooltip: 'Fuel: Thermonuclear propulsion energy. Click to view and upgrade extractors.'
          },
          {
            key: 'food' as ResourceType,
            label: 'Food',
            icon: Apple,
            textColor: 'text-emerald-400',
            progressColor: 'bg-emerald-500',
            progressShadow: 'shadow-[0_0_6px_#10b981]',
            selectClass: 'bg-emerald-500/10 border-emerald-500 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]',
            tooltip: 'Food: Life support proteins. Click to view and upgrade extractors.'
          },
          {
            key: 'respirant' as ResourceType,
            label: 'Respirant (O2)',
            icon: Wind,
            textColor: 'text-blue-400',
            progressColor: 'bg-blue-500',
            progressShadow: 'shadow-[0_0_6px_#3b82f6]',
            selectClass: 'bg-blue-500/10 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.15)]',
            tooltip: 'Respirant (O2): Atmospheric gases. Click to view and upgrade extractors.'
          }
        ].map((config) => {
          const resKey = config.key;
          const isSelected = selectedResource === resKey;
          const info = RESOURCE_INFO[resKey];
          const mines = activePlanet.mines[resKey];

          const isOtherMaxed = 
            activePlanet.resources.plasma >= repositoryLimit &&
            activePlanet.resources.fuel >= repositoryLimit &&
            activePlanet.resources.food >= repositoryLimit &&
            activePlanet.resources.respirant >= repositoryLimit;
          
          const totalProd = mines.reduce((sum, m) => {
                const isMineBoosted = m.boostedUntil && Number(m.boostedUntil) > serverTime;
                const baseOutput = isOtherMaxed
                  ? 14000
                  : Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
                const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;
                return sum + output;
              }, 0);

          let consumption = 0;
          if (resKey === 'water') {
            consumption = waterConsumption;
          } else if (resKey === 'respirant') {
            consumption = waterConsumption * 0.28;
          } else if (resKey === 'food') {
            consumption = waterConsumption * 0.18;
          }
          const netOutput = totalProd - consumption;
          
          return (
            <div
              key={resKey}
              className={`flex flex-col bg-[#0A0F1D]/60 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 ${
                isSelected 
                  ? 'col-span-2 md:col-span-6 border-cyan-500/40 bg-[#0C1425]/75 shadow-[0_0_15px_rgba(34,211,238,0.12)] ring-1 ring-cyan-500/20' 
                  : 'border-slate-800/65 hover:border-slate-700/60'
              }`}
            >
              {/* Button */}
              <button
                type="button"
                onClick={() => setSelectedResource(isSelected ? null : resKey)}
                className={`flex w-full text-left transition duration-150 cursor-pointer select-none border-b-2 ${
                  isSelected 
                    ? `${config.selectClass} flex-col sm:flex-row sm:items-center sm:justify-between p-4.5 sm:p-5 gap-3.5` 
                    : 'border-transparent hover:bg-slate-800/20 flex-col p-4.5 sm:p-5'
                }`}
                title={config.tooltip}
              >
                {isSelected ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4.5 flex-1">
                      <div className="flex items-center gap-2">
                        <config.icon size={16} className={`${config.textColor} animate-pulse`} />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono">{config.label}</span>
                      </div>
                      
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className={`text-base font-bold ${config.textColor}`}>
                          {Math.round(localResources[resKey]).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-550 font-normal">
                          / <span className="text-white font-bold">{formatLimit(repositoryLimit)}</span>
                        </span>
                      </div>

                      <div className="w-full sm:w-32 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full ${config.progressColor} rounded-full ${config.progressShadow} transition-all duration-300`}
                          style={{ width: `${Math.min(100, (localResources[resKey] / repositoryLimit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4.5 mt-2.5 sm:mt-0 font-mono text-[10px]">
                      <div className="flex flex-col items-start sm:items-end gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Gross Rate:</span>
                          <span className="text-emerald-400">+{Math.round(totalProd).toLocaleString()}/hr</span>
                        </div>
                        {consumption > 0 && (
                          <div className="flex items-center gap-1 text-[9px]">
                            <span className="text-slate-400 font-bold">Total Output (after consumption):</span>
                            <span className={netOutput >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold animate-pulse"}>
                              {netOutput >= 0 ? "+" : ""}{Math.round(netOutput).toLocaleString()}/hr
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                        ▲ Hide
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <config.icon size={12} className={`${config.textColor} animate-pulse`} />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono">{config.label}</span>
                    </div>
                    <span className={`text-base font-mono font-bold ${config.textColor}`}>
                      {Math.round(localResources[resKey]).toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-500 font-normal">/ <span className="text-white font-bold">{formatLimit(repositoryLimit)}</span></span>
                    </span>
                    <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
                      <div 
                        className={`h-full ${config.progressColor} rounded-full ${config.progressShadow} transition-all duration-300`}
                        style={{ width: `${Math.min(100, (localResources[resKey] / repositoryLimit) * 100)}%` }}
                      />
                    </div>
                    
                    {/* Hourly yield display */}
                    <div className="mt-2.5 border-t border-slate-850/50 pt-2 text-[10px] font-mono leading-tight w-full flex justify-between items-center">
                      <span className="text-slate-500">Total Output:</span>
                      <span className={netOutput >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold animate-pulse"}>
                        {netOutput >= 0 ? "+" : ""}{Math.round(netOutput).toLocaleString()}/h
                      </span>
                    </div>

                    <span className="text-[8.5px] font-mono text-slate-500 mt-2.5 uppercase tracking-wider block font-bold">
                      ▼ Click to manage
                    </span>
                  </>
                )}
              </button>

              {/* Render details inline if selected */}
              {isSelected && (() => {
                return (
                  <div className="p-5 border-t border-cyan-500/20 text-left animate-fade-in bg-black/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-cyan-500/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${info.color} shadow-inner bg-black/40`}>
                          <config.icon size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 font-mono">
                            {info.name} Extractors & Upgrades
                          </h3>
                          <div className="text-xs text-slate-450 font-mono mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-300">Base Yield: <strong className="text-emerald-400">+{totalProd.toLocaleString()}/hr</strong></span>
                            {consumption > 0 && (
                              <>
                                <span className="text-red-400 font-bold border-l border-slate-700 pl-2">Troop Consumption: -{Math.round(consumption).toLocaleString()}/hr</span>
                                <span className={`font-black border-l border-slate-700 pl-2 ${netOutput >= 0 ? "text-emerald-400" : "text-red-400 animate-pulse bg-red-950/30 px-1.5 py-0.5 rounded"}`}>
                                  Total Output (after consumption): {netOutput >= 0 ? "+" : ""}{Math.round(netOutput).toLocaleString()}/hr
                                </span>
                              </>
                            )}
                            <span className="text-slate-500 border-l border-slate-700 pl-2">|</span>
                            <span className="text-slate-400">Max level: <strong className="text-white">{maxExtractorLevel}</strong></span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBoostModal(resKey, -1);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-mono font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                        type="button"
                      >
                        ⚡ Boost All {info.name} (🪙 45)
                      </button>
                    </div>

                    <div className="space-y-3">
                      {mines.map((mine) => {
                        const isMineBoosted = mine.boostedUntil && Number(mine.boostedUntil) > serverTime;
                        const mineBaseOutput = Math.round((mine.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
                        const mineOutput = isMineBoosted ? Math.round(mineBaseOutput * 1.14) : mineBaseOutput;
                        const mineQueueCount = (activePlanet.upgradeQueue || []).filter(
                          (item: any) => item.type === 'mine' && item.key === resKey && item.mineIndex === mine.index
                        ).length;
                        const activeMineUpgradeCount = mine.isUpgrading ? 1 : 0;
                        const currentTotalMineUpgrades = activeMineUpgradeCount + mineQueueCount;
                        const nextMineTargetLvl = mine.level + currentTotalMineUpgrades + 1;
                        const nextMineUpgradeTimeMins = nextMineTargetLvl * 1;
                        const isDamaged = mine.health !== undefined && mine.health < 100;
                        const targetLevel = mine.level + currentTotalMineUpgrades + 1;
                        
                        return (
                          <div 
                            key={mine.index}
                            className="p-3.5 bg-[#05070A]/55 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0 font-sans">
                              <div className="flex items-center gap-2 flex-wrap font-mono">
                                <span className="font-bold text-sm text-white">
                                  {info.name} Pump #{mine.index + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-[#5bc0be] border border-slate-800">
                                  {mine.level === 0 ? 'Not Constructed' : `Level ${mine.level} / ${maxExtractorLevel}`}
                                </span>
                                {isMineBoosted && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse flex items-center gap-1">
                                    <Zap size={9} /> BOOSTED ({getTimerString(mine.boostedUntil)})
                                  </span>
                                )}
                                {isDamaged && (
                                  <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-[9px] font-bold animate-pulse">
                                    ⚠️ DAMAGED: {mine.health}% Health
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-[11px] text-slate-400 font-sans leading-normal">
                                Yield output rate: <strong className="text-emerald-400">+{mineOutput.toLocaleString()}/hr</strong> (Base: +{mineBaseOutput.toLocaleString()}/hr)
                              </div>
                              
                              {mine.level < maxExtractorLevel && (
                                isDamaged ? (
                                  <RestoreCostBar type="mine" upgradeKey={resKey} targetLevel={targetLevel} health={mine.health!} planetResources={localResources} />
                                ) : (
                                  <UpgradeCostBar type="mine" upgradeKey={resKey} targetLevel={nextMineTargetLvl} planetResources={localResources} />
                                )
                              )}
                              
                              {(() => {
                                const specificMineQueue = (activePlanet.upgradeQueue || []).filter(
                                  (item: any) => item.type === 'mine' && item.key === resKey && item.mineIndex === mine.index
                                );
                                if (specificMineQueue.length === 0) return null;
                                return (
                                  <div className="mt-2 space-y-1 p-2 bg-slate-950/40 border border-[#1E293B]/60 rounded-lg max-w-sm font-mono">
                                    <div className="text-[9px] text-[#5bc0be] uppercase tracking-wider font-extrabold">Queued Upgrades:</div>
                                    {specificMineQueue.map((q, idx) => (
                                      <div key={idx} className="text-[10px] text-slate-400 flex items-center justify-between gap-4">
                                        <span className="text-slate-450">
                                          ↳ {q.targetLevel === 1 ? 'Construct to Level 1' : `Upgrade to Level ${q.targetLevel}`}
                                        </span>
                                        <span className="text-amber-400 font-bold">⏳ {q.targetLevel * 1}m</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="font-mono text-xs shrink-0">
                              {mine.isUpgrading ? (
                                <div className="flex flex-col sm:items-end gap-1.5">
                                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                                    <Clock size={12} className="animate-spin" />
                                    <span>{mine.level === 0 ? 'Constructing' : 'Upgrading'} {getTimerString(mine.upgradeEnd)}</span>
                                  </div>
                                  {nextMineTargetLvl <= maxExtractorLevel && (nextMineTargetLvl < 2 || allExtractorsLevelOneOrMore) && (
                                    <button 
                                      onClick={() => onUpgradeMine(resKey, mine.index, true)}
                                      disabled={isUpgrading}
                                      className="px-3 py-1.5 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-[#10b981]/35 rounded-xl transition duration-150 cursor-pointer text-[9px] font-bold uppercase flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      <span className="text-emerald-400">{nextMineTargetLvl === 1 ? 'Queue Construction' : 'Queue Upgrade'}</span>
                                      <span className="text-amber-400 font-extrabold">(Lv. {nextMineTargetLvl})</span>
                                    </button>
                                  )}
                                  {nextMineTargetLvl <= maxExtractorLevel && nextMineTargetLvl >= 2 && !allExtractorsLevelOneOrMore && (
                                    <span className="text-[9px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 px-2 py-1 rounded mt-1 block text-center" title="All 5 resource extractor pumps must be at least Level 1.">
                                      🔒 EXTRACTORS REQUISITE (Lv 1)
                                    </span>
                                  )}
                                </div>
                              ) : mine.level >= maxExtractorLevel && !isDamaged ? (
                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase bg-slate-900 border border-slate-850 px-2 py-1 rounded">MAX CAP</span>
                              ) : isDamaged ? (
                                <button 
                                  onClick={() => onUpgradeMine(resKey, mine.index)}
                                  disabled={isUpgrading}
                                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border border-red-400 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-[1.03] disabled:opacity-50"
                                >
                                  🔧 Repair Pump
                                </button>
                              ) : nextMineTargetLvl >= 2 && !allExtractorsLevelOneOrMore ? (
                                <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 px-3 py-1.5 rounded" title="All 5 resource extractor pumps must be at least Level 1.">
                                  🔒 EXTRACTORS REQUISITE
                                </span>
                              ) : isAnyUpgradeInProgress ? (
                                <button 
                                  onClick={() => onUpgradeMine(resKey, mine.index, true)}
                                  disabled={isUpgrading}
                                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/35 text-emerald-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <span>{nextMineTargetLvl === 1 ? 'Queue Construction' : 'Queue Upgrade'}</span>
                                  <span className="text-amber-400 font-extrabold">(Lv. {nextMineTargetLvl})</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => onUpgradeMine(resKey, mine.index)}
                                  disabled={isUpgrading}
                                  className={`px-4 py-2 border font-black text-[10.5px] uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer hover:scale-[1.03] disabled:opacity-50 disabled:pointer-events-none ${
                                    mine.level === 0
                                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.55)]'
                                      : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.55)]'
                                  }`}
                                >
                                  {mine.level === 0 ? (
                                    <>⚡ Construct Extractor <span className="text-slate-900 font-bold ml-1">({nextMineUpgradeTimeMins}m)</span></>
                                  ) : (
                                    <>⚡ Upgrade Extractor <span className="text-slate-900 font-bold ml-1">({nextMineUpgradeTimeMins}m)</span></>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Production Boost Tile (Standalone Card) */}
        <div className="flex flex-col bg-[#0A0F1D]/60 backdrop-blur-sm border border-slate-800/65 rounded-xl overflow-hidden hover:border-slate-700/60 transition-all duration-300">
          <button
            type="button"
            onClick={() => handleOpenBoostModal("all", -1)}
            className="flex-1 flex flex-col justify-center items-center p-4.5 sm:p-5 bg-amber-500/5 hover:bg-amber-500/15 transition cursor-pointer select-none hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] border-b-2 border-transparent w-full text-center"
            title="Overdrive Production Boost: Boost all resource extractors on this station."
          >
            <Zap size={16} className="text-amber-400 animate-bounce mb-1" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400 font-mono">Production Boost</span>
            <span className="text-[11px] font-bold text-amber-300 font-mono mt-1 uppercase tracking-wider">OVERDRIVE</span>
          </button>
        </div>
      </div>

      {isRedAlertActive && (
        <div className="p-3.5 border border-red-900/50 bg-red-950/30 text-red-400 rounded-xl flex items-start gap-2.5 text-xs animate-pulse text-left" title="Critical Alert: High severity base warning">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce text-red-500" />
          <div>
            <p className="font-bold uppercase tracking-widest text-[10px]">CRITICAL NEGATIVE PRODUCTION (ATTRITION PASSIVE)</p>
            <p className="text-red-300/80 leading-relaxed mt-0.5">Troops are suffering rapid attrition due to negative production! Upgrade resource extractors immediately if they are maxed and you don't want to lose troops, raid the resources!</p>
          </div>
        </div>
      )}

      {isOrangeAlertActive && (
        <div className="p-3.5 border border-amber-500/30 bg-amber-500/5 text-amber-500 rounded-xl flex items-start gap-2.5 text-xs animate-pulse text-left" title="Imminent Warning: Medium severity base warning">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce text-amber-500" />
          <div>
            <p className="font-bold uppercase tracking-widest text-[10px]">CRITICAL NEGATIVE PRODUCTION (ATTRITION PASSIVE)</p>
            <p className="text-amber-300/80 leading-relaxed mt-0.5">Troops are going to suffer rapid attrition due to negative production within the next 3 hours! Upgrade resource extractors immediately if they are maxed and you don't want to lose troops, raid the resources!</p>
          </div>
        </div>
      )}

      {/* Real-Time Fleets list (auto-populates if movements) */}
      {(() => {
        const outgoingFleets = fleets.filter((f) => f.senderId === player.id);
        const incomingFleets = fleets.filter(
          (f) => f.targetId === player.id && f.senderId !== player.id
        );

        if (outgoingFleets.length === 0 && incomingFleets.length === 0) {
          return null;
        }

        return (
          <div className="border border-[#1E293B] bg-[#0A0F1D]/80 backdrop-blur-md rounded-xl overflow-hidden mt-4">
            <div 
              onClick={() => setIsRadarTransitsMinimized(!isRadarTransitsMinimized)}
              className="p-5 border-b border-[#1E293B]/70 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer select-none hover:bg-black/50 transition duration-150"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
                  Real-Time Fleet Radar Transits
                  <span className="text-[9px] font-extrabold text-slate-500 bg-[#0A0F1D] border border-slate-800 px-1.5 py-0.5 rounded uppercase font-mono">
                    {isRadarTransitsMinimized ? "Minimized" : "Active"}
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] bg-[#05070A] text-slate-400 border border-[#1E293B] px-2.5 py-1 rounded-lg font-bold font-mono">
                  ACTIVE FLIGHTS: {outgoingFleets.length + incomingFleets.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRadarTransitsMinimized(!isRadarTransitsMinimized)}
                  className="p-1 px-2.5 text-[9px] font-extrabold font-mono uppercase bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/25 hover:border-cyan-400 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 select-none"
                  title={isRadarTransitsMinimized ? "Maximize Radar Transits" : "Minimize Radar Transits"}
                >
                  {isRadarTransitsMinimized ? (
                    <>
                      <ChevronDown size={10} />
                      <span>EXPAND</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp size={10} />
                      <span>MINIMIZE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isRadarTransitsMinimized && (
              <div className="p-5 bg-black/20 space-y-5 animate-fade-in">
                {/* INCOMING RADAR FLARES/ATTACKS */}
                {incomingFleets.length > 0 && (
                  <div className="space-y-3">
                    <div 
                      onClick={() => setIsRadarIncomingMinimized(!isRadarIncomingMinimized)}
                      className="flex items-center justify-between cursor-pointer select-none pb-1 border-b border-red-500/20"
                    >
                      <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase font-mono flex items-center gap-1.5 animate-pulse text-left">
                        <ShieldAlert size={12} className="text-red-400" />
                        Warning: Incoming Military Signatures ({incomingFleets.length})
                      </span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setIsRadarIncomingMinimized(!isRadarIncomingMinimized); }}
                        className="text-[9px] font-bold font-mono text-slate-400 hover:text-white px-2 py-0.5 border border-[#1E293B] bg-[#05070A] rounded hover:bg-white/5 cursor-pointer"
                      >
                        {isRadarIncomingMinimized ? 'EXPAND 🔽' : 'MINIMIZE 🔼'}
                      </button>
                    </div>

                    {!isRadarIncomingMinimized && (
                      <div className="space-y-3 font-mono text-xs">
                        {incomingFleets.map((fleet) => {
                          const totalDuration = fleet.arrivesAt - fleet.startedAt;
                          const elapsed = Math.max(0, serverTime - fleet.startedAt);
                          const progressPercent = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
                          const secsRemaining = Math.max(0, Math.ceil((fleet.arrivesAt - serverTime) / 1000));

                          return (
                            <div key={fleet.id} className="p-4 border border-red-900/35 bg-red-950/10 rounded-xl space-y-3 text-left">
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
                    )}
                  </div>
                )}

                {/* OUTGOING TROOPS */}
                {outgoingFleets.length > 0 && (
                  <div className="space-y-3">
                    <div 
                      onClick={() => setIsRadarOutgoingMinimized(!isRadarOutgoingMinimized)}
                      className="flex items-center justify-between cursor-pointer select-none pb-1 border-b border-cyan-500/20"
                    >
                      <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase font-mono flex items-center gap-1.5 text-left">
                        Your Dispatched Troops ({outgoingFleets.length})
                      </span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setIsRadarOutgoingMinimized(!isRadarOutgoingMinimized); }}
                        className="text-[9px] font-bold font-mono text-slate-400 hover:text-white px-2 py-0.5 border border-[#1E293B] bg-[#05070A] rounded hover:bg-white/5 cursor-pointer"
                      >
                        {isRadarOutgoingMinimized ? 'EXPAND 🔽' : 'MINIMIZE 🔼'}
                      </button>
                    </div>

                    {!isRadarOutgoingMinimized && (
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
                              className={`p-4 border rounded-xl space-y-3 transition duration-150 text-left ${
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
                                  <span className="text-slate-400 block mt-2 text-[11px]">
                                    Target Coord: {fleet.targetName} [{fleet.targetCoords.x}, {fleet.targetCoords.y}]
                                  </span>
                                </div>
                                <div className="text-right">
                                  {fleet.isWaitingToSettle ? (
                                    <span className="text-emerald-400 font-extrabold text-xs block animate-bounce font-mono">SECURED &bull; READY</span>
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
                                    <span key={tId} className="bg-[#0A0F1D] border border-[#1E293B] px-1.5 py-0.5 rounded uppercase font-bold text-slate-350 font-mono">
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
                                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] transition text-black font-extrabold uppercase tracking-wider text-[11px] rounded-lg animate-pulse cursor-pointer"
                                  >
                                    ⚡ CLICK HERE TO SETTLE ON PLANET
                                  </button>
                                </div>
                              )}

                              {/* Recall, Cancel & Move Action Buttons */}
                              {!fleet.isReturning && (
                                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                  {fleet.isWaitingToSettle ? (
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onCancelFleet) onCancelFleet(fleet.id);
                                        }}
                                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold uppercase text-[10px] rounded-lg transition cursor-pointer text-center"
                                      >
                                        ↩ Recall Troops
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReroutingFleetId(fleet.id);
                                          setRerouteX('');
                                          setRerouteY('');
                                        }}
                                        className="py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-bold uppercase text-[10px] rounded-lg transition cursor-pointer text-center"
                                      >
                                        📍 Move planet
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                      {(() => {
                                        const totalDuration = fleet.arrivesAt - fleet.startedAt;
                                        const elapsed = serverTime - fleet.startedAt;
                                        const progressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
                                        const isAttack = fleet.missionType === 'attack';
                                        const cannotRecallAttack = isAttack && progressPercent > 45;

                                        return (
                                          <>
                                            <button
                                              type="button"
                                              disabled={cannotRecallAttack}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onCancelFleet) onCancelFleet(fleet.id);
                                              }}
                                              className={`py-1.5 px-3 font-bold uppercase text-[10px] rounded-lg transition border text-center ${
                                                cannotRecallAttack
                                                  ? 'bg-red-950/40 text-red-500 border-red-950 cursor-not-allowed'
                                                  : 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-500/30 cursor-pointer'
                                              }`}
                                            >
                                              {cannotRecallAttack ? `🚫 Locked (${Math.round(progressPercent)}%)` : '🛑 Abort Mission'}
                                            </button>
                                            <button
                                              type="button"
                                              disabled={cannotRecallAttack}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setReroutingFleetId(fleet.id);
                                                setRerouteX('');
                                                setRerouteY('');
                                              }}
                                              className={`py-1.5 px-3 font-bold uppercase text-[10px] rounded-lg transition border text-center ${
                                                cannotRecallAttack
                                                  ? 'bg-slate-950/40 text-slate-500 border-slate-900 cursor-not-allowed'
                                                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/25 cursor-pointer'
                                              }`}
                                            >
                                              📍 Reroute
                                            </button>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {reroutingFleetId === fleet.id && (
                                    <div className="p-3 bg-slate-950/90 border border-[#1E293B] rounded-lg space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                                      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Set New Flight Vectors</p>
                                      <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                          <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Coord X</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={maxCoord}
                                            value={rerouteX}
                                            onChange={(e) => setRerouteX(e.target.value)}
                                            placeholder={`0-${maxCoord}`}
                                            className="w-full bg-[#05070A] border border-slate-800 text-cyan-400 rounded px-2 py-1 text-xs text-center font-bold"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Coord Y</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={maxCoord}
                                            value={rerouteY}
                                            onChange={(e) => setRerouteY(e.target.value)}
                                            placeholder={`0-${maxCoord}`}
                                            className="w-full bg-[#05070A] border border-slate-800 text-cyan-400 rounded px-2 py-1 text-xs text-center font-bold"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const tx = parseInt(rerouteX, 10);
                                            const ty = parseInt(rerouteY, 10);
                                            if (isNaN(tx) || isNaN(ty) || tx < 0 || tx > maxCoord || ty < 0 || ty > maxCoord) {
                                              if (showToast) showToast(`Invalid coordinates (0-${maxCoord} allowed)`, 'error');
                                              return;
                                            }
                                            if (onRerouteFleet) {
                                              await onRerouteFleet(fleet.id, tx, ty);
                                              setReroutingFleetId(null);
                                            }
                                          }}
                                          className="flex-1 py-1 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded font-bold uppercase text-[10px] cursor-pointer"
                                        >
                                          Confirm Jump
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setReroutingFleetId(null)}
                                          className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded font-bold uppercase text-[10px] cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Tasks / Commander Tutorial */}
      <CommanderTutorial 
        player={player}
        activePlanet={activePlanet}
        fleets={fleets}
        onRefreshState={onRefreshState || (() => {})}
        showToast={showToast}
        setActiveTab={setActiveTab}
        chatMessages={chatMessages}
        customTasks={customTasks}
      />

      {/* Interactive Construction Queue Dashboard */}
        {(() => {
          const queueList = (activePlanet.upgradeQueue || []).filter((item: any) => item.type !== 'research');
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

      {/* base buildings infrastructure */}
      <div className="border border-cyan-500/30 bg-[#060913]/90 p-5 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.1)] ring-1 ring-cyan-500/10 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)] transition duration-300">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-cyan-500/20 pb-4 text-left">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 text-[9px] font-bold animate-pulse">🏯 INFRASTRUCTURE</span>
              Established Structures
            </h3>
            <p className="text-[10px] text-slate-400/80 font-sans leading-relaxed">
              Sovereign base facilities, resource repositories, and command matrices constructed on this site.
            </p>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto uppercase tracking-wide">
            {constructedBuildings.length} active facilities
          </span>
        </div>

        {!allExtractorsLevelOneOrMore && (
          <div className="mb-5 p-4 bg-red-950/20 border border-red-500/35 rounded-xl text-left space-y-2 font-mono">
            <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-wider">
              <AlertTriangle size={14} className="text-red-500" />
              <span>Advanced Construction Projects Locked (Lvl 2+)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Admiral, advanced station systems are locked. <span className="text-red-400 font-bold">You cannot upgrade any facility or resource extractor pump to Level 2 or higher</span> until all 5 resource extractor pumps (Water, Plasma, Fuel, Food, and Respirant) have been constructed to at least <span className="text-[#5bc0be] font-bold">Level 1</span> on this station.
            </p>
            <div className="text-[10px] text-slate-400 font-sans pt-0.5">
              Please scroll up to the <span className="text-[#5bc0be] font-bold">Resource Extractor Outposts</span> grid and construct any level 0 extractor pumps first!
            </div>
          </div>
        )}

        {showStructures && (
          <div className="space-y-3.5">
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

              // Left accent color depending on status
              const statusAccentClass = bState.health !== undefined && bState.health < 100
                ? 'border-l-[3px] border-l-red-500'
                : bState.isUpgrading
                ? 'border-l-[3px] border-l-amber-500'
                : 'border-l-[3px] border-l-cyan-500/50';

              return (
                <div 
                  key={bKey}
                  className={`border rounded-xl bg-[#03060C]/90 border-slate-800 hover:border-slate-700/80 overflow-hidden transition-all duration-200 shadow-md ${statusAccentClass} ${
                    bKey === 'radar' && !hasClickedRadar
                      ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse'
                      : ''
                  }`}
                  id={`building_${bKey}`}
                >
                  {/* Building Trigger Header Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (bKey === 'radar') {
                        localStorage.setItem(`moonbase_radar_clicked_${player.id}`, 'true');
                        setHasClickedRadar(true);
                        if (onNavigateToGalaxySubTab) {
                          onNavigateToGalaxySubTab('scanner');
                        } else {
                          setActiveTab('galaxy');
                        }
                      } else if (bKey === 'researchCenter') {
                        setActiveTab('research');
                      } else if (bKey === 'armyBase') {
                        setActiveTab('army');
                      } else if (bKey === 'commsHub') {
                        if (onOpenCommsHub) {
                          onOpenCommsHub();
                        } else {
                          setExpandedBuilding(isExpanded ? null : bKey);
                        }
                      } else {
                        setExpandedBuilding(isExpanded ? null : bKey);
                      }
                    }}
                    className="w-full p-4 flex items-center justify-between text-left transition hover:bg-white/[0.01] gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3.5 rounded-xl bg-[#010408] border border-slate-800 text-2xl font-sans text-center shrink-0 shadow-lg select-none">
                        {info.icon}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-slate-100 text-sm font-mono truncate">{info.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                            bState.level === 0 
                              ? 'bg-slate-950 text-slate-500 border-slate-800' 
                              : 'bg-cyan-950/30 text-cyan-400 border-cyan-900/40'
                          }`}>
                            Lv. {bState.level} / {bState.maxLevel} {bState.level === 0 && '(Unconstructed)'}
                          </span>
                          {bState.health !== undefined && bState.health < 100 && (
                            <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-[9px] font-mono font-bold animate-pulse">
                              ⚠️ DAMAGED: {bState.health}% Health
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans line-clamp-1">{info.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {bState.isUpgrading && (
                        <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/35 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                          {bState.level === 0 ? 'CONSTRUCTING' : 'UPGRADING'} {getTimerString(bState.upgradeEnd)}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-red-500 cursor-pointer" />
                      ) : (
                        <ChevronDown size={16} className="text-emerald-500 cursor-pointer" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Building Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-850 p-4 bg-slate-950/25 space-y-4 animate-fade-in text-left">
                      {!((bState.level === 0 && bKey === 'fabricator') || allExtractorsLevelOneOrMore) && (
                        <div className="p-3 border border-red-500/20 bg-red-950/40 rounded-xl text-red-400 text-xs font-mono text-left space-y-1">
                          <div className="font-extrabold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">⚠️ EXTRACTORS REQUISITE MISSING</div>
                          <p className="text-[10.5px] text-slate-300 font-sans leading-relaxed">
                            All 5 resource extractor types must be at least <span className="text-[#5bc0be] font-bold">Level 1</span> before you can build or upgrade base facilities!
                          </p>
                        </div>
                      )}

                      {isFabricatorRequiredMissing && (
                        <div className="p-3 border border-red-500/20 bg-red-950/40 rounded-xl text-red-400 text-xs font-mono text-left">
                          ⚠️ REQUIREMENT: A Fabricator at level 1 or higher is required to construct or upgrade this structure. Please construct/upgrade the Fabricator modular structure first!
                        </div>
                      )}

                      {/* Main card dashboard content */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Side: Capabilities & Information */}
                        <div className="space-y-3.5 bg-black/20 p-3.5 border border-slate-800/60 rounded-xl">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Structure Specifications</span>
                          
                          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{info.desc}</p>
                          
                          {bState.level < bState.maxLevel && (
                            <div className="select-none">
                              <span className="text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-900/30 px-2 py-0.5 rounded text-[9px] font-mono inline-flex items-center gap-1.5" title="Every building upgrade increases your account population score by 30 points">
                                🌾 Population: +30 Rating points
                              </span>
                            </div>
                          )}

                          {bKey === 'repository' && (
                            <div className="text-[11px] text-cyan-400 font-mono font-bold">
                              Current Store Capacity Limit: <span className="text-white bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded font-bold">{(Math.round(10000 * Math.pow(500, (bState.level - 1) / 44))).toLocaleString()}</span> units per resource
                            </div>
                          )}

                          {bKey === 'bunker' && (
                            <div className="text-[11px] text-[#5bc0be] font-mono font-bold flex flex-col gap-1.5">
                              <div>
                                Current Protected Resource Limit: <span className="text-white bg-teal-950/40 border border-teal-800/30 px-1.5 py-0.5 rounded font-bold">{Math.round(500000 * (bState.level / 25)).toLocaleString()}</span> units of each type
                              </div>
                              {bState.level < 25 && (
                                <div className="text-[10px] text-slate-400 font-sans font-normal">
                                  ↳ Next Level Protection: <strong className="text-emerald-400">{Math.round(500000 * ((bState.level + 1) / 25)).toLocaleString()}</strong> units
                                </div>
                              )}
                            </div>
                          )}

                          {bKey === 'magneticShield' && (
                            <div className="text-[11px] text-[#5bc0be] font-mono font-bold flex flex-col gap-1.5">
                              <div>
                                Disruptor Building Damage Reduction: <span className="text-white bg-teal-950/40 border border-teal-800/30 px-1.5 py-0.5 rounded font-bold">{(bState.level * 2.5).toFixed(1)}%</span>
                              </div>
                              {bState.level < 12 && (
                                <div className="text-[10px] text-slate-400 font-sans font-normal">
                                  ↳ Next Level Reduction: <strong className="text-emerald-400">{((bState.level + 1) * 2.5).toFixed(1)}%</strong>
                                </div>
                              )}
                            </div>
                          )}

                          {bKey === 'commsHub' && alliances && playersList && (
                            <CommunicationsHubDetail
                              player={player}
                              alliances={alliances}
                              playersList={playersList}
                              chatMessages={chatMessages}
                              onSendChat={onSendChat}
                              onCreateAlliance={onCreateAlliance || (async () => {})}
                              onJoinAlliance={onJoinAlliance || (async () => {})}
                              onLeaveAlliance={onLeaveAlliance || (async () => {})}
                              onDeclareWar={onDeclareWar || (async () => {})}
                              onViewPlayerProfile={onViewPlayerProfile}
                              showToast={showToast}
                              onRefreshState={onRefreshState}
                            />
                          )}

                          {bKey === 'supplyNexus' && (
                            <div className="space-y-4 text-xs">
                              <div className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                                Supply Nexus Status: <span className="text-white bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded font-bold">Trading Network Link Level {bState.level}</span>
                              </div>
                              <div className="font-sans text-[11px] text-slate-450 bg-slate-950/60 p-2.5 border border-[#1E293B]/60 rounded-lg max-w-md">
                                🌌 <span className="font-bold text-slate-350">Quantum Cargo Link:</span> Wire resources directly to other planets in the sector. Enter coordinates manually or select from your colonized space stations.
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
                                                  value={transferResources[resKey] === '0' || transferResources[resKey] === '' ? '' : transferResources[resKey]}
                                                  placeholder="0"
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
                                          if (useCoords) {
                                            if (!transferCoords.x || !transferCoords.y) {
                                              showToast?.('Please specify target sector coordinates!', 'error');
                                              return;
                                            }
                                            const txVal = parseInt(transferCoords.x, 10);
                                            const tyVal = parseInt(transferCoords.y, 10);
                                            if (isNaN(txVal) || isNaN(tyVal) || txVal < 0 || txVal > maxCoord || tyVal < 0 || tyVal > maxCoord) {
                                              showToast?.(`Coordinates must be within universe boundaries (0-${maxCoord} allowed)!`, 'error');
                                              return;
                                            }
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
                                              localStorage.setItem(`moonbase_resources_sent_${player.id}`, 'true');
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
                        </div>

                        {/* Right Side: Upgrade Cost / Requirements & Primary Action */}
                        <div className="space-y-4 bg-black/20 p-3.5 border border-slate-800/60 rounded-xl flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block font-mono">Resource & Construction Requisites</span>
                            {bState.level < bState.maxLevel && (
                              <div className="pt-1.5">
                                <span className="text-[10px] font-mono text-slate-400 block mb-1">Upgrade Costs for Level {nextTargetLvl}:</span>
                                {bState.health !== undefined && bState.health < 100 ? (
                                  <RestoreCostBar type="building" upgradeKey={bKey} targetLevel={nextTargetLvl} health={bState.health} planetResources={localResources} />
                                ) : (
                                  <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={nextTargetLvl} planetResources={localResources} />
                                )}
                              </div>
                            )}

                            {/* Construction Queue Sub-section */}
                            {(() => {
                              const specificBuildingQueue = (activePlanet.upgradeQueue || []).filter(
                                (item: any) => item.type === 'building' && item.key === bKey
                              );
                              if (specificBuildingQueue.length === 0) return null;
                              return (
                                <div className="mt-3.5 space-y-1 p-2 bg-[#02050b] border border-[#1E293B]/60 rounded-lg font-mono">
                                  <div className="text-[9px] text-[#5bc0be] uppercase tracking-wider font-extrabold">Queued Upgrades:</div>
                                  {specificBuildingQueue.map((q, idx) => (
                                    <div key={idx} className="text-[10px] text-slate-400 flex items-center justify-between gap-4">
                                      <span className="text-slate-450">↳ Upgrade to Level {q.targetLevel}</span>
                                      <span className="text-amber-400 font-bold">⏳ {q.targetLevel * 2}m</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-2.5">
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-450">
                              <span>Action Control Terminal:</span>
                              <span className="text-cyan-400 font-bold">STATUS // SECURE</span>
                            </div>

                            {bState.isUpgrading ? (
                              <div className="flex flex-col items-stretch gap-1.5 font-mono">
                                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 bg-amber-950/20 py-2 border border-amber-500/20 rounded-xl" title="Building progress in progress. Countdown until build completion.">
                                  <Clock size={12} className="animate-spin" />
                                  <span className="font-bold text-[10px] uppercase tracking-wider">{bState.level === 0 ? 'CONSTRUCTING' : 'UPGRADING'} ({getTimerString(bState.upgradeEnd)})</span>
                                </div>
                                {nextTargetLvl <= bState.maxLevel && (
                                  ((nextTargetLvl < 2 && bKey === 'fabricator') || allExtractorsLevelOneOrMore) ? (
                                    <button 
                                      onClick={() => onUpgradeBuilding(bKey, true)}
                                      disabled={isUpgrading}
                                      className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                      type="button"
                                    >
                                      <span className="text-emerald-400">Queue Upgrade</span>
                                      <span className="text-amber-400 font-extrabold">(Lv. {nextTargetLvl}, {nextUpgradeTimeMins}m)</span>
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 px-2.5 py-2 rounded mt-1 text-center" title="All 5 resource extractor pumps must be at least Level 1.">
                                      🔒 EXTRACTORS REQUISITE
                                    </span>
                                  )
                                )}
                              </div>
                            ) : !((nextTargetLvl < 2 && bKey === 'fabricator') || allExtractorsLevelOneOrMore) ? (
                              <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 py-2.5 rounded text-center" title="All 5 resource extractor pumps must be at least Level 1.">
                                🔒 EXTRACTORS REQUISITE (Lv 1)
                              </span>
                            ) : isFabricatorRequiredMissing ? (
                              <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 py-2.5 rounded text-center" title="Fabricator modular structure at level 1 or higher is required.">
                                🔒 FABRICATOR REQUIRED
                              </span>
                            ) : bState.level >= bState.maxLevel && !(bState.health !== undefined && bState.health < 100) ? (
                              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono bg-slate-900 border border-slate-850 py-2.5 rounded text-center">MAX CAPACITY</span>
                            ) : bState.health !== undefined && bState.health < 100 ? (
                              <button 
                                onClick={() => handleRestoreBuilding(bKey)}
                                disabled={restoringKeys[`building-${bKey}`]}
                                className="w-full py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                type="button"
                              >
                                <span>{restoringKeys[`building-${bKey}`] ? 'REPAIRING...' : '🛠️ RESTORE BUILDING'}</span>
                              </button>
                            ) : isAnyUpgradeInProgress ? (
                              <button 
                                onClick={() => onUpgradeBuilding(bKey, true)}
                                disabled={isUpgrading}
                                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                type="button"
                              >
                                <span className="text-emerald-400">{bState.level === 0 ? 'QUEUE CONSTRUCTION' : 'QUEUE UPGRADE'}</span>
                                <span className="text-amber-400 font-extrabold">(Lv. {nextTargetLvl}, {nextUpgradeTimeMins}m)</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => onUpgradeBuilding(bKey)}
                                disabled={isUpgrading}
                                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 hover:shadow-[0_0_15px_rgba(34,211,238,0.45)] rounded-xl transition duration-150 font-mono text-[10.5px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                type="button"
                              >
                                <span>{bState.level === 0 ? 'CONSTRUCT' : 'UPGRADE'}</span>
                                <span className="text-slate-900 font-normal ml-1">({upgradeTimeMins}m)</span>
                              </button>
                            )}
                          </div>
                        </div>
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
          <div className="mt-7 pt-7 border-t border-slate-800 text-left">
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
                    className={`border border-dashed rounded-xl bg-[#03060C]/40 hover:border-cyan-500/50 transition duration-150 ${
                      bKey === 'radar' && !hasClickedRadar
                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse'
                        : 'border-slate-800'
                    }`}
                    id={`blueprint_${bKey}`}
                  >
                    <div className="p-4 flex items-center justify-between text-left gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2.5 rounded-lg bg-[#010408] border border-slate-800 text-xl font-sans text-center shrink-0 shadow-lg select-none">
                          {info.icon}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="font-bold text-slate-200 text-sm font-mono block truncate">{info.name}</span>
                          <p className="text-[10.5px] text-slate-400 leading-normal line-clamp-1">{info.desc}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (bKey === 'radar') {
                            localStorage.setItem(`moonbase_radar_clicked_${player.id}`, 'true');
                            setHasClickedRadar(true);
                            if (onNavigateToGalaxySubTab) {
                              onNavigateToGalaxySubTab('scanner');
                            } else {
                              setActiveTab('galaxy');
                            }
                          } else if (bKey === 'researchCenter') {
                            setActiveTab('research');
                          } else if (bKey === 'armyBase') {
                            setActiveTab('army');
                          } else {
                            setExpandedBuilding(isExpanded ? null : bKey);
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900/30 font-bold font-mono text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                      >
                        <span>Blueprint</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-850 p-4 bg-slate-950/40 space-y-3.5 text-left text-xs animate-fade-in">
                        <p className="text-slate-350 leading-relaxed font-sans">{info.desc}</p>
                        <UpgradeCostBar type="building" upgradeKey={bKey} targetLevel={1} planetResources={localResources} />

                        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <span className="text-[9.5px] text-slate-500 font-mono font-bold tracking-wider">REQ FABRICATOR: Lv. {getRequiredFabricatorLevel(bKey)}</span>
                          {bKey !== 'fabricator' && !allExtractorsLevelOneOrMore ? (
                            <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 px-3 py-1.5 rounded" title="All 5 resource extractor pumps must be at least Level 1.">
                              🔒 EXTRACTORS REQUISITE
                            </span>
                          ) : isAnyUpgradeInProgress ? (
                            <button 
                              onClick={() => onUpgradeBuilding(bKey, true)}
                              disabled={isUpgrading}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 rounded-lg transition duration-150 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              <span className="text-emerald-400">Queue Construction</span>
                              <span className="text-amber-400 font-extrabold">(15 SG)</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => onUpgradeBuilding(bKey)}
                              disabled={isUpgrading}
                              className="px-4 py-2 bg-pink-500/15 text-pink-400 hover:bg-pink-500/25 border border-pink-500/35 rounded-lg transition duration-150 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              <span>Construct</span>
                              <span className="text-slate-450 text-[8px] ml-1">({upgradeTimeMins}m)</span>
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

      {/* GLOBAL CHAT MODAL OVERLAY */}
      {isChatOpen && (() => {
        const globalMessages = chatMessages ? [...chatMessages].filter(msg => msg.channel === 'global').reverse() : [];
        const messagesPerPage = 15;
        const totalPages = Math.max(1, Math.ceil(globalMessages.length / messagesPerPage));
        
        // Safety check to ensure page doesn't overflow if messages size decreases
        const currentPage = Math.min(chatPage, totalPages - 1);
        
        const startIndex = currentPage * messagesPerPage;
        const endIndex = startIndex + messagesPerPage;
        const paginatedMessages = globalMessages.slice(startIndex, endIndex);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 font-mono">
            <div className="w-full max-w-2xl bg-[#070B13] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 flex flex-col h-[90vh] md:h-[650px] max-h-[95vh] shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                    SECURE NET TRANSCEIVER WINDOW — GLOBAL CHAT
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
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-xs text-left mb-4">
                {paginatedMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10 space-y-2">
                    <MessageSquare size={32} className="opacity-30" />
                    <p className="text-xs">No active transmissions decoded on this wavelength.</p>
                  </div>
                ) : (
                  paginatedMessages.map((msg, idx) => {
                    const senderId = msg.senderId || (msg as any).playerId;
                    const senderName = msg.senderName || (msg as any).username;
                    const isMe = senderId === player.id;
                    const isSystem = senderId === 'SYS' || senderId === 'system' || senderName === 'SYS' || senderName === 'System' || senderName === 'Galactic Federation' || (senderName && senderName.includes('Galactic Federation'));
                    const displayName = (isSystem ? 'Galactic Federation' : senderName).replace('[SYS]', '').trim();
                    const nameColorClass = isSystem ? 'text-amber-400 animate-pulse' : (isMe ? 'text-cyan-400' : 'text-slate-400');

                    return (
                      <div 
                        key={msg.id || idx} 
                        className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold mb-0.5 px-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onViewPlayerProfile && onViewPlayerProfile(senderId)}
                            className={`font-bold underline cursor-pointer focus:outline-none ${nameColorClass}`}
                          >
                            {displayName}
                          </button>
                          <span className="text-slate-600 font-normal">
                            {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className={`p-2.5 rounded-2xl text-xs leading-relaxed break-words font-medium ${
                          isSystem
                            ? 'bg-amber-950/20 border border-amber-500/20 text-amber-200 rounded-2xl'
                            : isMe 
                              ? 'bg-cyan-950/40 border border-cyan-500/25 text-cyan-200 rounded-tr-none' 
                              : 'bg-slate-900/90 border border-[#1E293B] text-slate-300 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-2.5 px-1 border-t border-[#1E293B] text-[11px] text-slate-400 mb-2">
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setChatPage(prev => Math.max(0, prev - 1))}
                    className="px-3 py-1.5 bg-[#05070A] hover:bg-slate-900 border border-[#1E293B] hover:border-cyan-500/30 disabled:opacity-30 disabled:hover:border-[#1E293B] disabled:hover:bg-slate-950 rounded-lg text-cyan-400 transition cursor-pointer font-bold uppercase tracking-wider disabled:cursor-not-allowed"
                  >
                    &larr; Prev
                  </button>
                  <span className="font-semibold text-slate-300">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setChatPage(prev => Math.min(totalPages - 1, prev + 1))}
                    className="px-3 py-1.5 bg-[#05070A] hover:bg-slate-900 border border-[#1E293B] hover:border-cyan-500/30 disabled:opacity-30 disabled:hover:border-[#1E293B] disabled:hover:bg-slate-950 rounded-lg text-cyan-400 transition cursor-pointer font-bold uppercase tracking-wider disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}

              {/* Chat entry form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  onSendChat('global', chatInput.trim());
                  setChatInput('');
                  setChatPage(0); // reset page to 0 when a message is sent so they see their message!
                }} 
                className="mt-2 flex gap-2.5"
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
        );
      })()}

      {/* Tactical Alerts Modal Overlay */}
      {isAlertsOpen && (() => {
        if (isAlertsHUDMinimized) {
          return (
            <div id="alerts-modal-minimized" className="fixed bottom-4 right-4 z-50 p-4 bg-[#090D1A]/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col max-w-xs font-mono animate-fade-in text-left text-xs">
              <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${pulseDot} animate-pulse`} />
                  <span className="font-black text-white text-[10px] tracking-wider uppercase">RADAR HUD ACTIVE</span>
                </div>
                <button 
                  onClick={() => setIsAlertsHUDMinimized(false)}
                  className="text-cyan-400 hover:text-white font-bold px-1.5 py-0.5 border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 rounded text-[9px] cursor-pointer"
                  title="Maximize Transit Radar"
                >
                  EXPAND 🔼
                </button>
              </div>
              <div className="text-[10px] text-slate-400 space-y-1 pt-1.5">
                <p className="flex justify-between">
                  <span>Hostile Inbounds:</span>
                  <span className={`font-bold ${incomingAttacks.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>{incomingAttacks.length}</span>
                </p>
                <p className="flex justify-between">
                  <span>Active Transits:</span>
                  <span className={`font-bold ${movingForces.length > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{movingForces.length}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAlertsOpen(false)}
                className="w-full mt-2 py-1 bg-slate-900 border border-slate-800 text-[9px] hover:text-white transition uppercase font-bold text-slate-500 rounded cursor-pointer"
              >
                Close HUD
              </button>
            </div>
          );
        }

        return (
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
              <div className="flex gap-2">
                <button
                  id="minimize-alerts-hud"
                  onClick={() => setIsAlertsHUDMinimized(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-xs uppercase tracking-widest cursor-pointer border border-cyan-500/30 px-2.5 py-1 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 font-bold"
                >
                  Minimize 🔽
                </button>
                <button
                  id="close-alerts-top"
                  onClick={() => setIsAlertsOpen(false)}
                  className="text-slate-400 hover:text-white font-mono text-xs uppercase tracking-widest cursor-pointer border border-[#1E293B] px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  Close HUD
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[250px] font-mono text-left">
              
              {/* 1. Red Section: Incoming Attack Alerts */}
              <div className="space-y-3 border border-red-500/10 rounded-xl p-3 bg-[#020408]/40">
                <div 
                  onClick={() => setMinimizeAlertsIncoming(!minimizeAlertsIncoming)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1.5 border-b border-red-950/40"
                >
                  <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    [!] HOSTILE INVASION TROOPS DETECTED ({incomingAttacks.length})
                  </h4>
                  <span className="text-slate-500 font-mono text-[10px]">{minimizeAlertsIncoming ? 'EXPAND 🔽' : 'MINIMIZE 🔼'}</span>
                </div>

                {!minimizeAlertsIncoming && (
                  incomingAttacks.length === 0 ? (
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
                ))}
              </div>

              {/* 2. Orange Section: Moving Fleets */}
              <div className="space-y-3 border border-amber-500/10 rounded-xl p-3 bg-[#020408]/40">
                <div 
                  onClick={() => setMinimizeAlertsMoving(!minimizeAlertsMoving)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1.5 border-b border-amber-950/40"
                >
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="inline-block w-2 h-1.5 rounded bg-amber-500 animate-pulse" />
                    [~] ACTIVE SENDER OPERATIONS TRANSIT ({movingForces.length})
                  </h4>
                  <span className="text-slate-500 font-mono text-[10px]">{minimizeAlertsMoving ? 'EXPAND 🔽' : 'MINIMIZE 🔼'}</span>
                </div>

                {!minimizeAlertsMoving && (
                  movingForces.length === 0 ? (
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
                ))}
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
      ); })()}

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
      {confirmModal && (
        <div id="explore-confirm-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1527] border border-amber-500/30 rounded-2xl p-6 flex flex-col space-y-4 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-extrabold text-amber-400 font-mono tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} /> {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-xs font-mono transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
                className="px-4 py-2 bg-amber-950/40 hover:bg-amber-950 border border-amber-500/40 text-amber-400 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
              >
                CONFIRM TRANSACTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
