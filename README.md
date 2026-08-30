# Skillkoro LMS

> A full-stack Learning Management System built with Next.js, NestJS, Turborepo,
> shared UI components, shared validation schemas, and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)
![Turborepo](https://img.shields.io/badge/Turborepo-2.9-EF4444?style=for-the-badge&logo=turborepo)
![pnpm](https://img.shields.io/badge/pnpm-9-F69220?style=for-the-badge&logo=pnpm&logoColor=fff)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)

## Overview

Skillkoro LMS is a modern online academy foundation. The repository is organized
as a Turborepo monorepo with a Next.js frontend, a NestJS API, a reusable UI
package, and shared Zod validation contracts.

The current implementation includes a public learning platform landing page,
email/password authentication, JWT cookies, refresh-token middleware, shared
form schemas, and Neon/PostgreSQL persistence through Drizzle ORM.

## Table Of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Apps And Packages](#apps-and-packages)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database](#database)
- [API](#api)
- [Auth Flow](#auth-flow)
- [Current Status](#current-status)

## Features

| Area | Details |
| --- | --- |
| Landing page | Hero, partners, flexible learning, testimonials, FAQ, CTA, header, footer |
| Authentication | Signup, login, logout, refresh token, current user lookup |
| Session handling | HTTP-only access and refresh cookies |
| Frontend auth | Next.js server actions and middleware-based token refresh |
| API responses | Global success/error response shape |
| Validation | Shared Zod schemas used across frontend and backend |
| UI system | Shared Radix/shadcn-style React components |
| Database | Drizzle ORM with Neon serverless PostgreSQL |

## Tech Stack

| Layer | Tools |
| --- | --- |
| Monorepo | Turborepo, pnpm workspaces |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | NestJS 11, Passport, JWT, cookie-parser |
| Database | PostgreSQL, Neon, Drizzle ORM, Drizzle Kit |
| Validation | Zod, nestjs-zod, react-hook-form |
| UI | Radix UI, lucide-react, shared `@repo/ui` components |
| Tooling | TypeScript, ESLint, Prettier, Jest |

## Project Structure

```txt
lms-nextjs-nestjs-turborepo/
  apps/
    api/                    NestJS backend API
    web/                    Next.js frontend app

  packages/
    ui/                     Shared React UI components
    validators/             Shared Zod schemas and TypeScript types
    eslint-config/          Shared ESLint configuration
    typescript-config/      Shared TypeScript configuration

  package.json
  pnpm-workspace.yaml
  turbo.json
```

## Apps And Packages

| Workspace | Description | Default Port |
| --- | --- | --- |
| `apps/web` | Next.js frontend for the LMS platform | `3001` |
| `apps/api` | NestJS backend API | `3000` |
| `@repo/ui` | Shared React component library | N/A |
| `@repo/validators` | Shared validation schemas and types | N/A |
| `@repo/eslint-config` | Shared lint config | N/A |
| `@repo/typescript-config` | Shared TypeScript config | N/A |

### Frontend: `apps/web`

The web app contains the public user experience for the learning platform.

- Public landing page
- Header, footer, and navigation
- Login and registration dialogs
- User avatar section
- Server actions for signup, login, and logout
- API client that forwards backend cookies
- Middleware that refreshes expired or near-expired access tokens

### Backend: `apps/api`

The API handles authentication, user persistence, and normalized responses.

- NestJS module architecture
- Auth module with local and JWT strategies
- Users module backed by Drizzle ORM
- Global Zod validation pipe
- Global exception filter
- Global response interceptor
- HTTP-only cookie auth

### Shared UI: `@repo/ui`

Reusable UI primitives and composed components, including:

```txt
button, input, form, dialog, tabs, dropdown-menu, table, toast,
avatar, checkbox, select, sidebar, sheet, tooltip, calendar
```

### Shared Validators: `@repo/validators`

Reusable Zod schemas and TypeScript types, including:

```txt
SignupSchema
LoginSchema
SignupResponseSchema
MeResponseSchema
JwtPayloadSchema
```

## Getting Started

### Requirements

| Requirement | Version |
| --- | --- |
| Node.js | `>=18` |
| pnpm | `9.x` |
| Database | PostgreSQL / Neon |

### Install Dependencies

```bash
pnpm install
```

### Run In Development

Run all workspace dev tasks:

```bash
pnpm dev
```

Run one app at a time:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

Local URLs:

| App | URL |
| --- | --- |
| Frontend | `http://localhost:3001` |
| Backend | `http://localhost:3000` |

## Environment Variables

Create an `.env` file inside `apps/api`:

```env
DATABASE_URL="postgresql://..."
PORT=3000
```

Optional frontend variable:

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

If `NEXT_PUBLIC_API_URL` is not set, the frontend defaults to
`http://localhost:3000`.

> Production note: JWT secrets are currently defined in
> `apps/api/src/auth/constants.ts`. Move them into environment variables before
> deploying.

## Available Scripts

### Root Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all development tasks with Turbo |
| `pnpm build` | Run all build tasks with Turbo |
| `pnpm lint` | Run lint tasks across workspaces |
| `pnpm check-types` | Run TypeScript checks across workspaces |
| `pnpm format` | Format TypeScript, TSX, and Markdown files |

### Useful Workspace Commands

| Command | Description |
| --- | --- |
| `pnpm --filter web dev` | Start the Next.js app on port `3001` |
| `pnpm --filter api dev` | Start the NestJS API in watch mode |
| `pnpm --filter web build` | Build the frontend |
| `pnpm --filter @repo/validators build` | Build shared validators |
| `pnpm --filter web check-types` | Type-check the frontend |
| `pnpm --filter api lint` | Lint the API |

> Current note: the API package uses `_build` instead of `build`, so the root
> Turbo build task will not build the API until that script is renamed or mapped.

## Database

The API uses Drizzle ORM with schema files in:

```txt
apps/api/src/db/schema.ts
```

Migration files are stored in:

```txt
apps/api/migrations/
```

Current `users` table:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | serial | Primary key |
| `firstName` | varchar | Required |
| `lastName` | varchar | Required |
| `email` | varchar | Required and unique |
| `password` | varchar | Required, bcrypt-hashed |
| `createdAt` | timestamp | Defaults to current time |
| `updatedAt` | timestamp | Defaults to current time |

## API

### Auth Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create a new account |
| `POST` | `/auth/login` | Login with email and password |
| `POST` | `/auth/refresh` | Refresh access and refresh tokens |
| `POST` | `/auth/logout` | Clear auth cookies |
| `GET` | `/auth/me` | Get the current authenticated user |

### Response Format

Successful responses:

```ts
{
  success: true,
  statusCode: number,
  message: string,
  data: T | null,
  errors: null,
  timestamp: string,
  path: string
}
```

Error responses use the same structure with `success: false`.

## Auth Flow

```txt
User submits form
  -> Next.js server action
  -> NestJS auth endpoint
  -> Backend sets HTTP-only cookies
  -> Next.js forwards Set-Cookie headers
  -> Middleware refreshes tokens when needed
  -> Authenticated UI receives current user data
```

Token lifetimes:

| Token | Storage | Lifetime |
| --- | --- | --- |
| `access_token` | HTTP-only cookie | 15 minutes |
| `refresh_token` | HTTP-only cookie | 7 days |

## Current Status

Implemented:

- Monorepo setup
- Shared UI package
- Shared validators package
- Public LMS landing page
- Email/password signup and login
- JWT cookie auth
- Refresh-token middleware
- Neon/PostgreSQL user persistence
- Normalized API responses

Recommended next steps:

- Move JWT secrets to environment variables
- Rename or map the API `_build` script
- Add dashboard, courses, lessons, enrollments, and instructor modules
- Replace placeholder mobile OTP and Google auth flows with real integrations
- Expand auth, API, and frontend tests
