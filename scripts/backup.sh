#!/bin/bash
# =============================================================
#  久洋機械網站 — 每日自動備份腳本
#
#  備份內容：
#    - data/app.db（SQLite 資料庫）
#    - public/uploads/（使用者上傳圖檔）
#
#  備份策略：
#    - 每日壓縮成 tar.gz，以日期命名
#    - 保留最近 30 天，舊的自動清除
#
#  使用：
#    crontab -e
#    0 3 * * * /opt/jeouyang/scripts/backup.sh >> /var/log/jeouyang-backup.log 2>&1
#    （每天凌晨 3 點執行）
# =============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/jeouyang}"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

echo "[$(date)] 開始備份…"

# --- SQLite 備份（.backup 命令確保資料一致性）---
if [ -f "data/app.db" ]; then
  echo "→ 備份 SQLite…"
  mkdir -p "$BACKUP_DIR/db-snapshots"
  sqlite3 "data/app.db" ".backup '$BACKUP_DIR/db-snapshots/app_$DATE.db'" 2>/dev/null || \
    cp "data/app.db" "$BACKUP_DIR/db-snapshots/app_$DATE.db"
fi

# --- 整包備份（DB + uploads）---
ARCHIVE="$BACKUP_DIR/jeouyang_$DATE.tar.gz"
echo "→ 壓縮為 $ARCHIVE …"
tar -czf "$ARCHIVE" \
  --exclude='data/*.db-wal' \
  --exclude='data/*.db-shm' \
  data public/uploads 2>/dev/null

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "✔ 備份完成（大小 $SIZE）"

# --- 清理舊備份（超過 KEEP_DAYS 天）---
echo "→ 清除 $KEEP_DAYS 天前的舊備份…"
find "$BACKUP_DIR" -type f -name "jeouyang_*.tar.gz" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR/db-snapshots" -type f -name "app_*.db" -mtime +$KEEP_DAYS -delete 2>/dev/null || true

COUNT=$(find "$BACKUP_DIR" -type f -name "jeouyang_*.tar.gz" | wc -l)
echo "✔ 目前保留 $COUNT 份備份"
echo "[$(date)] 備份結束"
echo "---"
