import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type S3AssetType = 'video' | 'image' | 'document' | 'mixed';

type StorageConfig = {
    bucketName: string;
    bucketId?: string;
    endpoint: string;
    endpointHost: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl?: string;
};

let s3Client: S3Client | null = null;

function getEnv(names: string[]) {
    return names.map((name) => process.env[name]).find(Boolean);
}

function requireEnv(names: string[]) {
    const value = getEnv(names);

    if (!value) {
        throw new Error(`Missing storage environment variable. Expected one of: ${names.join(', ')}`);
    }

    return value;
}

function normalizeB2Endpoint(endpoint: string) {
    const host = endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    return {
        host,
        url: `https://${host}`,
    };
}

function inferB2Region(endpointHost: string) {
    return endpointHost.match(/s3[.-]([a-z0-9-]+)\.backblazeb2\.com/i)?.[1] ?? 'us-east-005';
}

function encodeKeyForUrl(key: string) {
    return key.split('/').map(encodeURIComponent).join('/');
}

function stripLeadingSlash(value: string) {
    return value.replace(/^\/+/, '');
}

function stripTrailingSlash(value: string) {
    return value.replace(/\/+$/, '');
}

export function getStorageConfig(): StorageConfig {
    const endpoint = requireEnv(['B2_ENDPOINT', 'BACKBLAZE_ENDPOINT', 'BACKBLAZE_BUCKET_ENDPOINT', 'S3_ENDPOINT']);
    const normalizedEndpoint = normalizeB2Endpoint(endpoint);

    return {
        bucketName: requireEnv(['B2_BUCKET_NAME', 'BACKBLAZE_BUCKET_NAME', 'AWS_BUCKET_NAME']),
        bucketId: getEnv(['B2_BUCKET_ID', 'BACKBLAZE_BUCKET_ID']),
        endpoint: normalizedEndpoint.url,
        endpointHost: normalizedEndpoint.host,
        region: getEnv(['B2_REGION', 'BACKBLAZE_BUCKET_REGION', 'BACKBLAZE_REGION', 'AWS_BUCKET_REGION', 'AWS_REGION'])
            || inferB2Region(normalizedEndpoint.host),
        accessKeyId: requireEnv(['B2_APPLICATION_KEY_ID', 'BACKBLAZE_KEY_ID', 'BACKBLAZE_BUCKET_ACCESS_KEY', 'AWS_BUCKET_ACCESS_KEY', 'AWS_ACCESS_KEY_ID']),
        secretAccessKey: requireEnv(['B2_APPLICATION_KEY', 'BACKBLAZE_APPLICATION_KEY', 'BACKBLAZE_BUCKET_SECRET_ACCESS_KEY', 'AWS_BUCKET_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY']),
        publicUrl: getEnv(['B2_DOWNLOAD_URL', 'B2_PUBLIC_URL', 'BACKBLAZE_PUBLIC_URL', 'AWS_CLOUDFRONT_URL'])?.replace(/\/$/, ''),
    };
}

export function getS3Client() {
    if (!s3Client) {
        const config = getStorageConfig();

        s3Client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            forcePathStyle: false,
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        } as any);
    }

    return s3Client;
}

export function createStorageKey(fileName: string, type: S3AssetType) {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `assets/${type}/${Date.now()}-${safeFileName || 'file'}`;
}

export function sanitizePresignedUrl(url: string) {
    const parsed = new URL(url);

    for (const key of Array.from(parsed.searchParams.keys())) {
        if (key.startsWith('x-amz-checksum') || key.startsWith('x-amz-sdk-') || key === 'x-amz-trailer') {
            parsed.searchParams.delete(key);
        }
    }

    return parsed.toString();
}

export function createPublicFileUrl(key: string) {
    const config = getStorageConfig();
    const encodedKey = encodeKeyForUrl(key);

    if (config.publicUrl) {
        return `${stripTrailingSlash(config.publicUrl)}/${encodedKey}`;
    }

    return `https://${config.bucketName}.${config.endpointHost}/${encodedKey}`;
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: getStorageConfig().bucketName, Key: key });

    return getSignedUrl(getS3Client(), command, { expiresIn });
}

export function getStorageKeyFromUrl(fileUrlOrKey: string) {
    try {
        const config = getStorageConfig();
        const file = new URL(fileUrlOrKey);
        const publicUrl = config.publicUrl ? new URL(config.publicUrl) : null;

        if (publicUrl && file.origin === publicUrl.origin) {
            const publicPath = stripLeadingSlash(stripTrailingSlash(decodeURIComponent(publicUrl.pathname)));
            const filePath = stripLeadingSlash(decodeURIComponent(file.pathname));

            if (!publicPath) {
                return filePath;
            }

            if (filePath.startsWith(`${publicPath}/`)) {
                return filePath.slice(publicPath.length + 1);
            }
        }

        const friendlyMatch = fileUrlOrKey.match(/backblazeb2\.com\/file\/[^/]+\/(.+)$/);
        if (friendlyMatch?.[1]) {
            return decodeURIComponent(friendlyMatch[1]);
        }

        return stripLeadingSlash(decodeURIComponent(file.pathname));
    } catch {
        return fileUrlOrKey;
    }
}

export async function uploadFile(file: Buffer, fileName: string, contentType: string, type: S3AssetType) {
    const key = createStorageKey(fileName, type);
    const command = new PutObjectCommand({
        Bucket: getStorageConfig().bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    try {
        await getS3Client().send(command);
        return createPublicFileUrl(key);
    } catch (error) {
        console.error("Error uploading file:", error);
        console.error("File Name:", fileName);
        console.error("Content Type:", contentType);
        console.error("Type:", type);
        throw new Error("Failed to upload file");
    }
}

export async function deleteFile(fileUrlOrKey: string) {
    const key = getStorageKeyFromUrl(fileUrlOrKey);

    const command = new DeleteObjectCommand({
        Bucket: getStorageConfig().bucketName,
        Key: key,
    });

    try {
        await getS3Client().send(command);
    } catch (error) {
        console.error("Error deleting file:", error);
        throw new Error("Failed to delete file");
    }
}