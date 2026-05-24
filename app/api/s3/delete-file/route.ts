import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/s3';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL' }, { status: 400 });
    }

    // Delete file from S3
    await deleteFile(fileUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json({ error: 'Error deleting file' }, { status: 500 });
  }
}
