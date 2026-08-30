"use client";

interface MuxPlayerProps {
  playbackId: string;
  title?: string;
  autoPlay?: boolean;
}

export default function MuxPlayer({ playbackId, title, autoPlay = false }: MuxPlayerProps) {
  return (
    <div className="relative aspect-video bg-black">
      <iframe
        src={`https://player.mux.com/${playbackId}?autoplay=${autoPlay ? "true" : "false"}&muted=${autoPlay ? "true" : "false"}`}
        title={title ?? "Course preview"}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
