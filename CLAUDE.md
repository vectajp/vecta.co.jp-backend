# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` or `bun run dev` - Start development server at http://localhost:8787
- `make bs` or `make bootstrap` - Bootstrap project for initial setup

### Testing
- `npm run test` or `bun run test` - Run tests using Vitest with Cloudflare Workers pool

### Code Quality
- `npm run check` or `bun run check` - Run Biome linter
- `npm run check:fix` or `bun run check:fix` - Run Biome linter and fix issues

### Deployment
- `npm run deploy` or `bun run deploy` - Deploy to Cloudflare Workers with minification
- `npm run cf-typegen` or `bun run cf-typegen` - Generate Cloudflare Workers types

### Database
- `npm run db:migrate:local` or `bun run db:migrate:local` - Run migrations on local D1 database
- `npm run db:migrate:remote` or `bun run db:migrate:remote` - Run migrations on remote D1 database

### Other
- `npm run clean` or `bun run clean` - Clean node_modules directory

## Architecture Overview

This is a Cloudflare Workers backend API for Vecta's corporate website using:

- **Runtime**: Cloudflare Workers
- **Framework**: Hono with Chanfana for OpenAPI documentation
- **Validation**: Zod schemas
- **Database**: Cloudflare D1 (bindings configured in wrangler.jsonc)
- **Testing**: Vitest with Cloudflare Workers pool
- **Code Quality**: Biome for linting and formatting
- **Git Hooks**: Lefthook with Commitlint for conventional commits

### Project Structure

The API is built around a REST interface with OpenAPI documentation:

- `src/index.ts` - Main application entry point, sets up Hono app with OpenAPI routes
- `src/endpoints/` - API endpoint handlers extending OpenAPIRoute from Chanfana
- `src/types.ts` - Shared TypeScript types and Zod schemas

### API Endpoints

All endpoints are OpenAPI-documented and use Zod for validation:
- `GET /tasks` - List tasks with pagination and filtering
- `POST /tasks` - Create a new task
- `GET /tasks/:taskSlug` - Fetch a specific task
- `DELETE /tasks/:taskSlug` - Delete a task

### Key Configuration

- **TypeScript**: Strict mode enabled, ES2021 target
- **Biome**: 2-space indentation, single quotes, semicolons as needed
- **Custom Domain**: Configured for api.vecta.co.jp
- **D1 Databases**: Two databases bound as `DB` (prod-d1-tutorial and prod-db-vectacojp)

### Important Guidance

- パッケージマネージャーはBunを使用してください
- npxではなく、bun x を使用する
- 日付処理には`new Date`を使用せず、`src/utils/date.ts`の日付ユーティリティ関数を使用してください
  - `now()`: 現在時刻取得（東京時間、YYYY-MM-DD HH:mm:ss形式）
  - `nowUTC()`: 現在時刻取得（UTC、ISO 8601形式）
  - `formatDate()`: 日付フォーマット（データベースの日付も東京時間として扱う）
  - `formatDateJapanese()`: 日本語形式の日付
  - `toTokyoTime()`: 東京時間への変換（YYYY-MM-DD HH:mm:ss形式）
  - `parseAsTokyoTime()`: データベースの日付文字列を東京時間のmomentオブジェクトとして解釈
  - `tokyoDate()`: Dateオブジェクト作成
  - 必要な日付処理関数がない場合は、`src/utils/date.ts`に新しい関数を追加してください

#### タイムゾーンに関する重要事項
- Cloudflare D1データベースは内部的にUTCで動作しますが、このプロジェクトでは東京時間（JST）として扱います
- データベースに保存する日付は`YYYY-MM-DD HH:mm:ss`形式で、東京時間の値をそのまま保存します
- データベースから取得した日付は自動的に東京時間として解釈されます
- `now()`関数は東京時間を返すため、`created_at`や`updated_at`には東京時間が保存されます
