import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'authorization',
  'cookie',
  'set-cookie',
  'apiKey',
  'password',
  'token',
  '*.password',
  '*.token',
  'email',
  'phone',
  'message',
  'req.body.password',
  'req.body.token',
  'req.body.email',
  'req.body.phone',
  'req.body.message',
];

export const loggingPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Ensure request ID is generated and attached to response headers
  fastify.addHook('onRequest', async (request, reply) => {
    const headerReqId = request.headers['x-request-id'];
    const reqId = typeof headerReqId === 'string' && headerReqId.length > 0 
      ? headerReqId 
      : randomUUID();
    request.id = reqId;
    void reply.header('x-request-id', reqId);
  });
});

