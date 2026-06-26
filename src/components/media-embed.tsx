type Props = {
  type: string | null | undefined;
  url: string | null | undefined;
  onClick?: () => void;
};

function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
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
  const wrap = (child: React.ReactNode) => (
    <div className="aspect-video w-full bg-black overflow-hidden" onClick={onClick}>
      {child}
    </div>
  );

  if (type === "youtube") {
    const id = ytId(url);
    if (id) return wrap(<iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />);
  }
  if (type === "vimeo") {
    const id = vimeoId(url);
    if (id) return wrap(<iframe className="w-full h-full" src={`https://player.vimeo.com/video/${id}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />);
  }
  if (type === "matterport" || type === "cloudpano" || type === "iframe" || type === "mux") {
    return wrap(<iframe className="w-full h-full" src={url} allow="xr-spatial-tracking; fullscreen" allowFullScreen />);
  }
  if (type === "video_url") {
    return wrap(<video className="w-full h-full" src={url} controls playsInline />);
  }
  // Fallback iframe
  return wrap(<iframe className="w-full h-full" src={url} allowFullScreen />);
}
