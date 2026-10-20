import { and, eq, inArray, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import {
  auditEvents,
  places,
  researchGaps,
  researchSessionMembers,
  researchSessionResearchGaps,
  researchSessions,
  teams,
} from "@/src/db/schema";
import { requireSessionEditor, requireSessionMember, requireTeamMember } from "../authorization";
import { DomainError, notFound } from "../errors";
import { logServerEvent } from "../logger";
import { createResearchSessionRepository } from "../repositories/research-session-repository";
import type { CreateResearchSessionInput, UpdateResearchSessionInput } from "../validation";

export function createResearchSessionService(db: AppDatabase) {
  const repository = createResearchSessionRepository(db);

  return {
    async create(input: CreateResearchSessionInput, actorUserId: string) {
      const sourceGapIds = [...new Set(input.sourceResearchGapRefs)];

      const sessionId = await db.transaction(async (tx) => {
        const [place] = await tx
          .select({ id: places.id })
          .from(places)
          .where(and(eq(places.id, input.placeId), isNull(places.archivedAt)))
          .limit(1);
        if (!place) throw notFound("PLACE_NOT_FOUND", "地点不存在");

        const [team] = await tx
          .select({ id: teams.id })
          .from(teams)
          .where(and(eq(teams.id, input.ownerTeamId), isNull(teams.archivedAt)))
          .limit(1);
        if (!team) throw notFound("TEAM_NOT_FOUND", "团队不存在");

        await requireTeamMember(tx, input.ownerTeamId, actorUserId);

        if (sourceGapIds.length > 0) {
          const gapRows = await tx
            .select({ id: researchGaps.id, placeId: researchGaps.placeId })
            .from(researchGaps)
            .where(inArray(researchGaps.id, sourceGapIds));

          if (gapRows.length !== sourceGapIds.length) {
            throw notFound("GAP_NOT_FOUND", "一个或多个研究缺口不存在");
          }
          if (gapRows.some((gap) => gap.placeId !== input.placeId)) {
            throw new DomainError(
              "GAP_PLACE_MISMATCH",
              "研究缺口必须与调研地点一致",
              422,
              { sourceResearchGapRefs: ["包含其他地点的研究缺口"] },
            );
          }
        }

        const [session] = await tx
          .insert(researchSessions)
          .values({
            placeId: input.placeId,
            ownerTeamId: input.ownerTeamId,
            createdBy: actorUserId,
            name: input.name,
            researchQuestion: input.researchQuestion,
            objective: input.objective,
            methods: input.methods,
            plannedStartAt: input.plannedTime?.startAt
              ? new Date(input.plannedTime.startAt)
              : null,
            plannedEndAt: input.plannedTime?.endAt ? new Date(input.plannedTime.endAt) : null,
            scopeText: input.scopeText ?? null,
            status: "Draft",
            currentPrimaryPhase: "Preparation",
            directVisibilityScope: "SessionTeam",
          })
          .returning({ id: researchSessions.id });

        await tx.insert(researchSessionMembers).values({
          researchSessionId: session.id,
          userId: actorUserId,
          role: "Owner",
        });

        if (sourceGapIds.length > 0) {
          await tx.insert(researchSessionResearchGaps).values(
            sourceGapIds.map((researchGapId) => ({
              researchSessionId: session.id,
              researchGapId,
            })),
          );
        }

        await tx.insert(auditEvents).values({
          actorUserId,
          action: "research_session.created",
          objectType: "ResearchSession",
          objectId: session.id,
          metadata: {
            placeId: input.placeId,
            ownerTeamId: input.ownerTeamId,
            sourceResearchGapCount: sourceGapIds.length,
          },
        });

        return session.id;
      });

      logServerEvent("research_session.created", { sessionId, actorUserId });
      return repository.findDetail(sessionId);
    },

    async read(id: string, actorUserId: string) {
      const session = await repository.findDetail(id);
      if (!session) throw notFound("SESSION_NOT_FOUND", "调研不存在");
      await requireSessionMember(db, id, actorUserId);
      return session;
    },

    async update(id: string, input: UpdateResearchSessionInput, actorUserId: string) {
      const current = await repository.findDetail(id);
      if (!current) throw notFound("SESSION_NOT_FOUND", "调研不存在");
      await requireSessionEditor(db, id, actorUserId);

      const changedFields = Object.keys(input);
      await db.transaction(async (tx) => {
        await tx
          .update(researchSessions)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.researchQuestion !== undefined
              ? { researchQuestion: input.researchQuestion }
              : {}),
            ...(input.objective !== undefined ? { objective: input.objective } : {}),
            ...(input.methods !== undefined ? { methods: input.methods } : {}),
            ...(input.plannedTime !== undefined
              ? {
                  plannedStartAt: input.plannedTime.startAt
                    ? new Date(input.plannedTime.startAt)
                    : null,
                  plannedEndAt: input.plannedTime.endAt
                    ? new Date(input.plannedTime.endAt)
                    : null,
                }
              : {}),
            ...(input.scopeText !== undefined ? { scopeText: input.scopeText } : {}),
            updatedAt: new Date(),
          })
          .where(eq(researchSessions.id, id));

        await tx.insert(auditEvents).values({
          actorUserId,
          action: "research_session.updated",
          objectType: "ResearchSession",
          objectId: id,
          metadata: { changedFields },
        });
      });

      logServerEvent("research_session.updated", { sessionId: id, actorUserId });
      return repository.findDetail(id);
    },

    async startFieldCollection(id: string, actorUserId: string) {
      const current = await repository.findDetail(id);
      if (!current) throw notFound("SESSION_NOT_FOUND", "调研不存在");
      await requireSessionEditor(db, id, actorUserId);

      if (current.status === "Archived" || current.status === "Completed") {
        throw new DomainError("CONFLICT", "已完成或已归档的调研不能开始田野采集", 409);
      }
      if (current.currentPrimaryPhase === "KJ" || current.currentPrimaryPhase === "Insight") {
        throw new DomainError("CONFLICT", "调研已进入后续阶段，不能回退到田野采集", 409);
      }

      const alreadyStarted =
        current.status === "Active" && current.currentPrimaryPhase === "FieldCollection";

      if (!alreadyStarted) {
        await db.transaction(async (tx) => {
          await tx
            .update(researchSessions)
            .set({
              status: "Active",
              currentPrimaryPhase: "FieldCollection",
              updatedAt: new Date(),
            })
            .where(eq(researchSessions.id, id));

          await tx.insert(auditEvents).values({
            actorUserId,
            action: "research_session.field_collection_started",
            objectType: "ResearchSession",
            objectId: id,
            metadata: { previousPhase: current.currentPrimaryPhase },
          });
        });
        logServerEvent("research_session.field_collection_started", {
          sessionId: id,
          actorUserId,
        });
      }

      return repository.findDetail(id);
    },

    listMembers(id: string, actorUserId: string) {
      return requireSessionMember(db, id, actorUserId).then(() => repository.listMembers(id));
    },
  };
}
