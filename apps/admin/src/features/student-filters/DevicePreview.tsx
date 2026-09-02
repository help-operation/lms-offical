"use client";

import { useState, useRef } from "react";
import { DeviceMobile, DeviceTablet } from "@phosphor-icons/react";

type DeviceType = "mobile" | "tablet";

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
};

export function DevicePreview({ subject, message, channel }: { subject?: string; message: string; channel: "sms" | "email" }) {
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [scale, setScale] = useState(0.75);
  const containerRef = useRef<HTMLDivElement>(null);

  const size = DEVICE_SIZES[device];
  const scaledW = size.width * scale;
  const scaledH = size.height * scale;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Preview</p>
        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                device === "mobile"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              <DeviceMobile size={13} weight="fill" /> Mobile
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                device === "tablet"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              <DeviceTablet size={13} weight="fill" /> Tablet
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="h-1 w-16 cursor-pointer accent-brand-600"
            />
            <span className="w-8 text-[10px] text-gray-400 dark:text-slate-500">{Math.round(scale * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-50 p-4 dark:bg-slate-800/50">
        <div className="flex justify-center">
          {/* Device frame */}
          <div
            className="relative shrink-0 overflow-hidden rounded-[2rem] border-[3px] border-gray-800 bg-gray-900 shadow-2xl dark:border-slate-600"
            style={{ width: scaledW, height: scaledH }}
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-1.5">
              <div className="h-1.5 w-16 rounded-full bg-gray-700" />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between bg-gray-900 px-5 pb-1 pt-2">
              <span className="text-[9px] font-semibold text-white">
                {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-2.5 rounded-sm border border-white/50" />
                <div className="h-1.5 w-1 rounded-sm bg-white/50" />
              </div>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto bg-gray-100 dark:bg-slate-800" style={{ paddingBottom: 40 }}>
              <div className="p-3">
                {channel === "sms" ? (
                  <SmsRendered message={message} />
                ) : (
                  <EmailRendered subject={subject} body={message} />
                )}
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute inset-x-0 bottom-1.5 flex justify-center">
              <div className="h-1 w-20 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmsRendered({ message }: { message: string }) {
  const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="space-y-2">
      <div className="rounded-2xl rounded-bl-md bg-green-500 px-3.5 py-2.5 shadow-sm">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white">
          {message || "Your message will appear here..."}
        </p>
      </div>
      <p className="text-right text-[10px] text-gray-400 dark:text-slate-500">{now} ✓✓</p>
    </div>
  );
}

function EmailRendered({ subject, body }: { subject?: string; body: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
      {/* Email header */}
      <div className="mb-3 border-b border-gray-100 pb-3 dark:border-slate-600">
        <p className="text-[10px] text-gray-400 dark:text-slate-500">From: No Reply &lt;noreply@lms.com&gt;</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500">To: student@email.com</p>
      </div>
      {/* Subject */}
      <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        {subject || "(no subject)"}
      </p>
      {/* Body — rendered, no code */}
      <div
        className="prose prose-xs max-w-none text-[12px] leading-relaxed text-gray-600 dark:prose-invert dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: body || "<p>Write your email message...</p>" }}
      />
    </div>
  );
}
