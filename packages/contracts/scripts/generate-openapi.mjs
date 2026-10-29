import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractsDir = path.resolve(__dirname, '..');
const outputPath = path.join(contractsDir, 'openapi.json');

export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Wild Hills Real Estate Public API',
      version: '1.0.0',
      description: 'Public API contract for Wild Hills Real Estate (property discovery, locations, developers, editorial content, and leads capture).',
      contact: {
        name: 'Wild Hills Engineering',
        email: 'engineering@wildhills.example',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Local development server',
      },
      {
        url: 'https://api.wildhills.example',
        description: 'Production API Gateway',
      },
    ],
    paths: {
      '/v1/listings': {
        get: {
          summary: 'Search and filter listings',
          description: 'Search properties across UAE, Turkey, Georgia, and Egypt with facets and pagination.',
          operationId: 'getListings',
          tags: ['Listings'],
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text search query across city, area, project, and developer' },
            { name: 'country', in: 'query', schema: { $ref: '#/components/schemas/CountryCode' }, description: 'ISO 2-letter country code (ae, tr, ge, eg)' },
            { name: 'city', in: 'query', schema: { type: 'string' }, description: 'City name or slug filter' },
            { name: 'area', in: 'query', schema: { type: 'string' }, description: 'District or neighborhood area slug' },
            { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/PropertyType' }, description: 'Property category' },
            { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Minimum price in specified currency' },
            { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Maximum price in specified currency' },
            { name: 'currency', in: 'query', schema: { $ref: '#/components/schemas/CurrencyCode' }, description: 'Currency for price limits and output conversion' },
            { name: 'beds', in: 'query', schema: { type: 'string' }, description: 'Bedroom count (e.g. 0, 1, 2, 3, 4+)' },
            { name: 'baths', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Minimum bathroom count' },
            { name: 'minSize', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Minimum unit area' },
            { name: 'maxSize', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Maximum unit area' },
            { name: 'sizeUnit', in: 'query', schema: { $ref: '#/components/schemas/UnitSizeUnit' }, description: 'Measurement unit: sqm or sqft' },
            { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/PropertyStatus' }, description: 'Construction status: ready, under_construction, off_plan' },
            { name: 'handoverYear', in: 'query', schema: { type: 'integer' }, description: 'Target completion year' },
            { name: 'features', in: 'query', schema: { type: 'string' }, description: 'Comma-separated feature flags (e.g. sea_view,pool)' },
            { name: 'developer', in: 'query', schema: { type: 'string' }, description: 'Developer slug' },
            { name: 'project', in: 'query', schema: { type: 'string' }, description: 'Project slug' },
            { name: 'isHotDeal', in: 'query', schema: { type: 'boolean' } },
            { name: 'isNewLaunch', in: 'query', schema: { type: 'boolean' } },
            { name: 'isVerified', in: 'query', schema: { type: 'boolean' } },
            { name: 'hasInstallments', in: 'query', schema: { type: 'boolean' } },
            { name: 'sort', in: 'query', schema: { $ref: '#/components/schemas/ListingSort' }, description: 'Sorting order' },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 12 } },
          ],
          responses: {
            '200': {
              description: 'Paginated search results with facet counts',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SearchResult' },
                },
              },
            },
            '400': {
              description: 'Invalid search parameters',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
      '/v1/listings/{slug}': {
        get: {
          summary: 'Get single listing detail',
          description: 'Retrieve complete verified property specifications, gallery, floor plans, and agent contact.',
          operationId: 'getListingBySlug',
          tags: ['Listings'],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Listing slug (e.g. wh-ae-101-marina-waterfront-penthouse)',
            },
          ],
          responses: {
            '200': {
              description: 'Detailed public listing DTO',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ListingDetail' },
                },
              },
            },
            '404': {
              description: 'Listing not found or not published',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
      '/v1/locations': {
        get: {
          summary: 'List geographical locations',
          description: 'Fetch regions, cities, and areas with listing counts and featured pin ordering.',
          operationId: 'getLocations',
          tags: ['Locations'],
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
              description: 'Filter locations by country',
            },
          ],
          responses: {
            '200': {
              description: 'Array of locations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Location' },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/developers': {
        get: {
          summary: 'List developers',
          description: 'Retrieve verified master developers and community builders.',
          operationId: 'getDevelopers',
          tags: ['Developers'],
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Array of developers',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Developer' },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/projects': {
        get: {
          summary: 'List development projects',
          description: 'Retrieve master-planned projects and off-plan towers.',
          operationId: 'getProjects',
          tags: ['Projects'],
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Array of projects',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/search/suggestions': {
        get: {
          summary: 'Smart search auto-suggestions',
          description: 'Accent-folded auto-complete suggestions grouped by cities, areas, projects, and developers.',
          operationId: 'getSearchSuggestions',
          tags: ['Search'],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', minLength: 1 },
              description: 'Search prefix query',
            },
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Grouped suggestions',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SmartSearchSuggestionGroup' },
                },
              },
            },
            '400': {
              description: 'Invalid search query',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
      '/v1/content/country-settings/{country}': {
        get: {
          summary: 'Get country settings',
          description: 'Legal disclaimer, official currency, support phone and WhatsApp for a specific country.',
          operationId: 'getCountrySettings',
          tags: ['Content'],
          parameters: [
            {
              name: 'country',
              in: 'path',
              required: true,
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Country configuration and contact parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CountrySettings' },
                },
              },
            },
            '404': {
              description: 'Unsupported country code',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
      '/v1/content/rates': {
        get: {
          summary: 'Get foreign exchange rates',
          description: 'Daily cached currency exchange rates relative to USD.',
          operationId: 'getExchangeRates',
          tags: ['Content'],
          responses: {
            '200': {
              description: 'Exchange rates table',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ExchangeRates' },
                },
              },
            },
          },
        },
      },
      '/v1/content/buying-guide/{country}': {
        get: {
          summary: 'Get country buying guide',
          description: 'Step-by-step foreign buyer acquisition and residency guide.',
          operationId: 'getBuyingGuide',
          tags: ['Content'],
          parameters: [
            {
              name: 'country',
              in: 'path',
              required: true,
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Country buying guide article',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BuyingGuide' },
                },
              },
            },
            '404': {
              description: 'Guide not found',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
      '/v1/content/faqs': {
        get: {
          summary: 'List FAQ items',
          description: 'Buyer questions and answers categorized by topic and country.',
          operationId: 'getFaqs',
          tags: ['Content'],
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Array of FAQs',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FaqItem' },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/content/testimonials': {
        get: {
          summary: 'List client testimonials',
          description: 'Verified reviews from global property investors.',
          operationId: 'getTestimonials',
          tags: ['Content'],
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Array of testimonials',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Testimonial' },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/content/blog-posts': {
        get: {
          summary: 'List blog posts',
          description: 'Editorial property market analysis and investment perspectives.',
          operationId: 'getBlogPosts',
          tags: ['Content'],
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { $ref: '#/components/schemas/CountryCode' },
            },
          ],
          responses: {
            '200': {
              description: 'Array of blog posts',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/BlogPost' },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/leads': {
        post: {
          summary: 'Submit property lead',
          description: 'Capture inquiry, viewing schedule, brochure download, or general contact lead.',
          operationId: 'createLead',
          tags: ['Leads'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LeadCreate' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Lead captured successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LeadResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error (RFC 9457)',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
      '/v1/submissions': {
        post: {
          summary: 'Submit property to sell',
          description: 'Seller submission form for homeowners looking to list with Wild Hills.',
          operationId: 'createSubmission',
          tags: ['Leads'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SubmissionCreate' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Submission registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SubmissionResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error (RFC 9457)',
              content: {
                'application/problem+json': {
                  schema: { $ref: '#/components/schemas/ProblemDetails' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        CountryCode: {
          type: 'string',
          enum: ['ae', 'tr', 'ge', 'eg'],
        },
        Locale: {
          type: 'string',
          enum: ['en', 'ar', 'tr', 'ka'],
        },
        CurrencyCode: {
          type: 'string',
          enum: ['AED', 'TRY', 'GEL', 'EGP', 'USD', 'EUR', 'GBP'],
        },
        PropertyType: {
          type: 'string',
          enum: ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'studio', 'chalet', 'land', 'commercial'],
        },
        PropertyStatus: {
          type: 'string',
          enum: ['ready', 'under_construction', 'off_plan'],
        },
        FurnishingStatus: {
          type: 'string',
          enum: ['furnished', 'semi_furnished', 'unfurnished'],
        },
        UnitSizeUnit: {
          type: 'string',
          enum: ['sqm', 'sqft'],
        },
        ListingSort: {
          type: 'string',
          enum: ['featured', 'price_asc', 'price_desc', 'newest', 'beds_asc', 'beds_desc', 'size_desc'],
        },
        LocationType: {
          type: 'string',
          enum: ['country', 'region', 'city', 'area'],
        },
        LeadType: {
          type: 'string',
          enum: ['inquiry', 'viewing', 'brochure', 'contact', 'country_no_listings'],
        },
        Coordinates: {
          type: 'object',
          required: ['lat', 'lng'],
          properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lng: { type: 'number', minimum: -180, maximum: 180 },
          },
          additionalProperties: false,
        },
        Location: {
          type: 'object',
          required: ['id', 'slug', 'name', 'type', 'countryCode', 'isFeatured', 'listingCount'],
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            name: { type: 'string' },
            type: { $ref: '#/components/schemas/LocationType' },
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            parentId: { type: 'string', nullable: true },
            isFeatured: { type: 'boolean' },
            pinOrder: { type: 'integer', nullable: true },
            coordinates: { $ref: '#/components/schemas/Coordinates', nullable: true },
            listingCount: { type: 'integer', minimum: 0 },
            coverImage: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            tagLabel: { type: 'string', nullable: true },
          },
          additionalProperties: false,
        },
        Developer: {
          type: 'object',
          required: ['id', 'slug', 'name', 'logo', 'countryCodes', 'projectCount', 'activeListingCount', 'isFeatured'],
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            name: { type: 'string' },
            logo: { type: 'string' },
            countryCodes: {
              type: 'array',
              items: { $ref: '#/components/schemas/CountryCode' },
            },
            websiteUrl: { type: 'string', format: 'uri', nullable: true },
            description: { type: 'string' },
            projectCount: { type: 'integer', minimum: 0 },
            activeListingCount: { type: 'integer', minimum: 0 },
            isFeatured: { type: 'boolean' },
          },
          additionalProperties: false,
        },
        Project: {
          type: 'object',
          required: ['id', 'slug', 'name', 'developerId', 'developerName', 'locationId', 'locationName', 'countryCode', 'heroImage', 'status', 'startingPriceMinor', 'currency'],
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            name: { type: 'string' },
            developerId: { type: 'string' },
            developerName: { type: 'string' },
            locationId: { type: 'string' },
            locationName: { type: 'string' },
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            description: { type: 'string' },
            heroImage: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            status: { $ref: '#/components/schemas/PropertyStatus' },
            handoverYear: { type: 'integer', nullable: true },
            startingPriceMinor: { type: 'number', minimum: 0 },
            currency: { $ref: '#/components/schemas/CurrencyCode' },
            paymentPlanSummary: { type: 'string', nullable: true },
          },
          additionalProperties: false,
        },
        ListingSummary: {
          type: 'object',
          required: ['id', 'refNumber', 'slug', 'title', 'propertyType', 'status', 'location', 'priceMinor', 'currency', 'priceUsdMinor', 'bedrooms', 'bathrooms', 'sizeSqm', 'sizeSqft', 'coverImage', 'isHotDeal', 'isFeatured', 'isVerified', 'isNewLaunch', 'isSample', 'badges'],
          properties: {
            id: { type: 'string' },
            refNumber: { type: 'string', example: 'WH-AE-101' },
            slug: { type: 'string' },
            title: { type: 'string' },
            propertyType: { $ref: '#/components/schemas/PropertyType' },
            status: { $ref: '#/components/schemas/PropertyStatus' },
            location: {
              type: 'object',
              required: ['id', 'countryCode', 'city'],
              properties: {
                id: { type: 'string' },
                countryCode: { $ref: '#/components/schemas/CountryCode' },
                city: { type: 'string' },
                area: { type: 'string', nullable: true },
              },
              additionalProperties: false,
            },
            developer: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              },
              nullable: true,
              additionalProperties: false,
            },
            project: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              },
              nullable: true,
              additionalProperties: false,
            },
            priceMinor: { type: 'integer', minimum: 0, description: 'Price in original currency minor units' },
            currency: { $ref: '#/components/schemas/CurrencyCode' },
            priceUsdMinor: { type: 'integer', minimum: 0, description: 'Normalized USD price in minor units' },
            bedrooms: { type: 'integer', minimum: 0 },
            bathrooms: { type: 'number', minimum: 0 },
            sizeSqm: { type: 'number', minimum: 0 },
            sizeSqft: { type: 'number', minimum: 0 },
            coverImage: { type: 'string' },
            isHotDeal: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            isNewLaunch: { type: 'boolean' },
            isSample: { type: 'boolean' },
            completionYear: { type: 'integer', nullable: true },
            furnishingStatus: { $ref: '#/components/schemas/FurnishingStatus' },
            badges: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
        ListingDetail: {
          type: 'object',
          allOf: [
            { $ref: '#/components/schemas/ListingSummary' },
            {
              type: 'object',
              required: ['description', 'images', 'floorPlans', 'features', 'agent', 'publishedAt', 'updatedAt'],
              properties: {
                description: { type: 'string' },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['url', 'order'],
                    properties: {
                      url: { type: 'string' },
                      alt: { type: 'string' },
                      caption: { type: 'string' },
                      order: { type: 'integer' },
                    },
                    additionalProperties: false,
                  },
                },
                floorPlans: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['url', 'title'],
                    properties: {
                      url: { type: 'string' },
                      title: { type: 'string' },
                      bedrooms: { type: 'integer' },
                      bathrooms: { type: 'number' },
                      sizeSqm: { type: 'number' },
                    },
                    additionalProperties: false,
                  },
                },
                features: { type: 'array', items: { type: 'string' } },
                videoUrl: { type: 'string', nullable: true },
                virtualTourUrl: { type: 'string', nullable: true },
                agent: {
                  type: 'object',
                  required: ['name', 'phone', 'whatsapp', 'email', 'avatarUrl'],
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    whatsapp: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    avatarUrl: { type: 'string' },
                    license: { type: 'string' },
                  },
                  additionalProperties: false,
                },
                paymentPlan: {
                  type: 'object',
                  required: ['downPaymentPercent'],
                  properties: {
                    downPaymentPercent: { type: 'number', minimum: 0, maximum: 100 },
                    installmentsCount: { type: 'integer' },
                    installmentDurationMonths: { type: 'integer' },
                    postHandover: { type: 'boolean' },
                    milestoneBreakdown: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['milestone', 'percent'],
                        properties: {
                          milestone: { type: 'string' },
                          percent: { type: 'number' },
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  nullable: true,
                  additionalProperties: false,
                },
                coordinates: { $ref: '#/components/schemas/Coordinates', nullable: true },
                publishedAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
              additionalProperties: false,
            },
          ],
        },
        SearchResult: {
          type: 'object',
          required: ['items', 'total', 'page', 'limit', 'totalPages', 'hasMore'],
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/ListingSummary' },
            },
            total: { type: 'integer', minimum: 0 },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            totalPages: { type: 'integer', minimum: 0 },
            hasMore: { type: 'boolean' },
            facetCounts: {
              type: 'object',
              properties: {
                byType: { type: 'object', additionalProperties: { type: 'integer' } },
                byCity: { type: 'object', additionalProperties: { type: 'integer' } },
                byStatus: { type: 'object', additionalProperties: { type: 'integer' } },
                priceRange: {
                  type: 'object',
                  required: ['minUsdMinor', 'maxUsdMinor'],
                  properties: {
                    minUsdMinor: { type: 'number' },
                    maxUsdMinor: { type: 'number' },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        SmartSearchSuggestionGroup: {
          type: 'object',
          required: ['query', 'cities', 'areas', 'projects', 'developers', 'references'],
          properties: {
            query: { type: 'string' },
            cities: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'slug', 'countryCode', 'count'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  countryCode: { $ref: '#/components/schemas/CountryCode' },
                  count: { type: 'integer' },
                },
                additionalProperties: false,
              },
            },
            areas: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'slug', 'city', 'countryCode', 'count'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  city: { type: 'string' },
                  countryCode: { $ref: '#/components/schemas/CountryCode' },
                  count: { type: 'integer' },
                },
                additionalProperties: false,
              },
            },
            projects: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'slug', 'developerName', 'countryCode', 'count'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  developerName: { type: 'string' },
                  countryCode: { $ref: '#/components/schemas/CountryCode' },
                  count: { type: 'integer' },
                },
                additionalProperties: false,
              },
            },
            developers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'slug', 'countryCode', 'count'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  countryCode: { $ref: '#/components/schemas/CountryCode' },
                  count: { type: 'integer' },
                },
                additionalProperties: false,
              },
            },
            references: {
              type: 'array',
              items: {
                type: 'object',
                required: ['refNumber', 'slug', 'title'],
                properties: {
                  refNumber: { type: 'string' },
                  slug: { type: 'string' },
                  title: { type: 'string' },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
        CountrySettings: {
          type: 'object',
          required: ['countryCode', 'currency', 'defaultLocale', 'phonePrefix', 'supportPhone', 'supportWhatsapp', 'supportEmail', 'officeAddress', 'legalDisclaimer', 'isSample'],
          properties: {
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            currency: { $ref: '#/components/schemas/CurrencyCode' },
            defaultLocale: { $ref: '#/components/schemas/Locale' },
            phonePrefix: { type: 'string' },
            supportPhone: { type: 'string' },
            supportWhatsapp: { type: 'string' },
            supportEmail: { type: 'string', format: 'email' },
            officeAddress: { type: 'string' },
            legalDisclaimer: { type: 'string' },
            isSample: { type: 'boolean' },
          },
          additionalProperties: false,
        },
        ExchangeRates: {
          type: 'object',
          required: ['base', 'timestamp', 'rates'],
          properties: {
            base: { $ref: '#/components/schemas/CurrencyCode' },
            timestamp: { type: 'string', format: 'date-time' },
            rates: {
              type: 'object',
              additionalProperties: { type: 'number' },
            },
          },
          additionalProperties: false,
        },
        BuyingGuide: {
          type: 'object',
          required: ['id', 'slug', 'countryCode', 'title', 'summary', 'contentSections', 'updatedDate', 'isSample'],
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            title: { type: 'string' },
            summary: { type: 'string' },
            contentSections: {
              type: 'array',
              items: {
                type: 'object',
                required: ['heading', 'body'],
                properties: {
                  heading: { type: 'string' },
                  body: { type: 'string' },
                },
                additionalProperties: false,
              },
            },
            updatedDate: { type: 'string' },
            isSample: { type: 'boolean' },
          },
          additionalProperties: false,
        },
        FaqItem: {
          type: 'object',
          required: ['id', 'question', 'answer', 'category'],
          properties: {
            id: { type: 'string' },
            question: { type: 'string' },
            answer: { type: 'string' },
            category: { type: 'string' },
            countryCode: { $ref: '#/components/schemas/CountryCode', nullable: true },
          },
          additionalProperties: false,
        },
        Testimonial: {
          type: 'object',
          required: ['id', 'author', 'location', 'quote', 'rating', 'countryCode', 'date'],
          properties: {
            id: { type: 'string' },
            author: { type: 'string' },
            location: { type: 'string' },
            quote: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            date: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
          },
          additionalProperties: false,
        },
        BlogPost: {
          type: 'object',
          required: ['id', 'slug', 'title', 'summary', 'content', 'coverImage', 'author', 'publishedAt', 'readingTimeMinutes', 'tags'],
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            coverImage: { type: 'string' },
            author: {
              type: 'object',
              required: ['name', 'role'],
              properties: {
                name: { type: 'string' },
                role: { type: 'string' },
                avatarUrl: { type: 'string', nullable: true },
              },
              additionalProperties: false,
            },
            publishedAt: { type: 'string', format: 'date-time' },
            readingTimeMinutes: { type: 'integer', minimum: 1 },
            countryCode: { $ref: '#/components/schemas/CountryCode', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
        LeadCreate: {
          type: 'object',
          required: ['name', 'email', 'phone', 'countryCode', 'consentGiven'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', minLength: 7, maxLength: 25 },
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            type: { $ref: '#/components/schemas/LeadType', default: 'inquiry' },
            listingId: { type: 'string' },
            propertyRef: { type: 'string' },
            budgetMin: { type: 'number', minimum: 0 },
            budgetMax: { type: 'number', minimum: 0 },
            currency: { $ref: '#/components/schemas/CurrencyCode' },
            message: { type: 'string', maxLength: 2000 },
            locale: { $ref: '#/components/schemas/Locale', default: 'en' },
            preferredContact: { type: 'string', enum: ['whatsapp', 'phone', 'email'], default: 'whatsapp' },
            consentGiven: { type: 'boolean', enum: [true] },
          },
          additionalProperties: false,
        },
        LeadResponse: {
          type: 'object',
          required: ['success', 'leadId'],
          properties: {
            success: { type: 'boolean' },
            leadId: { type: 'string' },
            message: { type: 'string' },
          },
          additionalProperties: false,
        },
        SubmissionCreate: {
          type: 'object',
          required: ['sellerName', 'sellerEmail', 'sellerPhone', 'countryCode', 'city', 'propertyType', 'bedrooms', 'bathrooms', 'sizeSqm', 'expectedPriceMinor', 'currency', 'consentGiven'],
          properties: {
            sellerName: { type: 'string', minLength: 2, maxLength: 100 },
            sellerEmail: { type: 'string', format: 'email' },
            sellerPhone: { type: 'string', minLength: 7, maxLength: 25 },
            countryCode: { $ref: '#/components/schemas/CountryCode' },
            city: { type: 'string', minLength: 1 },
            area: { type: 'string' },
            propertyType: { $ref: '#/components/schemas/PropertyType' },
            bedrooms: { type: 'integer', minimum: 0 },
            bathrooms: { type: 'number', minimum: 0 },
            sizeSqm: { type: 'number', exclusiveMinimum: 0 },
            expectedPriceMinor: { type: 'integer', exclusiveMinimum: 0 },
            currency: { $ref: '#/components/schemas/CurrencyCode' },
            description: { type: 'string', maxLength: 2000 },
            notes: { type: 'string', maxLength: 1000 },
            images: { type: 'array', items: { type: 'string' } },
            consentGiven: { type: 'boolean', enum: [true] },
          },
          additionalProperties: false,
        },
        SubmissionResponse: {
          type: 'object',
          required: ['success', 'submissionId'],
          properties: {
            success: { type: 'boolean' },
            submissionId: { type: 'string' },
            message: { type: 'string' },
          },
          additionalProperties: false,
        },
        ProblemDetails: {
          type: 'object',
          required: ['type', 'title', 'status'],
          properties: {
            type: { type: 'string', default: 'about:blank' },
            title: { type: 'string' },
            status: { type: 'integer', minimum: 100, maximum: 599 },
            detail: { type: 'string' },
            instance: { type: 'string' },
            code: { type: 'string' },
            invalidParams: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'reason'],
                properties: {
                  name: { type: 'string' },
                  reason: { type: 'string' },
                  code: { type: 'string' },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const doc = buildOpenApiDocument();
  fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`✓ Generated OpenAPI 3.1 schema at: ${outputPath}`);
}

