import { z } from "zod";
import { DomainError } from "./errors";

const id = z.string().uuid();
const instant = z.string().datetime({ offset: true });

const plannedTime = z
  .object({
    startAt: instant.nullable().optional(),
    endAt: instant.nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.startAt && value.endAt && new Date(value.endAt) < new Date(value.startAt)) {
      context.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "结束时间不能早于开始时间",
      });
    }
  });

export const createResearchSessionSchema = z.object({
  placeId: id,
  ownerTeamId: id,
  name: z.string().trim().min(1).max(180),
  researchQuestion: z.string().trim().min(1).max(4000),
  objective: z.string().trim().min(1).max(6000),
  methods: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  plannedTime: plannedTime.optional(),
  scopeText: z.string().trim().max(3000).nullable().optional(),
  sourceResearchGapRefs: z.array(id).max(20).default([]),
});

export const updateResearchSessionSchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    researchQuestion: z.string().trim().min(1).max(4000).optional(),
    objective: z.string().trim().min(1).max(6000).optional(),
    methods: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
    plannedTime: plannedTime.optional(),
    scopeText: z.string().trim().max(3000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "至少提供一个可更新字段");

export type CreateResearchSessionInput = z.infer<typeof createResearchSessionSchema>;
export type UpdateResearchSessionInput = z.infer<typeof updateResearchSessionSchema>;

const location = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(100_000).optional(),
});

export const createFieldRecordSchema = z
  .object({
    observation: z.string().trim().max(12_000).nullable().optional(),
    evidenceType: z.enum(["Observation", "Interview", "PhotoVideo", "Measurement", "Document"]),
    location: location.nullable().optional(),
    locationStatus: z
      .enum(["Recorded", "Approximate", "Missing", "UpdatedLater"])
      .default("Missing"),
    contentTags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    sensitive: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.locationStatus !== "Missing" && !value.location) {
      context.addIssue({
        code: "custom",
        path: ["location"],
        message: "该位置状态需要坐标",
      });
    }
  });

export const updateFieldRecordSchema = z
  .object({
    observation: z.string().trim().max(12_000).nullable().optional(),
    location: location.nullable().optional(),
    locationStatus: z.enum(["Recorded", "Approximate", "Missing", "UpdatedLater"]).optional(),
    contentTags: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    sensitive: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (value.locationStatus && value.locationStatus !== "Missing" && !value.location) {
      context.addIssue({
        code: "custom",
        path: ["location"],
        message: "该位置状态需要坐标",
      });
    }
    if (Object.keys(value).length === 0) {
      context.addIssue({ code: "custom", message: "至少提供一个可更新字段" });
    }
  });

export type CreateFieldRecordInput = z.infer<typeof createFieldRecordSchema>;
export type UpdateFieldRecordInput = z.infer<typeof updateFieldRecordSchema>;

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
  throw new DomainError("VALIDATION_ERROR", "请求数据不符合要求", 400, fieldErrors);
}
