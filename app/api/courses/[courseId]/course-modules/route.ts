import { requireAdminApi } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as z from "zod"

const createModuleSchema = z.object({
    title: z.string().trim().min(1),
})

export async function POST(req: Request, props: { params: Promise<{courseId: string}> }) {
    const params = await props.params;
    try{

        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const {title} = createModuleSchema.parse(await req.json())

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
