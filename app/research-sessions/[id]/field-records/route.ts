import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { readFieldRecordRequest } from "@/src/server/media-request";
import { createFieldRecordService } from "@/src/server/services/field-record-service";
import { getStorageAdapter } from "@/src/server/storage";
import { createFieldRecordSchema, parseInput } from "@/src/server/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const records = await createFieldRecordService(db, getStorageAdapter()).list(id, user.id);
    return jsonData(records);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const requestData = await readFieldRecordRequest(request);
    const input = parseInput(createFieldRecordSchema, requestData.payload);
    const record = await createFieldRecordService(db, getStorageAdapter()).create(
      id,
      input,
      user.id,
      requestData.media,
    );
    return jsonData(record, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
