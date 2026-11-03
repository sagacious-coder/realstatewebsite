import { createHash } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export interface CachingConfig {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

declare module 'fastify' {
  interface FastifyReply {
    setCacheHeaders(config: CachingConfig): this;
  }
}

export const cachingPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorateReply('setCacheHeaders', function (this: any, config: CachingConfig) {
    const maxAge = config.maxAge ?? 60;
    const sMaxAge = config.sMaxAge ?? 300;
    const swr = config.staleWhileRevalidate ?? 86400;

    this.header(
      'cache-control',
      `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
    );

    if (config.tags && config.tags.length > 0) {
      this.header('x-cache-tags', config.tags.join(', '));
    }

    return this;
  });

  fastify.addHook('onSend', async (request, reply, payload) => {
    // Only handle GET requests that returned 200 OK
    if (request.method !== 'GET' || reply.statusCode !== 200) {
      return payload;
    }

    // Do not overwrite existing ETag
    let etag = reply.getHeader('etag') as string | undefined;

    if (!etag && typeof payload === 'string') {
      const hash = createHash('sha256').update(payload).digest('hex').substring(0, 16);
      etag = `W/"${hash}"`;
      reply.header('etag', etag);
    }

    if (etag) {
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch) {
        const clientEtags = ifNoneMatch.split(',').map((s) => s.trim());
        if (clientEtags.includes(etag) || clientEtags.includes('*')) {
          reply.code(304);
          return '';
        }
      }
    }

    return payload;
  });
});

