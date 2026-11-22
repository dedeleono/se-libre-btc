import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdminApi } from '@/lib/api-auth';
import { createPublicFileUrl, createStorageKey, getS3Client, getStorageConfig, getStorageErrorMessage, sanitizePresignedUrl } from '@/lib/s3';
import { decideUpload } from '@/lib/upload-policy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authz = await requireAdminApi();
    if (!authz.ok) return authz.response;

    const { fileName, contentType, fileType, size } = await req.json();

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const decision = decideUpload({ role: authz.session.user.role, channel: 'presigned', kind: fileType, contentType, size });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.reason }, { status: decision.status });
    }

    const key = createStorageKey(fileName, decision.kind);
    const command = new PutObjectCommand({
      Bucket: getStorageConfig().bucketName,
      Key: key,
      ContentType: decision.contentType,
    });

    const presignedUrl = sanitizePresignedUrl(await getSignedUrl(getS3Client(), command, { expiresIn: 600 }));

    return NextResponse.json({
      presignedUrl,
      fileUrl: createPublicFileUrl(key),
      key
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? getStorageErrorMessage(error)
          : 'Error generating pre-signed URL',
      },
      { status: 500 }
    );
  }
}
