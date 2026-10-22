import React, { useState } from 'react';
import { Sparkles, History, BookOpen, Camera, Calendar, Heart, Layers, Sun, Tag, Target, MoreHorizontal, X } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'finder' | 'concern' | 'label' | 'scanner' | 'checkins' | 'saved' | 'shelf' | 'history' | 'guide';
  setActiveTab: (tab: 'home' | 'finder' | 'concern' | 'label' | 'scanner' | 'checkins' | 'saved' | 'shelf' | 'history' | 'guide') => void;
  savedScansCount: number;
  plansCount: number;
  savedWishlistCount: number;
  shelfItemsCount: number;
  onNewScan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedScansCount,
  plansCount,
  savedWishlistCount,
  shelfItemsCount,
  onNewScan,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const go = (tab: NavbarProps['activeTab']) => {
    setMoreOpen(false);
    setActiveTab(tab);
  };
  const moreTabs: { tab: NavbarProps['activeTab']; label: string; Icon: typeof Sun; count?: number }[] = [
    { tab: 'label', label: 'Label guide', Icon: Tag },
    { tab: 'checkins', label: 'Check-ins', Icon: Calendar, count: plansCount },
    { tab: 'saved', label: 'Saved products', Icon: Heart, count: savedWishlistCount },
    { tab: 'history', label: 'History', Icon: History, count: savedScansCount },
    { tab: 'guide', label: 'Tone & skin guide', Icon: BookOpen },
  ];
  const mainTabs: { tab: NavbarProps['activeTab']; label: string; Icon: typeof Sun; count?: number }[] = [
    { tab: 'scanner', label: 'Scan', Icon: Camera },
    { tab: 'finder', label: 'Sunscreen', Icon: Sun },
    { tab: 'concern', label: 'Concern', Icon: Target },
    { tab: 'shelf', label: 'Shelf', Icon: Layers, count: shelfItemsCount },
  ];
  const moreActive = moreTabs.some((m) => m.tab === activeTab);
  return (
    <>
    <header className="sticky top-0 z-40 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#e7ded4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-[#faf8f5] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  No Cap
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                  Honest Picks
                </span>
              </div>
              <p className="text-xs text-stone-600 hidden sm:block">
                Honest skincare picks
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 min-w-0 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap">
            <button
              onClick={() => setActiveTab('finder')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'finder'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Sunscreen finder</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Skin Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('concern')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'concern'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Know your concern</span>
            </button>

            <button
              onClick={() => setActiveTab('label')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'label'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Label guide</span>
            </button>

            <button
              onClick={() => setActiveTab('shelf')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors relative cursor-pointer ${
                activeTab === 'shelf'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My shelf</span>
              {shelfItemsCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'shelf'
                      ? 'bg-amber-300 text-stone-900'
                      : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {shelfItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('checkins')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors relative cursor-pointer ${
                activeTab === 'checkins'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Check-ins</span>
              {plansCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'checkins'
                      ? 'bg-amber-300 text-stone-900'
                      : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {plansCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors relative cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Saved Products</span>
              <span className="sm:hidden">Saved</span>
              {savedWishlistCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'saved'
                      ? 'bg-amber-300 text-stone-900'
                      : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {savedWishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors relative cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {savedScansCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'history'
                      ? 'bg-amber-300 text-stone-900'
                      : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {savedScansCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Tone & Skin Guide</span>
              <span className="sm:hidden">Guide</span>
            </button>
          </nav>
        </div>
      </div>
    </header>

    {/* Phone bottom bar */}
    {moreOpen && (
      <div className="md:hidden fixed inset-0 z-50 bg-stone-900/40" onClick={() => setMoreOpen(false)}>
        <div
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl p-4 pb-24 space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="font-bold text-stone-900">More</span>
            <button onClick={() => setMoreOpen(false)} aria-label="Close" className="p-2 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          {moreTabs.map(({ tab, label, Icon, count }) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left text-base font-medium cursor-pointer ${
                activeTab === tab ? 'bg-stone-900 text-white' : 'text-stone-800 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{label}</span>
              {!!count && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">{count}</span>}
            </button>
          ))}
        </div>
      </div>
    )}
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-[#e7ded4] grid grid-cols-5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {mainTabs.map(({ tab, label, Icon, count }) => (
        <button
          key={tab}
          onClick={() => go(tab)}
          className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold cursor-pointer ${
            activeTab === tab && !moreOpen ? 'text-stone-900' : 'text-stone-500'
          }`}
        >
          <Icon className="w-5 h-5" />
          {label}
          {!!count && <span className="absolute top-1 right-[22%] min-w-4 h-4 px-1 rounded-full bg-amber-300 text-stone-900 text-[10px] font-bold flex items-center justify-center">{count}</span>}
          {activeTab === tab && !moreOpen && <span className="absolute top-0 h-0.5 w-8 bg-stone-900 rounded-full" />}
        </button>
      ))}
      <button
        onClick={() => setMoreOpen((v) => !v)}
        className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold cursor-pointer ${
          moreActive || moreOpen ? 'text-stone-900' : 'text-stone-500'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        More
      </button>
    </nav>
    </>
  );
};
