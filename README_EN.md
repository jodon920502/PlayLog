
# PlayLog

[繁體中文](README.md) | [English](README.en.md)

**PlayLog** is a game discovery, review, and player community website. Players can explore games, browse community ratings and rankings, publish reviews, save favorites, manage a personal game library, and showcase their activity on public profiles.

> This project remains under active development. Local development and testing support does not imply a publicly launched service.

## Features

| Feature | Current status |
| --- | --- |
| Game search, import, and detail pages | Implemented |
| IGDB game data and Steam information integration | Implemented |
| Localized game titles and descriptions | Implemented |
| Account login, JWT access tokens, and refresh-token sessions | Implemented |
| Player profiles, avatars, banners, and bios | Implemented |
| Ratings (0.5–5.0 in 0.5 increments) | Implemented |
| Optional written reviews (rating-only submissions supported) | Implemented |
| Create, edit, delete reviews and average ratings | Implemented |
| Review publication/edit timestamps and status labels | Implemented |
| Public review lists on profiles with paginated loading | Implemented |
| Public review feed, sorting, and pagination | Implemented |
| Game rankings calculated from PlayLog user reviews | Implemented |
| Game favorites and favorites list | Implemented |
| Personal game library with five play statuses (wishlist, playing, completed, paused, dropped) | Implemented |
| Game library status counts, filtering, and pagination | Implemented |
| Public/private game library settings (backend-enforced access) | Implemented |
| Profile tabs for reviews, game library, and favorites | Implemented |
| Responsive UI, page SEO, Open Graph, logo, and favicon | Implemented |

### Review rules

- Everyone can read public reviews; **sign-in is required to create, edit, or delete** a review.
- Each player may have **one review per game**, which they can edit repeatedly.
- Players may submit a rating alone or include up to **5,000 characters** of written feedback.
- Ratings range from **0.5 to 5.0**, in **0.5** increments.
- Players can edit or delete only their own reviews; authorization is enforced by the backend.
- Games with reviews are protected by an `ON DELETE RESTRICT` foreign key to prevent accidental loss of reviews when a game is deleted.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16 (Docker for development) |
| Authentication | Argon2id, JWT access tokens, HttpOnly refresh-token cookies |
| External data | IGDB API, Steam API |
| Database client | `pg` (node-postgres) |

### Project structure

```text
PlayLog/
├── src/                       # React frontend
├── Backend/
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Authentication middleware
│   │   ├── modules/           # auth / games / profiles / reviews / game-statuses, etc.
│   │   └── integrations/      # IGDB / Steam
│   ├── database/
│   │   ├── README.md          # Database setup guide
│   │   ├── schemas/
│   │   │   ├── account_db.sql
│   │   │   └── playlog_db.sql
│   │   └── migrations/
│   │       └── playlog_db/
│   │           ├── 001_create_reviews.sql
│   │           ├── ...                 # Historical migrations, including favorites
│   │           ├── 005_create_user_game_statuses.sql
│   │           └── 006_add_game_library_privacy.sql
│   └── package.json
├── public/images/             # PlayLog icons and favicons
├── src/pages/                 # Pages including LibraryPage
├── src/components/seo/        # SEO component
├── package.json
├── README.md
└── README.en.md
```

## Database design

The project uses **two separate PostgreSQL databases**, keeping account data separate from website content.

| Database | Tables | Purpose |
| --- | --- | --- |
| `account_db` | `users`, `user_credentials`, `user_sessions` | Accounts, credentials, and sessions |
| `playlog_db` | `games`, `game_external_ids`, `game_localizations`, `genres`, `game_genres`, `platforms`, `game_platforms`, `profiles`, `reviews`, `game_favorites`, `user_game_statuses` | Games, genres, platforms, profiles, reviews, favorites, and game libraries |

The two `schemas/*.sql` files were exported with PostgreSQL 16.15 using `pg_dump --schema-only --no-owner --no-privileges`. They include tables, indexes, constraints, functions, and triggers, but **no actual data rows**. There are no cross-database foreign keys between the two databases.

## Local development

### Prerequisites

- Node.js and npm (check the project's actual `package.json` for version requirements)
- PostgreSQL 16 (Docker is supported)
- API configuration for IGDB / Steam integrations, depending on the features enabled

### Installation

```bash
git clone https://github.com/jodon920502/PlayLog.git
cd PlayLog
npm install
npm --prefix Backend install
```

Prepare `Backend/.env` according to `Backend/src/config/db.ts` and the project's environment configuration. Configure connections to both databases, authentication secrets, and external API credentials. **Never commit `.env` to GitHub.** Refer to the current source code for exact environment variable names.

### Database initialization

Create empty `account_db` and `playlog_db` databases first, then load their schemas using PostgreSQL `psql`. Example for an environment with `psql` installed and database credentials configured:

```powershell
psql -h localhost -U YOUR_DB_USER -d account_db -f Backend/database/schemas/account_db.sql
psql -h localhost -U YOUR_DB_USER -d playlog_db -f Backend/database/schemas/playlog_db.sql
```

> Replace `YOUR_DB_USER` with a role that has permission to create database objects. If PostgreSQL runs only inside Docker, use `docker cp` to copy the SQL files and `docker exec ... psql -f` to apply them. See [`Backend/database/README.md`](Backend/database/README.md).
>
> **Important:** The full `playlog_db.sql` is a snapshot of the current database structure. After initializing from it, **do not rerun migrations already included in the schema**, including reviews, favorites, game statuses, and privacy fields. Migrations are intended to upgrade existing databases; check the current schema before applying them.

### Run locally

```bash
npm run dev:all
```

Default development endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

If your `package.json`, environment configuration, or ports have changed, follow the current project configuration.

### Build

```bash
npm run build
npm --prefix Backend run build
```

## Main API endpoints (selected)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/games/search?q=...` | Search games |
| `GET` | `/api/games/:gameId/reviews` | List reviews for a game |
| `GET` | `/api/games/:gameId/rating-summary` | Retrieve rating summary |
| `POST` | `/api/games/:gameId/reviews` | Publish a review (sign-in required) |
| `PATCH` | `/api/reviews/:reviewId` | Edit your own review |
| `DELETE` | `/api/reviews/:reviewId` | Delete your own review |
| `GET` | `/api/profile/:profileId/reviews` | List a player's public reviews (`limit` / `offset` supported) |

Favorites, game statuses, and profile game libraries have additional APIs. These are selected known endpoints; consult the backend route implementations for exact paths, parameters, and response formats.

## Development and data security

- Schema files contain structure only; restoring them does not restore existing accounts, games, or reviews.
- Never commit `.env`, API keys, JWT secrets, database passwords, tokens, or database backups containing real data.
- Preserve new migrations for future schema changes and update schema snapshots as part of the project's maintenance workflow.
- Schema exports and build checks have been completed, but a **full restore into a fresh PostgreSQL environment has not yet been verified**.

## Project status

PlayLog is an actively developed personal project covering game discovery, community reviews, rankings, favorites, personal game libraries, and player profiles. Potential future features include player interactions and game statistics; these are not yet implemented.
