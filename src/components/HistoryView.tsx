import React from 'react';
import { History, Calendar, Trash2, Tag, ShoppingBag } from 'lucide-react';
import { SavedConsultation } from '../types';

interface HistoryViewProps {
  savedScans: SavedConsultation[];
  onDeleteScan: (id: string) => void;
  onNewScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  savedScans,
  onDeleteScan,
  onNewScan,
}) => {
  if (savedScans.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <History className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          No Saved Consultations Yet
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
          When you complete a skincare quiz, tap "Save Picks" to keep your matched products and
          concerns on this device. Photos are never saved.
        </p>
        <button
          onClick={onNewScan}
          className="mt-2 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
        >
          Start Skincare Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Consultation History
          </h2>
          <p className="text-xs text-stone-600">
            Saved concerns and matched product names. Photos are never stored.
          </p>
        </div>
        <button
          onClick={onNewScan}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
        >
          + New Consultation
        </button>
      </div>

      <div className="space-y-4">
        {savedScans.map((scan) => (
          <div
            key={scan.id}
            className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{scan.date}</span>
                </div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Profile: {scan.ageRange} · <span className="capitalize">{scan.skinTone}</span>
                </h3>
              </div>

              <button
                onClick={() => onDeleteScan(scan.id)}
                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Delete record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Concerns */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Targeted Concerns:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scan.concerns.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 bg-stone-100 text-stone-800 text-[11px] rounded-lg border border-stone-200"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Matched Products */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                <span>Matched Products ({scan.productNames.length}):</span>
              </span>
              <ul className="space-y-1 text-xs text-stone-700 pl-4 list-disc">
                {scan.productNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
