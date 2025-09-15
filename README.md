# Eco Matrix

[![Deploy / Staging (web)](https://github.com/fantasmagorikus/eco-matrix/actions/workflows/staging-deploy.yml/badge.svg?branch=staging)](https://github.com/fantasmagorikus/eco-matrix/actions/workflows/staging-deploy.yml?query=branch%3Astaging)
[![Vercel Project](https://img.shields.io/badge/Vercel-eco--matrix-black?logo=vercel)](https://vercel.com/fantasmagorikus-projects/eco-matrix)
[![Staging](https://img.shields.io/website?url=https%3A%2F%2Feco-matrix-staging.vercel.app&label=staging%20site)](https://eco-matrix-staging.vercel.app)

## Status

- Last staging commit: ![Last Commit](https://img.shields.io/github/last-commit/fantasmagorikus/eco-matrix/staging?label=staging%20last%20commit)
- Staging URL: https://eco-matrix-staging.vercel.app
- Staging runs: https://github.com/fantasmagorikus/eco-matrix/actions/workflows/staging-deploy.yml?query=branch%3Astaging

A minimal monorepo scaffold for a web app deployed to Vercel.

## Repo Structure

- `apps/web` – Next.js web app (env example included)
- `packages/tsconfig` – Shared TypeScript config(s)
- `.github/workflows/staging-deploy.yml` – Staging deploy to Vercel via GitHub Actions

## Requirements

- Node.js 20.x
- pnpm 9.x

These versions match the CI configuration.

## Environment Variables

- Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in values as needed.
- For CI/CD, set these GitHub repository secrets (used by the staging workflow):
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## Local Development

From the repository root:

```bash
pnpm install

pnpm dev
```

This starts `apps/web` on http://localhost:3000.

## Deployment

- Staging deploys run on pushes to the `staging` branch via `.github/workflows/staging-deploy.yml`.
- The workflow uses `vercel` CLI to pull envs, build, and deploy a preview; it outputs the deployment URL.
- Ensure the three Vercel secrets listed above are set in the GitHub repo settings.

**Staging URL**
- Stable alias: https://eco-matrix-staging.vercel.app

## Vercel Setup (Streamlined)

- In Vercel Dashboard, open the project "eco-matrix" and set:
  - Root Directory: `apps/web`
  - Node.js version: `20.x` (to match CI)
- In GitHub → Settings → Secrets and variables → Actions, add:
  - `VERCEL_TOKEN`: a Vercel personal/team token
  - `VERCEL_ORG_ID`: your team/org id (e.g., `team_...`)
  - `VERCEL_PROJECT_ID`: your project id (e.g., `prj_...`)
- Optional local link (kept out of Git):
  - From `apps/web`: `pnpm dlx vercel link` and select the existing project.
  - This writes `.vercel/project.json` locally (ignored by Git).
- Deploy: push to `staging` and check the job logs for the preview URL.

## Troubleshooting

- 404 DEPLOYMENT_NOT_FOUND: Ensure the Vercel project Root Directory is `apps/web` (fixed) and that CLI commands run from repo root (workflow updated). Re-run staging if needed.
- pnpm version errors: The workflow reads the version from `package.json#packageManager`.

## Contributing

- Use feature branches and open pull requests.
- Keep changes focused; add or update docs when behavior changes.
