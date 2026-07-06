import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Briefcase, Users, DollarSign, Camera, MapPin, FileText, Sliders } from 'lucide-react';
import api from '../api';
import './Landing.css';

interface Plan {
  id: string;
  planName: string;
  price: number;
  durationDays: number;
  maxProjects: number;
  maxUsers: number;
  features: string[];
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 'free',
      planName: 'FREE',
      price: 0,
      durationDays: 15,
      maxProjects: 1,
      maxUsers: 3,
      features: ['GEOLOCALISATION', 'MATERIAUX', 'DOCUMENTS', 'PDF']
    },
    {
      id: 'standard',
      planName: 'STANDARD',
      price: 7000,
      durationDays: 30,
      maxProjects: 10,
      maxUsers: 15,
      features: ['GEOLOCALISATION', 'MATERIAUX']
    },
    {
      id: 'premium',
      planName: 'PREMIUM',
      price: 15000,
      durationDays: 30,
      maxProjects: 9999,
      maxUsers: 9999,
      features: ['GEOLOCALISATION', 'MATERIAUX', 'DOCUMENTS', 'PDF']
    }
  ]);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/auth/plans');
        if (response.data && response.data.length > 0) {
          const sortedPlans = response.data.sort((a: Plan, b: Plan) => a.price - b.price);
          setPlans(sortedPlans);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des plans de tarification :', err);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: string) => {
    navigate(`/login?plan=${plan}`);
  };

  const formatPlanName = (name: string) => {
    if (name === 'FREE') return 'Gratuit';
    if (name === 'STANDARD') return 'Standard';
    if (name === 'PREMIUM') return 'Premium';
    return name
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPlanDescription = (name: string) => {
    switch (name) {
      case 'FREE':
        return 'Idéal pour tester l\'application et démarrer sans frais';
      case 'STANDARD':
        return 'Parfait pour les PME en croissance et chantiers locaux';
      case 'PREMIUM':
        return 'Pour un suivi professionnel complet et rapports illimités';
      default:
        return 'Solution sur mesure pour vos besoins d\'envergure';
    }
  };

  const formatLimit = (limit: number) => {
    return limit >= 9999 ? 'Illimités' : limit;
  };

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <Layers size={24} style={{ color: 'var(--accent)' }} />
          <span>ConstructCare</span>
        </div>
        <div className="landing-nav-links">
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            Connexion
          </button>
          <button className="btn btn-primary" onClick={() => handleSelectPlan('FREE')}>
            Essai Gratuit
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero animate-fade-in">
        <div className="landing-hero-content">
          <h1>
            Gérez vos chantiers en toute <span>simplicité</span> & <span>transparence</span>
          </h1>
          <p>
            L'application SaaS moderne pour suivre l'avancement des travaux, gérer vos équipes, comptabiliser vos dépenses en temps réel et impliquer vos clients en Afrique de l'Ouest.
          </p>
          <div className="landing-hero-btns">
            <button className="btn btn-primary btn-lg" onClick={() => handleSelectPlan('FREE')}>
              Démarrer l'essai gratuit
            </button>
            <a className="btn btn-secondary btn-lg" href="#pricing">
              Voir le simulateur
            </a>
          </div>
        </div>
        <div className="landing-hero-image-wrapper">
          <img src="/construction_hero.png" alt="Chantier de construction moderne" className="landing-hero-image" />
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <h2 className="section-title">
          Une suite <span>complète</span> pour vos chantiers
        </h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Briefcase size={22} />
            </div>
            <h3>Gestion des chantiers</h3>
            <p>Créez vos projets, planifiez les dates de début/fin et ajustez le statut en temps réel (En cours, Terminé, Suspendu).</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={22} />
            </div>
            <h3>Gestion des équipes</h3>
            <p>Enregistrez vos maçons, ouvriers et chefs d'équipe, puis affectez-les aux différents chantiers actifs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <DollarSign size={22} />
            </div>
            <h3>Contrôle des dépenses</h3>
            <p>Enregistrez instantanément les achats de ciment, de sable, le transport et la main-d'œuvre avec un historique détaillé.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Camera size={22} />
            </div>
            <h3>Suivi des travaux en image</h3>
            <p>Documentez l'avancée avec des photos avant/après, des clichés quotidiens et des commentaires explicatifs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <MapPin size={22} />
            </div>
            <h3>Géolocalisation (Premium)</h3>
            <p>Visualisez instantanément la position de l'ensemble de vos chantiers sur une carte interactive en temps réel.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FileText size={22} />
            </div>
            <h3>Devis & Factures (Premium)</h3>
            <p>Générez des rapports PDF professionnels et faites valider/signer vos devis directement en ligne par le client.</p>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="landing-preview">
        <h2 className="section-title">
          Une interface <span>intuitive</span> pensée pour le terrain
        </h2>
        <p className="preview-subtitle">
          Pilotez vos chantiers depuis un tableau de bord global en temps réel.
        </p>
        <div className="preview-image-wrapper">
          <img src="/dashboard_mockup.png" alt="Aperçu du tableau de bord de l'application" className="preview-image" />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-pricing">
        <h2 className="section-title">
          Un modèle économique <span>adapté</span> à votre croissance
        </h2>

        <div className="pricing-grid">
          {plans.map((plan) => {
            const isPopular = plan.planName === 'STANDARD';
            return (
              <div key={plan.id || plan.planName} className={`price-card ${isPopular ? 'recommended-plan' : ''}`}>
                {isPopular && <div className="popular-badge">Recommandé</div>}
                <div className="price-header">
                  <h3>{formatPlanName(plan.planName)}</h3>
                  <p>{getPlanDescription(plan.planName)}</p>
                </div>
                <div className="price-amount">
                  {plan.price === 0 ? '0 FCFA' : `${plan.price.toLocaleString()} FCFA`}{' '}
                  <span>{plan.planName === 'FREE' ? '/ à vie' : '/ mois'}</span>
                </div>
                <ul className="price-features">
                  <li>
                    <span>✓</span> {formatLimit(plan.maxProjects)} chantier(s) actif(s)
                  </li>
                  <li>
                    <span>✓</span> {formatLimit(plan.maxUsers)} collaborateurs
                  </li>
                  <li>
                    <span>✓</span> Gestion des dépenses & recettes
                  </li>
                  {plan.features.includes('GEOLOCALISATION') ? (
                    <li>
                      <span>✓</span> Géolocalisation & Carte
                    </li>
                  ) : (
                    <li style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                      <span>✗</span> Géolocalisation & Carte
                    </li>
                  )}
                  {plan.features.includes('PDF') ? (
                    <li>
                      <span>✓</span> Génération rapports PDF & Devis
                    </li>
                  ) : (
                    <li style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                      <span>✗</span> Génération rapports PDF & Devis
                    </li>
                  )}
                </ul>
                <button
                  className={`btn price-btn ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectPlan(plan.planName)}
                >
                  Choisir ce plan
                </button>
              </div>
            );
          })}

          {/* Formule Entreprise Card */}
          <div className="price-card">
            <div className="price-header">
              <h3>Entreprise</h3>
              <p>{getPlanDescription('ENTERPRISE')}</p>
            </div>
            <div className="price-amount">
              Sur Devis <span>/ adapté</span>
            </div>
            <ul className="price-features">
              <li>
                <span>✓</span> Chantiers illimités (&gt; 30)
              </li>
              <li>
                <span>✓</span> Collaborateurs illimités (&gt; 50)
              </li>
              <li>
                <span>✓</span> Support prioritaire 24h/7
              </li>
              <li>
                <span>✓</span> Formation sur mesure pour vos équipes
              </li>
              <li>
                <span>✓</span> Intégration de vos anciens devis
              </li>
            </ul>
            <button
              className="btn price-btn btn-secondary"
              onClick={() => (window.location.href = 'mailto:contact@constructcare.com?subject=Demande%20de%20devis%20ConstructCare')}
            >
              Nous contacter
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} ConstructCare. Tous droits réservés. Développé avec excellence.</p>
      </footer>
    </div>
  );
};

export default Landing;
