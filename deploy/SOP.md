# POSHTECH 雙站上線 SOP（staging 版）

這份文件帶您從零開始把 TEST_WEB 部署到 DigitalOcean VPS，走完後您會擁有：

- `https://poshtech.com.tw` → POSHTECH 機台站
- `https://parts.poshtech.com.tw` → 零組件站

以及一套「我在 Claude 修改 → 您按 GitHub Desktop Push → 2 分鐘內網站自動更新」的自動化流程。

---

## 階段總覽

| 階段 | 時間 | 工具 |
|------|------|------|
| 1. 建立 GitHub repo | 10 分鐘 | GitHub Desktop |
| 2. 開 DigitalOcean Droplet | 5 分鐘 | DigitalOcean 網頁 |
| 3. 設定 DNS | 5 分鐘 | 網域註冊商後台 |
| 4. 執行 setup-vps.sh | 15 分鐘 | SSH |
| 5. 等待 SSL 憑證 + 驗收 | 10 分鐘 | 瀏覽器 |
| 6. 上正式資料 | 依內容量 | 後台 |

全程約 **1 小時** 可完成上線。

---

## 階段 1：建立 GitHub Repo

**1-1. 安裝 GitHub Desktop**

若還沒裝：https://desktop.github.com/

**1-2. 登入 GitHub**

用您的帳號登入（沒有就註冊一個）。

**1-3. 把 TEST_WEB 加入 Git**

1. 打開 GitHub Desktop
2. 左上 **File → Add local repository**
3. 選擇 `C:\Users\USER\Desktop\py\TEST_WEB`
4. 會出現「這個資料夾不是 Git repo，是否要建立？」→ 選 **"create a repository"**
5. Name 填 `poshtech-web`
6. Description 隨意
7. 勾選「Git ignore」預設選項（或留空，我們已有 .gitignore 檔）
8. 按 **Create Repository**

**1-4. 推上 GitHub**

1. 主畫面右上角有 **Publish repository** 按鈕 → 按下去
2. 勾選 **Keep this code private**（私有倉儲）
3. 按 **Publish repository**
4. 完成後，您的 repo 會在 `https://github.com/您的帳號/poshtech-web`

**1-5. 拿到 Git URL**

回到 GitHub 網頁上，打開您的 repo → 右上角綠色 **Code** 按鈕 → 複製 HTTPS 網址，類似：
`https://github.com/YOUR_USERNAME/poshtech-web.git`

👉 **記下這個網址，等等 VPS 會用**

---

## 階段 2：開 DigitalOcean Droplet

**2-1. 註冊 / 登入**

https://www.digitalocean.com/ （可用 Google 帳號快速登入）

**2-2. 建立 Droplet**

右上 **Create → Droplets**，選項如下：

| 選項 | 建議 |
|------|------|
| Region | **Singapore** 或 **Tokyo**（亞洲延遲最低） |
| Image | **Ubuntu 22.04 LTS x64** |
| Droplet Type | **Basic** |
| CPU options | **Regular / SSD** |
| Size | **$12/mo（2 GB RAM / 1 vCPU / 50 GB SSD）** |
| Authentication | **SSH Key**（推薦）或 Password |
| Hostname | `poshtech-staging` |

**2-3. SSH Key 設定（推薦）**

如果選 SSH Key 但沒有：

1. 在本機 PowerShell 執行：`ssh-keygen -t ed25519`
2. 按三次 Enter（預設路徑 + 空密碼）
3. 產生後打開 `C:\Users\USER\.ssh\id_ed25519.pub`，把內容貼到 DigitalOcean 的 SSH Key 欄位

或直接選 **Password**，自己設一個強密碼也可以。

**2-4. 按 Create Droplet**，等約 1 分鐘開通。

完成後，記下 **Droplet 的 IPv4 地址**（例如 `165.232.xxx.xxx`）。

---

## 階段 3：設定 DNS

到您購買 `poshtech.com.tw` 的註冊商後台（通常是 PChome / Hiyes / Gandi 等），找「DNS 管理」。

**新增 3 筆 A 紀錄：**

| 類型 | 主機名稱 | 指向 IP | TTL |
|------|---------|---------|-----|
| A | @（或空白 / `poshtech.com.tw`） | VPS IP | 600 |
| A | www | VPS IP | 600 |
| A | parts | VPS IP | 600 |

設定好後，DNS 通常 5-30 分鐘全球生效。

**驗證 DNS：**
在 PowerShell 執行：
```powershell
nslookup poshtech.com.tw
nslookup parts.poshtech.com.tw
```
回傳的 IP 若是您 VPS 的 IP，代表成功。

---

## 階段 4：執行 setup-vps.sh

**4-1. SSH 連上 VPS**

在本機 PowerShell：

```powershell
ssh root@您的VPS_IP
```

首次連線會問「確認指紋嗎」→ 輸入 `yes`。

**4-2. 設定 REPO_URL 並執行初始化**

在 VPS 的 SSH 中：

```bash
export REPO_URL=https://github.com/YOUR_USERNAME/poshtech-web.git
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/poshtech-web/main/deploy/setup-vps.sh | bash
```

