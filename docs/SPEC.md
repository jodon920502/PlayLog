# PlayLog 系統規格書

- 文件狀態：依目前 Repository 程式碼與資料庫 Schema 撰寫
- 最後檢視日期：2026-10-17
- 適用範圍：`src/`、`Backend/src/`、`Backend/database/`

## 1. 文件原則

本文件只記錄目前程式碼能直接確認的行為。README、命名或產品描述中但無法由實作確認的內容，標示為「待確認」，不視為已實作功能。

## 2. 系統總覽

PlayLog 是由 React 前端、Express/TypeScript Backend 與兩個 PostgreSQL database 組成的 Web 應用程式。

```text
Browser
  └─ React + React Router + Tailwind CSS
       └─ HTTP /api/*
            └─ Express 5 + TypeScript
                 ├─ account_db：使用者、憑證、Refresh Token session
                 └─ playlog_db：遊戲、Profile、評測、收藏、遊戲狀態
```

### 2.1 執行入口

| 層級 | 入口 | 實作 |
|---|---|---|
| Frontend | Vite entry | [`src/main.tsx`](../src/main.tsx) |
| Frontend routing | React Router | [`src/App.tsx`](../src/App.tsx) |
| Backend | Express server | [`Backend/src/server.ts`](../Backend/src/server.ts) |
| Database clients | `pg.Pool` | [`Backend/src/config/db.ts`](../Backend/src/config/db.ts) |

Backend 固定監聽 `3000`，CORS 允許 `http://localhost:5173` 並啟用 credentials。實際部署環境、反向代理與 Production port：**待確認**。

## 3. 前端路由與頁面

| Path | 頁面 | 登入限制 |
|---|---|---|
| `/` | HomePage | 公開 |
| `/login` | LoginPage | 公開 |
| `/register` | RegisterPage | 公開 |
| `/profile/:profileId` | ProfilePage | 公開，內容依 Profile 隱私規則 |
| `/profile/edit` | ProfileEditPage | `ProtectedRoute` |
| `/search` | SearchPage | 公開 |
| `/game/:gameId` | GameDetailPage | 公開；寫入功能需登入 |
| `/about` | AboutPage | 公開 |
| `/favorites` | FavoritesPage | 實際頁面可進入；資料 API 需登入 |
| `/library` | LibraryPage | 實際頁面可進入；資料 API 需登入 |
| `/reviews` | ReviewsPage | 公開 |
| `/rankings` | RankingsPage | 公開 |

路由定義位於 [`src/App.tsx`](../src/App.tsx)。Navbar、Profile Tab 與 ProtectedRoute 的完整互動細節以實際元件為準。

## 4. Backend API 總表

所有路由均掛載於 `/api` 下。需要登入的端點使用 `Authorization: Bearer <access-token>`；公開端點不要求登入。

| 領域 | Base path | 主要能力 |
|---|---|---|
| 認證 | `/api/auth` | 註冊、登入、Refresh、登出、目前使用者 |
| Profile | `/api/profile` | 自己/公開 Profile、名稱可用性、公開評測、公開收藏 |
| 玩家搜尋 | `/api/players` | 玩家搜尋與分頁 |
| 遊戲 | `/api/games` | 本地搜尋、外部搜尋、匯入、遊戲詳情、Steam/IGDB 查詢 |
| 評測 | `/api/games`、`/api/reviews` | 遊戲評測、評分摘要、本人評測、修改與刪除 |
| 收藏 | `/api/favorites` | 個人收藏列表與 CRUD |
| 遊戲狀態 | `/api/status` | 個人遊戲庫、遊戲狀態 CRUD、公開遊戲庫 |
| 首頁 | `/api/home` | 首頁聚合資料 |
| 排行榜 | `/api/rankings` | 評測排行與分頁 |
| 系統 | `/api/health`、`/api/db-test` | Health check、Account DB 連線測試 |

完整端點與欄位請見各功能規格：

- [認證](features/auth.spec.md)
- [遊戲與外部資料](features/games.spec.md)
- [評測](features/reviews.spec.md)
- [Profile、收藏與玩家](features/profiles.spec.md)
- [遊戲庫與隱私](features/game-library.spec.md)
- [首頁與排行榜](features/discovery.spec.md)

