import { uuidv7 } from 'uuidv7';
import type { NewListingRow } from './schema/listings.js';

const PROPERTY_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'studio', 'chalet'] as const;
const CITIES: Record<string, string[]> = {
  ae: ['Dubai', 'Abu Dhabi', 'Ras Al Khaimah', 'Sharjah'],
  eg: ['Cairo', 'El Gouna', 'New Cairo', 'North Coast'],
  ge: ['Tbilisi', 'Batumi', 'Gudauri', 'Kutaisi'],
  tr: ['Istanbul', 'Bodrum', 'Antalya', 'Fethiye'],
};

const TITLES = [
  'Panorama Bay Luxury Residence',
  'Royal Crest Signature Villa',
  'Marina Skyline Waterfront Penthouse',
  'Golden Sands Coastal Duplex',
  'Cypress Garden Modern Townhouse',
  'Emerald Heights Executive Apartment',
  'Azure Horizon Seafront Retreat',
  'Summit Ridge Alpine Chalet',
];

export function generateSyntheticListings(
  count = 100,
  options: { countryCode?: 'ae' | 'eg' | 'ge' | 'tr'; baseIndex?: number } = {}
): NewListingRow[] {
  const countries = options.countryCode ? [options.countryCode] : (['ae', 'eg', 'ge', 'tr'] as const);
  const items: NewListingRow[] = [];
  const startIndex = options.baseIndex ?? 1;

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const country = countries[i % countries.length] ?? 'ae';
    const cityList = CITIES[country] ?? ['Dubai'];
    const city = cityList[i % cityList.length] ?? 'Dubai';
    const propType = PROPERTY_TYPES[i % PROPERTY_TYPES.length] ?? 'apartment';
    const titleTemplate = TITLES[i % TITLES.length] ?? 'Luxury Home';
    const title = `${titleTemplate} No. ${idx}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${country}-${idx}`;
    const refNumber = `SYN-${country.toUpperCase()}-${String(idx).padStart(4, '0')}`;

    const bedrooms = (i % 5) + 1;
    const bathrooms = String(bedrooms + (i % 2 === 0 ? 0.5 : 0));
    const sizeSqm = String(80 + (i % 10) * 35);
    const sizeSqft = String(Math.round(Number(sizeSqm) * 10.7639));

    // Pricing in minor units (e.g. USD cents or AED fils)
    const baseUsd = 250000 + (i % 20) * 125000;
    const priceUsdMinor = baseUsd * 100;
    let currency = 'USD';
    let priceMinor = priceUsdMinor;

    if (country === 'ae') {
      currency = 'AED';
      priceMinor = Math.round(baseUsd * 3.6725 * 100);
    } else if (country === 'eg') {
      currency = 'EGP';
      priceMinor = Math.round(baseUsd * 48.65 * 100);
    } else if (country === 'tr') {
      currency = 'TRY';
      priceMinor = Math.round(baseUsd * 34.25 * 100);
    } else if (country === 'ge') {
      currency = 'GEL';
      priceMinor = Math.round(baseUsd * 2.72 * 100);
    }

    items.push({
      id: uuidv7(),
      refNumber,
      slug,
      title,
      description: `Spectacular ${bedrooms}-bedroom luxury ${propType} located in ${city}. Featuring premium finishes, expansive terraces, and prestigious architecture.`,
      countryCode: country,
      locationId: null,
      city,
      area: `${city} Central`,
      developerId: null,
      projectId: null,
      propertyType: propType,
      status: i % 3 === 0 ? 'under_construction' : 'ready',
      reviewStatus: 'published',
      priceMinor,
      currency,
      priceUsdMinor,
      bedrooms,
      bathrooms,
      sizeSqm,
      sizeSqft,
      coverImage: `/images/properties/prop-${(i % 12) + 1}.webp`,
      isHotDeal: i % 4 === 0,
      isFeatured: i % 5 === 0,
      isVerified: true,
      isNewLaunch: i % 6 === 0,
      isSample: true,
      completionYear: 2026 + (i % 3),
      furnishingStatus: i % 2 === 0 ? 'furnished' : 'semi_furnished',
      badges: ['Verified Escrow', 'Exclusive Listing'],
      features: ['Balcony', 'Concierge Service', 'Private Pool', 'Covered Parking'],
      videoUrl: null,
      virtualTourUrl: null,
      floorPlans: [],
      paymentPlan: {
        downPaymentPercent: 20,
        installmentsCount: 8,
        postHandover: true,
      },
      agent: {
        name: 'Alexander Wright',
        phone: '+971 4 000 0000',
        whatsapp: '+971 50 000 0000',
        email: 'alexander.wright@wildhills.com',
        avatarUrl: '/images/agents/alexander.webp',
      },
      latitude: '25.2048',
      longitude: '55.2708',
      version: 1,
    });
  }

  return items;
}
