import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, LineChart, GraduationCap } from "lucide-react";

export default function AboutPage() {
  return (
    <div
      className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 
      dark:from-background/40 dark:via-background/30 dark:to-background/20 dark:backdrop-blur-xl"
    >
      <div
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] 
        dark:opacity-20"
      />

      <div className="relative container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="relative w-full h-[300px] mb-8 rounded-xl overflow-hidden">
            <Image
              src="/saber.jpg"
              alt="School building"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent dark:from-black/80" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 font-['Open_Sans']">
                Se Libre BTC
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-white/90">
                Empoderando estudiantes con experiencias de aprendizaje en línea
                innovadoras y tecnología educativa de vanguardia.
              </p>
            </div>
          </div>
        </div>

        <Card
          className="mb-12 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 
          dark:bg-black/40 dark:border-white/[0.05]"
        >
          <CardHeader>
            <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-400 font-['Open_Sans'] font-bold">
              Nosotros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed dark:text-white/70">
              Nuestra plataforma está dedicada a proporcionar educación de alta
              calidad a través de experiencias de aprendizaje innovadoras.
              Buscamos empoderar estudiantes con conocimientos y habilidades que
              les ayudarán a tener éxito en sus vidas académicas y
              profesionales.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card
            className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 
            dark:bg-black/40 dark:border-white/[0.05]"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-400 font-['Open_Sans'] font-bold">
                Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed dark:text-white/70">
                Somos una institución que brinda formación integral y
                disciplinada, con principios éticos que forman profesionales
                capaces de enfrentar día a día los cambios tecnológicos y
                sociales.
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 
            dark:bg-black/40 dark:border-white/[0.05]"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-400 font-['Open_Sans'] font-bold">
                Visión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed dark:text-white/70">
                Ser una institución educativa que se identifique en su comunidad
                por formar alumnos con excelencia, basada en principios éticos y
                religiosos, que le permitan desenvolverse y desarrollarse con
                excelencia en el ámbito personal profesional y laboral.
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-16 dark:bg-white/[0.05]" />

        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-primary dark:text-secondary mb-8 font-['Open_Sans']">
            Características
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 
                  dark:bg-black/40 dark:border dark:border-white/[0.05]"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-white/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const features = [
  {
    title: "Aprendizaje interactivo",
    description: "Aprende con materiales de curso dinámicos y herramientas de colaboración",
    icon: <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    title: "Crecimiento personal",
    description: "Rastrea tu progreso y alcanza tus objetivos de aprendizaje a tu propio ritmo",
    icon: <LineChart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    title: "Soporte experto",
    description: "Acceso a instructores cualificados y recursos de aprendizaje completos",
    icon: <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
  },
];
