import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldCheck, Search, Settings } from 'lucide-react';
import api from '../api';
import './Header.css';

interface HeaderProps {
  title?: string;
  onSearchChange?: (val: string) => void;
}

interface AlertMaterial {
  id: string;
  name: string;
  stock: number;
  minStockAlert: number;
  unit: string;
}

const Header: React.FC<HeaderProps> = ({ title, onSearchChange }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [alerts, setAlerts] = useState<AlertMaterial[]>([]);
  const userStr = localStorage.getItem('construction_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const companyStr = localStorage.getItem('construction_company');
  const company = companyStr ? JSON.parse(companyStr) : null;

  useEffect(() => {
    if (user && user.role === 'COMPANY_ADMIN') {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/materials/alerts');
      setAlerts(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des alertes de stock', err);
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'COMPANY_ADMIN': return 'DIRECTEUR TECHNIQUE';
      case 'TEAM_LEADER': return 'CHEF DE CHANTIER';
      case 'WORKER': return 'OPÉRATEUR TERRAIN';
      case 'CLIENT': return 'CLIENT MAÎTRE D\'OUVRAGE';
      default: return role.toUpperCase();
    }
  };

  const avatarInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';

  return (
    <header className="header">
      {/* Search Input on the Left */}
      <div className="header-search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher un chantier..."
          className="header-search-input"
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      {/* Actions and User Profile on the Right */}
      <div className="header-actions">
        {user && user.role === 'COMPANY_ADMIN' && (
          <div style={{ position: 'relative' }}>
            <button className="alert-bell-btn" onClick={() => setShowNotif(!showNotif)}>
              <Bell size={20} />
              {alerts.length > 0 && <div className="header-alert-count">{alerts.length}</div>}
            </button>

            {showNotif && (
              <div className="notif-dropdown-menu glass-panel">
                <div className="notif-dropdown-header">Alertes de Stock</div>
                <div className="notif-dropdown-list">
                  {alerts.length > 0 ? (
                    alerts.map((mat) => (
                      <div key={mat.id} className="notif-dropdown-item">
                        <AlertTriangle size={16} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />
                        <div>
                          <strong>{mat.name}</strong> en rupture !<br />
                          Stock: {mat.stock} {mat.unit} (Seuil: {mat.minStockAlert})
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notif-dropdown-empty">Aucune alerte de rupture</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button className="header-icon-btn">
          <Settings size={20} />
        </button>

        <div className="header-divider" />

        {user && (
          <div className="header-profile-badge">
            <div className="profile-details">
              <span className="profile-name">{fullName}</span>
              <span className="profile-role">{getRoleTitle(user.role)}</span>
            </div>
            <div className="profile-avatar-container">
              {/* Fallback to custom stylized initial block resembling a premium user profile */}
              <div className="profile-avatar">{avatarInitials}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
