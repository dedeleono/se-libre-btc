import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, imageUrl, onboardingCompleted, ageRange, country, region } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (imageUrl !== undefined) updateData.image = imageUrl;
        if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
        if (ageRange !== undefined) updateData.ageRange = ageRange;
        if (country !== undefined) updateData.country = country;
        if (region !== undefined) updateData.region = region;

        const user = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USERS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 