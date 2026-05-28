import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <div className="vm-root">
        {/* Topbar */}
        <div className="vm-topbar">
          <div className="vm-logo">
            <div className="vm-logo-mark">
              <i className="ti ti-lock text-white" style={{ fontSize: '14px' }} aria-hidden="true"></i>
            </div>
            <span className="vm-logo-name">Vault<span>Mind</span></span>
          </div>
          <div className="vm-topbar-right">
            <span className="vm-badge">Free plan</span>
            <i className="ti ti-bell" style={{ fontSize: '16px', color: '#aaa' }} aria-hidden="true"></i>
            <div className="vm-avatar">SH</div>
          </div>
        </div>

        {/* Body Section */}
        <div className="vm-body">
          {children}
        </div>
      </div>
    </div>
  );
}