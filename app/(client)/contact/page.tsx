import ContactForm from "@/components/forms/contact-form";
import { Button } from "@/components/ui/button";
import { Download, MessageCircle, Users } from "lucide-react";
import { KEET_COMMUNITY_URL, KEET_DOWNLOAD_URL } from "@/lib/keet";
import { getServerMessages } from "@/lib/i18n-server";

export default function ContactPage() {
  const t = getServerMessages();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="page-eyebrow">{t.public.contactSubtitle}</div>
        <h1 className="text-4xl uppercase leading-[0.95] text-foreground md:text-5xl">
          {t.public.contactTitle}
        </h1>
        <p className="font-semibold text-muted-foreground">
          {t.public.contactResponse}
        </p>
      </div>

      {/* Contact Form */}
      <ContactForm />

      {/* Keet Community */}
      <div className="stamp-card space-y-6 p-6 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-[var(--naranja-050)] text-[var(--terracota-700)] dark:bg-[var(--volcan-700)] dark:text-[var(--maiz-500)]">
          <MessageCircle className="h-6 w-6" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl uppercase leading-[0.95] text-foreground md:text-3xl">
            Join our community on Keet
          </h2>
          <p className="max-w-prose text-sm font-semibold leading-relaxed text-muted-foreground">
            Download Keet and join the Dinero Libre community.
          </p>
          <p className="max-w-prose text-sm font-semibold leading-relaxed text-muted-foreground">
            Keet is a messaging, video calling, and file transfer app that is
            100% decentralized and end-to-end encrypted.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <a
              href={KEET_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4" />
              Download Keet
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a
              href={KEET_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Users className="h-4 w-4" />
              Join the Dinero Libre community
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
