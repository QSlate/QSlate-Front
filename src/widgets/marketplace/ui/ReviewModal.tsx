'use client';

import { CheckCircle, Loader2, MessageSquare, Star, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import {
  apiClient,
  type MarketplaceItem,
  type MarketplaceReview,
} from '@/shared/api';
import { useAppearance } from '@/shared/theme';

interface ReviewModalProps {
  item: MarketplaceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: (newReview: MarketplaceReview) => void;
}

export function ReviewModal({
  item,
  isOpen,
  onClose,
  onReviewSubmitted,
}: ReviewModalProps) {
  const { theme } = useAppearance();
  const isLight = theme === 'light';

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);

  // Fetch existing reviews when modal opens
  useEffect(() => {
    if (!isOpen || !item) {
      setReviews([]);
      setComment('');
      setRating(5);
      setSubmitError(null);
      return;
    }

    let isMounted = true;
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const res = await apiClient.getMarketplaceReviews(item.id);
        if (isMounted) {
          setReviews(res.items ?? []);
        }
      } catch (err) {
        console.warn('Failed to load item reviews:', err);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [isOpen, item]);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setSubmitError('Please write a brief comment before submitting.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setSubmitError('Please select a star rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await apiClient.createMarketplaceReview(item.id, {
        rating,
        comment: comment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setComment('');
      if (onReviewSubmitted) onReviewSubmitted(created);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to submit review. You must have installed this item first and cannot review your own item.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`w-full max-w-lg rounded-xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-[#0c0d0e] border-[#242528] text-zinc-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight
              ? 'border-zinc-200 bg-zinc-50/70'
              : 'border-[#242528] bg-[#090a0c]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare size={16} className="text-blue-500" />
            <div>
              <h2
                id="review-modal-title"
                className="text-sm font-semibold tracking-tight"
              >
                Community Reviews & Ratings
              </h2>
              <p className="text-[11px] text-zinc-500 truncate max-w-[280px]">
                {item.name} · v{item.revision}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className={`p-1.5 rounded-md transition-colors ${
              isLight
                ? 'hover:bg-zinc-200 text-zinc-500'
                : 'hover:bg-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Rating Submission Form */}
          <form
            onSubmit={handleSubmit}
            className={`p-4 rounded-lg border transition-colors ${
              isLight
                ? 'bg-zinc-50 border-zinc-200'
                : 'bg-[#121418] border-white/10'
            }`}
          >
            <h3 className="text-xs font-semibold mb-2 flex items-center justify-between">
              <span>Leave a Review</span>
              <span className="text-[10px] font-mono text-zinc-500">
                Institutional Quality Feedback
              </span>
            </h3>

            {/* Interactive Star Picker */}
            <div className="flex items-center gap-1.5 mb-3">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled =
                  hoverRating > 0 ? starVal <= hoverRating : starVal <= rating;

                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
                    className="p-1 focus:outline-hidden transition-transform active:scale-90"
                  >
                    <Star
                      size={18}
                      className={
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : isLight
                            ? 'text-zinc-300'
                            : 'text-zinc-600'
                      }
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-mono font-medium text-amber-500">
                {rating}.0 / 5.0
              </span>
            </div>

            {/* Comment Textarea */}
            <div className="relative mb-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your quantitative experience, performance observations, or signal feedback..."
                rows={3}
                maxLength={1000}
                className={`w-full p-2.5 text-xs font-sans rounded-md border resize-none focus:outline-hidden transition-all ${
                  isLight
                    ? 'bg-white border-zinc-300 focus:border-blue-500 text-zinc-900 placeholder-zinc-400'
                    : 'bg-[#090a0c] border-[#242528] focus:border-blue-500 text-white placeholder-zinc-500'
                }`}
              />
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1">
                <span>Markdown supported</span>
                <span>{comment.length}/1000</span>
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-rose-500 mb-3 font-sans">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-md text-xs font-medium font-mono text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Submitting Review…</span>
                </>
              ) : (
                <>
                  <CheckCircle size={13} />
                  <span>Submit Community Review</span>
                </>
              )}
            </button>
          </form>

          {/* Existing Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold">
                Recent Reviews ({reviews.length})
              </h3>
              {item.review_count > 0 && (
                <div className="flex items-center gap-1 text-xs font-mono text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span>{item.average_rating.toFixed(1)} avg</span>
                </div>
              )}
            </div>

            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-8 text-zinc-500 text-xs gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span>Loading community reviews…</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                No reviews yet. Be the first to evaluate this module!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isLight
                        ? 'bg-white border-zinc-200'
                        : 'bg-[#0f1115] border-[#1f2126]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className={
                                i < rev.rating
                                  ? 'fill-amber-400'
                                  : isLight
                                    ? 'text-zinc-200'
                                    : 'text-zinc-700'
                              }
                            />
                          ))}
                        </div>
                        <span className="font-medium text-zinc-400">
                          Author #{rev.author_id}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p
                      className={`leading-relaxed font-sans ${
                        isLight ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
