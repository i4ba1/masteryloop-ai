import { dashboardQuerySchema } from "@masteryloop/contracts";
import { CreateAccountForm, EditAccountForm } from "@/features/accounts";
import { Pagination } from "./pagination";
import { redirect } from "next/navigation";
import { getDashboard } from "@masteryloop/application";
import { ApplicationError } from "@masteryloop/domain";
import type { Role } from "@masteryloop/domain";
import { EmptyState, Panel, Wordmark } from "@masteryloop/ui";
import { rosterContext } from "@/server/composition/roster";
import { signOut } from "@/features/auth/server";
import { CreateClassForm, GuardianForm, MembershipForm } from "./roster-forms";

const copy = {
  STUDENT: {
    title: "Stay curious,",
    subtitle: "A little practice. A new discovery. Your learning starts here.",
    label: "YOUR LEARNING SPACE",
  },
  TEACHER: {
    title: "Make understanding",
    subtitle: "Your classes, your students, and the connections that make learning possible.",
    label: "THE TEACHER'S DESK",
  },
  PARENT: {
    title: "Be part of",
    subtitle: "Stay close to your child's learning, one small discovery at a time.",
    label: "YOUR FAMILY SPACE",
  },
  ADMIN: {
    title: "A good foundation",
    subtitle: "Connect your school community with the right classes and access.",
    label: "SCHOOL ADMINISTRATION",
  },
};

