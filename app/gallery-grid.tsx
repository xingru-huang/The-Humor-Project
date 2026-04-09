"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CardModal } from "@/app/clickable-image";

type GalleryCard = {
  id: string;
  src: string | null;
  caption: string;
  author: string;
  created: string | null;
  likeCount: number;
};

type GalleryGridProps = {
  cards: GalleryCard[];
  page: number;
  totalPages: number;
};

export default function GalleryGrid({ cards, page, totalPages }: GalleryGridProps) {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleOpen = useCallback((index: number) => setOpenIndex(index), []);
  const handleClose = useCallback(() => setOpenIndex(null), []);
  const handleNavigate = useCallback((index: number) => setOpenIndex(index), []);

  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const handlePrevPage = useCallback(() => {
    setOpenIndex(null);
    router.push(`/?page=${page - 1}`);
  }, [router, page]);

  const handleNextPage = useCallback(() => {
    setOpenIndex(null);
    router.push(`/?page=${page + 1}`);
  }, [router, page]);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <article
            key={card.id}
            className="animate-card-in group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-900/[0.06]"
            style={{ animationDelay: `${index * 60}ms` }}
            onClick={() => handleOpen(index)}
          >
            {card.src ? (
              <div className="overflow-hidden">
                <img
                  src={card.src}
                  alt={card.caption}
                  className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex aspect-4/3 items-center justify-center bg-zinc-50 font-mono text-xs text-zinc-400">
                no image
              </div>
            )}

            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-[15px] font-semibold leading-snug text-zinc-900">
                {card.caption}
              </h3>

              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-500">
                    {card.author[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-zinc-500">{card.author}</span>
                </div>
                <span className="text-[11px] text-zinc-400">{card.created}</span>
              </div>

              <div className="mt-3 border-t border-zinc-100 pt-3">
                <span className="font-mono text-[11px] text-orange-400">
                  {card.likeCount} {card.likeCount === 1 ? "like" : "likes"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <CardModal
        cards={cards}
        openIndex={openIndex}
        onClose={handleClose}
        onNavigate={handleNavigate}
        hasPrevPage={hasPrevPage}
        hasNextPage={hasNextPage}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />
    </>
  );
}
