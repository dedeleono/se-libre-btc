import ContactForm from "@/components/forms/contact-form";
import { Mail, MapPin, Phone } from "lucide-react";
import { getServerMessages } from "@/lib/i18n-server";

export default function ContactPage() {
  const t = getServerMessages();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-success font-['Open_Sans']">
          {t.public.contactTitle}
        </h1>
        <p className="text-muted-foreground dark:text-white/70 sm:text-sm text-xs ">
          {t.public.contactResponse}
        </p>
      </div>

      {/* Contact Form */}
      <ContactForm />

      {/* Contact Information */}
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-lg bg-sky-100 p-3 dark:bg-sky-500/10">
            <MapPin className="h-5 w-5 text-sky-900 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="font-medium text-sky-900 dark:text-white/90 font-['Open_Sans']">
              {t.public.location}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-white/70">
              6ta Avenida 8-25 zona 2, Avenida Simeón Cañas, Apto &quot;A&quot;,
              Guatemala, Guatemala.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-lg bg-sky-100 p-3 dark:bg-sky-500/10">
            <Mail className="h-5 w-5 text-sky-900 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="font-medium text-sky-900 dark:text-white/90 font-['Open_Sans']">
              Email
            </h3>
            <p className="text-sm text-muted-foreground dark:text-white/70">
              info@colegiosaberver.com
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-lg bg-sky-100 p-3 dark:bg-sky-500/10">
            <Phone className="h-5 w-5 text-sky-900 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="font-medium text-sky-900 dark:text-white/90 font-['Open_Sans']">
              {t.public.phone}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-white/70">
              +1 234 567 890 • Lun - Vie, 8:00 AM - 6:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
