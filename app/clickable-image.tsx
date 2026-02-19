"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ClickableImageProps = {
  src: string;
  alt: string;
};

export default function ClickableImage({ src, alt }: ClickableImageProps) {
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
