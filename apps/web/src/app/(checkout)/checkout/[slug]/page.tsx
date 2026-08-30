import { redirect, notFound } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { CheckoutClient } from "@/features/checkout/CheckoutClient";
import { getCheckoutPaymentImage } from "@/features/cms/api/settings";

export const metadata = { title: "Checkout" };

interface CheckoutSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutSlugPage({ params }: CheckoutSlugPageProps) {
  const { slug } = await params;

  // Guests allowed — CheckoutClient adapts UI + captures lead on submit.
  const user = await authApi.me().catch(() => null);

  const res = await coursesApi.detail(slug).catch(() => null);
  if (!res?.data) notFound();

  const course = res.data;

  // Only check enrollment for logged-in users; guests can't be enrolled yet.
  if (user) {
    const enrollmentStatus = await enrollmentsApi.enrollmentStatus(course.id).catch(() => null);
    if (enrollmentStatus?.data?.enrolled) redirect(`/learn/${slug}`);
  }

  const price = parseFloat(course.price);
  const discountPrice = course.discountPrice ? parseFloat(course.discountPrice) : null;

  const courses = [
    {
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      price,
      discountPrice,
    },
  ];

  const checkoutImageUrl = await getCheckoutPaymentImage().catch(() => null);

  return (
    <main className="bg-gray-50 dark:bg-gray-950">
      <CheckoutClient courses={courses} initialDiscount={0} isLoggedIn={!!user} checkoutImageUrl={checkoutImageUrl} />
    </main>
  );
}
