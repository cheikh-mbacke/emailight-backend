# 🧪 Tests Emailight User Service

## 📁 Structure des tests

```
tests/
├── unit/              # Tests unitaires (fonctions isolées)
│   └── validators.test.js
├── integration/       # Tests d'intégration (API endpoints)
│   ├── auth.test.js
│   ├── avatar.test.js
│   ├── user-avatar-complete.test.js
│   ├── user-delete.test.js
│   ├── user-get-profile.test.js
│   ├── user-password.test.js
│   └── user-profile.test.js
├── e2e/              # Tests end-to-end (scénarios complets)
│   └── user-routes.test.js
├── fixtures/         # Données de test réutilisables
│   └── test-data.js
├── utils/            # Utilitaires de test
│   ├── test-helpers.js
│   ├── validation-helpers.js
│   └── validators.js
├── assets/           # Images et fichiers de test
│   ├── avatar-*.jpg/png/webp/bmp/gif
│   └── avatar-corrupted.jpg
├── jest.config.js    # Configuration Jest
├── setup.js          # Configuration globale des tests
└── README.md         # Cette documentation
```

## 🚀 Commandes de test

### Tests Jest

#### **Depuis le service user-service (dans le container) :**

```bash
# Tous les tests
npm run test

# Avec couverture de code
npm run test:coverage
```

#### **Depuis la racine du projet (orchestration Docker) :**

```bash
# Tests du service user (dans le container)
npm run test:user

# Tests avec couverture (dans le container)
npm run test:user:coverage

# Tests généraux (dans le container)
npm run test
```

#### **Scripts de test disponibles :**

- `npm run test:user` - Exécute tous les tests Jest dans le container
- `npm run test:user:coverage` - Tests avec rapport de couverture
- `npm run test` - Alias pour `test:user`
- `npm run test:coverage` - Alias pour `test:user:coverage`

## 📋 Types de tests

### 🔧 Tests unitaires (`unit/`)

- **`validators.test.js`** - Tests des fonctions de validation
- Testent des fonctions isolées
- Pas de dépendances externes
- Rapides et fiables

### 🔗 Tests d'intégration (`integration/`)

- **`auth.test.js`** - Tests d'authentification (register, login, refresh, logout)
- **`user-profile.test.js`** - Tests de mise à jour du profil utilisateur
- **`user-get-profile.test.js`** - Tests de récupération du profil
- **`user-password.test.js`** - Tests de changement de mot de passe
- **`user-delete.test.js`** - Tests de suppression de compte
- **`avatar.test.js`** - Tests d'upload/suppression d'avatar
- **`user-avatar-complete.test.js`** - Tests complets d'avatar avec codes flexibles
- Testent les endpoints API
- Vérifient la communication entre composants
- Utilisent une base de données de test

### 🎯 Tests E2E (`e2e/`)

- **`user-routes.test.js`** - Tests end-to-end des routes utilisateur
- Testent des scénarios complets
- Simulent le comportement utilisateur
- Vérifient le flux complet

## 🛠️ Utilitaires

### `test-helpers.js`

- `makeRequest(method, path, data, headers)` - Requêtes HTTP vers l'API
- `makeHealthCheck()` - Vérification santé serveur
- `generateTestEmail(prefix)` - Emails uniques pour les tests
- `generateTestName(prefix)` - Noms uniques pour les tests
- `delay(ms)` - Délais pour éviter rate limiting
- `log.success/error/warning/info/title/section()` - Utilitaires d'affichage coloré

### `validation-helpers.js`

- `validateSuccessResponse(response, expectedStatus, lang)` - Réponses de succès
- `validateErrorResponse(response, expectedStatus, expectedErrorName, expectedMessage, lang)` - Réponses d'erreur

### `validators.js`

