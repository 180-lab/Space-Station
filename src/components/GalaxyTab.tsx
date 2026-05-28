import React, { useState } from 'react';
import { 
  Alliance, 
  BattleReport, 
  ChatMessage, 
  ColonyPlanet, 
  FleetMission, 
  NewsEvent, 
  PlayerProfile 
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
  ChevronRight
} from 'lucide-react';

interface GalaxyTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  alliances: Record<string, Alliance>;
  chatMessages: ChatMessage[];
  fleets: FleetMission[];
  battleReports: BattleReport[];
  newsEvents: NewsEvent[];
  serverTime: number;
  onSendFleet: (mission: {
    targetX: number;
    targetY: number;
    missionType: 'attack' | 'colonize' | 'recon';
    troops: Record<string, number>;
    targetId?: string;
    targetName?: string;
  }) => void;
  onSendChat: (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => void;
  onCreateAlliance: (name: string, tag: string, bannerColor: string, bannerSymbol: string) => void;
  onJoinAlliance: (allianceId: string) => void;
  onLeaveAlliance: () => void;
  onDeclareWar: (targetAllianceId: string) => void;
  onRefreshState?: () => void;
}

async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    const hasCookieCheck = 
      text.includes('Cookie check') || 
      text.includes('blocking a required security cookie') ||
      text.includes('Action required to load your app');
    if (hasCookieCheck) {
      throw new Error('Galactic Sandbox security check: Please grant iframe cookie permissions or refresh the page.');
    }
    throw new Error(`Server gateway is currently stabilizing. Reconnecting... (Expected JSON, received ${contentType || 'text/html'})`);
  }
  return res.json();
}

const TROOP_NAME_MAPPING: Record<string, string> = {
  defender: 'Heavy Defender',
  attacker: 'Strike Interceptor',
  tank: 'Bomber Tank',
  looter: 'Rogue Looter',
  drone: 'Scout Drone',
  settlementShip: 'Settlement Ship'
};

