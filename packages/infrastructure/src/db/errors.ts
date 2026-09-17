import { ApplicationError } from "@masteryloop/domain";
export function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "42501")
    throw new ApplicationError(
      "FORBIDDEN",
      "This operation requires an authorized account. For account changes, sign out and sign in again within 15 minutes.",
    );
  if (error.code === "23505" || error.code === "40001")
    throw new ApplicationError(
      "CONFLICT",
      "The record already exists or has changed. Reload before trying again.",
    );
  if (error.code === "23514" || error.code === "22P02")
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Check the submitted values. Role changes require removing active class, enrollment, and guardian relationships first.",
    );
  if (error.code === "P0001")
    throw new ApplicationError("UNAVAILABLE", "Please wait a minute before trying again.");
  throw new ApplicationError(
    "UNAVAILABLE",
    "We couldn't reach your learning space. Please try again.",
  );
}
