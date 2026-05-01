export function table(headers, rows) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}