export const GalaxyTab: React.FC<GalaxyTabProps> = ({
  player,
  activePlanet,
  alliances,
  chatMessages,
  fleets,
  battleReports,
  newsEvents,
  serverTime,
  onSendFleet,
  onSendChat,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onDeclareWar,
  onRefreshState
}) => {
  // Sub-tabs
  const [subTab, setSubTab] = useState<'scanner' | 'ranking' | 'comms' | 'news'>('scanner');

  // Scanner State
  const [targetCoords, setTargetCoords] = useState({ x: activePlanet.sectorX, y: activePlanet.sectorY });
  const [searchX, setSearchX] = useState(activePlanet.sectorX.toString());
  const [searchY, setSearchY] = useState(activePlanet.sectorY.toString());
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({});
  const [radarRadius, setRadarRadius] = useState(1);
  const [isScanning, setIsScanning] = useState(false);

  // Intelligence State
  const [intelReport, setIntelReport] = useState<any | null>(null);
  const [isFetchingIntel, setIsFetchingIntel] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);

  const fetchIntelReport = async (tx: number, ty: number) => {
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
  };

  // Auto-scan on mount when planet context changes
  React.useEffect(() => {
    handleScan(activePlanet.sectorX, activePlanet.sectorY);
  }, [activePlanet.id]);

  // Selected Sector details for fleet launch modal
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [fleetType, setFleetType] = useState<'attack' | 'colonize' | 'recon'>('recon');
  const [fleetTroops, setFleetTroops] = useState<Record<string, number>>({
    defender: 0,
    attacker: 0,
    tank: 0,
    looter: 0,
    drone: 0,
    settlementShip: 0
  });

  // Chat panel
  const [currentChatChannel, setCurrentChatChannel] = useState<'global' | 'alliance'>('global');
  const [chatInput, setChatInput] = useState('');
  const [activeChatWindow, setActiveChatWindow] = useState<'global' | 'alliance' | null>(null);

  // Alliance setup panel
  const [allianceName, setAllianceName] = useState('');
  const [allianceTag, setAllianceTag] = useState('');
  const [allianceBannerSymbol, setAllianceBannerSymbol] = useState('▲');
  const [allianceBannerColor, setAllianceBannerColor] = useState('#FF007A');

  // Collapsible States for DEC_LINKS and radar folder
  const [isCombatOpen, setIsCombatOpen] = useState(true);
  const [isIntelOpen, setIsIntelOpen] = useState(true);
  const [isRadarFolderOpen, setIsRadarFolderOpen] = useState(false);
  const [radarPage, setRadarPage] = useState(0);
  const [expandedCombatReports, setExpandedCombatReports] = useState<Record<string, boolean>>({});
  const [expandedIntelReports, setExpandedIntelReports] = useState<Record<string, boolean>>({});
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
    const xVal = Math.min(100, Math.max(0, parseInt(searchX, 10) || 0));
    const yVal = Math.min(100, Math.max(0, parseInt(searchY, 10) || 0));
    setTargetCoords({ x: xVal, y: yVal });
    handleScan(xVal, yVal);
  };

  // Open fleet dispatch panel
  const openDispatchFleet = (target: any, type: 'attack' | 'colonize' | 'recon') => {
    setSelectedTarget(target);
    setFleetType(type);
    
    // Set smart default troops count
    const initial: Record<string, number> = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
    if (type === 'recon') {
      initial.drone = Math.min(5, activePlanet.troops.drone || 0);
    } else if (type === 'attack') {
      initial.attacker = Math.min(10, activePlanet.troops.attacker || 0);
      initial.looter = Math.min(5, activePlanet.troops.looter || 0);
    } else if (type === 'colonize') {
      initial.settlementShip = Math.min(1, activePlanet.troops.settlementShip || 0);
    }
    setFleetTroops(initial);
  };

  // Dispatch launch
  const handleLaunchFleet = () => {
    if (!selectedTarget) return;
    onSendFleet({
      targetX: selectedTarget.coords.x,
      targetY: selectedTarget.coords.y,
      missionType: fleetType,
      troops: fleetTroops,
      targetId: selectedTarget.id || undefined,
      targetName: selectedTarget.planetName || `Sector [${selectedTarget.coords.x}, ${selectedTarget.coords.y}]`
    });
    setSelectedTarget(null);
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

  // Leaderboard formatting helpers
  const rankedState = Object.values(alliances) as Alliance[];  return (
    <div className="space-y-8 pb-24 font-mono">
      {/* Visual Navigation Pill Bars with Elegant Dark Accent */}
      <div className="flex bg-[#0A0F1D] p-1.5 rounded-xl border border-[#1E293B] shrink-0 text-xs">
        <button 
          onClick={() => { setSubTab('scanner'); handleScan(targetCoords.x, targetCoords.y); }}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-150 ${subTab === 'scanner' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'text-slate-400 hover:text-white'}`}
          title="Surveillance arrays: survey adjacent coordinates, sectors, and cosmic features"
        >
          <Radar size={13} className={subTab === 'scanner' && isScanning ? 'animate-spin' : ''} title="Scanning Radar sweep line" />
          <span>SURVEILLANCE</span>
        </button>
        <button 
          onClick={() => setSubTab('ranking')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-150 ${subTab === 'ranking' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'text-slate-400 hover:text-white'}`}
          title="Sovereignty Leaderboard: inspect combined firepower rank standings of galactic alliances"
        >
          <Trophy size={13} title="Trophy award leader prize" />
          <span>LEADERBOARD</span>
        </button>
        <button 
          onClick={() => setSubTab('comms')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-150 ${subTab === 'comms' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'text-slate-400 hover:text-white'}`}
          title="Alliance Core Hub: form coalitions, manage treaties and covenants"
        >
          <Users size={13} title="Group of astronauts Alliance icon" />
          <span>ALLIANCE HUB</span>
        </button>
        <button 
          onClick={() => setSubTab('news')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-150 ${subTab === 'news' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' : 'text-slate-400 hover:text-white'}`}
          title="Sector DEC_LINKS: review decrypted battle reports and public newsletters feed"
        >
          <Radio size={13} title="Radio waves beacon transceiver" />
          <span>DEC_LINKS</span>
        </button>
      </div>

      {/* SUB TAB 1: RADAR SCANNER */}
      {subTab === 'scanner' && (
        <div className="space-y-5">
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

                {scanResults.length === 0 ? (
                  <div className="py-12 border border-dashed border-[#1E293B] text-center rounded-xl space-y-3" title="Static scanner feed diagnostics: no active targets found in area">
                    <Radar size={40} className="mx-auto text-slate-600 animate-pulse text-cyan-500/40" title="Scanning wave telemetry sweep feedback" />
                    <p className="text-sm font-bold text-slate-350">No active sector signatures detected</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Coordinate index matches might be out of radar scanning bounds. Ready deep scanner upgrade units.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-4 pr-1">
                      {scanResults.slice(radarPage * 10, (radarPage + 1) * 10).map((target) => {
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
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border uppercase font-mono shadow-inner"
                                style={{ borderColor: target.factionColor, color: target.factionColor, backgroundColor: target.factionColor + '10' }}
                              >
                                {target.planetName[0]}
                              </div>
                              <div className="text-left">
                                <h4 className="font-bold text-slate-200 text-sm leading-tight">
                                  {target.planetName} <span className="text-xs text-cyan-400 font-mono ml-2">({(targetDist * 1.917).toFixed(2)} Space Miles)</span>
                                </h4>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {target.isHabitable ? (
                                    <span className="text-emerald-450 font-bold uppercase tracking-wide text-[10px] text-emerald-400 font-sans">Habitable Planetary Target</span>
                                  ) : (
                                    <>Commander: <span style={{ color: target.factionColor }} className="font-bold font-mono">{target.username}</span></>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Dropdown Box / Click Toggle Button */}
                            <button 
                              onClick={() => {
                                setExpandedTargets(prev => ({
                                  ...prev,
                                  [target.planetId]: !prev[target.planetId]
                                }));
                              }}
                              className="px-3 py-1.5 bg-[#0D1527] border border-[#1E293B] hover:border-[#38bdf8]/40 hover:bg-[#0F1E36] rounded-lg text-xs font-bold font-mono text-slate-300 hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>{isExpanded ? "Hide" : "Show"} Details</span>
                              {isExpanded ? <ChevronUp size={14} className="text-red-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
                            </button>
                          </div>

                          {/* Dropdown Details Box Content */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#1E293B]/60 text-left animate-fade-in space-y-3.5">
                              {/* Station Core Parameters */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-2.5 bg-[#030508]/60 border border-[#161E2E] rounded-xl">
                                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Alliance Rank</span>
                                  {target.isHabitable ? (
                                    <span className="font-bold text-emerald-400 text-xs uppercase text-emerald-400">Uncharted Planet</span>
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
                                      onClick={() => openDispatchFleet(target, 'recon')}
                                      className="px-3.5 py-2 bg-[#0D1527] border border-[#1E293B] text-slate-350 rounded-xl hover:bg-[#0F1E36] font-bold transition cursor-pointer text-[11px] font-mono"
                                    >
                                      Scout Sector
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
                                      onClick={() => openDispatchFleet(target, 'recon')}
                                      className="px-3.5 py-2 bg-slate-900 border border-[#1E293B] text-slate-300 rounded-xl hover:bg-slate-850 font-bold transition cursor-pointer text-[11px]"
                                    >
                                      Scout
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => openDispatchFleet(target, 'attack')}
                                      className="px-3.5 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 rounded-xl font-bold transition cursor-pointer text-[11px]"
                                    >
                                      Attack Station
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
                    {scanResults.length > 10 && (
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
                          Page <span className="text-cyan-400">{radarPage + 1}</span> of {Math.ceil(scanResults.length / 10)}
                        </span>

                        <button
                          type="button"
                          disabled={(radarPage + 1) * 10 >= scanResults.length}
                          onClick={() => setRadarPage(prev => prev + 1)}
                          className="px-3.5 py-2 bg-[#0D1527] border border-[#1E293B] text-slate-350 hover:text-cyan-400 hover:bg-[#0F1E36] disabled:opacity-30 disabled:pointer-events-none rounded-xl flex items-center gap-1.5 transition cursor-pointer font-bold"
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: LEADERBOARD */}
      {subTab === 'ranking' && (
        <div className="space-y-4">
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-1.5">
              <Trophy size={16} className="text-yellow-500 drop-shadow-[0_0_8px_#fbbf24]" />
              GALACTIC COMMAND LEADERBOARD
            </h3>
            
            {/* Simple instructions */}
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Rankings updated dynamically across space modules based on station pop growth, resource synthesis, and tactical fleet warfare.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-500 pb-2">
                    <th className="py-3">COMMANDER</th>
                    <th className="py-3 text-center">FACTION</th>
                    <th className="py-3 text-right">POPULATION</th>
                    <th className="py-3 text-right">RAIDS (HP KILLED)</th>
                    <th className="py-3 text-right">DEFENSE (HP SAVED)</th>
                    <th className="py-3 text-right">LOOT CORES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-medium">
                  <tr className="bg-indigo-950/15 text-indigo-300 border-b border-indigo-500/20">
                    <td className="py-3.5 px-2 flex items-center gap-1.5 font-bold">
                      <span className="text-yellow-400">★</span> {player.username} <span className="text-[10px] text-slate-500">(You)</span>
                    </td>
                    <td className="py-3.5 text-center" style={{ color: player.factionColor }}>{player.faction}</td>
                    <td className="py-3.5 text-right text-white font-bold">{player.scores.population.toLocaleString()}</td>
                    <td className="py-3.5 text-right text-red-400">{player.scores.attack.toLocaleString()}</td>
                    <td className="py-3.5 text-right text-blue-400">{player.scores.defence.toLocaleString()}</td>
                    <td className="py-3.5 text-right text-emerald-400">{player.scores.raiders.toLocaleString()}</td>
                  </tr>

                  {/* Simulated top other players */}
                  <tr className="border-b border-[#1E293B] hover:bg-white/5 transition duration-150">
                    <td className="py-3">VoidLord <span className="text-[10px] text-slate-500">[*AI*]</span></td>
                    <td className="py-3 text-center text-pink-500">Nexus Syndicate</td>
                    <td className="py-3 text-right text-slate-300">12,450</td>
                    <td className="py-3 text-right text-slate-300">540,000</td>
                    <td className="py-3 text-right text-slate-400">220,000</td>
                    <td className="py-3 text-right text-emerald-500">1,500,000</td>
                  </tr>
                  <tr className="border-b border-[#1E293B] hover:bg-white/5 transition duration-150">
                    <td className="py-3">Astraea <span className="text-[10px] text-slate-500">[*AI*]</span></td>
                    <td className="py-3 text-center text-cyan-400 font-bold">Solar Alliance</td>
                    <td className="py-3 text-right text-slate-300">10,200</td>
                    <td className="py-3 text-right text-slate-300">240,000</td>
                    <td className="py-3 text-right text-slate-400">450,000</td>
                    <td className="py-3 text-right text-emerald-500">800,000</td>
                  </tr>
                  <tr className="border-b border-[#1E293B] hover:bg-white/5 transition duration-150">
                    <td className="py-3">CosmoPirate <span className="text-[10px] text-slate-500">[*AI*]</span></td>
                    <td className="py-3 text-center text-yellow-500">Eclipse Vanguard</td>
                    <td className="py-3 text-right text-slate-300">8,500</td>
                    <td className="py-3 text-right text-slate-300">950,000</td>
                    <td className="py-3 text-right text-slate-400">15,000</td>
                    <td className="py-3 text-right text-emerald-500">3,450,000</td>
                  </tr>
                  <tr className="border-b border-[#1E293B] hover:bg-white/5 transition duration-150">
                    <td className="py-3">NovaSlayer <span className="text-[10px] text-slate-500">[*AI*]</span></td>
                    <td className="py-3 text-center text-yellow-500">Eclipse Vanguard</td>
                    <td className="py-3 text-right text-slate-300">6,100</td>
                    <td className="py-3 text-right text-slate-300">420,000</td>
                    <td className="py-3 text-right text-slate-400">90,000</td>
                    <td className="py-3 text-right text-emerald-500">2,100,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: ALLIANCE & CHAT */}
      {subTab === 'comms' && (
        <div className="space-y-6">
          {/* Alliance Command */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center justify-between">
              <span className="flex items-center gap-2"><Users size={16} /> Alliance Core Command</span>
              {player.allianceId && (
                <button 
                  onClick={onLeaveAlliance}
                  className="text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 transition duration-150 cursor-pointer"
                >
                  Leave Alliance
                </button>
              )}
            </h3>

            {player.allianceId ? (
              <div className="p-4 bg-[#05070A]/95 rounded-xl border border-[#1E293B] space-y-4 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-lg text-yellow-400 tracking-tight">[{alliances[player.allianceId]?.tag}] {alliances[player.allianceId]?.name}</span>
                    <p className="text-[11px] text-slate-500 mt-1">Founding Archon: {alliances[player.allianceId]?.leaderName}</p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 w-fit">
                    Role: {player.allianceRole?.toUpperCase()}
                  </span>
                </div>

                {/* Wars declared */}
                <div className="mt-4 pt-4 border-t border-[#1E293B] space-y-3">
                  <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <ShieldAlert size={12} /> ACTIVE DECLARATIONS OF WAR
                  </h4>
                  {alliances[player.allianceId]?.wars.length === 0 ? (
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">Corporate neutrality protocol active. Peace agreements registered with other outer-rim sectors.</p>
                  ) : (
                    <div className="space-y-2">
                      {alliances[player.allianceId]?.wars.map((war, idx) => (
                        <div key={idx} className="p-3 border border-red-900/40 bg-red-950/20 text-red-300 rounded-xl flex items-center justify-between text-[11px]">
                          <span>WAR DEC: TARGETING {war.targetAllianceName}</span>
                          <span className="text-red-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">WAR ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Option to declare war on SOLAR or VOID if leader */}
                  {player.allianceRole === 'leader' && (
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button 
                        onClick={() => onDeclareWar('alliance_empire')}
                        className="px-3 py-2 rounded-xl bg-red-950/30 text-red-400 border border-red-900/35 hover:bg-red-900/20 transition text-[10px] font-bold uppercase font-mono tracking-widest text-center cursor-pointer flex-1"
                      >
                        Declare War on SOLAR EMPIRE [SOL]
                      </button>
                      <button 
                        onClick={() => onDeclareWar('alliance_void')}
                        className="px-3 py-2 rounded-xl bg-red-[#05070A] text-red-400 border border-red-900/35 hover:bg-red-900/20 transition text-[10px] font-bold uppercase font-mono tracking-widest text-center cursor-pointer flex-1"
                      >
                        Declare War on THE VOID [VOID]
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Create alliance */}
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
                    Found Faction Alliance
                  </button>
                </form>

                {/* Join list */}
                <div className="p-5 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-4 font-mono">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><Users size={12} className="text-yellow-400" /> Join Existing</h4>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto text-xs pr-1">
                    {rankedState.map((alliance) => (
                      <div key={alliance.id} className="p-2.5 border border-[#1E293B] bg-[#0A0F1D] rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-yellow-400">[{alliance.tag}]</span>
                          <span className="text-slate-350 ml-2 font-bold uppercase">{alliance.name}</span>
                        </div>
                        <button
                          onClick={() => onJoinAlliance(alliance.id)}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold font-mono tracking-widest uppercase border border-cyan-500/30 rounded-lg cursor-pointer transition duration-150"
                        >
                          Enlist
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Social Chat */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="w-12 h-12 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400 animate-pulse">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-sm font-mono uppercase tracking-wider">Tactical Network Transceiver</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Outer-rim data relays are active. Establish a secure high-frequency stream window to transmit or receive encrypted signals.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
              <button 
                onClick={() => {
                  setCurrentChatChannel('global');
                  setActiveChatWindow('global');
                }}
                className="flex-1 px-4 py-3 bg-cyan-950/20 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition cursor-pointer"
              >
                Open Global System Chat
              </button>
              {player.allianceId && (
                <button 
                  onClick={() => {
                    setCurrentChatChannel('alliance');
                    setActiveChatWindow('alliance');
                  }}
                  className="flex-1 px-4 py-3 bg-yellow-950/20 hover:bg-yellow-500/10 text-yellow-500 hover:text-yellow-400 border border-yellow-500/25 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition cursor-pointer"
                >
                  Open Alliance Comms
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 4: NEWS TICKER & REPORTS */}
      {subTab === 'news' && (
        <div className="space-y-6">
          {/* Collapsible Drop Down Box 1: Combat Reports */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <div 
              onClick={() => setIsCombatOpen(!isCombatOpen)}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-800/20 p-2 rounded-lg transition"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2 font-mono" title="Secure sector combat encounter history and archives logs">
                <ShieldAlert size={16} title="Battle alert logs warning status" /> Military Combat Reports ({battleReports.filter(r => r.isRecon !== true).length})
              </h3>
              <div className="flex items-center gap-1">
                {isCombatOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {isCombatOpen && (
              <div className="pt-2 border-t border-white/5 space-y-4">
                {battleReports.filter(r => r.isRecon !== true).length === 0 ? (
                  <div className="py-10 border border-dashed border-[#1E293B] text-center rounded-xl">
                    <p className="text-xs text-slate-500 font-mono">No military battle engagements logged in this session.</p>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono text-xs">
                    {battleReports.filter(r => r.isRecon !== true).map((report) => {
                      const isExpanded = expandedCombatReports[report.id] || false;
                      const isPlayerAttacker = report.attackerId === player.id;
                      const isPlayerDefender = report.defenderId === player.id;
                      const roleLabel = isPlayerAttacker ? 'Attacked' : 'Defended against';
                      const counterpartyName = isPlayerAttacker ? report.defenderName : report.attackerName;
                      const outcomeText = report.winner === 'attacker' 
                        ? (isPlayerAttacker ? 'VICTORY' : 'DEFEAT') 
                        : (isPlayerDefender ? 'VICTORY' : 'DEFEAT');

                      // Calculate raid score (total stolen resources)
                      const raidScore = Object.values(report.resourcesStolen || {}).reduce((s: number, v: any) => s + (v || 0), 0);

                      return (
                        <div key={report.id} className="p-3 border border-[#1E293B] bg-[#05070A] rounded-xl space-y-2">
                          <div 
                            onClick={() => setExpandedCombatReports(prev => ({ ...prev, [report.id]: !isExpanded }))}
                            className="flex items-center justify-between cursor-pointer hover:bg-slate-900/40 p-1.5 rounded-lg transition"
                          >
                            <div className="flex flex-col gap-1 pr-4">
                              <span className="text-[11px] font-bold text-slate-200">
                                ⚔️ <span className={outcomeText === 'VICTORY' ? 'text-cyan-400' : 'text-red-400'}>[{outcomeText}]</span> {roleLabel} {counterpartyName} 
                                <span className="text-slate-500 ml-1.5 font-normal">({new Date(report.timestamp).toLocaleDateString()})</span>
                              </span>
                              <span className="text-[9.5px] text-slate-500">
                                Stolen: {raidScore.toLocaleString()} res | Points: <span className="text-amber-400 font-bold">{report.winner === 'attacker' ? (report.defenceHpKilled || 0) : (report.attackHpKilled || 0)} pts</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="text-slate-400 font-bold px-2 py-1 rounded border border-white/5 hover:text-white uppercase text-[9px] font-mono tracking-widest bg-slate-900 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="pt-3 border-t border-white/5 space-y-3.5">
                              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-white/5">
                                <span className="text-slate-500">{new Date(report.timestamp).toLocaleString()}</span>
                                <span className={`font-bold tracking-wider uppercase px-2 py-0.5 rounded ${report.winner === 'attacker' && report.attackerId === player.id ? 'text-red-400 bg-red-950/15 animate-pulse' : report.winner === 'defender' && report.defenderId === player.id ? 'text-cyan-400 bg-cyan-950/15 animate-pulse' : 'text-slate-400 bg-white/5'}`}>
                                  {report.winner.toUpperCase()} VICTORIOUS
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                                <div>
                                  <p className="font-bold text-red-100 text-red-400 uppercase tracking-wide">ATTACKER FLT: {report.attackerName}</p>
                                  <p className="text-slate-500 text-[10px] mt-0.5">Origin: [{report.attackerCoords.x}, {report.attackerCoords.y}]</p>
                                  <div className="mt-2 space-y-0.5">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Attacker Force:</p>
                                    <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 mt-1">
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
                                  <p className="font-bold text-cyan-100 text-cyan-400 uppercase tracking-wide">STATION FORCE: {report.defenderName}</p>
                                  <p className="text-slate-500 text-[10px] mt-0.5">Target: [{report.defenderCoords.x}, {report.defenderCoords.y}]</p>
                                  <div className="mt-2 space-y-0.5">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Defender Garrison:</p>
                                    <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 mt-1">
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
                              <div className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1.5 font-mono text-[10.5px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Raid Score (Resources Stolen):</span>
                                  <span className="font-bold text-emerald-400 font-mono">+{raidScore.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-[#1E293B]/60 pt-1.5">
                                  <span className="text-slate-400">Attack Points earned (defense force destroyed):</span>
                                  <span className="font-bold font-mono text-red-400">+{report.winner === 'attacker' ? (report.defenceHpKilled || 0).toLocaleString() : 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Defense Points earned (attacker fleet destroyed):</span>
                                  <span className="font-bold font-mono text-cyan-400">+{report.winner === 'defender' ? (report.attackHpKilled || 0).toLocaleString() : 0}</span>
                                </div>
                              </div>

                              {/* Resources stolen details */}
                              {report.winner === 'attacker' && (
                                <div className="p-3 bg-emerald-950/5 border border-emerald-900/20 text-emerald-400 rounded-lg">
                                  <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider mb-2">LOOT SALVAGED (CARGO CORES):</p>
                                  <div className="grid grid-cols-5 gap-1.5 text-center font-bold text-[9px] text-emerald-400">
                                    <div className="bg-[#05070A] p-1 rounded border border-white/5">W: {report.resourcesStolen.water.toLocaleString()}</div>
                                    <div className="bg-[#05070A] p-1 rounded border border-white/5">P: {report.resourcesStolen.plasma.toLocaleString()}</div>
                                    <div className="bg-[#05070A] p-1 rounded border border-white/5">F: {report.resourcesStolen.fuel.toLocaleString()}</div>
                                    <div className="bg-[#05070A] p-1 rounded border border-white/5">Fd: {report.resourcesStolen.food.toLocaleString()}</div>
                                    <div className="bg-[#05070A] p-1 rounded border border-white/5">R: {report.resourcesStolen.respirant.toLocaleString()}</div>
                                  </div>
                                </div>
                              )}

                              {/* Collateral damage report */}
                              {report.buildingDamage && report.buildingDamage.length > 0 && (
                                <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-300 rounded-lg">
                                  <p className="font-bold text-[10px] uppercase tracking-wider mb-1.5">BOMBER TANK COLLATERAL DEVASTATION:</p>
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
                )}
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
                    {battleReports.filter(r => r.isRecon === true).map((report) => {
                      const isExpanded = expandedIntelReports[report.id] || false;
                      const parsedTime = new Date(report.timestamp).toLocaleDateString();

                      return (
                        <div key={report.id} className="p-3 border border-[#1E293B] bg-[#05070A] rounded-xl space-y-2">
                          <div 
                            onClick={() => setExpandedIntelReports(prev => ({ ...prev, [report.id]: !isExpanded }))}
                            className="flex items-center justify-between cursor-pointer hover:bg-slate-900/40 p-1.5 rounded-lg transition"
                          >
                            <div className="flex flex-col gap-1 pr-4">
                              <span className="text-[11px] font-bold text-slate-200">
                                🛰️ Scout Recon Scan of <span className="text-cyan-400">{report.defenderName}</span> [{report.defenderCoords.x}, {report.defenderCoords.y}]
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
                            <div className="pt-3 border-t border-white/5 space-y-3.5">
                              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-white/5">
                                <span className="text-slate-500">{new Date(report.timestamp).toLocaleString()}</span>
                                <span className="font-bold tracking-wider uppercase px-2.5 py-0.5 rounded text-cyan-400 bg-cyan-950/20 border border-cyan-800/30">
                                  RECON INTEL COMPLETE
                                </span>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-200 text-xs uppercase">TARGET SIGNATURE: {report.defenderName} <span className="text-slate-400 font-bold font-mono">[{report.defenderCoords.x}, {report.defenderCoords.y}]</span></h4>
                                <p className="text-[11px] text-slate-400">Drone Squadron dispatched from Base Coordinate origin [{report.attackerCoords.x}, {report.attackerCoords.y}].</p>
                              </div>

                              {/* Visual troops scanned block (using EXACT Names we see on command center) */}
                              <div className="p-3 bg-cyan-950/5 border border-cyan-900/20 rounded-xl space-y-2 font-mono text-[11px]">
                                <p className="font-bold text-[10px] text-cyan-400 uppercase tracking-wider">Detected Defending Force Garrison:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Heavy Defender</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.defender ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Strike Interceptor</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.attacker ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Bomber Tank</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.tank ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Rogue Looter</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.looter ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Scout Drone</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.drone ?? 0} units</span>
                                  </div>
                                  <div className="bg-[#05070A]/80 p-2 border border-white/5 rounded-lg">
                                    <span className="text-slate-500 block">Settlement Ship</span>
                                    <span className="font-bold text-slate-200">{report.defenderInitialTroops?.settlementShip ?? 0} units</span>
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
              </div>
            )}
          </div>

          {/* Galaxy news events */}
          <div className="p-5 bg-[#0A0F1D]/80 border border-[#1E293B] rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-1.5 font-mono" title="Public broad transmission reports and sector updates">
              <Flag size={16} title="Broadcast military flag icon" /> BROADCAST WAVELENGTH FEED
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto text-xs pr-1 font-mono">
              {newsEvents.map((evt) => (
                <div key={evt.id} className="p-3 border border-[#1E293B] bg-[#05070A]/60 rounded-xl flex items-start gap-3">
                  <span className="text-[10px] text-slate-500 font-bold shrink-0 mt-0.5">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <div>
                    <span className="font-bold text-slate-300 uppercase tracking-wider">{evt.title}</span>
                    <p className="text-slate-400 leading-relaxed text-[11px] mt-1">{evt.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH SPACE FLEET DRAWER MODAL - STYLED ELEGANT DARK */}
      {selectedTarget && (() => {
        const hasDrone = (fleetTroops.drone || 0) >= 1;
        const hasCombat = (fleetTroops.attacker || 0) >= 1 || (fleetTroops.tank || 0) >= 1 || (fleetTroops.looter || 0) >= 1 || (fleetTroops.defender || 0) >= 1;
        const hasSettlement = (fleetTroops.settlementShip || 0) >= 1;

        const isMissionReady = 
          (fleetType === 'recon' && hasDrone) ||
          (fleetType === 'attack' && hasCombat) ||
          (fleetType === 'colonize' && hasSettlement);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-[#090D1A] border border-cyan-500/35 rounded-2xl p-6 space-y-4 font-mono shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-fade-in text-left">
              <div className="flex justify-between items-start pb-2.5 border-b border-[#1E293B]/60">
                <div>
                  <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest bg-cyan-950/25 border border-cyan-500/25 px-2.5 py-1 rounded-lg">FLEET DEPLOYMENT TRANSMISSION</span>
                  <h3 className="text-lg font-bold text-white mt-2 tracking-tight">{selectedTarget.planetName}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sector Coordinates: [{selectedTarget.coords.x}, {selectedTarget.coords.y}] &bull; Commander {selectedTarget.username}</p>
                </div>
                <button 
                  onClick={() => setSelectedTarget(null)}
                  className="text-slate-400 hover:text-white font-sans text-2xl cursor-pointer leading-none p-1 transition"
                >
                  &times;
                </button>
              </div>

              {/* Troop counts allocation panel - 2 COLUMNS, NO SCROLLING */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allocate Base Fleets & Crew:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {['drone', 'attacker', 'tank', 'looter', 'defender', 'settlementShip'].map((tId) => {
                    const count = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
                    
                    const dispatchLabel = 
                      tId === 'drone' ? 'Scout Drone' : 
                      tId === 'defender' ? 'Heavy Defender' : 
                      tId === 'looter' ? 'Rogue Looter' : 
                      tId === 'tank' ? 'Bomber Tank' : 
                      tId === 'settlementShip' ? 'Settlement Ship' :
                      'Strike Interceptor';
                      
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
                        <div className="flex items-center gap-0.5 shrink-0 bg-slate-950/40 p-0.5 rounded-lg border border-[#1E293B]/40">
                          <button 
                            type="button"
                            onClick={() => setFleetTroops(prev => ({ ...prev, [tId]: 0 }))}
                            className="px-1 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] text-slate-300 font-mono rounded"
                          >
                            Min
                          </button>
                          <input 
                            type="number"
                            min={0}
                            max={count}
                            value={fleetTroops[tId] || 0}
                            onChange={(e) => {
                              const val = Math.min(count, Math.max(0, parseInt(e.target.value, 10) || 0));
                              setFleetTroops(prev => ({ ...prev, [tId]: val }));
                            }}
                            className="w-8 text-center bg-[#05070A] border border-[#1E293B]/30 rounded font-mono text-[10px] text-white py-0.5 focus:outline-none focus:border-cyan-500 font-extrabold"
                          />
                          <button 
                            type="button"
                            disabled={count === 0}
                            onClick={() => setFleetTroops(prev => ({ ...prev, [tId]: count }))}
                            className="px-1 py-0.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/60 text-[8px] text-cyan-400 font-mono rounded disabled:opacity-30"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Mission Options - COMPLETELY CLICKABLE ALWAYS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Set Tactical Mission Objective:</span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Scout button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setFleetType('recon');
                      if ((fleetTroops.drone || 0) === 0 && (activePlanet.troops.drone || 0) > 0) {
                        setFleetTroops(prev => ({ ...prev, drone: 1 }));
                      }
                    }}
                    className={`p-2 py-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer ${
                      fleetType === 'recon'
                        ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 font-bold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                        : 'border-[#1E293B] bg-[#05070A] text-slate-400 hover:border-cyan-500/30 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">🛰️</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Scout</span>
                    <span className="text-[8px] text-cyan-400/80 font-semibold mt-0.5 bg-cyan-500/10 px-1 py-0.2 rounded">
                      {activePlanet.troops.drone > 0 ? 'AVAILABLE' : 'REQUISITE'}
                    </span>
                  </button>

                  {/* Attack button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setFleetType('attack');
                      if (!(fleetTroops.attacker > 0 || fleetTroops.tank > 0 || fleetTroops.looter > 0 || fleetTroops.defender > 0)) {
                        setFleetTroops(prev => ({
                          ...prev,
                          attacker: Math.min(5, activePlanet.troops.attacker || 0),
                          tank: Math.min(1, activePlanet.troops.tank || 0)
                        }));
                      }
                    }}
                    className={`p-2 py-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer ${
                      fleetType === 'attack'
                        ? 'border-red-500 bg-red-950/20 text-red-400 font-bold shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                        : 'border-[#1E293B] bg-[#05070A] text-slate-400 hover:border-red-500/30 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">⚔️</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Attack</span>
                    <span className="text-[8px] text-red-450 font-semibold mt-0.5 bg-red-500/10 px-1 py-0.2 rounded">
                      {activePlanet.troops.attacker > 0 || activePlanet.troops.tank > 0 ? 'AVAILABLE' : 'OFFENSIVE'}
                    </span>
                  </button>

                  {/* Settle button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setFleetType('colonize');
                      if ((fleetTroops.settlementShip || 0) === 0 && (activePlanet.troops.settlementShip || 0) > 0) {
                        setFleetTroops(prev => ({ ...prev, settlementShip: 1 }));
                      }
                    }}
                    className={`p-2 py-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer ${
                      fleetType === 'colonize'
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'border-[#1E293B] bg-[#05070A] text-slate-400 hover:border-emerald-500/30 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">🚀</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Settle</span>
                    <span className="text-[8px] text-emerald-450 font-semibold mt-0.5 bg-emerald-500/10 px-1 py-0.2 rounded">
                      {activePlanet.troops.settlementShip > 0 ? 'AVAILABLE' : 'COLONISE'}
                    </span>
                  </button>
                </div>
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
                  <span>Tactical Objective Match:</span>
                  <span className={`font-bold uppercase tracking-wide ${isMissionReady ? 'text-cyan-400' : 'text-amber-500 animate-pulse'}`}>
                    {fleetType === 'recon' ? 'RECON / TELEMETRY SURVEY' : fleetType === 'attack' ? 'OFFENSIVE COMBAT ASSAULT' : fleetType === 'colonize' ? 'DECOY PLANET OUTPOST SETTLEMENT' : 'INCOMPLETE'}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleLaunchFleet}
                disabled={!isMissionReady}
                className={`w-full px-5 py-3 text-[10px] uppercase font-black tracking-widest text-[#05070A] rounded-xl flex items-center justify-center gap-2 transition-all duration-155 ${
                  isMissionReady
                    ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] font-bold'
                    : 'bg-slate-800 border border-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Zap size={11} fill="currentColor" /> 
                {isMissionReady 
                  ? `LAUNCH ${fleetType === 'recon' ? 'Scout' : fleetType === 'attack' ? 'Attack' : 'Settle'} MISSION` 
                  : fleetType === 'recon' 
                    ? 'ALLOCATE AT LEAST 1 SCOUT DRONE TO DETECT SECTOR'
                    : fleetType === 'attack'
                      ? 'ALLOCATE AT LEAST 1 OFFENSIVE FORCE TO ATTACK DESTINATION'
                      : 'ALLOCATE EXACTLY 1 SETTLEMENT SHIP TO SECURE COLONY'}
              </button>
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
                  chatMessages
                    .filter(msg => msg.channel === activeChatWindow || (activeChatWindow === 'alliance' && player.allianceId && msg.channel === 'alliance' && msg.allianceTag === alliances[player.allianceId]?.tag))
                    .map((msg) => (
                      <div key={msg.id} className="p-3 border border-slate-900 rounded-xl bg-[#05070A]/60 hover:bg-[#05070A]/95 transition duration-150 leading-snug">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-600 text-[10px]">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                          {msg.allianceTag && (
                            <span className="text-yellow-400 font-bold">[{msg.allianceTag}]</span>
                          )}
                          <span className="font-bold underline" style={{ color: msg.senderFactionColor }}>{msg.senderName}</span>
                          <span className="text-slate-500 text-[10px]">({msg.senderFaction}):</span>
                        </div>
                        <p className="text-slate-350 mt-1 pl-2 border-l border-cyan-500/40">{msg.content}</p>
                      </div>
                    ))
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#070A15]/95 border border-amber-500/30 rounded-2xl p-6 space-y-5 font-mono shadow-[0_0_40px_rgba(245,158,11,0.15)] animate-fade-in text-left">
            <div className="flex justify-between items-start pb-3 border-b border-amber-500/20">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">COORDINATE INTELLIGENCE BRIEFING</span>
                <h3 className="text-lg font-bold text-white mt-3.5 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500 font-mono">📡</span> SATELLITE DECRYPTION ANALYSIS
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIntelReport(null);
                  setIntelError(null);
                  setIsFetchingIntel(false);
                }}
                className="text-slate-500 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isFetchingIntel && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <p className="text-sm font-bold text-amber-400 uppercase tracking-widest animate-pulse font-mono">DECRYPTING CO-ORDINATE ENVELOPE...</p>
                <p className="text-xs text-slate-500 font-sans">Routing signals through deep space array relay. Stand by.</p>
              </div>
            )}

            {intelError && (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                <span className="text-3xl text-red-500">⚠️</span>
                <p className="text-sm font-bold text-red-400 uppercase tracking-widest font-mono">DECRYPTION FAILURE</p>
                <p className="text-xs text-slate-400 bg-red-950/20 border border-red-900/40 p-3 rounded-lg max-w-sm font-sans">{intelError}</p>
                <button 
                  onClick={() => setIntelError(null)}
                  className="px-4 py-1.5 bg-red-950/30 border border-red-500/40 text-red-400 hover:bg-red-900/20 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Dismiss
                </button>
              </div>
            )}

            {intelReport && (
              <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
                <div className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                    <span className="text-amber-400 font-mono">SECTOR COORDINATES:</span> [{intelReport.coords.x}, {intelReport.coords.y}]
                  </p>
                  {intelReport.type === 'occupied' && (
                    <>
                      <p className="text-xs text-slate-405 font-sans"><span className="text-amber-400 font-mono">STATION NAME:</span> {intelReport.planetName}</p>
                      <p className="text-xs text-slate-405 font-sans"><span className="text-amber-400 font-mono">STATION COMMANDER:</span> {intelReport.commander}</p>
                    </>
                  )}
                  {intelReport.type === 'habitable' && (
                    <>
                      <p className="text-xs text-slate-405 font-sans"><span className="text-emerald-400 font-mono">PLANET CLASSIFICATION:</span> Uncharted Habitable Zone</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-emerald-950/25 border border-emerald-500/30 p-2.5 rounded-lg mt-1">{intelReport.description}</p>
                    </>
                  )}
                  {intelReport.type === 'void' && (
                    <>
                      <p className="text-xs text-slate-405 font-sans"><span className="text-cyan-400 font-mono">SECTOR CLASSIFICATION:</span> Deep Vacuum Void</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900 border border-slate-800 p-2.5 rounded-lg mt-1">{intelReport.description}</p>
                    </>
                  )}
                </div>

                {intelReport.type === 'occupied' && (
                  <>
                    {/* Buildings Levels */}
                    <div className="space-y-1.5 border-t border-[#1E293B]/60 pt-3">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 font-mono">STATION BLUEPRINTS & DETECTED SECTOR SIGNATURES</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
                          <span className="text-slate-405">Communications Hub</span>
                          <span className="font-bold text-amber-400">Lv {intelReport.buildings.commsHub || 1}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
                          <span className="text-slate-405">Radar Array</span>
                          <span className="font-bold text-amber-400">Lv {intelReport.buildings.radar || 1}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
                          <span className="text-slate-405">Research Center</span>
                          <span className="font-bold text-amber-400">Lv {intelReport.buildings.researchCenter || 1}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
                          <span className="text-slate-405">Command Center</span>
                          <span className="font-bold text-amber-400">Lv {intelReport.buildings.armyBase || 1}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center col-span-2">
                          <span className="text-slate-405">Repository</span>
                          <span className="font-bold text-amber-400">Lv {intelReport.buildings.repository || 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detected Garrison Troops */}
                    <div className="space-y-2 border-t border-[#1E293B]/60 pt-3">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-mono">SIGNAL INTERCEPT GARRISON ORBITALS</h4>
                      <div className="grid grid-cols-3 gap-1.5 text-xs text-center">
                        <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                          <span className="text-[10px] text-slate-500 block uppercase">Heavy Defender</span>
                          <span className="font-bold text-white text-xs">{intelReport.troops.defender || 0}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                          <span className="text-[10px] text-slate-500 block uppercase">Strike Interceptor</span>
                          <span className="font-bold text-white text-xs">{intelReport.troops.attacker || 0}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                          <span className="text-[10px] text-slate-500 block uppercase">Bomber Tank</span>
                          <span className="font-bold text-white text-xs">{intelReport.troops.tank || 0}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                          <span className="text-[10px] text-slate-500 block uppercase">Rogue Looter</span>
                          <span className="font-bold text-white text-xs">{intelReport.troops.looter || 0}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                          <span className="text-[10px] text-slate-500 block uppercase">Scout Drone</span>
                          <span className="font-bold text-white text-xs">{intelReport.troops.drone || 0}</span>
                        </div>
                        <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                          <span className="text-[10px] text-slate-500 block uppercase">Settlement Ship</span>
                          <span className="font-bold text-white text-xs">{intelReport.troops.settlementShip || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detected Stockpile */}
                    <div className="space-y-1.5 border-t border-[#1E293B]/60 pt-3">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 font-mono">ESTIMATED STORAGE RESOURCES</h4>
                      <div className="grid grid-cols-5 gap-1 text-[10.5px] text-center font-mono animate-pulse">
                        <div className="p-1 bg-cyan-950/10 border border-cyan-900/40 rounded">
                          <span className="text-cyan-400 text-[9px] block">WATER</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.water).toLocaleString()}</span>
                        </div>
                        <div className="p-1 bg-indigo-950/10 border border-indigo-900/40 rounded">
                          <span className="text-indigo-400 text-[9px] block">PLASMA</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.plasma).toLocaleString()}</span>
                        </div>
                        <div className="p-1 bg-purple-950/10 border border-purple-900/40 rounded">
                          <span className="text-purple-400 text-[9px] block">FUEL</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.fuel).toLocaleString()}</span>
                        </div>
                        <div className="p-1 bg-emerald-950/10 border border-emerald-900/40 rounded">
                          <span className="text-emerald-400 text-[9px] block">FOOD</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.food).toLocaleString()}</span>
                        </div>
                        <div className="p-1 bg-teal-950/10 border border-teal-900/40 rounded">
                          <span className="text-teal-400 text-[9px] block">AIR</span>
                          <span className="font-bold text-slate-300">{Math.round(intelReport.resources.respirant).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#1E293B]/60 gap-3">
              <button 
                onClick={() => {
                  setIntelReport(null);
                  setIntelError(null);
                  setIsFetchingIntel(false);
                }}
                className="px-5 py-2 bg-[#0F172A] border border-[#1E293B] text-slate-350 hover:text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer"
              >
                Close Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
