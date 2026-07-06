import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Calendar,
  Users,
  DollarSign,
  Camera,
  FileText,
  Clock,
  Plus,
  Trash,
  Printer,
  Hammer,
  AlertCircle,
  X,
  Wallet,
  MapPin,
  Download,
} from 'lucide-react';
import api from '../api';
import DataTable from '../components/DataTable';
import './ProjectDetail.css';
import { DatePicker } from '../components/DatePicker';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [companyPlan, setCompanyPlan] = useState('FREE');
  const [userRole, setUserRole] = useState('COMPANY_ADMIN');
  const [materials, setMaterials] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Erreur chargement collaborateurs', err);
    }
  };

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('CIMENT');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState('');

  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('FACTURE');
  const [docAmount, setDocAmount] = useState('');

  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoType, setPhotoType] = useState('QUOTIDIEN');
  const [photoComment, setPhotoComment] = useState('');

  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [moveMatId, setMoveMatId] = useState('');
  const [moveType, setMoveType] = useState('SORTIE');
  const [moveQty, setMoveQty] = useState('');
  const [moveReason, setMoveReason] = useState('');

  // État Impression
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [premiumAlert, setPremiumAlert] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [expBeneficiaryId, setExpBeneficiaryId] = useState('');
  const [docFileBase64, setDocFileBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchCompanyPlan();
    fetchMaterials();
    fetchUsers();
    
    const userStr = localStorage.getItem('construction_user');
    if (userStr) {
      setUserRole(JSON.parse(userStr).role);
    }
  }, [projectId]);

  const fetchCompanyPlan = () => {
    const compStr = localStorage.getItem('construction_company');
    if (compStr) {
      setCompanyPlan(JSON.parse(compStr).subscriptionPlan);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (err) {
      console.error('Erreur chargement matériaux', err);
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
      setAssignedUserIds(response.data.assignments.map((as: any) => as.userId));
    } catch (err) {
      console.error('Erreur lors du chargement du chantier', err);
    } finally {
      setLoading(false);
    }
  };

  // Basculer le statut d'une tâche
  const toggleTaskStatus = async (task: any) => {
    let nextStatus = 'A_FAIRE';
    if (task.status === 'A_FAIRE') nextStatus = 'EN_COURS';
    else if (task.status === 'EN_COURS') nextStatus = 'TERMINE';

    try {
      await api.put(`/projects/${projectId}/tasks/${task.id}`, {
        status: nextStatus,
      });
      fetchProjectDetails();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tâche', err);
    }
  };

  // Ouvrir le modal d'affectation
  const openAssignModal = async () => {
    try {
      const response = await api.get('/users');
      setAvailableUsers(response.data);
      setShowAssignModal(true);
    } catch (err) {
      console.error('Erreur lors du chargement des collaborateurs', err);
    }
  };

  // Soumission Affectation Équipe
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/assign`, {
        userIds: assignedUserIds,
      });
      setShowAssignModal(false);
      fetchProjectDetails();
    } catch (err) {
      console.error('Erreur d\'affectation', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user assignment in checkbox list
  const toggleUserInList = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== userId));
    } else {
      setAssignedUserIds([...assignedUserIds, userId]);
    }
  };

  // Soumission Nouvelle Tâche
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!taskName) return;
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        name: taskName,
        dueDate: taskDueDate || undefined,
      });
      setShowAddTaskModal(false);
      setTaskName('');
      setTaskDueDate('');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers Edition / Suppression Dépense
  const openNewExpenseModal = () => {
    setEditingExpense(null);
    setExpAmount('');
    setExpCategory('CIMENT');
    setCustomCategory('');
    setExpDesc('');
    setExpDate('');
    setExpBeneficiaryId('');
    setErrorMsg('');
    setShowAddExpenseModal(true);
  };

  const startEditExpense = (exp: any) => {
    setEditingExpense(exp);
    setExpAmount(exp.amount.toString());
    if (!['CIMENT', 'SABLE', 'TRANSPORT', 'MAIN_DOEUVRE', 'AUTRE'].includes(exp.category)) {
      setExpCategory('CUSTOM');
      setCustomCategory(exp.category);
    } else {
      setExpCategory(exp.category);
      setCustomCategory('');
    }
    setExpDesc(exp.description);
    setExpDate(exp.date ? exp.date.substring(0, 10) : '');
    setExpBeneficiaryId(exp.beneficiaryId || '');
    setErrorMsg('');
    setShowAddExpenseModal(true);
  };

  const deleteExpense = async (id: string) => {
    if (window.confirm("Supprimer cette dépense ?")) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchProjectDetails();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const finalCategory = expCategory === 'CUSTOM' ? customCategory : expCategory;
    if (!finalCategory) {
      setErrorMsg('La catégorie est requise.');
      return;
    }

    if (expDate) {
      const selectedDate = new Date(expDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        setErrorMsg("La date de dépense ne peut pas être dans le futur.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        projectId,
        amount: parseFloat(expAmount),
        category: finalCategory,
        description: expDesc,
        date: expDate || undefined,
        beneficiaryId: finalCategory === 'MAIN_DOEUVRE' ? (expBeneficiaryId || null) : null,
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      setShowAddExpenseModal(false);
      setEditingExpense(null);
      setExpAmount('');
      setExpCategory('CIMENT');
      setCustomCategory('');
      setExpDesc('');
      setExpDate('');
      setExpBeneficiaryId('');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur d\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers Edition / Suppression Document
  const openNewDocumentModal = () => {
    setEditingDocument(null);
    setDocTitle('');
    setDocType('FACTURE');
    setDocAmount('');
    setDocFileBase64('');
    setErrorMsg('');
    setShowAddDocumentModal(true);
  };

  const startEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setDocTitle(doc.title);
    setDocType(doc.type);
    setDocAmount(doc.amount.toString());
    setDocFileBase64('');
    setErrorMsg('');
    setShowAddDocumentModal(true);
  };

  const deleteDocument = async (id: string) => {
    if (window.confirm("Supprimer ce document ?")) {
      try {
        await api.delete(`/documents/${id}`);
        fetchProjectDetails();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const payload = {
        projectId,
        title: docTitle,
        type: docType,
        amount: parseFloat(docAmount) || 0,
        pdfFile: docFileBase64 || undefined,
      };

      if (editingDocument) {
        await api.put(`/documents/${editingDocument.id}`, payload);
      } else {
        await api.post('/documents', payload);
      }

      setShowAddDocumentModal(false);
      setEditingDocument(null);
      setDocTitle('');
      setDocAmount('');
      setDocFileBase64('');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers Suppression Mouvement Stock
  const deleteMovement = async (id: string) => {
    if (window.confirm("Supprimer ce mouvement de stock ? Cela annulera son impact sur le stock global.")) {
      try {
        await api.delete(`/materials/movement/${id}`);
        fetchProjectDetails();
      } catch (err: any) {
        alert(err.response?.data?.error || "Erreur de suppression du mouvement.");
      }
    }
  };

  // Soumission Mouvement Stock
  const handleAddMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.post('/materials/movement', {
        materialId: moveMatId,
        projectId,
        type: moveType,
        quantity: parseFloat(moveQty),
        reason: moveReason,
      });
      setShowAddMovementModal(false);
      setMoveMatId('');
      setMoveQty('');
      setMoveReason('');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Mouvement invalide ou stock insuffisant.');
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion Photo de Suivi
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!photoBase64) {
      setErrorMsg('Veuillez sélectionner ou prendre une photo.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/progress', {
        projectId,
        photoUrl: photoBase64,
        type: photoType,
        comment: photoComment,
      });
      setShowAddPhotoModal(false);
      setPhotoBase64('');
      setPhotoComment('');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la publication.');
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

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <span>Chargement du chantier en cours...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '40px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ marginTop: '20px', color: 'var(--status-danger)' }}>Chantier introuvable.</div>
      </div>
    );
  }

  // Calculs financiers et d'avancement
  const completedTasksCount = project.tasks.filter((t: any) => t.status === 'TERMINE').length;
  const totalTasksCount = project.tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const totalSpent = project.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;
  const totalLaborSpent = project.expenses?.filter((e: any) => e.category === 'MAIN_DOEUVRE').reduce((sum: number, e: any) => sum + e.amount, 0) || 0;
  const totalMaterialsSpent = totalSpent - totalLaborSpent;

  const totalInvoiced = project.documents?.filter((d: any) => d.type === 'FACTURE').reduce((sum: number, d: any) => sum + d.amount, 0) || 0;
  const totalPaid = project.documents?.filter((d: any) => d.type === 'FACTURE').reduce((sum: number, d: any) => sum + (d.paidAmount || 0), 0) || 0;
  const totalDeclaredPending = project.documents?.filter((d: any) => d.type === 'FACTURE' && d.status === 'PAYE_CLIENT').reduce((sum: number, d: any) => sum + (d.declaredPaidAmount || 0), 0) || 0;
  const totalPendingInvoice = totalInvoiced - totalPaid;
  const projectCashBalance = totalPaid - totalSpent; // Trésorerie courante

  // Gain réel à ce stade (Recettes encaissées - Dépenses totales du chantier)
  const netEarnings = totalPaid - totalSpent;

  return (
    <div className="project-detail-content-wrapper">
      {/* Breadcrumb de navigation */}
      <div className="breadcrumb-nav">
        <span className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>
          Mes Chantiers
        </span>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">{project.name}</span>
      </div>

      {/* Entête du Projet */}
      <div className="project-detail-header" style={{ marginTop: '8px' }}>
        <div className="project-detail-title-section">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px' }}>
              <ArrowLeft size={16} />
            </button>
            <h2>{project.name}</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', marginLeft: '50px' }}>
            {project.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Caisse du Chantier</span>
            <span style={{ fontWeight: '800', fontSize: '18px', color: projectCashBalance >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
              {projectCashBalance.toLocaleString()} FCFA
            </span>
          </div>
          <span className={`badge badge-${project.status === 'EN_COURS' ? 'active' : 'success'}`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Onglets internes */}
      <div className="project-detail-tabs">
        <button
          className={`detail-tab-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tasks')}
        >
          Cahier des charges & Tâches ({progressPercent}%)
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'finances' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('finances')}
        >
          Suivi Financier & Bilan
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('materials')}
        >
          Approvisionnement Stock
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('progress')}
        >
          Photos ({project.progressLogs?.length || 0})
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('staff')}
        >
          Équipe assignée
        </button>
      </div>

      {/* ==========================================================================
         ONGLET 0 : VUE D'ENSEMBLE (TABLEAU DE BORD DU CHANTIER)
         ========================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="project-overview-grid animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cartes Métriques */}
          <div className="project-overview-metrics">
            {/* Caisse */}
            <div className="metric-card glass-panel">
              <div className="metric-card-header">
                <div className="metric-icon-wrapper green">
                  <Wallet size={20} />
                </div>
                <span className={`badge badge-${projectCashBalance >= 0 ? 'success' : 'danger'}`}>
                  {projectCashBalance >= 0 ? 'Disponible' : 'Déficit'}
                </span>
              </div>
              <div className="metric-card-body">
                <span className="metric-label">TRÉSORERIE DISPONIBLE (CAISSE)</span>
                <h2 className="metric-value" style={{ color: projectCashBalance >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {projectCashBalance.toLocaleString()} FCFA
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Reçu client: {totalPaid.toLocaleString()} F | Dépenses: {totalSpent.toLocaleString()} F
                </span>
              </div>
            </div>

            {/* Bénéfice / Gain Réel */}
            <div className="metric-card glass-panel">
              <div className="metric-card-header">
                <div className="metric-icon-wrapper blue">
                  <DollarSign size={20} />
                </div>
                <span className={`badge badge-${netEarnings >= 0 ? 'success' : 'danger'}`}>
                  {netEarnings >= 0 ? 'Bénéfice' : 'Déficit'}
                </span>
              </div>
              <div className="metric-card-body">
                <span className="metric-label">GAIN RÉEL (BÉNÉFICE)</span>
                <h2 className="metric-value" style={{ color: netEarnings >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {netEarnings.toLocaleString()} FCFA
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Calculé sur l'argent encaissé
                </span>
              </div>
            </div>

            {/* Progression */}
            <div className="metric-card glass-panel">
              <div className="metric-card-header">
                <div className="metric-icon-wrapper purple">
                  <Clock size={20} />
                </div>
                <span className="metric-tag blue">{completedTasksCount} / {totalTasksCount} tâches</span>
              </div>
              <div className="metric-card-body">
                <span className="metric-label">AVANCEMENT GLOBAL</span>
                <h2 className="metric-value">{progressPercent}%</h2>
                <div className="metric-progress-container">
                  <div className="metric-progress-bg">
                    <div className="metric-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Équipe */}
            <div className="metric-card glass-panel">
              <div className="metric-card-header">
                <div className="metric-icon-wrapper red">
                  <Users size={20} />
                </div>
                <span className="metric-tag gray">Ouvriers</span>
              </div>
              <div className="metric-card-body">
                <span className="metric-label">EQUIPE ASSIGNÉE</span>
                <h2 className="metric-value">{project.assignments?.length || 0} membres</h2>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Chefs de chantier & Ouvriers
                </span>
              </div>
            </div>
          </div>

          {/* Raccourcis d'actions (Admin seul) */}
          {userRole === 'COMPANY_ADMIN' && (
            <div className="dashboard-grid-card glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '800', marginBottom: '15px', color: 'var(--primary)' }}>
                Gestion Opérationnelle du Chantier
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
                Utilisez ces raccourcis pour alimenter la comptabilité, modifier les tâches et mettre à jour le stock en temps réel.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddTaskModal(true)}>
                  <Plus size={16} /> Ajouter une tâche
                </button>
                <button className="btn btn-primary" onClick={openNewExpenseModal}>
                  <Plus size={16} /> Log une Dépense
                </button>
                <button className="btn btn-cta" onClick={openNewDocumentModal}>
                  <Plus size={16} /> Nouvelle Facture / Devis
                </button>
                <button className="btn btn-outline" onClick={() => setShowAddMovementModal(true)}>
                  <Plus size={16} /> Sortie de Matériaux
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddPhotoModal(true)}>
                  <Camera size={16} /> Publier Photo Suivi
                </button>
              </div>
            </div>
          )}

          {/* Grid 2 colonnes : Checklist et Suivi photo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Checklist */}
            <div className="dashboard-grid-card glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--steel-border)', paddingBottom: '10px' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '15px', fontWeight: '700' }}>Tâches principales</h3>
                <button className="view-all-link" onClick={() => setActiveSubTab('tasks')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                  Voir tout
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {project.tasks.slice(0, 4).map((t: any) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--steel-border)' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600' }}>{t.name}</span>
                    <span className={`badge badge-${t.status === 'TERMINE' ? 'success' : t.status === 'EN_COURS' ? 'pending' : 'danger'}`}>
                      {t.status === 'TERMINE' ? 'Terminé' : t.status === 'EN_COURS' ? 'En cours' : 'À faire'}
                    </span>
                  </div>
                ))}
                {project.tasks.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                    Aucune tâche configurée.
                  </div>
                )}
              </div>
            </div>

            {/* Suivi Photo */}
            <div className="dashboard-grid-card glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--steel-border)', paddingBottom: '10px' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '15px', fontWeight: '700' }}>Photo de chantier récente</h3>
                <button className="view-all-link" onClick={() => setActiveSubTab('progress')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                  Journal photos
                </button>
              </div>
              {project.progressLogs && project.progressLogs.length > 0 ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', height: '170px', position: 'relative' }}>
                  <img src={project.progressLogs[0].photoUrl} alt="Suivi récent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'rgba(0, 0, 0, 0.7)', color: '#fff', fontSize: '12.5px' }}>
                    <strong>{project.progressLogs[0].takenBy?.firstName}: </strong> {project.progressLogs[0].comment || 'Aucun commentaire renseigné.'}
                  </div>
                </div>
              ) : (
                <div style={{ border: '2px dashed var(--steel-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '170px', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
                  <Camera size={36} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Aucune photo de suivi disponible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
         ONGLET 1 : TÂCHES CHECKLIST
         ========================================================================== */}
      {activeSubTab === 'tasks' && (
        <div className="tasks-list animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', fontWeight: '800' }}>MVP Checklist de Construction</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Cliquez sur le carré pour changer de statut (À faire → En cours → Terminé)
              </p>
            </div>
            {(userRole === 'COMPANY_ADMIN' || userRole === 'TEAM_LEADER') && (
              <button className="btn btn-primary" onClick={() => setShowAddTaskModal(true)}>
                <Plus size={16} /> Ajouter une Tâche
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {project.tasks.map((task: any) => {
              const isCompleted = task.status === 'TERMINE';
              const isInProgress = task.status === 'EN_COURS';

              return (
                <div key={task.id} className="task-row">
                  <div className="task-info">
                    <div
                      className={`task-checkbox-wrapper ${isCompleted ? 'completed' : ''}`}
                      onClick={() => toggleTaskStatus(task)}
                    >
                      {isCompleted ? (
                        <CheckSquare size={22} style={{ fill: 'var(--status-success-soft)' }} />
                      ) : isInProgress ? (
                        <Clock size={22} style={{ color: 'var(--status-pending)' }} />
                      ) : (
                        <Square size={22} />
                      )}
                    </div>
                    <span className={`task-name ${isCompleted ? 'completed' : ''}`}>{task.name}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className={`badge badge-${isCompleted ? 'success' : isInProgress ? 'pending' : 'danger'}`}>
                      {task.status === 'TERMINE' ? 'Terminé' : task.status === 'EN_COURS' ? 'En Cours' : 'À Faire'}
                    </span>
                    {(userRole === 'COMPANY_ADMIN' || userRole === 'TEAM_LEADER') && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px', minWidth: 'auto', background: 'transparent', border: 'none', color: 'var(--status-danger)' }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Supprimer cette tâche ?")) {
                            try {
                              await api.delete(`/projects/${projectId}/tasks/${task.id}`);
                              fetchProjectDetails();
                            } catch (err) {
                              console.error("Erreur suppression tâche", err);
                            }
                          }
                        }}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {project.tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--steel-border)' }}>
                Aucune tâche configurée sur ce projet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
         ONGLET 2 : SUIVI FINANCIER & BILAN
         ========================================================================== */}
      {activeSubTab === 'finances' && (
        <div className="finances-tab animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Bilan financier (Tableau récapitulatif) */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--steel-border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '800', marginBottom: '15px', color: 'var(--primary)' }}>
              Bilan Financier du Chantier
            </h3>
            
            <div className="project-overview-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {/* Recettes */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--steel-border)', padding: '16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Recettes (Client)</span>
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: 'var(--primary)' }}>
                  {totalPaid.toLocaleString()} FCFA
                </h4>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Sur {totalInvoiced.toLocaleString()} F facturés
                </span>
                {totalDeclaredPending > 0 && (
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--accent)', marginTop: '4px', fontWeight: 'bold' }}>
                    (+ {totalDeclaredPending.toLocaleString()} F en attente de validation)
                  </span>
                )}
              </div>

              {/* Main d'œuvre */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--steel-border)', padding: '16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Main d'œuvre (Paies)</span>
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: 'var(--status-danger)' }}>
                  -{totalLaborSpent.toLocaleString()} FCFA
                </h4>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Règlement ouvriers & chefs
                </span>
              </div>

              {/* Matériaux & Logistique */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--steel-border)', padding: '16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Matériaux / Autres</span>
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: 'var(--status-danger)' }}>
                  -{totalMaterialsSpent.toLocaleString()} FCFA
                </h4>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Ciment, sable, transport, etc.
                </span>
              </div>

              {/* Gain Net */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--steel-border)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid ' + (netEarnings >= 0 ? 'var(--status-success)' : 'var(--status-danger)') }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Bénéfice (Mon Gain)</span>
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: netEarnings >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {netEarnings.toLocaleString()} FCFA
                </h4>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Gain réel actuel ({netEarnings >= 0 ? 'Bénéficiaire' : 'Déficitaire'})
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'action financière */}
          {userRole === 'COMPANY_ADMIN' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={openNewExpenseModal}>
                <Plus size={16} /> Enregistrer une Dépense
              </button>
              <button className="btn btn-cta" onClick={openNewDocumentModal}>
                <Plus size={16} /> Créer Facture / Devis
              </button>
            </div>
          )}

          {/* 1. Recettes et Paiements */}
          <DataTable
            title="1. Factures & Devis du Chantier"
            subtitle="Suivi des devis de travaux et factures émises pour ce chantier"
            columns={[
              { key: 'title', label: 'Objet / Titre' },
              { key: 'type', label: 'Type' },
              { key: 'amount', label: 'Montant' },
              { key: 'status', label: 'Statut' },
              { key: 'date', label: 'Date' },
              { key: 'actions', label: 'Actions' },
            ]}
            data={project.documents}
            renderRow={(item) => {
              const isPaid = item.status === 'PAYE';
              const isDeclared = item.status === 'PAYE_CLIENT';
              const isPartial = item.status === 'PAYE_PARTIEL';
              const isSigned = item.status === 'SIGNE';

              const devisAmount = item.type === 'DEVIS'
                ? (item.amount || (item.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0))
                : item.amount;

              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600' }}>
                    <div>{item.title}</div>
                    {item.type === 'FACTURE' && item.devisId && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 'normal' }}>
                        Liée au Devis : {project.documents?.find((d: any) => d.id === item.devisId)?.title || '—'}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${item.type === 'DEVIS' ? 'active' : 'info'}`}>
                      {item.type === 'DEVIS' ? 'Devis' : 'Facture'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: '700' }}>{devisAmount.toLocaleString()} FCFA</div>
                    {item.type === 'FACTURE' && item.status !== 'PAYE' && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Payé : {item.paidAmount?.toLocaleString() || 0} | Reste : {Math.max(0, item.amount - (item.paidAmount || 0)).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td>
                    {item.type === 'DEVIS' ? (
                      <span className={`badge badge-${isPaid ? 'success' : isSigned ? 'success' : 'pending'}`}>
                        {isPaid ? '✓ Payé' : isSigned ? '✓ Signé' : '⏳ En attente'}
                      </span>
                    ) : (
                      <span className={`badge badge-${isPaid ? 'success' : isPartial ? 'warning' : isDeclared ? 'pending' : 'pending'}`}>
                        {isPaid ? 'Payé' : isPartial ? 'Payé partiel' : isDeclared ? 'Déclaré (Client)' : 'En attente'}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handlePrintPDF(item.id)}
                      >
                        <Printer size={12} /> Générer PDF
                      </button>

                      {item.pdfUrl && (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={12} /> PDF Original
                        </a>
                      )}

                      {isDeclared && (userRole === 'COMPANY_ADMIN' || userRole === 'TEAM_LEADER') && (
                        <button
                          className="btn btn-cta"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={async () => {
                            try {
                              await api.put(`/documents/${item.id}/status`, { status: 'PAYE' });
                              fetchProjectDetails();
                            } catch (err) {
                              console.error("Erreur de validation", err);
                            }
                          }}
                        >
                          Valider versement ({item.declaredPaidAmount?.toLocaleString()} F)
                        </button>
                      )}
                      {userRole === 'COMPANY_ADMIN' && (
                        <>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => startEditDocument(item)}
                          >
                            Modifier
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => deleteDocument(item.id)}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }}
          />

          {/* 2. Main d'œuvre */}
          <DataTable
            title="2. Historique des Règlements Main d'œuvre"
            subtitle="Suivi des salaires et paiements versés aux ouvriers et chefs de chantier"
            columns={[
              { key: 'description', label: 'Bénéficiaire / Description' },
              { key: 'amount', label: 'Montant versé' },
              { key: 'status', label: 'Statut' },
              { key: 'date', label: 'Date' },
              { key: 'actions', label: 'Actions' },
            ]}
            data={project.expenses?.filter((e: any) => e.category === 'MAIN_DOEUVRE')}
            renderRow={(item) => {
              const isPaid = item.status === 'PAYE';
              const isDeclared = item.status === 'PAYE_CLIENT';
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600' }}>{item.description}</td>
                  <td style={{ fontWeight: '700', color: 'var(--status-danger)' }}>-{item.amount.toLocaleString()} FCFA</td>
                  <td>
                    <span className={`badge badge-${isPaid ? 'success' : isDeclared ? 'warning' : 'danger'}`}>
                      {isPaid ? 'Payé' : isDeclared ? 'Déclaré (Client)' : 'En attente'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isDeclared && userRole === 'COMPANY_ADMIN' && (
                        <button
                          className="btn btn-cta"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={async () => {
                            try {
                              await api.put(`/expenses/${item.id}/status`, { status: 'PAYE' });
                              fetchProjectDetails();
                            } catch (err) {
                              console.error("Erreur de validation", err);
                            }
                          }}
                        >
                          Valider
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => startEditExpense(item)}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => deleteExpense(item.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />

          {/* 3. Matériaux et Autres Dépenses */}
          <DataTable
            title="3. Historique des Achats Matériaux & Transports"
            subtitle="Suivi des dépenses d'approvisionnement en ciment, sable, transport, etc."
            columns={[
              { key: 'category', label: 'Matériel / Catégorie' },
              { key: 'description', label: 'Libellé de la dépense' },
              { key: 'amount', label: 'Montant' },
              { key: 'status', label: 'Statut' },
              { key: 'date', label: 'Date' },
              { key: 'actions', label: 'Actions' },
            ]}
            data={project.expenses?.filter((e: any) => e.category !== 'MAIN_DOEUVRE')}
            renderRow={(item) => {
              const isPaid = item.status === 'PAYE';
              const isDeclared = item.status === 'PAYE_CLIENT';
              return (
                <tr key={item.id}>
                  <td>
                    <span className={`badge ${item.category === 'CIMENT' ? 'badge-active' : item.category === 'SABLE' ? 'badge-warning' : 'badge-pending'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td>{item.description}</td>
                  <td style={{ fontWeight: '700', color: 'var(--status-danger)' }}>-{item.amount.toLocaleString()} FCFA</td>
                  <td>
                    <span className={`badge badge-${isPaid ? 'success' : isDeclared ? 'warning' : 'danger'}`}>
                      {isPaid ? 'Payé' : isDeclared ? 'Déclaré (Client)' : 'En attente'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isDeclared && userRole === 'COMPANY_ADMIN' && (
                        <button
                          className="btn btn-cta"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={async () => {
                            try {
                              await api.put(`/expenses/${item.id}/status`, { status: 'PAYE' });
                              fetchProjectDetails();
                            } catch (err) {
                              console.error("Erreur de validation", err);
                            }
                          }}
                        >
                          Valider
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => startEditExpense(item)}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => deleteExpense(item.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />

        </div>
      )}

      {/* ==========================================================================
         ONGLET 3 : MATÉRIAUX / APPROVISIONNEMENT
         ========================================================================== */}
      {activeSubTab === 'materials' && (
        <DataTable
          title="Mouvements de stock affectés à ce chantier"
          subtitle="Sorties de stock de ciment, sable, etc. utilisées sur le site"
          columns={[
            { key: 'material', label: 'Matériau' },
            { key: 'type', label: 'Mouvement' },
            { key: 'qty', label: 'Quantité' },
            { key: 'reason', label: 'Motif' },
            { key: 'date', label: 'Date' },
            { key: 'actions', label: 'Actions' },
          ]}
          data={project.movements}
          actions={
            userRole === 'COMPANY_ADMIN' && (
              <button className="btn btn-primary" onClick={() => setShowAddMovementModal(true)}>
                <Plus size={16} /> Enregistrer Sortie Stock
              </button>
            )
          }
          renderRow={(item) => (
            <tr key={item.id}>
              <td style={{ fontWeight: '600' }}>{item.material?.name}</td>
              <td>
                <span className={`badge badge-${item.type === 'ENTREE' ? 'success' : 'danger'}`}>
                  {item.type === 'ENTREE' ? 'Entrée' : 'Consommé'}
                </span>
              </td>
              <td style={{ fontWeight: '700' }}>
                {item.quantity} {item.material?.unit}
              </td>
              <td>{item.reason}</td>
              <td style={{ color: 'var(--text-secondary)' }}>
                {new Date(item.date).toLocaleDateString()}
              </td>
              <td>
                {userRole === 'COMPANY_ADMIN' && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                    onClick={() => deleteMovement(item.id)}
                  >
                    Supprimer
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      )}

      {/* ==========================================================================
         ONGLET 5 : TIMELINE PHOTOS SUIVI
         ========================================================================== */}
      {activeSubTab === 'progress' && (
        <div className="photos-tab animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', fontWeight: '800' }}>Journal de Suivi Photos</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Photos quotidiennes et d'étapes (avant/après) publiées par les ouvriers
              </p>
            </div>
            {(userRole === 'COMPANY_ADMIN' || userRole === 'TEAM_LEADER' || userRole === 'WORKER') && (
              <button className="btn btn-primary" onClick={() => setShowAddPhotoModal(true)}>
                <Plus size={16} /> Publier une Photo
              </button>
            )}
          </div>

          <div className="photos-grid">
            {project.progressLogs.map((log: any) => (
              <div key={log.id} className="photo-log-card glass-panel">
                <div className="photo-wrapper">
                  <img src={log.photoUrl} alt="Suivi chantier" />
                  <span className={`photo-type-badge badge ${log.type === 'AVANT' ? 'badge-info' : log.type === 'APRES' ? 'badge-success' : 'badge-warning'}`}>
                    {log.type === 'AVANT' ? 'Avant' : log.type === 'APRES' ? 'Après' : 'Journalière'}
                  </span>
                </div>

                <div className="photo-comment-box">
                  <p className="photo-comment-text">{log.comment}</p>
                  <div className="photo-footer">
                    <span>Par: {log.takenBy?.firstName} ({log.takenBy?.role === 'TEAM_LEADER' ? 'Chef' : log.takenBy?.role === 'COMPANY_ADMIN' ? 'Gérant' : 'Ouvrier'})</span>
                    <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {project.progressLogs?.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--steel-border)' }}>
                Aucune photo publiée pour le moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
         ONGLET 6 : ASSIGNATIONS D'ÉQUIPES
         ========================================================================== */}
      {activeSubTab === 'staff' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', fontWeight: '800' }}>Membres assignés au projet</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Équipe technique et clients autorisés à suivre le projet
              </p>
            </div>
            {userRole === 'COMPANY_ADMIN' && (
              <button className="btn btn-secondary" onClick={openAssignModal}>
                <Users size={16} /> Gérer les affectations
              </button>
            )}
          </div>

          <div className="assignments-list-container">
            {project.assignments.map((as: any) => (
              <div key={as.id} className="assignment-item-row">
                <div className="assignment-info">
                  <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '13px', fontWeight: 'bold' }}>
                    {as.user.firstName.charAt(0)}
                    {as.user.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="assignment-name">
                      {as.user.firstName} {as.user.lastName}
                    </div>
                    <div className="assignment-role" style={{ color: as.user.role === 'CLIENT' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {as.user.role === 'COMPANY_ADMIN' ? 'Gérant' : as.user.role === 'TEAM_LEADER' ? 'Chef de chantier' : as.user.role === 'CLIENT' ? 'Client Propriétaire' : 'Ouvrier'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Assigné le {new Date(as.assignedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {project.assignments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                Aucun collaborateur ou client assigné pour le moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
         MODALS DE L'ADMINISTRATION DU CHANTIER
         ========================================================================== */}

      {/* Modal 1: Gérer équipe */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <span className="modal-title">Gérer l'équipe du chantier</span>
              <button className="modal-close-btn" onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="login-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                {availableUsers.map((u) => (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--steel-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assignedUserIds.includes(u.id)}
                      onChange={() => toggleUserInList(u.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '13.5px' }}>
                        {u.firstName} {u.lastName}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {u.role === 'TEAM_LEADER' ? 'Chef de chantier' : u.role === 'CLIENT' ? 'Client' : 'Ouvrier'} — {u.email || u.phone}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button type="submit" className="btn btn-primary login-btn" style={{ marginTop: '15px' }} disabled={submitting}>
                {submitting ? 'Enregistrement...' : "Enregistrer l'équipe"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ajouter une tâche */}
      {showAddTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <span className="modal-title">Créer une Tâche Checklist</span>
              <button className="modal-close-btn" onClick={() => setShowAddTaskModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleAddTaskSubmit} className="login-form">
              <div className="form-group">
                <label>Nom de la prestation / Tâche</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Pose du carrelage salon"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date limite d'exécution (Optionnel)</label>
                <DatePicker
                  value={taskDueDate}
                  onChange={setTaskDueDate}
                />
              </div>
              <button type="submit" className="btn btn-primary login-btn" style={{ marginTop: '10px' }} disabled={submitting}>
                {submitting ? 'Création...' : 'Créer la Tâche'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Log une dépense */}
      {showAddExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Enregistrer une Dépense</span>
              <button className="modal-close-btn" onClick={() => setShowAddExpenseModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleAddExpenseSubmit} className="login-form">
              <div className="form-group">
                <label>Montant Dépense (FCFA)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-input"
                  placeholder="Ex: 350000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  className="form-select"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  required
                >
                  <option value="CIMENT">Achat de Ciment</option>
                  <option value="SABLE">Achat de Sable</option>
                  <option value="TRANSPORT">Frais de Transport</option>
                  <option value="MAIN_DOEUVRE">Main d'œuvre / Paie</option>
                  <option value="AUTRE">Autre dépense matériel</option>
                  <option value="CUSTOM">Autre / Nouvelle catégorie...</option>
                </select>
              </div>
              {expCategory === 'CUSTOM' && (
                <div className="form-group">
                  <label>Nom de la catégorie personnalisée</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Électricité, Peinture, etc."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                </div>
              )}
              {expCategory === 'MAIN_DOEUVRE' && (
                <div className="form-group">
                  <label>Bénéficiaire (Employé / Ouvrier)</label>
                  <select
                    className="form-select"
                    value={expBeneficiaryId}
                    onChange={(e) => setExpBeneficiaryId(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner le bénéficiaire --</option>
                    {users.filter((u: any) => u.role !== 'CLIENT').map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Description du matériel / Libellé / Bénéficiaire</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Achat de 50 sacs de ciment ou Paie journalière maçons"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de la dépense</label>
                <DatePicker
                  value={expDate}
                  onChange={setExpDate}
                />
              </div>
              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingExpense ? 'Modifier la Dépense' : 'Log Dépense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Créer Facture / Devis */}
      {showAddDocumentModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Créer Devis / Facture</span>
              <button className="modal-close-btn" onClick={() => setShowAddDocumentModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleAddDocumentSubmit} className="login-form">
              <div className="form-group">
                <label>Intitulé du document</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Devis Gros Oeuvre"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type de document</label>
                  <select
                    className="form-select"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    required
                  >
                    <option value="FACTURE">Facture (Demande paiement)</option>
                    <option value="DEVIS">Devis</option>
                  </select>
                </div>
                {true && (
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
              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingDocument ? 'Modifier le document' : 'Enregistrer le document'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Mouvement Matériau */}
      {showAddMovementModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <span className="modal-title">Enregistrer Sortie Matériau</span>
              <button className="modal-close-btn" onClick={() => setShowAddMovementModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleAddMovementSubmit} className="login-form">
              <div className="form-group">
                <label>Matériau</label>
                <select
                  className="form-select"
                  value={moveMatId}
                  onChange={(e) => setMoveMatId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un intrant --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock disponible: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de mouvement</label>
                  <select
                    className="form-select"
                    value={moveType}
                    onChange={(e) => setMoveType(e.target.value)}
                    required
                  >
                    <option value="SORTIE">Livrer du dépôt vers ce chantier (Diminue le stock global)</option>
                    <option value="ENTREE">Retourner le surplus du chantier au dépôt (Augmente le stock global)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="10"
                    value={moveQty}
                    onChange={(e) => setMoveQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motif / Commentaire</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Coulage poutres"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Validation...' : 'Valider le mouvement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Ajouter Photo */}
      {showAddPhotoModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <span className="modal-title">Publier une Photo de Suivi</span>
              <button className="modal-close-btn" onClick={() => setShowAddPhotoModal(false)}>
                <X size={18} />
              </button>
            </div>
            {errorMsg && <div className="login-error">{errorMsg}</div>}
            <form onSubmit={handleAddPhotoSubmit} className="login-form">
              <div className="form-group">
                <label>Sélectionner le fichier photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={handlePhotoFileChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type de suivi</label>
                <select
                  className="form-select"
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value)}
                  required
                >
                  <option value="QUOTIDIEN">Rapport quotidien / Photo du jour</option>
                  <option value="AVANT">État Avant travaux</option>
                  <option value="APRES">État Après travaux (Étape finie)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Commentaire de suivi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ferraillage terminé."
                  value={photoComment}
                  onChange={(e) => setPhotoComment(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
                {submitting ? 'Publication...' : 'Publier la Photo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Alerte Premium (Imprimer PDF) */}
      {premiumAlert && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
            <AlertCircle size={48} style={{ color: 'var(--accent)', margin: '0 auto' }} />
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', marginTop: '16px', fontWeight: '800' }}>
              Fonctionnalité Premium
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '12px 0 20px 0', lineHeight: '1.4' }}>
              La génération de rapports PDF imprimables est réservée aux entreprises sous plan **Premium** (15 000 FCFA/mois). 
              Veuillez mettre à jour votre formule d'abonnement.
            </p>
            <button className="btn btn-primary" onClick={() => setPremiumAlert(false)}>
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* Modal Impression Devis/Facture (Simulation Premium) */}
      {showPrintModal && printDoc && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '750px', padding: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--steel-border)' }}>
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
                  {printDoc.company.logoUrl && (
                    <img 
                      src={printDoc.company.logoUrl} 
                      alt="Logo" 
                      style={{ height: '56px', maxWidth: '140px', objectFit: 'contain' }} 
                    />
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

              {/* Tableau d'articles dynamique */}
              {printDoc.document.expenses && printDoc.document.expenses.length > 0 ? (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #333' }}>
                        <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', textTransform: 'uppercase' }}>N° / Description des postes</th>
                        <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', textTransform: 'uppercase' }}>Catégorie</th>
                        <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', textTransform: 'uppercase' }}>Total (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printDoc.document.expenses.map((e: any, idx: number) => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #EEE' }}>
                          <td style={{ padding: '12px 0', fontSize: '13px' }}>
                            <strong>{String(idx + 1).padStart(2, '0')}</strong> | {e.description}
                          </td>
                          <td style={{ padding: '12px 0', fontSize: '12px', color: '#666' }}>
                            {e.category === 'MAIN_DOEUVRE' ? '👷 Prestation / Main d\'œuvre' : `🛒 Achat matériel (${e.category})`}
                          </td>
                          <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600', fontSize: '13px' }}>
                            {e.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <table style={{ width: '320px', borderCollapse: 'collapse', borderTop: '2px solid #333' }}>
                      <tbody>
                        {printDoc.document.expenses.filter((e: any) => e.category !== 'MAIN_DOEUVRE').length > 0 && (
                          <tr>
                            <td style={{ padding: '8px 0', fontSize: '13px', color: '#555' }}>Total achat matériel</td>
                            <td style={{ textAlign: 'right', padding: '8px 0', fontSize: '13px', fontWeight: '600' }}>
                              {printDoc.document.expenses.filter((e: any) => e.category !== 'MAIN_DOEUVRE').reduce((s: number, e: any) => s + e.amount, 0).toLocaleString()} FCFA
                            </td>
                          </tr>
                        )}
                        {printDoc.document.expenses.filter((e: any) => e.category === 'MAIN_DOEUVRE').length > 0 && (
                          <tr>
                            <td style={{ padding: '8px 0', fontSize: '13px', color: '#555' }}>Total prestation main d'œuvre</td>
                            <td style={{ textAlign: 'right', padding: '8px 0', fontSize: '13px', fontWeight: '600' }}>
                              {printDoc.document.expenses.filter((e: any) => e.category === 'MAIN_DOEUVRE').reduce((s: number, e: any) => s + e.amount, 0).toLocaleString()} FCFA
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderTop: '1px solid #333' }}>
                          <td style={{ padding: '10px 0', fontSize: '14px', fontWeight: 'bold' }}>TOTAL GÉNÉRAL</td>
                          <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>
                            {(printDoc.document.type === 'DEVIS' ? (printDoc.document.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0) : printDoc.document.amount).toLocaleString()} FCFA
                          </td>
                        </tr>
                        {printDoc.document.type === 'FACTURE' && (
                          <>
                            <tr>
                              <td style={{ padding: '6px 0', fontSize: '12px', color: 'var(--status-success)' }}>Montant payé</td>
                              <td style={{ textAlign: 'right', padding: '6px 0', fontSize: '12px', fontWeight: '600', color: 'var(--status-success)' }}>
                                {(printDoc.document.paidAmount || 0).toLocaleString()} FCFA
                              </td>
                            </tr>
                            <tr style={{ borderTop: '1px dashed #ccc' }}>
                              <td style={{ padding: '8px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--status-danger)' }}>Reste à payer</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--status-danger)' }}>
                                {Math.max(0, printDoc.document.amount - (printDoc.document.paidAmount || 0)).toLocaleString()} FCFA
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
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
                          {(printDoc.document.type === 'DEVIS' ? (printDoc.document.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0) : printDoc.document.amount).toLocaleString()} FCFA
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                    <div style={{ width: '280px', borderTop: '2px solid #333', paddingTop: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                        <span>TOTAL GÉNÉRAL :</span>
                        <span>{(printDoc.document.type === 'DEVIS' ? (printDoc.document.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0) : printDoc.document.amount).toLocaleString()} FCFA</span>
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
                </>
              )}

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
    </div>
  );
};

export default ProjectDetail;
