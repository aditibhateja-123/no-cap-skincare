import React, { useState, useMemo } from 'react';
import {
  Layers,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Check,
  Sun,
  Moon,
  PauseCircle,
  ShieldAlert,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  CatalogProduct,
  ShelfCheckboxKey,
  ShelfState,
  UserQuizAnswers,
} from '../types';
import catalogData from '../data/catalog.json';
import {
  evaluateShelf,
} from '../utils/skincareRules';

const catalog = catalogData as CatalogProduct[];

interface MyShelfViewProps {
  shelf: ShelfState;
  onUpdateShelf: (updated: ShelfState) => void;
  onClearShelf: () => void;
  userAnswers?: UserQuizAnswers | null;
}

const SOMETHING_ELSE_OPTIONS: { key: ShelfCheckboxKey; label: string }[] = [
  { key: 'retinoid', label: 'Retinol or retinoid' },
  { key: 'rx_cream', label: 'Prescription cream from a doctor' },
  { key: 'aha', label: 'AHA (glycolic, lactic, mandelic)' },
  { key: 'bha', label: 'BHA (salicylic acid)' },
  { key: 'bpo', label: 'Benzoyl peroxide' },
  { key: 'vit_c', label: 'Vitamin C' },
  { key: 'azelaic', label: 'Azelaic acid' },
  { key: 'niacinamide', label: 'Niacinamide' },
  { key: 'arbutin', label: 'Alpha arbutin' },
  { key: 'scrub', label: 'Physical scrub' },
  { key: 'extra_cleanser', label: 'Another cleanser' },
  { key: 'extra_sunscreen', label: 'Another sunscreen' },
];

