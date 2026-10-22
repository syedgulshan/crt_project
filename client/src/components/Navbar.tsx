import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Upload, Play, Database, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onOpenUpload: () => void;
  onRunAnalysis: () => void;
  onSeedDemo: () => void;
  isAnalyzing: boolean;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenUpload,
  onRunAnalysis,
  onSeedDemo,
  isAnalyzing,
  isSeeding
}) => {
  const { user, signOut } = useAuth();

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Executive Analysis Dashboard';
      case 'documents': return 'Document Management Library';
      case 'requirements': return 'Extracted Requirements Repository';
      case 'analysis': return 'Semantic Conflict & Overlap Workbench';
      case 'reports': return 'Detailed Audit Reports & Traceability';
      case 'settings': return 'System Settings & AI Providers';
      default: return 'Requirement Conflict & Overlap Analyzer';
    }
  };

  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(17, 24, 39, 0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 15
    }}>
      {/* Title & Context */}
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>
          {getTabTitle(currentTab)}
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Requirement Analyzer</span>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{currentTab}</span>
        </div>
      </div>

      {/* Action Buttons & User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Seed Demo Button */}
        <button
          onClick={onSeedDemo}
          disabled={isSeeding || isAnalyzing}
          className="btn btn-secondary btn-sm"
          title="Load sample SRS, BRD, and FRD documents with pre-configured conflicts"
          style={{ border: '1px solid rgba(168, 85, 247, 0.3)' }}
        >
          <Database size={14} color="#c084fc" />
          <span>{isSeeding ? 'Loading Demo...' : 'Load Sample Data'}</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          disabled={isAnalyzing}
          className="btn btn-secondary btn-sm"
        >
          <Upload size={14} color="#38bdf8" />
          <span>Upload Document</span>
        </button>

        {/* Run Analysis Button */}
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="btn btn-primary btn-sm"
        >
          <Play size={14} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* User Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 10px 4px 6px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '12px',
            color: '#fff'
          }}>
            {user?.display_name?.charAt(0).toUpperCase() || <UserIcon size={14} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', lineHeight: '1.2' }}>
              {user?.display_name || 'Enterprise User'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: '1' }}>
              {user?.provider === 'apple' ? 'Apple ID' : user?.provider === 'google' ? 'Google Auth' : 'Demo Account'}
            </span>
          </div>

          <button
            onClick={() => signOut()}
            title="Sign Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
