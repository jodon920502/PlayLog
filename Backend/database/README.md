# PlayLog PostgreSQL 資料庫

PlayLog 使用兩個 PostgreSQL database：

- `account_db`：帳號、登入憑證與 Refresh Token Session。
- `playlog_db`：遊戲、遊戲關聯資料、公開 Profile 與玩家 Reviews。

## 結構檔案

- `schemas/account_db.sql`：由 `account_db` 匯出的空資料庫 Schema。
- `schemas/playlog_db.sql`：由 `playlog_db` 匯出的空資料庫 Schema。
- `migrations/playlog_db/`：只針對 `playlog_db` 的增量 Migration。

目前 `playlog_db` 的主要資料表包括：

- `games`
- `game_external_ids`
- `game_localizations`
- `genres`
- `game_genres`
- `platforms`
- `game_platforms`
- `profiles`
- `reviews`
- `user_game_statuses`

目前 `account_db` 的主要資料表包括：

- `users`
- `user_credentials`
- `user_sessions`

## Docker 與 PostgreSQL 需求

開發環境需要 PostgreSQL Docker container，且應提供可連線的 PostgreSQL 16 服務。以下指令假設：

- container 名稱為 `postgres_dev`
- PostgreSQL port 映射至本機 `5432`
- 使用者名稱、密碼與資料庫名稱透過 `Backend/.env` 提供

不要把 `.env` 內容、密碼、Token 或實際資料庫備份提交至 GitHub。

## 建立空資料庫

請先設定不含密碼的連線環境變數，再執行：

```powershell
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGUSER = "<database-user>"
$env:PGPASSWORD = "<database-password>"

createdb account_db
createdb playlog_db
```

若使用 Docker container 內的 `psql`：

```powershell
docker exec -it postgres_dev psql -U <database-user> -d postgres
```

在 `psql` 中建立資料庫：

```sql
CREATE DATABASE account_db;
CREATE DATABASE playlog_db;
```

## 使用 Schema 初始化

Schema 檔案包含資料表、Primary Key、Foreign Key、Unique Constraint、CHECK Constraint、Index、Default Value 與必要的 Extension 定義，但不包含實際資料列：

```powershell
psql -h localhost -p 5432 -U <database-user> -d account_db -f Backend/database/schemas/account_db.sql
psql -h localhost -p 5432 -U <database-user> -d playlog_db -f Backend/database/schemas/playlog_db.sql
```

`playlog_db.sql` 已包含 `reviews` 的結構。如果使用這份完整 Schema 初始化，不要再次執行 `migrations/playlog_db/001_create_reviews.sql`，否則可能遇到已存在的資料表或索引。

## 新增 Migration

未來針對 `playlog_db` 的結構變更，請在：

```text
Backend/database/migrations/playlog_db/
```

新增遞增編號的 SQL，例如：

```text
005_create_user_game_statuses.sql
006_add_game_library_privacy.sql
```

執行前請確認目標資料庫與執行紀錄，並在安全的開發環境先驗證。已套用過的 Migration 不應重複執行，也不要用 Migration 取代完整 Schema 匯出。

`account_db` 與 `playlog_db` 分開管理；若未來需要 account database 的 Migration，應建立獨立的 `account_db` Migration 目錄，避免跨資料庫混用。

目前已有資料庫依序套用 `005_create_user_game_statuses.sql` 與
`006_add_game_library_privacy.sql`。第二個 Migration 會在 `profiles` 新增
`game_library_public`，既有玩家與新玩家預設都是 `FALSE`（私人）。例如：

```powershell
psql -h localhost -p 5432 -U <database-user> -d playlog_db -f Backend/database/migrations/playlog_db/005_create_user_game_statuses.sql
psql -h localhost -p 5432 -U <database-user> -d playlog_db -f Backend/database/migrations/playlog_db/006_add_game_library_privacy.sql
```

## Schema 與 Migration 的差別

- **Schema**：某個時間點的完整資料庫結構快照，適合建立全新的空資料庫。
- **Migration**：從既有版本逐步更新資料庫結構的增量腳本，適合部署與版本升級。

目前完整 Schema 已包含 Reviews，因此 `001_create_reviews.sql` 僅供尚未建立 Reviews 的既有 `playlog_db` 依序升級使用。不要對已由 Schema 建立 `reviews` 的資料庫重複執行。

## PostgreSQL Extension 注意事項

匯出的資料庫目前使用 PostgreSQL 內建的 `plpgsql` extension。若未來新增其他 extension，請確認目標 PostgreSQL image 已安裝並允許建立該 extension，再初始化 Schema。

## 安全注意事項

- 不要提交 `Backend/.env`。
- 不要提交密碼、JWT Secret、Refresh Token、Email 或其他認證資料。
- 不要把含資料列的 `pg_dump` 備份放進 Repository。
- Schema 匯出應使用 `--schema-only --no-owner --no-privileges`。
- 公開 Repository 只應保存空資料庫 Schema 與不含 Secret 的 Migration。
