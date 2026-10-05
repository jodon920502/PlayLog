import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { pool } from './db.js'
import authRoutes from './auth.routes.js'
import profileRoutes from './profile.routes.js'
import gameRoutes from './game.routes.js'

const app = express()
const PORT = 3000

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'PlayLog API is running' })
})

app.get('/api/db-test', async (_req, res) => {
  try {
    const result = await pool.query<{ database: string }>('SELECT current_database() AS database')
    res.json({ status: 'ok', database: result.rows[0]?.database })
  } catch (error) {
    console.error('Database connection failed', error)
    res.status(500).json({ status: 'error', message: 'Database connection failed' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/games', gameRoutes)

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Request body 必須是有效的 JSON' })
    return
  }
  next(error)
})

app.listen(PORT, () => {
  console.log(`PlayLog API running at http://localhost:${PORT}`)
})
