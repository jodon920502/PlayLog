import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const IGDB_GAMES_URL = 'https://api.igdb.com/v4/games'
const IGDB_EXTERNAL_GAMES_URL = 'https://api.igdb.com/v4/external_games'
const IGDB_EXTERNAL_GAME_SOURCES_URL = 'https://api.igdb.com/v4/external_game_sources'
const TOKEN_REFRESH_BUFFER_MS = 60_000

interface TwitchTokenResponse {
  access_token?: unknown
  expires_in?: unknown
}

interface CachedToken {
  accessToken: string
  expiresAt: number
}

interface IgdbExternalGame {
  uid?: unknown
  external_game_source?: unknown
}

interface IgdbExternalGameSource {
  id?: unknown
  name?: unknown
}

export class IgdbServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IgdbServiceError'
  }
}

export interface IgdbGame {
  id: number
  name: string
  slug: string
  summary?: string
  first_release_date?: number
  cover?: { image_id?: string }
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{ id: number; name: string; abbreviation?: string }>
  involved_companies?: Array<{
    developer?: boolean
    publisher?: boolean
    company?: { id: number; name: string }
  }>
}

let cachedToken: CachedToken | undefined
const externalGameSourceNames = new Map<number, string>()
let cachedSteamExternalSourceId: number | null | undefined

function getRequiredCredential(name: 'IGDB_CLIENT_ID' | 'IGDB_CLIENT_SECRET'): string {
  const value = process.env[name]?.trim()
  if (!value) throw new IgdbServiceError(`Missing required IGDB environment variable: ${name}`)
  return value
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.accessToken
  }

  const clientId = getRequiredCredential('IGDB_CLIENT_ID')
  const clientSecret = getRequiredCredential('IGDB_CLIENT_SECRET')
  const tokenResponse = await fetch(TWITCH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })

  if (!tokenResponse.ok) {
    throw new IgdbServiceError(`Twitch OAuth request failed with status ${tokenResponse.status}`)
  }

  const tokenPayload = await tokenResponse.json() as TwitchTokenResponse
  if (typeof tokenPayload.access_token !== 'string' || typeof tokenPayload.expires_in !== 'number') {
    throw new IgdbServiceError('Twitch OAuth response was invalid')
  }

  cachedToken = {
    accessToken: tokenPayload.access_token,
    expiresAt: Date.now() + tokenPayload.expires_in * 1000,
  }
  return cachedToken.accessToken
}

function escapeIgdbSearchQuery(query: string): string {
  return query.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\u0000-\u001f\u007f]/g, ' ')
}

export async function searchGames(query: string): Promise<unknown[]> {
  const token = await getAccessToken()
  const clientId = getRequiredCredential('IGDB_CLIENT_ID')
  const safeQuery = escapeIgdbSearchQuery(query)
  const body = [
    `search "${safeQuery}";`,
    'fields id, name, slug, summary, first_release_date, cover.image_id, genres.id, genres.name, platforms.id, platforms.name, platforms.abbreviation, involved_companies.developer, involved_companies.publisher, involved_companies.company.id, involved_companies.company.name;',
    'limit 10;',
  ].join(' ')

  const response = await fetch(IGDB_GAMES_URL, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!response.ok) {
    throw new IgdbServiceError(`IGDB games request failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) {
    throw new IgdbServiceError('IGDB games response was invalid')
  }
  return payload
}

export async function getGameByIgdbId(igdbId: number): Promise<IgdbGame | null> {
  const token = await getAccessToken()
  const clientId = getRequiredCredential('IGDB_CLIENT_ID')
  const body = [
    `where id = ${igdbId};`,
    'fields id, name, slug, summary, first_release_date, cover.image_id, genres.id, genres.name, platforms.id, platforms.name, platforms.abbreviation, involved_companies.developer, involved_companies.publisher, involved_companies.company.id, involved_companies.company.name;',
    'limit 1;',
  ].join(' ')

  const response = await fetch(IGDB_GAMES_URL, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!response.ok) {
    throw new IgdbServiceError(`IGDB game request failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) {
    throw new IgdbServiceError('IGDB game response was invalid')
  }
  const game = payload[0]
  if (!game || typeof game !== 'object' || typeof (game as { id?: unknown }).id !== 'number' || typeof (game as { name?: unknown }).name !== 'string' || typeof (game as { slug?: unknown }).slug !== 'string') {
    return null
  }
  return game as IgdbGame
}

export async function getSteamAppIdByIgdbId(igdbId: number): Promise<string | null> {
  const token = await getAccessToken()
  const clientId = getRequiredCredential('IGDB_CLIENT_ID')
  const body = [
    `where game = ${igdbId};`,
    'fields id, game, uid, name, url, external_game_source;',
    'limit 100;',
  ].join(' ')

  const externalGamesResponse = await fetch(IGDB_EXTERNAL_GAMES_URL, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!externalGamesResponse.ok) {
    throw new IgdbServiceError(`IGDB external games request failed with status ${externalGamesResponse.status}`)
  }

  const payload: unknown = await externalGamesResponse.json()
  if (!Array.isArray(payload)) {
    throw new IgdbServiceError('IGDB external games response was invalid')
  }

  const externalGames = payload.filter((item): item is IgdbExternalGame => Boolean(item && typeof item === 'object'))
  const sourceIds = [...new Set(externalGames
    .map((externalGame) => externalGame.external_game_source)
    .filter((sourceId): sourceId is number => typeof sourceId === 'number' && Number.isSafeInteger(sourceId) && sourceId > 0))]
  for (const sourceId of sourceIds) {
    if (externalGameSourceNames.get(sourceId)?.trim().toLowerCase() === 'steam') {
      cachedSteamExternalSourceId = sourceId
      break
    }
  }
  const unresolvedSourceIds = sourceIds.filter((sourceId) => !externalGameSourceNames.has(sourceId))

  if ((cachedSteamExternalSourceId === undefined || cachedSteamExternalSourceId === null) && unresolvedSourceIds.length > 0) {
    const sourceResponse = await fetch(IGDB_EXTERNAL_GAME_SOURCES_URL, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `fields id, name; where id = (${unresolvedSourceIds.join(',')}); limit ${unresolvedSourceIds.length};`,
    })

    if (!sourceResponse.ok) {
      throw new IgdbServiceError(`IGDB external game sources request failed with status ${sourceResponse.status}`)
    }

    const sourcePayload: unknown = await sourceResponse.json()
    if (!Array.isArray(sourcePayload)) {
      throw new IgdbServiceError('IGDB external game sources response was invalid')
    }

    for (const item of sourcePayload) {
      if (!item || typeof item !== 'object') continue
      const source = item as IgdbExternalGameSource
      if (typeof source.id === 'number' && Number.isSafeInteger(source.id) && typeof source.name === 'string') {
        externalGameSourceNames.set(source.id, source.name)
        if (source.name.trim().toLowerCase() === 'steam') {
          cachedSteamExternalSourceId = source.id
        }
      }
    }
    if (cachedSteamExternalSourceId === undefined) {
      cachedSteamExternalSourceId = null
    }
  }

  const steamSourceId = cachedSteamExternalSourceId
  if (steamSourceId === undefined || steamSourceId === null) return null

  const steamGame = externalGames.find((externalGame) => externalGame.external_game_source === steamSourceId)
  if (typeof steamGame?.uid === 'string' && steamGame.uid.trim()) {
    return steamGame.uid
  }
  return null
}
