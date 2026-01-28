// ===========================================
// Mail (SMTP) Configuration
// ===========================================

import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  // SMTP settings
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT ?? '1025', 10), // MailHog default for dev
  secure: process.env.SMTP_SECURE === 'true',

  // Authentication
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },

  // Sender defaults
  defaults: {
    from: {
      name: process.env.SMTP_FROM_NAME || 'SmartProperty',
      address: process.env.SMTP_FROM_EMAIL || 'noreply@smartproperty.com',
    },
  },

  // Template settings
  template: {
    dir: 'src/templates/emails',
    adapter: 'handlebars',
    options: {
      strict: true,
    },
  },
}));
