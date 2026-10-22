import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SkinScannerInput } from './components/SkinScannerInput';
import { CameraModal } from './components/CameraModal';
import { AnalysisDashboard } from './components/AnalysisDashboard';
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
  const [activeTab, setActiveTab] = useState<'scanner' | 'checkins' | 'saved' | 'shelf' | 'history' | 'guide'>('scanner');
  const [userAnswers, setUserAnswers] = useState<UserQuizAnswers | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
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
        {activeTab === 'shelf' ? (
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
            Guidance, not medical advice. Our rules and picks have not yet been reviewed by a dermatologist.
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
