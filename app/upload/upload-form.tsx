"use client";

import { useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const API_BASE = "https://api.almostcrackd.ai";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

type Caption = {
  id: string;
  content: string;
  [key: string]: unknown;
};

type UploadFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export default function UploadForm({
  supabaseUrl,
  supabaseAnonKey,
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function getAccessToken(): Promise<string> {
    const supabase = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated. Please sign in again.");
    }
    return session.access_token;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Unsupported file type. Please use JPEG, JPG, PNG, WebP, GIF, or HEIC.");
      return;
    }

    setFile(selected);
    setError("");
    setCaptions([]);
    setPreview(URL.createObjectURL(selected));
  }

  function handleRemove() {
    setFile(null);
    setPreview(null);
    setCaptions([]);
    setError("");
    setStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError("");
    setCaptions([]);

    try {
      const token = await getAccessToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Step 1: Generate presigned URL
      setStatus("Generating upload URL...");
      const step1Res = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers,
        body: JSON.stringify({ contentType: file.type }),
      });

      if (!step1Res.ok) {
        throw new Error(`Failed to generate upload URL (${step1Res.status})`);
      }

      const { presignedUrl, cdnUrl } = await step1Res.json();

      // Step 2: Upload image bytes
      setStatus("Uploading image...");
      const step2Res = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!step2Res.ok) {
        throw new Error(`Failed to upload image (${step2Res.status})`);
      }

      // Step 3: Register image URL
      setStatus("Registering image...");
      const step3Res = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
        method: "POST",
        headers,
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });

      if (!step3Res.ok) {
        throw new Error(`Failed to register image (${step3Res.status})`);
      }

      const { imageId } = await step3Res.json();

      // Step 4: Generate captions
      setStatus("Generating captions...");
      const step4Res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ imageId }),
      });

      if (!step4Res.ok) {
        throw new Error(`Failed to generate captions (${step4Res.status})`);
      }

      const captionData = await step4Res.json();
      const captionList = Array.isArray(captionData) ? captionData : captionData.captions ?? [];
      setCaptions(captionList);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-6" style={{ animationDelay: "100ms" }}>
      {/* File input area */}
      <div
        className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 transition-colors hover:border-zinc-300"
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="w-full">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-80 rounded-lg object-contain"
            />
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm text-zinc-500">{file?.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-900"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <svg
              className="mb-3 h-10 w-10 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium text-zinc-500">
              Click to select an image
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              JPEG, JPG, PNG, WebP, GIF, or HEIC
            </p>
          </>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? status || "Processing..." : "Generate Captions"}
      </button>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Captions display */}
      {captions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-zinc-900">
            Generated Captions
          </h3>
          <div className="space-y-2">
            {captions.map((caption, index) => (
              <div
                key={caption.id ?? index}
                className="animate-card-in rounded-lg border border-zinc-200 bg-white px-5 py-4 text-sm leading-relaxed text-zinc-700"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {caption.content ?? JSON.stringify(caption)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
