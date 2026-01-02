'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  stocks?: { symbol: string; name: string; price: number; changePercent: number }[];
  onClose?: () => void;
  isModal?: boolean;
}

export function ChatAssistant({ stocks, onClose, isModal = false }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Namaste! I\'m ShareSathi, your AI-powered stock market assistant.\n\nAsk me anything about:\n• Market concepts (SENSEX, NIFTY, P/E)\n• Your watchlist analysis\n• Investment guidance\n• General stock market questions\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userInput }],
          context: stocks ? { stocks } : undefined,
        }),
      });

      const data = await response.json();

      if (data.unavailable) {
        setAiUnavailable(true);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    'What is SENSEX?',
    'Analyze my watchlist',
    'Explain P/E ratio',
    'How to start investing?',
  ];

  const content = (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-blue-bg)' }}
          >
            <Sparkles size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              ShareSathi AI
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {aiUnavailable ? 'Limited mode' : 'Powered by AI'}
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)]"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

      {/* AI Unavailable Warning */}
      {aiUnavailable && (
        <div
          className="mx-4 mt-2 p-2 rounded-lg flex items-center gap-2 text-xs"
          style={{ backgroundColor: 'var(--accent-yellow-bg)', color: 'var(--accent-yellow)' }}
        >
          <AlertCircle size={14} />
          AI temporarily unavailable. Using basic responses.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '300px', maxHeight: isModal ? '400px' : '500px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: message.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              }}
            >
              {message.role === 'user' ? (
                <User size={16} color="white" />
              ) : (
                <Bot size={16} style={{ color: 'var(--text-primary)' }} />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                message.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
              }`}
              style={{
                backgroundColor: message.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                color: message.role === 'user' ? 'white' : 'var(--text-primary)',
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <Bot size={16} style={{ color: 'var(--text-primary)' }} />
            </div>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only show if no user messages yet) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                className="text-xs px-3 py-1 rounded-full border transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about stocks, investing..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-2 rounded-full transition-colors disabled:opacity-50"
            style={{
              backgroundColor: input.trim() ? 'var(--accent-blue)' : 'transparent',
            }}
          >
            <Send
              size={18}
              style={{ color: input.trim() ? 'white' : 'var(--text-muted)' }}
            />
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          For educational purposes only. Not financial advice.
        </p>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <Card className="w-full max-w-lg flex flex-col overflow-hidden animate-slideUp">
          {content}
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {content}
    </Card>
  );
}
