import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError } from "@/src/server/http";
import { createFieldRecordService } from "@/src/server/services/field-record-service";
import { getStorageAdapter } from "@/src/server/storage";

type Context = { params: Promise<{ id: string; mediaId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id, mediaId } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const { media, object } = await createFieldRecordService(db, getStorageAdapter()).readMedia(
      id,
      mediaId,
      user.id,
    );
    const responseBytes = Uint8Array.from(object.bytes);
    return new Response(responseBytes.buffer, {
      headers: {
        "content-type": media.mimeType,
        "content-length": String(object.bytes.byteLength),
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(media.filename)}`,
        "cache-control": "private, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
