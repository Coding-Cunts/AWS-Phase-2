import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, HelpCircle, MessageSquare } from 'lucide-react';

export default function AiChatDrawer({ isOpen, scanResult, onClose }) {
  if (!isOpen) return null;

  const detectedItems = scanResult?.result?.detectedItems || [];
  const frontendReport = scanResult?.result?.frontendReport || '';

  const initialGreeting = detectedItems.length > 0
    ? `Hello! I'm EcoScan AI. I've analyzed your scene with ${detectedItems.length} detected item${detectedItems.length !== 1 ? 's' : ''} (${detectedItems.map(i => i.item_name).join(', ')}). Ask me any question about recycling guidelines, cleaning, or safe hazardous disposal!`
    : `Hello! I'm your EcoScan AI Waste Assistant. How can I help you sort, recycle, compost, or safely dispose of materials today?`;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const quickSuggestions = detectedItems.length > 0 ? [
    "Can bottle caps stay on?",
    "How do I handle food-soiled packaging?",
    "Are any items here hazardous?",
    "What is the best bin for each detected item?"
  ] : [
    "Can plastic caps be recycled with bottles?",
    "Where do I drop off dead lithium batteries?",
    "Can greasy pizza boxes go in recycling?",
    "Why are soft plastic bags banned from blue bins?"
  ];

  const handleSend = async (queryText) => {
    const text = (queryText || inputText).trim();
    if (!text || isThinking) return;

    const userMsg = {
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          detectedItems,
          frontendReport
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Guideline verified.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      // Contextual client-side AI fallback if backend is unreachable
      const msgLower = text.toLowerCase();
      let fallbackReply = '';
      if (msgLower.includes('cap') || msgLower.includes('lid')) {
        fallbackReply = 'Plastic caps should generally be screwed tightly back onto plastic bottles before placing them into the Blue Recycling Bin. Empty all liquid completely first so the bottle can be compacted properly!';
      } else if (msgLower.includes('battery') || msgLower.includes('lithium') || msgLower.includes('hazard') || msgLower.includes('e-waste')) {
        fallbackReply = 'Lithium-ion and rechargeable batteries must NEVER be placed in curbside recycling or trash—they cause severe facility fires. Please tape the terminals with clear tape and drop them off at a local municipal e-waste depot or participating retail store (e.g. Best Buy, Home Depot).';
      } else if (msgLower.includes('pizza') || msgLower.includes('grease') || msgLower.includes('food')) {
        fallbackReply = 'Grease-soaked paper or pizza boxes cannot be recycled into new paper pulp. Tear off the clean top lid for the Blue Recycling Bin, and place the greasy bottom box into the Green Compost Bin or Landfill!';
      } else if (msgLower.includes('bag') || msgLower.includes('film') || msgLower.includes('soft plastic')) {
        fallbackReply = 'Plastic grocery bags and plastic wrap tangle sorting machinery at MRF facilities. Do NOT put them in curbside bins. Collect clean dry bags and drop them in grocery store plastic film collection bins.';
      } else if (detectedItems.length > 0) {
        const itemNames = detectedItems.map(i => i.item_name).join(', ');
        fallbackReply = `Based on your scanned scene (${itemNames}): Ensure all recyclable containers are rinsed and dry. Place items into their color-coded bins according to the table summary.`;
      } else {
        fallbackReply = 'Keep recyclables clean, dry, and empty! Blue is for Recyclables, Green for Compost, Gray for Landfill, and Orange for Hazardous materials. Let me know if you need specific advice for any material.';
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl animate-slide-up sm:animate-none">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-950/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">EcoScan AI Assistant</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Gemini Vision & Recycling Agent</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scene Context Banner */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {detectedItems.length > 0 ? `${detectedItems.length} Items Loaded` : 'General Advisor'}
          </span>
          <span className="text-slate-400 text-[11px] truncate">
            {detectedItems.length > 0 ? detectedItems.map(i => i.item_name).join(', ') : 'Ready to answer sorting questions'}
          </span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
              <span className="text-[9px] font-mono text-slate-500 px-1">
                {msg.role === 'user' ? 'You' : 'EcoScan AI'} · {msg.time}
              </span>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl w-fit">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">EcoScan AI is analyzing guidelines...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block px-1">
            Suggested Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about these items or recycling rules..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/60 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
