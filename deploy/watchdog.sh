#!/bin/bash
# ─── Kasuku Prod Watchdog ──────────────────────────────────────────────────────
#
# Vérifie toutes les 3 min que kasuku.afrikia.org répond 200.
# Si KO : restart nginx, puis API si nécessaire.
#
# Installation (une seule fois sur le serveur) :
#   cp deploy/watchdog.sh /opt/kasuku/watchdog.sh
#   chmod +x /opt/kasuku/watchdog.sh
#   (crontab -l; echo "*/3 * * * * /opt/kasuku/watchdog.sh") | crontab -
#
# Logs : /var/log/kasuku-watchdog.log

LOG="/var/log/kasuku-watchdog.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMPOSE="docker compose -f /opt/kasuku/docker-compose.coolify.yml"

check_status() {
  curl -sk -o /dev/null -w '%{http_code}' --max-time 10 https://kasuku.afrikia.org/ 2>/dev/null
}

STATUS=$(check_status)

if [ "$STATUS" != "200" ]; then
  echo "[$TIMESTAMP] ALERTE: site retourne $STATUS — restart nginx..." >> $LOG

  cd /opt/kasuku
  $COMPOSE restart nginx >> $LOG 2>&1
  sleep 6

  STATUS2=$(check_status)
  echo "[$TIMESTAMP] Après restart nginx: $STATUS2" >> $LOG

  # Si toujours KO, vérifier l'API
  if [ "$STATUS2" != "200" ]; then
    echo "[$TIMESTAMP] Nginx insuffisant — vérification API..." >> $LOG

    API_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' kasuku-prod-api-1 2>/dev/null)

    if [ "$API_HEALTH" != "healthy" ]; then
      echo "[$TIMESTAMP] API non healthy ($API_HEALTH) — redémarrage..." >> $LOG

      # Vérifier symlink .env avant up
      [ ! -f /opt/kasuku/.env ] && ln -sf /opt/kasuku/.env.prod /opt/kasuku/.env

      $COMPOSE up -d api >> $LOG 2>&1
      sleep 12
      $COMPOSE restart nginx >> $LOG 2>&1

      STATUS3=$(check_status)
      echo "[$TIMESTAMP] Après restart API+nginx: $STATUS3" >> $LOG
    fi
  fi
fi
# Site OK → pas de log (évite le spam)
