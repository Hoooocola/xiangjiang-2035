import { AppHeader } from "@/app/components/app-header";
import { SessionRecordsView } from "./session-records-view";

export default async function SessionRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="site-shell">
      <AppHeader context="Research Session / Field Records" />
      <SessionRecordsView sessionId={id} />
    </main>
  );
}
