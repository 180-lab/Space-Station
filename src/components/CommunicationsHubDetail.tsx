import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Radio, MessageSquare, Send, ChevronUp, ChevronDown, 
  Sparkles, ShieldAlert, Heart, Sword, Compass, Flag, Shield, Award
} from 'lucide-react';
import { PlayerProfile, Alliance, ChatMessage } from '../types';

interface CommunicationsHubDetailProps {
  player: PlayerProfile;
  alliances: Record<string, Alliance>;
  playersList: PlayerProfile[];
  chatMessages: ChatMessage[];
  onSendChat: (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => void;
  onCreateAlliance: (name: string, tag: string, bannerColor: string, bannerSymbol: string) => Promise<void>;
  onJoinAlliance: (allianceId: string) => Promise<void>;
  onLeaveAlliance: () => Promise<void>;
  onDeclareWar: (targetAllianceId: string) => Promise<void>;
  onViewPlayerProfile?: (playerId: string) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshState?: () => void;
}

export const CommunicationsHubDetail: React.FC<CommunicationsHubDetailProps> = ({
  player,
  alliances,
  playersList,
  chatMessages,
  onSendChat,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onDeclareWar,
  onViewPlayerProfile,
  showToast,
  onRefreshState,
}) => {
  const [activeSection, setActiveSection] = useState<'messages' | 'alliance'>('messages');
  
  // Chat States
  const [chatChannel, setChatChannel] = useState<'global' | 'alliance'>('global');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Alliance States
  const [allianceName, setAllianceName] = useState('');
  const [allianceTag, setAllianceTag] = useState('');
  const [showAllianceCmd, setShowAllianceCmd] = useState(true);

  // Auto scroll chat to bottom when message list or channel updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatChannel, activeSection]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatChannel, chatInput);
    setChatInput('');
  };

