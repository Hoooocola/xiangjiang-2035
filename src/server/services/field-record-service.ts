import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/src/db/client";
import {
  auditEvents,
  fieldRecordMedia,
  fieldRecords,
  researchSessions,
} from "@/src/db/schema";
import { requireSessionEditor, requireSessionMember } from "../authorization";
import { DomainError, notFound } from "../errors";
import { logServerError, logServerEvent } from "../logger";
import { createFieldRecordRepository } from "../repositories/field-record-repository";
import type { StorageAdapter } from "../storage";
import {
  normalizeFilename,
  validateImage,
  type IncomingMedia,
  type ValidatedImage,
} from "../storage/media-validation";
import type { CreateFieldRecordInput, UpdateFieldRecordInput } from "../validation";

type PreparedMedia = {
  id: string;
  input: IncomingMedia;
  validated?: ValidatedImage;
  error?: DomainError;
};

function displayCode(id: string) {
  return `FR-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function messageFor(error: unknown) {
  if (error instanceof DomainError) return `${error.code}: ${error.message}`;
  return "MEDIA_UPLOAD_FAILED: 图片写入失败";
}

export function createFieldRecordService(db: AppDatabase, storage: StorageAdapter) {
  const repository = createFieldRecordRepository(db);

  async function requireCollectingSession(sessionId: string, actorUserId: string) {
    const [session] = await db
      .select()
      .from(researchSessions)
      .where(and(eq(researchSessions.id, sessionId), isNull(researchSessions.archivedAt)))
      .limit(1);
    if (!session) throw notFound("SESSION_NOT_FOUND", "调研不存在");
    await requireSessionEditor(db, sessionId, actorUserId);
    if (session.status !== "Active" || session.currentPrimaryPhase !== "FieldCollection") {
      throw new DomainError("SESSION_NOT_COLLECTING", "该调研尚未进入田野采集阶段", 409);
    }
    return session;
  }

  async function prepareMedia(mediaInputs: IncomingMedia[]): Promise<PreparedMedia[]> {
    return Promise.all(
      mediaInputs.map(async (input) => {
        const prepared: PreparedMedia = { id: randomUUID(), input };
        try {
          prepared.validated = await validateImage(input);
        } catch (error) {
          prepared.error =
            error instanceof DomainError
              ? error
              : new DomainError("MEDIA_UPLOAD_FAILED", "无法读取图片", 422);
        }
        return prepared;
      }),
    );
  }

  async function persistPreparedMedia(recordId: string, media: PreparedMedia) {
    if (!media.validated) return;
    try {
      const stored = await storage.put({
        key: `field-records/${recordId}/${media.id}.${media.validated.extension}`,
        bytes: media.validated.bytes,
        mimeType: media.validated.mimeType,
      });
      await db
        .update(fieldRecordMedia)
        .set({
          storageRef: stored.storageRef,
          mimeType: media.validated.mimeType,
          filename: media.validated.filename,
          size: media.validated.bytes.byteLength,
          uploadStatus: "Success",
          uploadError: null,
          updatedAt: new Date(),
        })
        .where(eq(fieldRecordMedia.id, media.id));
    } catch (error) {
      await db
        .update(fieldRecordMedia)
        .set({ uploadStatus: "Failed", uploadError: messageFor(error), updatedAt: new Date() })
        .where(eq(fieldRecordMedia.id, media.id));
      logServerError("field_record.media_upload_failed", error, {
        fieldRecordId: recordId,
        mediaId: media.id,
      });
    }
  }

  return {
    async create(
      researchSessionId: string,
      input: CreateFieldRecordInput,
      actorUserId: string,
      mediaInputs: IncomingMedia[] = [],
    ) {
      await requireCollectingSession(researchSessionId, actorUserId);
      const preparedMedia = await prepareMedia(mediaInputs);
      const validMediaCount = preparedMedia.filter((media) => media.validated).length;
      if (!input.observation?.trim() && validMediaCount === 0) {
        if (preparedMedia[0]?.error) throw preparedMedia[0].error;
        throw new DomainError(
          "RECORD_CONTENT_REQUIRED",
          "Observation 或有效图片至少需要一项",
          422,
        );
      }

      const id = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(fieldRecords).values({
          id,
          displayCode: displayCode(id),
          researchSessionId,
          authorId: actorUserId,
          observation: input.observation?.trim() || null,
          location: input.location ?? null,
          locationStatus: input.locationStatus,
          evidenceType: input.evidenceType,
          contentTags: [...new Set(input.contentTags)],
          directVisibilityScope: "SessionTeam",
          sensitive: input.sensitive,
          updatedBy: actorUserId,
        });

        if (preparedMedia.length > 0) {
          await tx.insert(fieldRecordMedia).values(
            preparedMedia.map((media) => ({
              id: media.id,
              fieldRecordId: id,
              mediaType: "Image" as const,
              uploadStatus: media.validated ? ("Uploading" as const) : ("Failed" as const),
              uploadError: media.error ? messageFor(media.error) : null,
              permissionScope: "SessionTeam" as const,
              filename: normalizeFilename(media.input.filename),
              mimeType: media.input.declaredMimeType || "application/octet-stream",
              size: media.input.size,
              capturedAt: media.input.capturedAt ?? null,
            })),
          );
        }

        await tx.insert(auditEvents).values({
          actorUserId,
          action: "field_record.created",
          objectType: "FieldRecord",
          objectId: id,
          metadata: {
            researchSessionId,
            evidenceType: input.evidenceType,
            locationStatus: input.locationStatus,
            mediaCount: preparedMedia.length,
          },
        });
      });

      await Promise.all(preparedMedia.map((media) => persistPreparedMedia(id, media)));
      logServerEvent("field_record.created", { fieldRecordId: id, researchSessionId, actorUserId });
      return repository.findDetail(id);
    },

    async list(researchSessionId: string, actorUserId: string) {
      const [session] = await db
        .select({ id: researchSessions.id })
        .from(researchSessions)
        .where(eq(researchSessions.id, researchSessionId))
        .limit(1);
      if (!session) throw notFound("SESSION_NOT_FOUND", "调研不存在");
      await requireSessionMember(db, researchSessionId, actorUserId);
      return repository.listBySession(researchSessionId);
    },

    async read(id: string, actorUserId: string) {
      const record = await repository.findDetail(id);
      if (!record) throw notFound("RECORD_NOT_FOUND", "田野记录不存在");
      await requireSessionMember(db, record.researchSessionId, actorUserId);
      return record;
    },

    async update(id: string, input: UpdateFieldRecordInput, actorUserId: string) {
      const record = await repository.findDetail(id);
      if (!record) throw notFound("RECORD_NOT_FOUND", "田野记录不存在");
      await requireSessionEditor(db, record.researchSessionId, actorUserId);

      const nextLocationStatus = input.locationStatus ?? record.locationStatus;
      const nextLocation = input.location !== undefined ? input.location : record.location;
      if (nextLocationStatus !== "Missing" && !nextLocation) {
        throw new DomainError("VALIDATION_ERROR", "该位置状态需要坐标", 400, {
          location: ["请提供坐标或将位置状态设为 Missing"],
        });
      }

      if (input.observation !== undefined && !input.observation?.trim()) {
        const activeMedia = record.media.filter((media) => media.uploadStatus !== "Failed");
        if (activeMedia.length === 0) {
          throw new DomainError(
            "RECORD_CONTENT_REQUIRED",
            "不能同时移除 Observation 和全部有效 Media",
            422,
          );
        }
      }

      await db.transaction(async (tx) => {
        await tx
          .update(fieldRecords)
          .set({
            ...(input.observation !== undefined
              ? { observation: input.observation?.trim() || null }
              : {}),
            ...(input.location !== undefined ? { location: input.location } : {}),
            ...(input.locationStatus !== undefined ? { locationStatus: input.locationStatus } : {}),
            ...(input.contentTags !== undefined
              ? { contentTags: [...new Set(input.contentTags)] }
              : {}),
            ...(input.sensitive !== undefined ? { sensitive: input.sensitive } : {}),
            updatedBy: actorUserId,
            updatedAt: new Date(),
          })
          .where(eq(fieldRecords.id, id));

        await tx.insert(auditEvents).values({
          actorUserId,
          action: "field_record.updated",
          objectType: "FieldRecord",
          objectId: id,
          metadata: { changedFields: Object.keys(input) },
        });
      });
      logServerEvent("field_record.updated", { fieldRecordId: id, actorUserId });
      return repository.findDetail(id);
    },

    async addMedia(id: string, mediaInput: IncomingMedia, actorUserId: string) {
      const record = await repository.findDetail(id);
      if (!record) throw notFound("RECORD_NOT_FOUND", "田野记录不存在");
      await requireSessionEditor(db, record.researchSessionId, actorUserId);
      const [prepared] = await prepareMedia([mediaInput]);

      await db.insert(fieldRecordMedia).values({
        id: prepared.id,
        fieldRecordId: id,
        mediaType: "Image",
        uploadStatus: prepared.validated ? "Uploading" : "Failed",
        uploadError: prepared.error ? messageFor(prepared.error) : null,
        permissionScope: "SessionTeam",
        filename: normalizeFilename(mediaInput.filename),
        mimeType: mediaInput.declaredMimeType || "application/octet-stream",
        size: mediaInput.size,
        capturedAt: mediaInput.capturedAt ?? null,
      });
      await persistPreparedMedia(id, prepared);
      return repository.findMedia(id, prepared.id);
    },

    async retryMedia(id: string, mediaId: string, mediaInput: IncomingMedia, actorUserId: string) {
      const record = await repository.findDetail(id);
      if (!record) throw notFound("RECORD_NOT_FOUND", "田野记录不存在");
      await requireSessionEditor(db, record.researchSessionId, actorUserId);
      const current = await repository.findMedia(id, mediaId);
      if (!current) throw notFound("MEDIA_NOT_FOUND", "图片记录不存在");
      if (current.uploadStatus !== "Failed") {
        throw new DomainError("CONFLICT", "只有失败的图片上传可以重试", 409);
      }

      const [prepared] = await prepareMedia([mediaInput]);
      prepared.id = mediaId;
      await db
        .update(fieldRecordMedia)
        .set({
          uploadStatus: prepared.validated ? "Uploading" : "Failed",
          uploadError: prepared.error ? messageFor(prepared.error) : null,
          storageRef: null,
          filename: normalizeFilename(mediaInput.filename),
          mimeType: mediaInput.declaredMimeType || "application/octet-stream",
          size: mediaInput.size,
          capturedAt: mediaInput.capturedAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(fieldRecordMedia.id, mediaId));
      await persistPreparedMedia(id, prepared);
      return repository.findMedia(id, mediaId);
    },

    async readMedia(id: string, mediaId: string, actorUserId: string) {
      const record = await repository.findDetail(id);
      if (!record) throw notFound("RECORD_NOT_FOUND", "田野记录不存在");
      await requireSessionMember(db, record.researchSessionId, actorUserId);
      const media = await repository.findMedia(id, mediaId);
      if (!media || media.uploadStatus !== "Success" || !media.storageRef) {
        throw notFound("MEDIA_NOT_FOUND", "图片尚不可用");
      }
      return { media, object: await storage.get(media.storageRef) };
    },
  };
}
