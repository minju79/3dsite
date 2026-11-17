import { Building2, Heart, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPage } from './components/AdminPage';
import { BrokerageCalculator } from './components/BrokerageCalculator';
import { CoastalTourSection } from './components/CoastalTourSection';
import { ConsultationSection } from './components/ConsultationSection';
import { Navbar } from './components/Navbar';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import {
  PROPERTY_LISTINGS,
  type DealType,
  type PropertyCategory,
  type PropertyListing,
  type RegionGroup,
} from './data/properties';

const FAVORITES_STORAGE_KEY = 'modeun_ai_realty_favorites_v1';
const LISTINGS_STORAGE_KEY = 'modeun_ai_realty_listings_v2';

const BROKERAGE_STATS = [
  { label: '등록번호', value: '29200-2024-00908' },
  { label: '대표 공인중개사', value: '오민주' },
  { label: '권리분석 사고율', value: '0.00%' },
  { label: '전속 매물 평균 계약', value: '19일' },
];

const CORE_SERVICES = [
  {
    index: '01.',
    title: '등기·건축물대장 정밀 권리분석',
    description:
      '계약서 작성 전 선순위 근저당, 가압류, 위반건축물 여부와 전세보증보험 가입 가능 여부를 교차 검증하여 안전 거래를 보장합니다.',
  },
  {
    index: '02.',
    title: '국토교통부 실거래가 기반 적정가 산정',
    description:
      '최근 24개월 실거래 내역과 호가 추이, 주변 개발 호재를 반영해 매수자와 매도자 모두 납득할 수 있는 객관적 가격 리포트를 제공합니다.',
  },
  {
    index: '03.',
    title: '광주 상무지구·오션뷰 수익률 분석',
    description:
      '상무중앙로 상권 유동인구와 바다 조망권의 영구 보존 여부, 임대 수익률 및 세후 현금흐름을 세무 자문과 연계해 시뮬레이션합니다.',
  },
  {
    index: '04.',
    title: '계약부터 대출·잔금·소유권 이전까지 동행',
    description:
      '가계약 특약 조율, 시중은행 담보·전세대출 금리 비교, 법무사 소유권 이전 등기까지 대표 공인중개사가 끝까지 책임집니다.',
  },
];

