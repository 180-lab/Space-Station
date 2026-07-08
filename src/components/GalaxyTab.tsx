import React, { useState } from 'react';
import { 
  Alliance, 
  BattleReport, 
  ChatMessage, 
  ColonyPlanet, 
  FleetMission, 
  NewsEvent, 
  PlayerProfile,
  LeaderboardPlayer,
  CreatedFleet,
  ResourceType,
  getUpgradeResourceCost
} from '../types';
import { 
  Radar, 
  Search, 
  Trophy, 
  Users, 
  MessageSquare, 
  Compass, 
  Radio, 
  ShieldAlert, 
  Send,
  Flag,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface GalaxyTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  alliances: Record<string, Alliance>;
  playersList?: LeaderboardPlayer[];
  chatMessages: ChatMessage[];
  fleets: FleetMission[];
  battleReports: BattleReport[];
  newsEvents: NewsEvent[];
  serverTime: number;
  onSendFleet: (mission: {
    targetX: number;
    targetY: number;
    missionType: 'attack' | 'colonize' | 'recon' | 'move';
    troops: Record<string, number>;
    targetId?: string;
    targetName?: string;
    targetBuilding?: string;
    numFleets?: number;
    createdFleetId?: string;
  }) => Promise<any> | any;
  onRerouteFleet?: (fleetId: string, targetX: number, targetY: number, missionType?: string) => void;
  onSendChat: (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => void;
  onCreateAlliance: (name: string, tag: string, bannerColor: string, bannerSymbol: string) => void;
  onJoinAlliance: (allianceId: string) => void;
  onLeaveAlliance: () => void;
  onDeclareWar: (targetAllianceId: string) => void;
  onRefreshState?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  readReports?: Record<string, boolean>;
  savedReports?: Record<string, boolean>;
  onMarkRead?: (reportId: string) => void;
  onMarkUnread?: (reportId: string) => void;
  onMarkAllRead?: () => void;
  onToggleSave?: (reportId: string) => void;
  onForwardReport?: (report: BattleReport, channel: 'global' | 'alliance') => void;
  onViewPlayerProfile?: (playerId: string) => void;
  createdFleets: CreatedFleet[];
  setCreatedFleets: React.Dispatch<React.SetStateAction<CreatedFleet[]>>;
  onUpdatePlayer?: (player: PlayerProfile) => void;
  defaultSubTab?: 'scanner' | 'ranking' | 'comms' | 'news' | 'fleets';
  localResources?: Record<string, number>;
  isUpgrading?: boolean;
  maxCoord?: number;
  onUpgradeBuilding?: (buildingKey: string, queue?: boolean) => Promise<any> | any;
  isDirectRadarView?: boolean;
  onCloseRadarDirectView?: () => void;
}

async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || 'text/html';
  if (!contentType.includes('application/json')) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      // Ignore text read error
    }
    const hasCookieCheck = 
      text.includes('Cookie check') || 
      text.includes('blocking a required security cookie') ||
      text.includes('Action required to load your app');
    if (hasCookieCheck) {
      throw new Error('Galactic Sandbox security check: Please grant iframe cookie permissions or refresh the page.');
    }
    throw new Error('Galaxy communications terminal is stabilizing. Reconnecting...');
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const TROOP_NAME_MAPPING: Record<string, string> = {
  defender: 'Interceptor',
  attacker: 'Assault Drone',
  tank: 'Disrupter',
  looter: 'Matter Extractor',
  drone: 'Missile Launcher',
  settlementShip: 'Settlement Ship'
};

const calculateEnemyHp = (troops: Record<string, number> | undefined) => {
  if (!troops) return { attackHp: 0, defenceHp: 0 };
  const statMap: Record<string, { defenceHp: number; attackHp: number }> = {
    defender: { defenceHp: 18, attackHp: 10 },
    attacker: { defenceHp: 9, attackHp: 30 },
    tank: { defenceHp: 5, attackHp: 5 },
    looter: { defenceHp: 4, attackHp: 4 },
    drone: { defenceHp: 120, attackHp: 120 },
    settlementShip: { defenceHp: 50, attackHp: 0 }
  };
  let attackHp = 0;
  let defenceHp = 0;
  Object.entries(troops).forEach(([tId, count]) => {
    const stat = statMap[tId] || { defenceHp: 0, attackHp: 0 };
    const num = count || 0;
    attackHp += num * stat.attackHp;
    defenceHp += num * stat.defenceHp;
  });
  return { attackHp, defenceHp };
};

