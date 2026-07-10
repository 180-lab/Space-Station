import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, Send, ChevronUp, ChevronDown, 
  Sparkles, ShieldAlert, Heart, Sword, Compass, Flag, Shield, Award,
  Trash2, Reply, Star, Forward, X, Mail, Settings, RefreshCw, Trophy, Radio, Target
} from 'lucide-react';
import { PlayerProfile, Alliance, ChatMessage, CommandMessage, ColonyPlanet, ResourceType, getUpgradeResourceCost, FleetMission } from '../types';

interface CommunicationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  alliances: Record<string, Alliance>;
  playersList: PlayerProfile[];
  fleets?: FleetMission[];
  onSendMessage: (receiverId: string, content: string) => Promise<void>;
  onToggleMessageRead: (messageId: string, isRead: boolean) => Promise<void>;
  onToggleSaveMessage: (messageId: string, isSaved: boolean) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onCreateAlliance: (name: string, tag: string, bannerColor: string, bannerSymbol: string) => Promise<void>;
  onJoinAlliance: (allianceId: string) => Promise<void>;
  onLeaveAlliance: () => Promise<void>;
  onDeclareWar: (targetAllianceId: string) => Promise<void>;
  onViewPlayerProfile?: (playerId: string) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshState?: () => void;
  activePlanet?: ColonyPlanet;
  onUpgradeBuilding?: (buildingKey: string, queue?: boolean) => Promise<any> | any;
  isUpgrading?: boolean;
  serverTime?: number;
}

