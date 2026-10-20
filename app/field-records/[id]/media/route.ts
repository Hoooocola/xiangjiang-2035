import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { readSingleMediaRequest } from "@/src/server/media-request";
import { createFieldRecordService } from "@/src/server/services/field-record-service";
import { getStorageAdapter } from "@/src/server/storage";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const media = await createFieldRecordService(db, getStorageAdapter()).addMedia(
      id,
      await readSingleMediaRequest(request),
      user.id,
    );
    return jsonData(media, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
