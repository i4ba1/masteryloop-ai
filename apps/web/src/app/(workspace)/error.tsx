"use client";

import { Button } from "@masteryloop/ui";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <h1>Let&apos;s try that again.</h1>
      <p>We couldn&apos;t load your learning space. Your saved connections are still safe.</p>
      <Button onClick={reset}>Try again</Button>
      <a href="/login">Back to sign in</a>
    </main>
  );
}
