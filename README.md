# Node MySQL Telegram Backup

This is a simple implementation a of mysql database scheduled backup to a Telegram channel.

Set your [Env Variables](#env-variables) then build and run the project.

The script will send a backup of all your databases in the main chat defined by `TELEGRAM_BOT_MAIN_CHAT_ID` at an interval defined by `CRON`.

You can also define a list of comma separated user ID's(`TELEGRAM_BOT_MANUAL_USER_IDS`) to give them the right to trigger manual backups.  
Note that when triggered manually the backup will be sent in the chat that triggered it.

## How to run

- run `pnpm dev` to run your code on change.
- run `pnpm build` to build for production.
- run `pnpm start` to run the production build.

## Env Variables

| Name                         | Value                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------- |
| TELEGRAM_BOT_MAIN_CHAT_ID    | ID of the chat that will recieve the sheduled backups.                        |
| TELEGRAM_BOT_MANUAL_USER_IDS | Comma separated IDs of the users that will be able to trigger manual backups. |
| TELEGRAM_BOT_TOKEN           | Telegram bot token.                                                           |
| CRON                         | Standard CRON expression. Example: `0 3 * * 1` every monday at 3 AM.          |
| DB_USER                      | Database User.                                                                |
| DB_PASSWORD                  | Databse User password.                                                        |
