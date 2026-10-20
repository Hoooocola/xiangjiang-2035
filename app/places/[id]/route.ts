import { getDatabase } from "@/src/db/client";
import { notFound } from "@/src/server/errors";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createPlaceRepository } from "@/src/server/repositories/place-repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const place = await createPlaceRepository(getDatabase()).findById(id);
    if (!place) throw notFound("PLACE_NOT_FOUND", "地点不存在");
    return jsonData(place);
  } catch (error) {
    return handleRouteError(error);
  }
}
