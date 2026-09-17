import type { Role } from "@masteryloop/domain";
export function Pagination({
  role,
  kind,
  current,
  next,
  other,
}: {
  role: Role;
  kind: "classes" | "people";
  current: string | undefined;
  next: string | null;
  other: string | undefined;
}) {
  function href(cursor?: string) {
    const query = new URLSearchParams();
    if (cursor) query.set(`${kind}After`, cursor);
    if (other) query.set(kind === "classes" ? "peopleAfter" : "classesAfter", other);
    return `/${role.toLowerCase()}${query.size ? `?${query}` : ""}#${kind === "classes" ? "connections" : role === "PARENT" ? "connections" : "manage"}`;
  }
  return (
    <nav aria-label={`${kind} pagination`} className="pagination">
      {current && <a href={href()}>First {kind} page</a>}
      {next && <a href={href(next)}>Next {kind} page</a>}
      {!next && <span className="muted">End of {kind} list</span>}
    </nav>
  );
}
