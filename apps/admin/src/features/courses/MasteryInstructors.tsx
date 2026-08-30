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
  instructors: InstructorInfo[];
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
    <div className="mx-auto max-w-[1160px] px-[10px] py-10">
      <h2
        className="text-center font-bold text-black"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: '35px' }}
      >
        {title}
      </h2>

      <div className={`grid gap-6 ${instructors.length === 1 ? "grid-cols-1 max-w-md mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {instructors.map((inst, index) => (
          <div
            key={index}
            className="bg-white rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl"
            style={{ width: 350, height: 506, padding: '25px', boxShadow: '0 8px 25px rgba(0,0,0,.06)' }}
          >
            <div style={{ width: 300, height: 260 }} className="bg-gray-200 overflow-hidden rounded-xl mx-auto">
              {inst.photo ? (
                <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                  <span className="text-4xl font-bold text-white">{inst.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="pt-4 text-center">
              <h3 style={{ fontSize: 20, fontWeight: 'normal' }} className="text-gray-900">{inst.name}</h3>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 18 }}>{inst.role}</p>
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-6 p-6">
              <div className="shrink-0 text-center">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-200 mx-auto">
                  {selected.photo ? (
                    <img src={selected.photo} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                      <span className="text-3xl font-bold text-white">{selected.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-3">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.role}</p>
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
              <div className="flex-1 min-w-0">
                {selected.summary && (
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 mb-1">Summary</h4>
                    <p className="text-sm text-gray-600">{selected.summary}</p>
                  </div>
                )}
                {selected.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 mb-1">Core Skills</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                      {selected.skills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {selected.experience.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 mb-1">Experience</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                      {selected.experience.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {selected.companies.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Companies</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selected.companies.map((c, i) => (
                        <div key={i} className="h-10 w-16 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-white">
                          {c.logo ? (
                            <img src={c.logo} alt={c.name} className="h-8 w-auto object-contain" />
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
