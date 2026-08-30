import { FAQClient, type FAQCategory } from "@/app/(public)/faq/FAQClient";

export type FAQMainContent = {
  categories?: FAQCategory[];
};

type Props = { content?: FAQMainContent };

const DEFAULTS: Required<FAQMainContent> = {
  categories: [
    {
      id: "payment",
      title: "Payment & Enrollment related questions",
      questions: [
        { q: "What is the course enrollment process like?",          a: "Pick your course, click enroll, complete the payment, and you instantly get access from your course dashboard — the whole process takes under a minute." },
        { q: "What payment options are available?",                  a: "We accept bKash, Nagad, Rocket, and all major debit/credit cards via SSLCommerz. Every transaction is secured with SSL encryption." },
        { q: "Can I pay in installments?",                            a: "Selected premium courses support installment payments. The available installment plan is shown on the course's checkout page." },
        { q: "Is there any refund option after purchasing a course?", a: "Yes — we offer a no-questions-asked money-back guarantee within the refund window. Just contact our support team with your order details." },
      ],
    },
    {
      id: "support",
      title: "Technical & Support related questions",
      questions: [
        { q: "Do I need any special software or hardware to view the courses?", a: "No. Any modern browser on a phone, tablet, or computer with an internet connection is enough — no special software or hardware required." },
        { q: "Who do I contact if I face a problem during a course?",            a: "Use our community group or one-to-one support, or reach out via the Contact page. Our support team responds quickly during office hours." },
        { q: "How do I access my course dashboard?",                             a: "Log in to your account and open the dashboard from your profile menu. All enrolled courses, progress, and certificates live there." },
      ],
    },
  ],
};

const FAQMain = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const categories = Array.isArray(d.categories) && d.categories.length > 0
    ? d.categories
    : DEFAULTS.categories;

  return <FAQClient categories={categories} />;
};

export default FAQMain;
