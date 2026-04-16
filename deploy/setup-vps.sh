#!/bin/bash
# =============================================================
#  POSHTECH VPS 一鍵初始化腳本
#  目標：Ubuntu 22.04 LTS （DigitalOcean Droplet）
#
#  用途：全新 VPS → 安裝必要工具 → 拉程式碼 → 啟動服務
#  使用：
#    ssh root@您的VPS_IP
#    bash <(curl -s https://raw.githubusercontent.com/YOUR/REPO/main/deploy/setup-vps.sh)
#    （或把本檔 scp 上去後執行）
# =============================================================
set -e

REPO_URL="${REPO_URL:-}"   # 可從環境變數傳入，或在下面手動填
APP_DIR="/opt/poshtech"
BRANCH="main"

# ───────── 需要您填入 ─────────
if [ -z "$REPO_URL" ]; then
  echo "❌ 請先設定 REPO_URL 環境變數，例如："
  echo "   export REPO_URL=https://github.com/YOUR/poshtech-web.git"
  echo "   bash setup-vps.sh"
  exit 1
fi
# ────────────────────────────

echo "🟢 === POSHTECH VPS 初始化開始 ==="
echo "    REPO : $REPO_URL"
echo "    DIR  : $APP_DIR"
echo ""

# 1. 系統更新
echo "[1/7] 更新套件..."
apt-get update -y
apt-get upgrade -y

# 2. 基本工具
echo "[2/7] 安裝基本工具..."
apt-get install -y curl git ufw ca-certificates sqlite3 cron

# 3. Docker
if ! command -v docker &> /dev/null; then
  echo "[3/7] 安裝 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "[3/7] Docker 已安裝，跳過"
fi

# 4. 防火牆（只開 22、80、443）
echo "[4/7] 設定防火牆..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable

# 5. 拉程式碼
echo "[5/7] 取得程式碼..."
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/web/.git" ]; then
  echo "    已存在 git repo，執行 git pull"
  cd "$APP_DIR/web" && git pull
else
  rm -rf "$APP_DIR/web"
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR/web"
fi

# 建立資料 / 上傳 / 日誌目錄
mkdir -p "$APP_DIR/data/machines" "$APP_DIR/data/components"
mkdir -p "$APP_DIR/uploads/machines" "$APP_DIR/uploads/components"
mkdir -p "$APP_DIR/logs/caddy"

# 6. 設定環境變數
echo "[6/7] 檢查 .env.production..."
DEPLOY_DIR="$APP_DIR/web/deploy"
if [ ! -f "$DEPLOY_DIR/.env.production" ]; then
  cp "$DEPLOY_DIR/.env.production.example" "$DEPLOY_DIR/.env.production"
  # 自動生成 JWT secret
  RANDOM_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=')
  sed -i "s|CHANGE_ME_TO_A_LONG_RANDOM_STRING_AT_LEAST_32_CHARS|$RANDOM_SECRET|" "$DEPLOY_DIR/.env.production"
  echo "    ✔ 已產生 .env.production（JWT 自動產生）"
else
  echo "    .env.production 已存在，保留"
fi

# 7. 首次啟動
echo "[7/7] 啟動 Docker Compose..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml up -d --build

# 設定自動更新 cron（每 2 分鐘檢查 GitHub 有無新提交）
cat > /etc/cron.d/poshtech-auto-update <<EOF
*/2 * * * * root cd $APP_DIR/web && bash deploy/auto-update.sh >> /var/log/poshtech-deploy.log 2>&1
EOF
chmod 644 /etc/cron.d/poshtech-auto-update

# 設定每日備份 cron（凌晨 3 點）
cat > /etc/cron.d/poshtech-backup <<EOF
0 3 * * * root bash $APP_DIR/web/deploy/backup.sh >> /var/log/poshtech-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/poshtech-backup

# 等待容器啟動
sleep 15

# 初始化兩個 DB
echo ""
echo "🔧 初始化兩個站的資料庫..."
docker exec poshtech-machines  sh -c "cd /app && npm run init-db" || true
docker exec poshtech-machines  sh -c "cd /app && npm run migrate-settings" || true
docker exec poshtech-machines  sh -c "cd /app && npm run migrate-products" || true
docker exec poshtech-components sh -c "cd /app && npm run init-db" || true
docker exec poshtech-components sh -c "cd /app && npm run migrate-settings" || true
docker exec poshtech-components sh -c "cd /app && npm run migrate-products" || true

echo ""
echo "✅ === 初始化完成 ==="
echo ""
echo "請到網域註冊商設定 DNS A 紀錄指向本 VPS："
echo "  poshtech.com.tw        A   $(curl -s ifconfig.me)"
echo "  www.poshtech.com.tw    A   $(curl -s ifconfig.me)"
echo "  parts.poshtech.com.tw  A   $(curl -s ifconfig.me)"
echo ""
echo "DNS 生效後（通常 5-60 分鐘），Caddy 會自動申請 HTTPS 憑證"
echo ""
echo "驗證指令："
echo "  docker compose -f $DEPLOY_DIR/docker-compose.prod.yml ps"
echo "  docker compose -f $DEPLOY_DIR/docker-compose.prod.yml logs -f caddy"
