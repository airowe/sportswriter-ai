import { randomBytes } from 'crypto';

export function generateCorrelationId(): string {
  return `req_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

export function getCorrelationIdFromHeaders(headers: Headers | Record<string, any>): string | undefined {
  if (headers instanceof Headers) {
    return headers.get('x-correlation-id') || undefined;
  }
  return headers['x-correlation-id'];
}

export function setCorrelationIdHeader(headers: HeadersInit, correlationId: string): HeadersInit {
  if (headers instanceof Headers) {
    headers.set('x-correlation-id', correlationId);
    return headers;
  }
  
  if (Array.isArray(headers)) {
    return [...headers, ['x-correlation-id', correlationId]];
  }
  
  return {
    ...headers,
    'x-correlation-id': correlationId,
  };
}
