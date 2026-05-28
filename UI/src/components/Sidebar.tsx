import React from 'react';

// These perfectly match your backend enums
export type VaultCategory = 'Personal' | 'Work' | 'Notes';

interface SidebarProps {
  activeCategory: VaultCategory;
  onCategoryChange: (category: VaultCategory) => void;
  counts: Record<VaultCategory, number>; // To display the dynamic numbers
}

export default function Sidebar({ activeCategory, onCategoryChange, counts }: SidebarProps) {
  return (
    <div className="vm-sidebar">
      <div className="vm-sidebar-section">
        <div className="vm-sidebar-label">Workspace</div>
        <div className="vm-nav-item active">
          <i className="ti ti-layout-grid" aria-hidden="true"></i>
          Dashboard
        </div>
        <div className="vm-nav-item">
          <i className="ti ti-search" aria-hidden="true"></i>
          Search vault
        </div>
      </div>

      <div className="vm-divider"></div>

      <div className="vm-sidebar-section">
        <div className="vm-sidebar-label">Categories</div>
        
        <div 
          className={`vm-nav-item ${activeCategory === 'Personal' ? 'active' : ''}`}
          onClick={() => onCategoryChange('Personal')}
        >
          <i className="ti ti-user" aria-hidden="true"></i>
          Personal
          <span className="vm-nav-count">{counts.Personal}</span>
        </div>

        <div 
          className={`vm-nav-item ${activeCategory === 'Work' ? 'active' : ''}`}
          onClick={() => onCategoryChange('Work')}
        >
          <i className="ti ti-briefcase" aria-hidden="true"></i>
          Work
          <span className="vm-nav-count">{counts.Work}</span>
        </div>

        <div 
          className={`vm-nav-item ${activeCategory === 'Notes' ? 'active' : ''}`}
          onClick={() => onCategoryChange('Notes')}
        >
          <i className="ti ti-notes" aria-hidden="true"></i>
          Notes
          <span className="vm-nav-count">{counts.Notes}</span>
        </div>
      </div>

      <div className="vm-divider"></div>

      <div className="vm-sidebar-section">
        <div className="vm-sidebar-label">Account</div>
        <div className="vm-nav-item">
          <i className="ti ti-settings" aria-hidden="true"></i>
          Settings
        </div>
        <div className="vm-nav-item text-red-600 hover:bg-red-50">
          <i className="ti ti-logout" aria-hidden="true"></i>
          Logout
        </div>
      </div>
    </div>
  );
}