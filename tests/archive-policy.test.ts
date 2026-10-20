import { describe, expect, it } from "vitest";
import { researchSessionDisposalMode } from "@/src/server/policies/research-session-disposal";

describe("Research Session archive policy", () => {
  it("allows hard delete only for an unreferenced Draft", () => {
    expect(
      researchSessionDisposalMode(
        { status: "Draft" },
        { fieldRecordCount: 0, downstreamReferenceCount: 0 },
      ),
    ).toBe("HardDelete");
  });

  it("archives sessions that have entered the evidence chain", () => {
    expect(
      researchSessionDisposalMode(
        { status: "Active" },
        { fieldRecordCount: 1, downstreamReferenceCount: 0 },
      ),
    ).toBe("Archive");
  });
});
