import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Check,
  AlertTriangle,
  Upload,
  Info,
  X,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  CheckInPlan,
  WeekendCheckAnswers,
  WeekendCheckRecord,
} from '../types';
import {
  evaluateWeekend,
  calculateWeekendStreak,
  formatLocalDateToYMD,
} from '../utils/skincareRules';
import { shrinkAndStripExif, saveTimelinePhoto } from '../utils/photoStorage';

interface WeekendCheckModalProps {
  plan: CheckInPlan;
  isUnder18: boolean;
  existingRecords: WeekendCheckRecord[];
  onClose: () => void;
  onSaveRecord: (record: WeekendCheckRecord) => void;
  onPhotoSaved?: () => void;
}

export const WeekendCheckModal: React.FC<WeekendCheckModalProps> = ({
  plan,
  isUnder18,
  existingRecords,
  onClose,
  onSaveRecord,
  onPhotoSaved,
}) => {
  // Questions
  const [skinFeel, setSkinFeel] = useState<'Calmer' | 'Same' | 'More irritated' | null>(null);
  const [breakouts, setBreakouts] = useState<'None' | 'A few' | 'Many' | null>(null);
  const [sunscreen, setSunscreen] = useState<'Yes' | 'Some days' | 'Rarely' | null>(null);

  // Photo step (optional)
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [deviceOnlyConfirmed, setDeviceOnlyConfirmed] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Completed feedback view
  const [feedbackNotes, setFeedbackNotes] = useState<string[] | null>(null);
  const [newStreak, setNewStreak] = useState<number>(0);

  const isFormComplete = skinFeel !== null && breakouts !== null && sunscreen !== null;

  // Handle image file selection from device or camera
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const processedBlob = await shrinkAndStripExif(file);
      setPhotoBlob(processedBlob);
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(URL.createObjectURL(processedBlob));
    } catch (err) {
      console.warn('Failed to process image:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setDeviceOnlyConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;

    const answers: WeekendCheckAnswers = {
      skinFeel: skinFeel!,
      breakouts: breakouts!,
      sunscreen: sunscreen!,
    };

    const notes = evaluateWeekend(answers);
    const todayYMD = formatLocalDateToYMD(new Date());

    let hasSavedPhoto = false;
    // Save photo to IndexedDB if provided and confirmed
    if (!isUnder18 && photoBlob && deviceOnlyConfirmed) {
      try {
        await saveTimelinePhoto(plan.id, todayYMD, photoBlob);
        hasSavedPhoto = true;
        if (onPhotoSaved) onPhotoSaved();
      } catch (err) {
        console.warn('Error saving timeline photo:', err);
      }
    }

    const recordId = `weekend-${Date.now()}`;
    const newRecord: WeekendCheckRecord = {
      id: recordId,
      planId: plan.id,
      date: todayYMD,
      answers,
      hasPhoto: hasSavedPhoto,
      evaluationNotes: notes,
    };

    onSaveRecord(newRecord);

    const updatedRecords = [newRecord, ...existingRecords];
    const streak = calculateWeekendStreak(updatedRecords);
    setNewStreak(streak);
    setFeedbackNotes(notes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-stone-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-800">
                10-second weekly habit
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
              Weekend Check
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Three quick taps. No typing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl font-bold p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Mode after Submission */}
        {feedbackNotes ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Gentle streak notice */}
            {newStreak > 0 && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <Flame className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-950">
                    {newStreak === 1 ? '1 weekend check completed' : `${newStreak} weekends in a row`}
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Steady consistency gives your skin time to adjust.
                  </p>
                </div>
              </div>
            )}

            {/* Plain clinical rule notes */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Weekly check-in notes
              </span>
              {feedbackNotes.map((note, idx) => {
                const isDisclaimer = note.includes('general guidelines');
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                      isDisclaimer
                        ? 'bg-stone-50 border-stone-200 text-stone-500 italic text-center text-xs'
                        : note.includes('Pause your active')
                        ? 'bg-rose-50 border-rose-200 text-rose-950 font-medium'
                        : note.includes('dermatologist')
                        ? 'bg-amber-50 border-amber-200 text-amber-950 font-medium'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
                    }`}
                  >
                    {note}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Three Questions Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question (a) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-900">
                (a) How does your skin feel this week?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Calmer', 'Same', 'More irritated'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSkinFeel(opt)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      skinFeel === opt
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50/70 text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question (b) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-900">
                (b) Any new breakouts?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['None', 'A few', 'Many'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBreakouts(opt)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      breakouts === opt
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50/70 text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question (c) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-900">
                (c) Did you wear sunscreen most days?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Yes', 'Some days', 'Rarely'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSunscreen(opt)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      sunscreen === opt
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50/70 text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Step 4: Photo for timeline (hidden & disabled for under 18) */}
            {!isUnder18 && (
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-stone-600" />
                    <span>Add a photo for your own timeline (optional)</span>
                  </span>
                  <span className="text-[11px] text-stone-500">Can be skipped</span>
                </div>

                {photoPreviewUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-stone-300 bg-stone-100 mx-auto">
                      <img
                        src={photoPreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-1 right-1 bg-stone-900/80 text-white rounded-full p-1 hover:bg-stone-900 cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Required tick box */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer select-none text-xs text-amber-950 font-medium">
                      <input
                        type="checkbox"
                        checked={deviceOnlyConfirmed}
                        onChange={(e) => setDeviceOnlyConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 accent-stone-900 h-4 w-4"
                      />
                      <span className="leading-snug">
                        This photo stays on this device only. It is never uploaded.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="weekend-photo-input"
                    />
                    <label
                      htmlFor="weekend-photo-input"
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isProcessingPhoto ? 'Preparing photo...' : 'Take or pick a photo'}</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormComplete || (Boolean(photoBlob) && !deviceOnlyConfirmed)}
                className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isFormComplete && (!photoBlob || deviceOnlyConfirmed)
                    ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>Save weekend check</span>
              </button>
              {photoBlob && !deviceOnlyConfirmed && (
                <p className="text-[11px] text-amber-800 mt-1.5 text-center font-medium">
                  Tick the device-only confirmation box to include your photo, or remove it.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
