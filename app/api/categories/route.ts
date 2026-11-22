import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";

export async function POST(
    req: Request
) {
    try {
        const authz = await requireAdminApi();
        if (!authz.ok) return authz.response;

        const { categoryName } = await req.json();

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