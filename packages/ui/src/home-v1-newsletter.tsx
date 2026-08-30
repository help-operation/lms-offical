"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export type NewsletterContent = {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  cta_label?: string;
};

type Props = { content?: NewsletterContent };

const DEFAULTS: Required<NewsletterContent> = {
  title: "Subscribe our Newsletter",
  subtitle: "Get the latest course updates and offers straight to your inbox.",
  placeholder: "Enter your email",
  cta_label: "Subscribe",
};

export function NewsletterV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<NewsletterContent>;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  }

  return (
    <section className="relative overflow-hidden bg-brand-700 py-14 text-white">
      <div className="container relative z-10 mx-auto flex flex-col items-center gap-6 px-4 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="text-2xl font-bold">{d.title}</h2>
          <p className="mt-1 text-sm text-brand-100">{d.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-white p-1.5 pl-4">
          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={d.placeholder}
            className="w-full bg-transparent py-1.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            {subscribed ? "Subscribed!" : d.cta_label}
          </button>
        </form>
      </div>
    </section>
  );
}

export default NewsletterV2;
