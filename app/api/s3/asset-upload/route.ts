import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    if (!req.body) {
        return NextResponse.json({ error: 'No body found in request' }, { status: 400 });
    }

    try {
        const data = await req.formData();
        console.log("Form data received:", data); // Log received form data
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

        const fileName = `${Date.now()}-${file.name}`;
        const fileUrl = await uploadFile(buffer, fileName, file.type, type as 'video' | 'image' | 'document' | 'mixed');

        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
}