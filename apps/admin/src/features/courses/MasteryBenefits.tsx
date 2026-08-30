"use client";

export interface BenefitItem {
  title: string;
  description: string;
  image: string;
}

export interface BenefitsData {
  title?: string;
  subtitle?: string;
  items: BenefitItem[];
}

const DEFAULT_BENEFITS: BenefitItem[] = [
  {
    title: "ক্যারিয়ার রেডিত লাইভ/রেকর্ডেড কোর্স",
    description: "আমাদের কোর্সগুলো এমনভাবে তৈরি করা যাতে আপনি আমাদের ক্যারিয়ারের গ্রাউন্ড পাতাতে পারেন।",
    image: "",
  },
  {
    title: "জুম লাইভ সাপোর্ট সেশন",
    description: "আমাদের প্রতিটি ক্লাস / সাপোর্ট সেশন ভিডিও জুম (zoom) আপনার মাধ্যমে নতুন যত করে আপনি হিসাবে লাইভ ক্লাস উপভোগ করতে পারবেন।",
    image: "",
  },
  {
    title: "রিয়েলটাইম স্টুডেন্ট ট্র্যাকিং",
    description: "২৪/৭ ড্যাশবোর্ড সাপোর্ট সেশন সর্বাধিক একটি ক্লাস এবং সাথে থাকার ক্লাসের মাধ্যমে প্রগতির দৃষ্টির সাথে সময় হৈ সময় সেশন।",
    image: "",
  },
  {
    title: "কোর্স ভিডিও ডাউনলোড",
    description: "ওয়েবসাইট থেকে ডাউনলোড করার পারবেন এবং আমাদের এই ভিডিও গুলো আপনি নিজের কি সময়ে দেখতে পারবেন।",
    image: "",
  },
];

export function MasteryBenefits({ data }: { data?: BenefitsData }) {
  const title = data?.title || "কি কি পাচ্ছেন মাস্টারির কোর্স";
  const subtitle = data?.subtitle || "দেখে নিন কি কি পাচ্ছেন মাস্টারির কোর্সজয়েন করলে";
  const items = data?.items && data.items.length > 0 ? data.items : DEFAULT_BENEFITS;

  return (
    <div className="mx-auto max-w-[1160px] px-[10px] py-10">
      <h2
        className="text-center font-bold text-black mb-3"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: '35px' }}
      >
        {title}
      </h2>
      <p
        className="text-center text-gray-500 mb-8"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: '16px' }}
      >
        {subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
            style={{ width: 550, height: 141, padding: '11px' }}
          >
            <div style={{ width: 119, height: 119 }} className="shrink-0 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                  <span className="text-2xl font-bold text-purple-400">{index + 1}</span>
                </div>
              )}
            </div>
            <div style={{ width: 398, height: 78 }} className="flex flex-col justify-center min-w-0">
              <h3
                className="text-gray-900 mb-1"
                style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 18, fontWeight: 500, lineHeight: '26px', color: '#101828' }}
              >
                {item.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 14, fontWeight: 400, lineHeight: '26px', color: '#1D2939' }}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
