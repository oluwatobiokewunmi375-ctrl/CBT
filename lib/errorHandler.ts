// lib/errorHandler.ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: string;
  requestId: string;
  timestamp: string;
  stack?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number = 500,
    public errorCode: string = 'INTERNAL_ERROR',
    message: string = 'An unexpected error occurred'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTH_ERROR', message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, 'RATE_LIMIT', message);
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'SERVER_ERROR', message);
  }
}

// Error logging utility
export async function logError(
  error: any,
  context?: {
    userId?: string;
    endpoint?: string;
    method?: string;
    body?: any;
  }
) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    message: error.message,
    code: error.errorCode || 'UNKNOWN',
    statusCode: error.statusCode || 500,
    context,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', errorEntry);
  }

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        request: context,
      },
    });
  }

  return errorEntry;
}

// Error response handler for API routes
export function createErrorResponse(
  error: any,
  requestId: string = crypto.randomUUID()
): NextResponse<ErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorCode: error.errorCode,
        requestId,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: error.statusCode }
    );
  }

  // Unknown error
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_ERROR';

  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      errorCode,
      requestId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: error.stack }),
    },
    { status: statusCode }
  );
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (req: any, context?: any) => Promise<NextResponse>
) {
  return async (req: any, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      const requestId = crypto.randomUUID();
      await logError(error, {
        endpoint: req.url,
        method: req.method,
      });
      return createErrorResponse(error, requestId);
    }
  };
}
