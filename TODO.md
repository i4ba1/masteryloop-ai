# MasteryLoop AI - Implementation To-Do

Source: `MasteryLoop_AI_Technical_PRD_v1.1.pdf`, version 1.1, 14 September 2026, 47 pages.

Updated: 17 September 2026. The workspace now contains a Next.js/pnpm foundation, shared packages, Supabase authentication and roster migration/RLS tests, synthetic seed tooling, role dashboards, and CI. The original checklist was not updated alongside that implementation. Unchecked items may therefore be partially implemented; they remain open until their full acceptance criteria have recorded verification.

### Latest development evidence (17 September 2026)

- AI grading foundation started: added rubric-bound domain validation and conservative review routing, a provider-neutral application port/use case, strict output contract, and an OpenAI Responses API adapter using schema-constrained JSON and non-stored responses. Automated unit tests cover score/evidence validation, review triggers, and mocked provider behavior. Durable homework persistence, queue/worker execution, teacher review actions, and publication are still open; the AI adapter is not connected to student workflows yet.

- W1-06/W1-07/W1-16/W1-17: keyset pagination, account administration, Deno compatibility, and bootstrap verification are implemented and evidenced below.
- W1-13: added transitive client-to-server import detection to the existing architecture gate. It follows runtime imports and re-exports, rejects server-only markers and server runtime imports, ignores erased type references, and respects module-level server-action boundaries. Regression fixtures cover prohibited imports, valid inward dependencies, server actions, cycles, and the current workspace.
- Verified locally: `pnpm test` (22 tests), `pnpm architecture`, `pnpm lint`, and `pnpm typecheck` (all six packages) pass. This records local verification, not a hosted CI run.
- Existing foundation observed in source: D-02 is documented in `docs/adr/ADR-001-foundation.md`; W1-01 through W1-05, W1-08 through W1-12, W1-14, and W1-15 still have implementation artifacts requiring their full acceptance evidence.
- Completed in this continuation: keyset roster pagination, audited Admin account creation/edit/disable/reactivation, Deno shared-package compatibility, and measured isolated bootstrap verification. Remaining foundation follow-up: dependency audit, full repository formatting baseline, and broader account-management UI polish. Production build, bundle checks, lint, typecheck, database type freshness, and targeted browser checks pass. Homework authoring and AI grading remain subsequent slices.

Revision basis: v1.1 adds NFR-016 through NFR-021 and AC-13 through AC-17 without removing existing requirement IDs. Existing build-task IDs are preserved. The v1.1 document-control page is authoritative; its cover still says v1.0. Page references below refer to the PDF's physical page numbers because some inserted section headings reuse numbering.

## 1. Product understanding and priorities

Build a focused Science homework platform, not a general LMS. Students submit typed answers; deterministic rules grade MCQs and an asynchronous worker evaluates open-ended answers against immutable rubrics. Code validates model results and decides whether a teacher must review them. Only published decisions reach students and parents. Published outcomes become traceable concept-level learning evidence.

Teacher authority, authorization, reproducibility, and safe failure are the core product requirements. A successful demo must show both successful automation and a teacher correcting an uncertain result.

Priority labels:

- **P0:** Required core MVP functionality, using the PRD's functional priorities.
- **Release gate:** Required acceptance, security, reliability, or quality work regardless of functional priority.
- **P1:** Additional functionality after the core is stable.
- **P2:** Deferred future scope.

The PRD labels game telemetry and offline evaluation P1, but AC-07 and AC-08 explicitly require them. This checklist treats minimal authenticated telemetry, deduplication, a small simulator, and an offline benchmark runner as release gates. Rich simulator features and an evaluation UI remain optional. Recommendations and class insights remain P1.

The six-week sequence is the PRD's suggested solo roadmap, not an effort estimate or delivery commitment. Build tests, authorization, and instrumentation with each feature; week 6 consolidates and verifies them.

## 2. Resolve implementation decisions first

These are gaps or ambiguities in the PRD, not additional requirements already settled by it. Record decisions before implementing the affected feature; material scope or architecture changes require an ADR and PRD revision.

- [ ] **D-01 - Verify toolchain:** Confirm available, compatible, patched releases before pinning the stated Next.js 16.3.x / React 19.3 / TypeScript / Tailwind 4 baseline. Use the v1.1 pnpm workspace; pin pnpm and supported Node/Deno/Supabase CLI versions. Verify Corepack availability and document installation if required. The version claims in the PDF have not been independently verified.
- [ ] **D-02 - Identity and organization boundaries:** Decide single-organization versus multiple organizations, how admin scope is represented, whether a user may hold multiple roles, onboarding method, and who may assign roles and guardian links. Default guardian-link administration to Admin; the appendix leaves Teacher permission ambiguous.
- [ ] **D-03 - Submission rules:** Specify attempt limits, late submissions, due-date/timezone behavior, answer size limits, draft conflict handling, and how teacher-requested revisions create subsequent attempts. Define invalidation's terminal state and whether a published grade can be invalidated.
- [ ] **D-04 - Review and publication:** Specify the override-reason delta threshold, recent-session requirement, concurrent reviewer conflict behavior, and whether parent-visible auto-published feedback satisfies the phrase "teacher-approved feedback." The journeys allow auto-publication but also use that phrase for parents.
- [ ] **D-05 - Worker operation:** Use the v1.1 database webhook on grading_jobs insertion plus a Supabase Cron recovery sweep. Specify trigger authentication, sweep interval, queue visibility timeout, bounded batch size, provider timeout, retry count/backoff, manual retry semantics, and concurrency within actual Edge Function/provider limits. Preserve the PRD's one retry for likely transient schema/arithmetic failures; triggers only wake the durable queue consumer.
- [ ] **D-06 - Mastery details:** Define qualityFactor, concept/criterion attribution, trend and confidence bands, supersession links, game attempt adjustment/window/cap, and snapshot freshness. Define the deterministic calculation time and empty-evidence behavior.
- [ ] **D-07 - Optional recommendations:** Define "recent" evidence, teacher-note storage and suppression expiry, practice content mapping, and ranking tie-breaks before implementing FR-035.
- [ ] **D-08 - Operational configuration:** Select an approved model and pricing source, budgets/quotas, rate limits, telemetry authentication and clock-skew tolerance, evaluation regression tolerances, alert destinations, release observation window, and environment/recovery ownership. Verify preview branching and backup retention against the chosen platform tier; use the documented nonproduction preview and encrypted-backup fallbacks when needed. Keep every chosen value versioned or documented.

## 3. Sequenced build checklist

### Week 1 - Foundation, identity, and data boundaries

Dependencies: D-01 and D-02. References: FR-001-004, FR-029; NFR-007-011, NFR-013, NFR-016, NFR-017, NFR-019, NFR-020; SEC-001-006; AC-13, AC-14; PRD pp. 17-19, 30-35.