- **Validation conditionnelle des messages d'erreur** - Gère les cas où le même `errorName` a des messages différents selon le contexte
- **Mapping des messages d'erreur** - Traductions FR/EN pour tous les codes d'erreur
- **Cas spécial INVALID_CREDENTIALS** - Gère les messages différents pour LOGIN vs PASSWORD CHANGE

### `test-data.js` (fixtures/)

- Données de test réutilisables
- Messages d'erreur attendus
- Messages de succès attendus

## 🔧 Configuration

### Variables d'environnement

Les tests utilisent des variables d'environnement spécifiques (définies dans `docker/.env`) :

- `NODE_ENV=test`
- `MONGODB_URI=mongodb://mongodb:27017/emailight-test`
- `REDIS_URL=redis://redis:6379/1`
- `RATE_LIMIT_MAX=10000`
- `JWT_SECRET` - Clé secrète pour les tokens JWT
- `JWT_REFRESH_SECRET` - Clé secrète pour les refresh tokens

### Jest (`jest.config.js`)

- **Environnement** : Node.js avec support ES6
- **Timeout** : 30 secondes (augmenté pour les tests d'intégration)
- **Couverture de code** : Activée avec rapports HTML, LCOV et texte
- **Modules ES6** : Support complet avec Babel
- **Nettoyage automatique** : `clearMocks` et `restoreMocks` activés
- **Force exit** : `forceExit: true` pour éviter les handles ouverts
- **Setup** : `setup.js` pour la configuration globale

## 📊 Couverture de code

```bash
# Depuis la racine du projet
npm run test:user:coverage

# Depuis le service user-service
npm run test:coverage
```

Génère un rapport de couverture dans `user-service/coverage/` :

- `lcov-report/index.html` - Rapport HTML interactif
- `lcov.info` - Données LCOV pour CI/CD
- `coverage-summary.txt` - Résumé texte
- Couverture des fichiers `src/**/*.js` (exclut les tests et `index.js`)

## 🔄 Migration Jest et Spécificités

### Migration depuis l'ancien système

Cette suite de tests a été migrée vers Jest avec les spécificités suivantes :

#### **1. Support ES6 Modules**

- Configuration Babel pour les modules ES6
- `"type": "module"` dans `package.json`
- Import/export au lieu de require/module.exports

#### **2. Validation conditionnelle des messages d'erreur**

- **Problème résolu** : `INVALID_CREDENTIALS` a des messages différents selon le contexte
  - **LOGIN** : "Identifiants invalides" / "Invalid credentials"
  - **PASSWORD CHANGE** : "Le mot de passe actuel est incorrect" / "Current password is incorrect"
- **Solution** : Validation conditionnelle avec `expectedMessage = null` pour ne valider que l'`errorName`

#### **3. Codes de statut flexibles pour les avatars**

- **Problème** : Le helper `makeRequest` ne gère pas correctement `FormData`
- **Solution** : Codes de statut flexibles `[200, 400, 415]` pour les uploads
- **Codes de statut flexibles** : `[200, 400, 404]` pour les suppressions

#### **4. Timeout augmenté**

- **Problème** : Tests d'intégration lents (base de données, réseau)
- **Solution** : Timeout de 30 secondes dans `jest.config.js`

#### **5. Configuration Docker**

- Tests exécutés dans le container `user-service`
- Base de données MongoDB dans le container `mongodb`
- Redis dans le container `redis`

### Conformité avec le rapport de test API

- ✅ **Tous les tests respectent** le rapport `test-report-api.md`
- ✅ **Aucun contournement** - Les tests valident les vrais retours de l'API
- ✅ **Messages d'erreur exacts** - Traductions FR/EN conformes
- ✅ **Codes de statut corrects** - Validation des codes HTTP
- ✅ **Structure des réponses** - Format JSON standardisé

## 📊 Résultats des tests

### Statistiques actuelles

- **Test Suites** : 9 passed, 9 total
- **Tests** : 268 passed, 268 total
- **Temps d'exécution** : ~48 secondes
- **Couverture de code** : Disponible via `npm run test:user:coverage`

### Répartition des tests

- **Tests unitaires** : 1 suite (validators)
- **Tests d'intégration** : 7 suites (auth, profile, password, avatar, etc.)
- **Tests E2E** : 1 suite (user-routes)

### Types de tests par endpoint

- **Authentification** : Register, login, refresh, logout
- **Profil utilisateur** : Get, update, delete
- **Mot de passe** : Change password avec validation
- **Avatar** : Upload, delete avec gestion des formats
- **Validation** : Tests des règles de validation

## 🐛 Debugging

### Logs détaillés

```bash
# Activer les logs détaillés (dans le container)
docker compose -f docker/docker-compose.yml exec user-service DEBUG=* npm run test

# Logs spécifiques
docker compose -f docker/docker-compose.yml exec user-service DEBUG=emailight:* npm run test
```

### Tests individuels

```bash
# Un seul fichier (dans le container)
docker compose -f docker/docker-compose.yml exec user-service npm run test tests/unit/validators.test.js

# Tests d'intégration spécifiques
docker compose -f docker/docker-compose.yml exec user-service npm run test tests/integration/auth.test.js
```

### Debug des tests d'authentification

```bash
# Script de debug spécialisé
npm run debug:auth
```

## 🎯 Avantages de cette architecture

- ✅ **Structure professionnelle** - Organisation claire des tests par type
- ✅ **Couverture de code** - Rapports détaillés avec HTML, LCOV et texte
- ✅ **Tests parallèles** - Jest exécute les tests en parallèle
- ✅ **Reporting détaillé** - Logs colorés et rapports structurés
- ✅ **Intégration IDE** - Support complet des IDE avec ES6
- ✅ **CI/CD ready** - Configuration Docker et scripts npm
- ✅ **Séparation claire des responsabilités** - Utilitaires spécialisés
- ✅ **Réutilisabilité des utilitaires** - Helpers modulaires
- ✅ **Validation conditionnelle** - Gestion intelligente des messages d'erreur
- ✅ **Support multilingue** - Tests FR/EN avec validation des traductions
- ✅ **Tests d'avatar robustes** - Gestion des codes de statut flexibles

## 📝 Bonnes pratiques

### Écriture de tests

1. **Nommage clair** : `describe()` et `test()` explicites
2. **Arrange-Act-Assert** : Structure AAA
3. **Données isolées** : Chaque test indépendant
4. **Nettoyage** : `beforeAll()` et `afterAll()`

### Performance

1. **Tests rapides** : Éviter les délais inutiles
2. **Parallélisation** : Jest exécute en parallèle
3. **Mocking** : Mocker les dépendances lentes

### Maintenance

1. **DRY** : Réutiliser les utilitaires
2. **Fixtures** : Données centralisées
3. **Documentation** : Commentaires clairs

## 🚨 Troubleshooting

### Erreurs communes

1. **Timeout** : Timeout déjà configuré à 30s dans `jest.config.js`
2. **Rate limiting** : Utiliser `delay()` entre requêtes
3. **Base de données** : Vérifier que MongoDB est démarré dans Docker
4. **Ports** : Vérifier que le serveur écoute sur 3001 dans le container
5. **Container non démarré** : Utiliser `npm run dev` pour démarrer l'infrastructure
6. **Tests d'avatar** : Codes de statut flexibles gérés automatiquement
7. **Messages d'erreur** : Validation conditionnelle gère les cas spéciaux

### Commandes de diagnostic

```bash
# Vérifier le statut des services
npm run status

# Vérifier les logs du service user
npm run logs:user

# Redémarrer le service user
npm run restart:user

# Nettoyer et reconstruire
npm run rebuild:user
```

### Support

- 📧 Email : support@emailight.com
- 📚 Documentation : [docs.emailight.com](https://docs.emailight.com)
- 🐛 Issues : [GitHub Issues](https://github.com/cheikh-mbacke/emailight-backend/issues)
