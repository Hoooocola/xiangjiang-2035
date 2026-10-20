import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userStatus = pgEnum("user_status", ["Active", "Suspended", "Archived"]);
export const teamMemberRole = pgEnum("team_member_role", ["Owner", "Member"]);
export const researchSessionMemberRole = pgEnum("research_session_member_role", [
  "Owner",
  "Member",
  "Reviewer",
]);
export const researchSessionStatus = pgEnum("research_session_status", [
  "Draft",
  "Active",
  "Completed",
  "Archived",
]);
export const researchSessionPrimaryPhase = pgEnum("research_session_primary_phase", [
  "Preparation",
  "FieldCollection",
  "KJ",
  "Insight",
]);
export const visibilityScope = pgEnum("visibility_scope", [
  "Private",
  "SessionTeam",
  "AuthorizedResearch",
  "Unlisted",
  "Public",
]);
export const researchGapStatus = pgEnum("research_gap_status", [
  "Suggested",
  "Draft",
  "Published",
  "Archived",
]);
export const fieldRecordEvidenceType = pgEnum("field_record_evidence_type", [
  "Observation",
  "Interview",
  "PhotoVideo",
  "Measurement",
  "Document",
]);
export const fieldRecordLocationStatus = pgEnum("field_record_location_status", [
  "Recorded",
  "Approximate",
  "Missing",
  "UpdatedLater",
]);
export const fieldRecordMediaType = pgEnum("field_record_media_type", ["Image", "Video"]);
export const fieldRecordUploadStatus = pgEnum("field_record_upload_status", [
  "Uploading",
  "Success",
  "Failed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: varchar("auth_user_id", { length: 255 }).unique(),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    status: userStatus("status").notNull().default("Active"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`)],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    course: varchar("course", { length: 160 }),
    year: varchar("year", { length: 20 }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("teams_owner_id_idx").on(table.ownerId)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: teamMemberRole("role").notNull().default("Member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_members_team_user_unique").on(table.teamId, table.userId),
    index("team_members_user_id_idx").on(table.userId),
  ],
);

export type PlaceLocation = {
  latitude: number;
  longitude: number;
  accuracy: "demo" | "surveyed" | "verified";
};

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),
    location: jsonb("location").$type<PlaceLocation>(),
    geometryRef: text("geometry_ref"),
    gisSource: text("gis_source"),
    ...timestamps,
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("places_slug_unique").on(table.slug)],
);

export const researchSessions = pgTable(
  "research_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "restrict" }),
    ownerTeamId: uuid("owner_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 180 }).notNull(),
    researchQuestion: text("research_question").notNull(),
    objective: text("objective").notNull(),
    methods: text("methods")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    plannedStartAt: timestamp("planned_start_at", { withTimezone: true }),
    plannedEndAt: timestamp("planned_end_at", { withTimezone: true }),
    scopeText: text("scope_text"),
    currentPrimaryPhase: researchSessionPrimaryPhase("current_primary_phase")
      .notNull()
      .default("Preparation"),
    status: researchSessionStatus("status").notNull().default("Draft"),
    directVisibilityScope: visibilityScope("direct_visibility_scope")
      .notNull()
      .default("SessionTeam"),
    ...timestamps,
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("research_sessions_place_id_idx").on(table.placeId),
    index("research_sessions_owner_team_id_idx").on(table.ownerTeamId),
    index("research_sessions_status_idx").on(table.status),
    index("research_sessions_created_by_idx").on(table.createdBy),
  ],
);

export const researchSessionMembers = pgTable(
  "research_session_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    researchSessionId: uuid("research_session_id")
      .notNull()
      .references(() => researchSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: researchSessionMemberRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("research_session_members_session_user_unique").on(
      table.researchSessionId,
      table.userId,
    ),
    index("research_session_members_session_id_idx").on(table.researchSessionId),
    index("research_session_members_user_id_idx").on(table.userId),
  ],
);

export const researchGaps = pgTable(
  "research_gaps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    statement: text("statement").notNull(),
    status: researchGapStatus("status").notNull().default("Suggested"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("research_gaps_place_id_idx").on(table.placeId),
    index("research_gaps_place_status_idx").on(table.placeId, table.status),
  ],
);

export const researchSessionResearchGaps = pgTable(
  "research_session_research_gaps",
  {
    researchSessionId: uuid("research_session_id")
      .notNull()
      .references(() => researchSessions.id, { onDelete: "cascade" }),
    researchGapId: uuid("research_gap_id")
      .notNull()
      .references(() => researchGaps.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.researchSessionId, table.researchGapId] }),
    index("research_session_gaps_gap_id_idx").on(table.researchGapId),
  ],
);

export type FieldRecordLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export const fieldRecords = pgTable(
  "field_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayCode: varchar("display_code", { length: 20 }).notNull(),
    researchSessionId: uuid("research_session_id")
      .notNull()
      .references(() => researchSessions.id, { onDelete: "restrict" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    observation: text("observation"),
    location: jsonb("location").$type<FieldRecordLocation>(),
    locationStatus: fieldRecordLocationStatus("location_status").notNull().default("Missing"),
    evidenceType: fieldRecordEvidenceType("evidence_type").notNull(),
    contentTags: text("content_tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    directVisibilityScope: visibilityScope("direct_visibility_scope")
      .notNull()
      .default("SessionTeam"),
    sensitive: boolean("sensitive").notNull().default(false),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("field_records_display_code_unique").on(table.displayCode),
    index("field_records_session_id_idx").on(table.researchSessionId),
    index("field_records_author_id_idx").on(table.authorId),
    index("field_records_session_created_idx").on(table.researchSessionId, table.createdAt),
  ],
);

export const fieldRecordMedia = pgTable(
  "field_record_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fieldRecordId: uuid("field_record_id")
      .notNull()
      .references(() => fieldRecords.id, { onDelete: "cascade" }),
    mediaType: fieldRecordMediaType("media_type").notNull().default("Image"),
    storageRef: text("storage_ref"),
    uploadStatus: fieldRecordUploadStatus("upload_status").notNull().default("Uploading"),
    uploadError: text("upload_error"),
    permissionScope: visibilityScope("permission_scope").notNull().default("SessionTeam"),
    filename: varchar("filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    size: integer("size").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("field_record_media_record_id_idx").on(table.fieldRecordId),
    index("field_record_media_upload_status_idx").on(table.uploadStatus),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    objectType: varchar("object_type", { length: 80 }).notNull(),
    objectId: uuid("object_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_object_idx").on(table.objectType, table.objectId),
    index("audit_events_actor_idx").on(table.actorUserId),
  ],
);

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Place = typeof places.$inferSelect;
export type ResearchSession = typeof researchSessions.$inferSelect;
export type ResearchSessionMember = typeof researchSessionMembers.$inferSelect;
export type ResearchGap = typeof researchGaps.$inferSelect;
export type FieldRecord = typeof fieldRecords.$inferSelect;
export type FieldRecordMedia = typeof fieldRecordMedia.$inferSelect;
