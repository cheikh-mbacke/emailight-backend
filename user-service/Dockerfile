# ============================================================================
# 🐳 Dockerfile - user-service
# ============================================================================

# Utiliser Node.js 18 Alpine pour une image légère
FROM node:18-alpine

# Maintainer
LABEL maintainer="Mbacke Cheikh <mbackecheikh@example.com>"
LABEL description="Service de gestion des utilisateurs pour Emailight"
LABEL version="1.0.0"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S emailight && \
    adduser -S emailight -u 1001

# Définir le répertoire de travail
WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production
RUN npm ci --only=production && \
    npm cache clean --force

# Copier le code source
COPY --chown=emailight:emailight src/ ./src/

# Créer les répertoires nécessaires
RUN mkdir -p /usr/src/app/logs && \
    chown -R emailight:emailight /usr/src/app

# Passer à l'utilisateur non-root
USER emailight

# Exposer le port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV USER_SERVICE_PORT=3001
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
        if (res.statusCode === 200) { \
            console.log('Health check passed'); \
            process.exit(0); \
        } else { \
            console.log('Health check failed'); \
            process.exit(1); \
        } \
    }).on('error', () => { \
        console.log('Health check error'); \
        process.exit(1); \
    })"

# Command par défaut
CMD ["node", "src/server.js"]