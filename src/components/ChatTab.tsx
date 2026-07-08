import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, PlayerProfile, Alliance } from '../types';
import { Send, Users, MessageSquare, ShieldAlert } from 'lucide-react';

interface ChatTabProps {
  player: PlayerProfile;
  chatMessages: ChatMessage[];
  alliances: Record<string, Alliance>;
  onSendChat: (channel: 'global' | 'alliance' | 'private', content: string, receiverId?: string) => Promise<any> | any;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  player,
  chatMessages,
  alliances,
  onSendChat,
  showToast
}) => {
  const activeChannel = 'global';
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  // Filter messages to show global channel only and sort chronologically (newest at the top, oldest at the bottom)
  const filteredMessages = [...chatMessages]
    .filter(msg => msg.channel === 'global')
    .sort((a, b) => b.timestamp - a.timestamp);

  const displayedMessages = filteredMessages.slice(0, visibleCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendChat('global', inputText.trim());
      setInputText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to transmit message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col font-mono animate-fade-in pb-4">
      {/* Header Banner */}
      <div className="p-4 bg-[#0A0F1D]/90 border border-[#1E293B] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xl shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
            <MessageSquare size={14} className="animate-pulse" /> 
            <span>SECURE TRANSCEIVER NETWORKS</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Planetary Communication Center</h2>
        </div>
      </div>

      {/* Main Messages Feed Block */}
      <div className="mt-3 bg-[#0A0F1D]/60 border border-[#1E293B]/70 rounded-2xl p-4 flex flex-col relative">
        <div className="space-y-3 pr-1">
          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
              <span className="text-3xl">📡</span>
              <p className="text-xs text-slate-400 max-w-sm">
                No active subwave transmissions on Sector Global. Begin broadcasting below.
              </p>
            </div>
          ) : (
            displayedMessages.map((msg, idx) => {
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
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold mb-0.5 px-1">
                    <span className={nameColorClass}>
                      {displayName}
                    </span>
                    <span className="text-slate-600 font-normal">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words font-medium ${
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

        {filteredMessages.length > visibleCount && (
          <div className="flex justify-center pt-2 w-full">
            <button
              id="btn-view-previous-messages"
              type="button"
              onClick={() => setVisibleCount(prev => prev + 20)}
              className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-[#1E293B] hover:border-cyan-500/30 text-cyan-400 text-[11px] font-bold uppercase rounded-xl transition duration-150 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.05)] w-full text-center mt-3"
            >
              📥 View Previous Messages ({filteredMessages.length - visibleCount} more)
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-[#1E293B]/60 flex items-stretch gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Transmit secure data across sector wavelengths..."
            className="flex-1 px-4 py-3 text-xs bg-slate-950/60 border border-[#1E293B] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-medium transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              inputText.trim() && !isSending
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer'
                : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
            }`}
          >
            <Send size={12} />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
};
