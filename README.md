# 🌙 Nightscout Viewer

Une application web moderne pour visualiser et analyser les données de votre serveur Nightscout. Conçue pour les personnes atteintes de diabète qui utilisent des systèmes de surveillance continue du glucose (CGM).

## ✨ Fonctionnalités

### 📊 Dashboard Interactif
- **Graphiques de tendance glycémique** avec visualisation en temps réel
- **Statistiques détaillées** : moyenne, min/max, écart-type, coefficient de variation
- **Time in Range (TIR)** avec calculs automatiques des zones cibles
- **Sélecteur de dates** pour analyser des périodes spécifiques
- **Vue journalière** avec statistiques détaillées par jour

### 📈 Visualisations Avancées
- Graphiques interactifs avec Recharts
- Affichage des traitements (insuline, glucides, corrections)
- Indicateurs de tendance glycémique
- Zones colorées pour les cibles glycémiques

### 📄 Génération de Rapports PDF
- Export de rapports personnalisés
- Inclusion de graphiques et statistiques
- Informations patient configurables
- Format professionnel pour les consultations médicales

### 🌐 Fonctionnalités Multilingues
- Support complet du français et de l'anglais
- Interface traduite avec react-i18next
- Configuration i18n optimisée

### 📱 Design Responsive
- Interface adaptée mobile, tablette et desktop
- Design moderne avec Tailwind CSS
- Composants UI avec Radix UI
- Mode sombre/clair

### 🔗 Intégrations
- **MyDiabby** : Envoi direct des données
- **Partage social** : Liens de partage optimisés
- **Analytics** : Suivi des performances (optionnel)

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/nightscout-viewer.git
cd nightscout-viewer

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Scripts disponibles

```bash
npm run dev      # Démarrage en mode développement
npm run build    # Build de production
npm run start    # Démarrage en mode production
npm run lint     # Vérification du code avec ESLint
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# URL de base de votre application
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com

# Google Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Vérification Google Search Console (optionnel)
GOOGLE_SITE_VERIFICATION=votre-code-verification
```

### Configuration Nightscout

1. Accédez à l'application
2. Cliquez sur "Se connecter"
3. Entrez l'URL de votre serveur Nightscout
4. Ajoutez votre token d'authentification (optionnel mais recommandé)

## 📁 Structure du Projet

```
nightscout-viewer/
├── app/                    # Pages Next.js 13+ (App Router)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   ├── login/             # Page de connexion
│   └── globals.css        # Styles globaux
├── components/            # Composants React
│   ├── dashboard/         # Composants du dashboard
│   └── ui/               # Composants UI réutilisables
├── lib/                  # Utilitaires et services
├── types/                # Types TypeScript
│   └── nightscout.ts     # Types pour les données Nightscout
├── public/               # Assets statiques
└── i18n.js              # Configuration internationalisation
```

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Framework CSS utilitaire
- **Radix UI** - Composants UI accessibles

### Visualisation & Charts
- **Recharts** - Graphiques interactifs
- **Lucide React** - Icônes modernes

### PDF & Export
- **jsPDF** - Génération de rapports PDF
- **date-fns** - Manipulation des dates

### Internationalisation
- **react-i18next** - Traduction multilingue
- **next-i18next** - Intégration Next.js

### Analytics & SEO
- **@vercel/analytics** - Analytics
- **next-seo** - Optimisation SEO

## 📊 Types de Données Supportés

### Entrées Glycémiques (Entries)
- Valeurs de glucose (sgv)
- Direction et tendance
- Horodatage
- Type de dispositif

### Traitements (Treatments)
- Bolus d'insuline
- Corrections de glucides
- Basales temporaires
- Notes et commentaires

### Profils
- Ratios glucides/insuline
- Sensibilités
- Basales programmées
- Cibles glycémiques

## 🎨 Personnalisation

### Thèmes
L'application supporte les modes sombre et clair automatiquement.

### Composants UI
Les composants utilisent `class-variance-authority` pour une personnalisation facile des styles.

### Graphiques
Les graphiques sont entièrement configurables via les props des composants Recharts.

## 📈 Optimisations SEO

Le projet inclut des optimisations SEO complètes :

- **Métadonnées** optimisées pour chaque page
- **Open Graph** et **Twitter Cards**
- **Schema.org JSON-LD** pour les données structurées
- **Sitemap.xml** automatique
- **Robots.txt** optimisé
- **Manifest.json** pour PWA

Voir `SEO_OPTIMIZATIONS.md` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de Code
- Utilisez TypeScript pour tout nouveau code
- Suivez les conventions ESLint configurées
- Ajoutez des tests pour les nouvelles fonctionnalités
- Documentez les nouvelles APIs

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

### Problèmes courants

**L'application ne se connecte pas à Nightscout :**
- Vérifiez l'URL de votre serveur Nightscout
- Assurez-vous que votre serveur est accessible
- Vérifiez votre token d'authentification

**Les données ne s'affichent pas :**
- Vérifiez la période sélectionnée
- Assurez-vous que des données existent pour cette période
- Vérifiez les permissions de votre token

### Contact
- **Issues GitHub** : [Créer une issue](https://github.com/votre-username/nightscout-viewer/issues)
- **Discussions** : [Forum GitHub](https://github.com/votre-username/nightscout-viewer/discussions)

## 🙏 Remerciements

- **Nightscout Foundation** pour l'écosystème Nightscout
- **Communauté diabète** pour les retours et suggestions
- **Contributeurs open source** pour les bibliothèques utilisées

---

**Note** : Cette application est un outil de visualisation et ne remplace pas les conseils médicaux. Consultez toujours votre équipe médicale pour les décisions de traitement.
