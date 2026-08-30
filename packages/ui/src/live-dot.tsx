interface LiveDotProps {
  className?: string;
  color?: string;
}

/** Pulsing "live" indicator dot — a ping ripple behind a solid dot. */
export function LiveDot({ className = "h-2 w-2", color = "bg-red-500" }: LiveDotProps) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex ${className} rounded-full ${color}`} />
    </span>
  );
}
