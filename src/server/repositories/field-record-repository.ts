import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import {
  fieldRecordMedia,
  fieldRecords,
  places,
  researchSessions,
  teams,
  users,
} from "@/src/db/schema";

export function createFieldRecordRepository(db: AppDatabase) {
  async function mediaFor(recordIds: string[]) {
    if (recordIds.length === 0) return [];
    return db
      .select()
      .from(fieldRecordMedia)
      .where(inArray(fieldRecordMedia.fieldRecordId, recordIds))
      .orderBy(asc(fieldRecordMedia.createdAt));
  }

  return {
    async listBySession(researchSessionId: string) {
      const rows = await db
        .select({
          id: fieldRecords.id,
          displayCode: fieldRecords.displayCode,
          researchSessionId: fieldRecords.researchSessionId,
          authorId: fieldRecords.authorId,
          authorName: users.displayName,
          observation: fieldRecords.observation,
          location: fieldRecords.location,
          locationStatus: fieldRecords.locationStatus,
          evidenceType: fieldRecords.evidenceType,
          contentTags: fieldRecords.contentTags,
          directVisibilityScope: fieldRecords.directVisibilityScope,
          sensitive: fieldRecords.sensitive,
          createdAt: fieldRecords.createdAt,
          updatedAt: fieldRecords.updatedAt,
        })
        .from(fieldRecords)
        .innerJoin(users, eq(fieldRecords.authorId, users.id))
        .where(
          and(
            eq(fieldRecords.researchSessionId, researchSessionId),
            isNull(fieldRecords.archivedAt),
          ),
        )
        .orderBy(desc(fieldRecords.createdAt));

      const media = await mediaFor(rows.map((row) => row.id));
      return rows.map((row) => ({
        ...row,
        media: media.filter((item) => item.fieldRecordId === row.id),
      }));
    },

    async findDetail(id: string) {
      const [row] = await db
        .select({
          id: fieldRecords.id,
          displayCode: fieldRecords.displayCode,
          researchSessionId: fieldRecords.researchSessionId,
          researchSessionName: researchSessions.name,
          placeId: researchSessions.placeId,
          placeName: places.name,
          placeGisSource: places.gisSource,
          ownerTeamId: researchSessions.ownerTeamId,
          ownerTeamName: teams.name,
          authorId: fieldRecords.authorId,
          authorName: users.displayName,
          observation: fieldRecords.observation,
          location: fieldRecords.location,
          locationStatus: fieldRecords.locationStatus,
          evidenceType: fieldRecords.evidenceType,
          contentTags: fieldRecords.contentTags,
          directVisibilityScope: fieldRecords.directVisibilityScope,
          sensitive: fieldRecords.sensitive,
          updatedBy: fieldRecords.updatedBy,
          createdAt: fieldRecords.createdAt,
          updatedAt: fieldRecords.updatedAt,
          archivedAt: fieldRecords.archivedAt,
        })
        .from(fieldRecords)
        .innerJoin(researchSessions, eq(fieldRecords.researchSessionId, researchSessions.id))
        .innerJoin(places, eq(researchSessions.placeId, places.id))
        .innerJoin(teams, eq(researchSessions.ownerTeamId, teams.id))
        .innerJoin(users, eq(fieldRecords.authorId, users.id))
        .where(eq(fieldRecords.id, id))
        .limit(1);

      if (!row) return null;
      return { ...row, media: await mediaFor([id]) };
    },

    async findMedia(recordId: string, mediaId: string) {
      const [media] = await db
        .select()
        .from(fieldRecordMedia)
        .where(
          and(eq(fieldRecordMedia.id, mediaId), eq(fieldRecordMedia.fieldRecordId, recordId)),
        )
        .limit(1);
      return media ?? null;
    },
  };
}
