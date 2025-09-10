#!/bin/bash

# ============================================================================
# 🔍 SCRIPT DE DIAGNOSTIC CI/CD - ÉCHEC DES TESTS
# ============================================================================
# Ce script s'exécute après l'échec des tests dans le pipeline CI/CD
# pour diagnostiquer précisément pourquoi les tests échouent.
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="/tmp/ci-cd-diagnostic-$(date +%Y%m%d-%H%M%S).log"
WORKSPACE_DIR="/opt/emailight-backend"
USER_SERVICE_DIR="$WORKSPACE_DIR/user-service"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_section() {
    echo -e "\n${BOLD}${CYAN}🔥 $1${NC}" | tee -a "$LOG_FILE"
    echo "===============================================" | tee -a "$LOG_FILE"
}

# Fonction pour vérifier l'environnement de test
check_test_environment() {
    log_section "VÉRIFICATION DE L'ENVIRONNEMENT DE TEST"
    
    # Vérifier les variables d'environnement de test
    log_info "Variables d'environnement de test :"
    echo "NODE_ENV: $NODE_ENV" | tee -a "$LOG_FILE"
    echo "MONGODB_URI: ${MONGODB_URI:0:20}..." | tee -a "$LOG_FILE"
    echo "REDIS_URL: $REDIS_URL" | tee -a "$LOG_FILE"
    echo "JWT_SECRET: ${JWT_SECRET:0:10}..." | tee -a "$LOG_FILE"
    
    # Vérifier la structure des fichiers de test
    log_info "Structure des fichiers de test :"
    if [ -d "$USER_SERVICE_DIR/tests" ]; then
        log_success "Répertoire tests trouvé"
        ls -la "$USER_SERVICE_DIR/tests/" | tee -a "$LOG_FILE"
    else
        log_error "Répertoire tests manquant"
    fi
    
    # Vérifier les fichiers de configuration de test
    local test_files=(
        "$USER_SERVICE_DIR/tests/jest.config.js"
        "$USER_SERVICE_DIR/tests/setup.js"
        "$USER_SERVICE_DIR/tests/utils/test-helpers.js"
        "$USER_SERVICE_DIR/package.json"
    )
    
    for file in "${test_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Fichier trouvé : $(basename "$file")"
        else
            log_error "Fichier manquant : $(basename "$file")"
        fi
    done
}

# Fonction pour vérifier les services de test
check_test_services() {
    log_section "VÉRIFICATION DES SERVICES DE TEST"
    
    # Vérifier MongoDB local (pour les tests)
    log_info "Test de connectivité MongoDB local :"
    if nc -z localhost 27017 2>/dev/null; then
        log_success "MongoDB local accessible sur le port 27017"
    else
        log_error "MongoDB local non accessible sur le port 27017"
    fi
    
    # Vérifier Redis local (pour les tests)
    log_info "Test de connectivité Redis local :"
    if nc -z localhost 6379 2>/dev/null; then
        log_success "Redis local accessible sur le port 6379"
    else
        log_error "Redis local non accessible sur le port 6379"
    fi
    
    # Vérifier si les services de test sont démarrés
    log_info "Statut des conteneurs de test :"
    if command -v docker >/dev/null 2>&1; then
        docker ps --filter "name=mongo" --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tee -a "$LOG_FILE"
    else
        log_warning "Docker non disponible"
    fi
}

# Fonction pour analyser la configuration Jest
analyze_jest_config() {
    log_section "ANALYSE DE LA CONFIGURATION JEST"
    
    if [ -f "$USER_SERVICE_DIR/tests/jest.config.js" ]; then
        log_info "Configuration Jest :"
        cat "$USER_SERVICE_DIR/tests/jest.config.js" | tee -a "$LOG_FILE"
    else
        log_error "Fichier jest.config.js manquant"
    fi
    
    # Vérifier le package.json pour les scripts de test
    if [ -f "$USER_SERVICE_DIR/package.json" ]; then
        log_info "Scripts de test dans package.json :"
        grep -A 10 '"scripts"' "$USER_SERVICE_DIR/package.json" | tee -a "$LOG_FILE"
    fi
}

