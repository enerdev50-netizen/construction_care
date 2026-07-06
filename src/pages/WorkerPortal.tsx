import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Clock,
  Camera,
  Upload,
  Layers,
  Calendar,
  MapPin,
  Plus,
  Download,
} from 'lucide-react';
import api from '../api';
import Header from '../components/Header';
import './WorkerPortal.css';

interface WorkerPortalProps {
  projectId: string;
  onBack: () => void;
}

const WorkerPortal: React.FC<WorkerPortalProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Formulaire de log
  const [photoBase64, setPhotoBase64] = useState('');
  const [logType, setLogType] = useState('QUOTIDIEN');
  const [logComment, setLogComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    fetchDetails();
    const userStr = localStorage.getItem('construction_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, [projectId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const projRes = await api.get(`/projects/${projectId}`);
      setProject(projRes.data);
      const timeRes = await api.get(`/progress/${projectId}`);
      setTimeline(timeRes.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des détails de suivi', err);
    } finally {
      setLoading(false);
    }
  };

  // Modifier le statut d'une tâche
  const handleToggleTask = async (task: any) => {
    let nextStatus = 'A_FAIRE';
    if (task.status === 'A_FAIRE') nextStatus = 'EN_COURS';
    else if (task.status === 'EN_COURS') nextStatus = 'TERMINE';

    try {
      await api.put(`/projects/${projectId}/tasks/${task.id}`, {
        status: nextStatus,
      });
      fetchDetails();
    } catch (err) {
      console.error('Erreur lors du changement de statut de tâche', err);
    }
  };

  // Convertir le fichier photo choisi en Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      setFormError('La taille de la photo ne doit pas dépasser 8 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.onerror = () => {
      setFormError('Erreur de lecture du fichier.');
    };
    reader.readAsDataURL(file);
  };

  // Soumission Log Photo Suivi
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!photoBase64) {
      setFormError('Veuillez sélectionner ou prendre une photo.');
      return;
    }

    setUploading(true);
    try {
      await api.post('/progress', {
        projectId,
        photoUrl: photoBase64,
        type: logType,
        comment: logComment,
      });

      // Réinitialiser
      setPhotoBase64('');
      setLogComment('');
      // Recharger
      fetchDetails();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'envoi de la photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="worker-portal-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Chargement de l'espace de suivi de chantier...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="worker-portal-layout" style={{ padding: '40px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ marginTop: '20px', color: 'var(--status-danger)' }}>Projet introuvable.</div>
      </div>
    );
  }

  return (
    <div className="worker-portal-layout">
      <Header title={`Espace Chantier — ${project.name}`} />

      <div className="worker-portal-scrollable">
        {/* En-tête de retour */}
        <div className="worker-header">
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <h2>{project.name}</h2>
          <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>Mode Terrain</span>
        </div>

        {/* Coordonnées rapides */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div className="project-meta-item">
            <MapPin size={15} style={{ color: 'var(--accent)' }} />
            <span>Lieu: {project.address || 'Non renseigné'}</span>
          </div>
          <div className="project-meta-item">
            <Calendar size={15} />
            <span>Dates: {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Navigation Onglets Chef de Chantier */}
        {currentUser?.role === 'TEAM_LEADER' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--steel-border)', paddingBottom: '10px' }}>
            <button
              className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setActiveTab('tasks')}
            >
              Checklist & Photos
            </button>
            <button
              className={`btn ${activeTab === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setActiveTab('billing')}
            >
              Comptabilité Client
            </button>
          </div>
        )}

        {activeTab === 'tasks' && (
          <>
            {/* Double Grille */}
            <div className="worker-grid">
              {/* COLONNE 1 : LISTE DES TÂCHES A VALIDER */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Jalons & Checklist de Construction</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Appuyez sur la case à cocher pour actualiser le statut de la phase de travaux :
                </p>

                <div className="tasks-list">
                  {project.tasks.map((task: any) => {
                    const isCompleted = task.status === 'TERMINE';
                    const isInProgress = task.status === 'EN_COURS';

                    return (
                      <div key={task.id} className="task-row">
                        <div className="task-info">
                          <div
                            className={`task-checkbox-wrapper ${isCompleted ? 'completed' : ''}`}
                            onClick={() => handleToggleTask(task)}
                          >
                            {isCompleted ? (
                              <CheckSquare size={22} style={{ fill: 'var(--status-success-soft)' }} />
                            ) : isInProgress ? (
                              <Clock size={22} style={{ color: 'var(--status-pending)' }} />
                            ) : (
                              <Square size={22} />
                            )}
                          </div>
                          <span className={`task-name ${isCompleted ? 'completed' : ''}`}>
                            {task.name}
                          </span>
                        </div>

                        <span className={`badge ${isCompleted ? 'badge-success' : isInProgress ? 'badge-pending' : 'badge-danger'}`}>
                          {task.status === 'TERMINE' ? 'Terminé' : task.status === 'EN_COURS' ? 'En Cours' : 'À Faire'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLONNE 2 : UPLOAD PHOTO RAPPORT */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Ajouter un Rapport Quotidien</h3>

                {formError && <div className="login-error">{formError}</div>}

                <form onSubmit={handleLogSubmit} className="login-form">
                  <div className="form-group">
                    <label>Type de rapport photo</label>
                    <select
                      className="form-select"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      required
                    >
                      <option value="QUOTIDIEN">Suivi quotidien (Terrain)</option>
                      <option value="AVANT">Photo AVANT travaux</option>
                      <option value="APRES">Photo APRÈS travaux (Validation)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Photo du Chantier</label>
                    <div className="upload-box" onClick={() => document.getElementById('file-upload')?.click()}>
                      {photoBase64 ? (
                        <img src={photoBase64} alt="Prévisualisation" className="upload-preview" />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <Upload size={32} style={{ color: 'var(--accent)' }} />
                          <span style={{ fontSize: '13px' }}>Prendre une photo / Parcourir</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fichiers JPEG/PNG &lt; 8 Mo</span>
                        </div>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Commentaire / Explication des travaux</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Coulage de la chape terminé. Finitions des poteaux en cours..."
                      value={logComment}
                      onChange={(e) => setLogComment(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-cta login-btn" disabled={uploading}>
                    {uploading ? 'Envoi en cours...' : 'Envoyer le rapport quotidien'}
                  </button>
                </form>
              </div>
            </div>

            {/* TIMELINE DE SUIVI DU CHANTIER */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} style={{ color: 'var(--accent)' }} /> Récents rapports photos publiés sur le terrain
              </h3>

              <div className="photos-grid">
                {timeline.map((log: any) => (
                  <div key={log.id} className="photo-log-card glass-panel">
                    <div className="photo-wrapper">
                      <img src={log.photoUrl} alt="Timeline terrain" />
                      <span className={`photo-type-badge badge ${log.type === 'AVANT' ? 'badge-info' : log.type === 'APRES' ? 'badge-success' : 'badge-warning'}`}>
                        {log.type === 'AVANT' ? 'Avant' : log.type === 'APRES' ? 'Après' : 'Journalière'}
                      </span>
                    </div>

                    <div className="photo-comment-box">
                      <p className="photo-comment-text">{log.comment}</p>
                      <div className="photo-footer">
                        <span>Par: {log.takenBy?.firstName} ({log.takenBy?.role === 'TEAM_LEADER' ? 'Chef' : 'Ouvrier'})</span>
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'billing' && currentUser?.role === 'TEAM_LEADER' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-title)' }}>Comptabilité Client — Factures</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Validez les déclarations de paiement du client propriétaire ou téléchargez les PDF associés.
            </p>
            
            <div className="table-container">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.documents?.filter((d: any) => d.type === 'FACTURE').map((doc: any) => {
                    const isPaid = doc.status === 'PAYE';
                    const isDeclared = doc.status === 'PAYE_CLIENT';
                    return (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: '600' }}>{doc.title}</td>
                        <td style={{ fontWeight: '700' }}>{doc.amount.toLocaleString()} FCFA</td>
                        <td>
                          <span className={`badge badge-${isPaid ? 'success' : isDeclared ? 'pending' : 'pending'}`}>
                            {isPaid ? 'Payé' : isDeclared ? 'Déclaré (Client)' : 'En attente'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {doc.pdfUrl && (
                              <a
                                href={doc.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Download size={12} /> PDF
                              </a>
                            )}
                            {isDeclared && (
                              <button
                                className="btn btn-cta"
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                                onClick={async () => {
                                  try {
                                    await api.put(`/documents/${doc.id}/status`, { status: 'PAYE' });
                                    fetchDetails();
                                  } catch (err) {
                                    console.error("Erreur de validation", err);
                                  }
                                }}
                              >
                                Valider Paiement
                              </button>
                            )}
                            {isPaid && (
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Validé
                              </span>
                            )}
                            {!isPaid && !isDeclared && (
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                En attente de paiement
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!project.documents || project.documents.filter((d: any) => d.type === 'FACTURE').length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                        Aucune facture trouvée pour ce chantier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerPortal;
