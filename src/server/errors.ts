export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PLACE_NOT_FOUND"
  | "TEAM_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "SESSION_FORBIDDEN"
  | "GAP_NOT_FOUND"
  | "GAP_PLACE_MISMATCH"
  | "RECORD_NOT_FOUND"
  | "RECORD_CONTENT_REQUIRED"
  | "RECORD_FORBIDDEN"
  | "SESSION_NOT_COLLECTING"
  | "MEDIA_NOT_FOUND"
  | "MEDIA_INVALID_TYPE"
  | "MEDIA_TOO_LARGE"
  | "MEDIA_UPLOAD_FAILED"
  | "STORAGE_NOT_CONFIGURED"
  | "VALIDATION_ERROR"
  | "CONFLICT";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function notFound(code: Extract<ErrorCode, `${string}_NOT_FOUND`>, message: string) {
  return new DomainError(code, message, 404);
}

export function forbidden(code: "FORBIDDEN" | "SESSION_FORBIDDEN", message: string) {
  return new DomainError(code, message, 403);
}
