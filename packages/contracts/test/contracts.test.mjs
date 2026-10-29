import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CountryCodeSchema,
  CurrencyCodeSchema,
  PropertyTypeSchema,
  PropertyStatusSchema,
  LeadCreateSchema,
  SubmissionCreateSchema,
  SearchQuerySchema,
  LocationSchema,
  DeveloperSchema,
  ProjectSchema,
  ListingDetailSchema,
  ListingSummarySchema,
  toMinorUnits,
  fromMinorUnits,
  toMinorUnitsBigInt,
  fromMinorUnitsBigInt,
  convertMinorUnits,
  normalizeToUsdMinor,
  formatMoney,
  formatMoneyCompact,
  toListingSummary,
  FIXTURE_LOCATIONS,
  FIXTURE_DEVELOPERS,
  FIXTURE_PROJECTS,
  FIXTURE_LISTINGS,
  FIXTURE_BUYING_GUIDES,
  FIXTURE_FAQS,
  FIXTURE_TESTIMONIALS,
  FIXTURE_BLOG_POSTS,
  FIXTURE_COUNTRY_SETTINGS,
  FIXTURE_EXCHANGE_RATES,
} from '../dist/index.js';

test('Contracts: Enums and basic schemas validate correctly', () => {
  assert.equal(CountryCodeSchema.parse('ae'), 'ae');
  assert.equal(CountryCodeSchema.parse('tr'), 'tr');
  assert.equal(CountryCodeSchema.parse('ge'), 'ge');
  assert.equal(CountryCodeSchema.parse('eg'), 'eg');
  assert.throws(() => CountryCodeSchema.parse('us'));

  assert.equal(CurrencyCodeSchema.parse('USD'), 'USD');
  assert.equal(CurrencyCodeSchema.parse('AED'), 'AED');
  assert.throws(() => CurrencyCodeSchema.parse('JPY'));

  assert.equal(PropertyTypeSchema.parse('villa'), 'villa');
  assert.equal(PropertyStatusSchema.parse('off_plan'), 'off_plan');
});

test('Contracts: Input schemas strictly reject extra unknown properties (.strict())', () => {
  // LeadCreateSchema
  const validLead = {
    name: 'Tariq Mansoor',
    email: 'tariq@example.com',
    phone: '+971501234567',
    locale: 'en',
    type: 'inquiry',
    countryCode: 'ae',
    message: 'Interested in Palm Jumeirah villas',
    consentGiven: true,
  };
  assert.doesNotThrow(() => LeadCreateSchema.parse(validLead));

  const invalidLeadWithExtra = {
    ...validLead,
    unexpectedField: 'malicious-payload',
  };
  assert.throws(
    () => LeadCreateSchema.parse(invalidLeadWithExtra),
    /unrecognized_keys/i
  );

  // SearchQuerySchema
  const validQuery = {
    country: 'ae',
    city: 'Dubai',
    limit: 10,
  };
  assert.doesNotThrow(() => SearchQuerySchema.parse(validQuery));

  const invalidQueryWithExtra = {
    ...validQuery,
    unknownSearchParam: 123,
  };
  assert.throws(
    () => SearchQuerySchema.parse(invalidQueryWithExtra),
    /unrecognized_keys/i
  );

  // SubmissionCreateSchema
  const validSubmission = {
    sellerName: 'John Doe',
    sellerEmail: 'john@example.com',
    sellerPhone: '+971509876543',
    countryCode: 'ae',
    city: 'Dubai',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 120,
    expectedPriceMinor: 75000000,
    currency: 'USD',
    consentGiven: true,
  };
  assert.doesNotThrow(() => SubmissionCreateSchema.parse(validSubmission));

  const invalidSubmissionWithExtra = {
    ...validSubmission,
    hackerField: true,
  };
  assert.throws(
    () => SubmissionCreateSchema.parse(invalidSubmissionWithExtra),
    /unrecognized_keys/i
  );
});

