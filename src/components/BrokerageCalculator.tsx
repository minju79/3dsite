import { Calculator, Landmark } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  calculateLegalBrokerageFee,
  formatManwonToKorean,
  type DealType,
} from '../data/properties';

export function BrokerageCalculator() {
  const [activeTab, setActiveTab] = useState<'fee' | 'loan'>('fee');

  // Legal Brokerage Fee state
  const [dealType, setDealType] = useState<DealType>('매매');
  const [category, setCategory] = useState<'주택' | '오피스텔' | '주택외'>('주택');
  const [depositManwon, setDepositManwon] = useState<number>(95000); // 9.5억
  const [monthlyRentManwon, setMonthlyRentManwon] = useState<number>(180);

  // Mortgage Loan state
  const [propertyPriceManwon, setPropertyPriceManwon] = useState<number>(120000); // 12억
  const [ltvPercent, setLtvPercent] = useState<number>(60);
  const [annualRate, setAnnualRate] = useState<number>(3.65);
  const [years, setYears] = useState<number>(30);
  const [repayType, setRepayType] = useState<'equalInstallment' | 'equalPrincipal'>(
    'equalInstallment'
  );

  const feeResult = useMemo(
    () =>
      calculateLegalBrokerageFee({
        dealType,
        category,
        depositManwon,
        monthlyRentManwon,
      }),
    [dealType, category, depositManwon, monthlyRentManwon]
  );

  const loanResult = useMemo(() => {
    const principalWon = Math.round(propertyPriceManwon * (ltvPercent / 100) * 10000);
    const months = years * 12;
    const r = annualRate / 100 / 12;

    if (principalWon <= 0 || months <= 0) {
      return { principalWon: 0, firstMonthWon: 0, totalInterestWon: 0 };
    }

    if (r === 0) {
      const m = Math.round(principalWon / months);
      return { principalWon, firstMonthWon: m, totalInterestWon: 0 };
    }

    if (repayType === 'equalInstallment') {
      const pow = Math.pow(1 + r, months);
      const monthlyWon = Math.round((principalWon * r * pow) / (pow - 1));
      const totalInterestWon = Math.max(0, monthlyWon * months - principalWon);
      return {
        principalWon,
        firstMonthWon: monthlyWon,
        totalInterestWon,
      };
    }

    // 원금균등: 첫 달 상환금 = 원금/개월 + 원금*월이율
    const monthlyPrincipal = principalWon / months;
    const firstMonthWon = Math.round(monthlyPrincipal + principalWon * r);
    const totalInterestWon = Math.round(
      (principalWon * r * (months + 1)) / 2
    );
    return {
      principalWon,
      firstMonthWon,
      totalInterestWon,
    };
  }, [propertyPriceManwon, ltvPercent, annualRate, years, repayType]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-950">
            투명한 부동산 금융·수수료 계산기
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            공인중개사법 법정 상한요율 기준 중개보수와 월 대출 상환액을 즉시 확인하세요.
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('fee')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'fee'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            <span>법정 중개보수</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loan')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'loan'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
            <span>대출 상환액</span>
          </button>
        </div>
      </div>

      {activeTab === 'fee' ? (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div>
              <span className="block text-xs font-semibold text-slate-700">
                매물 유형
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['주택', '오피스텔', '주택외'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      category === cat
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat === '주택외' ? '상가·토지' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700">
                거래 종류
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['매매', '전세', '월세'] as const).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDealType(dt)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      dealType === dt
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="calc-deposit"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {dealType === '매매' ? '매매가 (단위: 만 원)' : '보증금 (단위: 만 원)'}
                </label>
                <input
                  id="calc-deposit"
                  type="number"
                  min={0}
                  step={1000}
                  value={depositManwon}
                  onChange={(e) => setDepositManwon(Math.max(0, Number(e.target.value)))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
                <div className="mt-1 text-xs text-slate-500 tabular-nums">
                  {formatManwonToKorean(depositManwon)}
                </div>
              </div>

              {dealType === '월세' && (
                <div>
                  <label
                    htmlFor="calc-rent"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    월세 (단위: 만 원)
                  </label>
                  <input
                    id="calc-rent"
                    type="number"
                    min={0}
                    step={10}
                    value={monthlyRentManwon}
                    onChange={(e) =>
                      setMonthlyRentManwon(Math.max(0, Number(e.target.value)))
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                  <div className="mt-1 text-xs text-slate-500 tabular-nums">
                    환산보증금 {formatManwonToKorean(feeResult.transactionAmountManwon)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6 lg:col-span-5">
            <div>
              <div className="text-xs font-medium text-slate-500">
                {feeResult.bracketLabel}
              </div>
              <div className="mt-2 font-display text-3xl font-bold text-slate-950 tabular-nums">
                {feeResult.feeWon.toLocaleString('ko-KR')}원
              </div>
              <div className="mt-1 text-xs text-slate-500">
                법정 상한요율 {feeResult.ratePercent}% 적용 (협의 하한 가능)
              </div>

              <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">적용 거래금액</dt>
                  <dd className="font-mono-tabular font-medium text-slate-900">
                    {formatManwonToKorean(feeResult.transactionAmountManwon)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">부가가치세 (10% 별도)</dt>
                  <dd className="font-mono-tabular font-medium text-slate-900">
                    {feeResult.vatWon.toLocaleString('ko-KR')}원
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-teal-800">
                  <dt>부가세 포함 최대 합계</dt>
                  <dd className="font-mono-tabular">
                    {feeResult.totalWon.toLocaleString('ko-KR')}원
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="loan-price"
                  className="block text-xs font-semibold text-slate-700"
                >
                  매물 가격 (만 원)
                </label>
                <input
                  id="loan-price"
                  type="number"
                  min={0}
                  step={5000}
                  value={propertyPriceManwon}
                  onChange={(e) =>
                    setPropertyPriceManwon(Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
                <div className="mt-1 text-xs text-slate-500">
                  {formatManwonToKorean(propertyPriceManwon)}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <label htmlFor="loan-ltv">대출 비율 (LTV)</label>
                  <span className="font-mono-tabular text-teal-800">{ltvPercent}%</span>
                </div>
                <input
                  id="loan-ltv"
                  type="range"
                  min={10}
                  max={80}
                  step={5}
                  value={ltvPercent}
                  onChange={(e) => setLtvPercent(Number(e.target.value))}
                  className="coastal-slider mt-3 w-full"
                />
                <div className="mt-1 text-xs text-slate-500 tabular-nums">
                  예상 대출금 {formatManwonToKorean(Math.round(propertyPriceManwon * (ltvPercent / 100)))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="loan-rate"
                  className="block text-xs font-semibold text-slate-700"
                >
                  연 이자율 (%)
                </label>
                <input
                  id="loan-rate"
                  type="number"
                  min={0}
                  max={15}
                  step={0.05}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-tabular text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="loan-years"
                  className="block text-xs font-semibold text-slate-700"
                >
                  대출 기간 (년)
                </label>
                <select
                  id="loan-years"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  <option value={10}>10년</option>
                  <option value={20}>20년</option>
                  <option value={30}>30년</option>
                  <option value={40}>40년</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  상환 방식
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setRepayType('equalInstallment')}
                    className={`rounded-md py-1.5 text-xs font-medium whitespace-nowrap ${
                      repayType === 'equalInstallment'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    원리금균등
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayType('equalPrincipal')}
                    className={`rounded-md py-1.5 text-xs font-medium whitespace-nowrap ${
                      repayType === 'equalPrincipal'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    원금균등
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6 lg:col-span-5">
            <div>
              <div className="text-xs font-medium text-slate-500">
                {repayType === 'equalInstallment'
                  ? '매월 예상 상환액'
                  : '첫 달 예상 상환액 (점감식)'}
              </div>
              <div className="mt-2 font-display text-3xl font-bold text-slate-950 tabular-nums">
                {loanResult.firstMonthWon.toLocaleString('ko-KR')}원
              </div>
              <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">총 대출 원금</dt>
                  <dd className="font-mono-tabular font-medium text-slate-900">
                    {formatManwonToKorean(Math.round(loanResult.principalWon / 10000))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">총 예상 이자</dt>
                  <dd className="font-mono-tabular font-medium text-slate-900">
                    {formatManwonToKorean(Math.round(loanResult.totalInterestWon / 10000))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
