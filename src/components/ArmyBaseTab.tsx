import React, { useState } from 'react';
import { ColonyPlanet, PlayerProfile, BattleReport, CreatedFleet } from '../types';

import imgInterceptor from '../assets/images/defensive_interceptor_1780872114708.png';
import imgAssaultDrone from '../assets/images/assault_drone_1780871759723.png';
import imgDisrupter from '../assets/images/disrupter_tank_1780871773673.png';
import imgMatterExtractor from '../assets/images/matter_extractor_1780871789535.png';
import imgMissileLauncher from '../assets/images/missile_launcher_1780871805054.png';
import imgSettlementShip from '../assets/images/settlement_ship_1780871819613.png';

const TROOP_NAME_MAPPING: Record<string, string> = {
  defender: 'Interceptor',
  attacker: 'Assault Drone',
  tank: 'Disrupter',
  looter: 'Matter Extractor',
  drone: 'Missile Launcher',
  settlementShip: 'Settlement Ship'
};
import { 
  Shield, 
  Sword, 
  Truck, 
  Settings, 
  Clock, 
  RotateCw, 
  Crosshair, 
  Activity,
  Play,
  Droplet,
  Flame,
  Zap,
  Apple,
  Wind,
  Users,
  Wrench,
  ShieldAlert,
  Rocket,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ArmyBaseTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  onTrainTroops: (troopId: string, quantity: number) => void;
  serverTime: number;
  battleReports: BattleReport[];
  readReports?: Record<string, boolean>;
  savedReports?: Record<string, boolean>;
  onMarkRead?: (reportId: string) => void;
  onMarkUnread?: (reportId: string) => void;
  onToggleSave?: (reportId: string) => void;
  onMarkAllRead?: () => void;
  onForwardReport?: (report: BattleReport, channel: 'global' | 'alliance') => void;
  fleets?: any[];
  onSendFleet?: (mission: {
    targetX: number;
    targetY: number;
    missionType: 'attack' | 'colonize' | 'recon' | 'move';
    troops: Record<string, number>;
    targetBuilding?: string;
    createdFleetId?: string;
    planetId?: string;
  }) => Promise<any> | any;
  onSettle?: (fleetId: string) => void;
  createdFleets: CreatedFleet[];
  setCreatedFleets: React.Dispatch<React.SetStateAction<CreatedFleet[]>>;
  onUpdatePlayer?: (player: PlayerProfile) => void;
  onViewPlayerProfile?: (playerId: string) => void;
  localResources?: Record<string, number>;
  isUpgrading?: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onCancelFleet?: (fleetId: string) => Promise<void>;
  onRerouteFleet?: (fleetId: string, targetX: number, targetY: number, missionType?: string) => Promise<void>;
}

const TROOP_DETAILS = {
  defender: {
    name: 'Interceptor',
    desc: 'Bunker defense infantry. High durability shield blocks planetary raids. Forced to defend the colony if under attack.',
    defenceHp: 18,
    attackHp: 10,
    carry: 600,
    costs: { water: 150, plasma: 0, fuel: 0, food: 200, respirant: 100 },
    icon: Shield,
    color: 'text-blue-400 bg-blue-950/30',
    image: imgInterceptor
  },
  attacker: {
    name: 'Assault Drone',
    desc: 'Heavy strike fighter designed for interstellar sweeps. Low defense shields but delivers severe kinetic bombardments.',
    defenceHp: 9,
    attackHp: 30,
    carry: 400,
    costs: { water: 300, plasma: 450, fuel: 450, food: 300, respirant: 0 },
    icon: Sword,
    color: 'text-red-400 bg-red-950/30',
    image: imgAssaultDrone
  },
  tank: {
    name: 'Disrupter',
    desc: 'Colossal planet-side artillery engines. Slow, but every 3 surviving tanks systematically demolish random levels of defender buildings.',
    defenceHp: 5,
    attackHp: 5,
    carry: 0,
    costs: { water: 0, plasma: 800, fuel: 1200, food: 0, respirant: 400 },
    icon: Crosshair,
    color: 'text-amber-500 bg-amber-950/30',
    image: imgDisrupter
  },
  looter: {
    name: 'Matter Extractor',
    desc: 'Swift light frigate outfitted with massive cargo holds. High speed cargo looting of enemy planetary storage repositories.',
    defenceHp: 4,
    attackHp: 4,
    carry: 1000,
    costs: { water: 500, plasma: 0, fuel: 200, food: 400, respirant: 0 },
    icon: Truck,
    color: 'text-emerald-400 bg-emerald-950/30',
    image: imgMatterExtractor
  },
  drone: {
    name: 'Missile Launcher',
    desc: 'Low-profile cloaked robotic drone. Elite speed indicators indicators designed for scouting, recon, and mapping targets.',
    defenceHp: 120,
    attackHp: 120,
    carry: 200,
    costs: { water: 1000, plasma: 1000, fuel: 1500, food: 0, respirant: 500 },
    icon: Activity,
    color: 'text-purple-400 bg-purple-950/30',
    image: imgMissileLauncher
  },
  settlementShip: {
    name: 'Settlement Ship',
    desc: 'Heavy colonization spacecraft. Limited to 1 Ship per base. Allows settling and colonizing uncharted habitable coordinates visible on your active radar scans.',
    defenceHp: 50,
    attackHp: 0,
    carry: 5000,
    costs: { water: 1500, plasma: 1000, fuel: 2000, food: 1500, respirant: 1000 },
    icon: Rocket,
    color: 'text-teal-400 bg-teal-950/30',
    image: imgSettlementShip
  }
};

const TROOP_REQUIRED_LEVELS: Record<string, number> = {
  defender: 3,       // Interceptor
  drone: 6,          // Missile Launcher
  attacker: 10,      // Assault Drone
  looter: 15,        // Matter Extractor
  tank: 19,          // Disrupter
  settlementShip: 1  // Settlement Ship
};

