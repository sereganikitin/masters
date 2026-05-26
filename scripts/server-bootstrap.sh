#!/usr/bin/env bash
# One-time server bootstrap for the Masters kiosk.
# Run on the Timeweb VPS as a user with sudo access (seldegram).
#
#   curl -fsSL https://raw.githubusercontent.com/sereganikitin/masters/main/scripts/server-bootstrap.sh | bash
# Or, after cloning the repo:
#   sudo bash scripts/server-bootstrap.sh
#
# Idempotent — safe to re-run.

set -euo pipefail

REPO="https://github.com/sereganikitin/masters.git"
DEPLOY_PATH="/var/www/masters"
DOMAIN="masters.infoseledka.ru"
SERVICE="masters-api"
SVC_USER="seldegram"

echo "==> Ensuring base packages (node, nginx, sqlite, build tools)…"
sudo apt-get update -y
# build-essential + python3 are required to compile native node modules
# (better-sqlite3 falls back to source build if no prebuilt binary matches).
sudo apt-get install -y git sqlite3 nginx build-essential python3

if ! command -v node >/dev/null; then
  echo "Node not found — installing Node 20.x from NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Preparing $DEPLOY_PATH"
sudo mkdir -p "$DEPLOY_PATH"
sudo chown -R "$SVC_USER:$SVC_USER" "$DEPLOY_PATH"

if [ ! -d "$DEPLOY_PATH/.git" ]; then
  echo "==> Cloning repo into $DEPLOY_PATH"
  sudo -u "$SVC_USER" git clone "$REPO" "$DEPLOY_PATH"
else
  echo "==> Repo already present — fetching latest"
  sudo -u "$SVC_USER" git -C "$DEPLOY_PATH" fetch --prune origin
  sudo -u "$SVC_USER" git -C "$DEPLOY_PATH" reset --hard origin/main
fi

echo "==> Installing npm deps + building"
cd "$DEPLOY_PATH"
sudo -u "$SVC_USER" npm ci
sudo -u "$SVC_USER" npm run build

echo "==> Installing systemd unit for $SERVICE"
sudo cp deploy/masters-api.service /etc/systemd/system/${SERVICE}.service

# Prompt for ADMIN_TOKEN if still placeholder
if grep -q "CHANGE_ME_BEFORE_ENABLING" /etc/systemd/system/${SERVICE}.service; then
  echo
  echo "!! ADMIN_TOKEN is still the placeholder. Generate a strong token now, e.g.:"
  echo "     openssl rand -hex 24"
  read -p "Paste ADMIN_TOKEN value (leave empty to skip and edit later): " TOKEN
  if [ -n "$TOKEN" ]; then
    sudo sed -i "s|CHANGE_ME_BEFORE_ENABLING|$TOKEN|" /etc/systemd/system/${SERVICE}.service
    echo "Token set in unit file."
  else
    echo "Skipped. Edit /etc/systemd/system/${SERVICE}.service later and restart."
  fi
fi

sudo systemctl daemon-reload
sudo systemctl enable --now "$SERVICE"
sleep 1
sudo systemctl status "$SERVICE" --no-pager | head -10

echo "==> Installing nginx site"
sudo cp deploy/nginx-masters.conf /etc/nginx/sites-available/masters.conf
sudo ln -sf /etc/nginx/sites-available/masters.conf /etc/nginx/sites-enabled/masters.conf
sudo nginx -t
sudo systemctl reload nginx

echo
echo "==> Allowing seldegram to restart the service without password (for CI deploy)"
SUDOERS_LINE="seldegram ALL=(ALL) NOPASSWD: /bin/systemctl restart ${SERVICE}, /bin/systemctl reload nginx"
echo "$SUDOERS_LINE" | sudo tee /etc/sudoers.d/masters-deploy >/dev/null
sudo chmod 0440 /etc/sudoers.d/masters-deploy
sudo visudo -cf /etc/sudoers.d/masters-deploy

echo
echo "===================="
echo "  BOOTSTRAP DONE"
echo "===================="
echo "Site:        http://$DOMAIN  (set DNS A-record to this server's IP)"
echo "API health:  http://$DOMAIN/api/health"
echo "Service:     sudo systemctl status $SERVICE"
echo "Logs:        sudo journalctl -u $SERVICE -f"
echo
echo "Next steps:"
echo "  1. Point $DOMAIN's A-record to this server"
echo "  2. (After DNS propagates) get HTTPS:"
echo "       sudo apt install -y certbot python3-certbot-nginx"
echo "       sudo certbot --nginx -d $DOMAIN"
echo "  3. Add SSH_HOST / SSH_USER / SSH_KEY secrets to GitHub repo for auto-deploy"