export const MyShelfView: React.FC<MyShelfViewProps> = ({
  shelf,
  onUpdateShelf,
  onClearShelf,
  userAnswers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<
    'all' | 'cleanser' | 'moisturizer' | 'sunscreen' | 'treatment'
  >('all');
  const [manualSpecialSituation, setManualSpecialSituation] = useState(false);

  // Determine if user has a special situation (under 18, pregnant/breastfeeding, prescribed treatment)
  const hasSpecialSituation = useMemo(() => {
    if (manualSpecialSituation) return true;
    if (!userAnswers) return false;
    const isUnder18 = userAnswers.ageRange === 'under 18';
    const isPregnant = userAnswers.healthSituations?.includes('pregnant or breastfeeding');
    const isPrescribed = userAnswers.healthSituations?.includes('on a prescribed skin treatment');
    return Boolean(isUnder18 || isPregnant || isPrescribed);
  }, [userAnswers, manualSpecialSituation]);

  // Catalog products on shelf
  const shelfProducts = useMemo(() => {
    return shelf.productIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is CatalogProduct => Boolean(p));
  }, [shelf.productIds]);

  // Filtered catalog for picker
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((product) => {
      if (activeCatalogTab !== 'all' && product.role !== activeCatalogTab) {
        return false;
      }
      if (!q) return true;
      const matchName = product.name.toLowerCase().includes(q);
      const matchRole = product.role.toLowerCase().includes(q);
      return matchName || matchRole;
    });
  }, [searchQuery, activeCatalogTab]);

  // Toggle catalog product
  const handleToggleProduct = (productId: string) => {
    const exists = shelf.productIds.includes(productId);
    const updatedIds = exists
      ? shelf.productIds.filter((id) => id !== productId)
      : [...shelf.productIds, productId];

    onUpdateShelf({
      ...shelf,
      productIds: updatedIds,
    });
  };

  // Toggle checkbox
  const handleToggleCheckbox = (key: ShelfCheckboxKey) => {
    const exists = shelf.checkboxKeys.includes(key);
    const updatedKeys = exists
      ? shelf.checkboxKeys.filter((k) => k !== key)
      : [...shelf.checkboxKeys, key];

    onUpdateShelf({
      ...shelf,
      checkboxKeys: updatedKeys,
    });
  };

  // Evaluate shelf
  const evaluation = useMemo(() => {
    return evaluateShelf({
      products: shelfProducts,
      checkboxKeys: shelf.checkboxKeys,
    });
  }, [shelfProducts, shelf.checkboxKeys]);

  const totalShelfCount = shelf.productIds.length + shelf.checkboxKeys.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Warning Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
          If any product is burning, swelling or giving you a rash, stop it and see a doctor.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e7ded4]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-stone-900 text-amber-200">
              <Layers className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              My Shelf
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
              Routine Check
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600">
            Tell us which products you already own. We check for clashing combinations, duplicates, and show a simple way to arrange them.
          </p>
        </div>

        {totalShelfCount > 0 && (
          <button
            onClick={onClearShelf}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear my shelf</span>
          </button>
        )}
      </div>

      {/* Special Situation Notice if Applicable */}
      {hasSpecialSituation && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm text-blue-900 font-medium">
              Because of your situation, check any change to your routine with a doctor first.
            </p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Developing teenage skin, pregnancy, breastfeeding, or prescription skin treatments require caution with active ingredients.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Left Column for Picking, Right Column for Shelf & Routine Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Picker (Catalog + Something Else) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Section 1: Catalog Picker */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                Pick products from our catalog
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Select items you own. We never ask for or accept typed product names.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: 'All types' },
                  { id: 'cleanser', label: 'Cleansers' },
                  { id: 'moisturizer', label: 'Moisturizers' },
                  { id: 'sunscreen', label: 'Sunscreens' },
                  { id: 'treatment', label: 'Treatments' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCatalogTab(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeCatalogTab === tab.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Catalog List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 border border-stone-100 rounded-xl p-2 bg-stone-50/50">
              {filteredCatalog.length === 0 ? (
                <p className="text-center py-6 text-xs text-stone-500">
                  No matching catalog products found.
                </p>
              ) : (
                filteredCatalog.map((product) => {
                  const isSelected = shelf.productIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                              product.role === 'cleanser'
                                ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                : product.role === 'moisturizer'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : product.role === 'sunscreen'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {product.role}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-stone-800 mt-1 line-clamp-2">
                          {product.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`shrink-0 p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isSelected
                            ? 'bg-stone-900 text-amber-200'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">On shelf</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Something Else I Use */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                Something else I use
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Check any other ingredients or products you currently use from outside our catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {SOMETHING_ELSE_OPTIONS.map((opt) => {
                const isChecked = shelf.checkboxKeys.includes(opt.key);
                return (
                  <label
                    key={opt.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer select-none ${
                      isChecked
                        ? 'bg-amber-50 border-amber-300 text-stone-900'
                        : 'bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCheckbox(opt.key)}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 accent-stone-900 h-4 w-4"
                    />
                    <span className="leading-snug">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Quick toggle for users without scanner data */}
          {!userAnswers && (
            <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center justify-between gap-3">
              <span className="text-[11px]">
                Under 18, pregnant, breastfeeding, or on prescription skin treatments?
              </span>
              <button
                type="button"
                onClick={() => setManualSpecialSituation(!manualSpecialSituation)}
                className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                  manualSpecialSituation
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                }`}
              >
                {manualSpecialSituation ? 'Flagged' : 'Flag situation'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: What is on your shelf + Evaluation & Routine */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Shelf Items List */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                  What is on your shelf
                </h2>
                <p className="text-xs text-stone-500">
                  {totalShelfCount} item{totalShelfCount === 1 ? '' : 's'} on this device
                </p>
              </div>
            </div>

            {totalShelfCount === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium text-stone-700">
                  Your shelf is empty
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Pick the products you own from the catalog or check what you use on the left. We will check your routine immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {/* Catalog items */}
                {shelfProducts.map((p) => {
                  const hasExtraActiveFlag = p.flags?.includes('may_contain_extra_active');
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                            {p.role}
                          </span>
                          {p.activeKey && (
                            <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                              Active: {p.activeKey}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-stone-900 mt-1 line-clamp-2">
                          {p.name}
                        </p>
                        {hasExtraActiveFlag && (
                          <p className="text-[11px] text-amber-800 font-medium mt-1 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            May contain a second active, check the label
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleProduct(p.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove from shelf"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Checked items */}
                {shelf.checkboxKeys.map((key) => {
                  const option = SOMETHING_ELSE_OPTIONS.find((o) => o.key === key);
                  if (!option) return null;
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-lg border border-stone-200 bg-amber-50/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                          External item
                        </span>
                        <p className="font-medium text-stone-900 mt-1">
                          {option.label}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleCheckbox(key)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove from shelf"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Routine Evaluation Result */}
          {totalShelfCount > 0 && (
            <div className="space-y-6">
              {/* Doctor Only Screen (Rule A) */}
              {evaluation.isDoctorOnly ? (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-serif font-bold text-rose-950 text-base sm:text-lg">
                        Prescription Treatment in Use
                      </h3>
                      <p className="text-xs sm:text-sm text-rose-900 font-semibold mt-1">
                        {evaluation.rules[0]}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-rose-800 leading-relaxed">
                    Doctor-prescribed topical medications have strong therapeutic potencies and strict usage instructions. Combining OTC actives with prescription creams can lead to chemical irritation, contact dermatitis, or neutralize the medical treatment.
                  </div>
                  <p className="text-[11px] text-stone-500 italic text-center">
                    These are general guidelines, not medical advice.
                  </p>
                </div>
              ) : (
                <>
                  {/* Applied Rules Section */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                        Routine check results
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {evaluation.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                            rule.includes('Nothing on your shelf clashes')
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50/80 border-amber-200 text-amber-950'
                          }`}
                        >
                          <Info
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              rule.includes('Nothing on your shelf clashes')
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          />
                          <span className="font-medium">{rule}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-stone-500 pt-1 text-center">
                      These are general guidelines, not medical advice.
                    </p>
                  </div>

                  {/* Routine Arrangement Table */}
                  {evaluation.routine && (
                    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-5">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                          A simple way to arrange what you have
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Arranged strictly using items on your shelf. We never recommend buying anything here.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Morning Routine Card */}
                        <div className="p-4 rounded-xl border border-amber-200/70 bg-[#faf8f5] space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                            <Sun className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                              Morning Routine
                            </h4>
                          </div>

                          {evaluation.routine.morning.length === 0 ? (
                            <p className="text-xs text-stone-500 italic py-2">
                              No morning basics on shelf.
                            </p>
                          ) : (
                            <ol className="space-y-2 text-xs text-stone-800">
                              {evaluation.routine.morning.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-4 h-4 rounded-full bg-amber-200 text-stone-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>

                        {/* Night Routine Card */}
                        <div className="p-4 rounded-xl border border-indigo-200/70 bg-[#faf8f5] space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-indigo-200/60">
                            <Moon className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                              Night Routine
                            </h4>
                          </div>

                          <div className="space-y-2.5 text-xs text-stone-800">
                            {evaluation.routine.night.cleanser && (
                              <div className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  1
                                </span>
                                <span className="font-medium leading-relaxed">
                                  {evaluation.routine.night.cleanser}
                                </span>
                              </div>
                            )}

                            {/* Active treatment schedule at night (at most one active per night) */}
                            {evaluation.routine.night.treatmentSchedule.length > 0 && (
                              <div className="pl-6 space-y-1.5 py-1">
                                <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wide">
                                  Step 2: Active Treatment (at most one per night)
                                </div>
                                {evaluation.routine.night.treatmentSchedule.map((sched, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg bg-white border border-stone-200 text-[11px] flex items-start justify-between gap-2"
                                  >
                                    <span className="font-semibold text-stone-700 shrink-0">
                                      {sched.dayPattern}:
                                    </span>
                                    <span className="text-stone-900 font-medium text-right">
                                      {sched.activeName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {evaluation.routine.night.moisturizer && (
                              <div className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  3
                                </span>
                                <span className="font-medium leading-relaxed">
                                  {evaluation.routine.night.moisturizer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Paused Items Section */}
                      {evaluation.routine.pausedItems.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 space-y-2">
                          <div className="flex items-center gap-1.5 text-stone-800 font-bold text-xs">
                            <PauseCircle className="w-4 h-4 text-stone-600" />
                            <span>Pause for now:</span>
                          </div>
                          <ul className="list-disc list-inside text-xs text-stone-700 space-y-1 pl-1">
                            {evaluation.routine.pausedItems.map((item, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span className="font-medium">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Bottom Note */}
                      <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-center font-medium">
                        Add one new product at a time, and patch test it first.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
