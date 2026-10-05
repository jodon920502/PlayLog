import type { PoolClient, QueryResultRow } from 'pg'
import { playlogPool } from './db.js'
import { getGameByIgdbId, getSteamAppIdByIgdbId, type IgdbGame } from './igdb.service.js'
import { getSteamStoreLocalization } from './steam.service.js'

const IGDB_SOURCE = 'IGDB'
const STEAM_SOURCE = 'STEAM'
const STEAM_LOCALE = 'zh-TW'

export class GameNotFoundError extends Error {
  constructor() {
    super('找不到指定的 IGDB 遊戲')
    this.name = 'GameNotFoundError'
  }
}

export interface PlaylogGame {
  id: string
  slug: string
  name: string
  summary: string | null
  displayName: string
  displaySummary: string | null
  coverImageId: string | null
  firstReleaseDate: Date | null
  developerName: string | null
  publisherName: string | null
  status: string
  genres: Array<{ id: string; name: string }>
  platforms: Array<{ id: string; name: string; abbreviation: string | null }>
  externalIds: Array<{ source: string; externalId: string }>
}

interface GameRow extends QueryResultRow {
  id: string
  slug: string
  name: string
  summary: string | null
  cover_image_id: string | null
  first_release_date: Date | null
  developer_name: string | null
  publisher_name: string | null
  status: string
}

interface ExistingGameRow extends QueryResultRow {
  game_id: string
}

interface LocalizationRow extends QueryResultRow {
  name: string | null
  summary: string | null
}

interface GameLocalizationLookup extends QueryResultRow {
  game_id: string
  name: string | null
  summary: string | null
}

function toPlaylogGame(
  row: GameRow,
  genres: PlaylogGame['genres'],
  platforms: PlaylogGame['platforms'],
  externalIds: PlaylogGame['externalIds'],
  localization: LocalizationRow | undefined,
): PlaylogGame {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    displayName: localization?.name ?? row.name,
    displaySummary: localization?.summary ?? row.summary,
    coverImageId: row.cover_image_id,
    firstReleaseDate: row.first_release_date,
    developerName: row.developer_name,
    publisherName: row.publisher_name,
    status: row.status,
    genres,
    platforms,
    externalIds,
  }
}

async function getGameByIdWithClient(client: PoolClient, gameId: string): Promise<PlaylogGame | null> {
  const gameResult = await client.query<GameRow>(
    'SELECT id, slug, name, summary, cover_image_id, first_release_date, developer_name, publisher_name, status FROM games WHERE id = $1',
    [gameId],
  )
  const row = gameResult.rows[0]
  if (!row) return null

  const [genresResult, platformsResult, externalIdsResult, localizationResult] = await Promise.all([
    client.query<{ id: string; name: string }>(
      'SELECT g.id, g.name FROM genres g INNER JOIN game_genres gg ON gg.genre_id = g.id WHERE gg.game_id = $1 ORDER BY g.name',
      [gameId],
    ),
    client.query<{ id: string; name: string; abbreviation: string | null }>(
      'SELECT p.id, p.name, p.abbreviation FROM platforms p INNER JOIN game_platforms gp ON gp.platform_id = p.id WHERE gp.game_id = $1 ORDER BY p.name',
      [gameId],
    ),
    client.query<{ source: string; external_id: string }>(
      'SELECT source, external_id FROM game_external_ids WHERE game_id = $1 ORDER BY source, external_id',
      [gameId],
    ),
    client.query<LocalizationRow>(
      'SELECT name, summary FROM game_localizations WHERE game_id = $1 AND locale = $2',
      [gameId, STEAM_LOCALE],
    ),
  ])

  return toPlaylogGame(
    row,
    genresResult.rows,
    platformsResult.rows,
    externalIdsResult.rows.map(({ source, external_id }) => ({ source, externalId: external_id })),
    localizationResult.rows[0],
  )
}

