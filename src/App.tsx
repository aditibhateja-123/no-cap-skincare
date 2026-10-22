import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SkinScannerInput } from './components/SkinScannerInput';
import { CameraModal } from './components/CameraModal';
import { AnalysisDashboard, FaceScanReport } from './components/AnalysisDashboard';
import { ProductReviewsModal } from './components/ProductReviewsModal';
import { ToneGuideModal } from './components/ToneGuideModal';
import { HistoryView } from './components/HistoryView';
import { CheckInsView } from './components/CheckInsView';
import { SavedProductsView } from './components/SavedProductsView';
import { MyShelfView } from './components/MyShelfView';
import {
  UserQuizAnswers,
  PhotoAnalysisResult,
  RankedProduct,
  SavedConsultation,
  CheckInPlan,
  CompletedCheckIn,
  ShelfState,
} from './types';
import { Sparkles } from 'lucide-react';

const STORAGE_KEY = 'nocap_skincare_history_v2';
const CHECKINS_STORAGE_KEY = 'nocap_checkin_plans_v1';
const WISHLIST_STORAGE_KEY = 'nocap_wishlist_ids_v1';
const SHELF_STORAGE_KEY = 'nocap_my_shelf_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'finder' | 'concern' | 'label' | 'scanner' | 'checkins' | 'saved' | 'shelf' | 'history' | 'guide'>('finder');
  const [userAnswers, setUserAnswers] = useState<UserQuizAnswers | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
  const [seenScan, setSeenScan] = useState<PhotoAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<RankedProduct | null>(null);
  const [isToneGuideOpen, setIsToneGuideOpen] = useState(false);
  const [savedScans, setSavedScans] = useState<SavedConsultation[]>([]);
  const [isCurrentSaved, setIsCurrentSaved] = useState(false);
  const [isDemoProfile, setIsDemoProfile] = useState(false);

  // Check-in plans & Wishlist state
  const [checkInPlans, setCheckInPlans] = useState<CheckInPlan[]>([]);
  const [savedWishlistIds, setSavedWishlistIds] = useState<string[]>([]);
  const [shelf, setShelf] = useState<ShelfState>({ productIds: [], checkboxKeys: [] });

  // Load saved consultations, check-ins, and wishlist on mount (NO photos, on-device only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedScans(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    try {
      const storedPlans = localStorage.getItem(CHECKINS_STORAGE_KEY);
      if (storedPlans) {
        setCheckInPlans(JSON.parse(storedPlans));
      }
    } catch {
      // ignore
    }

    try {
      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (storedWishlist) {
        setSavedWishlistIds(JSON.parse(storedWishlist));
      }
    } catch {
      // ignore
    }

    try {
      const storedShelf = localStorage.getItem(SHELF_STORAGE_KEY);
      if (storedShelf) {
        setShelf(JSON.parse(storedShelf));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveConsultation = (data: {
    ageRange: any;
    skinTone: any;
    concerns: string[];
    productNames: string[];
  }) => {
    const newEntry: SavedConsultation = {
      id: 'consultation-' + Date.now(),
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      ageRange: data.ageRange,
      skinTone: data.skinTone,
      concerns: data.concerns,
      productNames: data.productNames,
    };

    const updated = [newEntry, ...savedScans];
    setSavedScans(updated);
    setIsCurrentSaved(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const deleteSavedConsultation = (id: string) => {
    const updated = savedScans.filter((s) => s.id !== id);
    setSavedScans(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Check-in plans management
  const handleStartCheckInPlan = (plan: CheckInPlan) => {
    const updated = [plan, ...checkInPlans];
    setCheckInPlans(updated);
    try {
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setActiveTab('checkins');
  };

  const handleDeleteCheckInPlan = (id: string) => {
    const updated = checkInPlans.filter((p) => p.id !== id);
    setCheckInPlans(updated);
    try {
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSaveCompletedCheckIn = (planId: string, completed: CompletedCheckIn) => {
    const updated = checkInPlans.map((p) => {
      if (p.id !== planId) return p;
      const currentCompleted = p.completedCheckIns || [];
      const filtered = currentCompleted.filter((c) => c.week !== completed.week);
      return {
        ...p,
        completedCheckIns: [...filtered, completed],
      };
    });
    setCheckInPlans(updated);
    try {
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Wishlist management
  const handleToggleWishlist = (productId: string) => {
    const isSaved = savedWishlistIds.includes(productId);
    const updated = isSaved
      ? savedWishlistIds.filter((id) => id !== productId)
      : [...savedWishlistIds, productId];
    setSavedWishlistIds(updated);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRemoveWishlist = (productId: string) => {
    const updated = savedWishlistIds.filter((id) => id !== productId);
    setSavedWishlistIds(updated);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearWishlist = () => {
    setSavedWishlistIds([]);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Shelf management
  const handleUpdateShelf = (updated: ShelfState) => {
    setShelf(updated);
    try {
      localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearShelf = () => {
    const empty: ShelfState = { productIds: [], checkboxKeys: [] };
    setShelf(empty);
    try {
      localStorage.removeItem(SHELF_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleQuizAndPhotoComplete = (
    answers: UserQuizAnswers,
    photoRes: PhotoAnalysisResult | null,
    isDemo?: boolean
  ) => {
    setUserAnswers(answers);
    setPhotoResult(photoRes);
    setIsDemoProfile(Boolean(isDemo));
    setIsCurrentSaved(false);
    setActiveTab('scanner');
  };

  const handleNewScan = () => {
    setUserAnswers(null);
    setPhotoResult(null);
    setCapturedImage(null);
    setIsDemoProfile(false);
    setIsCurrentSaved(false);
    setActiveTab('scanner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-stone-900 selection:bg-amber-200">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'guide') {
            setIsToneGuideOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        savedScansCount={savedScans.length}
        plansCount={checkInPlans.length}
        savedWishlistCount={savedWishlistIds.length}
        shelfItemsCount={shelf.productIds.length + shelf.checkboxKeys.length}
        onNewScan={handleNewScan}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'finder' ? (
          <SunscreenFinderView
            savedWishlistIds={savedWishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onOpenQuiz={() => setActiveTab('scanner')}
            onOpenConcern={() => setActiveTab('concern')}
            onOpenLabelGuide={() => setActiveTab('label')}
          />
        ) : activeTab === 'concern' ? (
          <KnownConcernView
            onSubmit={(a) => handleQuizAndPhotoComplete(a, null, false)}
            onOpenLabelGuide={() => setActiveTab('label')}
            onOpenFinder={() => setActiveTab('finder')}
          />
        ) : activeTab === 'label' ? (
          <LabelGuideView />
        ) : activeTab === 'shelf' ? (
          <MyShelfView
            shelf={shelf}
            onUpdateShelf={handleUpdateShelf}
            onClearShelf={handleClearShelf}
            userAnswers={userAnswers}
          />
        ) : activeTab === 'checkins' ? (
          <CheckInsView
            plans={checkInPlans}
            onDeletePlan={handleDeleteCheckInPlan}
            onSaveCompletedCheckIn={handleSaveCompletedCheckIn}
            onNewScan={handleNewScan}
            userAnswers={userAnswers}
          />
        ) : activeTab === 'saved' ? (
          <SavedProductsView
            savedIds={savedWishlistIds}
            onRemoveId={handleRemoveWishlist}
            onClearAll={handleClearWishlist}
            onNewScan={handleNewScan}
          />
        ) : activeTab === 'history' ? (
          <HistoryView
            savedScans={savedScans}
            onDeleteScan={deleteSavedConsultation}
            onNewScan={handleNewScan}
          />
        ) : userAnswers && photoResult && seenScan !== photoResult ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-bold text-stone-900">What your scan found</h1>
              <p className="text-sm text-stone-600 mt-2">
                This comes first. Your matched products and routine come next.
              </p>
            </div>
            <FaceScanReport photoResult={photoResult} isDemoProfile={isDemoProfile} onRetake={handleNewScan} />
            <div className="flex justify-center">
              <button
                onClick={() => setSeenScan(photoResult)}
                className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl cursor-pointer"
              >
                See my picks and routine
              </button>
            </div>
          </div>
        ) : userAnswers ? (
          <AnalysisDashboard
            answers={userAnswers}
            photoResult={photoResult}
            isDemoProfile={isDemoProfile}
            onNewScan={handleNewScan}
            onSaveToHistory={saveConsultation}
            isSaved={isCurrentSaved}
            onSelectProductForReview={(p) => setSelectedProductForReview(p)}
            onStartCheckInPlan={handleStartCheckInPlan}
            savedWishlistIds={savedWishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        ) : (
          <SkinScannerInput
            onComplete={handleQuizAndPhotoComplete}
            onOpenLiveCamera={() => setIsCameraOpen(true)}
            capturedImage={capturedImage}
            setCapturedImage={setCapturedImage}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7ded4] bg-white py-8 px-4 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="font-serif font-bold text-stone-800 text-sm">No Cap</span>
            <span>· Honest skincare picks</span>
          </div>
          <p className="text-center sm:text-left text-[11px] text-stone-500">
            Guidance, not medical advice.
          </p>
          <div className="flex items-center gap-4 text-stone-500 text-center sm:text-right">
            <span>Prices are a snapshot from Nykaa. These links earn us nothing.</span>
            <button
              onClick={() => setIsToneGuideOpen(true)}
              className="text-stone-700 hover:text-stone-900 font-medium underline cursor-pointer"
            >
              Tone Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        ageRange={userAnswers?.ageRange}
        onCapture={(cleanJpeg) => {
          setCapturedImage(cleanJpeg);
        }}
      />

      {/* Reviews Modal */}
      <ProductReviewsModal
        product={selectedProductForReview}
        onClose={() => setSelectedProductForReview(null)}
      />

      {/* Tone Guide Modal */}
      <ToneGuideModal
        isOpen={isToneGuideOpen}
        onClose={() => setIsToneGuideOpen(false)}
      />
    </div>
  );
}

import { Heart as FinderHeart, ExternalLink as FinderExternalLink, Sun as FinderSun, RotateCcw as FinderRotateCcw } from 'lucide-react';
import type { MiddayFeel as FinderFeel, SkinTone as FinderTone, Budget as FinderBudget } from './types';
import { FinderPriority, FINDER_PRIORITY_LABELS, findSunscreens } from './utils/skincareRules';

const FINDER_STORAGE_KEY = 'nocap_sunscreen_finder_v1';

const FINDER_FEEL_OPTIONS: FinderFeel[] = ['oily', 'combination', 'dry', 'normal'];
const FINDER_TONE_OPTIONS: { value: FinderTone; color: string }[] = [
  { value: 'very fair', color: '#f8e0cf' },
  { value: 'fair', color: '#efc9a8' },
  { value: 'wheatish', color: '#d9a577' },
  { value: 'medium brown', color: '#a8734a' },
  { value: 'deep brown', color: '#6b4326' },
];
const FINDER_BUDGET_OPTIONS: FinderBudget[] = ['under ₹300', '₹300 to 600', 'over ₹600'];
const FINDER_PRIORITY_OPTIONS: FinderPriority[] = ['noWhiteCast', 'spf50', 'gentle', 'acne'];

interface SunscreenFinderViewProps {
  savedWishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenQuiz: () => void;
  onOpenConcern: () => void;
  onOpenLabelGuide: () => void;
}

const finderChipClass = (active: boolean) =>
  `px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
    active
      ? 'bg-stone-900 text-white border-stone-900'
      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
  }`;

export const SunscreenFinderView: React.FC<SunscreenFinderViewProps> = ({
  savedWishlistIds,
  onToggleWishlist,
  onOpenQuiz,
  onOpenConcern,
  onOpenLabelGuide,
}) => {
  const [feel, setFeel] = useState<FinderFeel | null>(null);
  const [tone, setTone] = useState<FinderTone | null>(null);
  const [budget, setBudget] = useState<FinderBudget | null>(null);
  const [priorities, setPriorities] = useState<FinderPriority[]>([]);

  // Remember only these four choices on this device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FINDER_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (FINDER_FEEL_OPTIONS.includes(saved.feel)) setFeel(saved.feel);
      if (FINDER_TONE_OPTIONS.some((t) => t.value === saved.tone)) setTone(saved.tone);
      if (FINDER_BUDGET_OPTIONS.includes(saved.budget)) setBudget(saved.budget);
      if (Array.isArray(saved.priorities)) {
        setPriorities(saved.priorities.filter((p: string) => FINDER_PRIORITY_OPTIONS.includes(p as FinderPriority)));
      }
    } catch {
      // Storage can be blocked. The screen still works without it.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FINDER_STORAGE_KEY, JSON.stringify({ feel, tone, budget, priorities }));
    } catch {
      // Ignore storage errors.
    }
  }, [feel, tone, budget, priorities]);

  const reset = () => {
    setFeel(null);
    setTone(null);
    setBudget(null);
    setPriorities([]);
    try {
      localStorage.removeItem(FINDER_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  };

  const togglePriority = (p: FinderPriority) =>
    setPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const ready = feel !== null && tone !== null && budget !== null;
  const output = ready ? findSunscreens({ feel, tone, budget, priorities }) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-stone-600 mb-3">
          <FinderSun className="w-4 h-4 text-amber-600" />
          Sunscreen finder
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
          Find a sunscreen in 30 seconds
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
          Honest skincare picks. Answer three taps. No photo, no sign-up. Matches come only from real Nykaa
          listings.
        </p>
        <p className="text-xs text-stone-500 mt-3">
          If a product burns, swells or gives you a rash, stop using it and see a doctor.
        </p>
      </div>

      <div className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-2">How does your skin feel by midday?</h2>
          <div className="flex flex-wrap gap-2">
            {FINDER_FEEL_OPTIONS.map((o) => (
              <button key={o} onClick={() => setFeel(o)} className={finderChipClass(feel === o)}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-2">Your skin tone</h2>
          <div className="flex flex-wrap gap-2">
            {FINDER_TONE_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => setTone(o.value)} className={finderChipClass(tone === o.value)}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-stone-400"
                    style={{ backgroundColor: o.color }}
                  />
                  {o.value.charAt(0).toUpperCase() + o.value.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-2">Budget per product</h2>
          <div className="flex flex-wrap gap-2">
            {FINDER_BUDGET_OPTIONS.map((o) => (
              <button key={o} onClick={() => setBudget(o)} className={finderChipClass(budget === o)}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">
            What matters most? <span className="text-xs font-normal text-stone-500">Optional, tick any</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {FINDER_PRIORITY_OPTIONS.map((p) => (
              <button key={p} onClick={() => togglePriority(p)} className={finderChipClass(priorities.includes(p))}>
                {FINDER_PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <FinderRotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {!ready && (
        <p className="text-center text-sm text-stone-500 mt-8">
          Choose how your skin feels, your skin tone and your budget to see matches.
        </p>
      )}

      {output && (
        <section className="mt-8">
          {output.noExactMatch && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-stone-800">
              No sunscreen in our list matches all of these. Here are the closest.
            </div>
          )}

          {output.results.length === 0 ? (
            <p className="text-sm text-stone-600">No sunscreens match right now.</p>
          ) : (
            <div className="space-y-4">
              {output.results.map(({ product, matchedOn, flagLabels, isAboveBudget, missing }) => {
                const saved = savedWishlistIds.includes(product.id);
                const reviewCount = product.reviews
                  ? product.reviews.sample.positive + product.reviews.sample.negative
                  : 0;
                return (
                  <article key={product.id} className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6">
                    {product.image && (
                      <div className="w-full h-40 mb-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          title="Image from the Nykaa listing"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg font-bold text-stone-900">{product.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-lg font-semibold text-stone-900">₹{product.price}</span>
                          {product.mrp > product.price && (
                            <span className="text-sm text-stone-500 line-through">₹{product.mrp}</span>
                          )}
                          {product.spf !== null && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              SPF {product.spf}
                            </span>
                          )}
                          {isAboveBudget && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                              Above your budget
                            </span>
                          )}
                          {product.dermReview && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Reviewed by {product.dermReview.reviewedBy}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Rated {product.rating} from {product.ratingCount.toLocaleString('en-IN')} ratings on{' '}
                          {product.seller}. Price checked {product.checkedAt}.
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleWishlist(product.id)}
                        aria-label={saved ? 'Remove from saved products' : 'Save product'}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 cursor-pointer"
                      >
                        <FinderHeart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
                        {saved ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    {missing.length > 0 && (
                      <ul className="mt-3 text-xs text-amber-900 space-y-0.5">
                        {missing.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    )}

                    <ul className="mt-3 text-sm text-stone-700 list-disc pl-5 space-y-0.5">
                      {matchedOn.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>

                    {product.communityNotes && product.communityNotes.length > 0 && (
                      <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-200 text-[11px] text-stone-700 space-y-1">
                        <span className="font-bold text-violet-900 block text-[10px] uppercase tracking-wider">
                          What Reddit users said
                        </span>
                        {product.communityNotes.map((c, idx) => (
                          <p key={idx}>
                            {c.note}
                            {c.skinTone ? ` (skin tone as they described it: ${c.skinTone})` : ''}{' '}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2 font-semibold hover:text-stone-900"
                            >
                              Read the comment
                            </a>
                          </p>
                        ))}
                        <span className="block text-[10px] text-stone-500">
                          Paraphrased from public comments on r/IndianSkincareAddicts. A few people's opinions, not a study.
                        </span>
                      </div>
                    )}

                    {flagLabels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {flagLabels.map((f) => (
                          <span
                            key={f}
                            className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 border-t border-stone-100 pt-3">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-600 mb-1">
                        What reviewers say
                      </h4>
                      {product.reviews ? (
                        <div className="text-sm text-stone-700 space-y-2">
                          <div>
                            <p className="font-medium text-stone-800">Praise</p>
                            <ul className="list-disc pl-5">
                              {product.reviews.praise.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">Complaints</p>
                            <ul className="list-disc pl-5">
                              {product.reviews.complaints.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-xs text-stone-500">
                            Summary written from {reviewCount} real reviews on {product.reviews.source}, collected{' '}
                            {product.reviews.collectedAt}. {product.reviews.note}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-600">
                          No review text collected for this product yet. The star rating comes from the seller&apos;s
                          page.
                        </p>
                      )}
                    </div>

                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 underline underline-offset-2 hover:text-stone-600"
                    >
                      View on Nykaa and read the reviews
                      <FinderExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-xs text-stone-500 space-y-1">
            <p>
              Matches use the product name and listing numbers only. Ingredient lists are not checked, so read the
              label.
            </p>
            <p>Prices are a snapshot from the checked date and change often.</p>
            <p>Use about two finger lengths for face and neck, and reapply every 2 to 3 hours if you are outdoors.</p>
            <p>Guidance, not medical advice.</p>
          </div>
        </section>
      )}

      <div className="text-center mt-10 space-y-2">
        <div>
          <button
            onClick={onOpenQuiz}
            className="text-sm font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 cursor-pointer"
          >
            Want a full routine? Take the skin quiz
          </button>
        </div>
        <div>
          <button
            onClick={onOpenConcern}
            className="text-sm font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 cursor-pointer"
          >
            Already know your concern? Skip the quiz
          </button>
        </div>
      </div>

      <div className="mt-8">
        <OtherConcernsBox onOpenLabelGuide={onOpenLabelGuide} />
      </div>
    </div>
  );
};

// ---------- Label guide: a fixed, plain-language cheat sheet ----------

const LABEL_GUIDE_SECTIONS: { title: string; points: string[] }[] = [
  {
    title: 'Sunscreen: for every skin type',
    points: [
      'Look for SPF 30 or higher. SPF 50 gives a little more, but the real difference is wearing it every day.',
      'PA+++ or PA++++ means stronger UVA protection. Sun exposure can keep dark marks dark, which is why a daily sunscreen matters.',
      'Use about two finger lengths for the face and neck, and reapply every 2 to 3 hours if you are outdoors.',
      'A sunscreen you enjoy wearing is the one you will use. Try a small size first if you can.',
    ],
  },
  {
    title: 'Sunscreen for oily or acne-prone skin',
    points: [
      'Words like "gel", "oil-free", "matte" and "non-comedogenic" usually mean a lighter feel. They are labels, not guarantees.',
      'If a sunscreen feels heavy or you break out, try a lighter gel or fluid and see if it helps. Patch test first.',
    ],
  },
  {
    title: 'Sunscreen for dry skin',
    points: [
      'Creams and lotions that say "hydrating" or "moisturizing" usually feel more comfortable than matte or "oil control" ones, which can feel tight on dry skin.',
      'Moisturizing sunscreens often list ingredients like glycerin, hyaluronic acid or ceramides. Seeing them on the label is a good sign for comfort, not a guarantee.',
    ],
  },
  {
    title: 'Sunscreen for sensitive skin',
    points: [
      'Choose "fragrance-free" where you can, because fragrance and a lot of alcohol near the top of the ingredient list can sting some people.',
      'Mineral sunscreens (zinc oxide, titanium dioxide) are often gentler, but they can leave a white or grey film.',
      'Patch test first: a small dot behind the ear or on the jaw for 2 to 3 days.',
    ],
  },
  {
    title: 'Sunscreen for deeper skin tones',
    points: [
      'Look for "no white cast" or a tinted formula. Mineral filters are the most likely to leave a grey or white film.',
      'Gel and fluid sunscreens with newer chemical filters usually blend in more easily, but this varies a lot by product, so a small size or sample helps.',
      'Daily sunscreen matters even more if you have dark marks, because sun can make them darker and slower to fade.',
    ],
  },
  {
    title: 'Moisturizer and cleanser by skin type',
    points: [
      'Oily or combination skin: a gel or lightweight lotion moisturizer, and a gel cleanser. You still need a moisturizer.',
      'Dry skin: a cream or balm moisturizer, often with ceramides or glycerin, and a gentle low-foam cleanser.',
      'Sensitive skin: fewer ingredients, "fragrance-free", and a gentle cleanser. Add one new product at a time.',
      'Avoid scrubs with gritty particles on any skin type, especially on active pimples.',
    ],
  },
  {
    title: 'Actives on the label',
    points: [
      'Use one active at a time. If a product lists a percentage, like "10% niacinamide", higher is not always better for a beginner.',
      'Azelaic acid, niacinamide and salicylic acid are the gentle actives our picks start with. Retinoids, strong acids and peels are not part of our picks, so ask a dermatologist about them.',
      'If a doctor has prescribed something for your skin, follow their advice and ask before adding anything new.',
      'If you are under 18, pregnant or breastfeeding, check with a doctor before adding any active.',
      'Do a patch test first: a small dot behind the ear or on the jaw for 2 to 3 days.',
      'If it stings, burns, swells or gives you a rash, stop using it and see a doctor.',
    ],
  },
  {
    title: 'Things to be careful about',
    points: [
      'Heavily fragranced products, if your skin stings easily.',
      'Physical scrubs and harsh peels on active pimples.',
      'Products that promise marks gone in days. Marks usually fade over months.',
      '"Dermatologist recommended" on a pack is a claim you cannot check from the label. It does not mean it will suit your skin.',
    ],
  },
  {
    title: 'How to read a product page',
    points: [
      'Check the rating and how many people rated it. 4.0 stars from 20 ratings tells you less than 4.3 from 20,000.',
      'Read the 2 and 3 star reviews first. They usually say what goes wrong.',
      'Look at the date and the seller. Prices and stock change often.',
      'Check the period-after-opening symbol (an open jar with a number, like 6M or 12M) and throw the product away after that time.',
    ],
  },
];

const LabelGuideView: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
    <div className="text-center">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">What to look for on the label</h1>
      <p className="text-sm text-stone-600 mt-2">
        A quick cheat sheet for any skin type, and for any product, including ones that are not in our list.
      </p>
    </div>
    {LABEL_GUIDE_SECTIONS.map((section) => (
      <section key={section.title} className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">{section.title}</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-stone-700">
          {section.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    ))}
    <p className="text-xs text-stone-500 text-center">
      Guidance, not medical advice.
    </p>
  </div>
);

// ---------- "I already know my concern": a shortcut past the long quiz ----------

import extraConcernData from './data/concernProducts.json';
import type {
  UserQuizAnswers as QCAnswers,
  AgeRange as QCAge,
  SkinTone as QCTone,
  Budget as QCBudget,
  HealthSituation as QCHealth,
  Sensitivity as QCSens,
  MarksDuration as QCMarks,
  BreakoutLevel as QCBreakout,
  Role as QCRole,
  Concern as QCConcern,
  MiddayFeel as QCFeel,
} from './types';

const QC_CONCERNS: { key: string; label: string; concern: QCConcern; feel?: QCFeel }[] = [
  { key: 'acne', label: 'Acne or pimples', concern: 'acne' },
  { key: 'red', label: 'Red marks after pimples', concern: 'red marks' },
  { key: 'brown', label: 'Brown or dark marks after pimples', concern: 'brown marks' },
  { key: 'pores', label: 'Blackheads or clogged pores', concern: 'clogged pores' },
  { key: 'oil', label: 'Oily shine', concern: 'oil and shine', feel: 'oily' },
  { key: 'dry', label: 'Dry or tight skin', concern: 'tight or dehydrated skin', feel: 'dry' },
];
const QC_AGES: QCAge[] = ['under 18', '18 to 24', '25 to 34', '35 or older'];
const QC_TONES: { value: QCTone; color: string }[] = [
  { value: 'very fair', color: '#f8e0cf' },
  { value: 'fair', color: '#efc9a8' },
  { value: 'wheatish', color: '#d9a577' },
  { value: 'medium brown', color: '#a8734a' },
  { value: 'deep brown', color: '#6b4326' },
];
const QC_BUDGETS: QCBudget[] = ['under ₹300', '₹300 to 600', 'over ₹600'];
const QC_BREAKOUTS: QCBreakout[] = ['mild', 'moderate', 'deep and painful'];
const QC_MARKS: QCMarks[] = ['under 3 months', '3 to 12 months', 'over a year'];
const QC_SENS: { value: QCSens; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
];
const QC_HEALTH: QCHealth[] = [
  'pregnant or breastfeeding',
  'on a prescribed skin treatment',
  'told by a doctor I have melasma',
];
const QC_ROLES: { value: QCRole; label: string }[] = [
  { value: 'cleanser', label: 'Cleanser' },
  { value: 'moisturizer', label: 'Moisturizer' },
  { value: 'sunscreen', label: 'Sunscreen' },
  { value: 'treatment', label: 'Treatment for marks or acne' },
];

const QC_NEEDS_A_DOCTOR = [
  'Eczema, or very itchy, flaky patches',
  'Rosacea, or flushing that does not settle',
  'Fungal acne (itchy, uniform small bumps)',
  'Melasma (dark patches that spread, often on both cheeks)',
  'Deep, painful or cystic acne',
  'A sudden rash, swelling or burning',
  'Anything spreading, bleeding or that looks infected',
];

const qcChip = (active: boolean) =>
  `px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
    active
      ? 'bg-stone-900 text-white border-stone-900'
      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
  }`;

interface KnownConcernViewProps {
  onSubmit: (answers: QCAnswers) => void;
  onOpenLabelGuide: () => void;
  onOpenFinder: () => void;
}

const KnownConcernView: React.FC<KnownConcernViewProps> = ({ onSubmit, onOpenLabelGuide, onOpenFinder }) => {
  const [picked, setPicked] = useState<string[]>([]);
  const [breakout, setBreakout] = useState<QCBreakout | null>(null);
  const [marks, setMarks] = useState<QCMarks | null>(null);
  const [age, setAge] = useState<QCAge | null>(null);
  const [tone, setTone] = useState<QCTone | null>(null);
  const [budget, setBudget] = useState<QCBudget>('₹300 to 600');
  const [sens, setSens] = useState<QCSens>('never');
  const [health, setHealth] = useState<QCHealth[]>([]);
  const [looking, setLooking] = useState<QCRole[]>(['cleanser', 'moisturizer', 'sunscreen', 'treatment']);

  const toggle = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const hasAcne = picked.includes('acne');
  const hasMarks = picked.includes('red') || picked.includes('brown');
  const ready =
    picked.length > 0 &&
    age !== null &&
    tone !== null &&
    looking.length > 0 &&
    (!hasAcne || breakout !== null) &&
    (!hasMarks || marks !== null);

  const submit = () => {
    if (!ready || age === null || tone === null) return;
    const chosen = QC_CONCERNS.filter((c) => picked.includes(c.key));
    const answers: QCAnswers = {
      lookingFor: looking,
      ageRange: age,
      skinTone: tone,
      concerns: chosen.map((c) => c.concern),
      middayFeel: chosen.find((c) => c.feel)?.feel || 'combination',
      breakoutLevel: hasAcne ? breakout || 'mild' : 'none',
      marksDuration: hasMarks ? marks || 'under 3 months' : 'none',
      sensitivity: sens,
      healthSituations: health,
      budget,
    };
    onSubmit(answers);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">I already know my concern</h1>
        <p className="text-sm text-stone-600 mt-2 max-w-xl mx-auto">
          Skip the long quiz. Pick your concern, answer a few safety questions, and get picks. It uses the same
          safety rules as the full quiz.
        </p>
        <button
          type="button"
          onClick={onOpenFinder}
          className="mt-2 text-xs font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 cursor-pointer"
        >
          Only need a sunscreen? Use the Sunscreen finder
        </button>
      </div>

      <section className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-2">
            What is your concern? <span className="text-xs font-normal text-stone-500">Pick any</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {QC_CONCERNS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setPicked((p) => toggle(p, c.key))}
                className={qcChip(picked.includes(c.key))}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {hasAcne && (
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">How bad are the breakouts?</h3>
            <div className="flex flex-wrap gap-2">
              {QC_BREAKOUTS.map((b) => (
                <button key={b} type="button" onClick={() => setBreakout(b)} className={qcChip(breakout === b)}>
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                </button>
              ))}
            </div>
            {breakout === 'deep and painful' && (
              <p className="text-xs text-amber-900 mt-2">
                Deep, painful breakouts need a dermatologist. We will show that instead of products.
              </p>
            )}
          </div>
        )}

        {hasMarks && (
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">How long have the marks been there?</h3>
            <div className="flex flex-wrap gap-2">
              {QC_MARKS.map((m) => (
                <button key={m} type="button" onClick={() => setMarks(m)} className={qcChip(marks === m)}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-2">What do you want to buy?</h2>
          <div className="flex flex-wrap gap-2">
            {QC_ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setLooking((l) => toggle(l, r.value))}
                className={qcChip(looking.includes(r.value))}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6 space-y-5">
        <h2 className="font-serif text-lg font-bold text-stone-900">A few quick safety questions</h2>

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">Your age</h3>
          <div className="flex flex-wrap gap-2">
            {QC_AGES.map((a) => (
              <button key={a} type="button" onClick={() => setAge(a)} className={qcChip(age === a)}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
          {age === 'under 18' && (
            <p className="text-xs text-stone-600 mt-2">Under 18: you will get gentle basics only, with no actives.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">Your skin tone</h3>
          <div className="flex flex-wrap gap-2">
            {QC_TONES.map((t) => (
              <button key={t.value} type="button" onClick={() => setTone(t.value)} className={qcChip(tone === t.value)}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-stone-400"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.value.charAt(0).toUpperCase() + t.value.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">Budget per product</h3>
          <div className="flex flex-wrap gap-2">
            {QC_BUDGETS.map((b) => (
              <button key={b} type="button" onClick={() => setBudget(b)} className={qcChip(budget === b)}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">Does your skin sting or redden with new products?</h3>
          <div className="flex flex-wrap gap-2">
            {QC_SENS.map((s) => (
              <button key={s.value} type="button" onClick={() => setSens(s.value)} className={qcChip(sens === s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-800 mb-2">
            Does any of this apply to you? <span className="text-xs font-normal text-stone-500">Tick any</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {QC_HEALTH.map((h) => (
              <button key={h} type="button" onClick={() => setHealth((l) => toggle(l, h))} className={qcChip(health.includes(h))}>
                {h.charAt(0).toUpperCase() + h.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              ready
                ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer shadow-md'
                : 'bg-stone-200 text-stone-500 cursor-not-allowed'
            }`}
          >
            Show my picks
          </button>
        </div>
      </section>

      <ExtraConcernsSection onOpenFinder={onOpenFinder} />

      <OtherConcernsBox onOpenLabelGuide={onOpenLabelGuide} />

      <p className="text-xs text-stone-500 text-center">Guidance, not medical advice.</p>
    </div>
  );
};

const OtherConcernsBox: React.FC<{ onOpenLabelGuide: () => void }> = ({ onOpenLabelGuide }) => {
  const [showOther, setShowOther] = useState(false);
  return (
    <section className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setShowOther((v) => !v)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <span className="font-serif text-lg font-bold text-stone-900">My concern is not in this list</span>
        <span className="text-sm text-stone-600">{showOther ? 'Hide' : 'Show'}</span>
      </button>
      {showOther && (
        <div className="mt-4 space-y-5 text-sm text-stone-700">
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">See a dermatologist first</h3>
            <ul className="list-disc pl-5 space-y-1">
              {QC_NEEDS_A_DOCTOR.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-stone-500">
              A dermatologist can diagnose these and tell you which treatment is right. That may be a prescription
              medicine or a product you can buy over the counter. Trying products on your own first can make some of
              these worse, so we do not suggest any until you have been seen.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">Something else?</h3>
            <p className="text-sm text-stone-700">
              If your concern is not covered here, we cannot match products to it, and we would rather say so than
              guess. You can still use the Label guide to judge any product you find, and a dermatologist or
              pharmacist can point you to the right one.
            </p>
            <button
              type="button"
              onClick={onOpenLabelGuide}
              className="mt-2 text-xs font-medium text-stone-900 underline underline-offset-2 cursor-pointer"
            >
              Open the Label guide
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

// ---------- Other concerns: simple picks by rating, with honest notes ----------

interface ExtraProduct {
  id: string;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  url: string;
  image: string;
  checkedAt: string;
  flag?: string;
}

const EXTRA_CONCERNS: { key: string; label: string; note: string; sunscreenFirst?: boolean }[] = [
  {
    key: 'darkcircles',
    label: 'Dark circles',
    note: 'Dark circles often come from sleep, genetics, allergies or thin skin, and eye products help only a little. Daily sunscreen and enough sleep matter more. See a doctor if one eye is darker than the other or it appeared suddenly.',
  },
  {
    key: 'openpores',
    label: 'Open pores',
    note: 'Pore size is mostly genetic and cannot be shrunk for good. These products can keep pores clean so they look smaller. Do not squeeze or scrub, and use one active at a time.',
  },
  {
    key: 'antiageing',
    label: 'Wrinkles and anti-ageing',
    note: 'Daily sunscreen is the most proven way to slow visible ageing. Our picks here leave out retinoids, so ask a dermatologist if you want one. Start with a sunscreen, then add one gentle product.',
    sunscreenFirst: true,
  },
  {
    key: 'lips',
    label: 'Lip care',
    note: 'Lips burn in the sun too, so a lip balm with SPF matters. If your lips stay cracked, sore or bleeding for weeks, see a doctor.',
  },
  {
    key: 'bodyacne',
    label: 'Body or back acne',
    note: 'Shower soon after sweating and wear loose, breathable clothes. Washes with acids can sting, so start 2 to 3 times a week and stop if your skin burns. Deep, painful or scarring body acne needs a dermatologist.',
  },
  {
    key: 'dandruff',
    label: 'Dandruff or flaky scalp',
    note: 'Flaking can be dandruff or a scalp condition. If you have red, sore or scaly patches, or it does not improve after about a month, see a dermatologist. Follow the label for how often to use these.',
  },
  {
    key: 'hairfall',
    label: 'Hair fall',
    note: 'A shampoo keeps the scalp clean, but it does not treat the cause of hair fall. Sudden, patchy or heavy hair loss needs a doctor.',
  },
  {
    key: 'tan',
    label: 'Tan removal',
    note: 'The best protection against tan is a daily sunscreen. De-tan products can irritate, so patch test first, skip them on sunburnt or broken skin, and do not combine them with other actives.',
    sunscreenFirst: true,
  },
];

const ExtraConcernsSection: React.FC<{ onOpenFinder: () => void }> = ({ onOpenFinder }) => {
  const [open, setOpen] = useState<string | null>(null);
  const active = EXTRA_CONCERNS.find((c) => c.key === open) || null;
  const products: ExtraProduct[] = active
    ? ((extraConcernData as unknown as Record<string, ExtraProduct[]>)[active.key] || [])
    : [];

  return (
    <section className="bg-white border border-[#e7ded4] rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-serif text-lg font-bold text-stone-900">Other concerns</h2>
        <p className="text-xs text-stone-500 mt-1">
          For these we do not match products to your skin. We list well-rated products from Nykaa and give honest
          notes. Tap one to see them.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXTRA_CONCERNS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setOpen((cur) => (cur === c.key ? null : c.key))}
            className={qcChip(open === c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-4 border-t border-stone-100 pt-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-stone-800">
            {active.note}
            {active.sunscreenFirst && (
              <button
                type="button"
                onClick={onOpenFinder}
                className="block mt-2 text-xs font-semibold text-stone-900 underline underline-offset-2 cursor-pointer"
              >
                Find a sunscreen first
              </button>
            )}
          </div>

          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-stone-100 px-3 py-3">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-contain rounded-lg bg-stone-50 shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-semibold text-stone-900 leading-snug hover:underline underline-offset-2"
                  >
                    {p.name}
                  </a>
                  <span className="block text-[11px] text-stone-500 mt-0.5">
                    Rated {p.rating} from {p.ratingCount.toLocaleString('en-IN')} ratings on Nykaa. Price checked{' '}
                    {p.checkedAt}.
                  </span>
                  {p.flag && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {p.flag}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-sm font-bold font-mono text-stone-900">{'\u20b9'}{p.price}</span>
                  {p.mrp > p.price && (
                    <span className="block text-[11px] font-mono text-stone-400 line-through">{'\u20b9'}{p.mrp}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-stone-500">
            These are picked by rating and number of ratings on Nykaa, with at least 4.0 stars and 500 ratings, and
            no retinoids. They are not matched to your skin type and ingredients are not checked, so read the label.
            If you are under 18, pregnant or breastfeeding, check with a doctor before adding any active product.
          </p>
        </div>
      )}
    </section>
  );
};
