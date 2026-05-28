import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
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
  Laptop
} from 'lucide-react';

interface SettingsTabProps {
  player: PlayerProfile;
  theme: 'normal' | 'light' | 'dark';
  setTheme: (theme: 'normal' | 'light' | 'dark') => void;
  skinId: string;
  setSkinId: (skinId: string) => void;
  fontSizeScale: string;
  setFontSizeScale: (scale: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
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
  showToast
}) => {
  // Audio settings derived from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('moonbase_sound_enabled') !== 'false';
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    return localStorage.getItem('moonbase_music_enabled') !== 'false';
  });
  
  // Tactical notifications toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('moonbase_notifications_enabled') !== 'false';
  });

  // Track state changes to persist
  useEffect(() => {
    localStorage.setItem('moonbase_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_music_enabled', String(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('moonbase_notifications_enabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const handleResetApp = () => {
    if (window.confirm('WARNING: Are you sure you want to restore tactical interface defaults? All customized panel levels and access state will require synchronizing again.')) {
      localStorage.clear();
      showToast('Cache memory wiped. Re-routing to quantum gate...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleApplySkin = (id: string, name: string) => {
    setSkinId(id);
    localStorage.setItem('moonbase_skin_id', id);
    showToast(`Visual override skin active: ${name}`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono animate-fade-in pb-16 text-left">
      {/* Header Banner */}
      <div className="p-6 bg-[#0A0F1D]/90 border border-[#1E293B] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Calibrate core cosmetic skins, graphic display modes, accessibility scaling factors, and warning audio transmissions of your space command module.
          </p>
        </div>
        <div className="p-4 bg-slate-950/65 border border-[#1E293B] rounded-xl flex items-center gap-3 shrink-0">
          <span className="text-3xl">🎛️</span>
          <div className="text-left font-mono">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">VERSION LEVEL</span>
            <span className="font-bold text-white text-base">v4.12.0 (Stable)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core View Preferences (Left Panel) */}
        <div className="p-5 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl space-y-5 shadow-lg flex flex-col justify-start">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2 border-b border-[#1E293B]/60 pb-2">
            <Eye size={14} className="text-cyan-400" /> Display & Themes
          </h3>

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
                { id: 'normal', label: 'Solar Standard', emoji: '☀️' },
                { id: 'dark', label: 'Obsidian Moon', emoji: '🌙' },
                { id: 'light', label: 'White Light', emoji: '💡' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id as any);
                    localStorage.setItem('moonbase_theme', opt.id);
                    showToast(`Theme calibrated to: ${opt.label}`, 'success');
                  }}
                  className={`py-2 px-1 text-center border text-[10.5px] font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition ${
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
              <option value="100%">100% (Default High Resolution Command)</option>
              <option value="75%">75% (Compact Telemetry / Server Log)</option>
              <option value="50%">50% (Quantum Matrix overview/Extra Small)</option>
            </select>
          </div>
        </div>

        {/* Audio Toggles & General Operations (Right Panel) */}
        <div className="p-5 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl space-y-5 shadow-lg flex flex-col justify-between">
          
          <div className="space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5bc0be] flex items-center gap-2 border-b border-[#1E293B]/60 pb-2">
              <Volume2 size={14} className="text-cyan-400" /> Sound & Indicators
            </h3>

            {/* Sound FX Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block uppercase">Audio Alert Sound FX</span>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
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

            {/* Combat alerts and toasts */}
            <div className="flex items-start justify-between gap-4 pt-1">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block uppercase">Hologram Toast Displays</span>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
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
                onClick={() => {
                  localStorage.removeItem('moonbase_userId');
                  showToast('De-synchronizing commander keys...', 'info');
                  setTimeout(() => {
                    window.location.reload();
                  }, 800);
                }}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={12} /> Log Out
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Support informational badge */}
      <div className="p-4 bg-[#0A0F1D]/50 border border-[#1E293B]/60 rounded-xl flex items-center gap-3 max-w-lg mx-auto text-left">
        <span className="text-xl">🛡️</span>
        <div className="space-y-0.5">
          <span className="text-[10.5px] font-bold text-slate-300">Space Terminal Secured</span>
          <p className="text-[10px] text-slate-500 leading-normal">
            Your connection details are bound to physical station profile <span className="text-cyan-400 font-mono font-bold">{player.username}</span> ({player.faction}). Unauthorized parsec monitoring is blocked.
          </p>
        </div>
      </div>
    </div>
  );
};
