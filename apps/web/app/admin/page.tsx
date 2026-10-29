export const dynamic = 'force-dynamic';

export default function AdminPlaceholderPage() {
  return (
    <div className="min-h-screen bg-navy text-ivory flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-navy-2 p-8 rounded-card border border-line/20 text-center">
        <h1 className="font-serif text-2xl font-semibold mb-2 text-ivory">
          Wild Hills Admin
        </h1>
        <p className="text-muted text-sm mb-6">
          Staff and Administrator portal (English only, protected).
        </p>
        <div className="text-xs text-gold-light bg-navy p-3 rounded border border-gold/30">
          Admin portal foundation ready for Stage 11 &amp; 12.
        </div>
      </div>
    </div>
  );
}