export const CommunicationsHubModal: React.FC<CommunicationsHubModalProps> = ({
  isOpen,
  onClose,
  player,
  alliances,
  playersList,
  fleets = [],
  onSendMessage,
  onToggleMessageRead,
  onToggleSaveMessage,
  onDeleteMessage,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onDeclareWar,
  onViewPlayerProfile,
  showToast,
  onRefreshState,
  activePlanet,
  onUpgradeBuilding,
  isUpgrading,
  serverTime,
}) => {
  // Mobile back button sync handler
  useEffect(() => {
    if (!isOpen) return;

    // Push dummy state to capture back navigation
    window.history.pushState({ modal: 'comms' }, '');

    const handlePopState = (e: PopStateEvent) => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const handleManualClose = () => {
    if (window.history.state?.modal === 'comms') {
      window.history.back(); // triggers popstate which closes the modal
    } else {
      onClose();
    }
  };

  const [activeTab, setActiveTab] = useState<'messages' | 'alliance'>('messages');
  const [localTick, setLocalTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Personal Messages Sub-Tabs
  const [commDeckTab, setCommDeckTab] = useState<'incoming' | 'saved' | 'sent' | 'compose'>('incoming');
  const [directMsgTargetId, setDirectMsgTargetId] = useState('');
  const [directMsgContent, setDirectMsgContent] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [forwardingMsgId, setForwardingMsgId] = useState<string | null>(null);
  const [forwardTargetId, setForwardTargetId] = useState('');

  // Alliance Hub States
  const [allianceName, setAllianceName] = useState('');
  const [allianceTag, setAllianceTag] = useState('');
  const [showAllianceCmd, setShowAllianceCmd] = useState(true);

  // Manage Alliance (Operations Cockpit) States
  const [showManageAlliance, setShowManageAlliance] = useState(false);
  const [allianceHighlightText, setAllianceHighlightText] = useState('');
  const [editingHighlights, setEditingHighlights] = useState(false);
  const [allianceMemberReports, setAllianceMemberReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeReportsTab, setActiveReportsTab] = useState<'highlights' | 'troops' | 'situation' | 'activity'>('highlights');
  const [expandedMemberPlanets, setExpandedMemberPlanets] = useState<Record<string, boolean>>({});

  // Fetch Alliance Reports
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

  const handleOpenManageAlliance = () => {
    setShowManageAlliance(true);
    fetchMemberReports();
    const activeAlliance = player.allianceId ? alliances[player.allianceId] : null;
    if (activeAlliance) {
      setAllianceHighlightText(activeAlliance.highlights || '');
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
        showToast?.("Alliance highlights updated successfully!", "success");
        onRefreshState?.();
      } else {
        showToast?.("Failed to update highlights.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast?.("Network error updating highlights.", "error");
    }
  };

  // Roster promotions / kicks
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
        showToast?.(data.error || 'Failed to promote member', 'error');
      } else {
        showToast?.('Member rank promoted!', 'success');
        onRefreshState?.();
      }
    } catch (err) {
      showToast?.('Error promoting member', 'error');
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
        showToast?.(data.error || 'Failed to demote member', 'error');
      } else {
        showToast?.('Member rank demoted.', 'success');
        onRefreshState?.();
      }
    } catch (err) {
      showToast?.('Error demoting member', 'error');
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
        showToast?.(data.error || 'Failed to dismiss member', 'error');
      } else {
        showToast?.('Member dismissed from alliance.', 'success');
        onRefreshState?.();
      }
    } catch (err) {
      showToast?.('Error dismissing member', 'error');
    }
  };

  const handleCreateAllianceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allianceName.trim() || !allianceTag.trim()) {
      showToast?.('Please specify both name and tag.', 'error');
      return;
    }
    try {
      await onCreateAlliance(allianceName, allianceTag, '#22d3ee', '🛡️');
      setAllianceName('');
      setAllianceTag('');
    } catch (err) {
      showToast?.('Failed to create alliance.', 'error');
    }
  };

  // Helper values for ranks
  const getRankValue = (role: string | null | undefined): number => {
    if (role === 'commander' || role === 'leader') return 3;
    if (role === 'officer') return 2;
    if (role === 'member') return 1;
    if (role === 'recruit') return 0;
    return 0;
  };

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

  if (!isOpen) return null;

  const commsHubLvl = player ? Math.max(...player.planets.map(pl => pl.buildings.commsHub?.level || 0)) : 0;
  const activeAlliance = player.allianceId ? alliances[player.allianceId] : null;
  const selfRank = getRankValue(player.allianceRole);

  return (
    <div className="fixed inset-0 bg-[#060813] z-50 flex flex-col overflow-hidden font-mono" id="comms-hub-modal-overlay animate-fade-in">
      <div className="flex-1 flex flex-col relative text-left">
        
        {/* Colorful top decoration */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B]/70 bg-black/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-xl">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">Station Communications Desk</h2>
              <p className="text-[10px] text-slate-400 font-normal font-sans">Classified personal signal decoders and alliance network systems</p>
            </div>
          </div>
          {activePlanet && activePlanet.buildings?.commsHub && activePlanet.buildings.commsHub.isUpgrading ? (
            <div className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold font-mono animate-pulse font-sans">
              ⏳ UPGRADING...
            </div>
          ) : activePlanet && activePlanet.buildings?.commsHub && activePlanet.buildings.commsHub.level >= activePlanet.buildings.commsHub.maxLevel ? (
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl">
              MAX CAP
            </span>
          ) : (
            activePlanet && activePlanet.buildings?.commsHub && (
              <button
                type="button"
                onClick={() => onUpgradeBuilding && onUpgradeBuilding('commsHub')}
                disabled={isUpgrading || !(() => {
                  const nextLvl = (activePlanet.buildings.commsHub?.level || 0) + 1;
                  return (['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).every(rKey => {
                    const cost = getUpgradeResourceCost('building', 'commsHub', nextLvl, rKey);
                    return (activePlanet.resources[rKey] || 0) >= cost;
                  });
                })()}
                className={`text-[10px] px-3 py-1.5 rounded-xl font-bold font-mono uppercase tracking-wider transition ${
                  (() => {
                    const nextLvl = (activePlanet.buildings.commsHub?.level || 0) + 1;
                    return (['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).every(rKey => {
                      const cost = getUpgradeResourceCost('building', 'commsHub', nextLvl, rKey);
                      return (activePlanet.resources[rKey] || 0) >= cost;
                    });
                  })() ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
                title={`Upgrade Comms Hub to Lv. ${(activePlanet.buildings.commsHub?.level || 0) + 1}`}
              >
                🚀 UPGRADE HUB (LV. {(activePlanet.buildings.commsHub?.level || 0) + 1})
              </button>
            )
          )}
        </div>

        {/* Major Selector Tabs: Personal Messages vs Alliance Hub */}
        <div className="flex border-b border-[#1E293B]/60 bg-black/25">
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'messages'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mail size={14} />
            <span>PERSONAL MESSAGES ({player.commandMessages?.filter(m => !m.isSent && !m.isRead).length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alliance')}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-wider uppercase border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'alliance'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>ALLIANCE HUB</span>
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          
          {/* Landing Page: Upgrade Communications Hub */}
          {activePlanet && activePlanet.buildings?.commsHub && (
            <div className="p-4 bg-slate-900/90 border border-cyan-500/20 rounded-xl space-y-3 shadow-lg relative overflow-hidden mb-6 font-mono">
              <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">📡</div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cyan-500/10">
                <div>
                  <span className="text-[10px] text-cyan-400 block uppercase font-bold tracking-wider">STRUCTURE INTEGRATION</span>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Communications Hub Core</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-950 text-pink-400 border border-[#1E293B]">
                      Lv. {activePlanet.buildings.commsHub.level} / {activePlanet.buildings.commsHub.maxLevel}
                    </span>
                  </h4>
                </div>
                {activePlanet.buildings.commsHub.isUpgrading ? (
                  (() => {
                    const getTimerStringLocal = (endTimestamp: number | null) => {
                      if (!endTimestamp) return '';
                      const diff = Math.max(0, endTimestamp - (serverTime || Date.now()));
                      const secs = Math.floor(diff / 1000);
                      const h = Math.floor(secs / 3600);
                      const m = Math.floor((secs % 3600) / 60);
                      const s = secs % 60;
                      return `${h}h ${m}m ${s}s`;
                    };
                    return (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold animate-pulse flex items-center gap-1">
                        <span className="animate-spin text-xs">⏳</span>
                        <span>Upgrading: {getTimerStringLocal(activePlanet.buildings.commsHub.upgradeEnd)}</span>
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold bg-[#05070A] border border-[#1E293B] px-2.5 py-1 rounded-xl">
                    STATUS: OPERATIONAL
                  </span>
                )}
              </div>

              {!activePlanet.buildings.commsHub.isUpgrading && activePlanet.buildings.commsHub.level < activePlanet.buildings.commsHub.maxLevel && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl font-sans">
                    Upgrade your Communications Hub to extend signal decoders and alliance network systems. Next Level upgrade requires:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).map((rKey) => {
                      const nextLvl = (activePlanet.buildings.commsHub?.level || 0) + 1;
                      const cost = getUpgradeResourceCost('building', 'commsHub', nextLvl, rKey);
                      const currentVal = activePlanet.resources[rKey] || 0;
                      const hasSufficient = currentVal >= cost;
                      const rNames: Record<ResourceType, string> = {
                        water: 'Water',
                        plasma: 'Plasma',
                        fuel: 'Deuterium',
                        food: 'Food',
                        respirant: 'Respirant O2'
                      };
                      const rIcons: Record<ResourceType, string> = {
                        water: '💧',
                        plasma: '⚡',
                        fuel: '🔥',
                        food: '🍏',
                        respirant: '💨'
                      };
                      return (
                        <div key={rKey} className={`p-2 rounded-lg border flex flex-col justify-center text-left ${hasSufficient ? 'bg-[#05070A]/50 border-[#1E293B]/40' : 'bg-red-950/10 border-red-500/20'}`}>
                          <span className="text-[9px] text-slate-500 font-bold truncate">{rIcons[rKey]} {rNames[rKey]}</span>
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
                      onClick={() => onUpgradeBuilding && onUpgradeBuilding('commsHub')}
                      disabled={isUpgrading || !(() => {
                        const nextLvl = (activePlanet.buildings.commsHub?.level || 0) + 1;
                        return (['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).every(rKey => {
                          const cost = getUpgradeResourceCost('building', 'commsHub', nextLvl, rKey);
                          return (activePlanet.resources[rKey] || 0) >= cost;
                        });
                      })()}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition duration-150 ${
                        (() => {
                          const nextLvl = (activePlanet.buildings.commsHub?.level || 0) + 1;
                          return (['water', 'plasma', 'fuel', 'food', 'respirant'] as ResourceType[]).every(rKey => {
                            const cost = getUpgradeResourceCost('building', 'commsHub', nextLvl, rKey);
                            return (activePlanet.resources[rKey] || 0) >= cost;
                          });
                        })() ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer' : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <span>🚀 Upgrade to Level {(activePlanet.buildings.commsHub?.level || 0) + 1}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpgradeBuilding && onUpgradeBuilding('commsHub', true)}
                      disabled={isUpgrading}
                      className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/35 rounded-xl transition duration-150 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-emerald-400">Queue Upgrade</span>
                    </button>
                  </div>
                </div>
              )}

              {!activePlanet.buildings.commsHub.isUpgrading && activePlanet.buildings.commsHub.level >= activePlanet.buildings.commsHub.maxLevel && (
                <div className="pt-2 select-none text-right flex items-center justify-between border-t border-cyan-500/10 mt-3">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Actions & Progress Control:</span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl">
                    MAX CAP
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: PERSONAL SECURE MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4 h-full flex flex-col">
              
              {/* Comms subtab selectors */}
              <div className="flex flex-wrap border-b border-[#1E293B]/60 mb-3 bg-[#05070A]/50 rounded-lg p-1 text-[10px] sm:text-[11px] font-bold shrink-0">
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
                  className={`flex-1 py-2 text-center rounded-md transition cursor-pointer ${commDeckTab === 'saved' ? 'bg-[#1e293b]/60 text-yellow-450 border border-cyan-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  ⭐ SAVED ({player.commandMessages?.filter(m => !m.isSent && m.isSaved).length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => { setCommDeckTab('compose'); setForwardingMsgId(null); }}
                  className={`flex-1 py-2 text-center rounded-md transition cursor-pointer ${commDeckTab === 'compose' ? 'bg-[#1e293b]/60 text-[#00F0FF] border border-cyan-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🛰️ FIELD DISPATCHER
                </button>
              </div>

              {/* Message List area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                
                {/* Compose Form */}
                {commDeckTab === 'compose' && (
                  <div className="space-y-4 p-4 bg-[#05070A]/30 border border-[#1E293B]/60 rounded-xl">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Select Destination Commander</label>
                      <select
                        value={directMsgTargetId}
                        onChange={(e) => setDirectMsgTargetId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="">-- Choose active Commander --</option>
                        {playersList.filter(p => p.id !== player.id).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.username}
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
                        className="w-full h-32 bg-[#05070A] border border-[#1E293B] text-slate-100 rounded-xl p-3 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                        maxLength={500}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={isSendingMsg || !directMsgTargetId || !directMsgContent.trim()}
                        onClick={async () => {
                          setIsSendingMsg(true);
                          try {
                            await onSendMessage(directMsgTargetId, directMsgContent);
                            setDirectMsgContent('');
                            setCommDeckTab('sent');
                          } catch (err) {
                            showToast?.('Failed to send signal.', 'error');
                          } finally {
                            setIsSendingMsg(false);
                          }
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white rounded-xl font-bold uppercase transition disabled:opacity-30 disabled:cursor-not-allowed text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      >
                        {isSendingMsg ? 'DISPATCHING RADIO TRANS...' : 'DISPATCH SECURE TRANS'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Incoming/Sent/Saved messages rendering */}
                {commDeckTab !== 'compose' && (() => {
                  const messagesListFiltered = (player.commandMessages || []).filter(m => {
                    if (commDeckTab === 'saved') return !m.isSent && m.isSaved === true;
                    if (commDeckTab === 'sent') return m.isSent === true;
                    return !m.isSent;
                  });

                  if (messagesListFiltered.length === 0) {
                    return (
                      <div className="py-20 text-center border border-dashed border-[#1E293B]/40 rounded-xl">
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
                            onToggleMessageRead(msg.id, true);
                          }
                        }}
                      >
                        {/* Message Meta Info Header */}
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {!isRead && !showRecipient && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#22d3ee]" />
                              )}
                              <span className="font-bold text-slate-100 uppercase tracking-wide">
                                🛰️ {showRecipient ? 'Recipient: ' : 'Sender: '}
                                <span 
                                  className="text-cyan-400 hover:underline cursor-pointer decoration-dotted font-black" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (onViewPlayerProfile) {
                                      onViewPlayerProfile(showRecipient ? msg.receiverId : msg.senderId);
                                    }
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

                        {/* Alliance Invitation Interactive Responses */}
                        {msg.isAllianceInvite && msg.inviteStatus === 'pending' && !showRecipient && (
                          <div className="flex gap-2.5 p-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/alliance/invite/respond', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-user-id': player.id
                                    },
                                    body: JSON.stringify({ messageId: msg.id, action: 'accept' })
                                  });
                                  if (res.ok) {
                                    showToast?.('Alliance enlistment completed successfully! Welcome aboard, Commander!', 'success');
                                    onRefreshState?.();
                                  } else {
                                    const data = await res.json();
                                    showToast?.(data.error || 'Failed to accept invitation.', 'error');
                                  }
                                } catch (err) {
                                  showToast?.('Network link failure.', 'error');
                                }
                              }}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-wider text-[10px] uppercase rounded-lg cursor-pointer transition duration-150 text-center"
                            >
                              Accept Offer ✅
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/alliance/invite/respond', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-user-id': player.id
                                    },
                                    body: JSON.stringify({ messageId: msg.id, action: 'decline' })
                                  });
                                  if (res.ok) {
                                    showToast?.('Invitation declined and archived.', 'info');
                                    onRefreshState?.();
                                  } else {
                                    const data = await res.json();
                                    showToast?.(data.error || 'Decline operation failed.', 'error');
                                  }
                                } catch (err) {
                                  showToast?.('Network link failure.', 'error');
                                }
                              }}
                              className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-black tracking-wider text-[10px] uppercase rounded-lg cursor-pointer transition duration-150 text-center"
                            >
                              Decline Offer ❌
                            </button>
                          </div>
                        )}

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
                                    onToggleMessageRead(msg.id, !isRead);
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
                                    onToggleSaveMessage(msg.id, !isSaved);
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
                                  : 'bg-[#05070A]/80 border-[#1e293b] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'
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
                              if (confirm("Are you absolutely sure you want to permanently delete this message log?")) {
                                onDeleteMessage(msg.id);
                              }
                            }}
                            className="px-2 py-1 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded font-bold uppercase tracking-wider flex items-center gap-1 duration-150 cursor-pointer"
                          >
                            <Trash2 size={9.5} /> Purge log
                          </button>
                        </div>

                        {/* Expandable Forward Area */}
                        {forwardingMsgId === msg.id && (
                          <div className="p-3 bg-black/40 border border-[#1e293b]/80 rounded-xl space-y-3 mt-2" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                              <span className="text-[9px] text-[#00F0FF] uppercase font-bold block tracking-wider">CHOOSE RECIPIENT COMMANDER:</span>
                              <select 
                                value={forwardTargetId}
                                onChange={(e) => setForwardTargetId(e.target.value)}
                                className="w-full bg-[#05070A] border border-[#1E293B] text-white rounded px-2.5 py-1.5 text-xs focus:outline-none"
                              >
                                <option value="">-- Choose commander to forward to --</option>
                                {playersList.filter(p => p.id !== player.id).map(p => (
                                  <option key={p.id} value={p.id}>{p.username}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={!forwardTargetId}
                                onClick={async () => {
                                  try {
                                    await onSendMessage(forwardTargetId, `[FORWARDED FROM ${msg.senderName}]: ${msg.content}`);
                                    setForwardingMsgId(null);
                                    setForwardTargetId("");
                                    showToast?.("Message forwarded!", "success");
                                  } catch (err) {
                                    showToast?.("Forward failed.", "error");
                                  }
                                }}
                                className="px-3 py-1 text-[9px] font-bold bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/30 text-[#00F0FF] rounded-lg uppercase tracking-wider transition cursor-pointer"
                              >
                                Forward Transmit 🚀
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
          )}

          {/* TAB 2: ALLIANCE HUB */}
          {activeTab === 'alliance' && (
            <div className="space-y-4 font-mono text-xs">
              {activeAlliance ? (
                <div className="space-y-4">
                  {/* Alliance Info Header Box */}
                  <div className="p-4 bg-[#05070A]/95 rounded-xl border border-[#1E293B] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-lg text-yellow-400 tracking-tight">[{activeAlliance.tag}] {activeAlliance.name}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Founding Archon: {activeAlliance.leaderName}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 w-fit h-fit">
                          Role: {player.allianceRole?.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={onLeaveAlliance}
                          className="text-[9.5px] uppercase font-bold tracking-widest px-3 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 transition cursor-pointer"
                        >
                          Leave Alliance
                        </button>
                      </div>
                    </div>

                    {/* Alliance Ledger Highlights */}
                    <div className="p-3 bg-amber-950/10 border border-amber-500/15 rounded-lg space-y-1.5">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        📌 ALLIANCE NOTES LEDGER
                      </h4>
                      <p className="text-[10.5px] text-slate-300 bg-[#020304]/60 p-2 rounded border border-[#1E293B]/40 leading-relaxed font-sans whitespace-pre-wrap">
                        {activeAlliance.highlights || "No highlights recorded yet in the alliance notes ledger. Any authorized commander can update notes inside the Operations Cockpit below."}
                      </p>
                    </div>

                    {/* Cockpit Trigger */}
                    <div className="p-4 bg-cyan-950/15 border border-cyan-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                          <Radio size={14} className="animate-pulse" /> Alliance Operations Cockpit
                        </h4>
                        <p className="text-[10.5px] text-slate-400 max-w-sm">
                          Access real-time intelligence reports: notes directives, members troop lists, and player status telemetry logs.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenManageAlliance}
                        className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[10.5px] font-black uppercase tracking-widest rounded-xl transition duration-150 cursor-pointer text-center hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                      >
                        Manage Alliance ⚙&zwj;⚙
                      </button>
                    </div>

                    {/* Member Directory / Roster */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                        👥 ALLIANCE ROSTER DIRECTORY ({activeAlliance.members?.length || 0})
                      </h4>
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                        {activeAlliance.members?.map((mbr) => {
                          const mbrRank = getRankValue(mbr.role);
                          const isSelf = mbr.playerId === player.id;
                          const canManage = selfRank >= 2 && selfRank > mbrRank && !isSelf;

                          return (
                            <div key={mbr.playerId} className="p-2 border border-[#1E293B] bg-[#030508]/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#070b14]/50 transition">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelf ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => onViewPlayerProfile && onViewPlayerProfile(mbr.playerId)}
                                    className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer focus:outline-none"
                                  >
                                    {mbr.username}
                                  </button>
                                  {isSelf && <span className="text-[8px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded px-1 ml-1.5 font-bold">YOU</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getRankColor(mbr.role)}`}>
                                  {getRankLabel(mbr.role)}
                                </span>

                                {canManage && (
                                  <div className="flex items-center gap-1">
                                    {((mbrRank < 2) || (mbrRank === 2 && selfRank === 3)) && (
                                      <button
                                        type="button"
                                        onClick={() => handlePromoteMember(mbr.playerId)}
                                        className="px-1.5 py-0.5 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 rounded font-bold cursor-pointer text-[9px]"
                                      >
                                        Promote 🔼
                                      </button>
                                    )}

                                    {mbrRank > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDemoteMember(mbr.playerId)}
                                        className="px-1.5 py-0.5 bg-amber-950/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15 rounded font-bold cursor-pointer text-[9px]"
                                      >
                                        Demote 🔽
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleKickMember(mbr.playerId)}
                                      className="px-1.5 py-0.5 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500/15 rounded font-bold cursor-pointer text-[9px]"
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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create alliance options */}
                  {commsHubLvl < 5 ? (
                    <div className="p-5 bg-pink-950/5 rounded-xl border border-pink-500/10 flex flex-col items-center justify-center text-center space-y-2.5">
                      <Sparkles size={20} className="text-pink-400 opacity-60 animate-pulse" />
                      <span className="text-[10px] text-pink-400 uppercase tracking-widest font-bold">Create Alliance Blocked</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">Requires Communications Hub Level 5 to establish a new sovereign alliance coalition (Current Level: {commsHubLvl}).</p>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateAllianceSubmit} className="p-4 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <Sparkles size={12} className="text-cyan-400" /> Create New Alliance
                      </h4>
                      <p className="text-[10px] text-slate-400">Establish a sovereign coalition structure to lead star systems and coordinate joint fleets.</p>
                      <div className="space-y-2.5">
                        <input 
                          type="text" 
                          placeholder="ALLIANCE NAME"
                          value={allianceName}
                          onChange={(e) => setAllianceName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-lg focus:outline-none focus:border-cyan-500 uppercase font-mono text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="TAG (max 4 characters)"
                          maxLength={4}
                          value={allianceTag}
                          onChange={(e) => setAllianceTag(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-lg focus:outline-none focus:border-cyan-500 uppercase font-mono text-xs"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full px-3 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/35 hover:border-pink-500/50 text-pink-400 hover:text-pink-300 font-bold tracking-widest text-[10px] uppercase rounded-lg transition cursor-pointer"
                      >
                        Create Alliance Sovereignty
                      </button>
                    </form>
                  )}

                  {/* Join existing alliances list */}
                  {commsHubLvl < 4 ? (
                    <div className="p-5 bg-yellow-950/5 rounded-xl border border-yellow-500/10 flex flex-col items-center justify-center text-center space-y-2.5">
                      <Users size={20} className="text-yellow-400 opacity-60 animate-pulse" />
                      <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold">Join Alliance Blocked</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">Requires Communications Hub Level 4 to enlist in existing cosmic coalitions (Current Level: {commsHubLvl}).</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <Users size={12} className="text-yellow-400" /> Join Existing Alliance
                      </h4>
                      <p className="text-[10px] text-slate-400">Apply to active alliances currently coordinating coordinates across the galaxy.</p>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {(Object.values(alliances) as Alliance[]).length === 0 ? (
                          <p className="text-slate-500 text-[10px] italic">No active alliances in the galaxy yet.</p>
                        ) : (
                          (Object.values(alliances) as Alliance[]).map((alliance) => {
                            const alreadyApplied = alliance.applications?.some(a => a.playerId === player.id);
                            return (
                              <div key={alliance.id} className="p-2 border border-[#1E293B] bg-[#0A0F1D] rounded-lg flex items-center justify-between gap-1.5">
                                <div className="truncate">
                                  <span className="font-bold text-yellow-400">[{alliance.tag}]</span>
                                  <span className="text-slate-350 ml-1.5 font-bold uppercase truncate">{alliance.name}</span>
                                </div>
                                {alreadyApplied ? (
                                  <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[9px] font-bold tracking-wider uppercase border border-slate-700 rounded-lg shrink-0">
                                    Pending 🕒
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onJoinAlliance(alliance.id)}
                                    className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-450 hover:text-yellow-350 text-[9px] font-bold tracking-wider uppercase border border-yellow-500/30 rounded-lg cursor-pointer transition duration-150 shrink-0"
                                  >
                                    Join
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* OPERATIONS COCKPIT MODAL (Manage alliance reports - identical layout) */}
      {showManageAlliance && (() => {
        const activeAlliance = alliances[player.allianceId || ''];
        if (!activeAlliance) return null;

        return (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-[#090D1A] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col h-[85vh] relative text-left">
              
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500" />
              
              {/* Modal Header */}
              <div className="p-5 border-b border-[#1E293B]/70 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙&zwj;⚙</span>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF]">
                      Sovereignty Operations Console: [{activeAlliance.tag}] {activeAlliance.name}
                    </h3>
                    <p className="text-[10px] uppercase text-slate-500">
                      Coordinating highlights logs, fleet troop readiness, and live telemetry reports
                    </p>
                  </div>
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
                      <div className="space-y-3 bg-[#030508]/80 border border-[#1E293B]/70 p-4.5 rounded-xl">
                        <div className="p-4.5 bg-[#020304] rounded-lg border border-[#1E293B]/40 leading-relaxed text-slate-300 font-sans text-xs whitespace-pre-wrap min-h-[140px]">
                          {activeAlliance.highlights || "No directives recorded yet in the ledger. Establish priorities to guide alliance strategy."}
                        </div>
                        {selfRank >= 2 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAllianceHighlightText(activeAlliance.highlights || '');
                                setEditingHighlights(true);
                              }}
                              className="px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 rounded-xl font-bold uppercase transition text-[10px] cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                            >
                              Edit Note Ledger Directives ✏️
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MEMBERS TROOP READINESS */}
                {activeReportsTab === 'troops' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">🎖️ MEMBERS TROOP READINESS</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Consolidated active-duty military logistics. Inspect aggregated troop counts and defensive shield and strike capacities across all stations for each alliance member.
                      </p>
                    </div>

                    {loadingReports ? (
                      <div className="py-20 text-center text-slate-500">Decrypting satellite rosters...</div>
                    ) : allianceMemberReports.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 border border-dashed border-[#1E293B] rounded-xl">No member troop profiles currently synced.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allianceMemberReports.map((member) => {
                          const defHpMap: Record<string, number> = { defender: 18, attacker: 9, tank: 5, looter: 4, drone: 120, settlementShip: 50 };
                          const atkHpMap: Record<string, number> = { defender: 10, attacker: 30, tank: 5, looter: 4, drone: 120, settlementShip: 0 };

                          let totalDefHp = 0;
                          let totalAtkHp = 0;
                          const totalTroops = { defender: 0, attacker: 0, tank: 0, looter: 0, drone: 0, settlementShip: 0 };

                          member.planets?.forEach((planet: any) => {
                            const troops = planet.troops || {};
                            Object.entries(troops).forEach(([k, qty]) => {
                              const q = Number(qty) || 0;
                              totalDefHp += q * (defHpMap[k] || 0);
                              totalAtkHp += q * (atkHpMap[k] || 0);
                              if (k in totalTroops) {
                                totalTroops[k as keyof typeof totalTroops] += q;
                              }
                            });
                          });

                          const totalHpValue = totalDefHp + totalAtkHp;

                          return (
                            <div key={member.playerId} className="p-4 bg-[#05070A]/90 border border-[#1E293B] rounded-xl space-y-3.5 shadow-lg relative overflow-hidden hover:border-cyan-500/30 transition">
                              <div className="flex items-center justify-between border-b border-[#1E293B]/70 pb-2.5">
                                <div>
                                  <span className="font-extrabold text-[#00F0FF]">{member.username}</span>
                                  <span className={`ml-2 px-1.5 py-0.2 rounded text-[8px] font-bold border ${getRankColor(member.role)}`}>
                                    {getRankLabel(member.role)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] font-black text-cyan-400 font-mono">
                                    ❤️ TOTAL HP: {totalHpValue.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Combat HP stats breakdown */}
                              <div className="grid grid-cols-2 gap-2 bg-[#020304]/60 p-2 rounded-lg border border-[#1E293B]/40 font-mono text-[9.5px]">
                                <div className="text-blue-400 font-bold flex items-center gap-1">
                                  🛡️ DEF HP: {totalDefHp.toLocaleString()}
                                </div>
                                <div className="text-orange-400 font-bold flex items-center gap-1 justify-end">
                                  ⚔️ ATK HP: {totalAtkHp.toLocaleString()}
                                </div>
                              </div>

                              {/* Aggregated Troops List */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Aggregated Troop Garrison</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                                  {[
                                    { k: 'drone', label: 'Assault Drone', icon: '⚔️' },
                                    { k: 'defender', label: 'Interceptor', icon: '🛡️' },
                                    { k: 'tank', label: 'Disrupter', icon: '🤖' },
                                    { k: 'looter', label: 'Matter Extractor', icon: '🛸' },
                                    { k: 'settlementShip', label: 'Settlement Ship', icon: '🚀' }
                                  ].map((tr) => (
                                    <div key={tr.k} className="p-1.5 rounded-md bg-[#020304]/80 border border-[#1E293B]/30 flex flex-col justify-center">
                                      <span className="text-[9px] text-slate-500 font-bold truncate">{tr.icon} {tr.label}</span>
                                      <span className="text-xs font-black text-white mt-0.5">{(totalTroops[tr.k as keyof typeof totalTroops] || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SITUATION ROOM */}
                {activeReportsTab === 'situation' && (() => {
                  const allianceMemberIds = activeAlliance.members?.map(m => m.playerId) || [];
                  const activeFleets = fleets || [];

                  // Outgoing attacks: missionType is 'attack', sender is in our alliance
                  const outgoingAttacks = activeFleets.filter(f => 
                    f.missionType === 'attack' && allianceMemberIds.includes(f.senderId)
                  );

                  // Incoming attacks: missionType is 'attack', target is in our alliance, sender is NOT in our alliance
                  const incomingAttacks = activeFleets.filter(f => 
                    f.missionType === 'attack' && f.targetId && allianceMemberIds.includes(f.targetId) && !allianceMemberIds.includes(f.senderId)
                  );

                  const formatTimeLeft = (arrivesAt: number) => {
                    const diff = Math.max(0, Math.round((arrivesAt - Date.now()) / 1000));
                    if (diff === 0) return "ARRIVED / COLLIDING";
                    const h = Math.floor(diff / 3600);
                    const m = Math.floor((diff % 3600) / 60);
                    const s = diff % 60;
                    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
                  };

                  return (
                    <div className="space-y-5">
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1.5">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                          📡 SITUATION ROOM (WAR PLANS & LIVE FLEET MOVEMENTS)
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          Live tactical defense desk monitoring active hostile attacks on alliance members and outgoing offensive operations.
                        </p>
                      </div>

                      {/* INCOMING ATTACKS SECTION */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-2 font-mono">
                          🚨 INCOMING HOSTILE STRIKE FLEETS ({incomingAttacks.length})
                        </h5>
                        
                        {incomingAttacks.length === 0 ? (
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center text-emerald-400 font-sans text-xs">
                            ✓ No hostile inbound strike vectors detected targeting alliance stations.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {incomingAttacks.map(f => (
                              <div key={f.id} className="p-3 bg-rose-950/15 border border-rose-500/30 rounded-xl space-y-2 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div>
                                    <span className="text-rose-400 font-extrabold uppercase font-mono">HOSTILE ATTACK TRANSIT</span>
                                    <div className="text-slate-300 font-sans mt-0.5">
                                      <strong className="text-rose-300">{f.senderName}</strong> [{f.senderCoords.x}, {f.senderCoords.y}] &rarr; <strong className="text-cyan-300">{f.targetName}</strong> [{f.targetCoords.x}, {f.targetCoords.y}]
                                    </div>
                                  </div>
                                  <div className="text-right sm:text-right flex flex-col items-end">
                                    <span className="text-rose-400 font-mono font-black animate-pulse">{formatTimeLeft(f.arrivesAt)}</span>
                                    <span className="text-[9px] text-slate-500 font-mono uppercase">ETA: {new Date(f.arrivesAt).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                                <div className="p-2 bg-black/40 rounded border border-rose-500/10 text-[10px] space-y-1">
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Inbound Fleet Armaments:</span>
                                  <div className="grid grid-cols-3 gap-1">
                                    {Object.entries(f.troops || {}).filter(([_, q]) => (Number(q) || 0) > 0).map(([k, q]) => (
                                      <div key={k} className="text-slate-300 font-mono">
                                        • <span className="capitalize">{k}</span>: <span className="font-bold text-rose-300">{q}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* OUTGOING ATTACKS SECTION */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2 font-mono">
                          ⚔️ OUTGOING ALLIANCE ATTACK FLEETS ({outgoingAttacks.length})
                        </h5>

                        {outgoingAttacks.length === 0 ? (
                          <div className="p-4 bg-slate-950/40 border border-[#1E293B] rounded-xl text-center text-slate-500 font-sans text-xs">
                            No offensive strike fleets currently in transit.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {outgoingAttacks.map(f => (
                              <div key={f.id} className="p-3 bg-cyan-950/15 border border-cyan-500/30 rounded-xl space-y-2 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div>
                                    <span className="text-cyan-400 font-extrabold uppercase font-mono">OFFENSIVE OPERATION IN PROGRESS</span>
                                    <div className="text-slate-300 font-sans mt-0.5">
                                      <strong className="text-cyan-300">{f.senderName}</strong> [{f.senderCoords.x}, {f.senderCoords.y}] &rarr; <strong className="text-rose-300">{f.targetName}</strong> [{f.targetCoords.x}, {f.targetCoords.y}]
                                    </div>
                                  </div>
                                  <div className="text-right sm:text-right flex flex-col items-end">
                                    <span className="text-cyan-400 font-mono font-black">{formatTimeLeft(f.arrivesAt)}</span>
                                    <span className="text-[9px] text-slate-500 font-mono uppercase">ETA: {new Date(f.arrivesAt).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                                <div className="p-2 bg-black/40 rounded border border-cyan-500/10 text-[10px] space-y-1">
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Fleet Composition:</span>
                                  <div className="grid grid-cols-3 gap-1">
                                    {Object.entries(f.troops || {}).filter(([_, q]) => (Number(q) || 0) > 0).map(([k, q]) => (
                                      <div key={k} className="text-slate-300 font-mono">
                                        • <span className="capitalize">{k}</span>: <span className="font-bold text-cyan-300">{q}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 4: PLAYER ACTIVITY ROSTER */}
                {activeReportsTab === 'activity' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest">👥 COALITION ACTIVITY TELEMETRY</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Real-time system telemetry verifying online logs and last active status for roster synchronicity and response planning.
                      </p>
                    </div>

                    <div className="border border-[#1E293B] bg-[#05070A]/80 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-[#0c1222] border-b border-[#1E293B] grid grid-cols-3 font-bold text-slate-300 text-[10.5px]">
                        <span>COMMANDER</span>
                        <span className="text-center">RANKING ROLE</span>
                        <span className="text-right">TELEMETRY DECRYPTION</span>
                      </div>
                      <div className="divide-y divide-[#1E293B]/40 max-h-[400px] overflow-y-auto">
                        {allianceMemberReports.map((m) => {
                          const isSelf = m.playerId === player.id;
                          const lastActiveTime = m.lastActive || Date.now() - 600000;
                          const elapsedMs = Date.now() - lastActiveTime;
                          const isActive = elapsedMs <= 5 * 60 * 1000; // 5 minutes

                          let telemetryStatus = "";
                          let dotColor = "bg-slate-500";
                          let textColor = "text-slate-400";
                          
                          if (isActive) {
                            telemetryStatus = "ACTIVE NOW";
                            dotColor = "bg-emerald-400 animate-pulse";
                            textColor = "text-emerald-400 font-extrabold";
                          } else {
                            const minutesAgo = Math.floor(elapsedMs / 60000);
                            if (minutesAgo < 60) {
                              telemetryStatus = `ACTIVE ${minutesAgo}m AGO`;
                            } else {
                              const hoursAgo = Math.floor(minutesAgo / 60);
                              if (hoursAgo < 24) {
                                telemetryStatus = `ACTIVE ${hoursAgo}h AGO`;
                              } else {
                                telemetryStatus = `ACTIVE ON ${new Date(lastActiveTime).toLocaleDateString()}`;
                              }
                            }
                            dotColor = "bg-amber-500";
                            textColor = "text-amber-500 font-bold";
                          }

                          return (
                            <div key={m.playerId} className="px-4 py-3 grid grid-cols-3 items-center hover:bg-slate-900/10">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                {m.username}
                                {isSelf && <span className="text-[7px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded px-1 ml-1 font-bold">YOU</span>}
                              </span>
                              <span className="text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${getRankColor(m.role)}`}>
                                  {getRankLabel(m.role)}
                                </span>
                              </span>
                              <span className={`text-right text-[10px] font-mono ${textColor}`}>{telemetryStatus}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Back Button */}
      <button
        type="button"
        onClick={handleManualClose}
        className="fixed right-6 bottom-6 z-[60] flex items-center justify-center gap-2.5 px-5 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] transition duration-150 active:scale-95 group cursor-pointer"
        title="Back to Station"
      >
        <Compass size={18} className="animate-spin-slow group-hover:rotate-45 transition-transform" />
        <span className="text-xs uppercase tracking-widest font-black hidden sm:inline font-mono">RETURN TO BASE</span>
      </button>

    </div>
  );
};
