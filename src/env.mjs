import { createEnv } from '@t3-oss/env-core'
import { preprocess, z } from 'zod'

/**
 *
 * @param {string} databases
 */
const splitDatabases = (databases) => {
  const result = []
  const dbs = databases.split(',')
  for (const db of dbs) {
    const [name, port, password] = db.split(':')
    result.push({ name, port, password })
  }
  return result
}

export const env = createEnv({
  server: {
    TELEGRAM_BOT_MAIN_CHAT_ID: z.string(),
    TELEGRAM_BOT_MANUAL_USER_IDS: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),
    CRON: z.string(),
    DATABASES: preprocess(
      splitDatabases,
      z.array(
        z.object({
          name: z.string(),
          port: z.coerce.number(),
          password: z.string()
        })
      )
    )
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true
})
