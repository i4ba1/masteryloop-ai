# Architecture boundaries

Dependency direction: transport/composition -> application -> domain. Infrastructure implements application ports. Domain imports only its own TypeScript; application imports domain and its own use-case/port types. Shared Zod contracts validate untrusted inputs outside domain logic. Database-generated types stay in infrastructure.

`packages/domain/src/identity` contains actor and class-management policy. `packages/application/src/identity` exposes roster use cases and repository ports. `packages/infrastructure/src/db` maps Supabase rows and errors. `apps/web/src/server` handles session extraction, composition, and safe transport errors. Feature UI and server actions live together under `apps/web/src/features`; only public feature entrypoints cross feature boundaries.

App routes compose the dashboard. Server Components load session-scoped DTOs; Client Components hold form state and invoke server actions. They do not access the database or receive service-role credentials. Browser auth/session refresh is handled by the Next proxy and server client.

`pnpm architecture` scans TypeScript imports/exports/dynamic imports and dependency cycles. `pnpm lint` also blocks inward framework/vendor imports. The architecture test includes an intentionally forbidden Supabase domain import; it is never included in production code. The Next server-only build guard and client bundle check provide additional browser-boundary enforcement.

The SQL migration enforces RLS for all eight public tables, denies direct authenticated writes, and grants only scoped roster RPCs. Database RLS tests exercise the real authenticated role, including old JWTs after disabling an account or revoking a guardian link.

## Client/server import enforcement

The architecture gate follows runtime dependencies from every module with a `"use client"` directive, including re-export barrels and literal dynamic imports. It rejects reachable imports of `server-only`, `next/headers`, `next/server`, and `node:*`, reporting the dependency chain. Explicit type-only imports/exports are erased and do not enter this graph. General layer checks still inspect type dependencies.

A module-level `"use server"` directive terminates browser traversal because Next.js exposes those exports as server-action references. This permits the existing interactive roster forms to call server actions. The Next.js build remains responsible for validating server-action exports. Mark secret-bearing server adapters with `import "server-only"`.

This is a source-module check, not a bundled third-party dependency audit: it scans workspace TypeScript and resolves local aliases/package exports. Computed dynamic imports and dependencies inside third-party packages require the production build and bundle checks as additional gates. Regression tests exercise invalid and valid import fixtures, cycle termination, and the actual workspace graph.
