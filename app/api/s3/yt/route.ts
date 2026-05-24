import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import ytdl from "ytdl-core";
import {prisma} from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { youtubeUrl, chapterId } = await req.json();

        if (!youtubeUrl) {
            return new NextResponse("YouTube URL is required", { status: 400 });
        }

        // Extract video ID and create embed URL
        const urlObj = new URL(youtubeUrl);
        let videoId = '';

        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            videoId = urlObj.searchParams.get('v') || '';
        }

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