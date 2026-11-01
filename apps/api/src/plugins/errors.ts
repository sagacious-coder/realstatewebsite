import type { FastifyError, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
}

export const errorsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Set 404 handler returning RFC 9457 Problem Details
  fastify.setNotFoundHandler(async (request, reply) => {
    const problem: ProblemDetails = {
      type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} not found`,
      instance: request.url,
    };

    return reply
      .status(404)
      .type('application/problem+json')
      .send(problem);
  });

  // Set general error handler
  fastify.setErrorHandler(async (error: FastifyError | Error | any, request, reply) => {
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;

    let title = 'Internal Server Error';
    let type = 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1';
    let detail = status === 500 ? 'An unexpected error occurred' : (error?.message ?? 'Unknown error');
    let invalidParams: Array<{ name: string; reason: string }> | undefined = undefined;

    // Check for Zod validation errors
    if (error instanceof ZodError) {
      title = 'Bad Request';
      detail = 'Request validation failed';
      invalidParams = error.issues.map((issue) => ({
        name: issue.path.join('.'),
        reason: issue.message,
      }));
    } else if (error && 'validation' in error && Array.isArray(error.validation)) {
      title = 'Bad Request';
      detail = 'Schema validation failed';
      invalidParams = error.validation.map((v: any) => ({
        name: v.instancePath || 'request',
        reason: v.message || 'Validation error',
      }));
    } else if (status === 429) {
      title = 'Too Many Requests';
      detail = 'Rate limit exceeded, please retry later';
    } else if (status === 401) {
      title = 'Unauthorized';
    } else if (status === 403) {
      title = 'Forbidden';
    }

    if (status >= 500) {
      request.log.error(error);
    } else {
      request.log.warn({ err: error, status }, detail);
    }

    const problem: ProblemDetails = {
      type,
      title,
      status,
      detail,
      instance: request.url,
      ...(invalidParams && invalidParams.length > 0 ? { invalidParams } : {}),
    };

    return reply
      .status(status)
      .type('application/problem+json')
      .send(problem);
  });
});
