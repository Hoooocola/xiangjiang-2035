import Link from "next/link";

export function AppHeader({ context }: { context?: string }) {
  return (
    <header className="app-header">
      <Link className="brand" href="/create-research" aria-label="将来的江来首页">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>将来的江来</span>
      </Link>
      <div className="header-context">{context ?? "湘江 2035"}</div>
      <div className="dev-state">DEV DATA</div>
    </header>
  );
}
