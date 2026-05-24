import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(
    req: Request
) {
    try {
        const session = await auth();
        const { categoryName } = await req.json();

        if (!session?.user) {
            return (
                new NextResponse("Unauthorized", { status: 401 })
            )
        }
        if (!categoryName) {
            return new NextResponse("Category name is required", { status: 400 });
        }
        
        // Check if the category exists
        let category = await prisma.category.findUnique({
            where: { name: categoryName },
        });

        // If the category doesn't exist, create it
        if (!category) {
            category = await prisma.category.create({
                data: { name: categoryName },
            });
        }

        return NextResponse.json(category);

    } catch (error) {
        console.error("Error updating category: ", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}