import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_BUCKET_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_BUCKET_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, contentType, fileType } = await req.json();

    if (!fileName || !contentType || !fileType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const validTypes = ['video', 'image', 'document', 'mixed'];
    if (!validTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Generate a unique key for the file
    const key = `assets/${fileType}/${Date.now()}-${fileName}`;

    // Create a command to put an object in the S3 bucket
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    // Generate a pre-signed URL for the command (valid for 10 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    // Return the pre-signed URL and the final URL that will be used after upload
    return NextResponse.json({
      presignedUrl,
      fileUrl: `${process.env.AWS_CLOUDFRONT_URL!}/${key}`,
      key
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({ error: 'Error generating pre-signed URL' }, { status: 500 });
  }
}
