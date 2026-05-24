import Image from "next/image";

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-full bg-gradient-to-b from-white to-slate-50/50 
      dark:from-background/40 dark:to-background/20 dark:backdrop-blur-xl"
    >
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
        {/* Content Side */}
        <div className="relative flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[600px]">{children}</div>
        </div>

        {/* Image Side */}
        <div className="hidden lg:block relative">
          <Image
            src="/all.jpg"
            alt="Contact Us"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/50 to-sky-900/80 dark:from-background/60 dark:to-background/80" />
          <div className="absolute inset-0 flex flex-col justify-end p-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white font-['Open_Sans']">
                ¿Necesitas ayuda?
              </h2>
              <p className="text-sm text-sky-100/90">
                Nuestro equipo está aquí para asistirte en lo que necesites.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
