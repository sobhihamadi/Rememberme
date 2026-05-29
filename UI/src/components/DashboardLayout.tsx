import React from 'react';

interface DashboardLayoutProps {
  children:  React.ReactNode;
  onLogout?: () => void;
}

export default function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <div className="vm-root">
        <div className="vm-topbar">
          <div className="vm-logo">
            <div className="vm-logo-mark">
              <i className="ti ti-lock text-white" style={{ fontSize: '14px' }} aria-hidden="true" />
            </div>
            <span className="vm-logo-name">Vault<span>Mind</span></span>
          </div>
          <div className="vm-topbar-right">
            <span className="vm-badge">Free plan</span>
            <i className="ti ti-bell" style={{ fontSize: '16px', color: '#aaa' }} aria-hidden="true" />
            <div className="vm-avatar">SH</div>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', color: '#aaa', padding: '4px 8px',
                }}
              >
                <i className="ti ti-logout" style={{ fontSize: '14px' }} />
              </button>
            )}
          </div>
        </div>
        <div className="vm-body">{children}</div>
      </div>
    </div>
  );
}