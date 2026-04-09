"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

type CardData = {
  id: string;
  src: string | null;
  caption: string;
  author: string;
  created: string | null;
  likeCount: number;
};

type ClickableImageProps = {
  src: string;
  alt: string;
  cardIndex: number;
  onOpen: (index: number) => void;
};

export function ClickableImage({ src, alt, cardIndex, onOpen }: ClickableImageProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(cardIndex)}
      className="block w-full cursor-zoom-in overflow-hidden"
      aria-label="Expand card"
    >
      <img
        src={src}
        alt={alt}
        className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    </button>
  );
}

type CardModalProps = {
  cards: CardData[];
  openIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  onPrevPage?: () => void;
  onNextPage?: () => void;
};

export function CardModal({ cards, openIndex, onClose, onNavigate, hasPrevPage, hasNextPage, onPrevPage, onNextPage }: CardModalProps) {
  const canGoPrev = openIndex !== null && (openIndex > 0 || hasPrevPage);
  const canGoNext = openIndex !== null && (openIndex < cards.length - 1 || hasNextPage);

  const goPrev = useCallback(() => {
    if (openIndex === null) return;
    if (openIndex > 0) onNavigate(openIndex - 1);
    else if (hasPrevPage && onPrevPage) onPrevPage();
  }, [openIndex, onNavigate, hasPrevPage, onPrevPage]);

  const goNext = useCallback(() => {
    if (openIndex === null) return;
    if (openIndex < cards.length - 1) onNavigate(openIndex + 1);
    else if (hasNextPage && onNextPage) onNextPage();
  }, [openIndex, cards.length, onNavigate, hasNextPage, onNextPage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (openIndex === null) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    },
    [openIndex, onClose, goPrev, goNext]
  );

  useEffect(() => {
    if (openIndex === null) return;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openIndex, handleKeyDown]);

  if (openIndex === null) return null;

  const card = cards[openIndex];
  if (!card) return null;

  return createPortal(
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20"
        aria-label="Close preview"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Nav arrows */}
      {canGoPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20"
          aria-label="Previous card"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canGoNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20"
          aria-label="Next card"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Card content */}
      <div
        className="animate-modal-in mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {card.src && (
          <img
            src={card.src}
            alt={card.caption}
            className="max-h-[60vh] w-full object-contain bg-zinc-100"
          />
        )}
        <div className="p-6">
          <h3 className="text-lg font-semibold leading-relaxed text-zinc-900">
            {card.caption}
          </h3>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
                {card.author[0].toUpperCase()}
              </div>
              <span>{card.author}</span>
            </div>
            <span className="font-mono text-xs text-zinc-400">{card.created}</span>
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-3">
            <span className="font-mono text-[11px] text-orange-400">
              {card.likeCount} {card.likeCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </div>
      </div>

      {/* Page indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/60 backdrop-blur">
          {openIndex + 1} / {cards.length}
        </span>
      </div>
    </div>,
    document.body
  );
}

// Default export for backwards compatibility
export default function ClickableImageLegacy({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in overflow-hidden"
        aria-label="Open image preview"
      >
        <img
          src={src}
          alt={alt}
          className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {open &&
        createPortal(
          <div
            className="animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Close preview"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="animate-modal-in" onClick={(event) => event.stopPropagation()}>
              <img
                src={src}
                alt={alt}
                className="max-h-[88vh] max-w-[95vw] rounded-lg object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
