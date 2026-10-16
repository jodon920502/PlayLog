# 首頁、排行榜與搜尋規格

## 實作對應

- Home：[`Backend/src/modules/home/home.routes.ts`](../../Backend/src/modules/home/home.routes.ts)、[`Backend/src/modules/home/home.service.ts`](../../Backend/src/modules/home/home.service.ts)、[`src/pages/HomePage.tsx`](../../src/pages/HomePage.tsx)
- Rankings：[`Backend/src/modules/rankings/ranking.routes.ts`](../../Backend/src/modules/rankings/ranking.routes.ts)、[`Backend/src/modules/rankings/ranking.service.ts`](../../Backend/src/modules/rankings/ranking.service.ts)、[`src/pages/RankingsPage.tsx`](../../src/pages/RankingsPage.tsx)
- Search：[`src/pages/SearchPage.tsx`](../../src/pages/SearchPage.tsx)、[`Backend/src/modules/games/game.routes.ts`](../../Backend/src/modules/games/game.routes.ts)

## API

| Method | Path | 行為 |
|---|---|---|
| GET | `/api/home` | 回傳首頁聚合資料 |
| GET | `/api/rankings` | 依排序取得排行榜，支援 limit、offset、sort |
| GET | `/api/games/search` | 本地遊戲搜尋、篩選、排序與分頁 |
| GET | `/api/players/search` | 玩家搜尋與分頁 |

排行榜服務與評測資料關聯的精確 SQL、排序值完整清單及同分規則：以 [`ranking.service.ts`](../../Backend/src/modules/rankings/ranking.service.ts) 為準；未在本文件重複推定未公開的排序規則。

