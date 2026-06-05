import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { validateUpload } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;

    const formData = await request.formData();
    const validated = await validateUpload(formData);
    if (validated instanceof NextResponse) return validated;
    const { file, safeName } = validated;

    const blob = await put(`gifts/images/${safeName}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
