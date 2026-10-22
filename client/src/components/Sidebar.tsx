import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ListChecks, 
  GitCompare, 
  FileSpreadsheet, 
  Settings, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  conflictCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, conflictCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'requirements', label: 'Requirements', icon: ListChecks },
    { 
      id: 'analysis', 
      label: 'Conflict Analysis', 
      icon: GitCompare,
      badge: conflictCount > 0 ? conflictCount : undefined 
    },
    { id: 'reports', label: 'Conflict Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <ShieldAlert size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' }}>
            ReqAnalyzer
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '500' }}>
            Semantic Conflict Engine
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '0 8px 10px 8px', letterSpacing: '0.8px' }}>
          Menu
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
            >
              <Icon size={18} style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* AI Semantic Engine Status Badge */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={14} color="#818cf8" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#c7d2fe' }}>AI Semantic Logic</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Cross-document contradiction, overlap & duplicate detector active.
          </p>
        </div>
      </div>
    </aside>
  );
};
