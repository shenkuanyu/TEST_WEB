#!/bin/bash
# =============================================================
#  久洋機械網站 — 一鍵部署腳本
#
#  使用：
#    cd /opt/jeouyang         # 或您實際放置的目錄
#    ./scripts/deploy.sh
#
#  會做的事：
#    1. 從 git 拉取最新程式碼（若是 git 管理）
#    2. 重新 build Docker 映像
#    3. 安全地重啟容器（舊的停掉、新的啟動）
#    4. 執行資料庫初始化（冪等，已存在的表不會動）
#    5. 驗證服務是否正常
# =============================================================

set -e  # 任一步驟失敗立即中止

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "📍 專案路徑：$PROJECT_DIR"

# --- 1. 更新程式碼（若有 git）---
if [ -d ".git" ]; then
  echo "📥 拉取最新程式碼…"
  git pull --ff-only
else
  echo "ℹ️  尚未設定 git，跳過拉取步驟"
fi

# --- 2. 檢查環境檔 ---
if [ ! -f ".env.production" ]; then
  echo "❌ 找不到 .env.production，請先複製 .env.production.example 並填好內容"
  exit 1
fi

# --- 3. Build Docker 映像 ---
echo "🔨 建置 Docker 映像…"
docker compose build

# --- 4. 啟動或重啟容器 ---
echo "🚀 啟動容器…"
docker compose up -d

# --- 5. 等待 web 健康 ---
echo "⏳ 等待 web 啟動…"
sleep 5

# --- 6. 首次部署時初始化資料庫 ---
if [ ! -f "data/app.db" ]; then
  echo "📦 首次部署，初始化資料庫…"
  docker compose exec web npm run init-db
  docker compose exec web npm run migrate-settings
  echo "✔ 資料庫初始化完成（預設後台帳號見 .env.production）"
fi

# --- 7. 檢查狀態 ---
echo ""
echo "✅ 部署完成！"
docker compose ps
echo ""
echo "🌐 網站應該已經可以透過 http://您的IP 或 http://您的網域 存取"
