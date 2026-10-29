import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient, MockApiClient } from '../dist/index.js';

test('ApiClient: Factory creates MockApiClient by default or when API_MODE=mock', () => {
  const client = createApiClient();
  assert.equal(client.mode, 'mock');
  assert.ok(client instanceof MockApiClient);

  const explicitClient = createApiClient({ mode: 'mock' });
  assert.equal(explicitClient.mode, 'mock');
});

test('ApiClient Mock: getListings pagination, filtering, and sorting', async () => {
  const client = createApiClient({ mode: 'mock' });

  // 1. Unfiltered listings
  const allResult = await client.getListings({ limit: 50 });
  assert.equal(allResult.total, 24, 'Total listings must be 24');
  assert.equal(allResult.items.length, 24);
  assert.equal(allResult.page, 1);
  assert.ok(allResult.facetCounts, 'Facet counts must be computed');

  // 2. Pagination
  const page1 = await client.getListings({ page: 1, limit: 10 });
  assert.equal(page1.items.length, 10);
  assert.equal(page1.page, 1);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.hasMore, true);

  const page3 = await client.getListings({ page: 3, limit: 10 });
  assert.equal(page3.items.length, 4);
  assert.equal(page3.page, 3);
  assert.equal(page3.hasMore, false);

  // 3. Country filtering
  const uaeResult = await client.getListings({ country: 'ae' });
  assert.equal(uaeResult.total, 6);
  for (const item of uaeResult.items) {
    assert.equal(item.location.countryCode, 'ae');
  }

  // 4. Property type filtering
  const villaResult = await client.getListings({ type: 'villa' });
  assert.ok(villaResult.total > 0);
  for (const item of villaResult.items) {
    assert.equal(item.propertyType, 'villa');
  }

  // 5. Featured listings
  const featured = await client.getFeaturedListings('ae', 3);
  assert.ok(featured.length <= 3);
  for (const item of featured) {
    assert.equal(item.location.countryCode, 'ae');
    assert.equal(item.isFeatured, true);
  }

  // 6. Sorting by price asc
  const priceAsc = await client.getListings({ sort: 'price_asc', limit: 24 });
  for (let i = 1; i < priceAsc.items.length; i++) {
    assert.ok(
      priceAsc.items[i].priceUsdMinor >= priceAsc.items[i - 1].priceUsdMinor,
      `Items must be sorted price ascending: ${priceAsc.items[i].priceUsdMinor} >= ${priceAsc.items[i - 1].priceUsdMinor}`
    );
  }

  // 7. Full-text search keyword query
  const queryResult = await client.getListings({ q: 'Palm' });
  assert.ok(queryResult.total >= 1);
  assert.ok(queryResult.items.some((i) => i.title.includes('Palm') || (i.location.area && i.location.area.includes('Palm'))));
});

test('ApiClient Mock: getListingBySlug resolves detail and null for unknown', async () => {
  const client = createApiClient({ mode: 'mock' });

  // Known slug
  const listing = await client.getListingBySlug('wh-ae-101-marina-waterfront-penthouse');
  assert.ok(listing, 'Expected listing to be found');
  assert.equal(listing.refNumber, 'WH-AE-101');
  assert.equal(listing.slug, 'wh-ae-101-marina-waterfront-penthouse');
  assert.ok(listing.images.length >= 3);
  assert.ok(listing.agent, 'Listing agent must be present');

  // Lookup by refNumber
  const byRef = await client.getListingBySlug('WH-AE-101');
  assert.ok(byRef);
  assert.equal(byRef.slug, 'wh-ae-101-marina-waterfront-penthouse');

  // Unknown slug
  const missing = await client.getListingBySlug('non-existent-property-slug-xyz');
  assert.equal(missing, null);
});

test('ApiClient Mock: Locations, developers, projects, and search suggestions', async () => {
  const client = createApiClient({ mode: 'mock' });

  // Locations
  const allLocations = await client.getLocations();
  assert.ok(allLocations.length >= 12);

  const uaeLocations = await client.getLocations('ae');
  assert.ok(uaeLocations.length >= 3);
  for (const loc of uaeLocations) {
    assert.equal(loc.countryCode, 'ae');
  }

  const featuredPins = await client.getFeaturedLocations('ae');
  assert.ok(featuredPins.length >= 1);
  for (const pin of featuredPins) {
    assert.equal(pin.countryCode, 'ae');
    assert.equal(pin.isFeatured, true);
  }

  // Developers
  const developers = await client.getDevelopers('ae');
  assert.ok(developers.length >= 1);
  assert.ok(developers.some((d) => d.slug === 'emaar-properties'));

  // Projects
  const projects = await client.getProjects('ae');
  assert.ok(projects.length >= 1);

  // Search suggestions
  const suggestions = await client.getSearchSuggestions('Dubai', 'ae');
  assert.equal(suggestions.query, 'Dubai');
  assert.ok(suggestions.cities.length >= 1);
  assert.equal(suggestions.cities[0].slug, 'dubai');
});

test('ApiClient Mock: Content, settings, guides, FAQs, and exchange rates', async () => {
  const client = createApiClient({ mode: 'mock' });

  // Country settings
  const uaeSettings = await client.getCountrySettings('ae');
  assert.equal(uaeSettings.countryCode, 'ae');
  assert.equal(uaeSettings.currency, 'AED');

  // Rates
  const rates = await client.getExchangeRates();
  assert.equal(rates.base, 'USD');
  assert.equal(rates.rates.USD, 1.0);
  assert.equal(rates.rates.AED, 3.6725);

  // Buying guide
  const guide = await client.getBuyingGuide('ae');
  assert.ok(guide);
  assert.equal(guide.countryCode, 'ae');
  assert.ok(guide.contentSections.length >= 2);

  // FAQs
  const faqs = await client.getFaqs('ae');
  assert.ok(faqs.length >= 2);

  // Testimonials
  const testimonials = await client.getTestimonials('ae');
  assert.ok(testimonials.length >= 1);

  // Blog posts
  const posts = await client.getBlogPosts('ae');
  assert.ok(posts.length >= 1);
});

test('ApiClient Mock: Lead and property submission creation', async () => {
  const client = createApiClient({ mode: 'mock' });

  // Create lead
  const leadResponse = await client.createLead({
    name: 'Fatima Al-Zahra',
    email: 'fatima@example.com',
    phone: '+971501112233',
    countryCode: 'ae',
    type: 'inquiry',
    message: 'Requesting brochure for Palm Crown',
    consentGiven: true,
  });
  assert.equal(leadResponse.success, true);
  assert.ok(leadResponse.leadId.startsWith('lead-'));

  // Create submission
  const subResponse = await client.createSubmission({
    sellerName: 'Karim Mostafa',
    sellerEmail: 'karim@example.com',
    sellerPhone: '+201012345678',
    countryCode: 'eg',
    city: 'Cairo',
    propertyType: 'villa',
    bedrooms: 4,
    bathrooms: 4,
    sizeSqm: 380,
    expectedPriceMinor: 85000000,
    currency: 'USD',
    consentGiven: true,
  });
  assert.equal(subResponse.success, true);
  assert.ok(subResponse.submissionId.startsWith('sub-'));
});
