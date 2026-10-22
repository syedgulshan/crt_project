import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorScheme?: 'indigo' | 'red' | 'orange' | 'amber' | 'cyan' | 'emerald';
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  colorScheme = 'indigo',
  subtitle,
  onClick
}) => {
  const getTheme = () => {
    switch (colorScheme) {
      case 'red':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.25)',
          iconColor: '#f87171',
          accent: '#ef4444'
        };
      case 'orange':
        return {
          bg: 'rgba(249, 115, 22, 0.1)',
          border: 'rgba(249, 115, 22, 0.25)',
          iconColor: '#fb923c',
          accent: '#f97316'
        };
      case 'amber':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.25)',
          iconColor: '#fbbf24',
          accent: '#f59e0b'
        };
      case 'cyan':
        return {
          bg: 'rgba(6, 182, 212, 0.1)',
          border: 'rgba(6, 182, 212, 0.25)',
          iconColor: '#22d3ee',
          accent: '#06b6d4'
        };
      case 'emerald':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.25)',
          iconColor: '#34d399',
          accent: '#10b981'
        };
      default:
        return {
          bg: 'rgba(99, 102, 241, 0.1)',
          border: 'rgba(99, 102, 241, 0.25)',
          iconColor: '#818cf8',
          accent: '#6366f1'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      onClick={onClick}
      className={`glass-panel ${onClick ? 'glass-panel-hover' : ''}`}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${theme.accent}, transparent)`
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={18} color={theme.iconColor} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '6px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
