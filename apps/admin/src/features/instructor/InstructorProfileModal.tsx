"use client";

import { useCallback, useEffect, useState } from "react";
import { X, UserCircle, Loader2 } from "lucide-react";
import { getInstructorProfileAction } from "@/features/instructor/actions/profile.actions";
import { ProfileSettingsForm } from "@/features/instructor/ProfileSettingsForm";

interface ProfileData {
  bio: string | null;
  expertise: string | null;
  displayName: string | null;
  displayAvatar: string | null;
}

export function InstructorProfileModal() {
  const [open, setOpen]         = useState(false);
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [loading, setLoading]   = useState(false);

  // Load profile data when modal opens (via server action — avoids next/headers in client)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getInstructorProfileAction()
      .then((res) =>
        setProfile(
          res.success
            ? res.data ?? { bio: null, expertise: null, displayName: null, displayAvatar: null }
            : { bio: null, expertise: null, displayName: null, displayAvatar: null }
        )
      )
      .catch(() =>
        setProfile({ bio: null, expertise: null, displayName: null, displayAvatar: null })
      )
      .finally(() => setLoading(false));
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
      >
        <UserCircle className="h-4 w-4" />
        Instructor Profile
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Instructor Profile</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your teacher identity and bio shown on course pages
                </p>
              </div>
              <button
                onClick={close}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : profile ? (
                <ProfileSettingsForm
                  bio={profile.bio}
                  expertise={profile.expertise}
                  displayName={profile.displayName}
                  displayAvatar={profile.displayAvatar}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
