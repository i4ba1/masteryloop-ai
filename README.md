# MasteryLoop AI

MasteryLoop AI is a focused Science homework platform for primary-school students, teachers, parents, and school administrators. It turns everyday homework into traceable concept-level learning evidence while keeping teacher authority, authorization, reproducibility, and safe failure at the centre.

The current release is the runnable foundation: authenticated role workspaces, organization-scoped Supabase RLS, class and roster administration, guardian links, cursor pagination, audited account administration, accessible UI states, Deno worker compatibility, and a recorded Playwright walkthrough. Homework authoring, asynchronous AI grading, teacher review, mastery calculations, and production operations are the next product slices.

## Demo Walkthrough

The inline preview below is an animated GIF because GitHub renders GIF images directly in repository READMEs. The full Playwright recording is a real H.264 MP4 download. GitHub can play videos uploaded as attachments, but a committed repository MP4 is not guaranteed to play inline in a README; the link below is the reliable repository experience. See [GitHub's media guidance](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files).

![MasteryLoop AI Demo Walkthrough](artifacts/demo-walkthrough/demo-walkthrough.gif)

[Download or open the full demo recording](artifacts/demo-walkthrough/demo-walkthrough.mp4)

<details>
<summary>Video player fallback</summary>

<video controls width="800" poster="artifacts/demo-walkthrough/demo-walkthrough.png">
  <source src="artifacts/demo-walkthrough/demo-walkthrough.mp4" type="video/mp4">
  Your browser can download the [MP4 walkthrough](artifacts/demo-walkthrough/demo-walkthrough.mp4).
</video>

</details>

The walkthrough covers the public landing page, teacher sign-in, the authorized teacher dashboard, class list, and class-management UI. Reproduce it with `pnpm record:demo`.

## Product description

MasteryLoop is designed for a school Science workflow rather than a general learning-management system:

1. A teacher creates a Science class and connects enrolled students.
2. A student works through published homework and submits typed answers.
3. Deterministic rules grade objective questions. An asynchronous worker will evaluate open-ended answers against immutable rubric versions.
4. Code validates model output, confidence, score arithmetic, criterion identity, and review flags.
5. Uncertain results go to a teacher. Only a published decision reaches students and linked parents.
6. Published outcomes become concept-level learning evidence for future mastery views.

The product separates internal grading diagnostics from student and parent feedback. Student text is treated as untrusted input, answer keys stay server-side, and service-role/provider credentials never enter browser bundles.

## Roles and access

| Role    | What the current foundation provides                                                                  |
| ------- | ----------------------------------------------------------------------------------------------------- |
| Student | Sign in, see the enrolled Science class, and receive only student-scoped data.                        |
| Parent  | See only actively linked children and no unrelated student records.                                   |
| Teacher | Create owned classes, manage active enrollment, and view assigned roster data.                        |
| Admin   | Manage school-scoped classes, guardian links, and audited account creation/edit/disable/reactivation. |

Every protected read is authorized in the application layer and enforced again by Supabase RLS. Roles come from active school profiles, not client-supplied metadata.

## User guide

### Start the local demo

Use the disposable local Supabase environment:

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm setup:local
pnpm seed:local
pnpm dev
```

Open <http://localhost:3000>. Local Supabase Studio is at <http://127.0.0.1:54323>.

All seeded accounts use the local-only password `MasteryLoop-local-2026!`:

| Account        | Email                       | Role    |
| -------------- | --------------------------- | ------- |
| Emma           | `emma@masteryloop.local`    | Student |
| Daniel         | `daniel@masteryloop.local`  | Student |
| Ms. Tan        | `teacher@masteryloop.local` | Teacher |
| Emma Parent    | `parent@masteryloop.local`  | Parent  |
| Platform Admin | `admin@masteryloop.local`   | Admin   |

The seed also includes unrelated students, staff, a parent, and another organization for negative authorization checks. These credentials are synthetic and must never be deployed publicly.

### Student

Sign in as Emma, review the connected class, and use the workspace navigation to return to the overview. Homework and grading screens will appear as those product slices are implemented.

### Parent

Sign in as Emma Parent. The workspace shows Emma because the school has an active guardian link. Daniel and unrelated students remain unavailable even when their identifiers are known.

### Teacher

Sign in as Ms. Tan. Use **Create a class** to create a Science class, then use the class and student identifiers in **Manage enrollment**. The class list and people directory use independent 20-item cursor pages.

### Admin

Sign in as Platform Admin. Use **Guardian access** to manage a parent-child link. Use **Create an account** to provision a school account with an initial password, then use the directory's **Edit** controls to change its role, display name, or active state. Account changes require a recent admin sign-in, a reason, and the expected profile version. Disabling a student or parent revokes active relationships and does not silently restore them on reactivation.

## Developer guide

### Prerequisites

- Node 22.22.3
- pnpm 10.28.1
- Docker Desktop
- Chromium for Playwright
- Deno 2.9.6 is installed through the pinned workspace dependency

### Useful commands

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm setup:local
pnpm seed:local
pnpm dev

pnpm format:check
pnpm lint
pnpm architecture
pnpm test
pnpm typecheck
pnpm test:rls
pnpm db:types:check
pnpm build
pnpm check:bundle
pnpm test:e2e
pnpm worker:check
pnpm worker:test
pnpm bootstrap:verify
pnpm record:demo
```

Run `pnpm db:reset` only against the disposable local database, then run `pnpm seed:local` again. `setup:local` writes ignored local configuration and does not print credentials.

### Architecture

The repository is a TypeScript pnpm workspace:

- `apps/web`: Next.js routes, Server Components, client forms, server actions, session extraction, and composition roots.
- `packages/domain`: framework-free identities, roles, ownership rules, state policies, and domain errors.
- `packages/application`: use cases, DTOs, ports, keyset pagination, account orchestration, and authorization decisions.
- `packages/infrastructure`: Supabase repositories, row mappers, Auth provisioning, error translation, and generated database types.
- `packages/contracts`: browser-safe Zod schemas and action contracts.
- `packages/ui`: accessible shared presentation primitives.
- `supabase/migrations`: schema, RLS, RPCs, audit records, provisioning, queues, and operational configuration.
- `supabase/functions`: Deno-safe worker composition and the authenticated foundation health endpoint.
- `tests`: unit, SQL/RLS, browser, and evaluation fixtures.
- `scripts`: local setup, seeding, architecture checks, bundle checks, worker graph checks, recording, and bootstrap verification.

Dependency direction is inward: transport/composition calls application, application calls domain and ports, and infrastructure implements ports. Domain/application tests do not import Next.js, React, Supabase, OpenAI, or a live database.

### Configuration and security

`.env.example` documents configuration names only. Browser configuration contains the Supabase URL and publishable key. The Supabase service-role key is server-only and is used only by the authorized account provisioning adapter. Worker trigger credentials live in `supabase/.env.local`. Never prefix server secrets with `NEXT_PUBLIC_`, commit local environment files, or log passwords, student answers, or provider payloads.

### End-to-end testing and recording

The normal Playwright suite runs desktop and mobile Chromium headlessly. The dedicated walkthrough uses visible Chromium and enables video capture:

```sh
pnpm exec playwright install chromium
pnpm record:demo
```

The command runs `tests/e2e/demo-walkthrough.spec.ts`, saves screenshots under `artifacts/demo-walkthrough/`, converts the Playwright WebM to `demo-walkthrough.mp4` with the pinned local encoder, and leaves the GIF preview used above. Full details are in [docs/testing/playwright-e2e.md](docs/testing/playwright-e2e.md).

### Database and authorization verification

Run `pnpm test:rls` against a running seeded local Supabase stack. The SQL suite covers student, parent, teacher, admin, cross-organization, disabled-account, guardian-revocation, recent-admin, provisioning, stale-version, and direct-write denial cases. Regenerate types after migrations with `pnpm db:types` and keep `pnpm db:types:check` green.

### Bootstrap verification

`pnpm bootstrap:verify` copies the source into an isolated directory, performs a frozen install, starts a separate Supabase project on dedicated ports, resets and seeds it, runs RLS and Deno checks, verifies worker authentication, and runs the four-role browser smoke. The latest measured result is recorded in [docs/verification/bootstrap.json](docs/verification/bootstrap.json): 205 seconds excluding dependency downloads, with all steps passing.

## Project status and roadmap

Implemented foundation work includes authentication, role routing, RLS, class and roster administration, guardian links, cursor pagination, audited account administration, accessible loading/error/empty states, architecture enforcement, Deno compatibility, and isolated bootstrap verification.

The next product slices are:

- Curriculum, immutable rubric versions, assignment authoring, drafts, and submissions.
- Deterministic MCQ grading and durable asynchronous grading jobs.
- Provider-neutral AI grading with strict result validation and bounded retries.
- Teacher review, publication boundaries, revision requests, and parent feedback.
- Concept-level mastery evidence, recommendations, class insights, telemetry, evaluation, and production recovery runbooks.

See [TODO.md](TODO.md), [docs/architecture/README.md](docs/architecture/README.md), [ADR-001](docs/adr/ADR-001-foundation.md), and [ADR-002](docs/adr/ADR-002-foundation-completion.md) for implementation decisions and remaining acceptance work.
