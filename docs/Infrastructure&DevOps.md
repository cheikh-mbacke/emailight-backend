# 🏗️ Infrastructure & DevOps - Emailight Backend

> **Module de documentation** : Infrastructure et environnement de développement  
> **Version** : 1.0.0  
> **Dernière mise à jour** : Juin 2025  
> **Scope** : Docker Compose, bases de données, monitoring, scripts DevOps

---

## 📋 Vue d'ensemble

Cette documentation couvre **exclusivement** l'infrastructure et l'outillage DevOps du projet Emailight Backend. Elle détaille la containerisation Docker, la gestion des bases de données, le monitoring des erreurs et tous les scripts d'automatisation.

### Périmètre technique
- **Containerisation** : Docker Compose avec les différents services
- **Bases de données** : MongoDB (métier) + PostgreSQL (monitoring) + Redis (cache)
- **Monitoring** : GlitchTip pour error tracking
- **Admin tools** : Mongo Express + Redis Commander
- **Scripts NPM** : 25+ commandes d'automatisation
- **Configuration** : Variables d'environnement sécurisées

---

## 🐳 Architecture Docker Compose

### Structure des services

```yaml
Services :
├── Infrastructure (4 containers)
│   ├── mongodb          # Base principale
│   ├── redis            # Cache/sessions  
│   ├── postgres         # Base monitoring
│   └── glitchtip-redis  # Cache monitoring
├── Admin UI (2 containers)
│   ├── mongo-express    # Interface MongoDB
│   └── redis-commander  # Interface Redis
└── Monitoring (3 containers)
    ├── glitchtip-web    # Interface GlitchTip
    ├── glitchtip-worker # Traitement événements
    └── glitchtip-migrate# Migrations DB
```

### Réseau et volumes

```yaml
Réseau :
  emailight-network:
    - Type: bridge
    - Isolation complète des services
    - Communication inter-services par nom

Volumes persistants :
  mongodb_data:         # Données MongoDB
  redis_data:          # Cache Redis
  postgres_data:       # Données PostgreSQL
  glitchtip_uploads:   # Fichiers GlitchTip
```

---

## 💾 Configuration des bases de données

### MongoDB - Base métier principale

#### **Configuration container**
```yaml
Image: mongo:7.0
Port mapping: 27018:27017
Authentification: Root + App user
Volume: mongodb_data:/data/db
```

#### **Comptes utilisateurs**
```javascript
// Compte administrateur
{
  user: "emailight_admin",
  password: "${MONGO_ROOT_PASSWORD}",
  roles: ["root"]
}

// Compte applicatif
{
  user: "emailight_app", 
  password: "${MONGO_APP_PASSWORD}",
  roles: [{ role: "readWrite", db: "emailight" }]
}
```
### Redis - Cache et sessions

#### **Configuration**
```yaml
Image: redis:7.2-alpine
Port mapping: 6390:6379
Authentification: Password protected
Persistance: redis_data:/data
Config: ./docker/redis/redis.conf
```

#### **Utilisation prévue (<em>A mettre à jour régulièrement</em>)**
```redis
# Sessions utilisateurs
SESSION:user:123 -> {userId, email, authToken, expiry}

# Cache API responses  
CACHE:api:/users/123 -> {userData}

# Rate limiting
RATE_LIMIT:user:123:email_send -> count_per_hour

# Queues (futures)
QUEUE:email_processing -> [job1, job2, job3]
```

### PostgreSQL - Base monitoring

#### **Configuration**
```yaml
Image: postgres:17
Port mapping: 5433:5432
Usage: Exclusivement GlitchTip
Base: glitchtip
User: glitchtip_user
```

---

## 📊 Monitoring avec GlitchTip

### Architecture GlitchTip

```yaml
Services monitoring :
├── glitchtip-web      # Interface utilisateur (port 8090)
├── glitchtip-worker   # Traitement async des événements
├── glitchtip-migrate  # Migrations de base au démarrage
└── glitchtip-redis    # Cache dédié (port 6381)
```

### Configuration détaillée

