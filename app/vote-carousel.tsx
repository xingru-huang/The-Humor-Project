"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { submitVote } from "@/app/actions";

type CaptionItem = {
  id: string;
  content: string;
  imageUrl: string;
  author: string;
};

type VoteStatsMap = Record<string, { up: number; down: number; total: number }>;

type Reaction = {
  key: number;
  kind: "mainstream" | "unique" | "first";
  message: string;
  detail: string;
};

const MAINSTREAM_MESSAGES = [
  { message: "Great minds laugh alike!", detail: "You're with the majority." },
  { message: "Crowd favorite!", detail: "Most people agree with you." },
  { message: "Mainstream humor detected!", detail: "You fit right in." },
];

const UNIQUE_MESSAGES = [
  { message: "Rare taste!", detail: "Your humor stands out." },
  { message: "Against the grain!", detail: "A true original." },
  { message: "Uniquely you!", detail: "Not many see it your way." },
];

const FIRST_MESSAGES = [
  { message: "First vote!", detail: "You're the trendsetter." },
  { message: "Pioneer!", detail: "No one rated this yet." },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type VoteCarouselProps = {
  captions: CaptionItem[];
  initialVotes: Record<string, number>;
  initialVoteOrder: string[];
  voteStats: VoteStatsMap;
};

export default function VoteCarousel({
  captions,
  initialVotes,
  initialVoteOrder,
  voteStats,
}: VoteCarouselProps) {
  const [items] = useState(captions);
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, number | null>>(
    Object.fromEntries(Object.entries(initialVotes).map(([k, v]) => [k, v]))
  );
  const [voteOrder, setVoteOrder] = useState<string[]>(initialVoteOrder);
  const [isPending, startTransition] = useTransition();
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [bounceKey, setBounceKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const advance = useCallback(() => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
      setCardKey((k) => k + 1);
      setSwipeDir(null);
    }
  }, [index, items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (items.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleVoteRef.current?.(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleVoteRef.current?.(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length]);

  const handleVoteRef = useRef<((value: number) => void) | null>(null);

  const itemMap = new Map(items.map((c) => [c.id, c]));
  const votedEntries = voteOrder
    .filter((id) => votes[id] != null && itemMap.has(id))
    .map((id) => ({ ...itemMap.get(id)!, vote: votes[id]! }));
  const upCount = votedEntries.filter((c) => c.vote === 1).length;
  const downCount = votedEntries.filter((c) => c.vote === -1).length;
  const totalVoted = votedEntries.length;
  const remaining = items.length - totalVoted;
  const progress = items.length > 0 ? (totalVoted / items.length) * 100 : 0;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-sm text-zinc-400">No captions to rate yet.</p>
      </div>
    );
  }

  const allDone = remaining === 0 && totalVoted > 0;
  const current = items[index];
  const currentVote = votes[current.id] ?? null;
  const isUp = currentVote === 1;
  const isDown = currentVote === -1;

  const handleVote = (value: number) => {
    const next = currentVote === value ? null : value;

    setBounceKey((k) => k + 1);
    if (next !== null) {
      setSwipeDir(value === 1 ? "right" : "left");
    }

    const captionId = current.id;
    startTransition(async () => {
      const result = await submitVote(captionId, value);
      if (result) {
        setVotes((old) => ({ ...old, [captionId]: result.vote }));
        setVoteOrder((old) => {
          const filtered = old.filter((id) => id !== captionId);
          return result.vote !== null ? [captionId, ...filtered] : filtered;
        });
      }
    });

    if (next === null) return;

    const stat = voteStats[current.id];
    let hasReaction = false;

    if (!stat || stat.total === 0) {
      const msg = pickRandom(FIRST_MESSAGES);
      setReaction({ key: Date.now(), kind: "first", ...msg });
      hasReaction = true;
    } else if (stat.total >= 3) {
      const agreement = (value === 1 ? stat.up : stat.down) / stat.total;
      if (agreement >= 0.65) {
        const msg = pickRandom(MAINSTREAM_MESSAGES);
        setReaction({ key: Date.now(), kind: "mainstream", ...msg });
        hasReaction = true;
      } else if (agreement <= 0.25) {
        const msg = pickRandom(UNIQUE_MESSAGES);
        setReaction({ key: Date.now(), kind: "unique", ...msg });
        hasReaction = true;
      }
    }

    const delay = hasReaction ? 1400 : 600;
    setTimeout(() => {
      setReaction(null);
      advance();
    }, delay);
  };

  handleVoteRef.current = handleVote;

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setCardKey((k) => k + 1);
    setSwipeDir(null);
  };
  const goNext = () => {
    setIndex((i) => Math.min(items.length - 1, i + 1));
    setCardKey((k) => k + 1);
    setSwipeDir(null);
  };

  return (
    <>
      <div ref={containerRef} className="mx-auto w-full max-w-3xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-tight text-zinc-900 sm:text-3xl">
              Rate the laughs
            </h2>
            <span className="font-mono text-xs text-zinc-400">
              {totalVoted}/{items.length}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-zinc-500">
            Tap to vote &middot; Click again to undo &middot; Use <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono text-[11px]">&larr;</kbd> <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono text-[11px]">&rarr;</kbd> keys
          </p>
        </div>

        {/* Card */}
        {allDone ? (
          <div className="animate-fade-up rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl">&#127881;</div>
            <h3 className="font-display text-2xl tracking-tight text-zinc-900">
              All rated!
            </h3>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              You voted on all {items.length} captions.
              Your humor profile: {upCount} liked, {downCount} disliked.
            </p>
            <div className="mx-auto mt-6 flex max-w-xs gap-3">
              <div className="flex-1 rounded-xl bg-amber-50 py-3">
                <p className="font-mono text-2xl font-bold text-amber-600">{upCount}</p>
                <p className="mt-0.5 text-[11px] font-medium text-amber-600/60">LOL</p>
              </div>
              <div className="flex-1 rounded-xl bg-zinc-100 py-3">
                <p className="font-mono text-2xl font-bold text-zinc-600">{downCount}</p>
                <p className="mt-0.5 text-[11px] font-medium text-zinc-400">Meh</p>
              </div>
            </div>
          </div>
        ) : (
          <div
            key={cardKey}
            className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${
              swipeDir === "left"
                ? "animate-swipe-left"
                : swipeDir === "right"
                  ? "animate-swipe-right"
                  : "animate-card-swap"
            }`}
          >
            <div className="aspect-video w-full bg-zinc-100">
              <img
                src={current.imageUrl}
                alt={current.content}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="px-8 py-6">
              <h3 className="text-lg font-semibold leading-relaxed text-zinc-900 sm:text-xl">
                {current.content}
              </h3>
            </div>
          </div>
        )}

        {/* Vote buttons */}
        {!allDone && (
          <div className="mx-auto mt-6 max-w-sm">
            <div className="flex gap-3">
              <button
                key={`down-${bounceKey}`}
                type="button"
                onClick={() => handleVote(-1)}
                disabled={isPending}
                className={`flex h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 disabled:opacity-40 ${
                  isDown
                    ? "animate-vote-bounce bg-zinc-800 text-white shadow-lg shadow-zinc-900/20"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 active:scale-95"
                }`}
                aria-label="Downvote"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                  <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Meh</span>
              </button>

              <button
                key={`up-${bounceKey}`}
                type="button"
                onClick={() => handleVote(1)}
                disabled={isPending}
                className={`flex h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 disabled:opacity-40 ${
                  isUp
                    ? "animate-vote-bounce bg-amber-400 text-zinc-900 shadow-lg shadow-amber-400/30"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95"
                }`}
                aria-label="Upvote"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                  <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">LOL</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                aria-label="Previous"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                {remaining} remaining
              </span>

              <button
                type="button"
                onClick={goNext}
                disabled={index === items.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                aria-label="Next"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Vote history */}
        <div className="mx-auto mt-8 max-w-sm border-t border-zinc-100 pt-5">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex w-full items-center justify-between text-sm"
          >
            <span className="font-medium text-zinc-700">
              Your votes
              <span className="ml-1.5 font-mono text-xs text-zinc-400">
                ({votedEntries.length})
              </span>
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-emerald-500">{upCount} up</span>
              <span className="font-mono text-[11px] text-rose-400">{downCount} down</span>
              <svg
                className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${historyOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </button>

          {historyOpen && (
            <div className="mt-3 space-y-2">
              {votedEntries.length === 0 ? (
                <p className="py-4 text-center font-mono text-xs text-zinc-400">
                  No votes yet
                </p>
              ) : (
                votedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5"
                  >
                    <img
                      src={entry.imageUrl}
                      alt={entry.content}
                      className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    />
                    <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-600">
                      {entry.content}
                    </p>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        entry.vote === 1
                          ? "bg-amber-100 text-amber-600"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {entry.vote === 1 ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {reaction &&
        createPortal(
          <div
            key={reaction.key}
            className="animate-toast pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
          >
            <div
              className={`flex items-center gap-3 rounded-2xl px-6 py-4 shadow-xl backdrop-blur ${
                reaction.kind === "mainstream"
                  ? "bg-amber-400/95 text-zinc-900"
                  : reaction.kind === "unique"
                    ? "bg-violet-500/95 text-white"
                    : "bg-zinc-800/95 text-white"
              }`}
            >
              <span className="text-2xl">
                {reaction.kind === "mainstream"
                  ? "\uD83C\uDFAF"
                  : reaction.kind === "unique"
                    ? "\uD83D\uDC8E"
                    : "\uD83D\uDE80"}
              </span>
              <div>
                <p className="text-sm font-bold">{reaction.message}</p>
                <p className={`text-xs ${
                  reaction.kind === "mainstream"
                    ? "text-zinc-800/70"
                    : "text-white/70"
                }`}>
                  {reaction.detail}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
