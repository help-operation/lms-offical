import { getCachedPage } from "@/features/cms/api/pages";

export const metadata = { title: "Terms & Conditions | LearnHub" };

export default async function TermsConditionsPage() {
  const page = await getCachedPage("terms-conditions");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 bg-white dark:bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{page?.title ?? "Terms & Conditions"}</h1>
      {page?.content ? (
        <div
          className="prose prose-gray max-w-none dark:text-gray-300 dark:[&_h1]:text-white dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_h4]:text-white dark:[&_strong]:text-white dark:[&_a]:text-brand-400 dark:[&_blockquote]:border-gray-700 dark:[&_hr]:border-gray-700"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Content coming soon.</p>
      )}
    </main>
  );
}
