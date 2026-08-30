"use client";

import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactMessageSchema, type ContactMessageInput } from "@repo/validators";
import { toast } from "@repo/ui/sonner";
import { Send, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const FIELD_CLASSES =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-500 dark:focus-visible:ring-brand-500/30";

const FIELD_ERROR_CLASSES =
  "border-red-400 focus:border-red-500 focus-visible:ring-red-400/40 dark:border-red-500 dark:focus:border-red-500 dark:focus-visible:ring-red-500/30";

export function ContactClient({ image }: { image: string }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(ContactMessageSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (data: ContactMessageInput) => {
    try {
      const res = await fetch(`${API_URL}/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Message sent! We'll get back to you soon.");
      reset();
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const onInvalid = (formErrors: FieldErrors<ContactMessageInput>) => {
    const firstError = Object.values(formErrors)[0]?.message;
    toast.error(firstError ?? "Please check the form and try again.");
  };

  return (
    <section className="bg-white py-8 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-12">
      <div className="container mx-auto px-4">
        <div className="relative grid overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-800 sm:rounded-3xl lg:grid-cols-2">
          {/* Recurring ring accent */}
          <span className="absolute left-1/2 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white ring-2 ring-brand-300 dark:bg-gray-900 dark:ring-brand-500/40 lg:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-brand-400" />
          </span>

          {/* Image */}
          <div className="relative h-56 sm:h-72 lg:h-auto">
            <img
              src={image}
              alt="Speaker"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 lg:p-12">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl md:text-3xl">
              How can we help?
            </h2>
            <p className="mt-2 text-sm text-ink-soft dark:text-gray-400">
              Let us know if you have any questions or feedback.
            </p>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="mt-6 flex flex-col gap-4">
              <label className="sr-only" htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                placeholder="Enter your name"
                {...register("name")}
                className={`${FIELD_CLASSES} ${errors.name ? FIELD_ERROR_CLASSES : ""}`}
              />

              <label className="sr-only" htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                className={`${FIELD_CLASSES} ${errors.email ? FIELD_ERROR_CLASSES : ""}`}
              />

              <label className="sr-only" htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                placeholder="Enter subject"
                {...register("subject")}
                className={`${FIELD_CLASSES} ${errors.subject ? FIELD_ERROR_CLASSES : ""}`}
              />

              <label className="sr-only" htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                placeholder="Write your message..."
                rows={5}
                {...register("message")}
                className={`${FIELD_CLASSES} resize-none ${errors.message ? FIELD_ERROR_CLASSES : ""}`}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-from to-brand-to py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 dark:focus-visible:ring-offset-gray-800"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
