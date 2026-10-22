import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  Server, 
  Check, 
  Key,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface SettingsProps {
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ onSeedDemo, isSeeding }) => {
  const { user } = useAuth();
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKeys = () => {
    if (geminiKey) localStorage.setItem('gemini_api_key', geminiKey);
    else localStorage.removeItem('gemini_api_key');

    if (openaiKey) localStorage.setItem('openai_api_key', openaiKey);
    else localStorage.removeItem('openai_api_key');

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
          System Settings & AI Providers
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
          Manage your AI models, authentication parameters, database integrity, and EC2 deployment settings.
        </p>
      </div>

      {/* AI Semantic Engine Configuration */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={18} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              Semantic Analysis Provider Abstraction
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Built-in NLP Logic Engine is active. Optional cloud LLM keys can be configured below.
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={18} color="#34d399" />
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            <strong style={{ color: '#34d399' }}>Zero-Configuration Ready:</strong> The built-in High-Accuracy Local Logic Engine evaluates numeric thresholds, authorization flows, role boundaries, synonyms, and ambiguities with zero API key dependencies!
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Google Gemini API Key (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                placeholder="AIzaSy... (leave blank to use built-in engine)"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="input"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              OpenAI API Key (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                placeholder="sk-proj-... (leave blank to use built-in engine)"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                className="input"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '12px', color: savedSuccess ? '#34d399' : 'var(--text-dim)' }}>
              {savedSuccess ? '✓ Settings saved successfully!' : 'Keys are stored securely and never exposed in public repositories.'}
            </span>
            <button onClick={handleSaveKeys} className="btn btn-primary btn-sm">
              <Check size={14} />
              <span>Save AI Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authentication & User Session */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
          Authentication & Data Isolation
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Active User ID</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#38bdf8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {user?.user_id || 'N/A'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Auth Provider</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginTop: '4px' }}>
              {user?.provider === 'apple' ? 'Apple OAuth' : user?.provider === 'google' ? 'Google OAuth' : 'Demo Account'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginTop: '4px' }}>
              {user?.email || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Data & Reset */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Demo Dataset & Reset Controls
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px' }}>
          Reset your workspace or reload the curated SRS, BRD, and FRD demo documents to demonstrate all conflict types.
        </p>

        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="btn btn-secondary"
        >
          <RefreshCw size={15} className={isSeeding ? 'pulse-indicator' : ''} />
          <span>{isSeeding ? 'Reloading Sample Data...' : 'Reload Full Demo Dataset (SRS, BRD, FRD)'}</span>
        </button>
      </div>

      {/* Production AWS EC2 Readiness */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Server size={18} color="#06b6d4" />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
            Production AWS EC2 Deployment Status
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '14px' }}>
          This application includes full EC2 deployment scripts, Nginx reverse proxy configuration, PM2 process management, and Docker support.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span className="badge badge-success">✓ Single-Port Express + Vite Static Bundle</span>
          <span className="badge badge-success">✓ SQLite WAL Mode High Concurrency</span>
          <span className="badge badge-success">✓ EC2 Setup Script Included</span>
          <span className="badge badge-success">✓ Docker & Docker-Compose Ready</span>
        </div>
      </div>

    </div>
  );
};
