import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireRoles } from "@/lib/guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireRoles(req, ["MANAGER", "ADMIN"]);
  if ("response" in guard) return guard.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    if (file.size > 4 * 1024 * 1024)
      return NextResponse.json({ error: "Image must be under 4MB" }, { status: 400 });

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    if (!allowed.includes(ext))
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
