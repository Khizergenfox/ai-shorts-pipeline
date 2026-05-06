/**
 * Shared layout — sidebar + main content well.
 * Every page calls layout({ active, title, body, ...counts }).
 */

import { esc } from '../lib/helpers.mjs';

const NAV = [
  { id: 'today', href: '/today', label: 'Today', glyph: '●' },
  { id: 'queue', href: '/queue', label: 'Queue', glyph: '▢' },
  { id: 'uploaded', href: '/uploaded', label: 'Uploaded', glyph: '✓' },
  { id: 'calendar', href: '/calendar', label: 'Calendar', glyph: '▦' },
  { id: 'roadmap', href: '/roadmap', label: 'Roadmap', glyph: '◈' },
  { id: 'performance', href: '/performance', label: 'Performance', glyph: '▲' },
  { id: 'ideas', href: '/ideas', label: 'Ideas', glyph: '✦' },
  { id: 'hooks', href: '/hooks', label: 'Hooks', glyph: '⚡' },
  { id: 'playbook', href: '/playbook', label: 'Playbook', glyph: '★' },
];

export function layout({ active, title, body, counts = {}, flash = null }) {
  const navHtml = NAV.map((n) => {
    const isActive = n.id === active;
    const badge = counts[n.id] ? `<span class="nav-badge show">${counts[n.id]}</span>` : '';
    return `
      <a href="${n.href}" class="nav-item${isActive ? ' active' : ''}">
        <span class="nav-icon">${n.glyph}</span>
        <span>${esc(n.label)}</span>
        ${badge}
      </a>
    `;
  }).join('');

  const flashHtml = flash
    ? `<div class="flash flash-${esc(flash.type || 'info')}">${esc(flash.message)}</div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — AI in Business HQ</title>
  <link rel="stylesheet" href="/styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <a href="/today" class="brand">
        <div class="brand-dot"></div>
        <div>
          <div class="brand-name">AI in Business</div>
          <div class="brand-sub">Marketing HQ</div>
        </div>
      </a>
      <nav class="nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <a href="/settings" class="hint">Settings</a>
      </div>
    </aside>
    <main class="main">
      ${flashHtml}
      ${body}
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
  <script src="/app.js" defer></script>
</body>
</html>`;
}