export const ArmyBaseTab: React.FC<ArmyBaseTabProps> = ({
  player,
  activePlanet,
  onTrainTroops,
  serverTime,
  battleReports,
  readReports = {},
  savedReports = {},
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onToggleSave,
  onForwardReport,
  fleets = [],
  onSendFleet,
  onSettle,
  createdFleets,
  setCreatedFleets,
  onUpdatePlayer,
  onViewPlayerProfile,
  localResources,
  isUpgrading = false,
  showToast,
  onCancelFleet,
  onRerouteFleet
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  });

  // Rerouting inputs state
  const [reroutingFleetId, setReroutingFleetId] = useState<string | null>(null);
  const [rerouteX, setRerouteX] = useState<string>('');
  const [rerouteY, setRerouteY] = useState<string>('');

  const [activeTroopInfo, setActiveTroopInfo] = useState<string | null>(null);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);
  const [activeImageZoomTitle, setActiveImageZoomTitle] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'troops' | 'fabricate' | 'fleet'>('troops');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [combatLogsFilter, setCombatLogsFilter] = useState<'all' | 'saved' | 'unread'>('all');
  const [expandedReportRounds, setExpandedReportRounds] = useState<Record<string, number>>({});
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [lastViewedReportTime, setLastViewedReportTime] = useState<number>(0);

  const [seenReports, setSeenReports] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('moonbase_seen_reports') || '{}');
    } catch {
      return {};
    }
  });

  const markReportSeen = (reportId: string) => {
    setSeenReports(prev => {
      const updated = { ...prev, [reportId]: true };
      localStorage.setItem('moonbase_seen_reports', JSON.stringify(updated));
      return updated;
    });
  };
  const [isBuildQueueOpen, setIsBuildQueueOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showBuildForces, setShowBuildForces] = useState(true);

  const [isReservesExpanded, setIsReservesExpanded] = useState(false);
  const [activeLaunchFleetId, setActiveLaunchFleetId] = useState<string | null>(null);
  const [directLaunchX, setDirectLaunchX] = useState<number>(activePlanet.sectorX);
  const [directLaunchY, setDirectLaunchY] = useState<number>(activePlanet.sectorY);
  const [directMissionType, setDirectMissionType] = useState<'attack' | 'colonize' | 'recon' | 'move' | 'timed_attack' | 'timed_move'>('move');
  const [directTimedLandingTime, setDirectTimedLandingTime] = useState<string>('');
  const [directTargetBuilding, setDirectTargetBuilding] = useState<string>('random');
  const [isLaunchingDirect, setIsLaunchingDirect] = useState(false);

  const [managingCargoFleetId, setManagingCargoFleetId] = useState<string | null>(null);
  const [cargoTransfers, setCargoTransfers] = useState<Record<string, number>>({
    water: 0,
    plasma: 0,
    fuel: 0,
    food: 0,
    respirant: 0
  });
  const [isUnloading, setIsUnloading] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState<string | null>(null);

  const handleManualUnload = async (fleet: CreatedFleet) => {
    setIsUnloading(fleet.id);
    try {
      const res = await fetch('/api/fleet/unload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ fleetId: fleet.id })
      });
      const data = await res.json();
      if (res.ok && data.player) {
        showToast(`Cargo successfully unloaded into station storage.`, 'success');
        if (onUpdatePlayer) onUpdatePlayer(data.player);
        if (data.player.createdFleets) setCreatedFleets(data.player.createdFleets);
      } else {
        showToast(data.error || 'Failed to unload cargo', 'error');
      }
    } catch (err) {
      showToast('Network error during manual cargo unload', 'error');
    } finally {
      setIsUnloading(null);
    }
  };

  const handleTransferResources = async (fleetId: string) => {
    setIsTransferring(fleetId);
    try {
      const res = await fetch('/api/fleet/transfer-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          fleetId,
          transfers: cargoTransfers
        })
      });
      const data = await res.json();
      if (res.ok && data.player) {
        showToast(`Fleet cargo distribution updated successfully.`, 'success');
        if (onUpdatePlayer) onUpdatePlayer(data.player);
        if (data.player.createdFleets) setCreatedFleets(data.player.createdFleets);
        // Reset transfers
        setCargoTransfers({
          water: 0,
          plasma: 0,
          fuel: 0,
          food: 0,
          respirant: 0
        });
        setManagingCargoFleetId(null);
      } else {
        showToast(data.error || 'Failed to transfer cargo resources', 'error');
      }
    } catch (err) {
      showToast('Network error during resource transfer', 'error');
    } finally {
      setIsTransferring(null);
    }
  };

  const adjustTransfer = (fleet: CreatedFleet, resKey: string, delta: number) => {
    setCargoTransfers(prev => {
      const currentTransferVal = prev[resKey] || 0;
      
      // Calculate current total cargo in fleet including all pending transfers
      const fleetAmtTotal = Object.values(fleet.resources || {}).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
      const pendingTransfersTotal = ['water', 'plasma', 'fuel', 'food', 'respirant'].reduce<number>((sum, key) => sum + (prev[key] || 0), 0);
      const currentFleetCargo = fleetAmtTotal + pendingTransfersTotal;
      
      // Fleet capacity
      let fleetCapacity = 0;
      Object.entries(fleet.troops).forEach(([tId, qty]) => {
        const spec = TROOP_DETAILS[tId as keyof typeof TROOP_DETAILS];
        if (spec) fleetCapacity += (Number(qty) || 0) * spec.carry;
      });
      
      const planetAmt = activePlanet.resources[resKey as keyof typeof activePlanet.resources] || 0;
      const fleetAmt = fleet.resources?.[resKey as keyof typeof fleet.resources] || 0;
      
      let actualDelta = delta;
      if (delta > 0) {
        // Loading onto fleet
        // Must not exceed planet resource limits
        const maxLoadFromPlanet = planetAmt - currentTransferVal;
        // Must not exceed fleet remaining capacity
        const maxLoadToFleetCapacity = fleetCapacity - currentFleetCargo;
        
        const allowed = Math.max(0, Math.min(maxLoadFromPlanet, maxLoadToFleetCapacity));
        actualDelta = Math.min(delta, allowed);
      } else {
        // Unloading from fleet
        // Must not unload more than what is on the fleet (transfer value cannot go more negative than -fleetAmt)
        const maxUnloadFromFleet = fleetAmt + currentTransferVal;
        
        const allowed = Math.max(0, maxUnloadFromFleet);
        actualDelta = -Math.min(Math.abs(delta), allowed);
      }
      
      return {
        ...prev,
        [resKey]: currentTransferVal + actualDelta
      };
    });
  };

  // Fleet Create Form States
  const [fleetName, setFleetName] = useState('');
  const [fleetSubsidiary, setFleetSubsidiary] = useState('Main Division');
  const [fleetAmount, setFleetAmount] = useState<number | ''>(1);
  const [fleetTroops, setFleetTroops] = useState<Record<string, number>>({
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  });

  // Helper custom JSON safe parse
  const safeParseJson = async (res: Response): Promise<any> => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [isRefunding, setIsRefunding] = useState<string | null>(null);

  const handleCreateFleet = async () => {
    let totalInFleet = 0;
    Object.values(fleetTroops).forEach(qty => { totalInFleet += Number(qty) || 0; });
    if (totalInFleet === 0) {
      alert("Must allocate at least 1 spacecraft to create a reserve fleet!");
      return;
    }
    const amountVal = Number(fleetAmount) || 0;
    if (amountVal < 1) {
      alert("Fleet creation amount must be at least 1.");
      return;
    }

    // Verify planet has enough troops
    const changes: Record<string, number> = {};
    let isInsufficient = false;
    let missingInfo = '';

    for (const [tId, val] of Object.entries(fleetTroops)) {
      const fleetQty = Number(val) || 0;
      if (fleetQty > 0) {
        const totalNeeded = fleetQty * amountVal;
        const available = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
        if (available < totalNeeded) {
          isInsufficient = true;
          missingInfo = `${TROOP_NAME_MAPPING[tId] || tId} (Need: ${totalNeeded}, Have: ${available})`;
          break;
        }
        changes[tId] = -totalNeeded;
      }
    }

    if (isInsufficient) {
      alert(`Insufficient ships on Space Station: ${missingInfo}`);
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/troops/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          troopChanges: changes
        })
      });
      const data = await safeParseJson(res);
      if (res.ok && data.player) {
        if (onUpdatePlayer) {
          onUpdatePlayer(data.player);
        }

        // Generate en-reserve fleets
        const newFleets: CreatedFleet[] = [];
        for (let i = 0; i < amountVal; i++) {
          newFleets.push({
            id: `fleet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`,
            name: fleetName.trim() || `Tactical Squadron ${createdFleets.length + i + 1}`,
            subsidiary: fleetSubsidiary.trim() || 'Central Auxiliary',
            troops: { ...fleetTroops } as any,
            planetId: activePlanet.id
          });
        }
        setCreatedFleets(prev => [...prev, ...newFleets]);

        // Reset
        setFleetName('');
        setFleetSubsidiary('Main Division');
        setFleetAmount(1);
        setFleetTroops({
          defender: 0,
          attacker: 0,
          tank: 0,
          looter: 0,
          drone: 0,
          settlementShip: 0
        });

        alert(`Successfully constructed and en-garrisoned ${amountVal} new reserve tactical fleet(s)!`);
      } else {
        alert(data.error || 'Failed to adjust space station garrison troops');
      }
    } catch (err) {
      alert('Network failure creating reserve fleet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDisbandFleet = async (fleet: CreatedFleet) => {
    setIsRefunding(fleet.id);
    try {
      const changes: Record<string, number> = {};
      for (const [tId, val] of Object.entries(fleet.troops)) {
        const qty = Number(val) || 0;
        if (qty > 0) {
          changes[tId] = qty;
        }
      }

      const res = await fetch('/api/troops/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          troopChanges: changes
        })
      });
      const data = await safeParseJson(res);
      if (res.ok && data.player) {
        if (onUpdatePlayer) {
          onUpdatePlayer(data.player);
        }
        setCreatedFleets(prev => prev.filter(f => f.id !== fleet.id));
        alert(`Disassembled ${fleet.name} & successfully returned all units back to active planetary hangar.`);
      } else {
        alert(data.error || 'Failed to return units to station');
      }
    } catch {
      alert('Network error during fleet disassembly');
    } finally {
      setIsRefunding(null);
    }
  };

  // Automatically initialize directTimedLandingTime for direct timed attacks and moves
  React.useEffect(() => {
    if ((directMissionType === 'timed_move' || directMissionType === 'timed_attack') && activeLaunchFleetId) {
      const fleet = createdFleets.find(f => f.id === activeLaunchFleetId);
      if (!fleet) return;
      const distance = Math.hypot(directLaunchX - activePlanet.sectorX, directLaunchY - activePlanet.sectorY);
      let troopSpeedLevel = 1;
      try {
        const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
        const savedTech = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
        troopSpeedLevel = savedTech ? (JSON.parse(savedTech).troop_speed ?? (isFirstPlanet ? 20 : 0)) : (isFirstPlanet ? 20 : 0);
      } catch (err) {}
      const boostPct = Math.max(0, Math.min(35, (troopSpeedLevel - 1) * (35 / 19))) / 100;
      const speedMultiplier = 1.0 + boostPct;
      const speedMap: Record<string, number> = {
        defender: 7.0,
        attacker: 11.662,
        tank: 3.5,
        looter: 23.331,
        drone: 17.5,
        settlementShip: 4.662
      };
      const selectedTroops = Object.entries(fleet.troops).filter(([_, qty]) => (Number(qty) || 0) > 0);
      const slowestTroopSpeed = selectedTroops.length > 0
        ? (selectedTroops.reduce((slowest, [tId, _]) => {
            const sp = speedMap[tId] || 5;
            return sp < slowest ? sp : slowest;
          }, 100)) * speedMultiplier
        : 100;
      const travelTimeMs = slowestTroopSpeed > 0 ? Math.round((distance / slowestTroopSpeed) * 60000) : 0;
      const defaultLanding = Date.now() + travelTimeMs + 5 * 60 * 1000; // travel duration + 5 minutes
      
      const date = new Date(defaultLanding);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setDirectTimedLandingTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [directMissionType, directLaunchX, directLaunchY, activeLaunchFleetId, activePlanet, player, createdFleets]);

  const handleLaunchDirect = async (fleet: CreatedFleet) => {
    if (directLaunchX === undefined || directLaunchY === undefined) {
      alert("Please provide valid coordinates.");
      return;
    }

    setIsLaunchingDirect(true);
    try {
      // Step 1: Temporarily adjust station troops back to positive so they are in the garrison 
      // to be dispatched by onSendFleet!
      const changes: Record<string, number> = {};
      for (const [tId, val] of Object.entries(fleet.troops)) {
        const qty = Number(val) || 0;
        if (qty > 0) {
          changes[tId] = qty;
        }
      }

      const res = await fetch('/api/troops/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          troopChanges: changes
        })
      });
      const data = await safeParseJson(res);
      if (res.ok && data.player) {
        if (onUpdatePlayer) {
          onUpdatePlayer(data.player);
        }

        // Step 2: Dispatch the fleet mission!
        let activeMission = null;
        if (onSendFleet) {
          activeMission = await onSendFleet({
            targetX: directLaunchX,
            targetY: directLaunchY,
            missionType: directMissionType === 'timed_move' ? 'move' : directMissionType === 'timed_attack' ? 'attack' : directMissionType,
            troops: fleet.troops as any,
            targetBuilding: (fleet.troops.tank || 0) > 0 ? directTargetBuilding : undefined,
            planetId: activePlanet.id,
            createdFleetId: fleet.id,
            landingTime: (directMissionType === 'timed_move' || directMissionType === 'timed_attack') && directTimedLandingTime ? new Date(directTimedLandingTime).getTime() : undefined
          });
        }

        // Step 3: Keep the reserve fleet and mark it as traveling
        setCreatedFleets(prev => prev.map(item => {
          if (item.id === fleet.id) {
            return {
              ...item,
              activeMissionId: activeMission?.id || `fleet_temp_${Date.now()}`,
              isTraveling: true
            };
          }
          return item;
        }));
        setActiveLaunchFleetId(null);
        alert(`Dispatched reserve fleet ${fleet.name} into space flight!`);
      } else {
        alert(data.error || 'Failed to assemble reserve fleet for launch');
      }
    } catch (err) {
      alert('Network failure launching reserve fleet');
    } finally {
      setIsLaunchingDirect(false);
    }
  };

  const handleQtyChange = (troopId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setQuantities(prev => ({ ...prev, [troopId]: num }));
  };

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

  const totalTroopsCount: number = (activePlanet.troops.defender || 0) +
                                   (activePlanet.troops.attacker || 0) +
                                   (activePlanet.troops.tank || 0) +
                                   (activePlanet.troops.looter || 0) +
                                   (activePlanet.troops.drone || 0) +
                                   (activePlanet.troops.settlementShip || 0);

  let shieldMultiplier = 1.0;
  try {
    const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
    const savedTech = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
    const shieldLvl = savedTech ? (JSON.parse(savedTech).defense_shields ?? (isFirstPlanet ? 20 : 0)) : (isFirstPlanet ? 20 : 0);
    shieldMultiplier = 1.0 + (shieldLvl / 20) * 0.15;
  } catch {
    // fallback
  }

  // Calculate global combined statistics for the active army view
  const globalStats = {
    totalAttack: (activePlanet.troops.defender || 0) * TROOP_DETAILS.defender.attackHp +
                 (activePlanet.troops.attacker || 0) * TROOP_DETAILS.attacker.attackHp +
                 (activePlanet.troops.tank || 0) * TROOP_DETAILS.tank.attackHp +
                 (activePlanet.troops.looter || 0) * TROOP_DETAILS.looter.attackHp +
                 (activePlanet.troops.drone || 0) * TROOP_DETAILS.drone.attackHp +
                 (activePlanet.troops.settlementShip || 0) * TROOP_DETAILS.settlementShip.attackHp,
    totalDefence: Math.round(((activePlanet.troops.defender || 0) * TROOP_DETAILS.defender.defenceHp +
                  (activePlanet.troops.attacker || 0) * TROOP_DETAILS.attacker.defenceHp +
                  (activePlanet.troops.tank || 0) * TROOP_DETAILS.tank.defenceHp +
                  (activePlanet.troops.looter || 0) * TROOP_DETAILS.looter.defenceHp +
                  (activePlanet.troops.drone || 0) * TROOP_DETAILS.drone.defenceHp +
                  (activePlanet.troops.settlementShip || 0) * TROOP_DETAILS.settlementShip.defenceHp) * shieldMultiplier),
    totalCarry: (activePlanet.troops.defender || 0) * TROOP_DETAILS.defender.carry +
                (activePlanet.troops.attacker || 0) * TROOP_DETAILS.attacker.carry +
                (activePlanet.troops.tank || 0) * TROOP_DETAILS.tank.carry +
                (activePlanet.troops.looter || 0) * TROOP_DETAILS.looter.carry +
                (activePlanet.troops.drone || 0) * TROOP_DETAILS.drone.carry +
                (activePlanet.troops.settlementShip || 0) * TROOP_DETAILS.settlementShip.carry
  };

  // Calculate total queued units per troop type
  const queuedCounts: Record<string, number> = {
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  };
  activePlanet.trainingQueue.forEach(item => {
    if (item.troopId in queuedCounts) {
      queuedCounts[item.troopId] += item.count;
    }
  });

  const armyBaseLevel = activePlanet.buildings.armyBase?.level || 0;

  return (
    <div className="space-y-1.5 pb-24">
      {/* Overview stats centerpiece */}
      <div className="p-6 rounded-xl border border-[#1E293B] bg-[#0A0F1D]/90 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-[#5bc0be] uppercase font-mono">Operations Wing</span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 leading-none tracking-tight">Fleet Commands Force</h2>
        </div>

        {/* COMBAT REPORTS ICON BUTTON TRIGGER */}
        <button
          onClick={() => {
            setShowReportsModal(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold shrink-0 shadow-lg justify-center w-full sm:w-auto relative cursor-pointer border transition duration-150 ${
            battleReports.filter(r => !seenReports[r.id]).length > 0 
              ? "bg-red-950/40 hover:bg-red-900/45 border-red-500/30 hover:border-red-500/65 text-red-400 hover:text-red-350"
              : "bg-emerald-950/40 hover:bg-emerald-900/45 border-emerald-500/30 hover:border-emerald-500/65 text-emerald-400 hover:text-emerald-350"
          }`}
          title="Decrypt and view local planetary security encounters."
        >
          {battleReports.filter(r => !seenReports[r.id]).length > 0 && <ShieldAlert size={14} className="animate-pulse" />}
          <span>ATTACK REPORTS</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            battleReports.filter(r => !seenReports[r.id]).length > 0
              ? "bg-red-500 text-slate-950"
              : "bg-emerald-500 text-slate-950"
          }`}>
            {battleReports.filter(r => !seenReports[r.id]).length}
          </span>
        </button>

        <div className="text-left sm:text-right font-mono">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Global Space Force Strength</div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 glow-cyan leading-tight mt-1">
            {totalTroopsCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-normal uppercase">Active duty forces</div>
        </div>
      </div>

      {armyBaseLevel === 0 ? (
        <div className="p-8 border border-red-500/20 bg-[#0A0F1D]/80 backdrop-blur-md rounded-2xl text-center space-y-4 max-w-xl mx-auto shadow-xl font-mono">
          <div className="text-4xl text-red-400">🛡️</div>
          <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-widest">
            WAR ROOM OFFLINE
          </h3>
          <p className="text-xs text-slate-350 font-sans leading-relaxed">
            This secondary colony station does not possess an active command defense center. 
            Navigate to your <strong>Established Structures</strong> or <strong>Unlocked Blueprints</strong> in the station commands tab to construct a War Room first before allocating troop squadrons, training defense forces, or commanding starship fleet movements.
          </p>
        </div>
      ) : (
        <>
          {/* Triple Sub-Tabs System */}
      <div className="flex border border-[#1E293B] bg-[#0A0F1D]/80 p-1.5 rounded-2xl gap-2 shadow-inner">
        <button
          onClick={() => setSubTab('troops')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl font-mono text-xs font-bold transition-all duration-250 cursor-pointer relative ${
            subTab === 'troops' 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users size={14} className={`${subTab === 'troops' ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} title="Troops icon: overview overall space forces garrisons" />
            <span className="tracking-wider text-[11px]">TROOPS</span>
          </div>
          
          {/* Badge displaying the total number of troops under the word TROOPS */}
          <span className={`text-[10px] font-sans font-black transition-colors ${
            subTab === 'troops' 
              ? 'text-cyan-300' 
              : 'text-slate-500'
          }`} title="Total active space forces stationed on this world sector">
            {totalTroopsCount.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setSubTab('fabricate')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all duration-250 cursor-pointer ${
            subTab === 'fabricate' 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Build panel: design and assemble new high-grade spaceships"
        >
          <Wrench size={14} className={`${subTab === 'fabricate' ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} title="Wrench build icon" />
          <span className="tracking-wider">BUILD</span>
        </button>

        <button
          onClick={() => setSubTab('fleet')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all duration-250 cursor-pointer relative ${
            subTab === 'fleet' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Launch and monitor active space fleet missions"
        >
          <Rocket size={14} className={`${subTab === 'fleet' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} title="Rocket fleet command icon" />
          <span className="tracking-wider">FLEETS</span>
          {fleets.filter(f => f.senderId === player.id).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-450 text-slate-950 font-sans animate-pulse">
              {fleets.filter(f => f.senderId === player.id).length}
            </span>
          )}
        </button>
      </div>


      {/* SUB-VIEW 1: TROOPS VIEW (See army, stats, division graphs) */}
      {subTab === 'troops' && (
        <div className="space-y-1.5 animate-fade-in">
          {/* Integrated Armed Force Tactical Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0A0F1D]/65 border border-[#1E293B] rounded-xl flex items-center gap-3.5" title="Defense Absorption: Defense/shield strength point total absorbing enemy scans and raids.">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/15 text-blue-400">
                <Shield size={16} title="Shield defensive icon" />
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Total Defence HP / Shields</div>
                <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                  {globalStats.totalDefence.toLocaleString()} <span className="text-[9px] font-bold text-blue-500">HP</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0A0F1D]/65 border border-[#1E293B] rounded-xl flex items-center gap-3.5" title="Strike Firepower: Cumulative offensive combat capability total scoring planet raids.">
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/15 text-orange-400">
                <Sword size={16} title="Sword weapon action icon" />
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Total Attack HP / Firepower</div>
                <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                  {globalStats.totalAttack.toLocaleString()} <span className="text-[9px] font-bold text-orange-500">HP</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0A0F1D]/65 border border-[#1E293B] rounded-xl flex items-center gap-3.5" title="Cargo Looting Pool: Ultimate cargo storage carrying weight of resources looted.">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
                <Truck size={16} title="Truck cargo carrier icon" />
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Cargo Looting Pool</div>
                <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                  {globalStats.totalCarry.toLocaleString()} <span className="text-[9px] font-bold text-emerald-500">units</span>
                </div>
              </div>
            </div>
          </div>

          {/* Division list for Troops tab */}
          <div className="space-y-3.5">
            <div
              className="w-full flex items-center justify-between gap-3 mb-2 border-b border-[#1E293B]/60 pb-2 text-left"
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5bc0be] font-mono flex items-center gap-2">
                Active Space Force Breakdown
              </h3>
              <span className="text-[10.5px] text-slate-500 font-mono font-bold">({totalTroopsCount.toLocaleString()} Combatants)</span>
            </div>
            
            {showBreakdown && (
              totalTroopsCount === 0 ? (
                <div className="p-8 border border-cyan-500/15 bg-cyan-950/5 rounded-2xl text-center space-y-4 max-w-md mx-auto">
                  <Users size={32} className="text-cyan-400 mx-auto animate-pulse" title="Space Force: Zero active troops stationed on world sectors" />
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-xs text-slate-200 font-mono uppercase">No Regular Units Stationed</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Operations screen shows zero active troop clusters on current planet sectors. Stand-by static armor fields active.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubTab('fabricate')}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition duration-150 inline-flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-cyan-500/15"
                    title="Undergo construction yards sequence"
                  >
                    <Wrench size={11} title="Wrench build icon" /> Open Build Wing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(Object.entries(TROOP_DETAILS) as [string, any][]).map(([tId, details]) => {
                    const count = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                    const Icon = details.icon;
                    const percentageOfOverall = totalTroopsCount > 0 ? (count / totalTroopsCount) * 100 : 0;

                    return (
                      <div 
                        key={tId}
                        className="p-4 border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {details.image ? (
                            <div 
                              onClick={() => {
                                setActiveImageZoom(details.image);
                                setActiveImageZoomTitle(details.name);
                              }}
                              className="relative w-12 h-12 rounded-xl border border-[#1E293B] overflow-hidden shrink-0 bg-[#05070a]/90 cursor-pointer hover:border-cyan-500/40" 
                              title={`Click to expand full resolution ${details.name}`}
                            >
                              <img 
                                src={details.image} 
                                alt={details.name} 
                                className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-350"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className={`p-3 rounded-xl border border-[#1E293B] shrink-0 ${details.color}`} title={`${details.name}: ${details.desc}. Hover/long press for stats.`}>
                              <Icon size={18} title={`${details.name}`} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white font-mono">{details.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({percentageOfOverall.toFixed(1)}%)</span>
                            </div>
                             <div className="text-[11px] text-slate-450 mt-1 flex items-center gap-3 font-mono flex-wrap">
                               <span className="text-orange-400 font-bold" title="Total Firepower Attack HP">⚔️ {(details.attackHp * count).toLocaleString()} <span className="text-[9px] text-slate-600">ATK</span></span>
                               <span className="text-slate-600">&bull;</span>
                               <span className="text-blue-400 font-bold" title="Total Defensive HP / Shields">🛡️ {(details.defenceHp * count).toLocaleString()} <span className="text-[9px] text-slate-600">DEF</span></span>
                               <span className="text-slate-600">&bull;</span>
                               <span className="text-emerald-400 font-bold" title="Total Cargo capacity">📦 {(details.carry * count).toLocaleString()} <span className="text-[9px] text-slate-600">CAP</span></span>
                             </div>
                            
                            {/* Visual progress distribution metric */}
                            <div className="w-full bg-slate-950 h-1 rounded-full mt-2.5 overflow-hidden border border-white/5">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  tId === 'defender' ? 'bg-blue-500' :
                                  tId === 'attacker' ? 'bg-red-500' :
                                  tId === 'tank' ? 'bg-amber-500' :
                                  tId === 'looter' ? 'bg-emerald-500' :
                                  tId === 'drone' ? 'bg-purple-500' : 'bg-teal-500'
                                }`}
                                style={{ width: `${percentageOfOverall}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                          <div className="text-right font-mono">
                            <div className="text-[9px] text-[#5bc0be] uppercase tracking-wider font-bold">In Space Force</div>
                            <div className="text-base font-bold text-cyan-400 mt-0.5">{count.toLocaleString()}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSubTab('fabricate');
                              setQuantities(p => ({ ...p, [tId]: Math.max(1, p[tId] || 1) }));
                            }}
                            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-500/40 text-cyan-400 text-[10px] font-bold uppercase tracking-wider font-mono rounded-lg transition"
                          >
                            Build
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: FABRICATE RECRUITING MODULE (Original full control flow) */}
      {subTab === 'fabricate' && (
        <div className="space-y-1.5 animate-fade-in">
          {/* Active Training Queues Drop Down Box like resources */}
          <div className="border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-md">
            {/* Accordion Trigger */}
            <button 
              onClick={() => setIsBuildQueueOpen(!isBuildQueueOpen)}
              className="w-full p-4 flex items-center justify-between text-left transition hover:bg-white/[0.02] cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl border border-cyan-500/25 bg-cyan-950/40 text-cyan-400 shadow-inner" title="Station Build Queue status indicator">
                  <Clock size={18} className={activePlanet.trainingQueue.length > 0 ? "animate-pulse" : ""} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base font-mono">Station Build Queue</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      ({activePlanet.trainingQueue.length} Batches)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {activePlanet.trainingQueue.length > 0 
                      ? `Building ${activePlanet.trainingQueue.reduce((acc, curr) => acc + curr.count, 0)} total units`
                      : 'No active production runs'
                    }
                  </p>
                </div>
              </div>
              <div>
                {isBuildQueueOpen ? (
                  <ChevronUp size={18} className="text-red-500" />
                ) : (
                  <ChevronDown size={18} className="text-emerald-500" />
                )}
              </div>
            </button>

            {/* Accordion Content */}
            {isBuildQueueOpen && (
              <div className="p-4 border-t border-[#1E293B] bg-black/20 space-y-4">
                {/* Summary Grid: Total queued vs Owned */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.entries(TROOP_DETAILS) as [string, any][]).map(([tId, details]) => {
                    const owned = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                    const queued = queuedCounts[tId] || 0;
                    const Icon = details.icon;

                    return (
                      <div key={tId} className="p-3 rounded-xl border border-[#1E293B]/70 bg-[#05070A]/90 hover:border-white/10 transition">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`p-1.5 rounded-lg border border-white/5 ${details.color}`}>
                            <Icon size={12} />
                          </div>
                          <span className="text-[11px] font-bold text-white truncate font-mono">{details.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-center">
                          <div className="p-1.5 bg-slate-900 border border-white/5 rounded-lg">
                            <span className="text-slate-500 block text-[8px] uppercase font-bold">Have</span>
                            <span className="font-bold text-cyan-400">{owned.toLocaleString()}</span>
                          </div>
                          <div className={`p-1.5 border border-white/5 rounded-lg ${queued > 0 ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20' : 'bg-slate-900 text-slate-500'}`}>
                            <span className="block text-[8px] uppercase font-bold">Queued</span>
                            <span className="font-bold">{queued.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Queue listing timeline */}
                {activePlanet.trainingQueue.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black tracking-widest text-[#5bc0be] uppercase font-mono block">Timeline Queue Output</span>
                    <div className="space-y-2 leading-relaxed">
                      {activePlanet.trainingQueue.map((item, idx) => {
                        const spec = TROOP_DETAILS[item.troopId as keyof typeof TROOP_DETAILS];
                        return (
                          <div 
                            key={idx}
                            className="p-3 rounded-xl border border-[#1E293B] bg-[#05070A]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-1.5 rounded-lg bg-white/5 text-[9px] font-black text-cyan-400 border border-white/5 shrink-0">#{idx + 1}</span>
                              <div>
                                <div className="font-bold text-slate-200">
                                  {spec?.name} <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded">&times; {item.count}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  Assembly completes in: <span className="text-amber-400 font-bold">{getTimerString(item.completedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-[#1E293B] text-center font-mono">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Production queues idle</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="w-full flex items-center justify-between gap-3 mb-2 border-b border-[#1E293B]/60 pb-2 text-left"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5bc0be] font-mono flex items-center gap-2">
              Build Tactical Forces
            </h3>
          </div>

          {showBuildForces && (
            <div className="grid grid-cols-1 gap-5">
              {(Object.entries(TROOP_DETAILS) as [string, any][]).map(([tId, details]) => {
                const Icon = details.icon;
                const currentCount = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                const isInfoActive = activeTroopInfo === tId;
                const qty = quantities[tId] !== undefined ? quantities[tId] : 0;
                const requiredLevel = TROOP_REQUIRED_LEVELS[tId] || 0;
                
                const allWarRoomsReached22 = player.planets.every(pl => (pl.buildings.armyBase?.level || 0) >= 22);
                const isLocked = (armyBaseLevel < requiredLevel) || (tId === 'settlementShip' && !allWarRoomsReached22);

                return (
                  <div 
                    key={tId}
                    className={`p-5 border rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md flex flex-col gap-4.5 hover:border-white/10 transition duration-150 overflow-hidden ${isLocked ? 'border-red-950/40 relative opacity-75' : 'border-[#1E293B]'}`}
                    id={`troop_card_${tId}`}
                  >
                  {/* Aspect-Ratio Rich Troop Image Banner */}
                  {details.image && (
                    <div 
                      onClick={() => {
                        setActiveImageZoom(details.image);
                        setActiveImageZoomTitle(details.name);
                      }}
                      className="relative h-28 w-full rounded-lg overflow-hidden border border-white/5 bg-[#05070a] -mt-1 -mx-1 mb-2 cursor-pointer group/img"
                      title="Click to view full-sized spacecraft blueprint"
                    >
                      <img 
                        src={details.image} 
                        alt={details.name} 
                        className="w-full h-full object-cover opacity-60 group-hover/img:opacity-80 group-hover/img:scale-102 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1D] via-transparent to-[#0A0F1D]/30" />
                      
                      {/* Interactive scanner lines/scitech corner guides */}
                      <div className="absolute inset-0 border border-cyan-500/0 group-hover/img:border-cyan-500/20 transition-all duration-300 rounded-lg pointer-events-none" />
                      <div className="absolute inset-0 bg-cyan-950/5 opacity-0 group-hover/img:opacity-30 transition-all duration-300 pointer-events-none" />
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-3.5 rounded-xl border border-[#1E293B] shrink-0 shadow-lg select-none ${details.color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white text-base font-mono">{details.name}</span>
                          {isLocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-950/50 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse shadow-sm">
                              {tId === 'settlementShip' && !allWarRoomsReached22 ? "🔒 ALL WAR ROOMS REQ LV. 22" : `🔒 REQ WAR ROOM LV. ${requiredLevel}`}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-[#1E293B]">
                              SPACE FORCE: {currentCount}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => setActiveTroopInfo(isInfoActive ? null : tId)}
                          className="text-xs text-cyan-400 underline text-left cursor-pointer hover:text-cyan-300 block mt-1"
                        >
                          {isInfoActive ? 'Hide specs & parameters' : 'Show tactical specifications'}
                        </button>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono shrink-0">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Division Spec</div>
                      <div className="text-xs font-bold text-slate-300 mt-1 uppercase">
                        {details.name.split(' ')[1]} Grade Ship
                      </div>
                    </div>
                  </div>

                  {/* Optional expanded spec panel */}
                  {isInfoActive && (() => {
                    const waterVal = 
                      tId === 'defender' ? 1.0 :
                      tId === 'attacker' ? 2.0 :
                      tId === 'tank' ? 4.0 :
                      tId === 'looter' ? 3.0 :
                      tId === 'drone' ? 0.4 :
                      5.0; // settlementShip is 5.0

                    return (
                      <div className="p-4 rounded-xl border border-[#1E293B] bg-[#05070A] text-xs space-y-2.5 font-mono">
                        <p className="text-slate-400 font-sans leading-relaxed text-[11px] mb-3">{details.desc}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 col-span-1 sm:col-span-2">
                            <span className="text-slate-500">Structural HP / Shields:</span>
                            <span className="text-blue-400 font-bold">{details.defenceHp} HP</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 col-span-1 sm:col-span-2">
                            <span className="text-slate-500">Strike Firepower / Attack HP:</span>
                            <span className="text-orange-400 font-bold">{details.attackHp} HP</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-sans sm:font-mono font-bold col-span-1 sm:col-span-2">
                            <span className="text-slate-500">Loot Capacity:</span>
                            <span className="text-emerald-400 font-bold">{details.carry.toLocaleString()} cargo</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-sans sm:font-mono font-bold col-span-1 sm:col-span-2">
                            <span className="text-slate-500">Assembly Duration:</span>
                            {(() => {
                              const baseTimes: Record<string, number> = { defender: 30, attacker: 20, tank: 60, looter: 40, drone: 15, settlementShip: 120 };
                              const baseSecs = baseTimes[tId] || 30;
                              const rcLevel = activePlanet.buildings.researchCenter.level;
                              const reductionFrac = Math.min(0.7, 0.7 * (rcLevel / 20));
                              const buildSecs = Math.max(1, Math.round(baseSecs * (1 - reductionFrac)));
                              return (
                                <span className="text-cyan-400 font-bold">
                                  {buildSecs}s <span className="text-slate-500 text-[10px] font-normal font-sans">(Base: {baseSecs}s)</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Unit construction cost per ship */}
                        <div className="border-t border-white/5 pt-2.5 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block text-left">Unit Construction Cost:</span>
                          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                            <div className={`py-1.5 px-1 rounded flex flex-col items-center justify-center border font-bold ${details.costs.water > 0 ? 'text-cyan-400 border-cyan-500/15 bg-cyan-500/5' : 'text-slate-600 border-white/5 opacity-50'}`}>
                              <Droplet size={10} className="mb-0.5" />
                              <span>{details.costs.water}</span>
                            </div>
                            <div className={`py-1.5 px-1 rounded flex flex-col items-center justify-center border font-bold ${details.costs.plasma > 0 ? 'text-purple-400 border-purple-500/15 bg-purple-500/5' : 'text-slate-600 border-white/5 opacity-50'}`}>
                              <Zap size={10} className="mb-0.5" />
                              <span>{details.costs.plasma}</span>
                            </div>
                            <div className={`py-1.5 px-1 rounded flex flex-col items-center justify-center border font-bold ${details.costs.fuel > 0 ? 'text-amber-500 border-amber-500/15 bg-amber-500/5' : 'text-slate-600 border-white/5 opacity-50'}`}>
                              <Flame size={10} className="mb-0.5" />
                              <span>{details.costs.fuel}</span>
                            </div>
                            <div className={`py-1.5 px-1 rounded flex flex-col items-center justify-center border font-bold ${details.costs.food > 0 ? 'text-emerald-400 border-emerald-500/15 bg-emerald-500/5' : 'text-slate-600 border-white/5 opacity-50'}`}>
                              <Apple size={10} className="mb-0.5" />
                              <span>{details.costs.food}</span>
                            </div>
                            <div className={`py-1.5 px-1 rounded flex flex-col items-center justify-center border font-bold ${details.costs.respirant > 0 ? 'text-blue-400 border-blue-500/15 bg-blue-500/5' : 'text-slate-600 border-white/5 opacity-50'}`}>
                              <Wind size={10} className="mb-0.5" />
                              <span>{details.costs.respirant}</span>
                            </div>
                          </div>
                        </div>

                        {/* Consumable Maintenance details */}
                        <div className="border-t border-white/5 pt-2.5 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block text-left">Consumable Maintenance (per Unit / hour):</span>
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="py-1 px-1.5 rounded bg-cyan-950/20 border border-cyan-500/15 text-cyan-400 font-bold">
                              💧 H2O: {waterVal}/hr
                            </div>
                            <div className="py-1 px-1.5 rounded bg-blue-950/20 border border-blue-500/15 text-blue-400 font-bold">
                              💨 O2: {(waterVal * 0.28).toFixed(3).replace(/\.?0+$/, '')}/hr
                            </div>
                            <div className="py-1 px-1.5 rounded bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 font-bold">
                              🍏 Food: {(waterVal * 0.18).toFixed(3).replace(/\.?0+$/, '')}/hr
                            </div>
                          </div>
                        </div>

                        {/* Total Consumable Maintenance for ALL units of this type in the station */}
                        <div className="border-t border-white/5 pt-2.5 mt-2.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block text-left">
                            Total Maintenance of Current Stationed {details.name} ({currentCount} units):
                          </span>
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="py-1 px-1.5 rounded bg-cyan-950/20 border border-cyan-500/15 text-cyan-400 font-bold">
                              💧 H2O: {(waterVal * currentCount).toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr
                            </div>
                            <div className="py-1 px-1.5 rounded bg-blue-950/20 border border-blue-500/15 text-blue-400 font-bold">
                              💨 O2: {(waterVal * 0.28 * currentCount).toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr
                            </div>
                            <div className="py-1 px-1.5 rounded bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 font-bold">
                              🍏 Food: {(waterVal * 0.18 * currentCount).toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr
                            </div>
                          </div>
                        </div>

                        {/* Grand Total Consumable Maintenance for ALL troops in the station */}
                        {(() => {
                          let stationTotalH2o = 0;
                          const specCosts = { defender: 1.0, attacker: 2.0, tank: 4.0, looter: 3.0, drone: 0.4, settlementShip: 5.0 };
                          Object.entries(activePlanet.troops).forEach(([tId, count]) => {
                            stationTotalH2o += (count as number) * (specCosts[tId as keyof typeof specCosts] || 0);
                          });
                          const stationTotalO2 = stationTotalH2o * 0.28;
                          const stationTotalFood = stationTotalH2o * 0.18;

                          return (
                            <div className="border-t border-white/5 pt-2.5 mt-2.5">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block text-left">
                                Grand Total Force Station Maintenance:
                              </span>
                              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                                <div className="py-1 px-1.5 rounded bg-indigo-950/20 border border-indigo-500/15 text-indigo-400 font-bold">
                                  💧 H2O: {stationTotalH2o.toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr
                                </div>
                                <div className="py-1 px-1.5 rounded bg-indigo-950/20 border border-indigo-500/15 text-indigo-400 font-bold">
                                  💨 O2: {stationTotalO2.toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr
                                </div>
                                <div className="py-1 px-1.5 rounded bg-indigo-950/20 border border-indigo-500/15 text-indigo-400 font-bold">
                                  🍏 Food: {stationTotalFood.toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* ACTIVE TRAINING QUEUE PROGRESS WITH EXACT REMAINING SECONDS REMOVED TO CONCENTRATE IN UPPER COMPONENT */}

                  {/* Control dispatch footer */}
                  {(() => {
                    if (isLocked) {
                      return (
                        <div className="w-full p-4 rounded-xl border border-red-500/20 bg-red-950/15 text-center font-mono mt-2">
                          <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                            <span>🔒 Fabrication Status: Off-line</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                            {tId === 'settlementShip' && !allWarRoomsReached22 ? (
                              <>
                                Upgrade <strong className="text-white">ALL your War Rooms to Level 22</strong> to construct a Settlement Ship.
                              </>
                            ) : (
                              <>
                                Upgrade your War Room to <strong className="text-white">Level {requiredLevel}</strong> to assemble {details.name}s on this base.
                              </>
                            )}
                          </p>
                        </div>
                      );
                    }

                    const maxAffordable = (() => {
                      let maxVal = Infinity;
                      Object.entries(details.costs).forEach(([res, amount]) => {
                        const costAmt = amount as number;
                        if (costAmt > 0) {
                          const resources = localResources || activePlanet.resources;
                          const available = resources[res as keyof typeof resources] || 0;
                          const possible = Math.floor(available / costAmt);
                          if (possible < maxVal) {
                            maxVal = possible;
                          }
                        }
                      });
                      return maxVal === Infinity ? 0 : maxVal;
                    })();

                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#1E293B]">
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Build count:</span>
                            <input 
                              type="number"
                              min={0}
                              max={999999}
                              value={qty === 0 ? '' : qty}
                              placeholder="0"
                              onChange={(e) => handleQtyChange(tId, e.target.value)}
                              className="w-16 px-3 py-1.5 bg-[#05070A] border border-[#1E293B] rounded-xl font-mono text-xs text-white text-center focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                            />
                          </div>

                           {/* QUICK CHOOSER: 10, 50, 100, 1000, 10000 PRESETS */}
                           <div className="flex flex-wrap items-center gap-1.5 mt-1">
                             {[10, 50, 100, 1000, 10000].map((num) => {
                               if (num > maxAffordable) return null;
                               if (tId === 'settlementShip' && num > 1) return null;
                               return (
                                 <button
                                   key={num}
                                   type="button"
                                   onClick={() => {
                                     setQuantities(prev => ({ ...prev, [tId]: num }));
                                     if (!isUpgrading) onTrainTroops(tId, num);
                                   }}
                                   className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition cursor-pointer ${
                                     qty === num 
                                       ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                                       : 'bg-[#05070A] text-slate-400 border-[#1E293B] hover:text-slate-200 hover:border-slate-700'
                                   }`}
                                 >
                                   {num.toLocaleString()}
                                 </button>
                               );
                             })}
                           </div>
                        </div>

                        <button
                          onClick={() => onTrainTroops(tId, qty)}
                          disabled={isUpgrading || qty <= 0}
                          className="px-5 py-3 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/35 hover:border-cyan-500/55 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] uppercase tracking-widest font-mono rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto disabled:opacity-50"
                        >
                          <Play size={11} />
                          Begin Build
                        </button>
                      </div>
                    );
                  })()}

                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: FLEET COMMAND VIEW */}
      {subTab === 'fleet' && (
        <div className="space-y-1.5 animate-fade-in">
          {/* Main Title Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase font-mono">DOCK BAY DISPATCH TERMINAL</span>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Duty Space Fleet Deployments</h2>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Coordinate galactic missions directly from the safety of the War Room. Launch fast reconnaissance, territorial attacks, or settle new habitable worlds scan grids.
              </p>
            </div>
            {/* Quick status counters */}
            <div className="flex gap-4 font-mono shrink-0">
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-center">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Active Fleets</span>
                <span className="text-xl font-black text-emerald-400">
                  {fleets.filter(f => f.senderId === player.id).length}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-center">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Incoming Threats</span>
                <span className="text-xl font-black text-red-400 animate-pulse">
                  {fleets.filter(f => f.targetId === player.id && f.missionType === "attack" && !f.isReturning && f.arrivesAt > serverTime).length}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Deploy New Fleet Form Box */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              
              {/* Form implementation */}
              <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-2xl space-y-4 text-left">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] border-b border-[#1E293B]/60 pb-2 flex items-center justify-between">
                  <span>⚡ CONSTRUCT RESERVE TACTICAL FLEETS</span>
                  <span className="text-[9px] font-mono text-slate-500">Origin Station [{activePlanet.sectorX}, {activePlanet.sectorY}]</span>
                </h3>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateFleet();
                }} className="space-y-4">
                  
                  {/* Fleet Name inputs */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Fleet Name Designation</label>
                    <input 
                      type="text"
                      value={fleetName}
                      onChange={(e) => setFleetName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-[#5bc0be] text-xs text-white rounded-xl focus:outline-none"
                      placeholder="e.g. Red Squadron Alpha (Auto if blank)"
                    />
                  </div>

                  {/* Fleet Subsidiary */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Subsidiary / Division Designation</label>
                    <input 
                      type="text"
                      value={fleetSubsidiary}
                      onChange={(e) => setFleetSubsidiary(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-[#5bc0be] text-xs text-white rounded-xl focus:outline-none"
                      placeholder="e.g. Orbital Mining Subsidiary, Garrison Ops"
                    />
                  </div>

                  {/* Quantity to create */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">How Many Duplicate Fleets?</label>
                    <input 
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={fleetAmount}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === '') {
                          setFleetAmount('');
                        } else {
                          const valParsed = parseInt(valStr, 10);
                          setFleetAmount(isNaN(valParsed) ? '' : Math.max(1, valParsed));
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-[#5bc0be] text-xs text-white font-mono font-bold focus:outline-none rounded-xl"
                      placeholder="Quantity to create"
                    />
                  </div>

                  {/* Allocated Troops layout list */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Allocate Ships inside Each Fleet Cargo</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/20 p-2 border border-[#1E293B]/40 rounded-xl font-mono text-[10px]">
                      {Object.keys(TROOP_NAME_MAPPING).map((tId) => {
                        const avail = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                        return (
                          <div key={tId} className="flex items-center justify-between p-1.5 bg-[#05070A]/80 border border-[#1E293B]/40 hover:border-cyan-500/20 rounded-lg transition-colors">
                            <div className="min-w-0 pr-1">
                              <span className="font-bold text-slate-200 block truncate" title={TROOP_NAME_MAPPING[tId]}>{TROOP_NAME_MAPPING[tId]}</span>
                              <span className="text-[8.5px] text-slate-500 font-bold block">In-Hangar: <strong className="text-cyan-400 font-extrabold">{avail}</strong></span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 bg-slate-950/40 p-0.5 rounded-lg border border-[#1E293B]/40">
                              <button
                                type="button"
                                onClick={() => setFleetTroops(prev => ({ ...prev, [tId]: 0 }))}
                                className="px-1.5 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] font-bold text-slate-300 rounded"
                              >
                                Min
                              </button>
                              <input 
                                type="number"
                                min={0}
                                max={avail}
                                value={fleetTroops[tId] === 0 ? '' : fleetTroops[tId]}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = Math.min(avail, Math.max(0, parseInt(e.target.value, 10) || 0));
                                  setFleetTroops(prev => ({ ...prev, [tId]: val }));
                                }}
                                className="w-14 text-center bg-[#05070A] border border-[#1E293B]/30 rounded font-mono text-[10px] text-white py-0.5 focus:outline-none focus:border-cyan-500 font-extrabold"
                              />
                              <button
                                type="button"
                                disabled={avail === 0}
                                onClick={() => setFleetTroops(prev => ({ ...prev, [tId]: avail }))}
                                className="px-1.5 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] text-cyan-400 rounded disabled:opacity-30 font-bold"
                              >
                                Max
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost warning */}
                  {Object.values(fleetTroops).some(qty => Number(qty) > 0) && (
                    <div className="p-3 bg-cyan-950/25 border border-cyan-500/30 rounded-xl space-y-1 font-mono text-[10px] text-slate-300">
                      <p className="font-bold text-cyan-400 uppercase">Total Hangar Deduction Summary</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-slate-400">
                        {Object.entries(fleetTroops).map(([tId, count]) => {
                          const qty = Number(count) || 0;
                          if (qty <= 0) return null;
                          const total = qty * (Number(fleetAmount) || 0);
                          return (
                            <div key={tId} className="flex justify-between">
                              <span>{TROOP_NAME_MAPPING[tId] || tId}:</span>
                              <span className="font-bold text-white">{total}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Create Button */}
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition duration-150 cursor-pointer shadow-md leading-none flex items-center justify-center gap-2"
                  >
                    <Rocket size={13} className="animate-pulse" />
                    <span>{isCreating ? 'CONSTRUCTING FLEETS...' : 'CREATE TACTICAL FLEETS'}</span>
                  </button>
                </form>
              </div>

              {/* Garrisoned Reserve Fleets list on this station */}
              <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-2xl space-y-3 text-left">
                <h3 
                  onClick={() => setIsReservesExpanded(!isReservesExpanded)}
                  className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] border-b border-[#1E293B]/60 pb-2 flex items-center justify-between cursor-pointer select-none hover:text-cyan-400 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🎒 DOCKED RESERVE ({createdFleets.filter(f => f.planetId === activePlanet.id).length})</span>
                    <span className="text-[10px] text-slate-500 font-mono">{isReservesExpanded ? '▼' : '▶'}</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 hover:underline">
                    {isReservesExpanded ? 'Collapse' : 'Expand Reserves'}
                  </span>
                </h3>

                {isReservesExpanded && (
                  createdFleets.filter(f => f.planetId === activePlanet.id).length === 0 ? (
                    <div className="py-8 border border-dashed border-[#1E293B] text-center rounded-xl font-sans">
                      <p className="text-xs text-slate-400">No en-garrisoned reserve fleets at this station.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Design a squadron above and click Create Fleets to prepare a tactical reserve.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {createdFleets.filter(f => f.planetId === activePlanet.id).map((fleet) => (
                        <div key={fleet.id} className="p-3 bg-[#05070A] border border-[#1E293B] rounded-xl space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 text-left">
                              <span className="font-bold text-xs text-slate-100 block truncate">{fleet.name}</span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-cyan-400 font-mono px-1.5 py-0.5 bg-cyan-950/30 border border-cyan-800/30 rounded inline-block uppercase tracking-wide">
                                  {fleet.subsidiary}
                                </span>
                                {fleet.isTraveling && (
                                  <span className="text-[9px] text-amber-400 font-mono px-1.5 py-0.5 bg-amber-950/35 border border-amber-850/40 rounded inline-block uppercase tracking-wide animate-pulse">
                                    🚀 IN FLIGHT
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isRefunding === fleet.id || fleet.isTraveling}
                              onClick={() => handleDisbandFleet(fleet)}
                              className="px-2 py-1 text-[9px] font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-900/30 border border-red-500/25 rounded transition cursor-pointer font-mono select-none disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isRefunding === fleet.id ? 'Refunding...' : 'Disassemble'}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1 text-[9.5px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
                            {Object.entries(fleet.troops).map(([tId, count]) => {
                              const qty = Number(count) || 0;
                              if (qty <= 0) return null;
                              return (
                                <div key={tId} className="flex justify-between px-1">
                                  <span>{TROOP_NAME_MAPPING[tId] || tId}:</span>
                                  <span className="font-bold text-slate-200">{qty}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Carried Cargo Display */}
                          {fleet.resources && Object.values(fleet.resources).some(v => (Number(v) || 0) > 0) && (
                            <div className="pt-1.5 border-t border-[#1E293B]/60 text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider font-mono">📦 Carried Cargo:</span>
                                <button
                                  type="button"
                                  disabled={isUnloading === fleet.id || fleet.isTraveling}
                                  onClick={() => handleManualUnload(fleet)}
                                  className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-400 border border-amber-500/25 rounded text-[8px] font-bold uppercase transition cursor-pointer"
                                >
                                  {isUnloading === fleet.id ? 'Unloading...' : 'Unload All'}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-amber-200 bg-amber-950/10 p-1.5 border border-amber-500/10 rounded-lg">
                                {Object.entries(fleet.resources).map(([res, val]) => {
                                  const qty = Number(val) || 0;
                                  if (qty <= 0) return null;
                                  return (
                                    <div key={res} className="flex justify-between px-1">
                                      <span className="capitalize">{res}:</span>
                                      <span className="font-bold text-white">{qty.toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {!fleet.isTraveling && (
                            <div className="mt-1 pb-1 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  if (managingCargoFleetId === fleet.id) {
                                    setManagingCargoFleetId(null);
                                  } else {
                                    setManagingCargoFleetId(fleet.id);
                                    setCargoTransfers({
                                      water: 0,
                                      plasma: 0,
                                      fuel: 0,
                                      food: 0,
                                      respirant: 0
                                    });
                                  }
                                }}
                                className={`w-full py-1 text-[9.5px] font-bold uppercase rounded font-mono transition duration-150 cursor-pointer flex items-center justify-center gap-1 ${
                                  managingCargoFleetId === fleet.id
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/20 border border-emerald-500/20 hover:border-emerald-500/40'
                                }`}
                              >
                                <span>🚚</span>
                                <span>{managingCargoFleetId === fleet.id ? 'CLOSE CARGO MANAGER' : 'MANAGE CARGO TRANSFERS'}</span>
                              </button>

                              {managingCargoFleetId === fleet.id && (
                                <div className="p-2 border border-emerald-500/20 bg-emerald-950/10 rounded-lg space-y-2.5 mt-2 font-sans">
                                  <div className="flex justify-between items-center border-b border-emerald-500/10 pb-1">
                                    <span className="text-[9.5px] font-bold text-emerald-400 uppercase font-mono">Cargo Logistics Center</span>
                                    <span className="text-[8.5px] font-mono text-slate-400">
                                      Cap: {(() => {
                                        let cap = 0;
                                        Object.entries(fleet.troops).forEach(([tId, qty]) => {
                                          const spec = TROOP_DETAILS[tId as keyof typeof TROOP_DETAILS];
                                          if (spec) cap += (Number(qty) || 0) * spec.carry;
                                        });
                                        const currentTotal = Object.values(fleet.resources || {}).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
                                        return `${currentTotal.toLocaleString()} / ${cap.toLocaleString()}`;
                                      })()}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {['water', 'plasma', 'fuel', 'food', 'respirant'].map((resKey) => {
                                      const planetAmt = activePlanet.resources[resKey as keyof typeof activePlanet.resources] || 0;
                                      const fleetAmt = fleet.resources?.[resKey as keyof typeof fleet.resources] || 0;
                                      const transferVal = cargoTransfers[resKey] || 0;

                                      return (
                                        <div key={resKey} className="space-y-1 p-1 bg-black/30 rounded border border-[#1E293B]/40">
                                          <div className="flex justify-between text-[9px] font-mono">
                                            <span className="capitalize font-bold text-slate-300">{resKey}</span>
                                            <span className="text-slate-400">
                                              Base: <span className="text-slate-200 font-bold">{planetAmt.toLocaleString()}</span> | Fleet: <span className="text-amber-200 font-bold">{fleetAmt.toLocaleString()}</span>
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1.5 justify-between">
                                            {/* Left / Unload Buttons - 2 rows of 3 compact buttons */}
                                            <div className="grid grid-cols-3 gap-0.5 shrink-0">
                                              {[
                                                { label: "-100", value: -100 },
                                                { label: "-1K", value: -1000 },
                                                { label: "-10K", value: -10000 },
                                                { label: "-100K", value: -100000 },
                                                { label: "-1M", value: -1000000 },
                                                { label: "ALL", value: -999999999 }
                                              ].map((btn) => (
                                                <button
                                                  key={btn.label}
                                                  type="button"
                                                  onClick={() => adjustTransfer(fleet, resKey, btn.value)}
                                                  className={`px-1 py-0.5 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900/30 text-[8px] font-mono rounded cursor-pointer leading-none text-center ${
                                                    btn.label === "ALL" ? "font-bold" : ""
                                                  }`}
                                                >
                                                  {btn.label}
                                                </button>
                                              ))}
                                            </div>

                                            {/* Transfer value display */}
                                            <div className="text-center px-1 min-w-[50px]">
                                              <span className={`text-[10px] font-mono font-bold block ${
                                                transferVal > 0 ? "text-emerald-400" : transferVal < 0 ? "text-amber-400" : "text-slate-400"
                                              }`}>
                                                {transferVal > 0 ? `+${transferVal.toLocaleString()}` : transferVal.toLocaleString()}
                                              </span>
                                            </div>

                                            {/* Right / Load Buttons - 2 rows of 3 compact buttons */}
                                            <div className="grid grid-cols-3 gap-0.5 shrink-0">
                                              {[
                                                { label: "+100", value: 100 },
                                                { label: "+1K", value: 1000 },
                                                { label: "+10K", value: 10000 },
                                                { label: "+100K", value: 100000 },
                                                { label: "+1M", value: 1000000 },
                                                { label: "MAX", value: 999999999 }
                                              ].map((btn) => (
                                                <button
                                                  key={btn.label}
                                                  type="button"
                                                  onClick={() => adjustTransfer(fleet, resKey, btn.value)}
                                                  className={`px-1 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/30 text-[8px] font-mono rounded cursor-pointer leading-none text-center ${
                                                    btn.label === "MAX" ? "font-bold" : ""
                                                  }`}
                                                >
                                                  {btn.label}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isTransferring === fleet.id}
                                    onClick={() => handleTransferResources(fleet.id)}
                                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#05070A] text-[10px] font-black uppercase tracking-wider rounded font-mono transition cursor-pointer"
                                  >
                                    {isTransferring === fleet.id ? 'PROCESSING SHIPMENTS...' : 'EXECUTE RESOURCE TRANSFERS'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {fleet.isTraveling ? (
                            <div className="mt-2.5 pt-2 text-center text-[10px] font-mono text-amber-400 bg-amber-950/15 border border-amber-550/20 rounded py-1.5 leading-tight">
                              🚀 Tactical fleet currently traveling in deep space on active mission orders.
                            </div>
                          ) : (
                            /* Inline direct launch form for this fleet */
                            <div className="mt-2.5 pt-2.5 border-t border-[#1E293B]/60 space-y-2 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeLaunchFleetId === fleet.id) {
                                    setActiveLaunchFleetId(null);
                                  } else {
                                    setActiveLaunchFleetId(fleet.id);
                                    // Prefit mission type
                                    const hasSettlement = (fleet.troops.settlementShip || 0) >= 1;
                                    const hasCombat = (fleet.troops.attacker || 0) >= 1 || (fleet.troops.tank || 0) >= 1 || (fleet.troops.looter || 0) >= 1 || (fleet.troops.defender || 0) >= 1;
                                    setDirectMissionType(hasSettlement ? 'colonize' : hasCombat ? 'attack' : 'move');
                                    setDirectLaunchX(activePlanet.sectorX);
                                    setDirectLaunchY(activePlanet.sectorY);
                                    setDirectTargetBuilding('random');
                                  }
                                }}
                                className={`w-full py-1 text-[10px] font-bold uppercase rounded font-mono transition duration-150 cursor-pointer flex items-center justify-center gap-1 ${
                                  activeLaunchFleetId === fleet.id
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                                    : 'bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/30 border border-cyan-500/30 hover:border-cyan-455'
                                }`}
                              >
                                <span>🛫</span>
                                <span>{activeLaunchFleetId === fleet.id ? 'CANCEL DISPATCH' : 'LAUNCH RESERVE FLEET'}</span>
                              </button>

                              {activeLaunchFleetId === fleet.id && (
                                <div className="p-2 border border-cyan-500/20 bg-cyan-950/10 rounded-lg space-y-2 mt-2 font-sans">
                                  <p className="text-[9px] text-slate-400 leading-tight">
                                    Configure destination sector coordinates and operational parameters immediately.
                                  </p>

                                  {/* Target coordinates inputs */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[8px] font-bold uppercase text-slate-500 font-mono block mb-0.5">Vector X</label>
                                      <input
                                        type="number"
                                        value={directLaunchX}
                                        onChange={(e) => setDirectLaunchX(parseInt(e.target.value, 10) || 0)}
                                        className="w-full bg-[#05070A] border border-[#1E293B] rounded px-1.5 py-1 text-[10px] text-white font-mono focus:outline-none focus:border-cyan-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-bold uppercase text-slate-500 font-mono block mb-0.5">Vector Y</label>
                                      <input
                                        type="number"
                                        value={directLaunchY}
                                        onChange={(e) => setDirectLaunchY(parseInt(e.target.value, 10) || 0)}
                                        className="w-full bg-[#05070A] border border-[#1E293B] rounded px-1.5 py-1 text-[10px] text-white font-mono focus:outline-none focus:border-cyan-400"
                                      />
                                    </div>
                                  </div>

                                  {/* Mission action selector */}
                                  <div>
                                    <label className="text-[8px] font-bold uppercase text-slate-500 font-mono block mb-0.5">Mission Directives</label>
                                    <select
                                      value={directMissionType}
                                      onChange={(e) => setDirectMissionType(e.target.value as any)}
                                      className="w-full bg-[#05070A] border border-[#1E293B] text-cyan-300 text-[10px] font-mono rounded px-1.5 py-1 focus:outline-none cursor-pointer"
                                    >
                                      <option value="move" className="bg-slate-950">🛸 MOVE (Transit/Reinforcements)</option>
                                      <option value="timed_move" className="bg-slate-950">⏱️ TIMED MOVE (24h Window)</option>
                                      <option value="attack" className="bg-slate-950">⚔️ ATTACK (Planetary Raid)</option>
                                      <option value="timed_attack" className="bg-slate-950">⏱️ TIMED ATTACK (24h Window)</option>
                                      <option value="colonize" className="bg-slate-950">🚀 COLONIZE (New Planet Settlement)</option>
                                      <option value="recon" className="bg-slate-950">📡 RECON (Stealth Probe)</option>
                                    </select>
                                  </div>

                                  {/* Timed landing coordinate picker */}
                                  {(directMissionType === 'timed_move' || directMissionType === 'timed_attack') && (() => {
                                    const distance = Math.hypot(directLaunchX - activePlanet.sectorX, directLaunchY - activePlanet.sectorY);
                                    let troopSpeedLevel = 1;
                                    try {
                                      const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
                                      const savedTech = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
                                      troopSpeedLevel = savedTech ? (JSON.parse(savedTech).troop_speed ?? (isFirstPlanet ? 20 : 0)) : (isFirstPlanet ? 20 : 0);
                                    } catch (err) {}
                                    const boostPct = Math.max(0, Math.min(35, (troopSpeedLevel - 1) * (35 / 19))) / 100;
                                    const speedMultiplier = 1.0 + boostPct;
                                    const speedMap: Record<string, number> = {
                                      defender: 7.0,
                                      attacker: 11.662,
                                      tank: 3.5,
                                      looter: 23.331,
                                      drone: 17.5,
                                      settlementShip: 4.662
                                    };
                                    const selectedTroops = Object.entries(fleet.troops).filter(([_, qty]) => (Number(qty) || 0) > 0);
                                    const slowestTroopSpeed = selectedTroops.length > 0
                                      ? (selectedTroops.reduce((slowest, [tId, _]) => {
                                          const sp = speedMap[tId] || 5;
                                          return sp < slowest ? sp : slowest;
                                        }, 100)) * speedMultiplier
                                      : 100;
                                    const travelTimeMs = slowestTroopSpeed > 0 ? Math.round((distance / slowestTroopSpeed) * 60000) : 0;

                                    const formatDateTimeLocalHelper = (timestamp: number) => {
                                      const d = new Date(timestamp);
                                      const y = d.getFullYear();
                                      const mo = String(d.getMonth() + 1).padStart(2, '0');
                                      const dy = String(d.getDate()).padStart(2, '0');
                                      const h = String(d.getHours()).padStart(2, '0');
                                      const mi = String(d.getMinutes()).padStart(2, '0');
                                      return `${y}-${mo}-${dy}T${h}:${mi}`;
                                    };

                                    const minVal = Date.now() + travelTimeMs;
                                    const maxVal = Date.now() + 24 * 3600 * 1000;
                                    const minStr = formatDateTimeLocalHelper(minVal);
                                    const maxStr = formatDateTimeLocalHelper(maxVal);

                                    const selectedMs = directTimedLandingTime ? new Date(directTimedLandingTime).getTime() : 0;
                                    const isLandingValid = selectedMs >= minVal - 5000 && selectedMs <= maxVal + 60000;

                                    return (
                                      <div className="bg-[#05070A] border border-amber-500/20 p-2 rounded-lg mt-2 space-y-1">
                                        <div className="flex justify-between items-center text-[8px] font-mono">
                                          <span className="text-amber-400 font-bold uppercase">⏱️ Landing Time</span>
                                          <span className="text-slate-500 font-sans">Max 24h</span>
                                        </div>
                                        <input
                                          type="datetime-local"
                                          value={directTimedLandingTime}
                                          min={minStr}
                                          max={maxStr}
                                          onChange={(e) => setDirectTimedLandingTime(e.target.value)}
                                          className="w-full bg-[#05070A] border border-amber-500/30 text-amber-400 text-[10px] font-mono py-1 px-1.5 rounded focus:outline-none focus:border-amber-400 cursor-pointer font-bold"
                                        />
                                        <div className="text-[8px] text-slate-400 font-mono space-y-0.5">
                                          <div className="flex justify-between">
                                            <span>Normal ETA:</span>
                                            <span>{new Date(minVal).toLocaleTimeString()}</span>
                                          </div>
                                          {isLandingValid ? (
                                            <div className="flex justify-between text-emerald-400 font-bold">
                                              <span>Delay offset:</span>
                                              <span>+{Math.round((selectedMs - minVal) / 60000)} min</span>
                                            </div>
                                          ) : (
                                            <div className="text-red-400 font-bold">
                                              {selectedMs < minVal ? "Too soon!" : "Exceeds 24h limit!"}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Disrupter target building choice */}
                                  {(fleet.troops.tank || 0) > 0 && (directMissionType === 'attack' || directMissionType === 'timed_attack') && (
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-bold uppercase text-amber-500 font-mono block mb-0.5">Disrupter Demolition Target</label>
                                      <select
                                        value={directTargetBuilding}
                                        onChange={(e) => setDirectTargetBuilding(e.target.value)}
                                        className="w-full bg-[#05070A] text-[9.5px] text-amber-400 font-mono border border-amber-500/20 py-1 px-1.5 rounded focus:outline-none cursor-pointer"
                                      >
                                        <option value="random">Random Structure (Default)</option>
                                        <optgroup label="Colony Buildings" className="bg-[#05070A] text-slate-300">
                                          <option value="fabricator">Fabricator</option>
                                          <option value="commsHub">Communications Hub</option>
                                          <option value="researchCenter">Research Center</option>
                                          <option value="armyBase">War Room</option>
                                          <option value="repository">Silo</option>
                                          <option value="radar">Radar Array</option>
                                          <option value="supplyNexus">Supply Nexus</option>
                                        </optgroup>
                                        <optgroup label="Extraction Mines" className="bg-[#05070A] text-slate-300">
                                          <option value="mines.water">Water Condenser Mine</option>
                                          <option value="mines.plasma">Plasma Synthesizer Mine</option>
                                          <option value="mines.fuel">Thermonuclear Fuel Mine</option>
                                          <option value="mines.food">Hydroponic Food Mine</option>
                                          <option value="mines.respirant">Aerosol Respirant Mine</option>
                                        </optgroup>
                                      </select>
                                    </div>
                                  )}

                                  {/* Button to confirm direct launch */}
                                  <button
                                    type="button"
                                    disabled={isLaunchingDirect}
                                    onClick={() => handleLaunchDirect(fleet)}
                                    className="w-full py-1.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:brightness-115 text-[#05070A] text-[10px] font-black uppercase tracking-wider rounded font-mono transition-all cursor-pointer"
                                  >
                                    {isLaunchingDirect ? 'LAUNCHING DIRECT...' : 'CONFIRM FLIGHT DISPATCH'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

            </div>

            {/* Tracking Active Missions Sidebar Panel */}
            <div className="lg:col-span-12 xl:col-span-7 p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-2xl flex flex-col justify-start">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] border-b border-[#1E293B]/60 pb-2 mb-4 flex items-center gap-2">
                <Rocket size={14} className="text-emerald-500" /> Real-Time Fleets Under Traveling Mission orders
              </h3>

              {/* Active list */}
              {fleets && fleets.filter(f => f.senderId === player.id || f.targetId === player.id).length > 0 ? (
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {fleets.filter(f => f.senderId === player.id || f.targetId === player.id).map((fleet) => {
                    const isOutgoing = fleet.senderId === player.id;
                    const isThreat = !isOutgoing && fleet.missionType === 'attack';
                    const diffTime = Math.max(0, fleet.arrivesAt - serverTime);
                    const arrivesString = diffTime > 0 
                      ? `Arrives in ${Math.round(diffTime / 1000)}s` 
                      : (fleet.isWaitingToSettle ? "WAITING FOR SETTLE" : "Arrived / Resolving");

                    return (
                      <div 
                        key={fleet.id} 
                        className={`p-3.5 border rounded-xl font-mono text-[11px] leading-relaxed relative ${
                          isThreat 
                            ? "bg-red-950/20 border-red-500/30 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.08)]" 
                            : isOutgoing 
                              ? "bg-cyan-950/20 border-cyan-500/25 text-cyan-300" 
                              : "bg-slate-900/50 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center font-bold uppercase text-[10px] tracking-wide mb-1.5 pb-1 border-b border-white/5 gap-2">
                          <span className="flex items-center flex-wrap gap-1.5">
                            <span>{isOutgoing ? "🛰️ OUTGOING FLEET" : "🚨 HOSTILE DETECTED"}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              fleet.missionType === 'attack' ? 'bg-red-500 text-slate-950' :
                              fleet.missionType === 'colonize' ? 'bg-teal-500 text-slate-950' :
                              'bg-amber-500 text-slate-950'
                            }`}>
                              {fleet.missionType.toUpperCase()}
                            </span>
                          </span>
                          <span className={`${isThreat ? "text-red-400 animate-pulse font-extrabold" : "text-emerald-400"} shrink-0`}>
                            {arrivesString}
                          </span>
                        </div>

                        <p className="mb-1 text-slate-300 break-words leading-normal select-text">
                          <strong>Comdr:</strong> {fleet.senderName} ({fleet.senderCoords.x}, {fleet.senderCoords.y}) &rarr; <strong>Target:</strong> {fleet.targetName} ({fleet.targetCoords.x}, {fleet.targetCoords.y})
                        </p>

                        <div className="mt-2 text-[9px] text-slate-400 bg-black/30 p-2 rounded-lg border border-slate-900/60 leading-normal">
                          <strong className="block mb-1 text-[8.5px] uppercase tracking-wider text-slate-500">Payload Crew Complement</strong>
                          <span>{Object.entries(fleet.troops).filter(([_, qty]) => Number(qty) > 0).map(([k, v]) => `${v} ${TROOP_NAME_MAPPING[k] || k}`).join(', ')}</span>
                          {fleet.lootCarried && Object.values(fleet.lootCarried).some(v => Number(v) > 0) && (
                            <span className="block mt-1 text-emerald-400">
                              Loot: {Object.entries(fleet.lootCarried).map(([k, v]) => `${(v || 0).toLocaleString()} ${k}`).join(', ')}
                            </span>
                          )}
                        </div>

                        {/* If Settle button is authorized */}
                        {isOutgoing && fleet.isWaitingToSettle && (
                          <div className="mt-2.5">
                            <span className="text-[10px] text-teal-400 font-extrabold animate-pulse block mb-1.5">★ HABITABLE COORDINATES CAPTURED & READY CORING!</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSettle) {
                                  onSettle(fleet.id);
                                }
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-mono font-bold text-[9px] rounded-lg tracking-widest cursor-pointer leading-none"
                            >
                              🚀 INITIATE HABITATION COLONIAL CORING
                            </button>
                          </div>
                        )}

                        {/* Cancel, Recall & Reroute Actions */}
                        {isOutgoing && !fleet.isReturning && (
                          <div className="mt-3.5 space-y-2 border-t border-slate-800/40 pt-2.5">
                            {fleet.isWaitingToSettle ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onCancelFleet) onCancelFleet(fleet.id);
                                  }}
                                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold uppercase text-[9px] rounded-lg transition cursor-pointer text-center"
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
                                  className="py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-bold uppercase text-[9px] rounded-lg transition cursor-pointer text-center"
                                >
                                  📍 Move planet
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {(() => {
                                  const totalDuration = fleet.arrivesAt - fleet.startedAt;
                                  const elapsed = serverTime - fleet.startedAt;
                                  const progressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
                                  const isAttack = fleet.missionType === 'attack';
                                  const cannotRecallAttack = isAttack && progressPercent > 45;

                                  return (
                                    <button
                                      type="button"
                                      disabled={cannotRecallAttack}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onCancelFleet) onCancelFleet(fleet.id);
                                      }}
                                      className={`py-1.5 px-3 font-bold uppercase text-[9px] rounded-lg transition border text-center ${
                                        cannotRecallAttack
                                          ? 'bg-red-950/40 text-red-500 border-red-950 cursor-not-allowed'
                                          : 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-500/30 cursor-pointer'
                                      }`}
                                    >
                                      {cannotRecallAttack ? `🚫 Locked (${Math.round(progressPercent)}%)` : '🛑 Abort Mission'}
                                    </button>
                                  );
                                })()}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReroutingFleetId(fleet.id);
                                    setRerouteX('');
                                    setRerouteY('');
                                  }}
                                  className="py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 font-bold uppercase text-[9px] rounded-lg transition cursor-pointer text-center"
                                >
                                  📍 Reroute
                                </button>
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
                                      max="100"
                                      value={rerouteX}
                                      onChange={(e) => setRerouteX(e.target.value)}
                                      placeholder="0-100"
                                      className="w-full bg-[#05070A] border border-slate-800 text-cyan-400 rounded px-2 py-1 text-xs text-center font-bold"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Coord Y</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={rerouteY}
                                      onChange={(e) => setRerouteY(e.target.value)}
                                      placeholder="0-100"
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
                                      if (isNaN(tx) || isNaN(ty) || tx < 0 || tx > 100 || ty < 0 || ty > 100) {
                                        showToast('Invalid coordinates (0-100 allowed)', 'error');
                                        return;
                                      }
                                      if (onRerouteFleet) {
                                        await onRerouteFleet(fleet.id, tx, ty);
                                        setReroutingFleetId(null);
                                      }
                                    }}
                                    className="flex-1 py-1 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded font-bold uppercase text-[9px] cursor-pointer"
                                  >
                                    Confirm Jump
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReroutingFleetId(null)}
                                    className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded font-bold uppercase text-[9px] cursor-pointer"
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
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-900 rounded-xl text-slate-500 min-h-[220px]">
                  <Rocket size={24} className="text-slate-600 mb-2" />
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Launch Control Secure</p>
                  <p className="text-[10px] text-slate-600 font-sans mt-1 leading-normal max-w-sm">No fleets are traveling. Initiate coordinate trajectories in the Dock Bay form.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* SECURITY BATTLE ARCHIVES MODAL POPUP */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0A0F1D] border border-[#1E293B] rounded-2xl p-6 space-y-4 font-mono shadow-[0_0_50px_rgba(239,68,68,0.15)] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-400 animate-pulse" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Planetary Attack Reports</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onMarkAllRead) onMarkAllRead();
                    // Mark all locally as seen
                    const updatedSeen = { ...seenReports };
                    battleReports.forEach(r => {
                      updatedSeen[r.id] = true;
                    });
                    setSeenReports(updatedSeen);
                    localStorage.setItem('moonbase_seen_reports', JSON.stringify(updatedSeen));
                  }}
                  className="py-1 px-2.5 bg-cyan-500/15 hover:bg-cyan-500/35 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 font-bold rounded-lg transition-all text-[10px] uppercase tracking-wider cursor-pointer font-mono"
                >
                  ✓ Mark All Read
                </button>
                <button 
                  onClick={() => setShowReportsModal(false)}
                  className="text-slate-400 hover:text-white font-sans text-xl cursor-pointer p-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Save/All/Unread custom bookmark filter category bar */}
            <div className="flex gap-2 pb-1 text-xs">
              <button
                type="button"
                onClick={() => setCombatLogsFilter('all')}
                className={`flex-1 py-1.5 px-3 font-bold rounded-lg transition-colors border cursor-pointer ${combatLogsFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/45 shadow-[0_0_10px_rgba(34,211,238,0.15)]' : 'bg-[#05070A] text-slate-400 border-[#1E293B] hover:text-slate-200'}`}
              >
                📝 ALL ({battleReports.length})
              </button>
              <button
                type="button"
                onClick={() => setCombatLogsFilter('unread')}
                className={`flex-1 py-1.5 px-3 font-bold rounded-lg transition-colors border cursor-pointer ${combatLogsFilter === 'unread' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/45 shadow-[0_0_10px_rgba(34,211,238,0.15)]' : 'bg-[#05070A] text-slate-400 border-[#1E293B] hover:text-slate-200'}`}
              >
                🔵 UNREAD ({battleReports.filter(r => !readReports[r.id]).length})
              </button>
              <button
                type="button"
                onClick={() => setCombatLogsFilter('saved')}
                className={`flex-1 py-1.5 px-3 font-bold rounded-lg transition-colors border cursor-pointer ${combatLogsFilter === 'saved' ? 'bg-amber-500/20 text-amber-300 border-amber-500/45 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-[#05070A] text-slate-400 border-[#1E293B] hover:text-slate-200'}`}
              >
                ⭐ SAVED ({battleReports.filter(r => savedReports[r.id]).length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {(() => {
                const filteredReports = combatLogsFilter === 'saved'
                  ? battleReports.filter(r => savedReports[r.id])
                  : combatLogsFilter === 'unread'
                  ? battleReports.filter(r => !readReports[r.id])
                  : battleReports;

                if (filteredReports.length === 0) {
                  return (
                    <div className="py-12 text-center rounded-xl border border-dashed border-[#1E293B]">
                      <p className="text-xs text-slate-500">
                        {combatLogsFilter === 'saved' ? "No saved reports match your parameters." :
                         combatLogsFilter === 'unread' ? "No unread reports." :
                         "No military engagements logged in this session."}
                      </p>
                    </div>
                  );
                }

                return filteredReports.map((report) => {
                  const isPlayerAttacker = report.attackerId === player.id;
                  const isPlayerDefender = report.defenderId === player.id;
                  let outcomeText = 'DEFEAT';
                  if (isPlayerAttacker) {
                    outcomeText = report.winner === 'attacker' ? 'VICTORY' : 'DEFEAT';
                  } else if (isPlayerDefender) {
                    outcomeText = report.winner === 'defender' ? 'VICTORY' : 'DEFEAT';
                  } else {
                    outcomeText = report.winner === 'attacker' ? 'ATTACKER VICTORY' : 'DEFENDER VICTORY';
                  }

                  const isExpanded = expandedReports[report.id] || false;
                  const isSaved = savedReports[report.id] || false;
                  const isRead = readReports[report.id] || false;

                  const isSeen = seenReports[report.id] || false;
                  let cardStyle = "border-[#1E293B] bg-[#05070A]";
                  if (!isSeen) {
                    cardStyle = "border-red-500/40 bg-[#1A0909]/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                  } else if (!isRead) {
                    cardStyle = "border-cyan-500/30 bg-[#061021]/60";
                  }

                  const calculateInitialStats = (troops: Record<string, number> | undefined) => {
                    if (!troops) return { hp: 0, atk: 0 };
                    const mDef: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                    const mAtk: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                    const hp = Object.entries(troops).reduce((sum, [k, v]) => sum + (v || 0) * (mDef[k] || 10), 0);
                    const atk = Object.entries(troops).reduce((sum, [k, v]) => sum + (v || 0) * (mAtk[k] || 10), 0);
                    return { hp, atk };
                  };

                  const attStats = calculateInitialStats(report.attackerInitialTroops);
                  const defStats = calculateInitialStats(report.defenderInitialTroops);

                  return (
                    <div key={report.id} className={`p-4 border rounded-xl space-y-3 transition-colors ${cardStyle}`}>
                      <div 
                        onClick={() => {
                          const nextExpanded = !isExpanded;
                          setExpandedReports(prev => ({ ...prev, [report.id]: nextExpanded }));
                          if (nextExpanded) {
                            markReportSeen(report.id);
                            if (onMarkRead) {
                              onMarkRead(report.id);
                            }
                          }
                        }}
                        className="flex justify-between items-center text-[10px] pb-2 border-b border-white/5 cursor-pointer hover:bg-[#1E293B]/20 p-1 rounded-lg transition"
                      >
                        <div className="flex flex-col gap-0.5 text-left flex-1 min-w-0 pr-2">
                          <span className="text-slate-200 font-bold font-mono text-[11px] flex items-center gap-1.5 flex-wrap">
                            {/* Visual unread bullet indicators */}
                            {!isSeen ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-505 bg-red-500 animate-pulse shrink-0 shadow-[0_0_8px_#ef4444]" title="New Unseen Report" />
                            ) : !isRead ? (
                              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_6px_#22d3ee]" title="Unread Report" />
                            ) : null}
                            ⚔️ {isPlayerAttacker ? 'Attacked' : 'Defended against'}{' '}
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                const profileId = isPlayerAttacker ? report.defenderId : report.attackerId;
                                if (onViewPlayerProfile) onViewPlayerProfile(profileId);
                              }}
                              className="underline decoration-dotted cursor-pointer text-cyan-400 hover:text-cyan-300 font-bold"
                            >
                              {isPlayerAttacker ? report.defenderName : report.attackerName}
                            </span>
                          </span>
                          <span className="text-slate-500 font-mono text-[9px]">{new Date(report.timestamp).toLocaleString()} {isSaved && <span className="text-amber-400 font-bold ml-1">★ SAVED</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`font-black tracking-widest px-2 py-0.5 rounded text-[9px] ${
                            outcomeText.includes('VICTORY') 
                              ? 'text-cyan-400 bg-cyan-950/20' 
                              : 'text-red-400 bg-red-950/20'
                          }`}>
                            {outcomeText}
                          </span>
                          <span className="text-[9px] text-[#22D3EE] font-extrabold uppercase border border-cyan-500/25 px-1.5 py-0.5 rounded">
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </span>
                        </div>
                      </div>

                      {/* Interactive bookmark and forwarding control panel */}
                      <div className="flex flex-wrap items-center justify-between text-[10.5px] border-b border-white/5 pb-2 text-slate-400 gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleSave) onToggleSave(report.id);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition border cursor-pointer text-[10px] ${isSaved ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'}`}
                          >
                            <span>{isSaved ? '★ Saved' : '☆ Save Report'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isRead) {
                                if (onMarkUnread) onMarkUnread(report.id);
                              } else {
                                markReportSeen(report.id);
                                if (onMarkRead) onMarkRead(report.id);
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-white/5 bg-slate-900/60 hover:text-white transition cursor-pointer text-[10px] text-slate-400"
                          >
                            <span>{isRead ? '✉ Mark Unread' : '✉ Mark Read'}</span>
                          </button>

                          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/5 bg-slate-900/60 text-[10px] text-slate-400">
                            <span>📤 Forward:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onForwardReport) onForwardReport(report, 'global');
                              }}
                              className="text-cyan-450 hover:text-cyan-300 font-bold cursor-pointer"
                            >
                              Global
                            </button>
                            {player.allianceId && (
                              <>
                                <span className="text-slate-600">|</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onForwardReport) onForwardReport(report, 'alliance');
                                  }}
                                  className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                                >
                                  Alliance
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (() => {
                        const totalAttInitial = Object.values(report.attackerInitialTroops || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                        const totalAttLosses = Object.values(report.attackerLosses || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                        const attLossPercent = totalAttInitial > 0 ? ((totalAttLosses / totalAttInitial) * 100).toFixed(1) : '0.0';

                        const totalDefInitial = Object.values(report.defenderInitialTroops || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                        const totalDefLosses = Object.values(report.defenderLosses || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                        const defLossPercent = totalDefInitial > 0 ? ((totalDefLosses / totalDefInitial) * 100).toFixed(1) : '0.0';

                        return (
                          <div className="space-y-3 animate-fade-in text-left">
                            <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                              <div>
                                <p className="font-bold text-red-100 text-red-400 uppercase tracking-wide flex items-center justify-between">
                                  <span>ATTACKER:{' '}
                                    <span 
                                      onClick={() => onViewPlayerProfile && onViewPlayerProfile(report.attackerId)}
                                      className="underline decoration-dotted cursor-pointer hover:text-red-300 font-bold text-red-400"
                                    >
                                      {report.attackerName}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-red-400 font-bold bg-red-950/25 px-1.5 py-0.5 rounded border border-red-900/20 font-mono select-none">
                                    Loss: {attLossPercent}%
                                  </span>
                                </p>
                              <p className="text-slate-500 text-[10px] mt-0.5">Origin: [{report.attackerCoords.x}, {report.attackerCoords.y}]</p>
                              <div className="mt-2 space-y-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase flex flex-col gap-0.5">
                                  <div>Attacker Attack HP (Firepower): <span className="text-orange-400 font-mono font-extrabold">{attStats.atk.toLocaleString()}</span></div>
                                </div>
                                <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 mt-1.5">
                                  {Object.entries(report.attackerInitialTroops).map(([type, qty]) => {
                                    if (!qty) return null;
                                    return (
                                      <span key={type} className="bg-red-950/20 px-1 py-0.2 rounded border border-red-900/20 text-red-300">
                                        {(TROOP_NAME_MAPPING[type] || type)}: {qty} (loss: {report.attackerLosses[type] || 0})
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-cyan-100 text-cyan-400 uppercase tracking-wide flex items-center justify-between">
                                <span>STATION:{' '}
                                  <span 
                                    onClick={() => onViewPlayerProfile && onViewPlayerProfile(report.defenderId)}
                                    className="underline decoration-dotted cursor-pointer hover:text-cyan-300 font-bold text-cyan-400"
                                  >
                                    {report.defenderName}
                                  </span>
                                </span>
                                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/25 px-1.5 py-0.5 rounded border border-cyan-900/20 font-mono select-none">
                                  Loss: {defLossPercent}%
                                </span>
                              </p>
                              <p className="text-slate-500 text-[10px] mt-0.5">Target: [{report.defenderCoords.x}, {report.defenderCoords.y}]</p>
                              <div className="mt-2 space-y-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase flex flex-col gap-0.5">
                                  <div>Defender HP (Defense Shields): <span className="text-cyan-400 font-mono font-extrabold">{defStats.hp.toLocaleString()}</span></div>
                                </div>
                                <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 mt-1.5">
                                  {Object.entries(report.defenderInitialTroops).map(([type, qty]) => {
                                    if (!qty) return null;
                                    return (
                                      <span key={type} className="bg-cyan-950/15 px-1 py-0.2 rounded border border-cyan-900/20 text-cyan-300">
                                        {(TROOP_NAME_MAPPING[type] || type)}: {qty} (loss: {report.defenderLosses[type] || 0})
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Points & Raid Score block */}
                          {(() => {
                            const raidScore = Object.values(report.resourcesStolen || {}).reduce<number>((s: number, v: any) => s + (v || 0), 0);
                            return (
                              <div className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1.5 font-mono text-[10.5px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Raided Points (Resources Stolen / 1000):</span>
                                  <span className="font-bold text-emerald-400 font-mono font-extrabold">+{(raidScore / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Pts</span>
                                </div>
                                <div className="flex justify-between border-t border-[#1E293B]/60 pt-1.5">
                                  <span className="text-slate-400">Attack Points earned (defense force destroyed):</span>
                                  <span className="font-bold font-mono text-red-400 font-extrabold">+{(report.defenceHpKilled || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Defense Points earned (attacker fleet destroyed):</span>
                                  <span className="font-bold font-mono text-cyan-400 font-extrabold">+{(report.attackHpKilled || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Resources stolen details */}
                          {report.winner === 'attacker' && (() => {
                            const totalStolen = Object.values(report.resourcesStolen || {}).reduce<number>((sum, val: any) => sum + (val || 0), 0);
                            const raidPoints = totalStolen / 1000;
                            return (
                              <div className="p-3 bg-emerald-950/5 border border-emerald-900/20 text-emerald-305 text-emerald-400 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">LOOT SALVAGED (CARGO CORES):</p>
                                  <span className="font-mono text-[10px] font-extrabold text-amber-400">⚡ +{raidPoints.toLocaleString()} Raided Points</span>
                                </div>
                              <div className="grid grid-cols-5 gap-1.5 text-center font-bold text-[9px] text-emerald-450">
                                <div className="bg-[#05070A] p-1 rounded border border-white/5">W: {report.resourcesStolen.water.toLocaleString()}</div>
                                <div className="bg-[#05070A] p-1 rounded border border-white/5">P: {report.resourcesStolen.plasma.toLocaleString()}</div>
                                <div className="bg-[#05070A] p-1 rounded border border-white/5">F: {report.resourcesStolen.fuel.toLocaleString()}</div>
                                <div className="bg-[#05070A] p-1 rounded border border-white/5">Fd: {report.resourcesStolen.food.toLocaleString()}</div>
                                <div className="bg-[#05070A] p-1 rounded border border-white/5">R: {report.resourcesStolen.respirant.toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        })()}

                          {/* Collateral damage report */}
                          {report.buildingDamage && report.buildingDamage.length > 0 && (
                            <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-300 rounded-lg">
                              <p className="font-bold text-[10px] uppercase tracking-wider mb-1.5">DISRUPTER COLLATERAL DEVASTATION:</p>
                              <ul className="list-disc pl-4 space-y-1 text-red-300/80 text-[10px]">
                                {report.buildingDamage.map((dmg, di) => (
                                  <li key={di}>
                                    {dmg.buildingName.toUpperCase()} damaged: Level {dmg.previousLevel} &rarr; {dmg.newLevel}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Interactive Round-by-Round Log Simulation Detail */}
                          {report.battleRounds && report.battleRounds.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-950/40 border border-[#1E293B] rounded-lg">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] font-mono">TACTICAL COMBAT LOGS ({report.battleRounds.length} Rounds)</span>
                                <button
                                  onClick={() => {
                                    setExpandedReportRounds(prev => ({
                                      ...prev,
                                      [report.id]: prev[report.id] !== undefined ? undefined : 0
                                    }));
                                  }}
                                  className="text-[9px] text-[#22D3EE] font-extrabold hover:text-white uppercase transition duration-150 border border-cyan-500/25 px-2 py-0.5 rounded cursor-pointer"
                                >
                                  {expandedReportRounds[report.id] !== undefined ? 'Hide Rounds' : 'View Rounds'}
                                </button>
                              </div>

                              {expandedReportRounds[report.id] !== undefined && (
                                <div className="space-y-3 font-mono text-[10px]">
                                  {/* Round selector Tabs */}
                                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                                    {report.battleRounds.map((r, rIdx) => (
                                      <button
                                        key={r.round}
                                        onClick={() => setExpandedReportRounds(prev => ({ ...prev, [report.id]: rIdx }))}
                                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition duration-150 cursor-pointer ${
                                          expandedReportRounds[report.id] === rIdx
                                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                      >
                                        Rnd {r.round}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Round event logs listing */}
                                  {report.battleRounds[expandedReportRounds[report.id]] && (
                                    <div className="space-y-1.5 text-slate-300 font-mono text-[10px] bg-black/40 p-2.5 rounded border border-white/5 leading-relaxed max-h-[160px] overflow-y-auto">
                                      {report.battleRounds[expandedReportRounds[report.id]].logs.map((logLine, li) => (
                                        <p key={li} className="flex gap-2">
                                          <span className="text-cyan-500 text-[10px] font-bold select-none">&bull;</span>
                                          <span>{logLine}</span>
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              });
            })()}
          </div>

            <div className="border-t border-[#1E293B] pt-3 flex justify-end">
              <button 
                onClick={() => setShowReportsModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-slate-300 border border-[#1E293B] hover:border-slate-700 hover:text-white rounded-xl font-bold font-mono text-xs cursor-pointer transition duration-150 font-medium"
              >
                Close Attack Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacecraft HD Blueprint Viewer Modal Backdrop */}
      {activeImageZoom && (
        <div 
          onClick={() => {
            setActiveImageZoom(null);
            setActiveImageZoomTitle(null);
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-4xl bg-[#0A0F1D]/95 border border-[#1E293B] shadow-[0_0_50px_rgba(5,182,212,0.15)] rounded-2xl overflow-hidden p-3 md:p-6 text-center"
          >
            {/* Corner Hologram Hud elements */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl pointer-events-none" />
            
            {/* Grid background layer */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            <div className="flex items-center justify-between border-b border-[#1E293B]/60 pb-3 mb-4.5 relative z-10">
              <div className="text-left font-mono">
                <span className="text-[9px] text-[#5bc0be] uppercase tracking-widest font-black block">HOLOGRAPHIC BLUEPRINT SCHEMATIC</span>
                <h4 className="text-sm md:text-base font-black text-white uppercase">{activeImageZoomTitle || 'Spaceship Artwork'}</h4>
              </div>
              <button
                onClick={() => {
                  setActiveImageZoom(null);
                  setActiveImageZoomTitle(null);
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 font-mono text-xs font-bold text-slate-400 transition cursor-pointer"
                aria-label="Close schematic"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-[#1E293B] bg-black/40 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              <img 
                src={activeImageZoom} 
                alt={activeImageZoomTitle || 'Spacecraft Blueprint'} 
                className="max-h-[70vh] max-w-full object-contain mx-auto select-none rounded animate-fade-in"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/60 border border-white/5 text-[9px] text-slate-500 font-mono tracking-wider rounded">
                COGNITIVE VISUAL TELEMETRY ACTIVE
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