## 5. 資料模型與資料庫邊界

### 5.1 `account_db`

由 [`account_db.sql`](../Backend/database/schemas/account_db.sql) 可確認：

- `users`：使用者 UUID、username、status、建立/更新時間、刪除時間。
- `user_credentials`：使用者 Email、Argon2id hash、Email 驗證欄位與密碼變更時間。
- `user_sessions`：Refresh Token hash、User-Agent、IP、有效期限、撤銷時間。

### 5.2 `playlog_db`

由 [`playlog_db.sql`](../Backend/database/schemas/playlog_db.sql) 可確認：

- `games`、`genres`、`platforms`
- `game_external_ids`、`game_localizations`
- `game_genres`、`game_platforms`
- `profiles`
- `reviews`
- `game_favorites`
- `user_game_statuses`

`profiles.account_user_id` 在 Schema 中是 UUID 且具 UNIQUE，但沒有跨 Database foreign key。Backend 以兩個 Pool 分別連線；跨資料庫一致性由應用程式處理，具體生命週期策略：**待確認**。

### 5.3 一致性約束

- `reviews` 對 `(user_id, game_id)` 有 UNIQUE，評分 0.5–5.0 且以 0.5 遞增。
- `user_game_statuses` 對 `(user_id, game_id)` 有 UNIQUE，狀態限五種：`wishlist`、`playing`、`completed`、`paused`、`dropped`。
- `reviews.game_id` 對 `games.id` 使用 `ON DELETE RESTRICT`。
- `user_game_statuses.game_id` 對 `games.id` 使用 `ON DELETE CASCADE`。
- `game_library_public` 位於 `profiles`，預設 `FALSE`。

## 6. 認證與授權摘要

- Access Token 為 JWT，從 `Authorization` Bearer header 驗證。
- Refresh Token 放在 HttpOnly cookie `refresh_token`，路徑為 `/api/auth`。
- `requireAuth` 驗證失敗回傳 `401 UNAUTHORIZED`。
- `optionalAuth` 允許公開端點在匿名狀態下執行；無效 optional token 會視為匿名。
- 遊戲狀態與收藏寫入依 JWT `sub` 對應的 user ID，API 不接受呼叫者指定任意 owner。
- Profile 的 `game_library_public` 更新只能透過 `/api/profile/me` 修改自己的 Profile。

JWT claim 的完整格式、issuer/audience、Access Token TTL 與 Refresh Token TTL：**待確認**，需以 [`token.service.ts`](../Backend/src/modules/auth/token.service.ts) 與部署設定核對。

## 7. 已知限制與待確認項目

1. 實際 Production URL、部署拓撲、反向代理與環境變數值未在 Repository 中完整定義。
2. 未在本次文件產出中執行真實 PostgreSQL、登入帳號或第三方 IGDB/Steam API 整合測試。
3. `README_EN.md` 提及的部分功能狀態未逐項以本文件外的執行測試驗證。
4. 外部 API 的 Rate Limit、Retry、Cache 與憑證管理策略：待確認。
5. 資料庫 Migration 是否由正式 migration runner 管理，或由人工 `psql` 套用：目前可確認有 SQL 檔與 README 指引，正式部署流程待確認。
6. Profile、帳號與遊戲資料的刪除/停權同步策略：待確認。
7. API 錯誤格式在部分模組使用 `error`、部分使用頂層 `code`，尚未統一：已存在的實作差異。

## 8. 人工確認清單

- [ ] 確認 Production 前端與 Backend URL、CORS allowlist 與 HTTPS/Cookie 設定。
- [ ] 確認 JWT 的完整安全設定與 Token TTL。
- [ ] 確認兩個 PostgreSQL database 的備份、Migration、Rollback 與資料保留政策。
- [ ] 確認第三方 IGDB/Steam credential、配額與失敗處理政策。
- [ ] 使用測試帳號驗證匿名、本人、其他玩家對 Profile 與私人遊戲庫的實際權限。
- [ ] 驗證遊戲匯入、評測、收藏、遊戲狀態與排行榜的端對端資料一致性。
- [ ] 確認刪除帳號、刪除 Profile、停用帳號時的跨資料庫清理行為。
- [ ] 確認是否需要將目前未明確定義的 API response schema 發布為 OpenAPI/JSON Schema。

