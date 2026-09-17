"use client";

import { useActionState } from "react";
import type { ActorContext, ClassSummary, PersonSummary } from "@masteryloop/domain";
import { initialActionState } from "@masteryloop/contracts";
import type { ActionState } from "@masteryloop/contracts";
import { Button, Panel } from "@masteryloop/ui";
import { createClassAction, guardianAction, membershipAction } from "../server/actions";

function Feedback({ state }: { state: ActionState }) {
  return (
    <p className={`form-feedback ${state.success ? "is-success" : ""}`} aria-live="polite">
      {state.message}
      {state.requestId && <small>Reference: {state.requestId}</small>}
    </p>
  );
}

export function CreateClassForm({
  actor,
  teachers,
}: {
  actor: ActorContext;
  teachers: PersonSummary[];
}) {
  const [state, action, pending] = useActionState(createClassAction, initialActionState);
  return (
    <Panel>
      <p className="eyebrow">MAKE ROOM FOR LEARNING</p>
      <h2>Create a class</h2>
      <form action={action} className="stack">
        <label>
          Class name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. P5 Science - Maple"
          />
        </label>
        <div className="form-row">
          <label>
            Year level
            <select name="gradeLevel" defaultValue="P5">
              <option>P3</option>
              <option>P4</option>
              <option>P5</option>
              <option>P6</option>
            </select>
          </label>
          <label>
            Subject
            <select name="subject">
              <option>Science</option>
            </select>
          </label>
        </div>
        {actor.role === "ADMIN" ? (
          <label>
            Teacher
            <input name="teacherId" required list="teacher-ids" placeholder="Teacher account ID" />
            <datalist id="teacher-ids">
              {teachers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </datalist>
          </label>
        ) : (
          <input type="hidden" name="teacherId" value={actor.id} />
        )}
        <Feedback state={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create class"}
        </Button>
      </form>
    </Panel>
  );
}

export function MembershipForm({
  classes,
  students,
}: {
  classes: ClassSummary[];
  students: PersonSummary[];
}) {
  const [state, action, pending] = useActionState(membershipAction, initialActionState);
  return (
    <Panel>
      <p className="eyebrow">THE RIGHT PEOPLE, TOGETHER</p>
      <h2>Manage enrollment</h2>
      <form action={action} className="stack">
        <label>
          Class
          <input name="classId" required list="class-ids" placeholder="Class ID" />
          <datalist id="class-ids">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </datalist>
        </label>
        <label>
          Student ID
          <input
            name="studentId"
            required
            list="student-ids"
            placeholder="Student ID from your administrator"
            aria-describedby="student-help"
          />
          <datalist id="student-ids">
            {students.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </datalist>
        </label>
        <small id="student-help">
          Use an existing student&apos;s ID. Only students in your school can be enrolled.
        </small>
        <label>
          Change
          <select name="active">
            <option value="true">Enroll student</option>
            <option value="false">Remove enrollment</option>
          </select>
        </label>
        <Feedback state={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Update enrollment"}
        </Button>
      </form>
    </Panel>
  );
}

export function GuardianForm({ people }: { people: PersonSummary[] }) {
  const [state, action, pending] = useActionState(guardianAction, initialActionState);
  return (
    <Panel>
      <p className="eyebrow">KEEP FAMILIES CONNECTED</p>
      <h2>Guardian access</h2>
      <form action={action} className="stack">
        <label>
          Parent
          <input name="parentId" required list="parent-ids" placeholder="Parent account ID" />
          <datalist id="parent-ids">
            {people
              .filter((p) => p.role === "PARENT")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
          </datalist>
        </label>
        <label>
          Student
          <input
            name="studentId"
            required
            list="guardian-student-ids"
            placeholder="Student account ID"
          />
          <datalist id="guardian-student-ids">
            {people
              .filter((p) => p.role === "STUDENT")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
          </datalist>
        </label>
        <label>
          Access
          <select name="active">
            <option value="true">Grant linked-child access</option>
            <option value="false">Remove linked-child access</option>
          </select>
        </label>
        <p className="form-note">
          Granting access lets this parent see the linked child&apos;s published progress. Removing
          the link revokes that access.
        </p>
        <Feedback state={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Update guardian access"}
        </Button>
      </form>
    </Panel>
  );
}
