"use client";

import { Mail } from "lucide-react";

export function NewsletterBox() {
  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-purple-50 p-5 dark:border-brand-500/20 dark:from-brand-500/5 dark:to-purple-500/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
          <Mail className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Stay Updated
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Get the latest posts delivered straight to your inbox. No spam, unsubscribe anytime.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem("email") as HTMLInputElement;
          if (input?.value) {
            input.value = "";
            alert("Thank you for subscribing!");
          }
        }}
        className="space-y-2"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-brand-500/30 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
