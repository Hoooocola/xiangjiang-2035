import { asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import {
  places,
  researchGaps,
  researchSessionMembers,
  researchSessionResearchGaps,
  researchSessions,
  teams,
  users,
} from "@/src/db/schema";

export function createResearchSessionRepository(db: AppDatabase) {
  return {
    async findDetail(id: string) {
      const [session] = await db
        .select({
          id: researchSessions.id,
          placeId: researchSessions.placeId,
          placeName: places.name,
          placeSlug: places.slug,
          placeLocation: places.location,
          placeGisSource: places.gisSource,
          ownerTeamId: researchSessions.ownerTeamId,
          ownerTeamName: teams.name,
          createdBy: researchSessions.createdBy,
          name: researchSessions.name,
          researchQuestion: researchSessions.researchQuestion,
          objective: researchSessions.objective,
          methods: researchSessions.methods,
          plannedStartAt: researchSessions.plannedStartAt,
          plannedEndAt: researchSessions.plannedEndAt,
          scopeText: researchSessions.scopeText,
          currentPrimaryPhase: researchSessions.currentPrimaryPhase,
          status: researchSessions.status,
          directVisibilityScope: researchSessions.directVisibilityScope,
          createdAt: researchSessions.createdAt,
          updatedAt: researchSessions.updatedAt,
          archivedAt: researchSessions.archivedAt,
        })
        .from(researchSessions)
        .innerJoin(places, eq(researchSessions.placeId, places.id))
        .innerJoin(teams, eq(researchSessions.ownerTeamId, teams.id))
        .where(eq(researchSessions.id, id))
        .limit(1);

      if (!session) return null;

      const [members, sourceResearchGaps] = await Promise.all([
        db
          .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            role: researchSessionMembers.role,
          })
          .from(researchSessionMembers)
          .innerJoin(users, eq(researchSessionMembers.userId, users.id))
          .where(eq(researchSessionMembers.researchSessionId, id))
          .orderBy(asc(researchSessionMembers.createdAt)),
        db
          .select({
            id: researchGaps.id,
            title: researchGaps.title,
            statement: researchGaps.statement,
            status: researchGaps.status,
          })
          .from(researchSessionResearchGaps)
          .innerJoin(researchGaps, eq(researchSessionResearchGaps.researchGapId, researchGaps.id))
          .where(eq(researchSessionResearchGaps.researchSessionId, id))
          .orderBy(asc(researchSessionResearchGaps.createdAt)),
      ]);

      return { ...session, members, sourceResearchGaps };
    },

    listMembers(id: string) {
      return db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          role: researchSessionMembers.role,
          joinedAt: researchSessionMembers.createdAt,
        })
        .from(researchSessionMembers)
        .innerJoin(users, eq(researchSessionMembers.userId, users.id))
        .where(eq(researchSessionMembers.researchSessionId, id))
        .orderBy(asc(researchSessionMembers.createdAt));
    },
  };
}