export default function App() {
  const [isAdminPage, setIsAdminPage] = useState<boolean>(
    () => typeof window !== 'undefined' && window.location.hash === '#admin'
  );

  const [listings, setListings] = useState<PropertyListing[]>(() => {
    try {
      const raw = localStorage.getItem(LISTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as PropertyListing[];
        }
      }
    } catch {
      // Fallback to default dataset
    }
    return PROPERTY_LISTINGS;
  });

  const [dealFilter, setDealFilter] = useState<'전체' | DealType>('전체');
  const [categoryFilter, setCategoryFilter] = useState<'전체' | PropertyCategory>('전체');
  const [regionFilter, setRegionFilter] = useState<'전체' | RegionGroup>('전체');
  const [sortBy, setSortBy] = useState<'featured' | 'priceAsc' | 'priceDesc' | 'areaDesc'>(
    'featured'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [activeListing, setActiveListing] = useState<PropertyListing | null>(null);
  const [bookingListing, setBookingListing] = useState<PropertyListing | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setIsAdminPage(window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings));
    } catch {
      // Ignore storage quota errors
    }
  }, [listings]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  const openAdminPage = () => {
    setIsAdminPage(true);
    if (window.location.hash !== '#admin') {
      window.history.pushState(null, '', '#admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitAdminPage = () => {
    setIsAdminPage(false);
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', '#');
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = listings.filter((item) => {
      if (dealFilter !== '전체' && item.dealType !== dealFilter) return false;
      if (categoryFilter !== '전체' && item.category !== categoryFilter) return false;
      if (regionFilter !== '전체' && item.region !== regionFilter) return false;
      if (favoritesOnly && !favorites.includes(item.id)) return false;
      if (q) {
        const hay = `${item.title} ${item.address} ${item.subtitle} ${item.code}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'priceAsc') {
      sorted.sort((a, b) => a.priceManwon - b.priceManwon);
    } else if (sortBy === 'priceDesc') {
      sorted.sort((a, b) => b.priceManwon - a.priceManwon);
    } else if (sortBy === 'areaDesc') {
      sorted.sort((a, b) => b.exclusiveAreaSqm - a.exclusiveAreaSqm);
    } else {
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }
    return sorted;
  }, [listings, dealFilter, categoryFilter, regionFilter, favoritesOnly, favorites, searchQuery, sortBy]);

  const resetFilters = () => {
    setDealFilter('전체');
    setCategoryFilter('전체');
    setRegionFilter('전체');
    setSearchQuery('');
    setFavoritesOnly(false);
    setSortBy('featured');
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookFromModal = (listing: PropertyListing) => {
    setActiveListing(null);
    setBookingListing(listing);
    scrollToSection('consult');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar
        isAdminPage={isAdminPage}
        onNavigateSection={scrollToSection}
        onOpenAdmin={openAdminPage}
        onExitAdmin={exitAdminPage}
      />

      {isAdminPage ? (
        <main>
          <AdminPage
            listings={listings}
            onSaveListings={(next) => setListings(next)}
            onResetDefaults={() => setListings(PROPERTY_LISTINGS)}
            onExitAdmin={exitAdminPage}
          />
        </main>
      ) : (
        <main>
          {/* First Screen: Full-bleed Interactive 3D Cherry Blossom Coastal Bicycle Tour */}
          <CoastalTourSection
            onExploreListings={() => scrollToSection('listings')}
          />

          {/* Quick Search & Verified Brokerage Strip */}
          <section className="mx-auto max-w-7xl px-6 pt-12 pb-4">
            <dl className="grid grid-cols-2 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {BROKERAGE_STATS.map((stat) => (
                <div key={stat.label} className="px-6 py-5">
                  <dt className="text-xs font-medium text-slate-500">{stat.label}</dt>
                  <dd className="mt-1 font-display text-xl font-bold text-slate-950 tabular-nums sm:text-2xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Featured & Filterable Property Listings */}
          <section id="listings" className="mx-auto max-w-7xl px-6 py-14 scroll-mt-16">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold tracking-wide text-teal-800">
                  실시간 중개 매물 · 모든ai부동산.kr
                </p>
                <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
                  엄선된 추천 매물
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-600 tabular-nums">
                  전체 {listings.length}건 중{' '}
                  <span className="font-semibold text-slate-950">
                    {filteredListings.length}건
                  </span>{' '}
                  표시
                </p>
                <button
                  type="button"
                  onClick={openAdminPage}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <Settings2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  <span>매물 수정·등록 (관리자 페이지)</span>
                </button>
              </div>
            </div>

            {/* Search & Interactive Filter Toolbar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    aria-label="매물 검색"
                    placeholder="지역·단지·코드 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-44 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:outline-none sm:w-52"
                  />
                </div>

                <div className="flex items-center rounded-lg bg-slate-100 p-1">
                  {(['전체', '매매', '전세', '월세'] as const).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setDealFilter(dt)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        dealFilter === dt
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {dt}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="매물 종류 필터"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as '전체' | PropertyCategory)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-700 focus:outline-none"
                >
                  <option value="전체">매물 종류 전체</option>
                  <option value="아파트">아파트</option>
                  <option value="단독·오션빌라">단독·오션빌라</option>
                  <option value="상가·빌딩">상가·빌딩</option>
                </select>

                <select
                  aria-label="지역 권역 필터"
                  value={regionFilter}
                  onChange={(e) =>
                    setRegionFilter(e.target.value as '전체' | RegionGroup)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-700 focus:outline-none"
                >
                  <option value="전체">지역 전체</option>
                  <option value="광주·전남">광주·전남</option>
                  <option value="동해안·부산">동해안·부산</option>
                  <option value="서울 핵심지">서울 핵심지</option>
                  <option value="제주">제주</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFavoritesOnly((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    favoritesOnly
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                  <span>관심 매물 ({favorites.length})</span>
                </button>

                <select
                  aria-label="매물 정렬 기준"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'featured' | 'priceAsc' | 'priceDesc' | 'areaDesc'
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-700 focus:outline-none"
                >
                  <option value="featured">추천순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="areaDesc">면적 넓은순</option>
                </select>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                <Building2 className="h-10 w-10 text-slate-300" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                  조건에 일치하는 매물이 없습니다
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  검색어나 거래유형 필터를 조정해 다른 매물을 확인해 보세요.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  필터 전체 초기화
                </button>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <PropertyCard
                    key={listing.id}
                    listing={listing}
                    isFavorite={favorites.includes(listing.id)}
                    onToggleFavorite={toggleFavorite}
                    onSelect={setActiveListing}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Brokerage Services & Statutory Fee / Loan Calculator */}
          <section id="services" className="mx-auto max-w-7xl px-6 py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-teal-800">
                전문 중개 프로세스
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 text-balance">
                안전한 부동산 거래를 위한 4단계 검증 기준
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {CORE_SERVICES.map((srv) => (
                <div
                  key={srv.index}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="font-mono-tabular text-sm font-semibold text-teal-700">
                    {srv.index}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-slate-950">
                    {srv.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {srv.description}
                  </p>
                </div>
              ))}
            </div>

            <div id="calculator" className="mt-14 scroll-mt-24">
              <BrokerageCalculator />
            </div>
          </section>

          {/* Buyer Viewing & Seller Listing Submission */}
          <ConsultationSection selectedListingForBooking={bookingListing} />
        </main>
      )}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 text-xs text-slate-500 md:flex-row md:items-center">
          <div>
            <div className="font-display text-sm font-bold text-slate-900">
              모든AI부동산중개사무소
            </div>
            <p className="mt-1">
              대표 공인중개사 오민주 · 등록번호 29200-2024-00908 · 전남광주통합특별시 서구 상무중앙로 7, 5층 · 010-3973-4338 · 모든ai부동산.kr
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-slate-600">
            <button
              type="button"
              onClick={() => {
                exitAdminPage();
                window.setTimeout(() => scrollToSection('tour'), 20);
              }}
              className="hover:text-slate-950"
            >
              3D 투어
            </button>
            <button
              type="button"
              onClick={() => {
                exitAdminPage();
                window.setTimeout(() => scrollToSection('listings'), 20);
              }}
              className="hover:text-slate-950"
            >
              추천 매물
            </button>
            <button
              type="button"
              onClick={() => {
                exitAdminPage();
                window.setTimeout(() => scrollToSection('calculator'), 20);
              }}
              className="hover:text-slate-950"
            >
              중개보수 계산기
            </button>
            <button
              type="button"
              onClick={() => {
                exitAdminPage();
                window.setTimeout(() => scrollToSection('consult'), 20);
              }}
              className="hover:text-slate-950"
            >
              방문·매물상담
            </button>
            <button
              type="button"
              onClick={openAdminPage}
              className="font-semibold text-teal-800 hover:text-teal-950"
            >
              관리자 페이지
            </button>
          </div>
        </div>
      </footer>

      <PropertyDetailModal
        listing={activeListing}
        isFavorite={activeListing ? favorites.includes(activeListing.id) : false}
        onToggleFavorite={toggleFavorite}
        onClose={() => setActiveListing(null)}
        onBookViewing={handleBookFromModal}
      />
    </div>
  );
}
