import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { decideUpload, MAX_UPLOAD_BYTES } from '@/lib/upload-policy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    if (!req.body) {
        return NextResponse.json({ error: 'No body found in request' }, { status: 400 });
    }

    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (Number(req.headers.get('content-length')) > MAX_UPLOAD_BYTES + 1024 * 1024) {
            return NextResponse.json({ error: 'File too large' }, { status: 413 });
        }

        const data = await req.formData();
        const file = data.get('file');
        const type = data.get('type');

        if (!file || !(file instanceof File) || !type || typeof type !== 'string') {
            return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
        }

        const decision = decideUpload({ role: session.user.role, channel: 'server', kind: type, contentType: file.type, size: file.size });
        if (!decision.ok) {
            return NextResponse.json({ error: decision.reason }, { status: decision.status });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileUrl = await uploadFile(buffer, file.name, decision.contentType, decision.kind);

        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return NextResponse.json(
            {
                error: error instanceof Error
                    ? error.message
                    : 'Error uploading file',
            },
            { status: 500 }
        );
    }
}
