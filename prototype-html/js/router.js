let renderer = () => {};

export function setRenderer(fn) { renderer = fn; }

export function currentRoute() {
  if (new URLSearchParams(location.search).get("qa") === "1") return "QA";
  return history.state?.route || "HOME";
}

export function currentContext() { return history.state?.context || {}; }

export function navigate(route, context = {}, options = {}) {
  const entry = { route, context };
  if (options.replace) history.replaceState(entry, "", options.url || location.pathname + location.search);
  else history.pushState(entry, "", location.pathname + location.search);
  renderer(route, context);
  window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
}

export function goBack(fallback = "HOME") {
  if (history.length > 1) history.back();
  else navigate(fallback, {}, { replace: true });
}

export function initRouter() {
  if (!history.state?.route) history.replaceState({ route: currentRoute(), context: {} }, "", location.href);
  window.addEventListener("popstate", event => renderer(event.state?.route || "HOME", event.state?.context || {}));
}
