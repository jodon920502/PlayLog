import pg from 'pg'

const { Pool } = pg

const requiredEnv = ['DB_HOST', 'DB_PORT', 'Account_DB_NAME', 'Playlog_DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'] as const
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required database environment variable: ${key}`)
  }
}

const sharedPoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
}

export const pool = new Pool({
  ...sharedPoolConfig,
  database: process.env.Account_DB_NAME,
})

export const playlogPool = new Pool({
  ...sharedPoolConfig,
  database: process.env.Playlog_DB_NAME,
})
