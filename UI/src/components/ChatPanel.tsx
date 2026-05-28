import React from 'react';

export default function ChatPanel() {
  return (
    <div className="vm-chat-panel">
      <div className="vm-chat-header">
        <div className="vm-ai-dot"></div>
        <span className="vm-chat-header-title">VaultMind AI</span>
        <i className="ti ti-dots" style={{ fontSize: '14px', color: '#aaa', marginLeft: 'auto' }} aria-hidden="true"></i>
      </div>

      <div className="vm-chat-history">
        <div className="vm-bubble ai">
          Hi! I'm managing your <strong>Work</strong> vault. You can ask me to save or retrieve passwords, code, and commands.
        </div>
        <div className="vm-bubble user">
          What's my GitHub SSH key?
        </div>
        <div className="vm-bubble ai">
          Here's your GitHub SSH key:<br /><br />
          <code style={{ fontSize: '11px', background: '#E8E4DC', padding: '3px 6px', borderRadius: '4px', display: 'block', wordBreak: 'break-all' }}>
            ssh-ed25519 AAAA...k9j2
          </code>
        </div>
      </div>

      <div className="vm-chat-input-area">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="vm-action-bar">
            <div className="vm-action-chip save">
              <i className="ti ti-plus" style={{ fontSize: '10px' }} aria-hidden="true"></i>
              New vault
            </div>
            <div className="vm-action-chip retrieve">
              <i className="ti ti-lock-open" style={{ fontSize: '10px' }} aria-hidden="true"></i>
              My vault
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <textarea className="vm-chat-input" rows={2} placeholder="Ask anything about your vault…"></textarea>
            <button className="vm-send-btn">
              <i className="ti ti-arrow-up" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}