
# PlayLog

[繁體中文](README.md) | [English](README.en.md)

**PlayLog** 是一個以遊戲為核心的探索、評測與玩家社群網站。玩家可以搜尋遊戲、瀏覽社群評分與排行榜，登入後發表評測、收藏遊戲、管理自己的遊戲庫，並透過個人檔案展示遊戲紀錄。

> 專案仍持續開發中；目前提供本機開發與測試，並不代表已正式對外營運。

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
| Database | PostgreSQL 16（Docker 開發環境） |
| 驗證 | Argon2id、JWT Access Token、HttpOnly Refresh Token Cookie |
| 外部資料 | IGDB API、Steam API |
| 資料庫連線 | `pg`（node-postgres） |

### 專案目錄

```text
PlayLog/
├── src/                       # React 前端
├── Backend/
│   ├── src/
│   │   ├── config/            # 資料庫設定
│   │   ├── middleware/        # 驗證中介層
│   │   ├── modules/           # auth / games / profiles / reviews / game-statuses 等
│   │   └── integrations/      # IGDB / Steam
│   ├── database/
│   │   ├── README.md          # 資料庫操作說明
│   │   ├── schemas/
│   │   │   ├── account_db.sql
│   │   │   └── playlog_db.sql
│   │   └── migrations/
│   │       └── playlog_db/
│   │           ├── 001_create_reviews.sql
│   │           ├── ...                 # 收藏等歷史 Migration
│   │           ├── 005_create_user_game_statuses.sql
│   │           └── 006_add_game_library_privacy.sql
│   └── package.json
├── public/images/             # PlayLog Icon / Favicon
├── src/pages/                 # LibraryPage 等頁面
├── src/components/seo/        # SEO 元件
├── package.json
├── README.md
└── README.en.md
```

## 資料庫設計

專案使用**兩個獨立的 PostgreSQL Database**，將帳號資料與網站內容分開管理。

| Database | 資料表 | 用途 |
| --- | --- | --- |
| `account_db` | `users`、`user_credentials`、`user_sessions` | 帳號、登入憑證與 Session |
| `playlog_db` | `games`、`game_external_ids`、`game_localizations`、`genres`、`game_genres`、`platforms`、`game_platforms`、`profiles`、`reviews`、`game_favorites`、`user_game_statuses` | 遊戲、分類、平台、玩家資料、評測、收藏與遊戲庫 |

兩份 `schemas/*.sql` 由 PostgreSQL 16.15 的 `pg_dump --schema-only --no-owner --no-privileges` 匯出，包含資料表、索引、約束、函式與 Trigger，**不包含任何實際資料列**。兩個 Database 之間不使用跨資料庫外鍵。

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

請依 `Backend/src/config/db.ts` 與專案環境設定準備 `Backend/.env`，設定兩個資料庫的連線資訊、驗證用密鑰及外部 API 憑證。**不要將 `.env` 提交至 GitHub**。實際環境變數名稱請以目前程式碼為準。

### 初始化資料庫

先建立空的 `account_db` 與 `playlog_db`，再使用 PostgreSQL `psql` 載入 Schema。以下為已安裝 `psql`、並設定好資料庫登入權限的範例：

```powershell
psql -h localhost -U YOUR_DB_USER -d account_db -f Backend/database/schemas/account_db.sql
psql -h localhost -U YOUR_DB_USER -d playlog_db -f Backend/database/schemas/playlog_db.sql
```

> `YOUR_DB_USER` 請替換成具備建表權限的使用者。若 PostgreSQL 只安裝在 Docker Container 中，可透過 `docker cp` 複製 SQL，再以 `docker exec ... psql -f` 執行。請參考 [`Backend/database/README.md`](Backend/database/README.md)。
>
> **重要：** 完整 `playlog_db.sql` 是目前資料庫結構的快照。若使用此 Schema 初始化，請勿再重複執行已包含其中的 Migration（包括評測、收藏、遊戲狀態與隱私欄位）。Migration 用於將既有資料庫逐步升級；實際執行前請確認版本與現有結構。

### 啟動

```bash
npm run dev:all
```

開發環境預設使用：

- Frontend：`http://localhost:5173`
- Backend：`http://localhost:3000`

如果你的 `package.json`、環境變數或連接埠已有調整，請以專案實際設定為準。

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
| `GET` | `/api/profile/:profileId/reviews` | 讀取玩家公開評測（支援 `limit`／`offset`） |

另有收藏、遊戲狀態與個人遊戲庫相關 API。以上僅為已知端點節錄；完整路徑、參數與回應格式以 Backend 路由實作為準。

## 開發與資料安全

- Schema 檔案僅保存結構；新環境不會自動擁有原本的帳號、遊戲或評論資料。
- 請勿提交 `.env`、API Key、JWT Secret、資料庫密碼、Token 或包含真實資料的資料庫備份。
- 新增資料庫變更時，應保留新的 Migration，並依專案維護流程更新 Schema 快照。
- 目前 Schema 匯出與編譯檢查已完成；**尚未在全新 PostgreSQL 環境執行完整還原驗證**。

## 專案狀態

PlayLog 為持續開發中的個人專案，目前已涵蓋遊戲探索、玩家評測、排行榜、收藏、遊戲庫及個人檔案。未來可能擴充玩家互動、遊戲統計等功能；這些規劃尚不代表已實作。
