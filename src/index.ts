import fs from 'node:fs'
import path from 'path'
import mysqldump from 'mysqldump'
import cron from 'node-cron'
import TelegramBot from 'node-telegram-bot-api'

import { env } from './env.mjs'

const TOKEN = env.TELEGRAM_BOT_TOKEN
const MAIN_CHAT_ID = env.TELEGRAM_BOT_MAIN_CHAT_ID
const ALLOWED_USER_IDS = env.TELEGRAM_BOT_MANUAL_USER_IDS
const SCHEDULE = env.CRON
const DATABASES = env.DATABASES

const allowedUserIds = ALLOWED_USER_IDS.split(',')

const bot = new TelegramBot(TOKEN, { polling: true })

async function makeDump({
  name,
  port,
  password,
  today,
  directoryPath
}: {
  name: string
  port: number
  password: string
  today: string
  directoryPath?: string
}) {
  const fileName = `${name}_${today}.sql.gz`

  const filePath = path.resolve(directoryPath ?? __dirname, fileName)

  await mysqldump({
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: password,
      database: name,
      port: port
    },
    dumpToFile: filePath,
    compressFile: true
  })

  return { fileName, filePath }
}

function removeBackupFiles() {
  Bun.spawn(['rm', '-rf', 'backups/*'], {
    cwd: '../', // specify a working directory,
    onExit(_, exitCode, __, error) {
      console.log('Process exited with code:', exitCode)
      if (error) {
        console.log('error', error)
      }
    }
  })
}

const runBackup = async (chatId?: number): Promise<void> => {
  removeBackupFiles()

  const date = new Date()
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

  const directoryPath = path.resolve(import.meta.dir, '..', 'backups')
  const sqlDirectory = path.resolve(directoryPath, 'sql')

  if (!fs.existsSync(sqlDirectory)) {
    fs.mkdirSync(sqlDirectory)
  }

  const filePaths: { fileName: string; filePath: string }[] = []
  for (const db of DATABASES) {
    try {
      const { name, password, port } = db
      const filePath = await makeDump({
        name,
        password,
        port,
        today,
        directoryPath: sqlDirectory
      })
      filePaths.push(filePath)
    } catch (error) {
      console.error(error)
    }
  }

  for (const file of filePaths) {
    await bot.sendDocument(
      chatId ?? MAIN_CHAT_ID,
      file.filePath,
      {},
      {
        filename: file.fileName,
        contentType: 'application/x-zip'
      }
    )
  }

  removeBackupFiles()

  // return bakckup
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
