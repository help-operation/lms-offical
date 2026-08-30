export interface ToolInfoItem {
  name: string;
  image: string;
  bgColor: string;
}

const DEFAULT_ITEMS: ToolInfoItem[] = [
  { name: "MS Excel", image: "", bgColor: "bg-green-700" },
  { name: "MS Power point", image: "", bgColor: "bg-red-800" },
  { name: "Power BI", image: "", bgColor: "bg-yellow-500" },
  { name: "MS Word", image: "", bgColor: "bg-blue-800" },
];

export function MasteryToolsSection({ items, title }: { items?: ToolInfoItem[]; title?: string | null }) {
  const list = items && items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-[10px] py-8">
      <style>{`
        @keyframes draw {
          0%   { stroke-dashoffset: 130; opacity: 1; }
          45%  { stroke-dashoffset: 0;   opacity: 1; }
          70%  { stroke-dashoffset: 0;   opacity: 1; }
          85%  { stroke-dashoffset: 0;   opacity: 0; }
          86%  { stroke-dashoffset: 130; opacity: 0; }
          100% { stroke-dashoffset: 130; opacity: 0; }
        }
        .underline-path {
          fill: none;
          stroke: #EE1414;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 130;
          stroke-dashoffset: 130;
          animation: draw 2.6s ease-in-out infinite;
        }
      `}</style>
      <h2
        className="text-center font-semibold text-black mb-6"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(22px, 5vw, 35px)' }}
      >
        {(title ?? "যেসব টুলস ও টেকনোলজি শিখবেন").replace("শিখবেন", "")}
        <span className="relative inline-block">
          শিখবেন
          <svg className="absolute left-0 w-full" style={{ bottom: -2, height: 10 }} viewBox="0 0 100 10" preserveAspectRatio="none">
            <path className="underline-path" d="M2,7 C20,2 40,2 50,2 C60,2 80,2 98,7" />
          </svg>
        </span>
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {list.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-xl flex flex-col items-center justify-center w-full aspect-[270/115]`}
          >
            {item.image ? (
              <div className="w-[85%] h-14 sm:h-16 flex items-center justify-center">
                <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-[85%] h-14 sm:h-16 flex items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-bold text-white">{item.name.charAt(0)}</span>
                </div>
              </div>
            )}
            <div className="w-[85%] h-7 sm:h-8 flex items-center justify-center">
              <span className="text-white text-center" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(16px, 3.5vw, 30px)', fontWeight: 600 }}>{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