> ⚠ 如果 repo 是 **private**，上面的 curl 會失敗（GitHub 會要求授權）。  
> 解法：先 git clone 一次：
>
> ```bash
> git clone https://github.com/YOUR_USERNAME/poshtech-web.git /opt/poshtech/web
> ```
> （會跳出帳密輸入，用 GitHub 的 [Personal Access Token](https://github.com/settings/tokens) 當密碼）  
> 然後執行：
>
> ```bash
> export REPO_URL=https://github.com/YOUR_USERNAME/poshtech-web.git
> bash /opt/poshtech/web/deploy/setup-vps.sh
> ```

腳本會自動：
1. 更新系統 + 安裝 Docker、Git、防火牆
2. 拉程式碼到 `/opt/poshtech/web`
3. 建立資料夾：`/opt/poshtech/data/{machines,components}`
4. 產生 `.env.production`（JWT secret 自動隨機產生）
5. 啟動 Docker Compose
6. 初始化兩個 DB
7. 設定 cron（每 2 分鐘自動部署、每天凌晨 3 點備份）

**預計執行 10-15 分鐘**（Docker build 最花時間）。

---

## 階段 5：等待 SSL + 驗收

**5-1. 等待 Caddy 取得 SSL 憑證**

setup 完成後，Caddy 會在背景向 Let's Encrypt 申請憑證。需要 DNS 已經生效才會成功。

查看進度：
```bash
docker logs poshtech-caddy -f
```
看到 `obtained certificates` 就代表成功。按 Ctrl+C 退出。

**5-2. 瀏覽器測試**

- https://poshtech.com.tw → 應該看到 POSHTECH 機台站
- https://parts.poshtech.com.tw → 應該看到零組件站
- https://poshtech.com.tw/admin → 後台（poshtech / 89209973）

**5-3. 如果 HTTPS 不通**

通常是 DNS 未生效。檢查：
```bash
# 在 VPS 中
dig poshtech.com.tw +short       # 應回傳 VPS IP
```

若 DNS 回傳正確 IP 但 Caddy 仍無 SSL，可手動強制重新：
```bash
docker restart poshtech-caddy
docker logs poshtech-caddy -f
```

---

## 階段 6：後續維運

### 每次改內容（最常做）

**不需 SSH、不需 GitHub、完全在網頁做**：

1. 打開 https://poshtech.com.tw/admin
2. 登入後改產品、消息、圖片、設定
3. 存檔即時生效

### 每次我修改程式碼（偶爾）

1. 我透過 Claude 修改 TEST_WEB 裡的檔案
2. 您打開 **GitHub Desktop**
3. 左側看到「有修改的檔案」
4. 下方輸入 commit message（例如 `調整首頁版面`）
5. 按 **Commit to main** → 再按右上 **Push origin**
6. **2 分鐘內**，VPS 自動拉取 + 重建 → 網站更新

### 查看部署 log

```bash
ssh root@VPS_IP
tail -f /var/log/poshtech-deploy.log
```

### 手動強制部署

```bash
ssh root@VPS_IP
bash /opt/poshtech/web/deploy/auto-update.sh
```

### 查看備份

```bash
ssh root@VPS_IP
ls -la /opt/backups/poshtech/
```

### 還原備份

```bash
ssh root@VPS_IP
cd /opt/poshtech
tar -xzf /opt/backups/poshtech/poshtech_YYYYMMDD_HHMMSS.tar.gz
docker compose -f web/deploy/docker-compose.prod.yml restart
```

---

## 🆘 問題排除

| 症狀 | 解法 |
|------|------|
| 網址打不開 | 1) DNS 生效了嗎？(nslookup)  2) docker ps 看容器還活著嗎？  3) ufw status 看防火牆有沒有開 80/443 |
| 顯示「您的連線不是私人連線」 | Caddy 還在申請 SSL，等 5 分鐘 或 `docker restart poshtech-caddy` |
| 後台登入失敗 | `.env.production` 的 ADMIN_PASSWORD 有改嗎？或直接執行：`docker exec poshtech-machines npm run update-admin` |
| 改了程式碼 2 分鐘後沒更新 | 1) 有 push 到 main 分支嗎？ 2) `tail -f /var/log/poshtech-deploy.log` 看錯誤 |
| 想手動重啟 | `docker compose -f /opt/poshtech/web/deploy/docker-compose.prod.yml restart` |

---

## 🚀 從 staging 切換成正式環境

未來 staging 測試 OK，要把機台站移到 `jeouyang.com.tw`：

1. 編輯 `/opt/poshtech/web/deploy/Caddyfile`：把 `poshtech.com.tw` 那段加上 `jeouyang.com.tw`
2. 在 DNS 設定新的 A 紀錄
3. `docker restart poshtech-caddy`
4. 幾分鐘後 Caddy 會自動為 jeouyang.com.tw 申請憑證

完成後 jeouyang.com.tw 與 poshtech.com.tw 同時都指向機台站（雙重露出）。

---

## 💡 本 SOP 需要的所有檔案已備妥

您現在 `TEST_WEB/deploy/` 資料夾裡已經有：

- ✅ `Caddyfile`
- ✅ `docker-compose.prod.yml`
- ✅ `setup-vps.sh`
- ✅ `auto-update.sh`
- ✅ `backup.sh`
- ✅ `.env.production.example`
- ✅ `README.md`（技術說明）
- ✅ `SOP.md`（本文件）

執行到哪裡卡住就問我！
