import { MapPin, Phone, Clock } from "lucide-react";

export type ContactInfoContent = {
  address?: string;
  phone?: string;
  email?: string;
  hours_days?: string;
  hours_time?: string;
};

type Props = { content?: ContactInfoContent };

const DEFAULTS: Required<ContactInfoContent> = {
  address: "House 90/2, Gulshan Badda Link Rd, Dhaka 1212, Bangladesh",
  phone: "+880 1321-204263",
  email: "support@skillkoro.com",
  hours_days: "Saturday – Thursday",
  hours_time: "10:00 AM – 6:00 PM",
};

const ContactInfoCards = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };

  const cards = [
    { icon: MapPin, title: "Office Address", lines: [d.address], highlight: false },
    { icon: Phone, title: "Contact Details", lines: [d.phone, d.email], highlight: true },
    { icon: Clock, title: "Office Hours", lines: [d.hours_time, d.hours_days], highlight: false },
  ];

  return (
    <section className="bg-white py-12 transition-colors duration-300 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className={`group rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-8 ${c.highlight
                  ? "border-brand-100 bg-gray-50 shadow-sm dark:border-brand-500/20 dark:bg-gray-800"
                  : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
                  }`}
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-500/15 dark:text-brand-400">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{c.title}</h3>
                <div className="mt-2 space-y-1">
                  {c.lines.filter(Boolean).map((l) => (
                    <p
                      key={l}
                      className={`break-words text-sm ${c.highlight ? "font-semibold text-brand-600 dark:text-brand-400" : "text-ink-soft dark:text-gray-400"
                        }`}
                    >
                      {l}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactInfoCards;
