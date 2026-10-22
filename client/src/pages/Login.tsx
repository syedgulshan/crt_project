import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ShieldAlert, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginGoogle, loginApple, loginDemo, isLoading, error } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), transparent 60%), #0b0f19',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)'
          }}>
            <ShieldAlert size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
            ReqAnalyzer
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            AI-Powered Requirement Conflict & Overlap Analyzer
          </p>
        </div>

        {/* Login Glass Panel */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              Authenticate to Continue
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Sign in with your corporate identity or try instant demo access
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              color: '#f87171',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Google Login */}
            <button
              onClick={() => loginGoogle()}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{
                padding: '12px',
                width: '100%',
                fontSize: '14px',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Apple Login */}
            <button
              onClick={() => loginApple()}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{
                padding: '12px',
                width: '100%',
                fontSize: '14px',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2 .6-2.64 1.36-.56.65-1.05 1.72-.92 2.76 1.01.08 2.03-.5 2.64-1.25z"/>
              </svg>
              <span>Continue with Apple</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                Instant Evaluation
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Instant Demo Sign-In Buttons */}
            <button
              onClick={() => loginDemo('google')}
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                padding: '12px',
                width: '100%',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              <Sparkles size={16} />
              <span>1-Click Demo Access (Google Analyst)</span>
            </button>

            <button
              onClick={() => loginDemo('apple')}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{
                padding: '10px',
                width: '100%',
                fontSize: '13px',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <span>1-Click Demo Access (Apple Analyst)</span>
            </button>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Full semantic understanding, not keyword matching</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Strict user data isolation with SQLite WAL backend</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Export reports to Markdown, CSV, and printable PDF</span>
            </div>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Lock size={12} />
          <span>Protected by Firebase Auth & Server-Side Session Verification</span>
        </div>
      </div>
    </div>
  );
};
