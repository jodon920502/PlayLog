# 遊戲庫、遊戲狀態與隱私規格

## 實作對應

- Routes：[`Backend/src/modules/game-statuses/game-status.routes.ts`](../../Backend/src/modules/game-statuses/game-status.routes.ts)
- Service：[`Backend/src/modules/game-statuses/game-status.service.ts`](../../Backend/src/modules/game-statuses/game-status.service.ts)
- Frontend：[`src/pages/LibraryPage.tsx`](../../src/pages/LibraryPage.tsx)、[`src/components/game/LibraryGameCard.tsx`](../../src/components/game/LibraryGameCard.tsx)、[`src/pages/ProfilePage.tsx`](../../src/pages/ProfilePage.tsx)
- Schema/Migration：[`playlog_db.sql`](../../Backend/database/schemas/playlog_db.sql)、[`005_create_user_game_statuses.sql`](../../Backend/database/migrations/playlog_db/005_create_user_game_statuses.sql)、[`006_add_game_library_privacy.sql`](../../Backend/database/migrations/playlog_db/006_add_game_library_privacy.sql)

## 狀態模型

每位玩家對每款遊戲最多一筆目前狀態：

| 值 | UI 語意 |
|---|---|
| `wishlist` | 想玩 |
| `playing` | 遊玩中 |
| `completed` | 已通關 |
| `paused` | 已暫停 |
| `dropped` | 已棄坑 |

清除狀態會刪除該筆 `user_game_statuses` 紀錄。`user_id` 沿用登入 JWT 的 subject；程式碼沒有以 `profile_id` 取代它。

## API

| Method | Path | Auth | 行為 |
|---|---|---|---|
| GET | `/api/status` | 是 | 取得自己的遊戲庫，支援 status、limit、offset，並回傳 statusCounts |
| GET | `/api/status/games/:gameId` | 是 | 查詢自己的單一遊戲狀態 |
| PUT | `/api/status/games/:gameId` | 是 | 設定/更新自己的遊戲狀態 |
| DELETE | `/api/status/games/:gameId` | 是 | 清除自己的遊戲狀態 |
| GET | `/api/status/profiles/:profileId/library` | 否/optional auth | 依 Profile 隱私設定取得遊戲庫，支援狀態篩選與分頁 |

公開遊戲庫回應包含遊戲、`statusCounts`、`reviewCount` 與 pagination。非本人讀取私人遊戲庫時，Backend 回傳 `403 PRIVATE_LIBRARY`；本人可讀取自己的私人遊戲庫。

## 前端隱私與 Tab

ProfilePage 以目前登入 Profile ID 判斷本人，並以 `gameLibraryPublic` 判斷其他訪客是否可見。私人遊戲庫的非本人頁面不應請求公開遊戲庫 API；現行 Profile Tab 只在可見時顯示遊戲庫。

遊戲庫與收藏維持獨立；本文件不推定玩家狀態會自動建立或移除收藏。

