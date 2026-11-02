import { createHash } from 'node:crypto';
import pg from 'pg';
import {
  FIXTURE_DEVELOPERS,
  FIXTURE_LOCATIONS,
  FIXTURE_PROJECTS,
  FIXTURE_LISTINGS,
  FIXTURE_LEADS,
  FIXTURE_SUBMISSIONS,
  FIXTURE_EXCHANGE_RATES,
} from '@wild-hills/contracts/fixtures';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';
import { drizzle } from 'drizzle-orm/node-postgres';

export function toFixtureUuid(fixtureId: string): string {
  const hash = createHash('sha256').update(fixtureId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '7' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

export interface SeedResult {
  locationsCount: number;
  developersCount: number;
  projectsCount: number;
  listingsCount: number;
  listingImagesCount: number;
  leadsCount: number;
  submissionsCount: number;
  exchangeRatesCount: number;
}

export async function runSeed(dbInstance: any): Promise<SeedResult> {
  const devIdMap = new Map<string, string>();
  const locIdMap = new Map<string, string>();
  const projIdMap = new Map<string, string>();

  // 1. Seed Exchange Rates
  await dbInstance
    .insert(schema.exchangeRates)
    .values({
      base: 'USD',
      rates: FIXTURE_EXCHANGE_RATES.rates,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  // 2. Seed Developers
  const devRows = FIXTURE_DEVELOPERS.map((dev: any) => {
    const id = toFixtureUuid(dev.id);
    devIdMap.set(dev.id, id);
    const countryCode = dev.countryCode || (dev.countryCodes && dev.countryCodes[0]) || 'ae';
    return {
      id,
      slug: dev.slug,
      name: dev.name,
      countryCode,
      logo: dev.logo || dev.logoUrl,
      description: dev.description,
      foundedYear: dev.foundedYear,
      website: dev.website || dev.websiteUrl,
      activeProjects: dev.activeProjectsCount || dev.activeProjects || 0,
      escrowCertified: dev.escrowCertified ?? true,
      operatingMarkets: dev.operatingMarkets || dev.countryCodes || [],
      version: 1,
    };
  });

  if (devRows.length > 0) {
    await dbInstance.insert(schema.developers).values(devRows).onConflictDoNothing();
  }

  // 3. Seed Locations (two passes: first without parent_id to avoid FK ordering issues)
  const locRows = FIXTURE_LOCATIONS.map((loc) => {
    const id = toFixtureUuid(loc.id);
    locIdMap.set(loc.id, id);
    return {
      id,
      slug: loc.slug,
      countryCode: loc.countryCode,
      type: loc.type,
      parentId: null, // assigned in pass 2 if parent exists
      name: loc.name,
      tagline: loc.name,
      description: loc.description ?? `${loc.name} premier real estate destination.`,
      image: loc.coverImage,
      bannerImage: loc.coverImage,
      latitude: loc.coordinates?.lat ? String(loc.coordinates.lat) : null,
      longitude: loc.coordinates?.lng ? String(loc.coordinates.lng) : null,
      isFeatured: loc.isFeatured,
      featuredOrder: loc.pinOrder ?? null,
      isPinned: loc.isFeatured,
      totalProjects: loc.listingCount ?? 0,
      version: 1,
    };
  });

  if (locRows.length > 0) {
    await dbInstance.insert(schema.locations).values(locRows).onConflictDoNothing();
  }

  // 4. Seed Projects
  const projRows = FIXTURE_PROJECTS.map((proj: any) => {
    const id = toFixtureUuid(proj.id);
    projIdMap.set(proj.id, id);
    return {
      id,
      slug: proj.slug,
      name: proj.name,
      developerId: proj.developerId ? devIdMap.get(proj.developerId) ?? null : null,
      locationId: proj.locationId ? locIdMap.get(proj.locationId) ?? null : null,
      countryCode: proj.countryCode,
      description: proj.description,
      status: proj.status,
      completionYear: proj.completionYear ?? proj.handoverYear ?? null,
      startingPriceMinor: proj.startingPriceMinor ?? null,
      currency: proj.currency,
      coverImage: proj.coverImage ?? proj.heroImage ?? null,
      version: 1,
    };
  });

  if (projRows.length > 0) {
    await dbInstance.insert(schema.projects).values(projRows).onConflictDoNothing();
  }

  // 5. Seed Listings & Images
  let listingImagesCount = 0;
  for (const listing of FIXTURE_LISTINGS) {
    const listingId = toFixtureUuid(listing.id);
    const locId = listing.location?.id ? locIdMap.get(listing.location.id) ?? null : null;
    const devId = listing.developer?.id ? devIdMap.get(listing.developer.id) ?? null : null;
    const projId = listing.project?.id ? projIdMap.get(listing.project.id) ?? null : null;

    await dbInstance
      .insert(schema.listings)
      .values({
        id: listingId,
        refNumber: listing.refNumber,
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        countryCode: listing.location.countryCode,
        locationId: locId,
        city: listing.location.city,
        area: listing.location.area ?? null,
        developerId: devId,
        projectId: projId,
        propertyType: listing.propertyType,
        status: listing.status,
        reviewStatus: 'published',
        priceMinor: listing.priceMinor,
        currency: listing.currency,
        priceUsdMinor: listing.priceUsdMinor,
        bedrooms: listing.bedrooms,
        bathrooms: String(listing.bathrooms),
        sizeSqm: String(listing.sizeSqm),
        sizeSqft: String(listing.sizeSqft),
        coverImage: listing.coverImage,
        isHotDeal: listing.isHotDeal,
        isFeatured: listing.isFeatured,
        isVerified: listing.isVerified,
        isNewLaunch: listing.isNewLaunch,
        isSample: listing.isSample,
        completionYear: listing.completionYear ?? null,
        furnishingStatus: listing.furnishingStatus ?? null,
        badges: listing.badges ?? [],
        features: listing.features ?? [],
        videoUrl: listing.videoUrl ?? null,
        virtualTourUrl: listing.virtualTourUrl ?? null,
        floorPlans: listing.floorPlans ?? [],
        paymentPlan: listing.paymentPlan ?? null,
        agent: listing.agent,
        latitude: listing.coordinates?.lat ? String(listing.coordinates.lat) : null,
        longitude: listing.coordinates?.lng ? String(listing.coordinates.lng) : null,
        publishedAt: new Date(listing.publishedAt),
        updatedAt: new Date(listing.updatedAt),
        version: 1,
      })
      .onConflictDoNothing();

    if (listing.images && listing.images.length > 0) {
      const imageRows = listing.images.map((img, idx) => ({
        id: toFixtureUuid(`${listing.id}-img-${idx}`),
        listingId,
        url: img.url,
        alt: img.alt ?? listing.title,
        caption: img.caption ?? null,
        order: img.order ?? idx,
      }));

      await dbInstance.insert(schema.listingImages).values(imageRows).onConflictDoNothing();
      listingImagesCount += imageRows.length;
    }
  }

  // 6. Seed Leads
  const leadRows = FIXTURE_LEADS.map((lead: any) => {
    let validListingId: string | null = null;
    if (lead.listingId) {
      const match = FIXTURE_LISTINGS.find(
        (l) => l.id === lead.listingId || l.refNumber === lead.propertyRef
      );
      if (match) {
        validListingId = toFixtureUuid(match.id);
      }
    }

    return {
      id: toFixtureUuid(lead.id),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      countryCode: lead.countryCode,
      type: lead.type ?? 'inquiry',
      status: lead.status ?? 'new',
      listingId: validListingId,
      propertyRef: lead.propertyRef ?? null,
      propertyTitle: lead.propertyTitle ?? null,
      budgetMin: lead.budgetMin ?? null,
      budgetMax: lead.budgetMax ?? null,
      currency: lead.currency ?? null,
      message: lead.message ?? null,
      locale: lead.locale ?? 'en',
      preferredContact: lead.preferredContact ?? 'whatsapp',
      consentGiven: true,
      utmSource: lead.utmSource ?? null,
      utmCampaign: lead.utmCampaign ?? null,
      version: 1,
    };
  });

  if (leadRows.length > 0) {
    await dbInstance.insert(schema.leads).values(leadRows).onConflictDoNothing();
  }

  // 7. Seed Submissions
  const subRows = FIXTURE_SUBMISSIONS.map((sub: any) => ({
    id: toFixtureUuid(sub.id),
    sellerName: sub.sellerName,
    sellerEmail: sub.sellerEmail,
    sellerPhone: sub.sellerPhone,
    countryCode: sub.countryCode,
    city: sub.city,
    area: sub.area ?? null,
    propertyType: sub.propertyType,
    bedrooms: sub.bedrooms,
    bathrooms: String(sub.bathrooms),
    sizeSqm: String(sub.sizeSqm),
    expectedPriceMinor: sub.expectedPriceMinor,
    currency: sub.currency,
    description: sub.description ?? null,
    notes: sub.notes ?? null,
    status: sub.status ?? 'pending',
    capabilityToken: sub.capabilityToken ?? null,
    version: 1,
  }));

  if (subRows.length > 0) {
    await dbInstance.insert(schema.submissions).values(subRows).onConflictDoNothing();
  }

  return {
    locationsCount: locRows.length,
    developersCount: devRows.length,
    projectsCount: projRows.length,
    listingsCount: FIXTURE_LISTINGS.length,
    listingImagesCount,
    leadsCount: leadRows.length,
    submissionsCount: subRows.length,
    exchangeRatesCount: 1,
  };
}

async function main() {
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Seeding PostgreSQL database from Stage 5 fixtures...');
    const db = drizzle(client, { schema });
    const res = await runSeed(db);
    console.log('✅ Seeding completed:');
    console.log(`- Locations: ${res.locationsCount}`);
    console.log(`- Developers: ${res.developersCount}`);
    console.log(`- Projects: ${res.projectsCount}`);
    console.log(`- Listings: ${res.listingsCount}`);
    console.log(`- Leads: ${res.leadsCount}`);
    console.log(`- Submissions: ${res.submissionsCount}`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute if run directly as script
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  void main();
}
