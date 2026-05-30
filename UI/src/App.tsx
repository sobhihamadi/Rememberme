
import { useState, useCallback } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Sidebar, { type VaultCategory } from './components/Sidebar';
import VaultList from './components/VaultList';
import ChatPanel from './components/ChatPanel';
import { useVault } from './hooks/Usevault';
import { useAuth } from './hooks/Useauth';
import { VaultCategory as VaultCategoryEnum, VaultItemType } from './types/Types.vault';

const CATEGORY_MAP: Record<VaultCategory, VaultCategoryEnum> = {
  Personal: VaultCategoryEnum.PERSONAL,
  Work:     VaultCategoryEnum.WORK,
  Notes:    VaultCategoryEnum.NOTES,
};

const TAB_TYPES: { label: string; type: VaultItemType }[] = [
  { label: 'Passwords', type: VaultItemType.PASSWORD },
  { label: 'Code',      type: VaultItemType.CODE },
  { label: 'Commands',  type: VaultItemType.COMMAND },
  { label: 'Notes',     type: VaultItemType.NOTE },
];

// ── Login / Register screen ────────────────────────────────────────────────
function LoginScreen({
  onLogin,
  onRegister,
  authError,
  authLoading,
}: {
  onLogin:     (email: string, password: string) => Promise<void>;
  onRegister:  (name: string, email: string, password: string) => Promise<void>;
  authError:   string | null;
  authLoading: boolean;
}) {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [localErr, setLocalErr] = useState('');

  const error = authError || localErr;

  const submit = async () => {
    setLocalErr('');
    if (!email || !password) { setLocalErr('Email and password are required'); return; }
    if (mode === 'register' && !name) { setLocalErr('Name is required'); return; }

    if (mode === 'login') {
      await onLogin(email, password);
    } else {
      await onRegister(name, email, password);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '0.5px solid #E8E4DC', background: '#F7F5F0',
    fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F5F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '14px', border: '0.5px solid #E8E4DC',
        padding: '40px', width: '360px',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div className="vm-logo" style={{ marginBottom: '4px' }}>
          <div className="vm-logo-mark">
            <i className="ti ti-lock" style={{ fontSize: '14px', color: '#fff' }} />
          </div>
          <span className="vm-logo-name">Vault<span>Mind</span></span>
        </div>

        <div style={{ fontSize: '13px', color: '#999' }}>
          {mode === 'login' ? 'Sign in to your vault' : 'Create a new account'}
        </div>

        {mode === 'register' && (
          <input style={inp} placeholder="Full name" value={name}
            onChange={e => setName(e.target.value)} />
        )}
        <input style={inp} placeholder="Email" type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <input style={inp} placeholder="Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />

        {error && (
          <div style={{
            fontSize: '12px', color: '#c33', background: '#fff0f0',
            padding: '8px 10px', borderRadius: '6px', border: '0.5px solid #f5c6cb',
          }}>
            {error}
          </div>
        )}

        <button
          className="vm-btn-primary"
          style={{ width: '100%', justifyContent: 'center', opacity: authLoading ? 0.6 : 1 }}
          onClick={submit}
          disabled={authLoading}
        >
          {authLoading
            ? 'Please wait…'
            : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
          {mode === 'login' ? (
            <>No account?{' '}
              <span style={{ color: '#1B4D6E', cursor: 'pointer' }}
                onClick={() => { setMode('register'); setLocalErr(''); }}>
                Register
              </span>
            </>
          ) : (
            <>Already have one?{' '}
              <span style={{ color: '#1B4D6E', cursor: 'pointer' }}
                onClick={() => { setMode('login'); setLocalErr(''); }}>
                Sign in
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ userId, onLogout }: {
  userId:   string;
  onLogout: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<VaultCategory>('Work');
  const [activeType, setActiveType]         = useState<VaultItemType>(VaultItemType.PASSWORD);
  const [activeTab, setActiveTab]           = useState('Passwords');

  const backendCategory = CATEGORY_MAP[activeCategory];

  const { items, loading, error, fetchItems } = useVault(userId, backendCategory, activeType);

  const handleAiReply = useCallback(() => {
    fetchItems(userId, backendCategory, activeType);
  }, [fetchItems, userId, backendCategory, activeType]);

  const passwordCount = items.filter(i => i.type === VaultItemType.PASSWORD).length;
  const codeCount     = items.filter(i => i.type === VaultItemType.CODE).length;
  const commandCount  = items.filter(i => i.type === VaultItemType.COMMAND).length;

  const vaultCounts: Record<VaultCategory, number> = {
    Personal: 0, Work: 0, Notes: 0,
    [activeCategory]: items.length,
  };

  const listItems = items.map(item => ({
    id:        item.id,
    title:     item.label,
    type:      item.type.toLowerCase() as 'password' | 'code' | 'command' | 'note',
    excerpt:   item.content ? item.content.slice(0, 32) + (item.content.length > 32 ? '…' : '') : '—',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—',
  }));

  return (
    <DashboardLayout onLogout={onLogout}>
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={vaultCounts}
      />

      <div className="vm-main">
        <div className="vm-main-header">
          <div>
            <div className="vm-page-title">{activeCategory} vault</div>
            <div className="vm-page-sub">
              {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
              {error && <span style={{ color: '#e55', marginLeft: '4px' }}>· {error}</span>}
            </div>
          </div>
          <button className="vm-btn-primary">
            <i className="ti ti-plus" aria-hidden="true" />
            New vault
          </button>
        </div>

        <div className="vm-stats-row">
          <div className="vm-stat-card">
            <div className="vm-stat-label">Passwords</div>
            <div className="vm-stat-value">{loading ? '—' : passwordCount}</div>
            <div className="vm-stat-sub">in this vault</div>
          </div>
          <div className="vm-stat-card">
            <div className="vm-stat-label">Code snippets</div>
            <div className="vm-stat-value">{loading ? '—' : codeCount}</div>
            <div className="vm-stat-sub">in this vault</div>
          </div>
          <div className="vm-stat-card">
            <div className="vm-stat-label">Commands</div>
            <div className="vm-stat-value">{loading ? '—' : commandCount}</div>
            <div className="vm-stat-sub">in this vault</div>
          </div>
        </div>

        <div className="vm-tabs">
          {TAB_TYPES.map(({ label, type }) => (
            <div key={label}
              className={`vm-tab ${activeTab === label ? 'active' : ''}`}
              onClick={() => { setActiveTab(label); setActiveType(type); }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="vm-content">
          {loading ? (
            <div style={{ padding: '40px 24px', color: '#aaa', fontSize: '13px' }}>
              Loading vault items…
            </div>
          ) : listItems.length === 0 ? (
            <div style={{ padding: '40px 24px', color: '#bbb', fontSize: '13px' }}>
              No items yet — ask the AI to save something!
            </div>
          ) : (
            <VaultList items={listItems} />
          )}

          <ChatPanel
            userId={userId}
            category={backendCategory}
            type={activeType}
            onAiReply={handleAiReply}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const { user, login, logout, register, loading, error, clearError } = useAuth();

  if (!user) {
    return (
      <LoginScreen
        authError={error}
        authLoading={loading}
        onLogin={async (email, password) => {
          clearError();
          await login({ email, password });
        }}
        onRegister={async (name, email, password) => {
          clearError();
          // Register → then auto-login to get the cookie + resolve userId
          await register({ name, email, password });
          await login({ email, password });
        }}
      />
    );
  }

  return (
    <Dashboard
      userId={user.id}
      onLogout={logout}
    />
  );
}