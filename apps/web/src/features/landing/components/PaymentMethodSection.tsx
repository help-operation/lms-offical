export type PaymentMethodContent = {
  title?: string;
  subtitle?: string;
  methods?: { name: string; action: string; color?: string; image?: string }[];
};

type Props = { content?: PaymentMethodContent };

// Styling map keyed by `color` token — keeps the rotating gradient + card colors deterministic
const COLOR_STYLES: Record<string, { cardBg: string; logoColor: string; spin: string }> = {
  sky:    { cardBg: "bg-sky-100 dark:bg-gray-800",    logoColor: "text-blue-800 dark:text-blue-400",     spin: "bg-[conic-gradient(from_0deg,transparent_0deg,#2563eb_70deg,transparent_200deg,transparent_360deg)]" },
  pink:   { cardBg: "bg-pink-100 dark:bg-gray-800",   logoColor: "text-pink-600 dark:text-pink-400",     spin: "bg-[conic-gradient(from_0deg,transparent_0deg,#ec4899_70deg,transparent_200deg,transparent_360deg)]" },
  purple: { cardBg: "bg-purple-100 dark:bg-gray-800", logoColor: "text-purple-700 dark:text-purple-400", spin: "bg-[conic-gradient(from_0deg,transparent_0deg,#7c3aed_70deg,transparent_200deg,transparent_360deg)]" },
  orange: { cardBg: "bg-orange-100 dark:bg-gray-800", logoColor: "text-orange-600 dark:text-orange-400", spin: "bg-[conic-gradient(from_0deg,transparent_0deg,#f97316_70deg,transparent_200deg,transparent_360deg)]" },
  green:  { cardBg: "bg-green-100 dark:bg-gray-800",  logoColor: "text-green-700 dark:text-green-400",   spin: "bg-[conic-gradient(from_0deg,transparent_0deg,#16a34a_70deg,transparent_200deg,transparent_360deg)]" },
  gray:   { cardBg: "bg-gray-100 dark:bg-gray-800",   logoColor: "text-gray-700 dark:text-gray-300",     spin: "bg-[conic-gradient(from_0deg,transparent_0deg,#6b7280_70deg,transparent_200deg,transparent_360deg)]" },
};

const DEFAULTS: PaymentMethodContent = {
  title:    "Payment Method",
  subtitle: "Pay hassle-free and securely.",
  methods: [
    { name: "SSLCOMMERZ", color: "sky",    action: "Card" },
    { name: "bKash",      color: "pink",   action: "01973-173371" },
    { name: "Rocket",     color: "purple", action: "01973-173371" },
    { name: "নগদ",         color: "orange", action: "01973-173371" },
  ],
};

const PaymentMethodSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<PaymentMethodContent>;
  const methods = Array.isArray(d.methods) && d.methods.length > 0 ? d.methods : DEFAULTS.methods ?? [];

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[40px] font-bold text-gray-900 dark:text-white">
          {d.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-base text-gray-500 dark:text-gray-400">
          {d.subtitle}
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {methods.map((m, i) => {
            const style = COLOR_STYLES[m.color ?? "gray"] ?? COLOR_STYLES.gray!;
            return (
              <div
                key={i}
                className="relative isolate overflow-hidden rounded-2xl p-[2px] shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Rotating gradient border */}
                <span
                  className={`absolute -inset-[100%] animate-spin [animation-duration:8s] ${style.spin}`}
                />

                {/* Card content */}
                <div
                  className={`relative z-10 rounded-[14px] ${style.cardBg} px-6 pb-7 pt-8`}
                >
                  <div className="flex h-14 items-center justify-center px-4">
                    {m.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image}
                        alt={m.name}
                        className="max-h-12 max-w-full w-auto object-contain"
                      />
                    ) : (
                      <span className={`text-2xl font-extrabold tracking-tight ${style.logoColor}`}>
                        {m.name}
                      </span>
                    )}
                  </div>

                  <button className="mx-auto mt-5 block w-[78%] cursor-pointer rounded-md bg-gradient-to-r from-brand-from to-brand-to py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.03]">
                    {m.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodSection;
