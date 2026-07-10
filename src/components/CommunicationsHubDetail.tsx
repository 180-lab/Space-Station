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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Alliance States
  const [allianceName, setAllianceName] = useState('');
  const [allianceTag, setAllianceTag] = useState('');
  const [showAllianceCmd, setShowAllianceCmd] = useState(true);

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Auto scroll chat to bottom when message list, section or channel updates
  useEffect(() => {
    scrollToBottom(false);
    const timer = setTimeout(() => scrollToBottom(false), 50);
    return () => clearTimeout(timer);
  }, [activeSection]);

  useEffect(() => {
    scrollToBottom(true);
  }, [chatMessages, chatChannel]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatChannel, chatInput);
    setChatInput('');
  };

  const handleCreateAllianceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allianceName.trim()) {
      showToast?.('Please specify an alliance name.', 'error');
      return;
    }
    // Auto generate unique 4 character tag from name under the hood
    const generatedTag = (allianceName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 4) || Math.random().toString(36).substring(2, 6)).toUpperCase();
    try {
      await onCreateAlliance(allianceName, generatedTag, '#f43f5e', '🛡️');
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

  // Chat filtering logic, sorted chronologically (oldest at the top, newest at the bottom)
  const filteredChatMessages = [...chatMessages]
    .filter(msg => {
      if (chatChannel === 'global') {
        return msg.channel === 'global';
      } else {
        return player.allianceId && msg.channel === 'alliance' && msg.allianceTag === activeAlliance?.tag;
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-4 font-mono text-xs text-left" id="communications-hub-container">
      {/* Visual Section Navigation */}
      <div className={`grid grid-cols-1 ${player.allianceId ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 p-3 bg-slate-950/80 border border-[#1E293B]/70 rounded-xl`}>
        <button
          type="button"
          onClick={() => {
            setActiveSection('messages');
            setChatChannel('global');
          }}
          className={`relative p-4 rounded-xl border font-mono text-left transition duration-200 cursor-pointer overflow-hidden group ${
            activeSection === 'messages' && chatChannel === 'global'
              ? 'bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
              : 'bg-[#03060c] border-[#1E293B] hover:border-emerald-500/30 hover:bg-[#070d17]'
          }`}
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition duration-300 text-2xl">🌐</div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border transition ${
              activeSection === 'messages' && chatChannel === 'global'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                : 'bg-slate-900 border-[#1E293B] text-slate-400 group-hover:text-emerald-400'
            }`}>
              <Radio size={15} className={activeSection === 'messages' && chatChannel === 'global' ? 'animate-bounce' : ''} />
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-widest text-emerald-500/80 font-black block">GLOBAL FREQUENCY</span>
              <span className={`text-xs tracking-wide font-black uppercase ${
                activeSection === 'messages' && chatChannel === 'global' ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                Global Chat
              </span>
            </div>
          </div>
          {activeSection === 'messages' && chatChannel === 'global' && (
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 to-cyan-500" />
          )}
        </button>

        {player.allianceId && (
          <button
            type="button"
            onClick={() => {
              setActiveSection('messages');
              setChatChannel('alliance');
            }}
            className={`relative p-4 rounded-xl border font-mono text-left transition duration-200 cursor-pointer overflow-hidden group ${
              activeSection === 'messages' && chatChannel === 'alliance'
                ? 'bg-gradient-to-r from-amber-950/30 to-yellow-950/30 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                : 'bg-[#03060c] border-[#1E293B] hover:border-yellow-500/30 hover:bg-[#070d17]'
            }`}
          >
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition duration-300 text-2xl">💬</div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border transition ${
                activeSection === 'messages' && chatChannel === 'alliance'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                  : 'bg-slate-900 border-[#1E293B] text-slate-400 group-hover:text-yellow-450'
              }`}>
                <MessageSquare size={15} className={activeSection === 'messages' && chatChannel === 'alliance' ? 'animate-bounce' : ''} />
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-widest text-yellow-500/80 font-black block">ALLIANCE CHANNEL</span>
                <span className={`text-xs tracking-wide font-black uppercase ${
                  activeSection === 'messages' && chatChannel === 'alliance' ? 'text-yellow-400' : 'text-slate-300'
                }`}>
                  Alliance Chat
                </span>
              </div>
            </div>
            {activeSection === 'messages' && chatChannel === 'alliance' && (
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-yellow-500 to-amber-500" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSection('alliance')}
          className={`relative p-4 rounded-xl border font-mono text-left transition duration-200 cursor-pointer overflow-hidden group ${
            activeSection === 'alliance'
              ? 'bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'bg-[#03060c] border-[#1E293B] hover:border-cyan-500/30 hover:bg-[#070d17]'
          }`}
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition duration-300 text-2xl">👥</div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border transition ${
              activeSection === 'alliance' 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900 border-[#1E293B] text-slate-400 group-hover:text-cyan-400'
            }`}>
              <Users size={15} className={activeSection === 'alliance' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-widest text-cyan-500/80 font-black block">COALITION HUB</span>
              <span className={`text-xs tracking-wide font-black uppercase ${
                activeSection === 'alliance' ? 'text-cyan-400' : 'text-slate-300'
              }`}>
                Alliance Desk
              </span>
            </div>
          </div>
          {activeSection === 'alliance' && (
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500" />
          )}
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
                🛡️ ALLIANCE CHAT
              </button>
            )}
          </div>

          {/* Messages Console Box */}
          <div className="h-[280px] bg-[#030508]/85 border border-[#1E293B] rounded-xl flex flex-col overflow-hidden relative shadow-inner">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {filteredChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <MessageSquare size={24} className="opacity-30" />
                  <p className="text-[10px]">No recent transmissions decoded on this frequency.</p>
                </div>
              ) : (
                filteredChatMessages.map((msg, idx) => {
                  const senderId = msg.senderId || (msg as any).playerId;
                  const senderName = msg.senderName || (msg as any).username;
                  const isMe = senderId === player.id;
                  const isSystem = senderId === 'SYS' || senderId === 'system' || senderName === 'SYS' || senderName === 'System' || senderName === 'Galactic Federation' || (senderName && senderName.includes('Galactic Federation'));
                  const displayName = (isSystem ? 'Galactic Federation' : senderName).replace('[SYS]', '').trim();
                  const nameColorClass = isSystem ? 'text-amber-400 animate-pulse' : (isMe ? 'text-cyan-400' : 'text-slate-400');

                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold mb-0.5 px-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onViewPlayerProfile && onViewPlayerProfile(senderId)}
                          className={`font-bold underline cursor-pointer focus:outline-none ${nameColorClass}`}
                        >
                          {displayName}
                        </button>
                        <span className="text-slate-600 font-normal">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className={`p-2.5 rounded-2xl text-xs leading-relaxed break-words font-medium ${
                        isSystem
                          ? 'bg-amber-950/20 border border-amber-500/20 text-amber-200 rounded-2xl'
                          : isMe 
                            ? 'bg-cyan-950/40 border border-cyan-500/25 text-cyan-200 rounded-tr-none' 
                            : 'bg-slate-900/90 border border-[#1E293B] text-slate-300 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
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
                    <span className="font-bold text-base text-yellow-400 tracking-tight">{activeAlliance.name}</span>
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
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-sky-450 uppercase tracking-widest flex items-center gap-1.5">
                      👥 ALLIANCE ROSTER DIRECTORY ({activeAlliance.members?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('messages');
                        setChatChannel('alliance');
                      }}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <MessageSquare size={11} /> Alliance Chat 💬
                    </button>
                  </div>
                  <div className="space-y-1.5">
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
                              <span className="text-slate-350 font-bold uppercase truncate">{alliance.name}</span>
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
