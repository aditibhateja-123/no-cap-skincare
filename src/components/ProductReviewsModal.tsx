import React from 'react';
import { X, Star, ThumbsUp, ThumbsDown, ExternalLink, AlertCircle, Info } from 'lucide-react';
import { RankedProduct } from '../types';

interface ProductReviewsModalProps {
  product: RankedProduct | null;
  onClose: () => void;
}

export const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  const totalSampleReviews = product.reviews?.sample
    ? product.reviews.sample.positive + product.reviews.sample.negative
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-100 bg-[#faf8f5]">
          <div className="space-y-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                {product.role}
              </span>
              {product.dermReview && (
                <>
                  <span className="text-stone-300">·</span>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Reviewed by {product.dermReview.reviewedBy}
                  </span>
                </>
              )}
              {product.flagLabels.map((fl, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                >
                  {fl}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* Price & Rating Snapshot Banner */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-stone-900">
                  ₹{product.price}
                </span>
                {product.mrp > product.price && (
                  <span className="text-sm font-mono text-stone-400 line-through">
                    ₹{product.mrp}
                  </span>
                )}
                {product.isAboveBudget && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Above your budget
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                rated {product.rating} from {product.ratingCount.toLocaleString('en-IN')} ratings on{' '}
                {product.seller}, price checked {product.checkedAt}
              </div>
            </div>

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
            >
              <span>View on Nykaa and read the reviews</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Why Matched */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Why this product was ranked for you
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-700 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60">
              {product.matchedOn.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Review Details from Seller */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              What reviewers say
            </h3>

            {product.reviews ? (
              <div className="space-y-4">
                {/* Praise & Complaints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Praise */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Reviewer Praise</span>
                    </div>
                    <ul className="space-y-2 text-xs text-stone-700">
                      {product.reviews.praise.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Complaints */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider">
                      <ThumbsDown className="w-3.5 h-3.5 text-stone-600" />
                      <span>Reviewer Complaints</span>
                    </div>
                    <ul className="space-y-2 text-xs text-stone-700">
                      {product.reviews.complaints.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-stone-400 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Review Source Note */}
                <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-200 text-xs text-stone-600 space-y-1">
                  <p className="font-semibold text-stone-800">
                    Summary written from {totalSampleReviews} real reviews on{' '}
                    {product.reviews.source}, collected {product.reviews.collectedAt}
                  </p>
                  <p className="text-[11px] leading-relaxed">{product.reviews.note}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2">
                <p>
                  No review text collected for this product yet. The star rating comes from the
                  seller's page.
                </p>
                <p className="text-[11px] text-stone-500">
                  You can inspect the full customer review section directly on the retailer listing.
                </p>
              </div>
            )}
          </div>

          {/* Transparency Disclaimers */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-[11px] text-stone-600 space-y-1">
            <p>
              <strong>Disclaimer:</strong> Matches use the product name and listing numbers only.
              Ingredient lists are not checked, so read the label.
            </p>
            <p>
              Prices are a snapshot from Nykaa on the checked date and change often. These links
              earn us nothing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#faf8f5] flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Always patch test every product before applying to the whole face.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
