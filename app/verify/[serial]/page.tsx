import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({ params }: { params: { serial: string } }) {
  const t = getServerMessages().certificate;
  const cert = await prisma.certificate.findUnique({
    where: { serial: params.serial },
    include: { course: { select: { title: true } } },
  });

  if (!cert) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <XCircle className="h-14 w-14 text-destructive" />
        <h1 className="font-[var(--font-display)] text-3xl uppercase">{t.verifyNotFound}</h1>
        <p className="text-sm text-muted-foreground">{t.verifyNotFoundDescription}</p>
      </div>
    );
  }

  const issued = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "long", year: "numeric" }).format(cert.issuedAt);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-9 w-9 text-[hsl(var(--success))]" />
        <h1 className="font-[var(--font-display)] text-3xl uppercase">{t.verifyValid}</h1>
      </div>
      <Card className="grid gap-3 p-6 text-sm">
        <Row label={t.recipient} value={cert.recipientName} />
        <Row label={t.courseLabel} value={cert.course.title} />
        <Row label={t.issuedOn} value={issued} />
        <Row label={t.serialLabel} value={cert.serial} />
      </Card>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/certificates/${cert.id}/image`}
        alt={t.verifyTitle}
        className="w-full rounded-[2px] border-2 border-foreground"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
