import { AppHeader } from "../components/app-header";
import { CreateResearchForm } from "./research-form";

export default function CreateResearchPage() {
  return (
    <main className="site-shell">
      <AppHeader context="创建调研" />
      <CreateResearchForm />
    </main>
  );
}
