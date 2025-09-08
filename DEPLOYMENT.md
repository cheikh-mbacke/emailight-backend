# 🚀 Guide de Déploiement Production - Emailight

## 📋 Vue d'ensemble

Ce guide explique comment déployer Emailight en production sur votre VPS avec GitHub Actions.

## 🏗️ Architecture de déploiement

```
GitHub Repository
       ↓ (GitHub Actions)
VPS (vps112889.serveur-vps.net)
├── Nginx (Reverse Proxy)
├── Docker Compose
│   ├── user-service (Port 3001)
│   ├── mongodb (Port 27017)
│   ├── redis (Port 6379)
│   └── exceptionless (Port 5000)
└── SSL (Let's Encrypt)
```

## 🔧 Prérequis

### VPS Configuration

- **OS** : Debian 12 (Bookworm)
- **RAM** : 4 Go minimum
- **Disque** : 100 Go minimum
- **Services** : Docker, Docker Compose, Nginx

### GitHub Secrets

Tous les secrets suivants doivent être configurés dans votre repository GitHub :

```bash
# VPS Access
VPS_HOST=vps112889.serveur-vps.net
VPS_USER=root
VPS_PASSWORD=FH7aUYR

# Domain
DOMAIN=emailight.com

# Database
MONGO_ROOT_PASSWORD=[mot de passe sécurisé]
MONGO_APP_PASSWORD=[mot de passe sécurisé]
REDIS_PASSWORD=[mot de passe sécurisé]

# Security
JWT_SECRET=[clé JWT sécurisée]
ENCRYPTION_KEY=[clé de chiffrement]

# OAuth
GOOGLE_CLIENT_ID=[votre client ID]
GOOGLE_CLIENT_SECRET=[votre client secret]
GMAIL_CLIENT_ID=[votre client ID Gmail]
GMAIL_CLIENT_SECRET=[votre client secret Gmail]

# SMTP
SMTP_HOST=mail.emailight.com
SMTP_PORT=465
SMTP_USER=support@emailight.com
SMTP_PASSWORD=[mot de passe SMTP]

# Monitoring
USER_SERVICE_EXCEPTIONLESS_API_KEY=[clé API Exceptionless]
```

## 🚀 Déploiement

### 1. Déploiement automatique

Le déploiement se fait automatiquement à chaque push sur la branche `main` :

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

### 2. Déploiement manuel

Vous pouvez aussi déclencher un déploiement manuel depuis GitHub Actions.

### 3. Processus de déploiement

1. **Tests** : Exécution des tests Jest
2. **Build** : Construction des images Docker
3. **Backup** : Sauvegarde de la version précédente
4. **Deploy** : Déploiement sur le VPS
5. **Health Check** : Vérification de la santé des services
6. **Nginx** : Configuration du reverse proxy

## 🌐 URLs de production

- **API** : https://emailight.com/api/v1
- **Health Check** : https://emailight.com/health
- **Documentation** : https://emailight.com/docs
- **Monitoring** : https://emailight.com/monitoring

## 🔍 Monitoring et logs

### Vérifier le statut des services

```bash
ssh root@vps112889.serveur-vps.net
cd /opt/emailight/docker
docker compose -f docker-compose.prod.yml ps
```

### Voir les logs

```bash
# Logs de tous les services
docker compose -f docker-compose.prod.yml logs -f

# Logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f user-service
```

### Logs Nginx

```bash
# Logs d'accès
tail -f /var/log/nginx/emailight_access.log

# Logs d'erreur
tail -f /var/log/nginx/emailight_error.log
```

## 🛠️ Maintenance

### Redémarrer les services

```bash
cd /opt/emailight/docker
docker compose -f docker-compose.prod.yml restart
```

### Mettre à jour une image

```bash
cd /opt/emailight/docker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Nettoyer les images inutilisées

```bash
docker image prune -f
docker system prune -f
```

## 🔒 Sécurité

### Firewall

Assurez-vous que seuls les ports nécessaires sont ouverts :

```bash
# Ports ouverts
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 5000 (Exceptionless - localhost seulement)
```

### SSL/TLS

Le certificat SSL est géré par Let's Encrypt et renouvelé automatiquement.

### Rate Limiting

Nginx est configuré avec un rate limiting :

- API générale : 10 requêtes/seconde
- Authentification : 5 requêtes/seconde

## 📊 Backup

### Sauvegarde automatique

Le script de déploiement crée automatiquement des sauvegardes dans `/opt/backups/emailight/`.

### Sauvegarde manuelle

```bash
cd /opt/emailight
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz .
```

### Restauration

```bash
cd /opt/emailight
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
```

## 🚨 Dépannage

### Service non accessible

1. Vérifier le statut des containers :

   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

2. Vérifier les logs :

   ```bash
   docker compose -f docker-compose.prod.yml logs user-service
   ```

3. Vérifier Nginx :
   ```bash
   nginx -t
   systemctl status nginx
   ```

### Problème de base de données

1. Vérifier MongoDB :

   ```bash
   docker exec emailight-mongodb-prod mongosh --eval "db.adminCommand('ping')"
   ```

2. Vérifier Redis :
   ```bash
   docker exec emailight-redis-prod redis-cli ping
   ```

### Problème de SSL

1. Vérifier le certificat :

   ```bash
   openssl s_client -connect emailight.com:443
   ```

2. Renouveler le certificat :
   ```bash
   certbot renew
   ```

## 📞 Support

En cas de problème :

1. Vérifier les logs de déploiement dans GitHub Actions
2. Consulter les logs des services sur le VPS
3. Vérifier la configuration Nginx
4. Contacter l'équipe de développement

## 🔄 Mise à jour

Pour mettre à jour l'application :

1. Modifier le code
2. Commiter et pousser sur `main`
3. Le déploiement se fait automatiquement
4. Vérifier que tout fonctionne via les health checks

---

**Note** : Ce guide est maintenu à jour avec chaque déploiement. Pour toute question, consultez d'abord les logs et la documentation.
