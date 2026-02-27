# EsthetikApp - Frontend

EsthetikApp est une application mobile de réservation de services esthétiques développée avec React Native et Expo. Elle permet aux clients de découvrir des professionnels, réserver des services et gérer leurs rendez-vous, tandis que les professionnels peuvent gérer leur activité, leurs prestations et communiquer avec leurs clients.

## 🎯 Fonctionnalités

### Authentification & Utilisateurs
- ✅ Inscription et connexion sécurisées (JWT)
- ✅ Gestion de profil utilisateur
- ✅ Trois rôles: Client, Professionnel, Admin
- ✅ Stockage sécurisé des tokens (SecureStore)
- ✅ Gestion d'état d'authentification globale

### Espace Client
- ✅ Recherche et découverte de professionnels
- ✅ Consultation des profils professionnels (services, portfolio, avis, horaires)
- ✅ Système de réservation de services
- ✅ Gestion des rendez-vous (historique, à venir, annulations)
- ✅ Système de favoris
- ✅ Dépôt d'avis et notations
- ✅ Notifications push pour les confirmations et rappels

### Espace Professionnel
- ✅ Dashboard avec statistiques et aperçu de l'activité
- ✅ Gestion de la bannière de profil (upload d'image)
- ✅ Configuration des informations du salon
- ✅ Gestion des services proposés (création, édition, suppression, tarifs)
- ✅ Gestion du portfolio (photos de réalisations)
- ✅ Gestion des rendez-vous (validation, refus, historique)
- ✅ Suivi des dépenses professionnelles
- ✅ Consultation des avis clients
- ✅ Configuration des horaires d'ouverture
- ✅ Notifications push pour les nouvelles réservations

### Notifications
- ✅ Notifications push natives (iOS & Android)
- ✅ Rappels locaux J-1 pour les rendez-vous
- ✅ Notifications foreground avec toast in-app
- ✅ Support Development Build uniquement (pas Expo Go)
- ✅ Gestion automatique des tokens push
- ✅ Notifications temps réel pour:
  - Nouvelles réservations (pros)
  - Changements de statut de réservation (clients)
  - Rappels de rendez-vous
  - Messages administratifs

### Administration
- ✅ Dashboard admin dédié
- ✅ Envoi de notifications broadcast
- ✅ Notifications ciblées (tous les clients ou tous les pros)
- ✅ Interface de test des notifications

### UX/UI
- ✅ Design moderne et responsive
- ✅ Navigation par tabs (clients) et drawer (pros)
- ✅ Toast notifications pour feedback utilisateur
- ✅ Gestion du clavier optimisée
- ✅ Support mode clair/sombre
- ✅ Animations et transitions fluides
- ✅ iOS et Android optimisés

## 🛠 Technologies

- **Framework**: React Native 0.81.5
- **SDK**: Expo ~54.0.20
- **Navigation**: Expo Router ~6.0.13
- **Langage**: TypeScript
- **Gestion d'état**: React Context API + Zustand
- **HTTP Client**: Axios
- **Authentification**: JWT + Expo SecureStore
- **Notifications**: expo-notifications ~0.32.12
- **UI Components**: React Native Paper, React Native Gesture Handler
- **Formulaires**: React Hook Form + Yup
- **Toast**: react-native-toast-message
- **Images**: Expo Image, Expo Image Picker

## 📦 Installation

### Prérequis
- Node.js (v18+)
- npm ou yarn
- Expo CLI
- iOS: Xcode (pour builds natifs)
- Android: Android Studio (pour builds natifs)

### Configuration

1. Cloner le repository
\`\`\`bash
git clone https://github.com/votre-username/esthetikapp.git
cd esthetikapp
\`\`\`

2. Installer les dépendances
\`\`\`bash
npm install
\`\`\`

3. Configurer les variables d'environnement
\`\`\`bash
cp .env.example .env
\`\`\`

Éditer \`.env\` et configurer:
\`\`\`env
API_URL=http://localhost:3000
EXPO_PROJECT_ID=your-expo-project-id
\`\`\`

4. Configuration de l'API dans \`config/api.config.ts\`
\`\`\`typescript
export const API_URL = process.env.API_URL || 'http://localhost:3000';
\`\`\`

## 🚀 Lancement

### Expo Go (limitations: pas de push notifications)
\`\`\`bash
npm start
\`\`\`

### Development Build (recommandé pour toutes les fonctionnalités)
\`\`\`bash
# iOS
npx expo run:ios

# Android
npx expo run:android
\`\`\`

### Production Build avec EAS
\`\`\`bash
# Se connecter à Expo
npx eas-cli login

# Build iOS
npx eas-cli build --profile production --platform ios

# Build Android
npx eas-cli build --profile production --platform android
\`\`\`

## 📱 Structure du Projet

\`\`\`
esthetikapp/
├── app/                      # Routes Expo Router
│   ├── (auth)/              # Écrans d'authentification
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/              # Navigation client (tabs)
│   │   ├── home.tsx
│   │   └── clientspace.tsx
│   ├── (pro)/               # Espace professionnel (drawer)
│   │   ├── dashboard.tsx
│   │   ├── services.tsx
│   │   ├── portfolio.tsx
│   │   ├── rdv.tsx
│   │   ├── banner.tsx
│   │   ├── about.tsx
│   │   ├── avis.tsx
│   │   └── depenses.tsx
│   ├── (admin)/             # Espace admin
│   │   └── dashboard.tsx
│   ├── _layout.tsx          # Layout racine avec providers
│   └── profile.tsx          # Profil public professionnel
├── components/              # Composants réutilisables
│   ├── ProfessionalCard.tsx
│   ├── ProDrawerContent.tsx
│   └── ui/
├── hooks/                   # Hooks personnalisés
│   ├── auth-context.tsx     # Contexte authentification
│   ├── notification-context.tsx
│   └── useAuth.tsx
├── services/                # Services API
│   ├── api.ts               # Instance Axios configurée
│   ├── user.service.ts
│   ├── booking.service.ts
│   ├── service.service.ts
│   ├── portfolio.service.ts
│   ├── review.service.ts
│   ├── expense.service.ts
│   ├── favorite.service.ts
│   └── notification.service.ts
├── utils/                   # Utilitaires
│   ├── toast.ts             # Wrappers toast
│   └── notifications.ts     # Helpers notifications
├── types/                   # Définitions TypeScript
├── config/                  # Configuration
│   └── api.config.ts
├── constants/               # Constantes et thèmes
└── assets/                  # Images, fonts, etc.
\`\`\`

## 🔐 Authentification

L'app utilise JWT pour l'authentification. Le token est stocké de manière sécurisée avec \`expo-secure-store\` et injecté automatiquement dans toutes les requêtes via un intercepteur Axios.

### Flux d'authentification:
1. Login → Récupération du token JWT
2. Stockage sécurisé du token
3. Configuration de l'intercepteur Axios
4. Redirection selon le rôle (client/pro/admin)

## 📲 Notifications Push

Les notifications push nécessitent un **Development Build** ou un **Production Build** (ne fonctionnent pas dans Expo Go).

### Configuration:
1. Ajouter votre \`projectId\` dans \`app.json\`:
\`\`\`json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
\`\`\`

2. Build avec EAS ou localement avec \`expo run:ios\` / \`expo run:android\`

### Types de notifications:
- **Push distantes**: Via expo-server-sdk (backend)
- **Locales**: Rappels J-1 pour les rendez-vous
- **Foreground**: Toast in-app
- **Background**: Bannière système native

## 🧪 Tests

### Comptes de test:

**Client:**
- Email: \`client@example.com\`
- Password: \`client123\`

**Professionnel:**
- Email: \`pro@example.com\`
- Password: \`pro123\`

**Admin:**
- Email: \`admin@esthetikapp.com\`
- Password: \`admin123\`

## 📝 Scripts Disponibles

\`\`\`bash
# Démarrer en mode développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur Web
npm run web

# Linter
npm run lint

# Reset du projet
npm run reset-project
\`\`\`

## 🔧 Configuration iOS

Pour les notifications push sur iOS, ajoutez les permissions dans \`app.json\`:
\`\`\`json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.esthetikapp",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "...",
        "NSPhotoLibraryUsageDescription": "..."
      }
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
\`\`\`

## 🐛 Dépannage

### Problème: Notifications ne fonctionnent pas
- ✅ Vérifier que vous utilisez un Development Build (pas Expo Go)
- ✅ Vérifier que les permissions sont accordées
- ✅ Vérifier le \`projectId\` dans app.json
- ✅ Vérifier que le backend est accessible

### Problème: Erreur de connexion API
- ✅ Vérifier que le backend est démarré
- ✅ Vérifier l'URL API dans \`config/api.config.ts\`
- ✅ Sur simulateur iOS: utiliser l'IP locale (pas localhost)

### Problème: Build échoue
- ✅ Nettoyer les caches: \`npx expo start -c\`
- ✅ Réinstaller les dépendances: \`rm -rf node_modules && npm install\`
- ✅ Vérifier la version de Node.js

## 🚀 Déploiement

### iOS (App Store)
\`\`\`bash
npx eas-cli build --profile production --platform ios
npx eas-cli submit --platform ios
\`\`\`

### Android (Play Store)
\`\`\`bash
npx eas-cli build --profile production --platform android
npx eas-cli submit --platform android
\`\`\`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit les changements (\`git commit -m 'Add some AmazingFeature'\`)
4. Push vers la branche (\`git push origin feature/AmazingFeature\`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteurs

Florian-Kevin Saraka

## 🔗 Liens Utiles

- [Documentation Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## 📞 Support

Pour toute question ou problème, ouvrir une issue sur GitHub.
