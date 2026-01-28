// ===========================================
// Redis Configuration
// ===========================================

import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || 'redis_dev_password_2024',
  url:
    process.env.REDIS_URL ||
    `redis://:${process.env.REDIS_PASSWORD || 'redis_dev_password_2024'}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,

  // Cache settings
  ttl: 60 * 60, // 1 hour default TTL
  max: 100, // Maximum number of items in cache

  // Session settings
  sessionTtl: 24 * 60 * 60, // 24 hours for sessions

  // Bull queue settings (for background jobs)
  bull: {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  },
}));
