# 評測與評分規格

## 實作對應

- Game review routes：[`Backend/src/modules/reviews/game-review.routes.ts`](../../Backend/src/modules/reviews/game-review.routes.ts)
- Review routes：[`Backend/src/modules/reviews/review.routes.ts`](../../Backend/src/modules/reviews/review.routes.ts)
- Service：[`Backend/src/modules/reviews/review.service.ts`](../../Backend/src/modules/reviews/review.service.ts)
- Frontend：[`src/pages/GameDetailPage.tsx`](../../src/pages/GameDetailPage.tsx)、[`src/pages/ReviewsPage.tsx`](../../src/pages/ReviewsPage.tsx)、[`src/components/review/`](../../src/components/review/)

## API

| Method | Path | Auth | 行為 |
|---|---|---|---|
| GET | `/api/games/:gameId/reviews` | 否 | 取得遊戲評測，支援分頁與排序 |
| GET | `/api/games/:gameId/rating-summary` | 否 | 取得評分摘要 |
| GET | `/api/games/:gameId/reviews/me` | 是 | 取得目前玩家對該遊戲的評測 |
| POST | `/api/games/:gameId/reviews` | 是 | 建立評測；可只送 rating |
| GET | `/api/reviews` | 否 | 公開評測 Feed，支援分頁與排序 |
| PATCH | `/api/reviews/:reviewId` | 是 | 修改自己的評測 |
| DELETE | `/api/reviews/:reviewId` | 是 | 刪除自己的評測 |

## 已確認規則

- 一名玩家對同一遊戲最多一筆評測，由資料庫 UNIQUE constraint 保證。
- rating 必須為 0.5–5.0 且以 0.5 遞增。
- content 可為空，Schema 上限 5000 字元。
- 修改/刪除權限由 Backend 依登入玩家身分檢查。
- 遊戲被評測引用時，`reviews.game_id` 使用 `ON DELETE RESTRICT`。

