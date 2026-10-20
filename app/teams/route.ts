import { getDatabase } from "@/src/db/client";
import { requireCurrentUser } from "@/src/server/auth";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createTeamRepository } from "@/src/server/repositories/team-repository";

export async function GET(request: Request) {
  try {
    const db = getDatabase();
    const user = await requireCurrentUser(request, db);
    return jsonData(await createTeamRepository(db).listForUser(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
