import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createFieldRecordService } from "@/src/server/services/field-record-service";
import { getStorageAdapter } from "@/src/server/storage";
import { parseInput, updateFieldRecordSchema } from "@/src/server/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    return jsonData(await createFieldRecordService(db, getStorageAdapter()).read(id, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const input = parseInput(updateFieldRecordSchema, await request.json().catch(() => null));
    return jsonData(
      await createFieldRecordService(db, getStorageAdapter()).update(id, input, user.id),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
