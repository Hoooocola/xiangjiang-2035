import { describe, expect, it } from "vitest";
import {
  createResearchSessionSchema,
  parseInput,
  updateResearchSessionSchema,
} from "@/src/server/validation";

const id = "10000000-0000-4000-8000-000000000001";

describe("Research Session validation", () => {
  it("accepts the frozen M1 create contract", () => {
    const input = parseInput(createResearchSessionSchema, {
      placeId: id,
      ownerTeamId: id,
      name: "鹅洲补充调研",
      researchQuestion: "周末高峰如何共享岸线？",
      objective: "补齐证据",
      methods: ["行为观察"],
      sourceResearchGapRefs: [],
    });
    expect(input.name).toBe("鹅洲补充调研");
  });

  it("rejects an ordinary PATCH that only attempts to change placeId", () => {
    expect(() => parseInput(updateResearchSessionSchema, { placeId: id })).toThrowError(
      "请求数据不符合要求",
    );
  });

  it("rejects a planned end before the planned start", () => {
    expect(() =>
      parseInput(createResearchSessionSchema, {
        placeId: id,
        ownerTeamId: id,
        name: "鹅洲补充调研",
        researchQuestion: "问题",
        objective: "目标",
        plannedTime: {
          startAt: "2026-09-20T00:00:00.000Z",
          endAt: "2026-09-19T00:00:00.000Z",
        },
      }),
    ).toThrowError("请求数据不符合要求");
  });
});
