import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000' as any),
  DISCORD_TOKEN: z.string().min(1, 'Discord Bot Token is required'),
  CLIENT_ID: z.string().min(1, 'Discord Client ID is required'),
  OWNER_ID: z.string().min(1, 'Owner ID is required'),
  MONGODB_URI: z.string().url('A valid MongoDB URI is required'),
  REDIS_URL: z.string().url('A valid Redis URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters long'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();