import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from '@/lib/auth';
import { createPublicFileUrl, createStorageKey, getS3Client, getStorageConfig, sanitizePresignedUrl, S3AssetType } from '@/lib/s3';

export const dynamic = 'force-dynamic';

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

    const validTypes: S3AssetType[] = ['video', 'image', 'document', 'mixed'];
    if (!validTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const key = createStorageKey(fileName, fileType);
    const command = new PutObjectCommand({
      Bucket: getStorageConfig().bucketName,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = sanitizePresignedUrl(await getSignedUrl(getS3Client(), command, { expiresIn: 600 }));

    return NextResponse.json({
      presignedUrl,
      fileUrl: createPublicFileUrl(key),
      key
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({ error: 'Error generating pre-signed URL' }, { status: 500 });
  }
}
