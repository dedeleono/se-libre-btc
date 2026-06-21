import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(
    req: Request,
    props: { params: Promise<{ courseId: string, chapterId: string }> }
) {
    const params = await props.params;
    try {

        const session = await auth()
        const { url } = await req.json()

        const user = session?.user

        if (!user) {
            return new NextResponse("Unauthorized: ", { status: 401 })
        }

        const dataBaseUser = await prisma.user.findUnique({
            where: {
                id: user?.id,
                email: user?.email as string
            }
        })

        if (!dataBaseUser) {
            return new NextResponse("Unauthorized: ", { status: 401 })
        }

        // const courseOwner = await prisma.course.findUnique({
        //     where: {
        //         id: params.courseId,
        //         userId: dataBaseUser?.id
        //     }
        // })

        // if (!courseOwner) {
        //     return new NextResponse("Unauthorized: ", { status: 401 })
        // }

        const attachment = await prisma.attachment.create({
            data: {
                url,
                name: url.split("/").pop(),
                chapterId: params.chapterId,
                uploaderId: dataBaseUser!.id 
            }
        })

        return NextResponse.json(attachment)

    } catch (error) {
        console.log("course_error_id_attachments: ", error)
        return new NextResponse("Internal Error: ", { status: 500 })
    }
}