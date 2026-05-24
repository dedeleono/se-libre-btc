import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: { levelId: string } }
) {
    try {
        const { price, inscriptionPrice } = await req.json();

        const level = await prisma.level.update({
            where: {
                id: params.levelId,
            },
            data: {
                price,
                inscriptionPrice,
            },
        });

        return NextResponse.json(level);
    } catch (error) {
        console.error("[LEVEL_PRICING_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}