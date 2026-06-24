import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LucideGitPullRequestDraft } from "lucide-react";
import AnimatedSection from "./_components/animated-section";
import GuideCard from "./_components/guide-card";
import { getServerMessages } from "@/lib/i18n-server";

enum UserType {
  ADMIN = "admin",
  STUDENT = "student",
}

interface GuideContent {
  title: string;
  description: string;
  embedUrl: string;
}

type GuidesByUserType = Record<UserType, GuideContent[]>;

export default async function GuidesPage() {
  const session = await auth();
  const t = getServerMessages();

  if (!session) {
    redirect("/sign-in");
  }

  const userType = session.user?.role?.toLowerCase() as UserType;

  const guideUrls = {
    general: [
      "https://dubble.so/guides/crea-un-post-en-el-foro-bckxx4h5rfpuvh4svaxr?embed=1",
      "https://dubble.so/guides/guide-with-vercel-j6imk6qdgac2hgwkoamk?embed=1",
      "https://dubble.so/guides/como-eliminar-un-post-4rtkg87p1z7yf5pejak6?embed=1",
      "https://dubble.so/guides/ingresa-a-una-meeting-disponible-en-un-post-pqifmi9tvkqomfekxema?embed=1",
      "https://dubble.so/guides/actualizando-mi-perfil-u34jldhwruizikjoh10r?embed=1",
    ],
    admin: [
      "https://dubble.so/guides/como-enviar-un-correo-desde-la-plataforma-hlmqr6bkrizjgllbkm11?embed=1",
      "https://dubble.so/guides/ver-un-curso-en-modo-estudiante-nwm0ktqdw21jkstejjuq?embed=1",
      "https://dubble.so/guides/como-asignar-a-tus-maestros-a-diferentes-grados-mpa3sabaoukkvuzu2fp8?embed=1",
      "https://dubble.so/guides/como-agregar-un-nuevo-usuario-a-la-plataforma-tgn50pgz5hdiv4mv1yyg?embed=1",
      "https://dubble.so/guides/como-ver-el-perfil-de-un-estudiante-px7lrgw5lanuv2yh1u0z?embed=1",
      "https://dubble.so/guides/como-duplicar-un-grado-xfconwdlqrkcucd65a9d?embed=1",
      "https://dubble.so/guides/como-eliminar-un-grado-cncchl9mcnitra0m3vwp?embed=1",
      "https://dubble.so/guides/como-agregar-un-nuevo-grado-psvi0eph8itnjbkti5sa?embed=1",
      "https://dubble.so/guides/crea-un-nuevo-curso-srcr6ruq4zku9hwknexj?embed=1",
      "https://dubble.so/guides/como-editar-un-curso-f0znti290dukdw9e7vfg?embed=1",
      "https://dubble.so/guides/como-ver-el-historial-de-pagos-nr9xebfqepoaa0giyhcs?embed=1",
      "https://dubble.so/guides/cambiar-los-precios-de-inscripcion-y-mensualidad-sex64llhqfc4pelysp4m?embed=1",
    ],
    student: [
      "https://dubble.so/guides/ver-tus-cursos-asignados-a9of1xnztqyypfosibgx?embed=1",
      "https://dubble.so/guides/como-ver-tu-portafolio-y-tareas-ya-calificadas-uyk0lypvfehf6livtwtk?embed=1",
      "https://dubble.so/guides/como-entregar-tus-tareas-y-resolver-tus-quizzes-c69sb8xflxr6kfdrlduh?embed=1",
    ],
  };

  const buildGuides = (
    entries: string[][],
    urls: string[]
  ): GuideContent[] =>
    entries.map((entry, index) => ({
      title: entry[0] ?? "",
      description: entry[1] ?? "",
      embedUrl: urls[index],
    }));

  const guides: GuidesByUserType & { general: GuideContent[] } = {
    general: buildGuides(t.dashboard.guides.general, guideUrls.general),
    admin: buildGuides(t.dashboard.guides.admin, guideUrls.admin),
    student: buildGuides(t.dashboard.guides.student, guideUrls.student),
  };

  const userGuides = [...guides.general, ...(guides[userType] || [])];

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-8 p-4 pt-6 md:p-8">
        <AnimatedSection className="flex flex-col space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5
                dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05]
                dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border"
              >
                <LucideGitPullRequestDraft className="h-8 w-8 text-primary dark:text-white/90" />
              </div>
              <div>
                <h2
                  className="text-2xl font-black tracking-tight sm:text-4xl
                  bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                  dark:from-white dark:to-white/70 font-['Open_Sans']"
                >
                  {t.dashboard.guidesTitle}
                </h2>
                <p className="text-muted-foreground/80 text-sm dark:text-white/50 font-['Open_Sans'] mt-1">
                  {t.dashboard.guidesSubtitle}
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid gap-6">
          <AnimatedSection direction="x" distance={-20} delay={0.1}>
            <div className="bg-card/50 dark:bg-card/30 backdrop-blur-sm rounded-xl border p-6">
              <GuideCard guides={userGuides} />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </ScrollArea>
    // <Card className="border border-destructive bg-[hsl(var(--destructive)/0.1)] text-destructive p-10 m-10">
    //   <CardHeader className="flex flex-col items-center text-center">
    //     <LucideGitPullRequestDraft className="w-12 h-12 text-destructive" />
    //     <CardTitle className="mt-2 text-lg">Acceso restringido</CardTitle>
    //   </CardHeader>
    //   <CardContent>
    //     <CardDescription className="text-center">
    //       Lo sentimos, por falta de pago no podemos mostrarte la información.
    //       <br />
    //       Contacta al administrador para más información.
    //     </CardDescription>
    //   </CardContent>
    // </Card>
  );
}

export const revalidate = 0;
