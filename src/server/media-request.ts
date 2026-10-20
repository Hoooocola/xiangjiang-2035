import { DomainError } from "./errors";
import { mediaFromFile, type IncomingMedia } from "./storage/media-validation";

export async function readFieldRecordRequest(request: Request): Promise<{
  payload: unknown;
  media: IncomingMedia[];
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return { payload: await request.json().catch(() => null), media: [] };
  }

  const form = await request.formData();
  const rawPayload = form.get("payload");
  let payload: unknown = null;
  if (typeof rawPayload === "string") {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      throw new DomainError("VALIDATION_ERROR", "payload 必须是有效 JSON", 400);
    }
  }
  const media = form
    .getAll("media")
    .filter((item): item is File => item instanceof File)
    .map(mediaFromFile);
  return { payload, media };
}

export async function readSingleMediaRequest(request: Request) {
  const form = await request.formData();
  const file = form.get("media");
  if (!(file instanceof File)) {
    throw new DomainError("VALIDATION_ERROR", "请选择一张图片", 400, {
      media: ["缺少图片文件"],
    });
  }
  return mediaFromFile(file);
}
