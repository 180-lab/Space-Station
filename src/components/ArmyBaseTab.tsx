import React, { useState } from 'react';
import { ColonyPlanet, PlayerProfile, BattleReport } from '../types';

const TROOP_NAME_MAPPING: Record<string, string> = {
  defender: 'Heavy Defender',
  attacker: 'Strike Interceptor',
  tank: 'Bomber Tank',
  looter: 'Rogue Looter',
  drone: 'Scout Drone',
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
}

const TROOP_DETAILS = {
  defender: {
    name: 'Heavy Defender',
    desc: 'Bunker defense infantry. High durability shield blocks planetary raids. Forced to defend the colony if under siege.',
    defenceHp: 18,
    attackHp: 10,
    carry: 6000,
    speed: 'Slow Tactical (19.2 space miles/hr)',
    costs: { water: 150, plasma: 0, fuel: 0, food: 200, respirant: 100 },
    icon: Shield,
    color: 'text-blue-400 bg-blue-950/30'
  },
  attacker: {
    name: 'Strike Interceptor',
    desc: 'Heavy strike fighter designed for interstellar sweeps. Low defense shields but delivers severe kinetic bombardments.',
    defenceHp: 9,
    attackHp: 30,
    carry: 4000,
    speed: 'Hyper-Cruise (32.0 space miles/hr)',
    costs: { water: 100, plasma: 150, fuel: 150, food: 100, respirant: 0 },
    icon: Sword,
    color: 'text-red-400 bg-red-950/30'
  },
  tank: {
    name: 'Bomber Tank',
    desc: 'Colossal planet-side artillery engines. Slow, but every 3 surviving tanks systematically demolish random levels of defender buildings.',
    defenceHp: 5,
    attackHp: 5,
    carry: 0,
    speed: 'Siege Crawl (9.6 space miles/hr)',
    costs: { water: 0, plasma: 200, fuel: 300, food: 0, respirant: 100 },
    icon: Crosshair,
    color: 'text-amber-500 bg-amber-950/30'
  },
  looter: {
    name: 'Rogue Looter',
    desc: 'Swift light frigate outfitted with massive cargo holds. High speed cargo looting of enemy planetary storage repositories.',
    defenceHp: 4,
    attackHp: 4,
    carry: 10000,
    speed: 'Super-Luminal (63.9 space miles/hr)',
    costs: { water: 250, plasma: 0, fuel: 100, food: 200, respirant: 0 },
    icon: Truck,
    color: 'text-emerald-400 bg-emerald-950/30'
  },
  drone: {
    name: 'Scout Drone',
    desc: 'Low-profile cloaked robotic drone. Elite speed indicators indicators designed for scouting, recon, and mapping targets.',
    defenceHp: 5,
    attackHp: 5,
    carry: 2000,
    speed: 'Ultralight Cruise (47.9 space miles/hr)',
    costs: { water: 100, plasma: 100, fuel: 0, food: 0, respirant: 50 },
    icon: Activity,
    color: 'text-purple-400 bg-purple-950/30'
  },
  settlementShip: {
    name: 'Settlement Ship',
    desc: 'Heavy colonization spacecraft. Limited to 1 Ship per base. Allows settling and colonizing uncharted habitable coordinates visible on your active radar scans.',
    defenceHp: 50,
    attackHp: 0,
    carry: 50000,
    speed: 'Tranquil Exploration (6.4 space miles/hr)',
    costs: { water: 1500, plasma: 1000, fuel: 2000, food: 1500, respirant: 1000 },
    icon: Rocket,
    color: 'text-teal-400 bg-teal-950/30'
  }
};

