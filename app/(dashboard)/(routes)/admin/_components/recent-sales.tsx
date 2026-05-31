import { UserAvatar } from "@/components/user-avatar";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { getServerMessages } from "@/lib/i18n-server";

async function getRecentSales() {
  try {
    const sales = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
        learningPath: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: 5,
    });

    return sales;
  } catch (error) {
    console.error("[GET_RECENT_SALES]", error);
    return [];
  }
}

export async function RecentSales() {
  const t = getServerMessages();
  const sales = await getRecentSales();

  if (!sales.length) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        {" "}
        {/* Added container with full height */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative h-8 w-8 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{t.admin.noPaymentsYet}</h3>
            <p className="text-sm text-muted-foreground">
              {t.admin.paymentsAppear}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <UserAvatar
            userId={sale.user.id}
            email={sale.user.email}
            name={sale.user.name}
            image={sale.user.image}
            size={36}
          />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {sale.user.name ?? sale.user.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {sale.course?.title ?? sale.learningPath?.title ?? sale.productType}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium">{formatPrice(sale.amount)}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(sale.paymentDate), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
