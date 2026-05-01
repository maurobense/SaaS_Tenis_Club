import { translateElement } from "../preferences.js?v=2026050124";

export function confirmModal({ title, body, confirmText = "Confirmar", onConfirm }) {
  document.dispatchEvent(new CustomEvent("modal:open"));
  const node = document.createElement("div");
  node.className = "modal-backdrop";
  node.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${title}</h2><p class="muted">${body}</p><div class="toolbar"><button class="btn" data-confirm>${confirmText}</button><button class="btn ghost" data-close>Cancelar</button></div></div>`;
  node.querySelector("[data-close]").addEventListener("click", () => closeModalNode(node));
  node.querySelector("[data-confirm]").addEventListener("click", async () => { await onConfirm?.(); closeModalNode(node); });
  document.body.appendChild(node);
  document.body.classList.add("modal-open");
  translateElement(node);
}

export function openModal({ title, content, footer = "" }) {
  document.dispatchEvent(new CustomEvent("modal:open"));
  const node = document.createElement("div");
  node.className = "modal-backdrop";
  node.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="section-title"><h2>${title}</h2><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>${content}<div class="modal-footer">${footer}</div></div>`;
  node.querySelector("[data-close]").addEventListener("click", () => closeModalNode(node));
  document.body.appendChild(node);
  document.body.classList.add("modal-open");
  translateElement(node);
  return node;
}

function closeModalNode(node) {
  node.remove();
  if (!document.querySelector(".modal-backdrop")) {
    document.body.classList.remove("modal-open");
  }
}
