import { getDatabase } from "@/src/db/client";
import { handleRouteError, jsonData } from "@/src/server/http";
import { createPlaceRepository } from "@/src/server/repositories/place-repository";

export async function GET() {
  try {
    const places = await createPlaceRepository(getDatabase()).list();
    return jsonData(places);
  } catch (error) {
    return handleRouteError(error);
  }
}
