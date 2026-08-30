export interface WhyDifferentFeature {
  title: string;
  description: string;
  image: string;
  bgColor: string;
}

export interface WhyDifferentStat {
  value: string;
  label: string;
  bgColor: string;
}

export interface WhyDifferentData {
  title?: string;
  features: WhyDifferentFeature[];
  stats: WhyDifferentStat[];
}

const DEFAULT_FEATURES: WhyDifferentFeature[] = [
  { title: "Live Class", description: "২৪ টি লাইভ ইন্টারঅ্যাকটিভ ক্লাস। সপ্তাহে ২ দিন নির্ধারিত ক্লাস", image: "", bgColor: "bg-red-50 border-red-100" },
  { title: "Job Placement Support", description: "কোর্স শেষে সিভি প্রস্তুত এবং ইন্টারভিউ গাইডলাইন সাপোর্ট প্রদান করা হবে।", image: "", bgColor: "bg-green-50 border-green-100" },
  { title: "Scholarship & Reward", description: "পরীক্ষায় সর্বোচ্চ নম্বর প্রাপ্ত শিক্ষার্থী বিশেষ স্কলারশিপ ও রিওয়ার্ড পাবেন।", image: "", bgColor: "bg-blue-50 border-blue-100" },
  { title: "Assignment & Exam", description: "প্র্যাকটিকাল অ্যাসাইনমেন্ট ও ফাইনাল এক্সাম", image: "", bgColor: "bg-orange-50 border-orange-100" },
  { title: "Live Support", description: "২৪/৭ সাপোর্ট", image: "", bgColor: "bg-green-50 border-green-100" },
  { title: "Certificate", description: "ইন্টারন্যাশনাল ভ্যালিড সার্টিফিকেট", image: "", bgColor: "bg-yellow-50 border-yellow-100" },
];

const DEFAULT_STATS: WhyDifferentStat[] = [
  { value: "৩,০০০", label: "জব প্লেসমেন্ট", bgColor: "bg-green-50" },
  { value: "৯,০০০", label: "লার্নার", bgColor: "bg-blue-50" },
  { value: "৮৩%", label: "কোর্স কমপ্লিশন রেট", bgColor: "bg-yellow-50" },
  { value: "৬", label: "লাইভ এবং রেকর্ডেড কোর্স", bgColor: "bg-pink-50" },
];

export function MasteryWhyDifferent({ data }: { data?: WhyDifferentData }) {
  const title = data?.title || "Why This Course is Different?";
  const features = data?.features && data.features.length > 0 ? data.features : DEFAULT_FEATURES;
  const stats = data?.stats && data.stats.length > 0 ? data.stats : DEFAULT_STATS;

  return (
    <div className="mx-auto max-w-[1160px] px-[10px] py-10">
      <h2
        className="text-center font-bold text-black mb-8"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: '35px' }}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {features.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} border rounded-xl flex items-center`}
            style={{ width: 353, height: 100 }}
          >
            <div style={{ width: 74, height: 74 }} className="shrink-0 rounded-lg bg-white/80 flex items-center justify-center overflow-hidden ml-1.5">
              {item.image ? (
                <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-lg font-bold text-gray-400">{item.title.charAt(0)}</span>
              )}
            </div>
            <div style={{ width: 247, height: 78 }} className="flex flex-col justify-center py-1 px-3">
              <p className="text-gray-900" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 18, fontWeight: 500 }}>{item.title}</p>
              <p className="text-gray-500 mt-0.5" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 14, fontWeight: 400 }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-xl text-center flex flex-col items-center justify-center`}
            style={{ width: 265, height: 105 }}
          >
            <p className="text-gray-900" style={{ fontSize: 40, fontWeight: 600 }}>{stat.value}</p>
            <p className="text-gray-500" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 18, fontWeight: 400 }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
