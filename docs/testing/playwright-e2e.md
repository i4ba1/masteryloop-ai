# Playwright end-to-end testing

## Setup

Install the pinned browser once:

```sh
pnpm exec playwright install chromium
```

Start and seed the disposable local backend before browser tests:

```sh
pnpm db:start
pnpm setup:local
pnpm seed:local
```

The normal suite runs headless across desktop and mobile projects:

```sh
pnpm test:e2e
```

## Demo recording

`pnpm record:demo` runs `tests/e2e/demo-walkthrough.spec.ts` in a visible Chromium window with Playwright video enabled. It captures the landing page and teacher workspace, writes the screenshots to `artifacts/demo-walkthrough/`, and converts the Playwright WebM recording to `artifacts/demo-walkthrough/demo-walkthrough.mp4` with the pinned local `ffmpeg-static` encoder. The local Supabase seed credentials are synthetic and must not be used outside the disposable environment.

The walkthrough verifies the public landing page, teacher sign-in, authorized teacher dashboard, class list, and management section. It is intentionally a short product demonstration rather than a replacement for the complete regression suite.
