import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';

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

        const data = await req.formData();
        const file = data.get('file');
        const type = data.get('type');

        if (!file || !(file instanceof File) || !type || typeof type !== 'string') {
            return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
        }

        const validTypes = ['video', 'image', 'document', 'mixed'];
        if (!validTypes.includes(type)) {
            console.error("Invalid type received:", type); // Log invalid type
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileUrl = await uploadFile(buffer, file.name, file.type, type as 'video' | 'image' | 'document' | 'mixed');

        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
}