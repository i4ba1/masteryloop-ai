import "server-only";
import { ApplicationError } from "@masteryloop/domain";
import type { ActionState } from "@masteryloop/contracts";

export function actionFailure(error: unknown): ActionState {
  const requestId = crypto.randomUUID();
  const code = error instanceof ApplicationError ? error.code : "UNAVAILABLE";
  process.stderr.write(JSON.stringify({ level: "error", code, requestId }) + "\n");
  return {
    success: false,
    message:
      error instanceof ApplicationError ? error.message : "Something went wrong. Please try again.",
    requestId,
  };
}
