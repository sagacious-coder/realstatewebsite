import {
  BlogPost,
  BuyingGuide,
  CountrySettings,
  ExchangeRates,
  FaqItem,
  Testimonial,
} from '../content.js';

export const FIXTURE_EXCHANGE_RATES: ExchangeRates = {
  base: 'USD',
  timestamp: '2026-10-29T12:00:00.000Z',
  rates: {
    USD: 1,
    AED: 3.6725,
    TRY: 34.0,
    GEL: 2.7,
    EGP: 50.0,
    EUR: 0.92,
    GBP: 0.78,
  },
};

export const FIXTURE_COUNTRY_SETTINGS: Record<string, CountrySettings> = {
  ae: {
    countryCode: 'ae',
    currency: 'AED',
    defaultLocale: 'en',
    phonePrefix: '+971',
    supportPhone: '+971 4 000 0000',
    supportWhatsapp: '+97140000000',
    supportEmail: 'uae@wildhills.example',
    officeAddress: 'Office 000, Business Bay, Dubai, United Arab Emirates',
    legalDisclaimer: 'Real estate investment information is for educational purposes and subject to RERA regulations. Rules and returns vary.',
    isSample: true,
  },
  tr: {
    countryCode: 'tr',
    currency: 'TRY',
    defaultLocale: 'en',
    phonePrefix: '+90',
    supportPhone: '+90 212 000 0000',
    supportWhatsapp: '+902120000000',
    supportEmail: 'turkey@wildhills.example',
    officeAddress: 'Office 000, Levent, Istanbul, Turkey',
    legalDisclaimer: 'Turkish Citizenship by Investment and title deed (Tapu) processes are governed by national law. Contact licensed advisors.',
    isSample: true,
  },
  ge: {
    countryCode: 'ge',
    currency: 'GEL',
    defaultLocale: 'en',
    phonePrefix: '+995',
    supportPhone: '+995 32 000 0000',
    supportWhatsapp: '+995320000000',
    supportEmail: 'georgia@wildhills.example',
    officeAddress: 'Office 000, Rustaveli Avenue, Tbilisi, Georgia',
    legalDisclaimer: 'Property acquisitions in Georgia carry 0% property purchase tax. Residency eligibility criteria apply to non-agricultural land.',
    isSample: true,
  },
  eg: {
    countryCode: 'eg',
    currency: 'EGP',
    defaultLocale: 'en',
    phonePrefix: '+20',
    supportPhone: '+20 2 0000 0000',
    supportWhatsapp: '+20200000000',
    supportEmail: 'egypt@wildhills.example',
    officeAddress: 'Office 000, Sector 1, Fifth Settlement, New Cairo, Egypt',
    legalDisclaimer: 'Installment plans and delivery guarantees are contracted directly with registered developers. Terms subject to contract review.',
    isSample: true,
  },
};

