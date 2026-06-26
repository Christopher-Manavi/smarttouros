type Props = {
  type: string | null | undefined;
  url: string | null | undefined;
  onClick?: () => void;
};

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/ID, /embed/ID, /v/ID, /live/ID
      const idx = parts.findIndex((p) => ["shorts", "embed", "v", "live"].includes(p));
      if (idx >= 0 && parts[idx + 1] && /^[\w-]{11}$/.test(parts[idx + 1])) return parts[idx + 1];
    }
  } catch {
    // fall through to regex
  }
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function isYouTubeShorts(url: string): boolean {
  return /\/shorts\//i.test(url || "");
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url || "");
}

export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

// Normalize any YouTube/Shorts URL to a canonical form with the video ID only —
// strips si, feature, utm_*, and other tracking params.
export function normalizeYouTubeUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  if (isYouTubeShorts(url)) return `https://www.youtube.com/shorts/${id}`;
  return `https://www.youtube.com/watch?v=${id}`;
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function MediaEmbed({ type, url, onClick }: Props) {
  if (!url) {
    return (
      <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
        No media added
      </div>
    );
  }

  // Treat any YouTube URL as YouTube, regardless of selected type — protects
  // against users pasting a Shorts link into "Custom iframe".
  const ytId = isYouTubeUrl(url) ? extractYouTubeId(url) : type === "youtube" ? extractYouTubeId(url) : null;

  if (ytId) {
    const vertical = isYouTubeShorts(url);
    if (vertical) {
      return (
        <div className="w-full bg-black flex justify-center py-6" onClick={onClick}>
          <div className="relative w-full max-w-[420px]" style={{ aspectRatio: "9 / 16" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={youTubeEmbedUrl(ytId)}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      );
    }
    return (
      <div className="aspect-video w-full bg-black overflow-hidden" onClick={onClick}>
        <iframe
          className="w-full h-full"
          src={youTubeEmbedUrl(ytId)}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const wrap = (child: React.ReactNode) => (
    <div className="aspect-video w-full bg-black overflow-hidden" onClick={onClick}>
      {child}
    </div>
  );

  if (type === "vimeo") {
    const id = vimeoId(url);
    if (id)
      return wrap(
        <iframe
          className="w-full h-full"
          src={`https://player.vimeo.com/video/${id}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />,
      );
  }
  if (type === "matterport" || type === "cloudpano" || type === "iframe" || type === "mux") {
    return wrap(<iframe className="w-full h-full" src={url} allow="xr-spatial-tracking; fullscreen" allowFullScreen />);
  }
  if (type === "video_url") {
    return wrap(<video className="w-full h-full" src={url} controls playsInline />);
  }

  // Unknown / unembeddable — clean fallback, no broken iframe.
  return (
    <div className="aspect-video w-full bg-muted flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <p>Video preview unavailable.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 hover:text-foreground"
      >
        Open video
      </a>
    </div>
  );
}
