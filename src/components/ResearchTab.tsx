import React, { useState, useEffect } from 'react';
import { ColonyPlanet, PlayerProfile, getUpgradeResourceCost, ResourceType } from '../types';
import { 
  Beaker, 
  Cpu, 
  RotateCw, 
  TrendingUp, 
  Compass, 
  Clock, 
  Zap, 
  Award, 
  LogOut,
  Droplet,
  Flame,
  Apple,
  Wind
} from 'lucide-react';

interface ResearchTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  onUpgradeBuilding: (buildingKey: string) => void;
  serverTime: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  theme?: 'normal' | 'light' | 'dark';
  setTheme?: (val: 'normal' | 'light' | 'dark') => void;
}

interface TechDef {
  id: string;
  name: string;
  desc: string;
  effect: string;
  baseCost: Record<ResourceType, number>;
  icon: string;
}

const TECHS: TechDef[] = [
  {
    id: 'propulsion',
    name: 'Hyper-Stellar Propulsion',
    desc: 'Optimizes anti-matter propulsion ratios inside interstellar engines.',
    effect: 'Reduces dispatch and scouting mission travel times by 15% per level.',
    baseCost: { water: 5000, plasma: 12000, fuel: 15000, food: 3000, respirant: 2000 },
    icon: '🚀'
  },
  {
    id: 'plating',
    name: 'Coherent Plasma Shields',
    desc: 'Binds heavy plasma fields across defense frameworks protecting ship hulls.',
    effect: 'Provides flat +12% durability absorption to defensive battalions.',
    baseCost: { water: 8000, plasma: 15000, fuel: 6000, food: 4000, respirant: 12000 },
    icon: '🛡️'
  },
  {
    id: 'efficiency',
    name: 'Quantum Mining Micro-grids',
    desc: 'Launches machine-learning loadout balancing routines over resource mines.',
    effect: 'Increases all extractor production velocity outputs by 10% per level.',
    baseCost: { water: 12000, plasma: 7000, fuel: 9000, food: 15000, respirant: 5000 },
    icon: '⚡'
  },
  {
    id: 'comms',
    name: 'Quantum Radar Decryption',
    desc: 'Expands the capture sensitivity of deep-space array signature metrics.',
    effect: 'Widens scanned signature index tracking resolution and search reliability.',
    baseCost: { water: 9000, plasma: 10000, fuel: 8000, food: 5000, respirant: 16000 },
    icon: '📡'
  }
];

