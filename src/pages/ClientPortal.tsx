import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Camera,
  Layers,
  Printer,
  ChevronRight,
  Download,
  CreditCard,
  X,
} from 'lucide-react';
import api from '../api';
import Header from '../components/Header';
import SignaturePad from '../components/SignaturePad';
import './ClientPortal.css';

interface ClientPortalProps {
  projectId: string;
  onBack: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [companyPlan, setCompanyPlan] = useState('FREE');

  // État Impression
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [premiumAlert, setPremiumAlert] = useState(false);

  // État Paiement Partiel Client
  const [paymentModalItem, setPaymentModalItem] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('ACHATS');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // État Paiement Mobile Money (FedaPay) — mode par défaut de la fenêtre de versement.
  // Aucune redirection : un push USSD est envoyé sur le téléphone, et c'est le webhook
  // FedaPay (côté serveur) qui confirme le paiement. Ici on ne fait que du polling d'affichage.
  const [paymentMode, setPaymentMode] = useState<'mobile_money' | 'manual'>('mobile_money');
  const [mmProvider, setMmProvider] = useState<'togocel' | 'moov_tg'>('togocel');
  const [mmPhone, setMmPhone] = useState('');
  const [mmSubmitting, setMmSubmitting] = useState(false);
  const [mmError, setMmError] = useState('');
  const [mmTransaction, setMmTransaction] = useState<{ id: string; status: string } | null>(null);
  const [mmPolling, setMmPolling] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchCompanyPlan();
  }, [projectId]);

  // Polling du statut d'une transaction Mobile Money en attente. Le webhook FedaPay
  // (côté serveur) est la seule source de vérité ; ce polling ne fait qu'afficher
  // l'état déjà enregistré en base, jamais le décider.
  useEffect(() => {
    if (!mmPolling || !mmTransaction?.id) return;

    const POLL_INTERVAL_MS = 4000;
    const MAX_ATTEMPTS = 30; // ~2 minutes
    let attempts = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await api.get(`/payments/mobile-money/${mmTransaction.id}`);
        if (cancelled) return;
        setMmTransaction((prev) => (prev ? { ...prev, status: res.data.status } : prev));

        if (res.data.status === 'APPROVED') {
          setMmPolling(false);
          fetchProjectDetails();
          return;
        }
        if (['DECLINED', 'CANCELED', 'EXPIRED', 'FAILED'].includes(res.data.status)) {
          setMmPolling(false);
          return;
        }
      } catch {
        // Erreur réseau ponctuelle : on retente au prochain intervalle plutôt que d'abandonner.
      }
      if (!cancelled && attempts < MAX_ATTEMPTS) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } else if (!cancelled) {
        setMmPolling(false);
      }
    };

    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mmPolling, mmTransaction?.id]);

  const fetchCompanyPlan = () => {
    const compStr = localStorage.getItem('construction_company');
    if (compStr) {
      setCompanyPlan(JSON.parse(compStr).subscriptionPlan);
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      console.error('Erreur de chargement du portail client', err);
    } finally {
      setLoading(false);
    }
  };

  // Traiter la sauvegarde de la signature
  const handleSaveSignature = async (base64Url: string) => {
    if (!signingDocId) return;

    try {
      await api.post(`/documents/${signingDocId}/sign`, {
        clientSignature: base64Url,
      });

      setSigningDocId(null);
      fetchProjectDetails(); // recharger pour voir la signature
    } catch (err) {
      console.error('Erreur lors de la signature', err);
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

  // Ouvrir le modal de paiement partiel
  const openPaymentModal = (item: any) => {
    const remaining = item.amount - (item.paidAmount || 0);
    setPaymentModalItem(item);
    setPaymentAmount(remaining.toString());
    setPaymentError('');
    setPaymentMode('mobile_money');
    setMmProvider('togocel');
    setMmPhone('');
    setMmError('');
    setMmTransaction(null);
    setMmPolling(false);
  };

  // Fermer le modal — arrête aussi le polling en cours s'il y en a un
  const closePaymentModal = () => {
    setPaymentModalItem(null);
    setMmPolling(false);
    setMmTransaction(null);
  };

  // Initier un paiement Mobile Money (FedaPay) : push USSD, aucune redirection.
  // Le webhook côté serveur confirmera le paiement ; on se contente ici de suivre
  // le statut par polling (voir l'effet ci-dessus).
  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMmError('');
    const versement = parseFloat(paymentAmount);
    const remaining = paymentModalItem.amount - (paymentModalItem.paidAmount || 0);

    if (isNaN(versement) || versement <= 0) {
      setMmError('Veuillez entrer un montant valide.');
      return;
    }
    if (versement > remaining) {
      setMmError(`Le montant ne peut pas dépasser le reste à payer (${remaining.toLocaleString()} FCFA).`);
      return;
    }
    if (!mmPhone || mmPhone.replace(/\D/g, '').length < 8) {
      setMmError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    setMmSubmitting(true);
    try {
      const res = await api.post('/payments/mobile-money', {
        documentId: paymentModalItem.id,
        amount: Math.round(versement),
        phoneNumber: mmPhone,
        provider: mmProvider,
      });
      setMmTransaction({ id: res.data.transaction.id, status: res.data.transaction.status });
      setMmPolling(true);
    } catch (err: any) {
      setMmError(err.response?.data?.error || err.message || "Erreur lors de l'initiation du paiement.");
    } finally {
      setMmSubmitting(false);
    }
  };

  // Soumettre la déclaration de paiement (mode manuel, en attente de validation gérant)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    const versement = parseFloat(paymentAmount);
    const remaining = paymentModalItem.amount - (paymentModalItem.paidAmount || 0);

    if (isNaN(versement) || versement <= 0) {
      setPaymentError('Veuillez entrer un montant valide.');
      return;
    }
    if (versement > remaining) {
      setPaymentError(`Le versement ne peut pas dépasser le reste à payer (${remaining.toLocaleString()} FCFA).`);
      return;
    }

    setPaymentSubmitting(true);
    try {
      await api.post(`/documents/${paymentModalItem.id}/client-declare-payment`, {
        amount: versement,
        type: paymentType,
      });
      setPaymentModalItem(null);
      setPaymentAmount('');
      setPaymentType('ACHATS');
      fetchProjectDetails();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || JSON.stringify(err) || 'Erreur lors de la déclaration du paiement.';
      setPaymentError(errMsg);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="client-portal-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Chargement de votre espace chantier...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="client-portal-layout" style={{ padding: '40px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ marginTop: '20px', color: 'var(--status-danger)' }}>Projet introuvable.</div>
      </div>
    );
  }

  // Métriques
  const completedTasks = project.tasks.filter((t: any) => t.status === 'TERMINE').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="client-portal-layout">
      <Header title={`Espace Client — ${project.name}`} />

      <div className="client-portal-scrollable">
        {/* En-tête */}
        <div className="client-portal-header">
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <h2>{project.name}</h2>
          <span className="badge badge-active" style={{ marginLeft: 'auto' }}>Suivi Temps Réel</span>
        </div>

        {/* Détails du projet */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{project.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', borderTop: '1px solid rgba(75, 82, 109, 0.1)', paddingTop: '16px' }}>
            <div className="project-meta-item">
              <MapPin size={16} style={{ color: 'var(--accent)' }} />
              <span>{project.address || 'Non spécifié'}</span>
            </div>
            <div className="project-meta-item">
              <Calendar size={16} />
              <span>
                Du {new Date(project.startDate).toLocaleDateString()} au{' '}
                {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="progress-bar-container" style={{ marginTop: '10px' }}>
            <div className="progress-bar-header">
              <span>Progression Globale du Projet</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '12px', borderRadius: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%`, borderRadius: '6px' }} />
            </div>
          </div>
        </div>

        {/* Section Double Colonne */}
        <div className="client-sections-grid">
          {/* COLONNE 1 : ÉTAPES / JALONS */}
          <div className="client-card glass-panel">
            <h3>Jalons & Validation des Étapes</h3>
            <div className="milestones-list">
              {project.tasks.map((task: any) => {
                const isCompleted = task.status === 'TERMINE';
                const isInProgress = task.status === 'EN_COURS';

                return (
                  <div key={task.id} className="milestone-item">
                    <div className="milestone-info">
                      {isCompleted ? (
                        <CheckCircle size={20} style={{ color: 'var(--status-success)' }} />
                      ) : isInProgress ? (
                        <Clock size={20} style={{ color: 'var(--status-pending)' }} />
                      ) : (
                        <AlertCircle size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                      <span className="milestone-name">{task.name}</span>
                    </div>
                    <span className={`badge ${isCompleted ? 'badge-success' : isInProgress ? 'badge-pending' : 'badge-danger'}`}>
                      {task.status === 'TERMINE' ? 'Terminé' : task.status === 'EN_COURS' ? 'En Cours' : 'À Faire'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLONNE 2 : DEVIS & DOCUMENTS */}
          <div className="client-card glass-panel">
            <h3>Mes Devis & Factures</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const devisItems = project.documents.filter((d: any) => d.type === 'DEVIS').map((d: any) => ({
                  ...d,
                  isDevis: true,
                  displayTitle: d.title,
                  displayDate: d.createdAt,
                }));

                const factureItems = project.documents.filter((d: any) => d.type === 'FACTURE').map((d: any) => ({
                  ...d,
                  isDevis: false,
                  isExpense: false,
                  displayTitle: d.title,
                  displayDate: d.createdAt,
                }));

                const expenseItems = (project.expenses || [])
                  .filter((e: any) => {
                    // Hide raw expense if an invoice document has already been created for it
                    const hasMatchingFacture = project.documents.some(
                      (d: any) => d.type === 'FACTURE' && d.title === `Facture : ${e.description}`
                    );
                    return !hasMatchingFacture;
                  })
                  .map((e: any) => ({
                    ...e,
                    isDevis: false,
                    isExpense: true,
                    displayTitle: `${e.category === 'MAIN_DOEUVRE' ? '👷 Main d\'œuvre' : '🛒 Achat matériel'} : ${e.description}`,
                    displayDate: e.date || e.createdAt,
                  }));

                const combined = [
                  ...devisItems,
                  ...factureItems,
                  ...expenseItems,
                ].sort((a: any, b: any) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

                return combined.map((item: any) => {
                  const isPaid = item.status === 'PAYE';
                  const isDeclared = item.status === 'PAYE_CLIENT';
                  const isSigned = item.status === 'SIGNE';
                  const isPartial = item.status === 'PAYE_PARTIEL';

                  // Rendre la badge
                  let badgeText = '';
                  let badgeClass = 'pending';
                  if (item.isDevis) {
                    badgeText = isPaid ? '✓ Payé & Validé' : isDeclared ? '⏳ Paiement Déclaré' : isSigned ? '✓ Signé' : '⏳ Signature en attente';
                    badgeClass = isPaid || isSigned ? 'success' : isDeclared ? 'warning' : 'danger';
                  } else {
                    badgeText = isPaid ? '✓ Payée & Validée' : isPartial ? '⏳ Payée partiel' : isDeclared ? '⏳ Déclarée client' : '❌ Non réglée';
                    badgeClass = isPaid ? 'success' : isPartial ? 'warning' : isDeclared ? 'warning' : 'danger';
                  }

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'rgba(10, 11, 16, 0.4)',
                        border: '1px solid var(--steel-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>{item.displayTitle}</span>
                          {!item.isDevis && !item.isExpense && item.devisId && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                              Liée au Devis : {project.documents?.find((d: any) => d.id === item.devisId)?.title || '—'}
                            </span>
                          )}
                        </div>
                        <span className={`badge badge-${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>
                            {(item.isDevis ? (item.amount || (item.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0)) : item.amount).toLocaleString()} FCFA
                          </span>
                          {!item.isDevis && !item.isExpense && item.status !== 'PAYE' && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Payé : {item.paidAmount?.toLocaleString() || 0} | Reste : {Math.max(0, item.amount - (item.paidAmount || 0)).toLocaleString()}
                              {item.declaredPaidAmount > 0 && (
                                <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>
                                  ({item.declaredPaidAmount.toLocaleString()} F déclaré en attente)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {item.isDevis && item.status === 'EN_ATTENTE' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => setSigningDocId(item.id)}
                            >
                              Signer Devis
                            </button>
                          )}
                          {!item.isDevis && (item.status === 'EN_ATTENTE' || item.status === 'PAYE_PARTIEL') && (
                            <button
                              className="btn btn-cta"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                              onClick={async () => {
                                if (item.isExpense) {
                                  if (window.confirm("Déclarer cet élément comme payé ? Le gérant ou le chef de chantier validera votre paiement.")) {
                                    try {
                                      await api.put(`/expenses/${item.id}/status`, { status: 'PAYE_CLIENT' });
                                      fetchProjectDetails();
                                    } catch (err) {
                                      console.error("Erreur de déclaration de paiement", err);
                                    }
                                  }
                                } else {
                                  openPaymentModal(item);
                                }
                              }}
                            >
                              <CreditCard size={13} /> Déclarer un versement
                            </button>
                          )}
                          {item.isExpense ? (
                            item.receiptUrl && (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', gap: '4px', display: 'flex', alignItems: 'center' }}
                              >
                                <Download size={13} /> Reçu
                              </a>
                            )
                          ) : (
                            item.pdfUrl ? (
                              <a
                                href={item.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', gap: '4px', display: 'flex', alignItems: 'center' }}
                              >
                                <Download size={13} /> PDF
                              </a>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}
                                onClick={() => handlePrintPDF(item.id)}
                              >
                                <Printer size={13} /> Rapport PDF
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {item.isDevis && item.clientSignature && (
                        <div style={{ borderTop: '1px dashed var(--steel-border)', paddingTop: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Votre Signature :</span>
                          <div className="signature-display-box" style={{ height: '60px', marginTop: '4px' }}>
                            <img src={item.clientSignature} alt="Signature validée" className="signature-display-img" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* SECTION TIMELINE PHOTOS DU JOURNAL DE SUIVI */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} style={{ color: 'var(--accent)' }} /> Journal de Suivi quotidien en images
          </h3>

          <div className="photos-grid">
            {project.progressLogs.map((log: any) => (
              <div key={log.id} className="photo-log-card glass-panel">
                <div className="photo-wrapper">
                  <img src={log.photoUrl} alt="Suivi client" />
                  <span className={`photo-type-badge badge ${log.type === 'AVANT' ? 'badge-info' : log.type === 'APRES' ? 'badge-success' : 'badge-warning'}`}>
                    {log.type === 'AVANT' ? 'Avant' : log.type === 'APRES' ? 'Après' : 'Journalière'}
                  </span>
                </div>

                <div className="photo-comment-box">
                  <p className="photo-comment-text">{log.comment}</p>
                  <div className="photo-footer">
                    <span>Ajouté le {new Date(log.createdAt).toLocaleDateString()}</span>
                    <a
                      href={log.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      Télécharger
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay Canvas de Signature */}
      {signingDocId && (
        <div className="signature-overlay">
          <div className="signature-modal-content glass-panel">
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', borderBottom: '1px solid var(--steel-border)', paddingBottom: '10px' }}>
              Signature Électronique du Devis
            </h3>
            <SignaturePad
              onSave={handleSaveSignature}
              onCancel={() => setSigningDocId(null)}
            />
          </div>
        </div>
      )}

      {/* Alerte Premium (Imprimer PDF) */}
      {premiumAlert && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
            <AlertCircle size={48} style={{ color: 'var(--accent)', margin: '0 auto' }} />
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', marginTop: '16px' }}>
              Rapports PDF indisponibles
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '12px 0 20px 0' }}>
              Le téléchargement de rapports PDF officiels et de factures certifiées est réservé aux entreprises sous plan **Premium**. 
              Contactez l'entreprise pour recevoir votre devis papier.
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
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--steel-border)' }}>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-title)' }}>Rapport Devis/Facture Officiel</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={triggerPrint => window.print()} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Printer size={14} /> Imprimer en PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Fermer
                </button>
              </div>
            </div>

            {/* Document section for printing */}
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
                            {(printDoc.document.type === 'DEVIS' ? (printDoc.document.amount || (printDoc.document.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0)) : printDoc.document.amount).toLocaleString()} FCFA
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
                          {(printDoc.document.type === 'DEVIS' ? (printDoc.document.amount || (printDoc.document.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0)) : printDoc.document.amount).toLocaleString()} FCFA
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                    <div style={{ width: '280px', borderTop: '2px solid #333', paddingTop: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                        <span>TOTAL GÉNÉRAL :</span>
                        <span>{(printDoc.document.type === 'DEVIS' ? (printDoc.document.amount || (printDoc.document.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0)) : printDoc.document.amount).toLocaleString()} FCFA</span>
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

      )}\n
      {/* Modal : Payer / Déclarer un Versement */}
      {paymentModalItem && (
        <div className="modal-overlay" style={{ zIndex: 9000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="modal-header">
              <span className="modal-title">💳 Régler la facture</span>
              <button className="modal-close-btn" onClick={closePaymentModal}>
                <X size={18} />
              </button>
            </div>

            {/* Infos facture */}
            <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {paymentModalItem.displayTitle || paymentModalItem.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Total</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{paymentModalItem.amount.toLocaleString()} F</div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Déjà payé</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--status-success)' }}>{(paymentModalItem.paidAmount || 0).toLocaleString()} F</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Reste</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--status-danger)' }}>
                    {Math.max(0, paymentModalItem.amount - (paymentModalItem.paidAmount || 0)).toLocaleString()} F
                  </div>
                </div>
              </div>
            </div>

            {/* Choix du mode de paiement — désactivé pendant qu'un paiement Mobile Money est en cours */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                className={`btn ${paymentMode === 'mobile_money' ? 'btn-cta' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                disabled={!!mmTransaction}
                onClick={() => { setPaymentMode('mobile_money'); setPaymentError(''); }}
              >
                📱 Mobile Money
              </button>
              <button
                type="button"
                className={`btn ${paymentMode === 'manual' ? 'btn-cta' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                disabled={!!mmTransaction}
                onClick={() => { setPaymentMode('manual'); setMmError(''); }}
              >
                ✍️ Déclaration manuelle
              </button>
            </div>

            {paymentMode === 'mobile_money' && mmTransaction ? (
              // Suivi d'un paiement Mobile Money déjà initié : lecture seule, le webhook
              // serveur seul décide du statut réel — cet écran ne fait qu'afficher.
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                {mmTransaction.status === 'PENDING' && (
                  <>
                    <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>
                      📲 Validez la demande sur votre téléphone
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Une demande {mmProvider === 'togocel' ? 'Mixx by Togocel' : 'Moov Money'} a été envoyée au {mmPhone}.
                      Entrez votre code secret Mobile Money sur votre téléphone pour confirmer.
                    </p>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏳ En attente de confirmation…</div>
                  </>
                )}
                {mmTransaction.status === 'APPROVED' && (
                  <div style={{ color: 'var(--status-success)', fontWeight: '800', fontSize: '15px' }}>
                    ✅ Paiement confirmé — merci !
                  </div>
                )}
                {['DECLINED', 'CANCELED', 'EXPIRED', 'FAILED'].includes(mmTransaction.status) && (
                  <div style={{ color: 'var(--status-danger)', fontWeight: '800', fontSize: '15px' }}>
                    ❌ Paiement refusé ou annulé. Vous pouvez réessayer.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  {mmTransaction.status !== 'PENDING' && mmTransaction.status !== 'APPROVED' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => { setMmTransaction(null); setMmPolling(false); }}
                    >
                      Réessayer
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closePaymentModal}>
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                {paymentMode === 'mobile_money' && mmError && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>{mmError}</div>
                )}
                {paymentMode === 'manual' && paymentError && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>{paymentError}</div>
                )}

                <form onSubmit={paymentMode === 'mobile_money' ? handleMobileMoneySubmit : handlePaymentSubmit} className="login-form">
                  <div className="form-group">
                    <label style={{ fontWeight: '700' }}>Montant à régler (FCFA)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max={Math.max(0, paymentModalItem.amount - (paymentModalItem.paidAmount || 0))}
                      className="form-input"
                      placeholder="Ex: 75000"
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value);
                        setPaymentError('');
                        setMmError('');
                      }}
                      required
                      autoFocus
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      {paymentMode === 'mobile_money'
                        ? 'Paiement immédiat par push USSD — le montant est débité exactement, sans frais supplémentaires.'
                        : 'Vous pouvez payer partiellement ou intégralement. Le gérant validera votre versement.'}
                    </p>
                  </div>

                  {paymentMode === 'manual' && (
                    <div className="form-group">
                      <label style={{ fontWeight: '700' }}>Type de versement</label>
                      <select
                        className="form-select"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        required
                      >
                        <option value="ACHATS">Achats</option>
                        <option value="MAIN_DOEUVRE">Main d'œuvre</option>
                      </select>
                    </div>
                  )}

                  {/* Raccourcis rapides */}
                  {(() => {
                    const remaining = Math.max(0, paymentModalItem.amount - (paymentModalItem.paidAmount || 0));
                    const shortcuts = [
                      { label: '25%', value: Math.round(remaining * 0.25) },
                      { label: '50%', value: Math.round(remaining * 0.5) },
                      { label: '75%', value: Math.round(remaining * 0.75) },
                      { label: 'Total', value: remaining },
                    ];
                    return (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {shortcuts.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: '1', minWidth: '60px', padding: '6px 8px', fontSize: '12px', fontWeight: '700' }}
                            onClick={() => { setPaymentAmount(s.value.toString()); setPaymentError(''); setMmError(''); }}
                          >
                            {s.label}<br/>
                            <span style={{ fontSize: '10px', fontWeight: '400', opacity: 0.7 }}>{s.value.toLocaleString()} F</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {paymentMode === 'mobile_money' && (
                    <>
                      <div className="form-group">
                        <label style={{ fontWeight: '700' }}>Opérateur Mobile Money</label>
                        <select
                          className="form-select"
                          value={mmProvider}
                          onChange={(e) => setMmProvider(e.target.value as 'togocel' | 'moov_tg')}
                        >
                          <option value="togocel">Mixx by Togocel</option>
                          <option value="moov_tg">Moov Money Togo</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: '700' }}>Numéro Mobile Money</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Ex: 90 12 34 56"
                          value={mmPhone}
                          onChange={(e) => { setMmPhone(e.target.value); setMmError(''); }}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closePaymentModal}>
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-cta"
                      style={{ flex: 2 }}
                      disabled={paymentMode === 'mobile_money' ? mmSubmitting : paymentSubmitting}
                    >
                      {paymentMode === 'mobile_money'
                        ? (mmSubmitting ? 'Envoi de la demande...' : '📲 Payer par Mobile Money')
                        : (paymentSubmitting ? 'Envoi...' : '✅ Confirmer le versement')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
