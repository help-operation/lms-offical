import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { coursesApi } from "@/features/courses/api";
import { ordersApi } from "@/features/payments/api/orders";
import { CheckoutClient } from "@/features/checkout/CheckoutClient";
import { getCheckoutPaymentImage } from "@/features/cms/api/settings";

export const metadata = { title: "Checkout" };

interface CheckoutPageProps {
  searchParams: Promise<{ courseIds?: string; coupon?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  // Guests are allowed — the CheckoutClient renders an extra "Your Information"
  // form when `user` is null and captures the submission as a lead.
  const user = await authApi.me().catch(() => null);

  const params = await searchParams;
  const courseIdList = (params.courseIds ?? "")
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  if (courseIdList.length === 0) redirect("/cart");

  // Fetch the published course list ONCE and resolve the cart ids against it,
  // preserving cart order (previously this fetched up to 100 courses per cart
  // item — an N+1 — plus an unused duplicate fetch).
  const allCoursesRes = await coursesApi.list({ page: 1, limit: 100 }).catch(() => null);
  const courseById = new Map((allCoursesRes?.data ?? []).map((c) => [c.id, c]));

  const courses = courseIdList
    .map((id) => courseById.get(id))
    .filter((c): c is NonNullable<typeof c> => c != null)
    .map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      thumbnail: c.thumbnail,
      price: parseFloat(c.price),
      discountPrice: c.discountPrice ? parseFloat(c.discountPrice) : null,
    }));

  if (courses.length === 0) redirect("/cart");

  let initialDiscount = 0;
  const couponCode = params.coupon;
  if (couponCode) {
    const res = await ordersApi.validateCoupon(couponCode, courses.map((c) => c.id)).catch(() => null);
    initialDiscount = res?.data?.discountAmount ?? 0;
  }

  const checkoutImageUrl = await getCheckoutPaymentImage().catch(() => null);

  return (
    <main className="bg-gray-50 dark:bg-gray-950">
      <CheckoutClient
        courses={courses}
        couponCode={couponCode}
        initialDiscount={initialDiscount}
        isLoggedIn={!!user}
        checkoutImageUrl={checkoutImageUrl}
      />
    </main>
  );
}
