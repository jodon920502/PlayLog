# 🎮 PlayLog

A full-stack community-driven platform for discovering games, sharing reviews and ratings, and building your personal gaming profile.

## ✨ Features

- 🔐 User registration and login
- 🔑 JWT access token authentication
- 🍪 Secure refresh token sessions with HttpOnly cookies
- 👤 User profiles and profile customization
- ⭐ Game ratings and reviews
- 🔎 Game discovery and search
- 📚 Personal game collections
- 🎮 Player-focused community features

## 🛠️ Tech Stack

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

### Database
- PostgreSQL
- Docker

## 🗄️ Architecture

PlayLog separates account authentication from application-specific data.

```text
account_db
├── users
├── user_credentials
└── user_sessions

playlog_db
└── profiles
