import { Building, CheckCircle2, Clock, Globe, MapPin, Phone } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { PropertyListing } from '../data/properties';

interface ConsultationSectionProps {
  selectedListingForBooking: PropertyListing | null;
}

export function ConsultationSection({
  selectedListingForBooking,
}: ConsultationSectionProps) {
  const [inquiryMode, setInquiryMode] = useState<'buy' | 'sell'>('buy');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [regionInterest, setRegionInterest] = useState('광주·전남');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    if (selectedListingForBooking) {
      setInquiryMode('buy');
      setRegionInterest(selectedListingForBooking.region);
      setMessage(
        `[${selectedListingForBooking.code}] ${selectedListingForBooking.title} 현장 방문 및 권리분석 상담을 희망합니다.`
      );
      setSubmittedRef(null);
    }
  }, [selectedListingForBooking]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('성함을 2자 이상 입력해 주세요.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 11) {
      setError('연락 가능한 휴대폰 또는 전화번호를 정확히 입력해 주세요.');
      return;
    }

    if (!agreed) {
      setError('상담 접수를 위해 개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    const refCode = `MD-${String(Math.floor(100000 + Math.random() * 900000))}`;
    setSubmittedRef(refCode);
  };

  return (
    <section id="consult" className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white lg:col-span-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-teal-400">
              방문 예약 · 중개 의뢰
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance">
              계약 전 권리분석부터 현장 임장까지 1:1 전담 배정
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              허위·미끼 매물 없이 등기부등본과 건축물대장을 사전 검증한 매물만
              안내합니다. 매도·임대 의뢰 시 실거래가 기반 적정가 리포트를 무료로
              제공합니다.
            </p>
          </div>

          <dl className="mt-10 space-y-4 border-t border-slate-800 pt-6 text-sm">
            <div className="flex items-start gap-3">
              <Building className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <div>
                <dt className="font-semibold text-white">모든AI부동산중개사무소</dt>
                <dd className="text-slate-300">
                  등록번호 29200-2024-00908 · 대표 공인중개사 오민주
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <div>
                <dt className="font-semibold text-white">사무소 소재지</dt>
                <dd className="text-slate-300">
                  전남광주통합특별시 서구 상무중앙로 7, 5층
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <div>
                <dt className="font-semibold text-white">대표 직통 상담</dt>
                <dd className="font-mono-tabular text-slate-300">
                  <a href="tel:010-3973-4338" className="hover:text-teal-300">
                    010-3973-4338
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <div>
                <dt className="font-semibold text-white">공식 웹사이트</dt>
                <dd className="text-slate-300">모든ai부동산.kr</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <div>
                <dt className="font-semibold text-white">상담 운영 시간</dt>
                <dd className="text-slate-300">평일·주말 09:30 ~ 19:00 (예약 방문)</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 lg:col-span-7">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <h3 className="font-display text-xl font-bold text-slate-950">
              온라인 상담 신청
            </h3>

            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setInquiryMode('buy');
                  setSubmittedRef(null);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  inquiryMode === 'buy'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                매수·임차 방문 예약
              </button>
              <button
                type="button"
                onClick={() => {
                  setInquiryMode('sell');
                  setSubmittedRef(null);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  inquiryMode === 'sell'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                내 매물 내놓기
              </button>
            </div>
          </div>

          {submittedRef ? (
            <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" />
                <div>
                  <h4 className="font-display text-lg font-bold text-slate-950">
                    상담 예약이 정상 접수되었습니다
                  </h4>
                  <p className="mt-1 text-sm text-slate-700">
                    접수번호{' '}
                    <span className="font-mono-tabular font-semibold text-teal-900">
                      {submittedRef}
                    </span>{' '}
                    · 담당 공인중개사가 영업시간 기준 1시간 이내에{' '}
                    <span className="font-mono-tabular font-medium">{phone}</span>으로
                    연락드립니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRef(null);
                      setMessage('');
                    }}
                    className="mt-4 rounded-lg border border-teal-700 px-4 py-2 text-xs font-semibold text-teal-900 transition-colors hover:bg-teal-100"
                  >
                    추가 문의 작성하기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="consult-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    성함 *
                  </label>
                  <input
                    id="consult-name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="consult-phone"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    연락처 *
                  </label>
                  <input
                    id="consult-phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono-tabular text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="consult-region"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    {inquiryMode === 'buy' ? '관심 지역' : '의뢰 매물 소재지'}
                  </label>
                  <select
                    id="consult-region"
                    value={regionInterest}
                    onChange={(e) => setRegionInterest(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    <option value="광주·전남">광주·전남 (상무지구·서구·전남권)</option>
                    <option value="동해안·부산">동해안·부산 (포항·경주·강릉·해운대)</option>
                    <option value="서울 핵심지">서울 핵심지 (서초·강남·용산)</option>
                    <option value="제주">제주 해안권</option>
                    <option value="기타 지역">기타 지역 협의</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="consult-date"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    희망 방문·통화 일자
                  </label>
                  <input
                    id="consult-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="consult-message"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {inquiryMode === 'buy'
                    ? '희망 조건 또는 문의 매물'
                    : '매물 상세 정보 (단지명·면적·희망가)'}
                </label>
                <textarea
                  id="consult-message"
                  rows={4}
                  placeholder={
                    inquiryMode === 'buy'
                      ? '희망 예산, 입주 시기, 관심 매물 번호 등을 남겨주세요.'
                      : '소재지, 전용면적, 희망 매매가/임대가 및 연락 가능 시간을 남겨주세요.'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                />
                <span>
                  상담 답변 및 매물 안내를 위한 연락처 수집·이용에 동의합니다.
                </span>
              </label>

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-teal-700 sm:w-auto"
              >
                {inquiryMode === 'buy' ? '방문·상담 신청하기' : '매물 중개 의뢰하기'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
