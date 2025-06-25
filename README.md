# Emailight Backend

Backend microservices pour Emailight - Application de reformulation d'emails par IA.

## 🏗️ Architecture

```
emailight-backend/
├── user-service/          # Authentification et gestion utilisateur
├── subscription-service/  # Abonnements et facturation Stripe
├── email-service/         # Gestion des comptes email et envoi
├── ai-service/           # Reformulation par IA
├── notification-service/ # Emails système et notifications
├── shared/              # Utilitaires partagés
├── docker/             # Configuration Docker
└── scripts/            # Scripts utilitaires
```

## 🚀 Test de l'infrastructure

### Prérequis
- Docker & Docker Compose
- Git

### Installation et test

1. **Cloner et configurer**
```bash
git clone <repo-url>
cd emailight-backend
npm run setup
```

**Note Windows** : Si vous êtes sur Windows, utilisez PowerShell ou Git Bash. Les commandes npm fonctionnent sur tous les systèmes.

2. **Configurer l'infrastructure**
```bash
# Éditer la configuration d'infrastructure
# Windows: notepad docker\.env
# Linux/macOS: nano docker/.env

# Pour un test rapide, vous pouvez garder les valeurs de développement par défaut
```

3. **Tester l'infrastructure**
```bash
# Démarrer MongoDB + Redis + interfaces d'administration
npm run dev

# Vérifier que tout fonctionne (après quelques secondes)
npm run status
```

**Le script affichera automatiquement les informations de connexion après le démarrage.**

4. **Interfaces disponibles**
- **MongoDB Admin**: http://localhost:8082 (admin/admin)
- **Redis Admin**: http://localhost:8081

## 🔧 Commandes de test

### Infrastructure de base
```bash
npm run dev           # MongoDB + Redis + interfaces admin
npm run dev:infra     # MongoDB + Redis uniquement
npm run status        # Vérifier l'état des containers
npm run stop          # Arrêter l'infrastructure
```

### Logs et debug
```bash
npm run logs          # Voir tous les logs
npm run logs:mongo    # Logs MongoDB uniquement
npm run logs:redis    # Logs Redis uniquement
```

### Maintenance
```bash
# Nettoyage normal (sûr) - seulement votre projet
npm run clean

# Redémarrer sans perdre les données
npm run restart

# Supprimer seulement les containers (garder volumes)
npm run clean:containers

# Supprimer containers + volumes (perte des données)
npm run clean:volumes

# Nettoyage global système (attention !)
npm run clean:all
```

## 📊 Vérification du bon fonctionnement

### 1. Containers actifs
```bash
npm run status
# Doit montrer : mongodb, redis, mongo-express, redis-commander
```

### 2. MongoDB accessible
- Interface web : http://localhost:8082
- Login : admin / admin
- Base de données `emailight_dev` doit être visible
- Collections `users` et `emailAccounts` doivent être créées

### 3. Redis accessible  
- Interface web : http://localhost:8081
- Redis doit être connecté et vide

## 🔄 Cycle de développement

**Phase actuelle** : Test d'infrastructure ✅
- [x] MongoDB configuré et accessible
- [x] Redis configuré et accessible  
- [x] Interfaces d'administration fonctionnelles
- [x] Scripts de base pour start/stop/logs

**Prochaines phases** :
- [ ] Développement du user-service
- [ ] Développement des autres microservices
- [ ] Tests d'intégration

## 💡 Workflow recommandé

### Test initial (une fois)
```bash
npm run setup    # Configuration
npm run dev      # Démarrage
npm run status   # Vérification
```

### Développement quotidien (plus tard)
```bash
npm run dev      # Infrastructure (garde en arrière-plan)
# + développement des services individuels
```

## 📊 Services et ports

| Service | Port | Description |
|---------|------|-------------|
| user-service | 3001 | Authentification, profils |
| subscription-service | 3002 | Abonnements Stripe |
| email-service | 3003 | Comptes email, envoi |
| ai-service | 3004 | Reformulation IA |
| notification-service | 3005 | Notifications système |
| MongoDB | 27017 | Base de données |
| Redis | 6379 | Cache et queues |
| Mongo Express | 8082 | Interface MongoDB |
| Redis Commander | 8081 | Interface Redis |

## 🔐 Variables d'environnement

Copiez `docker/.env.example` vers `docker/.env` et configurez :

- **Database** : MongoDB et Redis
- **JWT** : Clés de signature des tokens
- **Stripe** : Clés API et webhook
- **OAuth** : Google et Microsoft
- **IA** : OpenAI et Anthropic
- **SMTP** : Configuration email

## 📝 Développement

### Structure d'un service
```
service-name/
├── src/
│   ├── controllers/    # Logique métier
│   ├── models/        # Modèles de données
│   ├── routes/        # Définition des routes
│   ├── middleware/    # Middlewares spécifiques
│   ├── utils/         # Utilitaires
│   ├── config/        # Configuration
│   ├── app.js         # Configuration Fastify
│   └── server.js      # Point d'entrée
├── tests/             # Tests unitaires
├── Dockerfile         # Image Docker
└── package.json       # Dépendances
```

### Ajouter un nouveau service
1. Créer le dossier avec la structure standard
2. Ajouter le service dans `docker-compose.yml`
3. Configurer les routes et le port
4. Mettre à jour le README

## 🧪 Tests

```bash
# Tests par service
npm run test:user
npm run test:subscription
npm run test:email
npm run test:ai
npm run test:notification

# Tous les tests
npm test
```

## 📚 Documentation

- [Spécifications techniques](docs/technical-specs.md)
- [Spécifications fonctionnelles](docs/functional-specs.md)
- [Guide API](docs/api-guide.md)
- [Guide de déploiement](docs/deployment.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.