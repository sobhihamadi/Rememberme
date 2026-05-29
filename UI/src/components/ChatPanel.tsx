import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/Usechat';
import { VaultCategory, VaultItemType } from '../types/Types.vault';
import type { VaultAction } from '../types/Types.chat';

interface ChatPanelProps {
  userId:     string;
  category:   VaultCategory;
  type:       VaultItemType;
  onAiReply:  () => void;   // triggers vault list refresh in parent
}

export default function ChatPanel({ userId, category, type, onAiReply }: ChatPanelProps) {
  const [input, setInput]               = useState('');
  const [pendingAction, setPendingAction] = useState<VaultAction>('retrieve');
  const historyRef = useRef<HTMLDivElement>(null);

  const { messages, sending, error, send } = useChat(userId, category, type);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    try {
      await send(text, pendingAction);
      // After AI replies, tell the parent to refresh the vault list
      onAiReply();
    } catch {
      // error already surfaced via hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="vm-chat-panel">
      <div className="vm-chat-header">
        <div className="vm-ai-dot"></div>
        <span className="vm-chat-header-title">VaultMind AI</span>
        <i
          className="ti ti-dots"
          style={{ fontSize: '14px', color: '#aaa', marginLeft: 'auto' }}
          aria-hidden="true"
        />
      </div>

      <div className="vm-chat-history" ref={historyRef}>
        {/* Static welcome */}
        <div className="vm-bubble ai">
          Hi! I'm managing your <strong>{category}</strong> vault (
          {type.toLowerCase()}s). Use{' '}
          <strong>New vault</strong> to save, <strong>My vault</strong> to
          retrieve.
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`vm-bubble ${msg.role === 'AI' ? 'ai' : 'user'}`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {msg.content}
          </div>
        ))}

        {sending && (
          <div className="vm-bubble ai" style={{ opacity: 0.5 }}>
            Thinking…
          </div>
        )}

        {error && (
          <div
            className="vm-bubble ai"
            style={{ color: '#c33', background: '#fff0f0', border: '0.5px solid #f5c6cb' }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="vm-chat-input-area">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Action selector */}
          <div className="vm-action-bar">
            <div
              className="vm-action-chip save"
              onClick={() => setPendingAction('save')}
              style={{
                outline:    pendingAction === 'save' ? '1.5px solid #1B4D6E' : 'none',
                fontWeight: pendingAction === 'save' ? 600 : 400,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: '10px' }} aria-hidden="true" />
              New vault
            </div>
            <div
              className="vm-action-chip retrieve"
              onClick={() => setPendingAction('retrieve')}
              style={{
                outline:    pendingAction === 'retrieve' ? '1.5px solid #2D7A4F' : 'none',
                fontWeight: pendingAction === 'retrieve' ? 600 : 400,
              }}
            >
              <i className="ti ti-lock-open" style={{ fontSize: '10px' }} aria-hidden="true" />
              My vault
            </div>
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <textarea
              className="vm-chat-input"
              rows={2}
              placeholder={
                pendingAction === 'save'
                  ? 'e.g. Save my Netflix password, it\'s Abc123!'
                  : 'e.g. What\'s my Netflix password?'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              className="vm-send-btn"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              style={{ opacity: sending || !input.trim() ? 0.45 : 1 }}
            >
              <i className="ti ti-arrow-up" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}