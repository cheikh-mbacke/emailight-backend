# 🚀 Guide d'utilisation rapide - Tests d'authentification

## 🎯 Lancement rapide

### **🐳 Tous les tests se lancent via Docker Compose depuis la racine :**

```bash
# Option 1 : Tests simples
npm run test:user:auth

# Option 2 : Tests avec nettoyage (recommandé)
npm run test:user:auth:clean
```

**⚠️ Important :** Les scripts s'exécutent dans le container `emailight-user-service`

## 📋 Prérequis

1. **Démarrer l'infrastructure** :

   ```bash
   npm run dev
   ```

2. **Vérifier le statut** :
   ```bash
   npm run status
   ```

## 🧪 Que testons-nous ?

### ✅ **POST /api/v1/auth/register** (18 tests)

- Inscription valide (FR/EN)
- Gestion des erreurs de validation
- Messages d'erreur traduits
- Codes de statut appropriés

### ✅ **POST /api/v1/auth/login** (16 tests)

- Connexion valide (FR/EN)
- Identifiants invalides
- Validation des champs
- Traductions des erreurs

## 📊 Résultats attendus

```bash
🔥 Résultats des tests d'authentification

Total des tests : 34
✅ Réussis : 34
❌ Échoués : 0
📊 Taux de réussite : 100%
```

## 🐛 En cas de problème

```bash
# 1. Redémarrer les services
npm run restart:user

# 2. Vérifier les logs
npm run logs:user

# 3. Nettoyer et relancer
npm run test:user:auth:clean
```

## 🎨 Scripts disponibles

| Script                 | Description                        |
| ---------------------- | ---------------------------------- |
| `test:user:auth`       | Lance les tests d'authentification |
| `test:user:auth:clean` | Nettoie la DB puis lance les tests |

---

**💡 Astuce** : Utilisez toujours `test:user:auth:clean` pour des résultats fiables !
