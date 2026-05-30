export type VaultCategory = 'Personal' | 'Work' | 'Notes';

interface SidebarProps {
  activeCategory: VaultCategory;
  onCategoryChange: (category: VaultCategory) => void;
  counts: Record<VaultCategory, number>;
  sidebarOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  counts,
  sidebarOpen = false,
  onClose,
}: SidebarProps) {
  const handleCategoryChange = (cat: VaultCategory) => {
    onCategoryChange(cat);
    onClose?.();
  };

  return (
    <div className={`vm-sidebar ${sidebarOpen ? 'vm-sidebar--open' : ''}`}>
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
          onClick={() => handleCategoryChange('Personal')}
        >
          <i className="ti ti-user" aria-hidden="true"></i>
          Personal
          <span className="vm-nav-count">{counts.Personal}</span>
        </div>

        <div
          className={`vm-nav-item ${activeCategory === 'Work' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('Work')}
        >
          <i className="ti ti-briefcase" aria-hidden="true"></i>
          Work
          <span className="vm-nav-count">{counts.Work}</span>
        </div>

        <div
          className={`vm-nav-item ${activeCategory === 'Notes' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('Notes')}
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
        <div className="vm-nav-item">
          <i className="ti ti-logout" aria-hidden="true"></i>
          Logout
        </div>
      </div>
    </div>
  );
}