import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";
import { UserRoundIcon } from "lucide-react";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status") as PaymentStatus | "all" | null;

        const session = await auth()
        const userEmail = session?.user?.email as string

        const payments = await prisma.payment.findMany({

            where: {

                userEmail, // Fetch only the payments belonging to the student

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