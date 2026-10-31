'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building,
  MapPin,
  DollarSign,
  Maximize2,
  Image as ImageIcon,
  CheckSquare,
  Sparkles,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  ListingDetail,
  ListingDetailSchema,
  CountryCode,
  CurrencyCode,
  PropertyType,
  PropertyStatus,
  FIXTURE_DEVELOPERS,
  FIXTURE_LOCATIONS,
} from '@wild-hills/contracts';
import { saveAdminListing, deleteAdminListing } from '@/lib/data';
import { cn } from '@/lib/utils';
import { DeleteListingDialog } from './DeleteListingDialog';

export interface ListingFormProps {
  initialListing?: ListingDetail | null;
  mode?: 'create' | 'edit';
}

const COMMON_AMENITIES = [
  'Sea view',
  'Private pool',
  'Balcony or terrace',
  'Smart home',
  '24/7 security',
  'Parking',
  "Maid's room",
  'Gym',
  'Private garden',
  'Concierge service',
  'Spa & Wellness',
  'Kids play area',
];

export function ListingForm({ initialListing, mode = 'create' }: ListingFormProps) {
  const router = useRouter();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'location' | 'specs' | 'media' | 'developer' | 'amenities'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  // 1. Basic Info
  const [title, setTitle] = useState(initialListing?.title || '');
  const [titleAr, setTitleAr] = useState(initialListing?.title || '');
  const [slug, setSlug] = useState(initialListing?.slug || '');
  const [refNumber, setRefNumber] = useState(initialListing?.refNumber || 'WH-AE-105');
  const [propertyType, setPropertyType] = useState<PropertyType>(initialListing?.propertyType || 'apartment');
  const [status, setStatus] = useState<PropertyStatus>(initialListing?.status || 'ready');
  const [completionYear, setCompletionYear] = useState<string>(initialListing?.completionYear ? String(initialListing.completionYear) : '2025');
  const [description, setDescription] = useState(initialListing?.description || '');

  // 2. Pricing & Payment
  const [price, setPrice] = useState<string>(
    initialListing ? String(initialListing.priceMinor / 100) : '2500000'
  );
  const [currency, setCurrency] = useState<CurrencyCode>(initialListing?.currency || 'AED');
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>(
    initialListing?.paymentPlan?.downPaymentPercent ? String(initialListing.paymentPlan.downPaymentPercent) : '20'
  );
  const [hasInstallments, setHasInstallments] = useState<boolean>(Boolean(initialListing?.paymentPlan));

  // 3. Location Details
  const [countryCode, setCountryCode] = useState<CountryCode>(initialListing?.location.countryCode || 'ae');
  const [city, setCity] = useState(initialListing?.location.city || 'Dubai');
  const [area, setArea] = useState(initialListing?.location.area || 'Downtown Dubai');
  const [latitude, setLatitude] = useState<string>(
    initialListing?.coordinates?.lat ? String(initialListing.coordinates.lat) : '25.1972'
  );
  const [longitude, setLongitude] = useState<string>(
    initialListing?.coordinates?.lng ? String(initialListing.coordinates.lng) : '55.2744'
  );

  // 4. Specifications
  const [bedrooms, setBedrooms] = useState<number>(initialListing ? initialListing.bedrooms : 2);
  const [bathrooms, setBathrooms] = useState<number>(initialListing ? initialListing.bathrooms : 2);
  const [sizeSqm, setSizeSqm] = useState<string>(initialListing ? String(initialListing.sizeSqm) : '140');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialListing?.isFeatured ?? false);
  const [isHotDeal, setIsHotDeal] = useState<boolean>(initialListing?.isHotDeal ?? false);
  const [isNewLaunch, setIsNewLaunch] = useState<boolean>(initialListing?.isNewLaunch ?? false);
  const [isVerified, setIsVerified] = useState<boolean>(initialListing?.isVerified ?? true);

  // 5. Media & Gallery
  const [coverImage, setCoverImage] = useState(
    initialListing?.coverImage || '/images/defaults/apartment/cover.webp'
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(
    initialListing?.images && initialListing.images.length > 0
      ? initialListing.images.map((img) => img.url)
      : [
          '/images/defaults/apartment/cover-card.webp',
          '/images/defaults/apartment/cover.webp',
        ]
  );
  const [floorPlanUrl, setFloorPlanUrl] = useState(
    initialListing?.floorPlans?.[0]?.url || '/images/defaults/apartment/cover-card.webp'
  );
  const [floorPlanTitle, setFloorPlanTitle] = useState(
    initialListing?.floorPlans?.[0]?.title || 'Typical Floor Plan Layout'
  );

  // 6. Developer Assignment
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string>(
    initialListing?.developer?.id || 'dev-emaar'
  );

  // 7. Amenities Checklist
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialListing?.features || ['Sea view', 'Private pool', 'Smart home', '24/7 security']
  );

  // Auto-generate slug when title changes in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (mode === 'create') {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated ? `${refNumber.toLowerCase()}-${generated}` : '');
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddGalleryImage = () => {
    setGalleryImages((prev) => [...prev, '/images/defaults/apartment/cover.webp']);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateGalleryImage = (index: number, val: string) => {
    setGalleryImages((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleSave = async (publishLive = true) => {
    setIsSaving(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Please specify a valid asking price.');
      }

      const parsedSqm = parseFloat(sizeSqm);
      if (isNaN(parsedSqm) || parsedSqm <= 0) {
        throw new Error('Please specify a valid property area in sqm.');
      }

      const priceMinor = Math.round(parsedPrice * 100);
      const sizeSqft = Math.round(parsedSqm * 10.7639);

      // Selected developer object
      const matchedDev = FIXTURE_DEVELOPERS.find((d) => d.id === selectedDeveloperId);

      const listingPayload: ListingDetail = {
        id: initialListing?.id || `list-${countryCode}-${Date.now().toString().slice(-4)}`,
        refNumber: refNumber.trim(),
        slug: slug.trim() || `${refNumber.toLowerCase()}-property`,
        title: title.trim(),
        propertyType,
        status: publishLive ? status : 'draft' as unknown as PropertyStatus,
        location: {
          id: `loc-${countryCode}-${city.toLowerCase().replace(/\s+/g, '-')}`,
          countryCode,
          city: city.trim(),
          area: area.trim() ? area.trim() : undefined,
        },
        developer: matchedDev
          ? { id: matchedDev.id, name: matchedDev.name, slug: matchedDev.slug }
          : undefined,
        project: undefined,
        priceMinor,
        currency,
        priceUsdMinor: Math.round(priceMinor * 0.27), // Approximate USD normalization
        bedrooms,
        bathrooms,
        sizeSqm: parsedSqm,
        sizeSqft,
        coverImage,
        images: galleryImages.map((url, order) => ({ url, order, alt: `${title} image ${order + 1}` })),
        floorPlans: [
          {
            url: floorPlanUrl,
            title: floorPlanTitle,
            bedrooms,
            bathrooms,
            sizeSqm: parsedSqm,
          },
        ],
        features: selectedAmenities,
        isHotDeal,
        isFeatured,
        isVerified,
        isNewLaunch,
        isSample: false,
        completionYear: parseInt(completionYear, 10) || 2025,
        furnishingStatus: 'furnished',
        badges: [
          ...(isVerified ? ['Verified'] : []),
          ...(isHotDeal ? ['Hot Deal'] : []),
          ...(isNewLaunch ? ['New Launch'] : []),
        ],
        description: description.trim() || 'Luxury residential development designed to the highest standards.',
        videoUrl: null,
        virtualTourUrl: null,
        agent: initialListing?.agent || {
          name: 'Elena Rostova',
          phone: '+971 4 000 0000',
          whatsapp: '+97140000000',
          email: 'advisory@wildhills.example',
          avatarUrl: '/images/defaults/apartment/cover-card.webp',
          license: 'WH-ADV-8821',
        },
        paymentPlan: hasInstallments
          ? {
              downPaymentPercent: parseFloat(downPaymentPercent) || 20,
              installmentsCount: 4,
              installmentDurationMonths: 6,
              postHandover: false,
              milestoneBreakdown: [
                { milestone: 'Down Payment on Reservation', percent: parseFloat(downPaymentPercent) || 20 },
                { milestone: 'During Construction (4 Installments)', percent: 50 },
                { milestone: 'On 100% Handover & Key Collection', percent: 30 },
              ],
            }
          : null,
        coordinates: {
          lat: parseFloat(latitude) || 25.1972,
          lng: parseFloat(longitude) || 55.2744,
        },
        publishedAt: initialListing?.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Strict validation against contracts schema
      const validated = ListingDetailSchema.parse(listingPayload);
      await saveAdminListing(validated);

      setSuccessMessage(
        mode === 'create'
          ? 'Listing created and published successfully!'
          : 'Listing updated successfully!'
      );

      setTimeout(() => {
        router.push('/listings');
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: 'Validation error: please verify all required fields.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialListing) return;
    setIsDeleting(true);
    await deleteAdminListing(initialListing.id);
    setIsDeleting(false);
    router.push('/listings');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <Link
            href="/listings"
            className="p-2 rounded-xl bg-white border border-line text-navy hover:bg-sand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {mode === 'create' ? 'Create New Listing' : `Edit: ${initialListing?.title}`}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Ref: <span className="font-mono font-semibold text-navy">{refNumber}</span> · Status: <span className="capitalize font-semibold">{status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-semibold transition-colors"
            >
              Delete
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-line bg-white text-navy hover:bg-sand text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gold text-navy font-bold text-xs sm:text-sm hover:bg-gold/90 shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errors.form && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-line text-xs font-semibold">
        {[
          { key: 'basic', label: '1. Basic Info' },
          { key: 'pricing', label: '2. Pricing & Payment' },
          { key: 'location', label: '3. Location & Map' },
          { key: 'specs', label: '4. Specs & Metrics' },
          { key: 'media', label: '5. Media & Gallery' },
          { key: 'developer', label: '6. Developer' },
          { key: 'amenities', label: '7. Amenities' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
              activeTab === tab.key
                ? 'bg-navy text-sand font-bold shadow-sm'
                : 'bg-white text-navy/70 border border-line hover:bg-sand'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content Sections */}
      <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-sm">
        {/* ================= SECTION 1: Basic Information ================= */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Basic Property Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Title (English) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Skyline Waterfront Penthouse"
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Title (Arabic / Regional)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="عنوان العقار بالعربية"
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Reference Code *
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. WH-AE-101"
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. wh-ae-101-skyline-penthouse"
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Property Type *
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold capitalize"
                >
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="duplex">Duplex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Completion Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="ready">Ready (Completed)</option>
                  <option value="off_plan">Off-Plan (New Launch)</option>
                  <option value="under_construction">Under Construction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Handover Year
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={completionYear}
                  onChange={(e) => setCompletionYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                Property Narrative & Description *
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive editorial description covering architecture, views, materials, and living experience..."
                className="w-full px-4 py-3 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ================= SECTION 2: Pricing & Payment ================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Pricing, Currency & Payment Plan</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Asking Price *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Currency *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="EGP">EGP (Egyptian Pound)</option>
                  <option value="GEL">GEL (Georgian Lari)</option>
                  <option value="TRY">TRY (Turkish Lira)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Price / m² Estimate
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-sand/30 border border-line text-sm font-semibold text-navy/70">
                  {price && sizeSqm && parseFloat(sizeSqm) > 0
                    ? `${new Intl.NumberFormat('en-US').format(
                        Math.round(parseFloat(price) / parseFloat(sizeSqm))
                      )} ${currency} / m²`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Structured Installment Payment Plan */}
            <div className="pt-6 border-t border-line space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-base font-bold text-navy">Developer Payment Plan</h4>
                  <p className="text-xs text-muted">Enable structured installment milestones for off-plan purchasers</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInstallments}
                    onChange={(e) => setHasInstallments(e.target.checked)}
                    className="rounded border-line text-gold focus:ring-gold h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-navy">Offer Installments</span>
                </label>
              </div>

              {hasInstallments && (
                <div className="p-5 rounded-2xl bg-sand/40 border border-line grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1.5">
                      Down Payment %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-line text-sm text-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1.5">
                      During Construction %
                    </label>
                    <input
                      type="number"
                      disabled
                      value={50}
                      className="w-full px-3 py-2 rounded-lg bg-sand border border-line text-sm text-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1.5">
                      On Handover %
                    </label>
                    <input
                      type="number"
                      disabled
                      value={30}
                      className="w-full px-3 py-2 rounded-lg bg-sand border border-line text-sm text-muted"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SECTION 3: Location Details ================= */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Location & Geographic Coordinates</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Country Market *
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="ae">United Arab Emirates (ae)</option>
                  <option value="eg">Egypt (eg)</option>
                  <option value="ge">Georgia (ge)</option>
                  <option value="tr">Turkey (tr)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dubai, Istanbul..."
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  District / Area
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dubai Marina, Vake..."
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 4: Specs & Metrics ================= */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Property Dimensions & Features</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Bedrooms *
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none"
                >
                  <option value={0}>Studio (0 Beds)</option>
                  <option value={1}>1 Bedroom</option>
                  <option value={2}>2 Bedrooms</option>
                  <option value={3}>3 Bedrooms</option>
                  <option value={4}>4 Bedrooms</option>
                  <option value={5}>5+ Bedrooms</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Bathrooms *
                </label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm focus:outline-none"
                >
                  <option value={1}>1 Bath</option>
                  <option value={1.5}>1.5 Baths</option>
                  <option value={2}>2 Baths</option>
                  <option value={3}>3 Baths</option>
                  <option value={4}>4 Baths</option>
                  <option value={5}>5+ Baths</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  Total Area (m²) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={sizeSqm}
                  onChange={(e) => setSizeSqm(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            {/* Editorial Status Badges */}
            <div className="pt-6 border-t border-line">
              <h4 className="font-serif text-base font-bold text-navy mb-3">Featured Placement & Editorial Badges</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-sand/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-line text-gold focus:ring-gold h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-navy">Featured Flag</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-sand/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHotDeal}
                    onChange={(e) => setIsHotDeal(e.target.checked)}
                    className="rounded border-line text-gold focus:ring-gold h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-navy">Hot Deal</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-sand/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewLaunch}
                    onChange={(e) => setIsNewLaunch(e.target.checked)}
                    className="rounded border-line text-gold focus:ring-gold h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-navy">New Launch</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-sand/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="rounded border-line text-gold focus:ring-gold h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-navy">Verified Escrow</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 5: Media & Gallery ================= */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Media Assets & Gallery</h3>

            {/* Primary Cover Image */}
            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                Primary Hero Cover Image URL *
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/images/uae/areas/dubai-marina.avif"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sand/50 border border-line text-navy text-sm font-mono focus:outline-none"
                />
                <div className="w-16 h-11 rounded-lg overflow-hidden bg-sand border border-line shrink-0">
                  <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Additional Photo Gallery Slots */}
            <div className="pt-4 border-t border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-base font-bold text-navy">Gallery Photos ({galleryImages.length})</h4>
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-sand text-navy text-xs font-semibold hover:bg-sand/70"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {galleryImages.map((imgUrl, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted w-5">{i + 1}.</span>
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => handleUpdateGalleryImage(i, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-sand/50 border border-line text-xs font-mono text-navy"
                    />
                    <div className="w-10 h-8 rounded overflow-hidden bg-sand border border-line shrink-0">
                      <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(i)}
                      className="p-2 text-muted hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Floor Plan Slot */}
            <div className="pt-4 border-t border-line space-y-3">
              <h4 className="font-serif text-base font-bold text-navy">Architectural Floor Plan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-navy mb-1.5">Floor Plan Title</label>
                  <input
                    type="text"
                    value={floorPlanTitle}
                    onChange={(e) => setFloorPlanTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-sand/50 border border-line text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy mb-1.5">Floor Plan Image URL</label>
                  <input
                    type="text"
                    value={floorPlanUrl}
                    onChange={(e) => setFloorPlanUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-sand/50 border border-line text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 6: Developer Assignment ================= */}
        {activeTab === 'developer' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Master Developer Assignment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIXTURE_DEVELOPERS.map((dev) => (
                <label
                  key={dev.id}
                  onClick={() => setSelectedDeveloperId(dev.id)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all',
                    selectedDeveloperId === dev.id
                      ? 'bg-gold/10 border-gold shadow-sm'
                      : 'bg-sand/30 border-line hover:border-gold/50'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-line flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6 text-navy" />
                  </div>
                  <div className="flex-1">
                    <span className="font-serif text-base font-bold text-navy block">
                      {dev.name}
                    </span>
                    <span className="text-xs text-muted block mt-0.5 line-clamp-1">
                      {dev.description}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gold block mt-2">
                      {dev.projectCount} Projects · {dev.activeListingCount} Listings
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 7: Amenities Checklist ================= */}
        {activeTab === 'amenities' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy">Amenities & Property Features</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COMMON_AMENITIES.map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    onClick={() => handleToggleAmenity(amenity)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all',
                      isChecked
                        ? 'bg-navy text-sand border-navy shadow-sm'
                        : 'bg-sand/40 text-navy border-line hover:border-gold'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="hidden"
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteListingDialog
        isOpen={showDeleteDialog}
        listingTitle={title}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

