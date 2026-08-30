export const UserAvatarSkeleton = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
      <div className="space-y-1.5">
        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
};
