import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendEmails } from "@/lib/email";

interface EmailRequest {
  subject: string;
  content: string;
  recipients: string[];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      return NextResponse.json(
        { error: "Email configuration missing" },
        { status: 500 }
      );
    }

    const { subject, content, recipients } = (await req.json()) as EmailRequest;

    const results = await sendEmails(
      recipients.map((to) => ({ to, subject, html: content }))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      summary: {
        total: recipients.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error("[EMAIL_SEND]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
