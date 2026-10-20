import path from "node:path";
import { DomainError } from "../errors";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type IncomingMedia = {
  filename: string;
  declaredMimeType: string;
  size: number;
  capturedAt?: Date | null;
  bytes(): Promise<Uint8Array>;
};

export type ValidatedImage = {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  extension: "jpg" | "png" | "gif" | "webp";
  filename: string;
};

export function normalizeFilename(value: string) {
  const base = path.basename(value).normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "");
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]+/gu, "-").replace(/\s+/g, " ").trim();
  return (cleaned || "field-image").slice(0, 180);
}

function detectImage(bytes: Uint8Array): Pick<ValidatedImage, "mimeType" | "extension"> | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) return { mimeType: "image/png", extension: "png" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  const text = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (text.startsWith("GIF87a") || text.startsWith("GIF89a")) {
    return { mimeType: "image/gif", extension: "gif" };
  }
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return null;
}

export async function validateImage(input: IncomingMedia): Promise<ValidatedImage> {
  if (input.size > MAX_IMAGE_BYTES) {
    throw new DomainError("MEDIA_TOO_LARGE", "图片不能超过 10 MB", 413);
  }
  const bytes = await input.bytes();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new DomainError("MEDIA_TOO_LARGE", "图片不能超过 10 MB", 413);
  }
  const detected = detectImage(bytes);
  if (!detected) {
    throw new DomainError("MEDIA_INVALID_TYPE", "仅支持 JPEG、PNG、GIF 或 WebP 图片", 415);
  }
  return {
    bytes,
    filename: normalizeFilename(input.filename),
    ...detected,
  };
}

export function mediaFromFile(file: File): IncomingMedia {
  return {
    filename: file.name,
    declaredMimeType: file.type || "application/octet-stream",
    size: file.size,
    bytes: async () => new Uint8Array(await file.arrayBuffer()),
  };
}
