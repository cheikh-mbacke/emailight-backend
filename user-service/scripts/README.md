# 🧪 Scripts de Tests Automatisés

Ce dossier contient les scripts d'automatisation des tests pour le service utilisateur d'Emailight.

## 📋 Scripts disponibles

### `auth-testing.js` - Tests d'Authentification Automatisés

Script qui automatise tous les tests d'authentification (inscription et connexion) avec vérification des traductions FR/EN.

#### 🎯 Fonctionnalités

- **Tests d'inscription** : Validation complète avec tous les cas d'erreur
- **Tests de connexion** : Vérification des identifiants et gestion d'erreurs
- **Traductions** : Validation des messages en français et anglais
- **Format des réponses** : Vérification de la structure JSON des réponses
- **Codes de statut** : Validation des codes HTTP appropriés
- **Affichage coloré** : Résultats visuels avec couleurs et émojis

#### 🚀 Utilisation

**🐳 Depuis la racine du projet (avec Docker Compose - RECOMMANDÉ) :**

```bash
npm run test:user:auth        # Tests d'authentification
npm run test:user:auth:clean  # Nettoyage DB + tests
```

Ces commandes exécutent les scripts depuis l'intérieur du container Docker `emailight-user-service`.

#### 📊 Tests inclus

##### **POST /api/v1/auth/register** (18 tests)

- ✅ Inscription valide (FR/EN)
- ❌ Email déjà utilisé (FR/EN)
- ❌ Mot de passe trop court (FR/EN)
- ❌ Email invalide (FR/EN)
- ❌ Nom trop court (FR/EN)
- ❌ Validation - Nom manquant (FR/EN)
- ❌ Validation - Email manquant (FR/EN)
- ❌ Validation - Mot de passe manquant (FR/EN)
- ❌ Validation - Corps vide (FR/EN)

##### **POST /api/v1/auth/login** (16 tests)

- ✅ Connexion valide (FR/EN)
- ❌ Email inexistant (FR/EN)
- ❌ Mot de passe incorrect (FR/EN)
- ❌ Validation - Email manquant (FR/EN)
- ❌ Validation - Mot de passe manquant (FR/EN)
- ❌ Validation - Email invalide (FR/EN)
- ❌ Validation - Corps vide (FR/EN)

#### 📝 Format des résultats

```bash
🔥 Démarrage des tests d'authentification automatisés

ℹ️  URL de base : http://localhost:3001/api/v1
ℹ️  Vérification du serveur...
✅ Serveur accessible ✓

📋 Tests POST /api/v1/auth/register
✅ Register - Succès valide (FR) - PASSED
✅ Register - Succès valide (EN) - PASSED
✅ Register - Email déjà utilisé (FR) - PASSED
...

📋 Tests POST /api/v1/auth/login
✅ Login - Succès valide (FR) - PASSED
✅ Login - Succès valide (EN) - PASSED
...

🔥 Résultats des tests d'authentification

Total des tests : 34
✅ Réussis : 34
❌ Échoués : 0
📊 Taux de réussite : 100%
```

#### ⚙️ Configuration

Le script utilise les paramètres suivants :

```javascript
const CONFIG = {
  baseUrl: "http://localhost:3001",
  apiPrefix: "/api/v1",
  timeout: 10000,
  // Couleurs pour l'affichage...
};
```

#### 🔧 Personnalisation

Pour modifier le script :

1. **Changer l'URL du serveur** : Modifier `CONFIG.baseUrl`
2. **Ajouter de nouveaux tests** : Utiliser la méthode `runTest()`
3. **Modifier les validations** : Adapter `validateSuccessResponse()` ou `validateErrorResponse()`

#### 📋 Prérequis

- Le service user-service doit être démarré sur le port 3001
- La base de données MongoDB doit être accessible
- Redis doit être démarré pour la gestion des sessions

#### 🐛 Dépannage

**Erreur "Serveur non accessible" :**

```bash
# Vérifier que le service est démarré
npm run status:user

# Redémarrer si nécessaire
npm run restart:user
```

**Erreur de connexion à la base de données :**

```bash
# Vérifier l'infrastructure
npm run status:infra

# Redémarrer MongoDB
npm run restart:infra
```

#### 📖 Exemple d'utilisation

```bash
# 1. Démarrer l'infrastructure Docker
npm run dev

# 2. Lancer les tests (dans un autre terminal)
npm run test:auth:clean

# 3. Résultats attendus : 34 tests passés à 100%
```

**🐳 Workflow Docker Compose :**

- Les services tournent dans des containers
- Les scripts de test s'exécutent dans le container `emailight-user-service`
- Accès à l'API via `localhost:3001` (depuis l'intérieur du container)

---

**Auteur** : Équipe Emailight  
**Version** : 1.0.0  
**Dernière mise à jour** : 2024
