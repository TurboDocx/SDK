/**
 * Error classes for TurboDocx SDK
 *
 * Each HTTP-mapped subclass carries a default `code` describing the class of failure
 * (e.g. VALIDATION_ERROR). The API often returns a *more specific* code — `QUOTE_NOT_FOUND`,
 * `SenderEmailRequired`, `RecipientNameRequired` — so `code` is overridable: the HTTP client
 * passes the server's code through when present, and the default stands otherwise. This lets
 * callers branch on the precise reason (`err.code === 'QUOTE_NOT_FOUND'`) instead of only the
 * HTTP category.
 */

export class TurboDocxError extends Error {
  public readonly statusCode?: number;
  public readonly code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'TurboDocxError';
    this.statusCode = statusCode;
    this.code = code;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends TurboDocxError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends TurboDocxError {
  constructor(
    message: string = 'Forbidden: API key lacks required permissions',
    code: string = 'AUTHORIZATION_ERROR'
  ) {
    super(message, 403, code);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends TurboDocxError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends TurboDocxError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends TurboDocxError {
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT') {
    super(message, 409, code);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends TurboDocxError {
  constructor(message: string = 'Rate limit exceeded', code: string = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends TurboDocxError {
  constructor(message: string) {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
