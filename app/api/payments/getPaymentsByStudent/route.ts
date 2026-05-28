import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status") as PaymentStatus | "all" | null;

        const session = await auth()

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const payments = await prisma.payment.findMany({
            where: {
                userId: session.user.id,
                AND: [
                    status && status !== "all"
                        ? { status: status as PaymentStatus }
                        : {},
                    search
                        ? {
                            OR: [
                                { user: { name: { contains: search, mode: "insensitive" } } },
                                { user: { email: { contains: search, mode: "insensitive" } } },
                            ],
                        }
                        : {},
                ],
            },
            include: {
                user: {
                    select: { name: true, email: true },
                },
                course: { select: { title: true } },
                learningPath: { select: { title: true } },
            },
            orderBy: {
                paymentDate: "desc",
            },
        });

        return NextResponse.json(payments.map((payment) => ({
            ...payment,
            amount: payment.amount.toString(),
            productName: payment.course?.title || payment.learningPath?.title || "Subscription",
        })));
    } catch (error) {
        console.error("[PAYMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
