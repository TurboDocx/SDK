/**
 * Error classes for TurboDocx SDK
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
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends TurboDocxError {
  constructor(message: string = 'Forbidden: API key lacks required permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends TurboDocxError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends TurboDocxError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends TurboDocxError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends TurboDocxError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends TurboDocxError {
  constructor(message: string) {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
