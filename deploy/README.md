# POSHTECH 雙站部署指南

本資料夾包含將 `TEST_WEB` 部署到 DigitalOcean VPS 的所有必要檔案。

## 📂 檔案說明

| 檔案 | 用途 |
|------|------|
| `docker-compose.prod.yml` | 生產環境 compose（兩個 Next.js 容器 + Caddy） |
| `Caddyfile` | Caddy 反向代理設定，自動處理 HTTPS |
| `setup-vps.sh` | 一鍵初始化全新 VPS（安裝 Docker、拉程式碼、啟動服務） |
| `auto-update.sh` | 每 2 分鐘自動拉 GitHub 新版本並重新部署 |
| `backup.sh` | 每日凌晨 3 點自動備份 DB 與上傳檔 |
| `.env.production.example` | 環境變數範本 |

## 🌐 網域配置

| 網址 | 對應站點 |
|------|---------|
| `poshtech.com.tw` | 機台站（SITE_CODE=machines） |
| `www.poshtech.com.tw` | 機台站（同上） |
| `parts.poshtech.com.tw` | 零組件站（SITE_CODE=components） |

## 🏗️ VPS 目錄結構

部署完成後，VPS 上結構如下：

```
/opt/poshtech/
├── web/                      ← git clone 下來的程式碼
│   ├── app/ lib/ components/ ...
│   └── deploy/
├── data/
│   ├── machines/app.db       ← 機台 DB（持久化）
│   └── components/app.db     ← 零組件 DB（持久化）
├── uploads/
│   ├── machines/             ← 機台上傳檔
│   └── components/           ← 零組件上傳檔
└── logs/caddy/               ← Caddy 存取 log
```

## 🚀 部署流程（首次）

詳細說明請參考 `../SOP.md`。簡要步驟：

1. DigitalOcean 開 Droplet（Ubuntu 22.04，2GB RAM）
2. 拿到 VPS IP 後 ssh 上去
3. 執行 `curl -O https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/deploy/setup-vps.sh && export REPO_URL=... && bash setup-vps.sh`
4. 到網域註冊商設定 A 紀錄指向 VPS IP
5. 等待 5-60 分鐘讓 DNS 生效 → Caddy 自動申請 SSL
6. 開啟 https://poshtech.com.tw 驗證

## 🔄 日常更新流程

程式碼改動（由 Claude 修改或您自己改）：

1. 在本機 TEST_WEB 改檔案
2. 打開 GitHub Desktop → 寫 commit → 按「Push」
3. 最多 2 分鐘後，VPS 自動拉更新並重建
4. 瀏覽器重新整理即可看到新版

內容改動（產品、消息、圖片）：

1. 進 https://poshtech.com.tw/admin 登入
2. 直接在後台編輯 / 上傳
3. 存檔即時生效（不需任何部署動作）

## 🩺 常用維運指令（ssh 進 VPS 後）

```bash
cd /opt/poshtech/web/deploy

# 看所有容器狀態
docker compose -f docker-compose.prod.yml ps

# 看最新 log（Ctrl+C 退出）
docker compose -f docker-compose.prod.yml logs -f

# 只看機台站 log
docker compose -f docker-compose.prod.yml logs -f machines-web

# 手動觸發一次部署
bash /opt/poshtech/web/deploy/auto-update.sh

# 手動觸發一次備份
bash /opt/poshtech/web/deploy/backup.sh

# 重啟所有服務
docker compose -f docker-compose.prod.yml restart

# 完全停機（維護用）
docker compose -f docker-compose.prod.yml down

# 重新啟動
docker compose -f docker-compose.prod.yml up -d
```

## 🔐 安全建議

1. **SSH 金鑰登入**：關閉密碼登入，只允許 SSH Key
2. **改 SSH port**：從 22 改為其他數字
3. **fail2ban**：防暴力破解
4. **定期備份異地**：VPS 備份建議另外下載到本機或雲端儲存
5. **改強 JWT_SECRET**：`.env.production` 裡的 JWT_SECRET 要是高強度隨機字串

## 📊 監控 / 觀察

- Caddy log：`/opt/poshtech/logs/caddy/`
- 部署 log：`/var/log/poshtech-deploy.log`
- 備份 log：`/var/log/poshtech-backup.log`
- Docker log：`docker compose logs`

## 🆘 常見問題

**Q: 打開網址顯示「連線不安全」？**  
A: Caddy 需要 DNS 生效後才能申請 Let's Encrypt 憑證。DNS 生效後，等待 1-5 分鐘會自動取得。

**Q: 後台帳密是什麼？**  
A: 預設 `poshtech` / `89209973`，可在 `.env.production` 修改或執行 `npm run update-admin`。

**Q: 想把機台站搬到 jeouyang.com.tw？**  
A: 編輯 Caddyfile 改網域設定 → 改 DNS → 重啟 Caddy 即可。

**Q: 如何還原備份？**  
A: `tar -xzf poshtech_YYYYMMDD.tar.gz -C /opt/poshtech/`，然後重啟容器。