#### **Variables d'environnement**
```bash
# Base de données
DATABASE_URL=postgres://glitchtip_user:pwd@postgres:5432/glitchtip

# Cache et queues
REDIS_URL=redis://glitchtip-redis:6379/0

# Sécurité et domaine
SECRET_KEY=<64-char-hex-key>
GLITCHTIP_DOMAIN=http://localhost:8090
DEFAULT_FROM_EMAIL=noreply@emailight.local

# Performance
CELERY_WORKER_AUTOSCALE=1,3  # Min 1, max 3 workers
```

#### **Fonctionnalités disponibles**
```yaml
Error Tracking:
  - Stack traces détaillées
  - Groupement automatique d'erreurs
  - Context et breadcrumbs
  - Source maps support

Performance Monitoring:
  - Transaction traces
  - Database query monitoring  
  - Custom metrics
  - Alertes de performance

Alertes:
  - Email notifications
  - Webhook integrations
  - Slack/Discord support
  - Seuils configurables
```

### Premier setup GlitchTip

```bash
1. Démarrer : npm run dev:glitch
2. Accéder : http://localhost:8090
3. Créer compte admin
4. Créer organisation "Emailight"
5. Créer projet "Backend"
6. Récupérer DSN pour integration
```

---

## 👥 Interfaces d'administration

### Mongo Express - Admin MongoDB

#### **Accès et sécurité**
```yaml
URL: http://localhost:8082
Credentials: admin / admin
Protection: Basic Auth
Connexion: Via compte emailight_admin
```

#### **Fonctionnalités principales**
```yaml
Navigation:
  - Explorer bases de données
  - Voir collections et documents
  - Requêtes en temps réel
  - Import/export JSON/CSV

Gestion:
  - Créer/modifier/supprimer documents
  - Gestion des index
  - Statistiques de collection
  - Validation des schémas
```

### Redis Commander - Admin Redis

#### **Configuration**
```yaml
URL: http://localhost:8081  
Credentials: admin / admin
Connexion: redis:6379 avec mot de passe
Interface: Web moderne et responsive
```

#### **Fonctionnalités**
```yaml
Exploration:
  - Browser de clés avec patterns
  - Inspection des valeurs (String, Hash, List, Set, ZSet)
  - TTL et expiration
  - Memory usage par clé

Monitoring:
  - Info serveur en temps réel
  - Statistiques de performance
  - Slowlog queries
  - Client connections

Gestion:
  - CRUD operations sur toutes les structures
  - Bulk operations
  - Import/export
  - Configuration runtime
```

---

## 🛠️ Scripts NPM détaillés

### Scripts de développement

#### **Démarrage complet**
```bash
npm run dev
# Démarre: Infrastructure + Admin + Monitoring (tous les containers)
# Post-action: Affiche status + URLs + tips
# Usage: Développement quotidien complet
```

#### **Démarrage modulaire**
```bash
npm run dev:infra
# Démarre: mongodb + redis + postgres + glitchtip-redis
# Usage: Développement backend pur, CI/CD, environnement minimal

npm run dev:admin  
# Démarre: mongo-express + redis-commander
# Prérequis: dev:infra déjà lancé
# Usage: Debugging, administration de données

npm run dev:glitch
# Démarre: postgres + glitchtip-redis + glitchtip-web + glitchtip-worker + glitchtip-migrate
# Usage: Test monitoring, configuration GlitchTip, développement dashboards
```

### Scripts de monitoring

#### **Status personnalisé**
```bash
npm run status
# Exécute: node scripts/status.js
# Affichage: Formaté par catégories avec emojis
# Informations: État, ports, santé, liens rapides

npm run status:raw
# Exécute: docker compose ps
# Affichage: Format Docker brut
# Usage: Debugging, scripts automatisés
```

#### **Logs ciblés**
```bash
npm run logs
# Affiche: Tous les services en temps réel
# Format: Coloré avec timestamps

npm run logs:mongo
# Affiche: MongoDB uniquement
# Usage: Debug connexions, requêtes lentes

npm run logs:redis  
# Affiche: Redis uniquement
# Usage: Debug cache, sessions

npm run logs:glitch
# Affiche: GlitchTip web + worker
# Usage: Debug monitoring, erreurs

npm run logs:postgres
# Affiche: PostgreSQL uniquement  
# Usage: Debug GlitchTip, requêtes DB
```

### Scripts de nettoyage

