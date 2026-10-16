# 遊戲與外部資料規格

## 實作對應

- Routes：[`Backend/src/modules/games/game.routes.ts`](../../Backend/src/modules/games/game.routes.ts)
- Service：[`Backend/src/modules/games/game.service.ts`](../../Backend/src/modules/games/game.service.ts)
- IGDB：[`Backend/src/integrations/igdb.service.ts`](../../Backend/src/integrations/igdb.service.ts)
- Steam：[`Backend/src/integrations/steam.service.ts`](../../Backend/src/integrations/steam.service.ts)
- Frontend：[`src/pages/SearchPage.tsx`](../../src/pages/SearchPage.tsx)、[`src/pages/GameDetailPage.tsx`](../../src/pages/GameDetailPage.tsx)、[`src/services/gameService.ts`](../../src/services/gameService.ts)

## API

| Method | Path | 行為 |
|---|---|---|
| GET | `/api/games/search` | 以本地資料搜尋；支援 query、genre/platform、年份、最低評分、排序、分頁 |
| GET | `/api/games/external/search` | 查詢外部 IGDB 遊戲 |
| GET | `/api/games/filters` | 取得本地搜尋篩選資料 |
| POST | `/api/games/import` | 依 `igdbId` 匯入遊戲 |
| GET | `/api/games/igdb/:igdbId/steam` | 查詢 IGDB 遊戲對應 Steam App ID |
| GET | `/api/games/steam/:steamAppId/localization` | 取得 Steam 商店本地化資料，可帶 `lang` |
| GET | `/api/games/:gameId` | 取得遊戲詳細資料 |

## 已確認資料

`games` 包含 UUID、slug、名稱、摘要、封面 ID、發售時間、開發商、發行商、狀態與時間欄位。狀態限 `ACTIVE` 或 `HIDDEN`。

外部資料的快取期限、同步排程、API 配額與供應商故障時的降級策略：**待確認**。

