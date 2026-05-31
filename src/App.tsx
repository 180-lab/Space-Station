import React, { useState, useEffect } from 'react';
import { 
  Alliance, 
  BattleReport, 
  ChatMessage, 
  ColonyPlanet, 
  FleetMission, 
  NewsEvent, 
  PlayerProfile, 
  ResourceType 
} from './types';
import { ExploreTab } from './components/ExploreTab';
import { ArmyBaseTab } from './components/ArmyBaseTab';
import { GalaxyTab } from './components/GalaxyTab';
import { ResearchTab } from './components/ResearchTab';
import { SettingsTab } from './components/SettingsTab';
import { 
  Droplet, 
  Flame, 
  Zap, 
  Apple, 
  Wind, 
  Sun, 
  Moon, 
  Gift, 
  ShoppingBag, 
  ShieldAlert, 
  Info,
  Globe,
  Settings,
  Beaker,
  Coins,
  CreditCard,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

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

export default function App() {
  // Authentication & player session
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('moonbase_userId'));
  const [username, setUsername] = useState('');
  const [faction, setFaction] = useState('Solar Alliance');
  const [showSignup, setShowSignup] = useState(true);

  // Synced state from server
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [alliances, setAlliances] = useState<Record<string, Alliance>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [fleets, setFleets] = useState<FleetMission[]>([]);
  const [battleReports, setBattleReports] = useState<BattleReport[]>([]);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active Screen / Navigation Tab selector: 'explore' | 'army' | 'galaxy' | 'research' | 'settings'
  const [activeTab, setActiveTab] = useState<'explore' | 'army' | 'galaxy' | 'research' | 'settings'>('explore');

  // Selected active colony planet ID
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);

  // Set initial selected planet or sync when planets lists scale
  useEffect(() => {
    if (player && player.planets.length > 0) {
      if (!selectedPlanetId || !player.planets.some(pl => pl.id === selectedPlanetId)) {
        setSelectedPlanetId(player.planets[0].id);
      }
    }
  }, [player]);

  // Aesthetic and Theme config
  const [theme, setTheme] = useState<'normal' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('moonbase_theme') as 'normal' | 'light' | 'dark') || 'normal';
  });
  const [skinId, setSkinId] = useState<string>('default'); // Modern Cosmetics
  const [fontSizeScale, setFontSizeScale] = useState<string>(() => {
    return localStorage.getItem('moonbase_font_size') || '100%';
  });
  const [isScrolling, setIsScrolling] = useState(false);

  // Apply Font Size accessibility scaling
  useEffect(() => {
    localStorage.setItem('moonbase_font_size', fontSizeScale);
    let size = '16px';
    if (fontSizeScale === '75%') {
      size = '12px';
    } else if (fontSizeScale === '50%') {
      size = '8px';
    }
    document.documentElement.style.fontSize = size;
  }, [fontSizeScale]);

  // Monitor screen scrolling, touch gestures, and pointer position near bottom
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const showTabsHandler = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 2500); // Hide after 2.5s of flat inactivity
    };

    // If page is completely short and lacks any scroll height, keep it open so they can navigate
    const checkScrollable = () => {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
      if (!isScrollable) {
        setIsScrolling(true);
      }
    };

    // Reveal toolbar if touch moves or scroll acts or mouse gets close to the bottom 80px
    const handlePointerMove = (e: PointerEvent) => {
      if (e.clientY > window.innerHeight - 80) {
        showTabsHandler();
      }
    };

    window.addEventListener('scroll', showTabsHandler, { passive: true });
    window.addEventListener('wheel', showTabsHandler, { passive: true });
    window.addEventListener('touchmove', showTabsHandler, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', checkScrollable);

    // Initial load check and flash to show accessibility
    checkScrollable();
    showTabsHandler();

    return () => {
      window.removeEventListener('scroll', showTabsHandler);
      window.removeEventListener('wheel', showTabsHandler);
      window.removeEventListener('touchmove', showTabsHandler);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', checkScrollable);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Smooth client-side local ticker for ticking resources in real time!
  const [localResources, setLocalResources] = useState<Record<ResourceType, number>>({
    water: 0,
    plasma: 0,
    fuel: 0,
    food: 0,
    respirant: 0
  });

  // Local storage load
  useEffect(() => {
    if (userId) {
      fetchState();
    }
  }, [userId]);

  // Unified status poller (triggered every 3 seconds)
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      fetchState();
    }, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  // Smooth real-time local millisecond resource increments trigger (every 100ms)
  useEffect(() => {
    if (!player) return;
    const planet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    if (!planet) return;

    const capacity = Math.round(10000 * Math.pow(500, (planet.buildings.repository.level - 1) / 44));
    const isOtherMaxed = 
      planet.resources.plasma >= capacity &&
      planet.resources.fuel >= capacity &&
      planet.resources.food >= capacity &&
      planet.resources.respirant >= capacity;

    // Calculate total hourly rates
    const rates = { water: 0, plasma: 0, fuel: 0, food: 0, respirant: 0 };
    (Object.keys(rates) as ResourceType[]).forEach(res => {
      if (isOtherMaxed) {
        rates[res] = res === 'water' ? 84000 : 42000;
      } else {
        rates[res] = planet.mines[res].reduce((sum, m) => sum + (m.level / 15) * (res === 'water' ? 14000 : 8333.33), 0);
      }
    });

    // Take water, respirant, and food troops consumption rate into account (Respirant is 0.4x water, Food is 0.15x)
    let waterConsumptionPerHour = 0;
    const troopConsumption = { defender: 0.5, attacker: 1.0, tank: 2.0, looter: 1.5, drone: 0.2, settlementShip: 2.5 };
    Object.entries(planet.troops).forEach(([tId, count]) => {
      waterConsumptionPerHour += (count as number) * (troopConsumption[tId as keyof typeof troopConsumption] || 0);
    });
    rates.water -= waterConsumptionPerHour;
    rates.respirant -= waterConsumptionPerHour * 0.4;
    rates.food -= waterConsumptionPerHour * 0.15;

    const resourceDeltaPer100ms = {
      water: (rates.water / 3600) * 0.1,
      plasma: (rates.plasma / 3600) * 0.1,
      fuel: (rates.fuel / 3600) * 0.1,
      food: (rates.food / 3600) * 0.1,
      respirant: (rates.respirant / 3600) * 0.1
    };

    const ticker = setInterval(() => {
      setLocalResources(prev => {
        const capacity = Math.round(10000 * Math.pow(500, (planet.buildings.repository.level - 1) / 44));
        const updated = { ...prev };
        (Object.keys(updated) as ResourceType[]).forEach(res => {
          const newVal = prev[res] + resourceDeltaPer100ms[res];
          updated[res] = Math.max(0, Math.min(capacity, newVal));
        });
        return updated;
      });
    }, 100);

    return () => clearInterval(ticker);
  }, [player, selectedPlanetId]);

  // Set initial local values upon fetching new server state
  useEffect(() => {
    if (player) {
      const planet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
      if (planet) {
        setLocalResources({
          water: planet.resources.water,
          plasma: planet.resources.plasma,
          fuel: planet.resources.fuel,
          food: planet.resources.food,
          respirant: planet.resources.respirant
        });
      }
    }
  }, [player, selectedPlanetId]);

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch full MMO State API
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state', {
        headers: {
          'x-user-id': userId || ''
        }
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        setAlliances(data.alliances);
        setChatMessages(data.chatMessages);
        setFleets(data.fleets);
        setBattleReports(data.battleReports);
        setNewsEvents(data.newsEvents);
        setServerTime(data.serverTime);
      } else {
        localStorage.removeItem('moonbase_userId');
        setUserId(null);
      }
    } catch (err: any) {
      if (err?.message?.includes('security check') || err?.message?.includes('cookie') || err?.message?.includes('stabilizing')) {
        console.warn("Connection warning:", err.message);
      } else {
        console.error(err);
      }
    }
  };

  // Auth: Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, faction })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem('moonbase_userId', data.player.id);
        setUserId(data.player.id);
        setPlayer(data.player);
        showToast(`Commander registration approved! Welcome of Eclipse.`, 'success');
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('Communications failure with space gateway.', 'error');
    }
  };

  // Auth: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem('moonbase_userId', data.player.id);
        setUserId(data.player.id);
        setPlayer(data.player);
        showToast(`Welcome back, Commander! Systems online.`, 'success');
      } else {
        showToast(data.error || 'Commander not registered', 'error');
      }
    } catch (err) {
      showToast('Communications failure.', 'error');
    }
  };

  // Actions: Upgrade Mine
  const handleUpgradeMine = async (resType: ResourceType, mineIndex: number) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    try {
      const res = await fetch('/api/upgrade/mine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: currentPlanet.id, resType, mineIndex })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast('Extractor upgrade project initiated and scheduled!', 'success');
      } else {
        showToast(data.error || 'Upgrade blocked', 'error');
      }
    } catch (err) {
      showToast('Operation error.', 'error');
    }
  };

  // Actions: Upgrade Building
  const handleUpgradeBuilding = async (buildingKey: string) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    try {
      const res = await fetch('/api/upgrade/building', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: currentPlanet.id, buildingKey })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`${buildingKey.toUpperCase()} upgrade project is active!`, 'success');
      } else {
        showToast(data.error || 'Upgrade blocked', 'error');
      }
    } catch (err) {
      showToast('Building upgrade failed', 'error');
    }
  };

  // Actions: Fabricate Troops
  const handleTrainTroops = async (troopId: string, quantity: number) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    try {
      const res = await fetch('/api/train/troop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: currentPlanet.id, troopId, quantity })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Troop assembly queue commenced successfully for x${quantity}!`, 'success');
      } else {
        showToast(data.error || 'Training blocked', 'error');
      }
    } catch (err) {
      showToast('Troop mobilization failed', 'error');
    }
  };



  // Actions: Send Space Fleet
  const handleSendFleet = async (mission: {
    targetX: number;
    targetY: number;
    missionType: 'attack' | 'colonize' | 'recon';
    troops: Record<string, number>;
    targetId?: string;
    targetName?: string;
    targetBuilding?: string;
  }) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    try {
      const res = await fetch('/api/fleet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: currentPlanet.id,
          ...mission
        })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`FLEET DEPLOYED! Mission: ${mission.missionType.toUpperCase()} dispatched.`, 'success');
        setActiveTab('galaxy'); // Swapp tab to allow monitoring of travels!
      } else {
        showToast(data.error || 'Fleet blocked by flight control', 'error');
      }
    } catch (err) {
      showToast('Launch failure', 'error');
    }
  };

  const handleSettle = async (fleetId: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/fleet/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ fleetId })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        if (data.fleets) {
          setFleets(data.fleets);
        }
        showToast('PLANET SETTLED! Your new research colony is established.', 'success');
      } else {
        showToast(data.error || 'Failed to settle coordinates', 'error');
      }
    } catch (err) {
      showToast('Settlement execution failure', 'error');
    }
  };

  const handleSendChat = async (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => {
    if (!player) return;
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ channel, content, receiverId })
      });
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlliance = async (name: string, tag: string, bannerColor: string, bannerSymbol: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/alliance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ name, tag, bannerColor, bannerSymbol })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Alliance foundation project [${tag.toUpperCase()}] established!`, 'success');
      } else {
        showToast(data.error || 'Enlisting failure', 'error');
      }
    } catch (err) {
      showToast('Alliance error', 'error');
    }
  };

  const handleJoinAlliance = async (allianceId: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/alliance/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ allianceId })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Successfully registered and joined alliance!`, 'success');
      } else {
        showToast(data.error || 'Enlisting failure', 'error');
      }
    } catch (err) {
      showToast('Alliance join failed', 'error');
    }
  };

  const handleLeaveAlliance = async () => {
    if (!player) return;
    try {
      const res = await fetch('/api/alliance/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        }
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Faction alignment cleared. You are single commander now.`, 'success');
      }
    } catch (err) {
      showToast('Leave alliance error', 'error');
    }
  };

  const handleDeclareWar = async (targetAllianceId: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/alliance/declare-war', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ targetAllianceId })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`COVENANT VIOLATED: Hostilities officially declared!`, 'success');
      } else {
        showToast(data.error || 'Declaring war blocked', 'error');
      }
    } catch (err) {
      showToast('War declaration error', 'error');
    }
  };

  // Claim Daily Crates
  const handleClaimDailyReward = async () => {
    if (!player) return;
    try {
      const res = await fetch('/api/daily-reward/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        }
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Cargo unlocked! Standard supply package received (+${data.s_amount.toLocaleString()} fluids)`, 'success');
      } else {
        showToast(data.error || 'Resource crates on cooldown', 'info');
      }
    } catch (err) {
      showToast('Reward error', 'error');
    }
  };

  // Buy Galactic Credits Secure Gateway
  const handleBuyCredits = async (amount: number, tierLabel: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/buy-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ amount, tierLabel })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Secure communication established. +${amount.toLocaleString()} Space Gold loaded!`, 'success');
      } else {
        showToast(data.error || 'Gateway transmission error', 'error');
      }
    } catch (err) {
      showToast('Quantum network unstable. Try again.', 'error');
    }
  };

  // Toggle Theme Light / Dark
  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Login signup routing
  if (!userId || !player) {
    return (
      <div className={`min-h-screen bg-[#05070A] text-slate-300 flex items-center justify-center p-4 font-mono select-none theme-${theme}`}>
        <div className="w-full max-w-lg p-8 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.05)] backdrop-blur-md relative overflow-hidden">
          {/* Glowing particle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="text-center mb-8 space-y-1 relative">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">INTERACTIVE SECTOR MMO</span>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2 mt-1">
              <span>🌌</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-500">SPACE STATION</span>
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-2 max-w-[340px] mx-auto leading-relaxed">
              Synthesize thermonuclear reactors, recruit orbital heavy infantry division forces, and synchronize with alliances across parsec coordinates.
            </p>
          </div>

          {showSignup ? (
            <form onSubmit={handleRegister} className="space-y-5 relative">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Commander Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="E.g. VoidWraith"
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Choose your Theme</label>
                <select 
                  value={theme}
                  onChange={(e) => {
                    const sel = e.target.value as 'normal' | 'light' | 'dark';
                    setTheme(sel);
                    localStorage.setItem('moonbase_theme', sel);
                    setFaction('Solar Alliance');
                  }}
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                >
                  <option value="normal">☀️ Normal Theme (Standard Solar Blue)</option>
                  <option value="light">💡 Light Theme (For light preference)</option>
                  <option value="dark">🌙 Dark Theme (For dark preference)</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs tracking-widest uppercase rounded-xl hover:brightness-110 active:scale-[0.98] transition shadow-[0_0_20px_rgba(6,182,212,0.25)] cursor-pointer"
              >
                Register & Activate Command Gateway
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="text-xs text-cyan-400 underline hover:text-cyan-300"
                >
                  Already active? Sync Commander terminal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5 relative">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Commander Username Approval</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Registered username..."
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-amber-600 text-white font-bold text-xs tracking-widest uppercase rounded-xl hover:brightness-110 active:scale-[0.98] transition shadow-[0_0_20px_rgba(236,72,153,0.25)] cursor-pointer"
              >
                Sync Command Terminal Modules
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="text-xs text-cyan-400 underline hover:text-cyan-300"
                >
                  Found a new Commander registry
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  // Loaded active interface
  const activePlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
  const repositoryLimit = Math.round(10000 * Math.pow(500, (activePlanet.buildings.repository.level - 1) / 44));

  return (
    <div className={`min-h-screen font-sans bg-[#05070A] text-slate-350 selection:bg-cyan-500/25 pb-24 theme-${theme}`}>
      
      {/* Toast Notice alerts */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 border rounded-xl font-mono text-xs flex items-center gap-3 max-w-sm w-full animate-bounce bg-[#0A0F1D] border-[#1E293B] shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          <Info size={16} className={toast.type === 'error' ? 'text-red-400' : 'text-cyan-400'} />
          <span className="text-slate-100 flex-1 font-sans">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white font-sans text-lg">&times;</button>
        </div>
      )}

      {/* Main Top Header Navbar info */}
      <header className="sticky top-0 z-40 h-20 bg-[#0A0F1D] border-b border-[#1E293B] flex items-center justify-between px-6 shrink-0 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div 
              className="w-2.5 h-2.5 rounded-full animate-pulse bg-cyan-400 shadow-[0_0_10px_#22d3ee]" 
            />
            <div>
              <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-widest leading-none">Commander Profile</span>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-sm sm:text-base font-bold font-mono tracking-tight leading-none text-white">{player.username}</h1>
              </div>
            </div>
          </div>

          {/* New Planet Selector in Top Bar Header */}
          {player.planets.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 font-bold hidden md:inline">ACTIVE SECTOR:</span>
              <div className="relative">
                <select 
                  value={selectedPlanetId || player.planets[0].id}
                  onChange={(e) => {
                    setSelectedPlanetId(e.target.value);
                    showToast(`Switched active command site to Sector station [${player.planets.find(pl => pl.id === e.target.value)?.sectorX}, ${player.planets.find(pl => pl.id === e.target.value)?.sectorY}]`, 'success');
                  }}
                  className="bg-[#05070A] text-xs text-cyan-400 font-mono font-bold py-1.5 px-3 rounded-lg border border-[#1E293B] focus:border-cyan-500 focus:outline-none cursor-pointer pr-8 appearance-none shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:border-cyan-500/40 transition text-right"
                >
                  {player.planets.map((pl, idx) => (
                    <option key={pl.id} value={pl.id} className="bg-[#0A0F1D] text-slate-200">
                      {idx === 0 ? "★ " : "🛰️ "}{pl.name} [{pl.sectorX}, {pl.sectorY}]
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-[#05070A] rounded-lg border border-[#1E293B] text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 tracking-wide">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>STATION: {activePlanet.name} [{activePlanet.sectorX}, {activePlanet.sectorY}]</span>
            </div>
          )}
        </div>

        {/* Global Rank and Profile Badge exactly like mock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.05)]">
            <Coins size={13} className="text-amber-400 animate-pulse animate-duration-[3000ms]" />
            <span>{(player.credits !== undefined ? player.credits : 1250).toLocaleString()} <span className="text-[9px] text-amber-500/75 uppercase font-sans font-bold">Space Gold</span></span>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Global Rank</div>
            <div className="text-base sm:text-lg font-bold italic text-white font-mono">
              #{Math.abs(parseInt(player.id.substring(0, 4), 16) % 150) || 48}
            </div>
          </div>
          <div className="w-10 h-10 border border-cyan-500/40 flex items-center justify-center rounded bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <span className="text-cyan-400 font-mono font-bold text-sm uppercase">{player.username[0]}</span>
          </div>
        </div>
      </header>

      {/* Main Dynamic Resource Stats HUD Panels (Elegant Dark Telemetry Mockup style with mini Progress Bars) - Restrict to only show on the explore tab */}
      {activeTab === 'explore' && (
        <div className="bg-[#0A0F1D] border-b border-[#1E293B] grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 px-6 py-4 shrink-0 justify-between">
          
          {/* Water Stat */}
          <div className="flex flex-col" title="Water (H2O): Essential life fluid. Consumed continuously by troops to maintain Space Force strength. Hover/long press for info.">
            <div className="flex items-center gap-2 mb-1">
              <Droplet size={12} className="text-cyan-400 animate-pulse" title="Water icon: Click or long-press to view details" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Water (H2O)</span>
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
          <div className="flex flex-col" title="Plasma: High-energy matter. Essential for building complex spaceship hull grades and hyper-engines. Hover/long press for info.">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={12} className="text-purple-400 animate-pulse" title="Plasma icon: Click or long-press to view details" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Plasma</span>
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
          <div className="flex flex-col" title="Fuel: Thermonuclear propulsion energy. Required for dispatching fleet traversals across global planetary sectors. Hover/long press for info.">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={12} className="text-amber-400 animate-pulse" title="Fuel icon: Click or long-press to view details" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-550">Fuel</span>
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
          <div className="flex flex-col" title="Food: Life support proteins. Vital to sustaining personnel during active colonist station operations. Hover/long press for info.">
            <div className="flex items-center gap-2 mb-1">
              <Apple size={12} className="text-emerald-400 animate-pulse" title="Food icon: Click or long-press to view details" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-550">Food</span>
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
          <div className="flex flex-col col-span-2 md:col-span-1" title="Respirant (O2): Atmospheric gases. Powering life ventilation systems for astronauts and pilots. Hover/long press for info.">
            <div className="flex items-center gap-2 mb-1">
              <Wind size={12} className="text-blue-400 animate-pulse" title="Respirant icon: Click or long-press to view details" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Respirant (O2)</span>
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
      )}

      {/* Screen view router container */}
      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        {activeTab === 'explore' && (
          <ExploreTab 
            player={player}
            activePlanet={activePlanet}
            onUpgradeMine={handleUpgradeMine}
            onUpgradeBuilding={handleUpgradeBuilding}
            serverTime={serverTime}
            fleets={fleets}
            onSettle={handleSettle}
          />
        )}

        {activeTab === 'army' && (
          <ArmyBaseTab 
            player={player}
            activePlanet={activePlanet}
            onTrainTroops={handleTrainTroops}
            serverTime={serverTime}
            battleReports={battleReports}
          />
        )}

        {activeTab === 'galaxy' && (
          <GalaxyTab 
            player={player}
            activePlanet={activePlanet}
            alliances={alliances}
            chatMessages={chatMessages}
            fleets={fleets}
            battleReports={battleReports}
            newsEvents={newsEvents}
            serverTime={serverTime}
            onSendFleet={handleSendFleet}
            onSendChat={handleSendChat}
            onCreateAlliance={handleCreateAlliance}
            onJoinAlliance={handleJoinAlliance}
            onLeaveAlliance={handleLeaveAlliance}
            onDeclareWar={handleDeclareWar}
            onRefreshState={fetchState}
          />
        )}

        {activeTab === 'research' && (
          <ResearchTab
            player={player}
            activePlanet={activePlanet}
            onUpgradeBuilding={handleUpgradeBuilding}
            serverTime={serverTime}
            showToast={showToast}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            player={player}
            theme={theme}
            setTheme={setTheme}
            skinId={skinId}
            setSkinId={setSkinId}
            fontSizeScale={fontSizeScale}
            setFontSizeScale={setFontSizeScale}
            showToast={showToast}
            onRefreshState={fetchState}
          />
        )}
      </main>

      {/* BOTTOM TAB MENU NAVIGATION PANEL (Elegant Dark Mockup matched exact style) */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0A0F1D]/95 backdrop-blur-md border-t border-[#1E293B] flex items-center shrink-0 px-2 justify-between transition-all duration-500 ease-in-out ${isScrolling ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex-1 flex h-full">
          
          {/* Tab 1: Explore */}
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 border-r border-[#1E293B] group relative transition-colors duration-150 cursor-pointer ${activeTab === 'explore' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'explore' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${activeTab === 'explore' ? 'text-cyan-450' : 'text-slate-500 group-hover:text-slate-300'}`}>01</span>
            <span className={`text-[10px] font-bold tracking-widest ${activeTab === 'explore' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>EXPLORE</span>
          </button>

          {/* Tab 2: Army command */}
          <button 
            onClick={() => setActiveTab('army')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 border-r border-[#1E293B] group relative transition-colors duration-150 cursor-pointer ${activeTab === 'army' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'army' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${activeTab === 'army' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>02</span>
            <span className={`text-[10px] font-bold tracking-widest ${activeTab === 'army' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>COMMAND CENTER</span>
          </button>

          {/* Tab 3: Galaxy Scan Map */}
          <button 
            onClick={() => setActiveTab('galaxy')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 border-r border-[#1E293B] group relative transition-colors duration-150 cursor-pointer ${activeTab === 'galaxy' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'galaxy' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${activeTab === 'galaxy' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>03</span>
            <span className={`text-[10px] font-bold tracking-widest ${activeTab === 'galaxy' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>COMMS HUB</span>
          </button>

          {/* Tab 4: Research Center */}
          <button 
            onClick={() => setActiveTab('research')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 group relative transition-colors duration-150 cursor-pointer ${activeTab === 'research' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'research' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${activeTab === 'research' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>04</span>
            <span className={`text-[10px] font-bold tracking-widest ${activeTab === 'research' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>RESEARCH CENTER</span>
          </button>

        </div>

        {/* Right Info Section / daily reward & research center */}
        <div className="w-72 bg-slate-900 border-l border-[#1E293B] h-full hidden md:flex items-center px-6 justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Quantum Crates</span>
            <button 
              onClick={handleClaimDailyReward}
              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 text-left cursor-pointer flex items-center gap-1 mt-0.5"
            >
              <Gift size={12} /> Claim Hourly
            </button>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 font-bold text-[10px] py-2 px-3 rounded uppercase transition-all shadow-[0_0_10px_rgba(8,145,178,0.3)] hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer ${activeTab === 'settings' ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
          >
            Settings
          </button>
        </div>

        {/* Mobile Quick Action Buttons */}
        <div className="flex md:hidden items-center gap-1.5 px-2">
          <button 
            onClick={handleClaimDailyReward}
            className="p-2 bg-[#0A0F1D] border border-[#1E293B] rounded-xl text-amber-400 cursor-pointer text-xs"
            title="Hourly Crates"
          >
            <Gift size={15} />
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 border rounded-xl cursor-pointer font-bold text-xs ${activeTab === 'settings' ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'}`}
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </footer>
    </div>
  );
}
