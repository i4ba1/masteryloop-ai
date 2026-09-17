"use client";
import { useActionState, useState } from "react";
import { initialActionState } from "@masteryloop/contracts";
import type { PersonSummary } from "@masteryloop/domain";
import { Button, Panel } from "@masteryloop/ui";
import { createAccountAction, updateAccountAction } from "../server/actions";
function Details({ person }: { person?: PersonSummary }) {
  return (
    <>
      <label>
        Display name
        <input name="displayName" defaultValue={person?.displayName} required maxLength={100} />
      </label>
      <label>
        Account role
        <select name="role" defaultValue={person?.role ?? "STUDENT"}>
          {["STUDENT", "PARENT", "TEACHER", "ADMIN"].map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <label>
        Year level for new student records
        <select name="gradeLevel" defaultValue="P5">
          {["P3", "P4", "P5", "P6"].map((grade) => (
            <option key={grade}>{grade}</option>
          ))}
        </select>
      </label>
      <label>
        School year for new student records
        <input name="schoolYear" type="number" min={2020} max={2100} defaultValue={2026} required />
      </label>
    </>
  );
}
export function CreateAccountForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(createAccountAction, initialActionState);
  // Keep the same key across retries and server revalidation. Start a new account
  // explicitly after success so double submissions cannot create another identity.
  const [key] = useState(requestId);
  return (
    <Panel>
      <h2>Create an account</h2>
      <p className="form-note">
        Requires an admin sign-in within 15 minutes. Share the initial password through your
        school&apos;s secure process.
      </p>
      <form action={action} className="stack">
        <input type="hidden" name="requestId" value={key} />
        <label>
          Account email
          <input name="email" type="email" required maxLength={254} autoComplete="off" />
        </label>
        <label>
          Initial password
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </label>
        <Details />
        <p aria-live="polite" className="form-feedback">
          {state.message}
        </p>
        <Button type="submit" disabled={pending || state.success}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
        {state.success && <a href="/admin#accounts">Create another account</a>}
      </form>
    </Panel>
  );
}
export function EditAccountForm({ person }: { person: PersonSummary }) {
  const [state, action, pending] = useActionState(updateAccountAction, initialActionState);
  return (
    <details>
      <summary>Edit {person.displayName}</summary>
      <form action={action} className="stack">
        <input type="hidden" name="accountId" value={person.id} />
        <input type="hidden" name="expectedVersion" value={person.version} />
        <Details person={person} />
        <label>
          Account access
          <select name="active" defaultValue={String(person.active)}>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label>
          Reason for change
          <textarea name="reason" required minLength={5} maxLength={500} />
        </label>
        <p className="form-note">
          Role changes require removing active relationships first. Disabling an account revokes its
          student and guardian relationships.
        </p>
        <p className="form-feedback" aria-live="polite">
          {state.message}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving account..." : "Save account"}
        </Button>
      </form>
    </details>
  );
}
