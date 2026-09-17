"use client";

import { useActionState } from "react";
import { Button } from "@masteryloop/ui";
import { initialActionState } from "@masteryloop/contracts";
import { signIn } from "../server/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialActionState);
  return (
    <form action={action} className="stack">
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@school.edu"
          required
          maxLength={254}
          aria-describedby="login-feedback"
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-describedby="login-feedback"
        />
      </label>
      <div id="login-feedback" aria-live="polite" className="form-feedback">
        {state.message}
        {state.requestId && <small>Reference: {state.requestId}</small>}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Enter your learning space"}
        <span aria-hidden="true"> &rarr;</span>
      </Button>
      <p className="form-note">
        Your school administrator provides your account. Each person has their own learning space.
      </p>
    </form>
  );
}
