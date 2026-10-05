# 🎮 PlayLog

> 一個以玩家為核心的遊戲社群平台，用於探索遊戲、分享評測與評分，並建立屬於自己的遊戲歷程。

[English](./README_EN.md) | 繁體中文

## 📖 關於 PlayLog

PlayLog 是一個以玩家與遊戲體驗為核心所打造的遊戲社群平台。

PlayLog 的目標是提供一個讓玩家能夠探索遊戲、分享評分與評測、記錄自己玩過的遊戲，並建立個人遊戲檔案的平台。

PlayLog 不只是單純的遊戲資訊資料庫，而是更加著重於玩家產生的內容，以及每位玩家自己的遊戲體驗與歷程。

> 🚧 本專案目前仍在持續開發中。

## ✨ 主要功能

### 已完成

- ✅ 使用者註冊與登入
- ✅ JWT 身分驗證
- ✅ Refresh Token Session
- ✅ 安全的 HttpOnly Refresh Token Cookie
- ✅ 使用者個人檔案
- ✅ 個人檔案編輯
- ✅ 根據登入狀態切換的導覽列
- ✅ PostgreSQL 資料庫整合

### 預計開發

- ⬜ 遊戲資料庫
- ⬜ IGDB API 整合
- ⬜ 遊戲探索與搜尋
- ⬜ 玩家評分
- ⬜ 遊戲評測
- ⬜ 遊戲收藏
- ⬜ 個人遊戲歷程
- ⬜ 社群功能

## 🛠️ 技術架構

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend

- Node.js
- TypeScript
- Express

### Database & Infrastructure

- PostgreSQL
- Docker

## 🗄️ 資料庫架構

PlayLog 將共用帳號與身分驗證系統，和應用程式專屬資料分開管理。

```text
account_db
├── users
├── user_credentials
└── user_sessions

playlog_db
└── profiles
```

### `account_db`

負責共用帳號身分與 Authentication：

- 使用者身分
- Email 與密碼憑證
- Authentication Session

### `playlog_db`

負責 PlayLog 專屬的應用程式資料：

- 使用者個人檔案
- 遊戲資料
- 評測
- 收藏
- 遊戲歷程

兩個 Database 透過使用者的 Account UUID 建立邏輯上的關聯。

不使用跨 Database Foreign Key。

## 🔐 身分驗證

PlayLog 目前使用：

- Argon2id Password Hashing
- JWT Access Token
- Opaque Refresh Token
- HttpOnly Cookie
- Refresh Token Rotation
- SHA-256 Refresh Token Hash
- 多裝置 Session

Refresh Token 不會儲存在 Local Storage 中。

Database 中也只會保存經過 Hash 的 Refresh Token，不會保存原始 Token。

## 🚧 開發進度

- [x] React Frontend 基礎架構
- [x] Node.js / Express Backend
- [x] PostgreSQL 開發環境
- [x] 使用者註冊
- [x] 使用者登入
- [x] JWT 身分驗證
- [x] Refresh Token Session
- [x] 使用者個人檔案
- [x] 個人檔案編輯
- [ ] 遊戲資料庫
- [ ] IGDB API 整合
- [ ] 遊戲搜尋
- [ ] 玩家評分
- [ ] 遊戲評測
- [ ] 遊戲收藏
- [ ] 個人遊戲歷程
- [ ] 社群功能

## ⚙️ 開發環境

### 安裝 Frontend Dependencies

```bash
npm install
```

### 安裝 Backend Dependencies

```bash
cd Backend
npm install
```

### 環境變數

Backend 所需的環境變數可以參考：

```text
Backend/.env.example
```

並在本機建立：

```text
Backend/.env
```

Database 帳號密碼、JWT Secret 等敏感資訊不應提交至 Repository。

### 啟動開發環境

在專案根目錄執行：

```bash
npm run dev:all
```

Frontend：

```text
http://localhost:5173
```

Backend：

```text
http://localhost:3000
```

## 📁 專案結構

```text
PlayLog/
├── Backend/
│   ├── src/
│   │   ├── auth.middleware.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── db.ts
│   │   ├── profile.routes.ts
│   │   ├── profile.service.ts
│   │   ├── server.ts
│   │   └── token.service.ts
│   └── package.json
│
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── ...
│
└── package.json
```

## 🎯 專案目標

PlayLog 的目標不只是成為另一個遊戲資訊查詢網站。

這個平台的核心是「玩家」，以及每位玩家自己的遊戲歷程。

玩家未來可以透過 PlayLog：

- 探索新的遊戲
- 記錄自己玩過的遊戲
- 為遊戲進行評分
- 撰寫並分享遊戲評測
- 建立自己的遊戲收藏
- 探索其他玩家的遊戲體驗

遊戲的 Metadata 預計透過 IGDB 等外部資料來源取得，而玩家自行產生的內容，包括評分、評測、收藏與個人遊戲歷程，則會由 PlayLog 自行管理。

## 📄 License

目前尚未指定 License。