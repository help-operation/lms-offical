import { Calendar, Video, Headphones, Users } from "lucide-react";

export interface BatchInfoItem {
  label: string;
  value: string;
  bgColor: string;
}

const ICONS: Record<number, React.ReactNode> = {
  0: <Calendar className="h-4 w-4" />,
  1: <Video className="h-4 w-4" />,
  2: <Headphones className="h-4 w-4" />,
  3: <Users className="h-4 w-4" />,
};

const DEFAULT_ITEMS: BatchInfoItem[] = [
  { label: "ব্যাচ গ্রুপ", value: "১০ প্রচলিত", bgColor: "bg-blue-50" },
  { label: "লাইভ ক্লাস", value: "রাত 9:00 - 10:30 (শুক্র,শনি)", bgColor: "bg-orange-50" },
  { label: "সাপোর্টি ক্লাস", value: "রাত 9:30 - 11:30", bgColor: "bg-green-50" },
  { label: "সিট বাকি", value: "৫০ টি", bgColor: "bg-pink-50" },
];

export function MasteryBatchInfo({ items }: { items?: BatchInfoItem[] }) {
  const list = items && items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-[10px] py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {list.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-xl flex items-start gap-2 sm:gap-3 w-full sm:w-[270px] sm:h-[84.5px] px-[18px] py-4`}
          >
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/80 text-gray-600 shrink-0">
              {ICONS[index] ?? ICONS[0]}
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-semibold text-gray-800 truncate">{item.label}</p>
              <p className="text-[13px] text-gray-500 mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
