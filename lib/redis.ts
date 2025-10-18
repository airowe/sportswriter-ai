import type { RedisOptions } from 'ioredis';

let cachedOptions: RedisOptions | null = null;

function parseRedisUrl(urlString: string): RedisOptions {
  const url = new URL(urlString);
  const isSecure = url.protocol === 'rediss:';
  const port = url.port ? Number(url.port) : isSecure ? 6380 : 6379;
  const db = url.pathname ? Number(url.pathname.replace('/', '') || 0) : 0;

  return {
    host: url.hostname,
    port,
    username: url.username || undefined,
    password: url.password || undefined,
    db: Number.isNaN(db) ? 0 : db,
    tls: isSecure ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export function getRedisConnectionOptions(): RedisOptions {
  if (cachedOptions) {
    return cachedOptions;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not configured');
  }

  cachedOptions = parseRedisUrl(url);
  return cachedOptions;
}
