import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  User,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Compass,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { chatWithCopilot } from '../lib/api.js';
import { GeminiMarkdown } from './GeminiMarkdown.js';
import type { ChatMessage } from '../types/index.js';

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  destinationContext?: string;
  originCountryContext?: string;
  travelPurposeContext?: string;
  visaTypeContext?: string;
}

export const GeminiCopilotDrawer: React.FC<GeminiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  destinationContext,
  originCountryContext,
  travelPurposeContext,
  visaTypeContext
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `### Welcome to Gemini Foreign Journey Copilot ✨\n\nI can provide clean, real-time advice tailored to your itinerary:\n\n* **Visa & Entry Rules**: eVisa turnaround, consular requirements, and passport validity.\n* **Study & Work Guidelines**: Official student visas (e.g. Subclass 500), document checklists, and work rights.\n* **Airport Layover Protocols**: Transit visa exemptions, terminal transfers, and luggage re-check.\n* **Banned OTC Medications**: Specific country drug prohibitions and prescription requirements.\n* **Electrical & Voltage Specs**: Plug socket types and converter recommendations.\n* **Emergency Protocols**: 24/7 tourist police hotlines and embassy assistance.\n\n*Where are you heading, or what question can I answer for you today?*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'success'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronous lock & request sequencing to completely prevent race conditions, rapid double-clicks & stale responses
  const isSendingRef = useRef<boolean>(false);
  const currentRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cooldown countdown effect for rate limit backoff
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [cooldownRemaining]);

  const quickPrompts = [
    {
      label: '🎓 Study Documents',
      query: destinationContext
        ? `What documents do I need to study in ${destinationContext}?`
        : 'What documents do I need to study abroad as an international student?'
    },
    {
      label: '🛂 Visa & Entry',
      query: destinationContext
        ? `What are the visa and entry requirements for traveling to ${destinationContext}?`
        : 'What are the general visa and entry requirements for international travel?'
    },
    {
      label: '📑 Document Prep',
      query: destinationContext
        ? `What financial proof and bank statement requirements are typically needed for a visa to ${destinationContext}?`
        : 'What documents do I typically need to prepare for an international visa application?'
    },
    {
      label: '💰 Travel Budget',
      query: destinationContext
        ? `Help me structure a realistic daily travel budget breakdown for visiting ${destinationContext}.`
        : 'Help me structure a realistic daily travel budget breakdown and planning timeline.'
    },
    {
      label: '💊 Restricted Meds',
      query: destinationContext
        ? `What common over-the-counter medications are restricted or banned in ${destinationContext}?`
        : 'What common medications are typically restricted or banned when traveling internationally?'
    },
    {
      label: '⏳ Layover Rules',
      query: 'Do I need a transit visa for an international airport layover?'
    },
    {
      label: '🔌 Plugs & Voltage',
      query: destinationContext
        ? `What electrical plug socket type and voltage is used in ${destinationContext}?`
        : 'How do I check electrical plug socket types and voltage when traveling abroad?'
    },
    {
      label: '🚨 Emergency Hotlines',
      query: destinationContext
        ? `What are emergency numbers and tourist safety tips in ${destinationContext}?`
        : 'What emergency numbers and tourist safety protocols should every foreign traveler know?'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    } else {
      // Stop speech synthesis if closed
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeakingIndex(null);
      }
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    // Synchronous guard: reject immediately if already sending, loading, or cooling down
    if (!text || isLoading || isSendingRef.current || cooldownRemaining > 0) return;

    isSendingRef.current = true;
    setIsLoading(true);

    // Sequence ID for this specific submission turn
    currentRequestIdRef.current += 1;
    const thisRequestId = currentRequestIdRef.current;

    // Abort active prior request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'success',
      requestId: thisRequestId
    };

    // Use functional state updates to avoid stale React closures
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      // Prepare history snapshot for Gemini payload
      const historySnapshot = [...messages, userMsg];

      const res = await chatWithCopilot(
        historySnapshot,
        {
          destination: destinationContext,
          originCountry: originCountryContext,
          travelPurpose: travelPurposeContext,
          visaType: visaTypeContext
        },
        abortController.signal,
        thisRequestId
      );

      // Verify that this request has not been superseded by a newer message turn
      if (thisRequestId !== currentRequestIdRef.current) {
        return;
      }
      if (res?.requestId && Number(res.requestId) !== thisRequestId) {
        return;
      }

      if (res?.data?.reply) {
        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'success',
          requestId: thisRequestId
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      if (thisRequestId !== currentRequestIdRef.current) {
        return;
      }

      console.error('Copilot request failed:', err);
      const isRateLimited =
        err?.response?.status === 429 ||
        err?.response?.data?.code === 'RATE_LIMIT_EXCEEDED' ||
        err?.response?.data?.code === 'CONCURRENCY_LIMIT_EXCEEDED' ||
        err?.response?.data?.error === 'RATE_LIMIT_TRANSIENT';

      const rawRetry = err?.response?.data?.retryAfterSeconds || err?.response?.headers?.['retry-after'];
      const retrySec = Number(rawRetry) > 0 ? Number(rawRetry) : (isRateLimited ? 5 : 0);

      // Trigger cooldown period on frontend to prevent immediate retry hammering
      if (isRateLimited && retrySec > 0) {
        setCooldownRemaining(retrySec);
      }

      const errorMsgText = err?.response?.data?.message || err?.message;

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content: isRateLimited
          ? "The AI assistant is receiving too many requests right now. Please wait a moment and try again."
          : `### ⚠️ Connection Notice\n\n${errorMsgText || 'Unable to connect to the Gemini service at this moment. Please ensure the backend server is running and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
        error: errorMsgText,
        isRetryable: isRateLimited || err?.response?.data?.isRetryable !== false,
        requestId: thisRequestId
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (thisRequestId === currentRequestIdRef.current) {
        isSendingRef.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleRetryForMessage = (errorIndex: number) => {
    if (isLoading || isSendingRef.current || cooldownRemaining > 0) return;

    let userTextToRetry = '';
    for (let i = errorIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userTextToRetry = messages[i].content;
        break;
      }
    }
    if (!userTextToRetry) return;

    // Remove the error message and retry the user query
    setMessages((prev) => prev.filter((_, idx) => idx !== errorIndex));
    handleSendMessage(userTextToRetry);
  };

  const handleRegenerateLast = () => {
    if (isLoading || isSendingRef.current || cooldownRemaining > 0) return;
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        handleSendMessage(messages[i].content);
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isSendingRef.current && cooldownRemaining === 0) {
        handleSendMessage();
      }
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeakMessage = (content: string, index: number) => {
    if (!window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown symbols for clean audio speech
    const cleanSpeechText = content
      .replace(/[#*`_~>-]/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearHistory = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setMessages([
      {
        role: 'assistant',
        content: `### Conversation Cleared ✨\n\nHow can I help you plan or navigate your journey to **${destinationContext || 'any global destination'}** today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div
        className={`w-full h-full bg-[#0d1117] border-l border-slate-800 flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        {/* Gemini-Inspired Header */}
        <div className="p-3.5 px-5 border-b border-slate-800 bg-[#161b22]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Iconic Gemini Gradient Sparkle */}
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm tracking-wide">Gemini Copilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-medium">
                  3.8 Flash
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                {destinationContext ? `Context: ${destinationContext}` : 'Global Travel Intelligence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand / Minimize Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse drawer" : "Expand for spacious view"}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close drawer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="p-2.5 px-5 bg-[#0f141c] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">Suggested:</span>
          {quickPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              disabled={isLoading || cooldownRemaining > 0}
              className="text-[11px] px-3 py-1 rounded-full bg-slate-800/70 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 whitespace-nowrap transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 p-0.5 flex-shrink-0 shadow-md mt-0.5">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                )}

                <div className={`max-w-[88%] ${isUser ? 'order-1' : ''}`}>
                  {/* Message Bubble / Container */}
                  <div
                    className={`${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm p-3.5 px-4 shadow-md text-xs sm:text-sm leading-relaxed'
                        : msg.status === 'error'
                        ? 'bg-rose-950/40 border border-rose-500/40 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-lg text-rose-200'
                        : 'bg-[#161b22]/90 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-lg text-slate-200'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <>
                        <GeminiMarkdown content={msg.content} />
                        {msg.status === 'error' && msg.isRetryable && (
                          <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {cooldownRemaining > 0 ? `Rate limited: wait ${cooldownRemaining}s` : 'Request failed'}
                            </span>
                            <button
                              onClick={() => handleRetryForMessage(idx)}
                              disabled={isLoading || cooldownRemaining > 0}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-100 bg-rose-500/25 hover:bg-rose-500/35 border border-rose-500/40 rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                              title={cooldownRemaining > 0 ? `Cooldown active (${cooldownRemaining}s remaining)` : "Retry question"}
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                              <span>{cooldownRemaining > 0 ? `Retry in ${cooldownRemaining}s` : 'Retry Question'}</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message Bottom Action Bar */}
                  <div className={`mt-1.5 px-1 flex items-center gap-3 text-[11px] text-slate-400 ${isUser ? 'justify-end' : 'justify-between'}`}>
                    <span>{msg.timestamp || ''}</span>

                    {!isUser && (
                      <div className="flex items-center gap-1">
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          title="Copy response"
                          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors flex items-center gap-1 text-[11px]"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>

                        {/* Read Aloud Button */}
                        <button
                          onClick={() => handleSpeakMessage(msg.content, idx)}
                          title={speakingIndex === idx ? "Stop speaking" : "Read aloud"}
                          className={`p-1 rounded transition-colors flex items-center gap-1 text-[11px] ${
                            speakingIndex === idx ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
                          }`}
                        >
                          {speakingIndex === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                              <span className="text-[10px] text-cyan-400">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Listen</span>
                            </>
                          )}
                        </button>

                        {/* Thumbs Up */}
                        <button
                          onClick={() => setFeedback(prev => ({ ...prev, [idx]: 'up' }))}
                          title="Good response"
                          className={`p-1 rounded transition-colors ${
                            feedback[idx] === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Thumbs Down */}
                        <button
                          onClick={() => setFeedback(prev => ({ ...prev, [idx]: 'down' }))}
                          title="Poor response"
                          className={`p-1 rounded transition-colors ${
                            feedback[idx] === 'down' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex-shrink-0 flex items-center justify-center text-indigo-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Gemini Loading State */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 p-0.5 flex-shrink-0 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
              </div>
              <div className="p-3.5 px-5 rounded-2xl bg-[#161b22] border border-slate-800 rounded-tl-sm flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-300 font-medium ml-1">Gemini is structuring your answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#161b22]/90 backdrop-blur-md">
          {messages.length > 2 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleRegenerateLast}
                disabled={isLoading}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-slate-800"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate response</span>
              </button>
            </div>
          )}

          <div className="relative flex items-end bg-[#0d1117] border border-slate-700/80 rounded-2xl focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all p-1.5 shadow-inner">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                cooldownRemaining > 0
                  ? `Rate limit cooldown active. Please wait ${cooldownRemaining}s before sending...`
                  : `Ask Gemini about ${destinationContext || 'customs, layovers, visas, or packing'}...`
              }
              rows={2}
              className="w-full bg-transparent text-white text-xs sm:text-sm p-2.5 resize-none focus:outline-none placeholder-slate-500 font-sans disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading || cooldownRemaining > 0}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex-shrink-0"
              title={cooldownRemaining > 0 ? `Please wait ${cooldownRemaining}s cooldown` : "Send message"}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Shift+Enter</kbd> for new line</span>
            <span className="flex items-center gap-1 text-cyan-400/80 font-medium">
              <Sparkles className="w-2.5 h-2.5" /> Powered by Google Gemini
            </span>
          </div>

          <p className="mt-2 text-[10px] text-slate-400 text-center leading-tight">
            Advisory intelligence only. Always confirm official entry rules with sovereign embassies or IATA Timatic before departure. Never transmit unencrypted passport numbers or financial account credentials.
          </p>
        </div>
      </div>
    </div>
  );
};
