import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createResearchSessionService } from "@/src/server/services/research-session-service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    return jsonData(await createResearchSessionService(db).listMembers(id, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
