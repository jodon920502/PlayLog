import { Router } from 'express'
import { GameNotFoundError, getGameById, importGameFromIgdb, searchLocalGames } from './game.service.js'
import { getSteamAppIdByIgdbId, IgdbServiceError, searchGames } from './igdb.service.js'
import { getSteamStoreLocalization, SteamLanguageValidationError, SteamServiceError, SteamValidationError } from './steam.service.js'

const router = Router()

router.get('/external/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: '請提供搜尋關鍵字' })
    return
  }

  try {
    const games = await searchGames(query)
    res.json({ success: true, games })
  } catch (error) {
    console.error('IGDB game search failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(502).json({ success: false, code: 'EXTERNAL_SERVICE_ERROR', message: '遊戲搜尋服務暫時無法使用' })
  }
})

router.get('/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '請提供搜尋關鍵字' } })
    return
  }

  try {
    const games = await searchLocalGames(query)
    res.json({ success: true, games })
  } catch (error) {
    console.error('Local game search failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '遊戲搜尋服務暫時無法使用' } })
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