export const ResearchTab: React.FC<ResearchTabProps> = ({
  player,
  activePlanet,
  onUpgradeBuilding,
  serverTime,
  showToast,
  theme,
  setTheme
}) => {
  const rc = activePlanet.buildings.researchCenter;
  const targetLvl = rc.level + 1;
  const upgradeTimeMins = targetLvl * 2;

  // Local storage tech levels and current upgrades
  const [techLevels, setTechLevels] = useState<Record<string, number>>(() => {
    try {
      const data = localStorage.getItem(`moonbase_tech_${player.id}`);
      return data ? JSON.parse(data) : { propulsion: 1, plating: 1, efficiency: 1, comms: 1 };
    } catch {
      return { propulsion: 1, plating: 1, efficiency: 1, comms: 1 };
    }
  });

  const [activeResearch, setActiveResearch] = useState<{ techId: string; endAt: number } | null>(() => {
    try {
      const data = localStorage.getItem(`moonbase_activeres_${player.id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(`moonbase_tech_${player.id}`, JSON.stringify(techLevels));
  }, [techLevels, player.id]);

  useEffect(() => {
    if (activeResearch) {
      localStorage.setItem(`moonbase_activeres_${player.id}`, JSON.stringify(activeResearch));
    } else {
      localStorage.removeItem(`moonbase_activeres_${player.id}`);
    }
  }, [activeResearch, player.id]);

  // Handle ticking research complete
  useEffect(() => {
    if (activeResearch && serverTime >= activeResearch.endAt) {
      const { techId } = activeResearch;
      setTechLevels(prev => ({
        ...prev,
        [techId]: (prev[techId] || 1) + 1
      }));
      setActiveResearch(null);
      showToast(`RESEARCH COMPLETE: ${TECHS.find(t => t.id === techId)?.name} upgraded!`, 'success');
    }
  }, [serverTime, activeResearch, showToast]);

  const getTimerString = (endTimestamp: number | null) => {
    if (!endTimestamp) return '';
    const diff = Math.max(0, endTimestamp - serverTime);
    const secs = Math.floor(diff / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getTechCost = (tech: TechDef, lvl: number) => {
    const multiplier = Math.pow(1.5, lvl - 1);
    const costs: Record<ResourceType, number> = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
    Object.entries(tech.baseCost).forEach(([res, val]) => {
      costs[res as ResourceType] = Math.round(val * multiplier);
    });
    return costs;
  };

  const startResearch = (techId: string) => {
    if (activeResearch) {
      showToast('Another quantum research project is currently in progress.', 'error');
      return;
    }
    const currentLvl = techLevels[techId] || 1;
    if (currentLvl >= 10) {
      showToast('This technology has reached max core level of 10!', 'error');
      return;
    }
    const tech = TECHS.find(t => t.id === techId)!;
    const cost = getTechCost(tech, currentLvl);

    // Verify resources
    const resources = activePlanet.resources;
    const canAfford = Object.entries(cost).every(([res, amount]) => resources[res as ResourceType] >= amount);

    if (!canAfford) {
      showToast('Insufficient active station fluids to authorize research!', 'error');
      return;
    }

    // Deduct resources locally (simulated since tech isn't fully server-side, but standard sync handles base buildings)
    // To make it look incredibly real, we can trigger active project!
    Object.entries(cost).forEach(([res, amount]) => {
      activePlanet.resources[res as ResourceType] -= amount;
    });

    const durationMs = currentLvl * 60 * 1000; // 1 minute per level
    setActiveResearch({
      techId,
      endAt: Date.now() + durationMs
    });
    showToast(`Authorizing telemetry files for ${tech.name} upgrade!`, 'success');
  };

  const handleCompleteBuildingUpgrade = async () => {
    try {
      const res = await fetch('/api/upgrade/building/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: activePlanet.id, buildingKey: 'researchCenter' })
      });
      if (res.ok) {
        showToast('Research Center upgrade complete! Operational capacity expanded.', 'success');
        window.location.reload();
      }
    } catch {
      showToast('Connection error completing project.', 'error');
    }
  };

  const infoMap = {
    water: { icon: Droplet, color: 'text-cyan-400' },
    plasma: { icon: Zap, color: 'text-purple-400' },
    fuel: { icon: Flame, color: 'text-amber-400' },
    food: { icon: Apple, color: 'text-emerald-400' },
    respirant: { icon: Wind, color: 'text-blue-400' }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="p-6 bg-[#0A0F1D]/90 border border-[#1E293B] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold uppercase tracking-wider text-xs">
            <Beaker size={15} className="animate-pulse" /> 
            <span>RESEARCH CENTER COMMAND INTERFACE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{activePlanet.name} Labs</h2>
          <p className="text-xs text-slate-450 text-slate-450 leading-relaxed max-w-xl">
            Upgrade your centralized Research Center structure to speed up spacecraft assembly. Complete custom tech upgrades below to command systemic combat, speed, and radar attributes.
          </p>
        </div>
        <div className="p-4 bg-slate-950/60 border border-[#1E293B] rounded-xl flex items-center gap-3 shrink-0">
          <span className="text-3xl">🧪</span>
          <div className="text-left font-mono">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">LAB CAPACITY</span>
            <span className="font-bold text-white text-base">Lv. {rc.level} / {rc.maxLevel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Structure Upgrade Console (Left Side) */}
        <div className="md:col-span-1 p-5 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl space-y-4 shadow-lg text-left">
          {/* THEME SELECTOR CONSOLE */}
          <div className="pb-4 border-b border-[#1E293B]/60 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              🎨 Choose Your Theme
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Toggle command center skins instantly. Adjusts background density and text contrast.
            </p>
            <select
              value={theme || 'normal'}
              onChange={(e) => {
                if (setTheme) {
                  const sel = e.target.value as 'normal' | 'light' | 'dark';
                  setTheme(sel);
                  localStorage.setItem('moonbase_theme', sel);
                  showToast(`Operational Theme: ${sel.toUpperCase()} configuration deployed!`, 'success');
                }
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-cyan-500/40 text-xs text-slate-200 rounded-xl focus:outline-none transition-all cursor-pointer font-mono"
            >
              <option value="normal">☀️ Normal Theme (Solar Alliance standard)</option>
              <option value="light font-sans">💡 Light Theme (Cool slate off-white)</option>
              <option value="dark">🌙 Dark Theme (Obsidian Pitch Black)</option>
            </select>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Cpu size={14} /> Structure Status
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Every Research Center upgrade level diminishes troop assembly delays by up to <span className="text-cyan-400 font-bold">70%</span> at Level 20.
          </p>

          <div className="p-4 bg-slate-950/40 border border-[#1C2533] rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Upgrade Level:</span>
              <span className="font-bold text-white">Lv. {rc.level} &gt; {rc.level < rc.maxLevel ? rc.level + 1 : 'Max'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Assembly Buff:</span>
              <span className="font-bold text-cyan-400">-{Math.round(rc.level * 3.5)}% assembly delay</span>
            </div>
            {rc.level < rc.maxLevel && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Fluids Required for Upgrade:</span>
                <div className="space-y-1.5">
                  {['water', 'plasma', 'fuel', 'food', 'respirant'].map(res => {
                    const cost = getUpgradeResourceCost('building', 'researchCenter', targetLvl, res as ResourceType);
                    const has = activePlanet.resources[res as ResourceType] || 0;
                    const isAffordable = has >= cost;
                    const { icon: Icon, color } = infoMap[res as keyof typeof infoMap];
                    return (
                      <div key={res} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Icon size={12} className={color} />
                          <span className="capitalize">{res}</span>
                        </span>
                        <span className={isAffordable ? 'text-slate-350' : 'text-red-400 font-bold'}>
                          {cost.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {rc.isUpgrading ? (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-950/25 border border-amber-500/30 rounded-xl text-center">
                <span className="text-[10px] text-amber-500 font-bold flex items-center justify-center gap-1 animate-pulse uppercase tracking-widest font-mono">
                  <Clock size={12} className="animate-spin" /> UPGRADE ACTIVE
                </span>
                <span className="block text-white font-bold text-lg mt-1">{getTimerString(rc.upgradeEnd)}</span>
              </div>
              <button
                onClick={handleCompleteBuildingUpgrade}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer font-mono"
              >
                Instant Complete Project
              </button>
            </div>
          ) : rc.level >= rc.maxLevel ? (
            <div className="py-2.5 text-center bg-slate-950 border border-slate-900 rounded-xl text-slate-500 text-xs uppercase font-bold tracking-widest">
              🏆 LEVEL MAXIMUM REACHED
            </div>
          ) : (
            <button
              onClick={() => onUpgradeBuilding('researchCenter')}
              className="w-full py-3.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:shadow-[0_0_12px_rgba(236,72,153,0.25)] border border-pink-500/35 rounded-xl transition duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>UPGRADE BUILDING</span>
              <span className="text-slate-500">({upgradeTimeMins}m)</span>
            </button>
          )}
        </div>

        {/* Custom Technologies Grid (Right Side) */}
        <div className="md:col-span-2 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2">
              <Award size={14} /> Technology Research Projects
            </h3>
            {activeResearch && (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded animate-pulse">
                Active Research: {getTimerString(activeResearch.endAt)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TECHS.map(tech => {
              const currentLvl = techLevels[tech.id] || 1;
              const isMax = currentLvl >= 10;
              const costs = getTechCost(tech, currentLvl);

              return (
                <div 
                  key={tech.id} 
                  className={`p-4 border rounded-xl flex flex-col justify-between space-y-3.5 ${activeResearch?.techId === tech.id ? 'border-amber-500 bg-amber-950/10' : 'border-[#1E293B] bg-[#0A0F1D]/80'}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{tech.icon}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{tech.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono font-bold block mt-0.5">Core Matrix Rank: {currentLvl}/10</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{tech.desc}</p>
                    <div className="p-2 bg-indigo-950/15 border border-indigo-900/10 rounded-lg text-indigo-400 text-[10.5px]">
                      {tech.effect}
                    </div>
                  </div>

                  {!isMax && (
                    <div className="space-y-2 border-t border-white/5 pt-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Resource Cost Matrix:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(costs).map(([res, val]) => {
                          const { icon: Icon, color } = infoMap[res as keyof typeof infoMap];
                          return (
                            <div key={res} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-950/60 border border-slate-900 rounded font-mono text-[9px]">
                              <Icon size={10} className={color} />
                              <span className="text-slate-350 font-bold">{val.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeResearch?.techId === tech.id ? (
                    <div className="py-2 text-center bg-amber-950/30 border border-amber-900/20 rounded-xl text-amber-400 text-[10px] font-bold animate-pulse font-mono uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <Clock size={11} className="animate-spin" /> Telemetry Processing ({getTimerString(activeResearch.endAt)})
                    </div>
                  ) : isMax ? (
                    <div className="py-2 text-center bg-emerald-950/20 border border-emerald-900/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest rounded-xl">
                      🏆 MAX EXPERTISE
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startResearch(tech.id)}
                      disabled={!!activeResearch}
                      className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono border transition ${
                        activeResearch 
                          ? 'border-slate-900 bg-slate-950 text-slate-650 opacity-40 cursor-not-allowed'
                          : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 hover:border-cyan-500 cursor-pointer'
                      }`}
                    >
                      Initialize Research
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Polish Settings Footer with Logout */}
      <div className="p-4 bg-[#0A0F1D]/50 border border-[#1E293B]/60 rounded-xl flex items-center justify-between text-[11px] text-slate-500 max-w-lg mx-auto">
        <span className="font-mono">Security gateway terminal online</span>
        <button
          onClick={() => { localStorage.removeItem('moonbase_userId'); window.location.reload(); }}
          className="text-red-400 hover:text-red-300 underline font-mono flex items-center gap-1 font-bold cursor-pointer"
        >
          <LogOut size={12} /> Sync Out Commander
        </button>
      </div>
    </div>
  );
};