export const GalaxyTab: React.FC<GalaxyTabProps> = ({
  player,
  activePlanet,
  alliances,
  playersList = [],
  chatMessages,
  fleets,
  battleReports,
  newsEvents,
  serverTime,
  onSendFleet,
  onRerouteFleet,
  onSendChat,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onDeclareWar,
  onRefreshState,
  showToast,
  readReports = {},
  savedReports = {},
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onToggleSave,
  onForwardReport,
  onViewPlayerProfile,
  createdFleets,
  setCreatedFleets,
  onUpdatePlayer,
  defaultSubTab,
  localResources,
  isUpgrading = false,
  maxCoord = 100,
  onUpgradeBuilding,
  isDirectRadarView,
  onCloseRadarDirectView
}) => {
  // Sub-tabs
  const [subTab, setSubTab] = useState<'scanner' | 'ranking' | 'comms' | 'news' | 'fleets'>(
    isDirectRadarView ? 'scanner' : (defaultSubTab || 'ranking')
  );

  React.useEffect(() => {
    if (isDirectRadarView) {
      setSubTab('scanner');
    } else if (defaultSubTab) {
      setSubTab(defaultSubTab);
    }
  }, [defaultSubTab, isDirectRadarView]);

  // Fleets Section States
  const [actionPlanetId, setActionPlanetId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'move' | 'attack' | null>(null);
  const [customX, setCustomX] = useState<string>('50');
  const [customY, setCustomY] = useState<string>('50');
  const [customNumFleets, setCustomNumFleets] = useState<number>(1);
  const [customTroops, setCustomTroops] = useState<Record<string, number>>({
    defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0
  });

  const [reroutingFleetId, setReroutingFleetId] = useState<string | null>(null);
  const [rerouteX, setRerouteX] = useState<string>('');
  const [rerouteY, setRerouteY] = useState<string>('');
  const [rerouteType, setRerouteType] = useState<'attack' | 'colonize' | 'recon' | 'move'>('attack');

  // Single vs Multiple Fleets configuration in primary dispatch drawer modal
  const [dispatchMode, setDispatchMode] = useState<'single' | 'multiple'>('single');
  const [dispatchNumFleets, setDispatchNumFleets] = useState<number>(2);
  const [selectedReserveFleetId, setSelectedReserveFleetId] = useState<string>('manual');

  // Leaderboard States
  const [rankingMetric, setRankingMetric] = useState<'population' | 'attack' | 'defence' | 'raiders'>('population');
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [showBottom10, setShowBottom10] = useState(false);
  const [showTop10, setShowTop10] = useState(false);
  const [showStandings, setShowStandings] = useState(true);
  const [showAllianceCmd, setShowAllianceCmd] = useState(false);
  const [showDecFeed, setShowDecFeed] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<'players' | 'alliances'>('players');
  const [expandedAllianceId, setExpandedAllianceId] = useState<string | null>(null);

  // Scanner State
  const [targetCoords, setTargetCoords] = useState({ x: activePlanet.sectorX, y: activePlanet.sectorY });
  const [searchX, setSearchX] = useState(activePlanet.sectorX.toString());
  const [searchY, setSearchY] = useState(activePlanet.sectorY.toString());
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [radarFilter, setRadarFilter] = useState<'all' | 'habitable' | 'player'>('all');
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({});
  const [radarRadius, setRadarRadius] = useState(1);
  const [isScanning, setIsScanning] = useState(false);

  // Manage Alliance states
  const [showManageAlliance, setShowManageAlliance] = useState(false);
  const [allianceHighlightText, setAllianceHighlightText] = useState('');
  const [editingHighlights, setEditingHighlights] = useState(false);
  const [allianceMemberReports, setAllianceMemberReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeReportsTab, setActiveReportsTab] = useState<'highlights' | 'troops' | 'situation' | 'activity'>('highlights');
  const [expandedMemberPlanets, setExpandedMemberPlanets] = useState<Record<string, boolean>>({});

  const handleOpenManageAlliance = () => {
    setShowManageAlliance(true);
    fetchMemberReports();
    const activeAlliance = alliances[player.allianceId || ''];
    if (activeAlliance) {
      setAllianceHighlightText(activeAlliance.highlights || '');
    }
  };

  const fetchMemberReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/alliance/member-reports", {
        headers: {
          "x-user-id": player.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllianceMemberReports(data.members || []);
      }
    } catch (e) {
      console.error("Failed to load alliance member reports", e);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleUpdateHighlights = async () => {
    try {
      const res = await fetch("/api/alliance/highlights", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": player.id
        },
        body: JSON.stringify({ highlights: allianceHighlightText })
      });
      if (res.ok) {
        setEditingHighlights(false);
        if (showToast) showToast("Alliance highlights updated successfully!", "success");
        if (onRefreshState) onRefreshState();
      } else {
        if (showToast) showToast("Failed to update highlights.", "error");
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast("Network error updating highlights.", "error");
    }
  };

  // Instant colonization handler
  const handleInstantColonize = async (tx: number, ty: number) => {
    try {
      if (!activePlanet) {
        if (showToast) showToast("You must select an active space station to colonize from!", "error");
        return;
      }
      
      const res = await fetch("/api/colonize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          targetX: tx,
          targetY: ty
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        if (showToast) showToast(data.message || "Sector successfully colonized!", "success");
        if (onRefreshState) onRefreshState();
      } else {
        if (showToast) showToast(data.error || "Failed to colonize sector.", "error");
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast("Network error executing colonization command.", "error");
    }
  };

  // Intelligence State
  const [intelReport, setIntelReport] = useState<any | null>(null);
  const [isFetchingIntel, setIsFetchingIntel] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchIntelReport = async (tx: number, ty: number) => {
    if ((player.credits || 0) < 50) {
      if (showToast) showToast("Insufficient Space Gold. Gathering intelligence report requires 50 Space Gold.", "error");
      return;
    }

    setConfirmModal({
      title: 'CONFIRM SPACE GOLD TRANSACTION',
      message: `Are you sure you want to spend 50 Space Gold to scan the sector [${tx}, ${ty}] and acquire an Intel Report?`,
      onConfirm: async () => {
        setIsFetchingIntel(true);
        setIntelError(null);
        setIntelReport(null); // Clear previous reports
        try {
          const res = await fetch('/api/galaxy/intelligence', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': player.id
            },
            body: JSON.stringify({ targetX: tx, targetY: ty })
          });
          const data = await res.json();
          if (res.ok) {
            setIntelReport(data.report);
            if (onRefreshState) {
              onRefreshState(); // refresh player gold balance in navbar
            }
          } else {
            setIntelError(data.error || "Failed to decrypt local sector coordinates.");
          }
        } catch (err) {
          setIntelError("Signal distortion. Could not receive intelligence packet.");
        } finally {
          setIsFetchingIntel(false);
        }
      }
    });
  };

  // Auto-scan on mount when planet context changes
  React.useEffect(() => {
    handleScan(activePlanet.sectorX, activePlanet.sectorY);
  }, [activePlanet.id]);

  // Selected Sector details for fleet launch modal
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [fleetType, setFleetType] = useState<'attack' | 'colonize' | 'recon' | 'move' | 'timed_attack' | 'timed_move'>('move');
  const [timedLandingTime, setTimedLandingTime] = useState<string>('');
  const [targetBuilding, setTargetBuilding] = useState<string>('random');
  const [fleetTroops, setFleetTroops] = useState<Record<string, number>>({
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  });

  // Resource Send State
  const [targetForResources, setTargetForResources] = useState<any | null>(null);
  const [resourceSendValues, setResourceSendValues] = useState<Record<string, number>>({
    water: 0,
    plasma: 0,
    fuel: 0,
    food: 0,
    respirant: 0
  });

  // Chat panel
  const [currentChatChannel, setCurrentChatChannel] = useState<'global' | 'alliance'>('global');
  const [chatInput, setChatInput] = useState('');
  const [activeChatWindow, setActiveChatWindow] = useState<'global' | 'alliance' | null>(null);

  // Prevent background scrolling when a modal or dispatch overlay is active
  React.useEffect(() => {
    if (selectedTarget || targetForResources || activeChatWindow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedTarget, targetForResources, activeChatWindow]);

  // Automatically initialize timedLandingTime for timed_move and timed_attack
  React.useEffect(() => {
    if ((fleetType === 'timed_move' || fleetType === 'timed_attack') && selectedTarget) {
      const distance = Math.hypot(selectedTarget.coords.x - activePlanet.sectorX, selectedTarget.coords.y - activePlanet.sectorY);
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
      const selectedTroops = selectedReserveFleetId !== 'manual'
        ? (() => {
            const rf = createdFleets.find(f => f.id === selectedReserveFleetId);
            return rf ? Object.entries(rf.troops).filter(([_, qty]) => (Number(qty) || 0) > 0) : [];
          })()
        : Object.entries(fleetTroops).filter(([_, qty]) => (Number(qty) || 0) > 0);
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
      setTimedLandingTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [fleetType, selectedTarget, selectedReserveFleetId, activePlanet, fleetTroops, player, createdFleets]);

  // Alliance setup panel
  const [allianceName, setAllianceName] = useState('');
  const [allianceTag, setAllianceTag] = useState('');
  const [allianceBannerSymbol, setAllianceBannerSymbol] = useState('▲');
  const [allianceBannerColor, setAllianceBannerColor] = useState('#FF007A');

  // Collapsible States for DEC_LINKS and radar folder
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [isRadarFolderOpen, setIsRadarFolderOpen] = useState(true);
  const [radarPage, setRadarPage] = useState(0);

  // Watchlist & Groups state
  const [watchlistGroups, setWatchlistGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`moonbase_watchlist_groups_${player.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(group => {
            if (group.id === 'group_allies' && group.name === '🤝 Allied Systems') {
              return { ...group, name: '🤝 Allied Players on the Watchlist' };
            }
            if (group.id === 'group_farming' && group.name === '🌾 Resource Outposts') {
              return { ...group, name: '🌾 Farms' };
            }
            return group;
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load watchlist from localStorage:", e);
    }
    return [
      { id: 'group_enemies', name: '🎯 High-Value Targets', items: [] },
      { id: 'group_allies', name: '🤝 Allied Players on the Watchlist', items: [] },
      { id: 'group_farming', name: '🌾 Farms', items: [] }
    ];
  });

  const [activeWatchlistGroupTab, setActiveWatchlistGroupTab] = useState<string>('all');
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(true);
  const [newGroupNameInput, setNewGroupNameInput] = useState<string>('');
  const [showAddToWatchlistMenu, setShowAddToWatchlistMenu] = useState<string | null>(null);
  const [isAddingNewGroupInline, setIsAddingNewGroupInline] = useState<boolean>(false);
  const [inlineNewGroupName, setInlineNewGroupName] = useState<string>('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupNameInput, setEditingGroupNameInput] = useState<string>('');

  const saveWatchlist = (updatedGroups: any[]) => {
    setWatchlistGroups(updatedGroups);
    try {
      localStorage.setItem(`moonbase_watchlist_groups_${player.id}`, JSON.stringify(updatedGroups));
    } catch (e) {
      console.error("Failed to save watchlist to localStorage:", e);
    }
  };

  const handleCreateGroup = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (watchlistGroups.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      if (showToast) showToast(`Group "${trimmedName}" already exists!`, 'error');
      return;
    }
    const newGroup = {
      id: `group_${Math.random().toString(36).substring(2, 9)}`,
      name: trimmedName,
      items: []
    };
    const updated = [...watchlistGroups, newGroup];
    saveWatchlist(updated);
    if (showToast) showToast(`Watchlist group "${trimmedName}" created!`, 'success');
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    const updated = watchlistGroups.filter(g => g.id !== groupId);
    saveWatchlist(updated);
    if (showToast) showToast(`Deleted group "${groupName}".`, 'info');
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = watchlistGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, name: trimmed };
      }
      return g;
    });
    saveWatchlist(updated);
    if (showToast) showToast(`Group renamed to "${trimmed}".`, 'success');
  };

  const handleAddStationToGroup = (target: any, groupId: string) => {
    const groupIndex = watchlistGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const group = watchlistGroups[groupIndex];
    if (group.items.some((item: any) => item.planetId === target.planetId)) {
      if (showToast) showToast(`Station "${target.planetName}" already in "${group.name}".`, 'info');
      setShowAddToWatchlistMenu(null);
      return;
    }

    const watchlistItem = {
      planetId: target.planetId,
      planetName: target.planetName,
      coords: { x: target.coords.x, y: target.coords.y },
      username: target.username,
      id: target.id,
      isHabitable: !!target.isHabitable,
      allianceTag: target.allianceTag,
      allianceId: target.allianceId,
      scores: target.scores || { population: 0, attack: 0, defence: 0, raiders: 0 },
      addedAt: Date.now()
    };

    const updated = watchlistGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: [...g.items, watchlistItem] };
      }
      return g;
    });

    saveWatchlist(updated);
    if (showToast) showToast(`Added "${target.planetName}" to "${group.name}".`, 'success');
    setShowAddToWatchlistMenu(null);
  };

  const handleRemoveStationFromGroup = (planetId: string, groupId: string) => {
    const updated = watchlistGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter((item: any) => item.planetId !== planetId) };
      }
      return g;
    });
    saveWatchlist(updated);
    if (showToast) showToast("Removed station from watchlist group.", "info");
  };

  const handleWatchlistQuickScan = (x: number, y: number) => {
    setSearchX(x.toString());
    setSearchY(y.toString());
    setTargetCoords({ x, y });
    handleScan(x, y);
    if (showToast) showToast(`Target sector [${x}, ${y}] locked. Scanning...`, 'info');
  };
  const [expandedCombatReports, setExpandedCombatReports] = useState<Record<string, boolean>>({});
  const [expandedIntelReports, setExpandedIntelReports] = useState<Record<string, boolean>>({});
  const [intelPopupExpandedBuildings, setIntelPopupExpandedBuildings] = useState<Record<string, boolean>>({});
  const [intelPopupExpandedMines, setIntelPopupExpandedMines] = useState<Record<string, boolean>>({});
  const [expandedReportBuildings, setExpandedReportBuildings] = useState<Record<string, boolean>>({});
  const [expandedReportMines, setExpandedReportMines] = useState<Record<string, boolean>>({});
  const [combatCategoryFilter, setCombatCategoryFilter] = useState<'all' | 'attack' | 'defense' | 'saved' | 'unread'>('all');
  const [expandedReportRounds, setExpandedReportRounds] = useState<Record<string, number>>({});

  // Scanner execution
  const handleScan = async (cx: number, cy: number) => {
    setIsScanning(true);
    setRadarPage(0);
    try {
      // Fetch scan from server
      const res = await fetch('/api/galaxy/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ centerX: cx, centerY: cy, planetId: activePlanet.id })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem(`moonbase_scan_${player.id}`, 'true');
      }
      setScanResults(data.targets || []);
      setRadarRadius(data.scanRadius || 1);
    } catch (err: any) {
      if (err?.message?.includes('security check') || err?.message?.includes('cookie') || err?.message?.includes('stabilizing')) {
        console.warn("Radar warning:", err.message);
      } else {
        console.error(err);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Search input change
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const xVal = Math.min(maxCoord, Math.max(0, parseInt(searchX, 10) || 0));
    const yVal = Math.min(maxCoord, Math.max(0, parseInt(searchY, 10) || 0));
    setTargetCoords({ x: xVal, y: yVal });
    handleScan(xVal, yVal);
  };

  // Open fleet dispatch panel
  const openDispatchFleet = (target: any, type: 'attack' | 'colonize' | 'recon' | 'move') => {
    setSelectedTarget(target);
    setFleetType(type);
    setTargetBuilding('random');
    
    // Set smart default troops count
    const initial: Record<string, number> = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    if (type === 'recon' || type === 'move') {
      initial.drone = Math.min(5, activePlanet.troops.drone || 0);
    } else if (type === 'attack') {
      initial.attacker = Math.min(10, activePlanet.troops.attacker || 0);
      initial.looter = Math.min(5, activePlanet.troops.looter || 0);
    } else if (type === 'colonize') {
      initial.settlementShip = Math.min(1, activePlanet.troops.settlementShip || 0);
    }
    setFleetTroops(initial);
  };

  const [isLaunchingReserve, setIsLaunchingReserve] = useState(false);

  // Dispatch launch
  const handleLaunchFleet = async () => {
    if (isUpgrading) return;
    if (!selectedTarget) return;

    if (fleetType === 'attack' || fleetType === 'timed_attack') {
      const isSelf = selectedTarget.id === player.id;
      const isAllianceMember = player.allianceId && selectedTarget.allianceId === player.allianceId;
      if (isSelf) {
        if (showToast) {
          showToast("Friendly fire protocols active: You are strictly prohibited from attacking your own stations or colony bases!", "error");
        } else {
          alert("Friendly fire protocols active: You are strictly prohibited from attacking your own stations or colony bases!");
        }
        return;
      }
      if (isAllianceMember) {
        if (showToast) {
          showToast(`Alliance mutual non-aggression pact active: You cannot attack stations belonging to alliance member ${selectedTarget.username}!`, "error");
        } else {
          alert(`Alliance mutual non-aggression pact active: You cannot attack stations belonging to alliance member ${selectedTarget.username}!`);
        }
        return;
      }
    }

    if (selectedReserveFleetId !== 'manual') {
      const fleet = createdFleets.find(f => f.id === selectedReserveFleetId);
      if (!fleet) {
        alert("Reserve fleet not found!");
        return;
      }
      if (fleet.isTraveling) {
        alert("This reserve fleet is currently in space flight!");
        return;
      }

      setIsLaunchingReserve(true);
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
          const activeMission = await onSendFleet({
            targetX: selectedTarget.coords.x,
            targetY: selectedTarget.coords.y,
            missionType: fleetType === 'timed_move' ? 'move' : fleetType === 'timed_attack' ? 'attack' : fleetType,
            troops: fleet.troops as any,
            targetId: selectedTarget.id || undefined,
            targetName: selectedTarget.planetName || `Sector [${selectedTarget.coords.x}, ${selectedTarget.coords.y}]`,
            targetBuilding: (fleet.troops.tank || 0) > 0 ? targetBuilding : undefined,
            numFleets: 1,
            planetId: activePlanet.id,
            createdFleetId: fleet.id,
            landingTime: (fleetType === 'timed_move' || fleetType === 'timed_attack') && timedLandingTime ? new Date(timedLandingTime).getTime() : undefined
          });

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
          if (showToast) showToast(`Dispatched reserve fleet ${fleet.name} into space flight!`, 'success');
        } else {
          alert(data.error || 'Failed to assemble reserve fleet for launch');
        }
      } catch (err) {
        alert('Network failure launching reserve fleet');
      } finally {
        setIsLaunchingReserve(false);
        setSelectedTarget(null);
        setSelectedReserveFleetId('manual');
      }
    } else {
      onSendFleet({
        targetX: selectedTarget.coords.x,
        targetY: selectedTarget.coords.y,
        missionType: fleetType === 'timed_move' ? 'move' : fleetType === 'timed_attack' ? 'attack' : fleetType,
        troops: fleetTroops,
        targetId: selectedTarget.id || undefined,
        targetName: selectedTarget.planetName || `Sector [${selectedTarget.coords.x}, ${selectedTarget.coords.y}]`,
        targetBuilding: (fleetTroops.tank || 0) > 0 ? targetBuilding : undefined,
        numFleets: dispatchMode === 'multiple' ? dispatchNumFleets : 1,
        planetId: activePlanet.id,
        landingTime: (fleetType === 'timed_move' || fleetType === 'timed_attack') && timedLandingTime ? new Date(timedLandingTime).getTime() : undefined
      });
      setSelectedTarget(null);
      setDispatchMode('single');
      setDispatchNumFleets(2);
    }
  };

  // Direct Quick Scan Coordinate Deployment
  const handleDirectLaunchCoords = (type: 'attack' | 'move') => {
    const xVal = Math.min(maxCoord, Math.max(0, parseInt(searchX, 10) || 0));
    const yVal = Math.min(maxCoord, Math.max(0, parseInt(searchY, 10) || 0));
    
    if (isNaN(xVal) || isNaN(yVal) || xVal < 0 || xVal > maxCoord || yVal < 0 || yVal > maxCoord) {
      if (showToast) showToast(`Coordinates must be inside grid 0 to ${maxCoord}`, 'error');
      return;
    }
    
    openDispatchFleet({
      id: undefined,
      planetName: `Sector Grid [${xVal}, ${yVal}]`,
      username: 'Direct Target Location',
      coords: { x: xVal, y: yVal },
      isHabitable: false
    }, type);
  };

  // Chat submit
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(currentChatChannel, chatInput);
    setChatInput('');
  };

  // Alliance create submit
  const handleCreateAllianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allianceName.trim() || !allianceTag.trim()) return;
    onCreateAlliance(allianceName, allianceTag, allianceBannerColor, allianceBannerSymbol);
    setAllianceName('');
    setAllianceTag('');
  };

  const getRankValue = (role: string | null | undefined) => {
    if (role === 'recruit') return 0;
    if (role === 'member') return 1;
    if (role === 'officer') return 2;
    if (role === 'commander' || role === 'leader') return 3;
    return 1;
  };

  const handlePromoteMember = async (targetPlayerId: string) => {
    try {
      const res = await fetch('/api/alliance/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ targetPlayerId })
      });
      const data = await res.json();
      if (!res.ok) {
        if (showToast) showToast(data.error || 'Failed to promote member', 'error');
      } else {
        if (showToast) showToast('Member rank promoted!', 'success');
        if (onRefreshState) onRefreshState();
      }
    } catch (err) {
      if (showToast) showToast('Outer-rim network error.', 'error');
    }
  };

  const handleDemoteMember = async (targetPlayerId: string) => {
    try {
      const res = await fetch('/api/alliance/demote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ targetPlayerId })
      });
      const data = await res.json();
      if (!res.ok) {
        if (showToast) showToast(data.error || 'Failed to demote member', 'error');
      } else {
        if (showToast) showToast('Member rank demoted.', 'success');
        if (onRefreshState) onRefreshState();
      }
    } catch (err) {
      if (showToast) showToast('Outer-rim network error.', 'error');
    }
  };

  const handleKickMember = async (targetPlayerId: string) => {
    try {
      const res = await fetch('/api/alliance/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ targetPlayerId })
      });
      const data = await res.json();
      if (!res.ok) {
        if (showToast) showToast(data.error || 'Failed to dismiss member', 'error');
      } else {
        if (showToast) showToast('Member dismissed from alliance roster.', 'success');
        if (onRefreshState) onRefreshState();
      }
    } catch (err) {
      if (showToast) showToast('Outer-rim network error.', 'error');
    }
  };

  const handleSendResources = async () => {
    // Validate inputs
    const valuesList = Object.values(resourceSendValues) as number[];
    const totalSend = valuesList.reduce((sum, val) => sum + val, 0);
    if (totalSend <= 0) {
      if (showToast) showToast('Please specify a quantity of resources to transmit.', 'error');
      return;
    }

    // Check availability
    const entriesList = Object.entries(resourceSendValues) as [string, number][];
    const resources = localResources || activePlanet.resources;
    for (const [resName, qty] of entriesList) {
      const avail = resources[resName as keyof typeof resources] || 0;
      if (qty > avail) {
        if (showToast) showToast(`Not enough ${resName} on current moonbase.`, 'error');
        return;
      }
    }

    try {
      const res = await fetch('/api/resources/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          targetId: targetForResources.id,
          targetName: targetForResources.username,
          targetX: targetForResources.coords.x,
          targetY: targetForResources.coords.y,
          sourcePlanetId: activePlanet.id,
          resources: resourceSendValues
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (showToast) showToast(data.error || 'Failed to transmit resources.', 'error');
      } else {
        localStorage.setItem(`moonbase_resources_sent_${player.id}`, 'true');
        if (showToast) showToast('Cargo Portal successfully activated! Resources transmitted.', 'success');
        setTargetForResources(null);
        if (onRefreshState) onRefreshState();
      }
    } catch (err) {
      if (showToast) showToast('Failed to establish transmission warp portal.', 'error');
    }
  };

  // Leaderboard formatting helpers
  const rankedState = Object.values(alliances) as Alliance[];  return (
    <div className="space-y-1.5 pb-24 font-mono">
      {/* Visual Navigation Pill Bars as a 2-rowed layout assembly to fit mobile viewports exactly */}
      {subTab !== 'scanner' && (
        <div className="grid grid-cols-2 gap-1 bg-[#0A0F1D] p-1.5 rounded-xl border border-[#1E293B] shrink-0 text-[10px] sm:text-xs">
          <button 
            onClick={() => setSubTab('ranking')}
            className={`py-3 px-1 truncate rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all duration-150 ${subTab === 'ranking' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'text-slate-400 hover:text-white'}`}
            title="Sovereignty Leaderboard: inspect combined firepower rank standings of galactic alliances"
          >
            <Trophy size={13} title="Trophy award leader prize" />
            <span>LEADERBOARD</span>
          </button>
          <button 
            onClick={() => setSubTab('news')}
            className={`py-3 px-1 truncate rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all duration-150 ${subTab === 'news' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'text-slate-400 hover:text-white'}`}
            title="Sector DEC_LINKS: review decrypted battle reports and public newsletters feed"
          >
            <Radio size={13} title="Radio waves beacon transceiver" />
            <span>DEC_LINKS</span>
          </button>
        </div>
      )}

      {/* SUB TAB 1: RADAR SCANNER */}
      {subTab === 'scanner' && (
        activePlanet.buildings.radar?.level === 0 ? (
          <div className="p-8 border border-red-500/20 bg-[#0A0F1D]/80 backdrop-blur-md rounded-2xl text-center space-y-4 max-w-xl mx-auto shadow-xl font-mono mt-4">
            <div className="text-4xl text-red-100">📡</div>
            <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-widest">
              RADAR ARRAY OFFLINE
            </h3>
            <p className="text-xs text-slate-350 font-sans leading-relaxed">
              This secondary colony station does not possess an active Radar system. 
              Navigate to your <strong>Established Structures</strong> or <strong>Unlocked Blueprints</strong> in the station commands tab to construct a Radar Array first before scanning nearby star sectors.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* RADAR ARRAY UPGRADE MODULE CARD */}
            {activePlanet && activePlanet.buildings.radar && (
              <div className="p-4 bg-slate-900/90 border border-cyan-500/20 rounded-xl space-y-3 shadow-lg relative overflow-hidden mb-4 font-mono text-left">
                <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">📡</div>
                
                {/* Upgrade Button above the header/level info */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#1E293B]/60">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-mono">RADAR CORE ACCESS</span>
                  {activePlanet.buildings.radar.level < activePlanet.buildings.radar.maxLevel ? (
                    activePlanet.buildings.radar.isUpgrading ? (
                      (() => {
                        const getTimerStringLocal = (endTimestamp: number | null) => {
                          if (!endTimestamp) return '';
                          const diff = Math.max(0, endTimestamp - serverTime);
                          const secs = Math.floor(diff / 1000);
                          const h = Math.floor(secs / 3600);
                          const m = Math.floor((secs % 3600) / 60);
                          const s = secs % 60;
                          return `${h}h ${m}m ${s}s`;
                        };
                        return (
                          <div className="text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg text-center animate-pulse shrink-0">
                            ⏳ UPGRADING: {getTimerStringLocal(activePlanet.buildings.radar.upgradeEnd)}
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const nextRadarLvl = (activePlanet.buildings.radar?.level || 0) + 1;
                        const rKeys: ResourceType[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
                        const currentResources = localResources || activePlanet.resources;
                        const hasUpgradeResources = rKeys.every(rKey => {
                          const cost = getUpgradeResourceCost('building', 'radar', nextRadarLvl, rKey);
                          return (currentResources[rKey] || 0) >= cost;
                        });
                        return (
                          <button
                            type="button"
                            onClick={() => onUpgradeBuilding && onUpgradeBuilding('radar')}
                            disabled={isUpgrading || !hasUpgradeResources}
                            className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-150 shrink-0 ${
                              hasUpgradeResources 
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.35)] cursor-pointer' 
                                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            }`}
                          >
                            <span>🚀 Upgrade Radar to Lv. {nextRadarLvl}</span>
                          </button>
                        );
                      })()
                    )
                  ) : (
                    <div className="text-[9px] bg-slate-900 text-slate-500 border border-slate-800 px-2.5 py-1 rounded-lg text-center font-bold font-mono shrink-0">
                      MAX LEVEL REACHED
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cyan-500/10">
                  <div>
                    <span className="text-[10px] text-cyan-400 block uppercase font-bold tracking-wider">RADAR CONTROL CENTRE</span>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Radar Array Grid</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-950 text-pink-400 border border-[#1E293B]">
                        Lv. {activePlanet.buildings.radar.level} / {activePlanet.buildings.radar.maxLevel}
                      </span>
                    </h4>
                  </div>
                  {activePlanet.buildings.radar.isUpgrading ? (
                    (() => {
                      const getTimerStringLocal = (endTimestamp: number | null) => {
                        if (!endTimestamp) return '';
                        const diff = Math.max(0, endTimestamp - serverTime);
                        const secs = Math.floor(diff / 1000);
                        const h = Math.floor(secs / 3600);
                        const m = Math.floor((secs % 3600) / 60);
                        const s = secs % 60;
                        return `${h}h ${m}m ${s}s`;
                      };
                      return (
                        <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold animate-pulse flex items-center gap-1">
                          <span className="animate-spin text-xs">⏳</span>
                          <span>Upgrading: {getTimerStringLocal(activePlanet.buildings.radar.upgradeEnd)}</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold bg-[#05070A] border border-[#1E293B] px-2.5 py-1 rounded-xl">
                      SCAN RADIUS: {activePlanet.buildings.radar.level} SECTORS
                    </span>
                  )}
                </div>

                {!activePlanet.buildings.radar.isUpgrading && activePlanet.buildings.radar.level < activePlanet.buildings.radar.maxLevel && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl font-sans">
                      Upgrade the Radar Array to broaden scan sweeps, detect incoming space forces, and unlock outer coordinate sector details. Next Level upgrade requires:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).map((rKey) => {
                        const nextRadarLvl = (activePlanet.buildings.radar?.level || 0) + 1;
                        const cost = getUpgradeResourceCost('building', 'radar', nextRadarLvl, rKey);
                        const currentVal = (localResources ? localResources[rKey] : activePlanet.resources[rKey]) || 0;
                        const hasSufficient = currentVal >= cost;
                        const resNamesLocal = {
                          water: 'Water',
                          plasma: 'Plasma',
                          fuel: 'Deuterium',
                          food: 'Food',
                          respirant: 'Respirant O2'
                        };
                        const resIconsLocal = {
                          water: '💧',
                          plasma: '⚡',
                          fuel: '🔥',
                          food: '🍏',
                          respirant: '💨'
                        };
                        return (
                          <div key={rKey} className={`p-2 rounded-lg border flex flex-col justify-center text-left ${hasSufficient ? 'bg-[#05070A]/50 border-[#1E293B]/40' : 'bg-red-950/10 border-red-500/20'}`}>
                            <span className="text-[9px] text-slate-500 font-bold truncate">{resIconsLocal[rKey]} {resNamesLocal[rKey]}</span>
                            <span className={`text-[11px] font-black ${hasSufficient ? 'text-slate-300' : 'text-red-400 animate-pulse'}`}>
                              {currentVal >= 1000000 ? `${(currentVal/1000000).toFixed(1)}M` : Math.round(currentVal).toLocaleString()} / {cost >= 1000000 ? `${(cost/1000000).toFixed(1)}M` : cost.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onUpgradeBuilding && onUpgradeBuilding('radar')}
                        disabled={isUpgrading || !(() => {
                          const nextRadarLvl = (activePlanet.buildings.radar?.level || 0) + 1;
                          return (['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).every(rKey => {
                            const cost = getUpgradeResourceCost('building', 'radar', nextRadarLvl, rKey);
                            const currentVal = (localResources ? localResources[rKey] : activePlanet.resources[rKey]) || 0;
                            return currentVal >= cost;
                          });
                        })()}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition duration-150 ${
                          (() => {
                            const nextRadarLvl = (activePlanet.buildings.radar?.level || 0) + 1;
                            return (['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).every(rKey => {
                              const cost = getUpgradeResourceCost('building', 'radar', nextRadarLvl, rKey);
                              const currentVal = (localResources ? localResources[rKey] : activePlanet.resources[rKey]) || 0;
                              return currentVal >= cost;
                            });
                          })() ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer' : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <span>🚀 Upgrade Radar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpgradeBuilding && onUpgradeBuilding('radar', true)}
                        disabled={isUpgrading}
                        className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/35 rounded-xl transition duration-150 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-emerald-400">Queue Upgrade</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Coordinates Search */}
          <form onSubmit={handleSearchSubmit} className="p-4 bg-[#0A0F1D]/90 border border-[#1E293B] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 bg-[#05070A] px-4 py-3 rounded-xl border border-[#1E293B] focus-within:border-cyan-500 transition-all">
                <span className="text-slate-500 font-bold">X COORD</span>
                <input 
                  type="number" 
                  value={searchX} 
                  onChange={(e) => setSearchX(e.target.value)}
                  className="bg-transparent text-white focus:outline-none w-full font-mono text-sm"
                  placeholder="0..100"
                />
              </div>
              <div className="flex items-center gap-2.5 bg-[#05070A] px-4 py-3 rounded-xl border border-[#1E293B] focus-within:border-cyan-500 transition-all">
                <span className="text-slate-500 font-bold">Y COORD</span>
                <input 
                  type="number" 
                  value={searchY} 
                  onChange={(e) => setSearchY(e.target.value)}
                  className="bg-transparent text-white focus:outline-none w-full font-mono text-sm"
                  placeholder="0..100"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isScanning}
              className="px-5 py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] text-cyan-400 font-bold text-xs uppercase tracking-widest border border-cyan-500/40 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] cursor-pointer"
              title="Search Sector: trigger planetary radar sweep"
            >
              <Search size={14} title="Search magnifying glass icon" />
              <span>SCAN SECTORS (Radius {activePlanet.buildings.radar.level})</span>
            </button>
          </form>

          {/* Quick Coordinate Deployment Panel */}
          <div className="p-3.5 bg-[#05070A]/80 border border-[#1E293B]/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shadow-sm">
            <div className="flex items-center gap-2 text-left">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0 animate-ping-slow" />
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                Quick Action Vectors: <span className="text-cyan-400 font-extrabold font-mono text-xs">[{searchX || '0'}, {searchY || '0'}]</span>
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={() => handleDirectLaunchCoords('move')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-[#0D1527] border border-[#1E293B] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 rounded-lg text-[10px] font-bold uppercase transition duration-150 cursor-pointer"
                title="Shorthand: Open move relocation launch configured for input coordinates"
              >
                📡 Fast Move Coord
              </button>
              <button
                type="button"
                onClick={() => handleDirectLaunchCoords('attack')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-red-950/20 border border-red-900/35 hover:border-red-500/50 text-red-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition duration-150 cursor-pointer"
                title="Shorthand: Open combat attack launch configured for input coordinates"
              >
                ⚔️ Fast Attack Coord
              </button>
            </div>
          </div>

          {/* Collapsible RADAR dropdown box */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4 shadow-lg">
            <div 
              onClick={() => setIsRadarFolderOpen(!isRadarFolderOpen)}
              className="flex items-center justify-between cursor-pointer hover:bg-[#1E293B]/45 p-2 rounded-lg transition"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#22d3ee] flex items-center gap-2 font-mono glow-cyan">
                <Radar size={16} className="text-cyan-400 animate-spin-slow shrink-0 animate-pulse" /> RADAR
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono font-bold">({scanResults.length} SIGNATURES ARCHIVED)</span>
                {isRadarFolderOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {isRadarFolderOpen && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                
                {/* Active settlement warning if settlement ships are ready */}
                {((activePlanet.troops?.settlementShip || 0) > 0) && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-pulse">
                    <span className="text-xl">🚀</span>
                    <div className="text-left font-mono">
                      <p className="text-xs font-bold text-emerald-400">SETTLEMENT FLIGHT READY</p>
                      <p className="text-[10.5px] text-slate-400 font-sans leading-normal">
                        You have <span className="text-white font-bold">{activePlanet.troops.settlementShip} Settlement Ship(s)</span> at this active station. Settle on any unsettled habitable zones listed below.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5bc0be]">SIGNATURE RESULTS LIST</span>
                  <span className="text-xs text-cyan-400 bg-cyan-950/30 border border-cyan-800/20 px-2 py-0.5 rounded font-bold">Scope [{targetCoords.x}, {targetCoords.y}]</span>
                </div>

                {/* Radar Segment Filter Buttons */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0A0F1D] border border-[#1E293B] rounded-xl text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => { setRadarFilter('all'); setRadarPage(0); }}
                    className={`py-2 rounded-lg font-bold transition-all ${radarFilter === 'all' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.1)]' : 'text-slate-400 hover:text-white border border-transparent cursor-pointer'}`}
                  >
                    ALL ({scanResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRadarFilter('habitable'); setRadarPage(0); }}
                    className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${radarFilter === 'habitable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-white border border-transparent cursor-pointer'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    HABITABLE ({scanResults.filter(t => t.isHabitable).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRadarFilter('player'); setRadarPage(0); }}
                    className={`py-2 rounded-lg font-bold transition-all ${radarFilter === 'player' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.1)]' : 'text-slate-400 hover:text-white border border-transparent cursor-pointer'}`}
                  >
                    STATIONS ({scanResults.filter(t => !t.isHabitable).length})
                  </button>
                </div>

                {(() => {
                  const filteredResults = scanResults.filter(target => {
                    if (radarFilter === 'habitable') return !!target.isHabitable;
                    if (radarFilter === 'player') return !target.isHabitable;
                    return true;
                  });

                  if (filteredResults.length === 0) {
                    return (
                      <div className="py-12 border border-dashed border-[#1E293B] text-center rounded-xl space-y-3" title="Static scanner feed diagnostics: no active targets found in area">
                        <Radar size={40} className="mx-auto text-slate-600 animate-pulse text-cyan-500/40" title="Scanning wave telemetry sweep feedback" />
                        <p className="text-sm font-bold text-slate-350">No matching sector signatures</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">No targets match the active radar filter option. Try changing your filters or scan coordinates.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="space-y-4 pr-1">
                        {filteredResults.slice(radarPage * 10, (radarPage + 1) * 10).map((target) => {
                      const isUserSelf = target.id === player.id;
                      const targetDist = Math.hypot(target.coords.x - activePlanet.sectorX, target.coords.y - activePlanet.sectorY);
                      const spaceMiles = targetDist * 1.917;
                      const isExpanded = !!expandedTargets[target.planetId];
                      
                      return (
                        <div 
                          key={target.planetId}
                          className={`p-4 rounded-xl border flex flex-col transition duration-150 ${isUserSelf ? 'bg-indigo-950/10 border-indigo-500/30' : 'bg-[#05070A] border-[#1E293B] hover:border-white/15'}`}
                        >
                          {/* Top Header Row (Always Visible) */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                            <div className="flex items-center gap-3 min-w-0">
                              <div 
                                onClick={() => {
                                  if (!target.isHabitable && target.id && onViewPlayerProfile) {
                                    onViewPlayerProfile(target.id);
                                  }
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border border-cyan-500/45 text-cyan-400 bg-cyan-500/10 uppercase font-mono shadow-inner shadow-cyan-500/15 ${!target.isHabitable && target.id && onViewPlayerProfile ? 'cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300' : ''}`}
                                title={!target.isHabitable && target.id && onViewPlayerProfile ? "Click to view Commander Profile" : undefined}
                              >
                                {target.planetName[0]}
                              </div>
                              <div className="text-left min-w-0">
                                <h4 
                                  onClick={() => {
                                    if (!target.isHabitable && target.id && onViewPlayerProfile) {
                                      onViewPlayerProfile(target.id);
                                    }
                                  }}
                                  className={`font-bold text-slate-200 text-[11px] sm:text-sm leading-tight truncate ${!target.isHabitable && target.id && onViewPlayerProfile ? 'cursor-pointer hover:text-cyan-400 transition' : ''}`}
                                  title={!target.isHabitable && target.id && onViewPlayerProfile ? "Click to view Commander Profile" : undefined}
                                >
                                  {target.planetName} <span className="text-[10px] sm:text-xs text-cyan-400 font-mono ml-1.5">[{target.coords.x}, {target.coords.y}]</span>
                                </h4>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {target.isHabitable ? (
                                    <span className="text-emerald-450 font-bold uppercase tracking-wide text-[10px] text-emerald-400 font-sans">Habitable Station</span>
                                  ) : (
                                    <>Commander: <button type="button" onClick={() => { if (onViewPlayerProfile && target.id) onViewPlayerProfile(target.id); }} className="text-cyan-400 font-bold font-mono hover:underline hover:text-cyan-300 transition cursor-pointer text-left">{target.username}</button></>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                              {/* Watchlist dropdown */}
                              <div className="relative w-1/2 sm:w-auto">
                                <button 
                                  onClick={() => {
                                    setShowAddToWatchlistMenu(showAddToWatchlistMenu === target.planetId ? null : target.planetId);
                                    setIsAddingNewGroupInline(false);
                                  }}
                                  className={`px-3 py-1.5 border hover:bg-[#1E293B]/45 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1 transition cursor-pointer w-full sm:w-28 ${
                                    watchlistGroups.some(g => g.items.some((item: any) => item.planetId === target.planetId))
                                      ? 'bg-amber-500/15 border-amber-500/45 text-amber-450 hover:bg-amber-500/25'
                                      : 'bg-[#0A0F1D] border-[#1E293B] text-slate-400 hover:text-white'
                                  }`}
                                  title="Add or organize this station into your watchlist groups"
                                >
                                  <span>★</span>
                                  <span>Watch</span>
                                </button>

                                {showAddToWatchlistMenu === target.planetId && (
                                  <div className="absolute right-0 mt-2 w-56 bg-[#0B132B] border border-[#1E293B] rounded-xl p-3 shadow-2xl z-50 text-left font-mono space-y-2.5 text-xs">
                                    <div className="font-bold text-amber-450 text-[10px] uppercase tracking-wider">Save to Group:</div>
                                    
                                    {watchlistGroups.length === 0 ? (
                                      <p className="text-[10px] text-slate-500">No groups configured. Create one below!</p>
                                    ) : (
                                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                        {watchlistGroups.map(group => {
                                          const inGroup = group.items.some((item: any) => item.planetId === target.planetId);
                                          return (
                                            <button
                                              key={group.id}
                                              onClick={() => {
                                                if (inGroup) {
                                                  handleRemoveStationFromGroup(target.planetId, group.id);
                                                } else {
                                                  handleAddStationToGroup(target, group.id);
                                                }
                                              }}
                                              className={`w-full text-left px-2 py-1.5 rounded hover:bg-[#1C2541]/50 flex items-center justify-between text-[11px] transition cursor-pointer ${inGroup ? 'text-amber-450 font-bold bg-[#1C2541]/30' : 'text-slate-300'}`}
                                            >
                                              <span className="truncate">{group.name}</span>
                                              <span>{inGroup ? '✓ Saved' : '+ Add'}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <div className="border-t border-white/5 pt-2">
                                      {isAddingNewGroupInline ? (
                                        <div className="space-y-1.5">
                                          <input 
                                            type="text"
                                            placeholder="New Group..."
                                            value={inlineNewGroupName}
                                            onChange={(e) => setInlineNewGroupName(e.target.value)}
                                            className="w-full bg-[#05070A] border border-[#1E293B] focus:border-amber-500 focus:outline-none rounded px-2 py-1 text-[11px] text-white"
                                            autoFocus
                                          />
                                          <div className="flex gap-1.5">
                                            <button
                                              onClick={() => {
                                                const trimmed = inlineNewGroupName.trim();
                                                if (trimmed) {
                                                  const newId = `group_${Math.random().toString(36).substring(2, 9)}`;
                                                  const newGroup = { id: newId, name: trimmed, items: [] };
                                                  const updated = [...watchlistGroups, newGroup];
                                                  setWatchlistGroups(updated);
                                                  localStorage.setItem(`moonbase_watchlist_groups_${player.id}`, JSON.stringify(updated));
                                                  if (showToast) showToast(`Group "${trimmed}" created!`, 'success');
                                                  
                                                  const watchlistItem = {
                                                    planetId: target.planetId,
                                                    planetName: target.planetName,
                                                    coords: { x: target.coords.x, y: target.coords.y },
                                                    username: target.username,
                                                    id: target.id,
                                                    isHabitable: !!target.isHabitable,
                                                    allianceTag: target.allianceTag,
                                                    allianceId: target.allianceId,
                                                    scores: target.scores || { population: 0, attack: 0, defence: 0, raiders: 0 },
                                                    addedAt: Date.now()
                                                  };
                                                  const updatedWithItem = updated.map(g => {
                                                    if (g.id === newId) {
                                                      return { ...g, items: [watchlistItem] };
                                                    }
                                                    return g;
                                                  });
                                                  saveWatchlist(updatedWithItem);
                                                  if (showToast) showToast(`Added "${target.planetName}" to "${trimmed}".`, 'success');
                                                  setShowAddToWatchlistMenu(null);
                                                  setInlineNewGroupName('');
                                                  setIsAddingNewGroupInline(false);
                                                }
                                              }}
                                              className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold py-1 rounded transition border border-amber-500/20 cursor-pointer text-center"
                                            >
                                              Confirm
                                            </button>
                                            <button
                                              onClick={() => setIsAddingNewGroupInline(false)}
                                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] py-1 rounded transition border border-slate-850 cursor-pointer text-center"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setIsAddingNewGroupInline(true)}
                                          className="w-full text-center py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded text-[10px] font-bold transition cursor-pointer border border-slate-800/50"
                                        >
                                          + Create New Group
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button 
                                onClick={() => {
                                  setExpandedTargets(prev => ({
                                    ...prev,
                                    [target.planetId]: !prev[target.planetId]
                                  }));
                                }}
                                className="px-2 sm:px-3 py-1.5 bg-[#0D1527] border border-[#1E293B] hover:border-[#38bdf8]/40 hover:bg-[#0F1E36] rounded-lg text-[10px] sm:text-xs font-bold font-mono text-slate-300 hover:text-cyan-400 flex items-center justify-center gap-1 transition cursor-pointer w-1/2 sm:w-28 shrink-0"
                              >
                                <span>{isExpanded ? "Hide" : "Show"} Details</span>
                                {isExpanded ? <ChevronUp size={14} className="text-red-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
                              </button>
                            </div>
                          </div>

                          {/* Dropdown Details Box Content */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#1E293B]/60 text-left animate-fade-in space-y-3.5">
                              {/* Station Core Parameters */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-2.5 bg-[#030508]/60 border border-[#161E2E] rounded-xl">
                                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Alliance Rank</span>
                                  {target.isHabitable ? (
                                    <span className="font-bold text-emerald-400 text-xs uppercase text-emerald-450">Uncharted Planet</span>
                                  ) : target.allianceTag ? (
                                    <span className="font-bold text-yellow-400 text-xs">[{target.allianceTag}] alliance member</span>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">Unaligned Commander</span>
                                  )}
                                </div>
                                <div className="p-2.5 bg-[#030508]/60 border border-[#161E2E] rounded-xl">
                                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Planetary Coordinates</span>
                                  <span className="font-bold text-slate-300">Sector [{target.coords.x}, {target.coords.y}]</span>
                                </div>
                                <div className="p-2.5 bg-[#030508]/60 border border-[#161E2E] rounded-xl">
                                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">{target.isHabitable ? "Type" : "System Population"}</span>
                                  <span className="font-bold text-emerald-400 text-xs">{target.isHabitable ? "Carbon-Based Biosphere" : `${target.scores.population.toLocaleString()} citizens`}</span>
                                </div>
                                <div className="p-2.5 bg-[#030508]/60 border border-[#161E2E] rounded-xl font-mono">
                                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Radar Connection Reach</span>
                                  <span className={`font-bold text-xs ${targetDist <= activePlanet.buildings.radar.level * 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {targetDist <= activePlanet.buildings.radar.level * 10 ? `TRACKED (${Math.round((targetDist/(activePlanet.buildings.radar.level * 10))*100)}% reach)` : 'OUTSIDE ACTIVE RADIUS'}
                                  </span>
                                </div>
                              </div>

                              {/* Distance Metrics */}
                              <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                                  Radial Distance: <span className="text-cyan-400 font-bold">{spaceMiles.toFixed(2)} Space Miles</span>
                                </span>
                                <span className="text-amber-400 bg-amber-950/10 border border-amber-900/30 px-2.5 py-1 rounded-lg">
                                  Travel Distance: {spaceMiles.toFixed(2)} Space Miles
                                </span>
                              </div>

                              {/* Tactical Mission Deployments */}
                              <div className="border-t border-[#1E293B]/30 pt-3 flex flex-wrap items-center gap-2 text-xs">
                                {isUserSelf ? (
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">COMMANDER HQ</span>
                                ) : target.isHabitable ? (
                                  <>
                                    <button 
                                      type="button"
                                      onClick={() => fetchIntelReport(target.coords.x, target.coords.y)}
                                      className="px-3.5 py-2 bg-amber-950/25 border border-amber-500/40 text-amber-400 hover:bg-[#b45309]/15 rounded-xl font-bold transition cursor-pointer text-[11px] font-mono"
                                    >
                                      Intel Report (50 Gold)
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => openDispatchFleet(target, 'move')}
                                      className="px-3.5 py-2 bg-[#0D1527] border border-[#1E293B] text-slate-355 rounded-xl hover:bg-[#0F1E36] font-bold transition cursor-pointer text-[11px] font-mono"
                                    >
                                      Move Fleet
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => openDispatchFleet(target, 'colonize')}
                                      className="px-4 py-2 bg-emerald-950/25 border border-emerald-500/40 text-emerald-400 hover:bg-[#10b981]/15 rounded-xl font-bold transition cursor-pointer text-[11px] animate-pulse font-mono"
                                    >
                                      Settle Sector
                                    </button>

                                  </>
                                ) : (
                                  <>

                                    <button 
                                      type="button"
                                      onClick={() => fetchIntelReport(target.coords.x, target.coords.y)}
                                      className="px-3.5 py-2 bg-amber-950/25 border border-amber-500/40 text-amber-400 hover:bg-[#b45309]/15 rounded-xl font-bold transition cursor-pointer text-[11px] font-mono"
                                    >
                                      Intel Report (50 Gold)
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => openDispatchFleet(target, 'move')}
                                      className="px-3.5 py-2 bg-slate-900 border border-[#1E293B] text-slate-300 rounded-xl hover:bg-slate-850 font-bold transition cursor-pointer text-[11px]"
                                    >
                                      Move Fleet
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => openDispatchFleet(target, 'attack')}
                                      disabled={isUserSelf || !!(player.allianceId && target.allianceId === player.allianceId)}
                                      className="px-3.5 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 rounded-xl font-bold transition cursor-pointer text-[11px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-950/20 disabled:text-red-500/70"
                                      title={isUserSelf ? "You cannot attack your own station!" : (player.allianceId && target.allianceId === player.allianceId) ? "Alliance members cannot attack each other!" : "Launch offensive combat assault"}
                                    >
                                      {isUserSelf ? 'Self Station' : (player.allianceId && target.allianceId === player.allianceId) ? 'Alliance Ally' : 'Attack Station'}
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setTargetForResources(target);
                                        setResourceSendValues({
                                          water: 0,
                                          plasma: 0,
                                          fuel: 0,
                                          food: 0,
                                          respirant: 0
                                        });
                                      }}
                                      className="px-3.5 py-2 bg-sky-950/20 border border-sky-900/35 text-sky-400 hover:bg-[#0284c7]/15 rounded-xl font-bold transition cursor-pointer text-[11px]"
                                    >
                                      📦 Transmit Resources
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>

                    {/* Pagination Controls */}
                    {filteredResults.length > 10 && (
                      <div className="flex items-center justify-between border-t border-[#1E293B]/60 pt-4 mt-2 font-mono text-xs">
                        <button
                          type="button"
                          disabled={radarPage === 0}
                          onClick={() => setRadarPage(prev => Math.max(0, prev - 1))}
                          className="px-3.5 py-2 bg-[#0D1527] border border-[#1E293B] text-slate-350 hover:text-cyan-400 hover:bg-[#0F1E36] disabled:opacity-30 disabled:pointer-events-none rounded-xl flex items-center gap-1.5 transition cursor-pointer font-bold"
                        >
                          <ChevronLeft size={14} />
                          <span>Previous</span>
                        </button>
                        
                        <span className="text-slate-400 font-bold bg-[#05070A] border border-[#1E293B] px-3.5 py-1.5 rounded-xl">
                          Page <span className="text-cyan-400">{radarPage + 1}</span> of {Math.ceil(filteredResults.length / 10)}
                        </span>

                        <button
                          type="button"
                          disabled={(radarPage + 1) * 10 >= filteredResults.length}
                          onClick={() => setRadarPage(prev => prev + 1)}
                          className="px-3.5 py-2 bg-[#0D1527] border border-[#1E293B] text-slate-350 hover:text-cyan-400 hover:bg-[#0F1E36] disabled:opacity-30 disabled:pointer-events-none rounded-xl flex items-center gap-1.5 transition cursor-pointer font-bold"
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            )}
          </div>

          {/* Watchlist Section */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4 shadow-lg">
            <div 
              onClick={() => setIsWatchlistOpen(!isWatchlistOpen)}
              className="flex items-center justify-between cursor-pointer hover:bg-[#1E293B]/45 p-2 rounded-lg transition"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 font-mono">
                <span className="text-amber-400 shrink-0">⭐️</span> SCANNER WATCHLIST
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  ({watchlistGroups.reduce((acc, g) => acc + g.items.length, 0)} STATIONS BOOKMARKED)
                </span>
                {isWatchlistOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {isWatchlistOpen && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                {/* Create Group Form & Filter Tabs */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                  {/* Quick Filter tabs by Group */}
                  <div className="flex flex-wrap gap-1 bg-[#05070A] p-1 border border-[#1E293B] rounded-xl text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveWatchlistGroupTab('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeWatchlistGroupTab === 'all' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:text-white border border-transparent cursor-pointer'}`}
                    >
                      ALL GROUPS
                    </button>
                    {watchlistGroups.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setActiveWatchlistGroupTab(g.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeWatchlistGroupTab === g.id ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:text-white border border-transparent cursor-pointer'}`}
                      >
                        {g.name} ({g.items.length})
                      </button>
                    ))}
                  </div>

                  {/* Create Group Input */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateGroup(newGroupNameInput);
                      setNewGroupNameInput('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <input 
                      type="text"
                      placeholder="New Group Name..."
                      value={newGroupNameInput}
                      onChange={(e) => setNewGroupNameInput(e.target.value)}
                      className="bg-[#05070A] border border-[#1E293B] hover:border-slate-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-slate-600"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 rounded-lg text-[10px] text-amber-400 font-extrabold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition duration-150"
                    >
                      + Add Group
                    </button>
                  </form>
                </div>

                {/* List of Groups */}
                <div className="space-y-6">
                  {watchlistGroups
                    .filter(g => activeWatchlistGroupTab === 'all' || activeWatchlistGroupTab === g.id)
                    .map(group => {
                      const isEditing = editingGroupId === group.id;

                      return (
                        <div key={group.id} className="border border-[#1E293B]/70 bg-[#05070A]/50 rounded-xl p-4 space-y-3">
                          {/* Group Header */}
                          <div className="flex items-center justify-between border-b border-[#1E293B]/40 pb-2">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="text"
                                    value={editingGroupNameInput}
                                    onChange={(e) => setEditingGroupNameInput(e.target.value)}
                                    className="bg-[#0A0F1D] border border-amber-500/50 text-white rounded px-2 py-0.5 text-xs font-bold"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleRenameGroup(group.id, editingGroupNameInput);
                                      setEditingGroupId(null);
                                    }}
                                    className="text-emerald-400 hover:text-emerald-300 text-xs font-bold font-mono px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-500/5 rounded cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingGroupId(null)}
                                    className="text-slate-400 hover:text-slate-300 text-xs font-bold font-mono px-1.5 py-0.5 border border-slate-500/20 bg-slate-500/5 rounded cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
                                    {group.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                                    ({group.items.length} items)
                                  </span>
                                </>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroupId(group.id);
                                    setEditingGroupNameInput(group.name);
                                  }}
                                  className="text-slate-400 hover:text-amber-400 transition cursor-pointer"
                                >
                                  Rename
                                </button>
                                <span className="text-slate-700">|</span>
                                <button
                                  type="button"
                                  disabled={group.items.length > 0}
                                  onClick={() => handleDeleteGroup(group.id, group.name)}
                                  className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-500 transition cursor-pointer"
                                  title={group.items.length > 0 ? "Cannot delete non-empty group" : "Delete group"}
                                >
                                  Delete Group
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Group Items List */}
                          {group.items.length === 0 ? (
                            <div className="py-6 text-center border border-dashed border-[#1E293B]/50 rounded-lg text-slate-500 text-xs font-mono">
                              No bookmarks in this group. Add stations from your active radar signature results!
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.items.map((item: any) => {
                                const dist = Math.hypot(item.coords.x - activePlanet.sectorX, item.coords.y - activePlanet.sectorY);
                                const spaceMiles = dist * 1.917;

                                return (
                                  <div 
                                    key={item.planetId}
                                    className="p-3.5 bg-[#030508]/80 border border-[#161E2E] rounded-xl flex flex-col justify-between space-y-3 hover:border-amber-500/30 transition duration-150"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="text-left space-y-0.5">
                                        <h5 className="font-bold text-slate-200 text-xs font-mono flex items-center gap-1.5">
                                          <span>{item.planetName}</span>
                                          <span className="text-[10px] text-amber-500 font-normal">[{item.coords.x}, {item.coords.y}]</span>
                                        </h5>
                                        <div className="text-[10px] text-slate-400 leading-normal">
                                          {item.isHabitable ? (
                                            <span className="text-emerald-450 font-bold uppercase tracking-wider text-[9px] text-emerald-550">Habitable</span>
                                          ) : (
                                            <>Commander: <button type="button" onClick={() => { if (onViewPlayerProfile && item.id) onViewPlayerProfile(item.id); }} className="text-cyan-400 font-bold font-mono hover:underline hover:text-cyan-300 transition cursor-pointer text-left">{item.username}</button></>
                                          )}
                                        </div>
                                        {item.allianceTag && (
                                          <p className="text-[9px] text-yellow-450 font-mono font-bold uppercase">
                                            [{item.allianceTag}] member
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStationFromGroup(item.planetId, group.id)}
                                        className="text-slate-500 hover:text-red-400 transition text-[11px] p-1 cursor-pointer"
                                        title="Remove from watchlist group"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Tactical Watchlist Actions */}
                                    <div className="border-t border-[#1E293B]/30 pt-2 flex flex-wrap gap-1.5 justify-start">
                                      {item.isHabitable ? (
                                        <>
                                          <button 
                                            type="button"
                                            onClick={() => fetchIntelReport(item.coords.x, item.coords.y)}
                                            className="px-2 py-1 bg-amber-950/20 border border-amber-500/30 text-amber-400 hover:bg-[#b45309]/10 rounded-lg font-bold transition cursor-pointer text-[10px] font-mono"
                                          >
                                            Intel (50 Gold)
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => openDispatchFleet(item, 'move')}
                                            className="px-2 py-1 bg-[#0D1527] border border-[#1E293B] text-slate-300 rounded-lg hover:bg-[#0F1E36] font-bold transition cursor-pointer text-[10px] font-mono"
                                          >
                                            Move Fleet
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => openDispatchFleet(item, 'colonize')}
                                            className="px-2.5 py-1 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 hover:bg-[#10b981]/10 rounded-lg font-bold transition cursor-pointer text-[10px] font-mono animate-pulse"
                                          >
                                            Settle
                                          </button>

                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            type="button"
                                            onClick={() => fetchIntelReport(item.coords.x, item.coords.y)}
                                            className="px-2 py-1 bg-amber-950/20 border border-amber-500/30 text-amber-400 hover:bg-[#b45309]/10 rounded-lg font-bold transition cursor-pointer text-[10px] font-mono"
                                          >
                                            Intel (50 Gold)
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => openDispatchFleet(item, 'move')}
                                            className="px-2 py-1 bg-slate-900 border border-[#1E293B] text-slate-300 rounded-lg hover:bg-slate-850 font-bold transition cursor-pointer text-[10px] font-mono"
                                          >
                                            Move Fleet
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => openDispatchFleet(item, 'attack')}
                                            disabled={item.id === player.id || !!(player.allianceId && item.allianceId === player.allianceId)}
                                            className="px-2 py-1 bg-red-950/25 border border-red-900/25 text-red-400 hover:bg-red-900/15 rounded-lg font-bold transition cursor-pointer text-[10px] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={item.id === player.id ? "You cannot attack your own station!" : (player.allianceId && item.allianceId === player.allianceId) ? "Alliance members cannot attack each other!" : "Launch attack"}
                                          >
                                            {item.id === player.id ? 'Self' : (player.allianceId && item.allianceId === player.allianceId) ? 'Ally' : 'Attack'}
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setTargetForResources(item);
                                              setResourceSendValues({
                                                water: 0,
                                                plasma: 0,
                                                fuel: 0,
                                                food: 0,
                                                respirant: 0
                                              });
                                            }}
                                            className="px-2 py-1 bg-sky-950/20 border border-sky-900/25 text-sky-400 hover:bg-[#0284c7]/10 rounded-lg font-bold transition cursor-pointer text-[10px] font-mono"
                                          >
                                            📦 Transmit
                                          </button>
                                        </>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-[#1E293B]/20 pt-2">
                                      <span>{spaceMiles.toFixed(1)} Space Miles</span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleWatchlistQuickScan(item.coords.x, item.coords.y)}
                                          className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer transition uppercase"
                                          title="Perform quick scanner lock sweep on this station's coordinates"
                                        >
                                          📡 Scan
                                        </button>
                                        {!item.isHabitable && item.id && onViewPlayerProfile && (
                                          <>
                                            <span className="text-slate-700">|</span>
                                            <button
                                              type="button"
                                              onClick={() => onViewPlayerProfile(item.id)}
                                              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition uppercase"
                                              title="Open player profile"
                                            >
                                              👤 Profile
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {isDirectRadarView && onCloseRadarDirectView && (
              <button
                type="button"
                onClick={onCloseRadarDirectView}
                className="fixed right-6 sm:right-8 bottom-20 z-50 flex items-center justify-center gap-2.5 px-5 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] transition duration-150 active:scale-95 group cursor-pointer"
                title="Back to Station"
              >
                <Compass size={18} className="animate-spin-slow group-hover:rotate-45 transition-transform" />
                <span className="text-xs uppercase tracking-widest font-black hidden sm:inline font-mono">RETURN TO BASE</span>
              </button>
            )}

          </div>
        </div>
        )
      )}

      {/* SUB TAB 2: LEADERBOARD */}
      {subTab === 'ranking' && (() => {
        // Prepare list with fallback
        const playerInList = playersList.some(p => p.id === player.id);
        const activePlayersWithYou = playerInList ? playersList : [...playersList, {
          id: player.id,
          username: player.username,
          faction: player.faction,
          factionColor: player.factionColor,
          allianceId: player.allianceId,
          allianceRole: player.allianceRole,
          scores: player.scores
        }];

        const getScoreValue = (pl: any, metric: string): number => {
          if (!pl || !pl.scores) return 0;
          switch(metric) {
            case 'population': return Number(pl.scores.population || 0);
            case 'attack': return Number(pl.scores.attack || 0);
            case 'defence': return Number(pl.scores.defence || 0);
            case 'raiders': return Number(pl.scores.raiders || 0);
            default: return 0;
          }
        };

        const sortedPlayers = [...activePlayersWithYou].sort((a, b) => {
          const sA = getScoreValue(a, rankingMetric);
          const sB = getScoreValue(b, rankingMetric);
          if (sB !== sA) return sB - sA;
          return a.username.localeCompare(b.username);
        });

        const myRankIndex = sortedPlayers.findIndex(p => p.id === player.id) + 1;

        // Alliance calculations
        const allianceStats = (Object.values(alliances || {}) as Alliance[]).map(all => {
          const membersWithScores = all.members.map(member => {
            const pl = activePlayersWithYou.find(p => p.id === member.playerId);
            return {
              playerId: member.playerId,
              username: member.username,
              role: member.role,
              scores: pl ? pl.scores : { population: 0, attack: 0, defence: 0, raiders: 0 },
              faction: pl ? pl.faction : 'Terran',
              factionColor: pl ? pl.factionColor : '#00bfff'
            };
          });

          const combinedScores = membersWithScores.reduce((acc, m) => {
            acc.population += m.scores.population || 0;
            acc.attack += m.scores.attack || 0;
            acc.defence += m.scores.defence || 0;
            acc.raiders += m.scores.raiders || 0;
            return acc;
          }, { population: 0, attack: 0, defence: 0, raiders: 0 });

          return {
            ...all,
            membersWithScores,
            combinedScores
          };
        });

        const sortedAlliances = [...allianceStats].sort((a, b) => {
          const sA = a.combinedScores[rankingMetric];
          const sB = b.combinedScores[rankingMetric];
          if (sB !== sA) return sB - sA;
          return a.name.localeCompare(b.name);
        });

        // Filter list based on search query
        let filteredPlayers = sortedPlayers;
        if (leaderboardSearch.trim() !== '') {
          filteredPlayers = sortedPlayers.filter(p => 
            p.username.toLowerCase().includes(leaderboardSearch.toLowerCase())
          );
        }

        let filteredAlliances = sortedAlliances;
        if (leaderboardSearch.trim() !== '' && leaderboardType === 'alliances') {
          filteredAlliances = sortedAlliances.filter(a => 
            a.name.toLowerCase().includes(leaderboardSearch.toLowerCase()) || 
            a.tag.toLowerCase().includes(leaderboardSearch.toLowerCase())
          );
        }

        // Bottom 10 vs normal paging
        const pageSize = 15;
        let displayPlayers: any[] = [];
        let displayAlliances: any[] = [];
        let totalPages = 1;

        if (leaderboardType === 'players') {
          if (showBottom10) {
            displayPlayers = filteredPlayers.slice(-10);
          } else if (showTop10) {
            displayPlayers = filteredPlayers.slice(0, 10);
          } else {
            totalPages = Math.ceil(filteredPlayers.length / pageSize) || 1;
            const pageToUse = Math.max(1, Math.min(totalPages, leaderboardPage));
            displayPlayers = filteredPlayers.slice((pageToUse - 1) * pageSize, pageToUse * pageSize);
          }
        } else {
          totalPages = Math.ceil(filteredAlliances.length / pageSize) || 1;
          const pageToUse = Math.max(1, Math.min(totalPages, leaderboardPage));
          displayAlliances = filteredAlliances.slice((pageToUse - 1) * pageSize, pageToUse * pageSize);
        }

        return (
          <div className="space-y-1.5">
            {/* Always Show Your Rank First */}
            <div className="p-4 bg-gradient-to-r from-cyan-950/45 via-blue-950/20 to-[#0A0F1D]/80 border border-cyan-500/30 rounded-xl flex flex-col xl:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 self-start xl:self-center">
                <div className="h-11 w-11 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-base font-mono shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                  #{myRankIndex}
                </div>
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block font-mono">YOUR COSMIC STANDING</span>
                  <p className="text-xs font-mono text-slate-350 font-bold mt-0.5">
                    ★ <span className="text-white text-sm">{player.username}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full xl:w-auto font-mono text-[11px]">
                <div className={`p-2 rounded-lg border border-[#1E293B] bg-[#030508]/65 text-center sm:text-right ${rankingMetric === 'population' ? 'border-cyan-500/35 bg-cyan-950/10' : ''}`}>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Pop Rank</span>
                  <span className="text-white font-bold">{player.scores.population.toLocaleString()}</span>
                </div>
                <div className={`p-2 rounded-lg border border-[#1E293B] bg-[#030508]/65 text-center sm:text-right ${rankingMetric === 'attack' ? 'border-cyan-500/35 bg-cyan-950/10' : ''}`}>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold text-red-400">Attack Pts</span>
                  <span className="text-red-400 font-bold">{player.scores.attack.toLocaleString()}</span>
                </div>
                <div className={`p-2 rounded-lg border border-[#1E293B] bg-[#030508]/65 text-center sm:text-right ${rankingMetric === 'defence' ? 'border-cyan-500/35 bg-cyan-950/10' : ''}`}>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold text-blue-400">Defense Pts</span>
                  <span className="text-blue-400 font-bold">{player.scores.defence.toLocaleString()}</span>
                </div>
                <div className={`p-2 rounded-lg border border-[#1E293B] bg-[#030508]/65 text-center sm:text-right ${rankingMetric === 'raiders' ? 'border-cyan-500/35 bg-cyan-950/10' : ''}`}>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold text-emerald-400">Raided Points</span>
                  <span className="text-emerald-400 font-bold">{player.scores.raiders.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Main Leaderboard Table Container */}
            <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]/60">
                <div className="flex items-center gap-1.5 select-none py-1">
                  <Trophy size={16} className="text-yellow-500 drop-shadow-[0_0_8px_#fbbf24]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#5bc0be] font-mono">
                    GALACTIC STANDINGS
                  </h3>
                </div>

                {/* Sub Tab Switcher (Commanders vs Star Alliances) */}
                <div className="flex bg-[#030508]/60 p-0.5 rounded-xl border border-[#1E293B] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setLeaderboardType('players');
                      setLeaderboardPage(1);
                    }}
                    className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-lg transition cursor-pointer font-mono ${leaderboardType === 'players' ? 'bg-[#5bc0be] text-slate-950 shadow-[0_0_8px_rgba(91,192,190,0.3)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    👤 Commanders
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLeaderboardType('alliances');
                      setLeaderboardPage(1);
                    }}
                    className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-lg transition cursor-pointer font-mono ${leaderboardType === 'alliances' ? 'bg-[#5bc0be] text-slate-950 shadow-[0_0_8px_rgba(91,192,190,0.3)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    🛡️ Galactic Alliances
                  </button>
                </div>

                {/* Top/Bottom limit toggle options (only show for player rankings) */}
                {leaderboardType === 'players' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTop10(!showTop10);
                        setShowBottom10(false);
                        setLeaderboardPage(1);
                      }}
                      className={`px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-xl transition border cursor-pointer font-mono shrink-0 ${showTop10 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-slate-950/50 text-slate-400 border-[#1E293B] hover:text-white hover:border-[#334155]'}`}
                    >
                      🏆 {showTop10 ? "View All Rankings" : "Check Top 10"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBottom10(!showBottom10);
                        setShowTop10(false);
                        setLeaderboardPage(1);
                      }}
                      className={`px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-xl transition border cursor-pointer font-mono shrink-0 ${showBottom10 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-950/50 text-slate-400 border-[#1E293B] hover:text-white hover:border-[#334155]'}`}
                    >
                      🚀 {showBottom10 ? "View All Rankings" : "Check Bottom 10"}
                    </button>
                  </div>
                )}
              </div>

              {/* Metric ranking switch selectors */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[10px]">
                {[
                  { key: 'population', label: '🌾 POPULATION STANDING', color: 'border-cyan-500/30' },
                  { key: 'attack', label: '⚔️ ATTACK POINTS', color: 'border-red-500/30' },
                  { key: 'defence', label: '🛡️ DEFENSE POINTS', color: 'border-blue-500/30' },
                  { key: 'raiders', label: '💰 RAIDED POINTS', color: 'border-emerald-500/30' }
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setRankingMetric(opt.key as any);
                      setLeaderboardPage(1);
                    }}
                    className={`p-2.5 rounded-xl border font-bold text-center uppercase tracking-wider transition duration-150 cursor-pointer ${rankingMetric === opt.key ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'bg-[#030508]/40 border-[#1E293B] text-slate-400 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Leaderboard Search Input */}
              <div className="relative font-mono">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={14} className="text-cyan-500/60" />
                </div>
                <input
                  type="text"
                  placeholder={leaderboardType === 'players' ? "Search for a commander by name..." : "Search for an alliance by name or tag..."}
                  value={leaderboardSearch}
                  onChange={(e) => {
                    setLeaderboardSearch(e.target.value);
                    setLeaderboardPage(1);
                  }}
                  className="w-full bg-[#05070A]/80 border border-[#1E293B] focus:border-cyan-500/65 focus:shadow-[0_0_12px_rgba(6,182,212,0.15)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition duration-150 outline-none font-mono"
                />
                {leaderboardSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLeaderboardSearch('');
                      setLeaderboardPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-white transition text-[10px] font-bold font-mono cursor-pointer"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* Player or Alliance list table */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {leaderboardType === 'players' ? (
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#1E293B]/70 text-slate-500 pb-2">
                        <th className="py-3 px-4 text-left font-bold tracking-wider whitespace-nowrap">RANK</th>
                        <th className="py-3 px-4 text-left font-bold tracking-wider whitespace-nowrap">COMMANDER ID</th>
                        {rankingMetric === 'population' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">POPULATION</th>}
                        {rankingMetric === 'attack' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">ATTACK POINTS</th>}
                        {rankingMetric === 'defence' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">DEFENSE POINTS</th>}
                        {rankingMetric === 'raiders' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">RAIDED POINTS</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-medium">
                      {displayPlayers.map((pl) => {
                        const isYou = pl.id === player.id;
                        const globalRankIdx = sortedPlayers.findIndex(x => x.id === pl.id) + 1;

                        return (
                          <tr 
                            key={pl.id} 
                            className={`border-b border-[#1E293B]/60 hover:bg-white/5 transition duration-150 ${isYou ? 'bg-cyan-950/15 text-cyan-300 font-bold border-l-2 border-l-cyan-400 pl-2' : 'text-slate-300'}`}
                          >
                            <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                              <span className={globalRankIdx <= 3 ? 'text-yellow-400 font-extrabold' : 'text-slate-500'}>
                                {globalRankIdx <= 3 ? `🏆 #${globalRankIdx}` : `#${globalRankIdx}`}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="flex items-center gap-1.5 font-bold">
                                  {isYou && <span className="text-yellow-400">★</span>}
                                  <button
                                    type="button"
                                    onClick={() => onViewPlayerProfile && onViewPlayerProfile(pl.id)}
                                    className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer focus:outline-none"
                                  >
                                    {pl.username}
                                  </button>
                                  {isYou && <span className="text-[10px] text-cyan-500/80 font-normal">(YOU)</span>}
                                  {pl.id.startsWith('ai_') && <span className="text-[9px] tracking-wider text-slate-500 font-semibold">[AI INTELLIGENCE]</span>}
                                </span>
                              </div>
                            </td>
                            {rankingMetric === 'population' && (
                              <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-cyan-400">
                                {(pl.scores?.population || 0).toLocaleString()}
                              </td>
                            )}
                            {rankingMetric === 'attack' && (
                              <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-red-400">
                                {(pl.scores?.attack || 0).toLocaleString()}
                              </td>
                            )}
                            {rankingMetric === 'defence' && (
                              <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-blue-400">
                                {(pl.scores?.defence || 0).toLocaleString()}
                              </td>
                            )}
                            {rankingMetric === 'raiders' && (
                              <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-emerald-400">
                                {(pl.scores?.raiders || 0).toLocaleString()}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#1E293B]/70 text-slate-500 pb-2">
                        <th className="py-3 px-4 text-left font-bold tracking-wider whitespace-nowrap">RANK</th>
                        <th className="py-3 px-4 text-left font-bold tracking-wider whitespace-nowrap">ALLIANCE [TAG]</th>
                        <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">MEMBERS</th>
                        {rankingMetric === 'population' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">POPULATION</th>}
                        {rankingMetric === 'attack' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">ATTACK POINTS</th>}
                        {rankingMetric === 'defence' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">DEFENSE POINTS</th>}
                        {rankingMetric === 'raiders' && <th className="py-3 px-4 text-right font-bold tracking-wider whitespace-nowrap">RAIDED POINTS</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-medium">
                      {displayAlliances.map((all) => {
                        const globalRankIdx = sortedAlliances.findIndex(x => x.id === all.id) + 1;
                        const isExpanded = expandedAllianceId === all.id;
                        const isYourAlliance = player.allianceId === all.id;

                        return (
                          <React.Fragment key={all.id}>
                            <tr 
                              className={`border-b border-[#1E293B]/60 hover:bg-white/5 transition duration-150 cursor-pointer ${isYourAlliance ? 'bg-[#5bc0be]/10 border-l-2 border-l-[#5bc0be] pl-2' : ''}`}
                              onClick={() => setExpandedAllianceId(isExpanded ? null : all.id)}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                                <span className={globalRankIdx <= 3 ? 'text-yellow-400 font-extrabold' : 'text-slate-500'}>
                                  {globalRankIdx <= 3 ? `🏆 #${globalRankIdx}` : `#${globalRankIdx}`}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="w-2.5 h-2.5 rounded-full" 
                                      style={{ backgroundColor: all.bannerColor || '#5bc0be' }}
                                    />
                                    <span className="font-bold text-[#5bc0be] hover:text-cyan-300">
                                      {all.name} <span className="text-slate-500 font-mono">[{all.tag}]</span>
                                    </span>
                                    {isYourAlliance && <span className="text-[10px] text-cyan-400 font-mono font-normal ml-1">(YOURS)</span>}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono font-normal">
                                    {isExpanded ? '▲ Collapse' : '▼ Expand Members'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right text-slate-300 font-bold font-mono">
                                {all.members.length}
                              </td>
                              {rankingMetric === 'population' && (
                                <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-[#5bc0be]">
                                  {all.combinedScores.population.toLocaleString()}
                                </td>
                              )}
                              {rankingMetric === 'attack' && (
                                <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-red-400">
                                  {all.combinedScores.attack.toLocaleString()}
                                </td>
                              )}
                              {rankingMetric === 'defence' && (
                                <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-blue-400">
                                  {all.combinedScores.defence.toLocaleString()}
                                </td>
                              )}
                              {rankingMetric === 'raiders' && (
                                <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap text-emerald-400">
                                  {all.combinedScores.raiders.toLocaleString()}
                                </td>
                              )}
                            </tr>

                            {/* Member list expansion row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={4} className="p-4 bg-[#05070a]/80 border-b border-[#1E293B]">
                                  <div className="space-y-3 pl-6 pr-4">
                                    <div className="flex items-center justify-between border-b border-[#1E293B]/40 pb-1.5">
                                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                        🛡️ {all.name} Alliance Command Roster ({all.members.length} members)
                                      </h4>
                                      <span className="text-[10px] text-slate-500 font-mono">Leader: <span className="text-yellow-400 font-bold">{all.leaderName}</span></span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                      {all.membersWithScores.map((mbr: any) => {
                                        const isMbrYou = mbr.playerId === player.id;
                                        return (
                                          <div 
                                            key={mbr.playerId}
                                            className={`p-2.5 rounded-xl border bg-[#080d16]/75 hover:bg-[#0c1322] transition flex flex-col justify-between gap-1.5 ${isMbrYou ? 'border-cyan-500/30' : 'border-[#1E293B]'}`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (onViewPlayerProfile) onViewPlayerProfile(mbr.playerId);
                                                }}
                                                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline text-left cursor-pointer focus:outline-none"
                                              >
                                                {mbr.username} {isMbrYou && <span className="text-[9px] text-cyan-500 font-normal">(YOU)</span>}
                                              </button>
                                              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-mono ${
                                                mbr.role === 'leader' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                mbr.role === 'officer' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                'bg-slate-800 text-slate-400'
                                              }`}>
                                                {mbr.role}
                                              </span>
                                            </div>

                                            {/* Mini score summary */}
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-slate-450 border-t border-[#1E293B]/30 pt-1.5 mt-0.5">
                                              <div>
                                                <span className="text-slate-500">Pop:</span> <span className="text-slate-300 font-semibold">{mbr.scores.population.toLocaleString()}</span>
                                              </div>
                                              <div>
                                                <span className="text-slate-500">Atk:</span> <span className="text-red-400 font-semibold">{mbr.scores.attack.toLocaleString()}</span>
                                              </div>
                                              <div>
                                                <span className="text-slate-500">Def:</span> <span className="text-blue-400 font-semibold">{mbr.scores.defence.toLocaleString()}</span>
                                              </div>
                                              <div>
                                                <span className="text-slate-500">Raid Pts:</span> <span className="text-emerald-400 font-semibold">{mbr.scores.raiders.toLocaleString()}</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination skip page controls */}
              {((leaderboardType === 'players' && !showBottom10 && !showTop10 && totalPages > 1) || 
                (leaderboardType === 'alliances' && totalPages > 1)) && (
                <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]/40 font-mono text-xs">
                  <div>
                    <span className="text-slate-500">Page <strong>{leaderboardPage}</strong> of <strong>{totalPages}</strong></span>
                    <span className="text-slate-600 text-[10px] ml-2 font-bold font-mono">
                      ({leaderboardType === 'players' ? `${sortedPlayers.length} space lords` : `${sortedAlliances.length} galactic alliances`})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={leaderboardPage === 1}
                      onClick={() => setLeaderboardPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 bg-[#0C1222] border border-[#1E293B] text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white hover:border-[#334155] rounded-xl transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>

                    {leaderboardType === 'players' && (
                      <button
                        type="button"
                        onClick={() => {
                          setLeaderboardSearch('');
                          setShowTop10(false);
                          setShowBottom10(false);
                          const myRankIndex = sortedPlayers.findIndex(p => p.id === player.id) + 1;
                          if (myRankIndex > 0) {
                            const myPage = Math.ceil(myRankIndex / 15);
                            setLeaderboardPage(myPage);
                            showToast?.("Command console focused on your ranking!", "success");
                          } else {
                            showToast?.("Unable to locate your ranking.", "error");
                          }
                        }}
                        className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-xs uppercase tracking-wider"
                      >
                        🎯 Find Me
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={leaderboardPage >= totalPages}
                      onClick={() => setLeaderboardPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 bg-[#0C1222] border border-[#1E293B] text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white hover:border-[#334155] rounded-xl transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {leaderboardType === 'players' && showBottom10 && (
                <div className="pt-2 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest block py-2 border-t border-[#1E293B]/20">
                  ⚡ DISPLAYING LOWER-TIER STANDINGS SYSTEMWIDE COMMANDERS (BOTTOM 10 ENGAGEMENT SCORES)
                </div>
              )}

              {leaderboardType === 'players' && showTop10 && (
                <div className="pt-2 text-center text-cyan-400 text-[10px] uppercase font-bold tracking-widest block py-2 border-t border-[#1E293B]/20 animate-pulse font-mono">
                  🏆 DISPLAYING ELITE STANDINGS SYSTEMWIDE COMMANDERS (TOP 10 ENGAGEMENT SCORES)
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SUB TAB 3: ALLIANCE & CHAT */}
      {subTab === 'comms' && (
        <div className="space-y-1.5">
          {/* Alliance Command */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <div 
              onClick={() => setShowAllianceCmd(!showAllianceCmd)}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-800/10 p-2 rounded-lg transition select-none"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2 font-mono">
                <Users size={16} /> Alliance Core Command
                {showAllianceCmd ? (
                  <ChevronUp size={12} className="text-red-500" />
                ) : (
                  <ChevronDown size={12} className="text-emerald-500" />
                )}
              </h3>
              {player.allianceId && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onLeaveAlliance(); }}
                  className="text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 transition duration-150 cursor-pointer"
                >
                  Leave Alliance
                </button>
              )}
            </div>

            {showAllianceCmd && (
              <>

            {player.allianceId ? (
              player.allianceRole === 'recruit' ? (
                <div className="p-6 bg-red-950/10 border border-red-500/20 text-center rounded-xl space-y-3 font-mono">
                  <ShieldAlert size={36} className="mx-auto text-red-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">ACCESS LEVEL DENIED</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    You are currently registered as a <span className="font-bold text-yellow-400 uppercase">Recruit</span> in [{alliances[player.allianceId]?.tag || 'Alliance'}]. 
                    Recruits are restricted from viewing classified military declarations, active war councils, 
                    the alliance roster list, or participating in communications. 
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Kindly contact an Officer or the Commander of the alliance to request profile review.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[#05070A]/95 rounded-xl border border-[#1E293B] space-y-6 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-lg text-yellow-400 tracking-tight">[{alliances[player.allianceId]?.tag}] {alliances[player.allianceId]?.name}</span>
                      <p className="text-[11px] text-slate-500 mt-1">Founding Archon: {alliances[player.allianceId]?.leaderName}</p>
                    </div>
                    <span className="px-3.5 py-1 rounded-full text-[10px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 w-fit">
                      Role: {player.allianceRole?.toUpperCase()}
                    </span>
                  </div>

                  {/* ALLIANCE NOTES LEDGER (HIGHLIGHTS) */}
                  <div className="p-3.5 bg-amber-950/10 border border-amber-500/15 rounded-xl space-y-2">
                    <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      📌 ALLIANCE NOTES LEDGER (HIGHLIGHTS)
                    </h4>
                    <p className="text-[11px] text-slate-300 bg-[#020304]/60 p-2.5 rounded-lg border border-[#1E293B]/40 leading-relaxed font-sans min-h-[44px] whitespace-pre-wrap">
                      {alliances[player.allianceId]?.highlights || "No highlights recorded yet in the alliance notes ledger. Any authorized commander can update notes inside the Operations Cockpit below."}
                    </p>
                  </div>

                  {/* ALLIANCE OPERATIONS COCKPIT */}
                  <div className="p-4 bg-cyan-950/15 border border-cyan-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                        <Radio size={14} className="animate-pulse" /> Alliance Operations Cockpit
                      </h4>
                      <p className="text-[10.5px] text-slate-400 max-w-sm">
                        Access real-time intelligence: highlights notes ledger, coordinates situation room, member troop counts, and player activity times.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenManageAlliance}
                      className="w-full sm:w-auto px-4.5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] font-mono text-[10.5px] font-black uppercase tracking-widest rounded-xl transition duration-150 cursor-pointer text-center"
                    >
                      Manage Alliance ⚙️
                    </button>
                  </div>

                  {/* Alliance Members Management */}
                  <div className="pt-4 border-t border-[#1E293B] space-y-3">
                    <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      👥 ALLIANCE ROSTER DIRECTORY ({alliances[player.allianceId]?.members?.length || 0})
                    </h4>
                    {(() => {
                      const activeAlliance = alliances[player.allianceId || ''];
                      if (!activeAlliance?.members) return <p className="text-slate-500 text-[11px]">Roster empty or loading.</p>;

                      const getRankLabel = (role: string) => {
                        if (role === 'commander' || role === 'leader') return 'COMMANDER';
                        if (role === 'officer') return 'OFFICER';
                        if (role === 'member') return 'MEMBER';
                        if (role === 'recruit') return 'RECRUIT';
                        return 'MEMBER';
                      };

                      const getRankColor = (role: string) => {
                        if (role === 'commander' || role === 'leader') return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
                        if (role === 'officer') return 'text-purple-400 border-purple-500/30 bg-purple-500/5';
                        if (role === 'member') return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
                        return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
                      };

                      const activeRank = getRankValue(player.allianceRole);

                      return (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {activeAlliance.members.map((mbr) => {
                            const mbrRank = getRankValue(mbr.role);
                            const isSelf = mbr.playerId === player.id;
                            const canManage = activeRank >= 2 && activeRank > mbrRank && !isSelf;

                            return (
                              <div key={mbr.playerId} className="p-3 border border-[#1E293B] bg-[#030508]/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:bg-[#070b14]/50 transition">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSelf ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => onViewPlayerProfile && onViewPlayerProfile(mbr.playerId)}
                                      className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer focus:outline-none"
                                    >
                                      {mbr.username}
                                    </button>
                                    {isSelf && <span className="text-[9px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded px-1 ml-1.5 font-bold">YOU</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRankColor(mbr.role)}`}>
                                    {getRankLabel(mbr.role)}
                                  </span>

                                  {canManage && (
                                    <div className="flex items-center gap-1 mt-1 sm:mt-0">
                                      {/* Promote button */}
                                      {((mbrRank < 2) || (mbrRank === 2 && activeRank === 3)) && (
                                        <button
                                          type="button"
                                          onClick={() => handlePromoteMember(mbr.playerId)}
                                          className="px-2 py-1 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 rounded font-bold cursor-pointer text-[10px]"
                                        >
                                          Promote 🔼
                                        </button>
                                      )}

                                      {/* Demote button */}
                                      {mbrRank > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDemoteMember(mbr.playerId)}
                                          className="px-2 py-1 bg-amber-950/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15 rounded font-bold cursor-pointer text-[10px]"
                                        >
                                          Demote 🔽
                                        </button>
                                      )}

                                      {/* Kick button */}
                                      <button
                                        type="button"
                                        onClick={() => handleKickMember(mbr.playerId)}
                                        className="px-2 py-1 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500/15 rounded font-bold cursor-pointer text-[10px]"
                                      >
                                        Dismiss ❌
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )
            ) : (() => {
              const commsHubLvl = player ? Math.max(...player.planets.map(pl => pl.buildings.commsHub?.level || 0)) : 0;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Create alliance */}
                  {commsHubLvl < 5 ? (
                    <div className="p-5 bg-pink-950/5 rounded-xl border border-pink-500/10 flex flex-col items-center justify-center text-center space-y-2.5 font-mono">
                      <Sparkles size={24} className="text-pink-400 opacity-60 animate-pulse" />
                      <span className="text-[10px] text-pink-400 uppercase tracking-widest font-bold">Create Alliance Blocked</span>
                      <p className="text-slate-400 text-xs">Requires Communications Hub Level 5 to establish a new alliance sovereignty (Current: Level {commsHubLvl}).</p>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateAllianceSubmit} className="p-5 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-4 font-mono">
                      <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><Sparkles size={12} className="text-cyan-400" /> Create Alliance</h4>
                      <div className="space-y-3 text-xs">
                        <input 
                          type="text" 
                          placeholder="ALLIANCE NAME"
                          value={allianceName}
                          onChange={(e) => setAllianceName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-xl focus:outline-none focus:border-cyan-500 uppercase font-mono"
                        />
                        <input 
                          type="text" 
                          placeholder="TAG (max 4 chars)"
                          maxLength={4}
                          value={allianceTag}
                          onChange={(e) => setAllianceTag(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-xl focus:outline-none focus:border-cyan-500 uppercase font-mono"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full px-4 py-3 bg-gradient-to-r from-pink-900/10 to-pink-500/10 hover:from-pink-900/20 hover:to-pink-500/20 border border-pink-500/40 hover:border-pink-500/60 text-pink-400 hover:text-pink-300 font-bold font-mono tracking-widest text-[10px] uppercase rounded-xl transition cursor-pointer"
                      >
                        Create alliance
                      </button>
                    </form>
                  )}

                  {/* Join list */}
                  {commsHubLvl < 4 ? (
                    <div className="p-5 bg-yellow-950/5 rounded-xl border border-yellow-500/10 flex flex-col items-center justify-center text-center space-y-2.5 font-mono">
                      <Users size={24} className="text-yellow-400 opacity-60 animate-pulse" />
                      <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold">Join Alliance Blocked</span>
                      <p className="text-slate-400 text-xs">Requires Communications Hub Level 4 to apply/join any galactic alliance coalition (Current: Level {commsHubLvl}).</p>
                    </div>
                  ) : (
                    <div className="p-5 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-4 font-mono">
                      <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><Users size={12} className="text-yellow-400" /> Join Existing</h4>
                      <div className="space-y-2.5 max-h-[160px] overflow-y-auto text-xs pr-1">
                        {rankedState.map((alliance) => {
                          const alreadyApplied = alliance.applications?.some(a => a.playerId === player.id);
                          return (
                            <div key={alliance.id} className="p-2.5 border border-[#1E293B] bg-[#0A0F1D] rounded-xl flex items-center justify-between">
                              <div>
                                <span className="font-bold text-yellow-400">[{alliance.tag}]</span>
                                <span className="text-slate-350 ml-2 font-bold uppercase">{alliance.name}</span>
                              </div>
                              {alreadyApplied ? (
                                <span className="px-3 py-1.5 bg-slate-800 text-slate-400 text-[10px] font-bold font-mono tracking-widest uppercase border border-slate-700 rounded-lg">
                                  Pending Approval 🕒
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onJoinAlliance(alliance.id);
                                  }}
                                  className="px-3 py-1.5 bg-yellow-600/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-[10px] font-bold font-mono tracking-widest uppercase border border-yellow-500/30 rounded-lg cursor-pointer transition duration-150"
                                >
                                  Apply to Join
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            </>
          )}
          </div>

          {/* Tactical Decrypted Feed (DEC links) */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <button
              onClick={() => setShowDecFeed(!showDecFeed)}
              className="w-full flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer select-none"
              type="button"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2 font-mono">
                <Radio size={16} className="text-emerald-500 animate-pulse" /> Decrypted Direct Comms Links (DEC Feed)
                {showDecFeed ? (
                  <ChevronUp size={12} className="text-red-500" />
                ) : (
                  <ChevronDown size={12} className="text-emerald-500" />
                )}
              </h3>
            </button>
            
            {showDecFeed && (
              <>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
              Scanned dec links directly patched into your Communications Hub. Access real-time intelligence telemetry and recent military engagement transmissions here.
            </p>

            {battleReports.length === 0 ? (
              <div className="py-8 border border-dashed border-[#1E293B] text-center rounded-xl font-mono text-xs text-slate-600">
                No active decrypted data-streams detected. Disseminate Missile Launchers or initiate tactical operations.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recon Scans column */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">📡 Intelligence Dec Links (Scans)</span>
                  <div className="space-y-2 max-h-[255px] overflow-y-auto pr-1">
                    {battleReports.filter(r => r.isRecon === true).length === 0 ? (
                      <p className="text-slate-600 text-[11px] italic font-sans py-2 font-mono">No active scout reports decrypted.</p>
                    ) : (
                      battleReports.filter(r => r.isRecon === true).map((report) => {
                        const isExpanded = expandedIntelReports[report.id] || false;
                        return (
                          <div key={report.id} className="p-3 border border-[#1E293B] bg-[#030508]/60 hover:bg-[#070b14]/70 transition rounded-xl font-mono">
                            <button
                              type="button"
                              onClick={() => setExpandedIntelReports(prev => ({ ...prev, [report.id]: !isExpanded }))}
                              className="w-full text-left flex items-center justify-between text-[11px] text-slate-300 font-bold hover:text-white transition cursor-pointer"
                            >
                              <span className="truncate pr-2">
                                🛰️ <span className="text-cyan-400 font-mono underline hover:text-cyan-300">DEC-LINK_SCAN_POS_{report.defenderCoords.x}_{report.defenderCoords.y}</span>
                              </span>
                              <span className="text-[9px] text-[#5bc0be] bg-[#5bc0be]/10 px-1.5 py-0.5 rounded border border-[#5bc0be]/20 shrink-0">
                                {isExpanded ? 'CLOSE' : 'DECRYPT'}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="mt-2.5 pt-2 border-t border-[#1E293B]/60 text-[10.5px] space-y-2 text-slate-400 animate-fade-in">
                                <p className="font-bold text-slate-300">TARGET: {report.defenderName}</p>
                                <div className="space-y-1 text-slate-400 text-[10px]">
                                  <p>• Interceptors: <span className="text-slate-200 font-bold">{report.defenderInitialTroops?.defender ?? 0}</span></p>
                                  <p>• Assault Drones: <span className="text-slate-200 font-bold">{report.defenderInitialTroops?.attacker ?? 0}</span></p>
                                  <p>• Disrupters: <span className="text-slate-200 font-bold">{report.defenderInitialTroops?.tank ?? 0}</span></p>
                                  <p>• Matter Extractors: <span className="text-slate-200 font-bold">{report.defenderInitialTroops?.looter ?? 0}</span></p>
                                  <p>• Missile Launchers: <span className="text-slate-200 font-bold">{report.defenderInitialTroops?.drone ?? 0}</span></p>
                                  <p>• Settlement Ships: <span className="text-slate-200 font-bold">{report.defenderInitialTroops?.settlementShip ?? 0}</span></p>
                                </div>
                                <span className="text-[9px] text-slate-500 block">Stamped: {new Date(report.timestamp).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Combat Engagements column */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block font-mono">⚔️ Tactical Combat Dec Links</span>
                  <div className="space-y-2 max-h-[255px] overflow-y-auto pr-1">
                    {battleReports.filter(r => r.isRecon !== true && r.isMove !== true).length === 0 ? (
                      <p className="text-slate-600 text-[11px] italic font-sans py-2 font-mono">No military encounters decrypted.</p>
                    ) : (
                      battleReports.filter(r => r.isRecon !== true && r.isMove !== true).map((report) => {
                        const isExpanded = expandedCombatReports[report.id] || false;
                        const isAttacker = report.attackerId === player.id;
                        const isDefender = report.defenderId === player.id;
                        let outcome = 'DEFEATED';
                        if (isAttacker) {
                          outcome = report.winner === 'attacker' ? 'WINNER' : 'DEFEATED';
                        } else if (isDefender) {
                          outcome = report.winner === 'defender' ? 'WINNER' : 'DEFEATED';
                        } else {
                          outcome = report.winner === 'attacker' ? 'ATT WINNER' : 'DEF WINNER';
                        }
                        return (
                          <div key={report.id} className="p-3 border border-[#1E293B] bg-[#030508]/60 hover:bg-[#070b14]/70 transition rounded-xl font-mono">
                            <button
                              type="button"
                              onClick={() => setExpandedCombatReports(prev => ({ ...prev, [report.id]: !isExpanded }))}
                              className="w-full text-left flex items-center justify-between text-[11px] text-slate-300 font-bold hover:text-white transition cursor-pointer"
                            >
                              <span className="truncate pr-2">
                                ⚔️ <span className="text-red-400 font-mono underline hover:text-red-300">DEC-LINK_ENGAGE_SEC_{report.defenderCoords.x}_{report.defenderCoords.y}</span>
                              </span>
                              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border shrink-0 font-bold ${outcome === 'WINNER' || outcome.includes('WINNER') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                                {isExpanded ? 'CLOSE' : outcome}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="mt-2.5 pt-2 border-t border-[#1E293B]/60 text-[10.5px] space-y-2 text-slate-400 animate-fade-in">
                                <p className="font-bold text-slate-300">{isAttacker ? 'Attacked' : 'Defended from'} {isAttacker ? report.defenderName : report.attackerName}</p>
                                <div className="space-y-1 text-slate-400 text-[10px]">
                                  <p>• Winner Party: <span className="text-slate-200 font-bold uppercase">{report.winner}</span></p>
                                  {report.stolenResources && (
                                    <p className="text-amber-400 font-bold">💰 Stolen: {(Object.entries(report.stolenResources) as [string, number][]).map(([resName, qty]) => qty > 0 ? `${qty.toLocaleString()} ${resName}` : null).filter(Boolean).join(', ') || 'No loot'}</p>
                                  )}
                                  {report.damagedBuildingClass && (
                                    <p className="text-red-400">💥 Damaged: {report.damagedBuildingClass.toUpperCase()} (level demoted: -1)</p>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-550 block">Stamped: {new Date(report.timestamp).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
            </>
          )}
          </div>
        </div>
      )}

      {/* SUB TAB 4: NEWS TICKER & REPORTS */}
      {subTab === 'news' && (
        <div className="space-y-3">
          {/* Collapsible Drop Down Box 1: Combat Reports */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <div 
              className="flex items-center justify-between p-2 rounded-lg gap-4 flex-wrap sm:flex-nowrap"
            >
              <div 
                onClick={() => setIsCombatOpen(!isCombatOpen)}
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/20 p-1.5 rounded-lg transition flex-1"
              >
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2 font-mono" title="Secure sector combat encounter history and archives logs">
                  <ShieldAlert size={16} title="Battle alert logs warning status" /> Military Combat Reports ({battleReports.filter(r => r.isRecon !== true && r.isMove !== true).length})
                </h3>
                {isCombatOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkAllRead) onMarkAllRead();
                }}
                className="py-1 px-3 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 font-mono font-bold rounded-lg transition-all text-[11px] uppercase tracking-wider cursor-pointer"
              >
                ✓ Mark All Read
              </button>
            </div>

            {isCombatOpen && (
              <div className="pt-2 border-t border-white/5 space-y-3">
                {(() => {
                  const filtered = battleReports.filter(r => r.isRecon !== true && r.isMove !== true);
                  return (
                    /* Category filters (Separating Attacks and Defenses) and local action button */
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-2 border-b border-white/5">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[9.5px] w-full md:w-auto flex-1">
                        <button
                          type="button"
                          onClick={() => setCombatCategoryFilter('all')}
                          className={`py-1 px-1.5 font-bold rounded-lg transition-colors border cursor-pointer text-center ${combatCategoryFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-950 text-slate-400 border-white/5 hover:text-slate-200'}`}
                        >
                          📝 ALL ({filtered.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCombatCategoryFilter('attack')}
                          className={`py-1 px-1.5 font-bold rounded-lg transition-colors border cursor-pointer text-center ${combatCategoryFilter === 'attack' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-400 border-white/5 hover:text-slate-200'}`}
                        >
                          ⚔️ ATTACKS ({filtered.filter(r => r.attackerId === player.id).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCombatCategoryFilter('defense')}
                          className={`py-1 px-1.5 font-bold rounded-lg transition-colors border cursor-pointer text-center ${combatCategoryFilter === 'defense' ? 'bg-rose-500/20 text-rose-350 border-rose-500/40' : 'bg-slate-950 text-slate-400 border-white/5 hover:text-slate-200'}`}
                        >
                          🛡️ DEFENSES ({filtered.filter(r => r.defenderId === player.id).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCombatCategoryFilter('saved')}
                          className={`py-1 px-1.5 font-bold rounded-lg transition-colors border cursor-pointer text-center ${combatCategoryFilter === 'saved' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-white/5 hover:text-slate-200'}`}
                        >
                          ⭐ SAVED ({filtered.filter(r => savedReports[r.id]).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCombatCategoryFilter('unread')}
                          className={`py-1 px-1.5 font-bold rounded-lg transition-colors border cursor-pointer text-center ${combatCategoryFilter === 'unread' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/45 shadow-[0_0_8px_rgba(34,211,238,0.15)]' : 'bg-slate-950 text-slate-400 border-white/5 hover:text-slate-200'}`}
                        >
                          🔵 UNREAD ({filtered.filter(r => !readReports[r.id]).length})
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMarkAllRead) onMarkAllRead();
                        }}
                        className="py-1 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all text-[9.5px] uppercase tracking-wider shrink-0 cursor-pointer font-mono"
                      >
                        ✓ Mark Combat Read
                      </button>
                    </div>
                  );
                })()}

                {(() => {
                  const filtered = battleReports.filter(r => r.isRecon !== true && r.isMove !== true);
                  let resultList = filtered;
                  if (combatCategoryFilter === 'saved') {
                    resultList = filtered.filter(r => savedReports[r.id]);
                  } else if (combatCategoryFilter === 'attack') {
                    resultList = filtered.filter(r => r.attackerId === player.id);
                  } else if (combatCategoryFilter === 'defense') {
                    resultList = filtered.filter(r => r.defenderId === player.id);
                  } else if (combatCategoryFilter === 'unread') {
                    resultList = filtered.filter(r => !readReports[r.id]);
                  }

                  if (resultList.length === 0) {
                    return (
                      <div className="py-8 border border-dashed border-[#1E293B] text-center rounded-xl">
                        <p className="text-xs text-slate-500 font-mono">
                          {combatCategoryFilter === 'saved' ? "No saved entries match your filters." : 
                           combatCategoryFilter === 'attack' ? "No offensive attack vectors logged." :
                           combatCategoryFilter === 'defense' ? "No defensive combat encounters logged." :
                           combatCategoryFilter === 'unread' ? "No unread combat reports." :
                           "No military battle engagements logged."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 font-mono text-xs">
                      {resultList.map((report) => {
                        const isExpanded = expandedCombatReports[report.id] || false;
                        const isPlayerAttacker = report.attackerId === player.id;
                        const isPlayerDefender = report.defenderId === player.id;
                        const roleLabel = isPlayerAttacker ? 'Attacked' : 'Defended against';
                        const counterpartyName = isPlayerAttacker ? report.defenderName : report.attackerName;
                        const counterpartyId = isPlayerAttacker ? report.defenderId : report.attackerId;
                        let outcomeText = 'DEFEAT';
                        if (isPlayerAttacker) {
                          outcomeText = report.winner === 'attacker' ? 'VICTORY' : 'DEFEAT';
                        } else if (isPlayerDefender) {
                          outcomeText = report.winner === 'defender' ? 'VICTORY' : 'DEFEAT';
                        } else {
                          outcomeText = report.winner === 'attacker' ? 'ATTACKER VICTORY' : 'DEFENDER VICTORY';
                        }

                        const isSaved = savedReports[report.id] || false;
                        const isRead = readReports[report.id] || false;

                        // Calculate raid score (total stolen resources)
                        const raidScore = Object.values(report.resourcesStolen || {}).reduce<number>((s: number, v: any) => s + (v || 0), 0);

                        return (
                          <div key={report.id} className={`p-3 border rounded-xl space-y-2 transition-colors ${!isRead ? 'border-cyan-500/25 bg-[#061224]/50' : 'border-[#1E293B] bg-[#05070A]'}`}>
                            <div 
                              onClick={() => {
                                const nextExpanded = !isExpanded;
                                setExpandedCombatReports(prev => ({ ...prev, [report.id]: nextExpanded }));
                                if (nextExpanded && onMarkRead) {
                                  onMarkRead(report.id);
                                }
                              }}
                              className="flex items-center justify-between cursor-pointer hover:bg-slate-900/40 p-1.5 rounded-lg transition"
                            >
                              <div className="flex flex-col gap-1 pr-4 text-left">
                                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                                  {/* Pulsing state marker */}
                                  {!isRead && (
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_5px_#22d3ee]" />
                                  )}
                                  ⚔️ <span className={outcomeText.includes('VICTORY') ? 'text-cyan-400' : 'text-red-400'}>[{outcomeText}]</span> {roleLabel}{' '}
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onViewPlayerProfile) onViewPlayerProfile(counterpartyId);
                                    }}
                                    className="underline decoration-dotted cursor-pointer text-cyan-455 text-cyan-400 hover:text-cyan-300 font-bold"
                                  >
                                    {counterpartyName}
                                  </span>
                                  <span className="text-slate-550 font-normal">({new Date(report.timestamp).toLocaleDateString()})</span>
                                </span>
                                <span className="text-[9.5px] text-slate-500">
                                  Stolen: {raidScore.toLocaleString()} res | Points: <span className="text-amber-400 font-bold">{isPlayerAttacker ? (report.defenceHpKilled || 0) : (report.attackHpKilled || 0)} pts</span>
                                </span>
                              </div>
                              <button
                                type="button"
                                className="text-slate-400 font-bold px-2 py-1 rounded border border-white/5 hover:text-white uppercase text-[9px] font-mono tracking-widest bg-slate-900 flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                {isExpanded ? 'Collapse' : 'Expand'}
                              </button>
                            </div>

                            {/* Control button tools interface */}
                            <div className="flex flex-wrap items-center justify-between text-[10px] border-b border-white/5 pb-2 text-slate-400 gap-1.5">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onToggleSave) onToggleSave(report.id);
                                  }}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition border cursor-pointer ${isSaved ? 'text-amber-300 bg-amber-500/10 border-amber-500/25' : 'text-slate-450 border-white/5 hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                  <span>{isSaved ? '★ Saved' : '☆ Save'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isRead) {
                                      if (onMarkUnread) onMarkUnread(report.id);
                                    } else {
                                      if (onMarkRead) onMarkRead(report.id);
                                    }
                                  }}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/5 bg-slate-900/40 hover:text-white transition cursor-pointer"
                                >
                                  <span>{isRead ? '✉ Mark Unread' : '✉ Mark Read'}</span>
                                </button>

                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/5 bg-slate-900/40 text-[9px] text-slate-400">
                                  <span>📤 Forward:</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onForwardReport) onForwardReport(report, 'global');
                                    }}
                                    className="text-cyan-400 hover:text-cyan-300 font-bold ml-1 cursor-pointer"
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

                            {isExpanded && (
                            <div className="pt-3 border-t border-white/5 space-y-3.5">
                              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-white/5">
                                <span className="text-slate-500">{new Date(report.timestamp).toLocaleString()}</span>
                                <span className={`font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                  (report.winner === 'attacker' && isPlayerAttacker) || (report.winner === 'defender' && isPlayerDefender)
                                    ? 'text-cyan-400 bg-cyan-950/15 animate-pulse'
                                    : (report.winner === 'defender' && isPlayerAttacker) || (report.winner === 'attacker' && isPlayerDefender)
                                    ? 'text-red-400 bg-red-950/15'
                                    : 'text-slate-400 bg-white/5'
                                }`}>
                                  {report.winner.toUpperCase()} VICTORIOUS
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                                <div>
                                  {(() => {
                                    const mDef: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                                    const mAtk: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                                    const attHpValue = Object.entries(report.attackerInitialTroops || {}).reduce((sum, [k, v]) => sum + (Number(v) || 0) * (mDef[k] || 10), 0);
                                    const attAtkValue = Object.entries(report.attackerInitialTroops || {}).reduce((sum, [k, v]) => sum + (Number(v) || 0) * (mAtk[k] || 10), 0);
                                    const totalAttInitial = Object.values(report.attackerInitialTroops || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                                    const totalAttLosses = Object.values(report.attackerLosses || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                                    const attLossPercent = totalAttInitial > 0 ? ((totalAttLosses / totalAttInitial) * 100).toFixed(1) : '0.0';
                                    return (
                                      <>
                                        <p className="font-bold text-red-100 text-red-400 uppercase tracking-wide flex items-center justify-between">
                                          <span>ATTACKER:{' '}
                                            <span 
                                              onClick={() => onViewPlayerProfile && onViewPlayerProfile(report.attackerId)}
                                              className="underline decoration-dotted cursor-pointer hover:text-red-300"
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

                                            <div>Attacker Attack HP (Firepower): <span className="text-orange-400 font-mono font-extrabold">{attAtkValue.toLocaleString()}</span></div>
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
                                      </>
                                    );
                                  })()}
                                </div>
                                <div>
                                  {(() => {
                                    const mDef: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                                    const mAtk: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                                    const defHpValue = Object.entries(report.defenderInitialTroops || {}).reduce((sum, [k, v]) => sum + (Number(v) || 0) * (mDef[k] || 10), 0);
                                    const defAtkValue = Object.entries(report.defenderInitialTroops || {}).reduce((sum, [k, v]) => sum + (Number(v) || 0) * (mAtk[k] || 10), 0);
                                    const totalDefInitial = Object.values(report.defenderInitialTroops || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                                    const totalDefLosses = Object.values(report.defenderLosses || {}).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0) as number;
                                    const defLossPercent = totalDefInitial > 0 ? ((totalDefLosses / totalDefInitial) * 100).toFixed(1) : '0.0';
                                    return (
                                      <>
                                        <p className="font-bold text-cyan-100 text-cyan-400 uppercase tracking-wide flex items-center justify-between">
                                          <span>STATION:{' '}
                                            <span 
                                              onClick={() => onViewPlayerProfile && onViewPlayerProfile(report.defenderId)}
                                              className="underline decoration-dotted cursor-pointer hover:text-cyan-300"
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
                                            <div>Defender HP (Defense Shields): <span className="text-cyan-400 font-mono font-extrabold">{defHpValue.toLocaleString()}</span></div>
                                            
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
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Points & Raid Score block */}
                              <div className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1.5 font-mono text-[10.5px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Raided Points (Resources Stolen / 1000):</span>
                                  <span className="font-bold text-emerald-400 font-mono font-extrabold">+{(raidScore / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Pts</span>
                                </div>
                                <div className="flex justify-between border-t border-[#1E293B]/60 pt-1.5">
                                  <span className="text-slate-400">Attack Points earned (defense force destroyed):</span>
                                  <span className="font-bold font-mono text-red-400">+{(report.defenceHpKilled || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Defense Points earned (attacker fleet destroyed):</span>
                                  <span className="font-bold font-mono text-cyan-400">+{(report.attackHpKilled || 0).toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Resources stolen details */}
                              {report.winner === 'attacker' && (() => {
                                const totalStolen = Object.values(report.resourcesStolen || {}).reduce<number>((sum, val: any) => sum + (val || 0), 0);
                                const raidPoints = totalStolen / 1000;
                                return (
                                  <div className="p-3 bg-emerald-950/5 border border-emerald-900/20 text-emerald-400 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                      <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">LOOT SALVAGED (CARGO CORES):</p>
                                      <span className="font-mono text-[10px] font-extrabold text-amber-400">⚡ +{raidPoints.toLocaleString()} Raided Points</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 text-center font-bold text-[9px] text-emerald-400">
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
                                      className="text-[9px] text-[#22D3EE] font-extrabold hover:text-white uppercase transition duration-150 border border-cyan-500/25 px-2 py-0.5 rounded cursor-pointer animate-pulse"
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
                                        <div className="space-y-1.5 text-slate-300 font-mono text-[10px] bg-black/40 p-2.5 rounded border border-white/5 leading-relaxed max-h-[160px] overflow-y-auto w-full text-left">
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            )}
          </div>

          {/* Collapsible Drop Down Box 2: Gathered Intelligence Reports */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <div 
              onClick={() => setIsIntelOpen(!isIntelOpen)}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-800/20 p-2 rounded-lg transition"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be]  flex items-center gap-2 font-mono" title="Recon logs and intelligence scanning database archive">
                <Radar size={16} className="text-cyan-455 text-cyan-400 animate-pulse" /> Gathered Intelligence Reports ({battleReports.filter(r => r.isRecon === true).length})
              </h3>
              <div className="flex items-center gap-1">
                {isIntelOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {isIntelOpen && (
              <div className="pt-2 border-t border-white/5 space-y-4">
                {battleReports.filter(r => r.isRecon === true).length === 0 ? (
                  <div className="py-10 border border-dashed border-[#1E293B] text-center rounded-xl">
                    <p className="text-xs text-slate-500 font-mono">No active intelligence reports logged in database.</p>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMarkAllRead) onMarkAllRead();
                        }}
                        className="py-1 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all text-[9.5px] uppercase tracking-wider cursor-pointer font-mono"
                      >
                        ✓ Mark All Intelligence Read
                      </button>
                    </div>

                    {battleReports.filter(r => r.isRecon === true).map((report) => {
                      const isExpanded = expandedIntelReports[report.id] || false;
                      const parsedTime = new Date(report.timestamp).toLocaleDateString();
                      const isRead = readReports[report.id] || false;

                      return (
                        <div key={report.id} className={`p-3 border rounded-xl space-y-2 transition-colors ${!isRead ? 'border-cyan-500/25 bg-[#061224]/50' : 'border-[#1E293B] bg-[#05070A]'}`}>
                          <div 
                            onClick={() => {
                              const nextExpanded = !isExpanded;
                              setExpandedIntelReports(prev => ({ ...prev, [report.id]: nextExpanded }));
                              if (nextExpanded && onMarkRead) {
                                onMarkRead(report.id);
                              }
                            }}
                            className="flex items-center justify-between cursor-pointer hover:bg-slate-900/40 p-1.5 rounded-lg transition"
                          >
                            <div className="flex flex-col gap-1 pr-4 text-left">
                              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                                {!isRead && (
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_5px_#22d3ee]" />
                                )}
                                🛰️ Scout Recon Scan of{' '}
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewPlayerProfile) onViewPlayerProfile(report.defenderId);
                                  }}
                                  className="text-cyan-400 underline decoration-dotted cursor-pointer hover:text-cyan-300"
                                >
                                  {report.defenderName}
                                </span>{' '}
                                [{report.defenderCoords.x}, {report.defenderCoords.y}]
                                <span className="text-slate-500 ml-1.5 font-normal">({parsedTime})</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="text-slate-404 text-slate-400 font-bold px-2 py-1 rounded border border-white/5 hover:text-white uppercase text-[9px] font-mono tracking-widest bg-slate-900 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="pt-3 border-t border-white/5 space-y-3.5 text-left">
                              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-white/5">
                                <span className="text-slate-500">{new Date(report.timestamp).toLocaleString()}</span>
                                <span className="font-bold tracking-wider uppercase px-2.5 py-0.5 rounded text-cyan-400 bg-cyan-950/20 border border-cyan-800/30">
                                  RECON INTEL COMPLETE
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-200 text-xs uppercase">
                                  TARGET SIGNATURE:{' '}
                                  <span 
                                    onClick={() => onViewPlayerProfile && onViewPlayerProfile(report.defenderId)}
                                    className="underline decoration-dotted cursor-pointer text-cyan-400 hover:text-cyan-300"
                                  >
                                    {report.defenderName}
                                  </span>{' '}
                                  <span className="text-slate-400 font-bold font-mono">[{report.defenderCoords.x}, {report.defenderCoords.y}]</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">Drone troops dispatched from Base Coordinate origin [{report.attackerCoords.x}, {report.attackerCoords.y}].</p>
                                {(() => {
                                  const defenderActive = report.defenderLastActive;
                                  if (!defenderActive) return null;
                                  const diffSec = Math.floor((Date.now() - defenderActive) / 1000);
                                  const isOnline = diffSec < 120;
                                  let statusStr = "ACTIVE";
                                  let statusColor = "text-emerald-400 font-bold";
                                  if (!isOnline) {
                                    statusColor = "text-amber-400 font-bold font-mono";
                                    if (diffSec < 3600) {
                                      const mins = Math.floor(diffSec / 60);
                                      statusStr = `LAST SEEN: ${mins} MINS AGO`;
                                    } else {
                                      const hrs = Math.floor(diffSec / 3600);
                                      statusStr = `LAST SEEN: ${hrs} HOURS AGO`;
                                    }
                                  }
                                  return (
                                    <div className="text-[11px] text-slate-400 font-sans mt-1.5 flex items-center gap-1.5">
                                      <span className="text-cyan-400 font-mono font-bold uppercase text-[9.5px]">Telemetry Activity:</span>
                                      <span className={statusColor}>{statusStr}</span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Target Garrison Combat Ratings / HP */}
                              {(() => {
                                const garrisonHp = calculateEnemyHp(report.defenderInitialTroops);
                                return (
                                  <div className="p-3 bg-red-950/10 border border-red-500/15 rounded-xl text-xs font-mono space-y-2">
                                    <div className="p-1.5 bg-[#05070A]/80 border border-blue-900/20 rounded flex items-center justify-between">
                                      <span className="text-slate-500 text-[10px] uppercase">Garrison HP / Shield Capacity</span>
                                      <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                                        🛡️ {garrisonHp.defenceHp.toLocaleString()} Structural HP / Shields
                                      </span>
                                    </div>
                                    <div className="p-1.5 bg-[#05070A]/80 border border-orange-900/20 rounded flex items-center justify-between">
                                      <span className="text-slate-500 text-[10px] uppercase">Garrison Attack Firepower</span>
                                      <span className="font-bold text-orange-400 text-xs flex items-center gap-1.5">
                                        ⚔️ {garrisonHp.attackHp.toLocaleString()} Attack HP
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Visual troops scanned block (using EXACT Names we see on command center) */}
                              <div className="p-3 bg-cyan-950/5 border border-cyan-900/20 rounded-xl space-y-2 font-mono text-[11px]">
                                <p className="font-bold text-[10px] text-cyan-400 uppercase tracking-wider">Detected Defending Force Garrison:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Interceptor</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.defender ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Assault Drone</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.attacker ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Disrupter</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.tank ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Matter Extractor</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.looter ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Missile Launcher</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.drone ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Settlement Ship</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.settlementShip ?? 0} units</span>
                                  </div>
                                </div>
                              </div>

                              {/* Buildings Dropdown collapsible (works like explore tab) */}
                              {(() => {
                                const reportBuildings = report.buildings || { fabricator: 1, commsHub: 1, radar: 1, repository: 1, researchCenter: 1, armyBase: 1, supplyNexus: 1 };
                                return (
                                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                                    <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 font-mono">🏢 Detected Buildings (Click to toggle details)</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                      {Object.entries({
                                        fabricator: 'Fabricator',
                                        commsHub: 'Communications Hub',
                                        radar: 'Radar Array',
                                        researchCenter: 'Research Center',
                                        armyBase: 'War Room',
                                        repository: 'Silo',
                                        supplyNexus: 'Supply Nexus'
                                      }).map(([bKey, bName]) => {
                                        const uniqueKey = `${report.id}-${bKey}`;
                                        const isBExpanded = expandedReportBuildings[uniqueKey] ?? false;
                                        const lvl = reportBuildings[bKey] || 1;
                                        const detailsText = {
                                          fabricator: 'Core modular orbital structural manufacturer and printer.',
                                          commsHub: 'Relay link coordinates encryption. Enables alliance parameters system logs.',
                                          radar: 'Thermal scan coordinates grid. Detects nearby hostile outpost targets.',
                                          researchCenter: 'Particle laboratories. Speeds up tactical tech upgrades and build velocities.',
                                          armyBase: 'Troops coordination chambers. Increases garrison slots and training speeds.',
                                          repository: 'Mineral Element vaults. Secures element stocks from planetary element looters.',
                                          supplyNexus: 'Transactional marketplace nexus. Coordinates transport speed multipliers.'
                                        }[bKey] || 'Advanced station building.';

                                        return (
                                          <div key={bKey} className="border border-white/5 bg-[#05070A] rounded-lg overflow-hidden">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedReportBuildings(prev => ({ ...prev, [uniqueKey]: !isBExpanded }));
                                              }}
                                              className="w-full p-2 flex items-center justify-between text-left hover:bg-white/[0.02]"
                                            >
                                              <span className="text-slate-350">{bName}</span>
                                              <div className="flex items-center gap-1.5 font-mono">
                                                <span className="text-cyan-400 font-bold">Lv {lvl}</span>
                                                {isBExpanded ? (
                                                  <ChevronUp size={11} className="text-red-400 block" />
                                                ) : (
                                                  <ChevronDown size={11} className="text-emerald-400 block" />
                                                )}
                                              </div>
                                            </button>
                                            {isBExpanded && (
                                              <div className="p-2 border-t border-white/5 bg-black/40 text-[9.5px] text-slate-400 leading-normal font-sans">
                                                {detailsText}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Extractors Dropdown collapsible (works like explore tab) */}
                              {(() => {
                                const reportMines = report.mines || { water: [1], plasma: [1], fuel: [1], food: [1], respirant: [1] };
                                const categories = {
                                  water: { name: 'Water', emoji: '💧' },
                                  plasma: { name: 'Plasma', emoji: '🔥' },
                                  fuel: { name: 'Fuel', emoji: '⚡' },
                                  food: { name: 'Food', emoji: '🌾' },
                                  respirant: { name: 'Respirant', emoji: '🌀' }
                                };
                                return (
                                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                                    <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 font-mono">⛏️ Detected Extractor Arrays (Click to toggle details)</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                      {Object.entries(categories).map(([mKey, cat]) => {
                                        const uniqueKey = `${report.id}-${mKey}`;
                                        const isMExpanded = expandedReportMines[uniqueKey] ?? false;
                                        const levels = reportMines[mKey as keyof typeof reportMines] || [1];
                                        const avgLvl = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) || 1;

                                        return (
                                          <div key={mKey} className="border border-white/5 bg-[#05070A] rounded-lg overflow-hidden">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedReportMines(prev => ({ ...prev, [uniqueKey]: !isMExpanded }));
                                              }}
                                              className="w-full p-2 flex items-center justify-between text-left hover:bg-white/[0.02]"
                                            >
                                              <span className="flex items-center gap-1.5">
                                                <span>{cat.emoji}</span>
                                                <span className="text-slate-350">{cat.name}</span>
                                              </span>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-slate-500 font-mono">({levels.length} detected &bull; Avg Lv {avgLvl})</span>
                                                {isMExpanded ? (
                                                  <ChevronUp size={11} className="text-red-400 block" />
                                                ) : (
                                                  <ChevronDown size={11} className="text-emerald-400 block" />
                                                )}
                                              </div>
                                            </button>
                                            {isMExpanded && (
                                              <div className="p-2 border-t border-white/5 bg-black/40 space-y-1.5 font-mono text-[9px]">
                                                <div className="grid grid-cols-2 gap-1 text-slate-300">
                                                  {levels.map((lvl: number, idx: number) => (
                                                    <div key={idx} className="bg-slate-900 border border-white/5 p-1 rounded flex justify-between">
                                                      <span className="text-slate-500 font-mono">Pump #{idx + 1}</span>
                                                      <span className="text-amber-400 font-bold">Lv {lvl}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
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

        </div>
      )}

      {subTab === 'fleets' && (
        <div className="space-y-1.5">
          {/* Section 1: Docking Bay / Stationed Troops */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4 text-left">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] inline-flex items-center gap-2">
              <Compass size={16} className="text-cyan-404 text-cyan-455 text-cyan-400 animate-pulse" /> DOCKING BAY & STATION GARRISONS
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Below are your colonized stations and idle vessels. Select an active station to move troops or launch tactical attacks to new coordinates.
            </p>

            <div className="space-y-4 pt-2">
              {player.planets.map(planet => {
                const isSelected = actionPlanetId === planet.id;
                const totalTroops = (Object.values(planet.troops) as number[]).reduce((a, b) => a + b, 0);

                return (
                  <div key={planet.id} className={`p-4 rounded-xl border transition-all ${isSelected ? 'border-cyan-500 bg-cyan-950/15' : 'border-[#1E293B] bg-[#05070A] hover:border-slate-700'}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          🪐 {planet.name} 
                          <span className="text-[10px] text-cyan-400 font-mono font-normal">[{planet.sectorX}, {planet.sectorY}]</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
                          Total Station Crews: <span className="font-bold text-slate-300 font-mono">{totalTroops} units</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActionPlanetId(isSelected && actionType === 'move' ? null : planet.id);
                            setActionType('move');
                            setCustomTroops({ ...planet.troops });
                            setCustomX(planet.sectorX.toString());
                            setCustomY(planet.sectorY.toString());
                            setCustomNumFleets(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                            isSelected && actionType === 'move'
                              ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                              : 'bg-slate-900 text-cyan-400 border-cyan-500/30 hover:bg-slate-850'
                          }`}
                        >
                          🚀 Move Troops
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionPlanetId(isSelected && actionType === 'attack' ? null : planet.id);
                            setActionType('attack');
                            setCustomTroops({ ...planet.troops });
                            setCustomX('');
                            setCustomY('');
                            setCustomNumFleets(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                            isSelected && actionType === 'attack'
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-slate-900 text-red-400 border-red-500/30 hover:bg-slate-850'
                          }`}
                        >
                          ⚔️ Attack Sector
                        </button>
                      </div>
                    </div>

                    {/* TROOPS INLINE LIST */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-4 text-[10px] bg-black/30 p-2.5 rounded-lg text-left">
                      {Object.entries(planet.troops).map(([tId, count]) => {
                        const nameLabel = 
                          tId === 'drone' ? 'Missile Launcher' : 
                          tId === 'defender' ? 'Interceptor' : 
                          tId === 'looter' ? 'Matter Extractor' : 
                          tId === 'tank' ? 'Disrupter' : 
                          tId === 'attacker' ? 'Assault Drone' : 
                          tId === 'settlementShip' ? 'Settlement Ship' : tId;
                        return (
                          <div key={tId} className="border border-white/5 bg-[#05070A]/50 p-1.5 rounded text-center">
                            <span className="text-slate-500 block leading-tight truncate">{nameLabel}</span>
                            <span className="font-extrabold text-slate-200 mt-1 block font-mono">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* ACTION PANEL */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-4">
                        <div className="flex items-center gap-1.5 text-xs text-cyan-404 text-cyan-400 uppercase tracking-widest font-black">
                          <span>{actionType === 'move' ? '🚀 CONFIGURE TROOP RELOCATION' : '⚔️ CONFIGURE OFFENSIVE COMBAT SQUAD'}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Left Column: Coordinates */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex flex-col bg-[#05070A] p-2.5 rounded-xl border border-[#1E293B]">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Target X Coord</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={customX}
                                  onChange={(e) => setCustomX(e.target.value)}
                                  className="bg-transparent border-none focus:outline-none text-white text-sm font-bold font-mono mt-1 w-full"
                                />
                              </div>
                              <div className="flex flex-col bg-[#05070A] p-2.5 rounded-xl border border-[#1E293B]">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Target Y Coord</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={customY}
                                  onChange={(e) => setCustomY(e.target.value)}
                                  className="bg-transparent border-none focus:outline-none text-white text-sm font-bold font-mono mt-1 w-full"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col bg-[#05070A] p-2.5 rounded-xl border border-[#1E293B] text-xs">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Fleet Squad Division:</span>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setCustomNumFleets(1)}
                                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
                                    customNumFleets <= 1
                                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                      : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Single Fleet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCustomNumFleets(2)}
                                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
                                    customNumFleets > 1
                                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                      : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Multiple Fleets
                                </button>
                              </div>

                              {customNumFleets > 1 && (
                                <div className="flex items-center justify-between mt-3 bg-black/40 p-2 rounded-lg">
                                  <span className="text-[10px] text-slate-400">Total Divisions:</span>
                                  <select
                                    value={customNumFleets}
                                    onChange={(e) => setCustomNumFleets(parseInt(e.target.value, 10))}
                                    className="bg-slate-900 text-cyan-300 font-mono py-0.5 px-2 text-xs rounded border border-slate-700 focus:outline-none cursor-pointer"
                                    id="customize-multi-fleets-select"
                                  >
                                    {[2, 3, 4, 5].map(n => (
                                      <option key={n} value={n}>{n} Squads</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Allocate Forces counts */}
                          <div className="space-y-2 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allocate Units:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(planet.troops).map(([tId, count]) => {
                                const nameLabel = 
                                  tId === 'drone' ? 'Missile Launcher' : 
                                  tId === 'defender' ? 'Interceptor' : 
                                  tId === 'looter' ? 'Matter Extractor' : 
                                  tId === 'tank' ? 'Disrupter' : 
                                  tId === 'attacker' ? 'Assault Drone' : 
                                  tId === 'settlementShip' ? 'Settlement Ship' : tId;
                                const avail = count as number;
                                return (
                                  <div key={tId} className="flex items-center justify-between p-1.5 bg-[#05070A]/80 border border-[#1E293B]/40 hover:border-cyan-500/20 rounded-lg transition-colors">
                                    <div className="min-w-0 pr-1">
                                      <span className="font-bold text-slate-200 block truncate text-[10.5px]" title={nameLabel}>{nameLabel}</span>
                                      <span className="text-[8.5px] text-slate-500 font-bold block">In-Hangar: <strong className="text-cyan-400 font-extrabold">{avail}</strong></span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 shrink-0 bg-slate-950/40 p-0.5 rounded-lg border border-[#1E293B]/40">
                                      <button
                                        type="button"
                                        onClick={() => setCustomTroops(prev => ({ ...prev, [tId]: 0 }))}
                                        className="px-1.5 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] font-bold text-slate-300 rounded"
                                      >
                                        Min
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max={avail}
                                        value={customTroops[tId] === 0 ? '' : customTroops[tId] || 0}
                                        placeholder="0"
                                        onChange={(e) => {
                                          const val = Math.min(avail, Math.max(0, parseInt(e.target.value, 10) || 0));
                                          setCustomTroops(prev => ({ ...prev, [tId]: val }));
                                        }}
                                        className="w-14 text-center bg-[#05070A] border border-[#1E293B]/30 rounded font-mono text-[10px] text-white py-0.5 focus:outline-none focus:border-cyan-500 font-extrabold"
                                      />
                                      <button
                                        type="button"
                                        disabled={avail === 0}
                                        onClick={() => setCustomTroops(prev => ({ ...prev, [tId]: avail }))}
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
                        </div>

                        {/* Selected Squad combat statistics */}
                        {(() => {
                          const defMap: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                          const atkMap: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                          let totalSelectedDefHp = 0;
                          let totalSelectedAtkHp = 0;
                          Object.entries(customTroops || {}).forEach(([k, v]) => {
                            const count = Number(v) || 0;
                            totalSelectedDefHp += count * (defMap[k] || 0);
                            totalSelectedAtkHp += count * (atkMap[k] || 0);
                          });

                          return (
                            <div className="p-3 bg-[#0A0F1D]/80 border border-slate-800/40 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-mono text-[10.5px]">
                              <span className="text-slate-400 font-sans">Selected Payload Strength:</span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <span className="text-blue-400 font-bold flex items-center gap-1.5" title="Defensive Shields (Defense HP)">
                                  🛡️ {totalSelectedDefHp.toLocaleString()} DEF
                                </span>
                                <span className="text-orange-400 font-bold flex items-center gap-1.5" title="Strike Firepower (Attack HP)">
                                  ⚔️ {totalSelectedAtkHp.toLocaleString()} ATK
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const xVal = parseInt(customX, 10);
                              const yVal = parseInt(customY, 10);
                              if (isNaN(xVal) || isNaN(yVal) || xVal < 0 || xVal > maxCoord || yVal < 0 || yVal > maxCoord) {
                                if (showToast) showToast(`Coordinates must be inside grid 0 to ${maxCoord}`, 'error');
                                return;
                              }

                              const hasAnyAllocated = (Object.values(customTroops) as number[]).some(v => v > 0);
                              if (!hasAnyAllocated) {
                                if (showToast) showToast('Garrison allocation cannot be empty!', 'error');
                                return;
                              }

                              let mType: 'attack' | 'colonize' | 'recon' | 'move' = 'attack';
                              if (actionType === 'move') {
                                mType = ((customTroops.settlementShip as number) || 0) > 0 ? 'colonize' : 'move';
                              } else {
                                mType = 'attack';
                              }

                              onSendFleet({
                                targetX: xVal,
                                targetY: yVal,
                                missionType: mType,
                                troops: customTroops,
                                targetName: `Sector [${xVal}, ${yVal}]`,
                                numFleets: customNumFleets,
                                planetId: planet.id
                              });

                              setActionPlanetId(null);
                              setActionType(null);
                            }}
                            disabled={isUpgrading}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black tracking-widest text-[11px] uppercase rounded-xl transition duration-150 hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            🚀 CONFIRM & DISPATCH Tactical {customNumFleets > 1 ? `${customNumFleets} Fleets` : 'Fleet'} Units
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Active / Flight Transmissions & Re-routing! */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4 text-left">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] inline-flex items-center gap-2">
              <Radar size={16} className="text-cyan-404 text-cyan-455 text-cyan-400 animate-spin" /> ACTIVE IN-FLIGHT FLEETS DIRECTORY ({fleets.filter(f => f.senderId === player.id).length})
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Real-time radar telemetry of your en-route tactical squadrons. Highlighted en-route flights can be dynamically re-routed to move to a different station or attack a different sector!
            </p>

            <div className="space-y-4 pt-2">
              {fleets.filter(f => f.senderId === player.id).length === 0 ? (
                <div className="py-10 border border-dashed border-[#1E293B] text-center rounded-xl bg-black/25">
                  <p className="text-xs text-slate-500 font-mono">No active fleet squadrons currently registered in deep-space flight paths.</p>
                </div>
              ) : (
                fleets.filter(f => f.senderId === player.id).map((fleet) => {
                  const isRerouting = reroutingFleetId === fleet.id;
                  const etaSec = Math.max(0, Math.round((fleet.arrivesAt - serverTime) / 1000));

                  return (
                    <div key={fleet.id} className="p-4 rounded-xl border border-[#1E293B] bg-[#05070A] space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-widest font-extrabold uppercase ${
                              fleet.missionType === 'attack' ? 'bg-red-950/20 text-red-400 border border-red-500/10' :
                              fleet.missionType === 'colonize' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10' :
                              'bg-cyan-950/20 text-cyan-400 border border-cyan-500/10'
                            }`}>
                              {fleet.missionType} Model {fleet.isReturning ? '(RETURNING)' : ''}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold font-mono">ID: {fleet.id.substring(0, 8)}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5 flex flex-wrap gap-x-2 items-center">
                            <span>Sector Origin [{fleet.senderCoords.x}, {fleet.senderCoords.y}]</span>
                            <span className="text-cyan-500 select-none font-sans font-normal">&rarr;</span>
                            <span className="text-cyan-400">{fleet.targetName} [{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span>
                          </h4>
                          {etaSec > 0 ? (
                            <p className="text-[11px] text-amber-400 font-mono mt-1.5 font-bold animate-pulse">
                              📡 Telemetry ETA: {etaSec}s of flight
                            </p>
                          ) : (
                            <p className="text-[11px] text-emerald-400 font-mono mt-1.5 font-bold">
                              🛰️ ARRIVING AT DESTINATION PORTALS
                            </p>
                          )}
                        </div>

                        {!fleet.isReturning && onRerouteFleet && (
                          <button
                            type="button"
                            onClick={() => {
                              setReroutingFleetId(isRerouting ? null : fleet.id);
                              setRerouteX(fleet.targetCoords.x.toString());
                              setRerouteY(fleet.targetCoords.y.toString());
                              setRerouteType(fleet.missionType);
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition cursor-pointer shrink-0 ${
                              isRerouting
                                ? 'bg-amber-600 text-slate-950 border-amber-600 font-bold'
                                : 'bg-slate-900 text-amber-500 border-amber-500/20 hover:bg-slate-850'
                            }`}
                          >
                            🔄 Re-Route Squadron
                          </button>
                        )}
                      </div>

                      {/* FLIGHT TROOPS ALLOC */}
                      <div className="flex flex-wrap gap-1.5 text-[9px] bg-black/25 p-2 rounded border border-white/5 font-mono">
                        <span className="text-slate-500 pr-1.5 uppercase font-bold text-[8.5px]">Assets:</span>
                        {Object.entries(fleet.troops).filter(([_, qty]) => (qty as number) > 0).map(([tId, count]) => {
                          const nameLabel = 
                            tId === 'drone' ? 'Missile Launcher' : 
                            tId === 'defender' ? 'Interceptor' : 
                            tId === 'looter' ? 'Matter Extractor' : 
                            tId === 'tank' ? 'Disrupter' : 
                            tId === 'attacker' ? 'Assault Drone' : 
                            tId === 'settlementShip' ? 'Settlement Ship' : tId;
                          return (
                            <span key={tId} className="bg-[#111827] text-slate-300 px-2 py-0.5 rounded border border-white/5">
                              {nameLabel}: <strong className="text-cyan-400">{count}</strong>
                            </span>
                          );
                        })}
                      </div>

                      {/* Display loot carried if returning / has resources */}
                      {fleet.lootCarried && Object.values(fleet.lootCarried).some(v => Number(v) > 0) && (
                        <div className="text-[10px] bg-emerald-950/10 border border-emerald-500/15 p-2 rounded-lg leading-normal font-mono text-emerald-400 flex flex-wrap gap-x-3 items-center">
                          <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold font-sans">📦 Returning Cargo Load:</span>
                          {Object.entries(fleet.lootCarried).filter(([_, qty]) => Number(qty) > 0).map(([res, qty]) => (
                            <span key={res} className="font-bold">
                              {qty.toLocaleString()} <span className="text-[8.5px] text-emerald-600 font-normal uppercase">{res}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* INLINE REROUTING INPUT FORM PANEL */}
                      {isRerouting && (
                        <div className="p-3.5 border border-amber-500/20 bg-[#0E121E] rounded-xl space-y-3 animate-fade-in text-left">
                          <div className="flex items-center gap-1.5 text-[10.5px] text-amber-400 tracking-widest font-black">
                            <span>🔄 REDEFINE FLIGHT INTER-COORDINATES SYSTEM</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="flex flex-col bg-[#05070A] p-2 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">New Target X</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={rerouteX}
                                onChange={(e) => setRerouteX(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-white font-mono text-xs font-bold mt-1"
                              />
                            </div>
                            <div className="flex flex-col bg-[#05070A] p-2 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">New Target Y</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={rerouteY}
                                onChange={(e) => setRerouteY(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-white font-mono text-xs font-bold mt-1"
                              />
                            </div>
                            <div className="flex flex-col bg-[#05070A] p-2 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Mission Objective</span>
                              <select
                                value={rerouteType}
                                onChange={(e) => setRerouteType(e.target.value as any)}
                                className="bg-transparent border-none focus:outline-none text-cyan-400 text-xs font-bold mt-1 cursor-pointer"
                                id="rerouting-mission-type-select"
                              >
                                <option value="move" className="bg-[#05070A] text-slate-300">Move Relocation</option>
                                <option value="attack" className="bg-[#05070A] text-slate-300">Offensive Attack</option>
                                <option value="colonize" className="bg-[#05070A] text-slate-300">Colony Settle</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const rx = parseInt(rerouteX, 10);
                                const ry = parseInt(rerouteY, 10);
                                if (isNaN(rx) || isNaN(ry) || rx < 0 || rx > maxCoord || ry < 0 || ry > maxCoord) {
                                  if (showToast) showToast(`Telemetry coordinate must be inside grid boundary 0-${maxCoord}`, 'error');
                                  return;
                                }

                                if (onRerouteFleet) {
                                  onRerouteFleet(fleet.id, rx, ry, rerouteType);
                                }
                                setReroutingFleetId(null);
                              }}
                              className="flex-1 py-1 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-[10px] uppercase rounded-lg tracking-wider transition hover:brightness-110 cursor-pointer"
                            >
                              🚀 CONFIRM CO-ORDINATES RE-ROUTE
                            </button>
                            <button
                              type="button"
                              onClick={() => setReroutingFleetId(null)}
                              className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white transition text-[10px] uppercase font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH SPACE FLEET DRAWER MODAL - STYLED ELEGANT DARK */}
      {selectedTarget && (() => {
        const hasDrone = (fleetTroops.drone || 0) >= 1;
        const hasCombat = (fleetTroops.attacker || 0) >= 1 || (fleetTroops.tank || 0) >= 1 || (fleetTroops.looter || 0) >= 1 || (fleetTroops.defender || 0) >= 1;
        const hasSettlement = (fleetTroops.settlementShip || 0) >= 1;

        const selectedRf = selectedReserveFleetId !== 'manual' ? createdFleets.find(f => f.id === selectedReserveFleetId) : null;
        const isMissionReady = selectedReserveFleetId !== 'manual' 
          ? (selectedRf ? !selectedRf.isTraveling : false)
          : (hasDrone || hasCombat || hasSettlement);

        let inferredType: 'attack' | 'colonize' | 'recon' | 'move' = 'move';
        if (selectedReserveFleetId !== 'manual') {
          const rf = createdFleets.find(f => f.id === selectedReserveFleetId);
          if (rf) {
            const rfHasSettlement = (rf.troops.settlementShip || 0) >= 1;
            const rfHasCombat = (rf.troops.attacker || 0) >= 1 || (rf.troops.tank || 0) >= 1 || (rf.troops.looter || 0) >= 1 || (rf.troops.defender || 0) >= 1;
            if (rfHasSettlement) inferredType = 'colonize';
            else if (rfHasCombat) inferredType = 'attack';
          }
        } else {
          if (hasSettlement) {
            inferredType = 'colonize';
          } else if (hasCombat) {
            inferredType = 'attack';
          } else if (hasDrone) {
            inferredType = 'move';
          }
        }

        const activeTanks = selectedReserveFleetId !== 'manual'
          ? (createdFleets.find(f => f.id === selectedReserveFleetId)?.troops.tank || 0)
          : (fleetTroops.tank || 0);

        return (
          <div className="fixed inset-0 bg-[#05070A]/95 backdrop-blur-md z-50 overflow-y-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-[#090D1A] border border-cyan-500/35 rounded-2xl p-6 md:p-8 font-mono shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-fade-in text-left my-auto space-y-5 flex flex-col">
              <div className="flex justify-between items-start pb-2.5 border-b border-[#1E293B]/60 shrink-0 mb-4">
                <div>
                  <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest bg-cyan-950/25 border border-cyan-500/25 px-2.5 py-1 rounded-lg">FLEET DEPLOYMENT TRANSMISSION</span>
                  <h3 className="text-lg font-bold text-white mt-2 tracking-tight">{selectedTarget.planetName}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Sector Coordinates: [{selectedTarget.coords.x}, {selectedTarget.coords.y}] &bull; Commander:{' '}
                    {selectedTarget.id !== 'habitable' && selectedTarget.id !== player.id ? (
                      <span 
                        onClick={() => {
                          setSelectedTarget(null);
                          if (onViewPlayerProfile) onViewPlayerProfile(selectedTarget.id);
                        }}
                        className="underline decoration-dotted font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        title="View Commander profile to send private message"
                      >
                        {selectedTarget.username} 💬
                      </span>
                    ) : (
                      <span className="text-slate-350 font-bold">{selectedTarget.username}</span>
                    )}
                  </p>
                  
                  {/* Small Fast Attack Auto-Allocation Option under sector coordinates */}
                  {selectedTarget.id !== player.id && !selectedTarget.isHabitable && selectedReserveFleetId === 'manual' && (
                    <div className="mt-2 flex items-center gap-1.5 text-[9.5px] border border-cyan-500/20 bg-cyan-950/20 px-2 py-1 rounded">
                      <span className="text-red-400 animate-pulse font-bold">⚡ QUICK ACTION:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const fastTroops = {
                            defender: activePlanet.troops.defender || 0,
                            attacker: activePlanet.troops.attacker || 0,
                            tank: activePlanet.troops.tank || 0,
                            looter: activePlanet.troops.looter || 0,
                            drone: activePlanet.troops.drone || 0,
                            settlementShip: 0
                          };
                          setFleetTroops(fastTroops);
                          setFleetType('attack');
                          if (showToast) showToast('Auto-loaded combat squads for strike trajectory!', 'success');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 underline font-bold transition text-left cursor-pointer"
                      >
                        Load All Docked Combat Interceptors/Drones Immediately
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedTarget(null)}
                  className="text-slate-400 hover:text-white font-sans text-2xl cursor-pointer leading-none p-1 transition shrink-0"
                >
                  &times;
                </button>
              </div>

              {/* Scrollable Content Container (Overflow disabled, scrolled via fullscreen overlay) */}
              <div className="space-y-4">
                
                {/* RESERVE FLEET DEPLOYMENT OPTION */}
                {(() => {
                  const planetReserves = createdFleets.filter(f => f.planetId === activePlanet.id);
                  return (
                    <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Reserve Fleet Selection</span>
                        <span className="text-[8.5px] text-slate-500 font-mono">Reserves Available: {planetReserves.length}</span>
                      </div>
                      
                      {planetReserves.length === 0 ? (
                        <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                          No pre-constructed reserve fleets docked on this station. To prepare reserve fleets, visit the <span className="text-cyan-400 font-bold">War Room (CMD Tab)</span> where you can build, name, and manage subsidiaries of duplicate fleets.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={selectedReserveFleetId}
                            onChange={(e) => {
                              setSelectedReserveFleetId(e.target.value);
                              if (e.target.value !== 'manual') {
                                setDispatchMode('single'); // Locked to single for pre-constructed squads
                              }
                            }}
                            className="w-full bg-[#05070A] text-xs font-mono font-bold py-2 px-3 rounded-xl border border-cyan-500/30 hover:border-cyan-400 text-white cursor-pointer focus:outline-none"
                          >
                            <option value="manual">🛠️ Compose New Custom Fleet (Manual)</option>
                            {planetReserves.map(rf => (
                              <option key={rf.id} value={rf.id} className="bg-[#05070A] text-white">
                                🚀 {rf.name} ({rf.subsidiary}){rf.isTraveling ? ' ⚠️ [IN FLIGHT]' : ''}
                              </option>
                            ))}
                          </select>

                          {selectedReserveFleetId !== 'manual' && (() => {
                            const selectedFleet = planetReserves.find(f => f.id === selectedReserveFleetId);
                            if (!selectedFleet) return null;
                            return (
                              <div className="space-y-2">
                                {selectedFleet.isTraveling && (
                                  <div className="p-2.5 bg-amber-950/20 border border-amber-500/35 rounded-lg text-left text-[9.5px] font-mono text-amber-400 leading-normal animate-pulse">
                                    ⚠️ <strong>IN SPACE TRANSIT:</strong> This squadron is currently on mission orders and is not docked. It will automatically dock and become ready for flight upon returning to base.
                                  </div>
                                )}
                                <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg text-left font-mono text-[9.5px] space-y-1.5">
                                  <p className="font-bold text-cyan-400 uppercase">Pre-Loaded Fleet Components:</p>
                                <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                                  {Object.entries(selectedFleet.troops).map(([tId, count]) => {
                                    const qty = Number(count) || 0;
                                    if (qty <= 0) return null;
                                    const label = 
                                      tId === 'drone' ? 'Missile Launcher' : 
                                      tId === 'defender' ? 'Interceptor' : 
                                      tId === 'looter' ? 'Matter Extractor' : 
                                      tId === 'tank' ? 'Disrupter' : 
                                      tId === 'settlementShip' ? 'Settlement Ship' :
                                      'Assault Drone';
                                    return (
                                      <div key={tId} className="flex justify-between">
                                        <span>{label}:</span>
                                        <span className="font-bold text-white">{qty}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedReserveFleetId === 'manual' && (
                  <div className="space-y-3">
                    {/* Troop counts allocation panel - 2 COLUMNS */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allocate Base Fleets & Crew:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        {['defender', 'attacker', 'tank', 'looter', 'drone', 'settlementShip'].map((tId) => {
                          const count = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                          
                          const dispatchLabel = 
                            tId === 'drone' ? 'Missile Launcher' : 
                            tId === 'defender' ? 'Interceptor' : 
                            tId === 'looter' ? 'Matter Extractor' : 
                            tId === 'tank' ? 'Disrupter' : 
                            tId === 'settlementShip' ? 'Settlement Ship' :
                            'Assault Drone';
                            
                          const icon = 
                            tId === 'drone' ? '🛰️' :
                            tId === 'defender' ? '🛡️' :
                            tId === 'looter' ? '🛸' :
                            tId === 'tank' ? '🤖' :
                            tId === 'settlementShip' ? '🚀' :
                            '⚔️';
                          
                          return (
                            <div key={tId} className="p-1.5 border border-[#1E293B] bg-[#05070A]/85 rounded-xl flex items-center justify-between gap-1.5 text-[11px] font-mono">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-200 flex items-center gap-1">
                                  <span>{icon}</span>
                                  <span className="truncate text-[10.5px]">{dispatchLabel}</span>
                                </span>
                                <p className="text-[9px] text-slate-500 mt-0.5">Aval: <strong className="text-cyan-400">{count}</strong></p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 bg-slate-950/40 p-0.5 rounded-lg border border-[#1E293B]/40">
                                <button 
                                  type="button"
                                  onClick={() => setFleetTroops(prev => ({ ...prev, [tId]: 0 }))}
                                  className="px-1.5 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] text-slate-300 font-mono rounded font-bold"
                                >
                                  Min
                                </button>
                                <input 
                                  type="number"
                                  min={0}
                                  max={count}
                                  value={fleetTroops[tId] === 0 ? '' : fleetTroops[tId]}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = Math.min(count, Math.max(0, parseInt(e.target.value, 10) || 0));
                                    setFleetTroops(prev => ({ ...prev, [tId]: val }));
                                  }}
                                  className="w-14 text-center bg-[#05070A] border border-[#1E293B]/30 rounded font-mono text-[10px] text-white py-0.5 focus:outline-none focus:border-cyan-500 font-extrabold"
                                />
                                <button 
                                  type="button"
                                  disabled={count === 0}
                                  onClick={() => setFleetTroops(prev => ({ ...prev, [tId]: count }))}
                                  className="px-1.5 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] text-cyan-400 font-mono rounded disabled:opacity-30 font-bold"
                                >
                                  Max
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Mission Options - SOLE CHOICE IS SINGLE FLEET OR MULTIPLE FLEETS */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet Creation Strategy:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Create Single Fleet */}
                        <button 
                          type="button"
                          onClick={() => setDispatchMode('single')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer ${
                            dispatchMode === 'single'
                              ? 'border-cyan-500 bg-cyan-950/35 text-cyan-300 font-bold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                              : 'border-[#1E293B] bg-[#05070A] text-slate-400 hover:border-cyan-500/30 hover:text-slate-250'
                          }`}
                        >
                          <span className="text-base">🚀</span>
                          <span className="text-[10px] font-bold uppercase mt-1">Create a Fleet</span>
                          <span className="text-[8px] text-cyan-405 mt-0.5 font-mono">Single Squadron</span>
                        </button>

                        {/* Create Multiple Fleets */}
                        <button 
                          type="button"
                          onClick={() => setDispatchMode('multiple')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer ${
                            dispatchMode === 'multiple'
                              ? 'border-cyan-500 bg-cyan-950/35 text-cyan-300 font-bold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                              : 'border-[#1E293B] bg-[#05070A] text-slate-400 hover:border-cyan-500/30 hover:text-slate-250'
                          }`}
                        >
                          <span className="text-base">🛸🛸</span>
                          <span className="text-[10px] font-bold uppercase mt-1">Multiple Fleets</span>
                          <span className="text-[8px] text-cyan-405 mt-0.5 font-mono">Separate Divisions</span>
                        </button>
                      </div>

                      {dispatchMode === 'multiple' && (
                        <div className="p-2 border border-cyan-800/25 bg-[#050810] rounded-xl flex items-center justify-between mt-1 text-xs">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Division divisions count:</span>
                          <select
                            value={dispatchNumFleets}
                            onChange={(e) => setDispatchNumFleets(parseInt(e.target.value, 10))}
                            className="bg-slate-900 border border-slate-700 text-cyan-400 text-[11px] font-mono py-0.5 px-2 rounded cursor-pointer"
                            id="drawer-multi-fleets-select"
                          >
                            {[2, 3, 4, 5].map(n => (
                              <option key={n} value={n} className="bg-slate-950 text-slate-350">{n} Squads</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Disrupter Demolition Targeting configuration */}
                {activeTanks > 0 && (
                  <div className="p-3 border border-amber-600/35 bg-[#0C0F1A] rounded-xl space-y-2 mt-2 z-10 relative">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
                      <span className="text-xs">💣</span>
                      <span>Disrupter Demolition Target</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-sans leading-relaxed">
                      Choose which structural system or extraction mine this Disrupter should prioritize to sabotage and degrade in level upon successful deployment.
                    </p>
                    <select
                      value={targetBuilding}
                      onChange={(e) => setTargetBuilding(e.target.value)}
                      className="w-full bg-[#05070A] text-xs text-amber-400 font-mono font-bold py-1.5 px-3 rounded-lg border border-amber-500/20 focus:border-amber-500 focus:outline-[#f59e0b] cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/40 transition"
                      id="bomber-tank-target-select"
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
              </div>

              {/* Calculations and predictions */}
              <div className="p-2.5 rounded-xl bg-[#05070A] border border-[#1E293B] text-[10px] text-slate-400 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Flight Trajectory Distance:</span>
                  <span className="font-bold text-white text-right">
                    {Math.hypot(selectedTarget.coords.x - activePlanet.sectorX, selectedTarget.coords.y - activePlanet.sectorY).toFixed(1)} parsecs
                    <span className="block text-[9px] text-amber-500 font-bold uppercase tracking-tight">
                      {(Math.hypot(selectedTarget.coords.x - activePlanet.sectorX, selectedTarget.coords.y - activePlanet.sectorY) * 1.917).toFixed(1)} Space Miles
                    </span>
                  </span>
                </div>
                <div className="flex justify-between flex-wrap">
                  <span>Inferred Mission Type:</span>
                  <span className={`font-bold uppercase tracking-wide text-cyan-400`}>
                    {inferredType === 'move' ? 'MOVE / RELOCATION TRANSIT' : inferredType === 'attack' ? 'OFFENSIVE COMBAT ASSAULT' : 'DECOY PLANET OUTPOST SETTLEMENT'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-cyan-950/10 border border-cyan-500/10 p-2 rounded-xl mt-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Mission Directive Flight Path:</span>
                  <select
                    value={fleetType}
                    onChange={(e) => setFleetType(e.target.value as any)}
                    className="bg-[#05070A] border border-cyan-800/40 text-cyan-400 text-xs font-mono py-1 px-2.5 rounded-lg focus:outline-none cursor-pointer font-bold"
                    id="drawer-mission-directive-flight-select"
                  >
                    <option value="move" className="text-slate-300">🛸 Move Relocation (Standard)</option>
                    <option value="timed_move" className="text-slate-300">⏱️ Launch Timed Move (24h Window)</option>
                    <option value="attack" className="text-slate-300">⚔️ Attack Station (Standard)</option>
                    <option value="timed_attack" className="text-slate-300">⏱️ Launch Timed Attack (24h Window)</option>
                    <option value="colonize" className="text-slate-300">🚀 Settle Colony</option>
                  </select>
                </div>
                {(() => {
                  const distance = Math.hypot(selectedTarget.coords.x - activePlanet.sectorX, selectedTarget.coords.y - activePlanet.sectorY);

                  let troopSpeedLevel = 1;
                  try {
                    const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
                    const savedTech = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
                    troopSpeedLevel = savedTech ? (JSON.parse(savedTech).troop_speed ?? (isFirstPlanet ? 20 : 0)) : (isFirstPlanet ? 20 : 0);
                  } catch (err) {
                    // ignore
                  }

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

                  const selectedTroops = selectedReserveFleetId !== 'manual'
                    ? (() => {
                        const rf = createdFleets.find(f => f.id === selectedReserveFleetId);
                        return rf ? Object.entries(rf.troops).filter(([_, qty]) => (Number(qty) || 0) > 0) : [];
                      })()
                    : Object.entries(fleetTroops).filter(([_, qty]) => (Number(qty) || 0) > 0);

                  const slowestTroopSpeed = selectedTroops.length > 0
                    ? (selectedTroops.reduce((slowest, [tId, _]) => {
                        const sp = speedMap[tId] || 5;
                        return sp < slowest ? sp : slowest;
                      }, 100)) * speedMultiplier
                    : 100;

                  const travelTimeMs = slowestTroopSpeed > 0 ? Math.round((distance / slowestTroopSpeed) * 60000) : 0;
                  const travelSeconds = Math.floor(travelTimeMs / 1000);
                  const hours = Math.floor(travelSeconds / 3600);
                  const minutes = Math.floor((travelSeconds % 3600) / 60);
                  const seconds = travelSeconds % 60;

                  const timeStr = [
                    hours.toString().padStart(2, '0'),
                    minutes.toString().padStart(2, '0'),
                    seconds.toString().padStart(2, '0')
                  ].join(':');

                  return (
                    <>
                      <div className="flex justify-between items-center border-t border-[#1E293B]/60 pt-1.5 mt-1 text-[10px]">
                        <span>Estimated Flight Duration:</span>
                        <span className="font-bold text-amber-400 text-right text-xs">
                          ⏱️ {timeStr}
                          <span className="block text-[8px] text-slate-500 font-mono tracking-normal">
                            (Slowest unit: {selectedTroops.length > 0 ? (TROOP_NAME_MAPPING[selectedTroops.reduce((minT, [tId, _]) => {
                              const minSp = speedMap[minT] || 5;
                              const currSp = speedMap[tId] || 5;
                              return currSp < minSp ? tId : minT;
                            }, selectedTroops[0][0])] || 'N/A') : 'None'})
                          </span>
                        </span>
                      </div>

                      {(fleetType === 'timed_move' || fleetType === 'timed_attack') && (() => {
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

                        const selectedMs = timedLandingTime ? new Date(timedLandingTime).getTime() : 0;
                        const isLandingValid = selectedMs >= minVal - 5000 && selectedMs <= maxVal + 60000;

                        return (
                          <div className="bg-amber-950/10 border border-amber-500/20 p-3 rounded-xl mt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1">
                                ⏱️ Coordinate Landing Time
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono">Max 24h Window</span>
                            </div>
                            <input
                              type="datetime-local"
                              value={timedLandingTime}
                              min={minStr}
                              max={maxStr}
                              onChange={(e) => setTimedLandingTime(e.target.value)}
                              className="w-full bg-[#05070A] border border-amber-500/30 text-amber-400 text-xs font-mono py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-amber-400 cursor-pointer font-bold"
                            />
                            <div className="text-[9px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Normal travel landing:</span>
                                <span className="font-mono text-slate-300">{new Date(minVal).toLocaleTimeString()}</span>
                              </div>
                              {isLandingValid ? (
                                <div className="flex justify-between text-emerald-400 font-bold">
                                  <span>Timed arrival delay:</span>
                                  <span>+{Math.round((selectedMs - minVal) / 60000)} min</span>
                                </div>
                              ) : (
                                <div className="text-red-400 font-bold text-[9px]">
                                  {selectedMs < minVal ? "Error: Target is sooner than travel time." : "Error: Target exceeds 24 hour limits."}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
                {(() => {
                  const stats = selectedReserveFleetId !== 'manual'
                    ? calculateEnemyHp(createdFleets.find(f => f.id === selectedReserveFleetId)?.troops || {})
                    : calculateEnemyHp(fleetTroops);

                  return (
                    <div className="space-y-1.5 mt-1 border-t border-[#1E293B]/60 pt-2 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-sans">Launch Fleet Defense:</span>
                        <span className="font-bold text-blue-400 text-right text-xs">
                          🛡️ {stats.defenceHp.toLocaleString()} DEF HP
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-450 font-sans">Launch Fleet Attack:</span>
                        <span className="font-bold text-orange-400 text-right text-xs">
                          ⚔️ {stats.attackHp.toLocaleString()} ATK HP
                        </span>
                      </div>
                    </div>
                  );
                })()}
                {dispatchMode === 'multiple' && selectedReserveFleetId === 'manual' && (
                  <div className="text-[9px] text-amber-400 font-mono italic">
                    Allocated forces will be divided evenly across {dispatchNumFleets} separate tactical squadrons to execute simultaneous tasks.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleLaunchFleet}
                  disabled={!isMissionReady || isLaunchingReserve || isUpgrading}
                  className={`flex-1 px-5 py-3 text-[10px] uppercase font-black tracking-widest text-[#05070A] rounded-xl flex items-center justify-center gap-2 transition-all duration-155 ${
                    isMissionReady && !isLaunchingReserve && !isUpgrading
                      ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] font-bold'
                      : 'bg-slate-800 border border-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Zap size={11} fill="currentColor" /> 
                  {isLaunchingReserve ? 'LAUNCHING RESERVE FLEET...' : (isMissionReady 
                    ? `LAUNCH ${selectedReserveFleetId !== 'manual' ? 'RESERVE FLEET' : (dispatchMode === 'multiple' ? `${dispatchNumFleets} SEPARATE FLEET` : 'SINGLE FLEET')} MISSIONS` 
                    : 'ALLOCATE TROOPS FROM DOCKING BAY ABOVE')}
                </button>

                {selectedReserveFleetId === 'manual' && (
                  <button
                    type="button"
                    onClick={async () => {
                      let totalInFleet = 0;
                      Object.values(fleetTroops).forEach(qty => { totalInFleet += Number(qty) || 0; });
                      if (totalInFleet === 0) {
                        alert("Must allocate at least 1 spacecraft to create a reserve fleet!");
                        return;
                      }

                      const changes: Record<string, number> = {};
                      let isInsufficient = false;
                      let missingInfo = '';

                      for (const [tId, val] of Object.entries(fleetTroops)) {
                        const fleetQty = Number(val) || 0;
                        if (fleetQty > 0) {
                          const available = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                          if (available < fleetQty) {
                            isInsufficient = true;
                            missingInfo = `${tId} (Need: ${fleetQty}, Have: ${available})`;
                            break;
                          }
                          changes[tId] = -fleetQty;
                        }
                      }

                      if (isInsufficient) {
                        alert(`Insufficient ships on Space Station: ${missingInfo}`);
                        return;
                      }

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

                          const newFleet: CreatedFleet = {
                            id: `fleet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            name: `Docked Squadron ${createdFleets.length + 1}`,
                            subsidiary: 'Station Defense Force',
                            troops: { ...fleetTroops } as any,
                            planetId: activePlanet.id
                          };

                          if (setCreatedFleets) {
                            setCreatedFleets(prev => [...prev, newFleet]);
                          }

                          // Reset troop counts in form
                          setFleetTroops({
                            defender: 0,
                            attacker: 0,
                            tank: 0,
                            looter: 0,
                            drone: 0,
                            settlementShip: 0
                          });

                          if (showToast) {
                            showToast(`Successfully created ${newFleet.name}! It will stay on the station until given a mission.`, 'success');
                          } else {
                            alert(`Successfully created ${newFleet.name}! It will stay on the station until given a mission.`);
                          }
                        } else {
                          alert(data.error || 'Failed to adjust space station garrison troops');
                        }
                      } catch (err) {
                        alert('Network failure creating reserve fleet');
                      }
                    }}
                    disabled={!isMissionReady}
                    className={`px-4 py-3 border text-[10px] tracking-wider uppercase font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isMissionReady
                        ? 'border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 hover:text-emerald-300 active:scale-[0.98]'
                        : 'border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                    title="Deduct these ships and save them as a docked reserve fleet on this station"
                  >
                    📥 CREATE DOCKED FLEET
                  </button>
                )}

                {selectedTarget.id !== player.id && selectedTarget.id !== 'habitable' && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = selectedTarget.id;
                      setSelectedTarget(null);
                      if (onViewPlayerProfile) onViewPlayerProfile(targetId);
                    }}
                    className="px-4 py-3 bg-[#050D19]/40 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/15 active:scale-[0.98] transition font-bold uppercase rounded-xl text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Transmit private encrypted message to this Commander"
                  >
                    💬 MESSAGE
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {activeChatWindow && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#070B13] border border-cyan-500/30 rounded-2xl p-6 flex flex-col h-[550px] shadow-[0_0_50px_rgba(6,182,212,0.15)] font-mono">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                  SECURE NET TRANSCEIVER WINDOW — {activeChatWindow.toUpperCase()} SYSTEM
                </span>
              </div>
              <button 
                onClick={() => setActiveChatWindow(null)}
                className="text-slate-400 hover:text-white font-sans text-2xl cursor-pointer p-1"
                title="Disconnect channel link"
              >
                &times;
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-xs text-left">
              {chatMessages
                .filter(msg => msg.channel === activeChatWindow || (activeChatWindow === 'alliance' && player.allianceId && msg.channel === 'alliance' && msg.allianceTag === alliances[player.allianceId]?.tag))
                .length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10 space-y-2">
                    <MessageSquare size={32} className="opacity-30" />
                    <p className="text-xs font-mono select-none">No active transmissions decoded on this wavelength.</p>
                  </div>
                ) : (
                  [...chatMessages]
                    .filter(msg => msg.channel === activeChatWindow || (activeChatWindow === 'alliance' && player.allianceId && msg.channel === 'alliance' && msg.allianceTag === alliances[player.allianceId]?.tag))
                    .reverse()
                    .map((msg, idx) => {
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
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                )
              }
            </div>

            {/* Chat entry form */}
            <form onSubmit={handleSendChatMessage} className="mt-4 flex gap-2.5">
              <input 
                type="text" 
                placeholder={activeChatWindow === 'global' ? 'Transmit across sector wavelengths...' : 'Transmit secure ally data...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-3 bg-[#05070A] border border-[#1E293B] text-white rounded-xl text-xs font-mono focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
              />
              <button 
                type="submit"
                className="px-5 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center transition cursor-pointer shrink-0"
                title="Send secure communication transmission"
              >
                <Send size={13} title="Transceiver beam transmit button" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INTEL RECEPTOR DECRYPTING / REPORT MODAL */}
      {(isFetchingIntel || intelReport || intelError) && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-stretch justify-center md:p-6 overflow-hidden">
          <div className="w-full max-w-5xl bg-[#070A15]/95 border-0 md:border md:border-amber-500/30 rounded-none md:rounded-2xl p-6 md:p-8 flex flex-col space-y-5 font-mono shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-fade-in text-left h-full md:h-auto overflow-hidden">
            <div className="flex justify-between items-start pb-4 border-b border-amber-500/20 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">COORDINATE INTELLIGENCE BRIEFING</span>
                <h3 className="text-lg font-bold text-white mt-3.5 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">📡</span> SATELLITE DECRYPTION ANALYSIS (FULLSCREEN)
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIntelReport(null);
                  setIntelError(null);
                  setIsFetchingIntel(false);
                }}
                className="text-slate-500 hover:text-white font-bold p-1 cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {isFetchingIntel && (
              <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center flex-1">
                <div className="w-14 h-14 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <p className="text-sm font-bold text-amber-400 uppercase tracking-widest animate-pulse font-mono">DECRYPTING CO-ORDINATE ENVELOPE...</p>
                <p className="text-xs text-slate-500 font-sans">Routing signals through deep space array relay. Stand by.</p>
              </div>
            )}

            {intelError && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center flex-1">
                <span className="text-4xl text-red-500">⚠️</span>
                <p className="text-sm font-bold text-red-400 uppercase tracking-widest font-mono">DECRYPTION FAILURE</p>
                <p className="text-xs text-slate-405 bg-red-950/20 border border-red-900/40 p-4 rounded-lg max-w-sm font-sans">{intelError}</p>
                <button 
                  onClick={() => setIntelError(null)}
                  className="px-5 py-2 bg-red-950/40 border border-red-500/40 text-red-450 text-red-404 hover:bg-red-900/30 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Dismiss
                </button>
              </div>
            )}

            {intelReport && (
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    <span className="text-amber-400 font-mono font-bold">SECTOR COORDINATES:</span> [{intelReport.coords.x}, {intelReport.coords.y}]
                  </p>
                  {intelReport.type === 'occupied' && (
                    <>
                      <p className="text-xs text-slate-300 font-sans"><span className="text-amber-400 font-mono font-bold">STATION NAME: &bull;</span> {intelReport.planetName}</p>
                      <p className="text-xs text-slate-300 font-sans">
                        <span className="text-amber-400 font-mono font-bold">STATION COMMANDER: &bull; </span>{' '}
                        {intelReport.commanderId ? (
                          <span 
                            onClick={() => {
                              if (onViewPlayerProfile) onViewPlayerProfile(intelReport.commanderId);
                            }}
                            className="underline decoration-dotted cursor-pointer text-cyan-400 hover:text-cyan-300 font-black"
                          >
                            {intelReport.commander}
                          </span>
                        ) : (
                          intelReport.commander
                        )}
                      </p>
                      {(() => {
                        const targetActive = intelReport.lastActive;
                        if (!targetActive) return null;
                        const diffSec = Math.floor((Date.now() - targetActive) / 1000);
                        const isOnline = diffSec < 120;
                        let statusStr = "ACTIVE";
                        let statusColor = "text-emerald-400 font-bold";
                        if (!isOnline) {
                          statusColor = "text-amber-400 font-bold font-mono";
                          if (diffSec < 3600) {
                            const mins = Math.floor(diffSec / 60);
                            statusStr = `LAST SEEN: ${mins} MINS AGO`;
                          } else {
                            const hrs = Math.floor(diffSec / 3600);
                            statusStr = `LAST SEEN: ${hrs} HOURS AGO`;
                          }
                        }
                        return (
                          <p className="text-xs text-slate-300 font-sans mt-1">
                            <span className="text-amber-400 font-mono font-bold">SECTOR INTEL STATUS: &bull; </span>
                            <span className={statusColor}>{statusStr}</span>
                          </p>
                        );
                      })()}
                    </>
                  )}
                  {intelReport.type === 'habitable' && (
                    <>
                      <p className="text-xs text-slate-350 font-sans"><span className="text-emerald-400 font-mono font-bold">PLANET CLASSIFICATION:</span> Uncharted Habitable Zone</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-emerald-950/25 border border-emerald-500/30 p-2.5 rounded-lg mt-1">{intelReport.description}</p>
                    </>
                  )}
                  {intelReport.type === 'void' && (
                    <>
                      <p className="text-xs text-scale-350 font-sans"><span className="text-cyan-400 font-mono font-bold">SECTOR CLASSIFICATION:</span> Deep Vacuum Void</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900 border border-slate-800 p-2.5 rounded-lg mt-1">{intelReport.description}</p>
                    </>
                  )}
                </div>

                {intelReport.type === 'occupied' && (
                  <>
                    {/* Detected Garrison Troops & HP Status */}
                    <div className="space-y-3.5 border-t border-[#1E293B]/60 pt-4">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-mono flex items-center gap-1.5">
                        <span>🛡️</span> SIGNAL INTERCEPT GARRISON ORBITALS & COMBAT RATINGS
                      </h4>

                      {/* Garrison HP display block */}
                      {(() => {
                        const garrisonHp = calculateEnemyHp(intelReport.troops);
                        return (
                          <div className="p-3.5 bg-[#0D1527] border border-blue-500/15 rounded-xl text-xs font-mono space-y-2">
                            <div className="p-2 bg-blue-950/15 border border-blue-900/30 rounded-lg flex items-center justify-between">
                              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Total Enemy Garrison Defense / Shields</span>
                              <span className="font-bold text-blue-400 text-sm flex items-center gap-1.5">
                                🛡️ {garrisonHp.defenceHp.toLocaleString()} HP
                              </span>
                            </div>
                            <div className="p-2 bg-orange-950/15 border border-orange-900/30 rounded-lg flex items-center justify-between">
                              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Total Enemy Garrison Attack / Firepower</span>
                              <span className="font-bold text-orange-400 text-sm flex items-center gap-1.5">
                                ⚔️ {garrisonHp.attackHp.toLocaleString()} HP
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs text-center">
                        <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase">Interceptor</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{intelReport.troops.defender || 0}</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase">Assault Drone</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{intelReport.troops.attacker || 0}</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase">Disrupter</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{intelReport.troops.tank || 0}</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase">Matter Extractor</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{intelReport.troops.looter || 0}</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase">Missile Launcher</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{intelReport.troops.drone || 0}</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-500 block uppercase">Settlement Ship</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{intelReport.troops.settlementShip || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Interactive Buildings List (Works like Explore Tab dropdowns) */}
                    {(() => {
                      const reportBuildings = intelReport.buildings || { fabricator: 1, commsHub: 1, radar: 1, repository: 1, researchCenter: 1, armyBase: 1, supplyNexus: 1 };
                      
                      return (
                        <div className="space-y-2 border-t border-[#1E293B]/60 pt-4">
                          <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>🏢</span> DETECTED STATION BUILDINGS INFRASTRUCTURE (CLICK TO TOGGLE DESCRIPTIONS)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {Object.entries({
                              fabricator: 'Fabricator',
                              commsHub: 'Communications Hub',
                              radar: 'Radar Array',
                              researchCenter: 'Research Center',
                              armyBase: 'War Room',
                              repository: 'Silo',
                              supplyNexus: 'Supply Nexus'
                            }).map(([bKey, bName]) => {
                              const isExpanded = intelPopupExpandedBuildings[bKey] ?? false;
                              const level = reportBuildings[bKey] || 1;
                              const details = {
                                fabricator: 'Core modular orbital structural manufacturer and printer.',
                                commsHub: 'Tactical systems communications node. Dictates system message updates, coordinate signals, and war alliance parameters.',
                                radar: 'High-frequency telemetry radar system. Dictates scan width of space lords and reveals unchartered planetary stars.',
                                researchCenter: 'Scientific particle physics laboratory. Dictates upgrades of fleet technologies and research build times.',
                                armyBase: 'General war briefing base. Dictates tactical pilot counts and active training speeds in barracks.',
                                repository: 'High-density mineral element storage banks. Protects elements and resources from being looted during star raids.',
                                supplyNexus: 'Industrial elements marketplace nexus. Powers transport rates and space gold transaction speeds.'
                              }[bKey] || 'Central station building module.';

                              return (
                                <div key={bKey} className="border border-[#1E293B] bg-slate-950/20 rounded-xl overflow-hidden transition">
                                  <button
                                    type="button"
                                    onClick={() => setIntelPopupExpandedBuildings(prev => ({ ...prev, [bKey]: !isExpanded }))}
                                    className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.02]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-500 font-bold">&#9642;</span>
                                      <span className="font-bold text-slate-205 text-slate-300">{bName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-[#1E293B] text-amber-400 px-2 py-0.5 rounded">Lv {level} / 50</span>
                                      {isExpanded ? (
                                        <ChevronUp size={13} className="text-red-400" />
                                      ) : (
                                        <ChevronDown size={13} className="text-emerald-450 text-emerald-400" />
                                      )}
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="p-3 bg-black/40 border-t border-[#1E293B] text-[10.5px] text-slate-400 font-sans leading-relaxed">
                                      {details}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Integrated Interactive Extractors List (Works like Explore Tab dropdowns) */}
                    {(() => {
                      const reportMines = intelReport.mines || { water: [1], plasma: [1], fuel: [1], food: [1], respirant: [1] };
                      const categories = {
                        water: { name: 'Water', desc: 'Siphons heavy element liquid aquifers. Vital elements utilized by personnel and rocket fuels.', emoji: '💧' },
                        plasma: { name: 'Plasma', desc: 'Synthesizes ionic plasma dust. Essential elements for star shield battery chargers and heavy hulls.', emoji: '🔥' },
                        fuel: { name: 'Fuel', desc: 'Synthesizes helium cells. Propels active starships on multi-coordinate deep space missions.', emoji: '⚡' },
                        food: { name: 'Food', desc: 'Produces nutrient algae capsules to feed stationed garrisoneers and ship navigators.', emoji: '🌾' },
                        respirant: { name: 'Respirant', desc: 'Maintains element levels inside star docks so astronauts can survive indefinitely.', emoji: '🌀' }
                      };

                      return (
                        <div className="space-y-2 border-t border-[#1E293B]/60 pt-4">
                          <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>⚒️</span> DETECTED RESOURCE EXTRACTION ARRAY (CLICK TO REVEAL PUMPS INDICES)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {Object.entries(categories).map(([mKey, cat]) => {
                              const isExpanded = intelPopupExpandedMines[mKey] ?? false;
                              const levels: number[] = reportMines[mKey] || [1];
                              const avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) || 1;

                              return (
                                <div key={mKey} className="border border-[#1E293B] bg-slate-950/20 rounded-xl overflow-hidden transition">
                                  <button
                                    type="button"
                                    onClick={() => setIntelPopupExpandedMines(prev => ({ ...prev, [mKey]: !isExpanded }))}
                                    className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.02]"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-base">{cat.emoji}</span>
                                      <div>
                                        <span className="font-bold text-slate-300 block">{cat.name}</span>
                                        <span className="text-[9px] text-slate-500 font-normal mt-0.5 block">{levels.length} Industrial Pumps &bull; Avg Lv {avgLevel}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? (
                                        <ChevronUp size={13} className="text-red-400" />
                                      ) : (
                                        <ChevronDown size={13} className="text-emerald-400" />
                                      )}
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="p-3 bg-black/40 border-t border-[#1E293B] space-y-2.5 text-[10.5px]">
                                      <p className="text-slate-400 font-sans leading-normal">{cat.desc}</p>
                                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-300">
                                        {levels.map((lvl, idx) => (
                                          <div key={idx} className="bg-[#05070A] p-1.5 border border-white/5 rounded flex justify-between items-center">
                                            <span className="text-slate-500">Pump #{idx + 1}</span>
                                            <span className="font-bold text-amber-400">Lv {lvl}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Detected Stockpile */}
                    <div className="space-y-1.5 border-t border-[#1E293B]/60 pt-4">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 font-mono">ESTIMATED STORAGE RESOURCES</h4>
                      <div className="grid grid-cols-5 gap-1.5 text-[10.5px] text-center font-mono animate-pulse">
                        <div className="p-1.5 bg-cyan-950/10 border border-cyan-900/40 rounded">
                          <span className="text-cyan-400 text-[9px] block font-bold">WATER</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.water).toLocaleString()}</span>
                        </div>
                        <div className="p-1.5 bg-indigo-950/10 border border-indigo-900/40 rounded">
                          <span className="text-indigo-400 text-[9px] block font-bold">PLASMA</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.plasma).toLocaleString()}</span>
                        </div>
                        <div className="p-1.5 bg-purple-950/10 border border-purple-900/40 rounded">
                          <span className="text-purple-400 text-[9px] block font-bold">FUEL</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.fuel).toLocaleString()}</span>
                        </div>
                        <div className="p-1.5 bg-emerald-950/10 border border-emerald-900/40 rounded">
                          <span className="text-emerald-400 text-[9px] block font-bold">FOOD</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.food).toLocaleString()}</span>
                        </div>
                        <div className="p-1.5 bg-teal-950/10 border border-teal-900/40 rounded">
                          <span className="text-teal-400 text-[9px] block font-bold">AIR</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.respirant).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#1E293B]/60 gap-3 shrink-0">
              <button 
                onClick={() => {
                  setIntelReport(null);
                  setIntelError(null);
                  setIsFetchingIntel(false);
                }}
                className="px-6 py-2.5 bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer"
              >
                Close Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUANTUM CARGO TRADING GATES MODAL */}
      {targetForResources && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090D1A] border border-cyan-500/35 rounded-2xl p-6 space-y-4 font-mono shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-fade-in text-left">
            <div className="flex justify-between items-start pb-2.5 border-b border-[#1E293B]/60">
              <div>
                <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest bg-cyan-950/25 border border-cyan-500/25 px-2.5 py-1 rounded-lg">QUANTUM CARGO PORTAL GATEWAY</span>
                <h3 className="text-lg font-bold text-white mt-2 tracking-tight">Transmit Cargo Payload</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Destination: Commander <strong className="text-yellow-400">{targetForResources.username}</strong> at sector coord [{targetForResources.coords?.x}, {targetForResources.coords?.y}].</p>
              </div>
              <button 
                onClick={() => setTargetForResources(null)}
                className="text-slate-400 hover:text-white font-sans text-2xl cursor-pointer leading-none p-1 transition"
              >
                &times;
              </button>
            </div>

            {/* Input fields list */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Set Resource Quantities:</span>
              <div className="space-y-1.5 font-mono text-xs">
                {['water', 'plasma', 'fuel', 'food', 'respirant'].map((resId) => {
                  const resources = localResources || activePlanet.resources;
                  const avail = Math.floor(resources[resId as keyof typeof resources] || 0);
                  const val = resourceSendValues[resId] || 0;

                  const label = 
                    resId === 'water' ? 'Liquid H2O Water' :
                    resId === 'plasma' ? 'High-energy Plasma' :
                    resId === 'fuel' ? 'Refined Helium Fuel' :
                    resId === 'food' ? 'Hydroponic Nutrition' :
                    'Sterile respirant air';

                  const badgeColor = 
                    resId === 'water' ? 'text-cyan-400' :
                    resId === 'plasma' ? 'text-indigo-400' :
                    resId === 'fuel' ? 'text-purple-400' :
                    resId === 'food' ? 'text-emerald-400' :
                    'text-teal-400';

                  const labelIcon = 
                    resId === 'water' ? '💧' :
                    resId === 'plasma' ? '⚡' :
                    resId === 'fuel' ? '🔥' :
                    resId === 'food' ? '🥗' :
                    '💨';

                  return (
                    <div key={resId} className="p-2 border border-[#1E293B] bg-[#05070A]/85 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{labelIcon}</span>
                          <span className={`text-[11.5px] ${badgeColor}`}>{label}</span>
                        </span>
                        <p className="text-[9px] text-slate-550 mt-0.5">Available on Base: <strong className="text-slate-350">{avail.toLocaleString()}</strong></p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-slate-950/40 p-1 rounded-lg border border-[#1E293B]/40">
                        <button
                          type="button"
                          onClick={() => setResourceSendValues(prev => ({ ...prev, [resId]: 0 }))}
                          className="px-1.5 py-1 bg-[#1E293B]/40 hover:bg-[#1E293B]/65 text-[9px] text-slate-400 font-bold rounded cursor-pointer"
                        >
                          Min
                        </button>
                        <input 
                          type="number"
                          min={0}
                          max={avail}
                          value={val === 0 ? '' : val}
                          placeholder="0"
                          onChange={(e) => {
                            const inputVal = Math.max(0, Math.min(avail, parseInt(e.target.value) || 0));
                            setResourceSendValues(prev => ({ ...prev, [resId]: inputVal }));
                          }}
                          className="w-16 sm:w-20 bg-slate-950/80 border border-slate-900 focus:border-cyan-500/50 text-white rounded text-center py-1 font-bold text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setResourceSendValues(prev => ({ ...prev, [resId]: avail }))}
                          className="px-1.5 py-1 bg-cyan-950/20 hover:bg-cyan-500/20 border border-cyan-500/25 text-[9px] text-cyan-400 font-bold rounded cursor-pointer"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning / Notes */}
            <p className="text-[9.5px] text-slate-400 bg-cyan-950/5 p-2 rounded-lg border border-cyan-900/10 text-center uppercase font-bold tracking-wider leading-relaxed">
              ⚡ instantaneous trade-portal transfer &bull; zero loss &bull; secure encryption channel
            </p>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2.5 border-t border-[#1E293B]/40">
              <button 
                type="button"
                onClick={() => setTargetForResources(null)}
                className="px-4 py-2 bg-[#0C1222] border border-[#1E293B] text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer font-mono"
              >
                Abort
              </button>
              <button 
                type="button"
                onClick={handleSendResources}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-960 to-cyan-500/20 hover:from-cyan-960 hover:to-cyan-500/30 border border-cyan-500/50 text-cyan-400 hover:text-cyan-300 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-1.5 font-mono"
              >
                📦 Establish Portal & Transmit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALLIANCE HUB MANAGEMENT COCKPIT PANEL MODAL */}
      {showManageAlliance && (() => {
        const activeAlliance = alliances[player.allianceId || ''];
        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#090D1A] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col h-[85vh] font-sans text-left relative">
            
            {/* Header decor */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500" />
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E293B]/70 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase block mb-1">STRATEGIC OPERATIONS DIRECTORY</span>
                <h3 className="text-sm sm:text-base font-black font-mono text-white tracking-tight flex items-center gap-2">
                  🛡️ [{activeAlliance?.tag}] {activeAlliance?.name} COCKPIT
                </h3>
              </div>
              
              {/* Internal Tab selectors */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-[#1E293B]">
                {[
                  { id: 'highlights', label: '📌 Notes & Highlights' },
                  { id: 'troops', label: '🎖️ Troop Intelligence' },
                  { id: 'situation', label: '📡 Situation Room' },
                  { id: 'activity', label: '👥 Activity Roster' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveReportsTab(t.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9.5px] sm:text-[10.5px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      activeReportsTab === t.id 
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowManageAlliance(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-[#030508] hover:bg-slate-900 border border-[#1E293B] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Content - Scrollable Main space */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-5 bg-[#04060b]/30">

              {/* TAB 1: HIGHLIGHTS NOTES */}
              {activeReportsTab === 'highlights' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      📌 ALLIANCE NOTES LEDGER & TACTICAL DEPLOYMENT DIRECTIVES
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-normal">
                      This notepad represents the central bulletin layout accessible to all corporate recruits, field officers and elite planetary commanders. Post coordinating goals, sector targets, defense coordinates, and trade channels.
                    </p>
                  </div>

                  {editingHighlights ? (
                    <div className="space-y-3">
                      <textarea
                        value={allianceHighlightText}
                        onChange={(e) => setAllianceHighlightText(e.target.value)}
                        placeholder="ENTER THE ALLIANCE HIGHLIGHTS NOTES, COORDINATE ASSIGNMENTS, STARBASE PRIORITIES..."
                        className="w-full h-80 px-4 py-3 bg-[#020304] border border-cyan-500/40 text-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 font-mono text-xs leading-relaxed uppercase"
                      />
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingHighlights(false)}
                          className="px-4 py-2 bg-[#0C1222] border border-[#1E293B] text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateHighlights}
                          className="px-4.5 py-2.5 bg-cyan-500 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] font-bold rounded-xl uppercase tracking-widest transition cursor-pointer text-[10px]"
                        >
                          Save Directives 💾
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-5 bg-slate-950/80 border border-[#1E293B] rounded-xl min-h-[220px] whitespace-pre-wrap font-sans text-slate-300 leading-relaxed text-[12.5px] border-l-4 border-l-yellow-500 shadow-inner">
                        {allianceHighlightText || "No active planetary deployment instructions recorded yet in the sector ledger index. Click 'Edit Highlights Ledger' to establish coordinates."}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingHighlights(true)}
                          className="px-4.5 py-2.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 rounded-xl font-bold uppercase tracking-widest transition cursor-pointer text-[10px]"
                        >
                          Edit Highlights Ledger 📝
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TROOP INTELLIGENCE REPORTS */}
              {activeReportsTab === 'troops' && (
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">🎖️ ACTIVE COMBINED FORCE INTELLIGENCE DETECTOR</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-normal mt-1">
                      Scans the troop barracks, starports, and planetary defense centers of all alliance commanders. Review total military readiness, cargo extraction ships, and orbital garrison status planet by planet.
                    </p>
                  </div>

                  {loadingReports ? (
                    <div className="p-12 text-center text-slate-500 uppercase tracking-widest animate-pulse font-bold text-xs">
                      📡 STANDBY - HARVESTING COLONY BARRACKS TELEMETRY...
                    </div>
                  ) : allianceMemberReports.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 text-center border border-[#1E293B] bg-slate-950/20 rounded-xl">
                      No troop assets harvested or loaded.
                    </p>
                  ) : (
                    <div className="space-y-4.5">
                      {allianceMemberReports.map((mbr) => {
                        const totalTroopsCount = mbr.planets?.reduce((acc: any, p: any) => {
                          const tr = p.troops || {};
                          return {
                            defender: acc.defender + (tr.defender || 0),
                            attacker: acc.attacker + (tr.attacker || 0),
                            tank: acc.tank + (tr.tank || 0),
                            looter: acc.looter + (tr.looter || 0),
                            drone: acc.drone + (tr.drone || 0),
                            settlementShip: acc.settlementShip + (tr.settlementShip || 0)
                          };
                        }, { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 }) || { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

                        const grandTotal = Object.values(totalTroopsCount || {}).reduce((a: any, b: any) => a + b, 0) as number;
                        const isExpanded = expandedMemberPlanets[mbr.playerId];

                        return (
                          <div key={mbr.playerId} className="border border-[#1E293B] rounded-xl bg-[#030508]/70 overflow-hidden">
                            {/* Member header card */}
                            <div className="p-4 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B]/60">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <button
                                    type="button"
                                    onClick={() => onViewPlayerProfile && onViewPlayerProfile(mbr.playerId)}
                                    className="font-black text-cyan-400 hover:text-cyan-300 text-sm tracking-tight hover:underline cursor-pointer focus:outline-none"
                                  >
                                    {mbr.username}
                                  </button>
                                  <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400 uppercase font-bold">{mbr.role}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Planetary Holdings: <strong className="text-slate-350">{mbr.planets?.length || 0} Colony bases</strong> • Combined Force: <strong className="text-cyan-400">{grandTotal} Troops</strong>
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedMemberPlanets(prev => ({ ...prev, [mbr.playerId]: !isExpanded }))}
                                className="px-3 py-1.5 bg-[#0C1222] hover:bg-slate-900 border border-[#1E293B] text-slate-400 hover:text-white rounded-lg transition font-mono font-bold text-[10px] uppercase flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
                              >
                                {isExpanded ? 'Hide Bases 🔼' : 'Expand Bases 🔽'}
                              </button>
                            </div>

                            {/* Total summary summary bar */}
                            <div className="px-4 py-2 bg-slate-950/20 border-b border-[#1E293B]/40 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-400">
                              <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Total Combined Force Layout:</span>
                              <span>🛡️ Def: <strong className="text-cyan-400">{totalTroopsCount.defender}</strong></span>
                              <span>⚔️ Int: <strong className="text-red-400">{totalTroopsCount.attacker}</strong></span>
                              <span>💣 Tan: <strong className="text-amber-400">{totalTroopsCount.tank}</strong></span>
                              <span>🚛 Loo: <strong className="text-emerald-400">{totalTroopsCount.looter}</strong></span>
                              <span>🛰️ Dro: <strong className="text-purple-400">{totalTroopsCount.drone}</strong></span>
                              <span>🚀 Set: <strong className="text-teal-400">{totalTroopsCount.settlementShip}</strong></span>
                            </div>

                            {/* List of planets if expanded */}
                            {isExpanded && (
                              <div className="p-4 bg-black/45 space-y-3 font-mono text-[11px] border-t border-[#1E293B]/30">
                                {mbr.planets && mbr.planets.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {mbr.planets.map((planet: any) => {
                                      const plTroops = planet.troops || {};
                                      return (
                                        <div key={planet.id} className="p-3 bg-[#090D1A]/95 border border-[#1E293B]/60 rounded-xl space-y-2 text-left">
                                          <div className="flex justify-between items-center pb-1.5 border-b border-[#1E293B]/40">
                                            <span className="font-bold text-slate-200">{planet.name}</span>
                                            <span className="text-cyan-400 font-bold bg-cyan-950/35 border border-cyan-500/25 px-1.5 py-0.5 rounded text-[9.5px]">COORD [{planet.sectorX}, {planet.sectorY}]</span>
                                          </div>
                                          
                                          {/* Troops breakdown */}
                                          <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 text-[10.5px] pt-1">
                                            <div className="flex flex-col">
                                              <span className="text-slate-500 text-[9px] uppercase font-bold">Interceptors</span>
                                              <span className="text-cyan-400 font-extrabold">{plTroops.defender || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-red-400 text-[9px] uppercase font-bold">Assault Drones</span>
                                              <span className="text-red-400 font-extrabold">{plTroops.attacker || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-amber-500 text-[9px] uppercase font-bold">Disrupters</span>
                                              <span className="text-amber-400 font-extrabold">{plTroops.tank || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-emerald-500 text-[9px] uppercase font-bold">Extractors</span>
                                              <span className="text-emerald-400 font-extrabold">{plTroops.looter || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-purple-500 text-[9px] uppercase font-bold">Missile Launchers</span>
                                              <span className="text-purple-400 font-extrabold">{plTroops.drone || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-teal-500 text-[9px] uppercase font-bold">Settle Ships</span>
                                              <span className="text-teal-400 font-extrabold">{plTroops.settlementShip || 0}</span>
                                            </div>
                                          </div>

                                          {/* Resources breakdown */}
                                          <div className="pt-2 border-t border-[#1E293B]/20 flex justify-between gap-1 flex-wrap text-[9px] text-slate-500 font-bold">
                                            <span>💧 {Math.floor(planet.resources?.water || 0).toLocaleString()}</span>
                                            <span>⚡ {Math.floor(planet.resources?.plasma || 0).toLocaleString()}</span>
                                            <span>🔥 {Math.floor(planet.resources?.fuel || 0).toLocaleString()}</span>
                                            <span>🥗 {Math.floor(planet.resources?.food || 0).toLocaleString()}</span>
                                            <span>💨 {Math.floor(planet.resources?.respirant || 0).toLocaleString()}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[10.5px] text-slate-600 italic px-2">No planetary stations detected for this user commander.</p>
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

              {/* TAB 3: TACTICAL SITUATION ROOM */}
              {activeReportsTab === 'situation' && (() => {
                const activeAlliance = alliances[player.allianceId || ''];
                const allianceMemberIds = activeAlliance ? activeAlliance.members.map(m => m.playerId) : [];

                // Filter moving fleets for real-time tracking
                const offensiveMissions = fleets.filter(f => 
                  allianceMemberIds.includes(f.senderId) && 
                  f.missionType === 'attack'
                );

                const defensiveMissions = fleets.filter(f => 
                  f.targetId && 
                  allianceMemberIds.includes(f.targetId) && 
                  f.missionType === 'attack' && 
                  !f.isReturning
                );

                return (
                  <div className="space-y-6">
                    <div className="p-4 bg-red-950/10 border border-red-500/15 rounded-xl">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Radio size={14} className="animate-pulse" /> DEPLOYED TACTICAL SITUATION SCANNERS
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-normal mt-0.5">
                        Central warfare computer resolving target coordinates for overall alliance defensive alarms. Tracks ongoing offensive siege attacks by any alliance members (Offensive Command) and hostile incoming strikes aiming coordinates of any of our members (Defensive Action Alarms) in real-time.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Left: Offensive operations */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-amber-950 pb-2 flex items-center gap-1.5">
                          ☄️ ACTIVE OUTGOING offensive operations ({offensiveMissions.length})
                        </h4>
                        {offensiveMissions.length === 0 ? (
                          <div className="p-5 border border-[#1E293B] bg-[#030508]/40 rounded-xl text-center text-slate-500 text-[10.5px] italic">
                            No outgoing siege troops active. Coordinate outer rim targeting in sector map.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {offensiveMissions.map((fleet) => {
                              const secLeft = Math.max(0, Math.floor((fleet.arrivesAt - serverTime) / 1000));
                              return (
                                <div key={fleet.id} className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-2">
                                  <div className="flex justify-between items-start gap-2 flex-wrap">
                                    <div>
                                      <p className="font-bold text-slate-200">
                                        Commander:{" "}
                                        <button
                                          type="button"
                                          onClick={() => onViewPlayerProfile && onViewPlayerProfile(fleet.senderId)}
                                          className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-bold focus:outline-none"
                                        >
                                          {fleet.senderName}
                                        </button>
                                      </p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">Origin: [{fleet.senderCoords.x}, {fleet.senderCoords.y}]</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] uppercase font-bold rounded">
                                      {fleet.isReturning ? 'Returning Home' : 'Attacking Outward'}
                                    </span>
                                  </div>

                                  <div className="p-2 bg-[#020305] border border-[#1E293B]/60 rounded-lg text-[10.5px]">
                                    <p className="text-slate-400">Target Coordinates: <span className="text-white font-bold">[{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span> ({fleet.targetName})</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">
                                      Troops: {Object.entries(fleet.troops).filter(([_, q]) => (q as number) > 0).map(([k, q]) => `${q}x ${k}`).join(', ')}
                                    </p>
                                  </div>

                                  <div className="flex justify-between items-center text-[10px] pt-1">
                                    <span className="text-slate-505 uppercase">TELEMETRY LOCK RECON</span>
                                    <span className="text-amber-400 font-extrabold animate-pulse">{secLeft}s left to destination</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right: Defensive alarms */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-red-950 pb-2 flex items-center gap-1.5">
                          🚨 INCOMING SYSTEM THREAT COVENANTS ({defensiveMissions.length})
                        </h4>
                        {defensiveMissions.length === 0 ? (
                          <div className="p-5 border border-emerald-900/10 bg-emerald-950/5 rounded-xl text-center text-emerald-500/80 text-[10.5px] italic">
                            🛡️ Perimeter secure. Zero hostile fleets mapping coordinates!
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {defensiveMissions.map((fleet) => {
                              const secLeft = Math.max(0, Math.floor((fleet.arrivesAt - serverTime) / 1000));
                              return (
                                <div key={fleet.id} className="p-4 bg-red-950/15 border border-red-500/30 rounded-xl space-y-2">
                                  <div className="flex justify-between items-start gap-2 flex-wrap">
                                    <div>
                                      <p className="font-bold text-red-400 uppercase tracking-wider animate-pulse flex items-center gap-1">
                                        <span>⚠️ HOSTILE ASSAULT FROM:</span>
                                        <button
                                          type="button"
                                          onClick={() => onViewPlayerProfile && onViewPlayerProfile(fleet.senderId)}
                                          className="text-white hover:text-red-300 hover:underline cursor-pointer font-bold focus:outline-none"
                                        >
                                          {fleet.senderName}
                                        </button>
                                      </p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">Origin Grid: [{fleet.senderCoords.x}, {fleet.senderCoords.y}]</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] uppercase font-bold rounded">
                                      CRITICAL DIRECT THREAT
                                    </span>
                                  </div>

                                  <div className="p-2 bg-[#020305] border border-red-900/30 rounded-lg text-[10.5px]">
                                    <p className="text-slate-350 text-slate-300">
                                      Target Coordinate: <span className="text-red-400 font-extrabold">[{fleet.targetCoords.x}, {fleet.targetCoords.y}]</span> ({fleet.targetName})
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase">
                                      Payload: {Object.entries(fleet.troops).filter(([_, q]) => (q as number) > 0).map(([k, q]) => `${q}x ${k}`).join(', ')}
                                    </p>
                                  </div>

                                  <div className="flex justify-between items-center text-[10.5px] pt-1">
                                    <span className="text-red-500 font-black animate-pulse">ALARM DETECTION</span>
                                    <span className="text-red-400 font-black animate-pulse bg-red-950/30 border border-red-500/25 px-2 py-0.5 rounded">{secLeft}s left</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: ACTIVITY MONITOR */}
              {activeReportsTab === 'activity' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#0A192F] border border-sky-500/15 rounded-xl">
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest">👁️ CENTRALIZED ROSTER ACTIVITY MONITOR</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-normal mt-0.5">
                      Verify connection heartbeat synchronization of roster participants. Active commanders receive continuous solar shield calibration. Idle operators are flagged for sector review.
                    </p>
                  </div>

                  {loadingReports ? (
                    <div className="p-12 text-center text-slate-500 uppercase tracking-widest animate-pulse font-bold text-xs">
                      📡 SCANNING SECTOR HEARTBEAT RECORDS...
                    </div>
                  ) : (
                    <div className="border border-[#1E293B] rounded-xl overflow-hidden bg-[#030508]/60 overflow-x-auto">
                      <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-950 border-b border-[#1E293B] text-[10px] text-slate-500 tracking-wider">
                            <th className="px-4 py-3 font-bold uppercase">Commander Name</th>
                            <th className="px-4 py-3 font-bold uppercase">Roster Role</th>
                            <th className="px-4 py-3 font-bold uppercase text-right">Population</th>
                            <th className="px-4 py-3 font-bold uppercase text-right">Militancy HP Killed</th>
                            <th className="px-4 py-3 font-bold uppercase text-center">Bases Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E293B]/50">
                          {allianceMemberReports.map((mbr) => {
                            return (
                              <tr key={mbr.playerId} className="hover:bg-slate-900/30 transition text-xs">
                                <td className="px-4 py-3.5 font-bold">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onViewPlayerProfile && onViewPlayerProfile(mbr.playerId)}
                                      className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer focus:outline-none"
                                    >
                                      {mbr.username}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold text-[9.5px] uppercase tracking-wider text-slate-400">
                                    {mbr.role?.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-bold text-slate-300">
                                  {(mbr.scores?.population || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3.5 text-right font-bold text-red-400/80">
                                  {(mbr.scores?.attack || 0).toLocaleString()} HP
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold text-sky-400">
                                  {mbr.planets?.length || 1} bases
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* PENDING ALLIANCE APPLICATIONS SECTION */}
                  {(player.allianceRole === 'leader' || player.allianceRole === 'officer') && (
                    <div className="pt-4 mt-6 border-t border-[#1E293B] space-y-3">
                      <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        📥 PENDING MEMBERSHIP APPLICATIONS ({activeAlliance?.applications?.length || 0})
                      </h4>
                      {!activeAlliance?.applications || activeAlliance.applications.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic bg-sky-950/5 p-3 rounded-lg border border-[#1E293B]/40 font-sans">
                          No pending sector recruitment applications submitted. Transceiver wavelengths are silent.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {activeAlliance.applications.map((app) => (
                            <div key={app.playerId} className="p-3 border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => onViewPlayerProfile && onViewPlayerProfile(app.playerId)}
                                    className="font-bold text-white hover:text-cyan-400 underline cursor-pointer"
                                  >
                                    Commander {app.username}
                                  </button>
                                  <span className="text-slate-500 text-[10px] ml-2">
                                    Submitted: {new Date(app.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/alliance/approve', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-user-id': player.id
                                        },
                                        body: JSON.stringify({ targetPlayerId: app.playerId })
                                      });
                                      const data = await safeParseJson(res);
                                      if (res.ok) {
                                        if (showToast) showToast(`Approved Commander ${app.username} into our Alliance!`, 'success');
                                        if (onRefreshState) onRefreshState();
                                      } else {
                                        if (showToast) showToast(data.error || 'Approval failed', 'error');
                                      }
                                    } catch (err) {
                                      if (showToast) showToast('Communication link error', 'error');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-lg uppercase text-[10px] cursor-pointer transition duration-150"
                                >
                                  Approve ✅
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/alliance/decline', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-user-id': player.id
                                        },
                                        body: JSON.stringify({ targetPlayerId: app.playerId })
                                      });
                                      const data = await safeParseJson(res);
                                      if (res.ok) {
                                        if (showToast) showToast(`Declined application request from ${app.username}.`, 'info');
                                        if (onRefreshState) onRefreshState();
                                      } else {
                                        if (showToast) showToast(data.error || 'Operation failed', 'error');
                                      }
                                    } catch (err) {
                                      if (showToast) showToast('Net interface error', 'error');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-lg uppercase text-[10px] cursor-pointer transition duration-150"
                                >
                                  Decline ❌
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-black/40 border-t border-[#1E293B]/70 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>SECURE SECTOR CHANNEL STABILIZED</span>
              <button
                type="button"
                onClick={() => setShowManageAlliance(false)}
                className="px-5 py-2.5 bg-cyan-950/20 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 hover:text-cyan-300 font-bold font-mono text-[10.5px] uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Exit Cockpit
              </button>
            </div>

          </div>
        </div>
      ); })()}
      {confirmModal && (
        <div id="galaxy-confirm-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
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
