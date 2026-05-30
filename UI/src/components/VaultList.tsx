
export interface VaultItem {
  id: string;
  title: string;
  type: 'password' | 'code' | 'command' | 'note';
  excerpt: string;
  updatedAt: string;
}

interface VaultListProps {
  items: VaultItem[];
}

export default function VaultList({ items }: VaultListProps) {
  // Helper to map your item types to your specific CSS design classes
  const getIconClass = (type: string) => {
    switch(type) {
      case 'password': return { icon: 'ti-key', bg: 'icon-pw', badge: 'type-pw' };
      case 'code': return { icon: 'ti-code', bg: 'icon-code', badge: 'type-code' };
      case 'command': return { icon: 'ti-terminal', bg: 'icon-cmd', badge: 'type-cmd' };
      default: return { icon: 'ti-notes', bg: 'icon-note', badge: 'type-note' };
    }
  };

  return (
    <div className="vm-vault-list">
      {items.map((item, index) => {
        const style = getIconClass(item.type);
        return (
          <div key={item.id} className={`vm-vault-card ${index === 0 ? 'selected' : ''}`}>
            <div className={`vm-vault-icon ${style.bg}`}>
              <i className={`ti ${style.icon}`} aria-hidden="true"></i>
            </div>
            
            <div className="vm-vault-info">
              <div className="vm-vault-label">{item.title}</div>
              <div className="vm-vault-meta">Updated {item.updatedAt}</div>
              <div>
                <span className="vm-tag">
                  <i className="ti ti-tag" style={{ fontSize: '9px' }} aria-hidden="true"></i>
                  {item.type === 'code' ? 'dev' : 'secure'}
                </span>
              </div>
            </div>
            
            <span className={`vm-vault-type ${style.badge}`}>{item.type}</span>
          </div>
        );
      })}
    </div>
  );
}