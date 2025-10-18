import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '@/drizzle/schema';

declare global {
  // eslint-disable-next-line no-var
  var __drizzleClient: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }

  return postgres(url, {
    max: 10,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
  });
}

const client = globalThis.__drizzleClient ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__drizzleClient = client;
}

export const db = drizzle(client, { schema });
