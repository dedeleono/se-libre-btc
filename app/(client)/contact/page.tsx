import ContactForm from "@/components/forms/contact-form";
import { Mail, MapPin, Phone } from "lucide-react";
import { getServerMessages } from "@/lib/i18n-server";

export default function ContactPage() {
  const t = getServerMessages();

  const details = [
    {
      icon: MapPin,
      label: t.public.location,
      value:
        '6ta Avenida 8-25 zona 2, Avenida Simeón Cañas, Apto "A", Guatemala, Guatemala.',
    },
    {
      icon: Mail,
      label: "Email",
      value: "info@colegiosaberver.com",
    },
    {
      icon: Phone,
      label: t.public.phone,
      value: "+1 234 567 890 • Lun - Vie, 8:00 AM - 6:00 PM",
    },
  ];

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

      {/* Contact Information */}
      <div className="grid gap-4">
        {details.map((item) => (
          <div
            key={item.label}
            className="stamp-card flex items-start gap-4 p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-[var(--naranja-050)] text-[var(--terracota-700)] dark:bg-[var(--volcan-700)] dark:text-[var(--maiz-500)]">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-foreground">
                {item.label}
              </h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
