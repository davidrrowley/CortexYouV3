import { useState, useRef, useEffect } from 'react';
import { Button, TextArea, InlineLoading, Tag } from '@carbon/react';
import { Close, Send, Idea } from '@carbon/icons-react';
import { sendChatMessage, type ChatMessage } from '../api/client';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTERS = [
  'What hidden connections do you see across my sparks?',
  'Why do I keep returning to themes of communication and leadership?',
  'What do my sparks say about how I think about learning?',
  'Are there any tensions or contradictions in my ideas?',
  'What single theme cuts across the most sparks?',
];

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textAreaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { reply } = await sendChatMessage(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '100vw',
        background: 'rgba(13,17,23,0.97)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid #262626',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #262626',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Idea size={20} style={{ color: '#f1c21b' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#f4f4f4' }}>
            Chat with your graph
          </span>
        </div>
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          renderIcon={Close}
          iconDescription="Close"
          onClick={onClose}
        />
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.length === 0 && (
          <div>
            <p
              style={{
                color: 'var(--cds-text-secondary)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                lineHeight: 1.5,
              }}
            >
              Ask anything about your captured ideas — find hidden connections,
              patterns, or what resonates most.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #393939',
                    borderRadius: '4px',
                    padding: '0.625rem 0.75rem',
                    color: '#c6c6c6',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#525252';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#393939';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'user' ? (
              <div
                style={{
                  background: '#0f62fe22',
                  border: '1px solid #0f62fe55',
                  borderRadius: '4px 4px 0 4px',
                  padding: '0.5rem 0.75rem',
                  maxWidth: '85%',
                  fontSize: '0.875rem',
                  color: '#f4f4f4',
                  lineHeight: 1.5,
                }}
              >
                {msg.content}
              </div>
            ) : (
              <div style={{ maxWidth: '100%' }}>
                <Tag type="green" size="sm" style={{ marginBottom: '0.375rem' }}>
                  Graph insight
                </Tag>
                <div
                  style={{
                    background: 'rgba(66,190,101,0.06)',
                    border: '1px solid #19803855',
                    borderRadius: '0 4px 4px 4px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#e0e0e0',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <InlineLoading description="Thinking…" status="active" />
          </div>
        )}

        {error && (
          <p style={{ color: '#ff8389', fontSize: '0.8125rem' }}>
            Error: {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '0.75rem 1.25rem 1rem',
          borderTop: '1px solid #262626',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextArea
              id="chat-input"
              labelText=""
              hideLabel
              placeholder="Ask about your graph… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading}
              ref={textAreaRef}
              style={{ resize: 'none', fontSize: '0.875rem' }}
            />
          </div>
          <Button
            kind="primary"
            size="md"
            renderIcon={Send}
            hasIconOnly
            iconDescription="Send"
            onClick={() => send()}
            disabled={!input.trim() || loading}
          />
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--cds-text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}
