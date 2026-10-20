CREATE TYPE "public"."research_gap_status" AS ENUM('Suggested', 'Draft', 'Published', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."research_session_member_role" AS ENUM('Owner', 'Member', 'Reviewer');--> statement-breakpoint
CREATE TYPE "public"."research_session_primary_phase" AS ENUM('Preparation', 'FieldCollection', 'KJ', 'Insight');--> statement-breakpoint
CREATE TYPE "public"."research_session_status" AS ENUM('Draft', 'Active', 'Completed', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('Owner', 'Member');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('Active', 'Suspended', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."visibility_scope" AS ENUM('Private', 'SessionTeam', 'AuthorizedResearch', 'Unlisted', 'Public');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(120) NOT NULL,
	"object_type" varchar(80) NOT NULL,
	"object_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"location" jsonb,
	"geometry_ref" text,
	"gis_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"statement" text NOT NULL,
	"status" "research_gap_status" DEFAULT 'Suggested' NOT NULL,
	"created_by" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_session_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "research_session_member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_session_research_gaps" (
	"research_session_id" uuid NOT NULL,
	"research_gap_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_session_research_gaps_research_session_id_research_gap_id_pk" PRIMARY KEY("research_session_id","research_gap_id")
);
--> statement-breakpoint
CREATE TABLE "research_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"owner_team_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"research_question" text NOT NULL,
	"objective" text NOT NULL,
	"methods" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"planned_start_at" timestamp with time zone,
	"planned_end_at" timestamp with time zone,
	"scope_text" text,
	"current_primary_phase" "research_session_primary_phase" DEFAULT 'Preparation' NOT NULL,
	"status" "research_session_status" DEFAULT 'Draft' NOT NULL,
	"direct_visibility_scope" "visibility_scope" DEFAULT 'SessionTeam' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_member_role" DEFAULT 'Member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"course" varchar(160),
	"year" varchar(20),
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" varchar(255),
	"email" varchar(320) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"status" "user_status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_gaps" ADD CONSTRAINT "research_gaps_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_gaps" ADD CONSTRAINT "research_gaps_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_session_members" ADD CONSTRAINT "research_session_members_research_session_id_research_sessions_id_fk" FOREIGN KEY ("research_session_id") REFERENCES "public"."research_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_session_members" ADD CONSTRAINT "research_session_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_session_research_gaps" ADD CONSTRAINT "research_session_research_gaps_research_session_id_research_sessions_id_fk" FOREIGN KEY ("research_session_id") REFERENCES "public"."research_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_session_research_gaps" ADD CONSTRAINT "research_session_research_gaps_research_gap_id_research_gaps_id_fk" FOREIGN KEY ("research_gap_id") REFERENCES "public"."research_gaps"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_owner_team_id_teams_id_fk" FOREIGN KEY ("owner_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_object_idx" ON "audit_events" USING btree ("object_type","object_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "places_slug_unique" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "research_gaps_place_id_idx" ON "research_gaps" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "research_gaps_place_status_idx" ON "research_gaps" USING btree ("place_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "research_session_members_session_user_unique" ON "research_session_members" USING btree ("research_session_id","user_id");--> statement-breakpoint
CREATE INDEX "research_session_members_session_id_idx" ON "research_session_members" USING btree ("research_session_id");--> statement-breakpoint
CREATE INDEX "research_session_members_user_id_idx" ON "research_session_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "research_session_gaps_gap_id_idx" ON "research_session_research_gaps" USING btree ("research_gap_id");--> statement-breakpoint
CREATE INDEX "research_sessions_place_id_idx" ON "research_sessions" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "research_sessions_owner_team_id_idx" ON "research_sessions" USING btree ("owner_team_id");--> statement-breakpoint
CREATE INDEX "research_sessions_status_idx" ON "research_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "research_sessions_created_by_idx" ON "research_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_unique" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_owner_id_idx" ON "teams" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));