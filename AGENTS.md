# Repository Guidelines

## Project Structure & Module Organization
The Next.js app lives in `app/`, with `app/page.tsx` providing the main article extraction workflow and nested routes such as `app/generate/` and `app/upload/` handling AI output and dataset management. Shared UI lives under `app/components/`, while long-running logic is isolated in `lib/openai.ts` and `lib/formatSamples.ts`. Serverless APIs for scraping, saving, and training data sit in `pages/api/`. Global styles are defined in `app/globals.css` backed by Tailwind config, and static assets go in `public/`. Example: place a new author form at `app/components/AuthorForm.tsx` and surface it from the relevant route.

## Build, Test, and Development Commands
Use pnpm throughout to match the lockfile.
- `pnpm dev`: run the Next.js dev server with inspector enabled.
- `pnpm build`: compile the production bundle.
- `pnpm start`: serve the compiled app.
- `pnpm lint`: run Next.js ESLint rules; fix warnings before opening a PR.

## Coding Style & Naming Conventions
Write TypeScript with `strict` mode in mind; prefer explicit types on exported functions. Follow the established two-space indentation, single quotes for strings, and arrow functions for callbacks. Co-locate component-specific styles with the component or use Tailwind utility classes; avoid inline style objects. Import shared code via the `@/` alias defined in `tsconfig.json`.

## Testing Guidelines
The `test` script currently fails intentionally; replace it with a real test command when adding coverage. Favor lightweight component tests (e.g., Vitest with React Testing Library) and API route tests that stub OpenAI calls. Name test files `*.test.ts(x)` beside the code they exercise. Document new test commands in `package.json` and in the section above.

## Commit & Pull Request Guidelines
Commits in this repo use short, imperative subjects (e.g., `Tabs and pages`); keep them scoped and reference tickets as `#123` when relevant. Bundle lint config updates with the code they affect. Pull requests should explain intent, list any follow-up tasks, and include screenshots or curl snippets for UI or API changes. Confirm lint and any added tests pass before requesting review.

## Environment & Secrets
Store keys (OpenAI, scraping credentials) in `.env.local`; never commit secrets. If you add new variables, document them in the PR description and update onboarding notes. When testing webhooks or external calls, mock them locally rather than hitting production services.
