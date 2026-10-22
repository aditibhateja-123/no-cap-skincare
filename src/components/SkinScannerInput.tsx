import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  UserQuizAnswers,
  Role,
  AgeRange,
  SkinTone,
  Concern,
  MiddayFeel,
  BreakoutLevel,
  MarksDuration,
  Sensitivity,
  HealthSituation,
  Budget,
  PhotoAnalysisResult,
  PhotoFinding,
} from '../types';
import { PRESET_PROFILES, PresetSample } from '../data/presets';
import { resizeImageToJpeg, analyzePhoto } from '../services/api';

interface SkinScannerInputProps {
  onComplete: (
    answers: UserQuizAnswers,
    photoResult: PhotoAnalysisResult | null,
    isDemoProfile?: boolean
  ) => void;
  onOpenLiveCamera: () => void;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
}

const ROLES_OPTIONS: { id: Role; label: string; desc: string }[] = [
  { id: 'cleanser', label: 'Cleanser', desc: 'Face wash to remove sebum & dirt' },
  { id: 'moisturizer', label: 'Moisturizer', desc: 'Daily hydration & barrier support' },
  { id: 'sunscreen', label: 'Sunscreen', desc: 'Daily UV defense against mark darkening' },
  { id: 'treatment', label: 'Treatment for marks or acne', desc: 'Targeted single active serum' },
];

const AGE_RANGES: { id: AgeRange; label: string; note: string }[] = [
  { id: 'under 18', label: 'Under 18', note: 'Basics only; no active serums or photo scan' },
  { id: '18 to 24', label: '18 to 24', note: 'Focus on breakout control & post-acne marks' },
  { id: '25 to 34', label: '25 to 34', note: 'Early mark fading & barrier stability' },
  { id: '35 or older', label: '35 or older', note: 'Gentle renewal & persistent pigment' },
];

const SKIN_TONES: { id: SkinTone; label: string; color: string; desc: string }[] = [
  { id: 'very fair', label: 'Very Fair', color: '#fbf0e8', desc: 'Burns easily in sun' },
  { id: 'fair', label: 'Fair', color: '#f5ddcc', desc: 'Burns easily, minimal tan' },
  { id: 'wheatish', label: 'Wheatish', color: '#deb898', desc: 'Tans gradually, prone to dark spots' },
  { id: 'medium brown', label: 'Medium Brown', color: '#b9835a', desc: 'High melanin, slow-fading marks' },
  { id: 'deep brown', label: 'Deep Brown', color: '#684025', desc: 'Needs zero white cast sunscreens' },
];

const CONCERNS_LIST: { id: Concern; label: string }[] = [
  { id: 'acne', label: 'Acne & active breakouts' },
  { id: 'red marks', label: 'Red marks (post-breakout)' },
  { id: 'brown marks', label: 'Brown marks & dark spots' },
  { id: 'clogged pores', label: 'Clogged pores & blackheads' },
  { id: 'oil and shine', label: 'Excess oil and midday shine' },
  { id: 'tight or dehydrated skin', label: 'Tight or dehydrated skin' },
];

const MIDDAY_FEELS: { id: MiddayFeel; label: string; desc: string }[] = [
  { id: 'oily', label: 'Oily', desc: 'Shiny all over face' },
  { id: 'combination', label: 'Combination', desc: 'Oily T-zone, normal cheeks' },
  { id: 'oily but tight', label: 'Oily but tight', desc: 'Surface shine with inner tightness' },
  { id: 'normal', label: 'Normal', desc: 'Comfortable, neither dry nor greasy' },
  { id: 'dry', label: 'Dry', desc: 'Flaky, parched or rough' },
];

const BREAKOUT_LEVELS: { id: BreakoutLevel; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'No active pimples' },
  { id: 'mild', label: 'Mild', desc: 'Occasional surface whitehead or blackhead' },
  { id: 'moderate', label: 'Moderate', desc: 'Frequent red bumps or small pustules' },
  { id: 'deep and painful', label: 'Deep and painful', desc: 'Swollen, throbbing lumps (cysts/nodules)' },
];

