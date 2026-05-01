import { translateLiteral } from "../preferences.js?v=2026050124";

export function toast(message, type = "info") {
  const root = document.querySelector("#toast-root");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = translateLiteral(message);
  root.appendChild(item);
  setTimeout(() => item.remove(), 3800);
}
