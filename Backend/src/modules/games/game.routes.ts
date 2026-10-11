import { Router } from 'express'
import { GameNotFoundError, getGameById, getGameFilterOptions, importGameFromIgdb, searchLocalGames, type LocalGameSearchOptions, type LocalGameSort } from './game.service.js'
import { getSteamAppIdByIgdbId, IgdbServiceError, searchGames } from '../../integrations/igdb.service.js'
import { getSteamStoreLocalization, SteamLanguageValidationError, SteamServiceError, SteamValidationError } from '../../integrations/steam.service.js'

const router = Router()

router.get('/external/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: '請提供搜尋關鍵字' })
    return
  }

  const limitParam = typeof req.query.limit === 'string' ? req.query.limit : undefined
  const offsetParam = typeof req.query.offset === 'string' ? req.query.offset : undefined
  const limit = limitParam === undefined ? 20 : Number(limitParam)
  const offset = offsetParam === undefined ? 0 : Number(offsetParam)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'limit 必須是 1 到 50 的整數，offset 必須是非負整數' } })
    return
  }

  try {
    const games = await searchGames(query, limit, offset)
    res.json({ success: true, games, pagination: { limit, offset, hasMore: games.length === limit } })
  } catch (error) {
    console.error('IGDB game search failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(502).json({ success: false, code: 'EXTERNAL_SERVICE_ERROR', message: '遊戲搜尋服務暫時無法使用' })
  }
})

router.get('/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  const readList = (value: unknown) => {
    if (typeof value !== 'string') return []
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  const genres = [...readList(req.query.genre), ...readList(req.query.genres)]
  const platforms = [...readList(req.query.platform), ...readList(req.query.platforms)]
  const yearFrom = req.query.yearFrom === undefined ? undefined : Number(req.query.yearFrom)
  const yearTo = req.query.yearTo === undefined ? undefined : Number(req.query.yearTo)
  const minRating = req.query.minRating === undefined ? undefined : Number(req.query.minRating)
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit)
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset)
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'relevance'
  const ratedOnly = req.query.ratedOnly === 'true'
  const sortValues = new Set(['relevance', 'newest', 'oldest', 'rating', 'reviews', 'name'])
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const validYear = (value: number | undefined) => value === undefined || (Number.isInteger(value) && value >= 1900 && value <= 2200)
  if (genres.some((id) => !uuid.test(id)) || platforms.some((id) => !uuid.test(id)) ||
      !validYear(yearFrom) || !validYear(yearTo) || (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) ||
      (minRating !== undefined && (!Number.isFinite(minRating) || minRating < 0.5 || minRating > 5 || Math.round(minRating * 2) !== minRating * 2)) ||
      !Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0 ||
      !sortValues.has(sort)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '搜尋篩選條件無效' } })
    return
  }

  try {
    const searchOptions: LocalGameSearchOptions = { genres, platforms, ratedOnly, sort: sort as LocalGameSort, limit, offset }
    if (yearFrom !== undefined) searchOptions.yearFrom = yearFrom
    if (yearTo !== undefined) searchOptions.yearTo = yearTo
    if (minRating !== undefined) searchOptions.minRating = minRating
    const result = await searchLocalGames(query, searchOptions)
    res.json({ success: true, games: result.games, pagination: { total: result.total, limit: result.limit, offset: result.offset, hasMore: result.offset + result.games.length < result.total } })
  } catch (error) {
    console.error('Local game search failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '遊戲搜尋服務暫時無法使用' } })
  }
})

router.get('/filters', async (_req, res) => {
  try {
    res.json({ success: true, ...(await getGameFilterOptions()) })
  } catch (error) {
    console.error('Game filter metadata lookup failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '遊戲篩選資料暫時無法使用' } })
  }
})

router.post('/import', async (req, res) => {
  const igdbId = req.body && typeof req.body === 'object' ? req.body.igdbId : undefined
  if (typeof igdbId !== 'number' || !Number.isSafeInteger(igdbId) || igdbId <= 0) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'igdbId 必須是正整數' })
    return
  }

  try {
    const result = await importGameFromIgdb(igdbId)
    res.status(result.imported ? 201 : 200).json({ success: true, ...result })
  } catch (error) {
    if (error instanceof GameNotFoundError) {
      res.status(404).json({ success: false, code: 'GAME_NOT_FOUND', message: error.message })
      return
    }
    if (error instanceof IgdbServiceError) {
      console.error('IGDB game import failed', error.message)
      res.status(502).json({ success: false, code: 'EXTERNAL_SERVICE_ERROR', message: '遊戲匯入服務暫時無法使用' })
      return
    }
    console.error('Game import failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
  }
})

router.get('/igdb/:igdbId/steam', async (req, res) => {
  const igdbId = Number(req.params.igdbId)
  if (!/^\d+$/.test(req.params.igdbId) || !Number.isSafeInteger(igdbId) || igdbId <= 0) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'igdbId 必須是正整數' })
    return
  }

  try {
    const steamAppId = await getSteamAppIdByIgdbId(igdbId)
    res.json({ success: true, igdbId, steamAppId })
  } catch (error) {
    if (error instanceof IgdbServiceError) {
      console.error('IGDB Steam App ID lookup failed', error.message)
      res.status(502).json({ success: false, code: 'EXTERNAL_SERVICE_ERROR', message: 'Steam App ID 查詢服務暫時無法使用' })
      return
    }
    console.error('Steam App ID lookup failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
  }
})

router.get('/steam/:steamAppId/localization', async (req, res) => {
  const language = req.query.lang
  if (language !== undefined && typeof language !== 'string') {
    res.status(400).json({ success: false, error: { code: 'INVALID_LANGUAGE', message: 'lang 必須是單一字串' } })
    return
  }

  try {
    const localization = await getSteamStoreLocalization(req.params.steamAppId, language)
    res.json({ success: true, localization })
  } catch (error) {
    if (error instanceof SteamLanguageValidationError) {
      res.status(400).json({ success: false, error: { code: 'INVALID_LANGUAGE', message: error.message } })
      return
    }
    if (error instanceof SteamValidationError) {
      res.status(400).json({ success: false, error: { code: 'INVALID_STEAM_APP_ID', message: error.message } })
      return
    }
    if (error instanceof SteamServiceError) {
      console.error('Steam localization lookup failed', error.message)
      res.status(502).json({ success: false, error: { code: 'STEAM_SERVICE_ERROR', message: 'Steam 商店資料暫時無法使用' } })
      return
    }
    console.error('Steam localization request failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' } })
  }
})

router.get('/:gameId', async (req, res) => {
  const gameId = req.params.gameId
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(gameId)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_GAME_ID', message: 'gameId 必須是合法 UUID' } })
    return
  }

  try {
    const game = await getGameById(gameId)
    if (!game) {
      res.status(404).json({ success: false, error: { code: 'GAME_NOT_FOUND', message: '找不到指定遊戲' } })
      return
    }
    res.json({ success: true, game })
  } catch (error) {
    console.error('Local game detail lookup failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '遊戲資料暫時無法使用' } })
  }
})

export default router
