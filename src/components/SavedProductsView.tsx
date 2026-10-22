import React from 'react';
import { Heart, Trash2, ExternalLink, ArrowRight, Info } from 'lucide-react';
import { CatalogProduct } from '../types';
import catalogData from '../data/catalog.json';

const catalog = catalogData as CatalogProduct[];

interface SavedProductsViewProps {
  savedIds: string[];
  onRemoveId: (id: string) => void;
  onClearAll: () => void;
  onNewScan: () => void;
}

export const SavedProductsView: React.FC<SavedProductsViewProps> = ({
  savedIds,
  onRemoveId,
  onClearAll,
  onNewScan,
}) => {
  // Read current catalog data for each saved id
  const savedProducts = savedIds
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is CatalogProduct => Boolean(p));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
            Saved Products
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Your Skincare Wishlist
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Stored only on this device. Reads real current catalog specifications and ratings.
          </p>
        </div>

        {savedProducts.length > 0 && (
          <button
            onClick={onClearAll}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Snapshot disclaimer banner required */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-800 shrink-0" />
        <span>Prices are a snapshot from the checked date and change often.</span>
      </div>

      {/* Products Grid */}
      {savedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No Saved Products Yet
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Click the heart icon on any product card across your match results to save items to your wishlist.
            </p>
          </div>
          <button
            onClick={onNewScan}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Explore Product Matches
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-400 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {p.role}
                  </span>
                  <button
                    onClick={() => onRemoveId(p.id)}
                    className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    title="Remove from saved products"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-serif font-bold text-sm text-stone-900 leading-snug">
                  {p.name}
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-stone-900">
                      ₹{p.price}
                    </span>
                    {p.mrp > p.price && (
                      <span className="text-xs font-mono text-stone-400 line-through">
                        ₹{p.mrp}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    rated {p.rating} from {p.ratingCount.toLocaleString('en-IN')} ratings on {p.seller}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Checked {p.checkedAt}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View on Nykaa</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => onRemoveId(p.id)}
                  className="w-full py-1.5 text-xs text-stone-500 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
