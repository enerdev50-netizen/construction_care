# Construction Care - Frontend Client

Ce projet est l'application web client (frontend) de **Construction Care**, une plateforme SaaS de suivi et gestion de chantiers de construction. Développée en **React**, **Vite** et **TypeScript**, elle propose des tableaux de bord interactifs et des interfaces adaptées à différents rôles d'utilisateurs.

---

## 🎨 Système de Design : *Construct Core*

L'interface graphique respecte strictement la charte graphique **Construct Core** :

* **Couleur Primaire (Navigation & En-tête) :** Bleu Construction Profond (`#00236f`)
* **Couleur d'Accentuation (Boutons d'action clé / CTA) :** Orange de Sécurité (`#fd761a`)
* **Couleur d'Arrière-plan :** Gris ardoise ultra-clair (`#f7f9fb`)
* **Conteneurs & Cartes (Cards) :** Fond blanc pur (`#ffffff`) avec bordure fine en gris-bleu acier (`#c5c5d3`)
* **Effets d'Élévation :** Bordure plate sans ombre par défaut (Level 1). Au survol, une ombre diffuse et douce est appliquée avec une translation de `-2px` vers le haut (Level 2).
* **Polices de Caractères (Typography) :**
  - `Inter` pour les textes généraux et les titres.
  - `JetBrains Mono` pour les données chiffrées, les quantités de stock, les dates et les codes chantiers (précision d'ingénierie).
* **Arrondis (Borders) :** `4px` pour les champs de saisie et boutons standard, `8px` pour les cartes de contenu, et forme pilule (pill) pour les badges d'états.

---

## 📂 Organisation du Code Source

```
construction_care/
├── src/
│   ├── assets/         # Images et polices
│   ├── components/     # Composants d'interface réutilisables
│   │   ├── Header.tsx      # Barre d'en-tête (Profil, Notifications)
│   │   ├── Sidebar.tsx     # Menu latéral contextuel selon le rôle
│   │   ├── StatCard.tsx    # Widget statistique de tableau de bord
│   │   └── DataTable.tsx   # Tableau de données
│   ├── pages/          # Pages de l'application
│   │   ├── Landing.tsx     # Site vitrine public (Abonnements & Tarifs)
│   │   ├── Login.tsx       # Formulaire de connexion & Inscription (2 phases)
│   │   ├── Dashboard.tsx   # Tableau de bord principal (Gérant / Admin)
│   │   ├── ProjectDetail.tsx # Fiche chantier complète
│   │   ├── ClientPortal.tsx  # Espace client (Suivi photo, signature devis)
│   │   └── WorkerPortal.tsx  # Portail ouvrier (Feuille d'émargement, photo daily)
│   ├── api.ts          # Client Axios configuré pour l'API REST
│   ├── index.css       # Système de design global & Jet de variables CSS
│   ├── App.tsx         # Routage principal (React Router)
│   └── main.tsx        # Point d'entrée de l'application React
├── package.json        # Dépendances & scripts npm
├── tsconfig.json       # Configuration TypeScript
└── vite.config.ts      # Fichier de configuration Vite
```

---

## ⚙️ Configuration & Lancement

### 1. Variables d'environnement
L'application utilise un client HTTP configuré dans `src/api.ts` pour communiquer avec l'API backend fonctionnant par défaut sur `http://localhost:3001`.

### 2. Installation des dépendances
```bash
npm install
```

### 3. Lancer en mode développement
Démarre le serveur de développement Vite localement :
```bash
npm run dev
```

### 4. Compiler pour la production
Génère la version optimisée et prête pour le déploiement dans le répertoire `/dist` :
```bash
npm run build
```

### 5. Prévisualiser le build de production
```bash
npm run preview
```
