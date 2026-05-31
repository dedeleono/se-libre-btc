import { NextResponse } from "next/server";

import { getFileObject, getStorageErrorMessage } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } }
) {
  try {
    const key = params.key.map(decodeURIComponent).join("/");

    if (!key) {
      return NextResponse.json({ error: "Missing file key" }, { status: 400 });
    }

    const object = await getFileObject(key);

    if (!object.Body) {
      return NextResponse.json({ error: "File is empty" }, { status: 404 });
    }

    const body = object.Body.transformToWebStream() as ReadableStream<Uint8Array>;
    const headers = new Headers();

    if (object.ContentType) {
      headers.set("Content-Type", object.ContentType);
    }

    if (object.ContentLength !== undefined) {
      headers.set("Content-Length", String(object.ContentLength));
    }

    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(body, { headers });
  } catch (error) {
    console.error("[S3_FILE_GET]", error);

    return NextResponse.json(
      {
        error: error instanceof Error
          ? getStorageErrorMessage(error)
          : "Unable to read file",
      },
      { status: 500 }
    );
  }
}
