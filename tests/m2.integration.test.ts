import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/src/db/client";
import { DEMO_IDS, seedDevelopmentData } from "@/src/db/seed-data";
import {
  fieldRecordMedia,
  fieldRecords,
  teamMembers,
  users,
} from "@/src/db/schema";
import { createFieldRecordService } from "@/src/server/services/field-record-service";
import { createResearchSessionService } from "@/src/server/services/research-session-service";
import type { StorageAdapter, StoredObject } from "@/src/server/storage/storage-adapter";
import type { IncomingMedia } from "@/src/server/storage/media-validation";
import { parseInput, updateFieldRecordSchema } from "@/src/server/validation";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";
const describeDatabase = runDatabaseTests ? describe : describe.skip;
const databaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://localhost:1/integration_tests_disabled";

class MemoryStorage implements StorageAdapter {
  objects = new Map<string, StoredObject>();
  failWrites = false;

  async put(input: { key: string; bytes: Uint8Array; mimeType: string }) {
    if (this.failWrites) throw new Error("simulated storage outage");
    const storageRef = `memory://${input.key}`;
    this.objects.set(storageRef, { bytes: input.bytes, mimeType: input.mimeType });
    return { storageRef };
  }

  async get(storageRef: string) {
    const object = this.objects.get(storageRef);
    if (!object) throw new Error("missing object");
    return object;
  }
}

const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function media(
  overrides: Partial<IncomingMedia> & { data?: Uint8Array } = {},
): IncomingMedia {
  const data = overrides.data ?? pngBytes;
  return {
    filename: overrides.filename ?? "鹅洲-岸线.png",
    declaredMimeType: overrides.declaredMimeType ?? "image/png",
    size: overrides.size ?? data.byteLength,
    capturedAt: overrides.capturedAt ?? new Date("2026-09-07T08:00:00.000Z"),
    bytes: overrides.bytes ?? (async () => data),
  };
}

function recordInput(overrides: Record<string, unknown> = {}) {
  return {
    observation: "北岸树荫下出现居民与游客共享停留空间。",
    evidenceType: "Observation" as const,
    location: { latitude: 28.0574, longitude: 112.8742, accuracyMeters: 18 },
    locationStatus: "Recorded" as const,
    contentTags: ["Behavior", "Community"],
    sensitive: false,
    ...overrides,
  };
}