test('Contracts: Money minor units math and conversions', () => {
  // Minor units conversion
  assert.equal(toMinorUnits(1250000.5), 125000050);
  assert.equal(toMinorUnits(100), 10000);
  assert.equal(toMinorUnits(0), 0);
  assert.equal(fromMinorUnits(125000050), 1250000.5);

  // BigInt conversions
  assert.equal(toMinorUnitsBigInt(500), 50000n);
  assert.equal(fromMinorUnitsBigInt(50000n), 500);

  // Currency conversions
  const rates = FIXTURE_EXCHANGE_RATES.rates;
  // USD -> AED (1 USD = 3.6725 AED)
  const usdMinor = 100000; // $1,000.00
  const aedMinor = convertMinorUnits(usdMinor, 'USD', 'AED', rates);
  assert.equal(aedMinor, 367250); // 3,672.50 AED

  // AED -> USD normalization
  const normalizedUsd = normalizeToUsdMinor(367250, 'AED', rates);
  assert.equal(normalizedUsd, 100000);

  // Formatting helpers
  const formattedUsd = formatMoney(125000000, 'USD', 'en');
  assert.ok(formattedUsd.includes('1,250,000'));

  const formattedCompact = formatMoneyCompact(240000000, 'USD', 'en');
  assert.ok(formattedCompact.includes('2.4M') || formattedCompact.includes('2.4') || formattedCompact.includes('$2.4M'));
});

test('Contracts: Fixtures integrity and schema conformance', () => {
  // 1. Locations
  assert.ok(FIXTURE_LOCATIONS.length >= 12, 'Locations fixture should have all required entries');
  for (const loc of FIXTURE_LOCATIONS) {
    assert.doesNotThrow(() => LocationSchema.parse(loc), `Invalid location: ${loc.slug}`);
  }

  // 2. Developers
  assert.equal(FIXTURE_DEVELOPERS.length, 10, 'Expected exactly 10 sample developers');
  for (const dev of FIXTURE_DEVELOPERS) {
    assert.doesNotThrow(() => DeveloperSchema.parse(dev), `Invalid developer: ${dev.slug}`);
  }

  // 3. Projects
  assert.ok(FIXTURE_PROJECTS.length >= 4, 'Expected sample projects');
  for (const proj of FIXTURE_PROJECTS) {
    assert.doesNotThrow(() => ProjectSchema.parse(proj), `Invalid project: ${proj.slug}`);
  }

  // 4. Listings (exactly 24 listings, 6 per country, all flagged is_sample: true)
  assert.equal(FIXTURE_LISTINGS.length, 24, 'Expected exactly 24 sample listings');
  const countByCountry = { ae: 0, tr: 0, ge: 0, eg: 0 };

  for (const listing of FIXTURE_LISTINGS) {
    assert.doesNotThrow(() => ListingDetailSchema.parse(listing), `Invalid listing detail: ${listing.refNumber}`);
    const summary = toListingSummary(listing);
    assert.doesNotThrow(() => ListingSummarySchema.parse(summary), `Listing should be valid summary: ${listing.refNumber}`);
    assert.equal(listing.isSample, true, `Listing ${listing.refNumber} must have isSample=true`);
    assert.ok(listing.priceUsdMinor > 0, `Listing ${listing.refNumber} must have positive priceUsdMinor`);
    assert.ok(listing.images.length > 0, `Listing ${listing.refNumber} must have images`);
    assert.ok(countByCountry[listing.location.countryCode] !== undefined);
    countByCountry[listing.location.countryCode]++;
  }

  assert.equal(countByCountry.ae, 6, 'UAE must have 6 listings');
  assert.equal(countByCountry.tr, 6, 'Turkey must have 6 listings');
  assert.equal(countByCountry.ge, 6, 'Georgia must have 6 listings');
  assert.equal(countByCountry.eg, 6, 'Egypt must have 6 listings');

  // 5. Buying guides, FAQs, testimonials, blog posts, country settings, rates
  assert.equal(FIXTURE_BUYING_GUIDES.length, 4, 'Expected 4 buying guides');
  assert.ok(FIXTURE_FAQS.length >= 8, 'Expected FAQs');
  assert.ok(FIXTURE_TESTIMONIALS.length >= 4, 'Expected testimonials');
  assert.ok(FIXTURE_BLOG_POSTS.length >= 4, 'Expected blog posts');
  assert.ok(FIXTURE_COUNTRY_SETTINGS.ae, 'UAE country settings present');
  assert.ok(FIXTURE_EXCHANGE_RATES.rates.AED, 'AED exchange rate present');
});
