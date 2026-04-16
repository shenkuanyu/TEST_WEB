#!/bin/bash
# =============================================================
#  自動更新腳本（由 cron 每 2 分鐘觸發）
#
#  流程：
#    1. git fetch 檢查是否有新 commit
#    2. 若無 → 直接結束
#    3. 若有 → git pull + docker compose up -d --build
#    4. 只 rebuild 程式碼有變的容器，維持資料庫檔不動
# =============================================================
set -e

cd "$(dirname "$(readlink -f "$0")")/.."   # → /opt/poshtech/web/
WEB_DIR="$(pwd)"
DEPLOY_DIR="$WEB_DIR/deploy"
LOCK="/tmp/poshtech-deploy.lock"

# 避免重疊執行
exec 200>"$LOCK"
flock -n 200 || { echo "[$(date)] 已有另一個 deploy 在跑，跳過"; exit 0; }

git fetch origin main --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  # 沒有新 commit
  exit 0
fi

echo ""
echo "[$(date)] ⚡ 偵測到新 commit $LOCAL → $REMOTE，開始部署"

git reset --hard origin/main

cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo "[$(date)] ✅ 部署完成"
docker compose -f docker-compose.prod.yml ps
