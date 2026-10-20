export type StoredObject = {
  bytes: Uint8Array;
  mimeType: string;
};

export interface StorageAdapter {
  put(input: { key: string; bytes: Uint8Array; mimeType: string }): Promise<{ storageRef: string }>;
  get(storageRef: string): Promise<StoredObject>;
}
