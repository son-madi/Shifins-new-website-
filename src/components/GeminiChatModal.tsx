import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Sparkles,
  User as UserIcon,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme, isDark } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "👋 **Hi! I'm Ninimo AI (powered by Gemini).**\n\nI can help you configure bots, keep free 24/7 Minecraft servers alive (Aternos, Minehut, etc.), fix connection errors, and guide your multi-bot testing fleet. What would you like to know?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'How do I keep Aternos 24/7 online?',
    'What is the On-Join command for /login?',
    'How does the TESTER Multi-Bot swarm work?',
    'Why is my bot getting disconnected?',
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
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer from Gemini');
      }

      const botMsg: ChatMessage = {
        id: `gemini-${Date.now()}`,
        role: 'model',
        text: data.reply || 'I am Ninimo AI. How else can I assist your Minecraft bots?',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      let errorText = err.message || 'Unable to connect to Gemini AI. Please check your network or try again.';
      if (errorText.includes('503') || errorText.includes('high demand') || errorText.includes('UNAVAILABLE')) {
        errorText = 'The Gemini model is currently experiencing a temporary demand spike. Ninimo AI fallback has been engaged — please send your message again.';
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ ${errorText}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: "✨ Chat cleared! Ask me anything about Minecraft bots, anti-AFK scripts, or server configurations.",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-end justify-end p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={`pointer-events-auto w-full max-w-md border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[560px] max-h-[85vh] backdrop-blur-xl relative transition-colors ${
              isDark ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between relative ${
              isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-200 border-zinc-300 text-zinc-800'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Ninimo Gemini AI
                    <span className={`text-[10px] font-mono border px-1.5 py-0.2 rounded-full ${
                      isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                    }`}>
                      Assistant
                    </span>
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Minecraft & Bot Intelligence</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat history"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'model' && (
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                    }`}>
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-zinc-900 text-white rounded-br-none border border-zinc-700 shadow-sm'
                        : isDark
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-inner'
                        : 'bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.role === 'user' && (
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                    }`}>
                      <UserIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-center text-zinc-400 text-xs">
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                  }`}>
                    <Sparkles className="w-3 h-3 animate-spin" />
                  </div>
                  <div className={`border rounded-2xl px-3 py-2 flex items-center gap-2 ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px]">Gemini is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className={`shrink-0 px-2.5 py-1 border text-[10px] rounded-full transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                        : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className={`p-3 border-t ${
              isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Gemini about Minecraft servers, bots, AFK..."
                  className={`flex-1 border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-zinc-500 transition-all font-sans ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-zinc-100 hover:bg-white text-zinc-950 border border-zinc-300 disabled:opacity-40 rounded-xl transition-colors cursor-pointer shadow-sm"
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
