import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createResearchSessionService } from "@/src/server/services/research-session-service";
import { parseInput, updateResearchSessionSchema } from "@/src/server/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    return jsonData(await createResearchSessionService(db).read(id, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const input = parseInput(updateResearchSessionSchema, await request.json().catch(() => null));
    return jsonData(await createResearchSessionService(db).update(id, input, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
