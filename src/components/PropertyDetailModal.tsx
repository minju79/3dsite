import { Building2, Check, Heart, MapPin, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  formatListingPrice,
  sqmToPyeong,
  type PropertyListing,
} from '../data/properties';

interface PropertyDetailModalProps {
  listing: PropertyListing | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onBookViewing: (listing: PropertyListing) => void;
}

export function PropertyDetailModal({
  listing,
  isFavorite,
  onToggleFavorite,
  onClose,
  onBookViewing,
}: PropertyDetailModalProps) {
  const [unitMode, setUnitMode] = useState<'sqm' | 'pyeong'>('sqm');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [listing?.id]);

  useEffect(() => {
    if (!listing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [listing, onClose]);

  if (!listing) return null;

  const formatArea = (sqm: number) =>
    unitMode === 'sqm' ? `${sqm.toFixed(1)}㎡` : `${sqmToPyeong(sqm)}평`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-teal-800">{listing.dealType}</span>
              <span aria-hidden="true">·</span>
              <span>{listing.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">매물번호 {listing.code}</span>
            </div>
            <h2
              id="property-modal-title"
              className="mt-0.5 truncate font-display text-xl font-bold text-slate-950"
            >
              {listing.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(listing.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isFavorite
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? '관심 매물' : '찜하기'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="상세 창 닫기"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {!imgError ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
                  <Building2 className="h-10 w-10 text-slate-400" />
                  <span className="text-sm">{listing.title}</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                담당 공인중개사 현장 브리핑
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {listing.brokerNote}
              </p>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">주요 특징</h3>
              <ul className="mt-2 space-y-2">
                {listing.highlights.map((hl) => (
                  <li
                    key={hl}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                      aria-hidden="true"
                    />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 lg:col-span-5">
            <div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-medium text-slate-500">
                  {listing.dealType} 희망 가격
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-slate-950 tabular-nums">
                  {formatListingPrice(listing)}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>{listing.address}</span>
                </div>
              </div>

              {/* Area unit switcher */}
              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">매물 상세 정보</h3>
                <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setUnitMode('sqm')}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                      unitMode === 'sqm'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ㎡ 보기
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitMode('pyeong')}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                      unitMode === 'pyeong'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    평(PY) 보기
                  </button>
                </div>
              </div>

              <dl className="mt-3 divide-y divide-slate-100 border-y border-slate-200 text-sm">
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">전용 / 공급면적</dt>
                  <dd className="font-mono-tabular font-medium text-slate-900">
                    {formatArea(listing.exclusiveAreaSqm)} /{' '}
                    {formatArea(listing.supplyAreaSqm)}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">층수 / 방향</dt>
                  <dd className="font-medium text-slate-900">
                    {listing.floorLabel} · {listing.direction}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">구조</dt>
                  <dd className="font-medium text-slate-900">{listing.rooms}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">주차</dt>
                  <dd className="font-medium text-slate-900">{listing.parking}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">월 평균 관리비</dt>
                  <dd className="font-mono-tabular font-medium text-slate-900">
                    {listing.maintenanceFeeManwon > 0
                      ? `약 ${listing.maintenanceFeeManwon}만 원`
                      : '개별 정산'}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-slate-500">입주 가능일</dt>
                  <dd className="font-medium text-slate-900">{listing.moveInDate}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-700">주변 생활·교통 인프라</div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  {listing.nearbyInfra.map((infra, idx) => (
                    <span key={infra}>
                      {idx > 0 && <span className="mr-3 text-slate-300">·</span>}
                      {infra}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-slate-900">
                    {listing.agentName} {listing.agentTitle}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 font-mono-tabular text-xs text-slate-500">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{listing.agentPhone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onBookViewing(listing)}
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
                >
                  방문 예약하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