async function getGamesByIdsWithClient(client: PoolClient, gameIds: string[]): Promise<PlaylogGame[]> {
  if (gameIds.length === 0) return []

  const [gamesResult, genresResult, platformsResult, externalIdsResult, localizationsResult] = await Promise.all([
    client.query<GameRow>(
      'SELECT id, slug, name, summary, cover_image_id, first_release_date, developer_name, publisher_name, status FROM games WHERE id = ANY($1::uuid[])',
      [gameIds],
    ),
    client.query<{ game_id: string; id: string; name: string }>(
      'SELECT gg.game_id, g.id, g.name FROM genres g INNER JOIN game_genres gg ON gg.genre_id = g.id WHERE gg.game_id = ANY($1::uuid[]) ORDER BY g.name',
      [gameIds],
    ),
    client.query<{ game_id: string; id: string; name: string; abbreviation: string | null }>(
      'SELECT gp.game_id, p.id, p.name, p.abbreviation FROM platforms p INNER JOIN game_platforms gp ON gp.platform_id = p.id WHERE gp.game_id = ANY($1::uuid[]) ORDER BY p.name',
      [gameIds],
    ),
    client.query<{ game_id: string; source: string; external_id: string }>(
      'SELECT game_id, source, external_id FROM game_external_ids WHERE game_id = ANY($1::uuid[]) ORDER BY source, external_id',
      [gameIds],
    ),
    client.query<GameLocalizationLookup>(
      'SELECT game_id, name, summary FROM game_localizations WHERE game_id = ANY($1::uuid[]) AND locale = $2',
      [gameIds, STEAM_LOCALE],
    ),
  ])

  const genresByGame = new Map<string, PlaylogGame['genres']>()
  for (const genre of genresResult.rows) {
    const list = genresByGame.get(genre.game_id) ?? []
    list.push({ id: genre.id, name: genre.name })
    genresByGame.set(genre.game_id, list)
  }
  const platformsByGame = new Map<string, PlaylogGame['platforms']>()
  for (const platform of platformsResult.rows) {
    const list = platformsByGame.get(platform.game_id) ?? []
    list.push({ id: platform.id, name: platform.name, abbreviation: platform.abbreviation })
    platformsByGame.set(platform.game_id, list)
  }
  const externalIdsByGame = new Map<string, PlaylogGame['externalIds']>()
  for (const externalId of externalIdsResult.rows) {
    const list = externalIdsByGame.get(externalId.game_id) ?? []
    list.push({ source: externalId.source, externalId: externalId.external_id })
    externalIdsByGame.set(externalId.game_id, list)
  }
  const localizationsByGame = new Map(localizationsResult.rows.map((localization) => [localization.game_id, localization]))
  const gamesById = new Map(gamesResult.rows.map((game) => [game.id, game]))

  return gameIds.flatMap((gameId) => {
    const row = gamesById.get(gameId)
    if (!row) return []
    return [toPlaylogGame(row, genresByGame.get(gameId) ?? [], platformsByGame.get(gameId) ?? [], externalIdsByGame.get(gameId) ?? [], localizationsByGame.get(gameId))]
  })
}

export async function getGameById(gameId: string): Promise<PlaylogGame | null> {
  const client = await playlogPool.connect()
  try {
    const games = await getGamesByIdsWithClient(client, [gameId])
    return games[0] ?? null
  } finally {
    client.release()
  }
}

export async function searchLocalGames(query: string): Promise<PlaylogGame[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  const client = await playlogPool.connect()
  try {
    const result = await client.query<{ id: string }>(
      `SELECT g.id
       FROM games g
       LEFT JOIN game_localizations gl
         ON gl.game_id = g.id AND gl.locale = $2
       WHERE g.name ILIKE $1 OR gl.name ILIKE $1
       GROUP BY g.id, g.name
       ORDER BY g.name
       LIMIT 20`,
      [`%${normalizedQuery}%`, STEAM_LOCALE],
    )
    return getGamesByIdsWithClient(client, result.rows.map(({ id }) => id))
  } finally {
    client.release()
  }
}

async function getGameIdByExternalId(externalId: string): Promise<string | null> {
  const client = await playlogPool.connect()
  try {
    const result = await client.query<ExistingGameRow>(
      'SELECT game_id FROM game_external_ids WHERE source = $1 AND external_id = $2',
      [IGDB_SOURCE, externalId],
    )
    const existing = result.rows[0]
    return existing?.game_id ?? null
  } finally {
    client.release()
  }
}

function toReleaseDate(timestamp: number | undefined): Date | null {
  return typeof timestamp === 'number' ? new Date(timestamp * 1000) : null
}

function getCompanyName(game: IgdbGame, type: 'developer' | 'publisher'): string | null {
  return game.involved_companies?.find((company) => company[type] === true)?.company?.name ?? null
}

async function insertGame(client: PoolClient, game: IgdbGame, slug: string): Promise<GameRow> {
  const result = await client.query<GameRow>(
    `INSERT INTO games (slug, name, summary, cover_image_id, first_release_date, developer_name, publisher_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id, slug, name, summary, cover_image_id, first_release_date, developer_name, publisher_name, status`,
    [slug, game.name, game.summary ?? null, game.cover?.image_id ?? null, toReleaseDate(game.first_release_date), getCompanyName(game, 'developer'), getCompanyName(game, 'publisher')],
  )
  const row = result.rows[0]
  if (!row) throw new Error('GAME_SLUG_CONFLICT')
  return row
}

