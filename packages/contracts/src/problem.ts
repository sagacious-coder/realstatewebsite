import { z } from 'zod';

export const InvalidParamSchema = z
  .object({
    name: z.string().describe('Parameter or field name with the violation'),
    reason: z.string().describe('Human-readable description of the error'),
    code: z.string().optional().describe('Machine-readable error rule code'),
  })
  .strict();

export type InvalidParam = z.infer<typeof InvalidParamSchema>;

/**
 * RFC 9457 Problem Details Schema for HTTP APIs
 */
export const ProblemDetailsSchema = z
  .object({
    type: z.string().default('about:blank').describe('URI reference identifying the problem type'),
    title: z.string().describe('Short summary of the problem type'),
    status: z.number().int().min(100).max(599).describe('HTTP status code'),
    detail: z.string().optional().describe('Human-readable explanation of this error occurrence'),
    instance: z.string().optional().describe('URI identifying this specific request/error instance'),
    code: z.string().optional().describe('Internal machine-readable error classification code'),
    invalidParams: z.array(InvalidParamSchema).optional().describe('Validation error breakdown'),
  })
  .strict();

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export function createProblemDetails(params: {
  status: number;
  title: string;
  detail?: string;
  type?: string;
  instance?: string;
  code?: string;
  invalidParams?: InvalidParam[];
}): ProblemDetails {
  return ProblemDetailsSchema.parse({
    type: params.type || 'about:blank',
    title: params.title,
    status: params.status,
    detail: params.detail,
    instance: params.instance,
    code: params.code,
    invalidParams: params.invalidParams,
  });
}

