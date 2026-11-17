export type DealType = '매매' | '전세' | '월세';
export type PropertyCategory = '아파트' | '단독·오션빌라' | '상가·빌딩';
export type RegionGroup = '광주·전남' | '동해안·부산' | '서울 핵심지' | '제주';

export interface PropertyListing {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  dealType: DealType;
  category: PropertyCategory;
  region: RegionGroup;
  address: string;
  priceManwon: number; // 매매가 or 전세/월세 보증금 (단위: 만원)
  monthlyRentManwon?: number; // 월세 (단위: 만원)
  exclusiveAreaSqm: number; // 전용면적
  supplyAreaSqm: number; // 공급/연면적
  floorLabel: string;
  direction: string;
  rooms: string;
  parking: string;
  maintenanceFeeManwon: number;
  moveInDate: string;
  imageUrl: string;
  featured?: boolean;
  highlights: string[];
  brokerNote: string;
  nearbyInfra: string[];
  agentName: string;
  agentTitle: string;
  agentPhone: string;
}

export const HERO_IMAGE_URL =
  '/src/assets/images/hero_coastal_villa_1794915085039.jpg';

export const PROPERTY_LISTINGS: PropertyListing[] = [
  {
    id: 'sangmu-central-apt',
    code: 'MD-2601',
    title: '상무지구 치평동 중앙공원뷰 랜드마크',
    subtitle: '상무역 도보 4분, 5·18기념공원 조망이 펼쳐지는 로열층 중대형',
    dealType: '매매',
    category: '아파트',
    region: '광주·전남',
    address: '전남광주통합특별시 서구 치평동 상무중앙로',
    priceManwon: 84000,
    exclusiveAreaSqm: 118.6,
    supplyAreaSqm: 149.2,
    floorLabel: '21층 / 29층',
    direction: '남향 (상무시민공원 뷰)',
    rooms: '방 4 · 욕실 2',
    parking: '세대당 2.1대',
    maintenanceFeeManwon: 27,
    moveInDate: '즉시 입주 협의',
    imageUrl: '/src/assets/images/listing_gangnam_apt_1794915086839.jpg',
    featured: true,
    highlights: [
      '도시철도 1호선 상무역 도보 4분 및 주요 관공서 인접',
      '4Bay 판상형 맞통풍 구조 · 시스템 에어컨 5대',
      '등기부등본 권리관계 클린(근저당 0원) 검증 완료',
    ],
    brokerNote:
      '상무중앙로 핵심 입지 내 선호도가 가장 높은 남향 공원뷰 로열층입니다. 실거래가 대비 합리적 가격으로 조율 가능합니다.',
    nearbyInfra: [
      '상무역(1호선) 도보 4분',
      '5·18기념공원 도보 5분',
      '롯데마트·상무병원 차량 3분',
    ],
    agentName: '오민주',
    agentTitle: '대표 공인중개사',
    agentPhone: '010-3973-4338',
  },
  {
    id: 'sangmu-corner-retail',
    code: 'MD-2602',
    title: '상무중앙로 대로변 1·2층 코너 상가',
    subtitle: '유동인구 최상 상무지구 오피스·주거 배후 핵심 상권',
    dealType: '월세',
    category: '상가·빌딩',
    region: '광주·전남',
    address: '전남광주통합특별시 서구 상무중앙로 7 인접 블록',
    priceManwon: 8000,
    monthlyRentManwon: 320,
    exclusiveAreaSqm: 132.4,
    supplyAreaSqm: 158.0,
    floorLabel: '1층 / 7층',
    direction: '동남향 (왕복 6차선 전면)',
    rooms: '오픈 홀 · 탕비실 · 내부 화장실',
    parking: '지하 자주식 42대 공용',
    maintenanceFeeManwon: 22,
    moveInDate: '즉시 입점 가능',
    imageUrl: '/src/assets/images/listing_retail_building_1794915088790.jpg',
    featured: true,
    highlights: [
      '상무중앙로 전면 통유리 쇼윈도 11m 노출',
      '금융·병의원·프랜차이즈 카페·쇼룸 추천 입지',
      '권리금 없음 / 렌트프리 조건 협의 가능',
    ],
    brokerNote:
      '상무중앙로 핵심 비즈니스 라인에 위치해 평일 오피스와 주말 주거 배후 수요를 모두 확보할 수 있는 우수 점포입니다.',
    nearbyInfra: [
      '상무역 교차로 도보 3분',
      '광주광역시청 차량 4분',
      '상무지구 금융가 중심',
    ],
    agentName: '오민주',
    agentTitle: '대표 공인중개사',
    agentPhone: '010-3973-4338',
  },
  {
    id: 'haedong-ocean-villa',
    code: 'MD-2603',
    title: '해동 구룡포 오션테라스 단독주택',
    subtitle: '동해 바다가 180도 펼쳐지는 라임스톤 모던 세컨하우스',
    dealType: '매매',
    category: '단독·오션빌라',
    region: '동해안·부산',
    address: '경북 포항시 남구 구룡포읍 해안로',
    priceManwon: 148000,
    exclusiveAreaSqm: 198.4,
    supplyAreaSqm: 342.0,
    floorLabel: '지상 1~2층 단독',
    direction: '정남동향 (영구 오션뷰)',
    rooms: '방 4 · 욕실 3',
    parking: '세대당 3대 (개별 차고)',
    maintenanceFeeManwon: 12,
    moveInDate: '즉시 입주 가능',
    imageUrl: '/src/assets/images/hero_coastal_villa_1794915085039.jpg',
    featured: true,
    highlights: [
      '해안 산책로·자전거도로 도보 1분 직결',
      '1층 인피니티 석재 테라스 및 노천 스파 완비',
      '지열 냉난방 및 삼중 로이유리 시공으로 연중 쾌적',
    ],
    brokerNote:
      '구룡포 해안선에서도 고지대 자연석 암반 위에 시공되어 해풍·침수 우려가 없으며, 법인 연수원 및 프라이빗 세컨하우스로 수요가 높은 희소 매물입니다.',
    nearbyInfra: [
      '구룡포 해안 자전거길 80m',
      '감포항 마리나 차량 10분',
      '포항 KTX역 차량 32분',
    ],
    agentName: '오민주',
    agentTitle: '대표 공인중개사',
    agentPhone: '010-3973-4338',
  },
  {
    id: 'haeundae-penthouse',
    code: 'MD-2604',
    title: '해운대 마린시티 오션 파노라마',
    subtitle: '거실 통창으로 광안대교와 동백섬을 품은 고층 랜드마크',
    dealType: '매매',
    category: '아파트',
    region: '동해안·부산',
    address: '부산시 해운대구 우동 마린시티',
    priceManwon: 285000,
    exclusiveAreaSqm: 164.2,
    supplyAreaSqm: 214.5,
    floorLabel: '34층 / 42층',
    direction: '남서향 (광안대교 정면)',
    rooms: '방 4 · 욕실 3',
    parking: '세대당 2.4대',
    maintenanceFeeManwon: 46,
    moveInDate: '협의 입주 (2개월 내)',
    imageUrl: '/src/assets/images/listing_ocean_penthouse_1794915086972.jpg',
    featured: true,
    highlights: [
      '천연 오크 원목 마루 및 이탈리안 트라버틴 리모델링 완료',
      '커뮤니티 피트니스·실내 수영장·게스트하우스 이용',
      '단지 앞 영화의 거리 해변 산책로 도보 2분',
    ],
    brokerNote:
      '실거주 소유주가 2025년 풀 리모델링을 진행한 최상 컨디션 세대입니다. 근저당 없이 깔끔한 권리 관계로 안전 거래가 가능합니다.',
    nearbyInfra: [
      '동백역(2호선) 도보 7분',
      '신세계 센텀시티 차량 6분',
      '해원초등학교 도보 5분',
    ],
    agentName: '박서연',
    agentTitle: '부산·영남 본부장',
    agentPhone: '051-742-8820',
  },
  {
    id: 'banpo-acro-jeonse',
    code: 'MD-2605',
    title: '서초 반포 파크뷰 하이엔드 아파트',
    subtitle: '한강시민공원 도보권, 신축급 조경과 명문 학군을 갖춘 로열층',
    dealType: '전세',
    category: '아파트',
    region: '서울 핵심지',
    address: '서울시 서초구 반포동 신반포로',
    priceManwon: 165000,
    exclusiveAreaSqm: 114.8,
    supplyAreaSqm: 148.2,
    floorLabel: '18층 / 32층',
    direction: '남향 (단지 중앙 소나무 정원뷰)',
    rooms: '방 4 · 욕실 2',
    parking: '세대당 2.0대',
    maintenanceFeeManwon: 38,
    moveInDate: '즉시 입주 / 전세대출 동의',
    imageUrl: '/src/assets/images/listing_gangnam_apt_1794915086839.jpg',
    featured: true,
    highlights: [
      '전세보증보험 가입 가능 (융자 0원 클린 물건)',
      '맞통풍 4Bay 판상형 구조 및 와이드 팬트리',
      '조식 서비스·독서실·스카이라운지 입주민 전용',
    ],
    brokerNote:
      '임대인의 전세금 반환 보증 가입 협조가 100% 가능하며, 확정일자 및 전입신고 당일 처리 조건으로 안전한 임대차 계약을 지원합니다.',
    nearbyInfra: [
      '신반포역(9호선) 도보 4분',
      '반포한강공원 도보 5분',
      '세화고·반포초 인접',
    ],
    agentName: '이준혁',
    agentTitle: '서울 강남권 팀장',
    agentPhone: '02-548-7705',
  },
  {
    id: 'gampo-coastal-retail',
    code: 'MD-2606',
    title: '감포항 해안로 4층 신축 근린상가',
    subtitle: '1층 오션뷰 카페 장기 임대 완료, 안정적 월세 수익형 빌딩',
    dealType: '매매',
    category: '상가·빌딩',
    region: '동해안·부산',
    address: '경북 경주시 감포읍 감포항 해안길',
    priceManwon: 220000,
    exclusiveAreaSqm: 365.0,
    supplyAreaSqm: 412.0,
    floorLabel: '지상 1~4층 전체',
    direction: '동남향 (감포항 등대 정면)',
    rooms: '층별 1실 (총 4개 호실)',
    parking: '자주식 7대',
    maintenanceFeeManwon: 0,
    moveInDate: '승계 매매 (연 수익률 5.4%)',
    imageUrl: '/src/assets/images/listing_retail_building_1794915088790.jpg',
    featured: true,
    highlights: [
      '보증금 2억 5,000만 / 월 임대료 880만 (임대율 100%)',
      '해안 자전거 도로 코너 전면부 가시성 최상',
      '엘리베이터 설치 및 루프탑 오션 데크 보유',
    ],
    brokerNote:
      '동해안 관광객과 사이클리스트 유입이 꾸준한 감포항 초입 코너 빌딩입니다. 임대차 내역 및 수익률 분석표를 상담 시 즉시 제공합니다.',
    nearbyInfra: [
      '감포항 방파제 50m',
      '문무대왕릉 차량 8분',
      '국도 31호선 진입 2분',
    ],
    agentName: '오민주',
    agentTitle: '대표 공인중개사',
    agentPhone: '010-3973-4338',
  },
  {
    id: 'sokcho-terrace-monthly',
    code: 'MD-2607',
    title: '속초 영랑호 오션·설악 더블뷰 빌라',
    subtitle: '워케이션 및 장기 체류에 최적화된 풀옵션 테라스 레지던스',
    dealType: '월세',
    category: '단독·오션빌라',
    region: '동해안·부산',
    address: '강원도 속초시 영랑동 해안길',
    priceManwon: 5000,
    monthlyRentManwon: 240,
    exclusiveAreaSqm: 84.9,
    supplyAreaSqm: 112.4,
    floorLabel: '4층 / 5층',
    direction: '동향 (영랑호·동해 조망)',
    rooms: '방 3 · 욕실 2',
    parking: '세대당 1.5대',
    maintenanceFeeManwon: 18,
    moveInDate: '즉시 입주 (1년 이상 계약)',
    imageUrl: '/src/assets/images/listing_ocean_penthouse_1794915086972.jpg',
    highlights: [
      '시스템 에어컨 4대·빌트인 주방·광폭 발코니',
      '영랑호 수변 자전거 순환로 도보 2분',
      '조용한 주거 환경 및 개별 세대 창고 제공',
    ],
    brokerNote:
      '법인 임직원 휴양 및 원격근무(워케이션) 수요가 높은 단지입니다. 보증금 및 월세 비율은 협의 가능합니다.',
    nearbyInfra: [
      '등대해수욕장 도보 4분',
      '속초 시외버스터미널 차량 7분',
      '영랑호 호수공원 도보 2분',
    ],
    agentName: '박서연',
    agentTitle: '부산·영남 본부장',
    agentPhone: '051-742-8820',
  },
  {
    id: 'cheongdam-luxury-apt',
    code: 'MD-2608',
    title: '청담 도산대로 프라이빗 주거타워',
    subtitle: '층당 2세대 프라이빗 동선과 컨시어지 서비스를 갖춘 하이엔드',
    dealType: '매매',
    category: '아파트',
    region: '서울 핵심지',
    address: '서울시 강남구 청담동 도산대로변',
    priceManwon: 340000,
    exclusiveAreaSqm: 138.6,
    supplyAreaSqm: 179.4,
    floorLabel: '22층 / 28층',
    direction: '남동향',
    rooms: '방 3 · 욕실 3',
    parking: '세대당 2.5대 (발렛 지원)',
    maintenanceFeeManwon: 52,
    moveInDate: '3개월 내 협의',
    imageUrl: '/src/assets/images/listing_gangnam_apt_1794915086839.jpg',
    highlights: [
      '2.9m 높은 천장고로 개방감 극대화',
      '프라이빗 엘리베이터 홀 및 24시간 보안 시스템',
      '청담명품거리·압구정로데오 도보 생활권',
    ],
    brokerNote:
      '강남권 실수요 및 자산가 선호도가 높은 단지 내 희소 매물입니다. 비공개 현장 투어 예약제로 운영됩니다.',
    nearbyInfra: [
      '압구정로데오역 도보 4분',
      '청담근린공원 도보 6분',
      '갤러리아 백화점 도보 7분',
    ],
    agentName: '이준혁',
    agentTitle: '서울 강남권 팀장',
    agentPhone: '02-548-7705',
  },
  {
    id: 'jeju-aewol-villa',
    code: 'MD-2609',
    title: '제주 애월 해안도로 풀빌라 세컨하우스',
    subtitle: '노을이 아름다운 애월 바닷가 30m 앞 모던 제주석 주택',
    dealType: '매매',
    category: '단독·오션빌라',
    region: '제주',
    address: '제주시 애월읍 애월해안로',
    priceManwon: 119000,
    exclusiveAreaSqm: 152.0,
    supplyAreaSqm: 264.0,
    floorLabel: '지상 1~2층',
    direction: '북서향 (일몰 오션뷰)',
    rooms: '방 3 · 욕실 3',
    parking: '자주식 2대',
    maintenanceFeeManwon: 9,
    moveInDate: '즉시 입주 가능',
    imageUrl: '/src/assets/images/hero_coastal_villa_1794915085039.jpg',
    highlights: [
      '대지 115평 · 계획관리지역으로 활용도 우수',
      '제주 현무암 담장과 방풍 소나무 정원 조경',
      '제주공항 차량 22분 거리로 뛰어난 접근성',
    ],
    brokerNote:
      '애월 카페거리와 인접하면서도 한적한 주거 구역에 위치해 실거주와 휴양 모두에 알맞습니다.',
    nearbyInfra: [
      '애월 한담해안산책로 차량 4분',
      '제주국제공항 차량 22분',
      '하나로마트 애월점 차량 5분',
    ],
    agentName: '오민주',
    agentTitle: '대표 공인중개사',
    agentPhone: '010-3973-4338',
  },
];

