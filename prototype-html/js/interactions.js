export function toast(message, duration = 2200) {
  const root = document.querySelector("#toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  root.append(el);
  window.setTimeout(() => el.remove(), duration);
}

export function showPopover(anchor, html, { width = 340, id = "active-popover" } = {}) {
  closePopover();
  const root = document.querySelector("#popover-root");
  const rect = anchor.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.id = id;
  pop.className = "popover";
  pop.style.width = `${width}px`;
  pop.style.left = `${Math.min(window.innerWidth - width - 18, Math.max(18, rect.left))}px`;
  pop.style.top = `${Math.min(window.innerHeight - 420, rect.bottom + 8) + window.scrollY}px`;
  pop.innerHTML = html;
  root.append(pop);
  window.setTimeout(() => pop.querySelector("button, input")?.focus(), 0);
  return pop;
}

export function closePopover() { document.querySelector("#popover-root").innerHTML = ""; }

export function showDialog(html, { label = "对话框" } = {}) {
  const root = document.querySelector("#dialog-root");
  root.innerHTML = `<div class="dialog-backdrop" data-close-dialog><section class="dialog" role="dialog" aria-modal="true" aria-label="${label}">${html}</section></div>`;
  window.setTimeout(() => root.querySelector("button, input")?.focus(), 0);
}

export function closeDialog() { document.querySelector("#dialog-root").innerHTML = ""; }

export function bindGlobalDismissals() {
  document.addEventListener("click", e => {
    if (e.target.matches("[data-close-dialog]")) closeDialog();
    if (!e.target.closest(".popover") && !e.target.closest("[data-popover-trigger]")) closePopover();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeDialog(); closePopover();
      document.dispatchEvent(new CustomEvent("prototype:escape"));
    }
  });
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[ch]);
}
