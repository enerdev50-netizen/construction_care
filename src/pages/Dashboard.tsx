import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  DollarSign,
  Hammer,
  FileText,
  Users,
  Plus,
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  X,
  Sliders,
  Download,
  CheckCircle2,
  Wrench,
  Wallet,
  Info,
  Search,
  Building2,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import DataTable from '../components/DataTable';
import MapWidget from '../components/MapWidget';
import { DatePicker } from '../components/DatePicker';
import SignaturePad from '../components/SignaturePad';

// Sous-pages importées dynamiquement par changement d'état
import ProjectDetail from './ProjectDetail';
import ClientPortal from './ClientPortal';
import WorkerPortal from './WorkerPortal';

import './Dashboard.css';

// Standalone Devis Composition helper function
const renderDevisComposition = (
  devis: any,
  options?: {
    onAddFacture?: (devisId: string, projectId: string) => void;
  }
) => {
  const assocFactures = devis.factures || [];

  const devisAmount = devis.amount || 0;
  const totalPaid = assocFactures.reduce((s: number, f: any) => s + (f.paidAmount || 0), 0);
  const resteAPayer = Math.max(0, devisAmount - totalPaid);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--steel-border)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', marginTop: '16px' }}>
      {/* Résumé Financier du Devis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--steel-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Montant du devis</span>
          <span style={{ fontSize: '16px', fontWeight: '850', color: 'var(--primary)' }}>{devisAmount.toLocaleString()} FCFA</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--steel-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Total payé</span>
          <span style={{ fontSize: '16px', fontWeight: '850', color: 'var(--status-success)' }}>{totalPaid.toLocaleString()} FCFA</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--steel-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Reste à payer</span>
          <span style={{ fontSize: '16px', fontWeight: '850', color: resteAPayer > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
            {resteAPayer.toLocaleString()} FCFA
          </span>
        </div>
      </div>

      {/* Factures liées */}
      <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '8px', padding: '12px', border: '1px solid var(--steel-border)' }}>
        <h5 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--steel-border)', paddingBottom: '6px' }}>
          <span>📄 Factures liées ({assocFactures.length})</span>
          {options?.onAddFacture && (
            <button
              className="btn btn-secondary"
              style={{ padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
              onClick={() => options.onAddFacture!(devis.id, devis.projectId)}
            >
              + Ajouter
            </button>
          )}
        </h5>
        {assocFactures.length === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune facture associée.</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0 }}>
            {assocFactures.map((f: any) => (
              <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                <div>
                  <strong style={{ display: 'block' }}>{f.title}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ display: 'block' }}>{f.amount.toLocaleString()} F</strong>
                  {f.status === 'PAYE_PARTIEL' && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Payé : {f.paidAmount?.toLocaleString() || 0}
                    </div>
                  )}
                  <span className={`badge badge-${f.status === 'PAYE' ? 'success' : f.status === 'PAYE_PARTIEL' ? 'warning' : f.status === 'PAYE_CLIENT' ? 'warning' : 'danger'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                    {f.status === 'PAYE' ? 'Payée' : f.status === 'PAYE_PARTIEL' ? 'Payée partiel' : f.status === 'PAYE_CLIENT' ? 'Déclarée' : 'Non réglée'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

interface ClientDevisTabProps {
  onSelectDevis: (devisId: string) => void;
}

// ─── Composant : Mes Devis (CLIENT) ─────────────────────────────────────────
const ClientDevisTab: React.FC<ClientDevisTabProps> = ({ onSelectDevis }) => {
  const [devis, setDevis] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [signingDocId, setSigningDocId] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.get('/documents/client-docs')
      .then((r) => { setDevis(r.data.filter((d: any) => d.type === 'DEVIS')); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSign = async (docId: string, signatureBase64: string) => {
    try {
      await api.post(`/documents/${docId}/sign`, { clientSignature: signatureBase64 });
      setDevis((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'SIGNE', clientSignature: signatureBase64 } : d));
      setSigningDocId(null);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: '800' }}>Mes Devis</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Consultez, signez électroniquement et déclarez le règlement des devis émis par votre entreprise de construction.
          </p>
        </div>
        <span className="badge badge-info">{devis.length} devis</span>
      </div>

      {devis.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--steel-border)' }}>
          <FileText size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: '600', fontSize: '15px' }}>Aucun devis disponible</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>Vos devis apparaîtront ici dès que le gérant en aura créé.</p>
        </div>
      ) : (
        devis.map((doc) => {
          const isSigned = doc.status === 'SIGNE';
          const isPaid = doc.status === 'PAYE';
          const isDeclared = doc.status === 'PAYE_CLIENT';
          const devisAmount = doc.amount || 0;
          return (
            <div key={doc.id} className="glass-panel" style={{ padding: '24px', borderLeft: `4px solid ${isPaid ? 'var(--status-success)' : isDeclared ? 'var(--status-pending)' : isSigned ? 'var(--primary)' : 'var(--accent)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '16px' }}>{doc.title}</span>
                    <span className={`badge badge-${isPaid ? 'success' : isDeclared ? 'pending' : isSigned ? 'success' : 'pending'}`}>
                      {isPaid ? '✓ Payé & Validé' : isDeclared ? '⏳ Paiement Déclaré' : isSigned ? '✓ Signé' : '⏳ En attente de signature'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Chantier : <strong>{doc.project?.name}</strong> · Émis le {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span style={{ fontWeight: '900', fontSize: '22px', color: 'var(--primary)' }}>
                  {devisAmount.toLocaleString()} FCFA
                </span>
              </div>

              {doc.clientSignature && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--steel-border)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Votre signature :</span>
                  <img src={doc.clientSignature} alt="Signature" style={{ height: '56px', objectFit: 'contain' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {doc.pdfUrl && (
                  <a href={doc.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={14} /> Télécharger PDF
                  </a>
                )}
                {!isSigned && doc.status === 'EN_ATTENTE' && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '13px' }}
                    onClick={() => setSigningDocId(doc.id)}
                  >
                    ✍️ Signer ce Devis
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                  onClick={() => onSelectDevis(doc.id)}
                >
                  🔍 Composition Devis
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Pad de signature interactif */}
      {signingDocId && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <span className="modal-title">✍️ Signer le Devis</span>
              <button className="modal-close-btn" onClick={() => setSigningDocId(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Veuillez dessiner votre signature ci-dessous (souris ou doigt sur tactile) puis valider.
            </p>
            <SignaturePad
              onSave={(signatureBase64) => handleSign(signingDocId, signatureBase64)}
              onCancel={() => setSigningDocId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  // Données du tableau de bord
  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Navigation interne vers un projet spécifique
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // Navigation interne vers un devis spécifique
  const [selectedDevisId, setSelectedDevisId] = useState<string | null>(null);

  // Barre de recherche
  const [searchQuery, setSearchQuery] = useState('');

  // Fermer la vue détails quand on change d'onglet
  useEffect(() => {
    setSelectedProjectId(null);
    setSelectedDevisId(null);
    loadDashboardData(true); // Rafraîchir les données en tâche de fond pour avoir des statistiques à jour
  }, [activeTab]);

  // États des Modals
  const [showProjModal, setShowProjModal] = useState(false);
  const [showEditProjModal, setShowEditProjModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [projBudget, setProjBudget] = useState('');
  const [projStatus, setProjStatus] = useState('EN_COURS');
  const [showMatModal, setShowMatModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // États pour le modal de détails des règlements (Recettes)
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any | null>(null);
  const [manualPayAmount, setManualPayAmount] = useState('');
  const [manualPayType, setManualPayType] = useState('ACHATS');
  const [detailError, setDetailError] = useState('');
  const [detailSuccess, setDetailSuccess] = useState('');

  // Formulaires
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projAddr, setProjAddr] = useState('');
  const [projLat, setProjLat] = useState('');
  const [projLng, setProjLng] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');
  const [projClientIds, setProjClientIds] = useState<string[]>([]);

  const [payProjId, setPayProjId] = useState('');
  const [payTitle, setPayTitle] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('ACHATS');

  const [matName, setMatName] = useState('');
  const [matMin, setMatMin] = useState('5');
  const [matUnit, setMatUnit] = useState('sacs');
  const [matStock, setMatStock] = useState('0');

  const [movMatId, setMovMatId] = useState('');
  const [movProjId, setMovProjId] = useState('');
  const [movType, setMovType] = useState('SORTIE');
  const [movQty, setMovQty] = useState('');
  const [movReason, setMovReason] = useState('');

  const [usrFirstName, setUsrFirstName] = useState('');
  const [usrLastName, setUsrLastName] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPhone, setUsrPhone] = useState('');
  const [usrRole, setUsrRole] = useState('WORKER');
  const [usrPassword, setUsrPassword] = useState('password123');
  const [editStep, setEditStep] = useState<1 | 2>(1);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const [docProjId, setDocProjId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('DEVIS');
  const [docAmount, setDocAmount] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [docFileBase64, setDocFileBase64] = useState('');
  const [docDevisId, setDocDevisId] = useState('');
  const [expandedDevisId, setExpandedDevisId] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [superadminPlans, setSuperadminPlans] = useState<any[]>([]);
  const [superadminStats, setSuperadminStats] = useState<any>(null);
  const [superadminCompanies, setSuperadminCompanies] = useState<any[]>([]);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [showSuperadminModal, setShowSuperadminModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planName, setPlanName] = useState('');
  const [planMaxProjects, setPlanMaxProjects] = useState('');
  const [planMaxUsers, setPlanMaxUsers] = useState('');
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [planPrice, setPlanPrice] = useState('');
  const [planDurationDays, setPlanDurationDays] = useState('30');

  // Nouveaux états pour les fonctionnalités demandées
  const [submitting, setSubmitting] = useState(false);
  const [createClientInline, setCreateClientInline] = useState(false);
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [payFactureId, setPayFactureId] = useState('');

  // États d'édition du profil d'entreprise
  const [compName, setCompName] = useState('');
  const [compNif, setCompNif] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compLogo, setCompLogo] = useState('');

  // États d'édition du profil de l'utilisateur
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setProfileFirstName(user.firstName || '');
      setProfileLastName(user.lastName || '');
      setProfilePhone(user.phone || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (company) {
      setCompName(company.name || '');
      setCompNif(company.nif || '');
      setCompEmail(company.email || '');
      setCompPhone(company.phone || '');
      setCompAddress(company.address || '');
      setCompLogo(company.logoUrl || '');
    }
  }, [company]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('Mise à jour en cours...');
    setSubmitting(true);

    try {
      const response = await api.put('/auth/company', {
        name: compName,
        nif: compNif,
        email: compEmail,
        phone: compPhone,
        address: compAddress,
        logoFile: compLogo.startsWith('data:') ? compLogo : undefined,
      });

      const updatedCompany = response.data.company;
      localStorage.setItem('construction_company', JSON.stringify(updatedCompany));
      setCompany(updatedCompany);
      setSuccessMsg('Profil de l\'entreprise mis à jour avec succès.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la mise à jour du profil.');
      setSuccessMsg('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('Mise à jour en cours...');

    if (profilePassword && profilePassword.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      setSuccessMsg('');
      return;
    }

    if (profilePassword !== profileConfirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      setSuccessMsg('');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        firstName: profileFirstName,
        lastName: profileLastName,
        phone: profilePhone,
        email: profileEmail,
      };

      if (profilePassword) {
        payload.password = profilePassword;
      }

      const res = await api.put('/auth/me', payload);
      
      const updatedUser = res.data.user;
      localStorage.setItem('construction_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccessMsg('Votre profil a été mis à jour avec succès.');
      setProfilePassword('');
      setProfileConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la mise à jour du profil.');
      setSuccessMsg('');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('construction_token');
    const userStr = localStorage.getItem('construction_user');
    const compStr = localStorage.getItem('construction_company');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const currUser = JSON.parse(userStr);
    setUser(currUser);
    if (compStr) {
      setCompany(JSON.parse(compStr));
    }

    // Si l'utilisateur n'est pas Admin, changer l'onglet actif par défaut
    if (currUser.role === 'SUPER_ADMIN') {
      setActiveTab('superadmin-dashboard');
    } else if (currUser.role !== 'COMPANY_ADMIN') {
      setActiveTab('projects');
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const userStr = localStorage.getItem('construction_user');
      const currUser = userStr ? JSON.parse(userStr) : null;

      if (currUser && currUser.role === 'SUPER_ADMIN') {
        const [plansRes, statsRes, companiesRes] = await Promise.all([
          api.get('/superadmin/plans'),
          api.get('/superadmin/stats'),
          api.get('/superadmin/companies'),
        ]);
        setSuperadminPlans(plansRes.data);
        setSuperadminStats(statsRes.data);
        setSuperadminCompanies(companiesRes.data);
      } else {
        // Charger les chantiers (accessible par tous les rôles selon scope)
        const projRes = await api.get('/projects');
        setProjects(projRes.data);
        if (projRes.data && projRes.data.length > 0 && projRes.data[0].company) {
          const latestCompany = projRes.data[0].company;
          localStorage.setItem('construction_company', JSON.stringify(latestCompany));
          setCompany(latestCompany);
        }

        // Le gérant et le chef d'équipe (TEAM_LEADER) ont accès aux données administratives/financières
        if (currUser && (currUser.role === 'COMPANY_ADMIN' || currUser.role === 'TEAM_LEADER')) {
          const [matRes, docRes, usersRes, plansRes] = await Promise.all([
            api.get('/materials'),
            api.get('/documents'),
            api.get('/users'),
            api.get('/auth/plans'),
          ]);

          setMaterials(matRes.data);
          setDocuments(docRes.data);
          setUsers(usersRes.data);
          setAvailablePlans(plansRes.data);
        } else if (currUser && currUser.role === 'CLIENT') {
          const docRes = await api.get('/documents');
          setDocuments(docRes.data || []);
        }
      }
    } catch (err) {
      console.error('Erreur de chargement des données', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Soumission Création Chantier (avec option création client inline et gestion du loader)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      let finalClientIds = projClientIds;

      if (createClientInline) {
        if (!clientFirstName || !clientLastName) {
          setErrorMsg('Le prénom et le nom du client sont obligatoires.');
          setSubmitting(false);
          return;
        }
        if (!clientEmail && !clientPhone) {
          setErrorMsg('L\'adresse email ou le numéro de téléphone du client est obligatoire.');
          setSubmitting(false);
          return;
        }

        // Créer d'abord le client avec un mot de passe par défaut
        const clientRes = await api.post('/users', {
          firstName: clientFirstName,
          lastName: clientLastName,
          email: clientEmail && clientEmail.trim() !== "" ? clientEmail.trim() : null,
          phone: clientPhone,
          role: 'CLIENT',
          password: '123456',
        });

        finalClientIds = [clientRes.data.id];
      }

      await api.post('/projects', {
        name: projName,
        description: projDesc,
        address: projAddr,
        latitude: projLat || null,
        longitude: projLng || null,
        startDate: projStart,
        endDate: projEnd,
        budget: projBudget || null,
        clientIds: finalClientIds,
      });

      setShowProjModal(false);
      // Réinitialiser les champs
      setProjName('');
      setProjDesc('');
      setProjAddr('');
      setProjLat('');
      setProjLng('');
      setProjStart('');
      setProjEnd('');
      setProjClientIds([]);
      setCreateClientInline(false);
      setClientFirstName('');
      setClientLastName('');
      setClientPhone('');
      setClientEmail('');

      // Recharger
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditProject = (proj: any) => {
    setEditingProject(proj);
    setProjName(proj.name);
    setProjDesc(proj.description || '');
    setProjAddr(proj.address || '');
    setProjLat(proj.latitude?.toString() || '');
    setProjLng(proj.longitude?.toString() || '');
    setProjStart(proj.startDate ? proj.startDate.substring(0, 10) : '');
    setProjEnd(proj.endDate ? proj.endDate.substring(0, 10) : '');
    setProjBudget(proj.budget?.toString() || '');
    setProjStatus(proj.status || 'EN_COURS');
    setProjClientIds([]);
    setEditStep(1);
    setSelectedFields([]);
    setErrorMsg('');
    setShowEditProjModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const payload: any = {};
      if (selectedFields.includes('name')) payload.name = projName;
      if (selectedFields.includes('description')) payload.description = projDesc;
      if (selectedFields.includes('address')) payload.address = projAddr;
      if (selectedFields.includes('latitude')) payload.latitude = projLat || null;
      if (selectedFields.includes('longitude')) payload.longitude = projLng || null;
      if (selectedFields.includes('startDate')) payload.startDate = projStart;
      if (selectedFields.includes('endDate')) payload.endDate = projEnd;
      if (selectedFields.includes('status')) payload.status = projStatus;
      if (selectedFields.includes('budget')) payload.budget = projBudget || null;

      await api.put(`/projects/${editingProject.id}`, payload);
      setShowEditProjModal(false);
      setEditingProject(null);
      setProjName('');
      setProjDesc('');
      setProjAddr('');
      setProjLat('');
      setProjLng('');
      setProjStart('');
      setProjEnd('');
      setProjBudget('');
      setProjStatus('EN_COURS');
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la modification.');
    } finally {
      setSubmitting(false);
    }
  };

  const openNewMaterialModal = () => {
    setEditingMaterial(null);
    setMatName('');
    setMatMin('5');
    setMatUnit('sacs');
    setMatStock('0');
    setErrorMsg('');
    setShowMatModal(true);
  };

  const openNewDocumentModal = () => {
    setEditingDocument(null);
    setDocProjId('');
    setDocTitle('');
    setDocType('DEVIS');
    setDocAmount('');
    setDocFileBase64('');
    setDocDevisId('');
    setErrorMsg('');
    setShowDocModal(true);
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUsrFirstName('');
    setUsrLastName('');
    setUsrEmail('');
    setUsrPhone('');
    setUsrRole('WORKER');
    setUsrPassword('password123');
    setErrorMsg('');
    setShowUserModal(true);
  };

  // Helpers Edition / Suppression
  const startEditMaterial = (mat: any) => {
    setEditingMaterial(mat);
    setMatName(mat.name);
    setMatMin(mat.minStockAlert.toString());
    setMatUnit(mat.unit);
    setMatStock(mat.stock.toString());
    setEditStep(1);
    setSelectedFields([]);
    setShowMatModal(true);
  };

  const deleteMaterial = async (id: string) => {
    if (window.confirm("Supprimer ce matériau de l'inventaire ?")) {
      try {
        await api.delete(`/materials/${id}`);
        loadDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setDocProjId(doc.projectId);
    setDocTitle(doc.title);
    setDocType(doc.type);
    setDocAmount(doc.amount.toString());
    setDocFileBase64('');
    setDocDevisId(doc.devisId || '');
    setEditStep(1);
    setSelectedFields([]);
    setShowDocModal(true);
  };

  const deleteDocument = async (id: string) => {
    if (window.confirm("Supprimer ce document (Devis/Facture) ?")) {
      try {
        await api.delete(`/documents/${id}`);
        loadDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startEditUser = (usr: any) => {
    setEditingUser(usr);
    setUsrFirstName(usr.firstName);
    setUsrLastName(usr.lastName);
    setUsrEmail(usr.email || '');
    setUsrPhone(usr.phone || '');
    setUsrRole(usr.role);
    setUsrPassword(''); // Ne pas forcer la saisie du mot de passe en édition
    setEditStep(1);
    setSelectedFields([]);
    setShowUserModal(true);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const deleteUser = async (id: string) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      try {
        await api.delete(`/users/${id}`);
        loadDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Soumission Règlement Client / Paiement reçu (avec option facture existante et gestion du loader)
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (payFactureId) {
        const actualId = payFactureId.replace(/^doc-/, '');
        // Enregistrer le paiement (partiel ou total) sur la facture existante
        await api.post(`/documents/${actualId}/record-payment`, {
          amount: parseFloat(payAmount),
          type: payType,
        });
      } else {
        // Créer un nouveau document facture au statut PAYE
        const docRes = await api.post('/documents', {
          projectId: payProjId,
          title: payTitle,
          type: 'FACTURE',
          amount: parseFloat(payAmount),
        });

        await api.put(`/documents/${docRes.data.id}/status`, {
          status: 'PAYE',
          type: payType,
        });
      }

      setShowPayModal(false);
      setPayProjId('');
      setPayTitle('');
      setPayAmount('');
      setPayType('ACHATS');
      setPayFactureId('');
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'enregistrement du paiement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Actions pour le modal de détails des règlements (Recettes)
  const handleValidateClientPayment = async () => {
    setDetailError('');
    setDetailSuccess('');
    try {
      const res = await api.put(`/documents/${selectedPaymentDetail.id}/status`, { status: 'PAYE' });
      setSelectedPaymentDetail(res.data.document);
      setDetailSuccess('Versement validé avec succès !');
      loadDashboardData(true);
    } catch (err: any) {
      setDetailError(err.response?.data?.error || err.message || 'Erreur lors de la validation du paiement.');
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailError('');
    setDetailSuccess('');
    const amt = parseFloat(manualPayAmount);
    const remaining = selectedPaymentDetail.amount - selectedPaymentDetail.paidAmount;

    if (isNaN(amt) || amt <= 0) {
      setDetailError('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }
    if (amt > remaining) {
      setDetailError(`Le versement ne peut pas dépasser le reste à payer (${remaining.toLocaleString()} FCFA).`);
      return;
    }

    try {
      const res = await api.post(`/documents/${selectedPaymentDetail.id}/record-payment`, { amount: amt, type: manualPayType });
      setSelectedPaymentDetail(res.data.document);
      setManualPayAmount('');
      setManualPayType('ACHATS');
      setDetailSuccess('Paiement manuel enregistré avec succès !');
      loadDashboardData(true);
    } catch (err: any) {
      setDetailError(err.response?.data?.error || err.message || "Erreur lors de l'enregistrement du paiement.");
    }
  };

  // Soumission Matériau (Création / Édition)
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (editingMaterial) {
        const payload: any = {};
        if (selectedFields.includes('name')) payload.name = matName;
        if (selectedFields.includes('minStockAlert')) payload.minStockAlert = parseFloat(matMin);
        if (selectedFields.includes('unit')) payload.unit = matUnit;
        if (selectedFields.includes('stock')) payload.stock = parseFloat(matStock);

        await api.put(`/materials/${editingMaterial.id}`, payload);
      } else {
        const payload = {
          name: matName,
          minStockAlert: parseFloat(matMin),
          unit: matUnit,
          stock: parseFloat(matStock),
        };
        await api.post('/materials', {
          ...payload,
          initialStock: matStock, // legacy field name for create
        });
      }

      setShowMatModal(false);
      setEditingMaterial(null);
      setMatName('');
      setMatStock('0');
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Soumission Mouvement Stock
  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.post('/materials/movement', {
        materialId: movMatId,
        projectId: movProjId || undefined,
        type: movType,
        quantity: parseFloat(movQty),
        reason: movReason,
      });
      setShowMovModal(false);
      setMovMatId('');
      setMovProjId('');
      setMovQty('');
      setMovReason('');
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Mouvement invalide ou stock insuffisant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (editingDocument) {
        const payload: any = {};
        if (selectedFields.includes('title')) payload.title = docTitle;
        if (selectedFields.includes('type')) payload.type = docType;
        if (selectedFields.includes('amount')) payload.amount = parseFloat(docAmount) || 0;
        if (selectedFields.includes('file')) payload.pdfFile = docFileBase64 || undefined;
        if (selectedFields.includes('devisId')) payload.devisId = docType === 'FACTURE' ? (docDevisId || null) : null;

        await api.put(`/documents/${editingDocument.id}`, payload);
      } else {
        const payload = {
          projectId: docProjId,
          title: docTitle,
          type: docType,
          amount: parseFloat(docAmount) || 0,
          pdfFile: docFileBase64 || undefined,
          devisId: docType === 'FACTURE' ? (docDevisId || null) : null,
        };
        await api.post('/documents', payload);
      }

      setShowDocModal(false);
      setEditingDocument(null);
      setDocProjId('');
      setDocTitle('');
      setDocAmount('');
      setDocFileBase64('');
      setDocDevisId('');
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lancement de l'impression PDF
  const handlePrintPDF = async (docId: string) => {
    try {
      const response = await api.get(`/documents/${docId}/pdf`);
      setPrintDoc(response.data);
      setShowPrintModal(true);
    } catch (err) {
      console.error("Erreur de chargement du PDF", err);
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  // Soumission Utilisateur (Création / Édition)
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = {};
        if (selectedFields.includes('firstName')) payload.firstName = usrFirstName;
        if (selectedFields.includes('lastName')) payload.lastName = usrLastName;
        if (selectedFields.includes('email')) payload.email = usrEmail && usrEmail.trim() !== "" ? usrEmail.trim() : null;
        if (selectedFields.includes('phone')) payload.phone = usrPhone;
        if (selectedFields.includes('role')) payload.role = usrRole;
        if (selectedFields.includes('password') && usrPassword) payload.password = usrPassword;

        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        const payload = {
          firstName: usrFirstName,
          lastName: usrLastName,
          email: usrEmail && usrEmail.trim() !== "" ? usrEmail.trim() : null,
          phone: usrPhone,
          role: usrRole,
          password: usrPassword || undefined,
        };
        if (!usrPassword) {
          setErrorMsg('Le mot de passe est obligatoire pour la création.');
          setSubmitting(false);
          return;
        }
        await api.post('/users', payload);
      }

      setShowUserModal(false);
      setEditingUser(null);
      setUsrFirstName('');
      setUsrLastName('');
      setUsrEmail('');
      setUsrPhone('');
      setUsrPassword('password123');
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur d\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanMaxProjects(plan.maxProjects.toString());
    setPlanMaxUsers(plan.maxUsers.toString());
    setPlanPrice(plan.price.toString());
    setPlanDurationDays((plan.durationDays || 30).toString());
    setPlanFeatures(plan.features || []);
    setErrorMsg('');
    setShowSuperadminModal(true);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.put(`/superadmin/plans/${editingPlan.planName}`, {
        maxProjects: parseInt(planMaxProjects),
        maxUsers: parseInt(planMaxUsers),
        price: parseInt(planPrice),
        durationDays: parseInt(planDurationDays),
        features: planFeatures,
      });

      setShowSuperadminModal(false);
      setEditingPlan(null);
      setPlanMaxProjects('');
      setPlanMaxUsers('');
      setPlanPrice('');
      setPlanDurationDays('30');
      setPlanFeatures([]);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la modification du plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreatePlanForm = () => {
    setPlanName('');
    setPlanMaxProjects('');
    setPlanMaxUsers('');
    setPlanPrice('');
    setPlanDurationDays('30');
    setPlanFeatures([]);
    setErrorMsg('');
  };

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.post('/superadmin/plans', {
        planName,
        maxProjects: parseInt(planMaxProjects),
        maxUsers: parseInt(planMaxUsers),
        price: parseInt(planPrice),
        durationDays: parseInt(planDurationDays),
        features: planFeatures,
      });

      setShowCreatePlanModal(false);
      resetCreatePlanForm();
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la création du plan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simulation Changement Abonnement
  const handleUpgradeSubscription = async (plan: string) => {
    try {
      const response = await api.post('/auth/subscription', { plan });
      const updatedCompany = response.data.company;
      localStorage.setItem('construction_company', JSON.stringify(updatedCompany));
      setCompany(updatedCompany);
      if (response.data.planConfig) {
        localStorage.setItem('construction_plan_config', JSON.stringify(response.data.planConfig));
      }
      loadDashboardData();
    } catch (err) {
      console.error('Erreur mise à niveau', err);
    }
  };

  if (!user) return null;

  // Calcul du taux d'avancement moyen
  const getAverageProgress = () => {
    if (projects.length === 0) return 0;
    let totalProgress = 0;
    projects.forEach((proj) => {
      const tasks = proj.tasks || [];
      if (tasks.length === 0) return;
      const completed = tasks.filter((t: any) => t.status === 'TERMINE').length;
      totalProgress += (completed / tasks.length) * 100;
    });
    return Math.round(totalProgress / projects.length);
  };



  // Marqueurs géographiques pour la carte (Premium/Standard)
  const mapMarkers = projects
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.status,
    }));

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de bord';
      case 'projects': return 'Gestion des chantiers';
      case 'documents': return 'Devis & Factures client';
      case 'users': return 'Gestion des équipes et clients';
      case 'subscription': return 'Paramètres d\'abonnement';
      default: return 'ConstructCare';
    }
  };

  const totalTresorerie = projects.reduce((sum: number, p: any) => sum + (p.tresorerieDisponible || 0), 0);
  const formattedTotal = totalTresorerie >= 1000000
    ? (totalTresorerie / 1000000).toFixed(1) + 'M FCFA'
    : (totalTresorerie / 1000).toFixed(0) + 'k FCFA';

  const filteredProjects = projects.filter(proj =>
    proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (proj.address && proj.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    loadDashboardData(true); // Recharger silencieusement les données pour mettre à jour les pourcentages
  };

  const renderDetailView = () => {
    if (!selectedProjectId) return null;
    if (user.role === 'CLIENT') {
      return <ClientPortal projectId={selectedProjectId} onBack={handleBackToDashboard} />;
    }
    if (user.role === 'TEAM_LEADER' || user.role === 'WORKER') {
      return <WorkerPortal projectId={selectedProjectId} onBack={handleBackToDashboard} />;
    }
    return <ProjectDetail projectId={selectedProjectId} onBack={handleBackToDashboard} />;
  };

  const renderDevisDetailView = () => {
    if (!selectedDevisId) return null;
    const devis = documents.find((d: any) => d.id === selectedDevisId);
    if (!devis) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Devis introuvable.</div>;

    const devisFactures = documents.filter((d: any) => d.type === 'FACTURE' && d.devisId === selectedDevisId);

    const devisWithAssoc = {
      ...devis,
      factures: devisFactures,
    };

    return (
      <div className="project-detail-container animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--steel-border)', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--steel-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setSelectedDevisId(null)} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Retour
            </button>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: '850' }}>{devis.title}</h2>
          </div>
          <span className={`badge badge-${devis.status === 'PAYE' ? 'success' : devis.status === 'SIGNE' ? 'success' : 'pending'}`}>
            {devis.status === 'PAYE' ? '✓ Payé & Validé' : devis.status === 'SIGNE' ? '✓ Signé' : '⏳ En attente'}
          </span>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Chantier : <strong>{devis.project?.name}</strong> · Émis le {new Date(devis.createdAt).toLocaleDateString()}
        </div>

        {renderDevisComposition(devisWithAssoc, user.role === 'COMPANY_ADMIN' ? {
          onAddFacture: (devisId, projectId) => {
            openNewDocumentModal();
            setDocType('FACTURE');
            setDocProjId(projectId);
            setDocDevisId(devisId);
          },
        } : undefined)}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Barre Latérale */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} company={company} />

      {/* Zone Principale */}
      <div className="dashboard-main-content">
        <Header onSearchChange={selectedProjectId ? undefined : setSearchQuery} />

        <div className="dashboard-scrollable">
          {selectedDevisId ? (
            renderDevisDetailView()
          ) : selectedProjectId ? (
            renderDetailView()
          ) : loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Chargement des données chantiers...</span>
            </div>
          ) : (
            <>
              {/* ONGLET 1 : TABLEAU DE BORD GLOBAL (ADMIN SEUL) */}
              {activeTab === 'dashboard' && user.role === 'COMPANY_ADMIN' && (
                <>
                  <div className="dashboard-title-area">
                    <div className="title-left">
                      <h2>Tableau de Bord</h2>
                      <p>Suivi en temps réel de vos opérations de construction.</p>
                    </div>
                    <div className="title-right">
                      <button className="title-action-btn-secondary" onClick={() => {}}>
                        <Sliders size={16} />
                        <span>Filtrer</span>
                      </button>
                      <button className="title-action-btn-primary" onClick={() => {}}>
                        <Download size={16} />
                        <span>Exporter rapport</span>
                      </button>
                    </div>
                  </div>

                  {/* Cartes Métriques */}
                  <div className="dashboard-metrics-row">
                    {/* Card 1 */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper blue">
                          <Wrench size={20} />
                        </div>
                        <span className="metric-tag green">+2 ce mois</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">CHANTIERS ACTIFS</span>
                        <h2 className="metric-value">{projects.filter((p) => p.status === 'EN_COURS').length}</h2>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper red">
                          <Wallet size={20} />
                        </div>
                        <span className="metric-tag gray">Total cumulé</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">TRÉSORERIE TOTALE</span>
                        <h2 className="metric-value">{formattedTotal}</h2>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper purple">
                          <TrendingUp size={20} />
                        </div>
                        <span className="metric-tag blue">Objectif 80%</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">AVANCEMENT GLOBAL</span>
                        <h2 className="metric-value">{getAverageProgress()}%</h2>
                        <div className="metric-progress-container">
                          <div className="metric-progress-bg">
                            <div className="metric-progress-fill" style={{ width: `${getAverageProgress()}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper green">
                          <CheckCircle2 size={20} />
                        </div>
                        <span className="metric-tag gray">Année 2024</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">TRAVAUX TERMINÉS</span>
                        <h2 className="metric-value">{projects.filter((p) => p.status === 'TERMINE').length}</h2>
                      </div>
                    </div>
                  </div>

                  {/* Graphique et Actions Rapides */}
                  <div className="dashboard-grid-row">
                    {/* Left Column - Chantiers Récents */}
                    <div className="dashboard-grid-card recents-card glass-panel">
                      <div className="grid-card-header">
                        <h3>Chantiers Récents</h3>
                        <button className="view-all-link" onClick={() => setActiveTab('projects')}>
                          Voir tout
                        </button>
                      </div>
                      <div className="grid-card-body">
                        <table className="recents-table">
                          <thead>
                            <tr>
                              <th>NOM DU PROJET</th>
                              <th>CLIENT</th>
                              <th>STATUT</th>
                              <th>PROGRESSION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projects.slice(0, 4).map((proj) => {
                              const completedTasks = proj.tasks?.filter((t: any) => t.status === 'TERMINE')?.length || 0;
                              const totalTasks = proj.tasks?.length || 0;
                              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                              
                              let progressColorClass = 'brown';
                              if (proj.status === 'TERMINE') progressColorClass = 'green';
                              else if (proj.status === 'SUSPENDU') progressColorClass = 'red';

                              return (
                                <tr key={proj.id} onClick={() => setSelectedProjectId(proj.id)}>
                                  <td className="proj-name-cell">{proj.name}</td>
                                  <td>{proj.company?.name || 'SCI Immob'}</td>
                                  <td>
                                    <span className={`status-badge-tag ${proj.status}`}>
                                      {proj.status === 'EN_COURS' ? 'EN COURS' : proj.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="progress-cell">
                                      <div className="progress-bar-tiny-bg">
                                        <div className={`progress-bar-tiny-fill ${progressColorClass}`} style={{ width: `${progress}%` }} />
                                      </div>
                                      <span className="progress-percentage-text">{progress}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  {/* Focus et Alertes de Sécurité */}
                  <div className="dashboard-grid-row" style={{ marginTop: '24px' }}>
                    <div className="focus-card glass-panel animate-fade-in">
                      <div className="focus-image-container">
                        <img 
                          src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80" 
                          alt="Focus chantier" 
                          className="focus-image"
                        />
                        <div className="focus-overlay">
                          <h4>Focus : Site Dakar Sud</h4>
                          <p>Coulage de la dalle principale prévu demain à 08:00</p>
                        </div>
                      </div>
                    </div>

                    <div className="security-alerts-card glass-panel animate-fade-in">
                      <div className="alerts-card-header">
                        <h3>Alertes de Sécurité</h3>
                      </div>
                      <div className="alerts-card-body">
                        <div className="security-alert-item danger">
                          <AlertTriangle size={18} className="alert-icon-red" />
                          <div className="alert-content">
                            <h5>Maintenance requise</h5>
                            <p>Grue G-24 nécessite une inspection immédiate.</p>
                          </div>
                        </div>

                        <div className="security-alert-item info">
                          <Info size={18} className="alert-icon-gray" />
                          <div className="alert-content">
                            <h5>Livraison Matériaux</h5>
                            <p>30 tonnes de ciment livrées à Résidence Azur.</p>
                          </div>
                        </div>
                        
                        <button className="btn btn-outline full-width-btn" style={{ marginTop: '12px' }}>
                          Journal complet des alertes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Géolocalisation (Premium ou Standard requis) */}
                  {(company?.subscriptionPlan === 'STANDARD' || company?.subscriptionPlan === 'PREMIUM') && (
                    <div style={{ width: '100%', marginTop: '24px' }}>
                      <MapWidget markers={mapMarkers} />
                    </div>
                  )}

                  {/* Footer */}
                  <footer className="dashboard-footer-bar">
                    <span className="footer-copyright">© 2024 Construct Core. Tous droits réservés.</span>
                    <div className="footer-links">
                      <span>Confidentialité</span>
                      <span>Aide</span>
                    </div>
                  </footer>
                </>
              )}

              {/* ONGLET SUPER_ADMIN : TABLEAU DE BORD STATS */}
              {activeTab === 'superadmin-dashboard' && user.role === 'SUPER_ADMIN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="dashboard-title-area">
                    <div className="title-left">
                      <h2>Tableau de Bord Système</h2>
                      <p>Vue globale de la plateforme ConstructCare.</p>
                    </div>
                  </div>

                  <div className="dashboard-metrics-row">
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper blue"><Users size={20} /></div>
                        <span className="metric-tag gray">Total</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">ENTREPRISES</span>
                        <h2 className="metric-value">{superadminStats?.totalCompanies ?? '—'}</h2>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper green"><Users size={20} /></div>
                        <span className="metric-tag gray">Actifs</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">UTILISATEURS</span>
                        <h2 className="metric-value">{superadminStats?.totalUsers ?? '—'}</h2>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper purple"><Briefcase size={20} /></div>
                        <span className="metric-tag gray">Tous statuts</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">CHANTIERS</span>
                        <h2 className="metric-value">{superadminStats?.totalProjects ?? '—'}</h2>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">
                        <div className="metric-icon-wrapper red"><FileText size={20} /></div>
                        <span className="metric-tag gray">Documents</span>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-label">DEVIS / FACTURES</span>
                        <h2 className="metric-value">{superadminStats?.totalDocuments ?? '—'}</h2>
                      </div>
                    </div>
                  </div>

                  {/* Répartition par plan */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Répartition des entreprises par plan</h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {superadminStats?.companiesByPlan?.map((item: any) => (
                        <div key={item.subscriptionPlan} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px 24px', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                          <span className={`badge badge-${item.subscriptionPlan === 'PREMIUM' ? 'success' : item.subscriptionPlan === 'STANDARD' ? 'warning' : 'pending'}`} style={{ fontSize: '11px' }}>{item.subscriptionPlan}</span>
                          <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>{item._count.id}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>entreprise{item._count.id > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Volume financier */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Volume financier total déclaré</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Somme de toutes les dépenses enregistrées sur la plateforme</p>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)' }}>
                      {superadminStats?.totalExpensesAmount
                        ? superadminStats.totalExpensesAmount >= 1000000
                          ? (superadminStats.totalExpensesAmount / 1000000).toFixed(2) + ' M FCFA'
                          : superadminStats.totalExpensesAmount.toLocaleString() + ' FCFA'
                        : '0 FCFA'
                      }
                    </h2>
                  </div>
                </div>
              )}

              {/* ONGLET SUPER_ADMIN : LISTE DES ENTREPRISES */}
              {activeTab === 'superadmin-companies' && user.role === 'SUPER_ADMIN' && (
                <>
                {/* Les actions de ce tableau (changement de forfait) se font hors modale :
                    l'erreur doit donc être affichée ici pour rester visible. */}
                {errorMsg && <div className="login-error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
                <DataTable
                  title="Entreprises enregistrées"
                  subtitle="Liste de toutes les entreprises utilisant la plateforme"
                  columns={[
                    { key: 'name', label: 'Entreprise' },
                    { key: 'contact', label: 'Contact' },
                    { key: 'plan', label: 'Plan actuel' },
                    { key: 'users', label: 'Utilisateurs' },
                    { key: 'projects', label: 'Chantiers' },
                    { key: 'createdAt', label: 'Inscription' },
                    { key: 'actions', label: 'Changer plan' },
                  ]}
                  data={superadminCompanies}
                  renderRow={(company) => (
                    <tr key={company.id}>
                      <td style={{ fontWeight: '700' }}>
                        <div>{company.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{company.address || 'Adresse non renseignée'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{company.email || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{company.phone || '—'}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${company.subscriptionPlan === 'PREMIUM' ? 'success' : company.subscriptionPlan === 'STANDARD' ? 'warning' : 'pending'}`}>
                          {company.subscriptionPlan}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', textAlign: 'center' }}>{company._count?.users ?? 0}</td>
                      <td style={{ fontWeight: '600', textAlign: 'center' }}>{company._count?.projects ?? 0}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={company.subscriptionPlan}
                          onChange={async (e) => {
                            setErrorMsg('');
                            try {
                              await api.put(`/superadmin/companies/${company.id}/plan`, { plan: e.target.value });
                              loadDashboardData();
                            } catch (err: any) {
                              setErrorMsg(err.response?.data?.error || 'Erreur lors du changement de forfait.');
                              // Recharge les données pour que le sélecteur revienne au forfait réellement enregistré
                              loadDashboardData();
                            }
                          }}
                        >
                          {/* Forfaits réellement configurés, forfaits personnalisés inclus */}
                          {superadminPlans.map((plan) => (
                            <option key={plan.planName} value={plan.planName}>{plan.planName}</option>
                          ))}
                          {/* Repli si le forfait courant a été supprimé entre-temps : évite que le
                              sélecteur se positionne silencieusement sur une autre valeur */}
                          {!superadminPlans.some((plan) => plan.planName === company.subscriptionPlan) && (
                            <option value={company.subscriptionPlan}>{company.subscriptionPlan}</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  )}
                />
                </>
              )}

              {/* ONGLET SUPER_ADMIN : GESTION DES PLANS */}
              {activeTab === 'superadmin-plans' && user.role === 'SUPER_ADMIN' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <button
                      className="btn btn-cta"
                      onClick={() => { resetCreatePlanForm(); setShowCreatePlanModal(true); }}
                    >
                      <Plus size={16} /> Créer un Plan
                    </button>
                  </div>
                  <DataTable
                    title="Gestion des formules d'abonnements"
                    subtitle="Configuration globale des tarifs, des limites et des fonctionnalités pour chaque plan"
                    columns={[
                      { key: 'planName', label: 'Formule' },
                      { key: 'price', label: 'Tarif Mensuel' },
                      { key: 'duration', label: 'Durée' },
                      { key: 'maxProjects', label: 'Limite Chantiers' },
                      { key: 'maxUsers', label: 'Limite Collaborateurs' },
                      { key: 'features', label: 'Fonctionnalités incluses' },
                      { key: 'actions', label: 'Actions' },
                    ]}
                    data={superadminPlans}
                    renderRow={(plan) => (
                      <tr key={plan.planName}>
                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{plan.planName}</td>
                        <td style={{ fontWeight: '700' }}>
                          {plan.price === 0 ? 'Gratuit (Essai)' : `${plan.price.toLocaleString()} FCFA / mois`}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {plan.durationDays ?? 30} jour{(plan.durationDays ?? 30) > 1 ? 's' : ''}
                        </td>
                        <td>{plan.maxProjects >= 9999 ? 'Illimité' : `${plan.maxProjects} chantier(s)`}</td>
                        <td>{plan.maxUsers >= 9999 ? 'Illimité' : `${plan.maxUsers} collaborateur(s)`}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {plan.features?.map((f: string) => (
                              <span key={f} className="badge badge-info" style={{ fontSize: '10px' }}>
                                {f}
                              </span>
                            )) || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Aucune</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => startEditPlan(plan)}
                            >
                              Modifier
                            </button>
                            {plan.planName !== 'FREE' && plan.planName !== 'STANDARD' && plan.planName !== 'PREMIUM' && (
                              <button
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                onClick={async () => {
                                  if (window.confirm(`Supprimer le plan "${plan.planName}" ? Cette action est irréversible.`)) {
                                    try {
                                      await api.delete(`/superadmin/plans/${plan.planName}`);
                                      loadDashboardData();
                                    } catch (err: any) {
                                      alert(err.response?.data?.error || 'Erreur lors de la suppression.');
                                    }
                                  }
                                }}
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                </>
              )}

              {/* ONGLET : MES DEVIS (CLIENT) */}
              {activeTab === 'client-devis' && user.role === 'CLIENT' && (
                <ClientDevisTab onSelectDevis={setSelectedDevisId} />
              )}

              {/* ONGLET 2 : LISTE DES CHANTIERS */}
              {activeTab === 'projects' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {filteredProjects.length} Chantier{filteredProjects.length > 1 ? 's' : ''} répertorié{filteredProjects.length > 1 ? 's' : ''}
                    </div>
                    {user.role === 'COMPANY_ADMIN' && (
                      <button className="btn btn-cta" onClick={() => setShowProjModal(true)}>
                        <Plus size={16} /> Créer un Chantier
                      </button>
                    )}
                  </div>

                  <div className="projects-grid">
                    {filteredProjects.map((proj) => {
                      const completedTasks = proj.tasks?.filter((t: any) => t.status === 'TERMINE')?.length || 0;
                      const totalTasks = proj.tasks?.length || 0;
                      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                      const tresorerieDisponible = proj.tresorerieDisponible || 0;

                      return (
                        <div
                          key={proj.id}
                          className="project-card glass-panel animate-fade-in"
                          onClick={() => setSelectedProjectId(proj.id)}
                        >
                          <div className="project-card-header">
                            <h3>{proj.name}</h3>
                            <span className={`badge badge-${proj.status === 'EN_COURS' ? 'active' : proj.status === 'TERMINE' ? 'success' : 'danger'}`}>
                              {proj.status.replace('_', ' ')}
                            </span>
                          </div>

                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{proj.description}</p>

                          <div className="project-meta-item">
                            <MapPin size={14} style={{ color: 'var(--accent)' }} />
                            <span>{proj.address || 'Non spécifié'}</span>
                          </div>

                          <div className="project-meta-item">
                            <Calendar size={14} />
                            <span>
                              Du {new Date(proj.startDate).toLocaleDateString()} au{' '}
                              {new Date(proj.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="progress-bar-container">
                            <div className="progress-bar-header">
                              <span>Avancement</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <div className="project-card-footer">
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Tâches: {completedTasks}/{totalTasks}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                                {tresorerieDisponible.toLocaleString()} FCFA
                              </span>
                              {user.role === 'COMPANY_ADMIN' && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '11px' }}
                                  onClick={(e) => { e.stopPropagation(); startEditProject(proj); }}
                                >
                                  Modifier
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ONGLET : PAIEMENTS CLIENTS (RECETTES) */}
              {activeTab === 'payments' && (user.role === 'COMPANY_ADMIN' || user.role === 'TEAM_LEADER') && (
                <DataTable
                  title="Paiements reçus (Recettes)"
                  subtitle="Suivi des acomptes et règlements clients du chantier"
                  columns={[
                    { key: 'project', label: 'Chantier' },
                    { key: 'title', label: 'Objet du paiement' },
                    { key: 'amount', label: 'Montant' },
                    { key: 'status', label: 'État' },
                    { key: 'date', label: 'Date' },
                    { key: 'actions', label: 'Actions' },
                  ]}
                  data={documents.filter((d: any) => d.type === 'FACTURE')}
                  actions={
                    <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>
                      <Plus size={16} /> Enregistrer un Paiement
                    </button>
                  }
                   renderRow={(item) => {
                    const isPaid = item.status === 'PAYE';
                    const isDeclared = item.status === 'PAYE_CLIENT';
                    const isPartial = item.status === 'PAYE_PARTIEL';
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600' }}>{item.project?.name}</td>
                        <td>{item.title}</td>
                        <td style={{ color: 'var(--text-primary)' }}>
                          <div style={{ fontWeight: '700' }}>{item.amount.toLocaleString()} FCFA</div>
                          {item.status !== 'PAYE' && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Payé : {item.paidAmount?.toLocaleString() || 0} | Reste : {Math.max(0, item.amount - (item.paidAmount || 0)).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${isPaid ? 'success' : isPartial ? 'warning' : isDeclared ? 'pending' : 'pending'}`}>
                            {isPaid ? 'Payé' : isPartial ? 'Payé partiel' : isDeclared ? 'Déclaré (Client)' : 'En attente'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                         <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => {
                                setSelectedPaymentDetail(item);
                                setManualPayAmount('');
                                setDetailError('');
                                setDetailSuccess('');
                              }}
                            >
                              🔍 Détails
                            </button>
                            {item.pdfUrl && (
                              <a
                                href={item.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Download size={14} /> PDF
                              </a>
                            )}
                            {isDeclared && (
                              <button
                                className="btn btn-cta"
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                                onClick={async () => {
                                  try {
                                    await api.put(`/documents/${item.id}/status`, { status: 'PAYE' });
                                    loadDashboardData();
                                  } catch (err) {
                                    console.error("Erreur de validation", err);
                                  }
                                }}
                              >
                                Valider versement ({item.declaredPaidAmount?.toLocaleString()} F)
                              </button>
                            )}
                            {!isPaid && !isDeclared && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                                onClick={async () => {
                                  try {
                                    await api.put(`/documents/${item.id}/status`, { status: 'PAYE' });
                                    loadDashboardData();
                                  } catch (err) {
                                    console.error("Erreur de paiement", err);
                                  }
                                }}
                              >
                                Marquer Payé
                              </button>
                            )}
                            {isPaid && (
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Validé
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }}
                />
              )}



              {/* ONGLET 5a : DEVIS */}
              {(activeTab === 'admin-devis' || activeTab === 'documents') && user.role === 'COMPANY_ADMIN' && (
                <DataTable
                  title="Gestion des Devis"
                  subtitle="Devis envoyés aux clients — suivi des signatures et acceptations"
                  columns={[
                    { key: 'project', label: 'Chantier' },
                    { key: 'title', label: 'Intitulé' },
                    { key: 'amount', label: 'Montant HT' },
                    { key: 'client', label: 'Client' },
                    { key: 'status', label: 'Statut Signature' },
                    { key: 'actions', label: 'Actions' },
                  ]}
                  data={documents.filter((d: any) => d.type === 'DEVIS')}
                  actions={
                    <button className="btn btn-primary" onClick={() => {
                      openNewDocumentModal();
                      setDocType('DEVIS');
                    }}>
                      <Plus size={16} /> Nouveau Devis
                    </button>
                  }
                  renderRow={(item) => {
                    const isSigned = item.status === 'SIGNE';
                    const isPaid = item.status === 'PAYE';
                    const isDeclared = item.status === 'PAYE_CLIENT';
                    const devisAmount = item.amount || 0;
                    return (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td style={{ fontWeight: '600' }}>{item.project?.name}</td>
                          <td>{item.title}</td>
                          <td style={{ fontWeight: '700' }}>{devisAmount.toLocaleString()} FCFA</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {item.project?.assignments?.find((a: any) => a.user?.role === 'CLIENT')
                              ? `${item.project.assignments.find((a: any) => a.user?.role === 'CLIENT').user.firstName} ${item.project.assignments.find((a: any) => a.user?.role === 'CLIENT').user.lastName}`
                              : '—'
                            }
                          </td>
                          <td>
                            <span className={`badge badge-${isPaid ? 'success' : isDeclared ? 'warning' : isSigned ? 'active' : 'pending'}`}>
                              {isPaid ? '✓ Payé' : isDeclared ? '⏳ Déclaré client' : isSigned ? '✓ Signé' : item.status === 'EN_ATTENTE' ? 'En attente' : item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '11px' }}
                                onClick={() => setSelectedDevisId(item.id)}
                              >
                                🔍 Composition Devis
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                onClick={() => handlePrintPDF(item.id)}
                              >
                                <Printer size={12} /> Générer PDF
                              </button>
                              {item.pdfUrl && (
                                <a href={item.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Download size={12} /> PDF Original
                                </a>
                              )}
                              {isDeclared && (
                                <button
                                  className="btn btn-cta"
                                  style={{ padding: '5px 8px', fontSize: '11px' }}
                                  onClick={async () => {
                                    if (window.confirm('Valider le paiement de ce devis ?')) {
                                      try {
                                        await api.put(`/documents/${item.id}/status`, { status: 'PAYE' });
                                        loadDashboardData();
                                      } catch (err) {
                                        console.error("Erreur de validation de paiement", err);
                                      }
                                    }
                                  }}
                                >
                                  ✓ Valider Paiement
                                </button>
                              )}
                              <button className="btn btn-secondary" style={{ padding: '5px 8px', fontSize: '11px' }} onClick={() => startEditDocument(item)}>
                                Modifier
                              </button>
                              <button className="btn btn-danger" style={{ padding: '5px 8px', fontSize: '11px' }} onClick={() => deleteDocument(item.id)}>
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  }}
                />
              )}

              {/* ONGLET 6 : MON ÉQUIPE */}
              {activeTab === 'users' && user.role === 'COMPANY_ADMIN' && (
                <DataTable
                  title="Collaborateurs & Clients"
                  subtitle="Maçons, chefs d'équipe, et comptes d'accès clients chantiers"
                  columns={[
                    { key: 'name', label: 'Nom Complet' },
                    { key: 'email', label: 'Email Connexion' },
                    { key: 'phone', label: 'Téléphone' },
                    { key: 'role', label: 'Rôle' },
                    { key: 'actions', label: 'Actions' },
                  ]}
                  data={users}
                  actions={
                    <button className="btn btn-primary" onClick={openNewUserModal}>
                      <Plus size={16} /> Inviter Collaborateur
                    </button>
                  }
                  renderRow={(item) => {
                    const getRoleLabel = (r: string) => {
                      if (r === 'COMPANY_ADMIN') return 'Gérant';
                      if (r === 'TEAM_LEADER') return 'Chef d\'équipe';
                      if (r === 'WORKER') return 'Ouvrier';
                      if (r === 'CLIENT') return 'Client propriétaire';
                      return r;
                    };
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600' }}>{`${item.firstName} ${item.lastName}`}</td>
                        <td>{item.email}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.phone || 'Non renseigné'}</td>
                        <td>
                          <span className={`badge ${item.role === 'CLIENT' ? 'badge-info' : item.role === 'TEAM_LEADER' ? 'badge-warning' : 'badge-pending'}`}>
                            {getRoleLabel(item.role)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => startEditUser(item)}
                            >
                              Modifier
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => deleteUser(item.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }}
                />
              )}

              {activeTab === 'subscription' && user.role === 'COMPANY_ADMIN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  {/* Profil de l'entreprise */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', margin: 0 }}>Profil de l'Entreprise</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Mettez à jour les informations de contact et le logo visible sur vos devis et factures.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="alert alert-success" style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.25)', fontSize: '13px' }}>
                        {successMsg}
                      </div>
                    )}

                    {errorMsg && (
                      <div className="alert alert-danger" style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: 'rgba(231, 76, 60, 0.12)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.25)', fontSize: '13px' }}>
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleUpdateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Nom de l'entreprise *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={compName}
                            onChange={(e) => setCompName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>NIF (Identification Fiscale)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: 1001825678"
                            value={compNif}
                            onChange={(e) => setCompNif(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Adresse physique</label>
                          <input
                            type="text"
                            className="form-input"
                            value={compAddress}
                            onChange={(e) => setCompAddress(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Téléphone de contact</label>
                          <input
                            type="text"
                            className="form-input"
                            value={compPhone}
                            onChange={(e) => setCompPhone(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Email de contact</label>
                          <input
                            type="email"
                            className="form-input"
                            value={compEmail}
                            onChange={(e) => setCompEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Logo de l'entreprise</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            border: '1px solid var(--steel-border)',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {compLogo ? (
                              <img src={compLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <Building2 size={24} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="company-logo-input"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCompLogo(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <label htmlFor="company-logo-input" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                                Sélectionner une image
                              </label>
                              {compLogo && (
                                <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--status-danger)', border: '1px solid var(--status-danger)', backgroundColor: 'transparent' }} onClick={() => setCompLogo('')}>
                                  Supprimer
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG ou JPEG. Taille maximale conseillée 2 Mo.</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div style={{ borderTop: '1px solid var(--steel-border)', margin: '10px 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)' }}>Modèle économique ConstructCare</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Modifiez votre abonnement pour débloquer les chantiers illimités et la génération PDF de rapports.
                    </p>
                  </div>

                  <div className="pricing-settings-container">
                    {(() => {
                      const formatPlanName = (name: string) => {
                        if (name === 'FREE') return 'Gratuit (Essai)';
                        if (name === 'STANDARD') return 'Standard';
                        if (name === 'PREMIUM') return 'Premium';
                        return name
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .split(' ')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      };

                      return availablePlans
                        .filter((plan) => plan.planName !== 'FREE' || company?.subscriptionPlan === 'FREE')
                        .map((plan) => {
                          const isCurrent = company?.subscriptionPlan === plan.planName;
                          const isPopular = plan.planName === 'STANDARD';
                          const planDescriptions: Record<string, string> = {
                            FREE: "Offre d'essai unique de démarrage.",
                            STANDARD: "Parfait pour les entrepreneurs locaux.",
                            PREMIUM: "L'expérience SaaS intégrale.",
                          };

                          return (
                            <div key={plan.planName} className={`pricing-settings-card glass-panel ${isCurrent ? 'current' : ''} ${isPopular ? 'recommended-plan' : ''}`}>
                              {isCurrent && <div className="current-plan-banner">{plan.planName === 'FREE' ? 'Formule active (Essai)' : 'Formule active'}</div>}
                              {!isCurrent && isPopular && <div className="current-plan-banner" style={{ background: 'var(--accent)', color: '#ffffff' }}>Conseillé</div>}
                              <h4 style={{ fontSize: '18px' }}>Plan {formatPlanName(plan.planName)}</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {planDescriptions[plan.planName] || 'Configuration personnalisée.'}
                              </p>
                              <h5 style={{ fontSize: '24px', fontWeight: '800' }}>
                                {plan.price === 0 ? '0 FCFA' : `${plan.price.toLocaleString()} FCFA`}{' '}
                                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>/ mois</span>
                              </h5>
                              <ul className="price-features" style={{ margin: '15px 0' }}>
                                <li>✓ {plan.maxProjects >= 9999 ? 'Chantiers illimités' : `Jusqu'à ${plan.maxProjects} chantier(s)`}</li>
                                <li>✓ {plan.maxUsers >= 9999 ? 'Collaborateurs illimités' : `Jusqu'à ${plan.maxUsers} collaborateur(s)`}</li>
                                {plan.features?.map((f: string) => (
                                  <li key={f}>✓ Fonctionnalité {f.charAt(0) + f.slice(1).toLowerCase()}</li>
                                ))}
                              </ul>
                              <button
                                className={`btn ${isCurrent ? 'btn-secondary' : isPopular ? 'btn-primary' : 'btn-secondary'}`}
                                disabled={isCurrent}
                                onClick={() => handleUpgradeSubscription(plan.planName)}
                              >
                                {isCurrent ? 'Plan Courant' : `Passer au ${formatPlanName(plan.planName)}`}
                              </button>
                            </div>
                          );
                        });
                    })()}

                    {/* Entreprise Card */}
                    <div className="pricing-settings-card glass-panel">
                      <h4 style={{ fontSize: '18px' }}>Entreprise</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Solution sur mesure pour vos besoins d'envergure.
                      </p>
                      <h5 style={{ fontSize: '24px', fontWeight: '800' }}>
                        Sur Devis
                      </h5>
                      <ul className="price-features" style={{ margin: '15px 0' }}>
                        <li>✓ Chantiers illimités (&gt; 30)</li>
                        <li>✓ Collaborateurs illimités (&gt; 50)</li>
                        <li>✓ Support prioritaire 24h/7</li>
                      </ul>
                      <a
                        className="btn btn-secondary"
                        href="mailto:contact@constructcare.com?subject=Demande%20de%20devis%20ConstructCare"
                        style={{ textDecoration: 'none', textAlign: 'center' }}
                      >
                        Nous contacter
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', margin: 0 }}>Mon Profil</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Mettez à jour vos informations de contact personnelles et modifiez votre mot de passe.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="alert alert-success" style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.25)', fontSize: '13px' }}>
                        {successMsg}
                      </div>
                    )}

                    {errorMsg && (
                      <div className="alert alert-danger" style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: 'rgba(231, 76, 60, 0.12)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.25)', fontSize: '13px' }}>
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Prénom *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={profileFirstName}
                            onChange={(e) => setProfileFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Nom *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={profileLastName}
                            onChange={(e) => setProfileLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Téléphone de contact</label>
                          <input
                            type="text"
                            className="form-input"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Adresse Email</label>
                          <input
                            type="email"
                            className="form-input"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--steel-border)', margin: '12px 0' }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ fontSize: '15px', fontFamily: 'var(--font-title)', margin: 0 }}>Modifier le mot de passe</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                          Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe actuel.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Nouveau mot de passe</label>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="Min. 6 caractères"
                            value={profilePassword}
                            onChange={(e) => setProfilePassword(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Confirmer le nouveau mot de passe</label>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="Répétez le mot de passe"
                            value={profileConfirmPassword}
                            onChange={(e) => setProfileConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          {submitting ? 'Enregistrement...' : 'Enregistrer mon profil'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==========================================================================
         MODALS DE SAISIE DE FORMULAIRES
         ========================================================================== */}

      {/* Modal 1 : Créer un Chantier */}
      {showProjModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Créer un Chantier</span>
              <button className="modal-close-btn" onClick={() => setShowProjModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleCreateProject} className="login-form">
              <div className="form-group">
                <label>Nom du Chantier</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Villa R+2 Résidence"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description des travaux</label>
                <textarea
                  className="form-textarea"
                  placeholder="Gros œuvre, ferraillage..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Adresse postale / Lieu</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Baguida, Lomé, Togo"
                  value={projAddr}
                  onChange={(e) => setProjAddr(e.target.value)}
                />
              </div>

              {/* Si Standard/Premium, afficher latitude et longitude */}
              {(company?.subscriptionPlan === 'STANDARD' || company?.subscriptionPlan === 'PREMIUM') && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Latitude (Coordonnées)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="Ex: 6.1628"
                      value={projLat}
                      onChange={(e) => setProjLat(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude (Coordonnées)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="Ex: 1.3283"
                      value={projLng}
                      onChange={(e) => setProjLng(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Date de début</label>
                  <DatePicker
                    value={projStart}
                    onChange={setProjStart}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin estimée</label>
                  <DatePicker
                    value={projEnd}
                    onChange={setProjEnd}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Budget prévisionnel (FCFA) — optionnel</label>
                <input type="number" step="any" min="0" className="form-input" placeholder="Ex: 5000000" value={projBudget} onChange={(e) => setProjBudget(e.target.value)} />
              </div>

              {/* Créer ou Assigner un Client */}
              <div className="form-group" style={{ marginTop: '12px', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={createClientInline}
                    onChange={(e) => setCreateClientInline(e.target.checked)}
                  />
                  <span>Créer un nouveau client propriétaire</span>
                </label>
              </div>

              {createClientInline ? (
                <div className="glass-panel" style={{ padding: '12px', marginTop: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>Nouveau Client</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prénom du Client</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Yaovi"
                        value={clientFirstName}
                        onChange={(e) => setClientFirstName(e.target.value)}
                        required={createClientInline}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nom du Client</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Mensah"
                        value={clientLastName}
                        onChange={(e) => setClientLastName(e.target.value)}
                        required={createClientInline}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Téléphone du Client</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: +228 90 00 00 00"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required={createClientInline && !clientEmail}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email du Client (Facultatif)</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Ex: client@exemple.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Client Propriétaire (Existant)</label>
                  <select
                    className="form-select"
                    onChange={(e) => {
                      const val = e.target.value;
                      setProjClientIds(val ? [val] : []);
                    }}
                  >
                    <option value="">-- Assigner un client propriétaire --</option>
                    {users
                      .filter((u) => u.role === 'CLIENT')
                      .map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.firstName} {cl.lastName} ({cl.email || cl.phone || 'Pas de contact'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Création en cours...' : 'Créer le chantier (Seeding Tasks)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1b : Modifier un Chantier */}
      {showEditProjModal && editingProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">✏️ Modifier le Chantier — {editingProject.name}</span>
              <button className="modal-close-btn" onClick={() => { setShowEditProjModal(false); setEditingProject(null); }}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={editStep === 1 ? (e) => { e.preventDefault(); setEditStep(2); } : handleUpdateProject} className="login-form">
              {editStep === 1 ? (
                <>
                  <div className="form-group">
                    <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Choisissez les informations que vous souhaitez modifier :</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', margin: '1rem 0' }}>
                      {[
                        { key: 'name', label: 'Nom du Chantier' },
                        { key: 'description', label: 'Description' },
                        { key: 'address', label: 'Adresse / Lieu' },
                        { key: 'startDate', label: 'Date de début' },
                        { key: 'endDate', label: 'Date de fin' },
                        { key: 'budget', label: 'Budget (FCFA)' },
                        { key: 'status', label: 'Statut' },
                        { key: 'latitude', label: 'Latitude' },
                        { key: 'longitude', label: 'Longitude' }
                      ].map((item) => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <input type="checkbox" checked={selectedFields.includes(item.key)} onChange={() => toggleField(item.key)} />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary login-btn" disabled={selectedFields.length === 0}>
                    Continuer
                  </button>
                </>
              ) : (
                <>
                  {selectedFields.includes('name') && (
                    <div className="form-group">
                      <label>Nom du Chantier</label>
                      <input type="text" className="form-input" value={projName} onChange={(e) => setProjName(e.target.value)} required />
                    </div>
                  )}
                  {selectedFields.includes('description') && (
                    <div className="form-group">
                      <label>Description des travaux</label>
                      <textarea className="form-textarea" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} rows={3} />
                    </div>
                  )}
                  {selectedFields.includes('address') && (
                    <div className="form-group">
                      <label>Adresse / Lieu</label>
                      <input type="text" className="form-input" value={projAddr} onChange={(e) => setProjAddr(e.target.value)} />
                    </div>
                  )}
                  <div className="form-row">
                    {selectedFields.includes('startDate') && (
                      <div className="form-group">
                        <label>Date de début</label>
                        <DatePicker value={projStart} onChange={setProjStart} />
                      </div>
                    )}
                    {selectedFields.includes('endDate') && (
                      <div className="form-group">
                        <label>Date de fin prévue</label>
                        <DatePicker value={projEnd} onChange={setProjEnd} />
                      </div>
                    )}
                  </div>
                  {selectedFields.includes('budget') && (
                    <div className="form-group">
                      <label>Budget prévisionnel (FCFA)</label>
                      <input type="number" step="any" min="0" className="form-input" placeholder="Ex: 5000000" value={projBudget} onChange={(e) => setProjBudget(e.target.value)} />
                    </div>
                  )}
                  {selectedFields.includes('status') && (
                    <div className="form-group">
                      <label>Statut</label>
                      <select className="form-select" value={projStatus} onChange={(e) => setProjStatus(e.target.value)}>
                        <option value="EN_COURS">En Cours</option>
                        <option value="TERMINE">Terminé</option>
                        <option value="SUSPENDU">Suspendu</option>
                        <option value="PLANIFIE">Planifié</option>
                      </select>
                    </div>
                  )}
                  <div className="form-row">
                    {selectedFields.includes('latitude') && (
                      <div className="form-group">
                        <label>Latitude (Coordonnées GPS)</label>
                        <input type="number" step="any" className="form-input" placeholder="Ex: 6.1628" value={projLat} onChange={(e) => setProjLat(e.target.value)} />
                      </div>
                    )}
                    {selectedFields.includes('longitude') && (
                      <div className="form-group">
                        <label>Longitude (Coordonnées GPS)</label>
                        <input type="number" step="any" className="form-input" placeholder="Ex: 1.3283" value={projLng} onChange={(e) => setProjLng(e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditStep(1)}>
                      Retour
                    </button>
                    <button type="submit" className="btn btn-primary login-btn" style={{ flex: 2, margin: 0 }} disabled={submitting}>
                      {submitting ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}


      {/* Modal 3 : Ajouter / Modifier un Matériau */}
      {showMatModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">{editingMaterial ? 'Modifier le Matériau' : 'Ajouter un Matériau à l\'inventaire'}</span>
              <button className="modal-close-btn" onClick={() => setShowMatModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={editingMaterial && editStep === 1 ? (e) => { e.preventDefault(); setEditStep(2); } : handleMaterialSubmit} className="login-form">
              {editingMaterial && editStep === 1 ? (
                <>
                  <div className="form-group">
                    <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Choisissez les informations que vous souhaitez modifier :</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', margin: '1rem 0' }}>
                      {[
                        { key: 'name', label: 'Désignation du Matériau' },
                        { key: 'minStockAlert', label: "Seuil d'alerte" },
                        { key: 'unit', label: 'Unité de mesure' },
                        { key: 'stock', label: 'Stock / Quantité' }
                      ].map((item) => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <input type="checkbox" checked={selectedFields.includes(item.key)} onChange={() => toggleField(item.key)} />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary login-btn" disabled={selectedFields.length === 0}>
                    Continuer
                  </button>
                </>
              ) : (
                <>
                  {(!editingMaterial || selectedFields.includes('name')) && (
                    <div className="form-group">
                      <label>Désignation du Matériau</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Gravier 15/25 concassé"
                        value={matName}
                        onChange={(e) => setMatName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="form-row">
                    {(!editingMaterial || selectedFields.includes('minStockAlert')) && (
                      <div className="form-group">
                        <label>Seuil d'alerte (Quantité)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={matMin}
                          onChange={(e) => setMatMin(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    {(!editingMaterial || selectedFields.includes('unit')) && (
                      <div className="form-group">
                        <label>Unité de mesure</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="sacs, tonnes, m3"
                          value={matUnit}
                          onChange={(e) => setMatUnit(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                  {(!editingMaterial || selectedFields.includes('stock')) && (
                    <div className="form-group">
                      <label>{editingMaterial ? 'Stock Actuel' : 'Stock Initial'}</label>
                      <input
                        type="number"
                        className="form-input"
                        value={matStock}
                        onChange={(e) => setMatStock(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {editingMaterial ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditStep(1)}>
                        Retour
                      </button>
                      <button type="submit" className="btn btn-primary login-btn" style={{ flex: 2, margin: 0 }} disabled={submitting}>
                        {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                      {submitting ? 'Enregistrement...' : 'Créer l\'élément de stock'}
                    </button>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal 4 : Mouvement Stock */}
      {showMovModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Enregistrer Entrée / Sortie Stock</span>
              <button className="modal-close-btn" onClick={() => setShowMovModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleCreateMovement} className="login-form">
              <div className="form-group">
                <label>Matériau</label>
                <select
                  className="form-select"
                  value={movMatId}
                  onChange={(e) => setMovMatId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un intrant --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock actuel: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de mouvement</label>
                  <select
                    className="form-select"
                    value={movType}
                    onChange={(e) => setMovType(e.target.value)}
                    required
                  >
                    <option value="ENTREE">Entrée (Approvisionnement)</option>
                    <option value="SORTIE">Sortie (Utilisation sur site)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="10"
                    value={movQty}
                    onChange={(e) => setMovQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Chantier d'affectation (Optionnel)</label>
                <select
                  className="form-select"
                  value={movProjId}
                  onChange={(e) => setMovProjId(e.target.value)}
                >
                  <option value="">-- Aucun (Stockage entrepôt) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Motif / Commentaire</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Coulage dalle niveau 1"
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Validation...' : 'Valider le mouvement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5 : Inviter / Modifier Collaborateur */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">{editingUser ? 'Modifier l\'utilisateur' : 'Créer Collaborateur ou Client'}</span>
              <button className="modal-close-btn" onClick={() => setShowUserModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={editingUser && editStep === 1 ? (e) => { e.preventDefault(); setEditStep(2); } : handleUserSubmit} className="login-form">
              {editingUser && editStep === 1 ? (
                <>
                  <div className="form-group">
                    <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Choisissez les informations que vous souhaitez modifier :</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', margin: '1rem 0' }}>
                      {[
                        { key: 'firstName', label: 'Prénom' },
                        { key: 'lastName', label: 'Nom' },
                        { key: 'email', label: 'Adresse Email' },
                        { key: 'phone', label: 'Téléphone' },
                        { key: 'role', label: 'Rôle' },
                        { key: 'password', label: 'Mot de passe' }
                      ].map((item) => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <input type="checkbox" checked={selectedFields.includes(item.key)} onChange={() => toggleField(item.key)} />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary login-btn" disabled={selectedFields.length === 0}>
                    Continuer
                  </button>
                </>
              ) : (
                <>
                  <div className="form-row">
                    {(!editingUser || selectedFields.includes('firstName')) && (
                      <div className="form-group">
                        <label>Prénom</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Yaovi"
                          value={usrFirstName}
                          onChange={(e) => setUsrFirstName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    {(!editingUser || selectedFields.includes('lastName')) && (
                      <div className="form-group">
                        <label>Nom</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Mensah"
                          value={usrLastName}
                          onChange={(e) => setUsrLastName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                  {(!editingUser || selectedFields.includes('email')) && (
                    <div className="form-group">
                      <label>Adresse Email (facultative si le téléphone est renseigné)</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="nom@exemple.com"
                        value={usrEmail}
                        onChange={(e) => setUsrEmail(e.target.value)}
                      />
                    </div>
                  )}
                  {(!editingUser || selectedFields.includes('phone')) && (
                    <div className="form-group">
                      <label>Téléphone (obligatoire si l'email n'est pas renseigné)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="+228 90 00 00 00"
                        value={usrPhone}
                        onChange={(e) => setUsrPhone(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="form-row">
                    {(!editingUser || selectedFields.includes('role')) && (
                      <div className="form-group">
                        <label>Rôle</label>
                        <select
                          className="form-select"
                          value={usrRole}
                          onChange={(e) => setUsrRole(e.target.value)}
                          required
                        >
                          <option value="WORKER">Ouvrier (Maçon, Plombier...)</option>
                          <option value="TEAM_LEADER">Chef d'équipe</option>
                          <option value="CLIENT">Client propriétaire</option>
                        </select>
                      </div>
                    )}
                    {(!editingUser || selectedFields.includes('password')) && (
                      <div className="form-group">
                        <label>Mot de passe {editingUser ? 'facultatif' : 'initial'}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={usrPassword}
                          placeholder={editingUser ? 'Laisser vide pour ne pas changer' : ''}
                          onChange={(e) => setUsrPassword(e.target.value)}
                          required={!editingUser}
                        />
                      </div>
                    )}
                  </div>
                  {editingUser ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditStep(1)}>
                        Retour
                      </button>
                      <button type="submit" className="btn btn-primary login-btn" style={{ flex: 2, margin: 0 }} disabled={submitting}>
                        {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                      {submitting ? 'Enregistrement...' : 'Ajouter l\'utilisateur'}
                    </button>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal 6 : Créer Devis / Facture */}
      {/* Modal 6 : Créer / Modifier Devis / Facture */}
      {showDocModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">{editingDocument ? 'Modifier le document' : 'Créer Devis / Facture'}</span>
              <button className="modal-close-btn" onClick={() => setShowDocModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={editingDocument && editStep === 1 ? (e) => { e.preventDefault(); setEditStep(2); } : handleDocumentSubmit} className="login-form">
              {editingDocument && editStep === 1 ? (
                <>
                  <div className="form-group">
                    <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Choisissez les informations que vous souhaitez modifier :</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', margin: '1rem 0' }}>
                      {[
                        { key: 'title', label: 'Intitulé du document' },
                        { key: 'type', label: 'Type de document' },
                        { key: 'amount', label: 'Montant' },
                        { key: 'devisId', label: 'Devis Associé' },
                        { key: 'file', label: 'Fichier PDF' }
                      ].map((item) => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <input type="checkbox" checked={selectedFields.includes(item.key)} onChange={() => toggleField(item.key)} />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary login-btn" disabled={selectedFields.length === 0}>
                    Continuer
                  </button>
                </>
              ) : (
                <>
                  {!editingDocument && (
                    <div className="form-group">
                      <label>Chantier</label>
                      <select
                        className="form-select"
                        value={docProjId}
                        onChange={(e) => setDocProjId(e.target.value)}
                        required
                      >
                        <option value="">-- Sélectionner un chantier --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(!editingDocument || selectedFields.includes('title')) && (
                    <div className="form-group">
                      <label>Intitulé du document</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Devis Second Œuvre"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="form-row">
                    {(!editingDocument || selectedFields.includes('type')) && (
                      <div className="form-group">
                        <label>Type de document</label>
                        <select
                          className="form-select"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          required
                        >
                          <option value="DEVIS">Devis</option>
                          <option value="FACTURE">Facture</option>
                        </select>
                      </div>
                    )}
                    {(!editingDocument || selectedFields.includes('amount')) && (
                      <div className="form-group">
                        <label>Montant (FCFA) (Optionnel)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="form-input"
                          placeholder="1200000"
                          value={docAmount}
                          onChange={(e) => setDocAmount(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  {(!editingDocument || selectedFields.includes('devisId')) && docType === 'FACTURE' && docProjId && (
                    <div className="form-group">
                      <label>Devis Associé (Optionnel)</label>
                      <select
                        className="form-select"
                        value={docDevisId}
                        onChange={(e) => setDocDevisId(e.target.value)}
                      >
                        <option value="">-- Aucun devis --</option>
                        {documents
                          .filter((d: any) => d.projectId === docProjId && d.type === 'DEVIS')
                          .map((d: any) => {
                            const devisAmount = d.amount;
                            return (
                              <option key={d.id} value={d.id}>
                                {d.title} ({devisAmount.toLocaleString()} FCFA)
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}
                  {(!editingDocument || selectedFields.includes('file')) && (
                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label>Fichier PDF Associé (optionnel)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="form-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setDocFileBase64(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setDocFileBase64('');
                          }
                        }}
                      />
                    </div>
                  )}
                  {editingDocument ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditStep(1)}>
                        Retour
                      </button>
                      <button type="submit" className="btn btn-primary login-btn" style={{ flex: 2, margin: 0 }} disabled={submitting}>
                        {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                      {submitting ? 'Enregistrement...' : 'Enregistrer le document'}
                    </button>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal 7 : Enregistrer un Paiement */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Enregistrer un Paiement Client</span>
              <button className="modal-close-btn" onClick={() => setShowPayModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleCreatePayment} className="login-form">
              <div className="form-group">
                <label>Chantier Concerné</label>
                <select
                  className="form-select"
                  value={payProjId}
                  onChange={(e) => setPayProjId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un chantier --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {payProjId && (
                <div className="form-group">
                  <label>Associer à une facture impayée (Optionnel)</label>
                  <select
                    className="form-select"
                    value={payFactureId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPayFactureId(val);
                      if (val) {
                        const actualId = val.replace(/^doc-/, '');
                        const selectedDoc = documents.find((d: any) => d.id === actualId);
                        if (selectedDoc) {
                          setPayTitle(selectedDoc.title);
                          const reste = selectedDoc.amount - (selectedDoc.paidAmount || 0);
                          setPayAmount(reste.toString());
                        }
                      } else {
                        setPayTitle('');
                        setPayAmount('');
                      }
                    }}
                  >
                    <option value="">-- Créer un nouveau paiement libre --</option>
                    {documents
                      .filter((doc: any) => doc.projectId === payProjId && doc.type === 'FACTURE' && doc.status !== 'PAYE')
                      .map((doc: any) => (
                        <option key={`doc-${doc.id}`} value={`doc-${doc.id}`}>
                          📄 Facture : {doc.title} - {doc.amount.toLocaleString()} FCFA ({doc.status === 'PAYE_CLIENT' ? 'Déclaré par client' : doc.status === 'PAYE_PARTIEL' ? 'Payé partiel' : 'En attente'})
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {payFactureId && (() => {
                const actualId = payFactureId.replace(/^doc-/, '');
                const selectedDoc = documents.find((d: any) => d.id === actualId);
                if (!selectedDoc) return null;
                const reste = selectedDoc.amount - (selectedDoc.paidAmount || 0);
                return (
                  <div className="glass-panel" style={{ padding: '12px', marginTop: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Montant total de la facture :</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedDoc.amount.toLocaleString()} FCFA</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Déjà payé :</span>
                      <strong style={{ color: 'var(--status-success)' }}>{(selectedDoc.paidAmount || 0).toLocaleString()} FCFA</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', fontWeight: '700' }}>
                      <span>Reste à payer :</span>
                      <span style={{ color: 'var(--accent)' }}>{reste.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                );
              })()}
              <div className="form-group">
                <label>Objet du règlement / Acompte</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Acompte de démarrage 30%"
                  value={payTitle}
                  onChange={(e) => setPayTitle(e.target.value)}
                  required
                  readOnly={!!payFactureId}
                  style={payFactureId ? { backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' } : {}}
                />
              </div>
              <div className="form-group">
                <label>Montant du versement (FCFA)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  placeholder="Ex: 1500000"
                  value={payAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (payFactureId) {
                      const selectedDoc = documents.find((d: any) => d.id === payFactureId);
                      if (selectedDoc) {
                        const reste = selectedDoc.amount - (selectedDoc.paidAmount || 0);
                        if (val > reste) {
                          setErrorMsg(`Le versement ne peut pas dépasser le reste à payer de ${reste.toLocaleString()} FCFA.`);
                        } else {
                          setErrorMsg('');
                        }
                      }
                    }
                    setPayAmount(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-input"
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  required
                >
                  <option value="ACHATS">Achats</option>
                  <option value="MAIN_DOEUVRE">Main d'œuvre</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer le Paiement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8 : Modifier le Plan (Superadmin) */}
      {showSuperadminModal && editingPlan && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Modifier le Plan : {editingPlan.planName}</span>
              <button className="modal-close-btn" onClick={() => setShowSuperadminModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handlePlanSubmit} className="login-form">
              <div className="form-group">
                <label>Nom du Plan</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingPlan.planName}
                  disabled
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tarif Mensuel (FCFA)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 5000"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Durée (jours)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 30"
                    value={planDurationDays}
                    onChange={(e) => setPlanDurationDays(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Max Chantiers</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 10"
                    value={planMaxProjects}
                    onChange={(e) => setPlanMaxProjects(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre Max Collaborateurs</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 15"
                    value={planMaxUsers}
                    onChange={(e) => setPlanMaxUsers(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label style={{ marginBottom: '8px', display: 'block' }}>Fonctionnalités incluses</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['GEOLOCALISATION', 'MATERIAUX', 'DOCUMENTS', 'PDF'].map((feature) => {
                    const isChecked = planFeatures.includes(feature);
                    return (
                      <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPlanFeatures([...planFeatures, feature]);
                            } else {
                              setPlanFeatures(planFeatures.filter((f) => f !== feature));
                            }
                          }}
                        />
                        <span>{feature}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-btn" style={{ marginTop: '16px' }} disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal Créer un Plan (Superadmin) */}
      {showCreatePlanModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">✨ Créer un nouveau Plan</span>
              <button className="modal-close-btn" onClick={() => { setShowCreatePlanModal(false); resetCreatePlanForm(); }}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleCreatePlanSubmit} className="login-form">
              <div className="form-group">
                <label>Nom du Plan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: ENTERPRISE, STARTER…"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Sera automatiquement mis en majuscules. Les espaces deviennent des _.
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tarif Mensuel (FCFA)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 10000"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Durée (jours)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 30"
                    value={planDurationDays}
                    onChange={(e) => setPlanDurationDays(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Max Chantiers</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 20 (9999 = Illimité)"
                    value={planMaxProjects}
                    onChange={(e) => setPlanMaxProjects(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Nombre Max Collaborateurs</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 30 (9999 = Illimité)"
                    value={planMaxUsers}
                    onChange={(e) => setPlanMaxUsers(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ marginBottom: '8px', display: 'block' }}>Fonctionnalités incluses</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['GEOLOCALISATION', 'MATERIAUX', 'DOCUMENTS', 'PDF'].map((feature) => {
                    const isChecked = planFeatures.includes(feature);
                    return (
                      <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPlanFeatures([...planFeatures, feature]);
                            } else {
                              setPlanFeatures(planFeatures.filter((f) => f !== feature));
                            }
                          }}
                        />
                        <span>{feature}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-btn" style={{ marginTop: '16px' }} disabled={submitting}>
                {submitting ? 'Création...' : 'Créer ce Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Impression Devis/Facture (Simulation Premium) */}
      {showPrintModal && printDoc && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '750px', padding: '0', color: '#000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--steel-border)', color: 'var(--text-primary)' }}>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-title)' }}>Générateur de PDF</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={triggerBrowserPrint} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Printer size={14} /> Imprimer / Exporter PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Fermer
                </button>
              </div>
            </div>

            <div id="print-section" style={{ padding: '50px', background: '#FFF', color: '#000', fontFamily: 'sans-serif', minHeight: '550px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {printDoc.company.logoUrl ? (
                    <img 
                      src={printDoc.company.logoUrl} 
                      alt="Logo" 
                      style={{ height: '56px', maxWidth: '140px', objectFit: 'contain' }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '20px', border: '1px solid var(--steel-border)' }}>
                      {printDoc.company.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 style={{ fontSize: '22px', margin: 0, color: '#333', fontFamily: 'var(--font-title)', fontWeight: 'bold' }}>{printDoc.company.name}</h1>
                    {printDoc.company.nif && (
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginTop: '2px' }}>
                        NIF : {printDoc.company.nif}
                      </div>
                    )}
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                      {printDoc.company.address}<br />
                      Tél: {printDoc.company.phone} | Email: {printDoc.company.email}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {printDoc.document.type}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                    Date : {new Date(printDoc.document.createdAt).toLocaleDateString()}<br />
                    Réf : HTS/DG/{new Date(printDoc.document.createdAt).toLocaleDateString().replace(/\//g, '')}-{printDoc.document.id.substring(0, 4).toUpperCase()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '30px 0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Destinataire</span>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>Client Propriétaire</div>
                  <div style={{ fontSize: '13px', color: '#444' }}>Chantier : {printDoc.document.project?.name}</div>
                  <div style={{ fontSize: '13px', color: '#444' }}>Objet : {printDoc.document.title}</div>
                </div>
              </div>

              {/* Tableau d'articles */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px' }}>Description des prestations</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '13px' }}>Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #EEE' }}>
                    <td style={{ padding: '15px 0', fontSize: '13px' }}>
                      <strong>{printDoc.document.title}</strong><br />
                      <span style={{ fontSize: '11px', color: '#666' }}>Prestations globales de construction suivant cahier des charges chantier.</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '15px 0', fontWeight: 'bold', fontSize: '14px' }}>
                      {printDoc.document.amount.toLocaleString()} FCFA
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                <div style={{ width: '280px', borderTop: '2px solid #333', paddingTop: '10px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                    <span>TOTAL GÉNÉRAL :</span>
                    <span>{printDoc.document.amount.toLocaleString()} FCFA</span>
                  </div>
                  {printDoc.document.type === 'FACTURE' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--status-success)', marginTop: '4px' }}>
                        <span>Payé :</span>
                        <span>{(printDoc.document.paidAmount || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: 'var(--status-danger)', marginTop: '4px', borderTop: '1px dashed #ccc', paddingTop: '4px' }}>
                        <span>Reste à payer :</span>
                        <span>{Math.max(0, printDoc.document.amount - (printDoc.document.paidAmount || 0)).toLocaleString()} FCFA</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {printDoc.document.type === 'DEVIS' ? (
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Signature de l'entreprise */}
                  <div style={{ width: '200px', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', color: '#666', borderBottom: '1px solid #CCC', display: 'block', paddingBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Signature de l'Entreprise
                    </span>
                    <div style={{ height: '70px', marginTop: '10px', fontSize: '12px', fontStyle: 'italic', color: '#999' }}>
                      Pour accord (Nom & cachet) :
                    </div>
                  </div>

                  {/* Signature du client */}
                  <div style={{ width: '250px', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', color: '#666', borderBottom: '1px solid #CCC', display: 'block', paddingBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Signature du Client
                    </span>
                    <div style={{ height: '70px', marginTop: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: '#555' }}>
                      <span>Mention manuscrite "Bon pour accord" :</span>
                      <span>Date : ____ / ____ / ________</span>
                    </div>
                  </div>
                </div>
              ) : (
                printDoc.document.clientSignature && (
                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <span style={{ fontSize: '11px', color: '#666', borderBottom: '1px solid #CCC', display: 'block', paddingBottom: '4px' }}>
                        Signature Client Validée
                      </span>
                      <div style={{ height: '70px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={printDoc.document.clientSignature}
                          alt="Signature client imprimable"
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <span style={{ fontSize: '9px', color: '#888' }}>
                        Le {new Date(printDoc.document.signedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div style={{ marginTop: '50px', borderTop: '1px solid #DDD', paddingTop: '15px', textAlign: 'center', fontSize: '11px', color: '#777', fontStyle: 'italic' }}>
                Tous les documents sont établis par {printDoc.company.name}. Engineering services. More people; one team.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 9 : Détails du Règlement (Recettes) */}
      {selectedPaymentDetail && (
        <div className="modal-overlay" style={{ zIndex: 9500 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '550px', width: '100%' }}>
            <div className="modal-header">
              <span className="modal-title">🔍 Détails du Règlement</span>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setSelectedPaymentDetail(null);
                  loadDashboardData(); // Refresh parent view when closed
                }}
              >
                <X size={18} />
              </button>
            </div>

            {detailError && (
              <div className="login-error" style={{ marginBottom: '16px' }}>{detailError}</div>
            )}
            {detailSuccess && (
              <div className="alert alert-success" style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.25)', fontSize: '13px', marginBottom: '16px' }}>
                {detailSuccess}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Infos générales */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>
                  {selectedPaymentDetail.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Chantier : <strong>{selectedPaymentDetail.project?.name}</strong></span>
                  <span>Date d'émission : {new Date(selectedPaymentDetail.createdAt).toLocaleDateString()}</span>
                  {selectedPaymentDetail.devisId && (
                    <span>
                      Devis lié : <strong style={{ color: 'var(--primary)' }}>
                        {documents.find((d: any) => d.id === selectedPaymentDetail.devisId)?.title || 'Devis'}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Ravitaillement financier & progression */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Répartition des Règlements
                </span>
                
                {/* Barre de progression premium */}
                {(() => {
                  const total = selectedPaymentDetail.amount;
                  const paid = selectedPaymentDetail.paidAmount || 0;
                  const declared = (selectedPaymentDetail.status === 'PAYE_CLIENT') ? (selectedPaymentDetail.declaredPaidAmount || 0) : 0;
                  const remaining = Math.max(0, total - paid - declared);

                  const pctPaid = Math.min(100, (paid / total) * 100);
                  const pctDeclared = Math.min(100 - pctPaid, (declared / total) * 100);
                  const pctRemaining = Math.max(0, 100 - pctPaid - pctDeclared);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--steel-border)' }}>
                        {pctPaid > 0 && (
                          <div style={{ width: `${pctPaid}%`, background: 'var(--status-success)', transition: 'width 0.3s ease' }} title={`Encaissé : ${pctPaid.toFixed(1)}%`} />
                        )}
                        {pctDeclared > 0 && (
                          <div style={{ width: `${pctDeclared}%`, background: 'var(--status-pending)', transition: 'width 0.3s ease' }} title={`Déclaré : ${pctDeclared.toFixed(1)}%`} />
                        )}
                        {pctRemaining > 0 && (
                          <div style={{ width: `${pctRemaining}%`, background: 'transparent', transition: 'width 0.3s ease' }} title={`Reste à régler : ${pctRemaining.toFixed(1)}%`} />
                        )}
                      </div>
                      
                      {/* Chiffres détaillés */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--status-success)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Encaissé</div>
                          <div style={{ fontSize: '13px', fontWeight: '850', color: 'var(--status-success)' }}>{paid.toLocaleString()} F</div>
                        </div>
                        <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--status-pending)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>En attente</div>
                          <div style={{ fontSize: '13px', fontWeight: '850', color: 'var(--status-pending)' }}>{declared.toLocaleString()} F</div>
                        </div>
                        <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--status-danger)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Reste à payer</div>
                          <div style={{ fontSize: '13px', fontWeight: '850', color: 'var(--status-danger)' }}>{Math.max(0, total - paid).toLocaleString()} F</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Historique/Détail des paiements partiels */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--steel-border)', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Historique des Règlements (1 à 1)
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Montant total de la facture :</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedPaymentDetail.amount.toLocaleString()} FCFA</strong>
                  </div>

                  {(!selectedPaymentDetail.payments || selectedPaymentDetail.payments.length === 0) ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                      Aucun versement n'a encore été enregistré pour cette facture.
                    </p>
                  ) : (
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
                      {selectedPaymentDetail.payments.map((p: any, index: number) => {
                        const isValide = p.status === 'VALIDE';
                        return (
                          <li
                            key={p.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '11.5px',
                              padding: '8px 10px',
                              background: isValide ? 'var(--status-success-soft)' : 'var(--status-pending-soft)',
                              border: `1px solid ${isValide ? 'rgba(16,185,129,0.2)' : 'rgba(217,119,6,0.2)'}`,
                              borderRadius: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>
                                Versement #{selectedPaymentDetail.payments.length - index}
                              </strong>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                {new Date(p.createdAt).toLocaleString()}
                              </span>
                              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Enregistré par : {p.createdByUser ? `${p.createdByUser.firstName} ${p.createdByUser.lastName}` : 'Système'}
                                {isValide && p.validatedByUser && ` · Confirmé par : ${p.validatedByUser.firstName} ${p.validatedByUser.lastName}`}
                              </span>
                              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                {p.type === 'MAIN_DOEUVRE' ? "👷 Main d'œuvre" : '🛒 Achats'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                              <strong style={{ color: isValide ? 'var(--status-success)' : 'var(--status-pending)', fontSize: '12.5px' }}>
                                + {p.amount.toLocaleString()} F
                              </strong>
                              <span
                                className={`badge badge-${isValide ? 'success' : 'pending'}`}
                                style={{ fontSize: '8.5px', padding: '1px 4px', textTransform: 'uppercase' }}
                              >
                                {isValide ? 'Encaissé' : 'En attente'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Section Actions : Validation Versement Client */}
              {selectedPaymentDetail.status === 'PAYE_CLIENT' && selectedPaymentDetail.declaredPaidAmount > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--status-pending)' }}>
                    ⏳ Action requise : Valider la déclaration de versement
                  </span>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Le client déclare avoir versé la somme de <strong>{selectedPaymentDetail.declaredPaidAmount.toLocaleString()} FCFA</strong>. Veuillez confirmer la bonne réception de ces fonds.
                  </p>
                  <button
                    type="button"
                    className="btn btn-cta"
                    style={{ width: '100%', padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}
                    onClick={handleValidateClientPayment}
                  >
                    ✓ Valider le versement de {selectedPaymentDetail.declaredPaidAmount.toLocaleString()} F
                  </button>
                </div>
              )}

              {/* Section Actions : Enregistrement Paiement Manuel */}
              {selectedPaymentDetail.amount - selectedPaymentDetail.paidAmount > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                    Enregistrer un Règlement Partiel Manuel
                  </span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                    Enregistrez directement tout versement partiel ou solde perçu (espèces, virement, Mobile Money).
                  </p>
                  
                  <form onSubmit={handleRecordManualPayment} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Montant encaissé (FCFA)</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max={selectedPaymentDetail.amount - selectedPaymentDetail.paidAmount}
                        className="form-input"
                        placeholder="Ex: 50000"
                        value={manualPayAmount}
                        onChange={(e) => {
                          setManualPayAmount(e.target.value);
                          setDetailError('');
                        }}
                        style={{ height: '38px', padding: '6px 12px', fontSize: '13px' }}
                        required
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Type</label>
                      <select
                        className="form-input"
                        value={manualPayType}
                        onChange={(e) => setManualPayType(e.target.value)}
                        style={{ height: '38px', padding: '6px 12px', fontSize: '13px' }}
                        required
                      >
                        <option value="ACHATS">Achats</option>
                        <option value="MAIN_DOEUVRE">Main d'œuvre</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: '38px', padding: '0 16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center' }}
                    >
                      Enregistrer
                    </button>
                  </form>
                  
                  {/* Raccourci pour tout régler */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '600' }}
                      onClick={() => {
                        const remaining = selectedPaymentDetail.amount - selectedPaymentDetail.paidAmount;
                        setManualPayAmount(remaining.toString());
                        setDetailError('');
                      }}
                    >
                      Saisir le solde restant ({(selectedPaymentDetail.amount - selectedPaymentDetail.paidAmount).toLocaleString()} F)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
