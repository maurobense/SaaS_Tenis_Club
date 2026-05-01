import { translateElement } from "../preferences.js?v=2026050124";

export function confirmModal({ title, body, confirmText = "Confirmar", onConfirm }) {
  const node = document.createElement("div");
  node.className = "modal-backdrop";
  node.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${title}</h2><p class="muted">${body}</p><div class="toolbar"><button class="btn" data-confirm>${confirmText}</button><button class="btn ghost" data-close>Cancelar</button></div></div>`;
  node.querySelector("[data-close]").addEventListener("click", () => node.remove());
  node.querySelector("[data-confirm]").addEventListener("click", async () => { await onConfirm?.(); node.remove(); });
  document.body.appendChild(node);
  translateElement(node);
}

export function openModal({ title, content, footer = "" }) {
  const node = document.createElement("div");
  node.className = "modal-backdrop";
  node.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="section-title"><h2>${title}</h2><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>${content}<div class="modal-footer">${footer}</div></div>`;
  node.querySelector("[data-close]").addEventListener("click", () => node.remove());
  document.body.appendChild(node);
  translateElement(node);
  return node;
}
