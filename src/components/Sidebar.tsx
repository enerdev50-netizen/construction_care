import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  Hammer,
  FileText,
  Users,
  LogOut,
  Camera,
  Layers,
  Settings,
  Wallet,
  BarChart2,
  Building2,
} from 'lucide-react';
import api from '../api';
import './Sidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  company?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, company: propCompany }) => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('construction_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const companyStr = localStorage.getItem('construction_company');
  const localCompany = companyStr ? JSON.parse(companyStr) : null;
  const company = propCompany || localCompany;

  const handleLogout = async () => {
    // Invalide le refresh token côté serveur (cookie httpOnly)
    try {
      await api.post('/auth/logout');
    } catch {
      // on déconnecte localement même si l'appel échoue
    }
    localStorage.removeItem('construction_token');
    localStorage.removeItem('construction_user');
    localStorage.removeItem('construction_company');
    navigate('/login');
  };

  if (!user) return null;

  const getMenuItems = () => {
    const configStr = localStorage.getItem('construction_plan_config');
    const planConfig = configStr ? JSON.parse(configStr) : null;
    
    let items: any[] = [];
    switch (user.role) {
      case 'SUPER_ADMIN':
        items = [
          { id: 'superadmin-dashboard', label: 'Tableau de Bord', icon: <BarChart2 size={18} /> },
          { id: 'superadmin-companies', label: 'Entreprises', icon: <Building2 size={18} /> },
          { id: 'superadmin-plans', label: 'Gestion des Plans', icon: <Settings size={18} /> },
        ];
        break;
      case 'COMPANY_ADMIN': {
        items = [
          { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
          { id: 'projects', label: 'Mes Chantiers', icon: <Briefcase size={18} /> },
        ];
        
        const hasMaterials = !planConfig || planConfig.features?.includes('MATERIAUX');
        const hasDocuments = !planConfig || planConfig.features?.includes('DOCUMENTS');
        
        if (hasDocuments) {
          items.push({ id: 'payments', label: 'Paiements reçus', icon: <Wallet size={18} /> });
        }
        
        items.push({ id: 'expenses', label: 'Dépenses', icon: <DollarSign size={18} /> });
        
        if (hasMaterials) {
          items.push({ id: 'materials', label: 'Matériaux & Stock', icon: <Hammer size={18} /> });
        }
        
        if (hasDocuments) {
          items.push({ id: 'admin-devis', label: 'Devis', icon: <FileText size={18} /> });
          items.push({ id: 'admin-factures', label: 'Factures', icon: <Wallet size={18} /> });
        }
        
        items.push({ id: 'users', label: 'Mon Équipe / Clients', icon: <Users size={18} /> });
        items.push({ id: 'subscription', label: 'Abonnement', icon: <Settings size={18} /> });
        break;
      }
      case 'TEAM_LEADER': {
        // Note : le Chef de chantier gère les matériaux depuis le détail de CHAQUE
        // chantier assigné (onglet "Approvisionnement Stock", scopé par projectId) —
        // pas de vue "Matériaux & Stock" globale ici, qui listerait tous les chantiers
        // de l'entreprise sans filtrage par affectation.
        items = [
          { id: 'projects', label: 'Chantiers Assignés', icon: <Briefcase size={18} /> },
          { id: 'progress', label: 'Photos de Suivi', icon: <Camera size={18} /> },
        ];
        const hasDocuments = !planConfig || planConfig.features?.includes('DOCUMENTS');
        if (hasDocuments) {
          items.push({ id: 'payments', label: 'Paiements reçus', icon: <Wallet size={18} /> });
        }
        items.push({ id: 'expenses', label: 'Dépenses', icon: <DollarSign size={18} /> });
        break;
      }
      case 'WORKER':
        items = [
          { id: 'projects', label: 'Chantiers Assignés', icon: <Briefcase size={18} /> },
          { id: 'progress', label: 'Photos de Suivi', icon: <Camera size={18} /> },
        ];
        break;
      case 'CLIENT': {
        items = [
          { id: 'projects', label: 'Mes Projets', icon: <Briefcase size={18} /> }
        ];
        const hasDocuments = !planConfig || planConfig.features?.includes('DOCUMENTS');
        if (hasDocuments) {
          items.push({ id: 'client-devis', label: 'Mes Devis', icon: <FileText size={18} /> });
          items.push({ id: 'client-factures', label: 'Mes Factures', icon: <Wallet size={18} /> });
        }
        break;
      }
      default:
        items = [];
    }

    // Tous les rôles ont accès à l'onglet "Mon Profil"
    items.push({ id: 'profile', label: 'Mon Profil', icon: <Settings size={18} /> });
    return items;
  };

  const menuItems = getMenuItems();
  const avatarInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'COMPANY_ADMIN': return 'Gérant';
      case 'TEAM_LEADER': return 'Chef d\'équipe';
      case 'WORKER': return 'Ouvrier';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" style={{ overflow: 'hidden', backgroundColor: company?.logoUrl ? '#fff' : 'var(--accent-soft)' }}>
          {company && company.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Layers size={22} strokeWidth={2.5} />
          )}
        </div>
        <div className="logo-text">
          <h2>ConstructCare</h2>
          <span>{company ? company.name : 'Bâtiment'}</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{avatarInitials || <Users size={16} />}</div>
          <div className="user-details">
            <span className="user-name">{`${user.firstName} ${user.lastName}`}</span>
            <span className="user-role">{getRoleLabel(user.role)}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