async function insertRelations(client: PoolClient, game: IgdbGame, gameId: string): Promise<void> {
  for (const genre of game.genres ?? []) {
    const result = await client.query<{ id: string }>(
      `INSERT INTO genres (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [genre.name],
    )
    await client.query('INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [gameId, result.rows[0]!.id])
  }

  for (const platform of game.platforms ?? []) {
    const result = await client.query<{ id: string }>(
      `INSERT INTO platforms (name, abbreviation) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET abbreviation = COALESCE(EXCLUDED.abbreviation, platforms.abbreviation)
       RETURNING id`,
      [platform.name, platform.abbreviation ?? null],
    )
    await client.query('INSERT INTO game_platforms (game_id, platform_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [gameId, result.rows[0]!.id])
  }
}

function containsCjkCharacters(value: string | null): boolean {
  return value !== null && /[\u3400-\u9FFF]/u.test(value)
}

async function enrichGameFromSteam(gameId: string, igdbId: number): Promise<void> {
  try {
    const steamAppId = await getSteamAppIdByIgdbId(igdbId)
    if (!steamAppId) return

    const localization = await getSteamStoreLocalization(steamAppId, 'tchinese')
    const externalIdClient = await playlogPool.connect()
    try {
      await externalIdClient.query('BEGIN')
      await externalIdClient.query(
        `INSERT INTO game_external_ids (game_id, source, external_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (source, external_id) DO NOTHING`,
        [gameId, STEAM_SOURCE, steamAppId],
      )
      await externalIdClient.query('COMMIT')
    } catch (error) {
      try {
        await externalIdClient.query('ROLLBACK')
      } catch (rollbackError) {
        console.warn('Steam external ID rollback failed', rollbackError instanceof Error ? rollbackError.message : 'Unknown error')
      }
      throw error
    } finally {
      externalIdClient.release()
    }

    if (containsCjkCharacters(localization.shortDescription)) {
      const localizationClient = await playlogPool.connect()
      try {
        await localizationClient.query('BEGIN')
        await localizationClient.query(
          `INSERT INTO game_localizations (game_id, locale, name, summary, source)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (game_id, locale)
           DO UPDATE SET
             name = EXCLUDED.name,
             summary = EXCLUDED.summary,
             source = EXCLUDED.source,
             updated_at = NOW()`,
          [gameId, STEAM_LOCALE, localization.name, localization.shortDescription, STEAM_SOURCE],
        )
        await localizationClient.query('COMMIT')
      } catch (error) {
        try {
          await localizationClient.query('ROLLBACK')
        } catch (rollbackError) {
          console.warn('Steam localization rollback failed', rollbackError instanceof Error ? rollbackError.message : 'Unknown error')
        }
        throw error
      } finally {
        localizationClient.release()
      }
    }
  } catch (error) {
    console.warn('Steam enrichment skipped', error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function importGameFromIgdb(igdbId: number): Promise<{ imported: boolean; game: PlaylogGame }> {
  const externalId = String(igdbId)
  const existingGameId = await getGameIdByExternalId(externalId)
  if (existingGameId) {
    await enrichGameFromSteam(existingGameId, igdbId)
    const existingGame = await getGameById(existingGameId)
    if (!existingGame) throw new Error('Existing game could not be read')
    return { imported: false, game: existingGame }
  }

  const igdbGame = await getGameByIgdbId(igdbId)
  if (!igdbGame) throw new GameNotFoundError()

  const client = await playlogPool.connect()
  let importedRow: GameRow | undefined
  try {
    await client.query('BEGIN')
    const gameSlug = igdbGame.slug
    try {
      importedRow = await insertGame(client, igdbGame, gameSlug)
    } catch (error) {
      if (error instanceof Error && error.message === 'GAME_SLUG_CONFLICT') {
        importedRow = await insertGame(client, igdbGame, `${igdbGame.slug}-igdb-${igdbId}`)
      } else {
        throw error
      }
    }
    await insertRelations(client, igdbGame, importedRow.id)
    const externalResult = await client.query<{ game_id: string }>(
      `INSERT INTO game_external_ids (game_id, source, external_id) VALUES ($1, $2, $3)
       ON CONFLICT (source, external_id) DO NOTHING
       RETURNING game_id`,
      [importedRow.id, IGDB_SOURCE, externalId],
    )
    if (!externalResult.rows[0]) {
      await client.query('ROLLBACK')
      const concurrentGameId = await getGameIdByExternalId(externalId)
      if (!concurrentGameId) throw new Error('External game ID conflict but existing game was not found')
      await enrichGameFromSteam(concurrentGameId, igdbId)
      const concurrentGame = await getGameById(concurrentGameId)
      if (!concurrentGame) throw new Error('Concurrent game could not be read')
      return { imported: false, game: concurrentGame }
    }
    await client.query('COMMIT')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Game import rollback failed', rollbackError instanceof Error ? rollbackError.message : 'Unknown error')
    }
    throw error
  } finally {
    client.release()
  }

  if (!importedRow) throw new Error('Imported game row was not created')
  await enrichGameFromSteam(importedRow.id, igdbId)
  const importedGame = await getGameById(importedRow.id)
  if (!importedGame) throw new Error('Imported game could not be read')
  return { imported: true, game: importedGame }
}
