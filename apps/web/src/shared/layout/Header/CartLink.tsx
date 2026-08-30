import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { authApi } from "@/features/auth/api";

// Web app is for STUDENT and GUEST only — treat any other role as unauthenticated.
const WEB_ROLES = new Set(["STUDENT", "GUEST"]);

export async function CartLink() {
  const res = await authApi.me().catch(() => null);
  const isLoggedIn = !!(res && WEB_ROLES.has(res.data.role));

  if (!isLoggedIn) return null;

  return (
    <Link
      href="/cart"
      className="relative inline-flex text-gray-600 dark:text-gray-300 hover:text-brand-solid transition-colors"
      aria-label="Shopping Cart"
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-solid text-[10px] font-semibold leading-none text-white">
        0
      </span>
    </Link>
  );
}
