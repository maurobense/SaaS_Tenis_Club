import { sidebar, mobileNav } from "../components/sidebar.js?v=2026050124";
import { navbar } from "../components/navbar.js?v=2026050128";
import { auth } from "../auth.js?v=2026050125";

export function layout(content, hash) {
  const user = auth.user();
  return `<div class="app-shell">${sidebar(hash, user)}<main class="main">${navbar()}${content}</main>${mobileNav(hash, user)}</div>`;
}
