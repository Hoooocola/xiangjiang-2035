import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DomainError } from "../errors";
import type { StorageAdapter } from "./storage-adapter";

const prefix = "local-dev://";

function safeRelativePath(value: string) {
  const normalized = path.posix.normalize(value).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..") || normalized.includes("/../")) {
    throw new DomainError("MEDIA_UPLOAD_FAILED", "无效的存储引用", 500);
  }
  return normalized;
}

export class LocalDevelopmentStorage implements StorageAdapter {
  constructor(private readonly root: string) {}

  async put(input: { key: string; bytes: Uint8Array; mimeType: string }) {
    const relative = safeRelativePath(input.key);
    const target = path.join(this.root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.bytes, { flag: "wx" });
    return { storageRef: `${prefix}${relative}` };
  }

  async get(storageRef: string) {
    if (!storageRef.startsWith(prefix)) {
      throw new DomainError("MEDIA_UPLOAD_FAILED", "当前存储适配器无法读取该引用", 500);
    }
    const relative = safeRelativePath(storageRef.slice(prefix.length));
    return {
      bytes: await readFile(path.join(this.root, relative)),
      mimeType: "application/octet-stream",
    };
  }
}