const MARKS_DURATIONS: { id: MarksDuration; label: string }[] = [
  { id: 'none', label: 'No marks' },
  { id: 'under 3 months', label: 'Under 3 months' },
  { id: '3 to 12 months', label: '3 to 12 months' },
  { id: 'over a year', label: 'Over a year' },
];

const SENSITIVITIES: { id: Sensitivity; label: string; desc: string }[] = [
  { id: 'never', label: 'Never', desc: 'Tolerates most skincare comfortably' },
  { id: 'sometimes', label: 'Sometimes', desc: 'Occasional stinging with new actives' },
  { id: 'often', label: 'Often', desc: 'Easily turns red, burns or reacts' },
];

const HEALTH_OPTIONS: { id: HealthSituation; label: string }[] = [
  { id: 'pregnant or breastfeeding', label: 'Pregnant or breastfeeding' },
  { id: 'on a prescribed skin treatment', label: 'On a doctor-prescribed skin treatment' },
  { id: 'told by a doctor I have melasma', label: 'Told by a doctor I have melasma' },
];

const BUDGET_OPTIONS: { id: Budget; label: string; capDesc: string }[] = [
  { id: 'under ₹300', label: 'Under ₹300', capDesc: 'Value-conscious essentials' },
  { id: '₹300 to 600', label: '₹300 to 600', capDesc: 'Balanced mid-range' },
  { id: 'over ₹600', label: 'Over ₹600', capDesc: 'Premium formulations' },
];

