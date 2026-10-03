import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Sprout,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  /** True when the reply is general guidance rather than a personalised AI answer. */
  offline?: boolean;
}

export const AssistantView: React.FC = () => {
  const { plants, weather, routine, userProfile } = usePlant();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${userProfile.name}! 🌱 I'm Plantzy AI. I have access to your collection of ${plants.length} plants, your recent soil observations, and ${weather ? `today's weather (${weather.temperature}°C in ${userProfile.city})` : 'your local weather when it is available'}. How can I help with your routine today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Should I water my Monstera today?',
    'Why is my Basil drooping in the sun?',
    'Which plants need attention today?',
    'Can I move my Aloe outside in this weather?',
    'What should I prepare before going on vacation?',
    "Why hasn't Plantzy asked me to water my Snake Plant?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Context that grounds the answer in this user's collection and conditions
      const userContext = {
        city: userProfile.city,
        weather: {
          temp: weather?.temperature,
          feelsLike: weather?.feelsLike,
          humidity: weather?.humidity,
          uv: weather?.uvIndex,
          rainProb: weather?.rainProbability,
        },
        plants: plants.map((p) => ({
          name: p.name,
          species: p.species,
          location: p.location,
          indoorOutdoor: p.indoorOutdoor,
          status: p.status,
          lastSoilCheck: p.lastSoilCheck,
          lastWatered: p.lastWatered,
          soilTrend: p.soilMoistureTrend,
          lastSoilCondition: p.soilHistory[p.soilHistory.length - 1]?.condition,
        })),
        pendingTasksCount: routine.allTasks.filter((t) => t.status === 'pending').length,
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          userContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.answer) {
        throw new Error(data.message || `Assistant request failed (${res.status})`);
      }
      const aiReply: string = data.answer;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          offline: Boolean(data.isFallback),
        },
      ]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text:
            err instanceof Error && err.message.startsWith('Too many requests')
              ? err.message
              : 'I could not reach the assistant just now. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EFE7] text-[#245236] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Grounded in Your Plants & Environment</span>
        </div>
        <h1 className="font-serif-plant text-3xl font-extrabold text-[#163022]">
          Plantzy AI Assistant
        </h1>
        <p className="text-xs sm:text-sm text-[#556F60] max-w-lg mx-auto">
          Ask questions about your specific plants, soil observations, sunlight positioning, or upcoming weather.
        </p>
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-3xl border border-[#E2EAE3] shadow-md overflow-hidden flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-[#2D5A3C] text-white'
                    : 'bg-[#EBF4ED] text-[#2D5A3C] border border-[#D0E5D5]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-md sm:max-w-lg p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-[#2D5A3C] text-white rounded-tr-xs'
                    : 'bg-[#F6FAF7] border border-[#E3EDE5] text-[#1E3A2B] rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.offline && (
                  <p className="text-[10px] font-semibold text-[#92400E] bg-[#FEF9E7] border border-[#FDE68A] rounded-lg px-2 py-1">
                    General guidance only. The AI assistant is unavailable, so this reply is not
                    based on your plants.
                  </p>
                )}
                <div
                  className={`text-[10px] text-right ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-[#6D8575]'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EBF4ED] text-[#2D5A3C] border border-[#D0E5D5] flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-[#2D5A3C]" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F6FAF7] border border-[#E3EDE5] text-xs text-[#526C5D] flex items-center gap-2">
                <span>Checking your plants' conditions...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Strip */}
        <div className="p-3 bg-[#F9FBFA] border-t border-[#EDF3EF] overflow-x-auto flex gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium text-[#2D5A3C] bg-white border border-[#D3E3D7] hover:bg-[#EBF4EE] px-3 py-1.5 rounded-full whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E5EDE7] flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask anything about your plants (e.g. Can I move my Aloe outside?)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#CCD8CF] text-xs sm:text-sm outline-none focus:border-[#2D5A3C]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#23472F] disabled:opacity-40 text-white font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsible AI Disclaimer */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#698172] text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
        <span>Plantzy AI provides guidance grounded in botanical science. Always inspect real soil moisture before watering.</span>
      </div>
    </div>
  );
};
