import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { uploadFile, deleteFile } from "@/lib/s3";
import { prisma } from "@/lib/db";
import ytdl from "ytdl-core";

// Helper to extract video ID from URL
function extractVideoId(url: string) {
    const urlObj = new URL(url);
    let videoId = '';

    if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        videoId = urlObj.searchParams.get('v') || '';
    }

    return videoId;
}

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

        // Check if chapter exists and get its current videoUrl
        const existingChapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: { videoUrl: true, pdfUrl: true }
        });

        if (!existingChapter) {
            return new NextResponse("Chapter not found", { status: 404 });
        }

        // Try to get video info with different options
        const info = await ytdl.getInfo(youtubeUrl);
        
        // Try different format selections
        const formats = info.formats.filter(format => 
            format.hasVideo && 
            format.hasAudio && 
            format.container === 'mp4' &&
            format.qualityLabel?.includes('720p')
        );

        if (!formats.length) {
            return new NextResponse("No suitable video format found", { status: 400 });
        }

        // Sort by quality and pick the best one
        const format = formats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

        // Create download stream
        const stream = ytdl.downloadFromInfo(info, { format });

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        let totalSize = 0;
        const maxSize = 500 * 1024 * 1024; // 500MB limit

        for await (const chunk of stream) {
            chunks.push(chunk);
            totalSize += chunk.length;
            if (totalSize > maxSize) {
                throw new Error("Video file too large (max 500MB)");
            }
        }

        const buffer = Buffer.concat(chunks);

        // Delete existing video and PDF if they exist
        if (existingChapter.videoUrl) {
            try {
                await deleteFile(existingChapter.videoUrl);
            } catch (error) {
                console.error("Error deleting old video:", error);
            }
        }
        
        if (existingChapter.pdfUrl) {
            try {
                await deleteFile(existingChapter.pdfUrl);
            } catch (error) {
                console.error("Error deleting old PDF:", error);
            }
        }

        // Generate filename
        const sanitizedTitle = info.videoDetails.title
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .substring(0, 50);
        const fileName = `${Date.now()}-${sanitizedTitle}.mp4`;

        // Upload to S3
        const fileUrl = await uploadFile(
            buffer,
            fileName,
            'video/mp4',
            'video'
        );

        // Update chapter in database
        await prisma.chapter.update({
            where: { id: chapterId },
            data: {
                videoUrl: fileUrl,
                pdfUrl: null, // Clear PDF URL since we can't have both
            }
        });

        return NextResponse.json({ url: fileUrl });

    } catch (error) {
        console.error("Error processing YouTube video:", error);
        if (error instanceof Error) {
            if (error.message.includes("Too many requests")) {
                return new NextResponse("Rate limited by YouTube. Please try again later.", { status: 429 });
            }
            return new NextResponse(error.message, { status: 400 });
        }
        return new NextResponse("Error processing video", { status: 500 });
    }
} 