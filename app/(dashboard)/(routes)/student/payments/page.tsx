import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { PaymentsTable } from "./_components/payments-table";

export default async function PaymentsPage() {

  const session = await auth();

  if (!session) {
    // Optionally, you can handle unauthenticated access by redirecting or showing an error.
    // For example:
    return redirect("/sign-in");
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5
              dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05]
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border"
            >
              <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-primary dark:text-white/90" />
            </div>
            <div>
              <h2
                className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl
                bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                dark:from-white dark:to-white/70 font-['Open_Sans']"
              >
                Historial de Pagos
              </h2>
              <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
                Aquí puedes ver el historial de tus pagos
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-card overflow-hidden p-5">
          {/* Optionally, if you don't need the Tabs (e.g., pricing info), you can remove them */}
          <PaymentsTable  />
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
