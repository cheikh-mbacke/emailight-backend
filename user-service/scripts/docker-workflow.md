# 🐳 Workflow Docker Compose - Tests d'Authentification

## 🎯 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HOST SYSTEM   │    │ DOCKER COMPOSE  │    │  USER-SERVICE   │
│                 │    │                 │    │   CONTAINER     │
│ npm run         │───▶│ docker exec     │───▶│ node scripts/   │
│ test:auth       │    │ user-service    │    │ auth-testing.js │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  API REQUESTS   │
                                               │ localhost:3001  │
                                               │ (depuis container)│
                                               └─────────────────┘
```

## 📋 Commandes disponibles

| Commande (racine)              | Action                             | Container |
| ------------------------------ | ---------------------------------- | --------- |
| `npm run test:user:auth`       | Lance les tests d'authentification | ✅        |
| `npm run test:user:auth:clean` | Nettoie + lance les tests          | ✅        |

## 🔄 Workflow étape par étape

### 1. **Démarrage de l'infrastructure**

```bash
# Depuis la racine du projet
npm run dev
```

**Ce qui se passe :**

- Démarre MongoDB, Redis, Exceptionless
- Démarre le container `emailight-user-service`
- Expose le port 3001 sur l'hôte

### 2. **Exécution des tests**

```bash
npm run test:user:auth:clean
```

**Ce qui se passe :**

- `docker compose exec user-service npm run test:auth:clean`
- Exécute `cleanup-test-data.js` dans le container
- Puis exécute `auth-testing.js` dans le container
- Le script fait des requêtes HTTP vers `localhost:3001`
- `localhost:3001` pointe vers le service dans le même container

### 3. **Résultats**

```bash
🔥 Résultats des tests d'authentification

Total des tests : 34
✅ Réussis : 34
❌ Échoués : 0
📊 Taux de réussite : 100%
```

## 🌐 Réseau Docker

```yaml
# Dans docker-compose.yml
user-service:
  container_name: emailight-user-service
  ports:
    - "3001:3001" # Expose le port sur l'hôte
  networks:
    - emailight-network
```

**Accès réseau :**

- **Depuis l'hôte :** `http://localhost:3001` (via port mapping)
- **Depuis le container :** `http://localhost:3001` (service local)
- **Entre containers :** `http://user-service:3001` (nom de service)

## 🗂️ Volumes synchronisés

```yaml
volumes:
  # Scripts synchronisés en temps réel
  - ../user-service/scripts:/usr/src/app/scripts:ro
  # Code source pour hot reload
  - ../user-service/src:/usr/src/app/src:ro
```

## 🧪 Avantages du workflow Docker

### ✅ **Isolation complète**

- Tests dans l'environnement de production exact
- Pas de conflits avec l'environnement local

### ✅ **Cohérence**

- Mêmes versions de Node.js, MongoDB, Redis
- Configuration identique à la production

### ✅ **Simplicité**

- Une seule commande depuis la racine
- Pas besoin d'installer Node.js localement

### ✅ **Nettoyage automatique**

- Base de données isolée par container
- Redémarrage propre à chaque fois

## 🔧 Personnalisation

### Modifier l'URL de test

```javascript
// Dans auth-testing.js
const CONFIG = {
  baseUrl: "http://localhost:3001", // ✅ Correct pour Docker
  // Pas http://user-service:3001 car le script s'exécute dans le même container
};
```

### Variables d'environnement

```bash
# Les variables du docker-compose.yml sont automatiquement disponibles
NODE_ENV=development
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
```

## 🐛 Dépannage Docker

### Service non accessible

```bash
# Vérifier le statut des containers
npm run status

# Vérifier les logs
npm run logs:user

# Redémarrer si nécessaire
npm run restart:user
```

### Problème de réseau

```bash
# Vérifier que le port est exposé
docker port emailight-user-service

# Résultat attendu : 3001/tcp -> 0.0.0.0:3001
```

### Tests qui échouent

```bash
# Nettoyer complètement et relancer
npm run clean:user:complete
npm run dev
npm run test:user:auth:clean
```

---

**💡 Astuce :** Toujours utiliser les commandes depuis la racine du projet pour rester cohérent avec le workflow Docker Compose !
