/**
 * Application-level error with an associated HTTP status code.
 * Services throw AppError instead of generic Error so the global
 * error-handler middleware can return the correct HTTP status.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    // Maintain correct prototype chain in transpiled code
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
