import { getDatabase } from "@/src/db/client";
import { notFound } from "@/src/server/errors";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createPlaceRepository } from "@/src/server/repositories/place-repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const repository = createPlaceRepository(getDatabase());
    const place = await repository.findById(id);
    if (!place) throw notFound("PLACE_NOT_FOUND", "地点不存在");
    return jsonData(await repository.listPublishedResearchGaps(id));
  } catch (error) {
    return handleRouteError(error);
  }
}
