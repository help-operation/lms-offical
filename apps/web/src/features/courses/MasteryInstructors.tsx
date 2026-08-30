"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface InstructorInfo {
  name: string;
  role: string;
  photo: string;
  years: string;
  clients: string;
  projects: string;
  yearsLabel?: string;
  clientsLabel?: string;
  projectsLabel?: string;
  summary: string;
  skills: string[];
  experience: string[];
  companies: { name: string; logo: string }[];
}

export interface InstructorsData {
  title?: string;
  instructors?: InstructorInfo[];
}

const DEFAULT_INSTRUCTORS: InstructorInfo[] = [
  {
    name: "Imran Hossan",
    role: "Excel & Power BI Expert",
    photo: "",
    years: "10+",
    clients: "100+",
    projects: "200+",
    summary: "Excel specialist with 10+ years of experience in automation, financial modeling and business dashboards.",
    skills: ["Advanced Excel & VBA", "Power Query & DAX", "Dynamic Dashboards", "Financial Modeling"],
    experience: ["Corporate Instructor (2023–Present)", "Excel Specialist – JTI (2015–Present)", "Excel Developer (2014–2020)"],
    companies: [],
  },
];

export function MasteryInstructors({ data }: { data?: InstructorsData }) {
  const title = data?.title || "Our Professional Instructors";
  const instructors = data?.instructors && data.instructors.length > 0 ? data.instructors : DEFAULT_INSTRUCTORS;
  const [selected, setSelected] = useState<InstructorInfo | null>(null);

  return (
    <div className="bg-purple-50">
    <div className="mx-auto max-w-[1160px] px-4 sm:px-[10px] pt-5 pb-10">
      <h2
        className="text-center font-bold text-black mb-1"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(24px, 5vw, 35px)' }}
      >
        {title}
      </h2>

      <div className={`grid gap-4 sm:gap-6 ${instructors.length === 1 ? "grid-cols-1 justify-items-center" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {instructors.map((inst, index) => (
          <div
            key={index}
            className="bg-white rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl w-full max-w-[350px]"
            style={{ padding: 'clamp(16px, 3vw, 25px)', boxShadow: '0 8px 25px rgba(0,0,0,.06)' }}
          >
            {/* Photo */}
            <div className="w-full aspect-[300/260] bg-gray-200 overflow-hidden rounded-xl mx-auto">
              {inst.photo ? (
                <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                  <span className="text-4xl font-bold text-white">{inst.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pt-4 text-center">
              <h3 style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', fontWeight: 'normal' }} className="text-gray-900">{inst.name}</h3>
              <p className="text-sm" style={{ color: '#666', marginBottom: 18 }}>{inst.role}</p>

              {/* Stats */}
              <div className="flex justify-between w-[80%] mx-auto">
                <div className="text-center">
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4d' }}>{inst.years}</p>
                  <p className="text-xs text-gray-400">{inst.yearsLabel || "Years"}</p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4d' }}>{inst.clients}</p>
                  <p className="text-xs text-gray-400">{inst.clientsLabel || "Clients"}</p>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4d' }}>{inst.projects}</p>
                  <p className="text-xs text-gray-400">{inst.projectsLabel || "Projects"}</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setSelected(inst)}
                style={{ width: '100%', padding: 10, background: '#000', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}
                className="mt-5 text-sm uppercase tracking-wide"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div
            style={{ width: "100%", maxWidth: 850, maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 12, position: "relative", fontFamily: '"Hind Siliguri", sans-serif' }}
            className="shadow-2xl mx-4 my-8 sm:m-0 py-10 px-4 sm:p-[25px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
              {/* Left: photo + name + stats */}
              <div className="shrink-0 text-center sm:pr-6 sm:border-r sm:border-[#eee] mx-auto sm:mx-0" style={{ width: 230 }}>
                <div style={{ width: 140, height: 140 }} className="rounded-xl overflow-hidden bg-gray-200 mx-auto">
                  {selected.photo ? (
                    <img src={selected.photo} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                      <span className="text-3xl font-bold text-white">{selected.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: "normal" }} className="text-gray-900 mt-3">{selected.name}</h3>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>{selected.role}</p>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-500">{selected.years}</p>
                    <p className="text-xs text-gray-400">{selected.yearsLabel || "Years"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-500">{selected.clients}</p>
                    <p className="text-xs text-gray-400">{selected.clientsLabel || "Clients"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-500">{selected.projects}</p>
                    <p className="text-xs text-gray-400">{selected.projectsLabel || "Projects"}</p>
                  </div>
                </div>
              </div>

              {/* Right: details */}
              <div className="flex-1 min-w-0">

                {selected.summary && (
                  <div className="mb-4">
                    <h4 style={{ fontSize: 13, fontWeight: 600, borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8, color: "rgb(0,0,0)" }}>Summary</h4>
                    <p style={{ fontSize: 13, color: "rgb(0,0,0)" }}>{selected.summary}</p>
                  </div>
                )}

                {selected.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 style={{ fontSize: 13, fontWeight: 600, borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8, color: "rgb(0,0,0)" }}>Core Skills</h4>
                    <ul style={{ fontSize: 13, paddingLeft: 15, color: "rgb(0,0,0)" }} className="space-y-0.5">
                      {selected.skills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {selected.experience.length > 0 && (
                  <div className="mb-4">
                    <h4 style={{ fontSize: 13, fontWeight: 600, borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8, color: "rgb(0,0,0)" }}>Experience</h4>
                    <ul style={{ fontSize: 13, paddingLeft: 15, color: "rgb(0,0,0)" }} className="space-y-0.5">
                      {selected.experience.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}

                {selected.companies.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8, color: "rgb(0,0,0)" }}>Companies</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selected.companies.map((c, i) => (
                        <div key={i} style={{ width: 50, height: 32 }} className="rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-white">
                          {c.logo ? (
                            <img src={c.logo} alt={c.name} style={{ width: 55, height: 32, objectFit: "contain", border: "1px solid #eee", padding: 3, borderRadius: 4 }} />
                          ) : (
                            <span className="text-xs text-gray-400">{c.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
