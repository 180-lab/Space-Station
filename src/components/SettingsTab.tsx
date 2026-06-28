import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { requestNotificationPermission, sendMobileNotification } from '../lib/mobileNotifications';
import { DEFAULT_TUTORIAL_TASKS } from './CommanderTutorial';
import { 
  Settings, 
  Eye, 
  Volume2, 
  Bell, 
  LogOut, 
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Laptop,
  User,
  Home,
  Check,
  Coins,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Key,
  RefreshCw
} from 'lucide-react';

interface SettingsTabProps {
  player: PlayerProfile;
  theme: 'normal' | 'light' | 'dark';
  setTheme: (theme: 'normal' | 'light' | 'dark') => void;
  skinId: string;
  setSkinId: (skinId: string) => void;
  fontSizeScale: string;
  setFontSizeScale: (scale: string) => void;
  interactiveTabs: boolean;
  setInteractiveTabs: (interactive: boolean) => void;
  showStationsTop: boolean;
  setShowStationsTop: (show: boolean) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshState?: () => void;
  onLinkGoogle?: (email: string) => void;
  onOpenPayments?: () => void;
  onNavigateToLeaderboard?: () => void;
  populationRank?: number;
  customTasks?: Record<string, any>;
}

const COSMETIC_SKINS = [
  { id: 'default', name: 'Cyber Cyan', color: 'bg-cyan-500', hex: '#22d3ee', border: 'border-cyan-400/30' },
  { id: 'amber', name: 'Sol Novacore', color: 'bg-amber-500', hex: '#f59e0b', border: 'border-amber-400/30' },
  { id: 'crimson', name: 'Flares Crimson', color: 'bg-red-500', hex: '#ef4444', border: 'border-red-400/30' },
  { id: 'amethyst', name: 'Void Amethyst', color: 'bg-purple-500', hex: '#a855f7', border: 'border-purple-400/30' }
];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  player,
  theme,
  setTheme,
  skinId,
  setSkinId,
  fontSizeScale,
  setFontSizeScale,
  interactiveTabs,
  setInteractiveTabs,
  showStationsTop,
  setShowStationsTop,
  showToast,
  onRefreshState,
  onLinkGoogle,
  onOpenPayments,
  onNavigateToLeaderboard,
  populationRank,
  customTasks = {}
}) => {
  // Rename commander name and base colony names state
  const [commanderName, setCommanderName] = useState(player.username);
  const [selectedRenamePlanetId, setSelectedRenamePlanetId] = useState(player.planets[0]?.id || '');
  const [planetNewName, setPlanetNewName] = useState(player.planets[0]?.name || '');

  const [showDisplayTheme, setShowDisplayTheme] = useState(false);
  const [showSoundFx, setShowSoundFx] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showRegistryNames, setShowRegistryNames] = useState(false);
  const [showFeedbackConsole, setShowFeedbackConsole] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState(() => localStorage.getItem('space_station_backend_url') || import.meta.env.VITE_API_BASE_URL || 'http://102.133.160.133:3000');

  // Suggestions state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<'gameplay' | 'visuals' | 'balancing' | 'bugs' | 'other'>('gameplay');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [privateFeedbacks, setPrivateFeedbacks] = useState<any[]>([]);
  const [loadingPrivateFeedbacks, setLoadingPrivateFeedbacks] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Admin Task Editor States
  const [selectedTaskId, setSelectedTaskId] = useState<number>(1);
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskShortDescInput, setTaskShortDescInput] = useState('');
  const [taskReqHtmlInput, setTaskReqHtmlInput] = useState('');
  const [taskHintInput, setTaskHintInput] = useState('');
  const [taskHowToGetThereInput, setTaskHowToGetThereInput] = useState('');
  const [taskCommanderTipInput, setTaskCommanderTipInput] = useState('');
  const [taskCongratsMessageInput, setTaskCongratsMessageInput] = useState('');
  const [taskEncouragementQuoteInput, setTaskEncouragementQuoteInput] = useState('');
  const [updatingTask, setUpdatingTask] = useState(false);

  // Sync inputs when selected task changes
  useEffect(() => {
    // Look up default task
    const defTask = (DEFAULT_TUTORIAL_TASKS || []).find(t => t.id === selectedTaskId);
    // Look up custom override from server state
    const custom = customTasks?.[selectedTaskId] || customTasks?.[String(selectedTaskId)];

    setTaskTitleInput(custom?.title ?? defTask?.title ?? '');
    setTaskShortDescInput(custom?.shortDesc ?? defTask?.shortDesc ?? '');
    setTaskReqHtmlInput(custom?.requirementHtml ?? defTask?.requirementHtml ?? '');
    setTaskHintInput(custom?.hint ?? defTask?.hint ?? '');
    setTaskHowToGetThereInput(custom?.howToGetThere ?? defTask?.howToGetThere ?? '');
    setTaskCommanderTipInput(custom?.commanderTip ?? defTask?.commanderTip ?? '');
    setTaskCongratsMessageInput(custom?.congratsMessage ?? defTask?.congratsMessage ?? '');
    setTaskEncouragementQuoteInput(custom?.encouragementQuote ?? defTask?.encouragementQuote ?? '');
  }, [selectedTaskId, customTasks]);

  const handleUpdateTaskText = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTask(true);
    try {
      const res = await fetch('/api/admin/update-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id,
        },
        body: JSON.stringify({
          taskId: selectedTaskId,
          title: taskTitleInput,
          shortDesc: taskShortDescInput,
          requirementHtml: taskReqHtmlInput,
          hint: taskHintInput,
          howToGetThere: taskHowToGetThereInput,
          commanderTip: taskCommanderTipInput,
          congratsMessage: taskCongratsMessageInput,
          encouragementQuote: taskEncouragementQuoteInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Task text successfully updated for the whole game!', 'success');
        if (onRefreshState) {
          onRefreshState();
        }
      } else {
        showToast(data.error || 'Failed to update task revisions.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error transmitting task update.', 'error');
    } finally {
      setUpdatingTask(false);
    }
  };

  // Send suggestion handler
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      showToast('Please enter a suggestion description.', 'error');
      return;
    }
    setSendingFeedback(true);
    try {
      const res = await fetch('/api/feedback/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ content: feedbackText.trim(), category: feedbackCategory })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Suggestions signal transmitted safely!', 'success');
        setFeedbackText('');
        // Auto reload if admin has list active
        if (adminKey) {
          fetchPrivateFeedbacks();
        }
      } else {
        showToast(data.error || 'Failed to transmit suggestion', 'error');
      }
    } catch (err) {
      showToast('Signal interference. Retry suggestion.', 'error');
    } finally {
      setSendingFeedback(false);
    }
  };

  // Fetch feedback privately
  const fetchPrivateFeedbacks = async () => {
    setLoadingPrivateFeedbacks(true);
    try {
      const res = await fetch('/api/feedback/private-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ adminKey })
      });
      const data = await res.json();
      if (res.ok) {
        setPrivateFeedbacks(data.feedbacks || []);
        showToast(`Decoupled suggestion logs: ${data.feedbacks?.length || 0} files.`, 'success');
      } else {
        showToast(data.error || 'Incorrect decryption key.', 'error');
      }
    } catch (err) {
      showToast('Failed to reach secure command channel.', 'error');
    } finally {
      setLoadingPrivateFeedbacks(false);
    }
  };

  // Track changes of base profile
  useEffect(() => {
    setCommanderName(player.username);
  }, [player.username]);

  // Automated trigger to decrypt private feedback signals for Commander Banele
  useEffect(() => {
    if (showFeedbackConsole) {
      const isBaneleOwner = player.googleEmail && player.googleEmail.toLowerCase() === 'banele180@gmail.com';
      
      if (isBaneleOwner) {
        fetchPrivateFeedbacks();
      }
    }
  }, [showFeedbackConsole, player.googleEmail]);

  useEffect(() => {
    const selectedPl = player.planets.find(pl => pl.id === selectedRenamePlanetId);
    if (selectedPl) {
      setPlanetNewName(selectedPl.name);
    }
  }, [selectedRenamePlanetId, player.planets]);

  // Rename Commander submission handler
  const handleRenameCommander = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commanderName.trim()) {
      showToast('Commander name cannot be empty!', 'error');
      return;
    }
    try {
      const res = await fetch('/api/player/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ newUsername: commanderName })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Commander registered as: ${commanderName}`, 'success');
        if (onRefreshState) onRefreshState();
      } else {
        showToast(data.error || 'Failed to rename commander', 'error');
      }
    } catch (err) {
      showToast('Network error during renaming', 'error');
    }
  };

  // Rename Base submission handler
  const handleRenameBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planetNewName.trim() || !selectedRenamePlanetId) {
      showToast('Base colony name cannot be empty!', 'error');
      return;
    }
    try {
      const res = await fetch('/api/planet/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ planetId: selectedRenamePlanetId, newName: planetNewName })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Base renamed successfully: ${planetNewName}`, 'success');
        if (onRefreshState) onRefreshState();
      } else {
        showToast(data.error || 'Failed to rename base colony', 'error');
      }
    } catch (err) {
      showToast('Network error during renaming', 'error');
    }
  };

  // Audio settings derived from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('moonbase_sound_enabled') !== 'false';
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    return localStorage.getItem('moonbase_music_enabled') !== 'false';
  });
  const [nonCriticalSoundEnabled, setNonCriticalSoundEnabled] = useState(() => {
    return localStorage.getItem('moonbase_non_critical_sound_enabled') === 'true';
  });
  
  // Tactical notifications toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('moonbase_notifications_enabled') !== 'false';
  });

  // Attack warnings toggle
  const [attackNotificationsEnabled, setAttackNotificationsEnabled] = useState(() => {
    return localStorage.getItem('moonbase_attack_notifications_enabled') !== 'false';
  });

  // Secure Comms warnings toggle
  const [commsNotificationsEnabled, setCommsNotificationsEnabled] = useState(() => {
    return localStorage.getItem('moonbase_comms_notifications_enabled') !== 'false';
  });

  // Track state changes to persist
  useEffect(() => {
    localStorage.setItem('moonbase_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_music_enabled', String(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_non_critical_sound_enabled', String(nonCriticalSoundEnabled));
  }, [nonCriticalSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_notifications_enabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_attack_notifications_enabled', String(attackNotificationsEnabled));
  }, [attackNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_comms_notifications_enabled', String(commsNotificationsEnabled));
  }, [commsNotificationsEnabled]);

  const handleResetApp = () => {
    setConfirmModal({
      title: 'RESTORE TACTICAL DEFAULTS / CLEAR CACHE?',
      message: 'WARNING: This will completely restore all tactical interface defaults. All customized panel layouts, cached states, and options will be reset. The application will reboot immediately.',
      onConfirm: () => {
        localStorage.clear();
        showToast('Cache memory wiped. Re-routing to quantum gate...', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  };

  const handleLogoutClick = () => {
    setConfirmModal({
      title: 'CONFIRM SESSION DE-SYNCHRONIZATION',
      message: 'Are you sure you want to log out of your session? Your current account session reference will be purged from LocalStorage and you will be re-routed to registration.',
      onConfirm: () => {
        localStorage.removeItem('moonbase_userId');
        showToast('De-synchronizing commander keys...', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  };

  const [resettingServer, setResettingServer] = useState(false);
  const handleResetServerState = () => {
    setConfirmModal({
      title: '🚨 DESTRUCTIVE: RESET GAME SERVER?',
      message: 'WARNING: This will completely wipe all game server data! All player profiles, chat messages, alliances, and custom bases will be permanently ERASED from the host. You will be logged out and the server will re-initialize to a clean state. Are you absolutely sure you want to proceed?',
      onConfirm: async () => {
        setResettingServer(true);
        try {
          const res = await fetch('/api/dev/reset-universe', { method: 'POST' });
          if (res.ok) {
            showToast('Server state files purged! Universe rebooted successfully.', 'success');
            localStorage.clear();
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          } else {
            showToast('Failed to execute server clear protocol.', 'error');
          }
        } catch (err) {
          showToast('Communications failure executing server clear.', 'error');
        } finally {
          setResettingServer(false);
        }
      }
    });
  };

  const handleApplySkin = (id: string, name: string) => {
    setSkinId(id);
    localStorage.setItem('moonbase_skin_id', id);
    showToast(`Visual override skin active: ${name}`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono animate-fade-in pb-16 text-left">
      {/* Header Banner */}
      <div className="p-4 bg-[#0A0F1D]/90 border border-[#1E293B] rounded-xl flex justify-between items-center shadow-xl">
        <h2 className="text-xs font-black text-white tracking-widest uppercase">TRANSMISSION LINK SETTINGS</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core View Preferences (Left Panel) */}
        <div className="p-5 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl space-y-5 shadow-lg flex flex-col justify-start">
          <button
            onClick={() => setShowDisplayTheme(!showDisplayTheme)}
            className="w-full flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer select-none border-b border-[#1E293B]/60 pb-2"
            type="button"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2">
              <Eye size={14} className="text-cyan-400" /> Display & Themes
              {showDisplayTheme ? (
                <ChevronUp size={12} className="text-red-500" />
              ) : (
                <ChevronDown size={12} className="text-emerald-500" />
              )}
            </h3>
          </button>

          {showDisplayTheme && (
            <>
              {/* Theme Selector Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wide">
                  Interface Lighting Mode
                </label>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Dynamically sets the overall luminosity. Pitch black limits screen fatigue during midnight operations.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'light', label: 'Original Light', emoji: '💡' },
                    { id: 'normal', label: 'Classic Blue', emoji: '🌌' },
                    { id: 'dark', label: 'Obsidian Moon', emoji: '🌙' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id as any);
                        localStorage.setItem('moonbase_theme', opt.id);
                        showToast(`Theme calibrated to: ${opt.label}`, 'success');
                      }}
                      className={`py-2 px-1 text-center border text-[10.5px] font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                        theme === opt.id 
                          ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography accessibility scaling */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wide">
                  Interface Grid Scale Factor
                </label>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Alters base pixel spacing calculations to help commanders reading in small screens.
                </p>
                <select
                  value={fontSizeScale}
                  onChange={(e) => {
                    setFontSizeScale(e.target.value);
                    showToast(`Global display scale configured to ${e.target.value}`, 'info');
                  }}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-cyan-500/40 text-xs text-slate-200 rounded-xl focus:outline-none transition-all cursor-pointer"
                >
                  <option value="125%">125% (Large Display / High Visibility Scale)</option>
                  <option value="100%">100% (Default High Resolution Command)</option>
                  <option value="75%">75% (Compact Telemetry / Server Log)</option>
                  <option value="50%">50% (Quantum Matrix overview/Extra Small)</option>
                </select>
              </div>

              {/* Bottom Navigation Toolbar Behavior */}
              <div className="space-y-2 pt-4 border-t border-[#1E293B]/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Interactive Auto-Hide Toolbar</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Dynamically auto-hides the navigation bar when inactive or scrolling, showing when hovering near the screen bottom. Pinned keeps it always locked visible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInteractiveTabs(!interactiveTabs);
                      showToast(!interactiveTabs ? 'Interactive Dynamic hide enabled' : 'Pinned toolbar always visible enabled', 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer ${
                      interactiveTabs 
                        ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                        : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    {interactiveTabs ? 'DYNAMIC' : 'PINNED'}
                  </button>
                </div>
              </div>

              {/* Show Stations Top Option */}
              <div className="space-y-2 pt-4 border-t border-[#1E293B]/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Show Stations</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Displays a fast-switching persistent dock at the top of all tactical navigation screens for quick status monitoring and orbital relocation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStationsTop(!showStationsTop);
                      showToast(!showStationsTop ? 'Persistent Top Stations enabled' : 'Top Stations dock hidden', 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer ${
                      showStationsTop 
                        ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                        : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    {showStationsTop ? 'ONLINE' : 'MUTED'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Audio Toggles & General Operations (Right Panel) */}
        <div className="p-5 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl space-y-5 shadow-lg flex flex-col justify-between">
          <button
            onClick={() => setShowSoundFx(!showSoundFx)}
            className="w-full flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer select-none border-b border-[#1E293B]/60 pb-2"
            type="button"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2">
              <Volume2 size={14} className="text-cyan-400" /> Sound & Indicators
              {showSoundFx ? (
                <ChevronUp size={12} className="text-red-500" />
              ) : (
                <ChevronDown size={12} className="text-emerald-500" />
              )}
            </h3>
          </button>
          
          {showSoundFx && (
            <>
              <div className="space-y-5">
                {/* Sound FX Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Audio Alert Sound FX</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Triggers high-priority klaxon alerts and nuclear warning notices during station combat operations.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      showToast(`Klaxon SFX ${!soundEnabled ? 'activated' : 'deactivated'}`, 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition ${
                      soundEnabled 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}
                  >
                    {soundEnabled ? 'ONLINE' : 'MUTED'}
                  </button>
                </div>

                {/* Non-Critical UI Sound FX Toggle */}
                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Non-Critical UI Sounds</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Plays ambient sound triggers for routine actions like switching stations, renaming, settings modifications, or menu navigation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNonCriticalSoundEnabled(!nonCriticalSoundEnabled);
                      showToast(`Non-critical UI sounds ${!nonCriticalSoundEnabled ? 'activated' : 'deactivated'}`, 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition ${
                      nonCriticalSoundEnabled 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}
                  >
                    {nonCriticalSoundEnabled ? 'ONLINE' : 'MUTED'}
                  </button>
                </div>

                {/* Combat alerts and toasts */}
                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Hologram Toast Displays</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Flashes fast warning indicators at the top of the interface when resource bins maximize or fleets complete travels.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNotificationsEnabled(!notificationsEnabled);
                      showToast(`Hologram alerts ${!notificationsEnabled ? 'authorized' : 'suppressed'}`, 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition ${
                      notificationsEnabled 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}
                  >
                    {notificationsEnabled ? 'ACTIVE' : 'BLOCKED'}
                  </button>
                </div>

                {/* Attack Warning Notifications */}
                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Attack Warning Alerts</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Enables high-priority alarm warnings and sound triggers for any detected incoming attack trajectories in the galaxy.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAttackNotificationsEnabled(!attackNotificationsEnabled);
                      showToast(`Attack alerts ${!attackNotificationsEnabled ? 'authorized' : 'suppressed'}`, 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition ${
                      attackNotificationsEnabled 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}
                  >
                    {attackNotificationsEnabled ? 'ACTIVE' : 'BLOCKED'}
                  </button>
                </div>

                {/* Secure Comms Message Notifications */}
                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Secure Comms Message Alerts</span>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                      Shows overlay notices and alerts when new quantum-transceiver messages arrive from other station commanders.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCommsNotificationsEnabled(!commsNotificationsEnabled);
                      showToast(`Secure Comms alerts ${!commsNotificationsEnabled ? 'authorized' : 'suppressed'}`, 'info');
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 transition ${
                      commsNotificationsEnabled 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}
                  >
                    {commsNotificationsEnabled ? 'ACTIVE' : 'BLOCKED'}
                  </button>
                </div>

                {/* Native Mobile Push Alerts */}
                <div className="flex flex-col gap-2 pt-3 border-t border-[#1E293B]/40 mt-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5 max-w-[70%]">
                      <span className="text-xs font-bold text-slate-200 block uppercase flex items-center gap-1.5">
                        <Bell size={13} className="text-cyan-400 animate-pulse" /> Native Device Notifications
                      </span>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                        Enables native push vibration/sound chimes directly to your device (Android/Capacitor APK) during offline moments or critical incoming hostile orbital attacks.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const isGranted = await requestNotificationPermission();
                        if (isGranted) {
                          showToast("📱 Mobile Notifications enabled! Chime test queued.", "success");
                          sendMobileNotification(
                            "📡 Command Link Active", 
                            "System keys verified! Tactical system notices will propagate directly here."
                          );
                        } else {
                          showToast("❌ Permission denied. Enable manually in App Settings.", "error");
                        }
                      }}
                      className="py-1.5 px-3 bg-cyan-950/25 hover:bg-cyan-950/45 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition"
                    >
                      Test Sync
                    </button>
                  </div>
                </div>
              </div>

              {/* Account and maintenance action cards */}
              <div className="pt-4 border-t border-[#1E293B]/60 space-y-3.5">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle size={12} /> RESTRICTED MAINTENANCE CODES
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResetApp}
                    className="py-2.5 px-3 bg-red-950/10 hover:bg-red-950/20 border border-red-500/25 text-red-400 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Clear Cache
                  </button>
                  
                  <button
                    onClick={handleLogoutClick}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={12} /> Log Out
                  </button>
                </div>

                {player.googleEmail && player.googleEmail.toLowerCase() === 'banele180@gmail.com' && (
                  <button
                    onClick={handleResetServerState}
                    disabled={resettingServer}
                    className="w-full py-2.5 px-3 bg-red-950/20 hover:bg-red-900/40 border border-red-600/50 text-red-300 disabled:opacity-50 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    type="button"
                  >
                    <RefreshCw size={12} className={resettingServer ? 'animate-spin' : ''} /> 
                    {resettingServer ? 'Executing reset override...' : '☢️ Force Reset Game Server'}
                  </button>
                )}
              </div>
            </>
          )}

        </div>

      </div>
      {/* SECURE GOOGLE ACCESS KEYS & DECOM STATUS */}
      <div className="p-5 bg-[#0A0F1D] border border-cyan-500/10 rounded-2xl space-y-5 shadow-lg text-left relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
 
        <button
          onClick={() => setShowSync(!showSync)}
          className="w-full flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer select-none border-b border-[#1E293B]/60 pb-2"
          type="button"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
            <CheckCircle size={14} className="text-cyan-500" /> Quantum Access Credentials & Synchronization
            {showSync ? (
              <ChevronUp size={12} className="text-red-500" />
            ) : (
              <ChevronDown size={12} className="text-emerald-500" />
            )}
          </h3>
        </button>
 
        {showSync && (
          <>
            <div className="grid grid-cols-1 gap-6">
          {/* Box 1: Google account sync status */}
          <div className="space-y-3.5 bg-slate-950/40 p-4 border border-[#1E293B] rounded-xl flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Device Sync Status</span>
              <h4 className="text-xs font-bold text-white uppercase font-mono">Google Account Integrity Sync</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-sans mt-1">
                Link this browser station to your unique Google credentials. Lets you instantly load status, credits, and fleets over multiple mobile devices.
              </p>
            </div>
 
            <div className="pt-2">
              {player.googleEmail ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center flex-wrap gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                  <div className="font-sans text-xs min-w-0 flex-1">
                    <span className="font-bold text-slate-100 block uppercase text-[9px] tracking-wider">Verified Sync Locked</span>
                    Linked Google Account: <span className="block sm:inline font-mono text-[10.5px] font-bold text-white break-all">{player.googleEmail}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded-lg text-[10px] leading-relaxed font-sans">
                    ⚠️ Terminal currently operates under offline cache keys!
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const email = window.prompt("Please enter your Google Email address to sync:", "banele180@gmail.com");
                      if (email) {
                        if (email.includes('@') && email.includes('.')) {
                          if (onLinkGoogle) onLinkGoogle(email);
                        } else {
                          window.alert("Invalid Google Email security pattern format.");
                        }
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-white hover:bg-slate-150 text-slate-950 font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer shadow-md text-left flex items-center justify-center flex-wrap gap-2"
                  >
                    <svg className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.13-.07-.25-.15-.35-.22" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Link Active Google Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* COMMANDER & BASE COLONY NAMES SPECIFICATION SECTION */}
      <div className="p-5 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl space-y-5 shadow-lg text-left">
        <button
          onClick={() => setShowRegistryNames(!showRegistryNames)}
          className="w-full flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer select-none border-b border-[#1E293B]/60 pb-2"
          type="button"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2">
            <User size={14} className="text-cyan-400" /> Commander Registry & Colony Station Names
            {showRegistryNames ? (
              <ChevronUp size={12} className="text-red-500" />
            ) : (
              <ChevronDown size={12} className="text-emerald-500" />
            )}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-extrabold hidden sm:inline">Active Status</span>
        </button>

        {showRegistryNames && (
          <>

        {/* Commander Profile Dashboard representing Global Rank and Space Gold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/50 border border-[#1E293B]/60 rounded-xl font-mono">
          {/* Global standing rank */}
          <div 
            onClick={() => onNavigateToLeaderboard && onNavigateToLeaderboard()}
            className="flex flex-col justify-between p-1 cursor-pointer group text-left"
            title="Click to view Sovereignty Leaderboard rankings"
          >
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider group-hover:text-cyan-400">COMMANDER RANK</span>
              <span className="text-[11px] font-semibold text-slate-350 block">Galactic Leaderboard Standing</span>
            </div>
            <div className="text-2xl font-black italic text-cyan-400 font-mono mt-3 group-hover:underline decoration-dotted">
              #{populationRank || 48} 🏆
            </div>
          </div>

          {/* Premium ledger Space Gold balance + payment anchor */}
          <div className="flex flex-col justify-between p-1 sm:border-l sm:border-[#1E293B]/60 sm:pl-4">
            <div className="space-y-0.5">
              <span className="text-[9px] text-amber-500 block font-bold uppercase tracking-wider font-mono">PREMIUM COGNITIVE LEDGER</span>
              <span className="text-[11px] font-bold text-slate-300 block">
                {(player.credits !== undefined ? player.credits : 1250).toLocaleString()} Space Gold (Credits)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenPayments) onOpenPayments();
              }}
              className="mt-3.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-[9px] uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer shadow-md inline-flex items-center gap-1.5 w-max"
            >
              <Coins size={11} className="text-slate-950 animate-pulse" /> + Acquire Space Gold
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commander Name Form */}
          <form onSubmit={handleRenameCommander} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wide">
                Calibrate Commander Name
              </label>
              <p className="text-[10.5px] text-slate-500 leading-relaxed mt-0.5">
                Alters your formal signature and username across global star alliances, communications, and battle alerts.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                maxLength={25}
                value={commanderName}
                onChange={(e) => setCommanderName(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none text-xs text-white font-mono rounded-xl transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
                placeholder="Enter commander name"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400 font-bold text-[10px] uppercase font-mono tracking-wider rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1"
              >
                <Check size={11} /> Save Name
              </button>
            </div>
          </form>

          {/* Colony Stations Renaming Form */}
          <form onSubmit={handleRenameBase} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#10b981] block uppercase tracking-wide">
                Rename Active Colony Bases
              </label>
              <p className="text-[10.5px] text-slate-500 leading-relaxed mt-0.5">
                Renames any coordinates station base you have colonized. Your empire spans up to 5 strategic sectors.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Select Colony dropdown */}
              <select
                value={selectedRenamePlanetId}
                onChange={(e) => setSelectedRenamePlanetId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-[#1E293B] text-slate-300 rounded-xl text-xs font-sans focus:outline-none cursor-pointer"
              >
                {player.planets.map((pl, idx) => (
                  <option key={pl.id} value={pl.id} className="text-slate-300 bg-slate-950">
                    {idx === 0 ? "★ " : idx === 1 ? "★★ " : "🛰️ "}{pl.name} [{pl.sectorX}, {pl.sectorY}]
                  </option>
                ))}
              </select>

              {/* Name input */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="text"
                  maxLength={30}
                  value={planetNewName}
                  onChange={(e) => setPlanetNewName(e.target.value)}
                  className="w-full sm:flex-grow px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none text-xs text-white font-mono rounded-xl transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
                  placeholder="New Colony Base Name"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#10b981]/10 to-indigo-500/10 hover:from-[#10b981]/20 hover:to-[#10b981]/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-wider rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1"
                >
                  <Home size={11} /> Save Base
                </button>
              </div>
            </div>
          </form>
        </div>
          </>
        )}
      </div>

      {/* SUGGESTIONS & SECURE COMMUNICATIONS CONSOLE */}
      <div className="p-5 bg-[#0A0F1D] border border-fuchsia-500/10 rounded-2xl space-y-5 shadow-lg text-left relative overflow-hidden">
        {/* Decorative corner flash */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={() => setShowFeedbackConsole(!showFeedbackConsole)}
          className="w-full flex items-center justify-between text-left hover:text-white transition duration-150 cursor-pointer select-none border-b border-[#1E293B]/60 pb-2"
          type="button"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 flex items-center gap-2">
            <MessageSquare size={14} className="text-fuchsia-500" /> SUGGESTION STATION
            {showFeedbackConsole ? (
              <ChevronUp size={12} className="text-red-500" />
            ) : (
              <ChevronDown size={12} className="text-emerald-500" />
            )}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-extrabold hidden sm:inline">DEVELOPER CHANNEL</span>
        </button>

        {showFeedbackConsole && (
          <div className="space-y-6 pt-1">
            {/* Conditional Layout: 2 Columns for Admin Banele, 1 Full-Width Column for regular players */}
            {(() => {
              const isBanele = player.googleEmail && player.googleEmail.toLowerCase() === 'banele180@gmail.com';

              if (isBanele) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Submission Form (Left Column for Banele) */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Transmit Suggestion</h4>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans mt-0.5">
                          Broadcast a holographic idea, bug log, or mechanics balance patch to Sector headquarters.
                        </p>
                      </div>

                      <form onSubmit={handleSendFeedback} className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Feedback Category:</label>
                          <select
                            value={feedbackCategory}
                            onChange={(e) => setFeedbackCategory(e.target.value as any)}
                            className="w-full px-2.5 py-2 bg-slate-950 border border-[#1E293B] hover:border-fuchsia-500/30 text-slate-350 rounded-xl text-xs font-mono focus:outline-none cursor-pointer transition-all"
                          >
                            <option value="gameplay">🎮 GAMEPLAY TWEAKS</option>
                            <option value="visuals">🎨 VISUAL DESIGN / SUGGESTIONS</option>
                            <option value="balancing">⚖️ BALANCING ADJUSTMENTS</option>
                            <option value="bugs">🐛 ANOMALOUS BUG LOGS</option>
                            <option value="other">🌌 OTHER SPECIFICATIONS</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Draft Transmission Content:</label>
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            maxLength={1000}
                            rows={4}
                            placeholder="Type your strategic suggestions, requested systems, or cosmetic feedback here..."
                            className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-fuchsia-500/40 focus:border-fuchsia-400 focus:outline-none text-xs text-white font-sans rounded-xl transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingFeedback}
                          className="w-full py-2 px-4 bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 hover:from-fuchsia-500/20 hover:to-pink-500/20 border border-fuchsia-500/30 hover:border-fuchsia-500/50 text-fuchsia-300 font-bold text-[10px] uppercase font-mono tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <Send size={11} className={sendingFeedback ? 'animate-pulse' : ''} />
                          <span>{sendingFeedback ? 'SENDING...' : 'Send Suggestion'}</span>
                        </button>
                      </form>
                    </div>

                    {/* Secure Decryption Vault (Right Column - Admin Only View) */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-[#1E293B]/40 pt-6 md:pt-0 md:pl-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1">
                          <Key size={12} className="text-amber-500" /> Private Suggestions Vault
                        </h4>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans mt-0.5">
                          <span className="text-emerald-400 font-bold font-mono text-[10px]">✓ COGNITIVE AUTHENTICATION DETECTED: Welcome Administrator Banele! The decryption lock is automatically bypassed for your device session.</span>
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                            <span className="text-emerald-400 font-bold">BYPASS MODE GRANTED:</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={adminKey}
                              onChange={(e) => setAdminKey(e.target.value)}
                              placeholder="Bypass active - enter key is optional..."
                              className="flex-1 px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-amber-500/30 focus:border-amber-500/60 focus:outline-none text-xs text-amber-200 font-mono rounded-xl transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
                            />
                            <button
                              onClick={fetchPrivateFeedbacks}
                              disabled={loadingPrivateFeedbacks}
                              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold font-mono text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
                            >
                              <RefreshCw size={11} className={loadingPrivateFeedbacks ? 'animate-spin' : ''} />
                              <span>DECRYPT</span>
                            </button>
                          </div>
                        </div>

                        {/* Private Messages List */}
                        <div className="bg-slate-950/60 border border-[#1E293B] rounded-xl p-3 h-52 overflow-y-auto space-y-2.5">
                          {privateFeedbacks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-600 font-sans">
                              <Key size={18} className="text-slate-700 mb-1.5" />
                              <p className="text-[10px] italic">
                                Bypass active. Select DECRYPT above to fetch suggestions feed instantly.
                              </p>
                            </div>
                          ) : (
                            privateFeedbacks.map((f, i) => (
                              <div key={f.id || i} className="p-2.5 bg-[#05070A]/80 border border-[#1E293B]/60 rounded-lg text-left space-y-1">
                                <div className="flex justify-between items-start flex-wrap gap-1 text-[9.5px]">
                                  <span className="font-bold text-slate-200">
                                    {f.senderName || 'Commander'}{' '}
                                    <span className="text-slate-500 font-normal">({f.senderEmail || 'No Email'})</span>
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[#1a0f2e] text-fuchsia-400 border border-fuchsia-500/15">
                                    {f.category?.toUpperCase() || 'OTHER'}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-slate-300 font-sans leading-normal break-words">{f.content}</p>
                                
                                <div className="text-[8px] text-slate-500 font-mono">
                                  TRANSMITTED: {new Date(f.timestamp).toUTCString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Tutorial Task Editor Block */}
                    <div className="border-t border-[#1E293B]/40 pt-6 space-y-4">
                      <div className="bg-slate-900/40 border border-[#1E293B]/60 rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]/30">
                          <div>
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                              🛡️ ADMIN TUTORIAL QUEST ROADMAP MANAGER
                            </h4>
                            <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                              Select any task below to instantly override its text globally for all players.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400 font-mono uppercase whitespace-nowrap">SWITCH TASK:</label>
                            <select
                              value={selectedTaskId}
                              onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                              className="px-3 py-1.5 bg-slate-950 border border-[#1E293B] focus:border-emerald-500 text-xs text-slate-200 font-sans rounded-xl focus:outline-none max-w-xs transition"
                            >
                              {Array.from({ length: 30 }, (_, i) => i + 1).map((id) => {
                                const defT = (DEFAULT_TUTORIAL_TASKS || []).find(t => t.id === id);
                                const customT = customTasks?.[id] || customTasks?.[String(id)];
                                const label = customT?.title || defT?.title || `Task ${id}`;
                                return (
                                  <option key={id} value={id}>
                                    Task {id}: {label.replace(/🚀|👑|🛠️|🔬|📡|🎖️|🛰️|🌌/g, '').slice(0, 45).trim()}...
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        <form onSubmit={handleUpdateTaskText} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column Fields */}
                          <div className="space-y-3.5">
                            <div>
                              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Quest Title (Displayed on roadmap & banner):</label>
                              <input
                                type="text"
                                value={taskTitleInput}
                                onChange={(e) => setTaskTitleInput(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl transition animate-fade-in"
                                placeholder="Enter quest title..."
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Requirement (HTML, displayed as checklist detail):</label>
                              <textarea
                                value={taskReqHtmlInput}
                                onChange={(e) => setTaskReqHtmlInput(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl font-mono transition animate-fade-in"
                                placeholder="e.g. Build <strong>at least 1 Fabricator</strong>."
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Short Description:</label>
                              <textarea
                                value={taskShortDescInput}
                                onChange={(e) => setTaskShortDescInput(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl transition animate-fade-in"
                                placeholder="Short task overview description..."
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Quest Hint (Detail dropdown helper):</label>
                              <textarea
                                value={taskHintInput}
                                onChange={(e) => setTaskHintInput(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl transition animate-fade-in"
                                placeholder="Enter hints or step-by-step guidance..."
                              />
                            </div>
                          </div>

                          {/* Right Column Fields */}
                          <div className="space-y-3.5 flex flex-col justify-between">
                            <div className="space-y-3.5">
                              <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">"How to Get There" Step-by-Step Guidance (HTML):</label>
                                <textarea
                                  value={taskHowToGetThereInput}
                                  onChange={(e) => setTaskHowToGetThereInput(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl font-mono transition animate-fade-in"
                                  placeholder="HTML formatting supported..."
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Commander's Professional Tip:</label>
                                <input
                                  type="text"
                                  value={taskCommanderTipInput}
                                  onChange={(e) => setTaskCommanderTipInput(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl transition animate-fade-in"
                                  placeholder="Tip to display in italics..."
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Congrats Message (Upon claiming reward):</label>
                                <input
                                  type="text"
                                  value={taskCongratsMessageInput}
                                  onChange={(e) => setTaskCongratsMessageInput(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl transition animate-fade-in"
                                  placeholder="Congratulatory message..."
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Encouragement Quote (Inspirational sign-off):</label>
                                <input
                                  type="text"
                                  value={taskEncouragementQuoteInput}
                                  onChange={(e) => setTaskEncouragementQuoteInput(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 rounded-xl transition animate-fade-in"
                                  placeholder="Encouraging sign-off..."
                                />
                              </div>
                            </div>

                            <div className="pt-2">
                              <button
                                type="submit"
                                disabled={updatingTask}
                                className="w-full py-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 font-bold text-[10px] uppercase font-mono tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <RefreshCw size={11} className={updatingTask ? 'animate-spin' : ''} />
                                <span>{updatingTask ? 'SAVING OVERRIDES...' : 'Save Quest Override'}</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              }

              // Otherwise for general users, display full width Form only with NO decryption section in DOM
              return (
                <div className="w-full space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Transmit Suggestion</h4>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans mt-0.5">
                      Broadcast a holographic idea, feature request, or balance patch suggestion to Sector headquarters.
                    </p>
                  </div>

                  <form onSubmit={handleSendFeedback} className="space-y-3 max-w-xl">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Feedback Category:</label>
                      <select
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value as any)}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-[#1E293B] hover:border-fuchsia-500/30 text-slate-350 rounded-xl text-xs font-mono focus:outline-none cursor-pointer transition-all"
                      >
                        <option value="gameplay">🎮 GAMEPLAY TWEAKS</option>
                        <option value="visuals">🎨 VISUAL DESIGN / SUGGESTIONS</option>
                        <option value="balancing">⚖️ BALANCING ADJUSTMENTS</option>
                        <option value="bugs">🐛 ANOMALOUS BUG LOGS</option>
                        <option value="other">🌌 OTHER SPECIFICATIONS</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Draft Transmission Content:</label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        maxLength={1000}
                        rows={5}
                        placeholder="Type your strategic suggestions, requested systems, or cosmetic feedback here..."
                        className="w-full px-3 py-2 bg-slate-950 border border-[#1E293B] hover:border-fuchsia-500/40 focus:border-fuchsia-400 focus:outline-none text-xs text-white font-sans rounded-xl transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingFeedback}
                      className="w-full max-w-xs py-2 px-4 bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 hover:from-fuchsia-500/20 hover:to-pink-500/20 border border-fuchsia-500/30 hover:border-fuchsia-500/50 text-fuchsia-300 font-bold text-[10px] uppercase font-mono tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Send size={11} className={sendingFeedback ? 'animate-pulse' : ''} />
                      <span>{sendingFeedback ? 'SENDING...' : 'Send Suggestion'}</span>
                    </button>
                  </form>
                </div>
              );
            })()}
          </div>
        )}
        {confirmModal && (
          <div id="confirm-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
    </div>
  );
};
