'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';

import { apiClient, ApiError, type MarketplaceItem } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { Button, Dialog, Skeleton } from '@/shared/ui';

const MAX_COMMENT = 4_000;
const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function Stars({ value }: { readonly value: number }) {
  return (
    <span aria-label={`${value} sur 5`} className="flex text-warn">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={12}
          aria-hidden="true"
          fill={index <= value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

interface ReviewsDialogProps {
  readonly item: MarketplaceItem;
  readonly onClose: () => void;
}

/** Existing reviews of an item and a 1–5 rating form. */
export function ReviewsDialog({ item, onClose }: ReviewsDialogProps) {
  const queryClient = useQueryClient();
  const formId = useId();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const reviews = useQuery({
    queryKey: ['marketplace', 'reviews', item.id] as const,
    queryFn: async () =>
      (await apiClient.getMarketplaceReviews(item.id, { limit: 20 })).items ??
      [],
  });
  const post = useMutation({
    mutationFn: () =>
      apiClient.createMarketplaceReview(item.id, {
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      }),
    onSuccess: async () => {
      setRating(0);
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (rating >= 1 && !post.isPending) post.mutate();
  };

  const postError =
    post.error instanceof ApiError && post.error.statusCode === 409
      ? 'Tu as déjà donné ton avis sur cet élément.'
      : post.error instanceof ApiError && post.error.statusCode === 403
        ? "Installe d'abord cet élément pour donner ton avis."
        : post.error
          ? "Impossible d'envoyer ton avis."
          : null;

  return (
    <Dialog
      title={`Avis sur ${item.name}`}
      onClose={onClose}
      className="w-[min(560px,calc(100vw-32px))]"
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Fermer
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={rating < 1 || post.isPending}
          >
            {post.isPending ? 'Envoi…' : 'Publier mon avis'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={submit}
        className="flex flex-col gap-2.5 border-b border-line pb-4"
      >
        <fieldset className="m-0 flex items-center gap-1 border-0 p-0">
          <legend className="mb-1.5 text-[12.5px] font-medium text-fg">
            Ta note
          </legend>
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={cn(
                FOCUS_RING,
                'cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand'
              )}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span className="sr-only">{value} sur 5</span>
              <Star
                size={20}
                aria-hidden="true"
                className={value <= rating ? 'text-warn' : 'text-fg-3'}
                fill={value <= rating ? 'currentColor' : 'none'}
              />
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-fg">
          Commentaire (optionnel)
          <textarea
            value={comment}
            maxLength={MAX_COMMENT}
            rows={3}
            onChange={(event) => setComment(event.target.value)}
            className={cn(
              FOCUS_RING,
              'resize-y rounded-[10px] border border-line bg-sunken p-2.5 text-[12.5px] font-normal text-fg'
            )}
          />
        </label>
        {post.isSuccess ? (
          <p role="status" className="m-0 text-xs text-gain">
            Merci, ton avis est publié.
          </p>
        ) : null}
        {postError ? (
          <p role="alert" className="m-0 text-xs text-loss">
            {postError}
          </p>
        ) : null}
      </form>
      <section aria-label="Avis publiés" className="flex flex-col gap-2.5 pt-4">
        {reviews.isPending ? (
          <Skeleton className="h-16" />
        ) : reviews.isError ? (
          <p role="alert" className="m-0 text-xs text-loss">
            Impossible de charger les avis.
          </p>
        ) : reviews.data.length === 0 ? (
          <p className="m-0 text-xs text-fg-3">Aucun avis pour le moment.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {reviews.data.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-line bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Stars value={review.rating} />
                  <span className="font-mono text-[11px] text-fg-3">
                    {DATE.format(new Date(review.created_at))}
                  </span>
                </div>
                {review.comment ? (
                  <p className="m-0 mt-1.5 whitespace-pre-wrap text-[12.5px] text-fg-2">
                    {review.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Dialog>
  );
}
