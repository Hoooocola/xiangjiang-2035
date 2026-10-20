import { FieldRecordSaved } from "./saved-state";

export default async function SavedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FieldRecordSaved recordId={id} />;
}