export const ArmyBaseTab: React.FC<ArmyBaseTabProps> = ({
  player,
  activePlanet,
  onTrainTroops,
  serverTime,
  battleReports
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    defender: 1,
    attacker: 1,
    tank: 1,
    looter: 1,
    drone: 1,
    settlementShip: 1
  });

  const [activeTroopInfo, setActiveTroopInfo] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'troops' | 'fabricate'>('troops');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [expandedReportRounds, setExpandedReportRounds] = useState<Record<string, number>>({});
  const [lastViewedReportTime, setLastViewedReportTime] = useState<number>(0);
  const [isBuildQueueOpen, setIsBuildQueueOpen] = useState(true);

  const handleQtyChange = (troopId: string, val: string) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
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

  // Calculate global combined statistics for the active army view
  const globalStats = {
    totalAttack: (activePlanet.troops.defender || 0) * TROOP_DETAILS.defender.attackHp +
                 (activePlanet.troops.attacker || 0) * TROOP_DETAILS.attacker.attackHp +
                 (activePlanet.troops.tank || 0) * TROOP_DETAILS.tank.attackHp +
                 (activePlanet.troops.looter || 0) * TROOP_DETAILS.looter.attackHp +
                 (activePlanet.troops.drone || 0) * TROOP_DETAILS.drone.attackHp +
                 (activePlanet.troops.settlementShip || 0) * TROOP_DETAILS.settlementShip.attackHp,
    totalDefence: (activePlanet.troops.defender || 0) * TROOP_DETAILS.defender.defenceHp +
                  (activePlanet.troops.attacker || 0) * TROOP_DETAILS.attacker.defenceHp +
                  (activePlanet.troops.tank || 0) * TROOP_DETAILS.tank.defenceHp +
                  (activePlanet.troops.looter || 0) * TROOP_DETAILS.looter.defenceHp +
                  (activePlanet.troops.drone || 0) * TROOP_DETAILS.drone.defenceHp +
                  (activePlanet.troops.settlementShip || 0) * TROOP_DETAILS.settlementShip.defenceHp,
    totalCarry: (activePlanet.troops.defender || 0) * TROOP_DETAILS.defender.carry +
                (activePlanet.troops.attacker || 0) * TROOP_DETAILS.attacker.carry +
                (activePlanet.troops.tank || 0) * TROOP_DETAILS.tank.carry +
                (activePlanet.troops.looter || 0) * TROOP_DETAILS.looter.carry +
                (activePlanet.troops.drone || 0) * TROOP_DETAILS.drone.carry +
                (activePlanet.troops.settlementShip || 0) * TROOP_DETAILS.settlementShip.carry
  };

  // Base training speed is reduced up to 70% based on Research Center level
  const rcLevel = activePlanet.buildings.researchCenter.level;
  const buildSpeedReduction = Math.min(0.7, 0.7 * (rcLevel / 20));
  const speedString = `Lab Speed Buff: +${Math.round(buildSpeedReduction * 100)}%`;

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

  return (
    <div className="space-y-6 pb-24">
      {/* Overview stats centerpiece */}
      <div className="p-6 rounded-xl border border-[#1E293B] bg-[#0A0F1D]/90 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-[#5bc0be] uppercase font-mono">Operations Wing</span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 leading-none tracking-tight">Fleet Commands Force</h2>
          <span className="text-xs text-indigo-400 font-mono flex items-center gap-2 mt-3 bg-white/5 border border-white/5 py-1 px-2.5 rounded-lg w-fit" title="Structural build speed limits applied configuration.">
            <Settings size={13} className="animate-spin text-indigo-400" title="Operations status setting: Rotating shows background task threads active." />
            {speedString}
          </span>
        </div>

        {/* COMBAT REPORTS ICON BUTTON TRIGGER */}
        <button
          onClick={() => {
            setLastViewedReportTime(Date.now());
            setShowReportsModal(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold shrink-0 shadow-lg justify-center w-full sm:w-auto relative cursor-pointer border transition duration-150 ${
            battleReports.filter(r => r.timestamp > lastViewedReportTime).length > 0 
              ? "bg-red-950/40 hover:bg-red-900/45 border-red-500/30 hover:border-red-500/65 text-red-400 hover:text-red-350"
              : "bg-emerald-950/40 hover:bg-emerald-900/45 border-emerald-500/30 hover:border-emerald-500/65 text-emerald-400 hover:text-emerald-350"
          }`}
          title="Decrypt and view local planetary security encounters."
        >
          {battleReports.filter(r => r.timestamp > lastViewedReportTime).length > 0 && <ShieldAlert size={14} className="animate-pulse" />}
          <span>ATTACK REPORTS</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            battleReports.filter(r => r.timestamp > lastViewedReportTime).length > 0
              ? "bg-red-500 text-slate-950"
              : "bg-emerald-500 text-slate-950"
          }`}>
            {battleReports.filter(r => r.timestamp > lastViewedReportTime).length}
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

      {/* Dual Sub-Tabs System */}
      <div className="flex border border-[#1E293B] bg-[#0A0F1D]/80 p-1.5 rounded-2xl gap-2 shadow-inner">
        <button
          onClick={() => setSubTab('troops')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all duration-250 cursor-pointer relative ${
            subTab === 'troops' 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Users size={15} className={`${subTab === 'troops' ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} title="Troops icon: overview overall space forces garrisons" />
          <span className="tracking-wider">TROOPS</span>
          
          {/* Badge displaying the total number of troops on the troops icon */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
            subTab === 'troops' 
              ? 'bg-cyan-400 text-slate-950 font-sans' 
              : 'bg-slate-800 text-slate-400'
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
      </div>


      {/* SUB-VIEW 1: TROOPS VIEW (See army, stats, division graphs) */}
      {subTab === 'troops' && (
        <div className="space-y-6 animate-fade-in">
          {/* Integrated Armed Force Tactical Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0A0F1D]/65 border border-[#1E293B] rounded-xl flex items-center gap-3.5" title="Combined Firepower: Total accumulated attack power rating across all spaceship units.">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400">
                <Sword size={16} title="Sword firepower icon" />
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Combined Firepower</div>
                <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                  {globalStats.totalAttack.toLocaleString()} <span className="text-[9px] font-bold text-red-500">HP</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0A0F1D]/65 border border-[#1E293B] rounded-xl flex items-center gap-3.5" title="Defense Absorption: Defense/shield strength point total absorbing enemy laser shots.">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/15 text-blue-400">
                <Shield size={16} title="Shield defensive icon" />
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Defense Absorption</div>
                <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                  {globalStats.totalDefence.toLocaleString()} <span className="text-[9px] font-bold text-blue-500">HP</span>
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
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono tracking-widest">Active Space Force Breakdown</h3>
            
            {totalTroopsCount === 0 ? (
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
                        <div className={`p-3 rounded-xl border border-[#1E293B] shrink-0 ${details.color}`} title={`${details.name}: ${details.desc}. Hover/long press for stats.`}>
                          <Icon size={18} title={`${details.name}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white font-mono">{details.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({percentageOfOverall.toFixed(1)}%)</span>
                          </div>
                          <div className="text-[11px] text-slate-450 mt-1 flex items-center gap-3 font-mono flex-wrap">
                            <span className="text-red-400 font-bold">{details.attackHp * count} <span className="text-[9px] text-slate-600">ATK</span></span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-blue-400 font-bold">{details.defenceHp * count} <span className="text-[9px] text-slate-600">SHLD</span></span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-emerald-400 font-bold">{(details.carry * count).toLocaleString()} <span className="text-[9px] text-slate-600">CAP</span></span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-amber-400 font-bold">{details.speed} <span className="text-[9px] text-slate-600">SPD</span></span>
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
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: FABRICATE RECRUITING MODULE (Original full control flow) */}
      {subTab === 'fabricate' && (
        <div className="space-y-4 animate-fade-in">
          {/* Active Training Queues Drop Down Box like resources */}
          <div className="border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-md">
            {/* Accordion Trigger */}
            <button 
              onClick={() => setIsBuildQueueOpen(!isBuildQueueOpen)}
              className="w-full p-4 flex items-center justify-between text-left transition hover:bg-white/[0.02] cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl border border-cyan-500/25 bg-cyan-950/40 text-cyan-400 shadow-inner" title="Orbital Build Queue status indicator">
                  <Clock size={18} className={activePlanet.trainingQueue.length > 0 ? "animate-pulse" : ""} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base font-mono">Orbital Build Queue</span>
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

          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Build Tactical Forces</h3>

          <div className="grid grid-cols-1 gap-5">
            {(Object.entries(TROOP_DETAILS) as [string, any][]).map(([tId, details]) => {
              const Icon = details.icon;
              const currentCount = activePlanet.troops[tId as keyof typeof activePlanet.troops] || 0;
              const isInfoActive = activeTroopInfo === tId;
              const qty = quantities[tId] || 1;

              return (
                <div 
                  key={tId}
                  className="p-5 border border-[#1E293B] rounded-xl bg-[#0A0F1D]/80 backdrop-blur-md flex flex-col gap-4.5 hover:border-white/10 transition duration-150"
                  id={`troop_card_${tId}`}
                >
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-3.5 rounded-xl border border-[#1E293B] shrink-0 shadow-lg select-none ${details.color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white text-base font-mono">{details.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-[#1E293B]">
                            SPACE FORCE: {currentCount}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                          Operational Speed: <span className="text-amber-400 font-bold">{details.speed}</span>
                        </p>
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
                      tId === 'defender' ? 0.5 :
                      tId === 'attacker' ? 1.0 :
                      tId === 'tank' ? 2.0 :
                      tId === 'looter' ? 1.5 :
                      tId === 'drone' ? 0.2 :
                      2.5; // settlementShip is 2.5

                    return (
                      <div className="p-4 rounded-xl border border-[#1E293B] bg-[#05070A] text-xs space-y-2.5 font-mono">
                        <p className="text-slate-400 font-sans leading-relaxed text-[11px] mb-3">{details.desc}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                            <span className="text-slate-500">Attack Rating:</span>
                            <span className="text-red-400 font-bold">{details.attackHp} HP</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                            <span className="text-slate-500">Shield Defense:</span>
                            <span className="text-blue-400 font-bold">{details.defenceHp} HP</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-sans sm:font-mono font-bold">
                            <span className="text-slate-500">Loot Capacity:</span>
                            <span className="text-emerald-400 font-bold">{details.carry.toLocaleString()} cargo</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                            <span className="text-slate-500">Speed Rating:</span>
                            <span className="text-yellow-400">{details.speed}</span>
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
                              💨 O2: {(waterVal * 4).toFixed(1).replace(/\.0$/, '')}/hr
                            </div>
                            <div className="py-1 px-1.5 rounded bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 font-bold">
                              🍏 Food: {(waterVal * 1.5).toFixed(2).replace(/\.00$/, '')}/hr
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
                              💨 O2: {(waterVal * 4 * currentCount).toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr
                            </div>
                            <div className="py-1 px-1.5 rounded bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 font-bold">
                              🍏 Food: {(waterVal * 1.5 * currentCount).toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr
                            </div>
                          </div>
                        </div>

                        {/* Grand Total Consumable Maintenance for ALL troops in the station */}
                        {(() => {
                          let stationTotalH2o = 0;
                          const specCosts = { defender: 0.5, attacker: 1.0, tank: 2.0, looter: 1.5, drone: 0.2, settlementShip: 2.5 };
                          Object.entries(activePlanet.troops).forEach(([tId, count]) => {
                            stationTotalH2o += (count as number) * (specCosts[tId as keyof typeof specCosts] || 0);
                          });
                          const stationTotalO2 = stationTotalH2o * 4;
                          const stationTotalFood = stationTotalH2o * 1.5;

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

                  {/* Costs grid */}
                  <div className="p-3 bg-[#05070A] rounded-xl border border-[#1E293B]">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Cost per Unit:</div>
                    <div className="grid grid-cols-5 gap-1.5 text-xs text-center font-mono">
                      <div className={`p-2 flex flex-col items-center justify-center rounded-xl border ${details.costs.water > 0 ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' : 'text-slate-600 border-white/5'}`} title={`Water input cost: ${details.costs.water} units`}>
                        <Droplet size={11} className="mb-1" title="Water icon indicator" />
                        <span className="text-[10px]">{details.costs.water}</span>
                      </div>
                      <div className={`p-2 flex flex-col items-center justify-center rounded-xl border ${details.costs.plasma > 0 ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' : 'text-slate-600 border-white/5'}`} title={`Plasma input cost: ${details.costs.plasma} units`}>
                        <Zap size={11} className="mb-1" title="Plasma energy icon indicator" />
                        <span className="text-[10px]">{details.costs.plasma}</span>
                      </div>
                      <div className={`p-2 flex flex-col items-center justify-center rounded-xl border ${details.costs.fuel > 0 ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-slate-600 border-white/5'}`} title={`Fuel input cost: ${details.costs.fuel} units`}>
                        <Flame size={11} className="mb-1" title="Thermonuclear fuel icon indicator" />
                        <span className="text-[10px]">{details.costs.fuel}</span>
                      </div>
                      <div className={`p-2 flex flex-col items-center justify-center rounded-xl border ${details.costs.food > 0 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-slate-600 border-white/5'}`} title={`Food input cost: ${details.costs.food} units`}>
                        <Apple size={11} className="mb-1" title="Synthesized food proteins icon indicator" />
                        <span className="text-[10px]">{details.costs.food}</span>
                      </div>
                      <div className={`p-2 flex flex-col items-center justify-center rounded-xl border ${details.costs.respirant > 0 ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 'text-slate-600 border-white/5'}`} title={`Respirant input cost: ${details.costs.respirant} units`}>
                        <Wind size={11} className="mb-1" title="O2 Atmosphere atmospheric respirant icon indicator" />
                        <span className="text-[10px]">{details.costs.respirant}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE TRAINING QUEUE PROGRESS WITH EXACT REMAINING SECONDS REMOVED TO CONCENTRATE IN UPPER COMPONENT */}

                  {/* Control dispatch footer */}
                  {(() => {
                    const maxAffordable = (() => {
                      let maxVal = Infinity;
                      Object.entries(details.costs).forEach(([res, amount]) => {
                        const costAmt = amount as number;
                        if (costAmt > 0) {
                          const available = activePlanet.resources[res as keyof typeof activePlanet.resources] || 0;
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
                              min={1}
                              max={999999}
                              value={qty}
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
                                     onTrainTroops(tId, num);
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
                          className="px-5 py-3 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/35 hover:border-cyan-500/55 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] uppercase tracking-widest font-mono rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
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
        </div>
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
              <button 
                onClick={() => setShowReportsModal(false)}
                className="text-slate-400 hover:text-white font-sans text-xl cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {battleReports.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-[#1E293B]">
                  <p className="text-xs text-slate-500">No military engagements logged in this session.</p>
                </div>
              ) : (
                battleReports.map((report) => {
                  const isPlayerAttacker = report.attackerId === player.id;
                  const isPlayerDefender = report.defenderId === player.id;
                  const outcomeText = report.winner === 'attacker' 
                    ? (isPlayerAttacker ? 'VICTORY' : 'DEFEAT') 
                    : (isPlayerDefender ? 'VICTORY' : 'DEFEAT');

                  return (
                    <div key={report.id} className="p-4 border border-[#1E293B] bg-[#05070A] rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-[10px] pb-2 border-b border-white/5">
                        <span className="text-slate-500">{new Date(report.timestamp).toLocaleString()}</span>
                        <span className={`font-black tracking-widest px-2 py-0.5 rounded ${
                          outcomeText === 'VICTORY' 
                            ? 'text-cyan-400 bg-cyan-950/20' 
                            : 'text-red-400 bg-red-950/20'
                        }`}>
                          {outcomeText}
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
                          <p className="font-bold text-cyan-00 text-cyan-400 uppercase tracking-wide">STATION FORCE: {report.defenderName}</p>
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
                      {(() => {
                        const raidScore = Object.values(report.resourcesStolen || {}).reduce((s: number, v: any) => s + (v || 0), 0);
                        return (
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
                        );
                      })()}

                      {/* Resources stolen details */}
                      {report.winner === 'attacker' && (
                        <div className="p-3 bg-emerald-950/5 border border-emerald-900/20 text-emerald-305 text-emerald-400 rounded-lg">
                          <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider mb-2">LOOT SALVAGED (CARGO CORES):</p>
                          <div className="grid grid-cols-5 gap-1.5 text-center font-bold text-[9px] text-emerald-450">
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
                })
              )}
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
    </div>
  );
};
