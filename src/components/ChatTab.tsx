import React, { useState } from 'react';
import { ChatMessage, PlayerProfile, Alliance } from '../types';
import { Send, MessageSquare, ArrowLeft, ChevronLeft, ChevronRight, History } from 'lucide-react';

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
  onSendChat,
  showToast
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [historyPage, setHistoryPage] = useState(0); // 0 = Active Chat, 1+ = Older Archive Pages
  const PAGE_SIZE = 20;

  // Filter messages to show global channel only and sort chronologically (newest at the top, oldest at the bottom)
  const filteredMessages = [...chatMessages]
    .filter(msg => msg.channel === 'global')
    .sort((a, b) => b.timestamp - a.timestamp);

  const startIndex = historyPage * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const displayedMessages = filteredMessages.slice(startIndex, endIndex);
  const totalHistoryPages = Math.ceil(filteredMessages.length / PAGE_SIZE);

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
      {historyPage === 0 ? (
        <>
          {/* Active Chat Header */}
          <div className="p-4 bg-[#0A0F1D]/90 border border-[#1E293B] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xl shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                <MessageSquare size={14} className="animate-pulse" /> 
                <span>SECURE TRANSCEIVER NETWORKS</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Planetary Communication Center</h2>
            </div>
            {filteredMessages.length > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setHistoryPage(1)}
                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/35 text-cyan-400 text-[10px] font-bold uppercase rounded-lg transition duration-150 cursor-pointer flex items-center gap-1.5"
              >
                <History size={11} />
                <span>View Archive</span>
              </button>
            )}
          </div>

          {/* Active Chat Feed */}
          <div className="mt-3 bg-[#0A0F1D]/60 border border-[#1E293B]/70 rounded-2xl p-4 flex flex-col relative">
            <div className="space-y-3 pr-1">
              {displayedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
                  <span className="text-3xl">📡</span>
                  <p className="text-xs text-slate-400 max-w-sm font-sans">
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
                        <span className="text-slate-600 font-normal font-sans">
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

            {filteredMessages.length > PAGE_SIZE && (
              <div className="flex justify-center pt-2 w-full">
                <button
                  id="btn-view-previous-messages"
                  type="button"
                  onClick={() => setHistoryPage(1)}
                  className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-[#1E293B] hover:border-cyan-500/30 text-cyan-400 text-[11px] font-bold uppercase rounded-xl transition duration-150 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.05)] w-full text-center mt-3 flex items-center justify-center gap-2"
                >
                  <History size={12} />
                  <span>View Previous Messages ({filteredMessages.length - PAGE_SIZE} more)</span>
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
        </>
      ) : (
        <>
          {/* History Page Header */}
          <div className="p-4 bg-[#0A0F1D]/90 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.08)] shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
                <History size={14} className="animate-pulse" /> 
                <span>SECURE TRANSMISSIONS ARCHIVE</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Declassified Historical Logs</h2>
              <p className="text-[10px] text-slate-400 font-sans">
                Viewing subwaves {startIndex + 1} - {Math.min(endIndex, filteredMessages.length)} of {filteredMessages.length} total transmissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryPage(0)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase rounded-lg transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={12} />
              <span>Return to Active Chat</span>
            </button>
          </div>

          {/* History Feed List */}
          <div className="mt-3 bg-[#0A0F1D]/80 border border-amber-500/15 rounded-2xl p-4 flex flex-col relative min-h-[350px]">
            {/* Page info tag */}
            <div className="absolute top-2 right-4 text-[9px] text-amber-500/50 uppercase tracking-widest font-black">
              ARCHIVE PORTAL LEVEL {historyPage}
            </div>

            <div className="space-y-3 pr-1 flex-1">
              {displayedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
                  <span className="text-3xl">📭</span>
                  <p className="text-xs text-slate-400 max-w-sm font-sans">
                    This archive coordinate holds no records. Please navigate back.
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
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold mb-0.5 px-1 font-mono">
                        <span className={nameColorClass}>
                          {displayName}
                        </span>
                        <span className="text-slate-600 font-normal font-sans">
                          {new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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

            {/* History Pagination and Clean Actions Bar */}
            <div className="mt-6 pt-4 border-t border-[#1E293B]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Go Forward (Newer) Messages */}
              <button
                type="button"
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage(prev => prev - 1)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-[#1E293B] hover:border-cyan-500/30 text-cyan-400 text-[11px] font-bold uppercase rounded-xl transition duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                <ChevronLeft size={14} />
                <span>Forward (Newer)</span>
              </button>

              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] text-amber-400 font-black uppercase tracking-widest">
                  PAGE {historyPage} / {totalHistoryPages || 1}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-sans">
                  Archive Navigation Matrix
                </span>
              </div>

              {/* Go to Previous (Older) Messages */}
              <button
                type="button"
                disabled={endIndex >= filteredMessages.length}
                onClick={() => setHistoryPage(prev => prev + 1)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-[#1E293B] hover:border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase rounded-xl transition duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                <span>Previous (Older)</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
