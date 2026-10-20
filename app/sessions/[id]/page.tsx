import { AppHeader } from "@/app/components/app-header";
import { SessionOverview } from "./session-overview";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="site-shell">
      <AppHeader context="Research Session" />
      <SessionOverview sessionId={id} />
    </main>
  );
}
