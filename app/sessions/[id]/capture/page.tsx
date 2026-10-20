import { MobileCapture } from "./mobile-capture";

export default async function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MobileCapture sessionId={id} />;
}