export function formatManwonToKorean(manwon: number): string {
  if (manwon <= 0) return '0원';
  const eok = Math.floor(manwon / 10000);
  const rem = Math.round(manwon % 10000);
  if (eok > 0 && rem > 0) {
    return `${eok}억 ${rem.toLocaleString('ko-KR')}만`;
  }
  if (eok > 0) {
    return `${eok}억 원`;
  }
  return `${rem.toLocaleString('ko-KR')}만 원`;
}

export function formatListingPrice(item: PropertyListing): string {
  if (item.dealType === '월세') {
    return `보증금 ${formatManwonToKorean(item.priceManwon)} / 월 ${item.monthlyRentManwon?.toLocaleString('ko-KR')}만`;
  }
  return formatManwonToKorean(item.priceManwon);
}

export function sqmToPyeong(sqm: number): string {
  return (sqm / 3.305785).toFixed(1);
}

export interface BrokerageCalcResult {
  transactionAmountManwon: number;
  ratePercent: number;
  maxLimitManwon: number | null;
  feeWon: number;
  vatWon: number;
  totalWon: number;
  bracketLabel: string;
}

/**
 * 대한민국 공인중개사법 시행규칙 기준 법정 중개보수 상한요율 계산
 */
export function calculateLegalBrokerageFee(params: {
  dealType: DealType;
  category: '주택' | '오피스텔' | '주택외';
  depositManwon: number;
  monthlyRentManwon: number;
}): BrokerageCalcResult {
  const { dealType, category, depositManwon, monthlyRentManwon } = params;

  // 거래금액 환산 (월세인 경우 보증금 + 월세 * 100, 단 5천만원 미만이면 보증금 + 월세 * 70)
  let txManwon = Math.max(0, depositManwon);
  if (dealType === '월세') {
    const standard = depositManwon + monthlyRentManwon * 100;
    txManwon =
      standard < 5000 ? depositManwon + monthlyRentManwon * 70 : standard;
  }

  let ratePercent = 0.4;
  let maxLimitManwon: number | null = null;
  let bracketLabel = '';

  if (category === '오피스텔') {
    if (dealType === '매매') {
      ratePercent = 0.5;
      bracketLabel = '주거용 오피스텔 매매 상한 (0.5%)';
    } else {
      ratePercent = 0.4;
      bracketLabel = '주거용 오피스텔 임대차 상한 (0.4%)';
    }
  } else if (category === '주택외') {
    ratePercent = 0.9;
    bracketLabel = '상가·토지 등 주택 외 부동산 상한 (0.9% 이내 협의)';
  } else if (dealType === '매매') {
    if (txManwon < 5000) {
      ratePercent = 0.6;
      maxLimitManwon = 25;
      bracketLabel = '주택 매매 5천만 원 미만 (0.6% · 한도 25만 원)';
    } else if (txManwon < 20000) {
      ratePercent = 0.5;
      maxLimitManwon = 80;
      bracketLabel = '주택 매매 5천만 ~ 2억 원 미만 (0.5% · 한도 80만 원)';
    } else if (txManwon < 90000) {
      ratePercent = 0.4;
      bracketLabel = '주택 매매 2억 ~ 9억 원 미만 (0.4%)';
    } else if (txManwon < 120000) {
      ratePercent = 0.5;
      bracketLabel = '주택 매매 9억 ~ 12억 원 미만 (0.5%)';
    } else if (txManwon < 150000) {
      ratePercent = 0.6;
      bracketLabel = '주택 매매 12억 ~ 15억 원 미만 (0.6%)';
    } else {
      ratePercent = 0.7;
      bracketLabel = '주택 매매 15억 원 이상 (0.7%)';
    }
  } else {
    // 주택 전세·월세 임대차
    if (txManwon < 5000) {
      ratePercent = 0.5;
      maxLimitManwon = 20;
      bracketLabel = '주택 임대차 5천만 원 미만 (0.5% · 한도 20만 원)';
    } else if (txManwon < 10000) {
      ratePercent = 0.4;
      maxLimitManwon = 30;
      bracketLabel = '주택 임대차 5천만 ~ 1억 원 미만 (0.4% · 한도 30만 원)';
    } else if (txManwon < 60000) {
      ratePercent = 0.3;
      bracketLabel = '주택 임대차 1억 ~ 6억 원 미만 (0.3%)';
    } else if (txManwon < 120000) {
      ratePercent = 0.4;
      bracketLabel = '주택 임대차 6억 ~ 12억 원 미만 (0.4%)';
    } else if (txManwon < 150000) {
      ratePercent = 0.5;
      bracketLabel = '주택 임대차 12억 ~ 15억 원 미만 (0.5%)';
    } else {
      ratePercent = 0.6;
      bracketLabel = '주택 임대차 15억 원 이상 (0.6%)';
    }
  }

  let feeWon = Math.round(txManwon * 10000 * (ratePercent / 100));
  if (maxLimitManwon !== null) {
    feeWon = Math.min(feeWon, maxLimitManwon * 10000);
  }
  const vatWon = Math.round(feeWon * 0.1);
  return {
    transactionAmountManwon: txManwon,
    ratePercent,
    maxLimitManwon,
    feeWon,
    vatWon,
    totalWon: feeWon + vatWon,
    bracketLabel,
  };
}
