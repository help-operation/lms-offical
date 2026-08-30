import { type ReactNode } from "react";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import SimpleHero from "@/features/cms/components/SimpleHero";
import ContactInfoCards from "@/features/contact/components/ContactInfoCards";
import { ContactClient } from "./ContactClient";
import { getPublicContactSettings } from "@/features/cms/api/settings";

export const metadata = { title: "Contact Us" };

type Content = Record<string, unknown>;
type Renderer = (content: Content) => ReactNode;

const as = <T,>(c: Content): T => c as unknown as T;

// Only the hero + info cards are CMS-driven. The form + map are
// transactional / external and stay hardcoded below.
const RENDERERS: Record<string, Renderer> = {
  simple_hero:  (c) => <SimpleHero       content={as(c)} />,
  contact_info: (c) => <ContactInfoCards content={as(c)} />,
};

const FALLBACK_ORDER = ["simple_hero", "contact_info"];

const DEFAULT_MAP = "https://www.google.com/maps?q=Gulshan+Badda+Link+Road+Dhaka+1212&output=embed";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=900&fit=crop";

export default async function ContactPage() {
  const [sections, generalContact] = await Promise.all([
    getPublicPageSections("contact"),
    getPublicContactSettings(),
  ]);

  const items =
    sections.length > 0
      ? sections.map((s) => ({ key: `s-${s.id}`, type: s.type, content: s.content ?? {} }))
      : FALLBACK_ORDER.map((type, i) => ({ key: `f-${i}`, type, content: {} as Content }));

  // Extract contact_image and map_embed_url from contact_info section
  const contactInfoContent = items.find((it) => it.type === "contact_info")?.content ?? {};
  const contactImage = (contactInfoContent as Record<string, string>).contact_image || DEFAULT_IMAGE;
  const mapEmbedUrl  = (contactInfoContent as Record<string, string>).map_embed_url  || DEFAULT_MAP;

  // General Settings always wins for phone/email on the contact page
  const enrichedItems = items.map((it) => {
    if (it.type !== "contact_info") return it;
    return {
      ...it,
      content: {
        ...it.content,
        phone: generalContact.general_contact_phone || (it.content as Record<string, string>).phone,
        email: generalContact.general_contact_email || (it.content as Record<string, string>).email,
      },
    };
  });

  return (
    <main className="min-h-screen bg-white transition-colors duration-300 animate-content-in dark:bg-gray-950">
      {enrichedItems.map((it) => {
        const render = RENDERERS[it.type];
        if (!render) return null;
        return <div key={it.key}>{render(it.content)}</div>;
      })}

      {/* Form with dynamic image */}
      <ContactClient image={contactImage} />

      {/* Map with dynamic embed URL */}
      <section className="pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm dark:border-gray-800 sm:rounded-3xl">
            <iframe
              title="Office Location"
              src={mapEmbedUrl}
              className="h-[320px] w-full border-0 sm:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
