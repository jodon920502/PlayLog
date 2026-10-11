const STEAM_APP_DETAILS_URL = 'https://store.steampowered.com/api/appdetails'
const DEFAULT_LANGUAGE = 'tchinese'
const SUPPORTED_LANGUAGES = new Set(['tchinese', 'english'])

interface SteamAppDetails {
  name?: unknown
  steam_appid?: unknown
  short_description?: unknown
}

interface SteamAppDetailsEnvelope {
  success?: unknown
  data?: unknown
}

type SteamAppDetailsResponse = Record<string, SteamAppDetailsEnvelope>

export interface SteamStoreLocalization {
  steamAppId: string
  language: string
  name: string | null
  shortDescription: string | null
}

export class SteamValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SteamValidationError'
  }
}

export class SteamLanguageValidationError extends SteamValidationError {
  constructor(message: string) {
    super(message)
    this.name = 'SteamLanguageValidationError'
  }
}

export class SteamServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SteamServiceError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function validateLanguage(language: string | undefined): string {
  const normalizedLanguage = language?.trim() || DEFAULT_LANGUAGE
  if (!SUPPORTED_LANGUAGES.has(normalizedLanguage)) {
    throw new SteamLanguageValidationError(`不支援的 Steam 語言：${normalizedLanguage}`)
  }
  return normalizedLanguage
}

export async function getSteamStoreLocalization(
  steamAppId: string,
  language?: string,
): Promise<SteamStoreLocalization> {
  if (!/^\d+$/.test(steamAppId)) {
    throw new SteamValidationError('Steam App ID 必須是純數字')
  }

  const normalizedLanguage = validateLanguage(language)
  const requestUrl = new URL(STEAM_APP_DETAILS_URL)
  requestUrl.searchParams.set('appids', steamAppId)
  requestUrl.searchParams.set('l', normalizedLanguage)

  let response: Response
  try {
    response = await fetch(requestUrl)
  } catch {
    throw new SteamServiceError('Steam Store service request failed')
  }
  if (!response.ok) {
    throw new SteamServiceError(`Steam Store service returned status ${response.status}`)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new SteamServiceError('Steam Store response was not valid JSON')
  }
  if (!isRecord(payload)) {
    throw new SteamServiceError('Steam Store response had an invalid format')
  }

  const appDetails = (payload as SteamAppDetailsResponse)[steamAppId]
  if (!isRecord(appDetails) || appDetails.success !== true) {
    throw new SteamServiceError('Steam App was not found')
  }
  if (!isRecord(appDetails.data)) {
    throw new SteamServiceError('Steam App response had an invalid format')
  }

  const data = appDetails.data as SteamAppDetails
  if (typeof data.steam_appid !== 'number') {
    throw new SteamServiceError('Steam App response had an invalid App ID')
  }

  return {
    steamAppId,
    language: normalizedLanguage,
    name: typeof data.name === 'string' ? data.name : null,
    shortDescription: typeof data.short_description === 'string' ? data.short_description : null,
  }
}
