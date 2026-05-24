import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status") as PaymentStatus | "all" | null;

        const payments = await prisma.payment.findMany({
            where: {
                AND: [
                    status && status !== "all" 
                        ? { 
                            status: status as PaymentStatus 
                          } 
                        : {},
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
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                paymentDate: "desc",
            },
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error("[PAYMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}