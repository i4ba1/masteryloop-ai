import Link from "next/link";
import { Wordmark } from "@masteryloop/ui";
import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <main id="main" className="login-layout">
      <aside className="login-story">
        <Link href="/" aria-label="MasteryLoop home">
          <Wordmark />
        </Link>
        <div>
          <p className="eyebrow">GOOD TO HAVE YOU HERE</p>
          <h1>
            Your next
            <br />
            <em>aha moment.</em>
          </h1>
          <p>
            Every small discovery matters.
            <br />
            Let&apos;s see where today takes you.
          </p>
        </div>
        <span className="login-footnote">A shared space. A personal journey.</span>
      </aside>
      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>
            Pick up where
            <br />
            you left off.
          </h2>
          <p className="muted">Sign in to your school account.</p>
          <LoginForm />
          <Link className="text-link" href="/">
            &larr; Back to MasteryLoop
          </Link>
        </div>
      </section>
    </main>
  );
}
