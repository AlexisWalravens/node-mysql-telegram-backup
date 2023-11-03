# RUN install with pnpm from a node image
FROM node:20-slim AS prod-deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# COPY node_modules & Bot to build and run with bun
FROM oven/bun:latest as bun

FROM bun AS builder
WORKDIR /app
COPY --from=prod-deps /app /app
WORKDIR /app
RUN bun build ./src/index.ts --outdir=./dist --target=bun

FROM bun

ARG TELEGRAM_BOT_MAIN_CHAT_ID=
ARG TELEGRAM_BOT_MANUAL_USER_IDS=
ARG TELEGRAM_BOT_TOKEN=
ARG CRON="0 3 * * 1"
ARG DATABASES=

ENV TELEGRAM_BOT_MAIN_CHAT_ID=${TELEGRAM_BOT_MAIN_CHAT_ID}
ENV TELEGRAM_BOT_MANUAL_USER_IDS=${TELEGRAM_BOT_MANUAL_USER_IDS}
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ENV CRON=${CRON}
ENV DATABASES=${DATABASES}

WORKDIR /app
COPY --from=builder /app/dist /app
RUN mkdir /app/backups

CMD ["bun", "run", "index.js"]