#### **Nettoyage progressif**
```bash
npm run clean:containers
# Action: docker compose down --remove-orphans
# Garde: Volumes de données
# Usage: Redémarrage propre sans perte de données

npm run clean:volumes
# Action: docker compose down -v  
# Supprime: Données MongoDB, Redis, PostgreSQL
# Usage: Reset complet des données

npm run clean
# Action: clean:volumes + --remove-orphans
# Supprime: Containers + volumes + orphelins
# Usage: Reset complet standard

npm run clean:all
# Action: clean + docker volume prune + docker network prune
# Supprime: Tout + nettoyage système Docker
# Usage: Nettoyage profond, libération d'espace

npm run clean:force
# Action: Force arrêt + suppression brutale
# Usage: Dépannage quand Docker bloque
```

### Scripts de gestion

#### **Contrôle des services**
```bash
npm run stop
# Action: docker compose down
# Garde: Volumes intacts
# Usage: Arrêt propre en fin de journée

npm run restart
# Action: docker compose restart
# Effet: Redémarre tous les containers
# Usage: Reload configuration, debug

npm run restart:glitch
# Action: Redémarre uniquement GlitchTip web + worker
# Usage: Debug monitoring sans affecter les données

npm run stop:glitch  
# Action: Arrête GlitchTip migrate + web + worker
# Usage: Libérer ressources, debug isolation
```

### Scripts de configuration

#### **Setup initial**
```bash
npm run setup
# Exécute: node scripts/setup.js
# Actions:
#   1. Copie .env.example vers .env (si inexistant)
#   2. Génère clé secrète GlitchTip sécurisée  
#   3. Affiche checklist de sécurité
#   4. Guide next steps
# Usage: Première installation, onboarding équipe
```

#### **Post-développement**
```bash
npm run postdev  
# Exécute: Automatiquement après 'npm run dev'
# Actions:
#   1. Vérifie status containers (avec délai)
#   2. Affiche containers actifs
#   3. Liste URLs accessibles avec credentials
#   4. Tips et commandes utiles
#   5. Guide setup GlitchTip si applicable
```

---

## ⚙️ Configuration avancée

### Variables d'environnement détaillées

#### **Sécurité - Mots de passe**
```bash
# MongoDB
MONGO_ROOT_PASSWORD=<64-char-secure-password>
MONGO_APP_PASSWORD=<64-char-secure-password>

# Redis  
REDIS_PASSWORD=<64-char-secure-password>

# GlitchTip PostgreSQL
GLITCHTIP_POSTGRES_PASSWORD=<64-char-secure-password>

# GlitchTip Application
GLITCHTIP_SECRET_KEY=<64-char-hex-key>  # openssl rand -hex 32
```

#### **Ports et exposition**
```bash
# Ports externes (customisables)
MONGO_PORT=27018              # MongoDB
REDIS_PORT=6390               # Redis principal
GLITCHTIP_POSTGRES_PORT=5433  # PostgreSQL
GLITCHTIP_REDIS_PORT=6381     # Redis GlitchTip
GLITCHTIP_WEB_PORT=8090       # Interface GlitchTip
MONGO_EXPRESS_PORT=8082       # Admin MongoDB
REDIS_COMMANDER_PORT=8081     # Admin Redis
```

#### **Configuration applicative**
```bash
# Environnement
NODE_ENV=development  # development|staging|production

# GlitchTip Email (développement)
GLITCHTIP_EMAIL_URL=consolemail://     # Affichage console
GLITCHTIP_DOMAIN=http://localhost:8090 # URL publique
GLITCHTIP_FROM_EMAIL=noreply@emailight.local

# MongoDB
MONGO_DATABASE=emailight        # Base principale
MONGO_APP_USERNAME=emailight_app

# Admin interfaces
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=admin
REDIS_COMMANDER_USER=admin  
REDIS_COMMANDER_PASSWORD=admin
```

### Fichiers de configuration

#### **MongoDB init script**
```javascript
// docker/mongodb/init-mongo.js
// - Création utilisateur applicatif
// - Setup collections avec validation
// - Création index optimisés
// - Messages de confirmation
```

#### **Redis configuration**
```conf
# docker/redis/redis.conf
# - Paramètres de performance
# - Configuration mémoire
# - Persistance
# - Logging
```