- [ ] **W1-01 [P0] Scaffold the workspace:** Initialize Git and the Next.js/TypeScript pnpm monorepo using section 7's v1.1 structure: web, domain, application, infrastructure, contracts, UI, Supabase, tests, scripts, and docs. Add pnpm-workspace.yaml, a pinned packageManager, committed lockfile, tsconfig.base.json, and independent package typechecks.
- [ ] **W1-02 [P0] Configure environments:** Set up local Supabase, validated environment configuration, a secret-free example environment file, and server-only boundaries for service-role and provider credentials. Document local startup.
- [ ] **W1-03 [P0] Establish database foundations:** Add migrations for profiles, students, classes, memberships, and guardian links; enforce keys, active relationships, and scoped access. Add domain tables incrementally in subsequent slices.
- [ ] **W1-04 [P0] Implement authentication and RBAC:** Support Student, Parent, Teacher, and Admin sessions with server-derived identity; isolate SYSTEM_WORKER credentials from interactive login. Include sign-out, expired-session behavior, and protected navigation.
- [ ] **W1-05 [P0] Implement app authorization and RLS together:** Students access their own enrolled work; parents access active linked children; teachers access assigned classes; admins remain within defined scope. Prevent client-supplied role escalation and resource enumeration.
- [x] **W1-06 [P0] Build roster administration:** Allow authorized Teacher/Admin class creation and active membership management; provide Admin user/role and guardian-link management under D-02.
- [x] **W1-07 [P0] Establish audit and API foundations:** Add append-only audit records, request IDs, boundary validation, stable error envelopes, and cursor-pagination helpers. Audit sensitive administration from the first implementation.
- [ ] **W1-08 [Release gate] Seed synthetic personas:** Emma, Daniel, Ms. Tan, Emma Parent, and Platform Admin; P5 Science concepts and class. Add unrelated class/student/guardian fixtures for negative authorization tests.
- [ ] **W1-09 [Release gate] Set up quality checks:** Vitest, Testing Library, database/RLS integration harness, Playwright skeleton, lint, typecheck, dependency audit, secret scanning, and clean migration validation in CI.
- [ ] **W1-10 [Release gate] Establish accessible UI primitives:** Semantic forms, keyboard access, visible focus, error association, contrast, and loading/empty/error/success states targeting WCAG 2.2 AA.
- [ ] **W1-11 [P0] Establish backend clean boundaries:** Create domain modules, application use cases/ports/DTOs, infrastructure adapters/mappers, and small explicit web/worker composition roots. Enforce the ownership and dependency rules in section 7; keep business policies and SQL out of transport handlers.
- [ ] **W1-12 [P0] Establish frontend feature boundaries:** Add role route groups, features with ui/model/server/validation/tests, reusable presentation entities, and shared primitives. Use server-only feature adapters and safe DTOs; require public feature entrypoints, Server Components by default, and local/form/URL state.
- [x] **W1-13 [Release gate] Enforce architecture in CI:** Add ESLint import boundaries and a circular-dependency scan before tests/build. Reject framework/vendor imports into domain/application, cross-feature deep imports, and client imports of server-only modules. Use an intentional invalid-import fixture to prove the checker fails (AC-13); verify valid inward imports pass.
- [ ] **W1-14 [Release gate] Enforce clean-code standards:** Configure the TypeScript, formatting, error-handling, React, logging, and review standards in section 7. Check generated database/client types for drift and keep public contracts separate from database row types.
- [ ] **W1-15 [Release gate] Validate configuration by runtime:** Maintain typed public, web-server, Edge Function, and CI configuration boundaries with startup/build validation. Document keys in .env.example without secrets; add safe missing/invalid-value failures and client-bundle checks. Register audited, reversible feature/policy configuration separately from deployment secrets.
- [x] **W1-16 [Release gate] Automate clean-clone bootstrap:** Implement/document section 8's shared local/CI scripts, pinned prerequisites, local auth/seed provisioning, and worker setup. Verify four seeded role dashboards within 30 minutes excluding initial dependency downloads (AC-14); record actual timing. Keep resets scoped to disposable local/test databases.
- [x] **W1-17 [Release gate] Verify web/worker package compatibility:** Make domain/application/contracts importable and typecheckable from both Next.js and Deno; provide worker deno.json and Deno-safe bootstrap/composition helpers. Ensure worker builds do not pull React, Next.js, browser-only, or unsupported Node dependencies transitively.

Checkpoint: A clean clone boots through documented commands within the measured setup target; all four interactive roles can log in; Teacher/Admin can create a class; app checks and RLS independently reject cross-student, unrelated-parent, and out-of-class teacher access. Architecture checks pass and reject the intentional violation fixture.

### Week 2 - Curriculum, rubrics, homework, and submission

Dependencies: Week 1 and D-03. References: FR-005-012, FR-022; NFR-005, NFR-013; PRD sections 04, 07, 09, 10.

- [ ] **W2-01 [P0] Add curriculum and rubric persistence:** Concepts, question-concept mappings, rubric identities, immutable versions, criteria, point values, required concepts, and version status.
- [ ] **W2-02 [P0] Build rubric editing/versioning:** Editing a referenced published rubric creates a new version; reject mutation of existing published versions at the database boundary.
- [ ] **W2-03 [P0] Build assignment authoring:** Draft/published/closed lifecycle, due dates, question ordering, MCQ/SHORT_TEXT/LONG_TEXT, class assignment, and publication validation. Require concepts for every gradeable question and consistent rubric/question/assignment point totals.
- [ ] **W2-04 [P0] Build student homework screens:** Enrolled assignment list/detail, due time, answer forms, autosave, draft restoration, completion status, and clear submission confirmation.
- [ ] **W2-05 [P0] Implement submission contract:** Validate identity, enrollment, assignment window, answer type/size, and attempt eligibility; snapshot question/rubric/concept references sufficient to reproduce grading.
- [ ] **W2-06 [P0] Enforce submission idempotency:** Protect against repeated requests and concurrent retries with database constraints and transactional behavior. Define rejection of reused keys with conflicting payloads; do not create duplicate attempts or grading work.
- [ ] **W2-07 [P0] Implement deterministic MCQ grading:** Use server-side answer keys and rubric rules; persist outcome provenance and use the shared publication boundary. Keep answer keys out of pre-submission student payloads.
- [ ] **W2-08 [P0] Persist the submission state machine:** DRAFT, SUBMITTED, GRADING_QUEUED, GRADING_IN_PROGRESS, REVIEW_REQUIRED, PUBLISHED, GRADING_FAILED, REVISION_REQUESTED, and RESUBMITTED, plus the invalidation decision from D-03. Validate allowed transitions.
- [ ] **W2-09 [P0] Build published-result projections:** Separate student/parent feedback from internal grading diagnostics; enforce filtering in queries and responses, not only in UI components.
- [ ] **W2-10 [Release gate] Verify authoring/submission:** Cover immutable rubric edits, missing concepts, inconsistent points, closed windows, unauthorized questions, draft restore, duplicate/concurrent submits, attempt limits, and deterministic MCQ scores.

Checkpoint: A student completes an assignment with durable drafts/submissions; MCQ grading is reproducible; subsequent rubric edits do not change the submitted attempt's grading inputs.

### Week 3 - Durable asynchronous AI grading

Dependencies: Week 2 and D-05/D-08. References: FR-013-018, FR-030; AI-001-008; NFR-003-006, NFR-010-014; OBS-001-003.