export async function Dashboard({
  role,
  query = {},
}: {
  role: Role;
  query?: Record<string, string | string[] | undefined>;
}) {
  let context;
  try {
    context = await rosterContext();
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "UNAUTHENTICATED") redirect("/login");
    throw error;
  }
  const { actor, repository } = context;
  if (actor.role !== role) redirect(`/${actor.role.toLowerCase()}`);
  const parsed = dashboardQuerySchema.safeParse(query);
  if (!parsed.success)
    return (
      <main id="main">
        <h1>Invalid page link</h1>
        <p>The page cursor is invalid.</p>
        <a href={`/${role.toLowerCase()}`}>Return to the first page</a>
      </main>
    );
  const { classesAfter, peopleAfter } = parsed.data;
  const data = await getDashboard(actor, repository, {
    classes: classesAfter ? { after: classesAfter } : {},
    people: peopleAfter ? { after: peopleAfter } : {},
  });
  const students = data.people.items.filter((p) => p.role === "STUDENT" && p.active);
  const isStaff = role === "TEACHER" || role === "ADMIN";
  const titleEnd =
    role === "STUDENT"
      ? actor.displayName.split(" ")[0]
      : role === "TEACHER"
        ? "happen."
        : role === "PARENT"
          ? "their journey."
          : "for everyone.";
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href={`/${role.toLowerCase()}`} aria-label="Your home">
          <Wordmark compact />
        </a>
        <span className="sidebar-label">YOUR SPACE</span>
        <nav aria-label="Workspace">
          <a className="nav-current" href={`/${role.toLowerCase()}`} aria-current="page">
            <span aria-hidden="true">&#9638;</span> Overview
          </a>
          <a href="#connections">
            <span aria-hidden="true">&#9675;</span>{" "}
            {role === "PARENT" ? "Your children" : "Your classes"}
          </a>
          {isStaff && (
            <a href="#manage">
              <span aria-hidden="true">+</span> Manage connections
            </a>
          )}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{actor.displayName.charAt(0)}</span>
          <strong>{actor.displayName}</strong>
          <small>{role.toLowerCase()}</small>
          <form action={signOut}>
            <button className="text-link" type="submit">
              Sign out &rarr;
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="workspace-main">
        <header className="workspace-top">
          <span>Overview</span>
          <span className="pill">Science / Primary</span>
        </header>
        <section className="welcome">
          <p className="eyebrow">{copy[role].label}</p>
          <h1>
            {copy[role].title}
            <br />
            <em>{titleEnd}</em>
          </h1>
          <p>{copy[role].subtitle}</p>
          <div className="welcome-flower" aria-hidden="true">
            &#10035;
          </div>
        </section>
        <div className="metric-row">
          <Panel>
            <span className="eyebrow">
              {role === "PARENT" ? "CHILDREN ON THIS PAGE" : "CLASSES ON THIS PAGE"}
            </span>
            <strong className="metric-value">
              {role === "PARENT"
                ? students.length
                : data.classes.items.length.toString().padStart(2, "0")}
            </strong>
            <span className="muted">
              {role === "PARENT" ? "Connected through your school" : "Spaces to explore together"}
            </span>
          </Panel>
          <Panel className="note-panel">
            <span className="eyebrow">A THOUGHT FOR TODAY</span>
            <blockquote>
              Understanding grows
              <br />
              one connection at a time.
            </blockquote>
            <span className="muted">Make space for the next question.</span>
          </Panel>
        </div>
        <section id="connections" className="content-section">
          <div className="section-heading">
            <h2>{role === "PARENT" ? "Your children" : "Your classes"}</h2>
            <span className="eyebrow">CONNECTED & READY</span>
          </div>
          {role === "PARENT" ? (
            students.length ? (
              <div className="class-grid">
                {students.map((s) => (
                  <Panel key={s.id}>
                    <span className="class-icon">{s.displayName.charAt(0)}</span>
                    <h3>{s.displayName}</h3>
                    <p className="muted">Your school has linked your accounts.</p>
                    <p className="form-note">
                      Published homework and progress will appear here when available.
                    </p>
                  </Panel>
                ))}
              </div>
            ) : (
              <EmptyState title="No children linked yet">
                Your school administrator can connect your account to your child.
              </EmptyState>
            )
          ) : data.classes.items.length ? (
            <div className="class-grid">
              {data.classes.items.map((c, i) => (
                <Panel key={c.id}>
                  <div className="class-meta">
                    <span className={`class-icon tone-${i % 3}`} aria-hidden="true">
                      {c.gradeLevel}
                    </span>
                    <span className="pill">{c.subject}</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p className="muted">{c.gradeLevel} &middot; A space for curious minds</p>
                  {isStaff && (
                    <small>
                      {data.enrollmentCounts[c.id] ?? 0} active enrollment(s)
                      <br />
                      <code>{c.id}</code>
                    </small>
                  )}
                </Panel>
              ))}
            </div>
          ) : (
            <EmptyState title="A new beginning">
              {isStaff
                ? "Create your first class to bring your students together."
                : "Your teacher will connect you to a class soon."}
            </EmptyState>
          )}
          {role === "PARENT" ? (
            <Pagination
              role={role}
              kind="people"
              current={peopleAfter}
              next={data.people.nextCursor}
              other={classesAfter}
            />
          ) : (
            <Pagination
              role={role}
              kind="classes"
              current={classesAfter}
              next={data.classes.nextCursor}
              other={peopleAfter}
            />
          )}
        </section>
        {isStaff && (
          <section id="manage" className="content-section">
            <div className="section-heading">
              <h2>Build your connections</h2>
              <span className="eyebrow">CLASS & ROSTER</span>
            </div>
            <div className="management-grid">
              <CreateClassForm
                actor={actor}
                teachers={data.people.items.filter((p) => p.role === "TEACHER" && p.active)}
              />
              <MembershipForm classes={data.classes.items} students={students} />
              {role === "ADMIN" && (
                <GuardianForm people={data.people.items.filter((p) => p.active)} />
              )}
            </div>
            {role === "ADMIN" && (
              <Panel className="directory">
                <h3>School directory</h3>
                <p className="muted">
                  Active and disabled school accounts. Suggestions in the forms show this page only;
                  paste an account ID to manage an account from another page.
                </p>
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">People in your school</caption>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Account ID</th>
                        <th>Access</th>
                        <th>Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.people.items.map((p) => (
                        <tr key={p.id}>
                          <td>{p.displayName}</td>
                          <td>{p.role.toLowerCase()}</td>
                          <td>
                            <code>{p.id}</code>
                          </td>
                          <td>{p.active ? "Active" : "Disabled"}</td>
                          <td>
                            <EditAccountForm key={`${p.id}:${p.version}`} person={p} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  role={role}
                  kind="people"
                  current={peopleAfter}
                  next={data.people.nextCursor}
                  other={classesAfter}
                />
              </Panel>
            )}
          </section>
        )}
        {role === "TEACHER" && (
          <Panel>
            <h2>Your student directory</h2>
            <ul>
              {students.map((person) => (
                <li key={person.id}>
                  {person.displayName} <code>{person.id}</code>
                </li>
              ))}
            </ul>
            <Pagination
              role={role}
              kind="people"
              current={peopleAfter}
              next={data.people.nextCursor}
              other={classesAfter}
            />
          </Panel>
        )}
        {role === "ADMIN" && (
          <section id="accounts" className="content-section">
            <CreateAccountForm requestId={crypto.randomUUID()} />
          </section>
        )}
        <footer className="workspace-footer">
          <span>Small steps. Lasting understanding.</span>
          <span>MasteryLoop AI</span>
        </footer>
      </main>
    </div>
  );
}
