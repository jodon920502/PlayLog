# 認證與 Session 規格

## 實作對應

- Routes：[`Backend/src/modules/auth/auth.routes.ts`](../../Backend/src/modules/auth/auth.routes.ts)
- Service：[`Backend/src/modules/auth/auth.service.ts`](../../Backend/src/modules/auth/auth.service.ts)
- Token：[`Backend/src/modules/auth/token.service.ts`](../../Backend/src/modules/auth/token.service.ts)
- Middleware：[`Backend/src/middleware/auth.middleware.ts`](../../Backend/src/middleware/auth.middleware.ts)
- Frontend session：[`src/context/AuthContext.tsx`](../../src/context/AuthContext.tsx)、[`src/lib/authApi.ts`](../../src/lib/authApi.ts)

## API

| Method | Path | Auth | 行為 |
|---|---|---|---|
| POST | `/api/auth/register` | 否 | 建立帳號；username、Email、password 會驗證 |
| POST | `/api/auth/login` | 否 | 建立登入 Session，回傳 Access Token 與使用者資料，設定 HttpOnly Refresh Cookie |
| POST | `/api/auth/refresh` | Refresh Cookie | 旋轉/更新登入 Session |
| POST | `/api/auth/logout` | 否 | 撤銷 Refresh Session 並清除 Cookie |
| GET | `/api/auth/me` | 是 | 取得目前仍有效的帳號 |

## 已確認規則

- 密碼輸入長度需介於 8–256 字元。
- Email 會 trim、轉小寫並驗證格式。
- Access Token 由 Bearer header 傳遞。
- `requireAuth` 失敗回傳 `401`。
- Frontend 透過 `AuthProvider` 還原 Session，失敗時清除本地登入狀態。

Argon2id 參數、JWT claim 完整欄位與 TTL：**待確認**。