- [ ] **W3-01 [P0] Add durable queue and job records:** Use Supabase Queues/pgmq with operational grading-job metadata. Implement a UnitOfWork port backed by a Postgres function/transaction committing submission, idempotency metadata, job mirror row, and queue send together. If a proven platform constraint prevents this, document an ADR and durable outbox/repair alternative before changing the transactional design.
- [ ] **W3-02 [P0] Implement the Edge Function worker:** Authenticate invocation, claim jobs safely, persist progress, apply provider timeouts, and acknowledge only after durable processing. Handle duplicate delivery and worker crashes without duplicate logical results or publication.
- [ ] **W3-03 [P0] Add provider-neutral AI adapter:** Declare AiGraderPort in application and implement the OpenAI Responses API adapter/schema mapper in infrastructure/ai/openai. Keep versioned provider prompt templates with the adapter, browser-safe schemas in contracts, and grading policy in domain. Include deterministic test adapters and stable application error classifications.
- [ ] **W3-04 [P0] Implement versioned prompt inputs:** Exact question, student answer, rubric criteria/max score, concept context, and permitted feedback style. Delimit student text as untrusted data; award no criterion without evidence; give the model no tools or database access.
- [ ] **W3-05 [P0] Implement strict GradingResult validation:** JSON Schema/Zod contract for schemaVersion, score, maxScore, confidence, criteria, misconceptions, studentFeedback, and reviewFlags. Validate rubric criterion identities/completeness, point bounds, required fields, and score arithmetic independently of model assertions.
- [ ] **W3-06 [P0] Persist immutable grading runs:** Submission and rubric references, prompt/policy versions, provider/model, configuration hash, structured result, confidence, latency, token usage where available, and estimated cost. Store concise review evidence; never hidden chain-of-thought.
- [ ] **W3-07 [P0] Implement bounded retry/recovery:** Exponential backoff for transient faults; safe handling of timeouts, rate limits, malformed output, and permanent failures. Expose exhausted jobs and audited manual retry; preserve prior runs during regrades.
- [ ] **W3-08 [P0] Build grading status and operations screens:** Student sees durable queued/in-progress/delayed status and can navigate away; authorized operators inspect retries, age, latency, and failure reasons.
- [ ] **W3-09 [Release gate] Correlate the pipeline:** Propagate requestId, traceId where supported, submissionId, gradingJobId, and gradingRunId through web, queue, worker, and provider records; redact sensitive payloads.
- [ ] **W3-10 [Release gate] Verify worker failures:** Mock provider success, schema/arithmetic failure, timeout, rate limit, crash/restart, duplicate delivery, exhausted retries, and manual recovery. Confirm provider failure never loses the submission.
- [ ] **W3-11 [P0] Implement fast and recovery triggers:** Add version-controlled database webhook configuration for grading_jobs inserts and Supabase Cron recovery invocation, with environment-specific URLs/auth supplied securely. Authenticate both wake-up paths; consume queue messages rather than trusting webhook payloads as grading work.
- [ ] **W3-12 [P0] Implement bounded, overlap-safe consumption:** Apply D-05's batch/concurrency/timeout budgets; align visibility timeout with processing behavior and handle visibility expiry safely. Archive/delete successful messages only after durable processing; retain retriable work and expose exhausted/poison jobs operationally.
- [ ] **W3-13 [Release gate] Test trigger loss and consumer overlap:** Suppress a webhook and verify Cron recovers the queued job; invoke webhook/Cron concurrently; interrupt processing and redeliver. Assert durable recovery without duplicate published grades or learning events. Verify invalid trigger credentials are rejected and triggers can be limited/paused without deleting jobs.

Checkpoint: An open-ended answer returns durable asynchronous status, produces a validated persisted run or a visible recoverable failure, and can be traced by IDs. Keep AI results unpublished until Week 4 policy is implemented.

### Week 4 - Teacher review, publication, and audit

Dependencies: Week 3 and D-04. References: FR-016, FR-019-022, FR-029; AI-007, AI-009; NFR-006, NFR-009; OBS-004.

- [ ] **W4-01 [P0] Implement a versioned policy service:** Treat model confidence as one signal, not a calibrated probability. Load approved model/prompt configuration and deterministic review triggers from controlled server-side settings.
- [ ] **W4-02 [P0] Encode PRD defaults:** Confidence below 0.80 requires review; long-form zero/full scores require review until benchmark evidence permits automation; empty criterion evidence, safety/content flags, and regrade delta above one point require review; unapproved providers/models cannot publish. Invalid schema/arithmetic goes through failure handling, not ordinary approval.
- [ ] **W4-03 [P0] Build the prioritized review queue:** Authorized classes only, cursor pagination, filters for class/assignment/trigger/confidence band, and queue-age visibility.
- [ ] **W4-04 [P0] Build review detail and actions:** Show answer, rubric, criterion evidence, suggested score, and staff-only confidence/flags; support Approve, Override, Request Revision, and Mark Invalid with validated transitions and accessible confirmations.
- [ ] **W4-05 [P0] Preserve review evidence:** Append decision records with original/new score, reason, actor, timestamp, and source run. Enforce the configured override-reason threshold and guard against stale/concurrent decisions.
- [ ] **W4-06 [P0] Implement the shared publication transaction:** AUTO_ACCEPTED_RUN, TEACHER_APPROVED_RUN, or TEACHER_OVERRIDE becomes the current published decision without mutating historical runs/reviews. Atomically publish and write mastery evidence, or persist repairable work for Week 5 processing.
- [ ] **W4-07 [P0] Complete revision/invalidation behavior:** Apply D-03's attempt and visibility policy; preserve history; ensure invalid or superseded outcomes do not remain active mastery evidence.
- [ ] **W4-08 [P0] Build grade history and audit access:** Teachers see their authorized grading history/own grading audit actions; admins inspect scoped audit events. Prevent modification/deletion through ordinary application roles.
- [ ] **W4-09 [Release gate] Verify trust controls:** Boundary-test confidence 0.80 and regrade delta one point, all mandatory review triggers, unauthenticated/unauthorized review, required reasons, concurrent reviews, and absence of unpublished grades/diagnostics in student and parent responses.

Checkpoint: A seeded uncertain answer enters review; teacher approval/override changes the published outcome with immutable evidence; Student/Parent cannot see it as a final grade before publication.

### Week 5 - Mastery, parent insight, and minimal telemetry

Dependencies: Week 4 and D-06; D-07 for recommendations. References: FR-023-028, FR-035; NFR-005-006; OBS-005; PRD sections 12-13.

