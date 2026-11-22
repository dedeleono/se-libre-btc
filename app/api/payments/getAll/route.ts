import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-auth";
import { PaymentStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const authz = await requireAdminApi();
    if (!authz.ok) return authz.response;

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const rawStatus = searchParams.get("status");
        const status = rawStatus && rawStatus !== "all" ? rawStatus : null;
        if (status && !(Object.values(PaymentStatus) as string[]).includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        const payments = await prisma.payment.findMany({
            where: {
                AND: [
                    status ? { status: status as PaymentStatus } : {},
                    search
                        ? {
                            OR: [
                                {
                                    user: {
                                        OR: [
                                            { name: { contains: search, mode: "insensitive" } },
                                            { email: { contains: search, mode: "insensitive" } },
                                        ],
                                    },
                                },
                            ],
                        }
                        : {},
                ],
            },
            select: {
                id: true,
                amount: true,
                status: true,
                productType: true,
                paymentDate: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                course: { select: { title: true } },
                learningPath: { select: { title: true } },
            },
            orderBy: {
                paymentDate: "desc",
            },
        });

        return NextResponse.json(payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount.toString(),
            status: payment.status,
            productType: payment.productType,
            paymentDate: payment.paymentDate,
            user: payment.user,
            productName: payment.course?.title || payment.learningPath?.title || "Subscription",
        })));
    } catch (error) {
        console.error("[PAYMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
