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
  Wind,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Search,
  HelpCircle
} from 'lucide-react';

interface ResearchTabProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  onUpgradeBuilding: (buildingKey: string) => void;
  serverTime: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  theme?: 'normal' | 'light' | 'dark';
  setTheme?: (val: 'normal' | 'light' | 'dark') => void;
  localResources?: Record<ResourceType, number>;
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
    id: 'defense_shields',
    name: 'Defense Shields',
    desc: 'Empowers deflector frequencies to absorb ballistic impact and thermal lasers.',
    effect: 'Provides up to an additional 15% Defense HP boost to defending troops when fully maxed (+0.75% per level).',
    baseCost: { water: 8000, plasma: 15000, fuel: 6000, food: 4000, respirant: 12000 },
    icon: '🛡️'
  },
  {
    id: 'manufacturing_speed',
    name: 'Manufacturing Speed Upgrade',
    desc: 'Streamlines automated pipeline replication and nanite assembly protocols inside the bases.',
    effect: 'Accelerates troop construction speed, reducing fabrication times by up to 35% when maxed (+1.75% per level).',
    baseCost: { water: 4000, plasma: 8000, fuel: 10000, food: 2000, respirant: 5000 },
    icon: '🏭'
  },
  {
    id: 'troop_speed',
    name: 'Troops Speed Upgrade',
    desc: 'Enhances thrust vectors and warp field matrices on all heavy land and air division troops.',
    effect: 'Boosts entire fleet and tactical scouting travel speeds by up to 35% when maxed.',
    baseCost: { water: 3000, plasma: 4000, fuel: 5000, food: 2000, respirant: 2000 },
    icon: '🏃‍♂️'
  }
];

const FAQS = [
  {
    q: "How do I acquire new stations/colonies?",
    a: "Build a Settlement Ship in the Shipyard (Army tab) and dispatch it to an uncolonized coordinate in the Galaxy Map. Once it arrives, load that planet in your Sector Hub to materialize your new outpost."
  },
  {
    q: "What happens if my resources run negative?",
    a: "Negative resource production (especially Water, Food, O2) will trigger troop attrition, causing your active garrison defense forces to starve and slowly perish over time."
  },
  {
    q: "How does troop water, respirant and food consumption work?",
    a: "Each active trooper continuously consumes Water, Respirant (O2), and Food. Larger garrisons require higher level local extractors or active production boosters to sustain without causing dehydration."
  },
  {
    q: "How do I expand my resource storage limits?",
    a: "Upgrade the Repository facility in your established structures. Each upgrade level expands your maximum warehouse limit for all local resources."
  },
  {
    q: "How can I speed up research and manufacturing?",
    a: "Researching the 'Manufacturing Speed Upgrade' accelerates troop training times. Complete upgrades in your Research laboratories or level up the Fabricator to speed up constructions."
  },
  {
    q: "What is structural combat defense vs strike firepower?",
    a: "Structural Defense HP determines how much damage your garrisons can absorb, and strike firepower determines how much damage they deal when defending against incoming hostiles."
  },
  {
    q: "Are technology level upgrades global?",
    a: "Yes! All scientific breakthroughs completed inside your Research terminal command interface apply as permanent global passive multipliers to all your current and future station bases."
  },
  {
    q: "Can I rename my space station outpost?",
    a: "Absolutely. Navigate to the Explore Tab, click on your facility name or the 'Rename' button at the top header, type a majestic sovereign name of your choice, and confirm."
  },
  {
    q: "How do I activate extraction overdrive production boosts?",
    a: "Click 'BOOST PRODUCTION' at the top of the Explore Tab (above the resources listings) to temporarily buy a 1.14x (14%) resource extraction factor booster for credits."
  },
  {
    q: "How do Alliance systems work?",
    a: "Alliances unite commanders. You can search, join, or register your own alliance brand under the Leaderboard or Settings configurations to establish protective defensive grids."
  },
  {
    q: "Where can I locate foreign sector coordinate targets?",
    a: "Navigate to the Galaxy Tab or the Sovereignty page, run telemetry radar sweeps to scan, or enter target coordinate vectors directly to discover habitable nodes or other bases."
  },
  {
    q: "How does battle plunder work?",
    a: "When you launch a successful offensive strike and defeat the defender's garrison, your surviving ships plunder a high fraction of their stored resources (excluding water) up to their carry limit."
  },
  {
    q: "Can I trade resources with other players?",
    a: "You cannot trade directly, but you can transport resources between your own colony outposts or coordinate joint military campaigns with alliance allies."
  },
  {
    q: "How do I reclaim supply rewards and daily crates?",
    a: "You can click on your daily reward crates inside the main station dashboard or construct a Supply Nexus facility to claim recurring supply reward drops."
  },
  {
    q: "What are the maximum levels for resource extractors?",
    a: "Your level limits depend on the outpost site potential: Max Level 25 for Main Station ★, Level 20 for Secondary Station ★★, and Level 15 for minor Outpost Colonies."
  },
  {
    q: "Why can I not build or upgrade research projects on my new colony?",
    a: "Each new colony outpost must possess its own active Research Center. Construct it in the 'Established Structures' lists under the Explore Tab to unlock labs."
  },
  {
    q: "What is the difference between Interceptors and Assault Drones?",
    a: "Interceptors are heavily shielded defensive fighters providing excellent protective parameters, while Assault Drones are high strike force weapon vessels built for offensive warp raids."
  },
  {
    q: "How does radar scanning search work?",
    a: "Construct and level up your local Radar Array to register wider sector scopes, detect incoming hostile raids, and unlock deep scans for deep planetary nodes."
  },
  {
    q: "What are warp thruster engine upgrades?",
    a: "Warp core research inside the technology listings increases travel speed, minimizing the transit delay when dispatching space fleets across galactic quadrant coordinate systems."
  },
  {
    q: "Can I delete my commander file or register under another name?",
    a: "Yes. Open the drop-down Profile menu, click on the red 'Log Out' button, and confirm 'De-synchronize' to clear local state credentials and create a brand new commander file."
  }
];

