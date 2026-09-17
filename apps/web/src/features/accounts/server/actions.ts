"use server";
import { revalidatePath } from "next/cache";
import { createAccount, updateAccount } from "@masteryloop/application";
import { createAccountSchema, updateAccountSchema } from "@masteryloop/contracts";
import type { ActionState } from "@masteryloop/contracts";
import { accountContext, accountIdentity } from "@/server/composition/accounts";
import { actionFailure } from "@/server/transport/errors";
export async function createAccountAction(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const parsed = createAccountSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return {
      success: false,
      message: "Check account details; the initial password must have 12�128 characters.",
    };
  try {
    const { actor, repository } = await accountContext();
    const id = await createAccount(actor, parsed.data, repository, accountIdentity());
    revalidatePath("/admin");
    return { success: true, message: `Account ready. Account ID: ${id}` };
  } catch (error) {
    return actionFailure(error);
  }
}
export async function updateAccountAction(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const parsed = updateAccountSchema.safeParse({
    ...Object.fromEntries(data),
    active: data.get("active") === "true",
  });
  if (!parsed.success)
    return {
      success: false,
      message: "Check the account details and provide a reason of at least 5 characters.",
    };
  try {
    const { actor, repository } = await accountContext();
    await updateAccount(actor, parsed.data, repository);
    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Account updated. Disabled relationships must be restored explicitly.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}
