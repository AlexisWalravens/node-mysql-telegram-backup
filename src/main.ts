import 'dotenv/config'
import cron from 'node-cron'
import TelegramBot from 'node-telegram-bot-api'
import shell from 'shelljs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN as string
const MAIN_CHAT_ID = process.env.TELEGRAM_BOT_MAIN_CHAT_ID as string
const ALLOWED_USER_IDS = process.env.TELEGRAM_BOT_MANUAL_USER_IDS as string
const SCHEDULE = process.env.CRON as string
const DB_USER = process.env.DB_USER as string
const DB_PASSWORD = process.env.DB_PASSWORD as string

const allowedUserIds = ALLOWED_USER_IDS.split(',')

const bot = new TelegramBot(TOKEN, { polling: true })

const runBackup = async (chatId?: number): Promise<shell.ShellString> => {
  if (shell.which('mysqldump') === null) {
    throw new Error('mysqldump not found')
  }

  const backupCommand = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} --single-transaction=true --all-databases > backup.sql`
  const bakckup = shell.exec(backupCommand, { silent: true })

  const _filename = fileURLToPath(import.meta.url)
  const _dirname = dirname(_filename)
  const filePath = path.resolve(_dirname, '..', 'backup.sql')

  const date = new Date()
  const today = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`

  await bot.sendDocument(
    chatId ?? MAIN_CHAT_ID,
    filePath,
    {},
    {
      filename: `backup_${today}.sql`,
      contentType: 'application/sql'
    }
  )

  shell.rm('backup.sql')

  return bakckup
}

const runManualBackup = async (chatId: number): Promise<void> => {
  await bot.sendMessage(chatId, 'Making a backup...')

  try {
    await runBackup(chatId)

    await bot.sendMessage(chatId, 'Backup done!')
  } catch (error) {
    console.log(error)
    await bot.sendMessage(chatId, 'Something went wrong!')
  }
}

bot.onText(/\/backup/, (msg) => {
  if (!allowedUserIds.includes(String(msg.from?.id))) {
    void bot.sendMessage(msg.chat.id, 'You are not allowed to do this.')
    return
  }

  void runManualBackup(msg.chat.id)
})

cron.schedule(SCHEDULE, () => {
  void runBackup()
})
