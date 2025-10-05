import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Allow build-time execution without throwing
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Return a placeholder config during build time
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      // Only throw in production runtime (not build time)
      throw new Error(
        'Invalid backend configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
      );
    }
    // Return placeholder for build time
    return {
      supabase: {
        url: 'https://placeholder.supabase.co',
        serviceRoleKey: 'placeholder',
      },
    };
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
