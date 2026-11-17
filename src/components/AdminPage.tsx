import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  Download,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Unlock,
  Upload,
} from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  formatListingPrice,
  PROPERTY_LISTINGS,
  sqmToPyeong,
  type DealType,
  type PropertyCategory,
  type PropertyListing,
  type RegionGroup,
} from '../data/properties';

interface AdminPageProps {
  listings: PropertyListing[];
  onSaveListings: (next: PropertyListing[]) => void;
  onResetDefaults: () => void;
  onExitAdmin: () => void;
}

const IMAGE_PRESETS = [
  {
    label: '광주·서울 도심 아파트',
    url: '/src/assets/images/listing_gangnam_apt_1794915086839.jpg',
  },
  {
    label: '오션뷰 펜트하우스 거실',
    url: '/src/assets/images/listing_ocean_penthouse_1794915086972.jpg',
  },
  {
    label: '상무·해안 4층 코너 상가',
    url: '/src/assets/images/listing_retail_building_1794915088790.jpg',
  },
  {
    label: '오션테라스 단독주택',
    url: '/src/assets/images/hero_coastal_villa_1794915085039.jpg',
  },
];

const PIN_LOCK_ENABLED_KEY = 'modeun_ai_admin_pin_enabled';
const ADMIN_PIN_CODE = '4338';

function createBlankListing(existingCount: number): PropertyListing {
  return {
    id: `custom-${Date.now()}`,
    code: `MD-${2610 + existingCount}`,
    title: '',
    subtitle: '',
    dealType: '매매',
    category: '아파트',
    region: '광주·전남',
    address: '전남광주통합특별시 서구 ',
    priceManwon: 55000,
    monthlyRentManwon: 0,
    exclusiveAreaSqm: 84.9,
    supplyAreaSqm: 112.0,
    floorLabel: '12층 / 25층',
    direction: '남향',
    rooms: '방 3 · 욕실 2',
    parking: '세대당 1.5대',
    maintenanceFeeManwon: 20,
    moveInDate: '즉시 입주 협의',
    imageUrl: IMAGE_PRESETS[0].url,
    featured: true,
    highlights: ['등기부등본 권리분석 완료', '실거래가 기반 가격 검증'],
    brokerNote: '',
    nearbyInfra: ['상무역 도보권', '생활 편의시설 인접'],
    agentName: '오민주',
    agentTitle: '대표 공인중개사',
    agentPhone: '010-3973-4338',
  };
}

