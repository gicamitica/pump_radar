import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { readStoredToken } from '@/shared/utils/tokenStorage';

const getToken = () => readStoredToken();

interface Msg { role: 'user' | 'assistant'; text: string; ts: Date; }

const SUGGESTIONS = [
  'What is a PUMP signal?',
  'How does the AI work?',
  'What are the differences between plans?',
  'What data does PumpRadar use?',
];

export default function AIChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: 'Hi! I am the PumpRadar AI assistant. I can help you with questions about crypto signals, subscription plans, or how to use the platform. How can I help you?', ts: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const token = getToken();
      if (!token) {
        navigate('/auth/login', { replace: true });
        return;
      }

      try {
        const res = await axios.get('/api/user/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data?.success || !res.data?.data?.is_active) {
          navigate('/subscription', { replace: true });
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 402) {
            navigate('/subscription', { replace: true });
            return;
          }
          if (error.response?.status === 401) {
            navigate('/auth/login', { replace: true });
            return;
          }
        }
      }
    };

    checkAccess();
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: 'user', text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.post('/api/ai/chat', { message: text.trim() }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.data.reply, ts: new Date() }]);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 402) {
          navigate('/subscription', { replace: true });
          setLoading(false);
          return;
        }
        if (error.response?.status === 401) {
          navigate('/auth/login', { replace: true });
          setLoading(false);
          return;
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, an error occurred. Please try again.', ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4" data-testid="ai-chat-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
          <Bot className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            PumpRadar AI Assistant
            <Sparkles className="h-4 w-4 text-purple-400" />
          </h1>
          <p className="text-xs text-muted-foreground">Instant answers about the crypto market and platform</p>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-purple-100 dark:bg-purple-900'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} className="text-xs bg-muted hover:bg-muted/80 px-3 py-2 rounded-full transition-colors border border-border">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Type a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          disabled={loading}
          data-testid="chat-input"
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="sm" className="px-4" data-testid="chat-send-btn">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
