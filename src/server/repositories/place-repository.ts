import { and, asc, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import { places, researchGaps } from "@/src/db/schema";

export function createPlaceRepository(db: AppDatabase) {
  return {
    list() {
      return db.select().from(places).where(isNull(places.archivedAt)).orderBy(asc(places.name));
    },

    async findById(id: string) {
      const [place] = await db
        .select()
        .from(places)
        .where(and(eq(places.id, id), isNull(places.archivedAt)))
        .limit(1);
      return place ?? null;
    },

    listPublishedResearchGaps(placeId: string) {
      return db
        .select()
        .from(researchGaps)
        .where(
          and(
            eq(researchGaps.placeId, placeId),
            eq(researchGaps.status, "Published"),
            isNull(researchGaps.archivedAt),
          ),
        )
        .orderBy(asc(researchGaps.createdAt));
    },
  };
}
