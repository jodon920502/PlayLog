# PlayLog

[繁體中文](README.md) | [English](README_EN.md)

**PlayLog** 是一個以遊戲為核心的探索、評測與玩家社群網站。玩家可以搜尋遊戲、瀏覽社群評分與排行榜，登入後發表評測、收藏遊戲、管理自己的遊戲庫，並透過個人檔案展示遊戲紀錄。

🌐 **線上網站：[playlog.yosora.dev](https://playlog.yosora.dev)**

> **目前狀態：公開測試中（Public Beta）**
>
> PlayLog 仍在持續開發，部分功能可能調整。測試期間的帳號、評測及其他使用者資料可能在正式發布前重置。網站目前開放測試，不代表已正式營運。

## 主要功能

| 功能 | 目前狀態 |
| --- | --- |
| 遊戲搜尋、匯入與詳細資訊 | 已實作 |
| IGDB 遊戲資料及 Steam 資訊整合 | 已實作 |
| 遊戲名稱／簡介本地化資料 | 已實作 |
| 帳號登入、JWT Access Token 與 Refresh Token Session | 已實作 |
| 玩家個人資料、頭像／封面／自我介紹 | 已實作 |
| 評分（0.5–5.0，每次 0.5 分） | 已實作 |
| 評測心得（可只評分、不填文字） | 已實作 |
| 評測新增、編輯、刪除與平均分數 | 已實作 |
| 評測發表時間、編輯時間及狀態標示 | 已實作 |
| 個人頁面公開評測清單及分頁載入 | 已實作 |
| 公開玩家評測列表、排序與分頁 | 已實作 |
| 根據 PlayLog 玩家評測計算的遊戲排行榜 | 已實作 |
| 遊戲收藏與收藏清單 | 已實作 |
| 我的遊戲庫與遊玩狀態（想玩、遊玩中、已完成、暫停、已棄坑） | 已實作 |
| 遊戲庫狀態統計、篩選與分頁 | 已實作 |
| 個人遊戲庫公開／私人設定（後端權限控管） | 已實作 |
| 個人頁評測／遊戲庫／收藏分頁切換 | 已實作 |
| 響應式介面、頁面 SEO、Open Graph、Logo 與 Favicon | 已實作 |
| 登入、註冊及部分 API 的請求頻率限制 | 已實作 |

### 評測規則

- 所有人皆可閱讀公開評測；**新增、修改、刪除評測需登入**。
- 每位玩家對同一款遊戲只能保有**一筆**評測，但可反覆修改。
- 可以只給分數，也可以另外撰寫最多 **5,000 字元**的心得。
- 評分限定 **0.5～5.0**，間隔 **0.5**。
- 玩家只能編輯或刪除自己的評測；權限由後端驗證。
- 有評測的遊戲受到外鍵 `ON DELETE RESTRICT` 保護，避免刪除遊戲時連帶遺失評測。

## 技術架構

| 層級 | 技術 |
| --- | --- |
| Frontend | React、TypeScript、Vite、Tailwind CSS、React Router |
| Backend | Node.js、Express 5、TypeScript |
| Database | PostgreSQL 16 |
| 驗證 | Argon2id、JWT Access Token、HttpOnly Refresh Token Cookie |
| API 安全 | Rate Limiting、受信任代理設定 |
| 外部資料 | IGDB API、Steam API |
| 資料庫連線 | `pg`（node-postgres） |
| 部署 | Docker、Caddy Reverse Proxy |
| 網域與 HTTPS | Cloudflare DNS、Cloudflare Tunnel |

### 公開測試環境

PlayLog 目前透過 Cloudflare Tunnel 提供 HTTPS 存取。

```text
Browser
   |
   | HTTPS
   v
Cloudflare
   |
   | Cloudflare Tunnel
   v
Caddy Reverse Proxy
   |              |
   v              v
React Frontend   Express Backend
                       |
                       v
                  PostgreSQL
```

- 前端以靜態網站方式提供。
- Caddy 負責前端資源與 `/api/*` 反向代理。
- Backend 負責帳號驗證、遊戲資料、評測及其他 API。
- PostgreSQL 負責保存帳號、遊戲與玩家資料。
- Cloudflare Tunnel 提供公開 HTTPS 入口，無須將 Backend 或資料庫連接埠直接暴露至公網。

部署設定與敏感憑證不包含在公開儲存庫中。

### 專案目錄

```text
PlayLog/
├── src/                       # React 前端
│   ├── pages/
│   └── components/
├── Backend/
│   ├── src/
│   │   ├── config/            # 資料庫設定
│   │   ├── middleware/        # 驗證及限流中介層
│   │   ├── modules/           # auth / games / profiles / reviews 等
│   │   └── integrations/      # IGDB / Steam
│   ├── database/
│   │   ├── README.md
│   │   ├── schemas/
│   │   │   ├── account_db.sql
│   │   │   └── playlog_db.sql
│   │   └── migrations/
│   └── package.json
├── public/images/             # Icon / Favicon
├── package.json
├── README.md
└── README.en.md
```

## 資料庫設計

專案使用**兩個獨立的 PostgreSQL Database**，將帳號資料與網站內容分開管理。

| Database | 主要資料表 | 用途 |
| --- | --- | --- |
| `account_db` | `users`、`user_credentials`、`user_sessions` | 帳號、登入憑證與 Session |
| `playlog_db` | `games`、`game_external_ids`、`game_localizations`、`genres`、`game_genres`、`platforms`、`game_platforms`、`profiles`、`reviews`、`game_favorites`、`user_game_statuses` | 遊戲、分類、平台、玩家資料、評測、收藏與遊戲庫 |

兩份 `schemas/*.sql` 由 PostgreSQL 16.15 的 `pg_dump --schema-only --no-owner --no-privileges` 匯出，包含資料表、索引、約束、函式與 Trigger，**不包含任何實際資料列**。

兩個 Database 之間不使用跨資料庫外鍵。

## 本機開發

### 需求

- Node.js 與 npm（版本以專案實際 `package.json` 為準）
- PostgreSQL 16（可使用 Docker）
- IGDB／Steam 整合所需的 API 設定（依啟用功能而定）

### 安裝

```bash
git clone https://github.com/jodon920502/PlayLog.git
cd PlayLog
npm install
npm --prefix Backend install
```

請依 `Backend/src/config/db.ts` 與專案環境設定準備 `Backend/.env`，設定兩個資料庫的連線資訊、驗證用密鑰及外部 API 憑證。

**請勿將 `.env`、密碼、Token 或 API Key 提交至 GitHub。**

### 初始化資料庫

先建立空的 `account_db` 與 `playlog_db`，再使用 PostgreSQL `psql` 載入 Schema。

```powershell
psql -h localhost -U YOUR_DB_USER -d account_db -f Backend/database/schemas/account_db.sql
psql -h localhost -U YOUR_DB_USER -d playlog_db -f Backend/database/schemas/playlog_db.sql
```

`YOUR_DB_USER` 請替換成具備建表權限的使用者。

詳細操作請參考 [`Backend/database/README.md`](Backend/database/README.md)。

> **重要：** 完整 `playlog_db.sql` 是目前資料庫結構的快照。若使用此 Schema 初始化，請勿重複執行已包含其中的 Migration。Migration 用於將既有資料庫逐步升級。

### 啟動

```bash
npm run dev:all
```

開發環境預設使用：

- Frontend：`http://localhost:5173`
- Backend：依環境變數與目前專案設定

### 建置

```bash
npm run build
npm --prefix Backend run build
```

## 主要 API（節錄）

| 方法 | 路徑 | 用途 |
| --- | --- | --- |
| `GET` | `/api/games/search?q=...` | 搜尋遊戲 |
| `GET` | `/api/games/:gameId/reviews` | 讀取遊戲評測 |
| `GET` | `/api/games/:gameId/rating-summary` | 讀取評分統計 |
| `POST` | `/api/games/:gameId/reviews` | 發表評測（需登入） |
| `PATCH` | `/api/reviews/:reviewId` | 修改自己的評測 |
| `DELETE` | `/api/reviews/:reviewId` | 刪除自己的評測 |
| `GET` | `/api/profile/:profileId/reviews` | 讀取玩家公開評測 |

另有收藏、遊戲狀態、個人遊戲庫及帳號驗證相關 API。完整路徑與回應格式以 Backend 實作為準。

## 開發與資料安全

- Schema 檔案僅保存結構，不包含帳號、遊戲或評論的實際資料。
- 請勿提交 `.env`、API Key、JWT Secret、資料庫密碼、Tunnel Token 或資料庫備份。
- 正式環境使用 HttpOnly Refresh Token Cookie。
- 登入、註冊及部分 API 設有 Rate Limiting。
- PostgreSQL 不直接向公網公開服務。
- 新增資料庫變更時，應保留 Migration，並依專案維護流程更新 Schema 快照。
- 尚未在全新 PostgreSQL 環境完成完整 Schema 還原驗證。

## 專案狀態與未來規劃

**目前版本：Public Beta（公開測試）**

PlayLog 已提供線上測試網站，涵蓋遊戲探索、玩家評測、排行榜、收藏、遊戲庫及個人檔案。

後續將持續改善：

- 使用者體驗與響應式介面
- 玩家互動與社群功能
- 遊戲資料與統計呈現
- 系統穩定性及安全性

以上為開發方向，不代表所有功能均已完成。

**線上體驗：[https://playlog.yosora.dev](https://playlog.yosora.dev)**