export const ResearchTab: React.FC<ResearchTabProps> = ({
  player,
  activePlanet,
  onUpgradeBuilding,
  serverTime,
  showToast,
  theme,
  setTheme,
  localResources
}) => {
  const rc = activePlanet.buildings.researchCenter;
  const targetLvl = rc.level + 1;
  const upgradeTimeMins = targetLvl * 2;

  // Local storage tech levels and current upgrades - starts fully maxed when game starts
  const [techLevels, setTechLevels] = useState<Record<string, number>>(() => {
    const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
    try {
      const data = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
      if (data) {
        const parsed = JSON.parse(data);
        // Map old levels to new levels if present
        if (parsed.plating && !parsed.defense_shields) {
          parsed.defense_shields = Math.min(20, parsed.plating * 2);
        }
        if (parsed.defense_shields === undefined) parsed.defense_shields = isFirstPlanet ? 20 : 0;
        if (parsed.manufacturing_speed === undefined) parsed.manufacturing_speed = isFirstPlanet ? 20 : 0;
        if (parsed.troop_speed === undefined) parsed.troop_speed = isFirstPlanet ? 20 : 0;
        return parsed;
      }
      return {
        defense_shields: isFirstPlanet ? 20 : 0,
        manufacturing_speed: isFirstPlanet ? 20 : 0,
        troop_speed: isFirstPlanet ? 20 : 0
      };
    } catch {
      return {
        defense_shields: isFirstPlanet ? 20 : 0,
        manufacturing_speed: isFirstPlanet ? 20 : 0,
        troop_speed: isFirstPlanet ? 20 : 0
      };
    }
  });

  const [activeResearch, setActiveResearch] = useState<{ techId: string; endAt: number } | null>(() => {
    try {
      const data = localStorage.getItem(`moonbase_activeres_${player.id}_${activePlanet.id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [subTab, setSubTab] = useState<'tech' | 'faq'>('tech');
  const [faqSearch, setFaqSearch] = useState('');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Synchronize state when active planet changes
  useEffect(() => {
    const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
    try {
      const data = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.defense_shields === undefined) parsed.defense_shields = isFirstPlanet ? 20 : 0;
        if (parsed.manufacturing_speed === undefined) parsed.manufacturing_speed = isFirstPlanet ? 20 : 0;
        if (parsed.troop_speed === undefined) parsed.troop_speed = isFirstPlanet ? 20 : 0;
        setTechLevels(parsed);
      } else {
        setTechLevels({
          defense_shields: isFirstPlanet ? 20 : 0,
          manufacturing_speed: isFirstPlanet ? 20 : 0,
          troop_speed: isFirstPlanet ? 20 : 0
        });
      }
    } catch {
      setTechLevels({
        defense_shields: isFirstPlanet ? 20 : 0,
        manufacturing_speed: isFirstPlanet ? 20 : 0,
        troop_speed: isFirstPlanet ? 20 : 0
      });
    }

    try {
      const data = localStorage.getItem(`moonbase_activeres_${player.id}_${activePlanet.id}`);
      setActiveResearch(data ? JSON.parse(data) : null);
    } catch {
      setActiveResearch(null);
    }
  }, [activePlanet.id, player.id]);

  useEffect(() => {
    localStorage.setItem(`moonbase_tech_${player.id}_${activePlanet.id}`, JSON.stringify(techLevels));
  }, [techLevels, player.id, activePlanet.id]);

  useEffect(() => {
    if (activeResearch) {
      localStorage.setItem(`moonbase_activeres_${player.id}_${activePlanet.id}`, JSON.stringify(activeResearch));
    } else {
      localStorage.removeItem(`moonbase_activeres_${player.id}_${activePlanet.id}`);
    }
  }, [activeResearch, player.id, activePlanet.id]);

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
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const hText = h === 1 ? 'hour' : 'hours';
    const mText = m === 1 ? 'minute' : 'minutes';
    const sText = s === 1 ? 'second' : 'seconds';
    return `${h} ${hText}, ${m} ${mText}, ${s} ${sText}`;
  };

  const getTechCost = (tech: TechDef, lvl: number) => {
    const scaleFactor = 1.15;
    const multiplier = Math.pow(scaleFactor, lvl - 1);
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
    const tech = TECHS.find(t => t.id === techId)!;
    const maxTechLvl = 20;
    const currentLvl = techLevels[techId] || 1;
    if (currentLvl >= maxTechLvl) {
      showToast(`This technology has reached max core level of ${maxTechLvl}!`, 'error');
      return;
    }
    const cost = getTechCost(tech, currentLvl);

    // Verify resources
    const resources = localResources || activePlanet.resources;
    const canAfford = Object.entries(cost).every(([res, amount]) => (resources[res as ResourceType] || 0) >= amount);

    if (!canAfford) {
      showToast('Insufficient active station fluids to authorize research!', 'error');
      return;
    }

    // Deduct resources locally (simulated since tech isn't fully server-side, but standard sync handles base buildings)
    // To make it look incredibly real, we can trigger active project!
    Object.entries(cost).forEach(([res, amount]) => {
      if (localResources) {
        localResources[res as ResourceType] -= amount;
      }
      activePlanet.resources[res as ResourceType] -= amount;
    });

    const durationMs = currentLvl * 60 * 1000; // 1 minute per level
    setActiveResearch({
      techId,
      endAt: Date.now() + durationMs
    });
    localStorage.setItem(`tech_researched_${player.id}`, 'true');
    localStorage.setItem(`moonbase_activeres_${player.id}`, 'true');
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

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-[#1E293B]/70 gap-2 mb-2 p-0.5 bg-slate-950/45 rounded-xl">
        <button
          type="button"
          onClick={() => setSubTab('tech')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition flex items-center justify-center gap-2 ${
            subTab === 'tech'
              ? 'bg-cyan-950/50 border border-cyan-500/35 text-cyan-400 font-extrabold shadow-[0_0_8px_rgba(34,211,238,0.15)]'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🔬 Quantum Upgrades
        </button>
        <button
          type="button"
          id="faq-subtab-btn"
          onClick={() => setSubTab('faq')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition flex items-center justify-center gap-2 ${
            subTab === 'faq'
              ? 'bg-cyan-950/50 border border-cyan-500/35 text-cyan-400 font-extrabold shadow-[0_0_8px_rgba(34,211,238,0.15)]'
              : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ❓ Academy FAQ & Database (20)
        </button>
      </div>

      {subTab === 'faq' ? (
        <div className="space-y-4 text-left animate-fade-in">
          {/* FAQ database search box and title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E293B]/60 pb-3 gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2">
              <HelpCircle size={14} className="text-cyan-400 animate-pulse" /> Commander Tactical Database
            </h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={13} className="text-slate-500" />
              </span>
              <input
                id="faq-search-input"
                type="text"
                placeholder="Query academy database..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono transition"
              />
            </div>
          </div>

          {/* FAQ Accordions List */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {(() => {
              const filteredFaqs = FAQS.filter(
                f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
                     f.a.toLowerCase().includes(faqSearch.toLowerCase())
              );

              if (filteredFaqs.length === 0) {
                return (
                  <div className="text-center py-10 border border-dashed border-[#1E293B]/50 rounded-xl bg-[#030712]/30">
                    <p className="text-xs text-slate-500 font-mono">No database records found matching key phrase.</p>
                  </div>
                );
              }

              return filteredFaqs.map((faq) => {
                const originalIndex = FAQS.indexOf(faq);
                const isExpanded = faqOpenIndex === originalIndex;

                return (
                  <div 
                    key={originalIndex} 
                    id={`faq-item-${originalIndex}`}
                    className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                      isExpanded 
                        ? 'border-cyan-500/35 bg-[#090E1B]' 
                        : 'border-[#1E293B]/60 bg-[#0A0F1D]/40 hover:border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      id={`faq-btn-${originalIndex}`}
                      onClick={() => setFaqOpenIndex(isExpanded ? null : originalIndex)}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-cyan-400 font-mono font-bold shrink-0 mt-0.5">
                          {String(originalIndex + 1).padStart(2, '0')}.
                        </span>
                        <span className="text-xs font-semibold text-white tracking-wide leading-relaxed">
                          {faq.q}
                        </span>
                      </div>
                      <span className="text-slate-500 shrink-0 ml-3">
                        {isExpanded ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4.5 pt-1 text-slate-300 text-[11px] font-sans leading-relaxed border-t border-white/5 bg-slate-950/20 pl-8 select-text">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        rc.level === 0 ? (
          <div className="p-8 border border-red-500/20 bg-[#0A0F1D]/80 backdrop-blur-md rounded-2xl text-center space-y-4 max-w-xl mx-auto shadow-xl">
            <div className="text-4xl text-red-400">🧪</div>
            <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-widest font-mono">
              RESEARCH CENTER OFFLINE
            </h3>
            <p className="text-xs text-slate-350 font-sans leading-relaxed">
              This secondary colony station does not possess an active command laboratory. 
              Navigate to your <strong>Established Structures</strong> or <strong>Unlocked Blueprints</strong> in the station commands tab to construct a Research Center first before authorizing advanced scientific research.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#1E293B]/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2">
                <Award size={14} /> Technology Research Projects
              </h3>
              {activeResearch && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded animate-pulse">
                  Active Research: {getTimerString(activeResearch.endAt)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TECHS.map(tech => {
                const currentLvl = techLevels[tech.id] || 1;
                const maxLvl = 20;
                const isMax = currentLvl >= maxLvl;
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
                            <span className="text-[10px] text-slate-500 font-mono font-bold block mt-0.5">Core Matrix Rank: {currentLvl}/{maxLvl}</span>
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
        )
      )}

      {/* Polish Settings Footer with Logout */}
      <div className="p-4 bg-[#0A0F1D]/50 border border-[#1E293B]/60 rounded-xl flex items-center justify-between text-[11px] text-slate-500 max-w-lg mx-auto">
        <span className="font-mono">Security gateway terminal online</span>
        <button
          onClick={() => {
            setConfirmModal({
              title: 'CONFIRM SESSION DE-SYNCHRONIZATION',
              message: 'Are you sure you want to log out of your session? Your current account session reference will be purged from LocalStorage and you will be re-routed to registration.',
              onConfirm: () => {
                localStorage.removeItem('moonbase_userId');
                window.location.reload();
              }
            });
          }}
          className="text-red-400 hover:text-red-300 underline font-mono flex items-center gap-1 font-bold cursor-pointer"
        >
          <LogOut size={12} /> Logout
        </button>
      </div>
      {confirmModal && (
        <div id="research-confirm-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1527] border border-red-500/30 rounded-2xl p-6 flex flex-col space-y-4 shadow-2xl relative text-left">
            <h3 className="text-sm font-extrabold text-red-400 font-mono tracking-wider flex items-center gap-2">
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
                className="px-4 py-2 bg-red-950/40 hover:bg-red-950 border border-red-500/40 text-red-400 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
              >
                CONFIRM ACTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
