import type { ResearchSession } from "@/src/db/schema";

export type ResearchSessionDependencies = {
  fieldRecordCount: number;
  downstreamReferenceCount: number;
};

export function researchSessionDisposalMode(
  session: Pick<ResearchSession, "status">,
  dependencies: ResearchSessionDependencies,
): "HardDelete" | "Archive" {
  const isUnreferencedDraft =
    session.status === "Draft" &&
    dependencies.fieldRecordCount === 0 &&
    dependencies.downstreamReferenceCount === 0;
  return isUnreferencedDraft ? "HardDelete" : "Archive";
}
