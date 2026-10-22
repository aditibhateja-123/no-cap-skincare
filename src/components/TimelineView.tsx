import React, { useState } from 'react';
import {
  Camera,
  Trash2,
  Sliders,
  AlertTriangle,
  Info,
  Calendar,
  X,
  Layers,
} from 'lucide-react';
import { TimelinePhotoItem } from '../types';

interface TimelineViewProps {
  planId: string;
  photos: TimelinePhotoItem[];
  onDeletePhoto: (id: string) => void;
  onDeleteAllPhotos: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  photos,
  onDeletePhoto,
  onDeleteAllPhotos,
}) => {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);

  // Toggle photo selection for comparison (at most 2)
  const handleToggleSelect = (photoId: string) => {
    if (selectedForCompare.includes(photoId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== photoId));
    } else {
      if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, photoId]);
      } else {
        // Replace second selection
        setSelectedForCompare([selectedForCompare[0], photoId]);
      }
    }
  };

  const photo1 = photos.find((p) => p.id === selectedForCompare[0]);
  const photo2 = photos.find((p) => p.id === selectedForCompare[1]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-900 text-amber-200">
              <Camera className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              My Timeline
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
              On-device only
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Photos are stored only in this browser. Clearing browser data deletes them.
          </p>
        </div>

        {photos.length > 0 && (
          <div className="flex items-center gap-2">
            {isConfirmingDeleteAll ? (
              <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                <span className="text-[11px] text-rose-800 font-medium px-2">
                  Delete all photos?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAllPhotos();
                    setSelectedForCompare([]);
                    setIsConfirmingDeleteAll(false);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-rose-700 text-white rounded-lg hover:bg-rose-800 cursor-pointer"
                >
                  Yes, delete all
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDeleteAll(false)}
                  className="px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDeleteAll(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete all my photos</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comparison View (when 2 photos are selected) */}
      {photo1 && photo2 && (
        <div className="p-5 rounded-2xl bg-[#faf8f5] border border-amber-200 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Side-by-side comparison
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close comparison</span>
            </button>
          </div>

          {/* Standard Requirement Label */}
          <p className="text-xs font-medium text-stone-700 bg-amber-50/80 px-3 py-2 rounded-xl border border-amber-200/80 text-center">
            Your own photos. Look at them in the same light and the same angle.
          </p>

          {/* Interactive Split Slider Container */}
          <div className="relative w-full max-w-lg mx-auto aspect-square rounded-2xl overflow-hidden shadow-sm select-none border border-stone-300 bg-stone-900">
            {/* Background Image (Photo 2) */}
            <img
              src={photo2.url}
              alt={`Photo from ${photo2.date}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-1 rounded-md">
              {photo2.date}
            </div>

            {/* Foreground Image with Clip Path (Photo 1) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={photo1.url}
                alt={`Photo from ${photo1.date}`}
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-1 rounded-md">
                {photo1.date}
              </div>
            </div>

            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white text-stone-900 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold border border-stone-200">
                ↔
              </div>
            </div>

            {/* Draggable Range Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              aria-label="Drag slider to compare photos"
            />
          </div>

          <p className="text-[11px] text-stone-500 text-center">
            Drag the slider across to compare details between {photo1.date} and {photo2.date}.
          </p>
        </div>
      )}

      {/* Gallery List (Newest first) */}
      {photos.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50 space-y-2">
          <Camera className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-xs sm:text-sm font-medium text-stone-700">
            No timeline photos yet
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            During your 10-second weekly Weekend check, you can optionally snap or select a photo. It stays strictly in your browser and is never uploaded.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {photos.length >= 2 && selectedForCompare.length < 2 && (
            <p className="text-xs text-amber-800 font-medium bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Tap any two photos to view them side-by-side with an interactive comparison slider.
              </span>
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => {
              const isSelected = selectedForCompare.includes(photo.id);
              const selectionIndex = selectedForCompare.indexOf(photo.id);

              return (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl border p-2 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {/* Photo Preview */}
                  <div
                    onClick={() => handleToggleSelect(photo.id)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={`Photo on ${photo.date}`}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />

                    {/* Selection Badge */}
                    {isSelected && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-stone-900 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        {selectionIndex + 1}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-white bg-stone-900/70 px-2 py-1 rounded-md">
                        {isSelected ? 'Deselect' : 'Compare'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-2 flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-stone-800">
                      {photo.date}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeletePhoto(photo.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Delete this photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
