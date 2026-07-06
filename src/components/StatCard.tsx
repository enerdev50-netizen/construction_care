import React from 'react';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  variant?: 'default' | 'accent' | 'success' | 'info' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  description,
  variant = 'default',
}) => {
  return (
    <div className={`stat-card glass-panel animate-fade-in ${variant}`}>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {description && <span className="stat-desc">{description}</span>}
      </div>
      <div className="stat-icon-wrapper">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
