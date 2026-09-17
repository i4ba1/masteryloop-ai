import Link from "next/link";
import { Wordmark } from "@masteryloop/ui";

export default function Home() {
  return (
    <>
      <header className="public-header">
        <Link href="/" aria-label="MasteryLoop home">
          <Wordmark />
        </Link>
        <Link className="button button-outline" href="/login">
          Sign in <span aria-hidden="true">&rarr;</span>
        </Link>
      </header>
      <main id="main" className="landing">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> BUILT AROUND UNDERSTANDING
          </p>
          <h1>
            A little clearer.
            <br />
            <em>Every day.</em>
          </h1>
          <p className="hero-description">
            Learning is a loop, not a finish line. A shared space for thoughtful feedback, small
            discoveries, and the people who help them happen.
          </p>
          <Link className="button" href="/login">
            Find your learning space <span aria-hidden="true">&rarr;</span>
          </Link>
          <p className="quiet-note">
            For curious students, caring teachers, and connected families.
          </p>
        </div>
        <div
          className="learning-illustration"
          aria-label="The learning loop: explore, reflect, grow"
          role="img"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="loop-center">
            <span className="eyebrow">THE LEARNING LOOP</span>
            <span className="loop-symbol">m</span>
            <span>
              Small steps.
              <br />
              Lasting understanding.
            </span>
          </div>
          <span className="orbit-label label-explore">01 / Explore</span>
          <span className="orbit-label label-reflect">02 / Reflect</span>
          <span className="orbit-label label-grow">03 / Grow</span>
          <span className="spark spark-one">+</span>
          <span className="spark spark-two">+</span>
        </div>
      </main>
      <section className="principles" aria-label="Our approach">
        <article>
          <span>01</span>
          <h2>Make room for curiosity.</h2>
          <p>One place to begin, ask questions, and build understanding.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Keep teachers at the heart.</h2>
          <p>Human judgment belongs at the center of every learning decision.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Bring families into the loop.</h2>
          <p>A clearer view of the learning journey, together.</p>
        </article>
      </section>
      <footer className="public-footer">
        <span>MasteryLoop AI</span>
        <span>Made for the moments when it clicks.</span>
      </footer>
    </>
  );
}