export const FIXTURE_BUYING_GUIDES: BuyingGuide[] = [
  {
    id: 'guide-ae',
    slug: 'uae-property-buying-guide',
    countryCode: 'ae',
    title: 'Complete UAE Property & Golden Visa Buying Guide',
    summary: 'Everything you need to know about purchasing freehold property in Dubai and Abu Dhabi, qualifying for 10-year Golden Visas, and navigating DLD fees.',
    contentSections: [
      {
        heading: '1. Freehold vs. Leasehold Areas',
        body: 'Foreign buyers can purchase freehold real estate with 100% foreign ownership in designated investment zones across Dubai (e.g., Downtown, Marina, Palm Jumeirah) and Abu Dhabi (Yas Island, Saadiyat Island, Al Reem).',
      },
      {
        heading: '2. Golden Visa Through Real Estate',
        body: 'Investors purchasing property valued at AED 2,000,000 or more (single or multiple units, ready or off-plan with approved developers) qualify for a renewable 10-year Golden Visa without sponsor requirement.',
      },
      {
        heading: '3. Transaction Costs & DLD Fees',
        body: 'Standard Dubai Land Department (DLD) transfer fee is 4% plus administrative registration fees (AED 4,000+VAT). Real estate agency fee is typically 2%+VAT.',
      },
    ],
    updatedDate: '2026-10-15',
    isSample: true,
  },
  {
    id: 'guide-tr',
    slug: 'turkey-property-citizenship-guide',
    countryCode: 'tr',
    title: 'Turkey Real Estate & Citizenship by Investment Guide',
    summary: 'A comprehensive handbook for international buyers acquiring property, receiving Tapu deeds, and securing Turkish Citizenship.',
    contentSections: [
      {
        heading: '1. Turkish Citizenship by Investment',
        body: 'Foreigners who purchase real estate worth a minimum of $400,000 USD (or foreign currency equivalent) with a 3-year no-sale commitment qualify for Turkish Citizenship for themselves, their spouse, and minor children.',
      },
      {
        heading: '2. Title Deed (Tapu) Process',
        body: 'Property transfers in Turkey must be finalized at the local Land Registry Office (Tapu ve Kadastro). Military clearance is no longer required for most foreign citizens in primary investment hubs.',
      },
      {
        heading: '3. Real Estate Taxes & Title Deed Fees',
        body: 'Title deed conveyance tax is 4% of the declared property value, typically shared equally between buyer and seller. VAT exemptions may apply to foreign buyers purchasing new developer units.',
      },
    ],
    updatedDate: '2026-10-10',
    isSample: true,
  },
  {
    id: 'guide-ge',
    slug: 'georgia-property-investment-guide',
    countryCode: 'ge',
    title: 'Georgia Property Investment & High-Yield Guide',
    summary: 'Explore why Batumi and Tbilisi offer some of the highest rental yields in Eurasia, backed by 0% transfer tax and streamlined digital registry.',
    contentSections: [
      {
        heading: '1. Why Invest in Georgia?',
        body: 'Georgia features one of the world’s most straightforward property registration systems (completed in 1-4 business days at the Public Service Hall). Foreigners enjoy equal freehold ownership rights on all residential apartments.',
      },
      {
        heading: '2. Low Taxation & High Net Rental Yields',
        body: 'There is 0% stamp duty and 0% property purchase tax. Rental income tax is a modest flat 5% on residential leases. Batumi coastal apart-hotels consistently achieve 8%–12% net annual yields.',
      },
      {
        heading: '3. Residency Through Real Estate',
        body: 'Purchasing residential real estate with a verified value of at least $100,000 USD grants a 1-year renewable Short-Term Residency Permit, convertible to permanent residency after 6 years.',
      },
    ],
    updatedDate: '2026-10-12',
    isSample: true,
  },
  {
    id: 'guide-eg',
    slug: 'egypt-offplan-installment-guide',
    countryCode: 'eg',
    title: 'Egypt Real Estate & Off-Plan Payment Plan Guide',
    summary: 'Navigate Egypt’s booming master developments, long-tenure developer installment plans (up to 8-10 years), and currency hedge advantages.',
    contentSections: [
      {
        heading: '1. Master Communities & Off-Plan Security',
        body: 'Most transactions in East and West Cairo take place off-plan directly with premier master developers. Contracts feature phased milestones, locked-in EGP installment schedules, and delivery dates backed by bank escrow.',
      },
      {
        heading: '2. Extended Payment Plans Without Bank Mortgages',
        body: 'Developers in Egypt offer flexible direct in-house financing with down payments as low as 5%–10% and interest-free quarterly installments spanning 7 to 10 years.',
      },
      {
        heading: '3. Egyptian Residency & Citizenship Rules',
        body: 'Foreign nationals investing in state-registered properties can qualify for Egyptian residency ranging from 1 to 5 years (minimum $50,000 to $200,000 USD) or citizenship through real estate investment tiers.',
      },
    ],
    updatedDate: '2026-10-18',
    isSample: true,
  },
];

export const FIXTURE_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    question: 'Can foreigners own 100% freehold property in all four countries?',
    answer: 'Yes. In the UAE (designated freehold zones), Turkey, Georgia, and Egypt, foreign nationals have full legal rights to own freehold residential real estate without local partnership requirements.',
  },
  {
    id: 'faq-2',
    category: 'Financing',
    question: 'Are installment plans available for international buyers?',
    answer: 'Yes. Off-plan properties across the UAE, Egypt, and Turkey frequently feature developer installment plans (3 to 10 years) that do not require local bank mortgage approvals or extensive credit history.',
  },
  {
    id: 'faq-3',
    category: 'Fees',
    question: 'What are the main purchasing fees beyond the property price?',
    answer: 'Purchasing fees typically range from 4% to 7% of property value (including title deed transfer taxes, registration, legal conveyance, and agency brokerage). Georgia has the lowest purchase costs at under 1%.',
  },
  {
    id: 'faq-4',
    category: 'Residency',
    question: 'Does buying real estate guarantee residency or citizenship?',
    answer: 'In the UAE, qualifying purchases over AED 2M grant a 10-year Golden Visa. In Turkey, purchases over $400k qualify for Citizenship by Investment. In Georgia, purchases over $100k qualify for residency. Specific legal criteria must be met.',
  },
  {
    id: 'faq-5',
    category: 'UAE',
    countryCode: 'ae',
    question: 'Can I rent out my Dubai property on short-term platforms like Airbnb?',
    answer: 'Yes. Owners or licensed holiday-home operators can register holiday homes with Dubai’s Department of Economy and Tourism (DET) to maximize seasonal rental yields.',
  },
  {
    id: 'faq-6',
    category: 'Turkey',
    countryCode: 'tr',
    question: 'How long does the Turkish Citizenship by Investment application take?',
    answer: 'Once the Tapu (title deed) with a 3-year restriction is registered and the Certificate of Eligibility is issued, the citizenship application typically completes in 3 to 6 months.',
  },
  {
    id: 'faq-7',
    category: 'Georgia',
    countryCode: 'ge',
    question: 'Can non-residents open a bank account in Georgia to receive rental income?',
    answer: 'Yes. Major Georgian banks (Bank of Georgia, TBC Bank) allow non-residents to open multi-currency accounts (GEL, USD, EUR) with straightforward verification.',
  },
  {
    id: 'faq-8',
    category: 'Egypt',
    countryCode: 'eg',
    question: 'Are listing prices in Egypt fixed in Egyptian Pounds?',
    answer: 'Listing contracts with primary developers are fixed in Egyptian Pounds (EGP). When paying in foreign currency (USD/EUR), developers convert at the official central bank exchange rate on the payment due date.',
  },
];

