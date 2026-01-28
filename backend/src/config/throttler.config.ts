// ===========================================
// Throttler (Rate Limiting) Configuration
// ===========================================

import { registerAs } from '@nestjs/config';

export const throttlerConfig = registerAs('throttler', () => ({
  // Global rate limiting
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10), // Time window in seconds
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10), // Max requests per window

  // Endpoint-specific limits
  endpoints: {
    // Authentication endpoints (stricter limits)
    auth: {
      ttl: 60,
      limit: 10, // 10 login attempts per minute
    },

    // API endpoints
    api: {
      ttl: 60,
      limit: 100,
    },

    // File upload endpoints
    upload: {
      ttl: 60,
      limit: 20,
    },

    // Search endpoints
    search: {
      ttl: 60,
      limit: 50,
    },
  },

  // Skip throttling for these IPs (development)
  skipIf: process.env.NODE_ENV === 'development' ? false : false,

  // Error message
  errorMessage: 'Too many requests, please try again later.',
}));
