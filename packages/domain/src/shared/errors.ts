export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "UNAVAILABLE";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
