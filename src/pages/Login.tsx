import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, Building2, UserCircle2, ShieldCheck, Phone, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape d'inscription (Phase 1, 2)
  const [regStep, setRegStep] = useState(1);

  // Formulaire de connexion
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulaire d'inscription (Phase 1 : Entreprise)
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('FREE');

  // Formulaire d'inscription (Phase 2 : Gérant + MDP)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // États de visibilité du mot de passe
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, le rediriger
    const token = localStorage.getItem('construction_token');
    if (token) {
      navigate('/dashboard');
    }

    // Récupérer le plan depuis la requête de l'URL (?plan=PREMIUM)
    const plan = searchParams.get('plan');
    if (plan) {
      setSelectedPlan(plan);
      setIsLogin(false); // Ouvrir directement l'onglet d'inscription
    }
  }, [searchParams, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        phone: loginPhone,
        password: loginPassword,
      });

      const { token, user, company, planConfig } = response.data;
      localStorage.setItem('construction_token', token);
      localStorage.setItem('construction_user', JSON.stringify(user));
      if (company) {
        localStorage.setItem('construction_company', JSON.stringify(company));
      }
      if (planConfig) {
        localStorage.setItem('construction_plan_config', JSON.stringify(planConfig));
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 1 -> Passer à la Phase 2
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName || !companyPhone) {
      setError("Le nom de l'entreprise et le téléphone sont obligatoires.");
      return;
    }
    setRegStep(2);
  };

  // Phase 2 -> Inscription directe (sans OTP validation)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !registerEmail || !registerPassword) {
      setError('Tous les champs du gérant sont obligatoires.');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        companyName,
        companyEmail: companyEmail || null,
        companyPhone,
        companyAddress: companyAddress || null,
        firstName,
        lastName,
        email: registerEmail,
        password: registerPassword,
      });

      const { token, user, company, planConfig } = response.data;
      localStorage.setItem('construction_token', token);
      localStorage.setItem('construction_user', JSON.stringify(user));
      localStorage.setItem('construction_company', JSON.stringify(company));
      if (planConfig) {
        localStorage.setItem('construction_plan_config', JSON.stringify(planConfig));
      }

      // Si le plan choisi n'est pas FREE, mettre à jour l'abonnement en arrière-plan
      if (selectedPlan !== 'FREE') {
        try {
          const subResponse = await api.post('/auth/subscription', { plan: selectedPlan }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          localStorage.setItem('construction_company', JSON.stringify(subResponse.data.company));
          if (subResponse.data.planConfig) {
            localStorage.setItem('construction_plan_config', JSON.stringify(subResponse.data.planConfig));
          }
        } catch (subErr) {
          console.error("Erreur de mise à jour d'abonnement", subErr);
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur d'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <Layers size={28} />
          </div>
          <h2>ConstructCare</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {isLogin
              ? 'Accédez à votre espace'
              : `Inscription Entreprise — Phase ${regStep} sur 2`}
          </p>
        </div>

        {isLogin && (
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Se Connecter
            </button>
            <button
              type="button"
              className={`login-tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); setRegStep(1); }}
            >
              S'Inscrire
            </button>
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        {isLogin ? (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="login-phone">Numéro de Téléphone</label>
              <input
                id="login-phone"
                type="text"
                className="form-input"
                placeholder="Ex: +228 90 12 34 56"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Mot de passe</label>
              <div className="password-input-container">
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <div>
            {/* PHASE 1 : INFORMATIONS ENTREPRISE */}
            {regStep === 1 && (
              <form className="login-form" onSubmit={handleNextStep1}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                  <Building2 size={16} />
                  <span>Phase 1 : Informations Entreprise</span>
                </div>

                <div className="form-group">
                  <label htmlFor="company-name">Nom de l'Entreprise *</label>
                  <input
                    id="company-name"
                    type="text"
                    className="form-input"
                    placeholder="Bâtisseur du Golfe S.A."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company-phone">Téléphone de l'Entreprise (Pour validation OTP) *</label>
                  <input
                    id="company-phone"
                    type="text"
                    className="form-input"
                    placeholder="Ex: +228 90 12 34 56"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company-email">Email de l'Entreprise (Optionnel)</label>
                  <input
                    id="company-email"
                    type="email"
                    className="form-input"
                    placeholder="contact@batisseurs.tg"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company-address">Adresse Physique</label>
                  <input
                    id="company-address"
                    type="text"
                    className="form-input"
                    placeholder="Boulevard du Mono, Lomé"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary login-btn">
                  Suivant : Gérant de l'entreprise
                </button>
              </form>
            )}

            {/* PHASE 2 : INFORMATIONS GÉRANT */}
            {regStep === 2 && (
              <form className="login-form" onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                  <UserCircle2 size={16} />
                  <span>Phase 2 : Informations Gérant & Sécurité</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first-name">Prénom Gérant *</label>
                    <input
                      id="first-name"
                      type="text"
                      className="form-input"
                      placeholder="Koffi"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last-name">Nom Gérant *</label>
                    <input
                      id="last-name"
                      type="text"
                      className="form-input"
                      placeholder="Abalo"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email">Email de Connexion Gérant *</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="gerant@batisseurs.tg"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-password">Créer un Mot de passe *</label>
                  <div className="password-input-container">
                    <input
                      id="reg-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Minimum 6 caractères"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      aria-label={showRegisterPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setRegStep(1)}>
                    Retour
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Création...' : 'Valider & Créer mon Entreprise'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="login-footer" style={{ marginTop: '10px' }}>
          <p>
            {isLogin ? (
              <>
                Nouvelle entreprise ?{' '}
                <span onClick={() => { setIsLogin(false); setError(''); setRegStep(1); }}>
                  Créer un compte
                </span>
              </>
            ) : (
              <>
                Déjà inscrit ?{' '}
                <span onClick={() => { setIsLogin(true); setError(''); }}>
                  Se connecter
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