export const FIXTURE_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Alexander & Marina Weber',
    location: 'Munich, Germany',
    quote: 'Wild Hills guided us from initial consultation to our Golden Visa in Dubai Marina. Their transparency on DLD costs and escrow accounts gave us complete peace of mind.',
    rating: 5,
    countryCode: 'ae',
    date: '2026-09-14',
  },
  {
    id: 'test-2',
    author: 'David Chen',
    location: 'Singapore',
    quote: 'We achieved an 11% net yield in our first year on our Batumi apart-hotel. The closing took less than an hour at the Public Service Hall in Georgia.',
    rating: 5,
    countryCode: 'ge',
    date: '2026-08-22',
  },
  {
    id: 'test-3',
    author: 'Dr. Tariq Al-Husseini',
    location: 'Riyadh, Saudi Arabia',
    quote: 'Securing an off-plan chalet in Ras El Hekma with an 8-year payment plan through Wild Hills was smooth and professional. Their local Cairo agents know every compound.',
    rating: 5,
    countryCode: 'eg',
    date: '2026-09-30',
  },
  {
    id: 'test-4',
    author: 'Sophie Dubois',
    location: 'Lyon, France',
    quote: 'Our Bosphorus duplex in Istanbul exceeded our expectations. The team accompanied us through every step of the Tapu deed registration.',
    rating: 5,
    countryCode: 'tr',
    date: '2026-07-19',
  },
];

export const FIXTURE_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'dubai-real-estate-trends-2026',
    title: 'Dubai Real Estate in 2026: Prime Areas, Rental Yields and Supply',
    summary: 'An analytical deep dive into Dubai’s sustained residential momentum, expanding waterfront districts, and institutional investor inflows.',
    content: 'Dubai’s property sector continues to benefit from favorable tax policies, world-class infrastructure, and expanding population growth...',
    coverImage: '/images/uae/cities/dubai.webp',
    author: {
      name: 'Elena Rostova',
      role: 'Head of Market Research',
    },
    publishedAt: '2026-10-05T08:00:00.000Z',
    readingTimeMinutes: 5,
    countryCode: 'ae',
    tags: ['Market Analysis', 'Dubai', 'Investment'],
  },
  {
    id: 'post-2',
    slug: 'batumi-black-sea-growth-hub',
    title: 'Why Global Investors Are Choosing Batumi for High-Yield Real Estate',
    summary: 'How Georgia’s subtropical coastal jewel transformed into a year-round tourism capital with 0% property acquisition taxes.',
    content: 'Batumi’s architectural boom, backed by global hospitality flags like Marriott and Courtyard, provides hands-off rental management...',
    coverImage: '/images/georgia/cities/batumi.webp',
    author: {
      name: 'Luka Beridze',
      role: 'Senior Property Advisor',
    },
    publishedAt: '2026-09-28T09:00:00.000Z',
    readingTimeMinutes: 4,
    countryCode: 'ge',
    tags: ['Georgia', 'Rental Yield', 'Batumi'],
  },
  {
    id: 'post-3',
    slug: 'ras-el-hekma-north-coast-renaissance',
    title: 'Ras El Hekma & The Egyptian North Coast Luxury Renaissance',
    summary: 'The strategic transformation of Egypt’s Mediterranean coastline into an international Riviera destination with multi-billion dollar capital.',
    content: 'With pristine white beaches rivaling the Caribbean, Egypt’s North Coast is transitioning from local summer getaway to year-round destination...',
    coverImage: '/images/egypt/cities/north-coast.webp',
    author: {
      name: 'Karim Farag',
      role: 'MENA Strategic Director',
    },
    publishedAt: '2026-09-15T11:00:00.000Z',
    readingTimeMinutes: 6,
    countryCode: 'eg',
    tags: ['North Coast', 'Egypt', 'Megaprojects'],
  },
  {
    id: 'post-4',
    slug: 'turkey-property-citizenship-regulations',
    title: 'Turkish Citizenship by Real Estate: Updated Laws and Valuation Rules',
    summary: 'Key legal insights and appraisal criteria for buyers seeking citizenship through property acquisition in Istanbul and Antalya.',
    content: 'Navigating official valuation reports (Ekspertiz), foreign exchange conversion certificates (DAB), and land registry annotations...',
    coverImage: '/images/turkey/cities/istanbul.webp',
    author: {
      name: 'Zeynep Akman',
      role: 'Legal Compliance Counsel',
    },
    publishedAt: '2026-08-30T10:00:00.000Z',
    readingTimeMinutes: 7,
    countryCode: 'tr',
    tags: ['Turkey', 'Citizenship', 'Legal'],
  },
];

