"use client";

import { FileText, Download, FileDownIcon } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

interface ResourcesCardProps {
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

export const ResourcesCard = ({ attachments }: ResourcesCardProps) => {
  const { t } = useLocale();
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <h2 className="flex items-center gap-x-2 font-[family-name:var(--font-body)] text-sm font-bold uppercase leading-normal tracking-[0.08em]">
          <FileDownIcon aria-hidden className="size-4" />
          {t.course.resources}
        </h2>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={attachment.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.course.downloadResource(attachment.name)}
                className="flex min-h-11 w-full items-center gap-3 rounded-md border border-[var(--naranja-500)] bg-[hsl(var(--primary)/0.1)] p-3 text-sm text-foreground transition-colors hover:bg-[hsl(var(--primary)/0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <FileText aria-hidden className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{attachment.name}</span>
                <Download aria-hidden className="size-4 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