# Fonction pour vérifier les dépendances
check_dependencies() {
    log_section "VÉRIFICATION DES DÉPENDANCES"
    
    cd "$USER_SERVICE_DIR" || {
        log_error "Impossible d'accéder au répertoire user-service"
        return 1
    }
    
    # Vérifier si node_modules existe
    if [ -d "node_modules" ]; then
        log_success "node_modules trouvé"
        log_info "Taille de node_modules : $(du -sh node_modules | cut -f1)"
    else
        log_error "node_modules manquant"
        log_info "Tentative d'installation des dépendances..."
        npm install
    fi
    
    # Vérifier les dépendances critiques
    local critical_deps=(
        "jest"
        "@jest/globals"
        "babel-jest"
        "@babel/core"
        "@babel/preset-env"
    )
    
    log_info "Vérification des dépendances critiques :"
    for dep in "${critical_deps[@]}"; do
        if npm list "$dep" >/dev/null 2>&1; then
            log_success "$dep installé"
        else
            log_error "$dep manquant"
        fi
    done
}

# Fonction pour exécuter un test simple
run_simple_test() {
    log_section "EXÉCUTION D'UN TEST SIMPLE"
    
    cd "$USER_SERVICE_DIR" || return 1
    
    # Créer un test simple pour vérifier que Jest fonctionne
    cat > test-simple.js << 'EOF'
// Test simple pour vérifier Jest
describe('Test simple', () => {
  test('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('Vérification des variables d\'environnement', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});
EOF
    
    log_info "Exécution du test simple..."
    if npm test test-simple.js 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Test simple réussi - Jest fonctionne"
    else
        log_error "Test simple échoué - Problème avec Jest"
    fi
    
    # Nettoyer
    rm -f test-simple.js
}

# Fonction pour analyser les logs d'erreur détaillés
analyze_detailed_errors() {
    log_section "ANALYSE DÉTAILLÉE DES ERREURS"
    
    cd "$USER_SERVICE_DIR" || return 1
    
    # Exécuter les tests avec plus de verbosité
    log_info "Exécution des tests avec verbosité maximale..."
    
    # Capturer la sortie complète
    local test_output="/tmp/jest-output-$(date +%Y%m%d-%H%M%S).log"
    
    if npm run test 2>&1 | tee "$test_output"; then
        log_success "Tests réussis"
    else
        log_error "Tests échoués - Analyse des erreurs..."
        
        # Analyser les erreurs spécifiques
        log_info "Recherche d'erreurs de connectivité :"
        grep -i "connection\|timeout\|refused\|econnreset" "$test_output" | tee -a "$LOG_FILE" || true
        
        log_info "Recherche d'erreurs de configuration :"
        grep -i "config\|environment\|missing\|undefined" "$test_output" | tee -a "$LOG_FILE" || true
        
        log_info "Recherche d'erreurs de dépendances :"
        grep -i "module\|require\|import\|dependency" "$test_output" | tee -a "$LOG_FILE" || true
        
        log_info "Recherche d'erreurs de base de données :"
        grep -i "mongodb\|mongo\|database\|db" "$test_output" | tee -a "$LOG_FILE" || true
        
        log_info "Recherche d'erreurs de Redis :"
        grep -i "redis\|cache" "$test_output" | tee -a "$LOG_FILE" || true
    fi
}

# Fonction pour vérifier la configuration des tests
check_test_configuration() {
    log_section "VÉRIFICATION DE LA CONFIGURATION DES TESTS"
    
    # Vérifier le fichier test-helpers.js
    if [ -f "$USER_SERVICE_DIR/tests/utils/test-helpers.js" ]; then
        log_info "Configuration dans test-helpers.js :"
        grep -n "baseUrl\|localhost\|timeout" "$USER_SERVICE_DIR/tests/utils/test-helpers.js" | tee -a "$LOG_FILE"
    fi
    
    # Vérifier le fichier setup.js
    if [ -f "$USER_SERVICE_DIR/tests/setup.js" ]; then
        log_info "Configuration dans setup.js :"
        grep -n "NODE_ENV\|MONGODB_URI\|REDIS_URL" "$USER_SERVICE_DIR/tests/setup.js" | tee -a "$LOG_FILE"
    fi
    
    # Vérifier les variables d'environnement de test
    log_info "Variables d'environnement actuelles :"
    env | grep -E "(NODE_ENV|MONGODB|REDIS|JWT|TEST)" | tee -a "$LOG_FILE"
}

# Fonction pour tester la connectivité réseau
test_network_connectivity() {
    log_section "TEST DE CONNECTIVITÉ RÉSEAU"
    
    # Test de connectivité vers l'API de production
    log_info "Test de connectivité vers api.emailight.com :"
    if curl -s --max-time 10 --connect-timeout 5 "https://api.emailight.com/health" >/dev/null 2>&1; then
        log_success "API de production accessible"
    else
        log_error "API de production inaccessible"
    fi
    
    # Test de résolution DNS
    log_info "Test de résolution DNS :"
    if nslookup api.emailight.com >/dev/null 2>&1; then
        log_success "Résolution DNS fonctionnelle"
    else
        log_error "Problème de résolution DNS"
    fi
}

# Fonction pour vérifier les ressources système
check_system_resources() {
    log_section "VÉRIFICATION DES RESSOURCES SYSTÈME"
    
    # Mémoire
    log_info "Utilisation de la mémoire :"
    free -h | tee -a "$LOG_FILE"
    
    # Disque
    log_info "Espace disque disponible :"
    df -h | tee -a "$LOG_FILE"
    
    # CPU
    log_info "Charge CPU :"
    uptime | tee -a "$LOG_FILE"
    
    # Processus Node.js
    log_info "Processus Node.js en cours :"
    ps aux | grep node | grep -v grep | tee -a "$LOG_FILE" || true
}

# Fonction pour générer un rapport de diagnostic
generate_diagnostic_report() {
    log_section "RAPPORT DE DIAGNOSTIC"
    
    local report_file="/tmp/ci-cd-diagnostic-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🔍 Rapport de Diagnostic CI/CD - Échec des Tests

**Date :** $(date)
**Environnement :** CI/CD Pipeline
**Fichier de log :** $LOG_FILE

## 📊 Résumé

Ce rapport analyse l'échec des tests dans le pipeline CI/CD.

## 🔧 Recommandations

1. **Vérifiez les variables d'environnement de test**
2. **Assurez-vous que les services de test (MongoDB, Redis) sont démarrés**
3. **Vérifiez la configuration Jest et les dépendances**
4. **Consultez les logs détaillés pour identifier les erreurs spécifiques**

## 📋 Actions à effectuer

- [ ] Vérifier la configuration des tests
- [ ] Redémarrer les services de test si nécessaire
- [ ] Vérifier les dépendances npm
- [ ] Analyser les logs d'erreur détaillés

## 🔗 Fichiers de log

- Log principal : $LOG_FILE
- Sortie Jest : /tmp/jest-output-*.log
- Ce rapport : $report_file

EOF
    
    log_success "Rapport de diagnostic généré : $report_file"
    cat "$report_file" | tee -a "$LOG_FILE"
}

# Fonction principale
main() {
    log_section "DIAGNOSTIC CI/CD - ÉCHEC DES TESTS"
    log_info "Démarrage du diagnostic - $(date)"
    log_info "Fichier de log : $LOG_FILE"
    log_info "Répertoire de travail : $WORKSPACE_DIR"
    
    # Vérifications de base
    check_test_environment
    check_test_services
    check_dependencies
    analyze_jest_config
    check_test_configuration
    
    # Tests de connectivité
    test_network_connectivity
    
    # Vérifications système
    check_system_resources
    
    # Tests et analyse
    run_simple_test
    analyze_detailed_errors
    
    # Génération du rapport
    generate_diagnostic_report
    
    log_section "DIAGNOSTIC TERMINÉ"
    log_info "Diagnostic terminé - $(date)"
    log_info "Consultez le fichier de log pour plus de détails : $LOG_FILE"
    
    # Recommandations finales
    echo -e "\n${BOLD}${YELLOW}📋 RECOMMANDATIONS IMMÉDIATES :${NC}"
    echo "1. Vérifiez que les services de test (MongoDB, Redis) sont démarrés"
    echo "2. Vérifiez les variables d'environnement de test"
    echo "3. Assurez-vous que toutes les dépendances sont installées"
    echo "4. Consultez les logs détaillés pour identifier l'erreur spécifique"
    echo "5. Testez manuellement un test simple pour vérifier Jest"
}

# Exécution du script
main "$@"
