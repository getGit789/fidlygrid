import type { Config } from 'drizzle-kit';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: new URL(process.env.DATABASE_URL).hostname,
    user: new URL(process.env.DATABASE_URL).username,
    password: new URL(process.env.DATABASE_URL).password,
    database: new URL(process.env.DATABASE_URL).pathname.slice(1),
    port: Number(new URL(process.env.DATABASE_URL).port),
    ssl: 'require'  // Always require SSL for Railway
  }
} satisfies Config;
