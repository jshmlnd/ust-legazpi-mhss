import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Loader } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi there! I'm your mental health support assistant. I'm here to help you with stress, anxiety, self-care, academic pressure, and other wellness topics. How are you feeling today?",
};

const QUICK_PROMPTS = [
  "I'm feeling stressed about exams",
  "I need help with sleep",
  "How can I manage anxiety?",
  "I'm feeling burned out",
];

const isCrisisMessage = (text) => {
  const lower = text.toLowerCase();
  return /suicide|kill myself|end my life|self-harm|want to die|cutting/i.test(lower);
};

const CrisisBanner = () => (
  <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-sm">
    <div className="flex items-start gap-2">
      <AlertTriangle size={14} className="text-red-600 mt-0.5 shrink-0" />
      <div className="text-xs text-red-700">
        <p className="font-semibold">If you're in crisis, please reach out:</p>
        <p className="mt-1">UST-Legazpi Guidance Office · National Hotline: 0917-899-8727 · Emergency: 911</p>
      </div>
    </div>
  </div>
);

const MessageBubble = ({ message, isOwn }) => (
  <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
    <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
      isOwn ? 'bg-neutral-900' : 'bg-emerald-100'
    }`}>
      {isOwn ? <User size={13} className="text-white" /> : <Bot size={13} className="text-emerald-700" />}
    </div>
    <div className={`max-w-[80%] px-4 py-2.5 rounded-xl ${
      isOwn
        ? 'bg-neutral-900 text-white rounded-tr-sm'
        : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
    }`}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
    </div>
  </div>
);

const AIChatPage = () => {
  const { authUser } = useAuthStore();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/ai/chat', {
        messages: updatedMessages.slice(-20),
      });

      const assistantMessage = { role: 'assistant', content: res.data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showCrisis = messages.some((m) => m.role === 'user' && isCrisisMessage(m.content));

  return (
    <PageShell
      title="AI Wellness Support"
      subtitle="Confidential chat for mental health and wellness"
    >
      <div className="flex flex-col h-[calc(100vh-180px)] bg-white border border-neutral-200 rounded-sm overflow-hidden">
        {showCrisis && <CrisisBanner />}

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isOwn={msg.role === 'user'}
            />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot size={13} className="text-emerald-700" />
              </div>
              <div className="bg-neutral-100 px-4 py-3 rounded-xl rounded-tl-sm">
                <Loader size={14} className="animate-spin text-neutral-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="px-3 py-1.5 text-xs text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-neutral-200 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type how you're feeling..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none max-h-24"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="size-9 flex items-center justify-center rounded-sm bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            This is an AI assistant, not a substitute for professional help. For crises, call 911 or the Hope Line: 0917-899-8727.
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default AIChatPage;
