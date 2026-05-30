import React, { useState } from 'react';

interface DashboardLayoutProps {
  children:  React.ReactNode;
  onLogout?: () => void;
}

export default function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="vm-root">
      <div className="vm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="vm-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <i className={`ti ${sidebarOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
          </button>
          <div className="vm-logo">
            <div className="vm-logo-mark">
              <i className="ti ti-lock" style={{ fontSize: '14px', color: '#fff' }} aria-hidden="true" />
            </div>
            <span className="vm-logo-name">Vault<span>Mind</span></span>
          </div>
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

      {/* Overlay — only on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="vm-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="vm-body">
        {/* Pass sidebarOpen and close handler via React.cloneElement to children */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Check if the child is the Sidebar (has onCategoryChange prop)
            if ('onCategoryChange' in (child.props as object)) {
              return React.cloneElement(child as React.ReactElement<{ sidebarOpen?: boolean; onClose?: () => void }>, {
                sidebarOpen,
                onClose: () => setSidebarOpen(false),
              });
            }
          }
          return child;
        })}
      </div>
    </div>
  );
}