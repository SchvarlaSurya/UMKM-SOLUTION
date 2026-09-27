# Repository Guidelines

## Project Structure & Module Organization

- `app/` contains App Router pages; `app/(app)/` groups business screens; `app/api/` contains API handlers.
- `components/` groups UI by feature (`bahan-baku`, `produk`, `tren`); shared primitives live in `components/ui/`, navigation in `components/layout/`.
- `lib/` holds authentication, data access, HPP (production cost) calculations, price analysis, and shared types. `lib/mock/` contains fixtures.
- `prisma/` holds the PostgreSQL schema and migrations. `app/generated/prisma/` is generated and ignored by Git.
- `public/` stores static assets.
- `tests/` holds unit tests (`*.test.ts`); `.github/workflows/ci.yml` is the CI pipeline.
- `docs/` holds project documentation; `docs/checklist-deploy.md` lists what must be done before any production deploy (the app currently runs only on localhost).

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npx prisma generate`: generate the Prisma client into `app/generated/prisma/` (ignored by Git; required after a fresh clone).
- `npm run dev`: develop locally at `http://localhost:3000`.
- `npm run build`: create the production build.
- `npm start`: serve an existing production build.
- `npm run lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.
- `npx next typegen && npx tsc --noEmit`: typecheck. `typegen` must run first on a clean checkout, otherwise `tsc` fails with `Cannot find name 'LayoutProps'`.
- `npm test`: run all unit tests.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and `@/` imports for repository-root paths. Match surrounding quote and semicolon styles; frontend and backend files currently differ. No Prettier configuration exists. Use PascalCase component filenames (`ModalProduk.tsx`), camelCase helpers, and lowercase kebab-case route directories. Preserve Indonesian domain terminology. Reuse shared UI components and Tailwind tokens from `app/globals.css`.

## Testing Guidelines

`npm test` runs `tsx --test tests/*.test.ts` using Node's built-in runner (`node:test` with `node:assert/strict`). As of commit `27ffa17` (2026-09-25) there are 85 tests in 20 suites across 8 files; trust the runner output over this number. There is no coverage threshold.

- Name test files `tests/<topic>.test.ts` (kebab-case) and import from `../lib/...`. Write `describe`/`it` names in Indonesian, matching existing tests.
- Tests must not touch the database. Keep logic in pure functions in `lib/` and inject dependencies (see `lib/verifikasiLogin.ts`), or pass a minimal fake Prisma client (see `tests/email.test.ts`).
- Add tests for any change to cost/margin/pricing math, authentication, or rate limiting.

CI (GitHub Actions) runs `npm ci`, `prisma generate`, lint, typecheck, `npm test`, and build on every pull request and every push to `main`. Before submitting, run lint, typecheck, `npm test`, and build locally. Also manually verify affected screens, API responses, and cost/margin calculations, and include the verification results in the PR.

If `npm ci` fails in CI with `Missing: ... from lock file`, the lockfile was likely regenerated on Windows without Linux/wasm32 optional dependencies. Fix `package-lock.json` rather than switching CI to `npm install`.

## Commit & Pull Request Guidelines

Follow the existing scoped Conventional Commit style, such as `feat(produk): tambah validasi resep`. Keep changes focused. Use descriptive branches such as `feature/produk-resep-ui`. PRs should explain behavior changes, link relevant issues (Jira keys such as `BTS-38`), and list verification performed. Call out schema or configuration changes.

**Screenshots are required for every PR that changes what users see** (pages, components, styles, copy). Include the affected viewports (at least desktop and a ~375 px mobile width) and before/after shots when an existing screen changes. A PR without screenshots is not ready for review if it touches UI.

## Security & Configuration

Keep credentials in ignored `.env` files; configure `DATABASE_URL` for local PostgreSQL access. Never commit secrets or generated Prisma output.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
