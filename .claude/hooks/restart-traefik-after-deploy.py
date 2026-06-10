#!/usr/bin/env python3
"""
Hook PostToolUse — redémarre Traefik (coolify-proxy) automatiquement
après chaque commande de déploiement staging/prod via SSH.

Déclenché par Claude Code après chaque appel Bash.
Reçoit le contexte de l'outil sur stdin (JSON).

Problème résolu : après une `docker compose up --build` ou
`force-recreate nginx`, Traefik perd ses routes et retourne 504.
Un `docker restart coolify-proxy` force le rediscovery des IPs.
"""
import sys
import json
import subprocess

try:
    data    = json.load(sys.stdin)
    cmd     = data.get('tool_input', {}).get('command', '')
    is_ssh  = '77.42.76.120' in cmd
    is_deploy = ('docker compose' in cmd and
                 ('--build' in cmd or 'force-recreate' in cmd))
    if is_ssh and is_deploy:
        subprocess.run(
            ['ssh', 'root@77.42.76.120', 'docker restart coolify-proxy'],
            capture_output=True,
            timeout=30
        )
except Exception:
    pass   # Ne jamais bloquer Claude Code

sys.exit(0)
