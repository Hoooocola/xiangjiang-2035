import { randomUUID } from "node:crypto";
import { sql, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/src/db/client";
import { DEMO_IDS, seedDevelopmentData } from "@/src/db/seed-data";
import {
  auditEvents,
  places,
  researchGaps,
  researchSessionMembers,
  researchSessionResearchGaps,
  teamMembers,
  users,
} from "@/src/db/schema";
import { createResearchSessionService } from "@/src/server/services/research-session-service";
import { parseInput, updateResearchSessionSchema } from "@/src/server/validation";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";
const describeDatabase = runDatabaseTests ? describe : describe.skip;
const databaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://localhost:1/integration_tests_disabled";

describeDatabase("M1 Research Session service with PostgreSQL", () => {
  if (runDatabaseTests && !process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is required; integration tests never fall back to development");
  }
  const { db, pool } = createDatabase(databaseUrl);
  const service = createResearchSessionService(db);

  const createInput = () => ({
    placeId: DEMO_IDS.goosePlace,
    ownerTeamId: DEMO_IDS.team,
    name: `M1 测试调研 ${randomUUID().slice(0, 6)}`,
    researchQuestion: "不同人群如何共享鹅洲岸线？",
    objective: "验证基础研究链路",
    methods: ["行为观察", "访谈"],
    plannedTime: {
      startAt: "2026-09-15T00:00:00.000Z",
      endAt: "2026-10-05T00:00:00.000Z",
    },
    scopeText: "鹅洲北岸",
    sourceResearchGapRefs: [DEMO_IDS.gapEcologyUse],
  });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.execute(sql`
      TRUNCATE TABLE
        audit_events,
        research_session_research_gaps,
        research_session_members,
        research_sessions,
        research_gaps,
        team_members,
        teams,
        places,
        users
      RESTART IDENTITY CASCADE
    `);
    await seedDevelopmentData(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("M1-01 creates a session and reads it back", async () => {
    const created = await service.create(createInput(), DEMO_IDS.ownerUser);
    expect(created?.id).toBeTruthy();
    const read = await service.read(created!.id, DEMO_IDS.ownerUser);
    expect(read.name).toBe(created!.name);
  });

  it("M1-02 rejects a Research Gap from another Place", async () => {
    const otherPlaceId = randomUUID();
    const otherGapId = randomUUID();
    await db.insert(places).values({ id: otherPlaceId, name: "其他地点", slug: `other-${otherPlaceId}` });
    await db.insert(researchGaps).values({
      id: otherGapId,
      placeId: otherPlaceId,
      title: "其他地点缺口",
      statement: "测试",
      status: "Published",
      createdBy: DEMO_IDS.reviewerUser,
    });
    await expect(
      service.create({ ...createInput(), sourceResearchGapRefs: [otherGapId] }, DEMO_IDS.ownerUser),
    ).rejects.toMatchObject({ code: "GAP_PLACE_MISMATCH" });
  });

  it("M1-03 rejects a creator who is not an owner Team member", async () => {
    const outsiderId = randomUUID();
    await db.insert(users).values({
      id: outsiderId,
      email: `outsider-${outsiderId}@example.test`,
      displayName: "团队外用户",
    });
    await expect(service.create(createInput(), outsiderId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("M1-04 makes the creator the Session Owner", async () => {
    const created = await service.create(createInput(), DEMO_IDS.memberUser);
    const [membership] = await db
      .select()
      .from(researchSessionMembers)
      .where(
        sql`${researchSessionMembers.researchSessionId} = ${created!.id} and ${researchSessionMembers.userId} = ${DEMO_IDS.memberUser}`,
      );
    expect(membership.role).toBe("Owner");
  });

  it("M1-05 stores a repeated Session + Gap reference only once", async () => {
    const created = await service.create(
      {
        ...createInput(),
        sourceResearchGapRefs: [DEMO_IDS.gapEcologyUse, DEMO_IDS.gapEcologyUse],
      },
      DEMO_IDS.ownerUser,
    );
    const rows = await db
      .select()
      .from(researchSessionResearchGaps)
      .where(eq(researchSessionResearchGaps.researchSessionId, created!.id));
    expect(rows).toHaveLength(1);
  });

  it("M1-06 moves Preparation to FieldCollection", async () => {
    const created = await service.create(createInput(), DEMO_IDS.ownerUser);
    const started = await service.startFieldCollection(created!.id, DEMO_IDS.ownerUser);
    expect(started?.status).toBe("Active");
    expect(started?.currentPrimaryPhase).toBe("FieldCollection");
  });

  it("M1-07 keeps Start Field Collection idempotent", async () => {
    const created = await service.create(createInput(), DEMO_IDS.ownerUser);
    await service.startFieldCollection(created!.id, DEMO_IDS.ownerUser);
    await service.startFieldCollection(created!.id, DEMO_IDS.ownerUser);
    const events = await db
      .select()
      .from(auditEvents)
      .where(
        sql`${auditEvents.objectId} = ${created!.id} and ${auditEvents.action} = 'research_session.field_collection_started'`,
      );
    expect(events).toHaveLength(1);
  });

  it("M1-08 rejects PATCH from a non-Session member", async () => {
    const outsiderId = randomUUID();
    await db.insert(users).values({
      id: outsiderId,
      email: `outsider-${outsiderId}@example.test`,
      displayName: "调研外用户",
    });
    await db.insert(teamMembers).values({
      teamId: DEMO_IDS.team,
      userId: outsiderId,
      role: "Member",
    });
    const created = await service.create(createInput(), DEMO_IDS.ownerUser);
    await expect(
      service.update(created!.id, { name: "非法更新" }, outsiderId),
    ).rejects.toMatchObject({ code: "SESSION_FORBIDDEN" });
  });

  it("M1-09 strips forbidden ownership fields and never changes placeId", async () => {
    const created = await service.create(createInput(), DEMO_IDS.ownerUser);
    const parsed = parseInput(updateResearchSessionSchema, {
      name: "允许更新的名称",
      placeId: randomUUID(),
    });
    const updated = await service.update(created!.id, parsed, DEMO_IDS.ownerUser);
    expect(updated?.name).toBe("允许更新的名称");
    expect(updated?.placeId).toBe(DEMO_IDS.goosePlace);
  });
});
