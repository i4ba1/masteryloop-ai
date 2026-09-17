"use server";

import { revalidatePath } from "next/cache";
import { createClass, setGuardianLink, setMembership } from "@masteryloop/application";
import { createClassSchema, guardianLinkSchema, membershipSchema } from "@masteryloop/contracts";
import type { ActionState } from "@masteryloop/contracts";
import { rosterContext } from "@/server/composition/roster";
import { actionFailure } from "@/server/transport/errors";

export async function createClassAction(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const parsed = createClassSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return { success: false, message: "Check the class name, year level, and teacher." };
  try {
    const { actor, repository } = await rosterContext();
    await createClass(actor, parsed.data, repository);
    revalidatePath("/", "layout");
    return { success: true, message: "Your class is ready." };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function membershipAction(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const parsed = membershipSchema.safeParse({
    ...Object.fromEntries(data),
    active: data.get("active") === "true",
  });
  if (!parsed.success) return { success: false, message: "Choose a class and a valid student ID." };
  try {
    const { actor, repository } = await rosterContext();
    await setMembership(actor, parsed.data, repository);
    revalidatePath("/", "layout");
    return {
      success: true,
      message: parsed.data.active ? "Student enrolled." : "Enrollment removed.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function guardianAction(_previous: ActionState, data: FormData): Promise<ActionState> {
  const parsed = guardianLinkSchema.safeParse({
    ...Object.fromEntries(data),
    active: data.get("active") === "true",
  });
  if (!parsed.success) return { success: false, message: "Choose a parent and student." };
  try {
    const { actor, repository } = await rosterContext();
    await setGuardianLink(actor, parsed.data, repository);
    revalidatePath("/", "layout");
    return {
      success: true,
      message: parsed.data.active ? "Guardian link activated." : "Guardian link removed.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}
