import { describe, it, expect } from 'vitest';
import {
  getAuthErrorMessage,
  isValidationError,
  isAuthError,
  isConflictError,
  isRateLimitError,
  isServerError,
} from '../authErrors';

function makeAxiosError(status: number, message?: string) {
  return {
    response: {
      status,
      data: message ? { message, statusCode: status } : {},
    },
    isAxiosError: true,
  };
}

describe('getAuthErrorMessage', () => {
  it('returns message from Error instance', () => {
    expect(getAuthErrorMessage(new Error('Something broke'))).toBe('Something broke');
  });

  it('returns message from axios response data', () => {
    const error = makeAxiosError(400, 'Email already exists');
    expect(getAuthErrorMessage(error)).toBe('Email already exists');
  });

  it('returns default for 401 without message', () => {
    const error = makeAxiosError(401);
    expect(getAuthErrorMessage(error)).toBe('Invalid email or password');
  });

  it('returns default for 409 without message', () => {
    const error = makeAxiosError(409);
    expect(getAuthErrorMessage(error)).toBe('Email already registered');
  });

  it('returns default for 400 without message', () => {
    const error = makeAxiosError(400);
    expect(getAuthErrorMessage(error)).toBe('Invalid input. Please check your data');
  });

  it('returns default for 429 without message', () => {
    const error = makeAxiosError(429);
    expect(getAuthErrorMessage(error)).toBe('Too many requests. Please try again later');
  });

  it('returns default for 500 without message', () => {
    const error = makeAxiosError(500);
    expect(getAuthErrorMessage(error)).toBe('Server error. Please try again later');
  });

  it('returns custom default message for unknown errors', () => {
    expect(getAuthErrorMessage('random', 'Custom default')).toBe('Custom default');
  });

  it('returns generic default for unknown errors', () => {
    expect(getAuthErrorMessage('random')).toBe('An error occurred');
  });
});

describe('isValidationError', () => {
  it('returns true for 400 status', () => {
    expect(isValidationError(makeAxiosError(400))).toBe(true);
  });

  it('returns false for 401 status', () => {
    expect(isValidationError(makeAxiosError(401))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidationError(null)).toBe(false);
  });
});

describe('isAuthError', () => {
  it('returns true for 401 status', () => {
    expect(isAuthError(makeAxiosError(401))).toBe(true);
  });

  it('returns false for 400 status', () => {
    expect(isAuthError(makeAxiosError(400))).toBe(false);
  });
});

describe('isConflictError', () => {
  it('returns true for 409 status', () => {
    expect(isConflictError(makeAxiosError(409))).toBe(true);
  });

  it('returns false for 400 status', () => {
    expect(isConflictError(makeAxiosError(400))).toBe(false);
  });
});

describe('isRateLimitError', () => {
  it('returns true for 429 status', () => {
    expect(isRateLimitError(makeAxiosError(429))).toBe(true);
  });

  it('returns false for 400 status', () => {
    expect(isRateLimitError(makeAxiosError(400))).toBe(false);
  });
});

describe('isServerError', () => {
  it('returns true for 500 status', () => {
    expect(isServerError(makeAxiosError(500))).toBe(true);
  });

  it('returns true for 503 status', () => {
    expect(isServerError(makeAxiosError(503))).toBe(true);
  });

  it('returns false for 400 status', () => {
    expect(isServerError(makeAxiosError(400))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isServerError(null)).toBe(false);
  });
});
