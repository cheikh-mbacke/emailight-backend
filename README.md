# 🚀 Emailight Backend - Microservices Platform

Backend microservices pour Emailight - Application de reformulation d'emails par IA.

## 🏗️ Architecture

- **Infrastructure** : MongoDB, Redis, Exceptionless (monitoring)
- **Services** : user-service (authentification & gestion utilisateurs)
- **Containerisé** : Docker Compose pour l'environnement de développement

## 🎯 Démarrage rapide

```bash
# 1. Configuration
cp docker/.env.example docker/.env
# Éditer docker/.env avec vos configurations

# 2. Démarrage
npm run dev

# 3. Vérification
npm run status
```

## 🧪 Tests automatisés

### Tests d'authentification (34 tests)

```bash
# Tests complets avec nettoyage
npm run test:user:auth:clean

# Tests simples
npm run test:user:auth
```

**Couverture des tests :**

- ✅ POST /api/v1/auth/register (18 tests)
- ✅ POST /api/v1/auth/login (16 tests)
- ✅ Validation des traductions FR/EN
- ✅ Codes de statut et format des réponses

## 📋 Scripts disponibles

### 🚀 **Gestion des services**

```bash
npm run dev              # Démarrer tous les services
npm run status           # Statut des services
npm run stop             # Arrêter tous les services
npm run restart:user     # Redémarrer user-service
npm run logs:user        # Voir les logs
```

### 🧪 **Tests**

```bash
npm run test:user:auth        # Tests d'authentification
npm run test:user:auth:clean  # Tests + nettoyage DB
```

### 🧹 **Nettoyage**

```bash
npm run clean            # Nettoyer containers et volumes
npm run clean:user       # Nettoyer uniquement user-service
npm run clean:force      # Nettoyage forcé complet
```

## 🌐 Endpoints principaux

- **API Base** : http://localhost:3001/api/v1
- **Health** : http://localhost:3001/health
- **Swagger** : http://localhost:3001/docs

### 🔐 Authentification

- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/google` - OAuth Google

### 👤 Utilisateurs

- `GET /api/v1/auth/profile` - Profil utilisateur
- `PUT /api/v1/auth/profile` - Mise à jour profil
- `POST /api/v1/users/avatar` - Upload avatar

## 🐳 Workflow Docker

Tous les services s'exécutent dans Docker Compose :

```
Host System ──► Docker Compose ──► Containers
     │                 │              │
npm run dev      docker compose    user-service
npm run test     docker exec       mongodb
npm run logs     docker logs       redis
```

## 🔧 Configuration

### Variables d'environnement

Fichier `docker/.env` :

```env
# MongoDB
MONGO_ROOT_USERNAME=emailight_admin
MONGO_ROOT_PASSWORD=your_secure_password

# JWT Security
JWT_SECRET=your_super_secret_jwt_key_32_chars_min
ENCRYPTION_KEY=your_64_char_hex_encryption_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gmail OAuth (pour connexions email)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
```

## 🛡️ Sécurité

- **Authentification JWT** avec refresh tokens
- **OAuth Google & Gmail** intégré
- **Rate limiting** configuré
- **Validation stricte** des entrées
- **Chiffrement** des credentials SMTP
- **Monitoring** avec Exceptionless

## 🌍 Internationalisation

- **Langues supportées** : Français (FR), Anglais (EN)
- **Détection automatique** de langue
- **Messages d'erreur traduits**
- **Service centralisé** i18n

## 📊 Monitoring

- **Health checks** pour tous les services
- **Logs structurés** avec contexte
- **Exceptionless** pour le suivi d'erreurs
- **Métriques** de performance

## 🗂️ Structure du projet

```
emailight-backend/
├── docker/                 # Configuration Docker Compose
├── user-service/          # Service d'authentification
│   ├── src/               # Code source
│   ├── scripts/           # Scripts de test automatisés
│   └── uploads/           # Fichiers uploadés
├── shared/                # Modules partagés
└── scripts/               # Scripts d'infrastructure
```

## 🚨 Support et debugging

### Problèmes courants

```bash
# Service non accessible
npm run restart:user
npm run logs:user

# Base de données corrompue
npm run clean:user:complete
npm run dev

# Tests qui échouent
npm run test:user:auth:clean
```

### Logs détaillés

```bash
npm run logs              # Tous les logs
npm run logs:user         # User-service uniquement
npm run logs:mongo        # MongoDB
npm run logs:redis        # Redis
```

---

## 📄 Licence

MIT License - voir le fichier LICENSE

## 👨‍💻 Auteur

**Mbacke Cheikh**

- Email : mbackecheikh@example.com
- Projet : Emailight

---

**🎯 Prêt pour la production avec Docker Compose !**
