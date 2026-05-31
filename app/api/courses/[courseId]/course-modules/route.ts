import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as z from "zod"

const createModuleSchema = z.object({
    title: z.string().trim().min(1),
})

export async function POST(
    req: Request,
    { params } : { params: {courseId: string} }
){
    try{

        const session = await auth()
        const {title} = createModuleSchema.parse(await req.json())

        if(!session?.user) return new NextResponse("Unauthorized", {status: 401})
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

        const lastModule = await prisma.courseModule.findFirst({
            where:{
                courseId: params.courseId
            },
            orderBy: {
                position: "desc"
            }
        })

        const newPosition = lastModule ? lastModule.position + 1 : 1;

        const courseModule = await prisma.courseModule.create({
            data:{
                title,
                courseId: params.courseId,
                position: newPosition
            }
        })

        return NextResponse.json(courseModule)

    } catch(error){
        console.log("[MODULES]", error)
        return new NextResponse("Internal Error", {status: 500})
    }
}
