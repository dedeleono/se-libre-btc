import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {

        const session = await auth()

        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const { list } = await req.json()

        for (const item of list) {
            await prisma.courseModule.update({
                where:{
                    id: item.id,
                },
                data: {
                    position: item.position
                }
            })
        }

        return new NextResponse("Success", {status: 200})

    } catch (error) {
        console.log("[REORDER]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}