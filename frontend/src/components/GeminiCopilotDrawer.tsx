import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Compass,
  AlertCircle,
  HelpCircle,
  Globe
} from 'lucide-react';
import { chatWithCopilot } from '../lib/api.js';
import type { ChatMessage } from '../types/index.js';

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  destinationContext?: string;
  originCountryContext?: string;
}

export const GeminiCopilotDrawer: React.FC<GeminiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  destinationContext,
  originCountryContext
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your **Gemini 3.8 Flash Foreign Journey Copilot** ✈️\n\nI can assist you with real-time customs rules, airport layover transit visas, medical restrictions, cultural etiquette, or emergency consular protocols. What would you like to explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '💊 Banned OTC Meds', query: `What common over-the-counter medications are strictly banned or restricted in ${destinationContext || 'my destination'}?` },
    { label: '⏳ Layover Rules', query: `Do I need a transit visa for a layover in ${destinationContext || 'Europe/Middle East'} with my passport?` },
    { label: '🔌 Plugs & Power', query: `What electrical plug socket type and voltage is used in ${destinationContext || 'my destination'}?` },
    { label: '🚨 Emergency Tips', query: `What are emergency numbers, common tourist scams, and consulate advice for ${destinationContext || 'my destination'}?` },
    { label: '🪙 Tipping & Customs', query: `What are the tipping customs and cultural etiquette dos and don'ts in ${destinationContext || 'my destination'}?` }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Format history for Gemini API
      const apiPayload = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        content: m.content
      }));

      const res = await chatWithCopilot(apiPayload, {
        destination: destinationContext,
        originCountry: originCountryContext
      });

      if (res?.data?.reply) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      console.error('Copilot request failed:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Unable to reach Gemini service at the moment. Please ensure the backend is running and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation refreshed. How can I assist with your journey to **${destinationContext || 'any global destination'}** today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-lg h-full bg-navy-900 border-l border-cyan-500/30 flex flex-col shadow-2xl shadow-cyan-950 animate-slideInRight">
        {/* Drawer Header */}
        <div className="p-4 px-6 border-b border-slate-800 bg-navy-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Gemini AI Travel Copilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                  3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {destinationContext ? `Context: ${destinationContext}` : 'Global Foreign Journey Advisor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 px-6 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-400 font-semibold uppercase whitespace-nowrap">Suggested:</span>
          {quickPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 whitespace-nowrap transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex-shrink-0 flex items-center justify-center text-cyan-400 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.content}
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{msg.timestamp || ''}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex-shrink-0 flex items-center justify-center text-indigo-300 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3.5 px-5 rounded-2xl bg-slate-900/90 border border-slate-800 rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 ml-2">Gemini is analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/90">
          <div className="relative flex items-end bg-slate-900 border border-slate-700/80 rounded-2xl focus-within:border-cyan-500/80 transition-all p-1.5 shadow-inner">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Gemini about ${destinationContext || 'visas, customs, packing, emergency steps'}...`}
              rows={2}
              className="w-full bg-transparent text-white text-xs md:text-sm p-2.5 resize-none focus:outline-none placeholder-slate-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-glow-cyan flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1 text-cyan-400/80">
              <Sparkles className="w-2.5 h-2.5" /> Powered by Google GenAI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
