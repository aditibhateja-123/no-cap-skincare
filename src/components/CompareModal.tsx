import React from 'react';
import { RankedProduct } from '../types';
import { ExternalLink, X, Info } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: RankedProduct[];
  onRemoveProduct: (id: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
}) => {
  if (!isOpen || products.length === 0) return null;

  const minPrice = Math.min(...products.map((p) => p.price));
  const maxRating = Math.max(...products.map((p) => p.rating));

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                Side-by-Side Comparison
              </span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs font-semibold capitalize text-stone-700">
                {products[0]?.role}s ({products.length})
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
              Compare Products
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table / Grid */}
        <div className="overflow-x-auto flex-1 pb-4">
          <div
            className="grid gap-4 min-w-[620px]"
            style={{
              gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))`,
            }}
          >
            {products.map((p) => {
              const isLowestPrice = p.price === minPrice;
              const isHighestRating = p.rating === maxRating;

              return (
                <div
                  key={p.id}
                  className="bg-stone-50/60 rounded-2xl p-4 sm:p-5 border border-stone-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Top Row: Remove action */}
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {p.role}
                      </span>
                      {products.length > 2 && (
                        <button
                          onClick={() => onRemoveProduct(p.id)}
                          className="text-[11px] text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Row 1: Name */}
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                        Product Name
                      </span>
                      <h3 className="font-serif font-bold text-sm text-stone-900 leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    {/* Row 2: Price in rupees with MRP struck through & Lowest price label */}
                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                        Price
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold font-mono text-stone-900">
                          ₹{p.price}
                        </span>
                        {p.mrp > p.price && (
                          <span className="text-xs font-mono text-stone-400 line-through">
                            ₹{p.mrp}
                          </span>
                        )}
                        {isLowestPrice && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5">
                            Lowest price
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Rating and number of ratings with seller name & Highest rating label */}
                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                        Rating & Seller
                      </span>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                          <span>rated {p.rating} from {p.ratingCount.toLocaleString('en-IN')} ratings on {p.seller}</span>
                          {isHighestRating && (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                              Highest rating
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Price snapshot checked {p.checkedAt}
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Matched On reasons */}
                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                        Matched On
                      </span>
                      <ul className="text-xs text-stone-700 space-y-1 pl-3.5 list-disc">
                        {p.matchedOn.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Row 5: SPF for sunscreens */}
                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                        SPF Defense
                      </span>
                      <span className="text-xs font-medium text-stone-800">
                        {p.role === 'sunscreen' ? (p.spf ? `SPF ${p.spf}` : 'Sunscreen Protection') : '—'}
                      </span>
                    </div>

                    {/* Row 6: Flags */}
                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                        Formula Flags
                      </span>
                      <div className="space-y-1">
                        {p.flags.length > 0 ? (
                          p.flags.map((fl, i) => {
                            const label =
                              fl === 'high_strength'
                                ? 'Strong version'
                                : fl === 'may_contain_extra_active'
                                ? 'Check the label: may contain a second active'
                                : fl;
                            return (
                              <span
                                key={i}
                                className="block text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded px-2 py-0.5"
                              >
                                {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-stone-500">None</span>
                        )}
                      </div>
                    </div>

                    {/* Row 7: Real Review Summary */}
                    <div className="pt-2 border-t border-stone-200/60 space-y-2">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">
                        Review Summary
                      </span>
                      {p.reviews ? (
                        <div className="text-xs text-stone-700 space-y-2 bg-white p-3 rounded-xl border border-stone-200">
                          {p.reviews.praise.length > 0 && (
                            <div>
                              <strong className="text-[11px] text-emerald-800 block">Praise:</strong>
                              <ul className="list-disc pl-3 text-[11px] text-stone-600 space-y-0.5">
                                {p.reviews.praise.slice(0, 2).map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {p.reviews.complaints.length > 0 && (
                            <div>
                              <strong className="text-[11px] text-rose-800 block">Complaints:</strong>
                              <ul className="list-disc pl-3 text-[11px] text-stone-600 space-y-0.5">
                                {p.reviews.complaints.slice(0, 2).map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500 italic block">
                          No review text collected yet
                        </span>
                      )}
                    </div>

                    {/* Row 8: Dermatologist Review Status */}
                    {p.dermReview ? (
                      <div className="pt-2 border-t border-stone-200/60">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold mb-1">
                          Dermatologist Status
                        </span>
                        <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Reviewed by {p.dermReview.reviewedBy}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Row 9: View on Nykaa link */}
                  <div className="pt-3 border-t border-stone-200">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View on Nykaa</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
          <span>Comparing up to 3 products of the same type.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