export const SkinScannerInput: React.FC<SkinScannerInputProps> = ({
  onComplete,
  onOpenLiveCamera,
  capturedImage,
  setCapturedImage,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [lookingFor, setLookingFor] = useState<Role[]>([]);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [skinTone, setSkinTone] = useState<SkinTone | null>(null);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [middayFeel, setMiddayFeel] = useState<MiddayFeel | null>(null);
  const [breakoutLevel, setBreakoutLevel] = useState<BreakoutLevel | null>(null);
  const [marksDuration, setMarksDuration] = useState<MarksDuration | null>(null);
  const [sensitivity, setSensitivity] = useState<Sensitivity | null>(null);
  const [healthSituations, setHealthSituations] = useState<HealthSituation[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);

  // Photo analysis states
  const [consentChecked, setConsentChecked] = useState(false);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDemoProfile, setIsDemoProfile] = useState(false);
  // The last photo that was sent for scanning, so each photo is scanned only once.
  const scannedImageRef = useRef<string | null>(null);

  const isUnder18 = ageRange === 'under 18';

  const missingAnswers: string[] = [];
  if (lookingFor.length === 0) missingAnswers.push('what you are looking for');
  if (!ageRange) missingAnswers.push('age range');
  if (!skinTone) missingAnswers.push('skin tone');
  if (concerns.length === 0) missingAnswers.push('concerns');
  if (!middayFeel) missingAnswers.push('how skin feels by midday');
  if (!breakoutLevel) missingAnswers.push('breakouts');
  if (!marksDuration) missingAnswers.push('how long marks have been there');
  if (!sensitivity) missingAnswers.push('stinging or redness');
  if (!budget) missingAnswers.push('budget');
  const quizComplete = missingAnswers.length === 0;

  const toggleLookingFor = (r: Role) => {
    setLookingFor((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const toggleConcern = (c: Concern) => {
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const toggleHealth = (h: HealthSituation) => {
    setHealthSituations((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h]
    );
  };

  const handleSelectPreset = (preset: PresetSample) => {
    setIsDemoProfile(true);
    setLookingFor(preset.answers.lookingFor);
    setAgeRange(preset.answers.ageRange);
    setSkinTone(preset.answers.skinTone);
    setConcerns(preset.answers.concerns);
    setMiddayFeel(preset.answers.middayFeel);
    setBreakoutLevel(preset.answers.breakoutLevel);
    setMarksDuration(preset.answers.marksDuration);
    setSensitivity(preset.answers.sensitivity);
    setHealthSituations(preset.answers.healthSituations);
    setBudget(preset.answers.budget);

    if (preset.answers.ageRange === 'under 18') {
      setCapturedImage(null);
      setPhotoResult(null);
    } else {
      setCapturedImage(preset.imageSvg);
      setConsentChecked(true);
      setPhotoResult({
        image_ok: true,
        quality_issues: [],
        findings: preset.mockFindings,
        needs_clinician: false,
        clinician_reason: '',
        confidence: 'high',
        summary: 'Demo profile, not a real person · Features simulated for testing.',
      });
    }
    setStep(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!consentChecked) {
      alert('Please check the consent box before uploading a photo.');
      return;
    }

    setIsDemoProfile(false);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const rawData = evt.target?.result as string;
      const cleanJpeg = await resizeImageToJpeg(rawData);
      setCapturedImage(cleanJpeg);
      performPhotoScan(cleanJpeg);
    };
    reader.readAsDataURL(file);
  };

  const performPhotoScan = async (imageDataUrl: string) => {
    scannedImageRef.current = imageDataUrl;
    setIsScanningPhoto(true);
    setPhotoError(null);
    try {
      const result = await analyzePhoto(imageDataUrl, ageRange as AgeRange, consentChecked);
      setPhotoResult(result);
      if (!result.image_ok || result.confidence === 'low') {
        setPhotoError(
          'Photo quality is unclear. Use natural daylight, face the camera directly, and ensure no makeup or heavy filters before retaking.'
        );
      }
    } catch (err: any) {
      setPhotoError(err?.message || 'Unable to analyze image. You can still continue using the quiz.');
    } finally {
      setIsScanningPhoto(false);
    }
  };

  // Photos from the live camera arrive through props. Scan them the same way as uploaded photos.
  // Demo profiles use an SVG picture, so only real JPEG photos are scanned here.
  useEffect(() => {
    if (!capturedImage || !capturedImage.startsWith('data:image/jpeg')) return;
    if (capturedImage === scannedImageRef.current || isScanningPhoto || isUnder18) return;
    setIsDemoProfile(false);
    performPhotoScan(capturedImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]);

  const toggleFinding = (findingId: string) => {
    if (!photoResult) return;
    setPhotoResult({
      ...photoResult,
      findings: photoResult.findings.map((f) =>
        f.id === findingId ? { ...f, enabled: f.enabled === false ? true : false } : f
      ),
    });
  };

  const handleFinish = () => {
    if (lookingFor.length === 0) {
      alert('Please choose at least one product type you are looking for.');
      setStep(1);
      return;
    }

    // Accumulate concerns from checked findings
    const finalConcerns = [...concerns];
    if (photoResult && photoResult.image_ok && photoResult.confidence !== 'low') {
      photoResult.findings.forEach((f) => {
        if (f.enabled !== false) {
          if (f.type === 'active_pimples' && !finalConcerns.includes('acne')) {
            finalConcerns.push('acne');
          }
          if (f.type === 'red_marks' && !finalConcerns.includes('red marks')) {
            finalConcerns.push('red marks');
          }
          if (f.type === 'brown_marks' && !finalConcerns.includes('brown marks')) {
            finalConcerns.push('brown marks');
          }
          if (
            f.type === 'closed_comedones_or_bumps' &&
            !finalConcerns.includes('clogged pores')
          ) {
            finalConcerns.push('clogged pores');
          }
          if (f.type === 'oily_shine' && !finalConcerns.includes('oil and shine')) {
            finalConcerns.push('oil and shine');
          }
          if (
            f.type === 'dryness_flaking' &&
            !finalConcerns.includes('tight or dehydrated skin')
          ) {
            finalConcerns.push('tight or dehydrated skin');
          }
        }
      });
    }

    if (!quizComplete) {
      setStep(1);
      return;
    }
    const answers: UserQuizAnswers = {
      lookingFor,
      ageRange: ageRange as AgeRange,
      skinTone: skinTone as SkinTone,
      concerns: finalConcerns,
      middayFeel: middayFeel as MiddayFeel,
      breakoutLevel: breakoutLevel as BreakoutLevel,
      marksDuration: marksDuration as MarksDuration,
      sensitivity: sensitivity as Sensitivity,
      healthSituations,
      budget: budget as Budget,
    };

    onComplete(answers, photoResult, isDemoProfile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          No Cap Skincare Matcher
        </h1>
        <p className="text-sm text-stone-600 mt-2">
          Honest skincare picks · No invented products or paid claims. Answer the quiz,
          optionally take a face photo, and get matched to real catalog entries.
        </p>

        {/* Stepper buttons */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              step === 1
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            1. Skincare Quiz
          </button>
          <span className="text-stone-300">→</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              step === 2
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            2. Face Photo (Optional)
          </button>
        </div>
      </div>

      {/* ================= STEP 1: QUIZ ================= */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Quick Demo Profiles */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                1-Click Demo Profiles
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                Demo profile, not a real person
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="p-3 bg-white hover:bg-amber-100/50 rounded-xl border border-amber-200 text-left transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {p.name.split('(')[0]}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">
                      {p.answers.skinTone} · {p.answers.ageRange}
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 inline-block">
                    Demo profile, not a real person
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Q1: What are you looking for */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-serif text-lg font-bold text-stone-900">
                1. What are you looking for?
              </label>
              <span className="text-xs text-stone-500">Pick any</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES_OPTIONS.map((opt) => {
                const isSelected = lookingFor.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleLookingFor(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {opt.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2: Age Range */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              2. What is your age range?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AGE_RANGES.map((a) => {
                const isSelected = ageRange === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAgeRange(a.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{a.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 line-clamp-2 ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {a.note}
                    </div>
                  </button>
                );
              })}
            </div>
            {isUnder18 && (
              <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Note: Under 18 accounts will receive gentle basic essentials only (no active treatment serums), and camera photo scanning is disabled.
              </p>
            )}
          </div>

          {/* Q3: Skin Tone */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              3. Skin tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {SKIN_TONES.map((t) => {
                const isSelected = skinTone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSkinTone(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-xs font-bold">{t.label}</span>
                    </div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q4: Concerns */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-serif text-lg font-bold text-stone-900">
                4. Primary concerns
              </label>
              <span className="text-xs text-stone-500">Pick all that apply</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CONCERNS_LIST.map((c) => {
                const isSelected = concerns.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConcern(c.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <span className="text-xs font-semibold">{c.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q5: Midday Feel */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              5. How does your skin feel by midday?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MIDDAY_FEELS.map((f) => {
                const isSelected = middayFeel === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMiddayFeel(f.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{f.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {f.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q6: Breakout Level */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              6. Breakout level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BREAKOUT_LEVELS.map((b) => {
                const isSelected = breakoutLevel === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBreakoutLevel(b.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? b.id === 'deep and painful'
                          ? 'border-rose-900 bg-rose-950 text-white shadow-xs'
                          : 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{b.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {b.desc}
                    </div>
                  </button>
                );
              })}
            </div>
            {breakoutLevel === 'deep and painful' && (
              <p className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                Notice: Deep, painful cysts require in-person medical care from a dermatologist. We will provide doctor referral guidance.
              </p>
            )}
          </div>

          {/* Q7: Marks Duration */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              7. How long have lingering marks been there?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MARKS_DURATIONS.map((m) => {
                const isSelected = marksDuration === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMarksDuration(m.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q8: Stings or Reddens with New Products */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              8. Does your skin sting or redden with new products?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {SENSITIVITIES.map((s) => {
                const isSelected = sensitivity === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSensitivity(s.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {s.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q9: Health Situations */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              9. Health situations (optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {HEALTH_OPTIONS.map((h) => {
                const isSelected = healthSituations.includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHealth(h.id)}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <span className="text-xs font-semibold">{h.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q10: Budget per product */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-3">
            <label className="font-serif text-lg font-bold text-stone-900 block">
              10. Budget per product
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {BUDGET_OPTIONS.map((b) => {
                const isSelected = budget === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBudget(b.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{b.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {b.capDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex flex-col items-end gap-2 pt-4">
            {!quizComplete && (
              <p className="text-xs text-stone-600 text-right">Still to answer: {missingAnswers.join(', ')}</p>
            )}
            <button
              type="button"
              disabled={!quizComplete}
              onClick={() => setStep(2)}
              className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Continue to Step 2: Face Photo (Optional)</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PHOTO (OPTIONAL) ================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-100 border border-stone-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Quiz Questions</span>
            </button>
            <span className="text-xs text-stone-500">
              Profile: Age {ageRange} · {skinTone}
            </span>
          </div>

          {/* If under 18: Disable camera & photo scanning completely */}
          {isUnder18 ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Photo Scanning Not Available Under 18
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Photo scanning is not available under 18. Your quiz answers have been recorded,
                and we will rank gentle basic essentials (cleanser, moisturizer, and sunscreen)
                tailored to your skin type.
              </p>
              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
              >
                View Gentle Routine & Matches
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                  Optional Step
                </span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
                  Scan Marks with a Face Photo
                </h2>
                <p className="text-xs text-stone-600 mt-1">
                  Gemini AI will describe visible marks (blemishes, dark spots, shine, texture).
                  Cameras can misread marks, so you can review and untick any AI finding before
                  recommendations are generated.
                </p>
              </div>

              {/* Privacy Consent Checkbox */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded border-stone-400 accent-stone-900 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-stone-800 font-medium leading-snug">
                    I agree to send my photo to Google's Gemini AI to be analysed. This app does not
                    save it. Not available under 18.
                  </span>
                </label>
                <p className="text-[11px] text-stone-500 pl-7">
                  Image is downscaled to 1024px in your browser to remove EXIF metadata and is held
                  only in temporary memory.
                </p>
              </div>

              {/* Camera & Upload Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={!consentChecked || isScanningPhoto}
                  onClick={onOpenLiveCamera}
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Click Picture with Camera</span>
                </button>

                <label
                  className={`w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    !consentChecked || isScanningPhoto ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-stone-600" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 underline ml-auto"
                >
                  Skip photo & see recommendations
                </button>
              </div>

              {/* Scanning status */}
              {isScanningPhoto && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-700 animate-spin" />
                  <span>Describing visible features in photo with Gemini AI...</span>
                </div>
              )}

              {/* Error / Retake warning */}
              {photoError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Photo Unclear: Please Retake or Continue Without Photo</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">{photoError}</p>
                </div>
              )}

              {/* Photo Preview & Label */}
              {capturedImage && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-300 shrink-0 bg-stone-200 flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt={isDemoProfile ? "Demo profile simulation" : "Captured face"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    {isDemoProfile ? (
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Demo profile, not a real person
                        </span>
                        <p className="text-xs text-stone-600">
                          Fake photo result · Sample vector portrait used for testing
                        </p>
                      </div>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-800">
                        Photo loaded for analysis
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* AI Findings Review: User can untick */}
              {photoResult && photoResult.image_ok && (
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {isDemoProfile && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span>Fake photo result (Demo profile, not a real person)</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-base font-bold text-stone-900">
                        {isDemoProfile ? 'Fake Photo Findings (Demo profile, not a real person)' : 'AI Description (Review & Confirm)'}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {isDemoProfile
                          ? 'Demo profile, not a real person. Tap any chip to toggle.'
                          : 'AI description, may be wrong. Tap any chip to untick it if incorrect.'}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                      Confidence: {photoResult.confidence}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    "{photoResult.summary}"
                  </p>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-stone-700">
                      Detected visible marks (Untick any that do not match):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {photoResult.findings.map((f) => {
                        const isEnabled = f.enabled !== false;
                        const zoneLabel = f.zones.join(', ').replace(/_/g, ' ');
                        const typeLabel = f.type.replace(/_/g, ' ');

                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleFinding(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                              isEnabled
                                ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-semibold'
                                : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
                            }`}
                          >
                            <span>
                              {zoneLabel}: {typeLabel} ({f.severity})
                            </span>
                            <span className="text-[10px] font-bold">
                              {isEnabled ? '✓' : '✕'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Final Submit Button */}
              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>See My Matches & Routine</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
