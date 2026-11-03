import {
  CountrySettingsSchema,
  BuyingGuideSchema,
  FaqItemSchema,
  TestimonialSchema,
  BlogPostSchema,
  type CountrySettings,
  type BuyingGuide,
  type FaqItem,
  type Testimonial,
  type BlogPost,
  type CountryCode,
} from '@wild-hills/contracts';
import {
  FIXTURE_COUNTRY_SETTINGS,
  FIXTURE_BUYING_GUIDES,
  FIXTURE_FAQS,
  FIXTURE_TESTIMONIALS,
  FIXTURE_BLOG_POSTS,
} from '@wild-hills/contracts/fixtures';

export class ContentService {
  async getCountrySettings(countryCode: CountryCode): Promise<CountrySettings> {
    const settings = FIXTURE_COUNTRY_SETTINGS[countryCode];
    if (!settings) {
      throw new Error(`Country settings not found for ${countryCode}`);
    }
    return CountrySettingsSchema.parse(settings);
  }

  async getBuyingGuide(countryCode: CountryCode): Promise<BuyingGuide | null> {
    const guide = FIXTURE_BUYING_GUIDES.find((g) => g.countryCode === countryCode);
    if (!guide) return null;
    return BuyingGuideSchema.parse(guide);
  }

  async getFaqs(countryCode?: CountryCode): Promise<FaqItem[]> {
    let faqs = FIXTURE_FAQS;
    if (countryCode) {
      faqs = faqs.filter((f) => !f.countryCode || f.countryCode === countryCode);
    }
    return faqs.map((f) => FaqItemSchema.parse(f));
  }

  async getTestimonials(countryCode?: CountryCode): Promise<Testimonial[]> {
    let testimonials = FIXTURE_TESTIMONIALS;
    if (countryCode) {
      testimonials = testimonials.filter((t) => !t.countryCode || t.countryCode === countryCode);
    }
    return testimonials.map((t) => TestimonialSchema.parse(t));
  }

  async getBlogPosts(countryCode?: CountryCode): Promise<BlogPost[]> {
    let posts = FIXTURE_BLOG_POSTS;
    if (countryCode) {
      posts = posts.filter((p) => !p.countryCode || p.countryCode === countryCode);
    }
    return posts.map((p) => BlogPostSchema.parse(p));
  }
}

export const contentService = new ContentService();
