"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "@repo/ui/sonner";
import * as tus from "tus-js-client";

type BunnyCreds = {
  tusEndpoint: string;
  authorizationSignature: string;
  authorizationExpire: number;
  videoId: string;
  libraryId: string;
  title: string;
};

export type BunnyCredentialsResult =
  | { success: true; data: BunnyCreds }
  | { success: false; message?: string; data?: null };

export type UploadEntry = {
  state: "preparing" | "uploading" | "error";
  progress: number;
  fileName: string;
  error?: string;
};

/**
 * Per-lesson Bunny (tus) upload engine, lifted out of the video-source modal so
 * uploads survive the modal closing and run concurrently — each lesson gets its
 * own Bunny video object, so several can upload in parallel.
 *
 * Lives in the curriculum builder (which stays mounted across tab switches), so
 * progress keeps ticking while the user keeps working. Uploads still abort if
 * the whole editor route unmounts or the page reloads.
 */
export function useLessonVideoUploads(
  getBunnyCredentials: (lessonId: number) => Promise<BunnyCredentialsResult>,
) {
  const [uploads, setUploads] = useState<Record<number, UploadEntry>>({});
  const instances = useRef<Record<number, tus.Upload>>({});

  const clear = useCallback((lessonId: number) => {
    setUploads((u) => {
      const next = { ...u };
      delete next[lessonId];
      return next;
    });
  }, []);

  const start = useCallback(
    async (lessonId: number, file: File, onComplete: () => void) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file.");
        return;
      }

      setUploads((u) => ({
        ...u,
        [lessonId]: { state: "preparing", progress: 0, fileName: file.name },
      }));

      const res = await getBunnyCredentials(lessonId);
      if (!res.success) {
        const msg = res.message ?? "Failed to get upload credentials";
        setUploads((u) => ({
          ...u,
          [lessonId]: { state: "error", progress: 0, fileName: file.name, error: msg },
        }));
        toast.error(msg);
        return;
      }

      const creds = res.data;
      setUploads((u) => ({
        ...u,
        [lessonId]: { state: "uploading", progress: 0, fileName: file.name },
      }));

      const upload = new tus.Upload(file, {
        endpoint: creds.tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000],
        chunkSize: 5 * 1024 * 1024, // 5 MB chunks
        headers: {
          AuthorizationSignature: creds.authorizationSignature,
          AuthorizationExpire: String(creds.authorizationExpire),
          VideoId: creds.videoId,
          LibraryId: creds.libraryId,
        },
        metadata: {
          filetype: file.type,
          // Lesson title from the server — NOT the uploaded file name.
          title: creds.title,
        },
        onProgress(bytesUploaded, bytesTotal) {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploads((u) => {
            const cur = u[lessonId];
            if (!cur) return u;
            return { ...u, [lessonId]: { ...cur, state: "uploading", progress: pct } };
          });
        },
        onSuccess() {
          delete instances.current[lessonId];
          clear(lessonId);
          toast.success("Video uploaded");
          onComplete();
        },
        onError(err) {
          delete instances.current[lessonId];
          const msg = err instanceof Error ? err.message : "Upload failed";
          setUploads((u) => ({
            ...u,
            [lessonId]: { state: "error", progress: 0, fileName: file.name, error: msg },
          }));
          toast.error(msg);
        },
      });

      instances.current[lessonId] = upload;
      upload.start();
    },
    [getBunnyCredentials, clear],
  );

  const cancel = useCallback(
    (lessonId: number) => {
      instances.current[lessonId]?.abort();
      delete instances.current[lessonId];
      clear(lessonId);
    },
    [clear],
  );

  return { uploads, start, cancel };
}
