import { GraduationCap, BookOpen, Users, TrendingUp, Shield } from "lucide-react";

export function AuthSidePanel({ siteName }: { siteName?: string } = {}) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 flex-col justify-between p-12 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">{siteName || "Skillkoro"}</span>
      </div>

      {/* Center content */}
      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Manage Your<br />
            <span className="text-brand-200">LMS Platform</span><br />
            With Ease
          </h1>
          <p className="text-brand-200 text-base leading-relaxed max-w-sm">
            A powerful admin panel to manage courses, students, instructors, revenue and more — all in one place.
          </p>
        </div>

        {/* Feature chips */}
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { icon: BookOpen, label: "Course Management" },
            { icon: Users, label: "User Control" },
            { icon: TrendingUp, label: "Revenue Tracking" },
            { icon: Shield, label: "Secure Access" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
              <Icon className="h-4 w-4 text-brand-200 shrink-0" />
              <span className="text-xs font-medium text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="relative z-10 flex items-center gap-8">
        {[
          { value: "56K+", label: "Students" },
          { value: "200+", label: "Courses" },
          { value: "98%", label: "Success Rate" },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-brand-300 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
