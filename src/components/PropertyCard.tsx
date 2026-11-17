import { Building2, Heart, MapPin } from 'lucide-react';
import { useState } from 'react';
import {
  formatListingPrice,
  sqmToPyeong,
  type PropertyListing,
} from '../data/properties';

interface PropertyCardProps {
  listing: PropertyListing;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (listing: PropertyListing) => void;
}

export function PropertyCard({
  listing,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {!imgError ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 p-4 text-center text-slate-500">
            <Building2 className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-medium">{listing.title}</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(listing.id);
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? '관심 매물 해제' : '관심 매물 저장'}
          className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-teal-700 ${
            isFavorite
              ? 'border-rose-200 bg-white text-rose-600'
              : 'border-slate-200/80 bg-white/90 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelect(listing)}
        className="flex flex-1 flex-col justify-between p-5 text-left focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        <div>
          {/* Unboxed quiet metadata line */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="text-teal-800 font-semibold">{listing.dealType}</span>
            <span aria-hidden="true">·</span>
            <span>{listing.category}</span>
            <span aria-hidden="true">·</span>
            <span>{listing.floorLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{listing.code}</span>
          </div>

          <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-slate-900 group-hover:text-teal-800">
            {listing.title}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {listing.subtitle}
          </p>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-slate-950 tabular-nums">
              {formatListingPrice(listing)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{listing.address}</span>
            </span>
            <span className="font-mono-tabular shrink-0 text-slate-700">
              전용 {listing.exclusiveAreaSqm.toFixed(1)}㎡ ({sqmToPyeong(listing.exclusiveAreaSqm)}평)
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
