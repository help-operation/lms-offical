import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { authApi } from "@/features/auth/api";
import { cartApi } from "@/features/cart/api";
import { CartPageClient } from "@/features/cart/CartPageClient";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await authApi.me().catch(() => null);
  if (!user) redirect("/login?redirect=/cart");

  const res = await cartApi.getCart().catch(() => null);
  const items = res?.data ?? [];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-tint/40 blur-3xl dark:bg-brand-600/25" />

        <div className="container relative mx-auto px-4 py-16 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl md:text-[44px] font-bold text-accent dark:text-white">
            Your Cart <ShoppingCart className="h-8 w-8" />
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base dark:text-gray-400">
            Review your courses and start your learning journey.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <CartPageClient initialItems={items} />
      </div>
    </main>
  );
}
