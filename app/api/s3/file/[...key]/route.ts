import { NextResponse } from "next/server";

import { fileResponseHeaders, isServableKey } from "@/lib/file-response";
import { getFileObject, getStorageErrorMessage } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ key: string[] }> }) {
  const params = await props.params;
  try {
    const key = params.key.map(decodeURIComponent).join("/");

    if (!key) {
      return NextResponse.json({ error: "Missing file key" }, { status: 400 });
    }

    if (!isServableKey(key)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const object = await getFileObject(key);

    if (!object.Body) {
      return NextResponse.json({ error: "File is empty" }, { status: 404 });
    }

    const body = object.Body.transformToWebStream() as ReadableStream<Uint8Array>;
    const headers = fileResponseHeaders({ contentType: object.ContentType, contentLength: object.ContentLength });

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
