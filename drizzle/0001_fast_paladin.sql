CREATE TYPE "public"."field_record_evidence_type" AS ENUM('Observation', 'Interview', 'PhotoVideo', 'Measurement', 'Document');--> statement-breakpoint
CREATE TYPE "public"."field_record_location_status" AS ENUM('Recorded', 'Approximate', 'Missing', 'UpdatedLater');--> statement-breakpoint
CREATE TYPE "public"."field_record_media_type" AS ENUM('Image', 'Video');--> statement-breakpoint
CREATE TYPE "public"."field_record_upload_status" AS ENUM('Uploading', 'Success', 'Failed');--> statement-breakpoint
CREATE TABLE "field_record_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_record_id" uuid NOT NULL,
	"media_type" "field_record_media_type" DEFAULT 'Image' NOT NULL,
	"storage_ref" text,
	"upload_status" "field_record_upload_status" DEFAULT 'Uploading' NOT NULL,
	"upload_error" text,
	"permission_scope" "visibility_scope" DEFAULT 'SessionTeam' NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size" integer NOT NULL,
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_code" varchar(20) NOT NULL,
	"research_session_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"observation" text,
	"location" jsonb,
	"location_status" "field_record_location_status" DEFAULT 'Missing' NOT NULL,
	"evidence_type" "field_record_evidence_type" NOT NULL,
	"content_tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"direct_visibility_scope" "visibility_scope" DEFAULT 'SessionTeam' NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "field_record_media" ADD CONSTRAINT "field_record_media_field_record_id_field_records_id_fk" FOREIGN KEY ("field_record_id") REFERENCES "public"."field_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_research_session_id_research_sessions_id_fk" FOREIGN KEY ("research_session_id") REFERENCES "public"."research_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_record_media_record_id_idx" ON "field_record_media" USING btree ("field_record_id");--> statement-breakpoint
CREATE INDEX "field_record_media_upload_status_idx" ON "field_record_media" USING btree ("upload_status");--> statement-breakpoint
CREATE UNIQUE INDEX "field_records_display_code_unique" ON "field_records" USING btree ("display_code");--> statement-breakpoint
CREATE INDEX "field_records_session_id_idx" ON "field_records" USING btree ("research_session_id");--> statement-breakpoint
CREATE INDEX "field_records_author_id_idx" ON "field_records" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "field_records_session_created_idx" ON "field_records" USING btree ("research_session_id","created_at");
--> statement-breakpoint
ALTER TABLE "field_record_media" ADD CONSTRAINT "field_record_media_size_nonnegative" CHECK ("size" >= 0);
--> statement-breakpoint
ALTER TABLE "field_record_media" ADD CONSTRAINT "field_record_media_success_has_storage_ref" CHECK ("upload_status" <> 'Success' OR "storage_ref" IS NOT NULL);
--> statement-breakpoint
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_location_status_consistent" CHECK ("location_status" = 'Missing' OR "location" IS NOT NULL);
--> statement-breakpoint
CREATE FUNCTION prevent_field_record_provenance_change() RETURNS trigger AS $$
BEGIN
	IF NEW.author_id IS DISTINCT FROM OLD.author_id
		OR NEW.research_session_id IS DISTINCT FROM OLD.research_session_id
		OR NEW.display_code IS DISTINCT FROM OLD.display_code THEN
		RAISE EXCEPTION 'Field Record author, session, and display code are immutable' USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER field_record_provenance_immutable
BEFORE UPDATE ON "field_records"
FOR EACH ROW EXECUTE FUNCTION prevent_field_record_provenance_change();
