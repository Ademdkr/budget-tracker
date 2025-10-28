# Contributing

Thanks for considering contributing to this template! A few guidelines to help keep the template friendly and stable:

- Run `pnpm install` and `pnpm -r lint` before opening a PR.
- Keep secrets out of the repository. Add `.env` files to `.gitignore` and use `.env.example` to document variables.
- For changes that affect the developer experience (scripts, setup), add a short note to `docs/SETUP.md`.
- When adding dependencies, prefer pinning to major versions and ensure `pnpm -r build` works.

Submitting a PR

1. Fork the repo and create a branch: `git checkout -b fix/your-change`
2. Make changes and run `pnpm -r test` locally (or at least `pnpm --filter @budget-tracker/backend test` and `pnpm --filter @budget-tracker/frontend test`).
3. Commit with conventional commit message style.
4. Open a PR and reference relevant issues.

Code of Conduct

- Be respectful and constructive.
