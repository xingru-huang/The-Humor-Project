"use client";

import { useEffect, useState } from "react";

type ClickableImageProps = {
  src: string;
  alt: string;
};

export default function ClickableImage({ src, alt }: ClickableImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in"
        aria-label="Open image preview"
      >
        <img src={src} alt={alt} className="aspect-4/3 w-full object-cover" loading="lazy" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-md border border-white/25 bg-black/40 px-3 py-1.5 text-sm text-white"
          >
            Close
          </button>

          <div onClick={(event) => event.stopPropagation()}>
            <img src={src} alt={alt} className="max-h-[88vh] max-w-[95vw] object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
