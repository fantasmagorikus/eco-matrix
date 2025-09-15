# Eco Matrix

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

This repository currently does not include workspace manifests (e.g., `package.json`) or app source files.
Once added, a typical Next.js flow looks like:

```bash
# From repository root (monorepo)
pnpm install

# Start the web app (command may vary by your package name)
cd apps/web
pnpm dev
```

If you need, I can scaffold the workspace and a basic Next.js app in `apps/web/` to get you running locally.

## Deployment

- Staging deploys run on pushes to the `staging` branch via `.github/workflows/staging-deploy.yml`.
- The workflow uses `vercel` CLI to pull envs, build, and deploy a preview; it outputs the deployment URL.
- Ensure the three Vercel secrets listed above are set in the GitHub repo settings.

Staging trigger: 2025-09-15T00:22:38Z

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

## Contributing

- Use feature branches and open pull requests.
- Keep changes focused; add or update docs when behavior changes.
\nStaging trigger: 2025-09-15T02:58:36Z
Staging trigger (vercel root fix): 2025-09-15T03:00:50Z
