import path from "node:path";
import { DomainError } from "../errors";
import { LocalDevelopmentStorage } from "./local-development-storage";
import type { StorageAdapter } from "./storage-adapter";

let storage: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  if (storage) return storage;

  const adapter = process.env.STORAGE_ADAPTER ?? "local-development";
  if (adapter === "local-development" && process.env.NODE_ENV !== "production") {
    const root = process.env.LOCAL_STORAGE_ROOT ?? path.join(process.cwd(), ".data", "uploads");
    storage = new LocalDevelopmentStorage(root);
    return storage;
  }

  throw new DomainError(
    "STORAGE_NOT_CONFIGURED",
    "Production object storage adapter has not been configured",
    503,
  );
}

export type { StorageAdapter } from "./storage-adapter";
