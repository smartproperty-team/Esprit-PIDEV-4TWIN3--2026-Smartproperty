// ===========================================
// JWT (Authentication) Configuration
// ===========================================

import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  // Access token settings
  secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRATION || '1d',

  // Refresh token settings
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'default_refresh_secret_change_in_production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',

  // Token settings
  issuer: 'SmartProperty',
  audience: 'smartproperty-users',

  // Cookie settings (for refresh token)
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
}));
