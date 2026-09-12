# Repository Guidelines

## Project Structure & Module Organization

- `app/` contains App Router pages; `app/(app)/` groups business screens; `app/api/` contains API handlers.
- `components/` groups UI by feature (`bahan-baku`, `produk`, `tren`); shared primitives live in `components/ui/`, navigation in `components/layout/`.
- `lib/` holds authentication, data access, HPP (production cost) calculations, price analysis, and shared types. `lib/mock/` contains fixtures.
- `prisma/` holds the PostgreSQL schema and migrations. `app/generated/prisma/` is generated and ignored by Git.
- `public/` stores static assets. No automated test suite currently exists.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: develop locally at `http://localhost:3000`.
- `npm run build`: create the production build.
- `npm start`: serve an existing production build.
- `npm run lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and `@/` imports for repository-root paths. Match surrounding quote and semicolon styles; frontend and backend files currently differ. No Prettier configuration exists. Use PascalCase component filenames (`ModalProduk.tsx`), camelCase helpers, and lowercase kebab-case route directories. Preserve Indonesian domain terminology. Reuse shared UI components and Tailwind tokens from `app/globals.css`.

## Testing Guidelines

There is no `npm test` script, test framework, or coverage threshold. Run lint and build before submitting. Manually verify affected screens, API responses, and cost/margin calculations. Include verification results in the PR. When introducing tests, document the runner and naming convention.

## Commit & Pull Request Guidelines

Follow the existing scoped Conventional Commit style, such as `feat(produk): tambah validasi resep`. Keep changes focused. Use descriptive branches such as `feature/produk-resep-ui`. PRs should explain behavior changes, link relevant issues, list verification performed, and include screenshots for UI changes. Call out schema or configuration changes.

## Security & Configuration

Keep credentials in ignored `.env` files; configure `DATABASE_URL` for local PostgreSQL access. Never commit secrets or generated Prisma output.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
