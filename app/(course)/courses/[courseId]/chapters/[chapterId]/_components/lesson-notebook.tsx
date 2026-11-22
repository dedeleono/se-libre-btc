"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/lib/i18n";
import { parseNotes } from "@/lib/notes";

// Lexical (~15 @lexical/* packages) loads on demand so it stays out of the
// chapter's first-load JS bundle.
const Editor = dynamic(() => import("@/components/editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});

const SAVE_DELAY_MS = 1500;
const KEEPALIVE_MAX_BYTES = 60_000;

type LoadState = "loading" | "ready" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface LessonNotebookProps {
  courseId: string;
  chapterId: string;
}

export function LessonNotebook({ courseId, chapterId }: LessonNotebookProps) {
  const { t } = useLocale();
  const [load, setLoad] = useState<LoadState>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [initialHtml, setInitialHtml] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");

  const userEditedRef = useRef(false);
  const savedRef = useRef<string | null>(null);
  const latestRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoad("loading");
    fetch(`/api/notes?chapterId=${encodeURIComponent(chapterId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`GET /api/notes ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setInitialHtml(parseNotes(data?.content));
        setLoad("ready");
      })
      .catch(() => {
        if (!cancelled) setLoad("error");
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId, loadAttempt]);

  const requestBody = useCallback(
    (content: string) => JSON.stringify({ content, chapterId, courseId }),
    [chapterId, courseId],
  );

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const save = useCallback(async () => {
    clearTimer();
    const content = latestRef.current;
    if (content === null || content === savedRef.current) {
      setStatus((s) => (s === "saving" ? "saved" : s));
      return;
    }
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    setStatus("saving");
    let failed = false;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody(content),
      });
      if (res.ok) savedRef.current = content;
      else failed = true;
    } catch {
      failed = true;
    } finally {
      inFlightRef.current = false;
    }
    if (failed) {
      queuedRef.current = false;
      setStatus("error");
    } else if (queuedRef.current) {
      queuedRef.current = false;
      void save();
    } else {
      setStatus("saved");
    }
  }, [requestBody]);

  const handleChange = useCallback(
    (html: string) => {
      if (!userEditedRef.current) {
        savedRef.current = html;
        latestRef.current = html;
        return;
      }
      latestRef.current = html;
      if (html === savedRef.current) return;
      clearTimer();
      setStatus((s) => (s === "saved" ? "idle" : s));
      timerRef.current = setTimeout(() => void save(), SAVE_DELAY_MS);
    },
    [save],
  );

  useEffect(() => {
    const flush = () => {
      const content = latestRef.current;
      if (content === null || content === savedRef.current) return;
      clearTimer();
      const body = requestBody(content);
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: new TextEncoder().encode(body).length <= KEEPALIVE_MAX_BYTES,
      })
        .then((res) => {
          if (res.ok) savedRef.current = content;
        })
        .catch(() => {});
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [requestBody]);

  const markEdited = () => {
    userEditedRef.current = true;
  };

  const editor = useMemo(
    () => (
      <Editor
        value={initialHtml}
        onChange={handleChange}
        height="300px"
        className="rounded-[2px] border-2 border-foreground"
        style={{ minHeight: "200px", maxHeight: "400px" }}
      />
    ),
    [initialHtml, handleChange],
  );

  const statusText = {
    idle: t.course.autosaveNotes,
    saving: t.course.savingNotes,
    saved: t.course.notesSavedStatus,
    error: t.course.notesSaveFailed,
  }[status];

  return (
    <section aria-labelledby="lesson-notes-title" className="lesson-notebook flex flex-col gap-3">
      <h2
        id="lesson-notes-title"
        className="flex items-center gap-x-2 font-[family-name:var(--font-body)] text-sm font-bold uppercase leading-normal tracking-[0.08em]"
      >
        <FileText aria-hidden className="size-4" />
        {t.course.digitalNotebook}
      </h2>

      {load === "loading" && <Skeleton className="h-40 w-full" />}

      {load === "error" && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t.course.notesLoadFailed}</p>
          <Button variant="outline" className="min-h-11" onClick={() => setLoadAttempt((n) => n + 1)}>
            {t.common.retry}
          </Button>
        </div>
      )}

      {load === "ready" && (
        <>
          <div
            onKeyDownCapture={markEdited}
            onBeforeInputCapture={markEdited}
            onPasteCapture={markEdited}
            onDropCapture={markEdited}
            onPointerDownCapture={markEdited}
          >
            {editor}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {statusText}
            </p>
            {status === "error" && (
              <Button variant="outline" size="sm" className="min-h-11" onClick={() => void save()}>
                {t.common.retry}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
