import React, { useState, useEffect, useRef } from 'react';
import welcomeBanner from './assets/images/welcome_banner_clean_1780971855115.png';
import { 
  Alliance, 
  BattleReport, 
  ChatMessage, 
  ColonyPlanet, 
  FleetMission, 
  NewsEvent, 
  PlayerProfile, 
  ResourceType,
  LeaderboardPlayer,
  CreatedFleet
} from './types';
import { sendMobileNotification } from './lib/mobileNotifications';
import { playAlertySound, playChilledSound } from './lib/soundUtils';
import { ExploreTab } from './components/ExploreTab';
import { ArmyBaseTab } from './components/ArmyBaseTab';
import { GalaxyTab } from './components/GalaxyTab';
import { ResearchTab } from './components/ResearchTab';
import { SettingsTab } from './components/SettingsTab';
import { CommanderTutorial } from './components/CommanderTutorial';
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
  ChevronDown,
  ChevronUp,
  User,
  LogOut,
  AlertTriangle,
  Mail,
  Trash2,
  Star,
  Forward,
  Edit2,
  Check,
  Send,
  Reply
} from 'lucide-react';

const TROOP_NAME_MAPPING: Record<string, string> = {
  defender: 'Interceptor',
  attacker: 'Assault Drone',
  tank: 'Disrupter',
  looter: 'Matter Extractor',
  drone: 'Missile Launcher',
  settlementShip: 'Settlement Ship'
};

async function safeParseJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => '');
  const trimmed = text.trim();
  
  // Guard against HTML fallbacks (e.g. index.html) during server adjustments or route misses
  const isHtml = trimmed.startsWith('<!DOCTYPE html>') || 
                 trimmed.startsWith('<!doctype html>') || 
                 trimmed.startsWith('<html') || 
                 trimmed.includes('blocking a required security cookie') || 
                 trimmed.includes('Cookie check') ||
                 trimmed.includes('google-signin') ||
                 trimmed.includes('accounts.google.com');

  if (isHtml) {
    const isAppSPA = trimmed.includes('id="root"') || 
                     trimmed.includes('Space Station Commander') || 
                     trimmed.includes('/src/main.tsx') || 
                     trimmed.includes('/src/index.css');
    if (isAppSPA) {
      throw new Error(`API endpoint fallback: endpoint ${res.url} returned parent SPA layout instead of JSON.`);
    }
    throw new Error('Secure Iframe Policy: Browser privacy settings on your browser are blocking iframe requests. Please click "Open in New Tab" in the top right of the AI Studio preview to bypass this secure barrier.');
  }

  if (!trimmed) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return {};
  }

  try {
    return JSON.parse(trimmed);
  } catch (err) {
    if (!res.ok) {
      if (trimmed.length < 200) {
        throw new Error(trimmed);
      }
      throw new Error(`Request failed with status ${res.status}`);
    }
    throw new Error('Secure Iframe Policy: Browser privacy settings on your browser are blocking iframe requests. Please click "Open in New Tab" in the top right of the AI Studio preview to bypass this secure barrier.');
  }
}

