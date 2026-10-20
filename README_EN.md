# PlayLog

[繁體中文](README.md) | [English](README_EN.md)

**PlayLog** is a game discovery, review, and community platform. Players can search for games, explore community ratings and rankings, write reviews, manage favorites and personal game libraries, and showcase their gaming activity through customizable profiles.

🌐 **Live Website: [playlog.yosora.dev](https://playlog.yosora.dev)**

> **Status: Public Beta**
>
> PlayLog is under active development. Features may change, and test accounts, reviews, and other user data may be reset before the official release. The public beta does not represent a final production release.

## Features

| Feature | Status |
| --- | --- |
| Game search, import, and detailed information | Implemented |
| IGDB and Steam data integration | Implemented |
| Localized game titles and descriptions | Implemented |
| Authentication with JWT access tokens and refresh token sessions | Implemented |
| Player profiles, avatars, banners, and biographies | Implemented |
| Game ratings from 0.5 to 5.0 in 0.5 increments | Implemented |
| Optional written reviews | Implemented |
| Create, edit, and delete reviews | Implemented |
| Average rating calculations | Implemented |
| Review timestamps and edit indicators | Implemented |
| Public profile reviews with pagination | Implemented |
| Community review lists, sorting, and pagination | Implemented |
| Game rankings based on PlayLog user reviews | Implemented |
| Game favorites and favorite lists | Implemented |
| Personal game library and play statuses | Implemented |
| Library statistics, filters, and pagination | Implemented |
| Public/private game library settings with backend authorization | Implemented |
| Profile tabs for reviews, library, and favorites | Implemented |
| Responsive UI, SEO, Open Graph, logo, and favicon | Implemented |
| Rate limiting for authentication and selected APIs | Implemented |

### Review Rules

- Anyone can read public reviews, but authentication is required to create, update, or delete reviews.
- Each player may have only **one review per game**, which can be updated.
- Written reviews are optional and limited to **5,000 characters**.
- Ratings range from **0.5 to 5.0**, in increments of **0.5**.
- Players may edit or delete only their own reviews. Permissions are enforced by the backend.
- Games with existing reviews are protected by an `ON DELETE RESTRICT` foreign key constraint.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16 |
| Authentication | Argon2id, JWT Access Tokens, HttpOnly Refresh Token Cookies |
| API Security | Rate Limiting, Trusted Proxy Configuration |
| External Data | IGDB API, Steam API |
| Database Client | `pg` (node-postgres) |
| Deployment | Docker, Caddy Reverse Proxy |
| Domain & HTTPS | Cloudflare DNS, Cloudflare Tunnel |

### Public Beta Deployment

PlayLog is accessible over HTTPS through Cloudflare Tunnel.

```text
Browser
   |
   | HTTPS
   v
Cloudflare
   |
   | Cloudflare Tunnel
   v
Caddy Reverse Proxy
   |              |
   v              v
React Frontend   Express Backend
                       |
                       v
                  PostgreSQL
```

- The frontend is served as a static web application.
- Caddy serves frontend assets and reverse-proxies `/api/*` requests.
- The backend handles authentication, game data, reviews, and other APIs.
- PostgreSQL stores account, game, and player data.
- Cloudflare Tunnel provides public HTTPS access without directly exposing backend or database ports to the internet.

Private deployment configurations and credentials are not included in the public repository.

### Project Structure

```text
PlayLog/
├── src/                       # React frontend
│   ├── pages/
│   └── components/
├── Backend/
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Authentication and rate limiting
│   │   ├── modules/           # Auth, games, profiles, reviews, etc.
│   │   └── integrations/      # IGDB / Steam
│   ├── database/
│   │   ├── README.md
│   │   ├── schemas/
│   │   │   ├── account_db.sql
│   │   │   └── playlog_db.sql
│   │   └── migrations/
│   └── package.json
├── public/images/             # Icons / Favicon
├── package.json
├── README.md
└── README.en.md
```

## Database Design

PlayLog uses **two separate PostgreSQL databases** to separate authentication data from application content.

| Database | Main Tables | Purpose |
| --- | --- | --- |
| `account_db` | `users`, `user_credentials`, `user_sessions` | Accounts, credentials, and sessions |
| `playlog_db` | `games`, `game_external_ids`, `game_localizations`, `genres`, `game_genres`, `platforms`, `game_platforms`, `profiles`, `reviews`, `game_favorites`, `user_game_statuses` | Games, categories, platforms, profiles, reviews, favorites, and libraries |

The `schemas/*.sql` files were exported from PostgreSQL 16.15 using:

```bash
pg_dump --schema-only --no-owner --no-privileges
```

These files contain tables, indexes, constraints, functions, and triggers, but **no actual data rows**.

Cross-database foreign keys are not used.

## Local Development

### Requirements

- Node.js and npm (refer to the project's `package.json`)
- PostgreSQL 16 (Docker can be used)
- IGDB and Steam API configuration, depending on enabled integrations

### Installation

```bash
git clone https://github.com/jodon920502/PlayLog.git
cd PlayLog
npm install
npm --prefix Backend install
```

Configure `Backend/.env` according to `Backend/src/config/db.ts` and the current project settings.

Database credentials, authentication secrets, and external API credentials must be configured locally.

**Never commit `.env`, passwords, API keys, or tokens to GitHub.**

### Database Initialization

Create empty `account_db` and `playlog_db` databases, then import the corresponding schemas:

```powershell
psql -h localhost -U YOUR_DB_USER -d account_db -f Backend/database/schemas/account_db.sql
psql -h localhost -U YOUR_DB_USER -d playlog_db -f Backend/database/schemas/playlog_db.sql
```

Replace `YOUR_DB_USER` with a PostgreSQL user that has sufficient permissions.

See [`Backend/database/README.md`](Backend/database/README.md) for more information.

> **Important:** The full `playlog_db.sql` file represents a snapshot of the current database schema. Do not reapply migrations already included in the snapshot. Migrations are intended for upgrading existing databases.

### Start Development Servers

```bash
npm run dev:all
```

Default frontend development URL:

- Frontend: `http://localhost:5173`
- Backend: determined by the current environment and project configuration

### Build

```bash
npm run build
npm --prefix Backend run build
```

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/games/search?q=...` | Search games |
| `GET` | `/api/games/:gameId/reviews` | Get game reviews |
| `GET` | `/api/games/:gameId/rating-summary` | Get rating statistics |
| `POST` | `/api/games/:gameId/reviews` | Create a review (authentication required) |
| `PATCH` | `/api/reviews/:reviewId` | Update your review |
| `DELETE` | `/api/reviews/:reviewId` | Delete your review |
| `GET` | `/api/profile/:profileId/reviews` | Get public profile reviews |

Additional APIs support favorites, game statuses, personal libraries, and authentication.

For complete endpoint definitions, parameters, and response formats, refer to the backend implementation.

## Development and Data Security

- Schema files contain database structures only, not actual account, game, or review data.
- Never commit `.env` files, API keys, JWT secrets, database passwords, Tunnel tokens, or database backups.
- Refresh tokens are stored in HttpOnly cookies.
- Authentication and selected API endpoints use rate limiting.
- PostgreSQL is not directly exposed to the public internet.
- Database changes should be tracked through migrations, with schema snapshots updated as needed.
- A complete schema restoration test on a fresh PostgreSQL instance has not yet been completed.

## Project Status and Roadmap

**Current Status: Public Beta**

PlayLog is publicly accessible for testing and currently includes game discovery, reviews, rankings, favorites, personal game libraries, and player profiles.

Potential future improvements include:

- User experience and responsive design enhancements
- Additional player interactions and community features
- Improved game statistics and data presentation
- System reliability and security improvements

These are development directions, not guarantees of completed features.

**Try PlayLog: [https://playlog.yosora.dev](https://playlog.yosora.dev)**