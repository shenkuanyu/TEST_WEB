#!/bin/bash
# =============================================================
#  每日備份（由 cron 凌晨 3 點執行）
#  備份內容：兩個 DB + 上傳檔 + 環境設定
#  保留：最近 30 天
# =============================================================
set -e

APP_DIR="/opt/poshtech"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/poshtech}"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR/db-snapshots"

echo "[$(date)] 開始備份..."

# 1. SQLite 一致性快照
for site in machines components; do
  src="$APP_DIR/data/$site/app.db"
  if [ -f "$src" ]; then
    sqlite3 "$src" ".backup '$BACKUP_DIR/db-snapshots/${site}_${DATE}.db'" 2>/dev/null ||
      cp "$src" "$BACKUP_DIR/db-snapshots/${site}_${DATE}.db"
    echo "  ✔ $site DB 快照"
  fi
done

# 2. 整包壓縮：data + uploads + .env
ARCHIVE="$BACKUP_DIR/poshtech_${DATE}.tar.gz"
tar -czf "$ARCHIVE" \
  --exclude='*.db-wal' --exclude='*.db-shm' \
  -C "$APP_DIR" data uploads 2>/dev/null

# 附上 .env.production（單獨打包）
if [ -f "$APP_DIR/web/deploy/.env.production" ]; then
  tar -czf "$BACKUP_DIR/env_${DATE}.tar.gz" -C "$APP_DIR/web/deploy" .env.production
fi

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "  ✔ 壓縮檔 $ARCHIVE ($SIZE)"

# 3. 清理 30 天前的舊備份
find "$BACKUP_DIR" -type f \( -name 'poshtech_*.tar.gz' -o -name 'env_*.tar.gz' \) -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR/db-snapshots" -type f -name '*.db' -mtime +$KEEP_DAYS -delete 2>/dev/null || true

COUNT=$(find "$BACKUP_DIR" -type f -name 'poshtech_*.tar.gz' | wc -l)
echo "[$(date)] 備份完成，目前保留 $COUNT 份"
echo "---"
