import { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Sidebar, { type VaultCategory } from './components/Sidebar';
import VaultList, { type VaultItem } from './components/VaultList';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<VaultCategory>('Work');

  const vaultCounts = {
    Personal: 3,
    Work: 2,
    Notes: 1
  };

  // Static items mapping for structural testing
  const mockItems: VaultItem[] = [
    { id: '1', title: 'GitHub SSH Key', type: 'code', excerpt: 'ssh-ed25519 AAAA...', updatedAt: '2m ago' },
    { id: '2', title: 'Jira Workspace', type: 'password', excerpt: '••••••••••••', updatedAt: '1h ago' }
  ];

  return (
   // Inside App.tsx return (...)
<DashboardLayout>
  <Sidebar 
    activeCategory={activeCategory} 
    onCategoryChange={setActiveCategory}
    counts={vaultCounts}
  />
  
  <div className="vm-main">
    {/* Page Header */}
    <div className="vm-main-header">
      <div>
        <div className="vm-page-title">{activeCategory} vault</div>
        <div className="vm-page-sub">8 items · Last updated 2 hours ago</div>
      </div>
      <button className="vm-btn-primary">
        <i className="ti ti-plus" aria-hidden="true"></i>
        New vault
      </button>
    </div>

    {/* Stats Row */}
    <div className="vm-stats-row">
      <div className="vm-stat-card">
        <div className="vm-stat-label">Passwords</div>
        <div className="vm-stat-value">4</div>
        <div className="vm-stat-sub">+1 this week</div>
      </div>
      <div className="vm-stat-card">
        <div className="vm-stat-label">Code snippets</div>
        <div className="vm-stat-value">2</div>
        <div className="vm-stat-sub">+2 this week</div>
      </div>
      <div className="vm-stat-card">
        <div className="vm-stat-label">Commands</div>
        <div className="vm-stat-value">2</div>
        <div className="vm-stat-sub">unchanged</div>
      </div>
    </div>

    {/* Tabs */}
    <div className="vm-tabs">
      <div className="vm-tab">All</div>
      <div className="vm-tab active">Passwords</div>
      <div className="vm-tab">Code</div>
      <div className="vm-tab">Commands</div>
      <div className="vm-tab">Notes</div>
    </div>

    {/* Main Content Area */}
    <div className="vm-content">
      <VaultList items={mockItems} />
      <ChatPanel />
    </div>
  </div>
</DashboardLayout>
  );
}