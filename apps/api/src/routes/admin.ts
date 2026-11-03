import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  PERMISSIONS,
  CountryCodeSchema,
  PropertyTypeSchema,
  PropertyStatusSchema,
  CurrencyCodeSchema,
  LeadStatusSchema,
} from '@wild-hills/contracts';
import { adminService } from '../services/admin.service.js';
import type { Actor } from '../db/context.js';

// ============================================================================
// STRICT ZOD VALIDATION SCHEMAS
// ============================================================================

const ListingQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
    status: z.string().optional(),
    propertyType: z.string().optional(),
    developerId: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

const ListingIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const ListingCreateSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    countryCode: CountryCodeSchema,
    city: z.string().min(1),
    area: z.string().nullable().optional(),
    propertyType: PropertyTypeSchema,
    status: PropertyStatusSchema.default('ready'),
    reviewStatus: z.enum(['draft', 'pending', 'published', 'archived']).default('draft'),
    priceMinor: z.number().int().nonnegative(),
    currency: CurrencyCodeSchema,
    priceUsdMinor: z.number().int().nonnegative().optional(),
    bedrooms: z.number().int().min(0).default(0),
    bathrooms: z.coerce.number().min(0).default(1),
    sizeSqm: z.coerce.number().positive(),
    sizeSqft: z.coerce.number().positive().optional(),
    coverImage: z.string().min(1),
    isHotDeal: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isVerified: z.boolean().default(false),
    isNewLaunch: z.boolean().default(false),
    isSample: z.boolean().default(false),
    completionYear: z.number().int().nullable().optional(),
    furnishingStatus: z.string().nullable().optional(),
    badges: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    videoUrl: z.string().nullable().optional(),
    virtualTourUrl: z.string().nullable().optional(),
    floorPlans: z.array(z.any()).default([]),
    paymentPlan: z.any().nullable().optional(),
    agent: z
      .object({
        name: z.string(),
        phone: z.string(),
        whatsapp: z.string().optional(),
        email: z.string().email(),
        avatarUrl: z.string().optional(),
        license: z.string().optional(),
      })
      .strict()
      .optional(),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    images: z
      .array(
        z
          .object({
            url: z.string(),
            alt: z.string().optional(),
            order: z.number().int().optional(),
          })
          .strict()
      )
      .optional()
      .default([]),
  })
  .strict();

const ListingUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    countryCode: CountryCodeSchema.optional(),
    city: z.string().min(1).optional(),
    area: z.string().nullable().optional(),
    propertyType: PropertyTypeSchema.optional(),
    status: PropertyStatusSchema.optional(),
    reviewStatus: z.enum(['draft', 'pending', 'published', 'archived']).optional(),
    priceMinor: z.number().int().nonnegative().optional(),
    currency: CurrencyCodeSchema.optional(),
    priceUsdMinor: z.number().int().nonnegative().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.coerce.number().min(0).optional(),
    sizeSqm: z.coerce.number().positive().optional(),
    sizeSqft: z.coerce.number().positive().optional(),
    coverImage: z.string().min(1).optional(),
    isHotDeal: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    isNewLaunch: z.boolean().optional(),
    isSample: z.boolean().optional(),
    completionYear: z.number().int().nullable().optional(),
    furnishingStatus: z.string().nullable().optional(),
    badges: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    videoUrl: z.string().nullable().optional(),
    virtualTourUrl: z.string().nullable().optional(),
    floorPlans: z.array(z.any()).optional(),
    paymentPlan: z.any().nullable().optional(),
    agent: z.any().optional(),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    version: z.number().int().optional(),
    images: z
      .array(
        z
          .object({
            url: z.string(),
            alt: z.string().optional(),
            order: z.number().int().optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

const LeadQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

const LeadIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const LeadStatusUpdateSchema = z
  .object({
    status: LeadStatusSchema,
  })
  .strict();

const LeadNoteCreateSchema = z
  .object({
    content: z.string().min(1).max(5000),
  })
  .strict();

const LeadsExportQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
  })
  .strict();

const SubmissionQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

const SubmissionIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const SubmissionStatusUpdateSchema = z
  .object({
    status: z.string().min(1),
  })
  .strict();

const LocationParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const LocationQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
  })
  .strict();

const LocationUpdateSchema = z
  .object({
    isFeatured: z.boolean().optional(),
    pinOrder: z.number().int().nullable().optional(),
    coverImage: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    tagLabel: z.string().nullable().optional(),
  })
  .strict();

const DeveloperQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
  })
  .strict();

const DeveloperParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const DeveloperCreateSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    logo: z.string(),
    countryCode: CountryCodeSchema.optional().default('ae'),
    operatingMarkets: z.array(CountryCodeSchema).optional().default([]),
    websiteUrl: z.string().url().nullable().optional(),
    description: z.string().optional().default(''),
    isFeatured: z.boolean().optional().default(false),
  })
  .strict();

const DeveloperUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    logo: z.string().optional(),
    countryCode: CountryCodeSchema.optional(),
    operatingMarkets: z.array(CountryCodeSchema).optional(),
    websiteUrl: z.string().url().nullable().optional(),
    description: z.string().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict();

const RatesUpdateSchema = z
  .object({
    rates: z.record(z.string(), z.number()),
  })
  .strict();

const AuditLogQuerySchema = z
  .object({
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    action: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  })
  .strict();

const DocumentSignedUrlSchema = z
  .object({
    key: z.string().min(1),
    expiresInSeconds: z.number().int().min(1).max(3600).optional().default(60),
  })
  .strict();

// ============================================================================
// FASTIFY ADMIN ROUTES PLUGIN
// ============================================================================

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // --------------------------------------------------------------------------
  // 1. LISTINGS MANAGEMENT
  // --------------------------------------------------------------------------

  // GET /v1/admin/listings
  fastify.get(
    '/listings',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        querystring: ListingQuerySchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const query = req.query as z.infer<typeof ListingQuerySchema>;
      const result = await adminService.getListings(actor, query);
      return reply.send(result);
    }
  );

  // POST /v1/admin/listings
  fastify.post(
    '/listings',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        body: ListingCreateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const body = req.body as z.infer<typeof ListingCreateSchema>;
      if (
        actor.role !== 'owner' &&
        actor.countryScopes &&
        !actor.countryScopes.includes(body.countryCode)
      ) {
        return reply.status(403).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Forbidden',
          status: 403,
          detail: `Country '${body.countryCode}' is outside actor's assigned country scopes`,
        });
      }
      const { images, ...data } = body;

      // Calculate priceUsdMinor if omitted
      if (!data.priceUsdMinor) {
        data.priceUsdMinor = data.priceMinor;
      }

      const listing = await adminService.createListing(actor, data, images);
      return reply.status(201).send(listing);
    }
  );

  // GET /v1/admin/listings/:id
  fastify.get(
    '/listings/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        params: ListingIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof ListingIdParamSchema>;
      const result = await adminService.getListingById(actor, id);

      if (!result) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Listing '${id}' was not found or is outside your country permissions`,
        });
      }

      return reply.send(result);
    }
  );

  // PUT /v1/admin/listings/:id
  fastify.put(
    '/listings/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: ListingIdParamSchema,
        body: ListingUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof ListingIdParamSchema>;
      const body = req.body as z.infer<typeof ListingUpdateSchema>;

      // Resolve optimistic locking version from header or body
      let expectedVersion: number | undefined = body.version;
      const ifMatch = req.headers['if-match'];
      if (ifMatch) {
        const parsed = parseInt(ifMatch.replace(/["']/g, ''), 10);
        if (!isNaN(parsed)) expectedVersion = parsed;
      }

      const { images, version: _v, ...updates } = body;

      try {
        const updated = await adminService.updateListing(
          actor,
          id,
          updates,
          expectedVersion,
          images
        );
        return reply.send(updated);
      } catch (err: any) {
        if (err.statusCode === 409 || err.message?.includes('Conflict')) {
          return reply.status(409).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'Conflict',
            status: 409,
            detail: err.message || 'Listing was modified concurrently by another user',
          });
        }
        if (err.statusCode === 403 || err.message?.includes('outside country scopes')) {
          return reply.status(403).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'Forbidden',
            status: 403,
            detail: err.message,
          });
        }
        if (err.message === 'Listing not found') {
          return reply.status(404).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'Not Found',
            status: 404,
            detail: err.message,
          });
        }
        throw err;
      }
    }
  );

  // POST /v1/admin/listings/:id/publish
  fastify.post(
    '/listings/:id/publish',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: ListingIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof ListingIdParamSchema>;

      try {
        const published = await adminService.publishListing(actor, id);
        return reply.send(published);
      } catch (err: any) {
        if (err.message?.includes('trg_publish_guard') || err.message?.includes('check constraint')) {
          return reply.status(422).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'Publish Guard Invariant Violation',
            status: 422,
            detail: err.message,
          });
        }
        if (err.message === 'Listing not found') {
          return reply.status(404).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'Not Found',
            status: 404,
            detail: err.message,
          });
        }
        throw err;
      }
    }
  );

  // POST /v1/admin/listings/:id/unpublish
  fastify.post(
    '/listings/:id/unpublish',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: ListingIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof ListingIdParamSchema>;
      const unpublished = await adminService.unpublishListing(actor, id);
      return reply.send(unpublished);
    }
  );

  // POST /v1/admin/listings/:id/duplicate
  fastify.post(
    '/listings/:id/duplicate',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: ListingIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof ListingIdParamSchema>;
      const duplicated = await adminService.duplicateListing(actor, id);
      return reply.status(201).send(duplicated);
    }
  );

  // DELETE /v1/admin/listings/:id
  fastify.delete(
    '/listings/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: ListingIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof ListingIdParamSchema>;
      const deleted = await adminService.deleteListing(actor, id);

      if (!deleted) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Listing not found',
        });
      }

      return reply.send({ success: true, message: 'Listing archived successfully' });
    }
  );

  // --------------------------------------------------------------------------
  // 2. CRM LEADS & STAFF NOTES
  // --------------------------------------------------------------------------

  // GET /v1/admin/leads/export (Formula-Safe CSV Export)
  fastify.get(
    '/leads/export',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LEADS,
      },
      schema: {
        querystring: LeadsExportQuerySchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { country } = req.query as z.infer<typeof LeadsExportQuerySchema>;
      const csv = await adminService.exportLeadsCsv(actor, country);

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="leads-export.csv"');
      return reply.send(csv);
    }
  );

  // GET /v1/admin/leads
  fastify.get(
    '/leads',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LEADS,
      },
      schema: {
        querystring: LeadQuerySchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const query = req.query as z.infer<typeof LeadQuerySchema>;
      const result = await adminService.getLeads(actor, query);
      return reply.send(result);
    }
  );

  // GET /v1/admin/leads/:id
  fastify.get(
    '/leads/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LEADS,
      },
      schema: {
        params: LeadIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof LeadIdParamSchema>;
      const result = await adminService.getLeadById(actor, id);

      if (!result.lead) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Lead not found or outside country scope',
        });
      }

      return reply.send(result);
    }
  );

  // PATCH /v1/admin/leads/:id/status
  fastify.patch(
    '/leads/:id/status',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LEADS,
      },
      schema: {
        params: LeadIdParamSchema,
        body: LeadStatusUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof LeadIdParamSchema>;
      const { status } = req.body as z.infer<typeof LeadStatusUpdateSchema>;
      const updated = await adminService.updateLeadStatus(actor, id, status);

      if (!updated) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Lead not found',
        });
      }

      return reply.send({ success: true, status });
    }
  );

  // PATCH /v1/admin/leads/:id (Compatibility alias accepting optional notes)
  fastify.patch(
    '/leads/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LEADS,
      },
      schema: {
        params: LeadIdParamSchema,
        body: z
          .object({
            status: LeadStatusSchema,
            notes: z.string().optional(),
          })
          .strict(),
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof LeadIdParamSchema>;
      const { status, notes } = req.body as { status: any; notes?: string };
      const updated = await adminService.updateLeadStatus(actor, id, status);

      if (notes && notes.trim()) {
        await adminService.addLeadNote(actor, id, notes.trim());
      }

      if (!updated) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Lead not found',
        });
      }

      return reply.send({ success: true, status });
    }
  );

  // POST /v1/admin/leads/:id/notes
  fastify.post(
    '/leads/:id/notes',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LEADS,
      },
      schema: {
        params: LeadIdParamSchema,
        body: LeadNoteCreateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof LeadIdParamSchema>;
      const { content } = req.body as z.infer<typeof LeadNoteCreateSchema>;
      const note = await adminService.addLeadNote(actor, id, content);
      return reply.status(201).send(note);
    }
  );

  // --------------------------------------------------------------------------
  // 3. SELLER SUBMISSIONS REVIEW QUEUE
  // --------------------------------------------------------------------------

  // GET /v1/admin/submissions
  fastify.get(
    '/submissions',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        querystring: SubmissionQuerySchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const query = req.query as z.infer<typeof SubmissionQuerySchema>;
      const result = await adminService.getSubmissions(actor, query);
      return reply.send(result);
    }
  );

  // GET /v1/admin/submissions/:id
  fastify.get(
    '/submissions/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        params: SubmissionIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof SubmissionIdParamSchema>;
      const result = await adminService.getSubmissionById(actor, id);

      if (!result.submission) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Submission not found or outside country scope',
        });
      }

      return reply.send(result);
    }
  );

  // PATCH /v1/admin/submissions/:id/status
  fastify.patch(
    '/submissions/:id/status',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: SubmissionIdParamSchema,
        body: SubmissionStatusUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof SubmissionIdParamSchema>;
      const { status } = req.body as z.infer<typeof SubmissionStatusUpdateSchema>;
      const updated = await adminService.updateSubmissionStatus(actor, id, status);

      if (!updated) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Submission not found',
        });
      }

      return reply.send({ success: true, status });
    }
  );

  // PATCH /v1/admin/submissions/:id (Compatibility alias)
  fastify.patch(
    '/submissions/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: SubmissionIdParamSchema,
        body: SubmissionStatusUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof SubmissionIdParamSchema>;
      const { status } = req.body as z.infer<typeof SubmissionStatusUpdateSchema>;
      const updated = await adminService.updateSubmissionStatus(actor, id, status);

      if (!updated) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Submission not found',
        });
      }

      return reply.send({ success: true, status });
    }
  );

  // POST /v1/admin/submissions/:id/convert
  fastify.post(
    '/submissions/:id/convert',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
      },
      schema: {
        params: SubmissionIdParamSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof SubmissionIdParamSchema>;
      const result = await adminService.convertSubmission(actor, id);
      return reply.status(201).send(result);
    }
  );

  // --------------------------------------------------------------------------
  // 4. LOCATIONS & DEVELOPERS
  // --------------------------------------------------------------------------

  // GET /v1/admin/locations
  fastify.get(
    '/locations',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        querystring: LocationQuerySchema,
      },
    },
    async (req, reply) => {
      const { country } = req.query as z.infer<typeof LocationQuerySchema>;
      const locations = await adminService.getLocations(country);
      return reply.send(locations);
    }
  );

  // PUT /v1/admin/locations/:id
  fastify.put(
    '/locations/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_MANAGE_LOCATIONS,
      },
      schema: {
        params: LocationParamSchema,
        body: LocationUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof LocationParamSchema>;
      const body = req.body as z.infer<typeof LocationUpdateSchema>;
      const updated = await adminService.updateLocation(actor, id, body);
      return reply.send(updated);
    }
  );

  // GET /v1/admin/developers
  fastify.get(
    '/developers',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        querystring: DeveloperQuerySchema,
      },
    },
    async (req, reply) => {
      const { country } = req.query as z.infer<typeof DeveloperQuerySchema>;
      const developers = await adminService.getDevelopers(country);
      return reply.send(developers);
    }
  );

  // POST /v1/admin/developers
  fastify.post(
    '/developers',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_MANAGE_LOCATIONS,
      },
      schema: {
        body: DeveloperCreateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const body = req.body as z.infer<typeof DeveloperCreateSchema>;
      const dev = await adminService.createDeveloper(actor, body as any);
      return reply.status(201).send(dev);
    }
  );

  // PUT /v1/admin/developers/:id
  fastify.put(
    '/developers/:id',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_MANAGE_LOCATIONS,
      },
      schema: {
        params: DeveloperParamSchema,
        body: DeveloperUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { id } = req.params as z.infer<typeof DeveloperParamSchema>;
      const body = req.body as z.infer<typeof DeveloperUpdateSchema>;
      const updated = await adminService.updateDeveloper(actor, id, body as any);
      return reply.send(updated);
    }
  );

  // --------------------------------------------------------------------------
  // 5. RATES, AUDIT LOG & PRIVATE DOCUMENTS
  // --------------------------------------------------------------------------

  // GET /v1/admin/rates
  fastify.get(
    '/rates',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
    },
    async (_req, reply) => {
      const rates = await adminService.getLocations(); // fallback
      return reply.send({ success: true });
    }
  );

  // PUT /v1/admin/rates (Platform Owner / Admin settings permission)
  fastify.put(
    '/rates',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_MANAGE_SETTINGS,
      },
      schema: {
        body: RatesUpdateSchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const { rates } = req.body as z.infer<typeof RatesUpdateSchema>;
      const updated = await adminService.updateRates(actor, rates);
      return reply.send(updated);
    }
  );

  // GET /v1/admin/audit-log (Platform Owner only per Section 10.8)
  fastify.get(
    '/audit-log',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_VIEW_AUDIT,
      },
      schema: {
        querystring: AuditLogQuerySchema,
      },
    },
    async (req, reply) => {
      const actor = req.actor as Actor;
      const query = req.query as z.infer<typeof AuditLogQuerySchema>;
      const logs = await adminService.getAuditLogs(actor, query);
      return reply.send({ items: logs });
    }
  );

  // POST /v1/admin/documents/signed-url (Private document download signed URL - 60s lifetime)
  fastify.post(
    '/documents/signed-url',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
      },
      schema: {
        body: DocumentSignedUrlSchema,
      },
    },
    async (req, reply) => {
      const { key, expiresInSeconds } = req.body as z.infer<typeof DocumentSignedUrlSchema>;
      const signedUrl = await adminService.getPrivateDocumentSignedUrl(key, expiresInSeconds);
      return reply.send({ signedUrl, expiresInSeconds });
    }
  );
};