describeDatabase("M2 Research vertical slice with PostgreSQL", () => {
  if (runDatabaseTests && !process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is required; integration tests never fall back to development");
  }

  const { db, pool } = createDatabase(databaseUrl);
  let storage: MemoryStorage;
  let service: ReturnType<typeof createFieldRecordService>;
  let sessionService: ReturnType<typeof createResearchSessionService>;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.execute(sql`
      TRUNCATE TABLE
        audit_events,
        field_record_media,
        field_records,
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
    storage = new MemoryStorage();
    service = createFieldRecordService(db, storage);
    sessionService = createResearchSessionService(db);
    await sessionService.startFieldCollection(DEMO_IDS.autumnSession, DEMO_IDS.ownerUser);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function createOtherSession() {
    const id = randomUUID();
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email: `second-session-${userId}@example.test`,
      displayName: "另一调研成员",
    });
    await db.insert(teamMembers).values({ teamId: DEMO_IDS.team, userId, role: "Member" });
    const created = await sessionService.create(
      {
        placeId: DEMO_IDS.goosePlace,
        ownerTeamId: DEMO_IDS.team,
        name: `另一独立调研 ${id.slice(0, 6)}`,
        researchQuestion: "另一时段发生了什么？",
        objective: "验证 Session Boundary",
        methods: ["访谈"],
        scopeText: "鹅洲南岸",
        sourceResearchGapRefs: [],
      },
      userId,
    );
    await sessionService.startFieldCollection(created!.id, userId);
    return { id: created!.id, userId };
  }

  it("M2-AUTH-01 non-Session Member cannot create a Record", async () => {
    const outsiderId = randomUUID();
    await db.insert(users).values({
      id: outsiderId,
      email: `outsider-${outsiderId}@example.test`,
      displayName: "非调研成员",
    });
    await expect(
      service.create(DEMO_IDS.autumnSession, recordInput(), outsiderId),
    ).rejects.toMatchObject({ code: "SESSION_FORBIDDEN" });
  });

  it("M2-AUTH-02 Session Member can create a Record", async () => {
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput(),
      DEMO_IDS.memberUser,
    );
    expect(created?.authorId).toBe(DEMO_IDS.memberUser);
  });

  it("M2-AUTH-03 member of a different Session cannot edit this Record", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    const other = await createOtherSession();
    await expect(
      service.update(record!.id, { contentTags: ["Tourism"] }, other.userId),
    ).rejects.toMatchObject({ code: "SESSION_FORBIDDEN" });
  });

  it("M2-AUTH-04 Reviewer cannot modify Original Observation", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    await expect(
      service.update(record!.id, { observation: "审核者尝试覆写" }, DEMO_IDS.reviewerUser),
    ).rejects.toMatchObject({ code: "SESSION_FORBIDDEN" });
  });

  it("M2-AUTH-05 authorId cannot be PATCHed and database provenance is immutable", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    const parsed = parseInput(updateFieldRecordSchema, {
      authorId: DEMO_IDS.memberUser,
      contentTags: ["Ecology"],
    });
    const updated = await service.update(record!.id, parsed, DEMO_IDS.memberUser);
    expect(updated?.authorId).toBe(DEMO_IDS.ownerUser);
    await expect(
      db.update(fieldRecords).set({ authorId: DEMO_IDS.memberUser }).where(eq(fieldRecords.id, record!.id)),
    ).rejects.toThrow();
    expect((await service.read(record!.id, DEMO_IDS.ownerUser)).authorId).toBe(DEMO_IDS.ownerUser);
  });

  it("M2-DATA-01 text Record without Media persists", async () => {
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput({ location: null, locationStatus: "Missing" }),
      DEMO_IDS.ownerUser,
    );
    expect(created?.observation).toContain("北岸树荫");
    expect(created?.media).toHaveLength(0);
  });

  it("M2-DATA-02 Media-only Record persists with a successful upload", async () => {
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput({ observation: null, evidenceType: "PhotoVideo" }),
      DEMO_IDS.ownerUser,
      [media()],
    );
    expect(created?.media[0]).toMatchObject({ uploadStatus: "Success", mimeType: "image/png" });
    expect(created?.media[0].storageRef).toMatch(/^memory:\/\//);
  });

  it("M2-DATA-03 Interview without a photo can be created and read", async () => {
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput({ evidenceType: "Interview", location: null, locationStatus: "Missing" }),
      DEMO_IDS.memberUser,
    );
    const read = await service.read(created!.id, DEMO_IDS.memberUser);
    expect(read.evidenceType).toBe("Interview");
    expect(read.media).toHaveLength(0);
  });

  it("M2-DATA-04 GPS Missing does not block save", async () => {
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput({ location: null, locationStatus: "Missing" }),
      DEMO_IDS.ownerUser,
    );
    expect(created?.location).toBeNull();
    expect(created?.locationStatus).toBe("Missing");
  });

  it("M2-DATA-05 Record permanently retains its Session ID", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    const other = await createOtherSession();
    await expect(
      db.update(fieldRecords).set({ researchSessionId: other.id }).where(eq(fieldRecords.id, record!.id)),
    ).rejects.toThrow();
    expect((await service.read(record!.id, DEMO_IDS.ownerUser)).researchSessionId).toBe(
      DEMO_IDS.autumnSession,
    );
  });

  it("M2-DATA-06 Session query never returns another Session's Records", async () => {
    const first = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    const other = await createOtherSession();
    const otherRecord = await service.create(other.id, recordInput(), other.userId);
    const rows = await service.list(DEMO_IDS.autumnSession, DEMO_IDS.ownerUser);
    expect(rows.map((row) => row.id)).toEqual([first!.id]);
    expect(rows.map((row) => row.id)).not.toContain(otherRecord!.id);
  });

  it("M2-MEDIA-01 validates actual bytes rather than declared MIME", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    const added = await service.addMedia(
      record!.id,
      media({ declaredMimeType: "text/html", filename: "evidence.html" }),
      DEMO_IDS.ownerUser,
    );
    expect(added).toMatchObject({ uploadStatus: "Success", mimeType: "image/png" });
  });

  it("M2-MEDIA-02 rejects invalid bytes and reports Failed without losing Observation", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    const invalid = Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);
    const added = await service.addMedia(
      record!.id,
      media({ data: invalid, declaredMimeType: "image/png", filename: "fake.png" }),
      DEMO_IDS.ownerUser,
    );
    expect(added?.uploadStatus).toBe("Failed");
    const read = await service.read(record!.id, DEMO_IDS.ownerUser);
    expect(read.observation).toBe(record!.observation);
  });

  it("M2-MEDIA-03 rejects oversized input before reading bytes", async () => {
    const record = await service.create(DEMO_IDS.autumnSession, recordInput(), DEMO_IDS.ownerUser);
    let bytesRead = false;
    const added = await service.addMedia(
      record!.id,
      media({
        size: 10 * 1024 * 1024 + 1,
        bytes: async () => {
          bytesRead = true;
          return pngBytes;
        },
      }),
      DEMO_IDS.ownerUser,
    );
    expect(added?.uploadStatus).toBe("Failed");
    expect(bytesRead).toBe(false);
  });

  it("M2-MEDIA-04 storage failure keeps the Record and exposes Retry", async () => {
    storage.failWrites = true;
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput(),
      DEMO_IDS.ownerUser,
      [media()],
    );
    expect(created?.observation).toContain("北岸树荫");
    expect(created?.media[0].uploadStatus).toBe("Failed");
    storage.failWrites = false;
    const retried = await service.retryMedia(
      created!.id,
      created!.media[0].id,
      media(),
      DEMO_IDS.ownerUser,
    );
    expect(retried?.uploadStatus).toBe("Success");
  });

  it("M2-MEDIA-05 archiving a Record retains its Media provenance", async () => {
    const record = await service.create(
      DEMO_IDS.autumnSession,
      recordInput(),
      DEMO_IDS.ownerUser,
      [media()],
    );
    await db.update(fieldRecords).set({ archivedAt: new Date() }).where(eq(fieldRecords.id, record!.id));
    const [storedMedia] = await db
      .select()
      .from(fieldRecordMedia)
      .where(eq(fieldRecordMedia.fieldRecordId, record!.id));
    expect(storedMedia.storageRef).toBeTruthy();
  });

  it("M2-INTEGRATION completes the real persisted chain and preserves provenance on update", async () => {
    const created = await service.create(
      DEMO_IDS.autumnSession,
      recordInput(),
      DEMO_IDS.ownerUser,
      [media()],
    );
    const list = await service.list(DEMO_IDS.autumnSession, DEMO_IDS.ownerUser);
    const detail = await service.read(created!.id, DEMO_IDS.ownerUser);
    const updated = await service.update(
      created!.id,
      { contentTags: ["Behavior", "Ecology", "Opportunity"] },
      DEMO_IDS.memberUser,
    );
    expect(list.some((row) => row.id === created!.id)).toBe(true);
    expect(detail.displayCode).toMatch(/^FR-[A-F0-9]{8}$/);
    expect(updated?.contentTags).toEqual(["Behavior", "Ecology", "Opportunity"]);
    expect(updated?.authorId).toBe(DEMO_IDS.ownerUser);
    expect(updated?.researchSessionId).toBe(DEMO_IDS.autumnSession);
  });
});
