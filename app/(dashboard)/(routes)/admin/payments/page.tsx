import { ScrollArea } from "@/components/ui/scroll-area";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, AlertCircle } from "lucide-react";
import { PaymentsTable } from "./_components/payments-table";
import { formatPrice } from "@/lib/utils";

async function getPaymentsData() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

  const [
    totalRevenue,
    monthlyRevenue,
    totalPayments,
    pendingPayments
  ] = await Promise.all([
    // Total revenue
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true }
    }),
    // Monthly revenue
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        paymentDate: { gte: thirtyDaysAgo }
      },
      _sum: { amount: true }
    }),
    // Total payments count
    prisma.payment.count({
      where: { status: "COMPLETED" }
    }),
    // Pending payments
    prisma.payment.count({
      where: { status: "PENDING" }
    })
  ]);

  return {
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
    totalPayments,
    pendingPayments
  };
}

export default async function PaymentsPage() {
  const data = await getPaymentsData();

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5
              dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05]
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
              <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-primary dark:text-white/90" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl
                bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                dark:from-white dark:to-white/70 font-['Open_Sans']">
                Pagos
              </h2>
              <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
Manage course, learning path, and subscription payments
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Ingresos Totales
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatPrice(data.totalRevenue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Ingresos Mensuales
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatPrice(data.monthlyRevenue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Pagos Completados
                </p>
                <p className="text-xl sm:text-2xl font-bold">{data.totalPayments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 border-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Pagos Pendientes
                </p>
                <p className="text-xl sm:text-2xl font-bold">{data.pendingPayments}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="rounded-lg bg-card overflow-hidden p-3 sm:p-4 md:p-6">
          <PaymentsTable />
        </div>
      </div>
    </ScrollArea>
    
  );
}

export const revalidate = 0;
