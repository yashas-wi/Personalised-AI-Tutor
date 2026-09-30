'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { sendChatMessage } from '@/lib/api';
import { ChatMessage } from '@/lib/types';

interface ChatTutorProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic?: string;
  topicName?: string;
  userId: string;
}

export default function ChatTutor({
  isOpen,
  onClose,
  currentTopic,
  topicName,
  userId,
}: ChatTutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your AI Tutor. Ask me anything about ${
        topicName || 'Artificial Intelligence and Machine Learning'
      }, and I'll explain it at your current level!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' };
      setMessages([...updatedHistory, assistantPlaceholder]);

      const stream = await sendChatMessage(
        userId,
        userMessage.content,
        currentTopic,
        updatedHistory
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.substring(6));
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    role: 'assistant',
                    content: accumulated,
                  };
                  return copy;
                });
              }
            } catch (pErr) {
              // Non-JSON SSE ping line
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue reaching the tutoring model. Please check backend connection.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              Adaptive AI Tutor
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-[220px]">
              {topicName ? `Context: ${topicName}` : 'General AI Learning'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-800/80 border border-white/10 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content || (loading && i === messages.length - 1 ? '...' : '')}</div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-slate-800/40">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or clarify a concept..."
            className="w-full bg-slate-900 border border-white/15 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
