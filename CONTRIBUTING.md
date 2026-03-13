# Contributing to NestSync

First off, thank you for considering contributing to NestSync! It's people like you that make open-source tools great.

## Local Development Setup

This project uses `pnpm` workspaces.

1. **Fork** and clone the repository.
2. Enable Corepack and use pnpm: `corepack enable pnpm`
3. Install dependencies: `pnpm install`
4. Build the packages: `pnpm run build`
5. Run the compiler in watch mode to test your      changes:
  ```bash
  pnpm run dev --input ./examples/src --output ./examples/client/sdk.gen.ts --client=react-query
```

## Workflow

1. Create a branch: `git checkout -b feature/your-feature-name`

2. Write your code and add/update AST snapshot tests in `packages/analyzer/src/analyzer.test.ts`.

3. Ensure all checks pass:
    - `pnpm run lint`
    - `pnpm run test`
    - `pnpm run build`

4. Commit using Conventional Commits (e.g., `feat: add SWR plugin`, `fix: parsing error on nested DTOs`).

5. Open a Pull Request!