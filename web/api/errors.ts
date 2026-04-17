/**
 * PG error hierarchy. Callers should prefer `instanceof` checks over inspecting
 * `resultCode` directly — the subclass already encodes the meaningful category.
 *
 * The fetch helpers in `client.ts` translate pgw's JSON envelope
 * `{ resultCode, error: { errorReason } }` into one of these, then apply
 * side-effects (redirect for session, toast for generic) before rethrowing.
 * Callers can catch specific subclasses for domain handling (e.g. validation
 * errors render inline instead of as toasts).
 */

export class PGError extends Error {
  readonly resultCode: number;
  readonly httpStatus: number;

  constructor(message: string, resultCode: number, httpStatus: number) {
    super(message);
    this.name = 'PGError';
    this.resultCode = resultCode;
    this.httpStatus = httpStatus;
  }
}

/** -401 / -4012 — session expired or wrong session type. */
export class PGSessionExpiredError extends PGError {
  constructor(message: string, resultCode: number, httpStatus: number) {
    super(message, resultCode, httpStatus);
    this.name = 'PGSessionExpiredError';
  }
}

/** -404 — resource not found. */
export class PGNotFoundError extends PGError {
  constructor(message: string, resultCode: number, httpStatus: number) {
    super(message, resultCode, httpStatus);
    this.name = 'PGNotFoundError';
  }
}

/**
 * -400 / -4001 / -4003 / -4004 — client-side validation failure.
 * Container code should catch this and render as inline field errors; do not
 * toast from the global handler.
 */
export class PGValidationError extends PGError {
  constructor(message: string, resultCode: number, httpStatus: number) {
    super(message, resultCode, httpStatus);
    this.name = 'PGValidationError';
  }
}
