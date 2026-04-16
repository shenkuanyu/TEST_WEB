# TEST_WEB — 多站測試原型（方案 B）

這是一個「一套程式碼，兩個獨立網站」的原型，用來驗證之後把「機台」與「零組件」拆成兩個網域是否符合需求。

## 運作原理

- **同一份程式碼**（TEST_WEB 是從 `web/` 複製過來的完整專案）
- **兩個資料庫檔案**：`data/machines.db`（只放機台）與 `data/components.db`（只放零組件）
- 啟動時由 `SITE_CODE` 環境變數決定這個 process 要載入哪個 DB、綁哪個 port
- 兩個站跑在不同 port，可以同時開兩個瀏覽器分頁測試

```
┌─────────────────────┐        ┌─────────────────────┐
│  localhost:3001     │        │  localhost:3002     │
│  機台館              │        │  零組件館            │
│  SITE_CODE=machines │        │  SITE_CODE=components│
│  data/machines.db   │        │  data/components.db │
└─────────────────────┘        └─────────────────────┘
            ↑                              ↑
            └──────── 同一份程式碼 ─────────┘
```

## 使用步驟

### 第一次設定

```powershell
# 1. 進入 TEST_WEB 資料夾
cd C:\Users\USER\Desktop\py\TEST_WEB

# 2. 安裝套件
npm install

# 3. 把 web/ 的主 DB 拆分成兩個站各自的 DB
npm run split-db
# → 會從 ../web/data/app.db 讀取，分別寫到 ./data/machines.db 與 ./data/components.db
```

### 同時啟動兩個站

開兩個 PowerShell 視窗，各跑一個：

```powershell
# 視窗 1：機台館
cd C:\Users\USER\Desktop\py\TEST_WEB
npm run dev:machines
# → http://localhost:3001

# 視窗 2：零組件館
cd C:\Users\USER\Desktop\py\TEST_WEB
npm run dev:components
# → http://localhost:3002
```

### 觀察重點

| 位置 | 機台館 (3001) | 零組件館 (3002) |
|------|---------------|-----------------|
| 頂部橫條 | 紅色，標「機台館」 | 藍色，標「零組件館」 |
| LOGO 旁標題 | 久洋機械股份有限公司 | 久洋機械零組件 |
| 產品列表 | 只有機台類產品 | 只有零組件類產品 |
| 後台產品管理 | 只看得到該站產品 | 只看得到該站產品 |
| 網站設定 | 各自的設定 | 各自的設定 |
| 分頁切換 | 頂部橫條有「切換到零組件館 →」連結 | 「切換到機台館 →」 |

兩個站背後其實是**同一份程式碼**，只是啟動時的 env 不同。未來修 bug 或加功能都只改一份就好。

## 與正式部署的對應

正式上 VPS 時就是用相同的方式，只是把 port 拿到 nginx 做反向代理：

```
jeouyang.com.tw          → web-machines container (SITE_CODE=machines)
parts.jeouyang.com.tw    → web-components container (SITE_CODE=components)
```

兩個 container 共用同一個 Docker 映像、各自掛自己的 data volume。

## 改的地方一覽

只改了 3 處就完成多站功能：

1. **新增 `lib/site.js`** — 讀 SITE_CODE env + 存放兩站的「身分資料」（名稱、主色、分類清單）
2. **`components/Navbar.js`** — 頂部加一條站台識別橫條 + 公司名改從 site.js 取
3. **`package.json`** — 新增 `dev:machines`、`dev:components` 兩組指令 + 加入 `cross-env` 套件

其他所有東西（產品、新聞、輪播、設定）因為都透過 `getDB()` 取資料，而 `DATABASE_PATH` 由環境變數控制，所以自然就分家了 —— 不需要在所有 SQL 裡加 `WHERE site_code=?`，乾淨俐落。

## 已知限制 / 後續可擴充

- 目前**沒有**「一個後台管兩站」的切換器；兩個後台是各自獨立的。若需要，可再加上一個跨站登入機制（兩站共用 admins 表 + cookie + 站台選擇器）
- 首頁 hero 與 about 的文字是硬編碼「久洋機械股份有限公司」，若要兩站差異更大，可改從 site.js 取
- 圖片資源（`public/uploads/`）目前兩站共用一份；若希望完全隔離，正式部署時各站掛自己的 uploads volume 即可

## 後台登入

兩個站的後台帳密都沿用原本 web/ 的設定：

- 帳號：`poshtech`
- 密碼：`89209973`
- 機台館後台：http://localhost:3001/admin/login
- 零組件館後台：http://localhost:3002/admin/login
