# 🎮 PlayLog

> A community-driven gaming platform for discovering games, sharing reviews and ratings, and building your personal gaming history.

English | [繁體中文](./README.md)

## 📖 About PlayLog

PlayLog is a community-driven gaming platform built around players and their gaming experiences.

The goal of PlayLog is to provide a place where players can discover games, share ratings and reviews, keep track of the games they have played, and build their own gaming profile.

Rather than being just a game information database, PlayLog focuses on player-generated content and personal gaming experiences.

> 🚧 This project is currently under active development.

## ✨ Features

### Completed

- ✅ User registration and login
- ✅ JWT authentication
- ✅ Refresh token sessions
- ✅ Secure HttpOnly refresh token cookies
- ✅ User profiles
- ✅ Profile editing
- ✅ Authentication-aware navigation
- ✅ PostgreSQL database integration

### Planned

- ⬜ Game database
- ⬜ IGDB API integration
- ⬜ Game discovery and search
- ⬜ Player ratings
- ⬜ Game reviews
- ⬜ Game collections
- ⬜ Personal gaming history
- ⬜ Community features

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

### Database & Infrastructure

- PostgreSQL
- Docker

## 🗄️ Database Architecture

PlayLog separates shared account authentication from application-specific data.

```text
account_db
├── users
├── user_credentials
└── user_sessions

playlog_db
└── profiles
```

### `account_db`

Responsible for shared account identity and authentication:

- User identity
- Email and password credentials
- Authentication sessions

### `playlog_db`

Responsible for PlayLog-specific application data:

- User profiles
- Game data
- Reviews
- Collections
- Gaming history

The two databases are logically connected through the user's Account UUID.

No cross-database foreign key is used.

## 🔐 Authentication

PlayLog currently uses:

- Argon2id password hashing
- JWT access tokens
- Opaque refresh tokens
- HttpOnly cookies
- Refresh token rotation
- SHA-256 hashed refresh tokens
- Multiple device sessions

Refresh tokens are never stored in Local Storage.

Only hashed refresh tokens are stored in the database.

## 🚧 Development Progress

- [x] React frontend foundation
- [x] Node.js / Express backend
- [x] PostgreSQL development environment
- [x] User registration
- [x] User login
- [x] JWT authentication
- [x] Refresh token sessions
- [x] User profiles
- [x] Profile editing
- [ ] Game database
- [ ] IGDB API integration
- [ ] Game search
- [ ] Player ratings
- [ ] Game reviews
- [ ] Game collections
- [ ] Personal gaming history
- [ ] Community features

## ⚙️ Development Setup

### Install Frontend Dependencies

```bash
npm install
```

### Install Backend Dependencies

```bash
cd Backend
npm install
```

### Environment Variables

Backend environment variables are documented in:

```text
Backend/.env.example
```

Create your local environment file:

```text
Backend/.env
```

Sensitive information such as database credentials and JWT secrets should never be committed to the repository.

### Start the Development Environment

From the project root:

```bash
npm run dev:all
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3000
```

## 📁 Project Structure

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

## 🎯 Project Goals

PlayLog aims to be more than just another game information website.

The platform is designed around the player and their personal gaming journey.

Players will be able to:

- Discover new games
- Keep track of games they have played
- Rate games
- Write and share reviews
- Build personal game collections
- Explore other players' gaming experiences

Game metadata is planned to be retrieved from external sources such as IGDB, while player-generated content — including ratings, reviews, collections, and gaming history — will be managed directly by PlayLog.

## 📄 License

No license has been specified yet.