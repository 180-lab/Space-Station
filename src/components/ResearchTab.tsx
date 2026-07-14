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
  onRefreshState?: () => void;
  isUpgrading?: boolean;
  onReturnToBase?: () => void;
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
    q: "What is the core objective of the game?",
    a: "Your objective is to build a mighty space-faring empire. You extract 5 essential resources (Water, Plasma, Fuel, Food, and Respirant), upgrade local facilities on your outposts, research global technologies, build fleets of space warships, and expand by colonizing habitable planets across the galaxy."
  },
  {
    q: "How do I colonize a new habitable planet or station?",
    a: "First, build exactly one (1) Settlement Ship in your War Room (CMD tab). Next, select your Radar Array under your Explore Tab and run a sector scan on your target coordinate to discover if it contains a habitable planet or station. Once scanned, go to the Galaxy Map (GLXY tab), choose 'Colonize' as your mission, and launch your Settlement Ship. Upon arrival, it settles and materializes your new colony!"
  },
  {
    q: "What are the rules for cancelling or rerouting an attack fleet?",
    a: "Strategic timing is critical: you can only abort/cancel or reroute an 'Attack' fleet during the first 45% of its journey. As soon as the fleet crosses the 45% travel mark, its quantum hyper-drives lock in—making it impossible to either cancel or reroute the squadron!"
  },
  {
    q: "Why is my troop garrison size decreasing on its own?",
    a: "Every soldier in your active garrison continuously consumes Water, Food, and Respirant (O2). If your local hourly production of these resources drops below zero and runs dry, your troops suffer severe attrition, slowly starving and dehydrating over time. Ensure your life-support extractors are upgraded or boosted!"
  },
  {
    q: "How does resource plunder and combat work?",
    a: "When you launch a successful offensive strike and defeat the defender's garrison, your surviving ships plunder a high fraction of all five stored resources (including water!) up to their carrying capacity, exceeding whatever resources are protected by their defensive Bunker."
  },
  {
    q: "Are research technology upgrades shared across my colonies?",
    a: "No. Each space station and colony outpost works independently based on its own local Research Center's upgrades. You must research technology projects (like Defense Shields, Manufacturing Speed, or Troop Speed) separately at each individual station to unlock those benefits locally."
  },
  {
    q: "How do I upgrade resource storage limits?",
    a: "Build and upgrade your local Silo structures. Each upgrade level expands your maximum storage capacity for all five resources on that specific planet."
  },
  {
    q: "What is the difference between Interceptors and Assault Drones?",
    a: "Interceptors are heavily-shielded defensive fighters built to absorb damage and protect your base. Assault Drones are fragile, high-firepower strike units designed for offensive operations."
  },
  {
    q: "How do map limits work, and what happens if I am out-of-bounds?",
    a: "The galactic map limits dynamically scale based on active player density. If map boundary adjustments ever put your station out-of-bounds, the server's relocation array automatically transfers your station to a safe coordinate inside the active grid with zero loss of progress or resources."
  },
  {
    q: "What is the benefit of joining or creating an Alliance?",
    a: "Joining or creating an Alliance unites you with other active commanders across the galaxy. This allows you to safely relocate fleets to friendly coordinates, coordinate joint military operations, and protect your outposts under a shared defensive network."
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
  localResources,
  onRefreshState,
  isUpgrading = false,
  onReturnToBase
}) => {
  const rc = activePlanet.buildings.researchCenter;
  const targetLvl = rc.level + 1;
  const upgradeTimeMins = targetLvl * 2;

  const allExtractorsLevelOneOrMore = (() => {
    const resourceKeys: ('water' | 'plasma' | 'fuel' | 'food' | 'respirant')[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
    return resourceKeys.every(rKey => {
      const list = activePlanet.mines[rKey];
      if (!list || list.length === 0) return false;
      return list.every(mine => mine.level >= 1);
    });
  })();

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
  const [isResearching, setIsResearching] = useState(false);

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const handleFocusIn = () => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        setIsTyping(true);
      }
    };
    const handleFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (!activeEl || (
          activeEl.tagName !== 'INPUT' && 
          activeEl.tagName !== 'TEXTAREA' && 
          !activeEl.hasAttribute('contenteditable')
        )) {
          setIsTyping(false);
        }
      }, 50);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Synchronize state when active planet changes, player's server-side tech levels, etc.
  useEffect(() => {
    const isFirstPlanet = player.planets[0]?.id === activePlanet.id;
    let serverTechs: Record<string, number> = {};
    if (player.techLevels && player.techLevels[activePlanet.id]) {
      serverTechs = player.techLevels[activePlanet.id];
    }

    try {
      const data = localStorage.getItem(`moonbase_tech_${player.id}_${activePlanet.id}`);
      let localTechs = data ? JSON.parse(data) : {};
      
      const mergedTechs = {
        defense_shields: isFirstPlanet ? 20 : 0,
        manufacturing_speed: isFirstPlanet ? 20 : 0,
        troop_speed: isFirstPlanet ? 20 : 0,
        ...localTechs,
        ...serverTechs
      };
      setTechLevels(mergedTechs);
      localStorage.setItem(`moonbase_tech_${player.id}_${activePlanet.id}`, JSON.stringify(mergedTechs));
    } catch {
      setTechLevels({
        defense_shields: isFirstPlanet ? 20 : 0,
        manufacturing_speed: isFirstPlanet ? 20 : 0,
        troop_speed: isFirstPlanet ? 20 : 0,
        ...serverTechs
      });
    }

    if (activePlanet.activeResearch) {
      setActiveResearch({
        techId: activePlanet.activeResearch.techId,
        endAt: activePlanet.activeResearch.endAt
      });
    } else {
      setActiveResearch(null);
    }
  }, [activePlanet.id, player.id, player.techLevels, activePlanet.activeResearch]);

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
      if (onRefreshState) {
        onRefreshState();
      }
    }
  }, [serverTime, activeResearch, showToast, onRefreshState]);

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

  const startResearch = async (techId: string) => {
    if (isResearching || isUpgrading) return;
    if (activeResearch) {
      showToast('Another quantum research project is currently in progress.', 'error');
      return;
    }
    const tech = TECHS.find(t => t.id === techId)!;
    const maxTechLvl = 20;
    const currentLvl = techLevels[techId] || 0;
    if (currentLvl >= maxTechLvl) {
      showToast(`This technology has reached max core level of ${maxTechLvl}!`, 'error');
      return;
    }

    setIsResearching(true);
    try {
      const res = await fetch('/api/upgrade/research/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          techId,
          currentLevel: currentLvl
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to start research project.', 'error');
        return;
      }

      showToast(`Authorizing telemetry files for ${tech.name} upgrade!`, 'success');
      localStorage.setItem(`tech_researched_${player.id}`, 'true');
      localStorage.setItem(`moonbase_activeres_${player.id}`, 'true');
      if (onRefreshState) onRefreshState();
    } catch {
      showToast('Connection error starting research.', 'error');
    } finally {
      setIsResearching(false);
    }
  };

  const queueResearch = async (techId: string) => {
    if (isResearching || isUpgrading) return;
    const tech = TECHS.find(t => t.id === techId)!;
    const maxTechLvl = 20;
    const currentLvl = techLevels[techId] || 0;
    
    let queuedCount = 0;
    if (activePlanet.activeResearch && activePlanet.activeResearch.techId === techId) {
      queuedCount++;
    }
    if (activePlanet.researchQueue) {
      queuedCount += activePlanet.researchQueue.filter(q => q.key === techId).length;
    }
    const targetLvl = currentLvl + queuedCount + 1;

    if (targetLvl > maxTechLvl) {
      showToast(`This technology has reached max core level of ${maxTechLvl}!`, 'error');
      return;
    }

    if ((player.credits || 0) < 25) {
      showToast('Insufficient Space Gold! Queuing research costs 25 Space Gold.', 'error');
      return;
    }

    setConfirmModal({
      title: 'CONFIRM SPACE GOLD TRANSACTION',
      message: `Are you sure you want to spend 25 Space Gold to queue the research of "${tech.name}" to level ${targetLvl}? (Please note: this is a beta version of the transaction.)`,
      onConfirm: async () => {
        setIsResearching(true);
        try {
          const res = await fetch('/api/upgrade/research/queue', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': player.id
            },
            body: JSON.stringify({
              planetId: activePlanet.id,
              techId,
              currentLevel: currentLvl
            })
          });
          const data = await res.json();
          if (!res.ok) {
            showToast(data.error || 'Failed to queue research project.', 'error');
            return;
          }

          showToast(`Successfully queued ${tech.name} upgrade to level ${targetLvl}!`, 'success');
          if (onRefreshState) onRefreshState();
        } catch {
          showToast('Connection error queuing research.', 'error');
        } finally {
          setIsResearching(false);
        }
      }
    });
  };

  const cancelQueueItem = async (index: number) => {
    if (isResearching || isUpgrading) return;
    setIsResearching(true);
    try {
      const res = await fetch('/api/upgrade/queue/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: activePlanet.id,
          queueIndex: index,
          queueType: 'research'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to cancel queued item.', 'error');
        return;
      }
      showToast('Queued project cancelled. Resources and 60% Space Gold refunded!', 'success');
      if (onRefreshState) onRefreshState();
    } catch {
      showToast('Connection error cancelling project.', 'error');
    } finally {
      setIsResearching(false);
    }
  };

  const handleCompleteBuildingUpgrade = async () => {
    if (isResearching || isUpgrading) return;
    setIsResearching(true);
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
    } finally {
      setIsResearching(false);
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
    <div className="max-w-4xl mx-auto space-y-1.5 font-mono animate-fade-in pb-16">
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
        <div className="flex flex-col gap-2 shrink-0 w-full md:w-48">
          {rc.level < rc.maxLevel ? (
            rc.isUpgrading ? (
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
                  <div className="text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-2.5 rounded-xl text-center animate-pulse">
                    ⏳ UPGRADING: {getTimerStringLocal(rc.upgradeEnd)}
                  </div>
                );
              })()
            ) : (
              (() => {
                const nextRcLvl = rc.level + 1;
                const rKeys: ResourceType[] = ['water', 'plasma', 'fuel', 'food', 'respirant'];
                const currentResources = localResources || activePlanet.resources;
                const rcUpgradeCost = {
                  water: getUpgradeResourceCost('building', 'researchCenter', nextRcLvl, 'water'),
                  plasma: getUpgradeResourceCost('building', 'researchCenter', nextRcLvl, 'plasma'),
                  fuel: getUpgradeResourceCost('building', 'researchCenter', nextRcLvl, 'fuel'),
                  food: getUpgradeResourceCost('building', 'researchCenter', nextRcLvl, 'food'),
                  respirant: getUpgradeResourceCost('building', 'researchCenter', nextRcLvl, 'respirant'),
                };
                const hasRcUpgradeResources = rKeys.every(rKey => 
                  (currentResources[rKey] || 0) >= rcUpgradeCost[rKey]
                );
                return (
                  <button
                    type="button"
                    onClick={() => onUpgradeBuilding('researchCenter')}
                    disabled={isUpgrading || !hasRcUpgradeResources}
                    className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex flex-col items-center justify-center transition duration-150 ${
                      hasRcUpgradeResources 
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer' 
                        : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                    title={`Cost: Water: ${rcUpgradeCost.water.toLocaleString()}, Plasma: ${rcUpgradeCost.plasma.toLocaleString()}, Fuel: ${rcUpgradeCost.fuel.toLocaleString()}, Food: ${rcUpgradeCost.food.toLocaleString()}, Respirant: ${rcUpgradeCost.respirant.toLocaleString()}`}
                  >
                    <span>🚀 Upgrade Lab</span>
                    <span className="text-[7.5px] opacity-90 font-semibold font-sans">
                      ({hasRcUpgradeResources ? 'Ready' : 'Insufficient Resources'})
                    </span>
                  </button>
                );
              })()
            )
          ) : (
            <div className="text-[10px] bg-slate-900 text-slate-500 border border-slate-800 px-3 py-2 rounded-xl text-center font-bold">
              MAX LEVEL ACHIEVED
            </div>
          )}
          <div className="p-4 bg-slate-950/60 border border-[#1E293B] rounded-xl flex items-center gap-3">
            <span className="text-3xl">🧪</span>
            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">LAB CAPACITY</span>
              <span className="font-bold text-white text-base">Lv. {rc.level} / {rc.maxLevel}</span>
            </div>
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
        <div className="space-y-1.5 text-left animate-fade-in">
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
          <div className="space-y-1.5 text-left">
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

            {/* Active and Queued Upgrades Dashboard inside Research Tab */}
            {activePlanet.researchQueue && activePlanet.researchQueue.length > 0 && (
              <div className="mb-4 p-4.5 bg-[#0D1527] border border-[#1E293B]/60 rounded-xl space-y-3 shadow-inner text-left">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">
                  📍 Active Research Queue Pipeline
                </span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {activePlanet.researchQueue
                    .map((q, idx) => ({ q, idx }))
                    .map(({ q, idx }, visualIdx) => {
                      const costRefund = Math.round((q.spaceGoldCost || 25) * 0.6);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-[#070B16] border border-[#1E293B]/40 rounded-lg">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-mono">
                              #{visualIdx + 1}
                            </span>
                            <div>
                              <p className="text-[11px] font-semibold text-slate-200 capitalize">
                                Research Upgrade: <span className="text-cyan-400 font-mono">{q.key.replace(/_/g, ' ')}</span> (Level {q.targetLevel})
                              </p>
                              <p className="text-[9.5px] text-slate-500 font-mono">
                                Queued with {q.spaceGoldCost || 25} Space Gold | Refund value: {costRefund} Gold
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => cancelQueueItem(idx)}
                            className="px-2 py-1 text-[9.5px] font-bold text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 bg-red-950/10 rounded cursor-pointer transition font-mono uppercase"
                          >
                            Cancel Queue
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TECHS.map(tech => {
                const currentLvl = techLevels[tech.id] || 0;
                const maxLvl = 20;
                const isMax = currentLvl >= maxLvl;
                const costs = getTechCost(tech, currentLvl);

                // Calculate next target level taking queue into account
                let queuedCount = 0;
                if (activeResearch && activeResearch.techId === tech.id) {
                  queuedCount++;
                }
                if (activePlanet.researchQueue) {
                  queuedCount += activePlanet.researchQueue.filter(q => q.key === tech.id).length;
                }
                const targetLvl = currentLvl + queuedCount + 1;

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
                      <div className="space-y-2">
                        <div className="py-2 text-center bg-amber-950/30 border border-amber-900/20 rounded-xl text-amber-400 text-[10px] font-bold animate-pulse font-mono uppercase tracking-widest flex items-center justify-center gap-1.5">
                          <Clock size={11} className="animate-spin" /> Telemetry Processing ({getTimerString(activeResearch.endAt)})
                        </div>
                        {targetLvl <= maxLvl && (
                          allExtractorsLevelOneOrMore ? (
                            <button
                              type="button"
                              onClick={() => queueResearch(tech.id)}
                              disabled={isResearching || isUpgrading}
                              className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/50 text-amber-400 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <span>Queue Level {targetLvl}</span>
                              <span className="text-[9px] text-amber-500 font-normal">(25 Gold)</span>
                            </button>
                          ) : (
                            <span className="w-full py-1.5 text-center text-[9.5px] font-bold tracking-widest text-red-400 uppercase font-mono bg-red-950/20 border border-red-500/30 px-2 rounded block" title="All 5 resource extractor pumps must be at least Level 1.">
                              🔒 EXTRACTORS REQUISITE
                            </span>
                          )
                        )}
                      </div>
                    ) : isMax ? (
                      <div className="py-2 text-center bg-emerald-950/20 border border-emerald-900/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest rounded-xl">
                        🏆 MAX EXPERTISE
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {targetLvl >= 2 && !allExtractorsLevelOneOrMore ? (
                          <div className="text-center py-2 px-3 border border-red-500/30 bg-red-950/20 rounded-xl space-y-1 font-mono">
                            <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase block">
                              🔒 UPGRADE LOCKED
                            </span>
                            <span className="text-[9px] text-slate-400 block leading-normal font-sans">
                              Need all 5 extractor pump types at Level 1+ on this station.
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startResearch(tech.id)}
                              disabled={!!activeResearch || isResearching || isUpgrading}
                              className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono border transition ${
                                (activeResearch || isResearching || isUpgrading)
                                  ? 'border-slate-900 bg-slate-950 text-slate-650 opacity-40 cursor-not-allowed'
                                  : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 hover:border-cyan-500 cursor-pointer'
                              }`}
                            >
                              Initialize Research
                            </button>
                            <button
                              type="button"
                              onClick={() => queueResearch(tech.id)}
                              disabled={isResearching || isUpgrading}
                              className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/50 text-amber-400 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <span>Queue Level {targetLvl}</span>
                              <span className="text-[9px] text-amber-500 font-normal">(25 Gold)</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Polish Settings Footer */}
      <div className="p-4 bg-[#0A0F1D]/50 border border-[#1E293B]/60 rounded-xl flex items-center justify-center text-[11px] text-slate-500 max-w-lg mx-auto">
        <span className="font-mono text-slate-500">Security gateway terminal online</span>
      </div>
      {confirmModal && (
        <div id="research-confirm-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md bg-[#0D1527] border ${confirmModal.title.includes('GOLD') ? 'border-amber-500/30' : 'border-red-500/30'} rounded-2xl p-6 flex flex-col space-y-4 shadow-2xl relative text-left`}>
            <h3 className={`text-sm font-extrabold ${confirmModal.title.includes('GOLD') ? 'text-amber-400' : 'text-red-400'} font-mono tracking-wider flex items-center gap-2`}>
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
                className={`px-4 py-2 ${confirmModal.title.includes('GOLD') ? 'bg-amber-950/40 hover:bg-amber-950 border border-amber-500/40 text-amber-400' : 'bg-red-950/40 hover:bg-red-950 border border-red-500/40 text-red-400'} rounded-lg text-xs font-mono font-bold transition cursor-pointer`}
              >
                CONFIRM ACTION
              </button>
            </div>
          </div>
        </div>
      )}

      {onReturnToBase && !isTyping && (
        <button
          type="button"
          onClick={onReturnToBase}
          className="fixed right-6 sm:right-8 bottom-20 z-50 flex items-center justify-center gap-2.5 px-5 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] transition duration-150 active:scale-95 group cursor-pointer animate-bounce"
          title="Back to Station Base"
        >
          <Compass size={18} className="animate-spin-slow group-hover:rotate-45 transition-transform" />
          <span className="text-xs uppercase tracking-widest font-black inline font-mono">RETURN TO BASE</span>
        </button>
      )}
    </div>
  );
};
