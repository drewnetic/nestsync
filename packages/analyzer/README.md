> **Note:** This package is part of the [NestSync](https://github.com/drewnetic/nestsync) ecosystem.

# ⚡ NestSync

**The Type-Safe Bridge for NestJS Monorepos.**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React Query](https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![NPM Downloads](https://img.shields.io/npm/dm/@nestsync/cli.svg?style=for-the-badge&color=CB3837&logo=npm&logoColor=white)

NestSync is a compiler-tier developer tool that automatically generates fully typed, production-ready frontend SDKs directly from your NestJS controllers and DTOs.

By leveraging deep **Static Analysis (AST)**, NestSync completely eliminates API contract drift without requiring you to run your NestJS server or rely on clunky OpenAPI/Swagger YAML files.

## ✨ Features

- **Zero-Runtime Overhead:** Parses TypeScript AST (`ts-morph`) directly. No need to boot your backend to generate the client.
- **End-to-End Type Safety:** Shares exact types, DTOs, and interfaces between backend and frontend.
- **Smart JSDoc Extraction:** Backend comments on DTOs are automatically carried over to the frontend interfaces for flawless developer experience (DX).
- **Pluggable Architecture:** Generate SDKs for native `fetch`, `axios`, or even **React Query** custom hooks.
- **Lightning Fast Watch Mode:** Recompiles your SDK in milliseconds when a backend controller or DTO changes.
- **Monorepo Ready:** Designed from the ground up to work seamlessly in `pnpm`, Turborepo, and Nx workspaces.

---

## 📊 Performance Benchmark (Real-World Test)

In a stress test simulating a large-scale enterprise application (**50 Modules** and **100+ DTOs**), NestSync significantly outperformed traditional OpenAPI-based workflows by eliminating the runtime overhead.

| Metric              | Swagger/OpenAPI Flow            | **NestSync (AST)**         |
| :------------------ | :------------------------------ | :------------------------- |
| **Generation Time** | 9.17s                           | **1.73s**                  |
| **Requirements**    | Running Server + Complex Config | **Source Code Only**       |
| **Process**         | Boot + JSON Export + Generation | **Direct Static Analysis** |

> **Result:** NestSync is **5.3x faster** than traditional methods. Since it doesn't require a running backend, it's perfect for CI/CD pipelines and fast local development loops.

---

## 🚀 Quick Start

### 1. Installation

Install NestSync globally or as a dev dependency in your workspace:

```bash
npm install -g @nestsync/cli
# or
pnpm add -D @nestsync/cli
```

### 2. Generate your SDK

Run the CLI, pointing to your NestJS source folder and specifying the output path for your frontend:

```Bash
npx nestsync --input ./apps/backend/src --output ./apps/frontend/src/api/sdk.gen.ts --client=fetch
```

### 3. Watch Mode (Development)

Keep the generated SDK perfectly synced with your backend in real-time:

```Bash
npx nestsync -i ./src -o ../client/sdk.gen.ts --client=react-query --watch
```

---

### 🛠 Supported Clients (Plugins)

NestSync uses a strict Strategy Pattern to emit code. You can choose your target transport layer using the `--client` flag:

| Client Flag          | Output               | Best For                                          |
| -------------------- | -------------------- | ------------------------------------------------- |
| --client=fetch       | Native Fetch         | APIEdge runtimes, Next.js App Router, modern web. |
| --client=axios       | Axios Client         | Legacy enterprise apps, complex interceptors.     |
| --client=react-query | TanStack Query Hooks | React SPA/SSR apps requiring advanced caching.    |

---

### 📖 Usage Example

## The Backend (NestJS)

You write your standard NestJS code with decorators and JSDoc:

```TypeScript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreateUserDto } from './users.dto';

@Controller('users')
export class UsersController {
  @Post(':id')
  updateUser(@Param('id') id: string, @Body() data: CreateUserDto): Promise<CreateUserDto> {
    // ...
  }
}
```

## The Frontend Setup (React/Next.js)

NestSync generates a `setNestSyncConfig` function so you can inject your Base URL and Auth Tokens globally at application boot.

```TypeScript
import { setNestSyncConfig } from './api/sdk.gen';

// Setup once in your App.tsx or main.ts
setNestSyncConfig({
  baseUrl: 'https://api.drewtech.com.br/v1',
  getToken: async () => localStorage.getItem('access_token'),
});
```

## The Frontend Usage (React Query Example)

If you used `--client=react-query`, you get perfectly typed, ready-to-use hooks:

```TypeScript
import { useUpdateUserMutation } from './api/sdk.gen';

function UserProfile() {
  const mutation = useUpdateUserMutation();

  const handleSave = () => {
    // Fully type-safe! Requires both 'id' and 'data'
    mutation.mutate({
      id: '123',
      data: { name: 'Andrew', email: 'andrew@example.com' }
    });
  };

  return <button onClick={handleSave}>Save</button>;
}
```

---

## 🏗 Architecture

NestSync operates as a modern 3-stage compiler pipeline:

1. **Analyzer:** Crawls the NestJS AST to resolve decorators and follow DTO imports recursively.
2. **Intermediate Representation (IR):** Transforms the AST into a clean, framework-agnostic JSON schema.
3. **Emitter:** Consumes the IR and passes it to the selected Transport Plugin to generate TypeScript strings.

---

## 🤝 Contributing

We welcome contributions! The repository is managed as a `pnpm` workspace.

1. Clone the repository.
2. Run `pnpm install` at the root.
3. Run `pnpm run build` to compile the packages.
4. Run `pnpm run test` to execute the Vitest AST snapshot tests.Ensure pnpm run lint passes before submitting a Pull Request.

### 📄 License

[MIT ©](https://github.com/drewnetic/nestsync/blob/main/LICENSE) Andrew Souza
