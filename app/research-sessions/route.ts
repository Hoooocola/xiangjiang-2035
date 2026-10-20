import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createResearchSessionService } from "@/src/server/services/research-session-service";
import { createResearchSessionSchema, parseInput } from "@/src/server/validation";

export async function POST(request: Request) {
  try {
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    const input = parseInput(createResearchSessionSchema, await request.json().catch(() => null));
    const session = await createResearchSessionService(db).create(input, user.id);
    return jsonData(session, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
