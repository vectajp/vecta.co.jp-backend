# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Common Development Commands

Use Bun as the package manager. Prefer `bun run` and `bun x`; do not use `npx`.

### Development

- `bun run dev` - Start the Wrangler development server at
  `http://localhost:8787`
- `make bs` or `make bootstrap` - Bootstrap the local project setup

### Testing

- `bun run test` - Run the Bun test suite

### Code Quality

- `bun run check` - Run Biome checks
- `bun run check:fix` - Run Biome checks and write fixes

### Deployment

- `bun run deploy` - Deploy to Cloudflare Workers with minification
- `bun run cf-typegen` - Generate Cloudflare Workers types

### Database

- `bun run db:migrate:local` - Run the D1 migration against the local database
- `bun run db:migrate:remote` - Run the D1 migration against the remote database
- `bun run db:reset:local` - Remove local Wrangler D1 state for development

### Other

- `bun run clean` - Clean `node_modules`

## Architecture Overview

This is the Cloudflare Workers backend API for Vecta's corporate website. It
uses:

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **OpenAPI**: Chanfana, served from `/`
- **Validation**: Zod schemas in `src/types.ts`
- **Database**: Cloudflare D1, bound as `DB` in `wrangler.jsonc`
- **Mail delivery**: SendGrid REST API through `src/services/mail-service.ts`
- **Testing**: Bun test with mocked D1 bindings
- **Code quality**: Biome for linting and formatting
- **Git hooks**: Lefthook with Commitlint for Conventional Commits

### Project Structure

- `src/index.ts` - Main Hono app, middleware registration, and OpenAPI route
  registration
- `src/endpoints/` - Contact and admin lead API handlers extending Chanfana
  `OpenAPIRoute`
- `src/middleware/` - API key authentication, Cloudflare Access JWT
  authentication, optional referer checks, and CORS
- `src/services/` - SendGrid-compatible mail notification implementation
- `src/types.ts` - Shared TypeScript types and Zod schemas
- `src/utils/date.ts` - Tokyo-time date helpers
- `migrations/` - D1 SQL migrations
- `docs/` - Human-facing setup notes for security and mail delivery
- `tools/` - Bootstrap, doctor, and shared shell helpers

### API Endpoints

All current endpoints are OpenAPI-documented and use Zod validation:

- `GET /contacts` - List contact inquiries with pagination and optional
  `status` filtering
- `POST /contacts` - Create a contact inquiry from the public website form
- `GET /contacts/:contactId` - Fetch a single contact inquiry by ID
- `GET /admin/leads` - List contact inquiries as the shared `vecta-admin`
  `Lead` contract
- `GET /admin/leads/:leadId` - Fetch a single contact inquiry as a shared
  `Lead`

There are no active `tasks` endpoints in the current codebase.

### Contact Data Flow

`POST /contacts` validates the request body, generates an ID with `nanoid`,
stores the inquiry in D1, then sends an email notification. Email delivery errors
are logged, but the API still returns success if the database insert succeeded.

The `contacts` table stores:

- User-submitted fields: `name`, `email`, `phone`, `company`, `subject`,
  `message`
- System fields: `id`, `status`, `created_at`, `updated_at`

### Security Behavior

- `POST /contacts` is intentionally public for the inquiry form.
- Other `/contacts/*` requests require `X-API-Key` outside the development
  environment.
- `/admin/*` requests verify the Cloudflare Access
  `Cf-Access-Jwt-Assertion` header with `ACCESS_TEAM_DOMAIN` and
  `ACCESS_POLICY_AUD`.
- CORS is controlled by `CORS_ALLOWED_ORIGINS`; unset origins are not allowed.
- Credentialed admin CORS is controlled by `ADMIN_CORS_ALLOWED_ORIGINS`.
- `refererCheck` exists in `src/middleware/auth.ts`, but it is not currently
  registered in `src/index.ts`.
- Store production API keys and `SENDGRID_API_KEY` as Cloudflare Workers
  secrets. Do not commit `.dev.vars` values, Cloudflare Access production
  values, or other secrets.

### Key Configuration

- **TypeScript**: Strict mode enabled, ES2021 target
- **Biome**: 2-space indentation, single quotes, semicolons as needed
- **Custom domain**: `api.vecta.co.jp`
- **D1 database**: `prod-db-vectacojp` bound as `DB`
- **Production mail variables**: `MAIL_FROM` and `MAIL_TO` are defined in
  `wrangler.jsonc`; `SENDGRID_API_KEY` must be a secret
- **Admin Access variables**: `ACCESS_TEAM_DOMAIN`, `ACCESS_POLICY_AUD`,
  `ADMIN_CORS_ALLOWED_ORIGINS`; `ACCESS_JWKS_URL` is optional

### Date And Time Guidance

Do not use `new Date()` directly for application timestamps. Use
`src/utils/date.ts` helpers:

- `now()` - Current Tokyo time in `YYYY-MM-DD HH:mm:ss`
- `nowUTC()` - Current UTC time in ISO 8601
- `formatDate()` - Format a date while treating database values as Tokyo time
- `formatDateJapanese()` - Format a date for Japanese notification text
- `toTokyoTime()` - Convert an ISO string to `YYYY-MM-DD HH:mm:ss` Tokyo time
- `parseAsTokyoTime()` - Parse a database datetime string as Tokyo time
- `tokyoDate()` - Create a `Date` object from Tokyo-time interpretation

Cloudflare D1 internally behaves as UTC, but this project stores date strings in
`YYYY-MM-DD HH:mm:ss` and treats them as Tokyo time. `created_at` and
`updated_at` should use `now()`.