  const handleCreateAllianceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allianceName.trim() || !allianceTag.trim()) {
      showToast?.('Please specify both name and tag.', 'error');
      return;
    }
    try {
      await onCreateAlliance(allianceName, allianceTag, '#f43f5e', '🛡️');
      setAllianceName('');
      setAllianceTag('');
    } catch (err) {
      showToast?.('Failed to create alliance.', 'error');
    }
  };

  // Member promotion / demotion / kick API calls
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

  // Helpers for alliance ranks
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

  // Get Comm Hub building level
  const commsHubLvl = player ? Math.max(...player.planets.map(pl => pl.buildings.commsHub?.level || 0)) : 0;
  
  // Active Alliance Details
  const activeAlliance = player.allianceId ? alliances[player.allianceId] : null;
  const selfRank = getRankValue(player.allianceRole);

  // Chat filtering logic
  const filteredChatMessages = chatMessages.filter(msg => {
    if (chatChannel === 'global') {
      return msg.channel === 'global';
    } else {
      return player.allianceId && msg.channel === 'alliance' && msg.allianceTag === activeAlliance?.tag;
    }
  });

  return (
    <div className="space-y-4 font-mono text-xs text-left" id="communications-hub-container">
      {/* Visual Section Navigation */}
      <div className="flex border-b border-[#1E293B]">
        <button
          type="button"
          onClick={() => setActiveSection('messages')}
          className={`flex-1 py-2.5 text-center font-bold tracking-wider uppercase border-b-2 flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
            activeSection === 'messages'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare size={13} />
          <span>MESSAGES</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('alliance')}
          className={`flex-1 py-2.5 text-center font-bold tracking-wider uppercase border-b-2 flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
            activeSection === 'alliance'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users size={13} />
          <span>ALLIANCE HUB</span>
        </button>
      </div>

      {/* MESSAGES SECTION */}
      {activeSection === 'messages' && (
        <div className="space-y-3 animate-fade-in">
          {/* Channel selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChatChannel('global')}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition cursor-pointer ${
                chatChannel === 'global'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌐 GLOBAL NET
            </button>
            {player.allianceId && (
              <button
                type="button"
                onClick={() => setChatChannel('alliance')}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition cursor-pointer ${
                  chatChannel === 'alliance'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🛡️ ALLIANCE CHAT [{activeAlliance?.tag || 'ALLY'}]
              </button>
            )}
          </div>

          {/* Messages Console Box */}
          <div className="h-[280px] bg-[#030508]/85 border border-[#1E293B] rounded-xl flex flex-col overflow-hidden relative shadow-inner">
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {filteredChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <MessageSquare size={24} className="opacity-30" />
                  <p className="text-[10px]">No recent transmissions decoded on this frequency.</p>
                </div>
              ) : (
                filteredChatMessages.map((msg) => (
                  <div key={msg.id} className="p-2 border border-slate-900 rounded-lg bg-[#05070A]/50 hover:bg-[#05070A]/85 transition duration-150 leading-relaxed">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-600 text-[9px]">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                      {msg.allianceTag && (
                        <span className="text-yellow-400 font-bold">[{msg.allianceTag}]</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewPlayerProfile && onViewPlayerProfile(msg.senderId)}
                        className="font-bold underline text-cyan-400 hover:text-cyan-300 cursor-pointer focus:outline-none"
                      >
                        {msg.senderName}
                      </button>
                      <span className="text-slate-500 text-[9px]">:</span>
                    </div>
                    <p className="text-slate-350 mt-0.5 pl-2 border-l border-cyan-500/40">{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-2 border-t border-[#1E293B] bg-[#05070A]/90 flex gap-2">
              <input
                type="text"
                placeholder={chatChannel === 'global' ? 'Transmit to sector wavelengths...' : 'Transmit secure alliance data...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-xs font-bold uppercase transition cursor-pointer flex items-center justify-center"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ALLIANCE HUB SECTION */}
      {activeSection === 'alliance' && (
        <div className="space-y-3 animate-fade-in">
          {activeAlliance ? (
            <div className="space-y-3.5">
              {/* Alliance status bar */}
              <div className="p-4 bg-[#05070A]/95 rounded-xl border border-[#1E293B] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-base text-yellow-400 tracking-tight">[{activeAlliance.tag}] {activeAlliance.name}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Founding Archon: {activeAlliance.leaderName}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 w-fit h-fit">
                      Role: {player.allianceRole?.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={onLeaveAlliance}
                      className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 transition cursor-pointer"
                    >
                      Leave Alliance
                    </button>
                  </div>
                </div>

                {/* Ledger Notes */}
                <div className="p-3 bg-amber-950/10 border border-amber-500/15 rounded-lg space-y-1.5">
                  <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    📌 ALLIANCE NOTES LEDGER
                  </h4>
                  <p className="text-[10.5px] text-slate-300 bg-[#020304]/60 p-2 rounded border border-[#1E293B]/40 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeAlliance.highlights || "No highlights recorded yet in the alliance notes ledger."}
                  </p>
                </div>

                {/* Roster directory */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-sky-450 uppercase tracking-widest flex items-center gap-1.5">
                    👥 ALLIANCE ROSTER ({activeAlliance.members?.length || 0})
                  </h4>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
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
              {/* Create alliance */}
              {commsHubLvl < 5 ? (
                <div className="p-4 bg-pink-950/5 rounded-xl border border-pink-500/10 flex flex-col items-center justify-center text-center space-y-2.5">
                  <Sparkles size={18} className="text-pink-400 opacity-60 animate-pulse" />
                  <span className="text-[9px] text-pink-400 uppercase tracking-widest font-bold">Create Alliance Blocked</span>
                  <p className="text-slate-400 text-[10.5px]">Requires Communications Hub Level 5 to establish a new alliance sovereignty (Current: Level {commsHubLvl}).</p>
                </div>
              ) : (
                <form onSubmit={handleCreateAllianceSubmit} className="p-4 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                    <Sparkles size={12} className="text-cyan-400" /> Create Alliance
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <input 
                      type="text" 
                      placeholder="ALLIANCE NAME"
                      value={allianceName}
                      onChange={(e) => setAllianceName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-lg focus:outline-none focus:border-cyan-500 uppercase font-mono"
                    />
                    <input 
                      type="text" 
                      placeholder="TAG (max 4 chars)"
                      maxLength={4}
                      value={allianceTag}
                      onChange={(e) => setAllianceTag(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1E293B] text-white rounded-lg focus:outline-none focus:border-cyan-500 uppercase font-mono"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full px-3 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/35 hover:border-pink-500/50 text-pink-400 hover:text-pink-300 font-bold tracking-widest text-[9px] uppercase rounded-lg transition cursor-pointer"
                  >
                    Create alliance
                  </button>
                </form>
              )}

              {/* Join list */}
              {commsHubLvl < 4 ? (
                <div className="p-4 bg-yellow-950/5 rounded-xl border border-yellow-500/10 flex flex-col items-center justify-center text-center space-y-2.5">
                  <Users size={18} className="text-yellow-400 opacity-60 animate-pulse" />
                  <span className="text-[9px] text-yellow-500 uppercase tracking-widest font-bold">Join Alliance Blocked</span>
                  <p className="text-slate-400 text-[10.5px]">Requires Communications Hub Level 4 to apply/join any galactic alliance coalition (Current: Level {commsHubLvl}).</p>
                </div>
              ) : (
                <div className="p-4 bg-[#05070A]/90 rounded-xl border border-[#1E293B] space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                    <Users size={12} className="text-yellow-400" /> Join Existing
                  </h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {(Object.values(alliances) as Alliance[]).length === 0 ? (
                      <p className="text-slate-500 text-[10px] italic">No active alliances in the galaxy yet.</p>
                    ) : (
                      (Object.values(alliances) as Alliance[]).map((alliance) => {
                        const alreadyApplied = alliance.applications?.some(a => a.playerId === player.id);
                        return (
                          <div key={alliance.id} className="p-2 border border-[#1E293B] bg-[#0A0F1D] rounded-lg flex items-center justify-between gap-1">
                            <div className="truncate">
                              <span className="font-bold text-yellow-400">[{alliance.tag}]</span>
                              <span className="text-slate-350 ml-1.5 font-bold uppercase truncate">{alliance.name}</span>
                            </div>
                            {alreadyApplied ? (
                              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[8.5px] font-bold tracking-widest uppercase border border-slate-700 rounded">
                                Pending 🕒
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onJoinAlliance(alliance.id)}
                                className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-450 hover:text-yellow-350 text-[8.5px] font-bold tracking-widest uppercase border border-yellow-500/30 rounded cursor-pointer transition duration-150 shrink-0"
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
  );
};
