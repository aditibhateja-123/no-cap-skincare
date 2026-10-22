import React, { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Printer,
  Bookmark,
  RefreshCw,
  Star,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
  Heart,
} from 'lucide-react';
import {
  UserQuizAnswers,
  PhotoAnalysisResult,
  RankedProduct,
  RoutineSchedule,
  CheckInPlan,
} from '../types';
import {
  checkReferral,
  determineActiveStrategy,
  rankProducts,
  buildRoutineSchedule,
  FIXED_SKIP_THESE,
  FIXED_SEE_DERMATOLOGIST_WHEN,
  formatLocalDateToYMD,
  addDaysLocal,
} from '../utils/skincareRules';
import { CompareModal } from './CompareModal';
import type { CatalogProduct as AltCatalogProduct } from '../types';
import altCatalogData from '../data/catalog.json';

interface AnalysisDashboardProps {
  answers: UserQuizAnswers;
  photoResult: PhotoAnalysisResult | null;
  isDemoProfile?: boolean;
  onNewScan: () => void;
  onSaveToHistory: (consultation: {
    ageRange: any;
    skinTone: any;
    concerns: string[];
    productNames: string[];
  }) => void;
  isSaved: boolean;
  onSelectProductForReview: (product: RankedProduct) => void;
  onStartCheckInPlan: (plan: CheckInPlan) => void;
  savedWishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  answers,
  photoResult,
  isDemoProfile,
  onNewScan,
  onSaveToHistory,
  isSaved,
  onSelectProductForReview,
  onStartCheckInPlan,
  savedWishlistIds,
  onToggleWishlist,
}) => {
  // Step 1: Run Referral Check
  const referral = checkReferral(answers, photoResult);

  // If referral triggered, show dedicated Referral Screen with NO products
  if (referral.needsReferral) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-200">
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Medical Referral Recommended
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-rose-950">
                Please See a Dermatologist
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
            Based on your answers and visual indicators, over-the-counter products are not recommended
            without an in-person medical evaluation. Here are the specific clinical reasons:
          </p>

          <div className="space-y-3">
            {referral.reasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-rose-200 text-xs text-rose-900 flex items-start gap-3 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="leading-relaxed">{reason}</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-rose-200 text-xs text-stone-700 space-y-2">
            <h3 className="font-bold text-stone-900">What to do next:</h3>
            <ul className="space-y-1.5 list-disc pl-4 text-stone-600">
              <li>Consult a qualified dermatologist or primary healthcare clinician for an in-person diagnostic examination.</li>
              <li>Avoid picking, squeezing, or self-treating painful lesions, which risks scarring and secondary infection.</li>
              <li>Keep your routine strictly gentle with lukewarm water and a basic non-active moisturizer until examined.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={onNewScan}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Start Over with Different Answers
            </button>
            <span className="text-[11px] text-rose-700 font-medium text-center sm:text-right">
              No products are prescribed or recommended for safety.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Determine Active Strategy & Rank Products from Catalog
  const activeStrategy = determineActiveStrategy(answers, answers.concerns);

  const rankedCleansers = answers.lookingFor.includes('cleanser')
    ? rankProducts('cleanser', answers, activeStrategy.activeChosen, activeStrategy.useSalicylicCleanser)
    : [];

  const rankedMoisturizers = answers.lookingFor.includes('moisturizer')
    ? rankProducts('moisturizer', answers, activeStrategy.activeChosen, activeStrategy.useSalicylicCleanser)
    : [];

  const rankedSunscreens = answers.lookingFor.includes('sunscreen')
    ? rankProducts('sunscreen', answers, activeStrategy.activeChosen, activeStrategy.useSalicylicCleanser)
    : [];

  const rankedTreatments =
    answers.lookingFor.includes('treatment') && !activeStrategy.basicsOnly && activeStrategy.activeChosen
      ? rankProducts('treatment', answers, activeStrategy.activeChosen, activeStrategy.useSalicylicCleanser)
      : [];

  const hasBrownMarks = answers.concerns.includes('brown marks');
  const routineSchedule = buildRoutineSchedule(activeStrategy, answers.skinTone, hasBrownMarks);

  // Group all picked product names for history saving
  const allPickedProducts = [
    ...rankedCleansers,
    ...rankedMoisturizers,
    ...rankedSunscreens,
    ...rankedTreatments,
  ];

  // Compare state
  const [compareList, setCompareList] = useState<RankedProduct[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTypeError, setCompareTypeError] = useState<string | null>(null);

  const handleToggleCompare = (product: RankedProduct) => {
    if (compareList.some((p) => p.id === product.id)) {
      setCompareList(compareList.filter((p) => p.id !== product.id));
      setCompareTypeError(null);
      return;
    }

    if (compareList.length > 0 && compareList[0].role !== product.role) {
      setCompareTypeError('Compare products of the same type');
      return;
    }

    if (compareList.length >= 3) {
      setCompareTypeError('You can compare up to 3 products at a time');
      return;
    }

    setCompareTypeError(null);
    setCompareList([...compareList, product]);
  };

  const handleStartCheckIn = () => {
    const today = new Date();
    const d2 = addDaysLocal(today, 14);
    const d6 = addDaysLocal(today, 42);
    const d12 = addDaysLocal(today, 84);

    const newPlan: CheckInPlan = {
      id: 'plan-' + Date.now(),
      startDate: formatLocalDateToYMD(today),
      concerns: answers.concerns,
      productNames: allPickedProducts.map((p) => p.name),
      firstActiveName: activeStrategy.firstActiveName,
      secondActiveName: activeStrategy.secondActiveName,
      basicsOnly: activeStrategy.basicsOnly,
      dueDates: {
        week2: formatLocalDateToYMD(d2),
        week6: formatLocalDateToYMD(d6),
        week12: formatLocalDateToYMD(d12),
      },
      completedCheckIns: [],
      isUnder18: answers.ageRange === 'under 18',
      ageRange: answers.ageRange,
    };

    onStartCheckInPlan(newPlan);
  };

  const handleSave = () => {
    onSaveToHistory({
      ageRange: answers.ageRange,
      skinTone: answers.skinTone,
      concerns: answers.concerns,
      productNames: allPickedProducts.map((p) => p.name),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200">
        {isDemoProfile && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold">
            <span>Demo profile, not a real person</span>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                Your Matched Profile
              </span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs text-stone-600 font-medium">Honest skincare picks</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Personalized Product Matches
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleStartCheckIn}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 transition-colors shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Start a check-in plan</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved in History' : 'Save Picks'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>

            <button
              onClick={onNewScan}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>

        {/* User answers recap */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs text-stone-700">
          <div>
            <span className="text-stone-400 block text-[11px]">Age Group</span>
            <strong className="text-stone-900 text-sm">{answers.ageRange}</strong>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">Skin Tone</span>
            <strong className="text-stone-900 text-sm capitalize">{answers.skinTone}</strong>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">Midday Feel</span>
            <strong className="text-stone-900 text-sm capitalize">{answers.middayFeel}</strong>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">Sensitivity</span>
            <strong className="text-stone-900 text-sm capitalize">{answers.sensitivity}</strong>
          </div>
        </div>
      </div>

      <FaceScanReport photoResult={photoResult} isDemoProfile={isDemoProfile} onRetake={onNewScan} />

      {/* Basics Only Notice if applicable */}
      {routineSchedule.basicsOnly && (
        <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-300 text-xs text-amber-950 space-y-1.5">
          <h3 className="font-bold text-sm text-amber-900">Gentle Basics Only Prescribed</h3>
          <p className="leading-relaxed">{routineSchedule.basicsReason}</p>
        </div>
      )}

      {/* Error notification for invalid compare */}
      {compareTypeError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 flex items-center justify-between shadow-2xs">
          <span>{compareTypeError}</span>
          <button
            onClick={() => setCompareTypeError(null)}
            className="text-stone-500 hover:text-stone-900 text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================= PRODUCT CARDS SECTIONS ================= */}
      <div className="space-y-8">
        <RoutineCostCard
          groups={[rankedCleansers, rankedMoisturizers, rankedSunscreens, rankedTreatments]}
          labels={['Cleanser', 'Moisturizer', 'Sunscreen', 'Treatment']}
        />

        {/* Cleansers */}
        {rankedCleansers.length > 0 && (
          <ProductGroupSection
            title="Cleansers"
            products={rankedCleansers}
            onSelectProduct={onSelectProductForReview}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
            savedWishlistIds={savedWishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        )}

        {/* Moisturizers */}
        {rankedMoisturizers.length > 0 && (
          <ProductGroupSection
            title="Moisturizers"
            products={rankedMoisturizers}
            onSelectProduct={onSelectProductForReview}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
            savedWishlistIds={savedWishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        )}

        {/* Sunscreens */}
        {rankedSunscreens.length > 0 && (
          <ProductGroupSection
            title="Sunscreens"
            products={rankedSunscreens}
            onSelectProduct={onSelectProductForReview}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
            savedWishlistIds={savedWishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        )}

        {/* Treatments */}
        {rankedTreatments.length > 0 && (
          <ProductGroupSection
            title="Targeted Treatment"
            subtitle={`Only one active: ${activeStrategy.firstActiveName || 'Single Active'}`}
            products={rankedTreatments}
            onSelectProduct={onSelectProductForReview}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
            savedWishlistIds={savedWishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        )}
      </div>

      {/* Matching & Pricing Disclaimers */}
      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-600 space-y-1">
        <p>
          <strong>Matching facts:</strong> Matches use the product name and listing numbers only.
          Ingredient lists are not checked, so read the label.
        </p>
        <p>
          Prices are a snapshot from Nykaa on the checked date and change often. These links earn
          us nothing.
        </p>
      </div>

      {/* ================= ROUTINE TIMELINE & SCHEDULE ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200 space-y-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
            Start Schedule
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
            How to Introduce Your Routine
          </h2>
          <p className="text-xs text-stone-600 mt-1">{routineSchedule.timelineNote}</p>
          {routineSchedule.deeperToneNote && (
            <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2">
              {routineSchedule.deeperToneNote}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="font-bold text-stone-900 block">Weeks 1 to 2</span>
            <p className="text-stone-600 leading-relaxed">{routineSchedule.schedule.phase1}</p>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="font-bold text-stone-900 block">Week 3</span>
            <p className="text-stone-600 leading-relaxed">{routineSchedule.schedule.phase2}</p>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="font-bold text-stone-900 block">Week 6 or Later</span>
            <p className="text-stone-600 leading-relaxed">{routineSchedule.schedule.phase3}</p>
          </div>
        </div>
      </div>

      {/* ================= SKIP THESE & WHEN TO SEE A DERMATOLOGIST ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skip these */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
          <h3 className="font-serif text-lg font-bold text-rose-950 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Skip These</span>
          </h3>
          <ul className="space-y-2 text-xs text-stone-700">
            {FIXED_SKIP_THESE.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-600 font-bold shrink-0">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* When to see a dermatologist */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
          <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-700" />
            <span>When to See a Dermatologist</span>
          </h3>
          <ul className="space-y-2 text-xs text-stone-700">
            {FIXED_SEE_DERMATOLOGIST_WHEN.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-700 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Floating Compare Action Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-4 max-w-lg w-[92%] sm:w-auto justify-between border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              Comparing {compareList.length}/3 {compareList[0].role}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCompareList([]);
                setCompareTypeError(null);
              }}
              className="text-xs text-stone-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Clear
            </button>
            <button
              disabled={compareList.length < 2}
              onClick={() => setIsCompareOpen(true)}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {compareList.length < 2 ? 'Pick 1 more' : `Compare (${compareList.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={compareList}
        onRemoveProduct={(id) => {
          const next = compareList.filter((p) => p.id !== id);
          setCompareList(next);
          if (next.length === 0) setIsCompareOpen(false);
        }}
      />

      {/* Small, quiet line at the bottom of the results screen */}
      <div className="text-center text-xs text-stone-500 py-3 border-t border-stone-200">
        Guidance, not medical advice.
      </div>
    </div>
  );
};

interface ProductGroupSectionProps {
  title: string;
  subtitle?: string;
  products: RankedProduct[];
  onSelectProduct: (p: RankedProduct) => void;
  compareList: RankedProduct[];
  onToggleCompare: (p: RankedProduct) => void;
  savedWishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
}

const ProductGroupSection: React.FC<ProductGroupSectionProps> = ({
  title,
  subtitle,
  products,
  onSelectProduct,
  compareList,
  onToggleCompare,
  savedWishlistIds,
  onToggleWishlist,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">{title}</h2>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const isCompared = compareList.some((item) => item.id === p.id);
          const isSavedInWishlist = savedWishlistIds.includes(p.id);

          return (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200 flex flex-col justify-between space-y-4 hover:border-stone-400 transition-colors"
            >
              <div className="space-y-3">
                {/* Product Card Top Bar: Compare checkbox & Save heart */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => onToggleCompare(p)}
                      className="rounded border-stone-300 accent-stone-900 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Compare</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(p.id)}
                    className="p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                    title={isSavedInWishlist ? 'Saved in wishlist' : 'Save to wishlist'}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isSavedInWishlist
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-stone-400 hover:text-rose-500'
                      }`}
                    />
                  </button>
                </div>

                {/* Product image from the Nykaa listing */}
                {p.image && (
                  <div className="w-full h-40 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
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

                {/* Product Card Header */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.dermReview && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Reviewed by {p.dermReview.reviewedBy}
                      </span>
                    )}
                    {p.flagLabels.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 leading-snug">
                    {p.name}
                  </h3>
                </div>

                {/* Price & Rating */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-stone-900">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="text-xs font-mono text-stone-400 line-through">
                        ₹{p.mrp}
                      </span>
                    )}
                    {p.isAboveBudget && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Above your budget
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    rated {p.rating} from {p.ratingCount.toLocaleString('en-IN')} ratings on {p.seller}, price checked {p.checkedAt}
                  </div>
                </div>

                {/* Matched On reasons */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-700 space-y-1">
                  <span className="font-bold text-stone-800 block text-[10px] uppercase tracking-wider">
                    Matched on:
                  </span>
                  <ul className="space-y-0.5 pl-3 list-disc text-stone-600">
                    {p.matchedOn.slice(0, 3).map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
                {p.communityNotes && p.communityNotes.length > 0 && (
                  <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-200 text-[11px] text-stone-700 space-y-1">
                    <span className="font-bold text-violet-900 block text-[10px] uppercase tracking-wider">
                      What Reddit users said
                    </span>
                    {p.communityNotes.map((c, idx) => (
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
                <CheaperAlternative product={p} />
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => onSelectProduct(p)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  What reviewers say
                </button>

                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View on Nykaa and read the reviews</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FACE_SCAN_TYPE_LABELS: Record<string, string> = {
  active_pimples: 'Active pimples',
  red_marks: 'Red marks',
  brown_marks: 'Brown marks',
  closed_comedones_or_bumps: 'Clogged pores or small bumps',
  oily_shine: 'Oily shine',
  dryness_flaking: 'Dryness or flaking',
  dark_circles: 'Dark circles',
  diffuse_redness: 'Spread-out redness',
  other: 'Other visible concern',
};

// Fixed, rule-based guidance for each kind of finding. Not written by the AI.
const FACE_SCAN_NEEDS: Record<string, string> = {
  active_pimples:
    'Gentle cleansing, no picking or scrubbing. Painful, deep or spreading pimples need a dermatologist.',
  red_marks:
    'Daily sunscreen and patience. Red marks fade slowly, and one gentle active at a time is enough.',
  brown_marks:
    'Daily sunscreen matters most. Then one active at a time, such as azelaic acid or alpha arbutin, and give it weeks, not days.',
  closed_comedones_or_bumps:
    'A gentle cleanser, and a salicylic acid cleanser can help. Do not scrub.',
  oily_shine: 'A light gel moisturizer and an oil-free sunscreen.',
  dryness_flaking: 'A barrier-friendly moisturizer, and avoid harsh or foaming cleansers.',
  dark_circles:
    'Sleep and daily sunscreen help. Our product picks do not target dark circles.',
  diffuse_redness:
    'Be gentle and patch test everything. Redness that is widespread or does not settle should be checked by a doctor.',
  other: 'If you are unsure what this is, ask a dermatologist.',
};

const FACE_SCAN_QUALITY_LABELS: Record<string, string> = {
  too_dark: 'The photo is too dark',
  too_bright: 'The photo is too bright',
  blurry: 'The photo is blurry',
  no_face: 'No face was found',
  multiple_faces: 'More than one face is in the photo',
  heavy_makeup_or_filter: 'Makeup or a filter is covering the skin',
  face_partly_covered: 'Part of the face is covered',
  low_resolution: 'The photo could not be read clearly',
};

const FACE_SCAN_SEVERITY_RANK: Record<string, number> = { marked: 3, moderate: 2, mild: 1, none: 0 };

const FACE_SCAN_OVERVIEW_LABELS: [string, string][] = [
  ['oiliness', 'Oiliness'],
  ['texture', 'Texture'],
  ['redness', 'Redness'],
  ['pigmentation', 'Dark or brown marks'],
  ['pore_visibility', 'Visible pores'],
  ['under_eye_darkness', 'Under-eye darkness'],
  ['visible_pimples', 'Visible pimples'],
  ['visible_marks', 'Visible marks'],
];

const FACE_SCAN_ZONE_LABELS: Record<string, string> = {
  forehead: 'Forehead',
  left_cheek: 'Left cheek',
  right_cheek: 'Right cheek',
  nose: 'Nose',
  chin: 'Chin',
  under_eye: 'Under eyes',
  around_mouth: 'Around mouth',
};

const FACE_SCAN_ZONE_STYLES: Record<string, string> = {
  clear: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  mild: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  moderate: 'bg-amber-100 text-amber-900 border-amber-300',
  marked: 'bg-rose-100 text-rose-900 border-rose-300',
};

const FACE_SCAN_SEVERITY_STYLES: Record<string, string> = {
  none: 'bg-stone-100 text-stone-700 border-stone-200',
  mild: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  moderate: 'bg-amber-100 text-amber-900 border-amber-300',
  marked: 'bg-rose-100 text-rose-900 border-rose-300',
};

interface FaceScanReportProps {
  photoResult: PhotoAnalysisResult | null;
  isDemoProfile: boolean;
  onRetake: () => void;
}

export const FaceScanReport: React.FC<FaceScanReportProps> = ({ photoResult, isDemoProfile, onRetake }) => {
  if (!photoResult) {
    return (
      <div className="p-5 rounded-3xl bg-white border border-stone-200 text-xs text-stone-600">
        <h3 className="font-serif text-base font-bold text-stone-900 mb-1">Your face scan</h3>
        <p>
          You did not add a photo, so these picks come from your quiz answers only. To get a scan, retake the quiz
          and add a photo on the second step. Photo scanning is not available under 18.
        </p>
      </div>
    );
  }

  if (!photoResult.image_ok || photoResult.confidence === 'low') {
    return (
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
        <h3 className="font-serif text-base font-bold text-amber-900">We could not read your photo clearly</h3>
        {photoResult.quality_issues.length > 0 && (
          <ul className="list-disc pl-5">
            {photoResult.quality_issues.map((q) => (
              <li key={q}>{FACE_SCAN_QUALITY_LABELS[q] || q}</li>
            ))}
          </ul>
        )}
        <p>
          Try again in daylight, with no makeup or filter, facing the camera. If this keeps happening, the scan
          service may be unavailable for now. Your picks below come from your quiz answers only.
        </p>
        <button
          onClick={onRetake}
          className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-semibold cursor-pointer"
        >
          Retake with a new photo
        </button>
      </div>
    );
  }

  const used = photoResult.findings
    .filter((f) => f.enabled !== false && f.severity !== 'none')
    .sort((a, b) => (FACE_SCAN_SEVERITY_RANK[b.severity] || 0) - (FACE_SCAN_SEVERITY_RANK[a.severity] || 0));
  const types = Array.from(new Set(used.map((f) => f.type)));

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 space-y-4">
      {isDemoProfile && (
        <div className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded px-2 py-0.5 inline-block">
          Fake photo result (Demo profile, not a real person)
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900">Your face scan</h3>
          <p className="text-[11px] text-stone-500">AI description, not a diagnosis. It may be wrong.</p>
        </div>
        <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded shrink-0">
          Confidence: {photoResult.confidence}
        </span>
      </div>

      {photoResult.summary && (
        <p className="text-sm text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
          {photoResult.summary}
        </p>
      )}

      {photoResult.overview && (
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-600 mb-2">Skin overview</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FACE_SCAN_OVERVIEW_LABELS.map(([key, label]) => {
              const value = (photoResult.overview as unknown as Record<string, string>)[key] || 'unclear';
              return (
                <div key={key} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                  <span className="block text-[11px] text-stone-500">{label}</span>
                  <strong className="text-sm text-stone-900 capitalize">{value.replace(/_/g, ' ')}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {photoResult.zone_map && photoResult.zone_map.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-600 mb-2">Face map</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {photoResult.zone_map.map((z) => (
              <li
                key={z.zone}
                className="flex flex-wrap items-center gap-2 text-sm text-stone-800 border border-stone-100 rounded-xl px-3 py-2"
              >
                <span className="font-semibold">{FACE_SCAN_ZONE_LABELS[z.zone] || z.zone}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    FACE_SCAN_ZONE_STYLES[z.level] || FACE_SCAN_ZONE_STYLES.clear
                  }`}
                >
                  {z.level}
                </span>
                {z.note && <span className="w-full text-xs text-stone-600">{z.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-600 mb-2">What we can see, biggest first</h4>
        {used.length === 0 ? (
          <p className="text-sm text-stone-600">
            The scan did not pick up any visible concerns. That does not mean your skin has none, because cameras
            miss things. Your picks come from your quiz answers.
          </p>
        ) : (
          <ul className="space-y-2">
            {used.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-2 text-sm text-stone-800 border border-stone-100 rounded-xl px-3 py-2"
              >
                <span className="font-semibold">{FACE_SCAN_TYPE_LABELS[f.type] || f.type}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    FACE_SCAN_SEVERITY_STYLES[f.severity] || FACE_SCAN_SEVERITY_STYLES.none
                  }`}
                >
                  {f.severity}
                </span>
                {f.zones.length > 0 && (
                  <span className="text-xs text-stone-500">{f.zones.join(', ').replace(/_/g, ' ')}</span>
                )}
                {f.note && <span className="w-full text-xs text-stone-600">{f.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {types.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-600 mb-2">What your skin needs</h4>
          <ul className="space-y-2 text-sm text-stone-700">
            {types.map((t) => (
              <li key={t}>
                <span className="font-semibold text-stone-900">{FACE_SCAN_TYPE_LABELS[t] || t}: </span>
                {FACE_SCAN_NEEDS[t] || FACE_SCAN_NEEDS.other}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-stone-500">
        Cameras can misread marks, especially in poor light or on deeper skin tones. Products below use only the
        findings you kept on the photo step.
      </p>
    </div>
  );
};

// ---------- Routine cost, sharing, 6-week reminder and cheaper alternatives ----------

const APP_SHARE_URL = 'https://no-cap-skincare.vercel.app';

function findCheaperAlternative(p: RankedProduct): AltCatalogProduct | null {
  const tagKeys = ['oily', 'dry', 'sensitive', 'acne', 'noWhiteCast'] as const;
  const pool = (altCatalogData as AltCatalogProduct[]).filter(
    (c) =>
      c.id !== p.id &&
      c.role === p.role &&
      c.activeKey === p.activeKey &&
      c.price < p.price &&
      c.rating >= 4.0 &&
      c.ratingCount >= 500 &&
      (p.role !== 'sunscreen' || (c.spf !== null && c.spf >= 30)) &&
      (!c.flags.includes('high_strength') || p.flags.includes('high_strength')) &&
      (!p.tags.noWhiteCast || c.tags.noWhiteCast)
  );
  if (pool.length === 0) return null;
  const overlap = (c: AltCatalogProduct) => tagKeys.filter((k) => p.tags[k] && c.tags[k]).length;
  pool.sort((a, b) => overlap(b) - overlap(a) || b.rating - a.rating || a.price - b.price);
  const pick = pool[0];
  // Only suggest it when it is meaningfully cheaper.
  return p.price - pick.price >= 30 ? pick : null;
}

const CheaperAlternative: React.FC<{ product: RankedProduct }> = ({ product }) => {
  const alt = findCheaperAlternative(product);
  if (!alt) return null;
  return (
    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-stone-700 space-y-0.5">
      <span className="font-bold text-emerald-900 block text-[10px] uppercase tracking-wider">
        Similar and cheaper
      </span>
      <a
        href={alt.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline underline-offset-2 hover:text-stone-900"
      >
        {alt.name}
      </a>
      <span className="block">
        ₹{alt.price}, which is ₹{product.price - alt.price} less. Rated {alt.rating} from{' '}
        {alt.ratingCount.toLocaleString('en-IN')} ratings. Same type, but ingredients are not compared, so read
        the label.
      </span>
    </div>
  );
};

type PickProduct = Pick<AltCatalogProduct, 'id' | 'name' | 'price' | 'image' | 'rating' | 'ratingCount' | 'url'>;

function buildShareText(picks: PickProduct[]): string {
  const total = picks.reduce((sum, p) => sum + p.price, 0);
  const lines = picks.map((p) => `\u2022 ${p.name} (\u20b9${p.price})`);
  return (
    'My No Cap skincare picks:\n' +
    lines.join('\n') +
    `\n\nTotal: \u20b9${total.toLocaleString('en-IN')}\nGuidance, not medical advice. Find yours: ${APP_SHARE_URL}`
  );
}

// More products of the same kind as the lead pick, so the person can choose a different one.
function moreOptionsFor(group: RankedProduct[]): AltCatalogProduct[] {
  const lead = group[0];
  if (!lead) return [];
  const shown = new Set(group.map((p) => p.id));
  const tagKeys = ['oily', 'dry', 'sensitive', 'acne', 'noWhiteCast'] as const;
  const overlap = (c: AltCatalogProduct) => tagKeys.filter((k) => lead.tags[k] && c.tags[k]).length;
  return (altCatalogData as AltCatalogProduct[])
    .filter(
      (c) =>
        !shown.has(c.id) &&
        c.role === lead.role &&
        c.activeKey === lead.activeKey &&
        c.rating >= 4.0 &&
        c.ratingCount >= 500 &&
        (lead.role !== 'sunscreen' || (c.spf !== null && c.spf >= 30)) &&
        (!c.flags.includes('high_strength') || lead.flags.includes('high_strength')) &&
        (!lead.tags.noWhiteCast || c.tags.noWhiteCast)
    )
    .sort((a, b) => overlap(b) - overlap(a) || b.rating - a.rating || a.price - b.price)
    .slice(0, 5);
}

function downloadSixWeekReminder() {
  const start = addDaysLocal(new Date(), 42);
  const end = addDaysLocal(start, 1);
  const ymd = (d: Date) => formatLocalDateToYMD(d).replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//No Cap//Six week reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:nocap-6week-${stamp}@nocap`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(start)}`,
    `DTEND;VALUE=DATE:${ymd(end)}`,
    'SUMMARY:No Cap\\, 6 week skin check',
    'DESCRIPTION:Look at your skin in daylight and compare it with how it looked at the start. Marks usually fade over months\\, so be patient. Keep to one active at a time.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'no-cap-6-week-check.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const RoutineCostCard: React.FC<{ groups: RankedProduct[][]; labels: string[] }> = ({ groups, labels }) => {
  const [copied, setCopied] = useState(false);
  // For each type, the id of the product the person chose instead of the first match.
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const filledIdx = groups.map((g, i) => (g.length > 0 ? i : -1)).filter((i) => i >= 0);
  if (filledIdx.length === 0) return null;

  const pickFor = (i: number): PickProduct => {
    const all: PickProduct[] = [...groups[i], ...moreOptionsFor(groups[i])];
    return all.find((p) => p.id === chosen[i]) || groups[i][0];
  };
  const picks = filledIdx.map(pickFor);
  const total = picks.reduce((sum, p) => sum + p.price, 0);
  const cheapestTotal = filledIdx.reduce((sum, i) => sum + Math.min(...groups[i].map((p) => p.price)), 0);
  const saving = total - cheapestTotal;
  const shareText = buildShareText(picks);

  const shareOnWhatsApp = () => {
    // On phones, the native share sheet keeps this page open. Some in-app browsers
    // lose the page when it jumps straight to WhatsApp.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({ text: shareText }).catch(() => {
        /* closed without sharing */
      });
      return;
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank', 'noopener,noreferrer');
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Your picks and what they cost</h3>
          <p className="text-[11px] text-stone-500">
            We start with your best match for each type. You can choose another one. Prices are a snapshot and
            change often.
          </p>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-bold font-mono text-stone-900">
            {'\u20b9'}{total.toLocaleString('en-IN')}
          </span>
          {saving > 0 && (
            <span className="block text-xs text-emerald-800 font-semibold">
              Cheapest mix from your top matches: {'\u20b9'}{cheapestTotal.toLocaleString('en-IN')} (save {'\u20b9'}
              {saving.toLocaleString('en-IN')})
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3">
        {filledIdx.map((i, n) => {
          const pick = picks[n];
          const more = moreOptionsFor(groups[i]);
          return (
            <li key={labels[i]} className="rounded-xl border border-stone-100 px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-3">
                {pick.image && (
                  <img
                    src={pick.image}
                    alt={pick.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain rounded-lg bg-stone-50 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-stone-500">
                    {labels[i]}
                  </span>
                  <a
                    href={pick.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-semibold text-stone-900 leading-snug underline-offset-2 hover:underline"
                  >
                    {pick.name}
                  </a>
                  <span className="block text-[11px] text-stone-500">
                    Rated {pick.rating} from {pick.ratingCount.toLocaleString('en-IN')} ratings
                  </span>
                </div>
                <span className="text-sm font-bold font-mono text-stone-900 shrink-0">{'\u20b9'}{pick.price}</span>
              </div>
              <label className="block">
                <span className="block text-[11px] text-stone-500 mb-1">Choose another {labels[i].toLowerCase()}</span>
                <select
                  value={pick.id}
                  onChange={(e) => setChosen((prev) => ({ ...prev, [i]: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-800"
                >
                  <optgroup label="Your top matches">
                    {groups[i].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({'\u20b9'}{p.price}, rated {p.rating})
                      </option>
                    ))}
                  </optgroup>
                  {more.length > 0 && (
                    <optgroup label="More options of the same kind">
                      {more.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({'\u20b9'}{p.price}, rated {p.rating})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-stone-500">
        The extra options are ranked by how closely they match your top pick, not by your answers. Ingredients are
        not compared, so read the label. See reviews and links for your top matches in the sections below.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-stone-100">
        <button
          type="button"
          onClick={shareOnWhatsApp}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
        >
          Share my picks
        </button>
        <button
          type="button"
          onClick={copyText}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-300 transition-colors cursor-pointer"
        >
          {copied ? 'Copied' : 'Copy as text'}
        </button>
        <button
          type="button"
          onClick={downloadSixWeekReminder}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-300 transition-colors cursor-pointer"
        >
          Remind me in 6 weeks
        </button>
      </div>
      <p className="text-[11px] text-stone-500">
        Sharing sends only product names and prices. Your photo and answers are never shared. The reminder is a
        calendar file from your own device.
      </p>
    </div>
  );
};
