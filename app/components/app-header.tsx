import Link from "next/link";

export function AppHeader({ context }: { context?: string }) {
  return (
    <header className="app-header">
      <Link className="brand" href="/create-research" aria-label="湘江生态文化与社会创新地图首页">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>湘江生态文化与社会创新地图</span>
      </Link>
      <div className="header-context">{context ?? "研究平台"}</div>
      <div className="dev-state">DEV DATA</div>
    </header>
  );
}
