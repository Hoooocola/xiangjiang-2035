import type { AppDatabase } from "./client";
import {
  places,
  researchGaps,
  researchSessionMembers,
  researchSessionResearchGaps,
  researchSessions,
  teamMembers,
  teams,
  users,
} from "./schema";

export const DEMO_IDS = {
  ownerUser: "10000000-0000-4000-8000-000000000001",
  memberUser: "10000000-0000-4000-8000-000000000002",
  reviewerUser: "10000000-0000-4000-8000-000000000003",
  team: "20000000-0000-4000-8000-000000000001",
  goosePlace: "30000000-0000-4000-8000-000000000001",
  gapEcologyUse: "40000000-0000-4000-8000-000000000001",
  autumnSession: "50000000-0000-4000-8000-000000000001",
} as const;

export async function seedDevelopmentData(db: AppDatabase) {
  const seededAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values([
        {
          id: DEMO_IDS.ownerUser,
          authUserId: "dev-owner",
          email: "student.owner@example.test",
          displayName: "示例学生负责人（DEMO）",
        },
        {
          id: DEMO_IDS.memberUser,
          authUserId: "dev-member",
          email: "student.member@example.test",
          displayName: "示例学生成员（DEMO）",
        },
        {
          id: DEMO_IDS.reviewerUser,
          authUserId: "dev-reviewer",
          email: "reviewer@example.test",
          displayName: "示例审核者（DEMO）",
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(teams)
      .values({
        id: DEMO_IDS.team,
        name: "2026 秋季鹅洲研究 Demo Team",
        course: "湘江 2035 · 毕业设计研究",
        year: "2026",
        ownerId: DEMO_IDS.ownerUser,
      })
      .onConflictDoNothing();

    await tx
      .insert(teamMembers)
      .values([
        { teamId: DEMO_IDS.team, userId: DEMO_IDS.ownerUser, role: "Owner" },
        { teamId: DEMO_IDS.team, userId: DEMO_IDS.memberUser, role: "Member" },
        { teamId: DEMO_IDS.team, userId: DEMO_IDS.reviewerUser, role: "Member" },
      ])
      .onConflictDoNothing();

    await tx
      .insert(places)
      .values({
        id: DEMO_IDS.goosePlace,
        name: "鹅洲",
        slug: "ezhou",
        description: "DEMO / DEVELOPMENT DATA：用于开发验证的鹅洲地点记录。",
        location: {
          latitude: 28.057,
          longitude: 112.874,
          accuracy: "demo",
        },
        geometryRef: null,
        gisSource: "DEMO_UNCALIBRATED — 不代表真实 GIS 边界或精确坐标",
      })
      .onConflictDoNothing();

    await tx
      .insert(researchGaps)
      .values({
        id: DEMO_IDS.gapEcologyUse,
        placeId: DEMO_IDS.goosePlace,
        title: "生态保护与使用需求",
        statement:
          "北岸滨水带已有零散使用证据，但仍缺少高峰时段、季节变化与生态敏感岸段之间关系的连续观察。",
        status: "Published",
        createdBy: DEMO_IDS.reviewerUser,
        publishedAt: seededAt,
      })
      .onConflictDoNothing();

    await tx
      .insert(researchSessions)
      .values({
        id: DEMO_IDS.autumnSession,
        placeId: DEMO_IDS.goosePlace,
        ownerTeamId: DEMO_IDS.team,
        createdBy: DEMO_IDS.ownerUser,
        name: "2026 秋季鹅洲岸线使用补充调研",
        researchQuestion: "不同人群在鹅洲北岸如何共享停留、通行与临水活动空间？",
        objective: "补齐高峰时段与多类使用者的现场证据，为后续空间设计提供可追溯依据。",
        methods: ["行为观察", "半结构访谈", "定点影像记录"],
        plannedStartAt: new Date("2026-09-15T00:00:00.000Z"),
        plannedEndAt: new Date("2026-10-05T00:00:00.000Z"),
        scopeText: "鹅洲北岸滨水空间（DEMO 范围，待真实 GIS 校准）",
        status: "Draft",
        currentPrimaryPhase: "Preparation",
        directVisibilityScope: "SessionTeam",
      })
      .onConflictDoNothing();

    await tx
      .insert(researchSessionMembers)
      .values([
        {
          researchSessionId: DEMO_IDS.autumnSession,
          userId: DEMO_IDS.ownerUser,
          role: "Owner",
        },
        {
          researchSessionId: DEMO_IDS.autumnSession,
          userId: DEMO_IDS.memberUser,
          role: "Member",
        },
        {
          researchSessionId: DEMO_IDS.autumnSession,
          userId: DEMO_IDS.reviewerUser,
          role: "Reviewer",
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(researchSessionResearchGaps)
      .values({
        researchSessionId: DEMO_IDS.autumnSession,
        researchGapId: DEMO_IDS.gapEcologyUse,
      })
      .onConflictDoNothing();
  });
}
