# Profile、玩家搜尋與收藏規格

## 實作對應

- Profile routes/service：[`Backend/src/modules/profiles/profile.routes.ts`](../../Backend/src/modules/profiles/profile.routes.ts)、[`Backend/src/modules/profiles/profile.service.ts`](../../Backend/src/modules/profiles/profile.service.ts)
- Player routes：[`Backend/src/modules/profiles/player.routes.ts`](../../Backend/src/modules/profiles/player.routes.ts)
- Favorite routes/service：[`Backend/src/modules/favorites/favorite.routes.ts`](../../Backend/src/modules/favorites/favorite.routes.ts)、[`Backend/src/modules/favorites/favorite.service.ts`](../../Backend/src/modules/favorites/favorite.service.ts)
- Frontend：[`src/pages/ProfilePage.tsx`](../../src/pages/ProfilePage.tsx)、[`src/pages/ProfileEditPage.tsx`](../../src/pages/ProfileEditPage.tsx)、[`src/pages/FavoritesPage.tsx`](../../src/pages/FavoritesPage.tsx)

## Profile API

| Method | Path | Auth | 行為 |
|---|---|---|---|
| GET | `/api/profile/me` | 是 | 取得或建立自己的 Profile |
| PATCH | `/api/profile/me` | 是 | 更新自己的 display name、avatar、bio、banner、遊戲庫公開設定 |
| GET | `/api/profile/:id` | 否 | 取得公開 Profile |
| GET | `/api/profile/:id/reviews` | 否 | 取得 Profile 公開評測，支援分頁 |
| GET | `/api/profile/:id/favorites` | 否 | 取得 Profile 公開收藏，支援分頁 |
| GET | `/api/profile/display-name-availability` | 否 | 檢查名稱可用性 |
| GET | `/api/profile/me/display-name-availability` | 是 | 排除自己後檢查名稱可用性 |
| GET | `/api/players/search` | 否 | 玩家名稱搜尋與分頁 |

Profile 欄位包含 display name、avatar、bio、banner、建立/更新時間；`gameLibraryPublic` 預設為 `false`。

## 收藏 API

| Method | Path | Auth | 行為 |
|---|---|---|---|
| GET | `/api/favorites` | 是 | 取得目前玩家收藏列表與分頁 |
| GET | `/api/favorites/games/:gameId` | 是 | 查詢目前玩家是否收藏 |
| PUT | `/api/favorites/games/:gameId` | 是 | 收藏遊戲 |
| DELETE | `/api/favorites/games/:gameId` | 是 | 移除收藏 |

收藏與遊戲狀態是兩個獨立資料模型；此文件不推定收藏是否有額外公開權限設定，公開 Profile 收藏端點目前由程式碼直接提供。

