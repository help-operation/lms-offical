"use client";

import { useState, useTransition } from "react";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { updateInstructorProfileAction } from "@/features/instructor/actions/profile.actions";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import type { MediaFile } from "@/features/media/types";
import { toast } from "@repo/ui/sonner";

interface ProfileSettingsFormProps {
  bio: string | null;
  expertise: string | null;
  displayName: string | null;
  displayAvatar: string | null;
}

export function ProfileSettingsForm({
  bio,
  expertise,
  displayName: initialDisplayName,
  displayAvatar: initialDisplayAvatar,
}: ProfileSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setSaved_error] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [fields, setFields] = useState({
    bio:       bio ?? "",
    expertise: expertise ?? "",
  });

  const [displayName,   setDisplayName]   = useState(initialDisplayName ?? "");
  const [displayAvatar, setDisplayAvatar] = useState<string | null>(initialDisplayAvatar ?? null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function pickAvatar(file: MediaFile) {
    setShowAvatarPicker(false);
    setDisplayAvatar(file.url);
    setSaved(false);
  }

  function handleSave() {
    setSaved_error(null);
    startTransition(async () => {
      const res = await updateInstructorProfileAction({
        bio:           fields.bio || undefined,
        expertise:     fields.expertise || undefined,
        displayName:   displayName.trim() || null,
        displayAvatar: displayAvatar || null,
      });
      if (!res?.success) {
        setSaved_error(res?.message ?? "Failed to save");
        toast.error(res?.message ?? "Failed to save profile");
      } else {
        setSaved(true);
        toast.success("Profile saved");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Teacher Display Identity ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-900">Teacher Display Identity</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            When a course is set to &ldquo;Publish as Teacher&rdquo;, these details replace
            &ldquo;Super Admin&rdquo; on the course page.
          </p>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
            className="input-base w-full"
            placeholder="e.g. John Doe"
          />
          <p className="text-xs text-gray-400">
            Your real name as it appears to students. Leave blank to use your account name.
          </p>
        </div>

        {/* Display Avatar */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Display Photo
          </label>
          {displayAvatar ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayAvatar}
                alt="Teacher avatar"
                className="h-16 w-16 rounded-full object-cover border border-gray-200 shadow-sm"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={() => { setDisplayAvatar(null); setSaved(false); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-6 w-full text-sm font-medium text-gray-500 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              Select photo from Media Library
            </button>
          )}
          <p className="text-xs text-gray-400">
            Your teacher profile photo. Shown in the instructor section on course pages.
          </p>
        </div>
      </div>

      {/* ── Instructor Bio & Expertise ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Bio & Expertise</h2>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Expertise / Title
          </label>
          <input
            type="text"
            value={fields.expertise}
            onChange={(e) => set("expertise", e.target.value)}
            className="input-base w-full"
            placeholder="e.g. Full-Stack Developer & Educator"
          />
          <p className="text-xs text-gray-400">Shown below your name on course pages.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={fields.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={6}
            className="input-base w-full resize-none"
            placeholder="Tell students about your background, experience, and teaching style..."
          />
          <p className="text-xs text-gray-400">
            Appears in the instructor section on your course detail pages.
          </p>
        </div>
      </div>

      {/* ── Feedback & Save ───────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {saved && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          Profile saved successfully.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Saving…" : "Save Profile"}
      </button>

      {/* Media picker modal */}
      {showAvatarPicker && (
        <MediaLibraryModal
          filterType="image"
          onSelect={pickAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