export function AdminPage({
  listings,
  onSaveListings,
  onResetDefaults,
  onExitAdmin,
}: AdminPageProps) {
  const [pinEnabled, setPinEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PIN_LOCK_ENABLED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [unlocked, setUnlocked] = useState<boolean>(() => !pinEnabled);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [editing, setEditing] = useState<PropertyListing | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [highlightsText, setHighlightsText] = useState('');
  const [infraText, setInfraText] = useState('');

  const [searchText, setSearchText] = useState('');
  const [dealFilter, setDealFilter] = useState<'전체' | DealType>('전체');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTogglePinLock = () => {
    const next = !pinEnabled;
    setPinEnabled(next);
    try {
      localStorage.setItem(PIN_LOCK_ENABLED_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
    setStatusMessage(
      next
        ? '관리자 비밀번호 잠금(4338)이 활성화되었습니다. 다음 접속 시 비밀번호를 입력합니다.'
        : '관리자 비밀번호 잠금이 해제되었습니다.'
    );
  };

  const handleUnlock = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN_CODE) {
      setUnlocked(true);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('비밀번호가 일치하지 않습니다. (기본 비밀번호: 4338)');
    }
  };

  const openEditor = (item: PropertyListing | null) => {
    setConfirmDeleteId(null);
    setConfirmReset(false);
    if (item) {
      setEditing({ ...item });
      setIsNew(false);
      setHighlightsText(item.highlights.join('\n'));
      setInfraText(item.nearbyInfra.join('\n'));
    } else {
      const blank = createBlankListing(listings.length);
      setEditing(blank);
      setIsNew(true);
      setHighlightsText(blank.highlights.join('\n'));
      setInfraText(blank.nearbyInfra.join('\n'));
    }
  };

  const handleDuplicate = (item: PropertyListing) => {
    const copy: PropertyListing = {
      ...item,
      id: `copy-${Date.now()}`,
      code: `${item.code}-COPY`,
      title: `${item.title} (사본)`,
      featured: false,
    };
    onSaveListings([copy, ...listings]);
    setStatusMessage(`매물 [${item.code}]이 복제되었습니다. 내용을 수정해 주세요.`);
    openEditor(copy);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 960;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
          setEditing((prev) => (prev ? { ...prev, imageUrl: compressedUrl } : prev));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title.trim()) return;

    const cleaned: PropertyListing = {
      ...editing,
      title: editing.title.trim(),
      subtitle: editing.subtitle.trim() || `${editing.address} 검증 매물`,
      highlights: highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      nearbyInfra: infraText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      monthlyRentManwon:
        editing.dealType === '월세' ? editing.monthlyRentManwon || 0 : undefined,
    };

    const exists = listings.some((l) => l.id === cleaned.id);
    const next = exists
      ? listings.map((l) => (l.id === cleaned.id ? cleaned : l))
      : [cleaned, ...listings];

    onSaveListings(next);
    setEditing(null);
    setStatusMessage(
      isNew
        ? `신규 매물 [${cleaned.code}] ${cleaned.title}이(가) 등록되어 홈페이지에 반영되었습니다.`
        : `매물 [${cleaned.code}] ${cleaned.title} 수정 내용이 저장되었습니다.`
    );
  };

  const handleDeleteConfirmed = (item: PropertyListing) => {
    const next = listings.filter((l) => l.id !== item.id);
    onSaveListings(next);
    setConfirmDeleteId(null);
    setStatusMessage(`매물 [${item.code}] ${item.title}이(가) 삭제되었습니다.`);
  };

  const handleToggleFeatured = (id: string) => {
    const next = listings.map((l) =>
      l.id === id ? { ...l, featured: !l.featured } : l
    );
    onSaveListings(next);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(listings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modeun-ai-listings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
          onSaveListings(parsed as PropertyListing[]);
          setStatusMessage(`JSON 파일에서 ${parsed.length}건의 매물을 불러왔습니다.`);
        } else {
          setStatusMessage('올바른 매물 JSON 형식이 아닙니다.');
        }
      } catch {
        setStatusMessage('JSON 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const filtered = listings.filter((l) => {
    if (dealFilter !== '전체' && l.dealType !== dealFilter) return false;
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return `${l.code} ${l.title} ${l.address} ${l.dealType} ${l.region}`
      .toLowerCase()
      .includes(q);
  });

  const stats = {
    total: listings.length,
    sale: listings.filter((l) => l.dealType === '매매').length,
    lease: listings.filter((l) => l.dealType !== '매매').length,
    featured: listings.filter((l) => l.featured).length,
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] py-10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Workspace Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center">
          <div>
            <div className="text-xs font-semibold text-teal-800">
              모든AI부동산중개사무소 · 대표 오민주 (29200-2024-00908)
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              매물 관리 페이지
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              매물을 직접 등록·수정·삭제하면 홈페이지 추천 매물 목록에 즉시 반영되어 저장됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePinLock}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                pinEnabled
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pinEnabled ? (
                <>
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>잠금 사용 중 (4338)</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>비밀번호 잠금 켜기</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>홈페이지로 돌아가기</span>
            </button>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-12 flex justify-center">
            <form
              onSubmit={handleUnlock}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xs"
            >
              <div className="flex items-center gap-2 text-slate-900">
                <Lock className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold">관리자 인증</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                비밀번호 잠금이 설정되어 있습니다. 비밀번호를 입력해 주세요. (기본값:
                대표번호 뒷 4자리 <span className="font-mono-tabular font-semibold">4338</span>)
              </p>

              <label htmlFor="admin-page-pin" className="sr-only">
                관리자 비밀번호
              </label>
              <input
                id="admin-page-pin"
                type="password"
                inputMode="numeric"
                placeholder="비밀번호 4자리"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                className="mt-4 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono-tabular text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />

              {pinError && (
                <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
              >
                잠금 해제
              </button>
            </form>
          </div>
        ) : editing ? (
          <form
            onSubmit={handleSaveItem}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  {isNew ? '새 매물 등록' : `매물 수정 · ${editing.code}`}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  저장 시 실시간으로 홈페이지 매물 목록과 검색 결과에 반영됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                목록으로 돌아가기
              </button>
            </div>

            {/* Basic Identity */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  매물번호 *
                </label>
                <input
                  type="text"
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm focus:border-teal-700 focus:outline-none"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  매물명 *
                </label>
                <input
                  type="text"
                  placeholder="예: 상무지구 치평동 중앙공원뷰 랜드마크"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.featured)}
                    onChange={(e) =>
                      setEditing({ ...editing, featured: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-teal-700"
                  />
                  <span>추천 매물 상단 우선 노출</span>
                </label>
              </div>
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  거래 유형
                </label>
                <select
                  value={editing.dealType}
                  onChange={(e) =>
                    setEditing({ ...editing, dealType: e.target.value as DealType })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
                >
                  <option value="매매">매매</option>
                  <option value="전세">전세</option>
                  <option value="월세">월세</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  매물 종류
                </label>
                <select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      category: e.target.value as PropertyCategory,
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
                >
                  <option value="아파트">아파트</option>
                  <option value="단독·오션빌라">단독·오션빌라</option>
                  <option value="상가·빌딩">상가·빌딩</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  지역 권역
                </label>
                <select
                  value={editing.region}
                  onChange={(e) =>
                    setEditing({ ...editing, region: e.target.value as RegionGroup })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
                >
                  <option value="광주·전남">광주·전남</option>
                  <option value="동해안·부산">동해안·부산</option>
                  <option value="서울 핵심지">서울 핵심지</option>
                  <option value="제주">제주</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  소재지 주소 *
                </label>
                <input
                  type="text"
                  value={editing.address}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  한줄 요약 설명
                </label>
                <input
                  type="text"
                  value={editing.subtitle}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Price & Area */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {editing.dealType === '매매'
                    ? '매매가 (만 원)'
                    : '보증금 (만 원)'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={editing.priceManwon}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      priceManwon: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
              {editing.dealType === '월세' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    월세 (만 원)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={editing.monthlyRentManwon ?? 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        monthlyRentManwon: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm focus:border-teal-700 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  전용면적 (㎡ · {sqmToPyeong(editing.exclusiveAreaSqm)}평)
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={editing.exclusiveAreaSqm}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      exclusiveAreaSqm: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  공급/연면적 (㎡ · {sqmToPyeong(editing.supplyAreaSqm)}평)
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={editing.supplyAreaSqm}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      supplyAreaSqm: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  층수
                </label>
                <input
                  type="text"
                  value={editing.floorLabel}
                  onChange={(e) =>
                    setEditing({ ...editing, floorLabel: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  방향
                </label>
                <input
                  type="text"
                  value={editing.direction}
                  onChange={(e) =>
                    setEditing({ ...editing, direction: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  구조 (방·욕실)
                </label>
                <input
                  type="text"
                  value={editing.rooms}
                  onChange={(e) => setEditing({ ...editing, rooms: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  주차
                </label>
                <input
                  type="text"
                  value={editing.parking}
                  onChange={(e) => setEditing({ ...editing, parking: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  관리비 (만 원)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editing.maintenanceFeeManwon}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      maintenanceFeeManwon: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  입주 가능일
                </label>
                <input
                  type="text"
                  value={editing.moveInDate}
                  onChange={(e) =>
                    setEditing({ ...editing, moveInDate: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Image Picker & Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  매물 사진 선택, URL 입력 또는 파일 업로드
                </span>
                <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                  <span>사진 파일 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {editing.imageUrl ? (
                      <img
                        src={editing.imageUrl}
                        alt="매물 미리보기"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3 md:col-span-9">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() =>
                          setEditing({ ...editing, imageUrl: preset.url })
                        }
                        className={`rounded-lg border p-2 text-left text-xs transition-colors ${
                          editing.imageUrl === preset.url
                            ? 'border-teal-700 bg-teal-50 font-semibold text-teal-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">
                      또는 이미지 경로/URL 직접 입력
                    </label>
                    <input
                      type="text"
                      value={editing.imageUrl}
                      onChange={(e) =>
                        setEditing({ ...editing, imageUrl: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono-tabular text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights, Nearby Infra & Broker Note */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  주요 특징 (줄바꿈 구분)
                </label>
                <textarea
                  rows={4}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  주변 생활·교통 인프라 (줄바꿈 구분)
                </label>
                <textarea
                  rows={4}
                  value={infraText}
                  onChange={(e) => setInfraText(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  담당 중개사 브리핑 노트
                </label>
                <textarea
                  rows={4}
                  value={editing.brokerNote}
                  onChange={(e) =>
                    setEditing({ ...editing, brokerNote: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Agent info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  담당 중개사
                </label>
                <input
                  type="text"
                  value={editing.agentName}
                  onChange={(e) =>
                    setEditing({ ...editing, agentName: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  직책
                </label>
                <input
                  type="text"
                  value={editing.agentTitle}
                  onChange={(e) =>
                    setEditing({ ...editing, agentTitle: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  담당 연락처
                </label>
                <input
                  type="text"
                  value={editing.agentPhone}
                  onChange={(e) =>
                    setEditing({ ...editing, agentPhone: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{isNew ? '신규 매물 등록 저장' : '수정 내용 저장'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Summary Metrics */}
            <dl className="grid grid-cols-2 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-4">
                <dt className="text-xs font-medium text-slate-500">전체 등록 매물</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-slate-950 tabular-nums">
                  {stats.total}건
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-xs font-medium text-slate-500">매매 매물</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-slate-950 tabular-nums">
                  {stats.sale}건
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-xs font-medium text-slate-500">전세 · 월세</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-slate-950 tabular-nums">
                  {stats.lease}건
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-xs font-medium text-slate-500">상단 추천 매물</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-teal-800 tabular-nums">
                  {stats.featured}건
                </dd>
              </div>
            </dl>

            {/* Action & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditor(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>새 매물 등록</span>
                </button>

                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="매물코드, 제목, 주소 검색..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-56 rounded-lg border border-slate-300 py-2 pr-3 pl-8 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center rounded-lg bg-slate-100 p-1">
                  {(['전체', '매매', '전세', '월세'] as const).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setDealFilter(dt)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                        dealFilter === dt
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>JSON 백업</span>
                </button>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>JSON 불러오기</span>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>

                {confirmReset ? (
                  <div className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1">
                    <span className="text-xs font-medium text-rose-800">초기화?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onResetDefaults();
                        setConfirmReset(false);
                        setStatusMessage(
                          `기본 매물 ${PROPERTY_LISTINGS.length}건으로 복원되었습니다.`
                        );
                      }}
                      className="rounded bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                    >
                      확인
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="rounded px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>기본값 복원</span>
                  </button>
                )}
              </div>
            </div>

            {statusMessage && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-medium text-teal-900">
                {statusMessage}
              </div>
            )}

            {/* High-density Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">매물코드</th>
                    <th className="px-4 py-3.5 font-semibold">매물명 / 소재지</th>
                    <th className="px-4 py-3.5 font-semibold">유형</th>
                    <th className="px-4 py-3.5 font-semibold">권역</th>
                    <th className="px-4 py-3.5 font-semibold text-right">가격</th>
                    <th className="px-4 py-3.5 font-semibold text-right">전용면적</th>
                    <th className="px-4 py-3.5 font-semibold text-center">추천</th>
                    <th className="px-4 py-3.5 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center text-slate-500">
                        조건에 맞는 매물이 없습니다. 상단의 &apos;새 매물 등록&apos; 버튼을 눌러 매물을 추가해 보세요.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3.5 font-mono-tabular font-semibold text-slate-700 whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500">{item.address}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                          {item.dealType} · {item.category}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                          {item.region}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                          {formatListingPrice(item)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-tabular text-slate-600 whitespace-nowrap">
                          {item.exclusiveAreaSqm.toFixed(1)}㎡ ({sqmToPyeong(item.exclusiveAreaSqm)}평)
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(item.id)}
                            title={item.featured ? '추천 해제' : '추천 매물로 설정'}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
                              item.featured
                                ? 'border-amber-300 bg-amber-50 text-amber-600'
                                : 'border-slate-200 text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${item.featured ? 'fill-current' : ''}`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {confirmDeleteId === item.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteConfirmed(item)}
                                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                              >
                                삭제 확인
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditor(item)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                <Pencil className="h-3 w-3" aria-hidden="true" />
                                <span>수정</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicate(item)}
                                title="복제"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                              >
                                <Copy className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                                <span>삭제</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
