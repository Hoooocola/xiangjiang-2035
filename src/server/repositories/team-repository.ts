import { and, asc, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import { teamMembers, teams } from "@/src/db/schema";

export function createTeamRepository(db: AppDatabase) {
  return {
    listForUser(userId: string) {
      return db
        .select({
          id: teams.id,
          name: teams.name,
          course: teams.course,
          year: teams.year,
          ownerId: teams.ownerId,
          memberRole: teamMembers.role,
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(and(eq(teamMembers.userId, userId), isNull(teams.archivedAt)))
        .orderBy(asc(teams.name));
    },
  };
}
