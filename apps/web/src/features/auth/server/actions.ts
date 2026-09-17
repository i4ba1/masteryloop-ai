"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@masteryloop/contracts";
import type { ActionState } from "@masteryloop/contracts";
import { createSessionClient } from "@/server/auth/client";
import { rosterContext } from "@/server/composition/roster";
import { actionFailure } from "@/server/transport/errors";

export async function signIn(_previous: ActionState, data: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, message: "Enter a valid email and password." };
  let destination: string;
  try {
    const client = await createSessionClient();
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        success: false,
        message: "We couldn't sign you in. Check your email and password, then try again.",
      };
    const { actor } = await rosterContext();
    destination = `/${actor.role.toLowerCase()}`;
  } catch (error) {
    return actionFailure(error);
  }
  redirect(destination);
}

export async function signOut() {
  const client = await createSessionClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error("Sign out failed. Please retry.");
  redirect("/login");
}
