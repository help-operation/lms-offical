interface LiveBadgeProps {
  label?: string;
  color?: string;
  className?: string;
}

export function LiveBadge({ label = "Live Course", color, className = "" }: LiveBadgeProps) {
  return (
    <span
      className={`live-badge-glow flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white ${
        color ? "" : "bg-red-600"
      } ${className}`}
      style={color ? { backgroundColor: color } : undefined}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      {label}
    </span>
  );
}
