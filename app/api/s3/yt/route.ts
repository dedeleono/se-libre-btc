import { requireAdminApi } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import {prisma} from "@/lib/db";
import { parseYouTubeId } from "@/lib/youtube";

export async function POST(req: Request) {
    try {
        const authz = await requireAdminApi();
        if (!authz.ok) return authz.response;

        const { youtubeUrl, chapterId } = await req.json();

        if (!youtubeUrl) {
            return new NextResponse("YouTube URL is required", { status: 400 });
        }

        const videoId = parseYouTubeId(youtubeUrl);

        if (!videoId) {
            return new NextResponse("Invalid YouTube URL", { status: 400 });
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}`;

        // Update the chapter with both URLs
        await prisma.chapter.update({
            where: { id: chapterId },
            data: {
                youtubeUrl: embedUrl,
            }
        });

        return NextResponse.json({ url: embedUrl });

    } catch (error) {
        console.error("Error processing YouTube URL:", error);
        return new NextResponse("Error processing URL", { status: 500 });
    }
}