- [ ] **W5-01 [P0] Implement the append-only learning ledger:** Record student, concept, source type/ID, event type, normalized value, weight, metadata, and timestamps. Ensure repeated publication/processing cannot create duplicate evidence.
- [ ] **W5-02 [P0] Implement deterministic mastery:** `evidenceWeight = sourceWeight * exp(-daysAgo / 45) * qualityFactor`; `mastery = 100 * sum(value * evidenceWeight) / sum(evidenceWeight)`. Apply D-06's explicit calculation-time and no-evidence rules.
- [ ] **W5-03 [P0] Implement source weights and supersession:** HOMEWORK_CRITERION 1.0, TEACHER_OVERRIDE 1.25, QUIZ_ITEM 1.0, GAME_QUESTION 0.5, REVISION_COMPLETED 0.8. Teacher corrections replace superseded educational value without deleting historical events or double-counting it. Supporting QUIZ_ITEM does not require a separate quiz product.
- [ ] **W5-04 [P0] Materialize mastery snapshots:** Score, evidence count, confidence band, trend, last evidence time, and computed time. Require at least three evidence items before a strong confidence label; implement replay/rebuild and stale/missing projection repair.
- [ ] **W5-05 [P0] Build student progress and parent views:** Linked-child selection, homework completion, recent published scores/feedback, plain-language concept progress/trends, and evidence context. Enforce guardian authorization for every child query.
- [ ] **W5-06 [Release gate; FR-027-028 are P1] Implement authenticated telemetry ingestion:** Versioned batch contract; at most 100 events/request; validate source authorization, student, event type, conditional correctness, positive attempt, duration, and timestamp skew. Map to active concepts or quarantine without affecting mastery.
- [ ] **W5-07 [Release gate] Enforce telemetry deduplication and weighting:** Unique `(source, externalEventId)`, retry-safe evidence creation, adjusted attempt weights, and capped repeated-game contribution under D-06. Game clients never write mastery tables directly.
- [ ] **W5-08 [Release gate] Add a minimal simulator:** Send two known-concept events for Emma and replay one duplicate; show exactly which evidence was accepted and how mastery changes. A CLI/script is sufficient; a rich game UI is optional.
- [ ] **W5-09 [P1] Build teacher class insights:** Concept distribution/heatmap and students needing attention, restricted to assigned classes.
- [ ] **W5-10 [P1] Implement explainable recommendations:** At least two recent evidence items, mastery below 70 by default, teacher-note suppression/not-yet-taught exclusion, ranking by weakest mastery/negative trend/overdue relevance, and at most three practice links with plain-language reasons.
- [ ] **W5-11 [Release gate] Verify learning consistency:** Fixed-clock calculations, fewer than three evidence items, no evidence, override/revision supersession, replay parity, duplicate publication and telemetry, invalid concept quarantine, repeat-game caps, and unrelated-parent denial. Test recommendation ordering/suppression if included.

Checkpoint: Published homework updates reproducible mastery; teacher correction changes the active evidence once; parent sees only linked-child progress; duplicate game events have no additional effect.

### Week 6 - Evaluation, reliability, deployment, and portfolio evidence

Dependencies: Earlier checkpoints and D-08. References: FR-033-034; AI-009-010; NFR-001-021; SEC-001-008; OBS-001-006; AC-01-17.

- [ ] **W6-01 [Release gate; FR-033-034 are P1] Curate at least 100 benchmark cases:** Synthetic/anonymized correct, partial, misconception, irrelevant, ambiguous, adversarial, and disagreement examples with expected criterion awards, total score, and review-needed label.
- [ ] **W6-02 [Release gate] Build the offline evaluation runner:** Select model/prompt/rubric/policy configuration; persist evaluationRunId and configuration provenance; report exact/within-one agreement, MAE, criterion F1 where meaningful, review precision/recall, latency, tokens, and estimated cost. An evaluation UI is optional.
- [ ] **W6-03 [Release gate] Gate model/prompt promotion:** Compare against the fixed benchmark and critical subsets using D-08 tolerances; investigate schema/guardrail failures and block material regressions. Attach comparisons to relevant PRs; do not send teacher overrides for automatic external training.
- [ ] **W6-04 [Release gate] Complete operational dashboards:** Request success/latency; queue depth/age/throughput/retries/failures; provider schema/errors/cost; review age/decisions/delta/time; mastery failures/staleness/rebuild time; denied access/auth/rate limits/admin changes.
- [ ] **W6-05 [Release gate] Configure alerts:** Oldest queue age warning above 2 minutes and critical above 10 minutes; schema failure rate above 1% over 30 minutes; review P95 age above the demo 24-hour threshold. Include provider quota/budget and worker-health monitoring with owners/runbooks.
- [ ] **W6-06 [Release gate] Harden security and privacy:** TLS/secure sessions, recent authentication for high-impact staff actions, limits on login/submission/telemetry/review/evaluations, secret scanning and browser-bundle inspection, redacted logs, least-privilege worker access, and prompt-injection tests. Actual MFA is stretch scope.
- [ ] **W6-07 [Release gate] Document data lifecycle:** Synthetic-only demo data; submission/structured-output retention for showcase lifetime, audit retention target at least 12 months, and operational logs 30-90 days. Design controlled export/deletion/anonymization before accepting real child data; document the additional privacy/legal work needed for such deployment.
- [ ] **W6-08 [Release gate] Verify performance:** Measure non-AI API P95 below 500 ms, grading median below 15 seconds and 95% of successful jobs within 30 seconds, and grading success at least 99% under documented conditions. Use the PRD's sizing assumptions to shape load tests; distinguish targets from measured results.
- [ ] **W6-09 [Release gate] Tune measured database bottlenecks:** Foreign-key/common-filter indexes, partial indexes for active review/failed jobs, bounded cursor pagination, and published-grade/mastery projections. Inspect query plans before introducing caches.
- [ ] **W6-10 [Release gate] Complete critical automated journeys:** Run the acceptance matrix below, worker integration tests, and RLS matrix in CI. Include provider failure, unauthorized direct access, replay/concurrency, accessible primary forms, and model regression scenarios.
- [ ] **W6-11 [Release gate] Establish deployment environments:** Implement section 8's Local, Preview, Staging, and Production demo topology, with synthetic data and separated secrets. Prefer isolated Supabase preview branches when available; otherwise use a dedicated nonproduction backend with serialized schema changes and isolated test fixtures. Configure auth callback/site URLs for each environment and ensure previews cannot reach production data/worker credentials.
- [ ] **W6-12 [Release gate] Rehearse release and recovery:** Execute section 8's exact staging/production sequence and incident paths; capture smoke, web/worker rollback, AI kill-switch, durable queue recovery, and isolated backup restoration evidence. Use forward-fix migrations for ordinary schema regressions; reserve database restoration for incident recovery.
- [ ] **W6-13 [Release gate] Write operating documentation and ADRs:** Queue/manual-retry, outage, stale-mastery repair, restore, rollback, secret rotation, and model-promotion runbooks. Document ADR-001-008: monolith, pgmq, structured output, teacher review, immutable versions/runs, event-ledger mastery, RLS plus app checks, and no Redis. Also explain provider adapter and mastery algorithm tradeoffs.
- [ ] **W6-14 [Release gate] Package the portfolio:** README with architecture diagram, setup/test commands, seeded access, screenshots, benchmark results, security notes, tradeoffs, known limitations, demo URL, CI evidence, sample trace, and failed-job recovery screenshot. Record the PRD's 7-10 minute walkthrough.
- [ ] **W6-15 [Release gate] Complete deployment pipelines:** Implement validate, database verification, web/worker build, preview, preview E2E, AI regression, staging, protected production release, and scheduled-security workflows per section 8. Run clean-clone scripts in CI; record immutable build/source versions and prevent lockfile changes during deployment.
- [ ] **W6-16 [Release gate] Enforce expand-and-contract migrations:** Test empty and representative prior schemas; add first, deploy compatible code, backfill/verify, then tighten/remove only in a later release. Make large backfills resumable/idempotent, test RLS changes negatively, and prohibit untracked remote schema edits outside documented incident response.
- [ ] **W6-17 [Release gate] Rehearse compatible promotion:** Apply additive schema/RLS/queue/trigger migrations, deploy worker compatible with old/new application payloads, then promote web. Execute role/worker/parent/negative-auth smoke, watch release metrics, and enable risky AI policy last through audited configuration. Record all release versions and obtain the protected production-environment approval (AC-15).
- [ ] **W6-18 [Release gate] Implement and verify kill switches:** Provide authorized audited controls for auto-publish disablement, previous model/prompt/policy pinning, and worker consumption pause/limit. Restore known-good web/worker versions, resume queued work, and prove no duplicate publication/evidence after recovery (AC-16). Preserve original runs during explicitly scoped regrades.
- [ ] **W6-19 [Release gate] Implement and rehearse backups:** Verify managed daily backups/retention and PITR if enabled; otherwise schedule encrypted off-site logical dumps and test restore completeness. Restore into an isolated environment, reconcile migrations, run smoke, and record actual recovery point and duration against RPO <= 24 h / RTO <= 4 h (AC-17). Add separate Storage backup coverage before accepting uploads; database backups do not cover Storage objects.
- [ ] **W6-20 [Release gate] Complete deployment evidence:** Finish the six named runbooks in section 8 with owners, commands, rollback links, and incident checks. Capture architecture/clean-clone results, deploy and rollback evidence, backup/restore outcome, release annotation, and a traceable synthetic smoke journey. Verify healthy backups and no active queue/error incident before release completion.

