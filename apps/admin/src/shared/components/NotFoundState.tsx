import Link from "next/link";
import { Button } from "@repo/ui/button";

interface NotFoundStateProps {
  title?: string;
  message?: string;
  homeHref?: string;
  homeLabel?: string;
}

export function NotFoundState({
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has been moved.",
  homeHref = "/",
  homeLabel = "Back to dashboard",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">{message}</p>
      <Button asChild className="mt-6">
        <Link href={homeHref}>{homeLabel}</Link>
      </Button>
    </div>
  );
}
