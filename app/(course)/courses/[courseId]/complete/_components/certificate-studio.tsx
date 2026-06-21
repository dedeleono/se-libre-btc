"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Download, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { updateCertificate } from "@/actions/certificate";

type Design = "STANDARD" | "PUNK";

export function CertificateStudio({
  certId,
  serial,
  initialName,
  initialDesign,
  initialVersion,
}: {
  certId: string;
  serial: string;
  initialName: string;
  initialDesign: Design;
  initialVersion: number;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initialName);
  const [design, setDesign] = useState<Design>(initialDesign);
  const [version, setVersion] = useState(initialVersion); // cache-bust for the <img>
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const imgSrc = `/api/certificates/${certId}/image?v=${version}`;

  const persist = (changes: { recipientName?: string; design?: Design }) => {
    startTransition(async () => {
      const res = await updateCertificate({ id: certId, ...changes });
      setVersion(new Date(res.updatedAt).getTime());
    });
  };

  // Debounce name edits.
  useEffect(() => {
    if (name === initialName) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const clean = name.replace(/\s+/g, " ").trim();
      if (clean.length >= 1 && clean.length <= 80) persist({ recipientName: clean });
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const onDesignChange = (value: string) => {
    if (value !== "STANDARD" && value !== "PUNK") return;
    setDesign(value);
    persist({ design: value });
  };

  return (
    <Card className="p-6">
      <div className="space-y-1">
        <h2 className="font-[var(--font-display)] text-3xl uppercase leading-none">{t.completion.certificateSectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.completion.certificateSectionSubtitle}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cert-name">{t.completion.nameLabel}</Label>
            <Input
              id="cert-name"
              value={name}
              maxLength={80}
              placeholder={t.completion.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.completion.designLabel}</Label>
            <ToggleGroup type="single" value={design} onValueChange={onDesignChange} className="justify-start">
              <ToggleGroupItem value="STANDARD">{t.completion.designStandard}</ToggleGroupItem>
              <ToggleGroupItem value="PUNK">{t.completion.designPunk}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Button asChild className="w-full">
            <a href={`/api/certificates/${certId}/image?download=1&v=${version}`} download>
              <Download className="mr-2 h-4 w-4" />
              {t.completion.download}
            </a>
          </Button>

          <p className="text-xs text-muted-foreground">{t.completion.verifyHint(`/verify/${serial}`)}</p>
        </div>

        <div className="relative">
          {isPending && (
            <div className="absolute right-2 top-2 z-10 rounded bg-background/80 p-1">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={t.completion.preview}
            className="w-full rounded-[2px] border-2 border-foreground shadow-[var(--shadow-card)]"
          />
        </div>
      </div>
    </Card>
  );
}
