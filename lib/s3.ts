import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_BUCKET_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_BUCKET_SECRET_ACCESS_KEY!,
    },
});

export async function uploadFile(file: Buffer, fileName: string, contentType: string, type: 'video' | 'image' | 'document' | 'mixed') {
    const key = `assets/${type}/${fileName}`;
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    try {
        await s3Client.send(command);
        return `${process.env.AWS_CLOUDFRONT_URL!}/${key}`;
    } catch (error) {
        console.error("Error uploading file:", error);
        console.error("File Name:", fileName);
        console.error("Content Type:", contentType);
        console.error("Type:", type);
        throw new Error("Failed to upload file");
    }
}

export async function deleteFile(fileUrl: string) {
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(3).join('/');

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting file:", error);
        throw new Error("Failed to delete file");
    }
}