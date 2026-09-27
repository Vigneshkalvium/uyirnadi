import { randomUUID } from "node:crypto";
import {
  authorize,
  apiError,
  verifyMutation,
  APIError,
} from "@/lib/auth/server";
import { bucket } from "@/lib/firebase/admin";
import { allowedFileTypes, maxFileSize } from "@/lib/validation";
import {ownedStoragePath} from '@/lib/storage/paths';
export async function POST(req: Request) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    if (Number(req.headers.get("content-length")) > maxFileSize + 100000)
      throw new APIError(413, "Files must be smaller than 8 MB.");
    const form = await req.formData();
    const file = form.get("file");
    const folder = form.get("folder");
    if (
      !(file instanceof File) ||
      !["prescriptions", "health-reports", "profile"].includes(String(folder))
    )
      throw new APIError(400, "Choose a valid file.");
    if (
      !allowedFileTypes.includes(file.type) ||
      file.size > maxFileSize ||
      file.size === 0
    )
      throw new APIError(400, "Choose a PDF, JPG or PNG smaller than 8 MB.");
    if (folder === "profile" && file.type === "application/pdf")
      throw new APIError(400, "Choose an image for your profile.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid =
      file.type === "application/pdf"
        ? bytes.subarray(0, 5).toString() === "%PDF-"
        : file.type === "image/png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid)
      throw new APIError(400, "The file content does not match its format.");
    const path = `users/${user.uid}/${folder}/${randomUUID()}`;
    await bucket()
      .file(path)
      .save(bytes, {
        contentType: file.type,
        resumable: false,
        metadata: { cacheControl: "private, no-store" },
      });
    return Response.json({
      storagePath: path,
      name: file.name,
      mimeType: file.type,
    });
  } catch (e) {
    if((e as {code?:number}).code===404) return Response.json({error:'Private document storage has not been set up. Ask the administrator to finish Firebase Storage setup.'},{status:503});
    return apiError(e);
  }
}
export async function GET(req: Request) {
  try {
    const user = await authorize();
    const path = new URL(req.url).searchParams.get("path");
    if (!path || !ownedStoragePath(path,user.uid))
      throw new APIError(403, "This file is private.");
    const file = bucket().file(path);
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
