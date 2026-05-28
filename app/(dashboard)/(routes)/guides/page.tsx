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

  if (!session) {
    redirect("/sign-in");
  }

  const userType = session.user?.role?.toLowerCase() as UserType;

  const guides: GuidesByUserType & { general: GuideContent[] } = {
    general: [
      {
        title: "Creando un post",
        description: "Aprende a crear un post dentro del foro",
        embedUrl:
          "https://dubble.so/guides/crea-un-post-en-el-foro-bckxx4h5rfpuvh4svaxr?embed=1",
      },
      {
        title: "Como comentar un post",
        description: "Haz tantos comentarios como quisieras",
        embedUrl:
          "https://dubble.so/guides/guide-with-vercel-j6imk6qdgac2hgwkoamk?embed=1",
      },
      {
        title: "Como eliminar un post",
        description: "Aprende a eliminar posts",
        embedUrl:
          "https://dubble.so/guides/como-eliminar-un-post-4rtkg87p1z7yf5pejak6?embed=1",
      },
      {
        title: "Como ser parte de las discusiones en vivo",
        description: "Aprende a ingresar las meetings disponibles en posts",
        embedUrl:
          "https://dubble.so/guides/ingresa-a-una-meeting-disponible-en-un-post-pqifmi9tvkqomfekxema?embed=1",
      },
      {
        title: "Actualizando tu perfil",
        description:
          "Cambia la información básica de tu perfil cuando lo necesites",
        embedUrl:
          "https://dubble.so/guides/actualizando-mi-perfil-u34jldhwruizikjoh10r?embed=1",
      },
    ],
    admin: [
      {
        title: "Enviando Correos",
        description: "Aprende a enviar correos desde la plataforma",
        embedUrl:
          "https://dubble.so/guides/como-enviar-un-correo-desde-la-plataforma-hlmqr6bkrizjgllbkm11?embed=1",
      },
      {
        title: "Ver un curso en modo estudiante",
        description:
          "Aprende como los estudiantes ven y utilizan la plataforma",
        embedUrl:
          "https://dubble.so/guides/ver-un-curso-en-modo-estudiante-nwm0ktqdw21jkstejjuq?embed=1",
      },
      {
        title: "Como asignar a tus maestros a diferentes grados",
        description: "Asignalos a tantos como sea necesario",
        embedUrl:
          "https://dubble.so/guides/como-asignar-a-tus-maestros-a-diferentes-grados-mpa3sabaoukkvuzu2fp8?embed=1",
      },
      {
        title: "Como agregar un nuevo usuario",
        description: "Agrega estudiantes o maestros desde la plataforma",
        embedUrl:
          "https://dubble.so/guides/como-agregar-un-nuevo-usuario-a-la-plataforma-tgn50pgz5hdiv4mv1yyg?embed=1",
      },
      {
        title: "Como ver el perfil de un estudiante",
        description:
          "Ve en tiempo real el progreso de cualquier estudiante en específico",
        embedUrl:
          "https://dubble.so/guides/como-ver-el-perfil-de-un-estudiante-px7lrgw5lanuv2yh1u0z?embed=1",
      },
      {
        title: "Como duplicar un grado",
        description: "Optimiza tu trabajo",
        embedUrl:
          "https://dubble.so/guides/como-duplicar-un-grado-xfconwdlqrkcucd65a9d?embed=1",
      },
      {
        title: "Como eliminar un grado",
        description: "No te preocupes si cometes un error",
        embedUrl:
          "https://dubble.so/guides/como-eliminar-un-grado-cncchl9mcnitra0m3vwp?embed=1",
      },
      {
        title: "Como agregar un grado",
        description: "Agrega nuevos grados y niveles a tu institución",
        embedUrl:
          "https://dubble.so/guides/como-agregar-un-nuevo-grado-psvi0eph8itnjbkti5sa?embed=1",
      },
      {
        title: "Crea un nuevo curso",
        description: "Tu también puedes crear tantos cursos como desees",
        embedUrl:
          "https://dubble.so/guides/crea-un-nuevo-curso-srcr6ruq4zku9hwknexj?embed=1",
      },
      {
        title: "Edita tus cursos",
        description: "Cambia lo que creas necesario",
        embedUrl:
          "https://dubble.so/guides/como-editar-un-curso-f0znti290dukdw9e7vfg?embed=1",
      },
      {
        title: "Ver Historial de Pagos",
        description: "Identifica todos los pagos y sus estados",
        embedUrl:
          "https://dubble.so/guides/como-ver-el-historial-de-pagos-nr9xebfqepoaa0giyhcs?embed=1",
      },
      {
        title: "Cambia tus precios",
        description: "Cambia los precios de inscripción y mensualidad cuando lo creas necesario",
        embedUrl:
          "https://dubble.so/guides/cambiar-los-precios-de-inscripcion-y-mensualidad-sex64llhqfc4pelysp4m?embed=1",
      },
    ],
    student: [
      {
        title: "Ver tus cursos asignados",
        description: "Navega la plataforma para ver todos tus cursos",
        embedUrl:
          "https://dubble.so/guides/ver-tus-cursos-asignados-a9of1xnztqyypfosibgx?embed=1",
      },
      {
        title: "Como ver tu portafolio y tareas calificadas",
        description: "Está al pendiente de todas tus entregas",
        embedUrl:
          "https://dubble.so/guides/como-ver-tu-portafolio-y-tareas-ya-calificadas-uyk0lypvfehf6livtwtk?embed=1",
      },
      {
        title: "Como entregar tus tareas y resolver quizzes en línea",
        description: "Aprende como entregar tus tareas",
        embedUrl:
          "https://dubble.so/guides/como-entregar-tus-tareas-y-resolver-tus-quizzes-c69sb8xflxr6kfdrlduh?embed=1",
      },
    ],
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
                  Guías de Uso
                </h2>
                <p className="text-muted-foreground/80 text-sm dark:text-white/50 font-['Open_Sans'] mt-1">
                  Explora nuestras guías interactivas para aprender a utilizar la plataforma
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
    // <Card className="border border-red-500 bg-red-100 text-red-700 p-10 m-10">
    //   <CardHeader className="flex flex-col items-center text-center">
    //     <LucideGitPullRequestDraft className="w-12 h-12 text-red-600" />
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
