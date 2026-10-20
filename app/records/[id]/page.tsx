import { AppHeader } from "@/app/components/app-header";
import { FieldRecordDetail } from "./record-detail";

export default async function FieldRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="site-shell">
      <AppHeader context="Research Session / Field Record" />
      <FieldRecordDetail recordId={id} />
    </main>
  );
}
