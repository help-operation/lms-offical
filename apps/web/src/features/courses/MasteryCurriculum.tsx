"use client";

import { useState } from "react";
import { ChevronDown, Minus, Hand, Video } from "lucide-react";

function HandPointLeftIcon({ className, style }: { className?: string; style?: any }) {
  return (
    <svg aria-hidden="true" className={className} style={style} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M44.8 155.826h149.234c-5.841-8.248-10.57-16.558-14.153-24.918C166.248 99.098 189.778 63.986 224 64c18.616.008 32.203 10.897 40 29.092 12.122 28.286 78.648 64.329 107.534 77.323 17.857 7.956 28.453 25.479 28.464 43.845l.002.001v171.526c0 11.812-8.596 21.897-20.269 23.703-46.837 7.25-61.76 38.483-123.731 38.315-2.724-.007-13.254.195-16 .195-50.654 0-81.574-22.122-72.6-71.263-18.597-9.297-30.738-39.486-16.45-62.315-24.645-21.177-22.639-53.896-6.299-70.944H44.8c-24.15 0-44.8-20.201-44.8-43.826 0-23.283 21.35-43.826 44.8-43.826zM440 176h48c13.255 0 24 10.745 24 24v192c0 13.255-10.745 24-24 24h-48c-13.255 0-24-10.745-24-24V200c0-13.255 10.745-24 24-24zm24 212c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z" />
    </svg>
  );
}

function HandPointRightIcon({ className, style }: { className?: string; style?: any }) {
  return (
    <svg aria-hidden="true" className={className} style={style} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M512 199.652c0 23.625-20.65 43.826-44.8 43.826h-99.851c16.34 17.048 18.346 49.766-6.299 70.944 14.288 22.829 2.147 53.017-16.45 62.315C353.574 425.878 322.654 448 272 448c-2.746 0-13.276-.203-16-.195-61.971.168-76.894-31.065-123.731-38.315C120.596 407.683 112 397.599 112 385.786V214.261l.002-.001c.011-18.366 10.607-35.889 28.464-43.845 28.886-12.994 95.413-49.038 107.534-77.323 7.797-18.194 21.384-29.084 40-29.092 34.222-.014 57.752 35.098 44.119 66.908-3.583 8.359-8.312 16.67-14.153 24.918H467.2c23.45 0 44.8 20.543 44.8 43.826zM96 200v192c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V200c0-13.255 10.745-24 24-24h48c13.255 0 24 10.745 24 24zM68 368c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z" />
    </svg>
  );
}

function toBengaliNumber(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] ?? d).join('');
}

interface Lesson {
  id: number;
  title: string;
  type: string;
}

interface CourseModule {
  id: number;
  title: string;
  lessons: Lesson[];
}

export function MasteryCurriculum({ modules, header }: { modules: CourseModule[]; header?: { title?: string; moduleLabel?: string; courseTypeLabel?: string } }) {
  const headerTitle = header?.title || "কোর্স কারিকুলাম";
  const headerModuleLabel = header?.moduleLabel || "মডিউল";
  const headerCourseTypeLabel = header?.courseTypeLabel || "রেকর্ডেড কোর্স";
  const [openModules, setOpenModules] = useState<Set<number>>(() => new Set());

  const totalModules = modules.length;
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  function toggleModule(id: number) {
    setOpenModules((prev) => {
      const next = new Set<number>();
      if (!prev.has(id)) {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="py-3" style={{ background: 'transparent', backgroundImage: 'linear-gradient(180deg, #EFFFF2 0%, #FFFFFF 100%)' }}>
      <div className="mx-auto max-w-[1140px] px-[10px]">
        {/* Header */}
        <div className="text-center mb-3">
          <h2
            className="font-semibold text-black"
            style={{
              fontFamily: '"Hind Siliguri", Sans-serif',
              fontSize: 'clamp(30px, 5vw, 35px)',
            }}
          >
            {headerTitle}
          </h2>
          <div className="flex items-center justify-center gap-5" style={{ fontFamily: '"Hind Siliguri", Sans-serif' }}>
            <span className="flex items-center gap-2 text-purple-600">
              <svg aria-hidden="true" className="h-5 w-5 text-orange-500" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 448c0 17.7 14.3 32 32 32h160V320H32v128zm256 32h160c17.7 0 32-14.3 32-32V320H288v160zm192-320h-42.1c6.2-12.1 10.1-25.5 10.1-40 0-48.5-39.5-88-88-88-41.6 0-68.5 21.3-103 68.3-34.5-47-61.4-68.3-103-68.3-48.5 0-88 39.5-88 88 0 14.5 3.8 27.9 10.1 40H32c-17.7 0-32 14.3-32 32v80c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16v-80c0-17.7-14.3-32-32-32zm-326.1 0c-22.1 0-40-17.9-40-40s17.9-40 40-40c19.9 0 34.6 3.3 86.1 80h-86.1zm206.1 0h-86.1c51.4-76.5 65.7-80 86.1-80 22.1 0 40 17.9 40 40s-17.9 40-40 40z" />
              </svg>
              <span className="font-semibold text-[12px] sm:text-[18px]">{toBengaliNumber(totalModules)}</span>
              <span className="font-semibold text-[12px] sm:text-[18px]">{headerModuleLabel}</span>
            </span>
            <span className="flex items-center gap-2 text-purple-600">
              <Video className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-[12px] sm:text-[18px]">{headerCourseTypeLabel}</span>
            </span>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-3 w-full">
          {modules.map((mod, index) => {
            const isOpen = openModules.has(mod.id);
            return (
              <div
                key={mod.id}
                className="rounded-sm border border-gray-200 bg-white overflow-hidden transition-all duration-300"
              >
                {/* Module Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`w-full flex items-center justify-between p-[15px] sm:px-5 sm:py-4 text-left transition-all duration-300 rounded-sm ${isOpen
                      ? "bg-purple-700 text-white"
                      : "bg-[#F5F5F5] border border-black hover:bg-gray-100"
                    }`}
                >
                <span
                  className="font-normal truncate pr-4"
                  style={{
                    fontFamily: '"Poppins", Sans-serif',
                    fontSize: 'clamp(12px, 2.5vw, 20px)',
                    lineHeight: '30px',
                    color: isOpen ? '#ffffff' : '#000000',
                  }}
                >
                    {mod.title}
                  </span>
                  {isOpen ? (
                    <Minus className="h-5 w-5 shrink-0 text-white" />
                  ) : (
                    <HandPointLeftIcon className="h-5 w-5 shrink-0 text-gray-600" />
                  )}
                </button>

                {/* Lessons */}
                <div
                  className="transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: isOpen ? `${mod.lessons.length * 52 + 24}px` : "0px",
                    opacity: isOpen ? 1 : 0,
                    overflow: "hidden",
                  }}
                >
                  <div className="px-5 py-3">
                    {mod.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 py-[5px] pl-2 pr-3"
                      >
                        <HandPointRightIcon className="h-4 w-4 text-purple-500 shrink-0" />
                        <span
                          className="font-normal text-gray-600 hover:text-[rgb(255,0,0)] transition-colors"
                          style={{
                            fontFamily: '"Poppins", Sans-serif',
                            fontSize: 'clamp(13px, 2.5vw, 20px)',
                          }}
                        >
                          {lesson.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
