import React from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToneGuideModal: React.FC<ToneGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-[#faf8f5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                Skin Tone & Marks Guide
              </h2>
              <p className="text-xs text-stone-600">
                Honest skincare picks · Understanding melanin, marks, and sunscreen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-xs sm:text-sm">
          {/* Key Principle */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <h3 className="font-bold text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Why Skin Tone Affects Marks and Products</span>
            </h3>
            <p className="text-stone-700 leading-relaxed text-xs">
              Melanin protects against UV rays, but in deeper tones (wheatish, medium brown, deep brown),
              melanin-producing cells are very sensitive to inflammation. Acne breakouts or harsh scrubs
              often leave stubborn post-breakout brown marks.
            </p>
          </div>

          {/* Tone Breakdown */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-bold text-stone-900">
              Skin Tones & Considerations
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
                <span className="font-bold text-stone-900 block mb-1">Very Fair & Fair Skin</span>
                <p className="text-stone-600">
                  Burns easily under UV light. Red marks after blemishes are common and can persist
                  if irritated. Needs broad-spectrum daily SPF and gentle barrier hydration.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
                <span className="font-bold text-stone-900 block mb-1">Wheatish Skin</span>
                <p className="text-stone-600">
                  Tans gradually. Both red and brown marks can occur. Gentle active treatments like
                  azelaic acid or niacinamide help fade marks without disturbing healthy skin.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
                <span className="font-bold text-stone-900 block mb-1">Medium Brown & Deep Brown Skin</span>
                <p className="text-stone-600">
                  Brown marks can be slower to fade on deeper skin tones, and sun makes them darker,
                  so a daily sunscreen matters most. Look for formulas labelled "no white cast" to avoid
                  chalky residue.
                </p>
              </div>
            </div>
          </div>

          {/* Golden Rules */}
          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
            <h3 className="font-serif text-base font-bold text-stone-900">Key Routine Habits</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Daily Sunscreen:</strong> UV exposure darkens active marks and slows down fading.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>One active at a time:</strong> Layering multiple active serums can damage the
                  skin barrier and trigger new blemishes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Avoid picking:</strong> Physical squeezing pushes inflammation deeper into the
                  skin, leading to darker, more persistent marks.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#faf8f5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