export default function App() {
  // Authentication & player session
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('moonbase_userId'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [faction, setFaction] = useState('Solar Alliance');
  const [showSignup, setShowSignup] = useState(true);

  // Connection error handling
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const consecutiveErrorsRef = useRef(0);

  // Google Sign-In & Payments Dialog states
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [deviceGoogleAccounts, setDeviceGoogleAccounts] = useState<{ email: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem('moonbase_device_google_accounts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    return [];
  });

  const addDeviceGoogleAccount = (email: string, name: string) => {
    setDeviceGoogleAccounts(prev => {
      const exists = prev.some(acc => acc.email.toLowerCase() === email.toLowerCase());
      if (exists) return prev;
      const updated = [...prev, { email, name }];
      localStorage.setItem('moonbase_device_google_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const removeDeviceGoogleAccount = (email: string) => {
    setDeviceGoogleAccounts(prev => {
      const updated = prev.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem('moonbase_device_google_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentTier, setSelectedPaymentTier] = useState<{ amount: number; label: string; price: string; desc: string; bonus?: string } | null>(null);
  const [paymentState, setPaymentState] = useState<'idle' | 'input' | 'processing' | 'success'>('idle');
  const [paymentStepsLog, setPaymentStepsLog] = useState<string>('');
  const [creditCardData, setCreditCardData] = useState({ number: '', name: '', expiry: '', cvc: '', method: 'card' });

  // Synced state from server
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [appConfirmModal, setAppConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [playersList, setPlayersList] = useState<LeaderboardPlayer[]>([]);
  const [alliances, setAlliances] = useState<Record<string, Alliance>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [fleets, setFleets] = useState<FleetMission[]>([]);
  const [battleReports, setBattleReports] = useState<BattleReport[]>([]);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Command message deck states
  const [showCommDeck, setShowCommDeck] = useState(false);
  const [commDeckTab, setCommDeckTab] = useState<'incoming' | 'saved' | 'sent' | 'compose'>('incoming');
  const [profileMsgText, setProfileMsgText] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [forwardingMsgId, setForwardingMsgId] = useState<string | null>(null);
  const [forwardTargetId, setForwardTargetId] = useState("");
  const [directMsgTargetId, setDirectMsgTargetId] = useState("");
  const [directMsgContent, setDirectMsgContent] = useState("");

  // Active Screen / Navigation Tab selector: 'explore' | 'army' | 'galaxy' | 'research' | 'settings'
  const [activeTab, setActiveTab ] = useState<'explore' | 'army' | 'galaxy' | 'research' | 'settings'>('explore');
  const [galaxyInitialSubTab, setGalaxyInitialSubTab] = useState<'scanner' | 'ranking' | 'comms' | 'news' | 'fleets'>('scanner');

  // Local reserve / created fleets state
  const [createdFleets, setCreatedFleets] = useState<CreatedFleet[]>(() => {
    try {
      const saved = localStorage.getItem('space_station_created_fleets_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('space_station_created_fleets_v1', JSON.stringify(createdFleets));
  }, [createdFleets]);

  // Automatically re-dock traveling reserve fleets when their active mission is no longer in flight
  useEffect(() => {
    if (!player || !fleets) return;
    
    const hasReturnedFleet = createdFleets.some(fleet => 
      fleet.activeMissionId && !fleets.some(f => f.id === fleet.activeMissionId)
    );
    
    if (!hasReturnedFleet) return;
    
    const checkAndReDockFleets = async () => {
      let stateChanged = false;
      const updatedCreatedFleets = [...createdFleets];
      let latestPlayer = player;
      
      for (let i = 0; i < updatedCreatedFleets.length; i++) {
        const fleet = updatedCreatedFleets[i];
        if (fleet.activeMissionId) {
          const isStillTraveling = fleets.some(f => f.id === fleet.activeMissionId);
          if (!isStillTraveling) {
            console.log(`Reserve fleet ${fleet.name} is no longer in active fleets. Re-docking/deducting troops from planet base...`);
            
            // Adjust troops back down (i.e. deduct them to store inside the reserve fleet again)
            const changes: Record<string, number> = {};
            for (const [tId, val] of Object.entries(fleet.troops)) {
              const qty = Number(val) || 0;
              if (qty > 0) {
                changes[tId] = qty; 
              }
            }
            
            try {
              const res = await fetch('/api/troops/adjust', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': player.id
                },
                body: JSON.stringify({
                  planetId: fleet.planetId,
                  troopChanges: changes
                })
              });
              const data = await safeParseJson(res);
              if (res.ok && data.player) {
                latestPlayer = data.player;
                stateChanged = true;
              }
            } catch (err) {
              console.error("Failed to re-dock returned reserve fleet", err);
            }
            
            updatedCreatedFleets[i] = {
              ...fleet,
              activeMissionId: null,
              isTraveling: false
            };
          }
        }
      }
      
      if (stateChanged) {
        setPlayer(latestPlayer);
        setCreatedFleets(updatedCreatedFleets);
        showToast("A tactical reserve fleet has returned to base and docked successfully!", "success");
      } else {
        setCreatedFleets(updatedCreatedFleets);
      }
    };
    
    checkAndReDockFleets();
  }, [fleets, player, createdFleets]);

  // Selected active colony planet ID
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [showInitialStationNaming, setShowInitialStationNaming] = useState(false);
  const [initialStationName, setInitialStationName] = useState('');
  const [settleFleetId, setSettleFleetId] = useState<string | null>(null);
  const [customColonyName, setCustomColonyName] = useState('');

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
  const [interactiveTabs, setInteractiveTabs] = useState<boolean>(() => {
    return localStorage.getItem('moonbase_interactive_tabs') === 'true';
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  // Calculated dynamic leader board rank based on population score
  const sortedByPopulation = [...playersList].sort((a, b) => b.scores.population - a.scores.population);
  const myPopulationRankIndex = player && playersList.length > 0 
    ? (sortedByPopulation.findIndex(p => p.id === player.id) + 1 || 1)
    : (player ? (Math.abs(parseInt(player.id.substring(0, 4), 16) % 150) || 48) : 48);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('moonbase_interactive_tabs', String(interactiveTabs));
  }, [interactiveTabs]);

  // Profile dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [expandedDropdownPlanetIds, setExpandedDropdownPlanetIds] = useState<Record<string, boolean>>({});

  // Active planet name editor and alerts states
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Sync newNameInput when activePlanet changes in App
  useEffect(() => {
    if (player) {
      const activePl = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
      if (activePl) {
        setNewNameInput(activePl.name);
        setIsEditingName(false);
      }
    }
  }, [player, selectedPlanetId]);

  // Battle report read/saved lists
  const [readReports, setReadReports] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('moonbase_read_reports') || '{}');
    } catch {
      return {};
    }
  });

  const [savedReports, setSavedReports] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('moonbase_saved_reports') || '{}');
    } catch {
      return {};
    }
  });

  const markReportRead = (reportId: string) => {
    setReadReports(prev => {
      const updated = { ...prev, [reportId]: true };
      localStorage.setItem('moonbase_read_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const markReportUnread = (reportId: string) => {
    setReadReports(prev => {
      const updated = { ...prev, [reportId]: false };
      localStorage.setItem('moonbase_read_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSaveReport = (reportId: string) => {
    setSavedReports(prev => {
      const updated = { ...prev, [reportId]: !prev[reportId] };
      localStorage.setItem('moonbase_saved_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const handleForwardReport = async (report: BattleReport, channel: 'global' | 'alliance') => {
    if (!player) return;
    const isWin = (report.winner === 'attacker' && report.attackerId === player.id) || (report.winner === 'defender' && report.defenderId === player.id);
    const winStr = isWin ? 'VICTORY' : 'DEFEAT';
    const coordinateOrigin = `[${report.attackerCoords.x}, ${report.attackerCoords.y}]`;
    const coordinateTarget = `[${report.defenderCoords.x}, ${report.defenderCoords.y}]`;

    const content = `📬 [FORWARDED BATTLE REPORT ID: ${report.id.substring(0,6).toUpperCase()}] Outcome: ${winStr}. Attacker ${report.attackerName} vs Defender ${report.defenderName}. Coordinates: ${coordinateOrigin} -> ${coordinateTarget}. Winner: ${report.winner.toUpperCase()}!`;
    
    await handleSendChat(channel, content);
    showToast(`Combat Report forwarded to ${channel} channel successfully!`, 'success');
  };

  // Apply Font Size accessibility scaling
  useEffect(() => {
    localStorage.setItem('moonbase_font_size', fontSizeScale);
    let size = '16px';
    if (fontSizeScale === '125%') {
      size = '20px';
    } else if (fontSizeScale === '75%') {
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

  // Dynamic Space Gateway Heartbeat Poller
  useEffect(() => {
    let active = true;
    const checkConnectionHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await safeParseJson(res);
        if (active && data && data.status === "ok") {
          consecutiveErrorsRef.current = 0;
          setConnectionError(null);
        }
      } catch (err: any) {
        if (active) {
          consecutiveErrorsRef.current += 1;
          if (consecutiveErrorsRef.current >= 12) {
            // If connection is broken, set readable warning descriptor
            setConnectionError(err?.message || 'Gateway connection timeout');
          }
        }
      }
    };

    // Run first verification check immediately
    checkConnectionHealth();

    // Recheck connection health every 6 seconds
    const checkInterval = setInterval(checkConnectionHealth, 6000);
    return () => {
      active = false;
      clearInterval(checkInterval);
    };
  }, []);

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
      const minesList = planet.mines[res] || [];
      rates[res] = minesList.reduce((sum, m) => {
        const isMineBoosted = m.boostedUntil && Date.now() < Number(m.boostedUntil);
        const baseProd = isOtherMaxed 
          ? (res === 'water' ? 14000 : 42000)
          : ((m.level / 15) * (res === 'water' ? 14000 : 8333.33));
        const finalProd = isMineBoosted ? baseProd * 1.14 : baseProd;
        return sum + finalProd;
      }, 0);
    });

    // Take water, respirant, and food troops consumption rate into account (Respirant is 0.28x ((0.4 * 7) / 10) water, Food is 0.18x ((0.15 * 12) / 10))
    let waterConsumptionPerHour = 0;
    const troopConsumption = { defender: 1.0, attacker: 2.0, tank: 4.0, looter: 3.0, drone: 0.4, settlementShip: 5.0 };
    Object.entries(planet.troops).forEach(([tId, count]) => {
      waterConsumptionPerHour += (Number(count) || 0) * (troopConsumption[tId as keyof typeof troopConsumption] || 0);
    });
    rates.water -= waterConsumptionPerHour;
    rates.respirant -= waterConsumptionPerHour * 0.28;
    rates.food -= waterConsumptionPerHour * 0.18;

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
          if ((res === 'water' || res === 'respirant' || res === 'food') && rates[res] < 0) {
            // Negative production: allow stockpiles to drop below zero
            updated[res] = Math.min(capacity, newVal);
          } else {
            updated[res] = Math.max(0, Math.min(capacity, newVal));
          }
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

    // Play notification sound if SFX is enabled
    const soundEnabled = localStorage.getItem('moonbase_sound_enabled') !== 'false';
    if (soundEnabled) {
      const isAttack = message.toLowerCase().includes('tactical alert') || 
                       message.toLowerCase().includes('intel warning') || 
                       message.toLowerCase().includes('attack') || 
                       message.toLowerCase().includes('hostile');
      if (isAttack) {
        playAlertySound();
      } else {
        playChilledSound();
      }
    }
  };

  // Building and Mine upgrade completed detector effect
  const lastLevelsRef = useRef<{
    planetId: string;
    buildings: Record<string, number>;
    mines: Record<string, number[]>;
  } | null>(null);

  useEffect(() => {
    if (!player) {
      lastLevelsRef.current = null;
      return;
    }
    const activePlanet = player.planets.find(p => p.id === selectedPlanetId) || player.planets[0];
    if (!activePlanet) return;

    // Collect current levels
    const currentBuildings: Record<string, number> = {};
    Object.entries(activePlanet.buildings).forEach(([key, state]: [string, any]) => {
      currentBuildings[key] = state.level;
    });

    const currentMines: Record<string, number[]> = {};
    Object.entries(activePlanet.mines).forEach(([key, list]: [string, any[]]) => {
      currentMines[key] = list.map(m => m.level);
    });

    const last = lastLevelsRef.current;
    if (last && last.planetId === activePlanet.id) {
      // Compare buildings
      Object.entries(currentBuildings).forEach(([key, lvl]) => {
        const prevLvl = last.buildings[key];
        if (prevLvl !== undefined && lvl > prevLvl) {
          const bNames: Record<string, string> = {
            commsHub: 'Communications Hub',
            researchCenter: 'Research Center',
            armyBase: 'War Room',
            repository: 'Silo',
            radar: 'Radar Array',
            supplyNexus: 'Supply Nexus',
            fabricator: 'Fabricator'
          };
          const bName = bNames[key] || key;
          const msg = `${bName} construction finished! Upgraded to Level ${lvl}.`;
          showToast(`🚀 CONSTRUCTION RESOLVED: ${msg}`, 'success');
          sendMobileNotification(`🚀 Construction Resolved!`, msg);
        }
      });

      // Compare mines
      Object.entries(currentMines).forEach(([key, levels]) => {
        const prevLevels = last.mines[key];
        if (prevLevels) {
          levels.forEach((lvl, idx) => {
            const prevLvl = prevLevels[idx];
            if (prevLvl !== undefined && lvl > prevLvl) {
              const mineNames: Record<string, string> = {
                water: 'Water Siphon Extraction Mine',
                plasma: 'Plasma Injector Refinery',
                fuel: 'Deuterium Fuel Synthesizer',
                food: 'Quantum Food Bio-Synthesizer',
                respirant: 'Air Scrubber Oxygen Generator'
              };
              const mName = mineNames[key] || `${key.toUpperCase()} Extractor`;
              const msg = `${mName} (Slot #${idx + 1}) upgraded to Level ${lvl}!`;
              showToast(`⛏️ EXTRACTION UPGRADE: ${msg}`, 'success');
              sendMobileNotification(`⛏️ Extraction Upgrade Finished`, msg);
            }
          });
        }
      });
    }

    // Save current levels for the next tick
    lastLevelsRef.current = {
      planetId: activePlanet.id,
      buildings: currentBuildings,
      mines: currentMines
    };
  }, [player, selectedPlanetId]);

  // Incoming attacks notification monitor effect
  const lastAttackFleetsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!player || !fleets || fleets.length === 0) {
      lastAttackFleetsRef.current = [];
      return;
    }
    
    // Find all active incoming attacks in the universe
    const myPlanetIds = player.planets.map(p => p.id);
    const activeIncomingAttacks = fleets.filter(f => 
      f.missionType === 'attack' && 
      !f.isReturning && 
      f.arrivesAt > serverTime
    );

    const currentAttackIds = activeIncomingAttacks.map(f => f.id);
    const prevAttackIds = lastAttackFleetsRef.current;

    // Detect if we have any NEW incoming attacks
    activeIncomingAttacks.forEach(f => {
      if (!prevAttackIds.includes(f.id)) {
        // Skip if attack notifications are toggled off
        const attackAlertsEnabled = localStorage.getItem('moonbase_attack_notifications_enabled') !== 'false';
        if (!attackAlertsEnabled) return;

        const isMine = myPlanetIds.includes(f.targetId || '');
        if (isMine) {
          const targetPlanet = player.planets.find(p => p.id === f.targetId);
          const pName = targetPlanet ? targetPlanet.name : "Station Core";
          const message = `Hostile space fleet from Commander ${f.senderName} detected on attack trajectory to your station ${pName}! Arriving in ${Math.round((f.arrivesAt - serverTime) / 1000)} seconds!`;
          showToast(`⚠️ TACTICAL ALERT: ${message}`, 'error');
          sendMobileNotification(`⚠️ TACTICAL ALERT!`, message);
        }
      }
    });

    lastAttackFleetsRef.current = currentAttackIds;
  }, [fleets, player, serverTime]);

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
        setPlayersList(data.playersList || []);
        setAlliances(data.alliances);
        setChatMessages(data.chatMessages);
        setFleets(data.fleets);
        setBattleReports(data.battleReports);
        setNewsEvents(data.newsEvents);
        setServerTime(data.serverTime);
        consecutiveErrorsRef.current = 0;
        setConnectionError(null);
      } else {
        // Only wipe the user ID if the server explicitly tells us the user profile doesn't exist or is unauthenticated (401/404)
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('moonbase_userId');
          setUserId(null);
          setPlayer(null);
        } else {
          console.warn(`Gateway returned status ${res.status}. Keeping session active.`);
        }
      }
    } catch (err: any) {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= 12) {
        setConnectionError(err?.message || 'Gateway connection error');
      }
      if (err?.message?.includes('security check') || err?.message?.includes('cookie') || err?.message?.includes('stabilizing')) {
        console.warn("Connection warning:", err.message);
      } else {
        console.error(err);
      }
    }
  };

  // Auth: Register
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, faction, password })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem('moonbase_userId', data.player.id);
        setUserId(data.player.id);
        setPlayer(data.player);
        setInitialStationName(`${data.player.username}'s Station`);
        setShowInitialStationNaming(true);
        showToast(`Commander registration approved! Welcome of Eclipse.`, 'success');
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('Communications failure with space gateway.', 'error');
    }
  };

  // Auth: Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
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

  // Auth: Google Sign-In
  const handleGoogleSignIn = async (email: string, selectName?: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          username: selectName,
          faction
        })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem('moonbase_userId', data.player.id);
        setUserId(data.player.id);
        setPlayer(data.player);
        addDeviceGoogleAccount(email, data.player.username);
        showToast(`Google sync complete! Welcome, Commander ${data.player.username}.`, 'success');
        setShowGoogleDialog(false);
        if (data.isNew) {
          setInitialStationName(`${data.player.username}'s Station`);
          setShowInitialStationNaming(true);
        }
      } else {
        showToast(data.error || 'Google Sync failed.', 'error');
      }
    } catch (err) {
      showToast('Verify network connection with terminal gateway.', 'error');
    }
  };

  // Initial Station Naming handler
  const handleInitialStationNamingSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!player || player.planets.length === 0) return;
    const nameToSubmit = initialStationName.trim();
    if (!nameToSubmit) {
      showToast('Station name cannot be empty!', 'error');
      return;
    }
    if (nameToSubmit.length > 30) {
      showToast('Station name must be 30 characters or less', 'error');
      return;
    }
    try {
      const res = await fetch('/api/planet/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: player.planets[0].id, newName: nameToSubmit })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Station established and designated as: ${nameToSubmit}`, 'success');
        setShowInitialStationNaming(false);
        setPlayer(data.player);
      } else {
        showToast(data.error || 'Failed to designate station', 'error');
      }
    } catch (err) {
      showToast('Network communications failure designating station.', 'error');
    }
  };

  // Link Google Account inside Settings
  const handleLinkGoogleAccount = async (email: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/player/link-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ email })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        showToast(`Terminal keys permanently locked to Google email: ${email}`, 'success');
      } else {
        showToast(data.error || 'Could not bind Google key.', 'error');
      }
    } catch (err) {
      showToast('Secure sync linking error.', 'error');
    }
  };

  // Actions: Upgrade Mine
  const handleUpgradeMine = async (resType: ResourceType, mineIndex: number, queue: boolean = false) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    try {
      const res = await fetch('/api/upgrade/mine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: currentPlanet.id, resType, mineIndex, queue })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        if (queue) {
          showToast('Extractor upgrade project successfully queued (Charged 15 Space Gold)!', 'success');
        } else {
          showToast('Extractor upgrade project initiated and scheduled!', 'success');
        }
      } else {
        showToast(data.error || 'Upgrade blocked', 'error');
      }
    } catch (err) {
      showToast('Operation error.', 'error');
    }
  };

  // Actions: Upgrade Building
  const handleUpgradeBuilding = async (buildingKey: string, queue: boolean = false) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
    try {
      const res = await fetch('/api/upgrade/building', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: currentPlanet.id, buildingKey, queue })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        if (queue) {
          showToast(`${buildingKey.toUpperCase()} upgrade project successfully queued (Charged 15 Space Gold)!`, 'success');
        } else {
          showToast(`${buildingKey.toUpperCase()} upgrade project is active!`, 'success');
        }
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

    let manufacturingSpeedLevel = 1;
    try {
      const isFirstPlanet = player.planets[0]?.id === currentPlanet.id;
      const savedTech = localStorage.getItem(`moonbase_tech_${player.id}_${currentPlanet.id}`);
      manufacturingSpeedLevel = savedTech ? (JSON.parse(savedTech).manufacturing_speed ?? (isFirstPlanet ? 20 : 0)) : (isFirstPlanet ? 20 : 0);
    } catch {
      // fallback
    }

    try {
      const res = await fetch('/api/train/troop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ 
          planetId: currentPlanet.id, 
          troopId, 
          quantity,
          manufacturingSpeedLevel 
        })
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
    missionType: 'attack' | 'colonize' | 'recon' | 'move';
    troops: Record<string, number>;
    targetId?: string;
    targetName?: string;
    targetBuilding?: string;
    numFleets?: number;
    planetId?: string;
    createdFleetId?: string;
  }) => {
    if (!player) return;
    const currentPlanet = player.planets.find(pl => pl.id === (mission.planetId || selectedPlanetId)) || player.planets[0];
    
    let troopSpeedLevel = 1;
    let defenseShieldsLevel = 1;
    try {
      const isFirstPlanet = player.planets[0]?.id === currentPlanet.id;
      const savedTech = localStorage.getItem(`moonbase_tech_${player.id}_${currentPlanet.id}`);
      if (savedTech) {
        const parsed = JSON.parse(savedTech);
        troopSpeedLevel = parsed.troop_speed ?? (isFirstPlanet ? 20 : 0);
        defenseShieldsLevel = parsed.defense_shields ?? (isFirstPlanet ? 20 : 0);
      } else {
        troopSpeedLevel = isFirstPlanet ? 20 : 0;
        defenseShieldsLevel = isFirstPlanet ? 20 : 0;
      }
    } catch {
      // fallback
    }

    const numFleets = mission.numFleets || 1;

    if (numFleets <= 1) {
      try {
        const res = await fetch('/api/fleet/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': player.id
          },
          body: JSON.stringify({
            planetId: currentPlanet.id,
            troopSpeedLevel,
            defenseShieldsLevel,
            ...mission
          })
        });
        const data = await safeParseJson(res);
        if (res.ok) {
          setPlayer(data.player);
          if (data.fleets) {
            setFleets(data.fleets);
          }
          showToast(`FLEET DEPLOYED! Mission: ${mission.missionType.toUpperCase()} dispatched.`, 'success');
          setActiveTab('galaxy'); // Swapp tab to allow monitoring of travels!
          const newMission = data.fleets?.find((f: any) => f.createdFleetId === mission.createdFleetId) 
            || (data.fleets && data.fleets[data.fleets.length - 1]);
          return newMission;
        } else {
          showToast(data.error || 'Fleet blocked by flight control', 'error');
        }
      } catch (err) {
        showToast('Launch failure', 'error');
      }
    } else {
      // Split troops across standard separate fleets
      const fleetsToSend: Record<string, number>[] = Array.from({ length: numFleets }, () => ({
        defender: 0,
        attacker: 0,
        tank: 0,
        looter: 0,
        drone: 0,
        settlementShip: 0
      }));

      for (const [tId, totalQty] of Object.entries(mission.troops)) {
        const qty = totalQty || 0;
        if (qty > 0) {
          const baseQty = Math.floor(qty / numFleets);
          const remainder = qty % numFleets;
          for (let i = 0; i < numFleets; i++) {
            fleetsToSend[i][tId] = baseQty + (i < remainder ? 1 : 0);
          }
        }
      }

      let latestPlayer = player;
      let anySuccess = false;
      let errorMsg = '';

      for (let i = 0; i < numFleets; i++) {
        const subTroops = fleetsToSend[i];
        const hasAny = Object.values(subTroops).some(v => v > 0);
        if (!hasAny) continue;

        try {
          const res = await fetch('/api/fleet/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': player.id
            },
            body: JSON.stringify({
              planetId: currentPlanet.id,
              troopSpeedLevel,
              defenseShieldsLevel,
              targetX: mission.targetX,
              targetY: mission.targetY,
              missionType: mission.missionType,
              troops: subTroops,
              targetId: mission.targetId,
              targetName: mission.targetName,
              targetBuilding: mission.targetBuilding
            })
          });
          const data = await safeParseJson(res);
          if (res.ok) {
            latestPlayer = data.player;
            anySuccess = true;
          } else {
            errorMsg = data.error || 'Sub-fleet blocked';
          }
        } catch (err) {
          errorMsg = 'Launch failure';
        }
      }

      if (anySuccess) {
        setPlayer(latestPlayer);
        showToast(`DISPATCHED MULTIPLE FLEETS! Created ${numFleets} distinct en-route tactical squadrons.`, 'success');
        setActiveTab('galaxy');
      } else {
        showToast(errorMsg || 'Failed to dispatch plural fleets', 'error');
      }
    }
  };

  const handleRerouteFleet = async (fleetId: string, targetX: number, targetY: number, missionType?: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/fleet/reroute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          fleetId,
          targetX,
          targetY,
          missionType
        })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        fetchState();
        showToast('TACTICAL CO-ORDINATES RE-ROUTED! Fleet vectors updated.', 'success');
      } else {
        showToast(data.error || 'Coordinates reroute refused', 'error');
      }
    } catch (err) {
      showToast('Network error on rerouting', 'error');
    }
  };

  const handleStartSettleFlow = (fleetId: string) => {
    setSettleFleetId(fleetId);
    setCustomColonyName(''); // Ensure it starts completely empty with no default name
  };

  const handleExecuteSettle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!player || !settleFleetId) return;
    const trimmedName = customColonyName.trim();
    if (!trimmedName) {
      showToast('A custom station name is required!', 'error');
      return;
    }
    if (trimmedName.length > 30) {
      showToast('Station name must be 30 characters or less', 'error');
      return;
    }

    try {
      const res = await fetch('/api/fleet/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ fleetId: settleFleetId, customName: trimmedName })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        setPlayer(data.player);
        if (data.fleets) {
          setFleets(data.fleets);
        }
        showToast(`COLONY ESTABLISHED! Connected to station: ${trimmedName}`, 'success');
        setSettleFleetId(null);
        setCustomColonyName('');
      } else {
        showToast(data.error || 'Failed to settle coordinates', 'error');
      }
    } catch (err) {
      showToast('Settlement execution failure', 'error');
    }
  };

  const handleRenameActiveStation = async () => {
    if (!newNameInput.trim()) {
      showToast('Station name cannot be empty!', 'error');
      return;
    }
    if (newNameInput.trim().length > 30) {
      showToast('Station name must be 30 characters or less', 'error');
      return;
    }
    if (!player || !activePlanet) return;
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
        showToast(`Station renamed to: ${newNameInput}`, 'success');
        setIsEditingName(false);
        fetchState();
      } else {
        showToast(data.error || 'Failed to rename station', 'error');
      }
    } catch (err) {
      showToast('Network error during renaming', 'error');
    }
  };

  const handleSendChat = async (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ channel, content, receiverId })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem(`moonbase_chatted_${player.id}`, 'true');
        fetchState();
      } else {
        showToast(data.error || 'Failed to dispatch chat transmission.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Quantum transceiver latency detected. Chat transmission failed.', 'error');
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
        localStorage.setItem(`moonbase_alliance_joined_${player.id}`, 'true');
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
        localStorage.setItem(`moonbase_alliance_joined_${player.id}`, 'true');
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
        localStorage.setItem(`moonbase_nexus_claimed_${player.id}`, 'true');
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

  // Dispatch secure holographic message
  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!player) return;
    try {
      setIsSendingMsg(true);
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ receiverId, content })
      });
      const data = await safeParseJson(res);
      if (res.ok) {
        localStorage.setItem(`moonbase_msg_sent_${player.id}`, 'true');
        showToast('Holographic transmission sent successfully!', 'success');
        setProfileMsgText("");
        setDirectMsgContent("");
        setViewingPlayerId(null); // auto-close player profile
        setShowCommDeck(true);    // show the message deck to view sent logs
        setCommDeckTab('sent');   // focus on sent transmissions
        // Instantly sync state to reflect the dispatch
        fetchState();
      } else {
        showToast(data.error || 'Failed to send transmission.', 'error');
      }
    } catch (err) {
      showToast('Quantum communication network unstable.', 'error');
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Toggle Read / Unread message status
  const handleToggleMessageRead = async (messageId: string, isRead: boolean) => {
    if (!player) return;
    try {
      const res = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ messageId, isRead })
      });
      const data = await safeParseJson(res);
      if (res.ok && data.player) {
         setPlayer(data.player);
      }
    } catch (err) {
      console.error('Error toggling read state:', err);
    }
  };

  // Toggle Save message status
  const handleToggleSaveMessage = async (messageId: string, isSaved: boolean) => {
    if (!player) return;
    try {
      const res = await fetch('/api/messages/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ messageId, isSaved })
      });
      const data = await safeParseJson(res);
      if (res.ok && data.player) {
         setPlayer(data.player);
         showToast(isSaved ? 'Transmission secure saved to core memory.' : 'Transmission unsaved.', 'info');
      }
    } catch (err) {
      console.error('Error toggling save status:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!player) return;
    try {
      const res = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ messageId })
      });
      const data = await safeParseJson(res);
      if (res.ok && data.player) {
         setPlayer(data.player);
         showToast('Secure transmission purged from local logs.', 'info');
      }
    } catch (err) {
      console.error('Error deleting transmission:', err);
    }
  };

  // Toggle Theme Light / Dark
  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Login signup routing
  if (!userId || !player) {
    return (
      <div className={`min-h-screen bg-[#05070A] text-slate-300 flex flex-col items-center justify-center p-4 font-mono select-none theme-${theme}`}>
        <div className="w-full max-w-lg p-8 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.05)] backdrop-blur-md relative overflow-hidden">
          {/* Glowing particle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {connectionError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 animate-pulse text-sm">⚠️</span>
                <span className="font-bold uppercase tracking-wider text-[10px] text-rose-300 font-sans">Space Gateway Connection Issue</span>
              </div>
              <p className="leading-relaxed font-sans text-slate-300">
                The terminal is struggling to communicate with the central server:
              </p>
              <div className="bg-[#05070A] p-2.5 rounded font-mono text-[10px] text-rose-400 border border-rose-950/40 break-all select-all">
                {connectionError}
              </div>
              <p className="text-slate-450 text-[10px] font-sans leading-normal text-slate-400">
                This often occurs if the container server is currently re-building, sleeping, or if local browser cookie permissions are blocking request frames.
              </p>
              <div className="flex gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionError(null);
                    showToast('Initiating emergency system sync...', 'info');
                    window.location.reload();
                  }}
                  className="flex-1 py-2 px-3 bg-[#450A0A]/30 hover:bg-[#7F1D1D]/30 border border-rose-500/30 text-rose-300 rounded text-[10px] font-semibold transition text-rose-350 cursor-pointer text-center"
                >
                  ⚡ Emergency Reload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('space_station_backend_url');
                    setConnectionError(null);
                    showToast('Terminal terminal modules aligned!', 'success');
                    setTimeout(() => window.location.reload(), 600);
                  }}
                  className="flex-1 py-2 px-3 bg-cyan-955/40 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 hover:text-white rounded text-[10px] font-semibold transition text-cyan-400 cursor-pointer text-center"
                >
                  🛠️ Reset Terminal Config
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-8 relative">
            <div className="text-left font-sans text-xs sm:text-sm text-slate-300 space-y-3.5 mb-4 leading-relaxed border-b border-[#1E293B]/40 pb-4 pr-1 select-text">
              <p className="text-cyan-400 font-extrabold font-mono tracking-wider text-sm">Year 2095</p>
              <p>Earth is no longer the center of civilization.</p>
              <p>Hundreds of worlds have been settled, thousands remain unexplored, and powerful alliances compete for control of the galaxy's most valuable sectors.</p>
              <p>As commander of a newly commissioned Station, you have been granted rights to establish a colony on an unclaimed planet.</p>
              <p>Your station is small. Your resources are limited.</p>
              <p className="border-l-2 border-cyan-500/40 pl-3 italic text-slate-400">But every galactic empire began as a single colony.</p>
              <p>Expand your territory. Develop advanced technology. Form alliances. Conquer the stars.</p>
              <p className="text-cyan-300 font-semibold font-mono text-xs">The galaxy is waiting.</p>
            </div>
            
            <div className="text-center mt-4 flex flex-col items-center justify-center">
              <img 
                src={welcomeBanner} 
                alt="Space Station Commander Logo Banner" 
                className="w-full max-w-md h-auto rounded-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {showSignup ? (
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-5 relative">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">Commander Name</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="E.g. VoidWraith"
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">Terminal Passkey (Optional password)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter simple password to protect account..."
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">Choose your Theme</label>
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
                  <option value="light">☀️ Original Theme (White Light)</option>
                  <option value="normal">🌌 Classic Solar Blue Theme</option>
                  <option value="dark">⬛ Obsidian Pitch Black Theme</option>
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
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5 relative">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">Commander Name</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Registered username..."
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">Terminal Passkey (Password)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your passkey..."
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

          {/* Google Sign-In Option Divider */}
          <div className="relative my-6 select-none">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#1E293B]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="px-3 bg-[#0A0F1D] text-slate-500 font-mono">Or secure sync via</span>
            </div>
          </div>

          {/* Branded Google Login button */}
          <button 
            type="button"
            onClick={() => setShowGoogleDialog(true)}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-[#1F2937] font-bold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition duration-150 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.13-.07-.25-.15-.35-.22" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Continue with Google Account</span>
          </button>



        </div>

        {/* Google Authentication Dialog Overlay */}
        {showGoogleDialog && (
          <div className="fixed inset-0 bg-[#05070A]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 font-sans text-gray-800 border border-gray-100 flex flex-col items-center">
              {/* Google Brand Logo in color */}
              <div className="flex items-center gap-1 mb-6">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.13-.07-.25-.15-.35-.22" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span className="font-semibold text-sm text-gray-700">Google Credentials</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 text-center">Choose Google Account</h2>
              <p className="text-xs text-gray-500 text-center mt-1 mb-6">to continue to Space Station</p>

              {/* Accounts list */}
              <div className="w-full space-y-2.5">
                {deviceGoogleAccounts.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                    <p className="text-xs text-gray-400">No active device Google sessions detected.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const customEmail = window.prompt("Please enter your Google account email:");
                        if (customEmail && customEmail.includes("@")) {
                          const customName = window.prompt("Please choose your Commander name for this Google Account:", customEmail.split("@")[0]);
                          handleGoogleSignIn(customEmail, customName || undefined);
                        } else if (customEmail) {
                          window.alert("Invalid email format!");
                        }
                      }}
                      className="mt-3.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold font-mono text-[11px] uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
                    >
                      + ADD GOOGLE ACCOUNT
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {deviceGoogleAccounts.map((acc) => (
                      <div 
                        key={acc.email}
                        className="group w-full p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-between gap-2 transition"
                      >
                        <button 
                          type="button"
                          onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                          className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {acc.name ? acc.name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-gray-800 truncate">{acc.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">{acc.email}</div>
                          </div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDeviceGoogleAccount(acc.email);
                          }}
                          className="p-1 text-gray-300 hover:text-red-500 rounded hover:bg-gray-100 transition duration-150"
                          title="Remove from this device"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom input or cancel options */}
                <div className="pt-3 border-t border-gray-100 flex justify-between w-full">
                  {deviceGoogleAccounts.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        const customEmail = window.prompt("Please enter your custom Google account email:");
                        if (customEmail && customEmail.includes("@")) {
                          const customName = window.prompt("Please choose your Commander name for this Google Account:", customEmail.split("@")[0]);
                          handleGoogleSignIn(customEmail, customName || undefined);
                        } else if (customEmail) {
                          window.alert("Invalid email format!");
                        }
                      }} 
                      className="text-xs text-cyan-600 font-bold hover:underline"
                    >
                      Use another account
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setShowGoogleDialog(false)}
                    className="text-xs text-gray-400 hover:text-gray-650 hover:underline ml-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Loaded active interface
  const activePlanet = player.planets.find(pl => pl.id === selectedPlanetId) || player.planets[0];
  const repositoryLimit = Math.round(10000 * Math.pow(500, (activePlanet.buildings.repository.level - 1) / 44));

  return (
    <div className={`min-h-screen max-w-full overflow-x-hidden font-sans bg-[#05070A] text-slate-350 selection:bg-cyan-500/25 pb-24 theme-${theme}`}>
      
      {/* Toast Notice alerts */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 border rounded-xl font-mono text-xs flex items-center gap-3 max-w-sm w-full animate-bounce bg-[#0A0F1D] border-[#1E293B] shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          <Info size={16} className={toast.type === 'error' ? 'text-red-400' : 'text-cyan-400'} />
          <span className="text-slate-100 flex-1 font-sans">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white font-sans text-lg">&times;</button>
        </div>
      )}

      {/* Connection Failure Diagnostic Banner */}
      {connectionError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 p-4 border rounded-xl font-mono text-xs flex flex-col gap-2.5 max-w-md w-full bg-[#0F0C0D] border-rose-500/40 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
          <div className="flex items-center gap-2.5">
            <span className="text-rose-500 animate-pulse text-sm">⚠️</span>
            <span className="text-slate-200 flex-1 font-sans font-bold text-xs uppercase tracking-wider">Communication Interrupted</span>
          </div>
          <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
            The space-station terminal lost contact with the server. Error details: <code className="text-rose-400 break-all">{connectionError}</code>
          </p>
          <div className="flex gap-2 font-sans mt-0.5">
            <button 
              onClick={() => {
                setConnectionError(null);
                showToast('Rechecking communications channels...', 'info');
                fetchState();
              }} 
              className="flex-1 py-1.5 bg-rose-950/30 hover:bg-rose-900/30 border border-rose-500/30 text-rose-300 rounded text-[10px] font-bold transition cursor-pointer"
            >
              🔄 Recheck Connection
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('space_station_backend_url');
                setConnectionError(null);
                showToast('Terminal terminal modules aligned!', 'success');
                setTimeout(() => window.location.reload(), 1000);
              }} 
              className="flex-1 py-1.5 bg-cyan-950/30 hover:bg-[#0E2034] border border-cyan-500/30 text-cyan-400 rounded text-[10px] font-bold transition cursor-pointer"
            >
              🛠️ Reset Terminal Config
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header Navbar info */}
      <header className="sticky top-0 z-40 h-20 bg-[#0A0F1D] border-b border-[#1E293B] flex items-center justify-between px-6 shrink-0 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse bg-cyan-400 shadow-[0_0_10px_#22d3ee] shrink-0" 
          />
          {/* Slick unified Custom Station Selector Dropdown */}
          <div className="relative font-mono leading-none flex items-center">
            <button
              id="active-station-selector-btn"
              type="button"
              onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
              className="bg-[#05070A]/90 hover:bg-[#1E293B]/40 text-cyan-400 hover:text-white text-xs font-bold py-2 px-3 rounded-xl border border-cyan-500/15 focus:border-cyan-500/50 hover:border-cyan-500/40 focus:outline-none cursor-pointer transition flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.06)] active:scale-95"
            >
              <span className="text-[9px] text-slate-500 tracking-wider">STATION:</span>
              <span className="truncate max-w-[125px] text-slate-100 font-black tracking-tight">{activePlanet.name}</span>
              <span className="text-cyan-400 text-[10px] font-bold">[{activePlanet.sectorX}, {activePlanet.sectorY}]</span>
              <ChevronDown size={12} className={`text-cyan-400 transition-transform duration-200 shrink-0 ${stationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {stationDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setStationDropdownOpen(false)} />
                <div 
                  id="station-selector-popup-list"
                  className="absolute left-0 top-11 mt-1 w-64 bg-[#0A0F1D]/98 border border-cyan-500/40 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] p-2 z-50 text-left font-mono backdrop-blur-md animate-fade-in flex flex-col gap-1"
                >
                  <div className="px-2.5 py-1.5 border-b border-[#1E293B]/45 mb-1">
                    <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-widest">Select Tactical Station</span>
                  </div>
                  {player.planets.map((pl, idx) => {
                    const isActive = pl.id === activePlanet.id;
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanetId(pl.id);
                          setStationDropdownOpen(false);
                          showToast(`Switched active command site to ${pl.name}`, 'success');
                        }}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left text-xs transition duration-150 cursor-pointer ${isActive ? 'bg-cyan-500/10 border border-cyan-500/25 text-white' : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <div className="flex flex-col gap-0.5 truncate min-w-0 pr-2">
                          <span className={`font-bold text-[11px] truncate ${isActive ? 'text-cyan-400 font-black' : 'text-slate-200'}`}>
                            {idx === 0 ? "★ " : "🛰️ "}{pl.name}
                          </span>
                          <span className="text-[9px] text-[#22D3EE] font-mono tracking-wide">
                            Sector Grid Coordinates: [{pl.sectorX}, {pl.sectorY}]
                          </span>
                        </div>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase shrink-0">ACTIVE</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Badge with User icon next to interactive Rank/Score indicator */}
        <div className="flex items-center gap-2 relative">
          <div 
            onClick={() => {
              setGalaxyInitialSubTab('ranking');
              setActiveTab('galaxy');
            }}
            className="flex flex-col items-end font-mono cursor-pointer group hover:opacity-90 transition-all"
            title="Click to view Sovereignty Leaderboard rankings"
          >
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-cyan-400">Commander Rank</span>
            <span className="text-[11px] font-black text-cyan-400 group-hover:underline decoration-dotted">
              #{myPopulationRankIndex} 🏆
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setShowCommDeck(true)}
            className="w-10 h-10 border border-cyan-500/40 flex items-center justify-center rounded bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-500/20 active:scale-101 transition-all duration-150 cursor-pointer relative z-50 mr-1"
            title="Open Secure Command Comm-Messages"
          >
            <Mail size={18} className="text-cyan-400" />
            {(() => {
              const count = player.commandMessages?.filter(m => !m.isRead).length || 0;
              if (count > 0) {
                return (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[9px] font-black text-white ring-1 ring-[#1E293B] animate-pulse shadow-[0_0_8px_#ef4444]">
                    {count}
                  </span>
                );
              }
              return null;
            })()}
          </button>

          <button 
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 border border-cyan-500/40 flex items-center justify-center rounded bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-500/20 active:scale-95 transition-all duration-150 cursor-pointer relative z-50"
            title="Open Commander Stations & HP status"
          >
            <User size={18} className="text-cyan-400" />
            
            {/* Pulsing indicator to show it's interactive */}
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setAppConfirmModal({
                title: 'CONFIRM SESSION DE-SYNCHRONIZATION',
                message: 'Are you sure you want to log out of your session? Your current account session reference will be purged from LocalStorage and you will be re-routed to registration.',
                onConfirm: () => {
                  localStorage.removeItem('moonbase_userId');
                  showToast('Commander keys de-synchronized. Reloading terminal...', 'info');
                  setTimeout(() => {
                    window.location.reload();
                  }, 600);
                }
              });
            }}
            className="w-10 h-10 border border-red-500/30 hover:border-red-500/60 flex items-center justify-center rounded bg-red-950/10 hover:bg-red-950/25 active:scale-95 transition-all duration-150 cursor-pointer text-red-400"
            title="Log Out & Create/Use a New Username"
          >
            <LogOut size={16} />
          </button>

          {/* Invisible backdrop to support closing the dropdown */}
          {profileDropdownOpen && (
            <div 
              className="fixed inset-0 z-40 bg-transparent cursor-default" 
              onClick={() => setProfileDropdownOpen(false)}
            />
          )}

          {/* Commander Stations & HP/troop dropdown card */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-12 mt-2 w-72 bg-[#0A0F1D]/95 border border-cyan-500/35 rounded-xl shadow-[0_4px_30px_rgba(34,211,238,0.35)] p-4.5 z-50 text-left font-mono backdrop-blur-md animate-fade-in space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="border-b border-[#1E293B] pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#22D3EE] flex items-center gap-1.5">
                  🛰️ Commander Stations Hub
                </h3>
                <p className="text-[9px] text-[#94A3B8] leading-tight font-sans mt-1">
                  Active tactical deployment & garrison strength overview.
                </p>
              </div>

              {/* Planets detailed listing */}
              <div className="space-y-2">
                {player.planets.map((planet, index) => {
                  const isPlExpanded = expandedDropdownPlanetIds[planet.id] || false;
                  
                  // HP & Firepower mapping details
                  const defHpMap: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                  const atkHpMap: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                  const troops = planet.troops || {};
                  
                  const planetDefHp = Object.entries(troops).reduce((sum, [k, v]) => sum + (Number(v) || 0) * (defHpMap[k] || 0), 0);
                  const planetAtkHp = Object.entries(troops).reduce((sum, [k, v]) => sum + (Number(v) || 0) * (atkHpMap[k] || 0), 0);
                  
                  return (
                    <div key={planet.id} className="bg-slate-950/50 border border-[#1E293B]/60 rounded-lg overflow-hidden transition hover:border-[#1E293B]">
                      <button
                        type="button"
                        onClick={() => setExpandedDropdownPlanetIds(prev => ({ ...prev, [planet.id]: !isPlExpanded }))}
                        className="w-full p-2.5 flex items-center justify-between text-left text-xs text-slate-300 font-bold hover:text-cyan-300 transition-colors duration-150 cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5 truncate pr-2">
                          <span className="truncate text-white font-mono text-[11px]">
                            {index === 0 ? "★ " : index === 1 ? "★★ " : "🛰️ "}{planet.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono tracking-wide">
                            Sector [{planet.sectorX}, {planet.sectorY}]
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                          <span className="text-blue-400 font-bold" title="Defensive Shields (Defense HP)">
                            🛡️ {planetDefHp.toLocaleString()}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className="text-orange-400 font-bold" title="Strike Firepower (Attack HP)">
                            ⚔️ {planetAtkHp.toLocaleString()}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold ml-1">
                            {isPlExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>

                      {/* Expandable Planet troops */}
                      {isPlExpanded && (
                        <div className="px-2.5 pb-2.5 pt-1 space-y-2 text-[10.5px] border-t border-[#1E293B]/40 bg-black/40 text-slate-400">
                          {Object.entries(troops).filter(([_, qty]) => (Number(qty) || 0) > 0).length === 0 ? (
                            <p className="text-[9.5px] text-slate-500 italic py-1 text-center">Garrison is currently empty.</p>
                          ) : (
                            <div className="space-y-1">
                              {Object.entries(troops).map(([type, qty]) => {
                                if (!qty) return null;
                                const uDefHp = defHpMap[type] || 10;
                                const uAtkHp = atkHpMap[type] || 10;
                                const quantityNum = Number(qty) || 0;
                                return (
                                  <div key={type} className="flex justify-between text-[10px] leading-relaxed">
                                    <span className="text-slate-400 font-sans">{TROOP_NAME_MAPPING[type] || type}:</span>
                                    <span className="font-bold text-slate-200 font-mono text-right">
                                      {quantityNum.toLocaleString()} <span className="text-[8.5px] text-blue-400">({(quantityNum * uDefHp).toLocaleString()} DEF)</span> <span className="text-[8.5px] text-orange-400">({(quantityNum * uAtkHp).toLocaleString()} ATK)</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cumulative forces section */}
              <div className="pt-2.5 pb-1 border-t border-[#1E293B] space-y-1">
                <span className="text-[9.5px] text-cyan-400 font-mono font-bold uppercase tracking-widest block mb-1">CUMULATIVE COMBAT FORCES</span>
                <div className="space-y-1 bg-[#05070A]/50 p-2 rounded-lg border border-[#1E293B]/40">
                  {(() => {
                    const defHpMap: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                    const atkHpMap: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                    const cumulativeCounts: Record<string, number> = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };
                    
                    player.planets.forEach(pl => {
                      Object.entries(pl.troops || {}).forEach(([k, v]) => {
                        if (cumulativeCounts[k] !== undefined) {
                          cumulativeCounts[k] += (Number(v) || 0);
                        }
                      });
                    });

                    const activeTroops = Object.entries(cumulativeCounts).filter(([_, qty]) => qty > 0);
                    if (activeTroops.length === 0) {
                      return <p className="text-[9.5px] text-slate-500 italic py-1 text-center">No active garrisons across all stations.</p>;
                    }

                    return activeTroops.map(([type, qty]) => {
                      const uDefHp = defHpMap[type] || 10;
                      const uAtkHp = atkHpMap[type] || 10;
                      return (
                        <div key={type} className="flex justify-between text-[10px] leading-relaxed">
                          <span className="text-slate-400 font-sans">{TROOP_NAME_MAPPING[type] || type}:</span>
                          <span className="font-bold text-slate-200 font-mono text-right">
                            {qty.toLocaleString()} <span className="text-[8.5px] text-blue-400">({(qty * uDefHp).toLocaleString()} DEF)</span> <span className="text-[8.5px] text-orange-400">({(qty * uAtkHp).toLocaleString()} ATK)</span>
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Total cumulative HP footer */}
              <div className="pt-2.5 border-t border-[#1E293B] flex flex-col gap-1.5 text-xs text-slate-400 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CUMULATIVE DEFENSE</span>
                  <span className="text-blue-400 font-black text-right tracking-tight bg-blue-950/20 px-2 py-0.5 rounded border border-blue-500/20">
                    {player.planets.reduce((sum, pl) => {
                      const defHpMap: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                      return sum + Object.entries(pl.troops || {}).reduce((subSum, [k, v]) => subSum + (Number(v) || 0) * (defHpMap[k] || 0), 0);
                    }, 0).toLocaleString()} DEF
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CUMULATIVE ATTACK</span>
                  <span className="text-orange-400 font-black text-right tracking-tight bg-orange-950/20 px-2 py-0.5 rounded border border-orange-500/20">
                    {player.planets.reduce((sum, pl) => {
                      const atkHpMap: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };
                      return sum + Object.entries(pl.troops || {}).reduce((subSum, [k, v]) => subSum + (Number(v) || 0) * (atkHpMap[k] || 0), 0);
                    }, 0).toLocaleString()} ATK
                  </span>
                </div>
              </div>

              {/* Quick Logout and New Commander activation button */}
              <div className="pt-2.5 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => {
                    setAppConfirmModal({
                      title: 'CONFIRM SESSION DE-SYNCHRONIZATION',
                      message: 'Are you sure you want to log out of your session? Your current account session reference will be purged from LocalStorage and you will be re-routed to registration.',
                      onConfirm: () => {
                        localStorage.removeItem('moonbase_userId');
                        setProfileDropdownOpen(false);
                        showToast('Commander keys de-synchronized. Reloading terminal...', 'info');
                        setTimeout(() => {
                          window.location.reload();
                        }, 600);
                      }
                    });
                  }}
                  className="w-full py-2 bg-gradient-to-r from-red-950/40 to-red-900/40 hover:from-red-950/60 hover:to-red-900/60 border border-red-500/30 text-red-400 rounded-lg text-[9.5px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut size={11} /> Log Out / Register New Name
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Screen view router container */}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-24 animate-fade-in animate-duration-500">
        {activeTab === 'explore' && player && activePlanet && (() => {
          // Compute dynamic operation alerts:
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

          // Hydration / Negative Production Check
          const getResourceProductionVal = (resKey: 'water' | 'respirant' | 'food') => {
            const isOtherMaxed = 
              activePlanet.resources.water >= repositoryLimit &&
              activePlanet.resources.plasma >= repositoryLimit &&
              activePlanet.resources.fuel >= repositoryLimit &&
              activePlanet.resources.food >= repositoryLimit &&
              activePlanet.resources.respirant >= repositoryLimit;
              
            const mList = activePlanet.mines[resKey] || [];
            if (isOtherMaxed) {
              return resKey === 'water' ? 84000 : 42000;
            }
            return mList.reduce((sum, m) => {
              const isMineBoosted = m.boostedUntil && Number(m.boostedUntil) > serverTime;
              const baseOutput = Math.round((m.level / 15) * (resKey === 'water' ? 14000 : 8333.33));
              const output = isMineBoosted ? Math.round(baseOutput * 1.14) : baseOutput;
              return sum + output;
            }, 0);
          };

          const waterHourly = getResourceProductionVal('water');
          const respirantHourly = getResourceProductionVal('respirant');
          const foodHourly = getResourceProductionVal('food');

          let waterCons = 0;
          const specCosts = { defender: 1.0, attacker: 2.0, tank: 4.0, looter: 3.0, drone: 0.4, settlementShip: 5.0 };
          Object.entries(activePlanet.troops).forEach(([tId, count]) => {
            waterCons += (Number(count) || 0) * (specCosts[tId as keyof typeof specCosts] || 0);
          });
          const respirantCons = waterCons * 0.28;
          const foodCons = waterCons * 0.18;

          const isWaterNeg = waterHourly < waterCons;
          const isRespirantNeg = respirantHourly < respirantCons;
          const isFoodNeg = foodHourly < foodCons;
          const isAnyProdNeg = isWaterNeg || isRespirantNeg || isFoodNeg;
          const isDehydratedStatus = activePlanet.resources.water < 0 || activePlanet.resources.respirant < 0 || activePlanet.resources.food < 0 || isAnyProdNeg;

          return (
            <div className="space-y-4 mb-6">
              {/* Main Dynamic Resource Stats HUD Panels */}
              <div className="bg-[#0A0F1D]/60 backdrop-blur-sm border border-slate-800/65 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-0 p-0 divide-x divide-y md:divide-y-0 divide-slate-800/40 overflow-hidden">
                {/* Water Stat */}
                <div className="flex flex-col p-4.5 sm:p-5 animate-fade-in text-left" title="Water (H2O): Essential life fluid. Consumed continuously by troops to maintain Space Force strength.">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplet size={12} className="text-cyan-400 animate-pulse" />
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
                <div className="flex flex-col p-4.5 sm:p-5 animate-fade-in text-left header-divider-element-left" title="Plasma: High-energy matter. Essential for building complex spaceship hull grades and hyper-engines.">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={12} className="text-purple-400 animate-pulse" />
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
                <div className="flex flex-col p-4.5 sm:p-5 animate-fade-in text-left border-t md:border-t-0 border-slate-800/40" title="Fuel: Thermonuclear propulsion energy. Required for dispatching fleet traversals across global planetary sectors.">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={12} className="text-amber-400 animate-pulse" />
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
                <div className="flex flex-col p-4.5 sm:p-5 animate-fade-in text-left border-t md:border-t-0 border-slate-800/40" title="Food: Life support proteins. Vital to sustaining personnel during active colonist station operations.">
                  <div className="flex items-center gap-2 mb-1">
                    <Apple size={12} className="text-emerald-400 animate-pulse" />
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
                <div className="flex flex-col col-span-2 md:col-span-1 p-4.5 sm:p-5 animate-fade-in text-left border-t md:border-t-0 border-slate-800/40" title="Respirant (O2): Atmospheric gases. Powering life ventilation systems for astronauts and pilots.">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind size={12} className="text-blue-400 animate-pulse" />
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

              {/* Station Details Header with Holographic Glow */}
              <div className="relative p-6 bg-gradient-to-b from-[#0F172A] to-black border border-white/5 rounded-xl overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase font-mono">SECTOR COMMAND SITE</span>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mt-1 max-w-md">
                        <input
                          type="text"
                          maxLength={30}
                          value={newNameInput}
                          onChange={(e) => setNewNameInput(e.target.value)}
                          className="flex-1 px-3 py-1 bg-slate-955 bg-slate-950 border border-cyan-500/50 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none text-sm text-white font-mono rounded-lg transition"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameActiveStation();
                            if (e.key === 'Escape') {
                              setIsEditingName(false);
                              setNewNameInput(activePlanet.name);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleRenameActiveStation}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                          title="Save Name"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingName(false);
                            setNewNameInput(activePlanet.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition cursor-pointer font-sans"
                          title="Cancel"
                        >
                          <span className="text-sm font-semibold select-none font-sans">✕</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 group">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{activePlanet.name}</h2>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="p-1 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/80 border border-cyan-500/20 hover:border-cyan-500/50 font-bold uppercase rounded-lg transition opacity-60 group-hover:opacity-100 flex items-center gap-1 cursor-pointer"
                          title="Rename Station Base"
                        >
                          <Edit2 size={10} /> Rename
                        </button>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-2 font-mono">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${pulseDot} animate-pulse`} />
                      <span>Commander: <span className="text-slate-200 font-bold">{player.username}</span> &bull; {activePlanet.name} &bull; Sector Coord: [{activePlanet.sectorX}, {activePlanet.sectorY}]</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {/* Active Sector Alerts indicator block */}
                    <button
                      id="alerts-hud-trigger"
                      onClick={() => setIsAlertsOpen(true)}
                      className={`p-3 border rounded-lg text-left font-mono min-w-[170px] cursor-pointer transition duration-150 hover:brightness-110 active:scale-95 flex flex-col justify-center ${alertsColor}`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-75">{alertsLabel}</span>
                      <span className="text-[11px] font-black uppercase mt-1 tracking-tight flex items-center gap-1.5 font-mono">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                        {alertsValue}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {isDehydratedStatus && (
                <div className="p-3 border border-red-900/50 bg-red-950/30 text-red-400 rounded-xl flex items-start gap-2.5 text-xs animate-pulse text-left" title="Critical Alert: High severity base warning">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce text-red-500" />
                  <div>
                    <p className="font-bold uppercase tracking-widest text-[10px]">CRITICAL NEGATIVE PRODUCTION (ATTRITION PASSIVE)</p>
                    <p className="text-red-300/80 leading-relaxed mt-0.5">Troops are suffering rapid attrition due to negative production! Upgrade resource extractors immediately built with deeper wells or dismiss excess troops.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'explore' && player && activePlanet && (
          <CommanderTutorial 
            player={player}
            activePlanet={activePlanet}
            fleets={fleets}
            onRefreshState={fetchState}
            showToast={showToast}
            setActiveTab={setActiveTab}
            chatMessages={chatMessages}
          />
        )}

        {activeTab === 'explore' && player && (() => {
          const sortedByPopulation = [...playersList].sort((a, b) => b.scores.population - a.scores.population);
          const populationRank = sortedByPopulation.findIndex(p => p.id === player.id) + 1 || 1;
          return (
            <ExploreTab 
              player={player}
              activePlanet={activePlanet}
              onUpgradeMine={handleUpgradeMine}
              onUpgradeBuilding={handleUpgradeBuilding}
              serverTime={serverTime}
              fleets={fleets}
              onSettle={handleStartSettleFlow}
              showToast={showToast}
              onRefreshState={fetchState}
              onViewPlayerProfile={(pId) => setViewingPlayerId(pId)}
              populationRank={populationRank}
              onNavigateToLeaderboard={() => {
                setGalaxyInitialSubTab('ranking');
                setActiveTab('galaxy');
              }}
              chatMessages={chatMessages}
              onSendChat={handleSendChat}
              localResources={localResources}
            />
          );
        })()}

        {activeTab === 'army' && (
          <ArmyBaseTab 
            player={player}
            activePlanet={activePlanet}
            onTrainTroops={handleTrainTroops}
            serverTime={serverTime}
            battleReports={battleReports}
            readReports={readReports}
            savedReports={savedReports}
            onMarkRead={markReportRead}
            onMarkUnread={markReportUnread}
            onToggleSave={toggleSaveReport}
            onForwardReport={handleForwardReport}
            fleets={fleets}
            onSendFleet={handleSendFleet}
            onSettle={handleStartSettleFlow}
            createdFleets={createdFleets}
            setCreatedFleets={setCreatedFleets}
            onUpdatePlayer={setPlayer}
            onViewPlayerProfile={(pId) => setViewingPlayerId(pId)}
            localResources={localResources}
          />
        )}

        {activeTab === 'galaxy' && (
          <GalaxyTab 
            player={player}
            activePlanet={activePlanet}
            alliances={alliances}
            playersList={playersList}
            chatMessages={chatMessages}
            fleets={fleets}
            battleReports={battleReports}
            newsEvents={newsEvents}
            serverTime={serverTime}
            onSendFleet={handleSendFleet}
            onRerouteFleet={handleRerouteFleet}
            onSendChat={handleSendChat}
            onCreateAlliance={handleCreateAlliance}
            onJoinAlliance={handleJoinAlliance}
            onLeaveAlliance={handleLeaveAlliance}
            onDeclareWar={handleDeclareWar}
            onRefreshState={fetchState}
            showToast={showToast}
            readReports={readReports}
            savedReports={savedReports}
            onMarkRead={markReportRead}
            onMarkUnread={markReportUnread}
            onToggleSave={toggleSaveReport}
            onForwardReport={handleForwardReport}
            onViewPlayerProfile={(pId) => setViewingPlayerId(pId)}
            createdFleets={createdFleets}
            setCreatedFleets={setCreatedFleets}
            onUpdatePlayer={setPlayer}
            defaultSubTab={galaxyInitialSubTab}
            localResources={localResources}
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
            localResources={localResources}
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
            interactiveTabs={interactiveTabs}
            setInteractiveTabs={setInteractiveTabs}
            showToast={showToast}
            onRefreshState={fetchState}
            onLinkGoogle={handleLinkGoogleAccount}
            onOpenPayments={() => {
              setSelectedPaymentTier(null);
              setPaymentState('idle');
              setShowPaymentModal(true);
            }}
            onNavigateToLeaderboard={() => {
              setGalaxyInitialSubTab('ranking');
              setActiveTab('galaxy');
            }}
            populationRank={myPopulationRankIndex}
          />
        )}
      </main>

      {/* BOTTOM TAB MENU NAVIGATION PANEL (Elegant Dark Mockup matched exact style) */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0A0F1D]/95 backdrop-blur-md border-t border-[#1E293B] flex items-center shrink-0 px-2 justify-between transition-all duration-500 ease-in-out ${(!interactiveTabs || isScrolling || isMobileView) ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex-1 flex h-full">
          
          {/* Tab 1: Explore */}
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 border-r border-[#1E293B] group relative transition-colors duration-150 cursor-pointer ${activeTab === 'explore' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'explore' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className="text-base sm:text-lg filter drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] transform group-hover:scale-125 transition-transform duration-150 leading-none">🪐</span>
            <span className={`text-[9px] font-bold tracking-widest ${activeTab === 'explore' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>XPL</span>
          </button>

          {/* Tab 2: Army command */}
          <button 
            onClick={() => setActiveTab('army')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 border-r border-[#1E293B] group relative transition-colors duration-150 cursor-pointer ${activeTab === 'army' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'army' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className="text-base sm:text-lg filter drop-shadow-[0_0_5px_rgba(244,63,94,0.5)] transform group-hover:scale-125 transition-transform duration-150 leading-none">🛡️</span>
            <span className={`text-[9px] font-bold tracking-widest ${activeTab === 'army' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>CMD</span>
          </button>

          {/* Tab 3: Galaxy Scan Map */}
          <button 
            onClick={() => {
              setGalaxyInitialSubTab('scanner');
              setActiveTab('galaxy');
            }}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 border-r border-[#1E293B] group relative transition-colors duration-150 cursor-pointer ${activeTab === 'galaxy' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'galaxy' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className="text-base sm:text-lg filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] transform group-hover:scale-125 transition-transform duration-150 leading-none">📡</span>
            <span className={`text-[9px] font-bold tracking-widest ${activeTab === 'galaxy' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>RDR</span>
          </button>

          {/* Tab 4: Research Center */}
          <button 
            onClick={() => setActiveTab('research')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 group relative transition-colors duration-150 cursor-pointer ${activeTab === 'research' ? 'bg-cyan-500/10' : ''}`}
          >
            {activeTab === 'research' && <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
            <span className="text-base sm:text-lg filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] transform group-hover:scale-125 transition-transform duration-150 leading-none">🔬</span>
            <span className={`text-[9px] font-bold tracking-widest ${activeTab === 'research' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>Res</span>
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

      {/* SECURE MOONBASE STRIPE PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#05070A]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0A0F1D] border border-cyan-500/20 rounded-2xl shadow-[0_0_60px_rgba(34,211,238,0.1)] p-6 font-sans text-slate-100 flex flex-col relative overflow-hidden">
            
            {/* Glowing effect inside modal */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Coins className="text-amber-400 animate-bounce" size={20} />
                <div>
                  <h3 className="text-sm font-mono font-black uppercase tracking-widest text-white">Galactic Funding Secure Gateway</h3>
                  <p className="text-[10px] text-slate-500 font-mono">100% SECURE SSL STRIPE ENCRYPTED LEDGER CONNECTIONS ONLY</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white transition text-lg bg-[#05070A] hover:bg-[#1E293B] border border-[#1E293B] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {paymentState === 'idle' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-sans leading-relaxed">
                  Support the development of Space Station! Choose any of the following quantum financial funding packages to load premium **Space Gold (Credits)** directly into your commander ledger account.
                </div>

                {/* Tiers List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { amount: 1500, label: "Bronze Cargo Carrier", price: "$4.99", desc: "Acquire standardized supplies & extra gold credits booster for minor resource upgrades.", bonus: "Bronze Badge" },
                    { amount: 6000, label: "Commander's Tactical Cache", price: "$14.99", desc: "Gain massive tactical advantages. Adds premium credits plus unlocks high-tech HUD styling skin options.", bonus: "Unlock Sol Novacore Skin + Purple cosmetic tag", popular: true },
                    { amount: 25000, label: "Supreme Emperor's Core Vault", price: "$49.99", desc: "Ultimate financial supply crates bulk. Immediately provides unlimited credits for high-tier upgrades.", bonus: "Unlock Void Amethyst Skin + Emperor Badge" }
                  ].map((tier) => (
                    <button
                      key={tier.label}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentTier(tier);
                        setPaymentState('input');
                      }}
                      className={`relative text-left p-4 bg-[#05070A] border rounded-xl hover:bg-slate-900/50 hover:border-amber-500/40 transition-all duration-150 flex flex-col justify-between cursor-pointer group ${tier.popular ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-[#1E293B]'}`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 font-bold text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full shadow-md z-10 animate-pulse">
                          BEST DEAL
                        </span>
                      )}
                      <div>
                        <div className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">{tier.label}</div>
                        <div className="text-2xl font-black text-white font-mono mt-2 mb-1 group-hover:text-amber-400 transition-colors">{tier.price}</div>
                        <div className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1 mb-2">
                          <Coins size={11} /> +{tier.amount.toLocaleString()} Space Gold
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">{tier.desc}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#1e293b]/70 w-full text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-widest">
                        🎁 Bonus: {tier.bonus}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentState === 'input' && selectedPaymentTier && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-sans flex items-center justify-between bg-[#05070A] p-3 border border-[#1E293B] rounded-xl mb-2">
                  <div>
                    <span className="text-slate-500">SELECTED PACKAGE:</span>
                    <div className="text-sm font-bold text-white uppercase">{selectedPaymentTier.label}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">TOTAL COST:</span>
                    <div className="text-base font-black text-amber-400 font-mono">{selectedPaymentTier.price}</div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'card', name: 'Credit / Debit Card' },
                    { id: 'google', name: 'Google Pay' },
                    { id: 'apple', name: 'Apple Pay' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setCreditCardData(prev => ({ ...prev, method: method.id }))}
                      className={`py-2 px-3 border rounded-xl text-center font-mono text-xs font-bold transition-all duration-150 cursor-pointer ${creditCardData.method === method.id ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]' : 'bg-[#05070A] border-[#1E293B] text-slate-400 hover:bg-slate-900/40'}`}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>

                {creditCardData.method === 'card' ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!creditCardData.number || !creditCardData.name) {
                      showToast('Please enter all required credit card parameters', 'error');
                      return;
                    }
                    
                    // Simulate Stripe Transaction Processing
                    setPaymentState('processing');
                    setPaymentStepsLog('Establishing SSL handshake sequence...');
                    setTimeout(() => {
                      setPaymentStepsLog('Authorizing Stripe transaction parameters...');
                      setTimeout(() => {
                        setPaymentStepsLog('Acquiring digital Space Gold token allocation...');
                        setTimeout(async () => {
                          setPaymentStepsLog('Updating commander cloud database ledgers...');
                          await handleBuyCredits(selectedPaymentTier.amount, selectedPaymentTier.label);
                          setPaymentState('success');
                        }, 800);
                      }, 800);
                    }, 800);
                  }} className="space-y-3.5 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Cardholder Name (Secure SSL Name)</label>
                      <input 
                        type="text"
                        required
                        value={creditCardData.name}
                        onChange={(e) => setCreditCardData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Commander E.g. Jane Doe"
                        className="w-full px-4 py-2.5 bg-[#05070A] border border-[#1E293B] rounded-xl text-xs text-white focus:outline-none focus:border-amber-550 focus:shadow-[0_0_10px_rgba(245,158,11,0.1)] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Card Number (Stripe Encrypted)</label>
                      <div className="relative">
                        <input 
                          type="text"
                          required
                          maxLength={19}
                          value={creditCardData.number}
                          onChange={(e) => {
                            // Automatically insert spaces for formatting
                            const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            const matches = val.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || '';
                            const parts = [];

                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }

                            if (parts.length > 0) {
                              setCreditCardData(prev => ({ ...prev, number: parts.join(' ') }));
                            } else {
                              setCreditCardData(prev => ({ ...prev, number: val }));
                            }
                          }}
                          placeholder="4000 1234 5678 9010"
                          className="w-full px-4 py-2.5 bg-[#05070A] border border-[#1E293B] rounded-xl text-xs text-white focus:outline-none focus:border-amber-550 focus:shadow-[0_0_10px_rgba(245,158,11,0.1)] transition pl-10"
                        />
                        <span className="absolute left-3.5 top-3 text-slate-505 font-mono text-[9px] font-bold uppercase">CARD</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Expiry MM/YY</label>
                        <input 
                          type="text"
                          required
                          maxLength={5}
                          placeholder="12/28"
                          value={creditCardData.expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length > 2) {
                              val = val.substring(0, 2) + '/' + val.substring(2, 4);
                            }
                            setCreditCardData(prev => ({ ...prev, expiry: val }));
                          }}
                          className="w-full px-4 py-2.5 bg-[#05070A] border border-[#1E293B] rounded-xl text-xs text-white focus:outline-none focus:border-amber-550 focus:shadow-[0_0_10px_rgba(245,158,11,0.1)] transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">CVC / CVV</label>
                        <input 
                          type="password"
                          required
                          maxLength={4}
                          placeholder="999"
                          value={creditCardData.cvc}
                          onChange={(e) => setCreditCardData(prev => ({ ...prev, cvc: e.target.value.replace(/[^0-9]/g, '') }))}
                          className="w-full px-4 py-2.5 bg-[#05070A] border border-[#1E293B] rounded-xl text-xs text-white focus:outline-none focus:border-amber-550 focus:shadow-[0_0_10px_rgba(245,158,11,0.1)] transition"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 font-sans">
                      <input type="checkbox" required id="secure-terms" className="rounded bg-[#05070A] border-[#1E293B]" />
                      <label htmlFor="secure-terms" className="text-[10px] text-slate-500 cursor-pointer">I authorize this simulated space transaction process via encrypted quantum rails.</label>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentState('idle')}
                        className="flex-1 py-3 border border-[#1E293B] text-slate-300 font-bold font-mono text-xs tracking-widest uppercase rounded-xl hover:bg-slate-900 transition cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold font-mono text-xs tracking-widest uppercase rounded-xl hover:brightness-110 active:scale-[0.98] transition shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
                      >
                        PAY {selectedPaymentTier.price}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5 py-6 text-center font-sans">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FBBF24]">Quick Sync Authorized</span>
                    <h4 className="text-sm font-bold text-white">Mobile Wallet Payment Simulation</h4>
                    <p className="text-xs text-slate-400 max-w-[360px] mx-auto leading-relaxed">
                      Sync directly with Apple Pay or Google Pay to purchase this Space Gold block securely. No physical credit card input is required.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentState('processing');
                        setPaymentStepsLog('Checking mobile biometric sensors...');
                        setTimeout(() => {
                          setPaymentStepsLog('Acquiring secure single-use payment token block...');
                          setTimeout(async () => {
                            setPaymentStepsLog('Updating commander cloud database ledgers...');
                            await handleBuyCredits(selectedPaymentTier.amount, selectedPaymentTier.label);
                            setPaymentState('success');
                          }, 900);
                        }, 900);
                      }}
                      className="px-8 py-3.5 bg-white text-slate-950 font-bold text-xs font-mono tracking-widest uppercase rounded-xl hover:bg-slate-100 transition inline-flex items-center gap-2 active:scale-95 cursor-pointer shadow-lg"
                    >
                      <span>🚀</span> AUTHORIZE VIA BIOMETRIC SYNC
                    </button>
                    <div className="text-center pt-2">
                      <button type="button" onClick={() => setPaymentState('idle')} className="text-xs text-slate-500 hover:text-slate-350 underline cursor-pointer">Choose another package</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentState === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                {/* Immersive Pulsing Reactor / Atom visual */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-amber-500/20 rounded-full animate-spin animate-duration-[10000ms]"></div>
                  <div className="absolute inset-2 border-2 border-yellow-500/35 rounded-full animate-spin animate-reverse animate-duration-[5000ms]"></div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500 rounded-full flex items-center justify-center animate-ping text-transparent absolute">.</div>
                  <div className="w-10 h-10 bg-[#0A0F1D] border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-400 font-bold font-mono text-xs shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    99%
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Processing Quantum Funds</h4>
                  <div className="text-xs text-amber-400 font-mono tracking-wide mt-1 animate-pulse">
                    {paymentStepsLog}
                  </div>
                </div>
              </div>
            )}

            {paymentState === 'success' && selectedPaymentTier && (
              <div className="py-10 flex flex-col items-center justify-center space-y-5 text-center">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  ✓
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white uppercase font-mono tracking-wide">Ledger Synchronization Successful!</h4>
                  <p className="text-xs text-slate-400 max-w-[380px] leading-relaxed">
                    Transaction authorized and ledger updated. **+{selectedPaymentTier.amount.toLocaleString()} Space Gold (Credits)** loaded securely!
                  </p>
                </div>

                <div className="bg-[#05070A] p-3 rounded-xl border border-[#1E293B] font-mono text-[10px] text-slate-500 text-left w-full max-w-sm space-y-1">
                  <div>TRANSACTION ID: <span className="text-slate-350">TXN_{Math.random().toString(36).substr(2, 12).toUpperCase()}</span></div>
                  <div>SECURITY KEY: <span className="text-slate-350">STRIPE_SSL_VALIDATED_OK</span></div>
                  <div>AUTHORIZED PACKAGE: <span className="text-amber-400">{selectedPaymentTier.label}</span></div>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentState('idle');
                  }}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-widest uppercase rounded-xl transition duration-150 active:scale-95 cursor-pointer shadow-lg"
                >
                  RETURN TO SECTOR STATION COMMAND
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* GLOBAL PLAYER PROFILE STATS MODAL */}
      {viewingPlayerId && (() => {
        const targetPlayer = playersList.find(p => p.id === viewingPlayerId) || 
          (player?.id === viewingPlayerId ? {
             id: player.id,
             username: player.username,
             faction: player.faction,
             factionColor: player.factionColor,
             allianceId: player.allianceId,
             allianceRole: player.allianceRole,
             scores: player.scores,
             achievements: player.achievements || [],
             planetsCount: player.planets?.length || 1,
             lastActive: Date.now()
          } : null);

        if (!targetPlayer) return null;

        const isOnline = !targetPlayer.lastActive || (Date.now() - targetPlayer.lastActive < 120000);
        const factionColor = targetPlayer.factionColor || '#22d3ee';
        const targetAlliance = targetPlayer.allianceId ? alliances[targetPlayer.allianceId] : null;

        return (
          <div className="fixed inset-0 bg-[#05070A]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0A0F1D] border border-cyan-500/20 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden font-sans relative flex flex-col">
              
              {/* Header Banner representing player Faction */}
              <div 
                className="h-28 relative flex items-end p-5"
                style={{ backgroundColor: factionColor + '15', borderBottom: `2px solid ${factionColor}` }}
              >
                {/* Visual grid accent */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_14px] opacity-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1D] to-transparent" />
                
                <div className="relative z-10 flex items-center gap-4.5">
                  <div 
                    className="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold font-mono select-none shadow-lg bg-[#05070A]"
                    style={{ borderColor: factionColor, color: factionColor }}
                  >
                    {targetPlayer.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                      {targetPlayer.username}
                    </h2>
                    <p className="text-[11px] font-mono font-bold tracking-widest uppercase" style={{ color: factionColor }}>
                      {targetPlayer.faction} Agent
                    </p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setViewingPlayerId(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white bg-[#05070A] hover:bg-slate-900 border border-[#1E293B] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition"
                >
                  &times;
                </button>
              </div>

              {/* Stats & Metadata */}
              <div className="p-6 space-y-5 font-mono text-xs">
                
                {/* Alliance association banner */}
                {targetAlliance ? (
                  <div className="p-3 bg-[#05070a]/60 border border-yellow-500/10 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Alliance Covenant</span>
                      <span className="text-yellow-400 font-bold">[{targetAlliance.tag}] {targetAlliance.name}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold">
                      {targetPlayer.allianceRole?.toUpperCase() || 'MEMBER'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#05070a]/30 border border-[#1E293B]/60 rounded-xl text-center text-slate-500 text-[11px] font-bold">
                    🛡️ UNALIGNED INDEPENDENT OPERATOR
                  </div>
                )}

                {/* Main Core Statistics */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Core Ledger Statistics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#05070A]/50 border border-[#1E293B] rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500">Colony Count</span>
                      <span className="text-base font-bold text-slate-200 mt-1">{targetPlayer.planetsCount || 1} Starbases</span>
                    </div>
                    <div className="p-3 bg-[#05070A]/50 border border-[#1E293B] rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500">Combined Population</span>
                      <span className="text-base font-bold text-cyan-400 mt-1">{(targetPlayer.scores.population || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-[#05070A]/50 border border-[#1E293B] rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-red-500/70">Offensive Destructions</span>
                      <span className="text-base font-bold text-red-400 mt-1">{(targetPlayer.scores.attack || 0).toLocaleString()} HP Killed</span>
                    </div>
                    <div className="p-3 bg-[#05070A]/50 border border-[#1E293B] rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-blue-500/70">Defensive resiliency</span>
                      <span className="text-base font-bold text-blue-400 mt-1">{(targetPlayer.scores.defence || 0).toLocaleString()} HP Absorbed</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-[#05070A]/50 border border-[#1E293B] rounded-xl flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Maritime Raiders Score</span>
                    <span className="text-amber-400 font-bold">{(targetPlayer.scores.raiders || 0).toLocaleString()} cargo stolen</span>
                  </div>
                </div>

                {/* Achievements List */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Classified Achievements ({targetPlayer.achievements?.length || 0})</h4>
                  {targetPlayer.achievements && targetPlayer.achievements.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                      {targetPlayer.achievements.map((ach, idx) => (
                        <span key={idx} className="bg-cyan-950/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/10 text-[9px] font-bold tracking-tight uppercase flex items-center gap-1">
                          ⚓ {ach}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">No planetary campaign achievements unlocked yet.</p>
                  )}
                </div>

                 {/* Secure Comms Dispatch Panel */}
                <div className="pt-3 border-t border-[#1E293B]">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#00F0FF] mb-2 font-mono">Send message to {targetPlayer.username}</h4>
                  {targetPlayer.id === player?.id ? (
                    <p className="text-[10px] text-slate-500 italic">This is your own commander terminal. Loopback diagnostics enabled.</p>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={profileMsgText}
                        onChange={(e) => setProfileMsgText(e.target.value)}
                        placeholder={`Transmit secure encrypted message to Commander ${targetPlayer.username}...`}
                        className="w-full h-16 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                        maxLength={500}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isSendingMsg || !profileMsgText.trim()}
                          onClick={async () => {
                            await handleSendMessage(targetPlayer.id, profileMsgText);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-lg text-[11px] font-bold tracking-wider hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase shadow-[0_0_10px_rgba(34,211,238,0.2)] cursor-pointer"
                        >
                          {isSendingMsg ? "TRANSMITTING..." : "send message"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Last Detected Activity */}
                <div className="pt-3 border-t border-[#1E293B] text-[10px] text-slate-500 flex justify-between items-center text-right sm:text-left gap-2 flex-wrap">
                  <span>TELEMETRY STABILIZATION GRID</span>
                  <span>ACTIVITY INDEX CLASSIFIED</span>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Settle/Colony Custom Station Naming Modal */}
      {settleFleetId && (
        <div className="fixed inset-0 bg-[#05070A]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0A0F1D] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] p-6 font-sans text-slate-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2 border-b border-[#1E293B] pb-4 mb-5">
              <span className="text-xl">🛰️</span>
              <div>
                <h3 className="text-sm font-mono font-black uppercase tracking-widest text-[#00F0FF]">NEW STATION DESIGNATION</h3>
                <p className="text-[10px] uppercase font-mono text-slate-500">Formally designate your new colony station</p>
              </div>
            </div>

            <form onSubmit={handleExecuteSettle} className="space-y-4">
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Your settlement crew has arrived at destination coordinates! Please authorize the official station designation to construct the main command headquarters:
              </p>
              
              <div className="space-y-2 focus-within:text-cyan-400 text-slate-500 font-mono">
                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Station Name (Required)</label>
                <input 
                  type="text" 
                  value={customColonyName}
                  onChange={(e) => setCustomColonyName(e.target.value)}
                  placeholder="Enter a unique station name..."
                  maxLength={30}
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setSettleFleetId(null);
                    setCustomColonyName('');
                  }}
                  className="flex-1 py-3 bg-slate-900 border border-[#1E293B] hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs tracking-widest uppercase rounded-xl transition cursor-pointer"
                >
                  ABORT
                </button>
                <button 
                  type="submit"
                  disabled={!customColonyName.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] disabled:from-slate-800 disabled:to-slate-900 text-white disabled:text-slate-500 font-mono font-bold text-xs tracking-widest uppercase rounded-xl transition cursor-pointer disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  SETTLE STATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Registration Initial Station Naming Modal */}
      {showInitialStationNaming && (
        <div className="fixed inset-0 bg-[#05070A]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0A0F1D] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] p-6 font-sans text-slate-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2 border-b border-[#1E293B] pb-4 mb-5">
              <span className="text-xl">🌌</span>
              <div>
                <h3 className="text-sm font-mono font-black uppercase tracking-widest text-[#00F0FF]">COMMISSION STATION DESIGNATION</h3>
                <p className="text-[10px] uppercase font-mono text-slate-500">Formally name your sovereign Space Station</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleInitialStationNamingSubmit(); }} className="space-y-4">
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                As newly initialized Commander, you have been granted rights to establish a colony on an unclaimed planet. Name your central Station below:
              </p>
              
              <div className="space-y-1.5 focus-within:text-cyan-400 text-slate-500 font-mono">
                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Station Name</label>
                <input 
                  type="text" 
                  value={initialStationName}
                  onChange={(e) => setInitialStationName(e.target.value)}
                  placeholder="E.g. Alpha Outpost"
                  maxLength={30}
                  className="w-full px-4 py-3 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white font-mono font-bold text-xs tracking-widest uppercase rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  Register Station & Establish Command
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* SECURE COMMANDER COMM-MESSAGES DECK */}
      {showCommDeck && (
        <div className="fixed inset-0 bg-[#05070A]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl h-[560px] bg-[#0A0F1D] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] p-6 font-mono text-slate-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📻</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#00F0FF]">COM-MS SECURE SITE</h3>
                  <p className="text-[10px] uppercase text-slate-500">QUANTUM LINKED FIELD ENVELOPE TRANSMITTER</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowCommDeck(false);
                  setForwardingMsgId(null);
                  setForwardTargetId("");
                }}
                className="text-slate-400 hover:text-white bg-[#05070A] hover:bg-slate-900 border border-[#1E293B] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition text-base"
              >
                &times;
              </button>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex border-b border-[#1E293B]/60 mb-4 bg-[#05070A]/50 rounded-lg p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => { setCommDeckTab('incoming'); setForwardingMsgId(null); }}
                className={`flex-1 py-2 text-center rounded-md transition cursor-pointer ${commDeckTab === 'incoming' ? 'bg-[#1e293b]/60 text-cyan-400 border border-cyan-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📥 INCOMING ({player.commandMessages?.filter(m => !m.isSent && !m.isRead).length || 0})
              </button>
              <button
                type="button"
                onClick={() => { setCommDeckTab('sent'); setForwardingMsgId(null); }}
                className={`flex-1 py-2 text-center rounded-md transition cursor-pointer ${commDeckTab === 'sent' ? 'bg-[#1e293b]/60 text-emerald-400 border border-cyan-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📤 SENT ({player.commandMessages?.filter(m => m.isSent).length || 0})
              </button>
              <button
                type="button"
                onClick={() => { setCommDeckTab('saved'); setForwardingMsgId(null); }}
                className={`flex-1 py-2 text-center rounded-md transition cursor-pointer ${commDeckTab === 'saved' ? 'bg-[#1e293b]/60 text-[#00F0FF] border border-cyan-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ⭐ SAVED ({player.commandMessages?.filter(m => !m.isSent && m.isSaved).length || 0})
              </button>
              <button
                type="button"
                onClick={() => { setCommDeckTab('compose'); setForwardingMsgId(null); }}
                className={`flex-1 py-2 text-center rounded-md transition cursor-pointer ${commDeckTab === 'compose' ? 'bg-[#1e293b]/60 text-yellow-400 border border-yellow-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🛰️ FIELD DISPATCHER
              </button>
            </div>

            {/* Scrollable list/content dynamic rendering */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 text-left text-xs">
              
              {/* COMPOSE (FIELD DISPATCHER) TAB */}
              {commDeckTab === 'compose' && (
                <div className="space-y-4 p-2 bg-[#05070A]/30 border border-[#1E293B]/60 rounded-xl">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Select Destination Commander ID</label>
                    <select
                      value={directMsgTargetId}
                      onChange={(e) => setDirectMsgTargetId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl focus:outline-none focus:border-cyan-500 text-xs"
                    >
                      <option value="">-- Choose active Commander --</option>
                      {playersList.filter(p => p.id !== player.id).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.username} [{p.faction || 'Neutral'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">Transmission Content Description</label>
                    <textarea
                      value={directMsgContent}
                      onChange={(e) => setDirectMsgContent(e.target.value)}
                      placeholder="Type secure envelope message to dispatch..."
                      className="w-full h-24 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl p-3 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                      maxLength={500}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isSendingMsg || !directMsgTargetId || !directMsgContent.trim()}
                      onClick={async () => {
                        await handleSendMessage(directMsgTargetId, directMsgContent);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white rounded-xl font-bold uppercase transition disabled:opacity-30 disabled:cursor-not-allowed text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      {isSendingMsg ? 'DISPATCHING RADIO TRANS...' : 'DISPATCH SECURE TRANS'}
                    </button>
                  </div>
                </div>
              )}

              {/* INCOMING, SENT & SAVED TABS */}
              {commDeckTab !== 'compose' && (() => {
                const messagesListFiltered = (player.commandMessages || []).filter(m => {
                  if (commDeckTab === 'saved') return !m.isSent && m.isSaved === true;
                  if (commDeckTab === 'sent') return m.isSent === true;
                  return !m.isSent; // incoming lists logs where isSent is falsy/undefined
                });

                if (messagesListFiltered.length === 0) {
                  return (
                    <div className="py-20 text-center border border-dashed border-[#1E293B] rounded-xl">
                      <p className="text-slate-500 text-xs">No active cryptographic records found in this memory sector.</p>
                    </div>
                  );
                }

                return messagesListFiltered.slice().reverse().map(msg => {
                  const isRead = msg.isRead;
                  const isSaved = msg.isSaved;
                  const itemGlow = !isRead && commDeckTab === 'incoming' 
                    ? 'border-cyan-500/40 bg-[#061224]/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]' 
                    : 'border-[#1E293B]/80 bg-[#080d19]/40';

                  const showRecipient = commDeckTab === 'sent';

                  return (
                    <div 
                      key={msg.id} 
                      className={`p-3.5 border rounded-xl space-y-2.5 transition-all duration-200 ${itemGlow}`}
                      onClick={() => {
                        if (!isRead && commDeckTab === 'incoming') {
                          handleToggleMessageRead(msg.id, true);
                        }
                      }}
                    >
                      {/* Message Meta Info Header */}
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isRead && !showRecipient && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#22d3ee]" title="Encrypt Alert Active" />
                            )}
                            <span className="font-bold text-slate-100 uppercase tracking-wide">
                              🛰️ {showRecipient ? 'Recipient: ' : 'Sender: '}
                              <span 
                                className="text-cyan-400 hover:underline cursor-pointer decoration-dotted font-black" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setViewingPlayerId(showRecipient ? msg.receiverId : msg.senderId); 
                                }}
                              >
                                {showRecipient ? msg.receiverName : msg.senderName}
                              </span>
                            </span>
                            <span 
                              className="px-1.5 py-0.1 border rounded text-[9px] uppercase font-bold"
                              style={{ borderColor: msg.senderFactionColor || '#22d3ee', color: msg.senderFactionColor || '#22d3ee', backgroundColor: (msg.senderFactionColor || '#22d3ee') + '10' }}
                            >
                              {msg.senderFaction}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-500 font-mono mt-0.5 block">
                            Sector Coord Transit: {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {/* Visual alerts badge */}
                        <div className="flex gap-1.5">
                          {isSaved && !showRecipient && (
                            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">
                              CORE SAVED
                            </span>
                          )}
                          {!isRead && !showRecipient && (
                            <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wide animate-pulse">
                              ALERT LIVE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content block */}
                      <p className="text-[11.5px] text-slate-300 font-sans leading-relaxed bg-[#05070a]/60 border border-[#1e293b]/40 rounded-lg p-2.5 break-words">
                        {msg.content}
                      </p>

                      {/* Action Tools Console */}
                      <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-[#1E293B]/40 text-[9.5px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!showRecipient && (
                            <>
                              {/* Toggle Read/Unread */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleMessageRead(msg.id, !isRead);
                                }}
                                className="px-2 py-1 rounded bg-[#05070A]/80 border border-[#1e293b] hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition duration-150 font-bold uppercase cursor-pointer"
                              >
                                Mark {isRead ? 'Unread' : 'Read'}
                              </button>

                              {/* Save / Bookmark toggle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSaveMessage(msg.id, !isSaved);
                                }}
                                className={`px-2 py-1 rounded border transition duration-150 font-bold uppercase flex items-center gap-1 cursor-pointer ${
                                  isSaved 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                                    : 'bg-[#05070A]/80 border-[#1e293b] text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                                }`}
                              >
                                <Star size={9.5} className={isSaved ? 'fill-current' : ''} /> {isSaved ? 'Unsave' : 'Save'}
                              </button>

                              {/* Reply button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCommDeckTab('compose');
                                  setDirectMsgTargetId(msg.senderId);
                                  setDirectMsgContent(`Replying to: "${msg.content.slice(0, 45)}${msg.content.length > 45 ? '...' : ''}"\n\n`);
                                }}
                                className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition duration-150 font-bold uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Reply size={9.5} /> Reply
                              </button>
                            </>
                          )}

                          {/* Forward message content */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (forwardingMsgId === msg.id) {
                                setForwardingMsgId(null);
                                setForwardTargetId("");
                              } else {
                                setForwardingMsgId(msg.id);
                                setForwardTargetId("");
                              }
                            }}
                            className={`px-2 py-1 rounded border transition duration-150 font-bold uppercase flex items-center gap-1 cursor-pointer ${
                              forwardingMsgId === msg.id 
                                ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-cyan-400' 
                                : 'bg-[#05070A]/80 border-[#1e293b] text-slate-400 hover:text-cyan-450 hover:text-cyan-400 hover:border-cyan-500/30'
                            }`}
                          >
                            <Forward size={9.5} /> Forward
                          </button>
                        </div>

                        {/* Purge delete item option */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppConfirmModal({
                              title: "PURGE SECURE TRANSMISSION RECORD",
                              message: "Are you absolutely sure you want to permanently delete this cryptographic transmission log? This cannot be restored.",
                              onConfirm: () => handleDeleteMessage(msg.id)
                            });
                          }}
                          className="px-2 py-1 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded font-bold uppercase tracking-wider flex items-center gap-1 duration-150 cursor-pointer"
                        >
                          <Trash2 size={9.5} /> Purge log
                        </button>
                      </div>

                      {/* Floating forward panel */}
                      {forwardingMsgId === msg.id && (
                        <div className="mt-3 p-3 bg-[#05070A] border border-cyan-500/20 rounded-xl space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[9px] uppercase font-bold text-cyan-400 tracking-widest font-mono">Select Receiver Core Link:</div>
                          <div className="flex gap-2">
                            <select
                              value={forwardTargetId}
                              onChange={(e) => setForwardTargetId(e.target.value)}
                              className="bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-lg p-1.5 flex-1 text-xs outline-none"
                            >
                              <option value="">-- Click to choose Commander --</option>
                              {playersList.filter(p => p.id !== player.id).map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.username} [{p.faction || 'Neutral'}]
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={!forwardTargetId || isSendingMsg}
                              onClick={async () => {
                                await handleSendMessage(forwardTargetId, `[FORWARDED FROM ${msg.senderName}]: ${msg.content}`);
                                setForwardingMsgId(null);
                                setForwardTargetId("");
                              }}
                              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-95 disabled:opacity-35 transition cursor-pointer"
                            >
                              Forward
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                });
              })()}

            </div>

          </div>
        </div>
      )}
      {appConfirmModal && (
        <div id="app-confirm-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1527] border border-red-500/30 rounded-2xl p-6 flex flex-col space-y-4 shadow-2xl relative text-left">
            <h3 className="text-sm font-extrabold text-red-400 font-mono tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} /> {appConfirmModal.title}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {appConfirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAppConfirmModal(null)}
                className="px-4 py-2 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-xs font-mono transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = appConfirmModal.onConfirm;
                  setAppConfirmModal(null);
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

      {/* Tactical Operations Alerts Overlay Modal */}
      {isAlertsOpen && player && activePlanet && (() => {
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

          let pulseDot = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
          if (incomingAttacks.length > 0) {
            pulseDot = 'bg-red-500 shadow-[0_0_10px_#ef4444]';
          } else if (movingForces.length > 0) {
            pulseDot = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
          }

          return (
            <div id="alerts-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="relative w-full max-w-2xl bg-[#090D1A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                {/* Holographic scanner top overlay */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500"></div>

                {/* Header */}
                <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-black/40">
                  <div className="flex items-center gap-3 font-mono text-left">
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
                <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[250px] font-mono text-left text-xs text-slate-350">
                  
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
                                    onClick={() => {
                                      setViewingPlayerId(fleet.senderId);
                                      setIsAlertsOpen(false);
                                    }}
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
                                <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">Until strike</span>
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
                                if (isWaiting) {
                                  handleStartSettleFlow(fleet.id);
                                  setIsAlertsOpen(false);
                                }
                              }}
                              className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition duration-150 w-full overflow-hidden break-words ${
                                isWaiting 
                                  ? 'border-emerald-500/40 bg-emerald-950/25 cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                                  : 'border-amber-500/10 bg-amber-955 bg-amber-950/10'
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
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
      })()}
    </div>
  );
}
