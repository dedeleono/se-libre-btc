"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PROFILE_NUDGE_DISMISSED_COOKIE } from "@/lib/demographics";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

interface ProfileCompletionBannerProps {
  title: string;
  body: string;
  ctaLabel: string;
  dismissLabel: string;
  returnFocusId: string;
}

export function ProfileCompletionBanner({
  title,
  body,
  ctaLabel,
  dismissLabel,
  returnFocusId,
}: ProfileCompletionBannerProps) {
  const titleId = useId();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const dismiss = () => {
    document.cookie = `${PROFILE_NUDGE_DISMISSED_COOKIE}=1; Path=/; Max-Age=${THIRTY_DAYS_IN_SECONDS}; SameSite=Lax`;
    setDismissed(true);
    document.getElementById(returnFocusId)?.focus();
  };

  return (
    <section
      aria-labelledby={titleId}
      className="flex items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground"
    >
      <div className="rounded-xl border bg-primary/10 p-2.5 text-primary" aria-hidden="true">
        <UserRound className="size-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-3 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:space-y-0">
        <div className="space-y-1">
          <h2 id={titleId} className="font-semibold leading-tight text-balance">
            {title}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">{body}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/profile">{ctaLabel}</Link>
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-me-2 -mt-2 shrink-0 sm:mt-0"
        aria-label={dismissLabel}
        onClick={dismiss}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </section>
  );
}
