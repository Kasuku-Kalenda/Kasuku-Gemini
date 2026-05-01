#!/bin/bash
# ─── Kasuku — Installation serveur Hetzner (Ubuntu 24.04) ────────────────────
#
# Ce script installe Docker + Coolify sur un VPS Hetzner vierge.
# Lancer en root : bash setup-server.sh
#
# Durée estimée : ~5 minutes

set -e

echo ""
echo "🚀  Installation Kasuku sur Hetzner..."
echo "────────────────────────────────────────"

# ── 1. Mise à jour système ────────────────────────────────────────────────────
echo "📦  Mise à jour des paquets..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Dépendances de base ────────────────────────────────────────────────────
echo "🔧  Installation des dépendances..."
apt-get install -y -qq \
  curl wget git ufw fail2ban \
  ca-certificates gnupg lsb-release

# ── 3. Docker ────────────────────────────────────────────────────────────────
echo "🐳  Installation de Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# ── 4. Pare-feu ──────────────────────────────────────────────────────────────
echo "🔒  Configuration du pare-feu..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp   # Port Coolify UI
ufw --force enable

# ── 5. Fail2ban (protection brute-force SSH) ──────────────────────────────────
systemctl enable fail2ban
systemctl start fail2ban

# ── 6. Coolify ───────────────────────────────────────────────────────────────
echo "✨  Installation de Coolify..."
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo ""
echo "────────────────────────────────────────"
echo "✅  Installation terminée !"
echo ""
echo "👉  Coolify est accessible sur : http://$(curl -s ifconfig.me):8000"
echo ""
echo "Prochaines étapes :"
echo "  1. Ouvre http://$(curl -s ifconfig.me):8000 dans ton navigateur"
echo "  2. Crée ton compte admin Coolify"
echo "  3. Connecte ton repo GitHub"
echo "  4. Déploie avec deploy/docker-compose.prod.yml"
echo ""
