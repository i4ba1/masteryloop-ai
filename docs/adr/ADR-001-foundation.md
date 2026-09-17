# ADR-001: Foundation runtime and identity boundaries

Status: Accepted for the initial implementation, 15 September 2026.

Use the PRD v1.1 modular monolith: Next.js hosts UI and transport/composition; pure TypeScript domain/application packages own policy and orchestration; Supabase adapters own persistence. A separate Deno worker will reuse inward packages when grading is implemented. No standalone API service or global client-state library is introduced.

The initial product uses one school organization and one role per account. Every scoped table still carries organization_id, and a second synthetic organization proves admin boundaries. Roles come from active database profiles, not mutable user metadata. Accounts are provisioned by operators; open signup is disabled. Parents gain access only through active admin-managed guardian links. Teachers can create classes they own and manage enrollment by student ID within their school; they cannot browse students outside their assigned classes. Admins can choose teachers and guardian relationships.

Web requests use the session-scoped Supabase client and publishable/anon key. There is no service-role credential in the web configuration. Privileged roster mutations are narrowly granted SQL functions that derive auth.uid(), recheck scope, and commit changes with audit evidence. Application authorization is independent defense in depth.

Pinned baseline: Node 22.22.3, pnpm 10.28.1, Next.js 16.3.5, React 19.3.0, Supabase CLI 2.117.0. Framework and Supabase versions were verified against the package registry. TypeScript 5.9.3 is pinned for compatibility. The lockfile is authoritative for transitive versions.

This milestone does not claim production readiness: staff account provisioning/role management UI, recent-auth checks, the full grading worker, comprehensive operational tracing, pagination beyond the bounded initial directory, deployment promotion, and recovery rehearsal remain tracked work.
