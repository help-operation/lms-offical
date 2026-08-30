"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type FormState = {
  name: string;
  email: string;
  phone: string;
  expertise: string;
  experience: string;
  motivation: string;
  portfolioUrl: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  expertise: "",
  experience: "",
  motivation: "",
  portfolioUrl: "",
};

export function JoinAsInstructorClient({ title, subtitle }: { title: string; subtitle: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/instructor-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          portfolioUrl: form.portfolioUrl || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to submit");
      setSent(true);
      setForm(EMPTY);
    } catch (err: any) {
      setError(err?.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-500 max-w-md">
          Thank you for applying to become an instructor. We&rsquo;ll review your application and get back to you via email.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-brand-600 hover:underline"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
          <p className="text-gray-500">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={set("name")}
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+880 1700 000000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Area of Expertise <span className="text-red-500">*</span></label>
              <input
                value={form.expertise}
                onChange={set("expertise")}
                required
                placeholder="e.g. Web Development, Data Science"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teaching / Professional Experience <span className="text-red-500">*</span></label>
            <textarea
              value={form.experience}
              onChange={set("experience")}
              required
              rows={4}
              placeholder="Describe your teaching or professional experience…"
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Why do you want to teach here? <span className="text-red-500">*</span></label>
            <textarea
              value={form.motivation}
              onChange={set("motivation")}
              required
              rows={4}
              placeholder="Tell us your motivation for becoming an instructor…"
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Portfolio / LinkedIn URL</label>
            <input
              type="url"
              value={form.portfolioUrl}
              onChange={set("portfolioUrl")}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </section>
  );
}
