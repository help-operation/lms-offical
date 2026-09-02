"use client";

type PhonePreviewProps = {
  channel: "sms" | "email";
  subject?: string;
  message: string;
  recipientName?: string;
};

export function PhonePreview({ channel, subject, message, recipientName }: PhonePreviewProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex justify-center">
      <div className="w-[260px] overflow-hidden rounded-[2rem] border-[3px] border-gray-800 bg-gray-900 shadow-xl dark:border-slate-700">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-gray-900 px-5 pb-1 pt-2">
          <span className="text-[10px] font-semibold text-white">{timeStr}</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm border border-white/60" />
            <div className="h-2 w-1 rounded-sm bg-white/60" />
          </div>
        </div>

        {/* Notch */}
        <div className="flex justify-center bg-gray-900 pb-2">
          <div className="h-1 w-16 rounded-full bg-gray-700" />
        </div>

        {/* Screen */}
        <div className="min-h-[320px] bg-gray-100 p-3 dark:bg-slate-800">
          {channel === "sms" ? (
            <SmsBubble message={message} time={timeStr} />
          ) : (
            <EmailPreview subject={subject} message={message} recipientName={recipientName} />
          )}
        </div>

        {/* Home bar */}
        <div className="flex justify-center bg-gray-900 pb-2 pt-1">
          <div className="h-1 w-20 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}

function SmsBubble({ message, time }: { message: string; time: string }) {
  return (
    <div className="space-y-2">
      <div className="rounded-2xl rounded-bl-md bg-green-500 px-3.5 py-2.5 shadow-sm">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white">{message || "Type a message..."}</p>
      </div>
      <p className="text-right text-[10px] text-gray-400 dark:text-slate-500">{time} ✓✓</p>
    </div>
  );
}

function EmailPreview({ subject, message, recipientName }: { subject?: string; message: string; recipientName?: string }) {
  return (
    <div className="space-y-2.5 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-700">
      <div className="border-b border-gray-100 pb-2 dark:border-slate-600">
        <p className="text-[10px] text-gray-400 dark:text-slate-500">From: No Reply &lt;noreply@lms.com&gt;</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500">To: {recipientName || "student@email.com"}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{subject || "(no subject)"}</p>
      <div className="whitespace-pre-wrap text-[12px] leading-relaxed text-gray-600 dark:text-slate-300">
        {message || "Write your email..."}
      </div>
    </div>
  );
}
