import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  isAdminPage: boolean;
  onNavigateSection: (sectionId: string) => void;
  onOpenAdmin: () => void;
  onExitAdmin: () => void;
}

const NAV_LINKS = [
  { id: 'tour', label: '3D 투어' },
  { id: 'listings', label: '추천 매물' },
  { id: 'calculator', label: '중개보수 계산기' },
  { id: 'consult', label: '방문·매물상담' },
];

export function Navbar({
  isAdminPage,
  onNavigateSection,
  onOpenAdmin,
  onExitAdmin,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#tour"
          onClick={(e) => {
            e.preventDefault();
            onExitAdmin();
            onNavigateSection('tour');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          모든AI부동산중개사무소
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                onExitAdmin();
                window.setTimeout(() => onNavigateSection(link.id), 20);
              }}
              className="transition-colors hover:text-slate-950 hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenAdmin}
            className={`transition-colors hover:text-slate-950 hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
              isAdminPage ? 'font-semibold text-teal-800 underline underline-offset-4' : ''
            }`}
          >
            관리자 페이지
          </button>
        </nav>

        {/* Zone 3: 1 primary CTA action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isAdminPage) {
                onExitAdmin();
              } else {
                onNavigateSection('consult');
              }
            }}
            className="hidden rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 md:inline-flex"
          >
            {isAdminPage ? '홈페이지 보기' : '무료 상담 예약'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onExitAdmin();
                  window.setTimeout(() => onNavigateSection(link.id), 20);
                }}
                className="py-1.5 text-left transition-colors hover:text-slate-950"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAdmin();
              }}
              className="py-1.5 text-left font-semibold text-teal-800"
            >
              관리자 페이지 (매물 수정·등록)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (isAdminPage) {
                  onExitAdmin();
                } else {
                  onNavigateSection('consult');
                }
              }}
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              {isAdminPage ? '홈페이지 보기' : '무료 상담 예약'}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
