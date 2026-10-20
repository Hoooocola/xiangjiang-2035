import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import { researchSessionMembers, teamMembers } from "@/src/db/schema";
import { forbidden } from "./errors";

type QueryDatabase = Pick<AppDatabase, "query">;

export async function requireTeamMember(db: QueryDatabase, teamId: string, userId: string) {
  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
  });
  if (!membership) {
    throw forbidden("FORBIDDEN", "你不是该团队成员");
  }
  return membership;
}

export async function requireSessionMember(
  db: QueryDatabase,
  researchSessionId: string,
  userId: string,
) {
  const membership = await db.query.researchSessionMembers.findFirst({
    where: and(
      eq(researchSessionMembers.researchSessionId, researchSessionId),
      eq(researchSessionMembers.userId, userId),
    ),
  });
  if (!membership) {
    throw forbidden("SESSION_FORBIDDEN", "你不是该调研成员");
  }
  return membership;
}

export async function requireSessionEditor(
  db: QueryDatabase,
  researchSessionId: string,
  userId: string,
) {
  const membership = await requireSessionMember(db, researchSessionId, userId);
  if (membership.role === "Reviewer") {
    throw forbidden("SESSION_FORBIDDEN", "审核者不能编辑调研计划");
  }
  return membership;
}

export async function requireSessionOwner(
  db: QueryDatabase,
  researchSessionId: string,
  userId: string,
) {
  const membership = await requireSessionMember(db, researchSessionId, userId);
  if (membership.role !== "Owner") {
    throw forbidden("SESSION_FORBIDDEN", "该操作仅限调研负责人");
  }
  return membership;
}