Checkpoint: AC-01 through AC-17 pass with reproducible evidence; the deployed demo is recoverable, observable, and documented. Measure availability toward the 99.9% monthly target rather than claiming it from a one-time smoke test.

## 4. Public contracts and domain invariants to implement

Use typed server actions for suitable browser mutations and versioned REST contracts for the PRD endpoints. JSON uses camelCase; database columns may use snake_case. Never expose stack traces or secrets. Authorize before disclosing existence where enumeration is a risk.

| Method and path                         | Required behavior                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/submissions`              | Student submits one question/attempt with Idempotency-Key; async case returns 202 with submissionId, durable status, submittedAt. |
| `GET /api/v1/submissions/{id}`          | Authorized submission/status read; filter internal fields by role.                                                                |
| `POST /api/v1/grading-runs/{id}/review` | Authorized review decision; enforce score/reason/transition rules and preserve immutable evidence.                                |
| `GET /api/v1/review-queue`              | Authorized class filters and cursor pagination.                                                                                   |
| `GET /api/v1/students/{id}/mastery`     | Student self, active linked Parent, authorized Teacher, and defined Admin scope.                                                  |
| `POST /api/v1/game-events`              | Authenticated, bounded, validated, idempotent telemetry batch.                                                                    |
| `GET /api/v1/ops/grading-jobs`          | Authorized operations status, retries, and failures.                                                                              |
| `POST /api/v1/evaluations/run`          | Restricted Admin/Developer evaluation initiation against a selected configuration; bounded/rate-limited execution.                |

- [ ] Document request/response validation and failure cases for these routes, including the PRD error envelope: `error.code`, `error.message`, `error.requestId`, optional `error.fieldErrors`.
- [ ] Share typed submission states, question types, review decisions, publication-source types, GradingResult v1.0, learning-event types, telemetry contracts, and configuration versions across appropriate modules.
- [ ] Model all core PRD tables, including grading policies and audit records; add required associations/supporting storage for question-concept mapping, versioned inputs, evaluation runs, and evidence supersession rather than treating the illustrative table list as exhaustive.
- [ ] Enforce immutable referenced rubric versions, append-only grading runs/reviews/learning events, a single current published grade per submission, a single mastery snapshot per student/concept, and game source/event uniqueness.
- [ ] Document which writes are transactional and which projections use replay/repair; verify that a successful response never depends on a non-durable future side effect.

## 5. Release acceptance and measurable targets

### Acceptance matrix

| PRD criterion | Evidence required                                                                              | Build tasks                      |
| ------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- |
| AC-01         | Seeded student sees only enrolled work and durable queued/review/published statuses.           | W1-04/05, W2-04/05, W3-08, W4-06 |
| AC-02         | Retried open-ended submission creates one logical job and a valid run or visible failure.      | W2-06, W3-01/02/05/07/10         |
| AC-03         | Low-confidence case requires review; unpublished result is inaccessible to Student/Parent.     | W4-02/03/09                      |
| AC-04         | Override with reason preserves original run and points publication to teacher decision.        | W4-05/06/08                      |
| AC-05         | Parent sees linked child and is denied another child even with a known identifier.             | W1-05, W5-05/11                  |
| AC-06         | Publication emits evidence and deterministically updates mastery.                              | W4-06, W5-01/02/03/04/11         |
| AC-07         | Duplicate game event creates no duplicate mastery evidence.                                    | W5-06/07/08/11                   |
| AC-08         | At least 100 evaluation cases produce agreement/error/latency/cost metrics.                    | W6-01/02                         |
| AC-09         | Critical E2E, RLS matrix, and worker integration tests run in CI.                              | W1-09, W3-10, W6-10/11           |
| AC-10         | One submission is traceable from request through queue/model/review/publication.               | W3-09, W6-04/14                  |
| AC-11         | Demo/production browser bundles contain no service-role or provider secrets.                   | W1-02, W6-06                     |
| AC-12         | README covers rationale, tradeoffs, setup, seeded users, screenshots, benchmarks, limitations. | W6-13/14                         |
| AC-13         | Architecture CI rejects an intentional framework/vendor import into domain/application.        | W1-11/13/17                      |
| AC-14         | Documented clean-clone bootstrap applies migrations/seeds and reaches four role dashboards.    | W1-15/16                         |
| AC-15         | Preview/staging migration, worker, and E2E smoke gates pass before production promotion.       | W6-11/15/16/17                   |
| AC-16         | Rehearsed web rollback/AI kill switch keeps queued work durable with no duplicate grade.       | W3-13, W6-12/18                  |
| AC-17         | Backup restore is executed in isolation and actual recovery results are recorded.              | W6-19/20                         |

### Added v1.1 non-functional coverage

| Requirement | Implementation and verification                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| NFR-016     | W1-11/12/13/17: inward dependencies, independent tests/typechecks, forbidden-import failure fixture, cycle scan.          |
| NFR-017     | W1-01/16, W6-15: clean checkout bootstraps infrastructure, migrations, seeds, build, and runtime without manual DB edits. |
| NFR-018     | W6-16/17/18: expand-and-contract and independently reversible web/worker releases.                                        |
| NFR-019     | W1-15, W6-06/15: startup configuration validation, explicit public/server separation, bundle checks.                      |
| NFR-020     | W1-16: measured clone-to-seeded-login within 30 minutes excluding initial dependency downloads.                           |
| NFR-021     | W6-19/20: tested backup/restore; actual RPO <= 24 h and rehearsal RTO <= 4 h targets reported with evidence.              |

Also exercise both approved and overridden reviews, revision/invalidation, duplicate requests and queue deliveries, malformed provider output with recovery, and a benchmark candidate that must fail promotion. For a long-form auto-publication test, use a high-confidence non-extreme valid score unless a benchmark-approved policy explicitly permits full/zero marks.

### Product and operational targets

| Measure                               | PRD target                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Teacher-AI exact agreement            | >= 80% on curated evaluation set                                               |
| Within-one-point agreement            | >= 95%                                                                         |
| Teacher override rate                 | < 15% after threshold tuning                                                   |
| Flagged cases actually needing review | >= 75% precision                                                               |
| Grading success                       | >= 99%, excluding provider-wide outages in the product metric                  |
| Automated grading latency             | Median < 15 s; 95% of successful jobs within 30 s                              |
| Non-AI web API latency                | P95 < 500 ms                                                                   |
| Availability/web success              | 99.9% monthly application target; web success SLI excludes expected 4xx        |
| Authorization leakage                 | Zero known cross-tenant/cross-student failures                                 |
| Local bootstrap                       | <= 30 minutes to seeded login, excluding initial dependency download time      |
| Backup recovery point                 | RPO <= 24 h with daily backups; finer available recovery point if PITR enabled |
| Restore rehearsal                     | RTO <= 4 h; record actual isolated restore duration                            |

Record dataset size, model/configuration, workload, time window, and exclusions alongside results. Track teacher-trusted automation rate: open-ended submissions auto-published or approved without score override while benchmark quality gates are met. Also collect completion/resubmission, mastery trend, review time/reasons, usage/cost, and recommendation engagement when applicable.

### Definition of Done for every feature

- [ ] Link relevant FR/NFR/SEC/AI/OBS or AC identifiers in the issue/PR.
- [ ] Implement the happy path and material failure path, with server authorization/validation and applicable DB constraints/migrations.
- [ ] Add appropriate automated coverage, including negative authorization tests where scoped data is involved.
- [ ] Provide accessible loading, empty, success, and error states; keep internal diagnostics and sensitive data out of public payloads/logs.
- [ ] Add useful logs/metrics and update affected API docs/runbooks.
- [ ] Pass lint, typecheck, applicable unit/integration/RLS tests, clean migration checks, preview E2E, dependency/security gates, and benchmark comparison for grading prompt/model changes. Document any accepted high-severity security exception explicitly.
- [ ] Pass architecture/import-boundary, circular-dependency, formatting, generated-type freshness, and web/worker build checks; domain/application remain framework/vendor-free.
- [ ] Add new configuration keys to the correct typed runtime schema and secret-free .env.example; verify public/server separation.
- [ ] Include expand-and-contract migration, release, and rollback notes for schema changes; test compatibility with currently deployed web/worker code.
- [ ] Update smoke steps/runbooks and identify an operational kill switch for deployment-impacting changes where applicable.

## 6. Optional work and the cut line

After the core release gates are stable:

- [ ] **FR-026 [P1]:** Class mastery insights (W5-09).
- [ ] **FR-031 [P1]:** Authorized assignment-results CSV export; exclude internal model diagnostics and audit sensitive export activity.
- [ ] **FR-032 [P1]:** Admin UI for versioned grading thresholds and provider/model settings with recent-session checks, validation, audit, and benchmark-gated promotion. Core grading still requires controlled server-side configuration before this UI exists.
- [ ] **FR-035 [P1]:** Deterministic practice recommendations (W5-10).
- [ ] **P1 enhancements:** Rich simulator, evaluation dashboard, and advanced assignment/product analytics beyond necessary operational metrics and benchmark reports.

Defer as P2: question bank/templates, roster CSV import, bulk review/calibration mode, weekly parent digest, attachments/rich media, handwriting OCR/PDF extraction, real game integrations, SSO/MFA rollout, provider fallback/ensembles, adaptive tutoring/knowledge tracing, and formal retention automation.

Do not add billing, live classes, school ERP, model training infrastructure, Kubernetes, Kafka, a service mesh, Redis, or microservices to the MVP. Dedicated workers/read replicas/partitioning require measured need and an ADR.

If time is constrained, cut optional UI/analytics/export/recommendation richness first. Preserve authentication/RLS, assignment/submission, durable AI grading, review/override, audit, publication, mastery, parent access, critical tests, and the minimal telemetry/evaluation needed for the stated acceptance criteria. Removing an explicit acceptance criterion requires an intentional scope revision.

## 7. Clean architecture and clean-code implementation specification

References: PRD pp. 17-19, 30-31, 33; NFR-016 and NFR-019; AC-13. Delivered by W1-01 and W1-11 through W1-17; enforced for all subsequent features.

### Project structure and ownership

The frontend and backend have separate code responsibilities within one Next.js product deployment. The grading worker is a separate Supabase Edge Function runtime sharing framework-free application/domain code. This is the v1.1 structure to scaffold, not an additional standalone API service.

```text
masteryloop-ai/
  apps/web/src/
    app/
      (auth)/                     # Login/callback routes
      (student)/student/          # Role route composition, loading/error boundaries
      (teacher)/teacher/
      (parent)/parent/
      (admin)/admin/
      api/v1/                    # REST entrypoints delegating to transport/use cases
      layout.tsx
    features/
      assignment/
        ui/                      # AssignmentCard, AnswerForm
        model/                   # Presentation state/view-models
        server/                  # Server-only query/action adapters
        validation/              # Browser-safe form schemas
        __tests__/
        index.ts                 # Public feature API; do not re-export server secrets
      grading-status/
      teacher-review/
      mastery-progress/
      game-telemetry-simulator/
    entities/
      assignment/                # Reusable display models/mappers
      submission/
      mastery/
    shared/
      ui/                        # App-specific primitives
      lib/                       # Formatting, dates, result helpers
      config/                    # Browser-safe validated environment only
      hooks/
      test/
    server/
      transport/                 # Shared thin HTTP/server-action adapters
      auth/                      # Validated session -> ActorContext
      composition/               # Concrete production/test dependency wiring
      config/                    # Validated server-only environment
  packages/
    domain/src/
      identity/                  # Roles, scopes, guardian/class rules
      homework/                  # Assignment, rubric, submission rules
      grading/                   # Result, confidence policy, state transitions
      mastery/                   # Evidence and deterministic calculations
      telemetry/                 # Event identity/deduplication rules
      shared/                    # Result, domain errors, IDs/value objects
    application/src/
      homework/
        use-cases/               # CreateAssignment, SubmitAnswer, PublishAssignment
        ports/                   # SubmissionRepository, UnitOfWork, QueuePort
        dto/
      grading/
        use-cases/               # ProcessGradingJob, ReviewGrade, RetryJob
        ports/                   # AiGraderPort, GradingRepository, AuditPort
        dto/
      mastery/use-cases/
      telemetry/use-cases/
    infrastructure/src/
      db/supabase/               # Repositories, row mappers, transaction implementations
      queue/pgmq/                # Queue producer/consumer adapter
      ai/openai/                 # Provider adapter, schema mapper, versioned prompts
      observability/             # Structured logger, traces, metrics
      security/                  # Rate limits, idempotency persistence
    contracts/src/               # Browser-safe Zod request/response/event schemas
    ui/                          # Reusable accessible components/design tokens
  supabase/
    config.toml
    migrations/                  # Schema/RLS/functions/queue/webhook/Cron changes
    functions/
      _shared/                   # Deno-safe bootstrap/config/composition helpers
      grading-worker/
        index.ts                 # Thin authenticated queue-consumer entrypoint
        deno.json
    tests/                       # SQL/RLS/database integration tests
    seed.sql                     # Synthetic data only
  tests/
    e2e/
    evals/                       # Versioned fixtures and expected labels
    performance/                 # Optional load-smoke scripts
  docs/
    adr/
    api/
    architecture/
    runbooks/
    security/
  scripts/                       # Bootstrap, seed, backup, smoke, evaluation helpers
  .github/workflows/              # CI, preview-e2e, release, scheduled-security
  .env.example                   # Configuration names; never secret values
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  tsconfig.base.json
```

Add modules for remaining capabilities as their slices are implemented using these same boundaries. Do not duplicate feature action orchestration in app routes and shared transport: entrypoints delegate to one adapter/use case. Keep browser-facing public exports separate from server-only entrypoints so client feature imports cannot transitively pull backend dependencies.

### Backend dependency and execution rules

| Layer                  | Owns                                                                     | Allowed dependencies                                                         |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Domain                 | Entities, value objects, policies, state transitions, domain errors      | TypeScript language/runtime only                                             |
| Application            | Commands/queries, use cases, ports, DTOs, transaction orchestration      | Domain and small shared contract types; no framework/vendor/HTTP runtime     |
| Infrastructure         | DB, queue, AI, clock/ID, logging/tracing, security adapters              | Inward interfaces/models plus external SDKs                                  |
| Presentation/transport | Request parsing, authentication extraction, validation, response mapping | Application and safe contracts; concrete wiring accessed through composition |
| Composition root       | Explicit environment-specific dependency construction                    | Required outer implementations and inward interfaces                         |

- Domain/application tests execute without Next.js, React, Supabase, OpenAI, Vercel, HTTP, or a live database. Zod parsing stays at contract/adapter boundaries; domain does not import it.
- Use cases take an explicit server-derived ActorContext and dependency ports. Apply application authorization on every protected read/write and retain RLS at persistence.
- Put all external effects behind ports: AI, queue, time, IDs, audit publication, and persistence. Inject them explicitly; a DI framework is not required.
- Repositories return application/domain models, never SDK responses or raw database rows. Infrastructure owns mapping and translates failures to stable application errors.
- Route handlers/server actions authenticate, validate, invoke one use case, map results, and stop. No grading/mastery policy or SQL in transport or React components.
- UnitOfWork defines atomic writes; SQL functions implement database transactions. Keep provider calls outside long-held database transactions and make persistence/redelivery safe around external calls.
- Centralize typed domain transitions. Use the full submission states from W2-08; the abbreviated example on PRD p. 18 is illustrative, not a second status vocabulary.
- Require an ADR for new runtimes, datastores, brokers, global state libraries, or cross-module dependency exceptions. Keep architecture checks active throughout implementation.

### Frontend and clean-code rules

- Prefer Server Components for authenticated reads/layouts. Client Components are for interactive state, browser APIs, optimistic UI, and polling. Product mutations go through server actions/versioned API and application use cases.
- React components do not query Postgres directly or import service-role clients. Student/Parent DTOs omit internal AI fields before serialization; UI hiding is insufficient.
- Feature behavior lives in features; routes compose features; generic visuals live in packages/ui or shared/ui. Cross-feature access uses small public APIs; route/higher-level composition coordinates multiple features.
- Prefer local form/component and URL state; derived values are computed rather than synchronized through effects. Use stable list keys and accessible labels/focus behavior.
- Include loading, empty, error, unauthorized, stale-data, and retry states, with keyboard/accessibility behavior defined alongside each feature.
- Enable strict, noImplicitAny, noUncheckedIndexedAccess, and exactOptionalPropertyTypes where compatible; document compatibility exceptions. Prefer unknown plus validation for external data; do not cast unchecked JSON into trusted types or leave any un-narrowed.
- Use descriptive names, single-responsibility modules/functions, early returns, pure domain functions, and typed configuration/constants instead of magic thresholds or status strings.
- Validate once at each trust boundary with Zod/DB constraints; repeat browser validation on the server. Do not swallow exceptions; map typed errors into safe transport envelopes.
- Give every retryable effect an idempotency strategy and timeout/retry budget. Keep raw SQL in infrastructure/migrations and important writes transactional.
- Use structured logging and correlation IDs; prohibit console.log in production paths and student-answer/PII logging by default.
- Test behavior/security boundaries with deterministic clocks/IDs/mocks; live providers/networks run only in explicitly selected integration/evaluation suites. Comments/public-interface docs explain non-obvious invariants, failure modes, and tradeoffs.

Code review must check dependency direction, actor/ownership/RLS coverage, retry duplication, old web/worker schema compatibility, observable safe errors, accessible UI states, appropriate tests, AI benchmark impact, and release/rollback notes. Formatting, architecture checks, generated-type freshness, and the existing security/quality gates are blocking checks.

## 8. Local development, deployment, and recovery specification

References: PRD pp. 32-37; NFR-017 through NFR-021; AC-14 through AC-17. Delivered by W1-15/16/17, W3-11/12/13, and W6-11 through W6-20.

### Local bootstrap and configuration

The README must document pinned prerequisites and exact working commands. Implement package scripts and setup helpers before claiming this sequence works; CI uses the same deterministic scripts. Web and worker serve commands run in separate terminals/processes.

```sh
corepack enable
pnpm install --frozen-lockfile
supabase start
supabase db reset
pnpm dev
supabase functions serve grading-worker --env-file supabase/.env.local
pnpm test
pnpm test:rls
pnpm test:e2e
pnpm eval:grading
```

Also provide documented format/architecture/typecheck/build/smoke commands, local environment setup, deterministic synthetic Auth user provisioning, and test provider configuration. Clearly identify evaluation commands that require provider credentials and incur usage. Never embed real credentials in bootstrap output, seeds, or committed examples.

| Configuration class | Location and validation                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Browser public      | shared/config: Supabase URL, publishable/anon key, public app URL; intentionally bundle-safe                           |
| Web server          | server/config: only required server secrets, server Supabase access, observability credentials; no client exports      |
| Edge Function       | Worker startup validation with Supabase secrets/Vault-backed values: AI key and trigger authentication                 |
| CI deployment       | GitHub Environments/Secrets for deployment tokens/project references; protected production approval                    |
| Feature/policy      | Audited versioned application configuration: auto-publish, thresholds, prompt/model versions; reversible independently |

Required keys fail safely at startup/build without logging values. Maintain secret-free .env.example and ignored local environment files. Validate callback/site URLs for local/preview/staging/production and ensure server secrets never use NEXT*PUBLIC*\*.

### Topology and pipeline gates

Vercel hosts the Next.js UI, web transports, and composition. Supabase hosts Postgres/Auth/Storage/RLS, pgmq, Edge Function worker, database webhook, and Cron. The queue is the source of work; webhook/Cron are wake-up mechanisms. The AI provider remains behind AiGraderPort; tracing spans web, queue, worker, AI, and publication.

| Stage              | Trigger                                             | Required actions and evidence                                                                                                                     |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validate           | Every PR/push                                       | Frozen pnpm install; format, ESLint boundaries, cycles, types, unit/component tests, dependency/secret scans                                      |
| Database verify    | Changes affecting supabase/\*\* or DB/RLS contracts | Local Supabase, reset from zero, migration lint, representative-prior-schema upgrade, SQL/RLS/integration tests, seed/type freshness verification |
| Build              | Every PR                                            | Production Next.js build, server-secret import/bundle checks, Edge Function typecheck/tests and shared-package compatibility                      |
| Preview            | PR                                                  | Vercel preview and isolated Supabase branch when available; otherwise dedicated shared nonproduction synthetic backend                            |
| Preview E2E        | Preview ready                                       | Student -> grading -> Teacher -> Parent smoke, API/RLS negative cases, compatible worker/migrations deployed before smoke                         |
| AI regression      | Prompt/model/rubric-policy changes                  | Versioned benchmark comparison; enforce selected quality/cost/latency guardrails                                                                  |
| Staging            | Merge/release candidate                             | Additive migrations -> worker -> web -> seed/reconcile synthetic fixtures -> smoke/benchmark                                                      |
| Production         | Approved main/release                               | Protected environment approval; release sequence below, metrics watch, release annotation                                                         |
| Scheduled security | Documented recurring schedule                       | Dependency/secret checks with actionable report and owner                                                                                         |

Shared-preview fallback must serialize schema/worker deployments and tests targeting that shared schema, use isolated synthetic fixtures, and identify the tested revision so concurrent PRs cannot silently invalidate results. Production secrets/data are never used in preview; staging and production have separate environment configuration. Do not run synthetic reset/seed scripts against a live production database during routine releases.

### Schema and production release sequence

All schema, RLS, SQL function, queue, webhook, and Cron changes belong in migrations. Avoid manual production dashboard schema edits outside incident response; reconcile any emergency fix into version control. Expand with compatible nullable columns/tables/functions first, then deploy compatible code, backfill/verify, and contract only in a later release. Backfills must be resumable/idempotent and avoid long blocking transactions.

1. **Preflight:** Confirm required CI/benchmark gates, reviewed migration and rollback notes, protected release approval, healthy incident dashboard, and no conflicting migration/rollout.
2. **Recovery readiness:** Verify fresh backup/PITR status, retained known-good worker/web versions, kill-switch access, and the release owner.
3. **Schema expand:** Apply compatible migrations, RLS, functions, queue, webhook, and Cron configuration before dependent code. Keep environment secrets outside migration source.
4. **Worker rollout:** Deploy the worker version that supports both old and new web payloads and already queued work; verify authenticated triggers and worker health.
5. **Web rollout:** Promote the tested Vercel deployment with validated production configuration; verify HTTPS and configured domain/auth callback routing. Preserve the tested dependency lockfile.
6. **Synthetic smoke:** Log in critical roles, read an assignment, submit a synthetic answer, confirm queue/worker result, review/publish, read as linked parent, and assert one negative authorization case. Capture correlation IDs.
7. **Observe:** Watch error rate, P95 latency, queue age, AI schema failures, grading success, and auth denials during D-08's release window. Stop/fix/rollback if gates fail.
8. **Activate policy last:** Enable changed AI policy/auto-publish through audited reversible configuration only after technical health is confirmed.
9. **Record completion:** Annotate web deployment, worker artifact/source, migration, queue/webhook/Cron configuration, and model/prompt/policy versions; attach smoke/metrics evidence and confirm backups/operations remain healthy.

### Rollback and disaster recovery

| Failure                    | Immediate action                                                         | Required verification                                                                                     |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Bad web release            | Promote previous immutable Vercel deployment                             | Previous app works against expanded schema; submission/review flow remains safe                           |
| Bad worker release         | Pause/limit consumption and restore known-good worker artifact/source    | Queued work retained; compatible worker resumes without duplicate publication/evidence                    |
| Bad AI policy/model/prompt | Disable auto-publish or pin previous approved versions                   | Identify affected run IDs; explicitly scoped regrades preserve original runs                              |
| Provider outage/rate limit | Reduce/pause aggressive consumption, retain jobs, show delayed status    | Bounded retries and recovery within provider quotas                                                       |
| Database/RLS regression    | Stop rollout; safe app rollback and forward-fix migration/RLS correction | Negative authorization tests and consistency checks pass; ordinary rollback does not restore the database |
| Queue backlog              | Inspect age/poison jobs and adjust safe consumer capacity within quota   | Both wake-up mechanisms work; oldest age and failure rate recover                                         |
| Data loss/corruption       | Follow incident backup/PITR recovery procedure                           | Isolated restore and smoke validated before explicit cutover decision                                     |

Backups must meet the chosen tier's actual retention capabilities: daily managed backups where sufficient, PITR when justified, or scheduled encrypted off-site logical dumps with verified restoration otherwise. Verify required schemas/data, roles/auth dependencies, migrations, and non-database configuration during rehearsal rather than assuming a dump covers the whole platform. Database backups do not preserve Storage objects; add a separate export/replication policy and restore test before uploads become supported.

Restore into an isolated disposable environment at least once before the demo; reconcile migrations, run role/queue/review smoke, and record backup time, restore start/end, validation outcome, actual recovery point, and actual duration against RPO <= 24 h and rehearsal RTO <= 4 h. Use the finer available recovery point with PITR. For a real product, repeat quarterly per the PRD. Restore is incident recovery, not routine destructive schema rollback.

Required named runbooks under docs/runbooks:

- `grading-provider-outage.md`: pause/slow consumption, bounded retries, delayed status, recovery verification.
- `queue-backlog.md`: depth/oldest age, poison messages, consumer concurrency, provider quotas.
- `bad-ai-release.md`: auto-publish disablement, version pinning, affected run IDs, controlled regrade.
- `auth-or-rls-incident.md`: protect access, disable exposed route/config, capture audit IDs, repair and test denial cases.
- `database-restore.md`: backup selection, isolated restore, migration reconciliation, smoke, measured recovery, cutover decision.
- `production-deploy.md`: exact sequence, smoke commands, owners/rollback links, release annotation and completion checks.

Retain the additional retry, stale-mastery repair, secret rotation, and model-promotion documentation from W6-13. New deployment controls are implementation work; their checkboxes stay open until tested evidence exists.

**First implementation milestone:** Resolve D-01/D-02, then complete Week 1 including enforceable architecture boundaries, typed configuration, Deno compatibility, and the measured clean-clone bootstrap before starting homework authoring.
