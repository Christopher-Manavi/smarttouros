import { useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  /** If true, render nothing on error/missing. If false, render a placeholder card. */
  hideOnError?: boolean;
  loading?: "lazy" | "eager";
};

/**
 * Image with safe fallback: never shows the browser's broken-image icon.
 * - Missing/empty src → hide or placeholder
 * - Network/load error → hide or placeholder
 */
export function SmartImage({ src, alt = "", className, hideOnError = false, loading = "lazy" }: Props) {
  const [errored, setErrored] = useState(false);
  const missing = !src || !src.trim();

  if (missing || errored) {
    if (hideOnError) return null;
    return (
      <div
        className={`flex flex-col items-center justify-center bg-muted/40 text-muted-foreground text-xs gap-2 ${className ?? ""}`}
        aria-label="Image unavailable"
      >
        <ImageOff className="h-5 w-5 opacity-60" />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
